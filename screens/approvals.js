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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import baseUrl from "../constants/baseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Design tokens ─────────────────────────────────────────────────
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
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── Helpers ───────────────────────────────────────────────────────
const formatCurrency = (v) => {
  const n = Number(v);
  return isNaN(n) ? "₹0" : "₹" + n.toLocaleString("en-IN");
};
const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
const getInitials = (name = "") => {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase() || "?";
};

const STATUS_META = {
  APPROVED: { bg: "#dcfce7", text: "#15803d", icon: "checkmark-circle", label: "Approved" },
  REJECTED: { bg: "#fee2e2", text: "#b91c1c", icon: "close-circle",     label: "Rejected" },
  PENDING:  { bg: "#fef9c3", text: "#92400e", icon: "time",             label: "Pending"  },
};
const getStatus = (s) => STATUS_META[s] || STATUS_META.PENDING;

const openLink = (type, value) => {
  if (!value) return;
  const url = type === "call"
    ? `tel:${value}`
    : `whatsapp://send?phone=${value.replace(/[^0-9]/g, "")}`;
  Linking.openURL(url).catch(() => Alert.alert("Error", `Cannot open ${type}`));
};

// ── Tabs ─────────────────────────────────────────────────────────
const TABS = [
  { key: "ALL",      label: "All"      },
  { key: "PENDING",  label: "Pending"  },
  { key: "APPROVED", label: "Approved" },
];
const TAB_COLORS = {
  ALL: ACCENT_BLUE, PENDING: WARNING, APPROVED: SUCCESS,
};

