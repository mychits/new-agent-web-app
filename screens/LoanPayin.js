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
  TouchableOpacity, // Added for potential future use (like date picker)
} from "react-native";

import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context"; // Use SafeAreaView for better layout

import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";
// Removed unused 'url' import as baseUrl is defined globally

// --- DESIGN CONSTANTS COPIED FROM Payin.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"];
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for icons/left border/primary color)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb"; // Very light background for content area
const PRIMARY_BUTTON_COLOR = "#f8c009ff"; // Assuming the yellow color for main action
// ---------------------------------------------


const LoanPayin = ({ route, navigation }) => {
  const { user, customer, loan_id, custom_loan_id } = route.params;
  const [currentDate, setCurrentDate] = useState("");
  const [receipt, setReceipt] = useState({});
  const [paymentDetails, setPaymentDetails] = useState("cash"); // Set default to 'cash'
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  // Loading state for the payment submission button
  const [isLoading, setIsLoading] = useState(false);
  // Loading state for the initial customer/loan data fetch
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [customerInfo, setCustomerInfo] = useState({});
  const [loanData, setLoanData] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [agent, setAgent] = useState([]);
  const [singleLoanMode, setSingleLoanMode] = useState(false);

  useEffect(() => {
    const fetchCustomerAndLoan = async () => {
      setIsDataLoading(true); // Start loading

      try {
        // Fetch loan data
        const response = await axios.get(
          `${baseUrl}/loans/get-borrower/${loan_id}`
        );

        if (response.data && response.data.borrower) {
          setCustomerInfo(response.data.borrower);

          const loans = [response.data]; // Use [response.data] as per current structure
          setLoanData(loans);

          if (loans.length === 1) {
            setSelectedLoan(loans[0]);
            setSingleLoanMode(true);
          } else {
            setSingleLoanMode(false);
          }
        } else {
          console.error("Unexpected API response format or no borrower data:", response.data);
          setLoanData([]);
          setSingleLoanMode(false);
        }

        // Fetch customer info separately if loan_id only provides loan data
        // NOTE: The current structure assumes response.data.borrower has customer info
        // but adding an extra check for robustness if needed in a real app:
        // if (customer) {
        //   const customerResponse = await axios.get(`${baseUrl}/user/get-user-by-id/${customer}`);
        //   if (customerResponse.data) {
        //     setCustomerInfo(customerResponse.data);
        //   }
        // }


      } catch (error) {
        console.error("Error fetching customer data:", error);
        Alert.alert("Error", "Could not load customer or loan details.");
        setLoanData([]);
        setSingleLoanMode(false);
      } finally {
        setIsDataLoading(false); // Stop loading
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
        const response = await axios.get(
          `${baseUrl}/payment/get-latest-receipt`
        );

        setReceipt(response.data);
      } catch (error) {
        console.error("Error fetching latest receipt data:", error);
      }
    };
    fetchReceipt();
  }, []);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/agent/get-agent-by-id/${user.userId}`
        );
        if (response.data) {
          setAgent(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };

    fetchAgent();
  }, [user.userId]);

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

  const handleAddPayment = async () => {
    setIsLoading(true);
    try {
      if (
        !selectedLoan ||
        !paymentDetails ||
        !amount ||
        (paymentDetails !== "cash" && !transactionId)
      ) {
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
      // Using 'baseUrl' which is the same as 'url' in the original file
      const response = await axios.post(`${baseUrl}/payment/loan/${loanId}`, data);

      if (response.status === 201) {
        Alert.alert("Success", "Payment added successfully!");

        // --- Data Fetch for Receipt/Print ---
        const userResponse = await axios.get(
          `${baseUrl}/user/get-user-by-id/${customer}`
        );
        const { full_name, phone_number } = userResponse.data;
        const { pay_date, amount: paid_amount, pay_type, transaction_id, receipt_no } =
          response.data?.response;
        const agentResponse = await axios.get(
          `${baseUrl}/agent/get-agent-by-id/${user.userId}`
        );
        const { name } = agentResponse.data;
        const totalAmountResponse = await axios.post(
          `${baseUrl}/payment/get-total-amount`,
          { user_id: customer, loan: loanId }
        );

        navigation.navigate("LoanPrint", {
          customer_name: full_name,
          cus_id:customer,
          phone_number,
          agent_name: name,
          amount: paid_amount,
          pay_type,
          pay_date,
          transaction_id,
          receipt_no,
          total_amount: totalAmountResponse?.data?.totalAmount || 0,
          custom_loan_id: selectedLoan?.loan_id,
          loanAmount: selectedLoan?.loan_amount,
          isLoanPayment: true,
          actual_loan_id:selectedLoan?._id,
        });
      } else {
        
        Alert.alert("Payment Error", response.data?.message || "An unexpected error occurred during payment.");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      Alert.alert("Error", "Error adding payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoanSelection = () => {
    // If only one loan is found, display it in a read-only TextInput
    if (singleLoanMode && selectedLoan) {
      return (
        <TextInput
          style={styles.textInput}
          value={`ID: ${selectedLoan.loan_id} | Amount: ${selectedLoan.loan_amount}`}
          editable={false}
          placeholderTextColor={TEXT_GREY}
        />
      );
    }

    // If zero or multiple loans, display the Picker
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLoan}
          onValueChange={(itemValue) => setSelectedLoan(itemValue)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Select Loan" value={null} color={TEXT_GREY} />
          {loanData.map((loan, index) => (
            <Picker.Item
              key={index}
              label={`ID: ${loan.loan_id} | Amount: ${loan.loan_amount}`}
              value={loan}
              color={MODERN_PRIMARY}
            />
          ))}
        </Picker>
      </View>
    );
  };

  const renderContent = () => {
    // If no loans were found and we've finished loading, show an error state or an empty message
    if (!customerInfo.full_name || loanData.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No open loans found for this customer.</Text>
          <Button
            title="Go Back"
            filled
            onPress={() => navigation.goBack()}
            style={styles.goBackButton}
          />
        </View>
      );
    }

    // Otherwise, render the form fields within a ScrollView content style
    return (
      <View style={styles.formBox}>
        <Text style={styles.label}>
          Name<Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter The Name"
          keyboardType="default"
          value={customerInfo.full_name}
          editable={false}
          placeholderTextColor={TEXT_GREY}
        />
        <Text style={styles.label}>
          Loan ID & Amount<Text style={styles.star}>*</Text>
        </Text>
        {renderLoanSelection()}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>
              Date<Text style={styles.star}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Select Date"
              keyboardType="default"
              value={currentDate}
              editable={false}
              placeholderTextColor={TEXT_GREY}
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>
              Receipt<Text style={styles.star}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Select Receipt"
              keyboardType="numeric"
              value={receipt.receipt_no !== undefined && receipt.receipt_no !== null ? String(receipt.receipt_no) : ""}
              editable={false}
              placeholderTextColor={TEXT_GREY}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>
              Payment Type<Text style={styles.star}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={paymentDetails}
                onValueChange={(itemValues) =>
                  handlePaymentTypeChange(itemValues)
                }
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Cash" value="cash" color={MODERN_PRIMARY} />
                <Picker.Item label="Online" value="online" color={MODERN_PRIMARY} />
                <Picker.Item label="Cheque" value="cheque" color={MODERN_PRIMARY} />
              </Picker>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>
              Amount<Text style={styles.star}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter The Amount"
              placeholderTextColor={TEXT_GREY}
              keyboardType="numeric"
              value={amount}
              onChangeText={(value) => setAmount(value)}
            />
          </View>
        </View>
        {additionalInfo !== "" && (
          <>
            <Text style={styles.label}>
              {additionalInfo}
              <Text style={styles.star}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Enter ${additionalInfo}`}
              placeholderTextColor={TEXT_GREY}
              keyboardType="default"
              value={transactionId}
              onChangeText={(value) => setTransactionId(value)}
            />
          </>
        )}
        <Button
          title={isLoading ? "Please wait..." : "Add Payment"}
          filled
          disabled={isLoading || !selectedLoan} // Disable button if form is loading or no loan is selected
          style={styles.button}
          onPress={handleAddPayment}
        />
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* =======================================================
         FIXED TOP SECTION (Gradient, Header, Title)
         =======================================================
      */}
      <LinearGradient
        colors={TOP_GRADIENT}
        style={styles.fixedHeaderArea} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
          <View style={styles.headerSpacer}>
              <Header />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add Loan Payment</Text>
            <Text style={styles.subtitle}>
              {customerInfo.full_name || 'Customer Details'}
            </Text>
          </View>
      </LinearGradient>


      {/* =======================================================
         SCROLLABLE CONTENT AREA (Form/Loading)
         =======================================================
      */}
      <KeyboardAvoidingView
        style={styles.scrollableContentWrapper} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.mainContentArea}>
          {isDataLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ACCENT_BLUE} />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderContent()}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- LAYOUT STYLES (Copied/Modified from Payin.js) ---
  safeArea: {
    flex: 1,
    backgroundColor: TOP_GRADIENT[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SUBTLE_BG_GREY,
    minHeight: 200, 
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  goBackButton: {
    marginTop: 20,
    backgroundColor: PRIMARY_BUTTON_COLOR,
  },
  
  fixedHeaderArea: { 
    paddingHorizontal: 16,
    paddingBottom: 20, 
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  scrollableContentWrapper: { 
      flex: 1,
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    marginTop: -20, 
    paddingTop: 30, 
  },
  headerSpacer: {
    paddingTop: 20,
    paddingBottom: 5,
  },

  // --- TITLE STYLES (Copied from Payin.js) ---
  titleContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: CARD_BG, // White text
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
    textAlign: "center",
  },
  
  // --- FORM CONTAINER (Copied/Modified from Payin.js) ---
  scrollContentContainer: {
    paddingBottom: 50,
    paddingTop: 10,
    flexGrow: 1,
  },
  formBox: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },

  // --- INPUT/PICKER STYLES (Copied/Modified from Payin.js) ---
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  column: {
    flex: 1,
    marginHorizontal: 3,
  },
  label: {
    fontWeight: "600",
    marginTop: 10,
    fontSize: 14,
    color: MODERN_PRIMARY,
  },
  star: {
    color: ACCENT_BLUE, // Use blue accent for *
  },
  textInput: {
    height: 50,
    width: "100%",
    borderColor: BORDER_COLOR,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginVertical: 8,
    color: MODERN_PRIMARY,
    backgroundColor: SUBTLE_BG_GREY, 
    fontSize: 16,
  },
  pickerContainer: {
    borderColor: BORDER_COLOR,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: SUBTLE_BG_GREY,
    marginVertical: 8,
    minHeight: 50,
    justifyContent: 'center',
    overflow: 'hidden', // Added to contain picker within rounded border
  },
  picker: {
    width: "100%",
    minHeight: 50,
    ...Platform.select({
      ios: {
        height: 50,
      },
      android: {
        height: 50,
        color: MODERN_PRIMARY,
      },
    }),
  },
  pickerItem: {
    color: MODERN_PRIMARY,
    fontSize: 16,
  },

  // --- BUTTON STYLES (Copied/Modified from Payin.js) ---
  button: {
    flex: 1, // Only one button, so it takes full width
    margin: 0,
    marginTop: 20,
    marginBottom: 0, 
    backgroundColor: PRIMARY_BUTTON_COLOR,
    height: 55,
    borderRadius: 12,
  },
});

export default LoanPayin;