
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import axios from "axios";
import baseUrl from "../constants/baseUrl";
import Header from "../components/Header";

const { width } = Dimensions.get('window');

const COLORS = {
  primary: "#24C6DC",
  secondary: "#20405f",
  tertiary: "#3d697c",
  accent: "#FFD700",
  success: "#00E676",
  danger: "#FF5252",
  warning: "#FFAB40",
  white: "#FFFFFF",
  glass: "rgba(255, 255, 255, 0.12)",
  glassBorder: "rgba(255, 255, 255, 0.2)",
  textMuted: "rgba(255, 255, 255, 0.6)"
};

// --- Custom Toggle Component ---
const TabSwitcher = ({ activeTab, setActiveTab }) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity
      style={[styles.tabButton, activeTab === 'attendance' && styles.activeTabButton]}
      onPress={() => setActiveTab('attendance')}
    >
      <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>Attendance</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.tabButton, activeTab === 'salary' && styles.activeTabButton]}
      onPress={() => setActiveTab('salary')}
    >
      <Text style={[styles.tabText, activeTab === 'salary' && styles.activeTabText]}>Salary</Text>
    </TouchableOpacity>
  </View>
);

// --- UPDATED: Added 'On Leave' status color (Purple) ---
const ActivityDot = ({ status }) => {
  let bgColor = 'rgba(255,255,255,0.1)';
  if (status === 'Present') bgColor = COLORS.success;
  if (status === 'Absent') bgColor = COLORS.danger;
  if (status === 'Half Day') bgColor = COLORS.warning;
  if (status === 'On Leave') bgColor = '#9C27B0'; // Purple for Leave
  return <View style={[styles.heatDot, { backgroundColor: bgColor }]} />;
};

const AttendanceMetric = ({ label, value, color, icon, onShowDetails }) => (
  <TouchableOpacity style={styles.metricCard} onPress={onShowDetails} activeOpacity={0.8}>
    <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <View style={styles.metricTextContent}>
      <Text style={styles.metricValueText}>{value || 0}</Text>
      <Text style={styles.metricLabelText}>{label}</Text>
    </View>
    <View style={styles.chevronBg}>
      <Ionicons name="chevron-forward" size={14} color={COLORS.white} />
    </View>
  </TouchableOpacity>
);

