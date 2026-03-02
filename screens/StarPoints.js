
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  ActivityIndicator, Alert, Platform, LayoutAnimation, UIManager
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from 'expo-sharing';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Header from "../components/Header"; // Ensure this path is correct
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import baseUrl from "../constants/baseUrl"; // Ensure this path is correct

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");

// Design Constants
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const ACCENT_TEAL = "#00d2ff";
const CARD_BG = "#ffffff";
const TEXT_MAIN = "#102A43";

const StarPoints = ({ navigation, route }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState('day'); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pointsData, setPointsData] = useState([]);
  const [expandedId, setExpandedId] = useState(null); 
  const [activeTab, setActiveTab] = useState(null); 
  
  // State to track which card's details are currently loading
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);

  const viewShotRefs = useRef({});
  const abortControllerRef = useRef(null);

  const getDateRange = (date, mode) => {
    const year = date.getFullYear();
    const month = date.getMonth(); 
    const day = date.getDate();
    let startDate, endDate;
    if (mode === 'year') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    } else if (mode === 'month') {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
    } else {
      startDate = new Date(year, month, day);
      endDate = new Date(year, month, day);
    }
    return { start: startDate.toISOString().split("T")[0], end: endDate.toISOString().split("T")[0] };
  };

  const formatDateDisplay = (date, mode) => {
    const options = { year: 'numeric' };
    if (mode === 'day') { options.day = '2-digit'; options.month = 'short'; } 
    else if (mode === 'month') { options.month = 'long'; }
    return date.toLocaleDateString('en-IN', options);
  };

  useEffect(() => { fetchStarPoints(); }, [selectedDate, filterMode]);

  const fetchStarPoints = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const storedAgentInfo = await AsyncStorage.getItem("agentInfo");
      if (!storedAgentInfo) return;
      const parsedAgent = JSON.parse(storedAgentInfo);
      const agentId = parsedAgent?._id;
      const { start, end } = getDateRange(selectedDate, filterMode);
      const response = await axios.get(`${baseUrl}/agent/points?agentId=${agentId}&fromDate=${start}&endDate=${end}`, { signal: controller.signal });
      if (response.data && response.data.status) setPointsData(response.data.data || []);
      else setPointsData([]);
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.error("Fetch Error:", error);
      setPointsData([]);
    } finally {
      setLoading(false);
    }
  };

  const shareReceipt = async (id) => {
    try {
      const ref = viewShotRefs.current[id];
      if (!ref) return;
      const uri = await captureRef(ref, { format: "png", quality: 0.9 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Receipt' });
    } catch (error) { Alert.alert("Error", "Failed to share."); }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  // --- UPDATED: Handle View Details with Loader and Auto-Select First Tab ---
  const handleViewDetails = (itemId, hasDetails, defaultTabId) => {
    if (!hasDetails) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (expandedId === itemId) {
      setExpandedId(null);
      setDetailsLoadingId(null);
      setActiveTab(null); // Reset tab when closing
    } else {
      setExpandedId(itemId);
      setDetailsLoadingId(itemId); // Start loader
      
      // FIX: Set the first available tab immediately so data shows after loader
      if (defaultTabId) {
        setActiveTab(defaultTabId);
      }
      
      // Simulate network delay for fetching details
      setTimeout(() => {
        setDetailsLoadingId(null); // Stop loader and show data
      }, 1000); // 1 second delay
    }
  };

  const FilterToggle = () => (
    <View style={styles.toggleContainer}>
      {['day', 'month', 'year'].map((mode) => (
        <TouchableOpacity key={mode} style={[styles.toggleOption, filterMode === mode && styles.toggleOptionActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setFilterMode(mode); }}>
          <Text style={[styles.toggleText, filterMode === mode && styles.toggleTextActive]}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const MetricPill = ({ label, value, icon, color }) => (
    <View style={[styles.pillContainer, { borderColor: color }]}>
      <View style={styles.pillContent}>
        <View style={[styles.pillIconCircle, { backgroundColor: color + '15' }]}><MaterialIcons name={icon} size={15} color={color} /></View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.pillLabel} numberOfLines={2}>{label}</Text>
          <Text style={[styles.pillValue, { color: TEXT_MAIN }]}>{value}</Text>
        </View>
      </View>
      <View style={[styles.pillDecoration, { backgroundColor: color + '05' }]} />
    </View>
  );

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
  );

  const LoadingCard = () => {
    const dateDisplay = formatDateDisplay(selectedDate, filterMode);
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={ACCENT_TEAL} />
        <Text style={styles.loaderMainText}>Fetching Data...</Text>
        <Text style={styles.loaderSubText}>Please wait while we load records for {dateDisplay}</Text>
      </View>
    );
  };

  const getRowData = (row, tabId) => {
    let name = 'Unknown', sub = '', val1 = '', val2 = '', val3 = '';
    let label1 = 'Details', label2 = 'Info', label3 = '';

    if (tabId === 'leads') {
      name = row.lead_name || row.name || 'Lead';
      sub = row.group_id?.group_name || row.group_name;
      val1 = row.lead_phone || row.phone || 'N/A';
      val2 = formatCurrency(row.group_id?.group_value || row.amount);
      label1 = "Phone"; label2 = "Group Value";
    } 
    else if (tabId === 'enr') {
      name = row.user_id?.full_name || row.full_name || row.customer_name || 'Customer';
      sub = row.group_id?.group_name || row.group_name;
      val1 = row.user_id?.phone_number || row.phone_number || row.customer_phone || row.mobile || row.phone || 'N/A';
      val2 = formatCurrency(row.group_id?.group_value || row.amount);
      label1 = "Phone Number"; label2 = "Chit Value";
    } 
    else if (tabId === 'loans') {
      name = row.borrower?.full_name || row.full_name || row.borrower_name || row.customer_name || row.applicant_name || 'Borrower';
      sub = row.loan_id || row.loan_number || 'Loan Details';
      val1 = row.borrower?.phone_number || row.phone_number || row.borrower_phone || row.customer_phone || row.contact_no || row.mobile || row.phone || 'N/A';
      val2 = formatCurrency(row.loan_amount || row.amount);
      val3 = row.status || row.loan_status || ''; 
      label1 = "Phone Number"; label2 = "Loan Amount"; label3 = "Status";
    } 
    else if (tabId === 'ref_app') {
      name = row.name || row.customer_name || row.applicant_name;
      sub = row.app_type || row.application_type || 'Referral App';
      val1 = row.phone || row.mobile || row.contact_number;
      val2 = row.created_at || row.date || 'Recent';
      label1 = "Phone"; label2 = "Date";
    } 
    else if (tabId === 'ref_cust') {
      name = row.name || row.customer_name;
      sub = row.referral_code || row.source || 'Referral';
      val1 = row.phone || row.mobile;
      val2 = row.created_at || row.date;
      label1 = "Phone"; label2 = "Referred On";
    } 
    else if (tabId === 'pigmes') {
      name = row.customer?.full_name || row.full_name || row.customer_name || row.name || 'Pigmi Customer';
      sub = row.pigme_id || row.scheme_name || 'Scheme';
      val1 = row.customer?.phone_number || row.phone_number || row.customer_phone || row.contact_no || row.mobile || row.phone || 'N/A';
      val2 = formatCurrency(row.payable_amount || row.amount);
      label1 = "Phone Number"; label2 = "Payable Amount"; 
    }

    return { name, sub, val1, val2, val3, label1, label2, label3 };
  };

  const getMetricsConfig = (item) => [
    { label: "Referral App Count", value: item.referral_customer_app_count || 0, icon: "smartphone", color: "#4CAF50" },
    { label: "Referral Customer Count", value: item.referral_customer_count || 0, icon: "group-add", color: "#2196F3" },
    { label: "Leads Count", value: item.leads_count || 0, icon: "person-add", color: "#FF9800" },
    { label: "Loans Count", value: item.loans_count || 0, icon: "account-balance-wallet", color: "#795548" },
    { label: "Total Loan Amounts", value: formatCurrency(item.total_loan_amounts), icon: "payments", color: "#E91E63" },
    { label: "Pigmes Count", value: item.pigmes_count || 0, icon: "pets", color: "#9C27B0" },
    { label: "Enrollments Count", value: item.enrollments_count || 0, icon: "how-to-reg", color: "#00BCD4" },
    { label: "Enrollments Chit Value", value: formatCurrency(item.enrollments_chit_value), icon: "monetization-on", color: "#FFC107" },
  ];

  return (
    <LinearGradient colors={TOP_GRADIENT} style={{ flex: 1 }}>
      <View style={styles.mainContainer}>
        <Header />
        <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContent}>
          <View>
            <Text style={styles.pageTitle}>Star Points</Text>
            <Text style={styles.pageSubtitle}>Performance Analytics</Text>
          </View>
        </Animated.View>

        <FilterToggle />
        
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
          <View style={styles.dateInfoContainer}>
            <MaterialIcons name="date-range" size={20} color="#fff" style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.dateLabel}>Selected Range</Text>
              <Text style={styles.dateText}>{formatDateDisplay(selectedDate, filterMode)}</Text>
            </View>
          </View>
          <View style={styles.editIconContainer}><MaterialIcons name="edit-calendar" size={24} color="#fff" /></View>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} style={{ flex: 1 }}>
          {loading ? (
            <LoadingCard />
          ) : (
            <>
              {pointsData.length === 0 ? (
                 <View style={styles.emptyBox}>
                    <MaterialIcons name="event-busy" size={80} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyText}>No records found for this period</Text>
                 </View>
              ) : (
                pointsData.map((item, index) => {
                  const itemId = item._id || index.toString();
                  const isExpanded = expandedId === itemId;
                  const metrics = getMetricsConfig(item);
                  
                  const tabsConfig = [
                    { id: 'ref_app', label: 'Ref Apps', countKey: 'referral_customer_app_count', dataKey: 'referral_customer_apps', icon: 'smartphone' },
                    { id: 'ref_cust', label: 'Referrals', countKey: 'referral_customer_count', dataKey: 'referral_customers', icon: 'group-add' },
                    { id: 'leads', label: 'Leads', countKey: 'leads_count', dataKey: 'leads', icon: 'person-add' },
                    { id: 'loans', label: 'Loans', countKey: 'loans_count', dataKey: 'loans', icon: 'account-balance-wallet' },
                    { id: 'pigmes', label: 'Pigmes', countKey: 'pigmes_count', dataKey: 'pigmes', icon: 'pets' },
                    { id: 'enr', label: 'Enrollments', countKey: 'enrollments_count', dataKey: 'enrollments', icon: 'how-to-reg' },
                  ].filter(tab => item[tab.countKey] > 0);

                  const hasDetails = tabsConfig.length > 0;
                  
                  // FIX: Determine the default tab (the first one in the list)
                  const defaultTabId = hasDetails ? tabsConfig[0].id : null;

                  return (
                    <Animated.View entering={FadeInDown.delay(index * 50)} key={itemId} style={{ marginBottom: 25 }}>
                      <ViewShot ref={ref => (viewShotRefs.current[itemId] = ref)} options={{ format: "png", quality: 0.9 }} style={styles.receiptWrapper}>
                        <View style={styles.glassCard}>
                          <View style={styles.cardTop}>
                              <View style={styles.agentAvatar}><Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'A'}</Text></View>
                              <View style={{ flex: 1, marginLeft: 15 }}>
                                  <Text style={styles.agentName}>{item.name || "Agent Name"}</Text>
                                  <Text style={styles.agentRole}>Executive Performance</Text>
                              </View>
                              <View style={styles.verifiedBadge}><MaterialIcons name="verified" size={18} color={ACCENT_TEAL} /></View>
                          </View>
                          
                          <View style={styles.statsGrid}>
                              {metrics.map((metric, idx) => (
                                <Animated.View 
                                  key={idx} 
                                  entering={FadeInDown.delay((index * 50) + (idx * 100)).springify()} 
                                  style={{ width: '48%' }}
                                >
                                  <MetricPill 
                                    label={metric.label} 
                                    value={metric.value} 
                                    icon={metric.icon} 
                                    color={metric.color} 
                                  />
                                </Animated.View>
                              ))}
                          </View>

                          <View style={styles.receiptFooter}>
                              <View style={styles.dashedLine} />
                              <Text style={styles.footerNote}>Report Generated on {new Date().toLocaleDateString()}</Text>
                              <Text style={styles.brandName}>STAR POINTS PRO</Text>
                          </View>
                        </View>
                      </ViewShot>

                      <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.shareBtn} onPress={() => shareReceipt(itemId)}>
                              <FontAwesome5 name="whatsapp" size={18} color="#fff" />
                              <Text style={styles.shareBtnText}>Share Receipt</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                              style={[styles.viewDetailsBtn, !hasDetails && styles.disabledBtn]}
                              // FIX: Pass the defaultTabId here
                              onPress={() => handleViewDetails(itemId, hasDetails, defaultTabId)}
                              disabled={!hasDetails}
                          >
                              <Text style={[styles.viewDetailsText, !hasDetails && styles.disabledText]}>
                                {isExpanded ? "Close Details" : (hasDetails ? "View Details" : "No Details")}
                              </Text>
                          </TouchableOpacity>
                      </View>

                      {isExpanded && hasDetails && (
                          <Animated.View entering={FadeInDown} style={styles.expandedContent}>
                              
                              {detailsLoadingId === itemId ? (
                                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                      <ActivityIndicator size="large" color={ACCENT_TEAL} />
                                      <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 10, fontSize: 14 }}>Loading details...</Text>
                                  </View>
                              ) : (
                                  <>
                                      <ScrollView 
                                          horizontal 
                                          showsHorizontalScrollIndicator={false}
                                          contentContainerStyle={styles.summaryScrollContent}
                                          style={styles.summaryScroll}
                                      >
                                          {tabsConfig.map((tab) => (
                                              <TouchableOpacity 
                                                  key={tab.id} 
                                                  style={[styles.summaryPill, activeTab === tab.id && styles.summaryPillActive]} 
                                                  onPress={() => setActiveTab(tab.id)}
                                              >
                                                  <MaterialIcons name={tab.icon} size={16} color={activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.7)'} />
                                                  <Text style={[styles.summaryPillText, activeTab === tab.id && styles.summaryPillTextActive]}>
                                                      {tab.label}: {tab.countKey ? item[tab.countKey] : 0}
                                                  </Text>
                                              </TouchableOpacity>
                                          ))}
                                      </ScrollView>

                                      <View style={styles.listContainer}>
                                          {(() => {
                                              const currentTabConfig = tabsConfig.find(t => t.id === activeTab);
                                              if (!currentTabConfig) return null;
                                              const dataList = item[currentTabConfig.dataKey] || [];
                                              if (dataList.length === 0) return <Text style={styles.emptyListText}>No {currentTabConfig.label.toLowerCase()} found</Text>;

                                              return dataList.map((row, i) => {
                                                  const { name, sub, val1, val2, val3, label1, label2, label3 } = getRowData(row, activeTab);
                                                  
                                                  return (
                                                      <View key={i} style={styles.listItemCard}>
                                                          <View style={styles.listItemHeader}>
                                                              <View style={styles.serialBadge}>
                                                                  <Text style={styles.serialText}>{i + 1}</Text>
                                                              </View>
                                                              <MaterialIcons name={currentTabConfig.icon} size={20} color={ACCENT_TEAL} />
                                                              <View style={{ marginLeft: 12, flex: 1 }}>
                                                                  <Text style={styles.listItemName}>{name}</Text>
                                                                  {sub && <Text style={styles.listItemSub}>{sub}</Text>}
                                                              </View>
                                                          </View>
                                                          <DetailRow label={label1} value={val1} />
                                                          <DetailRow label={label2} value={val2} />
                                                          {val3 && <DetailRow label={label3} value={val3} />}
                                                      </View>
                                                  );
                                              });
                                          })()}
                                      </View>
                                  </>
                              )}
                          </Animated.View>
                      )}
                    </Animated.View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { setShowDatePicker(false); if(d) setSelectedDate(d); }} />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#1a3147', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, marginBottom: 15 },
  toggleOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleOptionActive: { backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  toggleText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  toggleTextActive: { color: TOP_GRADIENT[1] },

  dateRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginBottom: 25, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dateInfoContainer: { flexDirection: 'row', alignItems: 'center' },
  dateLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  dateText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  editIconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 10 },

  loaderContainer: { marginTop: 20, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loaderMainText: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 15 },
  loaderSubText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 5, textAlign: 'center' },

  receiptWrapper: { backgroundColor: 'transparent', borderRadius: 24, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
  glassCard: { backgroundColor: '#fff', padding: 24, borderRadius: 24 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  agentAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: TEXT_MAIN, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f0f0f0' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  agentName: { fontSize: 20, fontWeight: '800', color: TEXT_MAIN },
  agentRole: { fontSize: 12, color: '#829AB1', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  verifiedBadge: { backgroundColor: '#E0F7FA', padding: 8, borderRadius: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  // --- UPDATED: Fixed height (105) ensures all boxes are same size, center aligns content ---
  pillContainer: { 
    width: '100%', 
    height: 105, // FIXED HEIGHT for all 8 boxes
    marginBottom: 14, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 12, 
    shadowColor: "#627D98", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 4, 
    borderWidth: 1, 
    position: 'relative', 
    overflow: 'hidden',
    justifyContent: 'center' // Vertically center content within the fixed height
  },
  pillDecoration: { position: 'absolute', right: -10, bottom: -10, width: 60, height: 60, borderRadius: 30 },
  pillContent: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  pillIconCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  pillLabel: { fontSize: 9, color: '#829AB1', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4, lineHeight: 12, textAlign:'left' },
  pillValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.5 },
  receiptFooter: { marginTop: 20, alignItems: 'center', paddingTop: 15 },
  dashedLine: { width: '100%', height: 1, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 12 },
  footerNote: { fontSize: 10, color: '#94a3b8', textAlign: 'center' },
  brandName: { fontSize: 13, fontWeight: '900', color: ACCENT_TEAL, marginTop: 6, letterSpacing: 2 },
  
  actionRow: { flexDirection: 'row', marginTop: 15, marginBottom: 10, gap: 10 },
  shareBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#25D366', shadowOpacity: 0.4, shadowRadius: 8 },
  shareBtnText: { color: '#fff', fontWeight: '800', marginLeft: 8, fontSize: 14 },
  viewDetailsBtn: { flex: 1, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  viewDetailsText: { color: TEXT_MAIN, fontWeight: '800', fontSize: 14 },
  disabledBtn: { backgroundColor: 'rgba(255,255,255,0.3)', elevation: 0, shadowOpacity: 0 },
  disabledText: { color: 'rgba(255,255,255,0.5)' },
  
  expandedContent: { backgroundColor: 'rgba(15, 23, 42, 0.6)', marginHorizontal: 0, marginTop: 0, marginBottom: 20, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  summaryScroll: { marginBottom: 20 },
  summaryScrollContent: { paddingRight: 10 },
  summaryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  summaryPillActive: { backgroundColor: ACCENT_TEAL, borderColor: ACCENT_TEAL, shadowColor: ACCENT_TEAL, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  summaryPillText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  summaryPillTextActive: { color: '#fff', fontWeight: '800' },

  listContainer: { paddingBottom: 10 },
  listItemCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  listItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  
  serialBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT_TEAL,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)'
  },
  serialText: { color: '#fff', fontSize: 11, fontWeight: '800', },

  listItemName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listItemSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  detailValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyListText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#fff', marginTop: 20, fontSize: 16, opacity: 0.6 }
});

export default StarPoints;
