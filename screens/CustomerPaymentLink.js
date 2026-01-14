import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import baseUrl from "../constants/baseUrl";

const { width } = Dimensions.get("window");

const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#1e293b";
const ACCENT_BLUE = "#1796d1";
const TEXT_GREY = "#64748b";
const WARNING_COLOR = "#f59e0b";
const PURPLE_COLOR = "#8b5cf6"; 
const SUCCESS_GREEN = "#10b981";

export default function CustomerPaymentLink({ route, navigation }) {
  const { customer } = route.params;

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCards, setFilteredCards] = useState([]);
  const [paymentModal, setPaymentModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  const inputRef = useRef(null);
  const successScale = useRef(new Animated.Value(0)).current;

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    const filtered = cards.filter(item => 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCards(filtered);
  }, [searchQuery, cards]);

  useEffect(() => {
    if (paymentModal) setTimeout(() => { inputRef.current?.focus(); }, 250);
  }, [paymentModal]);

  useEffect(() => {
    if (successModal) {
      Animated.spring(successScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
      setTimeout(() => { setSuccessModal(false); setAmount(""); }, 3000);
    } else { successScale.setValue(0); }
  }, [successModal]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        axios.post(`${baseUrl}/enroll/get-user-tickets/${customer?._id}`),
        axios.get(`${baseUrl}/loans/get-borrower-by-user-id/${customer?._id}`),
        axios.get(`${baseUrl}/pigme/get-pigme-customer-by-user-id/${customer?._id}`),
      ]);

      let finalCards = [];
      const chitRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const loanRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const pigmeRes = results[2].status === 'fulfilled' ? results[2].value : null;

      (chitRes?.data || []).forEach((c) => {
        finalCards.push({
          type: "chit", customer_name: customer?.name, title: c.group_id?.group_name,
          displayValue: Array.isArray(c.tickets) ? c.tickets[0] : c.tickets,
          label: "TICKET NO", group_id: c.group_id?._id, ticket_no: Array.isArray(c.tickets) ? c.tickets[0] : c.tickets,
          color: ACCENT_BLUE, icon: "people"
        });
      });

      const loans = Array.isArray(loanRes?.data) ? loanRes.data : loanRes?.data ? [loanRes.data] : [];
      loans.forEach(l => finalCards.push({
        type: "loan", customer_name: customer?.name, title: `Loan ID: ${l.loan_id}`,
        displayValue: `₹${l.loan_amount}`, label: "LOAN AMOUNT", loan_db_id: l._id, color: WARNING_COLOR, icon: "cash"
      }));

      const pigmes = Array.isArray(pigmeRes?.data) ? pigmeRes.data : pigmeRes?.data ? [pigmeRes.data] : [];
      pigmes.forEach(p => finalCards.push({
        type: "pigmy", customer_name: customer?.name, title: `Pigmy ID: ${p.pigme_id}`,
        displayValue: `₹${p.payable_amount}`, label: "COLLECTION", pigme_db_id: p._id, color: PURPLE_COLOR, 
        icon: "wallet", start_date: p.start_date || "N/A"
      }));

      setCards(finalCards);
      setFilteredCards(finalCards);
    } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
  };

  const processFinalPayment = async () => {
    setIsSending(true);
    let payment_group_tickets = [];
    if (selectedItem.type === "chit") payment_group_tickets = [`chit-${selectedItem.group_id}|${selectedItem.ticket_no}`];
    else if (selectedItem.type === "loan") payment_group_tickets = [`loan-${selectedItem.loan_db_id}`];
    else payment_group_tickets = [`pigme-${selectedItem.pigme_db_id}`];

    try {
      await axios.post(`${baseUrl}/paymentapi/payment-link`, {
        user_id: customer?._id, amount: Number(amount), payment_group_tickets,
        admin_type: "68904ce8ef406d77cbc074f3", purpose: `${selectedItem.type.toUpperCase()} Payment`,
        send_sms: true, notify_customer: true,
      });
      setConfirmModal(false); setPaymentModal(false); setSuccessModal(true);
    } catch (err) { Alert.alert("Error", "Failed to send link"); } finally { setIsSending(false); }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={TOP_GRADIENT} style={styles.topHeader}>
        <View style={styles.headerIconRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Image source={require('../assets/hero1.jpg')} style={styles.heroImage} />
        </View>
        <View style={styles.headerTextCenter}>
          <Text style={styles.headerTitle}>Payments</Text>
          <Text style={styles.headerSubtitle}>Manage transactions for {customer?.name}</Text>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={TEXT_GREY} />
          <TextInput 
            value={searchQuery} onChangeText={setSearchQuery} 
            placeholder="Search accounts..." style={styles.searchField} 
            placeholderTextColor={TEXT_GREY} 
          />
        </View>
      </LinearGradient>

      <View style={styles.mainBody}>
        <View style={styles.bigBoxContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={ACCENT_BLUE} style={{marginTop: 50}} />
          ) : filteredCards.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={70} color={TEXT_GREY} />
                <Text style={styles.emptyTitle}>No Groups for customer</Text>
                <Text style={styles.emptySubtitle}>This user is not currently enrolled in any active Chits, Loans, or Pigmy accounts.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCards}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                  <View style={styles.cardWrapper}>
                      <View style={styles.cardInner}>
                          <View style={styles.cardHeaderRow}>
                              <View style={styles.iconAndText}>
                                  <Ionicons name={item.icon} size={18} color={item.color} />
                                  <Text style={styles.labelStatic}>ACCOUNT DETAILS</Text>
                              </View>
                              <View style={[styles.miniBadge, { backgroundColor: `${item.color}15` }]}>
                                  <Text style={[styles.miniBadgeText, { color: item.color }]}>{item.type.toUpperCase()}</Text>
                              </View>
                          </View>
                          <View style={styles.cardMainContent}>
                              <Text style={styles.cardCustName}>{item.customer_name}</Text>
                              <Text style={styles.cardGrpName}>{item.title}</Text>
                          </View>
                          <View style={styles.infoGrid}>
                              <View style={styles.gridItem}>
                                  <Text style={styles.tinyLabel}>{item.type === 'pigmy' ? 'START DATE' : item.label}</Text>
                                  <Text style={[styles.gridVal, { color: item.color }]}>
                                    {item.type === 'pigmy' ? formatDate(item.start_date) : item.displayValue}
                                  </Text>
                              </View>
                              <View style={[styles.gridItem, { alignItems: 'flex-end' }]}>
                                  <Text style={styles.tinyLabel}>STATUS</Text>
                                  <Text style={styles.gridVal}>ACTIVE</Text>
                              </View>
                          </View>
                          <TouchableOpacity onPress={() => { setSelectedItem(item); setPaymentModal(true); }} activeOpacity={0.8} style={[styles.sendLinkBtn, { backgroundColor: item.color }]}>
                              <Text style={styles.sendLinkBtnText}>SEND PAYMENT LINK</Text>
                          </TouchableOpacity>
                      </View>
                  </View>
              )}
              contentContainerStyle={{ padding: 15, paddingBottom: 120 }}
            />
          )}
        </View>
      </View>

      {/* Amount Entry Modal */}
      <Modal visible={paymentModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBlurCenter}>
          <View style={styles.centeredCard}>
            <LinearGradient colors={['#fff', '#f8fafc']} style={styles.centeredContent}>
                <TouchableOpacity style={styles.closeBtnIcon} onPress={() => { setPaymentModal(false); setAmount(""); }}>
                    <Ionicons name="close-circle" size={28} color={TEXT_GREY} />
                </TouchableOpacity>
                <Text style={styles.mSetupLabel}>ENTER PAYMENT AMOUNT</Text>
                <Text style={styles.mCustName}>{selectedItem?.customer_name}</Text>
                <Text style={styles.modalSubInfo}>{selectedItem?.title}</Text>
                <Text style={[styles.modalTinyInfo, { color: selectedItem?.color }]}>{selectedItem?.label}: {selectedItem?.displayValue}</Text>
                <View style={[styles.mInputRow, { borderBottomColor: selectedItem?.color }]}>
                    <Text style={[styles.mCurrency, { color: selectedItem?.color }]}>₹</Text>
                    <TextInput ref={inputRef} keyboardType="numeric" value={amount} onChangeText={setAmount} style={styles.mInputField} placeholder="0" />
                </View>
                <TouchableOpacity style={[styles.mActionBtn, { backgroundColor: selectedItem?.color }]} onPress={() => amount > 0 && setConfirmModal(true)}>
                    <Text style={styles.mActionBtnText}>Send Link</Text>
                </TouchableOpacity>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmation Modal - Updated to show Ticket No for Chits */}
      <Modal visible={confirmModal} transparent animationType="slide">
        <View style={styles.confirmOverlay}>
          <View style={styles.glassConfirmCard}>
            <Text style={styles.confirmHeading}>Confirm Details</Text>
            <View style={styles.glassDetailBox}>
                <View style={styles.glassRow}>
                    <Text style={styles.glassLabel}>CUSTOMER</Text>
                    <Text style={styles.glassValue}>{selectedItem?.customer_name}</Text>
                </View>
                <View style={styles.glassRow}>
                    <Text style={styles.glassLabel}>ACCOUNT</Text>
                    <Text style={styles.glassValue}>{selectedItem?.title}</Text>
                </View>
                {selectedItem?.type === "chit" && (
                    <View style={styles.glassRow}>
                        <Text style={styles.glassLabel}>TICKET NO</Text>
                        <Text style={[styles.glassValue, { color: ACCENT_BLUE }]}>{selectedItem?.ticket_no}</Text>
                    </View>
                )}
                <View style={styles.glassRow}>
                    <Text style={styles.glassLabel}>PAYABLE AMOUNT</Text>
                    <Text style={[styles.glassValue, { color: SUCCESS_GREEN, fontSize: 24 }]}>₹{amount}</Text>
                </View>
            </View>
            <View style={styles.confirmBtnRow}>
                <TouchableOpacity style={styles.glassCancel} onPress={() => setConfirmModal(false)}>
                    <Text style={styles.glassCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.glassConfirm} onPress={processFinalPayment}>
                    {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.glassConfirmText}>YES, SEND</Text>}
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={successModal} transparent>
        <View style={styles.successOverlay}>
          <Animated.View style={[styles.premiumSuccessCard, { transform: [{ scale: successScale }] }]}>
            <View style={styles.successIconWrapper}><Ionicons name="checkmark-done" size={60} color="#fff" /></View>
            <Text style={styles.pSuccessTitle}>SENT SUCCESSFULLY</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: "#f1f5f9" },
  topHeader: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 12 },
  headerIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -5 },
  heroImage: { width: 45, height: 45, borderRadius: 22 },
  headerTextCenter: { alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#fff", textAlign: 'center' },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginTop: 4, textAlign: 'center' },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, height: 50, paddingHorizontal: 15, elevation: 8 },
  searchField: { flex: 1, marginLeft: 10, fontSize: 16, color: MODERN_PRIMARY, fontWeight: '600' },
  mainBody: { flex: 1, marginTop: -20, paddingHorizontal: 15 },
  bigBoxContainer: { flex: 1, backgroundColor: "#ffffff", borderRadius: 30, elevation: 5, marginBottom: 20, overflow: "hidden" },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: MODERN_PRIMARY, marginTop: 15 },
  emptySubtitle: { fontSize: 13, color: TEXT_GREY, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  cardWrapper: { backgroundColor: "#fff", borderRadius: 22, borderWidth: 1, borderColor: "#e2e8f0", elevation: 2, marginBottom: 15 },
  cardInner: { padding: 18 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  iconAndText: { flexDirection: "row", alignItems: "center" },
  labelStatic: { fontSize: 10, fontWeight: "800", color: TEXT_GREY, marginLeft: 6 },
  miniBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  miniBadgeText: { fontSize: 9, fontWeight: "900" },
  cardMainContent: { alignItems: "center", marginBottom: 15 },
  cardCustName: { fontSize: 22, fontWeight: "900", color: MODERN_PRIMARY },
  cardGrpName: { fontSize: 14, color: TEXT_GREY, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  gridItem: { flex: 1 },
  tinyLabel: { fontSize: 9, fontWeight: "900", color: TEXT_GREY, marginBottom: 4 },
  gridVal: { fontSize: 16, fontWeight: "900" },
  sendLinkBtn: { width: '100%', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  sendLinkBtnText: { color: "#fff", fontWeight: "900" },
  modalBlurCenter: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.8)", justifyContent: "center", alignItems: "center" },
  centeredCard: { width: width * 0.9, borderRadius: 32, overflow: "hidden" },
  centeredContent: { padding: 25, alignItems: 'center' },
  closeBtnIcon: { alignSelf: 'flex-end' },
  mSetupLabel: { fontSize: 10, fontWeight: "900", color: TEXT_GREY, marginBottom: 10 },
  mCustName: { fontSize: 24, fontWeight: "900", color: MODERN_PRIMARY },
  modalSubInfo: { fontSize: 14, fontWeight: '600', color: TEXT_GREY, marginTop: 4 },
  modalTinyInfo: { fontSize: 12, fontWeight: '800', marginTop: 2, marginBottom: 15 },
  mInputRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 3, width: '80%', justifyContent: 'center', marginBottom: 30 },
  mCurrency: { fontSize: 32, fontWeight: "900", marginRight: 5 },
  mInputField: { fontSize: 48, fontWeight: "900", minWidth: 100, textAlign: "center", color: MODERN_PRIMARY },
  mActionBtn: { width: "100%", padding: 20, borderRadius: 20, alignItems: "center" },
  mActionBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  glassConfirmCard: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  confirmHeading: { fontSize: 22, fontWeight: '900', color: MODERN_PRIMARY, textAlign: 'center', marginBottom: 25 },
  glassDetailBox: { backgroundColor: '#f1f5f9', borderRadius: 25, padding: 20, marginBottom: 30 },
  glassRow: { marginBottom: 12 },
  glassLabel: { fontSize: 9, fontWeight: '900', color: TEXT_GREY },
  glassValue: { fontSize: 17, fontWeight: '900', color: MODERN_PRIMARY },
  confirmBtnRow: { flexDirection: 'row', gap: 15 },
  glassCancel: { flex: 1, paddingVertical: 18, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center' },
  glassCancelText: { color: TEXT_GREY, fontWeight: '900' },
  glassConfirm: { flex: 2, paddingVertical: 18, borderRadius: 18, backgroundColor: MODERN_PRIMARY, alignItems: 'center' },
  glassConfirmText: { color: '#fff', fontWeight: '900' },
  successOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.95)", justifyContent: "center", alignItems: "center" },
  premiumSuccessCard: { alignItems: 'center' },
  successIconWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: SUCCESS_GREEN, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  pSuccessTitle: { fontSize: 20, fontWeight: '900', color: '#fff' }
});