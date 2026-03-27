import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Animated,
  Image,
  TouchableOpacity,
  Modal,
  StatusBar,
  ScrollView,
  Dimensions,
  Linking,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import baseUrl from "../constants/baseUrl";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#183A5D",
  accent: "#f8c009ff",
  bgBlue: "#1aa2ccff",
  success: "#27AE60",
  cardBg: "rgba(255, 255, 255, 0.95)",
  white: "#FFFFFF",
  muted: "#8898AA",
  danger: "#ef4444",
};

const backgroundImage = require("../assets/hero1.jpg");

const SalesReport = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState([]);

  const [summary, setSummary] = useState({
    totalLeads: 0,
    totalCustomers: 0,
    leadBusiness: 0,
    customerBusiness: 0,
  });

  const [month, setMonth] = useState(moment().month());
  const [year, setYear] = useState(moment().year());
  const [tmpMonth, setTmpMonth] = useState(month);
  const [tmpYear, setTmpYear] = useState(year);
  const [showPicker, setShowPicker] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      setError("");

      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const agentId = agentInfo?._id;

      if (!agentId) {
        setError("Agent ID not found. Please login again.");
        setLoading(false);
        return;
      }

      const startDate = moment()
        .year(year)
        .month(month)
        .startOf("month")
        .format("YYYY-MM-DD");
      const endDate = moment()
        .year(year)
        .month(month)
        .endOf("month")
        .format("YYYY-MM-DD");

      const response = await axios.get(`${baseUrl}/report/sales-report`, {
        params: {
          from_date: startDate,
          to_date: endDate,
          agentId: agentId,
        },
      });

      const rawData = response.data?.data || [];

      const validData = rawData.filter((item) => {
        const val = item.groupValue;
        const isValidNumber = !isNaN(Number(val)) && val !== "-";
        return item.groupName !== "-" && isValidNumber;
      });

      setReportData(validData);

      const totals = validData.reduce(
        (acc, item) => {
          const val = Number(item.groupValue) || 0;
          const leadsCount = parseInt(item.leads || 0, 10);
          const customersCount = parseInt(item.customers || 0, 10);

          acc.totalLeads += leadsCount;
          acc.totalCustomers += customersCount;

          acc.leadBusiness += leadsCount * val;
          acc.customerBusiness += customersCount * val;

          return acc;
        },
        { totalLeads: 0, totalCustomers: 0, leadBusiness: 0, customerBusiness: 0 }
      );

      setSummary(totals);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error("Sales Report Error:", err);
      setError(err.response?.data?.message || "Failed to fetch sales report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, [month, year]);

  const handleCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => console.log("Call failed"));
  };

  const hasNoActivity =
    summary.totalLeads === 0 &&
    summary.totalCustomers === 0 &&
    summary.customerBusiness === 0;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />

      <Image
        source={backgroundImage}
        style={styles.bgOverlay}
        blurRadius={10}
      />

      <LinearGradient
        colors={["rgba(26, 162, 204, 0.85)", COLORS.primary]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconCircle}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={fetchSalesReport}
              style={styles.refreshBtn}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Sales Report</Text>
        </View>

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Generating Report...</Text>
            </View>
          ) : error ? (
            <View style={styles.loaderContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={50}
                color={COLORS.accent}
              />
              <Text style={styles.loadingText}>{error}</Text>
            </View>
          ) : (
            <Animated.ScrollView
              style={{ opacity: fadeAnim }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Date Filter Card */}
              <TouchableOpacity
                style={styles.dateCard}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.9}
              >
                <View style={styles.dateInfo}>
                  <View style={styles.calendarIconBg}>
                    <Ionicons name="calendar" size={18} color={COLORS.white} />
                  </View>
                  <Text style={styles.dateText}>
                    {moment().month(month).format("MMMM")} {year}
                  </Text>
                </View>
                <Feather name="edit-3" size={16} color={COLORS.primary} />
              </TouchableOpacity>

              {hasNoActivity ? (
                <View style={styles.noActivityCard}>
                  <MaterialCommunityIcons
                    name="file-find-outline"
                    size={60}
                    color={COLORS.primary}
                  />
                  <Text style={styles.noActivityTitle}>No Activity Found</Text>
                  <Text style={styles.noActivityText}>
                    No leads or customers were generated during this period.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Summary Card — vertical layout */}
                  <View style={styles.fullWidthCard}>

                    {/* Row 1: Sales Business */}
                    <View style={styles.businessRow}>
                      <View style={[styles.iconBoxLarge, { backgroundColor: "#E8F5E9" }]}>
                        <MaterialCommunityIcons
                          name="account-check"
                          size={20}
                          color={COLORS.success}
                        />
                      </View>
                      <View style={styles.textColLeft}>
                        <Text style={styles.cardLabel}>Sales (Business)</Text>
                        <Text style={styles.cardValue}>
                          ₹{summary.customerBusiness.toLocaleString("en-IN")}
                        </Text>
                      </View>
                    </View>

                    {/* Horizontal Divider */}
                    <View style={styles.rowDivider} />

                    {/* Row 2: Leads & Customers */}
                    <View style={styles.countsRow}>
                      <View style={styles.statBlock}>
                        <Text style={styles.statLabel}>Leads</Text>
                        <Text style={styles.statValue}>{summary.totalLeads}</Text>
                      </View>

                      <View style={styles.statSpacer} />

                      <View style={styles.statBlock}>
                        <Text style={styles.statLabel}>Customers</Text>
                        <Text style={styles.statValue}>{summary.totalCustomers}</Text>
                      </View>
                    </View>

                  </View>
                </>
              )}

              {/* Group Details Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Group Details</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{reportData.length}</Text>
                </View>
              </View>

              {reportData.length > 0 ? (
                reportData.map((item, index) => (
                  <View key={index} style={styles.listCard}>
                    <View style={styles.listHeader}>
                      <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
                        <Text style={styles.avatarText}>
                          {item.groupName?.charAt(0) || "G"}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.clientName}>{item.groupName}</Text>
                        <Text style={styles.dateSmall}>
                          {moment(item.date).format("DD MMM YY")}
                        </Text>
                      </View>
                      <View style={styles.amountContainer}>
                        <Text style={styles.amountText}>
                          ₹{Number(item.groupValue).toLocaleString("en-IN")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.listFooter}>
                      <View style={styles.statRow}>
                        <View style={styles.statItem}>
                          <Feather name="user-plus" size={12} color={COLORS.bgBlue} />
                          <Text style={styles.statItemText}> {item.leads} Leads</Text>
                        </View>
                        <View style={[styles.statItem, { marginLeft: 12 }]}>
                          <Feather name="users" size={12} color={COLORS.success} />
                          <Text style={styles.statItemText}> {item.customers} Customers</Text>
                        </View>
                      </View>

                      {item.phone && (
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => handleCall(item.phone)}
                        >
                          <Feather name="phone-call" size={11} color={COLORS.white} />
                          <Text style={styles.callBtnText}> Call</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="folder-open-outline"
                    size={50}
                    color="rgba(255,255,255,0.4)"
                  />
                  <Text style={styles.noDataText}>No group details available.</Text>
                </View>
              )}
            </Animated.ScrollView>
          )}
        </View>
      </SafeAreaView>

      {/* Month/Year Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowPicker(false)}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter Period</Text>

            <Text style={styles.pickerSubLabel}>Select Year</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.yearScroll}
            >
              {[2024, 2025, 2026].map((y) => (
                <TouchableOpacity
                  key={y}
                  onPress={() => setTmpYear(y)}
                  style={[styles.yearBox, tmpYear === y && styles.activeBox]}
                >
                  <Text style={[styles.boxText, tmpYear === y && styles.whiteText]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerSubLabel}>Select Month</Text>
            <View style={styles.monthGrid}>
              {moment.monthsShort().map((m, i) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setTmpMonth(i)}
                  style={[styles.monthBox, tmpMonth === i && styles.activeBox]}
                >
                  <Text style={[styles.boxText, tmpMonth === i && styles.whiteText]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                setMonth(tmpMonth);
                setYear(tmpYear);
                setShowPicker(false);
              }}
            >
              <Text style={styles.applyBtnText}>APPLY FILTER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SalesReport;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.primary },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.2 },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 50 : 20,
    paddingBottom: 10,
    alignItems: "center",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  iconCircle: { backgroundColor: "#fff", padding: 8, borderRadius: 12 },
  refreshBtn: { backgroundColor: COLORS.accent, padding: 8, borderRadius: 12 },

  contentContainer: { paddingHorizontal: 15, flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    color: COLORS.white,
    marginTop: 10,
    fontWeight: "600",
    opacity: 0.8,
  },

  dateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
  },
  dateInfo: { flexDirection: "row", alignItems: "center" },
  calendarIconBg: {
    backgroundColor: COLORS.bgBlue,
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  dateText: { fontSize: 16, fontWeight: "800", color: COLORS.primary },

  noActivityCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    alignItems: "center",
    elevation: 8,
  },
  noActivityTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 12,
  },
  noActivityText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
  },

  // ── Summary Card ──────────────────────────────────────────────
  fullWidthCard: {
    backgroundColor: COLORS.white,
    width: "100%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 5,
  },

  // Row 1 — Sales Business
  businessRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
  },
  iconBoxLarge: {
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  textColLeft: {
    flexDirection: "column",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
  },

  // Divider between rows
  rowDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 1,
  },

  // Row 2 — Leads & Customers
  countsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statBlock: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.muted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  statSpacer: {
    width: 1,
    height: 36,
    backgroundColor: "#E2E8F0",
  },
  // ─────────────────────────────────────────────────────────────

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    marginRight: 10,
  },
  countBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { color: COLORS.primary, fontWeight: "900", fontSize: 11 },

  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  listHeader: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: COLORS.primary, fontSize: 16, fontWeight: "900" },
  clientName: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  dateSmall: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  amountContainer: {
    backgroundColor: "#F0F9F4",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  amountText: { fontSize: 12, fontWeight: "900", color: COLORS.success },

  listFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F4F8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statRow: { flexDirection: "row" },
  statItem: { flexDirection: "row", alignItems: "center" },
  statItemText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  callBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.bgBlue,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  callBtnText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },

  emptyContainer: { alignItems: "center", marginTop: 40, opacity: 0.6 },
  noDataText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    padding: 25,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 20,
    color: COLORS.primary,
    textAlign: "center",
  },
  pickerSubLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.muted,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  yearScroll: { marginBottom: 20 },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthBox: {
    width: "31%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#F5F7FA",
    marginBottom: 10,
  },
  yearBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F5F7FA",
    marginRight: 10,
  },
  activeBox: { backgroundColor: COLORS.primary, elevation: 4 },
  boxText: { fontWeight: "800", color: "#A0AEC0", fontSize: 14 },
  whiteText: { color: "#fff" },
  applyBtn: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 18,
    marginTop: 20,
    alignItems: "center",
    elevation: 4,
  },
  applyBtnText: {
    fontWeight: "900",
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 1,
  },
});