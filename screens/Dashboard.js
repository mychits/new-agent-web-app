import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Svg, { G, Circle } from "react-native-svg";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";

import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

const { width } = Dimensions.get("window");
const circumference = 2 * Math.PI * 65;

// Define Animated component outside to prevent errors
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const COLORS = {
  primary: "#183A5D", // Dark Navy from Target.js
  accent: "#f8c009ff", // Gold from Target.js
  bgBlue: "#1aa2ccff", // Light Blue gradient
  success: "#27AE60",
  white: "#FFFFFF",
  muted: "#8898AA",
  glass: "rgba(255, 255, 255, 0.15)",
};

const Dashboard = ({ navigation }) => {
  const [agent, setAgent] = useState({});
  const [targetData, setTargetData] = useState({ total: 0, achieved: 0 });
  const [totalCollection, setTotalCollection] = useState(0);
  const [todayPayments, setTodayPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const agentInfoJson = await AsyncStorage.getItem("agentInfo");
      const agentInfoData = agentInfoJson ? JSON.parse(agentInfoJson) : null;
      const agentId = agentInfoData?._id;

      if (!agentId) return;
      setAgent(agentInfoData);

      const startDate = moment().startOf("month").format("YYYY-MM-DD");
      const endDate = moment().endOf("month").format("YYYY-MM-DD");

      // Fast parallel fetching
      const [incRes, tarRes, payRes] = await Promise.all([
        axios.get(`${baseUrl}/enroll/employee/${agentId}/incentive?start_date=${startDate}&end_date=${endDate}`).catch(() => null),
        axios.get(`${baseUrl}/target/employees/${agentId}?start_date=${startDate}&end_date=${endDate}`).catch(() => null),
        axios.get(`${baseUrl}/payment/get-payment-agent/${agentId}`).catch(() => null)
      ]);

      const tarData = tarRes?.data || {};
      const summary = incRes?.data?.incentiveSummary || {};
      
      const achieved = Number(tarData?.summary?.metrics?.actual_business || 0) + Number(summary?.total_group_value || 0);
      const total = Number(tarData?.total_target || 0);

      setTargetData({ total, achieved });
      setProgress(total > 0 ? Math.min((achieved / total) * 100, 100) : 0);

      const pms = payRes?.data || [];
      const today = moment().format("YYYY-MM-DD");
      const filtered = pms.filter(p => moment(p.pay_date).format("YYYY-MM-DD") === today);
      
      setTodayPayments(filtered);
      setTotalCollection(filtered.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0));

    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.bgBlue, COLORS.primary]} style={StyleSheet.absoluteFill} />

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Header pushed down for style */}
          <View style={styles.headerWrapper}>
            <Header />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            
            {/* Greeting */}
            <View style={styles.greetRow}>
              <View>
                <Text style={styles.greetText}>Hi, {agent.name?.split(' ')[0] || "Agent"}</Text>
                <Text style={styles.dateText}>{moment().format("dddd, DD MMM")}</Text>
              </View>
              <TouchableOpacity style={styles.notifBtn}>
                 <Ionicons name="notifications-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Premium Target Card */}
            <LinearGradient colors={['#ffffff', '#f1f1f1']} style={styles.mainCard}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTag}>MONTHLY PERFORMANCE</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Target")}>
                   <Text style={styles.viewMore}>View Details</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsContainer}>
                 <View style={styles.chartArea}>
                    <Svg width="120" height="120" viewBox="0 0 150 150">
                        <G rotation="-90" origin="75, 75">
                            <Circle cx="75" cy="75" r="65" stroke="#F0F0F0" strokeWidth="10" fill="none" />
                            <AnimatedCircle 
                                cx="75" cy="75" r="65" 
                                stroke={COLORS.accent} 
                                strokeWidth="12" 
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </G>
                    </Svg>
                    <View style={styles.absoluteCenter}>
                        <Text style={styles.percentText}>{progress.toFixed(0)}%</Text>
                    </View>
                 </View>

                 <View style={styles.textStats}>
                    <Text style={styles.statLabel}>Target Amount</Text>
                    <Text style={styles.targetAmt}>₹{targetData.total.toLocaleString()}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.statLabel}>Achieved</Text>
                    <Text style={styles.achievedAmt}>₹{targetData.achieved.toLocaleString()}</Text>
                 </View>
              </View>
            </LinearGradient>

            {/* Quick Stats Grid */}
            <View style={styles.collectionStrip}>
                <View style={styles.colIcon}>
                    <MaterialCommunityIcons name="finance" size={24} color={COLORS.success} />
                </View>
                <View style={{marginLeft: 15, flex: 1}}>
                    <Text style={styles.colLabel}>Today's Total Collection</Text>
                    <Text style={styles.colValue}>₹{totalCollection.toLocaleString()}</Text>
                </View>
                <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                    <Feather name="refresh-ccw" size={18} color={COLORS.muted} />
                </TouchableOpacity>
            </View>

            {/* Activity List */}
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Live Activity</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{todayPayments.length}</Text></View>
            </View>

            {todayPayments.length > 0 ? todayPayments.map((p, i) => (
              <View key={i} style={styles.glassItem}>
                <View style={styles.userCircle}>
                    <Text style={styles.userInitial}>{p?.user_id?.full_name?.charAt(0)}</Text>
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                    <Text style={styles.uName}>{p?.user_id?.full_name}</Text>
                    <Text style={styles.uDetail}>Receipt: {p.receipt_no}</Text>
                </View>
                <View style={styles.priceTag}>
                    <Text style={styles.uPrice}>+₹{p.amount}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.noData}>No collections yet today.</Text>
            )}

          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerWrapper: { 
    marginTop: Platform.OS === 'ios' ? 55 : 35, // Pushes header down
    paddingHorizontal: 20 
  },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greetText: { fontSize: 28, fontWeight: '900', color: '#fff' },
  dateText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  notifBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: COLORS.glass, justifyContent: 'center', alignItems: 'center' },

  mainCard: { borderRadius: 30, padding: 20, elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardTag: { fontSize: 10, fontWeight: '800', color: COLORS.muted, letterSpacing: 1 },
  viewMore: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  
  statsContainer: { flexDirection: 'row', alignItems: 'center' },
  chartArea: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center' },
  absoluteCenter: { position: 'absolute' },
  percentText: { fontSize: 26, fontWeight: '900', color: COLORS.primary },
  
  textStats: { flex: 1, marginLeft: 25 },
  statLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '700', marginBottom: 2 },
  targetAmt: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8, width: '60%' },
  achievedAmt: { fontSize: 20, fontWeight: '900', color: COLORS.success },

  collectionStrip: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginTop: 20, flexDirection: 'row', alignItems: 'center' },
  colIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  colLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '700' },
  colValue: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  refreshBtn: { padding: 5 },

  listHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 15 },
  listTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  badge: { backgroundColor: COLORS.accent, marginLeft: 10, paddingHorizontal: 8, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '900', color: COLORS.primary },

  glassItem: { 
    backgroundColor: COLORS.glass, 
    padding: 15, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  userCircle: { width: 45, height: 45, borderRadius: 16, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  userInitial: { fontWeight: '900', color: COLORS.primary, fontSize: 18 },
  uName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  uDetail: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  priceTag: { backgroundColor: 'rgba(39, 174, 96, 0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  uPrice: { color: '#4ade80', fontWeight: '900', fontSize: 14 },
  noData: { color: '#fff', opacity: 0.5, textAlign: 'center', marginTop: 20, fontStyle: 'italic' }
});

export default Dashboard;