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
  Modal,
  TouchableOpacity,
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
import { MaterialIcons } from "@expo/vector-icons"; 

const { width } = Dimensions.get("window");

// Gradients
const TOP_GRADIENT = ['#24C6DC', '#183A5D'];
const ERROR_GRADIENT = ['#FF512F', '#DD2476']; // Red/Orange for errors
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#ffffff"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb"; 
const PRIMARY_BUTTON_COLOR = "#f8c009ff"; 

const LoanPayin = ({ route, navigation }) => {
  const { user, customer, loan_id, custom_loan_id } = route.params;
  
  // State for Data
  const [currentDate, setCurrentDate] = useState(moment().format("DD-MM-YYYY"));
  const [receipt, setReceipt] = useState({});
  const [paymentDetails, setPaymentDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // State for Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false); // NEW: Error Modal State
  const [errorMessage, setErrorMessage] = useState(""); // NEW: Error Message State

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

  // --- Updated Validation Logic ---
  const validateAndShowModal = () => {
    // Basic field validation
    if (!selectedLoan || !paymentDetails || !amount || (paymentDetails !== "cash" && !transactionId)) {
      setErrorMessage("Please fill all mandatory fields.");
      setShowErrorModal(true);
      return;
    }

    // Condition 1: Check for single digit amount
    if (amount.length === 1) {
      setErrorMessage("Amount cannot be a single digit.");
      setShowErrorModal(true);
      return;
    }

    // Additional check: Ensure Transaction ID is present for online payments
    if (paymentDetails === "online" && !transactionId.trim()) {
      setErrorMessage("Please enter a valid Transaction ID.");
      setShowErrorModal(true);
      return;
    }

    // If all checks pass
    setShowConfirmModal(true);
  };

  const executePayment = async () => {
    setShowConfirmModal(false); // Close modal
    setIsLoading(true);
    try {
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
          itemStyle={styles.pickerItem}
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
              "#30cfd0", 
              "#330867"
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
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={paymentDetails}
                onValueChange={(itemValues) => handlePaymentTypeChange(itemValues)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
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
            onPress={validateAndShowModal}
          />
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={TOP_GRADIENT} style={styles.gradientOverlay}>
      
      {/* Stylish Error Modal */}
      <Modal animationType="fade" transparent={true} visible={showErrorModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.stylishModalCard}>
            {/* Error Gradient Header */}
            <LinearGradient colors={ERROR_GRADIENT} style={styles.errorHeader}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="error-outline" size={40} color={CARD_BG} />
              </View>
              <Text style={styles.errorTitle}>Validation Error</Text>
            </LinearGradient>

            {/* Error Body */}
            <View style={[styles.stylishBody, { alignItems: 'center', paddingTop: 30 }]}>
               <MaterialIcons name="info" size={24} color={ERROR_GRADIENT[0]} style={{marginBottom: 10}} />
               <Text style={styles.errorMessageText}>{errorMessage}</Text>
            </View>

            {/* Error Footer */}
            <View style={styles.stylishFooter}>
              <TouchableOpacity 
                onPress={() => setShowErrorModal(false)} 
                style={[styles.stylishCancelButton, { flex: 1, backgroundColor: '#fee2e2', marginLeft: 0, marginRight: 0 }]}
              >
                <Text style={[styles.stylishCancelText, { color: ERROR_GRADIENT[0] }]}>OKAY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stylish Confirmation Modal */}
      <Modal animationType="fade" transparent={true} visible={showConfirmModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.stylishModalCard}>
            {/* Gradient Header */}
            <LinearGradient colors={TOP_GRADIENT} style={styles.stylishHeader}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="check-circle" size={32} color={CARD_BG} />
              </View>
              <Text style={styles.stylishHeaderTitle}>Confirm Payment</Text>
              <Text style={styles.stylishHeaderSubtitle}>Please verify the details</Text>
            </LinearGradient>

            {/* Receipt Body */}
            <View style={styles.stylishBody}>
              <View style={styles.stylishRow}>
                <Text style={styles.stylishLabel}>Borrower</Text>
                <Text style={styles.stylishValue}>{customerInfo.full_name}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.stylishRow}>
                <Text style={styles.stylishLabel}>Loan ID</Text>
                <Text style={styles.stylishValue}>{selectedLoan?.loan_id}</Text>
              </View>

              <View style={styles.stylishRow}>
                <Text style={styles.stylishLabel}>Date</Text>
                <Text style={styles.stylishValue}>{currentDate}</Text>
              </View>

              <View style={styles.stylishRow}>
                <Text style={styles.stylishLabel}>Method</Text>
                <View style={styles.methodBadge}>
                  <Text style={styles.methodText}>{paymentDetails.toUpperCase()}</Text>
                </View>
              </View>

              {/* Condition 2: Show Transaction ID if payment is online */}
              {paymentDetails === "online" && (
                <View style={styles.stylishRow}>
                  <Text style={styles.stylishLabel}>Trans. ID</Text>
                  <Text style={[styles.stylishValue]}>{transactionId}</Text>
                </View>
              )}

              {/* Total Amount Box */}
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>₹ {amount}</Text>
              </View>
            </View>

            {/* Footer Buttons */}
            <View style={styles.stylishFooter}>
              <TouchableOpacity 
                onPress={() => setShowConfirmModal(false)} 
                style={styles.stylishCancelButton}
              >
                <Text style={styles.stylishCancelText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={executePayment} 
                style={styles.stylishConfirmButton}
              >
                 {isLoading ? (
                   <ActivityIndicator size="small" color={MODERN_PRIMARY} />
                ) : (
                   <Text style={styles.stylishConfirmText}>CONFIRM</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingBottom: 8, 
    backgroundColor: 'transparent',
  },
  titleContainer: { marginTop: 10 },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: "#fff", 
    letterSpacing: 0.5 ,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
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
    padding: 15, 
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
    marginBottom: 15,
  },
  overviewBox: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20, 
    height: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  boxGradient: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between", 
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
    fontSize: 9, 
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  boxValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "800",
    textAlign: "left", 
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
    marginBottom: 12,
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 10, 
  },
  label: {
    fontSize: 12, // UPDATED TO 12
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 4,
    marginLeft: 2,
  },
  textInput: {
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 10, 
    paddingHorizontal: 12,
    fontSize: 14, // KEPT AT 14
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB", 
    marginVertical: 3,
  },
  inputContainer: {
    paddingVertical: 12,
    backgroundColor: "#F3F4F6", 
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: 3,
  },
  fakeInputText: {
    fontSize: 14, // KEPT AT 14
    color: "#374151",
    fontWeight: "600",
  },
  
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  pickerContainer: {
    height: 48,
    backgroundColor: "#FFFFFF", 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    overflow: 'hidden',
    marginVertical: 3,
  },
  picker: { 
    width: "100%", 
    backgroundColor: 'transparent',
    fontSize: 14, // ADDED FOR SIZE
    color: MODERN_PRIMARY,
  },
  pickerItem: {
    fontSize: 14, // ADDED FOR OPTIONS SIZE
  },
  
  stylishButton: {
    marginTop: 10,
    height: 52, 
    borderRadius: 14,
    backgroundColor: "#f8c009ff", 
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

  // --- Stylish Modal Styles ---
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)" },
  stylishModalCard: {
    width: '85%',
    backgroundColor: CARD_BG,
    borderRadius: 24,
    overflow: 'hidden', 
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  stylishHeader: {
    paddingTop: 24,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  // Error Header Specifics
  errorHeader: {
    paddingTop: 24,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: CARD_BG,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  errorMessageText: {
    fontSize: 16,
    color: TEXT_GREY,
    textAlign: 'center',
    lineHeight: 24,
  },

  iconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 10,
    marginBottom: 10,
  },
  stylishHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: CARD_BG,
    letterSpacing: 0.5,
  },
  stylishHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  stylishBody: {
    padding: 24,
  },
  stylishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stylishLabel: {
    fontSize: 12, // UPDATED TO 12
    color: TEXT_GREY,
    fontWeight: '500',
  },
  stylishValue: {
    fontSize: 14, // UPDATED TO 14
    color: MODERN_PRIMARY,
    fontWeight: '700',
  },
  methodBadge: {
    backgroundColor: SUBTLE_BG_GREY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR
  },
  methodText: {
    fontSize: 14, // UPDATED TO 14
    color: ACCENT_BLUE,
    fontWeight: '700',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
    marginBottom: 16,
  },
  totalBox: {
    backgroundColor: 'rgba(23, 150, 209, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(23, 150, 209, 0.2)',
  },
  totalLabel: {
    fontSize: 14,
    color: ACCENT_BLUE,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 28,
    color: MODERN_PRIMARY,
    fontWeight: '900',
    marginTop: 4,
  },
  stylishFooter: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stylishCancelButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: SUBTLE_BG_GREY,
  },
  stylishCancelText: {
    color: TEXT_GREY,
    fontWeight: '700',
    fontSize: 15,
  },
  stylishConfirmButton: {
    flex: 1.5,
    paddingVertical: 14,
    marginLeft: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: PRIMARY_BUTTON_COLOR,
    shadowColor: "#f8c009ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stylishConfirmText: {
    color: MODERN_PRIMARY,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  }
});

export default LoanPayin;