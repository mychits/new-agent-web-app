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
  Dimensions,
  Animated,
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

const { width } = Dimensions.get("window");

const LoanPayin = ({ route, navigation }) => {
  const { user, customer, loan_id, custom_loan_id } = route.params;
  
  // State for Data
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
  const [singleLoanMode, setSingleLoanMode] = useState(false);
  
  // State for Loan Overview
  const [loanOverview, setLoanOverview] = useState(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);

  // Animation States
  const [anim1] = useState(new Animated.Value(0));
  const [anim2] = useState(new Animated.Value(0));
  const [anim3] = useState(new Animated.Value(0));

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

  // Fetch Loan Overview
  useEffect(() => {
    const fetchLoanOverview = async () => {
      if (selectedLoan?._id) {
        setIsOverviewLoading(true);
        try {
          const response = await axios.get(`${baseUrl}/loans/overview/${selectedLoan._id}`);
          if (response.data && response.data.data) {
            setLoanOverview(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching loan overview:", error);
        } finally {
          setIsOverviewLoading(false);
        }
      }
    };

    if (selectedLoan) {
      fetchLoanOverview();
    } else {
      setLoanOverview(null);
    }
  }, [selectedLoan]);

  // Trigger animations when overview data changes
  useEffect(() => {
    if (loanOverview) {
      Animated.timing(anim1, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 0,
      }).start();

      Animated.timing(anim2, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 100, 
      }).start();

      Animated.timing(anim3, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 200, 
      }).start();
    }
  }, [loanOverview]);

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

  const handleAmountChange = (value) => {
    let numericValue = value.replace(/[^0-9]/g, "");
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
        <View style={styles.inputContainer}>
           <Text style={styles.fakeInputText}>{`ID: ${selectedLoan.loan_id} | Amount: ${selectedLoan.loan_amount}`}</Text>
        </View>
      );
    }
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLoan}
          onValueChange={(itemValue) => setSelectedLoan(itemValue)}
          style={styles.picker}
          dropdownIconColor="#111827"
        >
          <Picker.Item label="Select Loan" value={null} color="#1F2937" />
          {loanData.map((loan, index) => (
            <Picker.Item
              key={index}
              label={`ID: ${loan.loan_id} | Amount: ${loan.loan_amount}`}
              value={loan}
              color="#1F2937"
            />
          ))}
        </Picker>
      </View>
    );
  };

  // Helper for animated PREMIUM box
  const renderAnimatedBox = (title, value, anim, colorStart, colorEnd) => {
    return (
      <Animated.View
        style={[
          styles.overviewBox,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[colorStart, colorEnd]}
          style={styles.boxGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Glass Shine Effect */}
          <View style={styles.glassShine} />
          
          <Text style={styles.boxTitle}>{title}</Text>
          <Text style={styles.boxValue} numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderContent = () => {
    if (isDataLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (!customerInfo.full_name || loanData.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No open loans found for this customer.</Text>
          <Button title="Go Back" filled onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
        </View>
      );
    }

    return (
      <View style={{ paddingBottom: 20 }}>
        
        {/* --- PREMIUM 3 BOXES --- */}
        {isOverviewLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : loanOverview ? (
          <View style={styles.overviewContainer}>
            {/* Box 1: Loan ID - Royal Blue */}
            {renderAnimatedBox(
              "Loan ID", 
              loanOverview.loan_id || "--", 
              anim1, 
              "#30cfd0", // Start
              "#330867"  // End (Deep Purple/Blue)
            )}
            
            {/* Box 2: Total Amount - Emerald/Teal */}
            {renderAnimatedBox(
              "Total Loan Amount", 
              loanOverview.loan_amount || "0", 
              anim2, 
              "#15ec5d", 
              "#0b7663"
            )}

            {/* Box 3: Remaining Loan - Sunset */}
            {renderAnimatedBox(
              "Remaining Loan Amount ", 
              loanOverview.remaining_loan || "0", 
              anim3, 
              "#fa709a", 
              "#fee140"
            )}
          </View>
        ) : null}

        {/* --- FORM CARD --- */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Borrower Name</Text>
            <View style={styles.inputContainer}>
                <Text style={styles.fakeInputText}>{customerInfo.full_name}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Loan</Text>
            {renderLoanSelection()}
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Date</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.fakeInputText}>{currentDate}</Text>
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Receipt No.</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.fakeInputText}>{receipt.receipt_no ? String(receipt.receipt_no) : "--"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            {/* FIXED: Picker now looks like a standard Input Field */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={paymentDetails}
                onValueChange={(itemValues) => handlePaymentTypeChange(itemValues)}
                style={styles.picker}
                dropdownIconColor="#111827"
              >
                <Picker.Item label="Select Method" value="" color="#1F2937" />
                <Picker.Item label="Cash" value="cash" color="#1F2937" />
                <Picker.Item label="Online" value="online" color="#1F2937" />
                <Picker.Item label="Cheque" value="cheque" color="#1F2937" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>

          {additionalInfo !== "" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{additionalInfo}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={`Enter ${additionalInfo}`}
                placeholderTextColor="#9CA3AF"
                value={transactionId}
                onChangeText={(value) => setTransactionId(value)}
                autoCapitalize="characters"
              />
            </View>
          )}

          <Button
            title={isLoading ? "Processing..." : "Add Payment"}
            filled
            disabled={isLoading || !selectedLoan}
            style={styles.stylishButton}
            textStyle={styles.buttonText}
            onPress={handleAddPayment}
          />
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#24C6DC', '#183A5D']} style={styles.gradientOverlay}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.headerContainer}>
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add Loan Payment</Text>
            <Text style={styles.subtitle}>Enter payment details to record a transaction.</Text>
          </View>
        </View>
        <ScrollView 
          style={styles.scrollableContent} 
          contentContainerStyle={{ paddingVertical: 5 }}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: { flex: 1 },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 10, 
    backgroundColor: 'transparent',
  },
  titleContainer: { marginTop: 15 },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: "#fff", 
    letterSpacing: 0.5 ,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: "#E0F7FA", 
    marginTop: 4,
    letterSpacing: 0.3,
       textAlign: 'center',
  },
  
  scrollableContent: { flex: 1, paddingHorizontal: 20 },
  
  // Card Styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, 
    shadowRadius: 12,
    elevation: 5,
  },
  
  // --- PREMIUM BOX STYLES ---
  overviewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  overviewBox: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 20, 
    height: 110,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  boxGradient: {
    flex: 1,
    padding: 15,
    justifyContent: "space-between", // Space out title and value
  },
  glassShine: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 40,
  },
  boxTitle: {
    fontSize: 10, 
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  boxValue: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
    textAlign: "left", // Align left for card feel
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // ----------------------------------

  // Form Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: "#111827",
    marginBottom: 16,
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 14, 
  },
  label: {
    fontSize: 12, 
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 2,
  },
  textInput: {
    height: 52, // slightly taller
    backgroundColor: "#F9FAFB",
    borderRadius: 12, 
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB", 
  },
  inputContainer: {
    height: 52,
    backgroundColor: "#F3F4F6", 
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  fakeInputText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  // --- PICKER STYLES (MATCH INPUTS) ---
  pickerContainer: {
    height: 52,
    backgroundColor: "#FFFFFF", 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    overflow: 'hidden',
  },
  picker: { 
    width: "100%", 
    height: 52, 
    color: "#111827", 
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    marginLeft: -4, // Adjust alignment if needed
  },
  // -----------------------------

  stylishButton: {
    marginTop: 10,
    height: 52, 
    borderRadius: 14,
    backgroundColor: "#111827", // Dark button for contrast
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  errorText: { marginTop: 10, fontSize: 15, color: '#fff', fontWeight: '600', textAlign: 'center' },
});

export default LoanPayin;