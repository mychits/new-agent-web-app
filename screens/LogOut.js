
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
    Animated, 
    LayoutAnimation, 
    UIManager 
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header"; // Assuming path is correct
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import baseUrl from "../constants/baseUrl"; // Assuming path is correct
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

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
            
            {/* --- 1. STYLISH DAILY STATUS BOX --- */}
            {isCurrentMonth && attendanceData && (
              <View style={localStyles.dailyStatusBox}>
                
                {/* Profile Section */}
                <View style={localStyles.innerSection}>
                    <View style={localStyles.profileCard}>
                      <View style={localStyles.profileRow}>
                          {/* Avatar with Ring Effect */}
                          <View style={localStyles.avatarRing}>
                              <View style={localStyles.avatarContainer}>
                                  <LinearGradient colors={[COLORS.PRIMARY_LIGHT, COLORS.PRIMARY]} style={localStyles.avatar}>
                                      <Ionicons name="person" size={26} color={COLORS.WHITE} />
                                  </LinearGradient>
                              </View>
                          </View>
                          
                          <View style={localStyles.nameCol}>
                              <Text style={localStyles.welcomeText}>Welcome back,</Text>
                              <Text style={localStyles.nameText}>{attendanceData.employee_id?.name || 'User'}</Text>
                              <View style={localStyles.roleBadge}>
                                  <Text style={localStyles.roleText}>{attendanceData.employee_id?.designation || 'Employee'}</Text>
                              </View>
                          </View>
                          
                          {/* Gradient Date Chip */}
                          <LinearGradient colors={[COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]} style={localStyles.datePill}>
                              <Text style={localStyles.datePillText}>{moment(attendanceData.date).format("DD MMM")}</Text>
                          </LinearGradient>
                      </View>
                    </View>
                </View>

                {/* Time Stats Section */}
                <View style={[localStyles.innerSection, { paddingBottom: 0 }]}>
                    <View style={localStyles.timeRow}>
                        {/* Punch In Card with Decorative Blob */}
                        <View style={[localStyles.timeCard, { backgroundColor: COLORS.SUCCESS }]}>
                            <View style={[localStyles.decorativeCircle, { backgroundColor: '#fff', opacity: 0.1, top: -10, right: -10 }]} />
                            <View style={[localStyles.decorativeCircle, { backgroundColor: '#fff', opacity: 0.1, bottom: -10, left: -10, width: 40, height: 40 }]} />
                            
                            <View style={localStyles.timeIconBg}>
                              <Ionicons name="log-in" size={20} color={COLORS.SUCCESS} />
                            </View>
                            <Text style={localStyles.timeLabel}>PUNCH IN</Text>
                            <Text style={localStyles.timeValue}>{attendanceData.time || '--:--'}</Text>
                        </View>

                        {/* Punch Out Card with Decorative Blob */}
                        <View style={[localStyles.timeCard, { backgroundColor: attendanceData.logout_time ? COLORS.DANGER[0] : '#f1f5f9' }]}>
                            <View style={[localStyles.decorativeCircle, { backgroundColor: attendanceData.logout_time ? '#fff' : COLORS.DANGER[0], opacity: 0.1, top: -10, right: -10 }]} />
                            
                            <View style={[localStyles.timeIconBg, { backgroundColor: '#fff' }]}>
                              <Ionicons name="log-out" size={20} color={attendanceData.logout_time ? COLORS.DANGER[0] : COLORS.SLATE} />
                            </View>
                            <Text style={[localStyles.timeLabel, !attendanceData.logout_time && {color: COLORS.SLATE}]}>PUNCH OUT</Text>
                            <Text style={[localStyles.timeValue, !attendanceData.logout_time && {color: COLORS.DARK}]}>
                                {attendanceData.logout_time || 'Pending'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Duration or Action Section */}
                <View style={localStyles.innerSection}>
                    {attendanceData.logout_time ? (
                      <View style={localStyles.durationCard}>
                        <LinearGradient colors={[COLORS.PRIMARY + '10', COLORS.PRIMARY + '05']} style={localStyles.durationGlow}>
                            <MaterialCommunityIcons name="timer-sand" size={24} color={COLORS.PRIMARY} />
                            <View style={localStyles.durationContent}>
                                <Text style={localStyles.durationLabel}>Total Duration</Text>
                                <Text style={localStyles.durationValue}>{formatWorkingHours(attendanceData.working_hours)}</Text>
                            </View>
                        </LinearGradient>
                      </View>
                    ) : (
                      <TouchableOpacity activeOpacity={0.9} onPress={() => setShowConfirmModal(true)} style={localStyles.actionBtnContainer}>
                          <LinearGradient colors={COLORS.DANGER} style={localStyles.actionBtnGradient}>
                              <Ionicons name="exit" size={24} color="#fff" />
                              <Text style={localStyles.actionBtnText}>END MY SHIFT</Text>
                          </LinearGradient>
                          {/* Button Glow */}
                          <View style={localStyles.actionBtnGlow} />
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            )}

            {/* --- 2. CONTROLS: TOGGLE & DATE FILTER --- */}
            
            {/* ADDED TITLE */}
            <View style={localStyles.sectionHeader}>
                <Text style={localStyles.sectionTitle}>Records</Text>
                <View style={localStyles.divider} />
            </View>

            {/* Controls: Tabs */}
            <View style={localStyles.controlRow}>
                <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
            </View>

            {/* Animated Date Filter */}
            <AnimatedDateFilter 
                month={month} 
                year={year} 
                onPress={() => setShowPicker(true)} 
            />

            {/* --- 3. TAB CONTENT --- */}
            
            {activeTab === 'attendance' && (
              <View>
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
  headerTitleContainer: { marginTop: -2, alignItems: 'center' },
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
    controlRow: { marginBottom: 15 },
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
        overflow: 'hidden' 
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '50%', 
        zIndex: 1
    },
    shimmerGradient: {
        flex: 1,
        width: width 
    },
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

    // --- STYLISH DAILY STATUS BOX ---
    dailyStatusBox: {
        backgroundColor: '#fff',
        borderRadius: 28,
        paddingTop: 20, 
        marginBottom: 24,
        // Deep, soft shadow
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(15, 118, 153, 0.1)'
    },
    innerSection: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },

    // Profile Card Styles
    profileCard: {
        backgroundColor: 'transparent', 
        borderRadius: 0, 
        padding: 0, 
        marginBottom: 0, 
        shadowOpacity: 0, 
        elevation: 0, 
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 20
    },
    profileRow: { flexDirection: 'row', alignItems: 'center' },
    
    // Ring Effect for Avatar
    avatarRing: {
        padding: 3,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#e0f2fe', // Very light blue ring
    },
    avatarContainer: { 
        shadowColor: COLORS.PRIMARY, 
        shadowOffset: {width: 0, height: 4}, 
        shadowOpacity: 0.3, 
        shadowRadius: 8,
        elevation: 5,
        borderRadius: 20
    },
    avatar: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    
    nameCol: { marginLeft: 16, flex: 1 },
    welcomeText: { fontSize: 11, color: COLORS.MUTED, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
    nameText: { fontSize: 20, fontWeight: '900', color: COLORS.DARK, lineHeight: 24 },
    roleBadge: { 
        backgroundColor: COLORS.PRIMARY + '15', 
        paddingHorizontal: 10, 
        paddingVertical: 3, 
        borderRadius: 8, 
        alignSelf: 'flex-start', 
        marginTop: 8 
    },
    roleText: { fontSize: 10, color: COLORS.PRIMARY, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    
    // Gradient Date Pill
    datePill: { 
        paddingHorizontal: 14, 
        paddingVertical: 8, 
        borderRadius: 14, 
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4
    },
    datePillText: { fontSize: 12, fontWeight: '800', color: '#fff' },

    // Time Cards Styles
    timeRow: { 
        flexDirection: 'row', 
        gap: 16, 
        marginBottom: 0, 
        paddingHorizontal: 0 
    },
    timeCard: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        // Removed shadow to make it flat inside the box, using color contrast instead
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    // Decorative Background Blobs
    decorativeCircle: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    timeIconBg: { backgroundColor: '#fff', padding: 8, borderRadius: 12, marginBottom: 10, zIndex: 1 },
    timeLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.5, zIndex: 1 },
    timeValue: { fontSize: 18, fontWeight: '900', color: '#fff', marginTop: 4, zIndex: 1 },

    // Duration Card
    durationCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 0,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    durationGlow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18
    },
    durationContent: { marginLeft: 16 },
    durationLabel: { fontSize: 12, color: COLORS.SLATE, fontWeight: '700', letterSpacing: 0.5 },
    durationValue: { fontSize: 20, color: COLORS.DARK, fontWeight: '900', marginTop: 2 },

    // Action Button (Stylish)
    actionBtnContainer: { 
        position: 'relative',
        marginTop: 0, 
        marginBottom: 0, 
        borderRadius: 20, 
        overflow: 'visible' // Allow glow to overflow
    },
    actionBtnGradient: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 20, 
        gap: 12,
        borderRadius: 20,
        zIndex: 2
    },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    // Glow effect for button
    actionBtnGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        backgroundColor: COLORS.DANGER[0],
        opacity: 0.4,
        blurRadius: 20,
        zIndex: 1
    },

    // Section Header
    sectionHeader: { marginBottom: 20, marginTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.DARK, letterSpacing: -0.5 },
    divider: { height: 4, width: 40, backgroundColor: COLORS.PRIMARY, marginTop: 8, borderRadius: 3 },

    // Heatmap
    heatmapCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f8fafc' },
    cardSmallTitle: { color: COLORS.SLATE, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 15 },
    dotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    heatDot: { width: (width - 80) / 8, height: 12, borderRadius: 4 },
    legendRow: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between', paddingHorizontal: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 8, height: 8, borderRadius: 3, marginRight: 6 },
    legendText: { color: COLORS.SLATE, fontSize: 10, fontWeight: '700' },

    // Metrics
    metricsContainer: { gap: 12 },
    metricCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        padding: 16, 
        borderRadius: 20,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
        borderWidth: 1,
        borderColor: '#f8fafc'
    },
    metricIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    metricContent: { flex: 1, marginLeft: 14 },
    metricValue: { fontSize: 20, fontWeight: '900', color: COLORS.DARK },
    metricLabel: { fontSize: 12, color: COLORS.SLATE, fontWeight: '700', marginTop: 2 },

    // Salary
    salaryContainer: { minHeight: 200 },
    salaryHeroCard: { borderRadius: 28, overflow: 'hidden', marginBottom: 25, elevation: 10, shadowColor: COLORS.PRIMARY, shadowOpacity: 0.2, shadowRadius: 15 },
    salaryHeroGradient: { padding: 30, alignItems: 'center' },
    salaryHeroLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5, marginBottom: 5 },
    salaryHeroAmount: { fontSize: 38, fontWeight: '900', color: '#fff', marginVertical: 5 },
    salaryHeroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    
    salaryList: { gap: 12 },
    salaryRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        padding: 18, 
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    salaryRowLabel: { flex: 1, marginLeft: 14, fontSize: 14, fontWeight: '700', color: COLORS.DARK },
    salaryRowValue: { fontSize: 16, fontWeight: '900' },

    // Error Box
    errorBox: { alignItems: 'center', marginTop: 60, padding: 20 },
    errorText: { color: COLORS.SLATE, fontSize: 15, marginTop: 12, textAlign: 'center', fontWeight: '600' },
    retryBtn: { backgroundColor: COLORS.DARK, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginTop: 20 },
    retryBtnText: { color: COLORS.WHITE, fontWeight: '800', letterSpacing: 1 },

    // Modals
    successCard: { 
        backgroundColor: '#fff', 
        width: '100%', 
        borderRadius: 30, 
        padding: 30, 
        alignItems: 'center' 
    },
    successIconWrapper: { marginBottom: 20 },
    successIconInner: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    successTitle: { fontSize: 24, fontWeight: '900', color: COLORS.DARK },
    successSub: { fontSize: 14, color: COLORS.SLATE, textAlign: 'center', marginTop: 10, lineHeight: 24 },
    successBtn: { backgroundColor: COLORS.BG, padding: 16, borderRadius: 16, marginTop: 30, width: '100%', alignItems: 'center' },
    successBtnText: { color: COLORS.PRIMARY, fontWeight: '800', fontSize: 16 },

    confirmCard: { backgroundColor: '#fff', width: '100%', borderRadius: 30, padding: 30, alignItems: 'center' },
    confirmIconBg: { backgroundColor: COLORS.DANGER[0], width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    confirmTitle: { fontSize: 22, fontWeight: '900', color: COLORS.DARK },
    confirmSub: { fontSize: 14, color: COLORS.SLATE, textAlign: 'center', marginTop: 8, lineHeight: 22 },
    confirmActions: { flexDirection: 'row', gap: 12, marginTop: 30, width: '100%' },
    confirmCancelBtn: { flex: 1, backgroundColor: COLORS.BG, padding: 16, borderRadius: 16, alignItems: 'center' },
    confirmCancelText: { fontWeight: '700', color: COLORS.DARK, fontSize: 15 },
    confirmActionBtn: { flex: 1.2, borderRadius: 16, overflow: 'hidden' },
    confirmActionGradient: { padding: 16, alignItems: 'center' },
    confirmActionText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    pickerSheet: { 
        width: '100%', 
        backgroundColor: '#fff', 
        borderRadius: 30, 
        padding: 30 
    },
    pickerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.DARK, marginBottom: 25, textAlign: 'center' },
    yearSwitcher: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: COLORS.BG, padding: 12, borderRadius: 16 },
    yearLabel: { color: COLORS.DARK, fontSize: 20, fontWeight: '900' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    monthItem: { width: '30%', paddingVertical: 14, alignItems: 'center', borderRadius: 14, marginBottom: 10, backgroundColor: COLORS.BG },
    activeMonthItem: { backgroundColor: COLORS.PRIMARY },
    monthItemText: { color: COLORS.SLATE, fontSize: 12, fontWeight: '700' },
    activeMonthItemText: { color: COLORS.WHITE },
    cancelPickerBtn: { marginTop: 15, alignSelf: 'center' },
    cancelPickerText: { color: COLORS.DANGER[0], fontWeight: '800', fontSize: 14 },

    detailSheet: { 
        width: '100%', 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30, 
        padding: 30, 
        maxHeight: '70%', 
        position: 'absolute', 
        bottom: 0 
    },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    detailTitle: { fontSize: 20, fontWeight: '900', color: COLORS.DARK },
    detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BG, padding: 14, borderRadius: 18, marginBottom: 10 },
    detailDateBox: { width: 50, height: 50, backgroundColor: COLORS.PRIMARY, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    detailDateNum: { fontSize: 18, fontWeight: '900', color: '#fff' },
    detailDateMon: { fontSize: 10, fontWeight: '800', color: '#fff' },
    detailDayText: { marginLeft: 14, fontSize: 15, fontWeight: '800', color: COLORS.DARK },
    detailStatusText: { marginLeft: 14, fontSize: 13, color: COLORS.SLATE, marginTop: 2 },
    emptyText: { textAlign: 'center', color: COLORS.SLATE, marginTop: 40, fontSize: 15, fontWeight: '600' }
});

export default LogOut;