// ── UPDATED: Custom Confirmation Modal (Amount Disabled on Reject) ────
const ConfirmModal = ({ 
  visible, 
  type, 
  borrowerName, 
  loanAmount, 
  onConfirm, 
  onCancel, 
  loading 
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  // Local state for inputs
  const [approvedAmount, setApprovedAmount] = useState("");
  const [remark, setRemark] = useState("");

  // Reset inputs when modal opens/closes
  useEffect(() => {
    if (visible) {
      setApprovedAmount(loanAmount ? loanAmount.toString() : ""); // Pre-fill
      setRemark("");
      
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
    }
  }, [visible, loanAmount]);

  const isApprove   = type === "APPROVED";
  const accentColor = isApprove ? SUCCESS : DANGER;
  const lightBg     = isApprove ? "#f0fdf4" : "#fff1f2";
  const iconName    = isApprove ? "checkmark-circle" : "close-circle";
  const title       = isApprove ? "Approve Loan?" : "Reject Loan?";

  const handlePressConfirm = () => {
    // --- DEBUG LOG: INPUTS ---
    console.log("------------------------------------------------");
    console.log(`>>> ACTION TRIGGERED: ${title}`);
    console.log(">>> INPUT VALUES FROM MODAL:");
    console.log("   - Type:", type);
    console.log("   - Approved Amount:", approvedAmount);
    console.log("   - Remark:", remark);
    console.log("------------------------------------------------");

    // If approving, check amount. If rejecting, amount doesn't matter (disabled).
    if (isApprove && !approvedAmount.trim()) {
      Alert.alert("Missing Info", "Please enter the approved amount.");
      return;
    }
    onConfirm(type, approvedAmount, remark);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.modalOverlay} onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.modalOverlay} edges={["bottom"]}>
          {/* Center Container */}
          <View style={styles.modalCenterContainer}>
            <Pressable style={{ width: "100%" }} onPress={onCancel}>
              <Animated.View 
                style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]} 
                onStartShouldSetResponder={() => true} 
              >
                <ScrollView 
                  bounces={false} 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {/* Icon circle */}
                  <View style={[styles.modalIconWrap, { backgroundColor: lightBg }]}>
                    <Ionicons name={iconName} size={40} color={accentColor} />
                  </View>

                  {/* Title */}
                  <Text style={styles.modalTitle}>{title}</Text>

                  {/* Borrower info strip */}
                  <View style={[styles.modalInfoStrip, { borderColor: accentColor + "33", backgroundColor: lightBg }]}>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="person-circle-outline" size={14} color={TEXT_GREY} />
                      <Text style={styles.modalInfoLabel}> Borrower</Text>
                      <Text style={styles.modalInfoValue} numberOfLines={1}>{borrowerName || "—"}</Text>
                    </View>
                    <View style={[styles.modalInfoDivider, { backgroundColor: accentColor + "22" }]} />
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="cash-outline" size={14} color={TEXT_GREY} />
                      <Text style={styles.modalInfoLabel}> Requested</Text>
                      <Text style={[styles.modalInfoValue, { color: TEXT_GREY, fontWeight: "600" }]}>
                        {formatCurrency(loanAmount)}
                      </Text>
                    </View>
                  </View>

                  {/* --- INPUT SECTION --- */}
                  <View style={{ width: "100%", marginTop: 20 }}>
                    {/* Amount Input */}
                    <Text style={styles.inputLabel}>
                      {isApprove ? "Final Approved Amount *" : "Requested Amount (Disabled)"}
                    </Text>
                    <View style={[
                      styles.inputContainer, 
                      { 
                        borderColor: isApprove ? (approvedAmount ? ACCENT_BLUE : BORDER_COLOR) : "#eee",
                        backgroundColor: isApprove ? SUBTLE_BG : "#f9f9f9"
                      }
                    ]}>
                      <Text style={[styles.currencySymbol, { color: isApprove ? PRIMARY_DARK : "#aaa" }]}>₹</Text>
                      <TextInput
                        style={[styles.textInput, { color: isApprove ? PRIMARY_DARK : "#aaa" }]}
                        placeholder="0"
                        placeholderTextColor={TEXT_GREY}
                        value={approvedAmount}
                        onChangeText={setApprovedAmount}
                        keyboardType="number-pad"
                        returnKeyType="next"
                        editable={isApprove} // <--- DISABLED IF REJECTING
                      />
                    </View>

                    {/* Remark Input */}
                    <Text style={[styles.inputLabel, { marginTop: 16 }]}>Remark / Reason *</Text>
                    <TextInput
                      style={[styles.textArea, { borderColor: remark ? ACCENT_BLUE : BORDER_COLOR }]}
                      placeholder={isApprove ? "Add a note (e.g. Verified docs)..." : "Reason for rejection..."}
                      placeholderTextColor={TEXT_GREY}
                      value={remark}
                      onChangeText={setRemark}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Description */}
                  <Text style={styles.modalDesc}>
                    {isApprove
                      ? "Confirming this will notify the borrower."
                      : "This action cannot be undone."}
                  </Text>

                  {/* Buttons */}
                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={onCancel}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <Text style={styles.modalCancelTxt}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalConfirmBtn, { backgroundColor: accentColor }]}
                      onPress={handlePressConfirm}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name={iconName} size={16} color="#fff" />
                          <Text style={styles.modalConfirmTxt}>
                            {isApprove ? "  Approve" : "  Reject"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  {/* Extra padding for bottom safe area */}
                  <View style={{ height: 10 }} />
                </ScrollView>
              </Animated.View>
            </Pressable>
          </View>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
};

