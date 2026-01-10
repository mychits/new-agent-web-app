import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";
import url from "../constants/baseUrl";

const LoanPayin = ({ route, navigation }) => {
  const { user, customer, loan_id, custom_loan_id } = route.params;
  const [currentDate, setCurrentDate] = useState("");
  const [receipt, setReceipt] = useState({});
  const [paymentDetails, setPaymentDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [customerInfo, setCustomerInfo] = useState({});
  const [loanData, setLoanData] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [agent, setAgent] = useState([]);
  const [singleLoanMode, setSingleLoanMode] = useState(false);

  useEffect(() => {
    const fetchCustomerAndLoan = async () => {
      setIsDataLoading(true);
      try {
        const response = await axios.get(
          `${baseUrl}/loans/get-borrower/${loan_id}`
        );

        if (response.data && response.data.borrower) {
          setCustomerInfo(response.data.borrower);
          const loans = [response.data];
          setLoanData(loans);

          if (loans.length === 1) {
            setSelectedLoan(loans[0]);
            setSingleLoanMode(true);
          } else {
            setSingleLoanMode(false);
          }
        } else {
          setLoanData([]);
          setSingleLoanMode(false);
        }
      } catch (error) {
        Alert.alert("Error", "Could not load customer or loan details.");
        setLoanData([]);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchCustomerAndLoan();
  }, [customer, loan_id]);

  useEffect(() => {
    const today = moment().format("DD-MM-YYYY");
    setCurrentDate(today);
  }, []);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await axios.get(`${baseUrl}/payment/get-latest-receipt`);
        setReceipt(response.data);
      } catch (error) {
        console.error("Error fetching latest receipt data:", error);
      }
    };
    fetchReceipt();
  }, []);

  const handlePaymentTypeChange = (type) => {
    setPaymentDetails(type);
    if (type === "online") {
      setAdditionalInfo("Transaction ID");
      setTransactionId("");
    } else if (type === "cheque") {
      setAdditionalInfo("Cheque Number");
      setTransactionId("");
    } else {
      setAdditionalInfo("");
      setTransactionId("");
    }
  };

  /**
   * Updated logic to prevent starting with 0, negative values, and decimals
   */
  const handleAmountChange = (value) => {
    // 1. Remove all non-numeric characters
    let numericValue = value.replace(/[^0-9]/g, "");

    // 2. Prevent leading zero: if the string starts with '0', remove it
    if (numericValue.startsWith("0")) {
      numericValue = numericValue.substring(1);
    }

    setAmount(numericValue);
  };

  const handleAddPayment = async () => {
    setIsLoading(true);
    try {
      if (!selectedLoan || !paymentDetails || !amount || (paymentDetails !== "cash" && !transactionId)) {
        Alert.alert("Validation Error", "Please fill all mandatory fields.");
        setIsLoading(false);
        return;
      }

      const data = {
        user_id: customer,
        pay_date: new Date().toISOString().split("T")[0],
        amount: amount,
        pay_type: paymentDetails,
        ...(paymentDetails !== "cash" && { transaction_id: transactionId }),
        collected_by: user?.userId,
        pay_for: "Loan",
      };

      const loanId = selectedLoan?._id;
      const response = await axios.post(`${url}/payment/loan/${loanId}`, data);

      if (response.status === 201) {
        Alert.alert("Success", "Payment added successfully!");

        const userResponse = await axios.get(`${baseUrl}/user/get-user-by-id/${customer}`);
        const { full_name, phone_number } = userResponse.data;
        const { pay_date, amount, pay_type, transaction_id, receipt_no } = response.data?.response;
        
        const agentResponse = await axios.get(`${baseUrl}/agent/get-agent-by-id/${user.userId}`);
        const { name } = agentResponse.data;
        
        const totalAmountResponse = await axios.post(`${baseUrl}/payment/get-total-amount`, { 
          user_id: customer, 
          loan: loanId 
        });

        navigation.navigate("LoanPrint", {
          customer_name: full_name,
          cus_id: customer,
          phone_number,
          agent_name: name,
          amount,
          pay_type,
          pay_date,
          transaction_id,
          receipt_no,
          total_amount: totalAmountResponse?.data?.totalAmount || 0,
          custom_loan_id: selectedLoan?.loan_id,
          loanAmount: selectedLoan?.loan_amount,
          isLoanPayment: true,
          actual_loan_id: selectedLoan?._id,
        });
      } else {
        Alert.alert("Payment Error", response.data?.message || "An unexpected error occurred.");
      }
    } catch (error) {
      Alert.alert("Error", "Error adding payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoanSelection = () => {
    if (singleLoanMode && selectedLoan) {
      return (
        <TextInput
          style={styles.textInput}
          value={`ID: ${selectedLoan.loan_id} | Amount: ${selectedLoan.loan_amount}`}
          editable={false}
        />
      );
    }
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLoan}
          onValueChange={(itemValue) => setSelectedLoan(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Loan" value={null} />
          {loanData.map((loan, index) => (
            <Picker.Item
              key={index}
              label={`ID: ${loan.loan_id} | Amount: ${loan.loan_amount}`}
              value={loan}
            />
          ))}
        </Picker>
      </View>
    );
  };

  const renderContent = () => {
    if (isDataLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (!customerInfo.full_name || loanData.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No open loans found for this customer.</Text>
          <Button title="Go Back" filled onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
        </View>
      );
    }

    return (
      <View style={styles.formBox}>
        <Text style={styles.label}>Name<Text style={styles.star}>*</Text></Text>
        <TextInput
          style={styles.textInput}
          value={customerInfo.full_name}
          editable={false}
        />

        <Text style={styles.label}>Loan ID & Amount<Text style={styles.star}>*</Text></Text>
        {renderLoanSelection()}

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Date<Text style={styles.star}>*</Text></Text>
            <TextInput style={styles.textInput} value={currentDate} editable={false} />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Receipt<Text style={styles.star}>*</Text></Text>
            <TextInput
              style={styles.textInput}
              value={receipt.receipt_no ? String(receipt.receipt_no) : ""}
              editable={false}
            />
          </View>
        </View>

        <Text style={styles.label}>Payment Type<Text style={styles.star}>*</Text></Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={paymentDetails}
            onValueChange={(itemValues) => handlePaymentTypeChange(itemValues)}
            style={styles.picker}
          >
            <Picker.Item label="Select" value="" />
            <Picker.Item label="Cash" value="cash" />
            <Picker.Item label="Online" value="online" />
            <Picker.Item label="Cheque" value="cheque" />
          </Picker>
        </View>

        <Text style={styles.label}>Amount<Text style={styles.star}>*</Text></Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter The Amount"
          keyboardType="number-pad"
          value={amount}
          onChangeText={handleAmountChange}
        />

        {additionalInfo !== "" && (
          <>
            <Text style={styles.label}>{additionalInfo}<Text style={styles.star}>*</Text></Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Enter ${additionalInfo}`}
              value={transactionId}
              onChangeText={(value) => setTransactionId(value)}
            />
          </>
        )}

        <Button
          title={isLoading ? "Please wait..." : "Add Payment"}
          filled
          disabled={isLoading || !selectedLoan}
          style={styles.button}
          onPress={handleAddPayment}
        />
      </View>
    );
  };

  return (
    <LinearGradient colors={["#1aa2ccff", "#1aa2ccff"]} style={styles.gradientOverlay}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.fixedHeaderContainer}>
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add Loan Payment</Text>
          </View>
        </View>
        <ScrollView style={styles.scrollableContent}>
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: { flex: 1 },
  fixedHeaderContainer: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    backgroundColor: 'transparent',
  },
  scrollableContent: { flex: 1, paddingHorizontal: 22 },
  titleContainer: { marginTop: 10, marginBottom: 20, alignItems: "center" },
  title: { fontSize: 32, fontWeight: "bold", color: "#333" },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  errorText: { marginTop: 10, fontSize: 18, color: 'red', fontWeight: 'bold', textAlign: 'center' },
  formBox: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 50,
    elevation: 5,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  column: { flex: 1, marginHorizontal: 3 },
  textInput: {
    height: 55,
    width: "100%",
    borderColor: "#d0d0d0",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginVertical: 10,
    backgroundColor: COLORS.white,
  },
  pickerContainer: {
    borderColor: "#d0d0d0",
    borderWidth: 1,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    marginTop: 10,
    overflow: 'hidden',
  },
  picker: { width: "100%", height: 55 },
  label: { fontWeight: "bold", marginTop: 10 },
  star: { color: "#ff0000" },
  button: { marginTop: 18, backgroundColor: "#f8c009ff" },
});

export default LoanPayin;