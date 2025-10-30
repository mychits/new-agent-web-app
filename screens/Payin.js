import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { Buffer } from "buffer";
// import { SafeAreaView } from "react-native-safe-area-context"; // REMOVED
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";

import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";
import { AgentContext } from "../context/AgentContextProvider";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const Payin = ({ route, navigation }) => {
  const { user, customer } = route.params;
  const { modifyPayment } = useContext(AgentContext);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [receipt, setReceipt] = useState({});
  const [paymentDetails, setPaymentDetails] = useState("cash");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- NEW STATE FOR INITIAL LOADING ---
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [customerInfo, setCustomerInfo] = useState({});
  const [groups, setGroups] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTicket, setSelectedTicket] = useState("");
  const [allData, setAllData] = useState([]);
  const [url, setUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Use a ref or multiple state variables to track completion of individual fetches
  const [customerLoaded, setCustomerLoaded] = useState(false);
  const [enrollmentLoaded, setEnrollmentLoaded] = useState(false);
  const [receiptLoaded, setReceiptLoaded] = useState(false);

  // 1. Fetch customer details
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/user/get-user-by-id/${customer}`
        );
        if (response.data) {
          setCustomerInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setCustomerLoaded(true); // Mark customer data as loaded
      }
    };
    fetchCustomer();
  }, [customer]);

  // 2. Fetch enrollment details (groups and tickets) & Auto-Select Logic
  useEffect(() => {
    const fetchEnrollDetails = async () => {
      try {
        const response = await axios.post(
          `${baseUrl}/enroll/get-user-tickets/${customer}`
        );

        setAllData(response.data);

        // Extract unique groups
        const uniqueGroups = response.data
          .filter((group) => group.group_id !== null)
          .reduce((acc, group) => {
            if (
              !acc.some(
                (g) => g.group_id.group_name === group.group_id.group_name
              )
            ) {
              acc.push(group);
            }
            return acc;
          }, []);

        setGroups(uniqueGroups);

        // --- Auto-selection for Group ---
        if (uniqueGroups.length === 1) {
          const groupId = uniqueGroups[0].group_id._id;
          setSelectedGroup(groupId);

          // Automatically set tickets for the single group
          const groupTickets = response.data
            .filter((item) => item.group_id && item.group_id._id === groupId)
            .map((item) => item.tickets);
          setTickets(groupTickets);

          // Auto-select ticket if only one exists for the single group
          if (groupTickets.length === 1) {
            setSelectedTicket(groupTickets[0].toString());
          }
        }
      } catch (error) {
        console.error("Error fetching customer enrollment data:", error);
      } finally {
        setEnrollmentLoaded(true); // Mark enrollment data as loaded
      }
    };

    fetchEnrollDetails();
  }, [customer]);

  // 3. Fetch latest receipt
  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/payment/get-latest-receipt`
        );

        setReceipt(response.data);
      } catch (error) {
        console.error("Error fetching latest receipt:", error);
      } finally {
        setReceiptLoaded(true); // Mark receipt data as loaded
      }
    };
    fetchReceipt();
  }, []);

  // 4. Combined Loading Effect
  useEffect(() => {
    if (customerLoaded && enrollmentLoaded && receiptLoaded) {
      setIsInitialLoading(false);
    }
  }, [customerLoaded, enrollmentLoaded, receiptLoaded]);

  const handleDateChange = (event, selectedDate) => {
    const newDate = selectedDate || currentDate;
    setShowDatePicker(Platform.OS === "ios");
    setCurrentDate(newDate);
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    setSelectedTicket(""); // Reset ticket selection

    if (groupId) {
      const groupTickets = allData
        .filter((item) => item.group_id && item.group_id._id === groupId)
        .map((item) => item.tickets);
      setTickets(groupTickets);

      // --- Auto-selection for Ticket on Group Change ---
      if (groupTickets.length === 1) {
        setSelectedTicket(groupTickets[0].toString());
      }
    } else {
      setTickets([]);
    }
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentDetails(type);
    if (type === "online") {
      setAdditionalInfo("Transaction ID");
    } else if (type === "cheque") {
      setAdditionalInfo("Cheque Number");
    } else {
      setAdditionalInfo("");
    }
    setTransactionId("");
  };

  const handleAddPayment = async () => {
    if (
      !customerInfo.full_name ||
      !selectedGroup ||
      !selectedTicket ||
      !currentDate ||
      !(receipt.receipt_no || receipt.receipt_no === 0) ||
      !paymentDetails ||
      !amount ||
      (additionalInfo !== "" && !transactionId)
    ) {
      Alert.alert("Validation Error", "Please fill all mandatory fields.");
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        user_id: customer,
        group_id: selectedGroup,
        ticket: selectedTicket,
        pay_date: moment(currentDate).format("YYYY-MM-DD"),
        receipt_no:
          receipt.receipt_no === 0
            ? "0"
            : receipt.receipt_no
            ? String(receipt.receipt_no)
            : "",
        pay_type: paymentDetails,
        amount: amount,
        transaction_id: transactionId,
        collected_by: user.userId,
      };

      const response = await axios.post(`${baseUrl}/payment/add-payment`, data);

      if (response.status === 201) {
        Alert.alert("Success", "Payment added successfully!");
        navigation.navigate("Print", { store_id: response.data._id });
      } else {
        console.log(
          "Unexpected response status:",
          response.status,
          response.data
        );
        Alert.alert(
          "Payment Error",
          "An unexpected error occurred. Please try again."
        );
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      let errorMessage = "Error adding payment. Please try again.";
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        errorMessage =
          error.response.data.message ||
          JSON.stringify(error.response.data) ||
          errorMessage;
      } else if (error.request) {
        console.error("Error request:", error.request);
        errorMessage =
          "No response from server. Please check your network connection.";
      } else {
        console.error("Error message:", error.message);
        errorMessage = error.message;
      }
      Alert.alert("Payment Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQrCode = async () => {
    try {
      setQrLoading(true);
      const response = await axios.post(
        `${baseUrl}/qrcode?amount=${amount}`,
        {},
        { responseType: "arraybuffer" }
      );

      // --- QR CODE LOGIC ---
      const base64 = Buffer.from(response.data, "binary").toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;
      setUrl(dataUrl);
      // ---------------------

      setModalVisible(true);
    } catch (error) {
      console.error("Failed to generate qr code", error);
    } finally {
      setQrLoading(false);
    }
  };

  // --- Loading Screen Component ---
  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  // ---------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* --- QR CODE MODAL --- (Unchanged) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 20,
          }}
        >
          <View
            style={{
              width: 320,
              padding: 24,
              backgroundColor: "white",
              borderRadius: 16,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#222",
                marginBottom: 6,
              }}
            >
              MyChits Payment
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#666",
                marginBottom: 16,
              }}
            >
              Pay ₹{amount}
            </Text>

            <View
              style={{
                padding: 12,
                backgroundColor: "#f8f8f8",
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <Image
                source={{ uri: url }}
                style={{ width: 240, height: 240 }}
                resizeMode="contain"
              />
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                width: "100%",
                paddingVertical: 12,
                backgroundColor: "#EA5B6F",
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* --------------------------- */}

      <LinearGradient
        colors={['#b6e4ebff', '#1796d1ff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          {/* =======================================================
            NEW FIXED HEADER SECTION (Header and Title)
            =======================================================
          */}
          <View style={styles.fixedHeaderContainer}>
            <Header />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Add Payment</Text>
            </View>
          </View>
          {/* =======================================================
            SCROLLABLE CONTENT SECTION (Form)
            =======================================================
          */}
          <ScrollView
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
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
                />
                <Text style={styles.label}>
                  Group<Text style={styles.star}>*</Text>
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedGroup}
                    onValueChange={handleGroupChange}
                    style={styles.picker}
                    // Disable picker if only one group is available
                    enabled={groups.length > 1}
                  >
                    {/* Show 'Select Group' only if more than 1 group */}
                    {groups.length !== 1 && (
                      <Picker.Item label="Select Group" value="" />
                    )}
                    {groups.map((group, index) => (
                      <Picker.Item
                        key={index}
                        label={group.group_id.group_name}
                        value={group.group_id._id}
                      />
                    ))}
                  </Picker>
                </View>
                <Text style={styles.label}>
                  Ticket<Text style={styles.star}>*</Text>
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedTicket}
                    onValueChange={(itemValue) =>
                      setSelectedTicket(itemValue)
                    }
                    style={styles.picker}
                    // Disable picker if no group is selected or only one ticket is available
                    enabled={selectedGroup !== "" && tickets.length !== 1}
                  >
                    {/* Show 'Select Ticket' only if more than 1 ticket */}
                    {tickets.length !== 1 && (
                      <Picker.Item label="Select Ticket" value="" />
                    )}
                    {tickets.map((ticket, index) => (
                      <Picker.Item
                        key={index}
                        label={`${ticket}`}
                        value={ticket.toString()}
                      />
                    ))}
                  </Picker>
                </View>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>
                      Date<Text style={styles.star}>*</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setShowDatePicker(
                          modifyPayment === true ? true : false
                        )
                      }
                    >
                      <TextInput
                        style={styles.textInput}
                        placeholder="Select Date"
                        keyboardType="default"
                        value={moment(currentDate).format("DD-MM-YYYY")}
                        editable={false}
                      />
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={currentDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                      />
                    )}
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>
                      Receipt<Text style={styles.star}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Select Receipt"
                      keyboardType="numeric"
                      value={
                        receipt.receipt_no !== undefined &&
                        receipt.receipt_no !== null
                          ? String(receipt.receipt_no)
                          : ""
                      }
                      editable={false}
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
                      >
                        <Picker.Item label="Cash" value="cash" />
                        <Picker.Item label="Online" value="online" />
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
                      keyboardType="default"
                      value={transactionId}
                      onChangeText={(value) => setTransactionId(value)}
                    />
                  </>
                )}

                {/* BUTTON CONTAINER WITH CENTERING LOGIC */}
                <View
                  style={[
                    styles.buttonContainer,
                    // Apply centering style if QR button is NOT visible
                    !(amount && paymentDetails === "online") &&
                      styles.buttonContainerCentered,
                  ]}
                >
                  {/* QR Code Button */}
                  {amount && paymentDetails === "online" && (
                    <TouchableOpacity
                      onPress={generateQrCode}
                      style={styles.qrButton}
                    >
                      {qrLoading ? (
                        <ActivityIndicator size="small" color={"green"} />
                      ) : (
                        <MaterialIcons name="qr-code-2" size={40} />
                      )}
                    </TouchableOpacity>
                  )}

                  <Button
                    title={isLoading ? "Please wait..." : "Add Payment"}
                    filled
                    disabled={isLoading}
                    style={styles.button}
                    onPress={handleAddPayment}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  gradientOverlay: {
    flex: 1,
  },
  // NEW STYLE: Container for the fixed header and title
  fixedHeaderContainer: {
    paddingHorizontal: 8,
    paddingTop: 40, // Match the original top margin
    backgroundColor: 'transparent', // Ensure gradient shows through, or use a specific color if needed
    zIndex: 10, // Ensure it's above the scrollable content
  },
  titleContainer: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  // NEW STYLE: Padding for ScrollView content
  scrollContentContainer: {
    paddingHorizontal: 8, // Match the original marginHorizontal on the main View
    paddingBottom: 20, // Add some space at the bottom of the scroll view
    flexGrow: 1,
  },
  container: {
    flex: 1,
    // The fixed header takes up the space now, so we can remove the previous margins from the wrapper View
  },
  formBox: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  column: {
    flex: 1,
    marginHorizontal: 3,
  },
  textInput: {
    height: 55,
    width: "100%",
    borderColor: "#d0d0d0",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginVertical: 10,
    color: "#000",
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  pickerContainer: {
    borderColor: "#d0d0d0",
    borderWidth: 1,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    minHeight: 50,
  },

  picker: {
    width: "100%",
    minHeight: 50,
    ...Platform.select({
      ios: {
        height: 55,
      },
      android: {
        height: 55,
        color: "#000",
      },
    }),
  },
  label: {
    fontWeight: "bold",
    marginTop: 10,
  },
  star: {
    color: "red",
  },
  qrButton: {
    flex: 1,
    marginTop: 0,
    marginBottom: 50,
    backgroundColor: "#A7E399",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    padding: 2,
    height: 55,
  },
  button: {
    flex: 6, // Takes up more space when QR button is present
    margin: 3,
    marginTop: 0,
    marginBottom: 50,
    backgroundColor: "#da8201",
    height: 55,
  },
  // STYLES for button centering
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Align items vertically in the center
    marginTop: 20,
  },
  // Style to center the content when only one button is present
  buttonContainerCentered: {
    justifyContent: "center",
  },
});

export default Payin;