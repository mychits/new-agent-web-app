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
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";
import { AgentContext } from "../context/AgentContextProvider";
import { MaterialIcons } from "@expo/vector-icons";

// --- DESIGN CONSTANTS COPIED FROM RouteCustomerChit.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"];
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for icons/left border/primary color)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb"; // Very light background for content area
const PRIMARY_BUTTON_COLOR = "#f8c009ff"; // Assuming the yellow color for main action
// ---------------------------------------------


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
        setCustomerLoaded(true);
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
        setEnrollmentLoaded(true);
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
        setReceiptLoaded(true);
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
    setSelectedTicket("");

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

      const base64 = Buffer.from(response.data, "binary").toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;
      setUrl(dataUrl);

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
        <ActivityIndicator size="large" color={ACCENT_BLUE} />
      </View>
    );
  }
  // ---------------------------------

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* --- QR CODE MODAL --- */}
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
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 20,
          }}
        >
          <View
            style={{
              width: 320,
              padding: 24,
              backgroundColor: CARD_BG,
              borderRadius: 16,
              alignItems: "center",
              shadowColor: MODERN_PRIMARY,
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
                color: MODERN_PRIMARY,
                marginBottom: 6,
              }}
            >
              MyChits Payment
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: TEXT_GREY,
                marginBottom: 16,
              }}
            >
              Pay ₹{amount}
            </Text>

            <View
              style={{
                padding: 12,
                backgroundColor: SUBTLE_BG_GREY,
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
                backgroundColor: ACCENT_BLUE,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: CARD_BG,
                  fontWeight: "bold",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* --------------------------- */}


      {/* =======================================================
         FIXED TOP SECTION (Gradient, Header, Title)
         =======================================================
      */}
      <LinearGradient
        colors={TOP_GRADIENT}
        style={styles.fixedHeaderArea} // Use fixedHeaderArea style
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
          <View style={styles.headerSpacer}>
              <Header />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add Chit Payment</Text>
            <Text style={styles.subtitle}>
              {customerInfo.full_name || 'Customer Details'}
            </Text>
          </View>
      </LinearGradient>


      {/* =======================================================
         SCROLLABLE CONTENT AREA (Form)
         =======================================================
      */}
      <KeyboardAvoidingView
          style={styles.scrollableContentWrapper} // Wrapper for flex 1
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          // keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0} // Removed unnecessary offset
      >
        {/* Main Content Area (Light Background with Rounded Corners) */}
        <View style={styles.mainContentArea}>
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
                    itemStyle={styles.pickerItem}
                    enabled={groups.length > 1}
                  >
                    {groups.length !== 1 && (
                      <Picker.Item label="Select Group" value="" color={TEXT_GREY} />
                    )}
                    {groups.map((group, index) => (
                      <Picker.Item
                        key={index}
                        label={group.group_id.group_name}
                        value={group.group_id._id}
                        color={MODERN_PRIMARY}
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
                    itemStyle={styles.pickerItem}
                    enabled={selectedGroup !== "" && tickets.length !== 1}
                  >
                    {tickets.length !== 1 && (
                      <Picker.Item label="Select Ticket" value="" color={TEXT_GREY} />
                    )}
                    {tickets.map((ticket, index) => (
                      <Picker.Item
                        key={index}
                        label={`${ticket}`}
                        value={ticket.toString()}
                        color={MODERN_PRIMARY}
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
                        itemStyle={styles.pickerItem}
                      >
                        <Picker.Item label="Cash" value="cash" color={MODERN_PRIMARY} />
                        <Picker.Item label="Online" value="online" color={MODERN_PRIMARY} />
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

                {/* BUTTON CONTAINER WITH CENTERING LOGIC */}
                <View
                  style={[
                    styles.buttonContainer,
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
                        <ActivityIndicator size="small" color={MODERN_PRIMARY} />
                      ) : (
                        <MaterialIcons name="qr-code-2" size={30} color={MODERN_PRIMARY} />
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- LAYOUT STYLES (Copied/Modified from RouteCustomerChit.js) ---
  safeArea: {
    flex: 1,
    backgroundColor: TOP_GRADIENT[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SUBTLE_BG_GREY,
  },

  // NEW: Defines the fixed gradient area for Header and Title
  fixedHeaderArea: { 
    paddingHorizontal: 16,
    paddingBottom: 20, // Final space below the title
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  // NEW: Wrapper for the keyboard avoiding view to take up remaining space
  scrollableContentWrapper: { 
      flex: 1,
  },
  
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    marginTop: -20, // Overlap with gradient for the rounded corner
    paddingTop: 30, // Space inside the rounded corner
  },
  headerSpacer: {
    paddingTop: 20,
    paddingBottom: 5,
  },

  // --- TITLE STYLES (Copied/Modified from RouteCustomerChit.js) ---
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
  
  // --- FORM CONTAINER (Modified from original Payin.js) ---
  scrollContentContainer: {
    paddingBottom: 50,
    paddingTop: 10,
    flexGrow: 1,
  },
  container: {
    flex: 1,
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

  // --- INPUT/PICKER STYLES (Modified from original Payin.js) ---
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
    backgroundColor: SUBTLE_BG_GREY, // Light grey background
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

  // --- BUTTON STYLES (Modified from original Payin.js) ---
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  buttonContainerCentered: {
    justifyContent: "center",
  },
  qrButton: {
    flex: 1.5,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: "#D9F3D0", // Light green for QR
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    padding: 2,
    height: 55,
    marginRight: 10,
  },
  button: {
    flex: 5,
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: PRIMARY_BUTTON_COLOR,
    height: 55,
    borderRadius: 12,
  },
});

export default Payin;