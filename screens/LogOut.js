import React, { useState, useEffect } from "react";
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
    RefreshControl
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header"; 
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import baseUrl from "../constants/baseUrl";

const { width } = Dimensions.get('window');

const COLORS = {
    PRIMARY: "#0f7699",
    PRIMARY_LIGHT: "#1aa2ccff",
    DARK: "#1e293b",
    SLATE: "#64748b",
    WHITE: "#ffffff",
    BG: "#f8fafc",
    SUCCESS: "#10b981",
    SUCCESS_GRADIENT: ["#10b981", "#059669"],
    DANGER: ["#ff4b2b", "#ff416c"],
    DANGER_LIGHT: "#fff1f2"
};

const LogOut = ({ navigation }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchingOut, setPunchingOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); 
  const [refreshKey, setRefreshKey] = useState(0); 

  const fetchAttendance = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) return;
      const user = JSON.parse(userJson);
      const employeeId = user?.userId || user?._id;

      const response = await axios.get(`${baseUrl}/employee-attendance/attendance/${employeeId}`);
      if (response.data.success) {
        setAttendanceData(response.data.data);
        setRefreshKey(prev => prev + 1); 
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
      setPunchingOut(false); 
    }
  };

  const handlePunchOut = async () => {
    setShowConfirmModal(false);
    setPunchingOut(true); 
    
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = JSON.parse(userJson);
      const employeeId = user?.userId || user?._id;

      const response = await axios.put(`${baseUrl}/employee-attendance/punch`, {
        employee_id: employeeId
      });

      const isSuccessful = response.data.success || 
                          (response.data.message && response.data.message.toLowerCase().includes("successfully"));

      if (isSuccessful) {
        await fetchAttendance(); 
        setShowSuccessModal(true);
      } else {
        setPunchingOut(false);
        alert(response.data.message || "Could not end shift.");
      }
    } catch (err) {
      setPunchingOut(false);
      console.error("Punch Out Error:", err);
      alert("Check your connection or API route.");
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Helper to format the date display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.successModalPadding}>
                    <View style={styles.successIconOuter}>
                        <LinearGradient colors={COLORS.SUCCESS_GRADIENT} style={styles.successIconInner}>
                            <Ionicons name="checkmark-done" size={50} color="#fff" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.modalTitle}>Shift Ended!</Text>
                    <Text style={styles.modalSub}>Great job today. Your logout time has been recorded successfully.</Text>
                    
                    <TouchableOpacity 
                        style={styles.doneBtn} 
                        onPress={() => setShowSuccessModal(false)}
                    >
                        <LinearGradient colors={COLORS.SUCCESS_GRADIENT} style={styles.doneBtnGradient}>
                            <Text style={styles.confirmBtnText}>CLOSE OVERVIEW</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* CONFIRMATION MODAL */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <LinearGradient colors={[COLORS.DANGER_LIGHT, '#ffffff']} style={styles.modalGradient}>
                    <View style={styles.modalIconBg}>
                        <MaterialCommunityIcons name="clock-end" size={40} color="#ff416c" />
                    </View>
                    <Text style={styles.modalTitle}>End Shift?</Text>
                    <Text style={styles.modalSub}>Are you sure you want to punch out and finish your work for today?</Text>
                    
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfirmModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={handlePunchOut}>
                            <LinearGradient colors={COLORS.DANGER} style={styles.confirmBtnGradient}>
                                <Text style={styles.confirmBtnText}>Punch Out</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        </View>
      </Modal>

      <LinearGradient colors={[COLORS.PRIMARY_LIGHT, COLORS.PRIMARY]} style={styles.topHeader}>
          <Header />
          <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Attendance Overview</Text>
              <Text style={styles.headerSubTitle}>View your daily logs and manage your time</Text>
          </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        {(loading || punchingOut) ? (
          <View style={styles.fullPageLoader}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loaderText}>Processing...</Text>
          </View>
        ) : (
          <ScrollView 
              key={refreshKey} 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scroll}
              refreshControl={
                  <RefreshControl refreshing={loading} onRefresh={fetchAttendance} color={COLORS.PRIMARY} />
              }
          >
            {attendanceData ? (
              <View>
                <View style={styles.glassCard}>
                  <View style={styles.profileRow}>
                      <LinearGradient colors={['#e0f2fe', '#bae6fd']} style={styles.avatar}>
                          <Ionicons name="person" size={35} color={COLORS.PRIMARY} />
                      </LinearGradient>
                      <View style={styles.nameCol}>
                          <Text style={styles.nameText}>{attendanceData.employee_id?.name || 'User'}</Text>
                          <Text style={styles.roleText}>Official Employee</Text>
                      </View>
                  </View>

                  <View style={styles.infoGrid}>
                      <View style={styles.infoRow}>
                          <View style={styles.miniIcon}><Ionicons name="call" size={14} color={COLORS.PRIMARY} /></View>
                          <Text style={styles.infoValue}>{attendanceData.employee_id?.phone_number || 'N/A'}</Text>
                      </View>
                      
                      {/* NEW DATE ROW ADDED HERE */}
                      <View style={styles.infoRow}>
                          <View style={styles.miniIcon}><Ionicons name="calendar" size={14} color={COLORS.PRIMARY} /></View>
                          <Text style={styles.infoValue}>{formatDate(attendanceData.date || attendanceData.createdAt)}</Text>
                      </View>

                      <View style={styles.infoRow}>
                          <View style={styles.miniIcon}><Ionicons name="location" size={14} color={COLORS.PRIMARY} /></View>
                          <Text style={styles.infoValue} numberOfLines={1}>{attendanceData.employee_id?.address || 'N/A'}</Text>
                      </View>
                  </View>
                </View>

                {/* TIME SECTION WITH GREEN/RED LOGIC */}
                <View style={styles.timeSection}>
                    <View style={[styles.timeCircle, styles.successCircle]}>
                        <Text style={styles.timeLabel}>PUNCH IN</Text>
                        <Text style={styles.timeMain}>{attendanceData.time}</Text>
                    </View>
                    
                    <View style={styles.timeConnector} />
                    
                    <View style={[
                        styles.timeCircle, 
                        attendanceData.logout_time && styles.dangerCircle
                    ]}>
                        <Text style={styles.timeLabel}>PUNCH OUT</Text>
                        <Text style={[styles.timeMain, !attendanceData.logout_time && {color: '#cbd5e1'}]}>
                          {attendanceData.logout_time || '--:--'}
                        </Text>
                    </View>
                </View>

                {!attendanceData.logout_time && (
                  <View style={styles.buttonWrapper}>
                      <TouchableOpacity 
                          activeOpacity={0.8}
                          style={styles.fabButton}
                          onPress={() => setShowConfirmModal(true)}
                      >
                          <LinearGradient colors={COLORS.DANGER} style={styles.fabGradient}>
                              <MaterialCommunityIcons name="logout" size={28} color="#fff" />
                              <Text style={styles.fabText}>END MY SHIFT</Text>
                          </LinearGradient>
                      </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
               <View style={{alignItems: 'center', marginTop: 50}}>
                  <Text style={{color: COLORS.SLATE}}>No attendance record found.</Text>
               </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.PRIMARY_LIGHT },
  topHeader: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 10 },
  headerTitleContainer: { marginTop: 15, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  headerSubTitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', marginTop: 5, textAlign: 'center' },
  contentContainer: { flex: 1, backgroundColor: COLORS.BG, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -30 },
  scroll: { padding: 25, paddingBottom: 50 },
  fullPageLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 10, color: COLORS.SLATE, fontWeight: '600' },
  glassCard: { backgroundColor: '#fff', borderRadius: 30, padding: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 65, height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  nameCol: { marginLeft: 15 },
  nameText: { fontSize: 22, fontWeight: '900', color: COLORS.DARK },
  roleText: { fontSize: 13, color: COLORS.PRIMARY, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  infoGrid: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniIcon: { backgroundColor: '#f0f9ff', padding: 5, borderRadius: 8 },
  infoValue: { fontSize: 14, color: COLORS.SLATE, fontWeight: '600' },
  timeSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 35 },
  timeCircle: { width: (width / 2) - 35, height: 115, backgroundColor: '#fff', borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f1f5f9' },
  successCircle: { borderColor: COLORS.SUCCESS, backgroundColor: '#f0fdf4' },
  dangerCircle: { borderColor: "#ff416c", backgroundColor: '#fff1f2' },
  timeConnector: { width: 10, height: 2, backgroundColor: '#e2e8f0' },
  timeLabel: { fontSize: 11, fontWeight: '900', color: COLORS.SLATE, marginBottom: 8, letterSpacing: 1 },
  timeMain: { fontSize: 22, fontWeight: '900', color: COLORS.DARK },
  buttonWrapper: { marginTop: 45, alignItems: 'center' },
  fabButton: { width: '100%', height: 75, borderRadius: 25, overflow: 'hidden', elevation: 12 },
  fabGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
  fabText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalContent: { width: '100%', borderRadius: 35, backgroundColor: '#fff', overflow: 'hidden' },
  modalGradient: { padding: 35, alignItems: 'center' },
  modalIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 26, fontWeight: '900', color: COLORS.DARK },
  modalSub: { fontSize: 16, color: COLORS.SLATE, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 35 },
  cancelBtn: { flex: 1, height: 60, justifyContent: 'center', alignItems: 'center', borderRadius: 18, backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: COLORS.SLATE, fontWeight: '700' },
  confirmBtn: { flex: 2, height: 60, borderRadius: 18, overflow: 'hidden' },
  confirmBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  successModalPadding: { padding: 40, alignItems: 'center' },
  successIconOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ecfdf5', padding: 10, marginBottom: 20 },
  successIconInner: { flex: 1, borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  doneBtn: { width: '100%', height: 60, borderRadius: 18, overflow: 'hidden', marginTop: 30 },
  doneBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default LogOut;