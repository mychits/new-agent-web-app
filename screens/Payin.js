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

const TOP_GRADIENT = ['#24C6DC', '#183A5D'];
const MODERN_PRIMARY = "#0d0d0eff";
const ACCENT_BLUE = "#1796d1ff";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb";
const PRIMARY_BUTTON_COLOR = "#f8c009ff";

const ERROR_GRADIENT = ['#eb3349', '#f45c43'];

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

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [customerInfo, setCustomerInfo] = useState({});
  const [groups, setGroups] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTicket, setSelectedTicket] = useState("");
  const [allData, setAllData] = useState([]);

  const [balance, setBalance] = useState(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const [url, setUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [customerLoaded, setCustomerLoaded] = useState(false);
  const [enrollmentLoaded, setEnrollmentLoaded] = useState(false);
  const [receiptLoaded, setReceiptLoaded] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await axios.get(`${baseUrl}/user/get-user-by-id/${customer}`);
        if (response.data) setCustomerInfo(response.data);
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setCustomerLoaded(true);
      }
    };
    fetchCustomer();
  }, [customer]);

  const fetchPendingBalance = async (enrollId) => {
    if (!enrollId) return;
    setIsBalanceLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/enroll/${enrollId}/amount-to-be-paid`);
      if (response.data && response.data.data && response.data.data.length > 0) {
        setBalance(response.data.data[0].balance);
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  useEffect(() => {
    const fetchEnrollDetails = async () => {
      try {
        const response = await axios.post(`${baseUrl}/enroll/get-user-tickets/${customer}`);
        setAllData(response.data);
        const uniqueGroups = response.data
          .filter((group) => group.group_id !== null)
          .reduce((acc, group) => {
            if (!acc.some((g) => g.group_id.group_name === group.group_id.group_name)) {
              acc.push(group);
            }
            return acc;
          }, []);
        setGroups(uniqueGroups);

        if (uniqueGroups.length === 1) {
          const groupId = uniqueGroups[0].group_id._id;
          setSelectedGroup(groupId);
          const groupTickets = response.data
            .filter((item) => item.group_id && item.group_id._id === groupId)
            .map((item) => item.tickets);
          setTickets(groupTickets);
          if (groupTickets.length === 1) {
            setSelectedTicket(groupTickets[0].toString());
            const enrollId = response.data.find(
              (item) => item.group_id?._id === groupId && item.tickets === groupTickets[0]
            )?._id;
            fetchPendingBalance(enrollId);
          }
        }
      } catch (error) {
        console.error("Error fetching enrollment data:", error);
      } finally {
        setEnrollmentLoaded(true);
      }
    };
    fetchEnrollDetails();
  }, [customer]);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await axios.get(`${baseUrl}/payment/get-latest-receipt`);
        setReceipt(response.data);
      } catch (error) {
        console.error("Error fetching latest receipt:", error);
      } finally {
        setReceiptLoaded(true);
      }
    };
    fetchReceipt();
  }, []);

  useEffect(() => {
    if (customerLoaded && enrollmentLoaded && receiptLoaded) setIsInitialLoading(false);
  }, [customerLoaded, enrollmentLoaded, receiptLoaded]);

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    setSelectedTicket("");
    setBalance(null);
    if (groupId) {
      const groupTickets = allData
        .filter((item) => item.group_id && item.group_id._id === groupId)
        .map((item) => item.tickets);
      setTickets(groupTickets);
      if (groupTickets.length === 1) {
        const ticket = groupTickets[0].toString();
        setSelectedTicket(ticket);
        const enroll = allData.find(
          (item) => item.group_id?._id === groupId && item.tickets.toString() === ticket
        );
        if (enroll) fetchPendingBalance(enroll._id);
      }
    } else {
      setTickets([]);
    }
  };

  const handleTicketChange = (ticketValue) => {
    setSelectedTicket(ticketValue);
    if (ticketValue && selectedGroup) {
      const enroll = allData.find(
        (item) => item.group_id?._id === selectedGroup && item.tickets.toString() === ticketValue
      );
      if (enroll) fetchPendingBalance(enroll._id);
    } else {
      setBalance(null);
    }
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentDetails(type);
    setAdditionalInfo(
      type === "online" ? "Transaction ID" : type === "cheque" ? "Cheque Number" : ""
    );
    setTransactionId("");
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  };

  const handleAmountChange = (text) => {
    let numericValue = text.replace(/[^0-9]/g, "");
    if (numericValue.length > 0 && numericValue.startsWith("0")) {
      numericValue = numericValue.replace(/^0+/, "");
    }
    setAmount(numericValue);
  };

  const validateAndShowModal = () => {
    if (!customerInfo.full_name || !selectedGroup || !selectedTicket || !amount) {
      setErrorMessage("Please fill all mandatory fields.");
      setShowErrorModal(true);
      return;
    }

    if (amount.length === 1) {
      setErrorMessage("Amount must be at least 2 digits.");
      setShowErrorModal(true);
      return;
    }

    if (paymentDetails === "online" && !transactionId.trim()) {
      setErrorMessage("Please enter a Transaction ID for online payments.");
      setShowErrorModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const executePayment = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    try {
      const data = {
        user_id: customer,
        group_id: selectedGroup,
        ticket: selectedTicket,
        pay_date: moment(currentDate).format("YYYY-MM-DD"),
        receipt_no: receipt.receipt_no ? String(receipt.receipt_no) : "",
        pay_type: paymentDetails,
        amount: amount,
        transaction_id: transactionId,
        collected_by: user.userId,
      };
      const response = await axios.post(`${baseUrl}/payment/add-payment`, data);
      if (response.status === 201) {
        Alert.alert("Success", "Payment added successfully!");
        navigation.navigate("Print", { store_id: response.data._id });
      }
    } catch (error) {
      Alert.alert("Payment Error", "Failed to add payment.");
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
      setUrl(`data:image/png;base64,${base64}`);
      setModalVisible(true);
    } catch (error) {
      console.error("Failed to generate qr code", error);
    } finally {
      setQrLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT_BLUE} />
      </View>
    );
  }

  const getGroupName = () => {
    const g = groups.find((g) => g.group_id._id === selectedGroup);
    return g ? g.group_id.group_name : "N/A";
  };

  const hasOutstanding = balance !== null && balance > 0;
  const isPaidUp = balance !== null && balance <= 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MyChits Payment</Text>
            <Text style={styles.modalSubtitle}>Pay ₹{amount}</Text>
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: url }}
                style={{ width: 240, height: 240 }}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={showErrorModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.stylishModalCard}>
            <LinearGradient colors={ERROR_GRADIENT} style={styles.errorHeader}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="error-outline" size={32} color={CARD_BG} />
              </View>
              <Text style={styles.errorTitle}>Validation Error</Text>
            </LinearGradient>

            <View style={[styles.stylishBody, { alignItems: "center", paddingTop: 20 }]}>
              <MaterialIcons
                name="info"
                size={22}
                color={ERROR_GRADIENT[1]}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.errorMessageText}>{errorMessage}</Text>
            </View>

            <View style={styles.stylishFooter}>
              <TouchableOpacity
                onPress={() => setShowErrorModal(false)}
                style={[
                  styles.stylishCancelButton,
                  { flex: 1, backgroundColor: "#fee2e2", marginLeft: 0 },
                ]}
              >
                <Text style={[styles.stylishCancelText, { color: ERROR_GRADIENT[1] }]}>OKAY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={showConfirmModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.stylishModalCard}>
            <LinearGradient colors={TOP_GRADIENT} style={styles.stylishHeader}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="check-circle" size={28} color={CARD_BG} />
              </View>
              <Text style={styles.stylishHeaderTitle}>Confirm Payment</Text>
              <Text style={styles.stylishHeaderSubtitle}>Please verify the details</Text>
            </LinearGradient>

            <View style={styles.stylishBody}>
              <View style={styles.stylishRow}>
                <Text style={styles.stylishLabel}>Customer</Text>
                <Text style={styles.stylishValue}>{customerInfo.full_name}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.stylishRow}>
                <Text style={styles.stylishLabel}>Group</Text>
                <Text style={styles.stylishValue}>{getGroupName()}</Text>
              </View>

              <View style={styles.stylishRow}>
                <Text style={styles.stylishLabel}>Ticket No.</Text>
                <Text style={styles.stylishValue}>{selectedTicket}</Text>
              </View>

              <View style={styles.stylishRow}>
                <Text style={styles.stylishLabel}>Date</Text>
                <Text style={styles.stylishValue}>
                  {moment(currentDate).format("DD-MM-YYYY")}
                </Text>
              </View>

              <View style={styles.stylishRow}>
                <Text style={styles.stylishLabel}>Method</Text>
                <View style={styles.methodBadge}>
                  <Text style={styles.methodText}>{paymentDetails.toUpperCase()}</Text>
                </View>
              </View>

              {paymentDetails === "online" && (
                <View style={styles.stylishRow}>
                  <Text style={styles.stylishLabel}>Trans. ID</Text>
                  <Text style={[styles.stylishValue, { fontSize: 13 }]}>{transactionId}</Text>
                </View>
              )}

              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>₹ {amount}</Text>
              </View>
            </View>

            <View style={styles.stylishFooter}>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={styles.stylishCancelButton}
              >
                <Text style={styles.stylishCancelText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={executePayment} style={styles.stylishConfirmButton}>
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

      <LinearGradient colors={TOP_GRADIENT} style={styles.fixedHeaderArea}>
        <View style={styles.headerSpacer}>
          <Header />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Add Chit Payment</Text>
          <Text style={styles.subtitle}>{customerInfo.full_name || "Customer Details"}</Text>

          {isBalanceLoading ? (
            <ActivityIndicator size="small" color={CARD_BG} style={{ marginTop: 4, marginBottom: 10 }} />
          ) : (
            selectedGroup && selectedTicket && balance !== null ? (
              <View
                style={[
                  styles.balancePill,
                  hasOutstanding ? styles.balancePillDanger : styles.balancePillSuccess,
                ]}
              >
                {isPaidUp ? (
                  <>
                    <MaterialIcons name="check-circle" size={14} color="#166534" style={styles.pillIcon} />
                    <Text style={styles.balanceSuccessText}>Payments up to date</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="warning" size={14} color="#991b1b" style={styles.pillIcon} />
                    <Text style={styles.balanceDangerLabel}>Outstanding: </Text>
                    <Text style={styles.balanceDangerAmount}>₹ {balance}</Text>
                  </>
                )}
              </View>
            ) : null
          )}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.scrollableContentWrapper}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.mainContentArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formBox}>
              <Text style={styles.label}>
                Name<Text style={styles.star}>*</Text>
              </Text>
              <TextInput style={styles.textInput} value={customerInfo.full_name} editable={false} />

              <Text style={styles.label}>
                Group<Text style={styles.star}>*</Text>
              </Text>
              <View style={styles.pickerContainerFull}>
                <Picker
                  selectedValue={selectedGroup}
                  onValueChange={handleGroupChange}
                  style={styles.picker}
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
              <View style={styles.pickerContainerFull}>
                <Picker
                  selectedValue={selectedTicket}
                  onValueChange={handleTicketChange}
                  style={styles.picker}
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
                  <TouchableOpacity onPress={() => modifyPayment && setShowDatePicker(true)}>
                    <TextInput
                      style={styles.textInput}
                      value={moment(currentDate).format("DD-MM-YYYY")}
                      editable={false}
                    />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={currentDate}
                      mode="date"
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
                    value={receipt.receipt_no !== undefined ? String(receipt.receipt_no) : ""}
                    editable={false}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.label}>
                  Payment Type<Text style={styles.star}>*</Text>
                </Text>
                <View style={styles.pickerContainerFull}>
                  <Picker
                    selectedValue={paymentDetails}
                    onValueChange={handlePaymentTypeChange}
                    style={styles.picker}
                  >
                    <Picker.Item label="Cash" value="cash" color={MODERN_PRIMARY} />
                    <Picker.Item label="Online" value="online" color={MODERN_PRIMARY} />
                  </Picker>
                </View>
              </View>

              <View>
                <Text style={styles.label}>
                  Amount<Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter The Amount"
                  keyboardType="number-pad"
                  value={amount}
                  onChangeText={handleAmountChange}
                />
              </View>

              {additionalInfo !== "" && (
                <View>
                  <Text style={styles.label}>
                    {additionalInfo}
                    <Text style={styles.star}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={transactionId}
                    onChangeText={setTransactionId}
                  />
                </View>
              )}

              <View
                style={[
                  styles.buttonContainer,
                  !(amount && paymentDetails === "online") && styles.buttonContainerCentered,
                ]}
              >
                {amount && paymentDetails === "online" && (
                  <TouchableOpacity onPress={generateQrCode} style={styles.qrButton}>
                    {qrLoading ? (
                      <ActivityIndicator size="small" color={MODERN_PRIMARY} />
                    ) : (
                      <MaterialIcons name="qr-code-2" size={28} color={MODERN_PRIMARY} />
                    )}
                  </TouchableOpacity>
                )}
                <Button
                  title={isLoading ? "Please wait..." : "Add Payment"}
                  filled
                  style={styles.button}
                  onPress={validateAndShowModal}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SUBTLE_BG_GREY,
  },
  fixedHeaderArea: { paddingHorizontal: 16, paddingBottom: 20 },
  scrollableContentWrapper: { flex: 1 },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    marginTop: -20,
    paddingTop: 15,
  },
  headerSpacer: { paddingTop: 10, paddingBottom: 0 },
  titleContainer: { alignItems: "center" },
  title: { fontSize: 20, fontWeight: "900", color: CARD_BG },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginBottom: 8,
  },

  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  balancePillDanger: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  balancePillSuccess: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  pillIcon: {
    marginRight: 4,
  },
  balanceDangerLabel: {
    fontSize: 11,
    color: "#991b1b",
    fontWeight: "600",
  },
  balanceDangerAmount: {
    fontSize: 13,
    color: "#7f1d1d",
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  balanceSuccessText: {
    fontSize: 11,
    color: "#166534",
    fontWeight: "700",
  },

  scrollContentContainer: { paddingBottom: 40, flexGrow: 1 },
  formBox: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    elevation: 4,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  column: { flex: 1, marginHorizontal: 3 },
  label: { fontWeight: "600", marginTop: 4, fontSize: 11, color: MODERN_PRIMARY },
  star: { color: "#ff0000" },
  textInput: {
    paddingVertical: 12,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 3,
    color: MODERN_PRIMARY,
    backgroundColor: SUBTLE_BG_GREY,
    fontSize: 14,
  },
  pickerContainerFull: {
    height: 48,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: SUBTLE_BG_GREY,
    marginVertical: 3,
    justifyContent: "center",
  },
  picker: { 
    width: "100%", 
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  buttonContainerCentered: { justifyContent: "center" },
  qrButton: {
    flex: 1.5,
    backgroundColor: "#D9F3D0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    height: 48,
    marginRight: 10,
  },
  button: { flex: 5, backgroundColor: PRIMARY_BUTTON_COLOR, height: 48, borderRadius: 10 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: MODERN_PRIMARY, marginBottom: 4 },
  modalSubtitle: { fontSize: 15, color: TEXT_GREY, marginBottom: 14 },
  qrContainer: {
    padding: 10,
    backgroundColor: SUBTLE_BG_GREY,
    borderRadius: 10,
    marginBottom: 18,
  },
  closeButton: {
    width: "100%",
    paddingVertical: 10,
    backgroundColor: ACCENT_BLUE,
    borderRadius: 8,
  },
  closeButtonText: { color: CARD_BG, fontWeight: "bold", textAlign: "center" },

  stylishModalCard: {
    width: "85%",
    backgroundColor: CARD_BG,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
  },
  stylishHeader: {
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 15,
    alignItems: "center",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  errorHeader: {
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 15,
    alignItems: "center",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: CARD_BG,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  errorMessageText: {
    fontSize: 14,
    color: TEXT_GREY,
    textAlign: "center",
    lineHeight: 22,
  },
  iconCircle: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 50,
    padding: 6,
    marginBottom: 6,
  },
  stylishHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: CARD_BG,
    letterSpacing: 0.5,
  },
  stylishHeaderSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 3,
  },
  stylishBody: {
    padding: 15,
  },
  stylishRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  stylishLabel: {
    fontSize: 12,
    color: TEXT_GREY,
    fontWeight: "500",
  },
  stylishValue: {
    fontSize: 14,
    color: MODERN_PRIMARY,
    fontWeight: "700",
  },
  methodBadge: {
    backgroundColor: SUBTLE_BG_GREY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  methodText: {
    fontSize: 10,
    color: ACCENT_BLUE,
    fontWeight: "700",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 4,
    marginBottom: 10,
  },
  totalBox: {
    backgroundColor: "rgba(23, 150, 209, 0.08)",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
    borderWidth: 1,
    borderColor: "rgba(23, 150, 209, 0.2)",
  },
  totalLabel: {
    fontSize: 12,
    color: ACCENT_BLUE,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 22,
    color: MODERN_PRIMARY,
    fontWeight: "900",
    marginTop: 4,
  },
  stylishFooter: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  stylishCancelButton: {
    flex: 1,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: SUBTLE_BG_GREY,
  },
  stylishCancelText: {
    color: TEXT_GREY,
    fontWeight: "700",
    fontSize: 13,
  },
  stylishConfirmButton: {
    flex: 1.5,
    paddingVertical: 8,
    marginLeft: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: PRIMARY_BUTTON_COLOR,
    shadowColor: "#f8c009ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stylishConfirmText: {
    color: MODERN_PRIMARY,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

export default Payin;
