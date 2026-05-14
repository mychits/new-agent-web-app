import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
  Animated,
  TextInput,
  Platform,
  Modal,
  Pressable,
  Keyboard,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import baseUrl from "../constants/baseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Design Tokens ─────────────────────────────────────────────────
const TOP_GRADIENT = ["#24C6DC", "#183A5D"];
const ACCENT_BLUE  = "#1796d1";
const PRIMARY_DARK = "#0d0d0e";
const TEXT_GREY    = "#4b5563";
const BORDER_COLOR = "#e0e0e0";
const CARD_BG      = "#ffffff";
const SUBTLE_BG    = "#f9fafb";
const SUCCESS      = "#10B981";
const DANGER       = "#ef4444";
const WARNING      = "#f59e0b";
const WA_GREEN     = "#25D366";
const AVATAR_GRADIENT = ["#667eea", "#764ba2"];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── Helpers ───────────────────────────────────────────────────────
const formatCurrency = (v) => {
  const n = Number(v);
  return isNaN(n) ? "₹0" : "₹" + n.toLocaleString("en-IN");
};

const formatDateTimeIST = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "—";
  }
};

const getInitials = (name = "") => {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase() || "?";
};

const STATUS_META = {
  APPROVED: { bg: "#dcfce7", text: "#15803d", icon: "checkmark-circle", label: "Approved", gradient: ["#10B981", "#059669"] },
  REJECTED: { bg: "#fee2e2", text: "#b91c1c", icon: "close-circle",     label: "Rejected", gradient: ["#F87171", "#EF4444"] },
  PENDING:  { bg: "#fef9c3", text: "#92400e", icon: "time",             label: "Pending",  gradient: ["#FBBF24", "#F59E0B"] },
};
const getStatus = (s) => STATUS_META[s] || STATUS_META.PENDING;

const openLink = (type, value) => {
  if (!value) return;
  const url = type === "call"
    ? `tel:${value}`
    : `whatsapp://send?phone=${value.replace(/[^0-9]/g, "")}`;
  Linking.openURL(url).catch(() => Alert.alert("Error", `Cannot open ${type}`));
};

// ── Tabs Config ───────────────────────────────────────────────────
const TABS = [
  { key: "ALL",      label: "All"      },
  { key: "PENDING",  label: "Pending"  },
  { key: "APPROVED", label: "Approved" },
];

