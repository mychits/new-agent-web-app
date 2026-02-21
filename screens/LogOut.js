
import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity, 
    StatusBar, 
    ActivityIndicator, 
    Dimensions, 
    Modal,
    RefreshControl,
    Platform,
    Animated, // Added Animated
    LayoutAnimation, 
    UIManager 
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header"; 
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import baseUrl from "../constants/baseUrl";
import moment from "moment";

const { width } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
    PRIMARY: "#0f7699",
    PRIMARY_LIGHT: "#1aa2ccff",
    DARK: "#1e293b",
    SLATE: "#64748b",
    WHITE: "#ffffff",
    BG: "#f1f5f9", 
    SUCCESS: "#10b981",
    SUCCESS_LIGHT: "#d1fae5",
    SUCCESS_GRADIENT: ["#10b981", "#059669"],
    DANGER: ["#ff4b2b", "#ff416c"],
    DANGER_LIGHT: "#fee2e2",
    WARNING: "#f59e0b",
    WARNING_LIGHT: "#fef3c7",
    ACCENT: "#6366f1", 
    MUTED: "#94a3b8"
};

// --- Helper Components ---

const TabSwitcher = ({ activeTab, setActiveTab }) => (
  <View style={localStyles.tabContainer}>
    <TouchableOpacity
      style={[localStyles.tabButton, activeTab === 'attendance' && localStyles.activeTabButton]}
      onPress={() => setActiveTab('attendance')}
    >
      <Text style={[localStyles.tabText, activeTab === 'attendance' && localStyles.activeTabText]}>Attendance</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[localStyles.tabButton, activeTab === 'salary' && localStyles.activeTabButton]}
      onPress={() => setActiveTab('salary')}
    >
      <Text style={[localStyles.tabText, activeTab === 'salary' && localStyles.activeTabText]}>Salary</Text>
    </TouchableOpacity>
  </View>
);

const ActivityDot = ({ status }) => {
  let bgColor = '#e2e8f0';
  if (status === 'Present') bgColor = COLORS.SUCCESS;
  if (status === 'Absent') bgColor = COLORS.DANGER[0];
  if (status === 'Half Day') bgColor = COLORS.WARNING;
  if (status === 'On Leave') bgColor = '#9C27B0';
  return <View style={[localStyles.heatDot, { backgroundColor: bgColor }]} />;
};

const AttendanceMetric = ({ label, value, color, icon, onPress }) => (
  <TouchableOpacity style={localStyles.metricCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[localStyles.metricIconBg, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <View style={localStyles.metricContent}>
      <Text style={localStyles.metricValue}>{value || 0}</Text>
      <Text style={localStyles.metricLabel}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={COLORS.MUTED} />
  </TouchableOpacity>
);

// --- Animated Date Filter Component ---
const AnimatedDateFilter = ({ month, year, onPress }) => {
  // Animation Values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Entrance Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      })
    ]).start();

    // Shimmer Loop
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Interaction Handlers
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  // Shimmer Interpolation
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width]
  });

  return (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress} 
        style={{ borderRadius: 16 }}
      >
        <Animated.View style={[localStyles.dateFilterWrapper, { transform: [{ scale: scaleAnim }] }]}>
            {/* Shimmer Effect Layer */}
            <Animated.View style={[localStyles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]}>
                <LinearGradient 
                  colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']} 
                  start={{x: 0, y: 0.5}} 
                  end={{x: 1, y: 0.5}}
                  style={localStyles.shimmerGradient} 
                />
            </Animated.View>

            <View style={localStyles.dateFilterIconBox}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.WHITE} />
            </View>
            <View style={localStyles.dateFilterTextContainer}>
                <Text style={localStyles.dateFilterStaticLabel}>Viewing Period</Text>
                <Text style={localStyles.dateFilterDynamicText}>{moment([year, month]).format("MMMM YYYY")}</Text>
            </View>
            <View style={localStyles.dateFilterAction}>
                <Text style={localStyles.dateFilterChangeText}>Change</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.PRIMARY} />
            </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- Main Component ---

