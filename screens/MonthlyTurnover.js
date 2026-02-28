import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Linking,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import baseUrl from "../constants/baseUrl";

const { width, height } = Dimensions.get("window");

// --- THEME CONSTANTS ---
const TOP_GRADIENT = ["#24C6DC", "#183A5D"];
const MODERN_PRIMARY = "#0d0d0dff";
const ACCENT_BLUE = "#24C6DC";
const ACCENT_GREEN = "#0c704f";
const WARNING_RED = "#EF4444";
const NEUTRAL_GREY = "#8e95a4";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f7f9fc";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- ANIMATION COMPONENTS ---
const FadeInView = ({ children, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

const ShimmerLoader = ({ style }) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = shimmerValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[style, { opacity }]} />;
};

const handleCall = (phoneNumber) => {
  if (!phoneNumber) return;
  Linking.openURL("tel:" + phoneNumber);
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "0";
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

// ─── KEY FIX: fetch balance for one enrollment ───────────────────────────────
const fetchEnrollmentBalance = async (enrollmentId) => {
  const balanceUrl =
    "https://mychits.online/api/enroll/" + enrollmentId + "/amount-to-be-paid";
  try {
    console.log("BALANCE_CALL => " + balanceUrl);
    const res = await axios.get(balanceUrl);
    const raw = res.data;
    console.log(
      "BALANCE_RAW [" + enrollmentId + "] => " + JSON.stringify(raw)
    );
    // Handle all possible response shapes
    let balance = null;
    if (raw?.data?.[0]?.balance !== undefined)      balance = raw.data[0].balance;
    else if (raw?.data?.balance !== undefined)       balance = raw.data.balance;
    else if (raw?.balance !== undefined)             balance = raw.balance;
    else if (Array.isArray(raw) && raw[0]?.balance !== undefined) balance = raw[0].balance;
    console.log("BALANCE_PARSED [" + enrollmentId + "] => " + balance);
    return balance;
  } catch (err) {
    const status = err?.response?.status;
    const body   = JSON.stringify(err?.response?.data);
    console.error(
      "BALANCE_ERROR [" + enrollmentId + "] status=" + status + " msg=" + err.message + " body=" + body
    );
    return null;
  }
};
// ─────────────────────────────────────────────────────────────────────────────

const MonthlyTurnover = () => {
  const [turnoverData, setTurnoverData]   = useState(null);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedDate, setSelectedDate]   = useState(new Date());
  const [showPicker, setShowPicker]       = useState(false);
  const [formattedDate, setFormattedDate] = useState(moment().format("MMMM YYYY"));
  const [searchText, setSearchText]       = useState("");
  // enrollmentId -> balance  (null = fetch failed, undefined key = not yet fetched)
  const [balanceMap, setBalanceMap]       = useState({});

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedDate]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);
      setBalanceMap({});

      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) { setError("Session expired."); setLoading(false); return; }
      const user    = JSON.parse(userJson);
      const agentId = user?.userId;
      if (!agentId) { setError("No agentId found."); setLoading(false); return; }

      const year  = moment(selectedDate).year();
      const month = moment(selectedDate).month() + 1;
      const apiUrl =
        baseUrl + "/user/agent-monthly-turnover-by-id/" + agentId +
        "?year=" + year + "&month=" + month;

      console.log("TURNOVER_CALL => " + apiUrl);
      const response = await axios.get(apiUrl);

      if (response.data?.success) {
        const payingCustomers = response.data.agentData?.payingCustomers || [];

        console.log("TURNOVER total customers => " + payingCustomers.length);
        // Log _id (enrollmentId) of every customer so we can verify
        payingCustomers.forEach((c, i) => {
          console.log(
            "[" + (i + 1) + "] " + (c.user_id?.full_name || "Unknown") +
            " | _id(enrollmentId)=" + c._id +
            " | monthlyPaid=" + c.monthlyPaid +
            " | totalPaid=" + c.totalPaid +
            " | installment=" + c.monthly_installment
          );
        });

        setTurnoverData(response.data.agentData);

        const customersWithStatus = payingCustomers.map((c) => {
          const monthlyPaid        = parseFloat(c.monthlyPaid       || 0);
          const totalPaid          = parseFloat(c.totalPaid         || 0);
          const monthlyInstallment = parseFloat(c.monthly_installment || 0);
          const overallPaid        = parseFloat(c.paid_amount       || 0);
          const totalTicketValue   = parseFloat(c.total_amount      || 0);

          let lastPaymentDate = "N/A";
          if (c.payments && c.payments.length > 0) {
            const latestDate = c.payments
              .map((p) => p.pay_date)
              .filter(Boolean)
              .sort((a, b) => new Date(b) - new Date(a))[0];
            if (latestDate) lastPaymentDate = moment(latestDate).format("DD MMM");
          }

          return {
            ...c,
            enrollmentId:  c._id,   // <── the field used for the balance API
            paymentStatus: monthlyPaid >= monthlyInstallment ? "PAID" : "UNPAID",
            lastPaymentDate,
            monthlyPaid,
            overallPaid,
            totalPaid,
            totalBalance: totalTicketValue - overallPaid,
          };
        });

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCustomersData(customersWithStatus);

        // Fire balance fetches AFTER customers are set — do NOT await so UI shows immediately
        fetchAllBalances(customersWithStatus);
      } else {
        setError(response.data?.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("TURNOVER_ERROR => " + err.message);
      setError("Error fetching agent details.");
    } finally {
      setLoading(false);
    }
  };

  // ─── KEY FIX: fetch all balances in parallel, set state ONCE ────────────────
  const fetchAllBalances = async (customers) => {
    const valid = customers.filter((c) => !!c.enrollmentId);
    console.log(
      "BALANCE_BATCH => total=" + customers.length + " valid=" + valid.length
    );
    if (valid.length === 0) {
      console.warn("BALANCE_BATCH => 0 valid enrollmentIds! Check c._id field.");
      return;
    }

    // Run all fetches in parallel
    const settled = await Promise.allSettled(
      valid.map(async (c) => {
        const bal = await fetchEnrollmentBalance(c.enrollmentId);
        return { enrollmentId: c.enrollmentId, balance: bal };
      })
    );

    // Collect into a single plain object then do ONE setState call
    const map = {};
    settled.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        const { enrollmentId, balance } = result.value;
        map[enrollmentId] = balance;
      }
    });

    console.log(
      "BALANCE_BATCH DONE => fetched=" + Object.keys(map).length +
      " map=" + JSON.stringify(map)
    );
    setBalanceMap(map); // single atomic update — no stale closure issues
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const onDateChange = (_event, newDate) => {
    setShowPicker(false);
    if (newDate) {
      const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setSelectedDate(firstDay);
      setFormattedDate(moment(firstDay).format("MMMM YYYY"));
    }
  };

  // --- SKELETON ---
  const renderSkeleton = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
      <ShimmerLoader style={{ width: "60%", height: 28, borderRadius: 12, backgroundColor: "#e0e0e0", marginBottom: 20 }} />
      <ShimmerLoader style={{ width: "100%", height: 180, borderRadius: 24, backgroundColor: "#e0e0e0", marginBottom: 25 }} />
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.cardHeader}>
            <ShimmerLoader style={{ width: 80, height: 16, borderRadius: 6, backgroundColor: "#e0e0e0" }} />
            <ShimmerLoader style={{ width: 60, height: 22, borderRadius: 12, backgroundColor: "#e0e0e0" }} />
          </View>
          <View style={styles.cardInfo}>
            <ShimmerLoader style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#e0e0e0" }} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <ShimmerLoader style={{ width: "60%", height: 18, borderRadius: 6, marginBottom: 6, backgroundColor: "#e0e0e0" }} />
              <ShimmerLoader style={{ width: "40%", height: 14, borderRadius: 6, backgroundColor: "#e0e0e0" }} />
            </View>
          </View>
          <View style={styles.statsRow}>
            {[1, 2, 3, 4].map((j) => (
              <ShimmerLoader key={j} style={{ flex: 1, height: 50, borderRadius: 12, marginRight: j < 4 ? 8 : 0, backgroundColor: "#e0e0e0" }} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderTurnoverCard = () => (
    <FadeInView>
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>Monthly Turnover</Text>
        <Text style={styles.screenSubtitle}>Track your monthly collection progress</Text>
      </View>

      <TouchableOpacity style={styles.dateSelectorCard} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
        <View style={styles.dateIconBox}>
          <Ionicons name="calendar" size={22} color={ACCENT_BLUE} />
        </View>
        <View style={styles.dateTextContainer}>
          <Text style={styles.dateSelectorLabel}>Selected Period</Text>
          <Text style={styles.dateSelectorValue}>{formattedDate}</Text>
        </View>
        <View style={styles.dateArrowBox}>
          <Ionicons name="chevron-down" size={20} color={NEUTRAL_GREY} />
        </View>
      </TouchableOpacity>

      <View style={styles.heroCard}>
        <LinearGradient colors={["#183A5D", "#24C6DC"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>EXPECTED</Text>
              <Text style={styles.heroAmountText}>{"₹ " + formatCurrency(turnoverData?.expectedTurnover)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.heroLabel}>COLLECTED</Text>
              <Text style={[styles.heroAmountText, { color: "#34D399" }]}>{"₹ " + formatCurrency(turnoverData?.totalTurnover)}</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <View style={styles.statItem}>
              <View style={styles.iconBgLight}>
                <Ionicons name="people" size={14} color="#fff" />
              </View>
              <Text style={styles.statText}>{turnoverData?.totalCustomers} Customers</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.iconBgLight}>
                <FontAwesome5 name="user-tie" size={12} color="#fff" />
              </View>
              <Text style={styles.statText}>{turnoverData?.agentName}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {customersData.length > 0 && (
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color={NEUTRAL_GREY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer or group..."
            placeholderTextColor={NEUTRAL_GREY}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color={NEUTRAL_GREY} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </FadeInView>
  );

  const renderCustomerCard = ({ item, index }) => {
    const isPaid        = item.paymentStatus === "PAID";
    const statusColor   = isPaid ? ACCENT_GREEN : WARNING_RED;
    const statusBg      = isPaid ? "rgba(12,112,79,0.1)" : "rgba(239,68,68,0.1)";
    const customerPhone = item.user_id?.phone_number;
    const customerName  = item.user_id?.full_name || "Unknown";
    const groupName     = item.group_id?.group_name || "Group";

    const enrollmentId  = item.enrollmentId;
    // undefined key  => still loading  |  null => fetch failed  |  number => got it
    const balanceVal    = balanceMap[enrollmentId];
    const balanceReady  = enrollmentId !== undefined && balanceVal !== undefined;

    return (
      <FadeInView delay={index * 50}>
        <View style={styles.customerCard}>
          {/* ── Header ── */}
          <View style={styles.cardHeader}>
            <View style={styles.groupRow}>
              <Ionicons name="pricetag-outline" size={14} color={ACCENT_BLUE} />
              <Text style={styles.groupNameText}>{groupName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Ionicons name={isPaid ? "checkmark-circle" : "alert-circle"} size={14} color={statusColor} />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{item.paymentStatus}</Text>
            </View>
          </View>

          {/* ── Body ── */}
          <View style={styles.cardBody}>
            <LinearGradient colors={TOP_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>{customerName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.nameSection}>
              <Text style={styles.customerName}>{customerName}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.ticketText}>Ticket  {item.ticket}</Text>
                {customerPhone && (
                  <TouchableOpacity onPress={() => handleCall(customerPhone)} style={styles.callBtn}>
                    <Ionicons name="call" size={12} color={ACCENT_BLUE} />
                    <Text style={styles.callText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* ── Stats Footer: Installment | Paid(Month) | Total Paid | Balance ── */}
          <View style={styles.statsFooter}>
            <View style={[styles.statBlock, { borderRightColor: "#f0f0f0" }]}>
              <Text style={styles.statLabel}>Installment</Text>
              <Text style={styles.statValue}>{"₹" + formatCurrency(item.monthly_installment)}</Text>
            </View>

            <View style={[styles.statBlock, { borderRightColor: "#f0f0f0" }]}>
              <Text style={styles.statLabel}>Paid (Month)</Text>
              <Text style={[styles.statValue, { color: isPaid ? ACCENT_GREEN : WARNING_RED }]}>
                {"₹" + formatCurrency(item.monthlyPaid)}
              </Text>
            </View>

            <View style={[styles.statBlock, { borderRightColor: "#f0f0f0" }]}>
              <Text style={styles.statLabel}>Total Paid</Text>
              <Text style={[styles.statValue, { color: MODERN_PRIMARY }]}>
                {"₹" + formatCurrency(item.totalPaid)}
              </Text>
            </View>

            {/* Balance from new route */}
            <View style={[styles.statBlock, { borderRightWidth: 0 }]}>
              <Text style={styles.statLabel}>Balance</Text>
              {!balanceReady ? (
                <ActivityIndicator size="small" color={ACCENT_BLUE} style={{ marginTop: 4 }} />
              ) : balanceVal === null ? (
                <Text style={[styles.statValue, { color: NEUTRAL_GREY, fontSize: 11 }]}>—</Text>
              ) : (
                <Text style={[styles.statValue, { color: WARNING_RED }]}>
                  {"₹" + formatCurrency(balanceVal)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </FadeInView>
    );
  };

  const filteredCustomers = customersData.filter((c) => {
    const term      = searchText.toLowerCase();
    const fullName  = c.user_id?.full_name?.toLowerCase() || "";
    const groupName = c.group_id?.group_name?.toLowerCase() || "";
    return fullName.includes(term) || groupName.includes(term);
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={TOP_GRADIENT} style={styles.headerBg}>
        <Header />
      </LinearGradient>

      <View style={styles.contentContainer}>
        {loading ? (
          renderSkeleton()
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={40} color={NEUTRAL_GREY} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchMonthlyData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerCard}
            keyExtractor={(_, i) => i.toString()}
            ListHeaderComponent={renderTurnoverCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyBox}>
                <Ionicons name="file-tray-outline" size={50} color="#ccc" />
                <Text style={styles.emptyTitle}>No Customers Found</Text>
                <Text style={styles.emptySub}>Try adjusting your month filter.</Text>
              </View>
            )}
          />
        )}
      </View>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "calendar"}
          onChange={onDateChange}
        />
      )}
    </SafeAreaView>
  );
};

export default MonthlyTurnover;

const styles = StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: TOP_GRADIENT[1] },
  headerBg:         { paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: "hidden" },
  contentContainer: { flex: 1, backgroundColor: SUBTLE_BG_GREY, marginTop: 5 },
  listContent:      { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 24 },

  headerSection:      { marginBottom: 20 },
  screenTitle:        { fontSize: 28, fontWeight: "800", color: MODERN_PRIMARY, letterSpacing: -0.5 },
  screenSubtitle:     { fontSize: 14, color: NEUTRAL_GREY, marginTop: 4, fontWeight: "500" },

  dateSelectorCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG,
    borderRadius: 16, padding: 12, marginBottom: 20, elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  dateIconBox:       { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(36,198,220,0.1)", justifyContent: "center", alignItems: "center" },
  dateTextContainer: { flex: 1, marginLeft: 14, justifyContent: "center" },
  dateSelectorLabel: { fontSize: 11, color: NEUTRAL_GREY, textTransform: "uppercase", fontWeight: "700", letterSpacing: 0.5 },
  dateSelectorValue: { fontSize: 18, color: MODERN_PRIMARY, fontWeight: "700", marginTop: 2 },
  dateArrowBox:      { width: 36, height: 36, borderRadius: 12, backgroundColor: SUBTLE_BG_GREY, justifyContent: "center", alignItems: "center" },

  heroCard:       { marginBottom: 24, borderRadius: 24, overflow: "hidden", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  heroGradient:   { padding: 22 },
  heroTop:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroDivider:    { width: 1, height: 50, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 15 },
  heroLabel:      { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  heroAmountText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  heroBottom:     { flexDirection: "row", justifyContent: "space-between", marginTop: 25, paddingTop: 18, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)" },
  statItem:       { flexDirection: "row", alignItems: "center" },
  iconBgLight:    { backgroundColor: "rgba(255,255,255,0.2)", padding: 6, borderRadius: 8, marginRight: 8 },
  statText:       { color: "#fff", fontWeight: "600", fontSize: 13 },

  searchWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG,
    borderRadius: 16, paddingHorizontal: 16, height: 54, marginBottom: 24,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: MODERN_PRIMARY, fontWeight: "500" },

  skeletonCard: {
    backgroundColor: CARD_BG, borderRadius: 20, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardInfo:   { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  statsRow:   { flexDirection: "row", justifyContent: "space-between" },

  customerCard: {
    backgroundColor: CARD_BG, borderRadius: 20, marginBottom: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
    elevation: 3, borderWidth: 1, borderColor: "rgba(0,0,0,0.02)",
  },

  groupRow:       { flexDirection: "row", alignItems: "center" },
  groupNameText:  { marginLeft: 6, fontSize: 12, fontWeight: "700", color: ACCENT_BLUE, textTransform: "uppercase", letterSpacing: 0.5 },
  statusBadge:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText:{ marginLeft: 4, fontSize: 11, fontWeight: "800" },

  cardBody: {
    flexDirection: "row", alignItems: "center",
    marginVertical: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  avatarGradient: {
    width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center",
    marginRight: 14, elevation: 3, shadowColor: ACCENT_BLUE,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  avatarText:   { color: "#fff", fontSize: 22, fontWeight: "800" },
  nameSection:  { flex: 1, justifyContent: "center" },
  customerName: { fontSize: 18, fontWeight: "700", color: MODERN_PRIMARY, marginBottom: 6, letterSpacing: -0.3 },
  metaRow:      { flexDirection: "row", alignItems: "center" },
  ticketText:   { fontSize: 12, color: NEUTRAL_GREY, fontWeight: "600", marginRight: 12 },
  callBtn:      { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(36,198,220,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  callText:     { marginLeft: 4, fontSize: 11, color: ACCENT_BLUE, fontWeight: "700" },

  statsFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  statBlock:   { flex: 1, alignItems: "center", borderRightWidth: 1, paddingVertical: 4 },
  statLabel:   { fontSize: 10, color: NEUTRAL_GREY, marginBottom: 4, textTransform: "uppercase", fontWeight: "600", letterSpacing: 0.2 },
  statValue:   { fontSize: 12, fontWeight: "800", color: MODERN_PRIMARY },

  errorBox:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText:  { marginTop: 10, color: NEUTRAL_GREY, fontSize: 16, textAlign: "center" },
  retryBtn:   { marginTop: 15, backgroundColor: ACCENT_BLUE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText:  { color: "#fff", fontWeight: "700" },
  emptyBox:   { alignItems: "center", marginTop: 50, padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: MODERN_PRIMARY, marginTop: 10 },
  emptySub:   { color: NEUTRAL_GREY, marginTop: 5 },
});