// ── Premium Accordion Card ─────────────────────────────────────────
const LoanCard = ({ item, index, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const borrower = item.borrower || {};
  const statusKey = item.agent_approval_status || "PENDING";
  const status = getStatus(statusKey);
  const isPending = statusKey === "PENDING";
  
  useEffect(() => {
    Animated.spring(rotationAnim, {
      toValue: expanded ? 1 : 0,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const openModal = (newStatus) => {
    setPendingStatus(newStatus);
    setModalVisible(true);
  };

  const handleConfirm = async (status, amount, remarkText) => {
    setBusy(true);
    try {
      const res = await axios.put(
        `${baseUrl}/v1/mobile/loans/update-borrower-status/${item._id}`,
        { agent_approval_status: status, employee_approved_amount: amount, employee_remark: remarkText }
      );
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      
      setModalVisible(false);
      const updates = {
        agent_approval_status: status,
        employee_approved_amount: amount,
        employee_remark: remarkText,
        agent_approval_status_updated_at: res.data?.data?.agent_approval_status_updated_at || new Date().toISOString()
      };
      onStatusChange(item._id, updates);
    } catch (e) {
      Alert.alert("Error", e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <>
      <ConfirmModal
        visible={modalVisible}
        type={pendingStatus}
        borrowerName={borrower.full_name}
        loanAmount={item.loan_amount}
        onConfirm={handleConfirm}
        onCancel={() => !busy && setModalVisible(false)}
        loading={busy}
      />

      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        {/* Status Bar on Left */}
        <View style={[styles.leftStatusBar, { backgroundColor: status.text }]} />

        <View style={styles.cardInner}>
          {/* --- Header --- */}
          <TouchableOpacity onPress={toggleExpand} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} style={styles.cardHeader}>
            <LinearGradient colors={AVATAR_GRADIENT} style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(borrower.full_name)}</Text>
            </LinearGradient>

            <View style={styles.headerInfo}>
              <Text style={styles.borrowerName} numberOfLines={1}>{borrower.full_name || "Unknown"}</Text>
              <View style={styles.amountRow}>
                <Ionicons name="wallet-outline" size={12} color={TEXT_GREY} />
                <Text style={styles.amountValue}> {formatCurrency(item.loan_amount)}</Text>
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.text }]}>
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>

            {/* Vibrant Arrow */}
            <Animated.View style={[styles.arrowCircle, { transform: [{ rotate: spin }] }]}>
              <Ionicons name="chevron-down" size={18} color="#fff" />
            </Animated.View>
          </TouchableOpacity>

          {/* --- Expanded Details --- */}
          {expanded && (
            <View style={styles.expandedContainer}>
              {/* Meta Tags */}
              <View style={styles.tagContainer}>
                <View style={styles.tag}>
                  <Ionicons name="call-outline" size={11} color={ACCENT_BLUE} />
                  <Text style={styles.tagText}> {borrower.phone_number || "No Phone"}</Text>
                </View>
                <View style={styles.tag}>
                  <Ionicons name="layers-outline" size={11} color={ACCENT_BLUE} />
                  <Text style={styles.tagText}> {item.loan_purpose || "N/A"}</Text>
                </View>
              </View>

              {isPending ? (
                /* --- Action Buttons --- */
                <View style={styles.actionSection}>
                  <View style={styles.contactRow}>
                    <TouchableOpacity style={styles.iconBtnOutline} onPress={() => openLink("call", borrower.phone_number)}>
                      <Ionicons name="call" size={16} color={SUCCESS} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtnOutline} onPress={() => openLink("whatsapp", borrower.phone_number)}>
                      <FontAwesome5 name="whatsapp" size={16} color={WA_GREEN} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.mainActionBtns}>
                    <TouchableOpacity style={styles.btnFlex} onPress={() => openModal("APPROVED")}>
                      <LinearGradient colors={STATUS_META.APPROVED.gradient} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.actionGradientBtn}>
                        <Ionicons name="checkmark-done" size={16} color="#fff" />
                        <Text style={styles.btnActionText}> Approve</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnFlex} onPress={() => openModal("REJECTED")}>
                      <LinearGradient colors={STATUS_META.REJECTED.gradient} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.actionGradientBtn}>
                        <Ionicons name="close-circle" size={16} color="#fff" />
                        <Text style={styles.btnActionText}> Reject</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* --- Processed Timeline --- */
                <View style={styles.timelineContainer}>
                  {/* Timeline Dot & Line */}
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: status.text }]} />
                    <View style={[styles.timelineLine, { backgroundColor: status.text }]} />
                  </View>

                  {/* Content */}
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={[styles.timelineTitle, { color: status.text }]}>
                        {statusKey === "APPROVED" ? "Approved" : "Rejected"}
                      </Text>
                      <Ionicons name={status.icon} size={18} color={status.text} />
                    </View>

                    {/* Date Card */}
                    <View style={styles.infoCard}>
                      <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={13} color={TEXT_GREY} />
                        <Text style={styles.infoLabelText}>Processed On:</Text>
                        <Text style={styles.infoValueText}>{formatDateTimeIST(item.agent_approval_status_updated_at)}</Text>
                      </View>
                      <View style={[styles.infoRow, { marginTop: 8 }]}>
                        <Ionicons name="chatbox-ellipses-outline" size={13} color={TEXT_GREY} />
                        <Text style={styles.infoLabelText}>Remark:</Text>
                        <Text style={[styles.infoValueText, { flex: 1 }]}>{item.employee_remark || "No remarks added"}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </>
  );
};