const LogOut = ({ navigation }) => {
  // --- State: Daily Punch ---
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchingOut, setPunchingOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); 
  const [refreshKey, setRefreshKey] = useState(0); 

  // --- State: Monthly & Salary ---
  const [activeTab, setActiveTab] = useState('attendance');
  const [monthlyData, setMonthlyData] = useState(null);
  const [ledgerArray, setLedgerArray] = useState([]);
  const [month, setMonth] = useState(moment().month());
  const [year, setYear] = useState(moment().year());
  const [showPicker, setShowPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailType, setDetailType] = useState('');
  const [filteredDates, setFilteredDates] = useState([]);
  const [salaryLoading, setSalaryLoading] = useState(false);

  // --- Config ---
  const currentYear = moment().year();
  const currentMonth = moment().month();

  // --- Effects ---
  useEffect(() => { fetchDailyAttendance(); }, []);
  useEffect(() => { fetchMonthlyReport(); fetchLedgerData(); }, [month, year]);

  // --- API Calls ---

  const fetchDailyAttendance = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) return;
      const user = JSON.parse(userJson);
      const employeeId = user?.userId || user?._id;
      const response = await axios.get(`${baseUrl}/employee-attendance/${employeeId}`);
      if (response.data.success) {
        setAttendanceData(response.data.data);
        setRefreshKey(prev => prev + 1); 
      }
    } catch (err) {
      console.error("Daily Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = JSON.parse(userJson);
      const employeeId = user?.userId || user?._id;
      const startDate = moment([year, month]).startOf("month").format("YYYY-MM-DD");
      const endDate = moment([year, month]).endOf("month").format("YYYY-MM-DD");
      const response = await axios.get(`${baseUrl}/employee-attendance/app-monthly-report`, {
        params: { from_date: startDate, to_date: endDate, employee_id: employeeId }
      });
      if (response.data.status) setMonthlyData(response.data);
    } catch (err) { console.error("Monthly Fetch Error:", err); }
  };

  const fetchLedgerData = async () => {
    try {
      setSalaryLoading(true);
      const userJson = await AsyncStorage.getItem("user");
      const user = JSON.parse(userJson);
      const employeeId = user?.userId || user?._id;
      if (employeeId) {
        const response = await axios.get(`${baseUrl}/employee/ledgernew/${employeeId}`);
        if (response.data.status && response.data.ledger) setLedgerArray(response.data.ledger);
      }
    } catch (err) { console.error("Ledger Error:", err); } 
    finally { setSalaryLoading(false); }
  };

  const handlePunchOut = async () => {
    setShowConfirmModal(false);
    setPunchingOut(true); 
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = JSON.parse(userJson);
      const employeeId = user?.userId || user?._id;
      const response = await axios.put(`${baseUrl}/employee-attendance/punch`, { employee_id: employeeId });
      const isSuccessful = response.data.success || (response.data.message && response.data.message.toLowerCase().includes("successfully"));
      if (isSuccessful) {
        await fetchDailyAttendance();
        await fetchMonthlyReport();
        setShowSuccessModal(true);
      } else {
        alert(response.data.message || "Could not end shift.");
      }
    } catch (err) {
      alert("Check your connection or API route.");
    } finally { setPunchingOut(false); }
  };

  // --- Helpers ---
  const formatWorkingHours = (decimalHours) => {
    if (!decimalHours || decimalHours === "N/A") return "0h 0m";
    const totalSeconds = Math.floor(parseFloat(decimalHours) * 3600);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const handleShowDetails = (type) => {
    setDetailType(type);
    setFilteredDates((monthlyData?.attendanceDataResponse || []).filter(item => item.status === type));
    setShowDetails(true);
  };

  const currentLedger = useMemo(() => {
    if (!ledgerArray || ledgerArray.length === 0) return null;
    const currentPeriod = moment([year, month]).format("MMMM YYYY");
    return ledgerArray.find(item => item.period === currentPeriod) || null;
  }, [ledgerArray, month, year]);

  const isCurrentMonth = year === currentYear && month === currentMonth;

  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={localStyles.successCard}>
                <View style={localStyles.successIconWrapper}>
                    <LinearGradient colors={COLORS.SUCCESS_GRADIENT} style={localStyles.successIconInner}>
                        <Ionicons name="checkmark-done" size={40} color="#fff" />
                    </LinearGradient>
                </View>
                <Text style={localStyles.successTitle}>Shift Ended!</Text>
                <Text style={localStyles.successSub}>Your logout time has been recorded. Have a great day!</Text>
                <TouchableOpacity style={localStyles.successBtn} onPress={() => setShowSuccessModal(false)}>
                    <Text style={localStyles.successBtnText}>BACK TO HOME</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* CONFIRMATION MODAL */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={localStyles.confirmCard}>
                <View style={localStyles.confirmIconBg}>
                    <MaterialCommunityIcons name="timer-sand" size={32} color="#fff" />
                </View>
                <Text style={localStyles.confirmTitle}>End Shift?</Text>
                <Text style={localStyles.confirmSub}>You are about to punch out. This action cannot be undone.</Text>
                <View style={localStyles.confirmActions}>
                    <TouchableOpacity style={localStyles.confirmCancelBtn} onPress={() => setShowConfirmModal(false)}>
                        <Text style={localStyles.confirmCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={localStyles.confirmActionBtn} onPress={handlePunchOut}>
                        <LinearGradient colors={COLORS.DANGER} style={localStyles.confirmActionGradient}>
                            <Text style={localStyles.confirmActionText}>Confirm</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* DATE PICKER MODAL */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={localStyles.pickerSheet}>
            <Text style={localStyles.pickerTitle}>Select Period</Text>
            <View style={localStyles.yearSwitcher}>
              <TouchableOpacity onPress={() => setYear(year - 1)}><Ionicons name="chevron-back" size={24} color={COLORS.PRIMARY} /></TouchableOpacity>
              <Text style={localStyles.yearLabel}>{year}</Text>
              <TouchableOpacity disabled={year >= currentYear} onPress={() => setYear(year + 1)} style={{ opacity: year >= currentYear ? 0.3 : 1 }}><Ionicons name="chevron-forward" size={24} color={COLORS.PRIMARY} /></TouchableOpacity>
            </View>
            <View style={localStyles.monthGrid}>
              {moment.monthsShort().map((m, i) => {
                const isFutureMonth = year === currentYear && i > currentMonth;
                const isCurrentMonthSelection = year === currentYear && i === currentMonth;
                const isDisabled = isFutureMonth || (activeTab === 'salary' && isCurrentMonthSelection);
                return (
                  <TouchableOpacity 
                    key={m} 
                    disabled={isDisabled} 
                    onPress={() => { setMonth(i); setShowPicker(false); }} 
                    style={[localStyles.monthItem, month === i && localStyles.activeMonthItem, isDisabled && { opacity: 0.3 }]}
                  >
                    <Text style={[localStyles.monthItemText, month === i && localStyles.activeMonthItemText]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setShowPicker(false)} style={localStyles.cancelPickerBtn}><Text style={localStyles.cancelPickerText}>CLOSE</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DETAIL LIST MODAL */}
      <Modal visible={showDetails} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[localStyles.detailSheet]}>
            <View style={localStyles.detailHeader}>
              <Text style={localStyles.detailTitle}>{detailType} Dates</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}><Ionicons name="close-circle" size={26} color={COLORS.SLATE} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 30}}>
              {filteredDates.length > 0 ? filteredDates.map((item, idx) => (
                <View key={idx} style={localStyles.detailRow}>
                  <View style={localStyles.detailDateBox}>
                    <Text style={localStyles.detailDateNum}>{moment(item.date).format("DD")}</Text>
                    <Text style={localStyles.detailDateMon}>{moment(item.date).format("MMM")}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={localStyles.detailDayText}>{moment(item.date).format("dddd")}</Text>
                    <Text style={localStyles.detailStatusText}>{item.status}</Text>
                  </View>
                </View>
              )) : <Text style={localStyles.emptyText}>No records found.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MAIN CONTENT */}
      <LinearGradient colors={[COLORS.PRIMARY_LIGHT, COLORS.PRIMARY]} style={styles.topHeader}>
          <Header />
          <View style={styles.headerTitleContainer}>
               <Text style={styles.headerTitle}>My Activity</Text>
        <Text style={styles.headerSubTitle}>Daily check-ins, monthly reports & payroll</Text>
          </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        {(loading || punchingOut) ? (
          <View style={styles.fullPageLoader}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : (
          <ScrollView 
              key={refreshKey} 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                  <RefreshControl refreshing={loading} onRefresh={fetchDailyAttendance} color={COLORS.PRIMARY} tintColor={COLORS.WHITE} />
              }
          >
            {/* Controls: Tabs */}
            <View style={localStyles.controlRow}>
                <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
            </View>

            {/* REPLACED: Animated Date Filter */}
            <AnimatedDateFilter 
                month={month} 
                year={year} 
                onPress={() => setShowPicker(true)} 
            />

            {activeTab === 'attendance' && (
              <View>
                {isCurrentMonth && attendanceData && (
                  <>
                    {/* Profile Summary */}
                    <View style={localStyles.profileCard}>
                      <View style={localStyles.profileRow}>
                          <View style={localStyles.avatarContainer}>
                              <LinearGradient colors={[COLORS.PRIMARY_LIGHT, COLORS.PRIMARY]} style={localStyles.avatar}>
                                  <Ionicons name="person" size={26} color={COLORS.WHITE} />
                              </LinearGradient>
                          </View>
                          <View style={localStyles.nameCol}>
                              <Text style={localStyles.nameText}>{attendanceData.employee_id?.name || 'User'}</Text>
                              <View style={localStyles.roleBadge}>
                                  <Text style={localStyles.roleText}>{attendanceData.employee_id?.designation || 'Employee'}</Text>
                              </View>
                          </View>
                          <View style={localStyles.datePill}>
                              <Text style={localStyles.datePillText}>{moment(attendanceData.date).format("DD MMM")}</Text>
                          </View>
                      </View>
                    </View>

                    {/* Time Stats */}
                    <View style={localStyles.timeRow}>
                        <LinearGradient colors={COLORS.SUCCESS_GRADIENT} style={localStyles.timeCard}>
                            <View style={localStyles.timeIconBg}>
                              <Ionicons name="log-in" size={20} color={COLORS.SUCCESS} />
                            </View>
                            <Text style={localStyles.timeLabel}>PUNCH IN</Text>
                            <Text style={localStyles.timeValue}>{attendanceData.time || '--:--'}</Text>
                        </LinearGradient>

                        <LinearGradient 
                          colors={attendanceData.logout_time ? COLORS.DANGER : ['#e2e8f0', '#cbd5e1']} 
                          style={localStyles.timeCard}
                        >
                            <View style={localStyles.timeIconBg}>
                              <Ionicons name="log-out" size={20} color={attendanceData.logout_time ? COLORS.DANGER[0] : COLORS.SLATE} />
                            </View>
                            <Text style={[localStyles.timeLabel, !attendanceData.logout_time && {color: COLORS.SLATE}]}>PUNCH OUT</Text>
                            <Text style={[localStyles.timeValue, !attendanceData.logout_time && {color: COLORS.DARK}]}>
                                {attendanceData.logout_time || 'Pending'}
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* Work Duration */}
                    {attendanceData.logout_time && (
                      <View style={localStyles.durationCard}>
                        <MaterialCommunityIcons name="timer-sand" size={22} color={COLORS.PRIMARY} />
                        <View style={localStyles.durationContent}>
                            <Text style={localStyles.durationLabel}>Total Duration</Text>
                            <Text style={localStyles.durationValue}>{formatWorkingHours(attendanceData.working_hours)}</Text>
                        </View>
                      </View>
                    )}

                    {!attendanceData.logout_time && (
                      <TouchableOpacity activeOpacity={0.8} onPress={() => setShowConfirmModal(true)} style={localStyles.actionBtnContainer}>
                          <LinearGradient colors={COLORS.DANGER} style={localStyles.actionBtnGradient}>
                              <Ionicons name="exit" size={24} color="#fff" />
                              <Text style={localStyles.actionBtnText}>END MY SHIFT</Text>
                          </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Monthly Overview */}
                {monthlyData && (
                  <>
                    <View style={localStyles.sectionHeader}>
                        <Text style={localStyles.sectionTitle}>Monthly Overview</Text>
                        <View style={localStyles.divider} />
                    </View>

                    <View style={localStyles.heatmapCard}>
                        <Text style={localStyles.cardSmallTitle}>CONSISTENCY</Text>
                        <View style={localStyles.dotGrid}>
                            {monthlyData?.attendanceDataResponse?.map((item, index) => (
                                <ActivityDot key={index} status={item.status} />
                            ))}
                        </View>
                        <View style={localStyles.legendRow}>
                            <View style={localStyles.legendItem}><View style={[localStyles.legendDot, { backgroundColor: COLORS.SUCCESS }]} /><Text style={localStyles.legendText}>Present</Text></View>
                            <View style={localStyles.legendItem}><View style={[localStyles.legendDot, { backgroundColor: COLORS.DANGER[0] }]} /><Text style={localStyles.legendText}>Absent</Text></View>
                            <View style={localStyles.legendItem}><View style={[localStyles.legendDot, { backgroundColor: COLORS.WARNING }]} /><Text style={localStyles.legendText}>Half</Text></View>
                            <View style={localStyles.legendItem}><View style={[localStyles.legendDot, { backgroundColor: '#9C27B0' }]} /><Text style={localStyles.legendText}>Leave</Text></View>
                        </View>
                    </View>

                    <View style={localStyles.metricsContainer}>
                        <AttendanceMetric label="Present Days" value={monthlyData?.summary?.total_present} color={COLORS.SUCCESS} icon="check-decagram" onPress={() => handleShowDetails('Present')} />
                        <AttendanceMetric label="Absent Days" value={monthlyData?.summary?.total_absent} color={COLORS.DANGER[0]} icon="close-octagon" onPress={() => handleShowDetails('Absent')} />
                        <AttendanceMetric label="Half Day" value={monthlyData?.summary?.total_half_day} color={COLORS.WARNING} icon="clock-outline" onPress={() => handleShowDetails('Half Day')} />
                        <AttendanceMetric label="Leaves" value={monthlyData?.summary?.total_on_leave} color="#9C27B0" icon="calendar-remove" onPress={() => handleShowDetails('On Leave')} />
                    </View>
                  </>
                )}
              </View>
            )}

            {/* SALARY TAB */}
            {activeTab === 'salary' && (
              <View style={localStyles.salaryContainer}>
                {salaryLoading ? (
                   <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
                ) : currentLedger ? (
                   <View>
                        <View style={localStyles.salaryHeroCard}>
                            <LinearGradient colors={[COLORS.PRIMARY_LIGHT, COLORS.PRIMARY]} style={localStyles.salaryHeroGradient}>
                                <MaterialCommunityIcons name="wallet" size={36} color="#fff" style={{ marginBottom: 10 }} />
                                <Text style={localStyles.salaryHeroLabel}>Net Payable</Text>
                                <Text style={localStyles.salaryHeroAmount}>₹{currentLedger.financials?.net_payable || 0}</Text>
                                <Text style={localStyles.salaryHeroSub}>Gross: ₹{currentLedger.financials?.gross_salary || 0}</Text>
                            </LinearGradient>
                        </View>

                        <View style={localStyles.salaryList}>
                            <View style={localStyles.salaryRow}>
                                <MaterialCommunityIcons name="cash-plus" size={22} color={COLORS.SUCCESS} />
                                <Text style={localStyles.salaryRowLabel}>Gross Salary</Text>
                                <Text style={localStyles.salaryRowValue}>₹{currentLedger.financials?.gross_salary || 0}</Text>
                            </View>
                            <View style={localStyles.salaryRow}>
                                <MaterialCommunityIcons name="cash-minus" size={22} color={COLORS.DANGER[0]} />
                                <Text style={localStyles.salaryRowLabel}>Deductions</Text>
                                <Text style={[localStyles.salaryRowValue, {color: COLORS.DANGER[0]}]}>- ₹{currentLedger.financials?.standard_deductions || 0}</Text>
                            </View>
                            <View style={localStyles.salaryRow}>
                                <MaterialCommunityIcons name="fast-forward" size={22} color={COLORS.WARNING} />
                                <Text style={localStyles.salaryRowLabel}>Advances</Text>
                                <Text style={[localStyles.salaryRowValue, {color: COLORS.WARNING}]}>- ₹{currentLedger.financials?.advance_amount || 0}</Text>
                            </View>
                        </View>
                   </View>
                ) : (
                    <View style={localStyles.errorBox}>
                        <Ionicons name="file-tray-stacked-outline" size={50} color={COLORS.MUTED} />
                        <Text style={localStyles.errorText}>No salary data found for this period.</Text>
                        <TouchableOpacity style={localStyles.retryBtn} onPress={() => setShowPicker(true)}>
                            <Text style={localStyles.retryBtnText}>CHANGE MONTH</Text>
                        </TouchableOpacity>
                    </View>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

// --- Base Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.PRIMARY_LIGHT },
  topHeader: { 
      paddingHorizontal: 20, 
      paddingBottom: 40, 
      paddingTop: 10 
  },
  headerTitleContainer: { marginTop: 15, alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  headerSubTitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', marginTop: 5, fontWeight:'500' },
  
  contentContainer: { 
      flex: 1, 
      backgroundColor: COLORS.BG, 
      borderTopLeftRadius: 30, 
      borderTopRightRadius: 30, 
      marginTop: -25 
  },
  scrollContent: { 
      padding: 20, 
      paddingBottom: 50 
  },
  fullPageLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { 
      flex: 1, 
      backgroundColor: 'rgba(15, 118, 153, 0.6)', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20 
  }
});

// --- Local Stylish Styles ---
const localStyles = StyleSheet.create({
    // Tabs
    controlRow: { 
        marginBottom: 15
    },
    tabContainer: { 
        flexDirection: 'row', 
        backgroundColor: '#fff', 
        borderRadius: 16, 
        padding: 4, 
        shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 
    },
    tabButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    activeTabButton: { backgroundColor: COLORS.PRIMARY },
    tabText: { color: COLORS.SLATE, fontWeight: '700', fontSize: 13 },
    activeTabText: { color: COLORS.WHITE },

    // Animated Date Filter Styles
    dateFilterWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        padding: 4, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden' // Important for shimmer clipping
    },
    // Shimmer Styles
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '50%', // Width of the shimmer bar
        zIndex: 1
    },
    shimmerGradient: {
        flex: 1,
        width: width // Ensures the gradient covers the area fully during translate
    },
    // Content Styles
    dateFilterIconBox: {
        backgroundColor: COLORS.PRIMARY,
        padding: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2
    },
    dateFilterTextContainer: {
        flex: 1,
        paddingLeft: 12,
        justifyContent: 'center',
        zIndex: 2
    },
    dateFilterStaticLabel: {
        fontSize: 10,
        color: COLORS.SLATE,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    dateFilterDynamicText: {
        fontSize: 16,
        color: COLORS.DARK,
        fontWeight: '800',
        marginTop: 1
    },
    dateFilterAction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: COLORS.BG,
        borderRadius: 10,
        marginRight: 4,
        zIndex: 2
    },
    dateFilterChangeText: {
        color: COLORS.PRIMARY,
        fontWeight: '700',
        fontSize: 12,
        marginRight: 2
    },

    // Profile Card
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5,
    },
    profileRow: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { shadowColor: COLORS.PRIMARY, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 6 },
    avatar: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    nameCol: { marginLeft: 14, flex: 1 },
    nameText: { fontSize: 18, fontWeight: '800', color: COLORS.DARK },
    roleBadge: { 
        backgroundColor: COLORS.PRIMARY_LIGHT + '20', 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 6, 
        alignSelf: 'flex-start', 
        marginTop: 4 
    },
    roleText: { fontSize: 11, color: COLORS.PRIMARY, fontWeight: '700', textTransform: 'uppercase' },
    datePill: { backgroundColor: COLORS.BG, padding: 8, borderRadius: 12 },
    datePillText: { fontSize: 12, fontWeight: '700', color: COLORS.DARK },

    // Time Cards
    timeRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
    timeCard: {
        flex: 1,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6
    },
    timeIconBg: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 10, marginBottom: 8 },
    timeLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
    timeValue: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 4 },

    // Duration Card
    durationCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    durationContent: { marginLeft: 12 },
    durationLabel: { fontSize: 12, color: COLORS.SLATE, fontWeight: '600' },
    durationValue: { fontSize: 18, color: COLORS.DARK, fontWeight: '800' },

    // Action Button
    actionBtnContainer: { marginTop: 10, marginBottom: 30, borderRadius: 20, overflow: 'hidden' },
    actionBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 10 },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

    // Section Header
    sectionHeader: { marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.DARK },
    divider: { height: 3, width: 40, backgroundColor: COLORS.PRIMARY, marginTop: 6, borderRadius: 2 },

    // Heatmap
    heatmapCard: { backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
    cardSmallTitle: { color: COLORS.SLATE, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
    dotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    heatDot: { width: (width - 70) / 8, height: 10, borderRadius: 3 },
    legendRow: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 8, height: 8, borderRadius: 2, marginRight: 5 },
    legendText: { color: COLORS.SLATE, fontSize: 10, fontWeight: '600' },

    // Metrics
    metricsContainer: { gap: 10 },
    metricCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        padding: 14, 
        borderRadius: 18,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 
    },
    metricIconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    metricContent: { flex: 1, marginLeft: 12 },
    metricValue: { fontSize: 18, fontWeight: '800', color: COLORS.DARK },
    metricLabel: { fontSize: 11, color: COLORS.SLATE, fontWeight: '600', marginTop: 1 },

    // Salary
    salaryHeroCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 20, elevation: 8 },
    salaryHeroGradient: { padding: 25, alignItems: 'center' },
    salaryHeroLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
    salaryHeroAmount: { fontSize: 34, fontWeight: '900', color: '#fff', marginVertical: 4 },
    salaryHeroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    
    salaryList: { gap: 10 },
    salaryRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        padding: 16, 
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    salaryRowLabel: { flex: 1, marginLeft: 12, fontSize: 13, fontWeight: '600', color: COLORS.DARK },
    salaryRowValue: { fontSize: 15, fontWeight: '800' },

    // Error Box
    errorBox: { alignItems: 'center', marginTop: 60, padding: 20 },
    errorText: { color: COLORS.SLATE, fontSize: 14, marginTop: 10, textAlign: 'center', fontWeight: '600' },
    retryBtn: { backgroundColor: COLORS.DARK, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 15 },
    retryBtnText: { color: COLORS.WHITE, fontWeight: '700' },

    // Modals
    successCard: { 
        backgroundColor: '#fff', 
        width: '100%', 
        borderRadius: 30, 
        padding: 30, 
        alignItems: 'center' 
    },
    successIconWrapper: { marginBottom: 15 },
    successIconInner: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
    successTitle: { fontSize: 22, fontWeight: '800', color: COLORS.DARK },
    successSub: { fontSize: 14, color: COLORS.SLATE, textAlign: 'center', marginTop: 8, lineHeight: 22 },
    successBtn: { backgroundColor: COLORS.BG, padding: 14, borderRadius: 14, marginTop: 25, width: '100%', alignItems: 'center' },
    successBtnText: { color: COLORS.PRIMARY, fontWeight: '700', fontSize: 15 },

    confirmCard: { backgroundColor: '#fff', width: '100%', borderRadius: 30, padding: 25, alignItems: 'center' },
    confirmIconBg: { backgroundColor: COLORS.DANGER[0], width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    confirmTitle: { fontSize: 20, fontWeight: '800', color: COLORS.DARK },
    confirmSub: { fontSize: 13, color: COLORS.SLATE, textAlign: 'center', marginTop: 6 },
    confirmActions: { flexDirection: 'row', gap: 10, marginTop: 25, width: '100%' },
    confirmCancelBtn: { flex: 1, backgroundColor: COLORS.BG, padding: 14, borderRadius: 14, alignItems: 'center' },
    confirmCancelText: { fontWeight: '600', color: COLORS.DARK },
    confirmActionBtn: { flex: 1.2, borderRadius: 14, overflow: 'hidden' },
    confirmActionGradient: { padding: 14, alignItems: 'center' },
    confirmActionText: { color: '#fff', fontWeight: '700' },

    pickerSheet: { 
        width: '100%', 
        backgroundColor: '#fff', 
        borderRadius: 30, 
        padding: 25 
    },
    pickerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.DARK, marginBottom: 20, textAlign: 'center' },
    yearSwitcher: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, backgroundColor: COLORS.BG, padding: 10, borderRadius: 12 },
    yearLabel: { color: COLORS.DARK, fontSize: 18, fontWeight: '900' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    monthItem: { width: '30%', paddingVertical: 12, alignItems: 'center', borderRadius: 12, marginBottom: 8, backgroundColor: COLORS.BG },
    activeMonthItem: { backgroundColor: COLORS.PRIMARY },
    monthItemText: { color: COLORS.SLATE, fontSize: 11, fontWeight: '700' },
    activeMonthItemText: { color: COLORS.WHITE },
    cancelPickerBtn: { marginTop: 10, alignSelf: 'center' },
    cancelPickerText: { color: COLORS.DANGER[0], fontWeight: '700', fontSize: 13 },

    detailSheet: { 
        width: '100%', 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30, 
        padding: 25, 
        maxHeight: '70%', 
        position: 'absolute', 
        bottom: 0 
    },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    detailTitle: { fontSize: 18, fontWeight: '800', color: COLORS.DARK },
    detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BG, padding: 12, borderRadius: 16, marginBottom: 8 },
    detailDateBox: { width: 48, height: 48, backgroundColor: COLORS.PRIMARY, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    detailDateNum: { fontSize: 16, fontWeight: '900', color: '#fff' },
    detailDateMon: { fontSize: 9, fontWeight: '700', color: '#fff' },
    detailDayText: { marginLeft: 12, fontSize: 14, fontWeight: '700', color: COLORS.DARK },
    detailStatusText: { marginLeft: 12, fontSize: 12, color: COLORS.SLATE, marginTop: 2 },
    emptyText: { textAlign: 'center', color: COLORS.SLATE, marginTop: 30 }
});

export default LogOut;
