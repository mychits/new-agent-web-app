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

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchTargetDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const employeeId = agentInfo?._id;

      if (!employeeId) {
        setError("Login required");
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

      setTargetData({
        total_target: Number(targetApi?.total_target || 0),
        total_business: achievedFromTarget + groupValueFromIncentive,
        total_enrollments: Number(summary?.total_enrollments || 0),
      });

      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 800, 
        useNativeDriver: true 
      }).start();
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTargetDetails(); 
  }, [month, year]);

  const handleCall = (phone) => {
    if (!phone) return;
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => console.log("Call failed"));
  };

  const progress = targetData.total_target > 0 
    ? Math.min((targetData.total_business / targetData.total_target) * 100, 100) 
    : 0;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      <Image source={backgroundImage} style={styles.bgOverlay} blurRadius={10} />
      <LinearGradient 
        colors={["rgba(26, 162, 204, 0.85)", COLORS.primary]} 
        style={StyleSheet.absoluteFill} 
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Centered Header Section */}
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
              onPress={fetchTargetDetails} 
              style={styles.refreshBtn}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Target Performance</Text>
        </View>

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Fetching Analytics...</Text>
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

              <View style={styles.mainCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>Current Progress</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{progress >= 100 ? 'Target Met' : 'In Progress'}</Text>
                  </View>
                </View>
                
                <Text style={styles.percentageText}>{progress.toFixed(1)}%</Text>
                
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                
                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.statLabel}>Achieved</Text>
                    <Text style={styles.statValue}>₹{targetData.total_business.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statLabel}>Monthly Goal</Text>
                    <Text style={styles.statValue}>₹{targetData.total_target.toLocaleString("en-IN")}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.miniGrid}>
                <View style={styles.miniCard}>
                  <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.miniVal}>{targetData.total_enrollments}</Text>
                  <Text style={styles.miniLabel}>Total Enrollments</Text>
                </View>
                
                <View style={styles.miniCard}>
                  <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                    <MaterialCommunityIcons name="briefcase-check" size={24} color={COLORS.success} />
                  </View>
                  <Text style={styles.miniVal}>₹{targetData.total_business.toLocaleString("en-IN")}</Text>
                  <Text style={styles.miniLabel}>Revenue Generated</Text>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Enrollments List</Text>
                <Text style={styles.countBadge}>{enrollments.length}</Text>
              </View>
              
              {enrollments.length > 0 ? (
                enrollments.map((item, index) => (
                  <View key={item._id || index} style={styles.listCard}>
                    <View style={styles.listHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.user_id?.full_name?.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.clientName}>{item.user_id?.full_name}</Text>
                        <TouchableOpacity 
                          style={styles.phoneRow} 
                          onPress={() => handleCall(item.user_id?.phone_number)}
                        >
                          <Feather name="phone" size={12} color={COLORS.bgBlue} />
                          <Text style={styles.clientContact}> {item.user_id?.phone_number}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.amountContainer}>
                        <Text style={styles.amountText}>₹{item.group_id?.group_value?.toLocaleString("en-IN")}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.listFooter}>
                      <View style={styles.schemeBadge}>
                        <Text style={styles.schemeText}>
                          <Text style={{fontWeight: '900'}}>SCHEME: </Text>
                          {item.group_id?.group_name}
                        </Text>
                      </View>
                      <Text style={styles.emailText} numberOfLines={1}>
                        {item.user_id?.email || 'No email registered'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="database-off-outline" size={50} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.noDataText}>No enrollment records found for this period.</Text>
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

export default Target;

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

  mainCard: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 30, 
    padding: 25, 
    marginBottom: 20, 
    elevation: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 12, fontWeight: "800", color: COLORS.muted, textTransform: "uppercase" },
  statusBadge: { backgroundColor: 'rgba(39, 174, 96, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: COLORS.success, fontSize: 10, fontWeight: '900' },
  percentageText: { fontSize: 48, fontWeight: "900", color: COLORS.primary, marginVertical: 5 },
  
  progressTrack: { height: 14, backgroundColor: "#E9ECEF", borderRadius: 7, overflow: "hidden", marginVertical: 15 },
  progressFill: { height: "100%", backgroundColor: COLORS.accent, borderRadius: 7 },
  
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  statLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "700" },
  statValue: { fontSize: 18, fontWeight: "900", color: COLORS.primary, marginTop: 2 },

  miniGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  miniCard: { 
    backgroundColor: COLORS.white, 
    width: "48%", 
    borderRadius: 25, 
    padding: 20, 
    alignItems: "flex-start",
    elevation: 4
  },
  iconBox: { padding: 10, borderRadius: 15, marginBottom: 12 },
  miniVal: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
  miniLabel: { fontSize: 12, fontWeight: "600", color: COLORS.muted, marginTop: 4 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 24, fontWeight: "900", color: "#fff", marginRight: 10 },
  countBadge: { backgroundColor: COLORS.accent, color: COLORS.primary, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, fontSize: 12, fontWeight: '900', overflow: 'hidden' },

  listCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 25, 
    padding: 18, 
    marginBottom: 15,
    elevation: 3
  },
  listHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "900" },
  clientName: { fontSize: 17, fontWeight: "800", color: COLORS.primary },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingVertical: 2 },
  clientContact: { fontSize: 14, color: COLORS.bgBlue, fontWeight: '700', textDecorationLine: 'underline' },
  amountContainer: { backgroundColor: '#F0F9F4', padding: 8, borderRadius: 12 },
  amountText: { fontSize: 15, fontWeight: "900", color: COLORS.success },
  
  listFooter: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: "#F1F4F8" },
  schemeBadge: { backgroundColor: '#F8F9FA', padding: 6, borderRadius: 8, alignSelf: 'flex-start' },
  schemeText: { fontSize: 12, color: COLORS.primary },
  emailText: { fontSize: 12, color: COLORS.muted, marginTop: 8, fontStyle: 'italic' },

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