// ── Loan Card Component ────────────────────────────────────────────
const LoanCard = React.memo(({ item, index, onStatusChange }) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const [modalVisible, setModalVisible] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true,
    }).start();
  }, []);

  const borrower    = item.borrower || {};
  const status      = getStatus(item.agent_approval_status);
  const isPending   = !item.agent_approval_status || item.agent_approval_status === "PENDING";
  const accentColor = isPending ? WARNING
    : item.agent_approval_status === "APPROVED" ? SUCCESS : DANGER;

  const pressIn  = () => Animated.spring(scale, { toValue: 0.974, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true }).start();

  const openModal = (newStatus) => {
    setPendingStatus(newStatus);
    setModalVisible(true);
  };

  const handleConfirm = async (status, amount, remark) => {
    setBusy(true);
    
    // Payload construction
    const payload = {
      agent_approval_status: status,
      employee_approved_amount: amount, 
      employee_remark: remark          
    };

    // --- DEBUG LOG: API START ---
    console.log("------------------------------------------------");
    console.log(">>> SENDING API REQUEST...");
    console.log(">>> Loan ID:", item._id);
    console.log(">>> ENDPOINT:", `${baseUrl}/v1/mobile/loans/update-borrower-status/${item._id}`);
    console.log(">>> PAYLOAD DATA:", JSON.stringify(payload, null, 2));
    console.log("------------------------------------------------");

    try {
      const res = await axios.put(
        `${baseUrl}/v1/mobile/loans/update-borrower-status/${item._id}`,
        payload
      );
      
      // --- DEBUG LOG: API RESPONSE ---
      console.log(">>> API RESPONSE SUCCESS:", res.data);

      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      
      setModalVisible(false);
      onStatusChange(item._id, status);
    } catch (e) {
      // --- DEBUG LOG: API ERROR ---
      console.error(">>> API ERROR:", e);
      Alert.alert("Error", e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

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

      <Animated.View
        style={{
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
            { scale },
          ],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={styles.card}
        >
          <View style={[styles.cardBar, { backgroundColor: accentColor }]} />

          {/* Header */}
          <View style={styles.cardHead}>
            <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.avatar}>
              <Text style={styles.avatarTxt}>{getInitials(borrower.full_name)}</Text>
            </LinearGradient>
            <View style={styles.headInfo}>
              <Text style={styles.cardName} numberOfLines={1}>
                {borrower.full_name || "Unknown"}
              </Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={10} color={TEXT_GREY} />
                <Text style={styles.phoneText}> {borrower.phone_number || "—"}</Text>
              </View>
            </View>
            <View style={[styles.pill, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon} size={9} color={status.text} />
              <Text style={[styles.pillTxt, { color: status.text }]}> {status.label}</Text>
            </View>
          </View>

          {/* Financial strip */}
          <View style={styles.finStrip}>
            <View style={styles.finCell}>
              <Text style={styles.finLabel}>AMOUNT</Text>
              <Text style={[styles.finValue, { color: SUCCESS }]}>
                {formatCurrency(item.loan_amount)}
              </Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.finCell}>
              <Text style={styles.finLabel}>PURPOSE</Text>
              <Text style={[styles.finValue, { color: PRIMARY_DARK }]} numberOfLines={1}>
                {item.loan_purpose || "—"}
              </Text>
            </View>
            {isPending && (
              <>
                <View style={styles.finDivider} />
                <View style={styles.finCell}>
                  <Text style={styles.finLabel}>REQUESTED</Text>
                  <Text style={[styles.finValue, { color: WARNING }]} numberOfLines={1}>
                    {item.approval_status || "—"}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Actions / Banner */}
          {isPending ? (
            <View style={styles.actionRow}>
              <View style={styles.contactGroup}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => openLink("call", borrower.phone_number)}
                >
                  <Ionicons name="call" size={13} color={SUCCESS} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, { marginLeft: 6 }]}
                  onPress={() => openLink("whatsapp", borrower.phone_number)}
                >
                  <FontAwesome5 name="whatsapp" size={14} color={WA_GREEN} />
                </TouchableOpacity>
              </View>

              <View style={styles.decGroup}>
                <TouchableOpacity
                  style={[styles.decBtn, { backgroundColor: SUCCESS }]}
                  onPress={() => openModal("APPROVED")}
                >
                  <Ionicons name="checkmark-circle" size={12} color="#fff" />
                  <Text style={styles.decTxt}> Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.decBtn, { backgroundColor: DANGER, marginLeft: 7 }]}
                  onPress={() => openModal("REJECTED")}
                >
                  <Ionicons name="close-circle" size={12} color="#fff" />
                  <Text style={styles.decTxt}> Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.banner, {
              backgroundColor: item.agent_approval_status === "APPROVED"
                ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            }]}>
              <Ionicons
                name={item.agent_approval_status === "APPROVED" ? "checkmark-circle" : "close-circle"}
                size={12}
                color={item.agent_approval_status === "APPROVED" ? SUCCESS : DANGER}
              />
              <Text style={[styles.bannerTxt, {
                color: item.agent_approval_status === "APPROVED" ? SUCCESS : DANGER,
              }]}>
                {item.agent_approval_status === "APPROVED"
                  ? "  You approved this loan"
                  : "  You rejected this loan"}
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFoot}>
            <View style={styles.footItem}>
              <Ionicons name="document-text-outline" size={10} color={TEXT_GREY} />
              <Text style={styles.footTxt}> {item.loan_id || "—"}</Text>
            </View>
            <View style={styles.footItem}>
              <Ionicons name="calendar-outline" size={10} color={TEXT_GREY} />
              <Text style={styles.footTxt}> {formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
});

