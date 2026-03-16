
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Image,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import baseUrl from "../constants/baseUrl";

const { width } = Dimensions.get("window");

// ─── PROJECT COLORS (unchanged) ──────────────────────────────────────────────
const COLORS = {
  primary:    "#183A5D",
  accent:     "#f8c009",
  bgBlue:     "#1aa2cc",
  success:    "#27AE60",
  cardBg:     "rgba(255, 255, 255, 0.98)",
  white:      "#FFFFFF",
  muted:      "#8898AA",
  background: "#0f2a44",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const capitalize  = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");
const normalizeKey = (name) => name?.toLowerCase().replace(/\s+/g, "") ?? "";

// ─── CHIP CONFIGS ─────────────────────────────────────────────────────────────
const PAYMENT_FOR_CONFIG = {
  Chit:  { icon: "cash-outline",        color: COLORS.bgBlue,  bg: "rgba(26,162,204,0.13)",  label: "Chit"  },
  Loan:  { icon: "wallet-outline",      color: COLORS.accent,  bg: "rgba(248,192,9,0.13)",   label: "Loan"  },
  Pigme: { icon: "trending-up-outline", color: COLORS.success, bg: "rgba(39,174,96,0.13)",   label: "Pigme" },
};

const PAYMENT_TYPE_CONFIG = {
  cash:        { icon: "cash-outline",             color: COLORS.success, bg: "rgba(39,174,96,0.13)",   label: "Cash"     },
  online:      { icon: "phone-portrait-outline",   color: COLORS.bgBlue,  bg: "rgba(26,162,204,0.13)",  label: "Online"   },
  paymentlink: { icon: "link-outline",             color: COLORS.accent,  bg: "rgba(248,192,9,0.13)",   label: "Pay Link" },
};

const CARD_CONFIG = [
  {
    name: "Chits Payments",
    icon: "cash-outline",
    route: "ChitPayment",
    areaId: "chits",
    color: COLORS.bgBlue,
    iconBg: "rgba(26,162,204,0.15)",
  },
  {
    name: "Loan Payments",
    icon: "wallet-outline",
    route: "LoanPayments",
    areaId: "loans",
    color: COLORS.accent,
    iconBg: "rgba(248,192,9,0.15)",
  },
  {
    name: "Pigme Payments",
    icon: "trending-up-outline",
    route: "PigmePayments",
    areaId: "pigmy",
    color: COLORS.success,
    iconBg: "rgba(39,174,96,0.15)",
  },
];

// ─── ANIMATED ENTRANCE ────────────────────────────────────────────────────────
const AnimatedRow = ({ children, delay = 0 }) => {
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.spring(translateY, { toValue: 0, tension: 60, friction: 11, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// ─── BREAKDOWN CHIP ───────────────────────────────────────────────────────────
const BreakdownChip = ({ name, total, configMap }) => {
  const key = normalizeKey(name);
  const cfg = configMap[key] ?? configMap[name] ?? {
    icon: "card-outline", color: COLORS.bgBlue,
    bg: "rgba(26,162,204,0.13)", label: capitalize(name),
  };
  return (
    <View style={[styles.chip, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: cfg.color + "40", borderWidth: 1 }]}>
      <View style={[styles.chipIconWrap, { backgroundColor: cfg.color }]}>
        <Ionicons name={cfg.icon} size={11} color="#FFFFFF" />
      </View>
      <View>
        <Text style={styles.chipLabel}>
          {cfg.label ?? capitalize(name)}
        </Text>
        <Text style={styles.chipAmount}>
          ₹{total?.toLocaleString("en-IN") ?? "0"}
        </Text>
      </View>
    </View>
  );
};

// ─── SUMMARY CARD ─────────────────────────────────────────────────────────────
const SummaryCard = ({ totalPayments, paymentsFor, paymentTypes, loading }) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    // BRIGHT GRADIENT BACKGROUND
    <LinearGradient
      colors={["#4FACFE", "#00F2FE"]} // Bright Blue to Cyan
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.summaryCard}
    >
      {/* Header row */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryHeaderLeft}>
          <View style={[styles.calendarIconBg, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Ionicons name="wallet" size={18} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.summaryMicroLabel}>TOTAL COLLECTED</Text>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.white}
                style={{ marginTop: 1, alignSelf: "flex-start" }}
              />
            ) : (
              <Text style={styles.summaryAmount}>
                ₹{totalPayments != null ? totalPayments.toLocaleString("en-IN") : "—"}
              </Text>
            )}
          </View>
        </View>

        {/* Live pulse */}
        <Animated.View style={[styles.liveDot, { opacity: blinkAnim, backgroundColor: '#FFFFFF' }]} />
      </View>

      {!loading && (paymentsFor?.length > 0 || paymentTypes?.length > 0) && (
        <View style={styles.summaryDivider} />
      )}

      {!loading && (
        <>
          {/* By Category */}
          {paymentsFor?.length > 0 && (
            <View style={styles.chipSection}>
              <View style={styles.chipSectionRow}>
                <View style={[styles.chipSectionPip, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
                <Text style={styles.chipSectionLabel}>BY CATEGORY</Text>
              </View>
              <View style={styles.chipRow}>
                {paymentsFor.map((pt, i) => (
                  <BreakdownChip key={i} name={pt.name} total={pt.total} configMap={PAYMENT_FOR_CONFIG} />
                ))}
              </View>
            </View>
          )}

          {/* By Mode */}
          {paymentTypes?.length > 0 && (
            <View style={styles.chipSection}>
              <View style={styles.chipSectionRow}>
                <View style={[styles.chipSectionPip, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
                <Text style={styles.chipSectionLabel}>BY MODE</Text>
              </View>
              <View style={styles.chipRow}>
                {paymentTypes.map((pt, i) => (
                  <BreakdownChip key={i} name={pt.name} total={pt.total} configMap={PAYMENT_TYPE_CONFIG} />
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </LinearGradient>
  );
};

// ─── PAYMENT CARD ─────────────────────────────────────────────────────────────
const PaymentCard = ({ name, icon, color, iconBg, onPress }) => {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.payCard}
      >
        {/* Left accent bar */}
        <View style={[styles.payCardBar, { backgroundColor: color }]} />

        {/* Icon */}
        <View style={[styles.payCardIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>

        {/* Text */}
        <View style={styles.payCardText}>
          <Text style={styles.payCardName}>{name}</Text>
          <Text style={styles.payCardSub}>View Payment History</Text>
        </View>

        {/* Arrow */}
        <View style={[styles.payCardArrow, { backgroundColor: color + "18" }]}>
          <Feather name="arrow-right" size={16} color={color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── SCREEN ───────────────────────────────────────────────────────────────────
const PaymentList = ({ route, navigation }) => {
  const { user } = route.params;

  const [selectedDate,   setSelectedDate]   = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [summaryData,    setSummaryData]    = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState(null);

  const blinkAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchDaybookSummary = useCallback(async (date, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const agentStr  = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const agentId   = agentInfo?._id;

      if (!agentId) { setError("Login required. Please log in again."); return; }

      const dateStr = formatDate(date);
      const url = `${baseUrl}/payment-collection-settlement/daybook-summary/agents/${agentId}?startDate=${dateStr}&endDate=${dateStr}`;

      const res  = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSummaryData(json?.data ?? null);
    } catch {
      setError("Failed to load summary. Pull down to retry.");
      setSummaryData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDaybookSummary(selectedDate); }, [selectedDate]);

  const onDateChange = (_, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["rgba(26,162,204,0.92)", COLORS.primary, COLORS.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Image source={require("../assets/hero1.jpg")} style={styles.heroThumb} />
            </View>
          </View>

          <Text style={styles.headerTitle}>Payments</Text>
          <Text style={styles.headerSubTitle}>Daily collection overview</Text>

          {/* Date pill */}
          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.9}
          >
            <View style={styles.dateInfo}>
              <View style={styles.calendarIconBg}>
                <Ionicons name="calendar" size={16} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.dateLabel}>SELECTED DATE</Text>
                <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
              </View>
            </View>
            <Animated.View style={{ opacity: blinkAnim }}>
              <View style={styles.editIconBg}>
                <Feather name="edit-3" size={13} color={COLORS.primary} />
              </View>
            </Animated.View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}
        </View>

        {/* ── CONTENT ── */}
        <View style={styles.contentContainer}>
          {loading && !refreshing ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading summary...</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchDaybookSummary(selectedDate, true)}
                  tintColor={COLORS.accent}
                  colors={[COLORS.accent]}
                />
              }
            >
              {/* Error */}
              {error && (
                <AnimatedRow delay={0}>
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#e74c3c" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                </AnimatedRow>
              )}

              {/* Summary Card */}
              <AnimatedRow delay={60}>
                <SummaryCard
                  totalPayments={summaryData?.total_payments}
                  paymentsFor={summaryData?.payments_for}
                  paymentTypes={summaryData?.payment_types}
                  loading={loading}
                />
              </AnimatedRow>

              {/* Section heading */}
              <AnimatedRow delay={140}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Payment Types</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{CARD_CONFIG.length}</Text>
                  </View>
                </View>
              </AnimatedRow>

              {/* Payment Cards */}
              {CARD_CONFIG.map((card, i) => (
                <AnimatedRow key={card.name} delay={200 + i * 70}>
                  <PaymentCard
                    name={card.name}
                    icon={card.icon}
                    color={card.color}
                    iconBg={card.iconBg}
                    onPress={() => navigation.navigate(card.route, { user, areaId: card.areaId })}
                  />
                </AnimatedRow>
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.primary },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 14 : 6,
    paddingBottom: 16,
  },

  heroThumb: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  iconCircle: {
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 12,
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.white,
    textAlign: "center",
    marginTop: -10,
  },
  headerSubTitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 14,
  },

  // Date card
  dateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  dateInfo:       { flexDirection: "row", alignItems: "center" },
  calendarIconBg: { backgroundColor: COLORS.bgBlue, padding: 8, borderRadius: 10, marginRight: 12 },
  dateLabel:      { fontSize: 10, color: COLORS.muted, fontWeight: "800", letterSpacing: 1 },
  dateText:       { fontSize: 17, fontWeight: "900", color: COLORS.primary },
  editIconBg:     { backgroundColor: "#F5F7FA", padding: 8, borderRadius: 10 },

  // ── Content ──
  contentContainer: { paddingHorizontal: 16, flex: 1 },
  loaderContainer:  { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText:      { color: COLORS.white, marginTop: 10, fontWeight: "600", opacity: 0.8 },

  // ── Summary Card (UPDATED STYLES) ──
  summaryCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryMicroLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.9)", // White with opacity
    fontWeight: "800",
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.white, // Bright White
    marginTop: -6,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)", // White transparent divider
    marginVertical: 14,
  },

  chipSection: { marginBottom: 10 },
  chipSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 1,
  },
  chipSectionPip: {
    width: 14,
    height: 3,
    borderRadius: 2,
  },
  chipSectionLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)", // White
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    flex: 1,
    minWidth: 80,
    // Background is now set dynamically in BreakdownChip component for glass effect
  },
  chipIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  chipLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#FFFFFF", // White text
  },
  chipAmount: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 1,
    color: "#FFFFFF", // White text
  },

  // ── Section heading ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
    marginRight: 10,
  },
  countBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },

  // ── Payment Cards ──
  payCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  payCardBar: {
    width: 5,
    alignSelf: "stretch",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  payCardIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    margin: 14,
  },
  payCardText: { flex: 1 },
  payCardName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  payCardSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
    fontWeight: "500",
  },
  payCardArrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  // ── Error ──
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(231,76,60,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(231,76,60,0.25)",
  },
  errorText: { fontSize: 13, color: "#e74c3c", fontWeight: "600", flex: 1 },
});

export default PaymentList;
