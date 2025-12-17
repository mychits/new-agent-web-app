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

const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"];
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb"; 
const PRIMARY_BUTTON_COLOR = "#f8c009ff"; 

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
  
  // Balance State
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
            const enrollId = response.data.find(item => item.group_id?._id === groupId && item.tickets === groupTickets[0])?._id;
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
      const groupTickets = allData.filter((item) => item.group_id && item.group_id._id === groupId).map((item) => item.tickets);
      setTickets(groupTickets);
      if (groupTickets.length === 1) {
        const ticket = groupTickets[0].toString();
        setSelectedTicket(ticket);
        const enroll = allData.find(item => item.group_id?._id === groupId && item.tickets.toString() === ticket);
        if (enroll) fetchPendingBalance(enroll._id);
      }
    } else { setTickets([]); }
  };

  const handleTicketChange = (ticketValue) => {
    setSelectedTicket(ticketValue);
    if (ticketValue && selectedGroup) {
      const enroll = allData.find(item => item.group_id?._id === selectedGroup && item.tickets.toString() === ticketValue);
      if (enroll) fetchPendingBalance(enroll._id);
    } else { setBalance(null); }
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentDetails(type);
    setAdditionalInfo(type === "online" ? "Transaction ID" : type === "cheque" ? "Cheque Number" : "");
    setTransactionId("");
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  };

  const handleAddPayment = async () => {
    if (!customerInfo.full_name || !selectedGroup || !selectedTicket || !amount) {
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
    } catch (error) { Alert.alert("Payment Error", "Failed to add payment."); }
    finally { setIsLoading(false); }
  };

  const generateQrCode = async () => {
    try {
      setQrLoading(true);
      const response = await axios.post(`${baseUrl}/qrcode?amount=${amount}`, {}, { responseType: "arraybuffer" });
      const base64 = Buffer.from(response.data, "binary").toString("base64");
      setUrl(`data:image/png;base64,${base64}`);
      setModalVisible(true);
    } catch (error) { console.error("Failed to generate qr code", error); }
    finally { setQrLoading(false); }
  };

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT_BLUE} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MyChits Payment</Text>
            <Text style={styles.modalSubtitle}>Pay ₹{amount}</Text>
            <View style={styles.qrContainer}>
              <Image source={{ uri: url }} style={{ width: 240, height: 240 }} resizeMode="contain" />
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <LinearGradient colors={TOP_GRADIENT} style={styles.fixedHeaderArea}>
          <View style={styles.headerSpacer}><Header /></View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add Chit Payment</Text>
            <Text style={styles.subtitle}>{customerInfo.full_name || 'Customer Details'}</Text>
            
            <View style={styles.headerBalanceContainer}>
                {isBalanceLoading ? (
                    <ActivityIndicator size="small" color={MODERN_PRIMARY} />
                ) : (
                    <>
                      {balance !== null && balance < 0 ? (
                        <Text style={styles.headerBalanceAmount}>Great! Your payments are up to date.</Text>
                      ) : (
                        <>
                          <Text style={styles.headerBalanceLabel}>Outstanding Amount: </Text>
                          <Text style={styles.headerBalanceAmount}>₹ {balance !== null ? balance : '0'}</Text>
                        </>
                      )}
                    </>
                )}
            </View>
          </View>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.scrollableContentWrapper} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.mainContentArea}>
          <ScrollView contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.formBox}>
              <Text style={styles.label}>Name<Text style={styles.star}>*</Text></Text>
              <TextInput style={styles.textInput} value={customerInfo.full_name} editable={false} />
              
              <Text style={styles.label}>Group<Text style={styles.star}>*</Text></Text>
              <View style={styles.pickerContainerFull}>
                <Picker selectedValue={selectedGroup} onValueChange={handleGroupChange} style={styles.picker}>
                  {groups.length !== 1 && <Picker.Item label="Select Group" value="" color={TEXT_GREY} />}
                  {groups.map((group, index) => (
                    <Picker.Item key={index} label={group.group_id.group_name} value={group.group_id._id} color={MODERN_PRIMARY} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Ticket<Text style={styles.star}>*</Text></Text>
              <View style={styles.pickerContainerFull}>
                <Picker selectedValue={selectedTicket} onValueChange={handleTicketChange} style={styles.picker}>
                  {tickets.length !== 1 && <Picker.Item label="Select Ticket" value="" color={TEXT_GREY} />}
                  {tickets.map((ticket, index) => (
                    <Picker.Item key={index} label={`${ticket}`} value={ticket.toString()} color={MODERN_PRIMARY} />
                  ))}
                </Picker>
              </View>
              
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Date<Text style={styles.star}>*</Text></Text>
                  <TouchableOpacity onPress={() => modifyPayment && setShowDatePicker(true)}>
                    <TextInput style={styles.textInput} value={moment(currentDate).format("DD-MM-YYYY")} editable={false} />
                  </TouchableOpacity>
                  {showDatePicker && <DateTimePicker value={currentDate} mode="date" onChange={handleDateChange} />}
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Receipt<Text style={styles.star}>*</Text></Text>
                  <TextInput style={styles.textInput} value={receipt.receipt_no !== undefined ? String(receipt.receipt_no) : ""} editable={false} />
                </View>
              </View>
              
              <View>
                <Text style={styles.label}>Payment Type<Text style={styles.star}>*</Text></Text>
                <View style={styles.pickerContainerFull}>
                  <Picker selectedValue={paymentDetails} onValueChange={handlePaymentTypeChange} style={styles.picker}>
                    <Picker.Item label="Cash" value="cash" color={MODERN_PRIMARY} />
                    <Picker.Item label="Online" value="online" color={MODERN_PRIMARY} />
                  </Picker>
                </View>
              </View>

              <View>
                <Text style={styles.label}>Amount<Text style={styles.star}>*</Text></Text>
                <TextInput style={styles.textInput} placeholder="Enter The Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
              </View>

              {additionalInfo !== "" && (
                <View>
                  <Text style={styles.label}>{additionalInfo}<Text style={styles.star}>*</Text></Text>
                  <TextInput style={styles.textInput} value={transactionId} onChangeText={setTransactionId} />
                </View>
              )}

              <View style={[styles.buttonContainer, !(amount && paymentDetails === "online") && styles.buttonContainerCentered]}>
                {amount && paymentDetails === "online" && (
                  <TouchableOpacity onPress={generateQrCode} style={styles.qrButton}>
                    {qrLoading ? <ActivityIndicator size="small" color={MODERN_PRIMARY} /> : <MaterialIcons name="qr-code-2" size={30} color={MODERN_PRIMARY} />}
                  </TouchableOpacity>
                )}
                <Button title={isLoading ? "Please wait..." : "Add Payment"} filled style={styles.button} onPress={handleAddPayment} />
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: SUBTLE_BG_GREY },
  fixedHeaderArea: { paddingHorizontal: 16, paddingBottom: 25 },
  scrollableContentWrapper: { flex: 1 },
  mainContentArea: { flex: 1, backgroundColor: SUBTLE_BG_GREY, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 16, marginTop: -20, paddingTop: 30 },
  headerSpacer: { paddingTop: 20, paddingBottom: 5 },
  titleContainer: { alignItems: "center" },
  title: { fontSize: 26, fontWeight: "900", color: CARD_BG },
  subtitle: { fontSize: 16, color: "rgba(255, 255, 255, 0.9)", fontWeight: "600", marginBottom: 8 },
  headerBalanceContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor:"#f0d16eff" , 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 20 
  },
  headerBalanceLabel: { fontSize: 14, color: MODERN_PRIMARY, fontWeight: '500' },
  headerBalanceAmount: { fontSize: 16, color: MODERN_PRIMARY, fontWeight: 'bold' },
  scrollContentContainer: { paddingBottom: 50, flexGrow: 1 },
  formBox: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR, elevation: 5 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  column: { flex: 1, marginHorizontal: 3 },
  label: { fontWeight: "600", marginTop: 10, fontSize: 14, color: MODERN_PRIMARY },
  star: { color: "#ff0000" },
  textInput: { height: 56, borderColor: BORDER_COLOR, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, marginVertical: 8, color: MODERN_PRIMARY, backgroundColor: SUBTLE_BG_GREY, fontSize: 16 },
  pickerContainerFull: { borderColor: BORDER_COLOR, borderWidth: 1, borderRadius: 12, backgroundColor: SUBTLE_BG_GREY, marginVertical: 8, minHeight: 56, justifyContent: 'center' },
  picker: { width: "100%", height: 56 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  buttonContainerCentered: { justifyContent: "center" },
  qrButton: { flex: 1.5, backgroundColor: "#D9F3D0", justifyContent: "center", alignItems: "center", borderRadius: 12, height: 55, marginRight: 10 },
  button: { flex: 5, backgroundColor: PRIMARY_BUTTON_COLOR, height: 55, borderRadius: 12 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)" },
  modalContent: { width: 320, padding: 24, backgroundColor: CARD_BG, borderRadius: 16, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: MODERN_PRIMARY },
  modalSubtitle: { fontSize: 16, color: TEXT_GREY, marginBottom: 16 },
  qrContainer: { padding: 12, backgroundColor: SUBTLE_BG_GREY, borderRadius: 12, marginBottom: 20 },
  closeButton: { width: "100%", paddingVertical: 12, backgroundColor: ACCENT_BLUE, borderRadius: 8 },
  closeButtonText: { color: CARD_BG, fontWeight: "bold", textAlign: "center" }
});

export default Payin;