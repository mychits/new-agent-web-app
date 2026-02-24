import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import baseUrl from "../constants/baseUrl";

const { width } = Dimensions.get("window");

// Design Constants
const TOP_GRADIENT = ["#24C6DC", "#183A5D"];
const MODERN_PRIMARY = "#0d0d0d";
const ACCENT_BLUE = "#1796d1";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const HIGHLIGHT_GOLD = "#f5be6d";
const EXPAND_BG = "#f8fafc";

const StarPoints = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pointsData, setPointsData] = useState([]);
  const [totals, setTotals] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  const formatDateForApi = (date) => date.toISOString().split("T")[0];

  const formatDateDisplay = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day} - ${month} - ${date.getFullYear()}`;
  };

  useEffect(() => {
    fetchStarPoints();
  }, [selectedDate]);

  const fetchStarPoints = async () => {
    setLoading(true);
    try {
      const storedAgentInfo = await AsyncStorage.getItem("agentInfo");
      if (!storedAgentInfo) throw new Error("Please login again.");
      const parsedAgent = JSON.parse(storedAgentInfo);
      const agentId = parsedAgent?._id;

      const formattedDate = formatDateForApi(selectedDate);
      const requestUrl = `${baseUrl}/agent/points?agentId=${agentId}&fromDate=${formattedDate}&endDate=${formattedDate}`;

      const response = await axios.get(requestUrl, { timeout: 10000 });

      if (response.data && response.data.status === true) {
        const apiData = response.data.data || [];
        setPointsData(apiData);
        calculateTotals(apiData);
      } else {
        setPointsData([]);
        setTotals({});
      }
    } catch (error) {
      Alert.alert("Error", "Could not fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (data) => {
    const newTotals = { app: 0, leads: 0, loans: 0, enr: 0 };
    data.forEach((item) => {
      newTotals.app += Number(item.referral_customer_app_count || 0);
      newTotals.leads += Number(item.leads_count || 0);
      newTotals.loans += Number(item.loans_count || 0);
      newTotals.enr += Number(item.enrollments_count || 0);
    });
    setTotals(newTotals);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    setActiveTab(null);
  };

  // --- Helper: Generate WhatsApp Text & Share ---
  const shareToWhatsApp = async (item) => {
    const totalPoints = 
      Number(item.referral_customer_app_count || 0) +
      Number(item.leads_count || 0) +
      Number(item.loans_count || 0) +
      Number(item.enrollments_count || 0);

    const message = `*${item.name}*\nAPP: ${item.referral_customer_app_count || 0}\nLEADS: ${item.leads_count || 0}\n*LOAN: ${item.loans_count || 0}*\nPIGME: 0\nENROLLMENTS: ${item.enrollments_count || 0}\n*TOTAL POINTS: ${totalPoints}*`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.log(error.message);
    }
  };

  // --- Sub-Components ---
  const DetailItem = ({ label, value }) => (
    <Text style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}: </Text>
      {value || "N/A"}
    </Text>
  );

  const renderDetailsPanel = (item) => {
    if (expandedId !== item._id) return null;

    const totalPoints = 
      Number(item.referral_customer_app_count || 0) +
      Number(item.leads_count || 0) +
      Number(item.loans_count || 0) +
      Number(item.enrollments_count || 0);

    return (
      <View style={styles.detailsPanel}>
        {/* WhatsApp Style Summary Box */}
        <View style={styles.whatsappCard}>
          <Text style={styles.waTextBold}>*{item.name}*</Text>
          <Text style={styles.waText}>APP: {item.referral_customer_app_count || 0}</Text>
          <Text style={styles.waText}>LEADS: {item.leads_count || 0}</Text>
          <Text style={styles.waTextBold}>*LOAN: {item.loans_count || 0}*</Text>
          <Text style={styles.waText}>PIGME: 0</Text>
          <Text style={styles.waText}>ENROLLMENTS: {item.enrollments_count || 0}</Text>
          <Text style={styles.waTextBold}>*TOTAL POINTS: {totalPoints}*</Text>
          
          <TouchableOpacity 
            style={styles.shareBtn} 
            onPress={() => shareToWhatsApp(item)}
          >
            <Text style={styles.shareBtnText}>Share Summary 📲</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewActionRow}>
          <TouchableOpacity 
            style={[styles.viewBtn, activeTab === 'leads' && styles.activeBtn]} 
            onPress={() => setActiveTab(activeTab === 'leads' ? null : 'leads')}
          >
            <Text style={styles.viewBtnText}>View Leads ({item.leads_count})</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.viewBtn, activeTab === 'enr' && styles.activeBtn]} 
            onPress={() => setActiveTab(activeTab === 'enr' ? null : 'enr')}
          >
            <Text style={styles.viewBtnText}>View Enrollments ({item.enrollments_count})</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'leads' && (
          <View style={styles.listWrapper}>
            {item.leads?.length > 0 ? item.leads.map((lead, i) => (
              <View key={i} style={styles.infoCard}>
                <DetailItem label="Lead Name" value={lead.lead_name} />
                <DetailItem label="Phone" value={lead.lead_phone} />
                <DetailItem label="Group" value={lead.group_id?.group_name} />
                <DetailItem label="Value" value={`₹${lead.group_id?.group_value}`} />
              </View>
            )) : <Text style={styles.emptyText}>No Lead Details Available</Text>}
          </View>
        )}

        {activeTab === 'enr' && (
          <View style={styles.listWrapper}>
            {item.enrollments?.length > 0 ? item.enrollments.map((enr, i) => (
              <View key={i} style={styles.infoCard}>
                <DetailItem label="Enrollment ID" value={enr._id} />
                <DetailItem label="Status" value="Active" />
              </View>
            )) : <Text style={styles.emptyText}>No Enrollment Details Available</Text>}
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={TOP_GRADIENT} style={{ flex: 1 }}>
      <View style={styles.mainContentArea}>
        <Header />
        <View style={styles.introSection}>
          <Text style={styles.pageTitle}>Star Points</Text>
          <Text style={styles.pageSubtitle}>Daily Agent Tracking</Text>
        </View>

        <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.datePickerText}>📅   {formatDateDisplay(selectedDate)}</Text>
          <Text style={styles.datePickerAction}>Change</Text>
        </TouchableOpacity>

        <ScrollView style={styles.scrollViewStyle} showsVerticalScrollIndicator={false}>
          <View style={styles.tableCard}>
            {loading ? (
              <ActivityIndicator size="large" color={ACCENT_BLUE} style={{ marginVertical: 40 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tableContainer}>
                  {/* Header */}
                  <View style={styles.tableRowHeader}>
                    <Text style={[styles.tableCell, styles.cellSl, styles.headerText]}>SL</Text>
                    <Text style={[styles.tableCell, styles.cellName, styles.headerText]}>NAME</Text>
                    <Text style={[styles.tableCell, styles.cellSmall, styles.headerText]}>APP</Text>
                    <Text style={[styles.tableCell, styles.cellSmall, styles.headerText]}>LEAD</Text>
                    <Text style={[styles.tableCell, styles.cellSmall, styles.headerText]}>LOAN</Text>
                    <Text style={[styles.tableCell, styles.cellSmall, styles.headerText]}>ENR</Text>
                    <Text style={[styles.tableCell, styles.cellAction, styles.headerText]}>VIEW</Text>
                  </View>

                  {/* Body */}
                  {pointsData.map((item, index) => (
                    <View key={item._id || index}>
                      <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.cellSl]}>{index + 1}</Text>
                        <Text style={[styles.tableCell, styles.cellName]}>{item.name}</Text>
                        <Text style={[styles.tableCell, styles.cellSmall]}>{item.referral_customer_app_count}</Text>
                        <Text style={[styles.tableCell, styles.cellSmall]}>{item.leads_count}</Text>
                        <Text style={[styles.tableCell, styles.cellSmall]}>{item.loans_count}</Text>
                        <Text style={[styles.tableCell, styles.cellSmall]}>{item.enrollments_count}</Text>
                        <TouchableOpacity style={styles.eyeBtn} onPress={() => toggleExpand(item._id)}>
                          <Text style={{fontSize: 18}}>{expandedId === item._id ? "🔼" : "👁️"}</Text>
                        </TouchableOpacity>
                      </View>
                      {renderDetailsPanel(item)}
                    </View>
                  ))}

                  {/* Total Footer */}
                  {pointsData.length > 0 && (
                    <View style={styles.tableRowTotal}>
                      <Text style={[styles.tableCell, styles.cellSl]}>Σ</Text>
                      <Text style={[styles.tableCell, styles.cellName, styles.totalText]}>TOTAL</Text>
                      <Text style={[styles.tableCell, styles.cellSmall, styles.totalText]}>{totals.app}</Text>
                      <Text style={[styles.tableCell, styles.cellSmall, styles.totalText]}>{totals.leads}</Text>
                      <Text style={[styles.tableCell, styles.cellSmall, styles.totalText]}>{totals.loans}</Text>
                      <Text style={[styles.tableCell, styles.cellSmall, styles.totalText]}>{totals.enr}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker 
            value={selectedDate} 
            mode="date" 
            display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
            onChange={(e, d) => { setShowDatePicker(false); if(d) setSelectedDate(d); }} 
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContentArea: { flex: 1, marginHorizontal: 15, marginTop: 40 },
  introSection: { marginVertical: 10 },
  pageTitle: { fontSize: 28, fontWeight: "900", color: "#fff" },
  pageSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  datePickerButton: {
    flexDirection: "row", backgroundColor: CARD_BG, borderRadius: 12,
    padding: 15, alignItems: "center", marginBottom: 15, elevation: 4,
  },
  datePickerText: { flex: 1, fontWeight: "bold", color: MODERN_PRIMARY },
  datePickerAction: { color: ACCENT_BLUE, fontWeight: "bold" },
  tableCard: { backgroundColor: CARD_BG, borderRadius: 15, padding: 5, elevation: 5, marginBottom: 20 },
  tableContainer: { width: 520 }, 
  tableRowHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0", paddingVertical: 15, alignItems: 'center' },
  tableRowTotal: { flexDirection: "row", paddingVertical: 15, backgroundColor: HIGHLIGHT_GOLD, borderRadius: 8, marginTop: 5 },
  tableCell: { textAlign: "center", fontSize: 12, color: TEXT_GREY },
  cellSl: { width: 35 },
  cellName: { width: 120, textAlign: 'left', fontWeight: '500', color: '#000' },
  cellSmall: { width: 60 },
  cellAction: { width: 60 },
  headerText: { fontWeight: "bold", color: MODERN_PRIMARY, fontSize: 11 },
  totalText: { fontWeight: "900", color: '#000' },
  eyeBtn: { width: 60, alignItems: 'center' },
  
  // WhatsApp Style Box
  whatsappCard: { 
    backgroundColor: '#DCF8C6', 
    padding: 15, 
    borderRadius: 10, 
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ced4da'
  },
  waText: { 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    fontSize: 14, 
    color: '#333',
    lineHeight: 20
  },
  waTextBold: { 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#000',
    lineHeight: 20
  },
  shareBtn: {
    marginTop: 10,
    backgroundColor: '#25D366',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center'
  },
  shareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  detailsPanel: { backgroundColor: EXPAND_BG, padding: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  viewActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 10 },
  viewBtn: { flex: 0.48, backgroundColor: ACCENT_BLUE, padding: 8, borderRadius: 6, alignItems: 'center' },
  activeBtn: { backgroundColor: MODERN_PRIMARY },
  viewBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  listWrapper: { marginTop: 5 },
  infoCard: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8, elevation: 1, borderLeftWidth: 3, borderLeftColor: ACCENT_BLUE },
  detailText: { fontSize: 12, marginBottom: 2, color: '#333' },
  detailLabel: { fontWeight: 'bold', color: TEXT_GREY },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 12, marginVertical: 10 }
});

export default StarPoints;