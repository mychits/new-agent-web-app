import React, { useState, useEffect } from 'react';
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
  secondary: "#183A5D",
  tertiary: "#2C5364",
  accent: "#FFD700",
  success: "#00E676",
  danger: "#FF5252",
  warning: "#FFAB40",
  white: "#FFFFFF",
  glass: "rgba(255, 255, 255, 0.12)",
  glassBorder: "rgba(255, 255, 255, 0.2)",
  textMuted: "rgba(255, 255, 255, 0.6)"
};

const ActivityDot = ({ status }) => {
  let bgColor = 'rgba(255,255,255,0.1)';
  if (status === 'Present') bgColor = COLORS.success;
  if (status === 'Absent') bgColor = COLORS.danger;
  if (status === 'Half Day') bgColor = COLORS.warning;
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
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(moment().month());
  const [year, setYear] = useState(moment().year());
  const [showPicker, setShowPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailType, setDetailType] = useState('');
  const [filteredDates, setFilteredDates] = useState([]);

  const currentYear = moment().year();
  const currentMonth = moment().month();

  useEffect(() => { fetchAttendanceData(); }, [month, year]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const startDate = moment([year, month]).startOf("month").format("YYYY-MM-DD");
      const endDate = moment([year, month]).endOf("month").format("YYYY-MM-DD");

      const response = await axios.get(`${baseUrl}/employee-attendance/app-monthly-report`, {
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

  const handleShowDetails = (type) => {
    setDetailType(type);
    setFilteredDates((data?.attendanceDataResponse || []).filter(item => item.status === type));
    setShowDetails(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.secondary }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.tertiary, COLORS.secondary]} style={StyleSheet.absoluteFillObject} />

      <View style={styles.headerPadding}><Header /></View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Attendence Report</Text>
          <View style={styles.accentBar} />
        </View>

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
              <AttendanceMetric
                label="Present Days"
                value={data?.summary?.total_present}
                color={COLORS.success}
                icon="check-decagram"
                onShowDetails={() => handleShowDetails('Present')}
              />
              <AttendanceMetric
                label="Absent Days"
                value={data?.summary?.total_absent}
                color={COLORS.danger}
                icon="close-octagon"
                onShowDetails={() => handleShowDetails('Absent')}
              />
              <AttendanceMetric
                label="Half Day"
                value={data?.summary?.total_half_day}
                color={COLORS.warning}
                icon="clock-outline"
                onShowDetails={() => handleShowDetails('Half Day')}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Date Picker Modal with Validation */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Month</Text>

            {/* Year Switcher with Lock */}
            <View style={styles.yearSwitcher}>
              <TouchableOpacity onPress={() => setYear(year - 1)}>
                <Ionicons name="chevron-back" size={24} color={COLORS.accent} />
              </TouchableOpacity>
              <Text style={styles.yearLabel}>{year}</Text>
              <TouchableOpacity
                disabled={year >= currentYear}
                onPress={() => setYear(year + 1)}
                style={{ opacity: year >= currentYear ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-forward" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            </View>

            {/* Month Grid with Lock */}
            <View style={styles.monthGrid}>
              {moment.monthsShort().map((m, i) => {
                const isFutureMonth = year === currentYear && i > currentMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    disabled={isFutureMonth}
                    onPress={() => { setMonth(i); setShowPicker(false); }}
                    style={[
                      styles.monthItem,
                      month === i && styles.activeMonthItem,
                      isFutureMonth && { opacity: 0.2 }
                    ]}
                  >
                    <Text style={[
                      styles.monthItemText,
                      month === i && styles.activeMonthItemText
                    ]}>
                      {m.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detailed Logs Modal */}
      <Modal visible={showDetails} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{detailType} History</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredDates.length > 0 ? filteredDates.map((item, idx) => (
                <View key={idx} style={styles.detailItem}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateNum}>{moment(item.date).format("DD")}</Text>
                    <Text style={styles.dateMonth}>{moment(item.date).format("MMM")}</Text>
                  </View>
                  <View style={{ marginLeft: 15 }}>
                    <Text style={styles.dayText}>{moment(item.date).format("dddd")}</Text>
                    <Text style={styles.statusText}>Status: {item.status}</Text>
                  </View>
                </View>
              )) : (
                <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 20 }}>No records found.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerPadding: { paddingHorizontal: 20, paddingTop: 45 },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 160 },
  titleSection: { marginTop: 10, marginBottom: 20 },
  mainTitle: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  accentBar: { width: 40, height: 4, backgroundColor: COLORS.accent, marginTop: 4, borderRadius: 2 },
  filterSection: { marginBottom: 20 },
  glassFilterBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.glass, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  calendarIcon: { backgroundColor: COLORS.accent, padding: 8, borderRadius: 12 },
  filterDateText: { color: COLORS.white, marginLeft: 12, fontWeight: '800', fontSize: 15 },
  flexRow: { flexDirection: 'row', alignItems: 'center' },
  heatmapCard: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardSmallTitle: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 15 },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heatDot: { width: (width - 120) / 7.5, height: 10, borderRadius: 3 },
  legendRow: { flexDirection: 'row', marginTop: 15, gap: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
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
  statusText: { color: COLORS.textMuted, fontSize: 11 }
});

export default AttendanceScreen;