const AttendanceScreen = () => {
  const [data, setData] = useState(null);
  const [ledgerArray, setLedgerArray] = useState(null); // Array of all months
  const [loading, setLoading] = useState(true);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');
  const [month, setMonth] = useState(moment().month());
  const [year, setYear] = useState(moment().year());
  const [showPicker, setShowPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailType, setDetailType] = useState('');
  const [filteredDates, setFilteredDates] = useState([]);

  // --- FIX: Smart URL Handling ---
  const API_URL = useMemo(() => {
    if (baseUrl.includes('/api')) {
      return baseUrl;
    } else {
      return `${baseUrl}/api`;
    }
  }, [baseUrl]);
  // ------------------------------

  const currentYear = moment().year();
  const currentMonth = moment().month();

  // Find the specific ledger entry that matches the selected Month/Year
  const currentLedger = useMemo(() => {
    if (!ledgerArray || !Array.isArray(ledgerArray) || ledgerArray.length === 0) return null;
    
    const currentPeriod = moment([year, month]).format("MMMM YYYY");
    
    // Try to find exact match
    const match = ledgerArray.find(item => item.period === currentPeriod);
    
    // FIX: Do NOT fallback to the latest item. 
    // If we select Feb 2026 and it doesn't exist, we want 'null' so the UI shows "No Data".
    return match || null;
  }, [ledgerArray, month, year]);

  useEffect(() => {
    fetchAttendanceData();
    fetchLedgerData();
  }, [month, year]); // Re-fetch both when month changes

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const startDate = moment([year, month]).startOf("month").format("YYYY-MM-DD");
      const endDate = moment([year, month]).endOf("month").format("YYYY-MM-DD");

      const response = await axios.get(`${API_URL}/employee-attendance/app-monthly-report`, {
        params: { from_date: startDate, to_date: endDate, employee_id: agentInfo?._id }
      });

      if (response.data.status) {
        setData(response.data);
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerData = async () => {
    try {
      setSalaryLoading(true);
      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      
      if (agentInfo?._id) {
        let url = `${API_URL}/employee/ledgernew/${agentInfo._id}`;
        const response = await axios.get(url);

        if (response.data.status && response.data.ledger) {
          setLedgerArray(response.data.ledger);
        } else {
          console.warn("API returned false or no ledger array");
        }
      }
    } catch (err) {
      console.error("LEDGER API ERROR:", err);
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleShowDetails = (type) => {
    setDetailType(type);
    setFilteredDates((data?.attendanceDataResponse || []).filter(item => item.status === type));
    setShowDetails(true);
  };

  const renderSalaryItem = (label, value, icon, color) => (
    <View style={styles.salaryDetailItem}>
      <MaterialCommunityIcons name={icon || "cash"} size={20} color={color || COLORS.accent} />
      <Text style={styles.salaryDetailLabel}>{label}</Text>
      <Text style={[styles.salaryDetailValue, { color: color || COLORS.white }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.secondary }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.tertiary, COLORS.secondary]} style={StyleSheet.absoluteFillObject} />

      {/* FIXED TOP SECTION: Header, Title, Tabs, Filter */}
      <View style={styles.fixedTopSection}>
        <View style={styles.headerPadding}><Header /></View>

        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Employee Portal</Text>
          <View style={styles.accentBar} />
        </View>

        <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Date Filter */}
        <View style={styles.filterSection}>
          <TouchableOpacity style={styles.glassFilterBtn} onPress={() => setShowPicker(true)}>
            <View style={styles.flexRow}>
              <View style={styles.calendarIcon}>
                <MaterialCommunityIcons name="calendar-month" size={18} color={COLORS.secondary} />
              </View>
              <Text style={styles.filterDateText}>{moment([year, month]).format("MMMM YYYY")}</Text>
            </View>
            <Feather name="sliders" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SCROLLABLE CONTENT SECTION */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
        
        {/* ATTENDANCE VIEW */}
        {activeTab === 'attendance' && (
          <View>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
            ) : (
              <View>
                <View style={styles.heatmapCard}>
                  <Text style={styles.cardSmallTitle}>CONSISTENCY TRACKER</Text>
                  <View style={styles.dotGrid}>
                    {data?.attendanceDataResponse?.map((item, index) => (
                      <ActivityDot key={index} status={item.status} />
                    ))}
                  </View>
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.success }]} /><Text style={styles.legendText}>Present</Text></View>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} /><Text style={styles.legendText}>Absent</Text></View>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} /><Text style={styles.legendText}>Half Day</Text></View>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} /><Text style={styles.legendText}>On Leave</Text></View>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.heroGlassCard}>
                    <Text style={styles.heroLabel}>AVERAGE WORK</Text>
                    <Text style={styles.heroValueText}>{data?.summary?.average_worked_time || "0h"}</Text>
                    <Text style={styles.heroSubText}>Hours / Day</Text>
                  </View>
                  <View style={styles.sideStatsColumn}>
                    <View style={styles.miniStatCard}>
                      <Text style={styles.miniStatLabel}>TOTAL HOURS</Text>
                      <Text style={styles.miniStatValue}>{data?.summary?.total_worked_time || '0h'}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionHeading}>Summary Report</Text>

                <View style={styles.metricsContainer}>
                  <AttendanceMetric label="Present Days" value={data?.summary?.total_present} color={COLORS.success} icon="check-decagram" onShowDetails={() => handleShowDetails('Present')} />
                  <AttendanceMetric label="Absent Days" value={data?.summary?.total_absent} color={COLORS.danger} icon="close-octagon" onShowDetails={() => handleShowDetails('Absent')} />
                  <AttendanceMetric label="Half Day" value={data?.summary?.total_half_day} color={COLORS.warning} icon="clock-outline" onShowDetails={() => handleShowDetails('Half Day')} />
                  <AttendanceMetric label="Total Leaves" value={data?.summary?.total_on_leave} color="#9C27B0" icon="calendar-remove" onShowDetails={() => handleShowDetails('On Leave')} />
                </View>
              </View>
            )}
          </View>
        )}

        {/* SALARY VIEW */}
        {activeTab === 'salary' && (
          <View style={styles.salaryViewContainer}>
            {salaryLoading ? (
              <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
            ) : currentLedger ? (
              <View>
                <View style={styles.periodDisplayRow}>
                   <Text style={styles.periodLabel}>Showing data for:</Text>
                   <Text style={styles.periodValue}>{currentLedger.period}</Text>
                   <TouchableOpacity onPress={() => setShowPicker(true)}>
                     <Feather name="edit-2" size={14} color={COLORS.accent} />
                   </TouchableOpacity>
                </View>

                <View style={styles.salaryHeroCard}>
                  <MaterialCommunityIcons name="wallet-giftcard" size={40} color={COLORS.accent} style={{ marginBottom: 15 }} />
                  <Text style={styles.salarySubtitle}>Net Payable</Text>
                  <Text style={styles.salaryHeroAmount}>
                    ₹{currentLedger.financials?.net_payable || 0}
                  </Text>
                  <Text style={styles.salarySubText}>Gross: ₹{currentLedger.financials?.gross_salary || 0}</Text>
                </View>

                <View style={styles.financialsList}>
                  
                  {renderSalaryItem("Gross Salary", `₹${currentLedger.financials?.gross_salary || 0}`, "cash")}
                  {renderSalaryItem("Deductions", `₹${currentLedger.financials?.standard_deductions || 0}`, "minus-circle", COLORS.danger)}
                  {renderSalaryItem("Advances", `₹${currentLedger.financials?.advance_amount || 0}`, "arrow-up-bold-box", COLORS.warning)}
                  {renderSalaryItem("Prev. Balance", `₹${currentLedger.financials?.previous_balance || 0}`, "history", COLORS.textMuted)}
                  
                  {currentLedger.breakdown?.additional_payments?.map((pay, idx) => (
                    renderSalaryItem(pay.name, `₹${pay.value}`, "plus-circle", COLORS.success)
                  ))}
                </View>

                {currentLedger.advances && currentLedger.advances.length > 0 && (
                   <View style={{ marginTop: 20 }}>
                     <Text style={styles.sectionHeading}>Recent Advances</Text>
                     {currentLedger.advances.map((adv, i) => (
                       <View key={i} style={styles.advanceItem}>
                         <View>
                            <Text style={styles.advanceDate}>{moment(adv.pay_date).format("DD MMM YYYY")}</Text>
                            <Text style={styles.advanceType}>{adv.pay_type} • {adv.transaction_id || 'N/A'}</Text>
                         </View>
                         <Text style={styles.advanceAmount}>₹{adv.amount}</Text>
                       </View>
                     ))}
                   </View>
                )}
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={50} color={COLORS.danger} />
                <Text style={styles.errorText}>No Salary Data Found</Text>
                <Text style={styles.errorSubText}>Try selecting a different month.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => setShowPicker(true)}>
                  <Text style={styles.retryBtnText}>CHANGE MONTH</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {/* Padding at the bottom to ensure content isn't hidden behind nav bars or modal overlay if needed */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <View style={styles.yearSwitcher}>
              <TouchableOpacity onPress={() => setYear(year - 1)}><Ionicons name="chevron-back" size={24} color={COLORS.accent} /></TouchableOpacity>
              <Text style={styles.yearLabel}>{year}</Text>
              <TouchableOpacity disabled={year >= currentYear} onPress={() => setYear(year + 1)} style={{ opacity: year >= currentYear ? 0.3 : 1 }}><Ionicons name="chevron-forward" size={24} color={COLORS.accent} /></TouchableOpacity>
            </View>
            <View style={styles.monthGrid}>
              {moment.monthsShort().map((m, i) => {
                // Logic: 
                // 1. Always disable future months (i > currentMonth)
                // 2. If tab is 'salary', ALSO disable the current month (i === currentMonth)
                const isFutureMonth = year === currentYear && i > currentMonth;
                const isCurrentMonth = year === currentYear && i === currentMonth;
                
                const isDisabled = isFutureMonth || (activeTab === 'salary' && isCurrentMonth);

                return (
                  <TouchableOpacity 
                    key={m} 
                    disabled={isDisabled} 
                    onPress={() => { setMonth(i); setShowPicker(false); }} 
                    style={[
                      styles.monthItem, 
                      month === i && styles.activeMonthItem, 
                      isDisabled && { opacity: 0.2 } // Visually grey out disabled buttons
                    ]}
                  >
                    <Text style={[styles.monthItemText, month === i && styles.activeMonthItemText]}>{m.toUpperCase()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.cancelBtn}><Text style={styles.cancelText}>CLOSE</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detailed Logs Modal */}
      <Modal visible={showDetails} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{detailType} History</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}><Ionicons name="close-circle" size={28} color={COLORS.danger} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredDates.length > 0 ? filteredDates.map((item, idx) => (
                <View key={idx} style={styles.detailItem}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateNum}>{moment(item.date).format("DD")}</Text>
                    <Text style={styles.dateMonth}>{moment(item.date).format("MMM")}</Text>
                  </View>
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={styles.dayText}>{moment(item.date).format("dddd")}</Text>
                    <Text style={styles.statusText}>Status: {item.status}</Text>
                    {item.note && <Text style={styles.reasonText}>Reason: {item.note}</Text>}
                  </View>
                </View>
              )) : <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 20 }}>No records found.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Fixed Top Container Styles
  fixedTopSection: {
    backgroundColor: COLORS.secondary, // Solid background to hide scrolling content behind it
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    // Elevation for Android
    elevation: 8,
  },

  headerPadding: { 
    // UPDATED: Added + 15 to push the Header 15 pixels lower (down)
    // Increase this number to move it further down.
    paddingTop: (Platform.OS === 'ios' ? 10 : StatusBar.currentHeight || 20) + 15, 
  },

  scrollContainer: {
    flex: 1, // Takes remaining height
    backgroundColor: 'transparent',
  },
  
  // Content inside ScrollView
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10, // Small padding from top
    paddingBottom: 160, // Bottom padding for scroll end
  },

  titleSection: { marginTop: 5, marginBottom: 15 },
  mainTitle: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  accentBar: { width: 40, height: 4, backgroundColor: COLORS.accent, marginTop: 4, borderRadius: 2 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  activeTabButton: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
  activeTabText: { color: COLORS.white },
  
  filterSection: { marginBottom: 10 },
  glassFilterBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.glass, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  calendarIcon: { backgroundColor: COLORS.accent, padding: 8, borderRadius: 12 },
  filterDateText: { color: COLORS.white, marginLeft: 12, fontWeight: '800', fontSize: 15 },
  flexRow: { flexDirection: 'row', alignItems: 'center' },
  
  salaryViewContainer: { minHeight: 400 },
  periodDisplayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  periodLabel: { color: COLORS.textMuted, fontSize: 12, marginRight: 8 },
  periodValue: { color: COLORS.accent, fontSize: 16, fontWeight: '800', marginRight: 10 },
  
  salaryHeroCard: { backgroundColor: 'linear-gradient(135deg, rgba(36, 198, 220, 0.2) 0%, rgba(28, 58, 93, 0.6) 100%)', padding: 30, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, marginBottom: 20 },
  salarySubtitle: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 5, textTransform: 'uppercase' },
  salaryHeroAmount: { fontSize: 42, color: COLORS.white, fontWeight: '900', letterSpacing: 1 },
  salarySubText: { color: COLORS.primary, fontSize: 14, fontWeight: '700', marginTop: 5 },
  
  financialsList: { gap: 12 },
  salaryDetailItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  salaryDetailLabel: { flex: 1, marginLeft: 15, color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  salaryDetailValue: { fontSize: 16, fontWeight: '800' },

  advanceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)' },
  advanceDate: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  advanceType: { color: COLORS.textMuted, fontSize: 11 },
  advanceAmount: { color: COLORS.accent, fontSize: 16, fontWeight: '800' },

  errorContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  errorText: { color: COLORS.white, fontSize: 18, fontWeight: '800', marginTop: 10 },
  errorSubText: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 5, marginBottom: 20 },
  retryBtn: { backgroundColor: COLORS.danger, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryBtnText: { color: COLORS.white, fontWeight: '700' },

  heatmapCard: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardSmallTitle: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 15 },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heatDot: { width: (width - 120) / 7.5, height: 10, borderRadius: 3 },
  legendRow: { flexDirection: 'row', marginTop: 15, gap: 15, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 2, marginRight: 5 },
  legendText: { color: COLORS.textMuted, fontSize: 10 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  heroGlassCard: { flex: 1.4, backgroundColor: COLORS.glass, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.glassBorder, justifyContent: 'center' },
  sideStatsColumn: { flex: 1, gap: 12 },
  miniStatCard: { flex: 1, backgroundColor: COLORS.glass, padding: 15, borderRadius: 20, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  heroLabel: { fontSize: 10, color: COLORS.accent, fontWeight: '800' },
  heroValueText: { fontSize: 38, color: COLORS.white, fontWeight: '900', marginVertical: 4 },
  heroSubText: { fontSize: 12, color: COLORS.textMuted },
  miniStatLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700' },
  miniStatValue: { fontSize: 20, color: COLORS.white, fontWeight: '800' },
  sectionHeading: { color: COLORS.white, fontSize: 14, fontWeight: '800', marginBottom: 15, marginLeft: 5 },
  metricsContainer: { gap: 10 },
  metricCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: COLORS.glassBorder },
  iconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  metricTextContent: { flex: 1, marginLeft: 15 },
  metricValueText: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  metricLabelText: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  chevronBg: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 5, borderRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalSheet: { width: width * 0.85, backgroundColor: '#1A2229', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  yearSwitcher: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 },
  yearLabel: { color: COLORS.white, fontSize: 20, fontWeight: '900' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthItem: { width: '30%', paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  activeMonthItem: { backgroundColor: COLORS.accent },
  monthItemText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700' },
  activeMonthItemText: { color: COLORS.secondary },
  cancelBtn: { marginTop: 15, alignSelf: 'center' },
  cancelText: { color: COLORS.danger, fontWeight: '800', fontSize: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 15, marginBottom: 8 },
  dateBox: { width: 42, height: 42, backgroundColor: COLORS.accent, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dateNum: { fontSize: 16, fontWeight: '900', color: COLORS.secondary },
  dateMonth: { fontSize: 8, fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase' },
  dayText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  statusText: { color: COLORS.textMuted, fontSize: 11 },
  reasonText: { color: COLORS.primary, fontSize: 11, marginTop: 4, fontStyle: 'italic' }
});

export default AttendanceScreen;