// ── Modal Component ──────────────────────────────────────────────────
const ConfirmModal = ({ visible, type, borrowerName, loanAmount, onConfirm, onCancel, loading }) => {
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (visible) {
      setAmount(loanAmount ? String(loanAmount) : "");
      setRemark("");
    }
  }, [visible]);

  const isApprove = type === "APPROVED";
  const theme = isApprove 
    ? { color: SUCCESS, gradient: STATUS_META.APPROVED.gradient, icon: "checkmark-circle", title: "Approve Loan?" } 
    : { color: DANGER, gradient: STATUS_META.REJECTED.gradient, icon: "close-circle", title: "Reject Loan?" };

  const handleSubmit = () => {
    if (isApprove && !amount.trim()) {
      Alert.alert("Missing Info", "Please enter the approved amount.");
      return;
    }
    if (!remark.trim()) {
      Alert.alert("Missing Info", "Please add a remark/reason.");
      return;
    }
    onConfirm(type, amount, remark);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={modalStyles.overlay} onPress={onCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: 'center' }}>
          <Pressable style={modalStyles.container} onPress={() => {}}>
            <ScrollView contentContainerStyle={modalStyles.scrollContent} keyboardShouldPersistTaps="handled">
              {/* Header */}
              <LinearGradient colors={theme.gradient} style={modalStyles.header}>
                <View style={modalStyles.handleBar} />
                <View style={modalStyles.iconCircle}>
                  <Ionicons name={theme.icon} size={28} color="#fff" />
                </View>
                <Text style={modalStyles.headerTitle}>{theme.title}</Text>
              </LinearGradient>

              <View style={modalStyles.body}>
                {/* Borrower Strip */}
                <View style={modalStyles.infoStrip}>
                  <Ionicons name="person-circle-outline" size={18} color={TEXT_GREY} />
                  <Text style={modalStyles.infoText}> {borrowerName}</Text>
                </View>

                {/* Amount Input */}
                <Text style={modalStyles.inputLabel}>{isApprove ? "Final Amount *" : "Requested Amount"}</Text>
                <View style={[modalStyles.inputWrap, !isApprove && { backgroundColor: SUBTLE_BG }]}>
                  <Text style={modalStyles.currencySymbol}>₹</Text>
                  <TextInput
                    style={modalStyles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="number-pad"
                    editable={isApprove}
                  />
                </View>

                {/* Remark Input */}
                <Text style={[modalStyles.inputLabel, { marginTop: 12 }]}>Remark / Reason *</Text>
                <TextInput
                  style={[modalStyles.inputWrap, { height: 80, alignItems: 'flex-start', paddingTop: 10 }]}
                  value={remark}
                  onChangeText={setRemark}
                  multiline
                  placeholder={isApprove ? "Add note..." : "Reason for rejection..."}
                  textAlignVertical="top"
                />

                {/* Buttons */}
                <View style={modalStyles.btnRow}>
                  <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
                    <Text style={modalStyles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSubmit} style={{ flex: 1.5 }}>
                    <LinearGradient colors={theme.gradient} style={modalStyles.confirmBtn}>
                       {loading ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Ionicons name={isApprove ? "checkmark" : "trash"} size={18} color="#fff" />
                          <Text style={modalStyles.confirmBtnText}> {isApprove ? "Approve" : "Reject"}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

// ── Main Screen ───────────────────────────────────────────────────
const ApprovalsScreen = () => {
  const [loans, setLoans] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const stored = await AsyncStorage.getItem("agentInfo");
      if (!stored) throw new Error("Login required.");
      const agentId = JSON.parse(stored)?._id;
      
      const res = await axios.get(`${baseUrl}/v1/mobile/loans/get-borrowers/${agentId}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      setLoans(res.data.data || []);
    } catch (e) {
      if (e.response?.status === 404) {
        setLoans([]); setError(null);
      } else {
        setError(e.response?.data?.message || e.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = useCallback(() => fetchData(true), []);

  const handleStatusChange = useCallback((id, updates) => {
    setLoans(prev => prev.map(l => l._id === id ? { ...l, ...updates } : l));
  }, []);

  const counts = useMemo(() => ({
    ALL: loans.length,
    PENDING: loans.filter(l => (l.agent_approval_status || "PENDING") === "PENDING").length,
    APPROVED: loans.filter(l => l.agent_approval_status === "APPROVED").length,
  }), [loans]);

  const displayed = useMemo(() => {
    let list = loans;
    if (activeTab !== "ALL") list = list.filter(l => (l.agent_approval_status || "PENDING") === activeTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l => 
        l.borrower?.full_name?.toLowerCase().includes(q) || 
        l.borrower?.phone_number?.includes(q)
      );
    }
    return list;
  }, [loans, activeTab, search]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient colors={TOP_GRADIENT} style={styles.headerGradient}>
        <Header />
        <View style={styles.headerBody}>
          <Text style={styles.screenTitle}>Loan Approvals</Text>
          <Text style={styles.screenSubtitle}>Manage and track loan requests</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity 
                key={tab.key} 
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{counts[tab.key]}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={TEXT_GREY} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search name or phone..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={50} color={TEXT_GREY} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={displayed}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT_BLUE]} />}
            renderItem={({ item, index }) => (
              <LoanCard item={item} index={index} onStatusChange={handleStatusChange} />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="file-tray-full-outline" size={60} color={BORDER_COLOR} />
                <Text style={styles.emptyText}>No loans found</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default ApprovalsScreen;

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  
  // Header
  headerGradient: { paddingBottom: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerBody: { paddingHorizontal: 20, marginTop: 10, marginBottom: 15 },
  screenTitle: { fontSize: 24, fontWeight: "900", color: CARD_BG, letterSpacing: 0.3 },
  screenSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  // Tabs
  tabsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  tabActive: { backgroundColor: CARD_BG, borderColor: 'rgba(255,255,255,0.5)' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  tabTextActive: { color: PRIMARY_DARK },
  tabBadge: { marginLeft: 6, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tabBadgeActive: { backgroundColor: ACCENT_BLUE },
  tabBadgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },

  // Content
  contentContainer: { flex: 1, backgroundColor: SUBTLE_BG, marginTop: -15, borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, marginHorizontal: 16, marginTop: 16, marginBottom: 10, paddingHorizontal: 12, height: 46, borderRadius: 14, borderWidth: 1, borderColor: BORDER_COLOR, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  searchInput: { flex: 1, fontSize: 13, color: PRIMARY_DARK, marginLeft: 8 },

  // List
  listContent: { padding: 16, paddingTop: 10 },

  // Card Wrapper
  cardWrapper: { 
    backgroundColor: CARD_BG, borderRadius: 20, marginBottom: 14, 
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
    flexDirection: 'row', overflow: 'hidden'
  },
  leftStatusBar: { width: 5 },
  cardInner: { flex: 1, padding: 14 },
  
  // Card Header
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  headerInfo: { flex: 1, marginLeft: 10, justifyContent: 'center' },
  borrowerName: { fontSize: 15, fontWeight: '800', color: PRIMARY_DARK, textTransform: 'capitalize' },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  amountValue: { fontSize: 13, color: ACCENT_BLUE, fontWeight: '700' },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  
  // Vibrant Arrow
  arrowCircle: { 
    width: 30, height: 30, borderRadius: 15, backgroundColor: ACCENT_BLUE, 
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
    shadowColor: ACCENT_BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4
  },

  // Expanded Content
  expandedContainer: { marginTop: 14 },
  tagContainer: { flexDirection: 'row', marginBottom: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(23,150,209,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 8 },
  tagText: { fontSize: 11, color: PRIMARY_DARK, fontWeight: '600' },

  // Action Buttons
  actionSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  contactRow: { flexDirection: 'row' },
  iconBtnOutline: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: BORDER_COLOR, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  mainActionBtns: { flexDirection: 'row', flex: 1, justifyContent: 'flex-end' },
  btnFlex: { marginLeft: 8, flex: 1, borderRadius: 12, overflow: 'hidden' },
  actionGradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  btnActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Timeline (Processed)
  timelineContainer: { flexDirection: 'row', paddingTop: 4 },
  timelineLeft: { alignItems: 'center', marginRight: 12, width: 15 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff', elevation: 2 },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineContent: { flex: 1 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  timelineTitle: { fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },

  // Info Card inside Timeline
  infoCard: { backgroundColor: SUBTLE_BG, padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: ACCENT_BLUE },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoLabelText: { fontSize: 11, color: TEXT_GREY, fontWeight: '600', marginLeft: 4 },
  infoValueText: { fontSize: 11, color: PRIMARY_DARK, marginLeft: 4, flex: 1 },

  // Utils
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { marginTop: 10, color: TEXT_GREY, textAlign: 'center', fontSize: 12 },
  retryBtn: { marginTop: 16, backgroundColor: ACCENT_BLUE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { marginTop: 10, color: TEXT_GREY, fontSize: 13 },
});

// ── Modal Styles ──────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
  container: { backgroundColor: CARD_BG, marginHorizontal: 20, borderRadius: 24, overflow: 'hidden' },
  scrollContent: { paddingBottom: 20 },
  header: { paddingVertical: 25, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  handleBar: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, position: 'absolute', top: 8 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  body: { padding: 20 },
  infoStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: SUBTLE_BG, padding: 12, borderRadius: 12, marginBottom: 16 },
  infoText: { fontSize: 13, color: PRIMARY_DARK, fontWeight: '600' },
  inputLabel: { fontSize: 11, color: TEXT_GREY, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: SUBTLE_BG, borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: BORDER_COLOR },
  currencySymbol: { fontSize: 16, color: PRIMARY_DARK, fontWeight: 'bold' },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: PRIMARY_DARK, marginLeft: 8 },
  btnRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: SUBTLE_BG, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: TEXT_GREY, fontWeight: '700' },
  confirmBtn: { flexDirection: 'row', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});