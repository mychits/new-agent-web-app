
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  ActivityIndicator, Alert, Platform, LayoutAnimation, UIManager, Modal, FlatList, TouchableWithoutFeedback
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from 'expo-sharing';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Header from "../components/Header";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import baseUrl from "../constants/baseUrl";

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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const StarPoints = ({ navigation, route }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState('day'); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  // Custom Picker State
  const [pickerView, setPickerView] = useState('MONTHS'); // 'MONTHS' or 'YEARS'
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [pointsData, setPointsData] = useState([]);
  const [expandedId, setExpandedId] = useState(null); 
  const [activeTab, setActiveTab] = useState(null); 
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);

  const viewShotRefs = useRef({});
  const abortControllerRef = useRef(null);

  // Generate Year List
  const yearList = useMemo(() => {
    const list = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 50; y <= currentYear + 50; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // --- Effects & Helpers ---

  // Snap date logic
  useEffect(() => {
    let date = new Date(selectedDate);
    let needsUpdate = false;
    if (filterMode === 'month') {
      if (date.getDate() !== 1) { date.setDate(1); needsUpdate = true; }
    } else if (filterMode === 'year') {
      if (date.getMonth() !== 0 || date.getDate() !== 1) { date.setMonth(0); date.setDate(1); needsUpdate = true; }
    }
    if (needsUpdate) setSelectedDate(date);
  }, [filterMode]); 

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
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Receipt' });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) { 
      console.error("Share Error:", error);
      Alert.alert("Error", "Failed to share receipt.");
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const handleViewDetails = (itemId, hasDetails, defaultTabId) => {
    if (!hasDetails) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedId === itemId) {
      setExpandedId(null);
      setDetailsLoadingId(null);
      setActiveTab(null);
    } else {
      setExpandedId(itemId);
      setDetailsLoadingId(itemId);
      if (defaultTabId) setActiveTab(defaultTabId);
      setTimeout(() => { setDetailsLoadingId(null); }, 1000);
    }
  };

  // --- Picker Handlers ---

  const handleDatePress = () => {
    if (filterMode === 'day') {
      setShowDatePicker(true);
    } else {
      setTempMonth(selectedDate.getMonth());
      setTempYear(selectedDate.getFullYear());
      
      if (filterMode === 'month') {
        setPickerView('MONTHS'); 
      } else {
        setPickerView('YEARS'); 
      }
      setShowCustomPicker(true);
    }
  };

  const handleNativeDateChange = (event, date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleCustomConfirm = () => {
    setSelectedDate(new Date(tempYear, tempMonth, 1));
    setShowCustomPicker(false);
  };

  const handleMonthSelect = (monthIndex) => {
    setTempMonth(monthIndex);
    handleCustomConfirm(); // Immediate Confirm
  };

  const handleYearSelect = (year) => {
    setTempYear(year);
    
    if (filterMode === 'month') {
      // If in month mode, go back to month selection
      setPickerView('MONTHS');
    } else if (filterMode === 'year') {
      // If in year mode, immediate confirm
      handleCustomConfirm();
    }
  };

  const FilterToggle = () => (
    <View style={styles.toggleContainer}>
      {['day', 'month', 'year'].map((mode) => (
        <TouchableOpacity 
          key={mode} 
          style={[styles.toggleOption, filterMode === mode && styles.toggleOptionActive]} 
          onPress={() => { 
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); 
            
            const now = new Date();
            let newDate = now;

            if (mode === 'month') {
              newDate = new Date(now.getFullYear(), now.getMonth(), 1);
              setTempMonth(newDate.getMonth());
              setTempYear(newDate.getFullYear());
              setPickerView('MONTHS');
              setShowCustomPicker(true); 
            } else if (mode === 'year') {
              newDate = new Date(now.getFullYear(), 0, 1);
              setTempYear(newDate.getFullYear());
              setPickerView('YEARS');
              setShowCustomPicker(true);
            } else {
              newDate = now;
              setShowDatePicker(true);
            }

            setFilterMode(mode);
            setSelectedDate(newDate);
          }}
        >
          <Text style={[styles.toggleText, filterMode === mode && styles.toggleTextActive]}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const MetricPill = ({ label, value, icon, color }) => (
    <View style={[styles.pillContainer, { borderColor: color }]}>
      <View style={styles.pillContent}>
        <Text style={styles.pillLabel} numberOfLines={2}>{label}</Text>
        <View style={styles.pillValueRow}>
          <View style={[styles.pillIconCircle, { backgroundColor: color + '10' }]}>
            <MaterialIcons name={icon} size={13} color={color} />
          </View>
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
    } else if (tabId === 'enr') {
      name = row.user_id?.full_name || row.full_name || row.customer_name || 'Customer';
      sub = row.group_id?.group_name || row.group_name;
      val1 = row.user_id?.phone_number || row.phone_number || row.customer_phone || row.mobile || row.phone || 'N/A';
      val2 = formatCurrency(row.group_id?.group_value || row.amount);
      label1 = "Phone Number"; label2 = "Chit Value";
    } else if (tabId === 'loans') {
      name = row.borrower?.full_name || row.full_name || row.borrower_name || row.customer_name || row.applicant_name || 'Borrower';
      sub = row.loan_id || row.loan_number || 'Loan Details';
      val1 = row.borrower?.phone_number || row.phone_number || row.borrower_phone || row.customer_phone || row.contact_no || row.mobile || row.phone || 'N/A';
      val2 = formatCurrency(row.loan_amount || row.amount);
      val3 = row.status || row.loan_status || ''; 
      label1 = "Phone Number"; label2 = "Loan Amount"; label3 = "Status";
    } else if (tabId === 'ref_app') {
      name = row.name || row.customer_name || row.applicant_name;
      sub = row.app_type || row.application_type || 'Referral App';
      val1 = row.phone || row.mobile || row.contact_number;
      val2 = row.created_at || row.date || 'Recent';
      label1 = "Phone"; label2 = "Date";
    } else if (tabId === 'ref_cust') {
      name = row.name || row.customer_name;
      sub = row.referral_code || row.source || 'Referral';
      val1 = row.phone || row.mobile;
      val2 = row.created_at || row.date;
      label1 = "Phone"; label2 = "Referred On";
    } else if (tabId === 'pigmes') {
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
    { label: "Pigmes Count", value: item.pigmes_count || 0, icon: "toll", color: "#9C27B0" },
    { label: "Enrollments Count", value: item.enrollments_count || 0, icon: "how-to-reg", color: "#00BCD4" },
    { label: "Enrollments Chit Value", value: formatCurrency(item.enrollments_chit_value), icon: "currency-rupee", color: "#FFC107" },
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
        
        <TouchableOpacity style={styles.dateRow} onPress={handleDatePress} activeOpacity={0.8}>
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
                                  
                                  {/* Report Date Badge (Static for the selected period) */}
                                  <View style={styles.dateBadge}>
                                      <MaterialIcons name="event" size={18} color="#00d2ff" style={{marginRight: 5}} />
                                      <Text style={styles.dateBadgeText}>Report Date: {formatDateDisplay(selectedDate, filterMode)}</Text>
                                  </View>
                                  
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
                              
                              {/* PRESENT DATE / GENERATED DATE */}
                              <Text style={styles.generatedAtText}>
                                Generated: {new Date().toLocaleString('en-IN', { 
                                  day: '2-digit', month: 'short', year: 'numeric', 
                                  hour: '2-digit', minute: '2-digit' 
                                })}
                              </Text>

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

        {/* Standard Date Picker for DAY Mode */}
        {showDatePicker && (
          <DateTimePicker 
            value={selectedDate} 
            mode="date" 
            display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
            onChange={handleNativeDateChange} 
          />
        )}

        {/* Custom Modal for MONTH and YEAR Modes */}
        <Modal
          transparent={true}
          visible={showCustomPicker}
          animationType="slide"
          onRequestClose={() => setShowCustomPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowCustomPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <View style={{ width: 50, justifyContent: 'center' }}> 
                       {/* Dynamic Left Button Logic */}
                       {filterMode === 'month' && pickerView === 'MONTHS' ? (
                         // User is on Month Grid: Button to go change Year
                         <TouchableOpacity onPress={() => setPickerView('YEARS')} style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={styles.modalNavText}>Select Year</Text>
                            <MaterialIcons name="arrow-drop-down" size={20} color="#00d2ff" />
                         </TouchableOpacity>
                       ) : filterMode === 'month' && pickerView === 'YEARS' ? (
                         // User is on Year List (came from Month mode): Button to go Back to Months
                         <TouchableOpacity onPress={() => setPickerView('MONTHS')}>
                            <MaterialIcons name="arrow-back" size={24} color="#666" />
                         </TouchableOpacity>
                       ) : (
                         // User is in Year Mode: Standard Cancel
                         <TouchableOpacity onPress={() => setShowCustomPicker(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                         </TouchableOpacity>
                       )}
                    </View>
                    <Text style={styles.modalTitle}>
                        {filterMode === 'year' ? 'Select Year' : (pickerView === 'MONTHS' ? `Select Month (${tempYear})` : 'Select Year')}
                    </Text>
                    <View style={{ width: 50, alignItems: 'flex-end', justifyContent: 'center' }}>
                       {/* DONE BUTTON REMOVED */}
                    </View>
                  </View>

                  <View style={styles.modalContent}>
                    {pickerView === 'MONTHS' ? (
                      // MONTH LIST VIEW
                      <FlatList
                        key="monthGrid"
                        data={MONTHS}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={3}
                        contentContainerStyle={styles.gridContent}
                        columnWrapperStyle={styles.gridRow}
                        renderItem={({ item, index }) => (
                          <TouchableOpacity 
                            style={[styles.monthGridItem, tempMonth === index && styles.monthGridItemActive]} 
                            onPress={() => handleMonthSelect(index)}
                          >
                            <Text style={[styles.monthGridText, tempMonth === index && styles.monthGridTextActive]}>
                              {item.substring(0,3)} {tempYear}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    ) : (
                      // YEAR LIST VIEW
                      <FlatList
                        key="yearList"
                        data={yearList}
                        keyExtractor={(item) => item.toString()}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            style={[styles.listRow, tempYear === item && styles.listRowActive]} 
                            onPress={() => handleYearSelect(item)}
                          >
                            <Text style={[styles.listRowText, tempYear === item && styles.listRowTextActive]}>
                              {item}
                            </Text>
                            {tempYear === item && <MaterialIcons name="check" size={20} color={ACCENT_TEAL} />}
                          </TouchableOpacity>
                        )}
                        initialScrollIndex={yearList.indexOf(tempYear)}
                        getItemLayout={(data, index) => ({ length: 50, offset: 50 * index, index })}
                      />
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#1a3147', letterSpacing: -0.5 },
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  agentAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: TEXT_MAIN, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f0f0f0' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  agentName: { fontSize: 20, fontWeight: '800', color: TEXT_MAIN },
  agentRole: { fontSize: 12, color: '#829AB1', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  // Date Badge Style
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e0f7fa',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 6,
    marginTop: 6,
  },
  dateBadgeText: {
    fontSize: 9,
    color: '#006064',
    fontWeight: '600',
  },
  verifiedBadge: { backgroundColor: '#E0F7FA', padding: 8, borderRadius: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  pillContainer: { width: '100%', height: 85, marginBottom: 14, backgroundColor: '#fff', borderRadius: 16, padding: 10, shadowColor: "#627D98", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  pillDecoration: { position: 'absolute', right: -10, bottom: -10, width: 60, height: 60, borderRadius: 30 },
  pillContent: { flex: 1, flexDirection: 'column', justifyContent: 'space-between', zIndex: 1 },
  pillLabel: { fontSize: 10, color: '#829AB1', fontWeight: '700', textTransform: 'uppercase', lineHeight: 14, textAlign: 'left' },
  pillValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pillIconCircle: { width: 22, height: 22, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  pillValue: { fontSize: 14, fontWeight: '800', letterSpacing: -0.5, flexShrink: 1 },
  
  receiptFooter: { marginTop: 20, alignItems: 'center', paddingTop: 15 },
  dashedLine: { width: '100%', height: 1, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 12 },
  // New Style for Generated Date
  generatedAtText: { 
    fontSize: 10, 
    color: '#829AB1', 
    marginBottom: 4, 
    fontWeight: '600', 
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
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
  serialBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT_TEAL, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  serialText: { color: '#fff', fontSize: 11, fontWeight: '800', },
  listItemName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listItemSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  detailValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyListText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#fff', marginTop: 20, fontSize: 16, opacity: 0.6 },

  // --- Custom Picker Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30, maxHeight: height * 0.65 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalCancelText: { fontSize: 16, color: '#666' },
  modalNavText: { fontSize: 16, color: '#00d2ff', fontWeight: '600' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  modalContent: { padding: 10, height: 350 },

  // Month Grid Styles
  gridContent: { paddingVertical: 10 },
  gridRow: { justifyContent: 'space-between' },
  monthGridItem: {
    width: '31%', 
    aspectRatio: 1.2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 12, 
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee'
  },
  monthGridItemActive: {
    backgroundColor: ACCENT_TEAL,
    borderColor: ACCENT_TEAL,
    shadowColor: ACCENT_TEAL,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  monthGridText: {
    fontSize: 13, 
    color: '#555',
    fontWeight: '600',
    textAlign: 'center'
  },
  monthGridTextActive: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center'
  },

  // Year List Styles
  listContent: { paddingVertical: 5 },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listRowActive: {
    backgroundColor: '#f0fdff',
    borderLeftWidth: 4,
    borderLeftColor: ACCENT_TEAL,
  },
  listRowText: {
    fontSize: 16,
    color: '#333',
  },
  listRowTextActive: {
    color: ACCENT_TEAL,
    fontWeight: '700',
  },
});

export default StarPoints;
