
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
  cardBg: "rgba(255, 255, 255, 0.98)",
  white: "#FFFFFF",
  muted: "#8898AA",
  background: "#0f2a44",
};

const backgroundImage = require("../assets/hero1.jpg");

const Target = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [targetData, setTargetData] = useState({
    total_target: 0,
    total_business: 0,
    total_enrollments: 0,
  });

  const [month, setMonth] = useState(moment().month());
  const [year, setYear] = useState(moment().year());
  const [tmpMonth, setTmpMonth] = useState(month);
  const [tmpYear, setTmpYear] = useState(year);
  const [showPicker, setShowPicker] = useState(false);

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [blinkAnim]);

  const fetchTargetDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const employeeId = agentInfo?._id;

      if (!employeeId) {
        setError("Login required");
        setLoading(false);
        return;
      }

      const startDate = moment().year(year).month(month).startOf("month").format("YYYY-MM-DD");
      const endDate = moment().year(year).month(month).endOf("month").format("YYYY-MM-DD");

      const [incentiveRes, targetRes] = await Promise.all([
        axios.get(`${baseUrl}/enroll/employee/${employeeId}/incentive?start_date=${startDate}&end_date=${endDate}`),
        axios.get(`${baseUrl}/target/employees/${employeeId}?start_date=${startDate}&end_date=${endDate}`),
      ]);

      const incentiveApi = incentiveRes?.data || {};
      const targetApi = targetRes?.data || {};
      const summary = incentiveApi?.incentiveSummary || {};

      setEnrollments(incentiveApi.incentiveData || []);

      const achievedFromTarget = Number(targetApi?.summary?.metrics?.actual_business || 0);
      const groupValueFromIncentive = Number(summary?.total_group_value || 0);
      const totalBusiness = achievedFromTarget + groupValueFromIncentive;
      const totalTarget = Number(targetApi?.total_target || 0);

      setTargetData({
        total_target: totalTarget,
        total_business: totalBusiness,
        total_enrollments: Number(summary?.total_enrollments || 0),
      });

      const progressVal = totalTarget > 0 ? Math.min((totalBusiness / totalTarget) * 100, 100) : 0;
      
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      
      Animated.spring(progressAnim, {
        toValue: progressVal,
        tension: 40,
        friction: 7,
        useNativeDriver: false,
      }).start();

    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTargetDetails(); }, [month, year]);

  const handleCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => console.log("Call failed"));
  };

  const progress = targetData.total_target > 0 
    ? Math.min((targetData.total_business / targetData.total_target) * 100, 100) 
    : 0;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // --- LOGIC FOR EXTRA & INCENTIVE ---
  const extraBusiness = Math.max(0, targetData.total_business - targetData.total_target);
  const incentiveEarned = Math.floor(extraBusiness / 100000) * 1000; 

  // --- DYNAMIC WIDTH LOGIC ---
  // If extraBusiness exists, we have 3 cards (31% width). If not, 2 cards (48% width).
  const cardWidth = extraBusiness > 0 ? "31%" : "48%";

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <Image source={backgroundImage} style={styles.bgOverlay} blurRadius={12} />
      <LinearGradient colors={["rgba(26, 162, 204, 0.9)", COLORS.primary]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchTargetDetails} style={styles.refreshBtn} activeOpacity={0.7}>
              <Feather name="refresh-cw" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Target Performance</Text>
          <Text style={styles.headerSubTitle}>Track your monthly goals</Text>
        </View>

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Crunching numbers...</Text>
            </View>
          ) : (
            <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              
              {/* Date Picker Card */}
              <TouchableOpacity style={styles.dateCard} onPress={() => setShowPicker(true)} activeOpacity={0.9}>
                <View style={styles.dateInfo}>
                  <View style={styles.calendarIconBg}>
                    <Ionicons name="calendar" size={18} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.dateLabel}>SELECTED PERIOD</Text>
                    <Text style={styles.dateText}>{moment().month(month).format("MMMM")} {year}</Text>
                  </View>
                </View>
                <Animated.View style={{ opacity: blinkAnim }}>
                  <View style={styles.editIconBg}>
                     <Feather name="edit-3" size={14} color={COLORS.primary} />
                  </View>
                </Animated.View>
              </TouchableOpacity>

              {targetData.total_target > 0 ? (
                <>
                  {/* Main Progress Card - COMPACT */}
                  <View style={styles.mainCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardLabel}>Monthly Progress</Text>
                      <View style={[styles.statusBadge, progress >= 100 ? styles.badgeSuccess : styles.badgeWarning]}>
                        <Text style={styles.statusText}>{progress >= 100 ? 'Achieved' : 'In Progress'}</Text>
                      </View>
                    </View>

                    <View style={styles.progressCenter}>
                      <Text style={styles.percentageText}>{progress.toFixed(1)}%</Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <View style={[styles.statIconSmall, { backgroundColor: 'rgba(39, 174, 96, 0.15)' }]}>
                          <Feather name="check-circle" size={10} color={COLORS.success} />
                        </View>
                        <View style={{ marginLeft: 6 }}>
                          <Text style={styles.statLabel}>Achieved</Text>
                          <Text style={[styles.statValue, { color: COLORS.success }]}>
                            ₹{targetData.total_business.toLocaleString("en-IN")}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.statDivider} />

                      <View style={styles.statBox}>
                        <View style={[styles.statIconSmall, { backgroundColor: 'rgba(248, 192, 9, 0.15)' }]}>
                          <Feather name="target" size={10} color={COLORS.accent} />
                        </View>
                        <View style={{ marginLeft: 6 }}>
                          <Text style={styles.statLabel}>Target</Text>
                          <Text style={[styles.statValue, { color: COLORS.primary }]}>
                            ₹{targetData.total_target.toLocaleString("en-IN")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Horizontal Mini Stats - DYNAMIC LAYOUT */}
                  <View style={styles.miniGrid}>
                    {/* Card 1: Enrollments */}
                    <View style={[styles.miniCard, { width: cardWidth }]}>
                      <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                        <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
                      </View>
                      <View style={styles.textCol}>
                        <Text style={styles.miniLabel}>Enrollments</Text>
                        <Text style={styles.miniVal}>{targetData.total_enrollments}</Text>
                      </View>
                    </View>
                    
                    {/* Card 2: Revenue */}
                    <View style={[styles.miniCard, { width: cardWidth }]}>
                      <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                        <MaterialCommunityIcons name="cash-multiple" size={20} color={COLORS.success} />
                      </View>
                      <View style={styles.textCol}>
                        <Text style={styles.miniLabel}>Achievement</Text>
                        <Text style={styles.miniVal}>₹{targetData.total_business.toLocaleString("en-IN")}</Text>
                      </View>
                    </View>

                    {/* Card 3: Extra Achieved - CONDITIONAL RENDERING */}
                    {extraBusiness > 0 && (
                      <View style={[styles.miniCard, { width: cardWidth }]}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(248, 192, 9, 0.15)' }]}>
                          <MaterialCommunityIcons name="cash-plus" size={20} color={COLORS.accent} />
                        </View>
                        <View style={styles.textCol}>
                          <Text style={styles.miniLabel}>Incentive</Text>
                       
                          <Text style={styles.incentiveSubText}>₹{incentiveEarned.toLocaleString()} </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.noTargetCard}>
                  <View style={styles.noTargetIconBg}>
                    <MaterialCommunityIcons name="target-variant" size={40} color={COLORS.accent} />
                  </View>
                  <Text style={styles.noTargetTitle}>No Target Assigned</Text>
                  <Text style={styles.noTargetSub}>
                    No goals found for {moment().month(month).format("MMMM")} {year}. Contact your manager.
                  </Text>
                </View>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Achievement List</Text>
                <View style={styles.countBadge}>
                   <Text style={styles.countText}>{enrollments.length}</Text>
                </View>
              </View>
              
              {enrollments.length > 0 ? (
                enrollments.map((item, index) => (
                  <View key={item._id || index} style={styles.listCard}>
                    <View style={styles.listHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.user_id?.full_name?.charAt(0) || 'U'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.clientName} numberOfLines={1}>{item.user_id?.full_name}</Text>
                        
                        <View style={styles.contactRow}>
                          <TouchableOpacity style={styles.contactItem} onPress={() => handleCall(item.user_id?.phone_number)}>
                            <Feather name="phone" size={11} color={COLORS.bgBlue} />
                            <Text style={styles.contactText}> {item.user_id?.phone_number}</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.emailText} numberOfLines={1}>
                          {item.user_id?.email || 'No email registered'}
                        </Text>
                      </View>
                      
                      <View style={styles.amountPill}>
                        <Text style={styles.amountText}>₹{item.group_id?.group_value?.toLocaleString("en-IN")}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.listFooter}>
                      <View style={styles.schemeBadge}>
                        <MaterialCommunityIcons name="file-document-outline" size={12} color={COLORS.muted} />
                        <Text style={styles.schemeText}> {item.group_id?.group_name}</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="database-off-outline" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.noDataText}>No enrollment records found.</Text>
                </View>
              )}
            </Animated.ScrollView>
          )}
        </View>
      </SafeAreaView>

      {/* Modal Picker */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPicker(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter Period</Text>
            
            <Text style={styles.pickerSubLabel}>Select Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
              {[2024, 2025, 2026].map(y => (
                <TouchableOpacity key={y} onPress={() => setTmpYear(y)} style={[styles.yearBox, tmpYear === y && styles.activeBox]}>
                  <Text style={[styles.boxText, tmpYear === y && styles.whiteText]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerSubLabel}>Select Month</Text>
            <View style={styles.monthGrid}>
              {moment.monthsShort().map((m, i) => (
                <TouchableOpacity key={m} onPress={() => setTmpMonth(i)} style={[styles.monthBox, tmpMonth === i && styles.activeBox]}>
                  <Text style={[styles.boxText, tmpMonth === i && styles.whiteText]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={() => { setMonth(tmpMonth); setYear(tmpYear); setShowPicker(false); }}>
              <Text style={styles.applyBtnText}>APPLY FILTER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Target;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.primary },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
  
  header: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 50 : 20,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", textAlign: 'center', marginTop: 5 },
  headerSubTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 },
  iconCircle: { backgroundColor: "#fff", padding: 8, borderRadius: 12, elevation: 4 },
  refreshBtn: { backgroundColor: COLORS.accent, padding: 10, borderRadius: 12, elevation: 4 },
  
  contentContainer: { paddingHorizontal: 16, flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.white, marginTop: 10, fontWeight: '600', opacity: 0.8 },

  // Date Card
  dateCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dateInfo: { flexDirection: 'row', alignItems: 'center' },
  calendarIconBg: { backgroundColor: COLORS.bgBlue, padding: 8, borderRadius: 10, marginRight: 12 },
  dateLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '800', letterSpacing: 1 },
  dateText: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
  editIconBg: { backgroundColor: '#F5F7FA', padding: 8, borderRadius: 10 },

  // Main Progress Card - COMPACT STYLES
  mainCard: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 20, 
    padding: 14, 
    marginBottom: 16, 
    elevation: 6,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 2
  },
  cardLabel: { fontSize: 11, fontWeight: "800", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeSuccess: { backgroundColor: 'rgba(39, 174, 96, 0.15)' },
  badgeWarning: { backgroundColor: 'rgba(248, 192, 9, 0.15)' },
  statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  
  progressCenter: { alignItems: 'center', marginVertical: 4 },
  percentageText: { 
    fontSize: 32, 
    fontWeight: "900", 
    color: COLORS.primary 
  },

  progressTrack: { 
    height: 8, 
    backgroundColor: "#E9ECEF", 
    borderRadius: 4, 
    overflow: "hidden", 
    marginVertical: 8 
  },
  progressFill: { height: "100%", backgroundColor: COLORS.accent, borderRadius: 4 },
  
  statsRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: 'center', 
    marginTop: 4 
  },
  statBox: { flexDirection: 'row', alignItems: 'center' },
  statIconSmall: { padding: 4, borderRadius: 6 }, 
  statLabel: { fontSize: 10, color: COLORS.muted, fontWeight: "700" },
  statValue: { fontSize: 13, fontWeight: "900", marginTop: 1 },
  statDivider: { width: 1, height: 20, backgroundColor: '#E9ECEF', marginHorizontal: 5 },

  // Mini Grid
  miniGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  miniCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 18, 
    padding: 10, 
    flexDirection: 'column',
    alignItems: 'center', 
    elevation: 4,
    // Width is now handled dynamically via props
  },
  iconBox: { padding: 6, borderRadius: 12, marginBottom: 6 }, 
  textCol: { justifyContent: 'center', alignItems: 'center' }, 
  miniVal: { fontSize: 13, fontWeight: "900", color: COLORS.primary }, 
  miniLabel: { fontSize: 8, fontWeight: "700", color: COLORS.muted, marginBottom: 2, textAlign: 'center' },
  incentiveSubText: { fontSize: 13, fontWeight: "700", color: COLORS.success, marginTop: 2, textAlign: 'center' },

  // No Target
  noTargetCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
  },
  noTargetIconBg: { backgroundColor: 'rgba(248, 192, 9, 0.15)', padding: 15, borderRadius: 20, marginBottom: 10 },
  noTargetTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 5 },
  noTargetSub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  // Section Header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#fff", marginRight: 10 },
  countBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  countText: { color: COLORS.primary, fontWeight: '900', fontSize: 12 },

  // List Card
  listCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 14, 
    marginBottom: 12,
    elevation: 4
  },
  listHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  
  clientName: { fontSize: 15, fontWeight: "800", color: COLORS.primary, marginBottom: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  contactItem: { flexDirection: 'row', alignItems: 'center' },
  contactText: { fontSize: 12, color: COLORS.bgBlue, fontWeight: '700' },
  emailText: { fontSize: 11, color: COLORS.muted, marginTop: 2, marginRight: 10 },
  
  amountPill: { backgroundColor: '#F0F9F4', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 },
  amountText: { fontSize: 13, fontWeight: "900", color: COLORS.success },
  
  listFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F1F4F8", flexDirection: 'row' },
  schemeBadge: { backgroundColor: '#F8F9FA', padding: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  schemeText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 40, opacity: 0.6 },
  noDataText: { color: "#fff", textAlign: "center", marginTop: 12, fontSize: 15, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  pickerSheet: { backgroundColor: "#fff", padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: "900", marginBottom: 25, color: COLORS.primary, textAlign: 'center' },
  pickerSubLabel: { fontSize: 12, fontWeight: '800', color: COLORS.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  yearScroll: { marginBottom: 20 },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  monthBox: { width: "31%", paddingVertical: 14, alignItems: "center", borderRadius: 14, backgroundColor: "#F5F7FA", marginBottom: 10 },
  yearBox: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, backgroundColor: "#F5F7FA", marginRight: 10 },
  activeBox: { backgroundColor: COLORS.primary, elevation: 4 },
  boxText: { fontWeight: "800", color: "#8898AA", fontSize: 14 },
  whiteText: { color: "#fff" },
  applyBtn: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 18, marginTop: 25, alignItems: "center", elevation: 4 },
  applyBtnText: { fontWeight: "900", fontSize: 15, color: COLORS.primary, letterSpacing: 1 },
});
