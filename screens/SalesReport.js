
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
    totalBusiness: 0,
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

      const startDate = moment().year(year).month(month).startOf("month").format("YYYY-MM-DD");
      const endDate = moment().year(year).month(month).endOf("month").format("YYYY-MM-DD");

      const response = await axios.get(`${baseUrl}/report/sales-report`, {
        params: {
          from_date: startDate,
          to_date: endDate,
          agentId: agentId,
        },
      });

      const rawData = response.data?.data || [];
      
      // 1. Filter out invalid data (like groupName: "-" or non-numeric groupValue)
      const validData = rawData.filter(item => {
        const val = item.groupValue;
        // Keep item only if groupName is not "-" AND value is a valid number
        const isValidNumber = !isNaN(Number(val)) && val !== "-";
        return item.groupName !== "-" && isValidNumber;
      });

      setReportData(validData);

      // 2. Calculate Summaries safely
      const totals = validData.reduce(
        (acc, item) => {
          acc.totalLeads += parseInt(item.leads || 0, 10);
          acc.totalCustomers += parseInt(item.customers || 0, 10);
          // Safe parsing: converts "-" or invalid strings to 0
          acc.totalBusiness += Number(item.groupValue) || 0; 
          return acc;
        },
        { totalLeads: 0, totalCustomers: 0, totalBusiness: 0 }
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

  // Check if we should show the "No Data" state
  const hasNoActivity = summary.totalLeads === 0 && summary.totalCustomers === 0 && summary.totalBusiness === 0;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      <Image source={backgroundImage} style={styles.bgOverlay} blurRadius={10} />
      
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
                <MaterialCommunityIcons name="alert-circle-outline" size={50} color={COLORS.accent} />
                <Text style={styles.loadingText}>{error}</Text>
             </View>
          ) : (
            <Animated.ScrollView
              style={{ opacity: fadeAnim }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <TouchableOpacity
                style={styles.dateCard}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.9}
              >
                <View style={styles.dateInfo}>
                  <View style={styles.calendarIconBg}>
                    <Ionicons name="calendar" size={20} color={COLORS.white} />
                  </View>
                  <Text style={styles.dateText}>
                    {moment().month(month).format("MMMM")} {year}
                  </Text>
                </View>
                <Feather name="edit-3" size={18} color={COLORS.primary} />
              </TouchableOpacity>

              {/* Conditional Rendering for Empty State */}
              {hasNoActivity ? (
                <View style={styles.noActivityCard}>
                  <MaterialCommunityIcons name="file-find-outline" size={60} color={COLORS.primary} />
                  <Text style={styles.noActivityTitle}>No Activity Found</Text>
                  <Text style={styles.noActivityText}>
                    No leads or customers were generated during this period.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Summary Cards - Only show if data exists */}
                  <View style={styles.miniGrid}>
                    <View style={styles.miniCard}>
                      <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                        <MaterialCommunityIcons name="account-multiple-plus" size={24} color={COLORS.primary} />
                      </View>
                      <Text style={styles.miniVal}>{summary.totalLeads}</Text>
                      <Text style={styles.miniLabel}>Total Leads</Text>
                    </View>
                    
                    <View style={styles.miniCard}>
                      <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                        <MaterialCommunityIcons name="account-check" size={24} color={COLORS.success} />
                      </View>
                      <Text style={styles.miniVal}>{summary.totalCustomers}</Text>
                      <Text style={styles.miniLabel}>Customers</Text>
                    </View>
                  </View>

                  <View style={styles.mainCard}>
                     <View style={styles.cardHeader}>
                        <Text style={styles.cardLabel}>Total Business Value</Text>
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(248, 192, 9, 0.15)' }]}>
                            <Text style={[styles.statusText, { color: COLORS.primary }]}>Monthly</Text>
                        </View>
                     </View>
                     <Text style={styles.bigAmountText}>₹{summary.totalBusiness.toLocaleString("en-IN")}</Text>
                     <Text style={styles.statLabel}>Generated from {reportData.length} Groups</Text>
                  </View>
                </>
              )}

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
                        <Text style={styles.avatarText}>{item.groupName?.charAt(0) || 'G'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.clientName}>{item.groupName}</Text>
                        <Text style={styles.dateSmall}>
                            Date: {moment(item.date).format("DD MMM YYYY")}
                        </Text>
                      </View>
                      <View style={styles.amountContainer}>
                        <Text style={styles.amountText}>₹{Number(item.groupValue).toLocaleString("en-IN")}</Text>
                      </View>
                    </View>

                    <View style={styles.listFooter}>
                        <View style={styles.statRow}>
                            <View style={styles.statItem}>
                                <Feather name="user-plus" size={14} color={COLORS.bgBlue} />
                                <Text style={styles.statItemText}> {item.leads} Leads</Text>
                            </View>
                            <View style={[styles.statItem, { marginLeft: 15 }]}>
                                <Feather name="users" size={14} color={COLORS.success} />
                                <Text style={styles.statItemText}> {item.customers} Customers</Text>
                            </View>
                        </View>
                        
                        {item.phone && (
                            <TouchableOpacity 
                                style={styles.callBtn} 
                                onPress={() => handleCall(item.phone)}
                            >
                                <Feather name="phone-call" size={12} color={COLORS.white} />
                                <Text style={styles.callBtnText}> Call</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="folder-open-outline" size={50} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.noDataText}>No group details available.</Text>
                </View>
              )}
            </Animated.ScrollView>
          )}
        </View>
      </SafeAreaView>

      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPicker(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter Period</Text>
            
            <Text style={styles.pickerSubLabel}>Select Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
              {[2024, 2025, 2026].map(y => (
                <TouchableOpacity
                  key={y}
                  onPress={() => setTmpYear(y)}
                  style={[styles.yearBox, tmpYear === y && styles.activeBox]}
                >
                  <Text style={[styles.boxText, tmpYear === y && styles.whiteText]}>{y}</Text>
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
                  <Text style={[styles.boxText, tmpMonth === i && styles.whiteText]}>{m}</Text>
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
    paddingBottom: 15,
    alignItems: "center"
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: 0.5, textAlign: 'center' },
  iconCircle: { backgroundColor: "#fff", padding: 8, borderRadius: 12 },
  refreshBtn: { backgroundColor: COLORS.accent, padding: 10, borderRadius: 12 },
  
  contentContainer: { paddingHorizontal: 20, flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.white, marginTop: 10, fontWeight: '600', opacity: 0.8 },

  dateCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 20, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    elevation: 5
  },
  dateInfo: { flexDirection: 'row', alignItems: 'center' },
  calendarIconBg: { backgroundColor: COLORS.bgBlue, padding: 8, borderRadius: 10, marginRight: 12 },
  dateText: { fontSize: 18, fontWeight: "800", color: COLORS.primary },

  // No Activity Card Style
  noActivityCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 30,
    padding: 40,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 8,
  },
  noActivityTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 15,
  },
  noActivityText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },

  mainCard: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 30, 
    padding: 25, 
    marginBottom: 20, 
    elevation: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLabel: { fontSize: 12, fontWeight: "800", color: COLORS.muted, textTransform: "uppercase" },
  statusBadge: { backgroundColor: 'rgba(39, 174, 96, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: COLORS.success, fontSize: 10, fontWeight: '900' },
  bigAmountText: { fontSize: 32, fontWeight: "900", color: COLORS.primary, marginBottom: 5 },

  miniGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  miniCard: { 
    backgroundColor: COLORS.white, 
    width: "48%", 
    borderRadius: 25, 
    padding: 20, 
    alignItems: "flex-start",
    elevation: 4
  },
  iconBox: { padding: 10, borderRadius: 15, marginBottom: 12 },
  miniVal: { fontSize: 20, fontWeight: "900", color: COLORS.primary },
  miniLabel: { fontSize: 12, fontWeight: "600", color: COLORS.muted, marginTop: 4 },
  
  statLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "700" },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#fff", marginRight: 10 },
  countBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  countText: { color: COLORS.primary, fontWeight: '900', fontSize: 12 },

  listCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 25, 
    padding: 18, 
    marginBottom: 15,
    elevation: 3
  },
  listHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  avatarText: { color: COLORS.primary, fontSize: 22, fontWeight: "900" },
  clientName: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  dateSmall: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  amountContainer: { backgroundColor: '#F0F9F4', padding: 8, borderRadius: 12 },
  amountText: { fontSize: 14, fontWeight: "900", color: COLORS.success },
  
  listFooter: { 
    marginTop: 15, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: "#F1F4F8",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statRow: { flexDirection: 'row' },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statItemText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  callBtn: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.bgBlue, 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  callBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 40, opacity: 0.6 },
  noDataText: { color: "#fff", textAlign: "center", marginTop: 15, fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  pickerSheet: { backgroundColor: "#fff", padding: 25, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: "900", marginBottom: 25, color: COLORS.primary, textAlign: 'center' },
  pickerSubLabel: { fontSize: 14, fontWeight: '800', color: COLORS.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  yearScroll: { marginBottom: 25 },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  monthBox: { width: "31%", paddingVertical: 15, alignItems: "center", borderRadius: 18, backgroundColor: "#F5F7FA", marginBottom: 10 },
  yearBox: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 18, backgroundColor: "#F5F7FA", marginRight: 12 },
  activeBox: { backgroundColor: COLORS.primary, elevation: 5 },
  boxText: { fontWeight: "800", color: "#A0AEC0", fontSize: 15 },
  whiteText: { color: "#fff" },
  applyBtn: { backgroundColor: COLORS.accent, padding: 20, borderRadius: 22, marginTop: 30, alignItems: "center", elevation: 6 },
  applyBtnText: { fontWeight: "900", fontSize: 16, color: COLORS.primary, letterSpacing: 1 },
});