// ── Main Screen ───────────────────────────────────────────────────
const ApprovalsScreen = () => {
  const [loans, setLoans]           = useState([]);
  const [search, setSearch]         = useState("");
  const [activeTab, setActiveTab]   = useState("ALL");
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);

  const fetchData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const stored = await AsyncStorage.getItem("agentInfo");
      if (!stored) throw new Error("No agent info. Please login again.");
      const agentId = JSON.parse(stored)?._id;
      if (!agentId) throw new Error("Agent ID missing.");
      const res = await axios.get(`${baseUrl}/v1/mobile/loans/get-borrowers/${agentId}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Fetch failed.");
      setLoans(res.data.data);
    } catch (e) {
      setError(e.message || "Network error. Please retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(false); }, []);
  const onRefresh = useCallback(() => fetchData(true), []);

  const handleStatusChange = useCallback((id, status) =>
    setLoans((prev) =>
      prev.map((l) => (l._id === id ? { ...l, agent_approval_status: status } : l))
    ), []);

  const counts = useMemo(() => ({
    ALL:      loans.length,
    PENDING:  loans.filter((l) => !l.agent_approval_status || l.agent_approval_status === "PENDING").length,
    APPROVED: loans.filter((l) => l.agent_approval_status === "APPROVED").length,
  }), [loans]);

  const displayed = useMemo(() => {
    let list = loans;
    
    if (activeTab !== "ALL") {
      list = list.filter((l) => (l.agent_approval_status || "PENDING") === activeTab);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        l.borrower?.full_name?.toLowerCase().includes(q) ||
        l.borrower?.phone_number?.includes(q) ||
        l.loan_purpose?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [loans, activeTab, search]);

  const renderCard = useCallback(
    ({ item, index }) => (
      <LoanCard item={item} index={index} onStatusChange={handleStatusChange} />
    ), [handleStatusChange]);

  const keyExtractor = useCallback(
    (item) => item._id?.toString() || Math.random().toString(), []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient colors={TOP_GRADIENT} style={styles.header}>
        <View style={styles.headerTop}><Header /></View>
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>Loan Approvals</Text>
          <Text style={styles.headerSub}>Review and manage borrower requests</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            const color  = TAB_COLORS[tab.key];
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  active
                    ? { backgroundColor: CARD_BG, borderColor: CARD_BG }
                    : { backgroundColor: "rgba(255,255,255,0.13)", borderColor: "rgba(255,255,255,0.2)" },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabCount, { color: active ? color : "#fff" }]}>
                  {counts[tab.key]}
                </Text>
                <Text style={[styles.tabLabel, {
                  color: active ? PRIMARY_DARK : "rgba(255,255,255,0.75)",
                }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
            <Text style={styles.loadTxt}>Syncing data…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={52} color={TEXT_GREY} />
            <Text style={styles.errTxt}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData(false)}>
              <Text style={styles.retryTxt}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listBox}>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color={TEXT_GREY} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, phone or purpose…"
                placeholderTextColor={TEXT_GREY}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={17} color={TEXT_GREY} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={displayed}
              renderItem={renderCard}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={Platform.OS === "android"}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[ACCENT_BLUE]}
                  tintColor={ACCENT_BLUE}
                />
              }
              ListHeaderComponent={
                <Text style={styles.countLabel}>
                  {displayed.length} {displayed.length === 1 ? "request" : "requests"}
                  {search ? ` for "${search}"` : ""}
                </Text>
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons
                    name={search ? "search-outline" : "checkmark-done-circle-outline"}
                    size={56}
                    color={search ? TEXT_GREY : SUCCESS}
                  />
                  <Text style={styles.emptyTitle}>
                    {search ? "No results found" : "Nothing here"}
                  </Text>
                  <Text style={styles.emptySub}>
                    {search
                      ? `No loans match "${search}"`
                      : `No ${activeTab === "ALL" ? "" : activeTab.toLowerCase() + " "}loan requests.`}
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ApprovalsScreen;

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOP_GRADIENT[0] },

  header:      { paddingBottom: 20 },
  headerTop:   { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerBody:  { paddingHorizontal: 20, marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: CARD_BG, letterSpacing: 0.2 },
  headerSub:   { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2, fontWeight: "500" },

  tabsRow: { flexDirection: "row", paddingHorizontal: 14, gap: 8 },
  tab: {
    flex: 1, alignItems: "center",
    paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  tabCount: { fontSize: 15, fontWeight: "800" },
  tabLabel: { fontSize: 9, fontWeight: "600", marginTop: 1, textTransform: "uppercase", letterSpacing: 0.4 },

  body: {
    flex: 1, backgroundColor: SUBTLE_BG,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    marginTop: -14, paddingTop: 14, overflow: "hidden",
  },

  listBox: {
    flex: 1,
    backgroundColor: CARD_BG,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },

  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: SUBTLE_BG,
    borderRadius: 10,
    marginHorizontal: 14, 
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 12, height: 40,
    borderWidth: 1, borderColor: BORDER_COLOR,
  },
  searchInput: { flex: 1, fontSize: 12, color: PRIMARY_DARK, padding: 0 },
  countLabel:  { fontSize: 10, color: TEXT_GREY, fontWeight: "600", marginLeft: 2, marginBottom: 8 },
  listContent: { paddingHorizontal: 14, paddingBottom: 20 }, 

  card: {
    backgroundColor: CARD_BG, borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: BORDER_COLOR,
    elevation: 1, shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3,
    overflow: "hidden",
  },
  cardBar: { height: 3 },

  cardHead: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 11, paddingTop: 10, paddingBottom: 7,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center", marginRight: 9,
  },
  avatarTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },
  headInfo:  { flex: 1 },
  cardName:  { fontSize: 13, fontWeight: "700", color: PRIMARY_DARK },
  phoneRow:  { flexDirection: "row", alignItems: "center", marginTop: 1 },
  phoneText: { fontSize: 10, color: TEXT_GREY, fontWeight: "500" },
  pill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, marginLeft: 6,
  },
  pillTxt: { fontSize: 8, fontWeight: "800", letterSpacing: 0.3 },

  finStrip: {
    flexDirection: "row", paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: "rgba(23,150,209,0.05)",
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: "rgba(23,150,209,0.1)",
  },
  finCell:    { flex: 1, alignItems: "center" },
  finDivider: { width: 1, backgroundColor: "rgba(23,150,209,0.15)", alignSelf: "center", height: "65%" },
  finLabel:   { fontSize: 7, color: TEXT_GREY, fontWeight: "700", letterSpacing: 0.6, marginBottom: 2 },
  finValue:   { fontSize: 11, fontWeight: "800" },

  actionRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 11, paddingVertical: 8,
  },
  contactGroup: { flexDirection: "row" },
  iconBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center", alignItems: "center",
  },
  decGroup: { flexDirection: "row" },
  decBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 9, elevation: 2,
  },
  decTxt: { color: "#fff", fontWeight: "700", fontSize: 11 },

  banner: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 11, marginVertical: 7,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  bannerTxt: { fontSize: 10, fontWeight: "700" },

  cardFoot: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 12, paddingTop: 4, paddingBottom: 9,
  },
  footItem: { flexDirection: "row", alignItems: "center" },
  footTxt:  { fontSize: 9, color: TEXT_GREY, fontWeight: "600" },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,20,40,0.65)",
  },
  modalCenterContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
  },
  modalScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 19, fontWeight: "800", color: PRIMARY_DARK,
    marginBottom: 10, letterSpacing: 0.2, textAlign: "center",
  },
  modalInfoStrip: {
    width: "100%", borderRadius: 12,
    borderWidth: 1, overflow: "hidden",
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 9,
  },
  modalInfoLabel: {
    fontSize: 12, color: TEXT_GREY, fontWeight: "600", flex: 1,
  },
  modalInfoValue: {
    fontSize: 12, color: PRIMARY_DARK, fontWeight: "600",
    maxWidth: "50%", textAlign: "right",
  },
  modalInfoDivider: { height: 1, marginHorizontal: 14 },
  modalDesc: {
    fontSize: 12, color: TEXT_GREY, textAlign: "center",
    lineHeight: 18, marginBottom: 20, paddingHorizontal: 4, marginTop: 4,
  },
  modalBtnRow: {
    flexDirection: "row", width: "100%", gap: 12,
  },
  modalCancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER_COLOR,
    alignItems: "center", justifyContent: "center",
    backgroundColor: SUBTLE_BG,
  },
  modalCancelTxt: {
    fontSize: 13, fontWeight: "700", color: TEXT_GREY,
  },
  modalConfirmBtn: {
    flex: 1.5, flexDirection: "row",
    paddingVertical: 13, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6,
  },
  modalConfirmTxt: {
    fontSize: 13, fontWeight: "800", color: "#fff", letterSpacing: 0.2,
  },
  
  // --- Input Styles ---
  inputLabel: {
    fontSize: 11, 
    fontWeight: "700", 
    color: TEXT_GREY, 
    marginLeft: 2, 
    marginBottom: 4,
    textAlign: "left",
    alignSelf: "flex-start",
    width: "100%"
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    width: "100%"
  },
  currencySymbol: {
    fontSize: 18, 
    fontWeight: "700", 
    marginRight: 8,
  },
  textInput: {
    flex: 1, 
    fontSize: 16, 
    fontWeight: "600", 
    padding: 0,
  },
  textArea: {
    width: "100%",
    borderWidth: 1.2,
    borderRadius: 10,
    backgroundColor: SUBTLE_BG,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: PRIMARY_DARK,
    minHeight: 70,
    textAlignVertical: 'top'
  },

  center:   { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  loadTxt:  { marginTop: 12, color: TEXT_GREY, fontSize: 12, fontWeight: "600" },
  errTxt:   { marginTop: 12, color: TEXT_GREY, fontSize: 12, textAlign: "center" },
  retryBtn: {
    marginTop: 16, backgroundColor: ACCENT_BLUE,
    paddingVertical: 9, paddingHorizontal: 24,
    borderRadius: 22, elevation: 3,
  },
  retryTxt:   { color: "#fff", fontWeight: "800", letterSpacing: 0.8, fontSize: 12 },
  empty:      { alignItems: "center", marginTop: 50, paddingVertical: 30 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: PRIMARY_DARK, marginTop: 14 },
  emptySub:   { fontSize: 11, color: TEXT_GREY, marginTop: 5, textAlign: "center" }
});