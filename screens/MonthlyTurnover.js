import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Linking, // <--- NEW IMPORT
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import baseUrl from "../constants/baseUrl";

const { height } = Dimensions.get('window');

// --- CONSTANTS MATCHING ReferredReport.js ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const ACCENT_GREEN = "#059669";   
const WARNING_RED = "#dc2626";    
const NEUTRAL_GREY = "#6b7280";   
const BORDER_COLOR = "#e0e0e0"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

// Enable LayoutAnimation for Android
if (
    Platform.OS === "android" &&
    UIManager && 
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Initiates a phone call using the device's linking functionality.
 * @param {string} phoneNumber 
 */
const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`);
};

/**
 * Formats a number into Indian Rupee currency string.
 * @param {number|string} amount 
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₹0.00";
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(num)) return "₹0.00";
    return `₹ ${num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const MonthlyTurnover = () => {
  const [turnoverData, setTurnoverData] = useState(null);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [formattedDate, setFormattedDate] = useState(
    moment().format("MMMM YYYY")
  );
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          setError("User session expired. Please login again.");
          setLoading(false);
          return;
        }
        
        const user = JSON.parse(userJson);
        const agentId = user?.userId;
        if (!agentId) {
          setError("No agentId found. Please login again.");
          setLoading(false);
          return;
        }

        const year = moment(selectedDate).year();
        const month = moment(selectedDate).month() + 1; // month() is 0-indexed

        const apiUrl = `${baseUrl}/user/agent-monthly-turnover-by-id/${agentId}?year=${year}&month=${month}`;
        const response = await axios.get(apiUrl);

        if (response.data?.success) {
          setTurnoverData(response.data.agentData);
          
          const customersWithStatus =
            response.data.agentData.payingCustomers.map((c) => {
              const totalPaid = parseFloat(c.totalPaid || 0);
              const monthlyInstallment = parseFloat(c.monthly_installment || 0);
              let lastPaymentDate = 'N/A';

              if (c.payments && c.payments.length > 0) {
                const latestDate = c.payments
                  .map(p => p.pay_date)
                  .filter(date => date) 
                  .sort((a, b) => new Date(b) - new Date(a))[0];
                
                if (latestDate) {
                    lastPaymentDate = moment(latestDate).format("DD MMM YYYY");
                }
              }

              return {
                ...c,
                paymentStatus:
                  totalPaid >= monthlyInstallment ? "PAID" : "UNPAID",
                lastPaymentDate: lastPaymentDate,
              };
            });
          
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setCustomersData(customersWithStatus);
        } else {
          setError(response.data?.message || "Failed to fetch data.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load data. Please check your network connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [selectedDate]); 

  const onDateChange = (_event, newDate) => {
    setShowPicker(false);
    if (newDate) {
      const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setSelectedDate(firstDay);
      setFormattedDate(moment(firstDay).format("MMMM YYYY"));
    }
  };

  const renderTurnoverCard = () => (
    <View>
      {/* 1. Agent Info Card - Uses clean card style */}
      <View style={[styles.cardContainer, { marginBottom: 20 }]}>
        <View style={styles.card}>
            {/* Agent Info Header */}
            <View style={styles.cardHeader}>
                <FontAwesome5 name="user-tie" size={40} color={ACCENT_BLUE} />
                <View style={styles.headerTextContainer}>
                    <Text style={styles.groupName}>{turnoverData?.agentName}</Text>
                    <Text style={styles.customerInfo}>{turnoverData?.phone_number}</Text>
                </View>
            </View>
            
            {/* Details (Month/Year & Total Customers) */}
            <View style={styles.cardFinancial}>
                {/* Month/Year Row */}
                <View style={styles.financialRowCompact}>
                    <Text style={styles.financialLabelCompact}>Month-Year:</Text>
                    <Text style={styles.financialValue}>
                        {turnoverData?.month}/{turnoverData?.year}
                    </Text>
                </View>

                {/* Total Customers Row */}
                <View style={[styles.financialRowCompact, { borderBottomWidth: 0 }]}>
                    <Text style={styles.financialLabelCompact}>Total Customers:</Text>
                    <Text style={styles.financialValue}>
                        {turnoverData?.totalCustomers}
                    </Text>
                </View>
            </View>
        </View>
      </View>


      {/* 2. Expected/Actual Turnover - Uses totalWrapper for highlight */}
      <View style={styles.totalWrapper}>
        <Text style={styles.totalText}>Expected Turnover:</Text>
        <Text style={styles.totalAmount}>
          {formatCurrency(turnoverData?.expectedTurnover)}
        </Text>
        <View style={styles.divider} /> 
        <Text style={styles.totalText}>Actual Turnover:</Text>
        {/* Use accent green for positive actual turnover, which is a good analogy for the balance being positive in ReferredReport */}
        <Text style={[styles.totalAmount, { color: ACCENT_GREEN }]}> 
          {formatCurrency(turnoverData?.totalTurnover)}
        </Text>
      </View>


      {/* 3. Date Picker - Redesigned button */}
      <TouchableOpacity
          style={styles.datePickerContainer}
          onPress={() => setShowPicker(true)}
        >
          <FontAwesome5 name="calendar-alt" size={18} color={CARD_BG} />
          <Text style={styles.datePickerText}>{formattedDate}</Text>
          <FontAwesome5
            name="chevron-down"
            size={16}
            color={CARD_BG}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
        
        <Text style={styles.customersListTitle}>Paying Customers</Text>
        
        {/* Search Bar - Redesigned to fit color scheme */}
        {customersData.length > 0 && (
            <View style={styles.searchContainer}>
            <FontAwesome5
                name="search"
                size={18}
                color={NEUTRAL_GREY}
                style={styles.searchIcon}
            />
            <TextInput
                style={styles.searchInput}
                placeholder="Search by customer or group "
                placeholderTextColor={NEUTRAL_GREY}
                value={searchText}
                onChangeText={setSearchText}
            />
            </View>
        )}
    </View>
  );

  const renderCustomerCard = ({ item }) => {
    // Determine status (PAID/UNPAID)
    const isPaid = item.paymentStatus === "PAID";
    const statusColor = isPaid ? ACCENT_GREEN : WARNING_RED;
    const customerPhone = item.user_id?.phone_number; // <--- PHONE NUMBER FETCHED

    return (
      <View style={styles.cardContainer}>
        {/* Main Card Content */}
        <View style={styles.card}>
            
            {/* Header (Group + Status Tag) */}
            <View style={styles.cardHeader}>
                <Text style={styles.groupName} numberOfLines={1}>
                    {item.group_id?.group_name || 'N/A'}
                </Text>
                <View style={[styles.statusTag, { backgroundColor: isPaid ? '#d1fae5' : '#fee2e2' }]}>
                    <Text style={[styles.statusTagText, { color: statusColor }]}>
                        {item.paymentStatus}
                    </Text>
                </View>
            </View>

            {/* Customer Info (Name + Phone) */}
            <View style={styles.cardBody}>
                <Text style={styles.customerName}>{item.user_id?.full_name || 'Unknown'}</Text>
                
                {/* PHONE NUMBER - Tappable Call Action */}
                {customerPhone ? (
                    <TouchableOpacity onPress={() => handleCall(customerPhone)} style={styles.callButton}>
                        <Text style={styles.customerInfo}>
                            <Ionicons name="call" size={14} color={ACCENT_BLUE} /> 
                            {' '} 
                            <Text style={styles.phoneNumberText}>{customerPhone}</Text>
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Financial Info (Details) */}
            <View style={styles.cardFinancial}>
                
                {/* Ticket Number Row (Compact) */}
                <View style={styles.financialRowCompact}>
                    <Text style={styles.financialLabelCompact}>Ticket Number :</Text>
                    <Text style={styles.financialValue}>
                        {item.ticket}
                    </Text>
                </View>

                {/* Monthly Installment Row (Compact) */}
                <View style={styles.financialRowCompact}>
                    <Text style={styles.financialLabelCompact}>Monthly Installment :</Text>
                    <Text style={[styles.financialValue, { color: ACCENT_GREEN }]}>
                        {formatCurrency(item.monthly_installment)}
                    </Text>
                </View>

                {/* Total Paid Row (Compact) */}
                <View style={styles.financialRowCompact}>
                    <Text style={styles.financialLabelCompact}>Total Paid :</Text>
                    <Text style={styles.financialValue}>
                        {formatCurrency(item.totalPaid)}
                    </Text>
                </View>

                {/* Last Transaction Row (Compact) */}
                <View style={styles.financialRowCompact}>
                    <Text style={styles.financialLabelCompact}>Last Transaction :</Text>
                    <Text style={[styles.financialValue, { borderBottomWidth: 0 }]}>
                        {item.lastPaymentDate}
                    </Text>
                </View>

                {/* Payment Status (Stands out - Compact) */}
                <View style={[styles.balanceRowCompact, { 
                    backgroundColor: isPaid ? '#f0fff5' : '#fff7f7', 
                    borderColor: statusColor 
                }]}>
                    <Text style={[styles.balanceLabel, { color: statusColor, marginRight: 5 }]}>
                        Payment Status :
                    </Text>
                    <Text style={[styles.balanceValue, { color: statusColor }]}>
                        {item.paymentStatus}
                    </Text>
                </View>
            </View>
        </View>
      </View>
    );
  };


  const filteredCustomers = customersData.filter((c) => {
    const term = searchText.toLowerCase();
    const fullName = c.user_id?.full_name?.toLowerCase() || '';
    const groupName = c.group_id?.group_name?.toLowerCase() || '';

    return (
      fullName.includes(term) ||
      groupName.includes(term)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header Section with Gradient */}
        <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
            <View style={styles.headerSpacer}>
                <Header />
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>Monthly Turnover</Text>
                <Text style={styles.subtitle}>
                    View your monthly performance and payments
                </Text>
            </View>
        </LinearGradient>
        
        {/* Main Content Area (Light Background) */}
        <View style={styles.mainContentArea}>
            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={ACCENT_BLUE} />
                    <Text style={styles.loadingTextBlue}>Fetching turnover data...</Text>
                </View>
            ) : error ? (
                <Text style={styles.statusText}>{error}</Text>
            ) : (
                <FlatList
                    data={filteredCustomers}
                    renderItem={renderCustomerCard}
                    keyExtractor={(_, index) => index.toString()}
                    ListHeaderComponent={renderTurnoverCard()}
                    contentContainerStyle={styles.flatListContentContainer}
                    style={styles.flatListStyle} 
                    ListEmptyComponent={() => (
                        <View style={styles.emptyListContainer}>
                            <Ionicons name="documents-outline" size={50} color={NEUTRAL_GREY} />
                            <Text style={styles.emptyText}>No customer data found</Text>
                            <Text style={{ color: NEUTRAL_GREY, marginTop: 5, fontSize: 14 }}>
                                Try adjusting the date or clearing the search filter.
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date" 
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={onDateChange}
          />
        )}
    </SafeAreaView>
  );
};

export default MonthlyTurnover;

const styles = StyleSheet.create({
    // --- LAYOUT STYLES (from ReferredReport.js) ---
    safeArea: { 
        flex: 1, 
        backgroundColor: TOP_GRADIENT[0] 
    },
    topContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        marginTop: -20, 
        paddingTop: 30,
    },
    headerSpacer: { 
        paddingTop: 20, 
        paddingBottom: 5 
    }, 

    // --- TITLE STYLES (from ReferredReport.js) ---
    titleContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 28, 
        fontWeight: "900",
        color: CARD_BG, 
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)', 
        fontWeight: '500',
        textAlign: 'center',
    },

    // --- TOTAL SUMMARY CARD (from ReferredReport.js) ---
    totalWrapper: {
        backgroundColor: "#fef3c7", 
        borderRadius: 18,
        padding: 20,
        marginBottom: 25,
        borderLeftWidth: 6,
        borderLeftColor: ACCENT_BLUE, 
        alignItems: 'center',
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    totalText: {
        color: MODERN_PRIMARY,
        fontWeight: "700",
        fontSize: 18,
    },
    totalAmount: {
        color: WARNING_RED, 
        fontWeight: "900", 
        fontSize: 28,
        marginTop: 5,
    },
    // Divider for separation in the turnover summary
    divider: { height: 1, backgroundColor: BORDER_COLOR, marginVertical: 10, width: '100%' },

    // --- REPORT CARD STYLES (from ReferredReport.js) ---
    cardContainer: {
        backgroundColor: CARD_BG,
        borderRadius: 18, 
        marginBottom: 18,
        overflow: 'hidden', 
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, 
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    card: {
        flex: 1, 
        padding: 20,
    },

    // CARD CONTENT
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    headerTextContainer: { 
        marginLeft: 15,
        flex: 1,
        justifyContent: 'center',
    },
    groupName: { // Reused for Agent Name / Group Name
        fontSize: 18,
        fontWeight: "900", 
        color: MODERN_PRIMARY,
        marginRight: 10,
        flexShrink: 1, 
    },
    statusTag: { // Reused for PAID/UNPAID status
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        alignSelf: 'flex-start', 
    },
    statusTagText: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: 'uppercase',
    },
    cardBody: {
        marginBottom: 15,
    },
    customerName: { // Reused for Customer Name
        fontSize: 22,
        fontWeight: "900",
        color: MODERN_PRIMARY,
        marginBottom: 5,
    },
    customerInfo: { // Reused for Agent Phone Number
        fontSize: 14,
        color: NEUTRAL_GREY,
        marginTop: 5,
        fontWeight: "500",
        flexDirection: 'row',
        alignItems: 'center',
    },
    // NEW CALL STYLES
    callButton: {
        marginTop: 5,
        marginBottom: 5, // Give it some space
        paddingVertical: 2,
    },
    phoneNumberText: {
        color: ACCENT_BLUE,
        textDecorationLine: 'underline',
        fontWeight: '700',
        fontSize: 15,
    },
    // END NEW CALL STYLES
    cardFinancial: {
        paddingTop: 10,
    },
    
    // Compact row for label and value
    financialRowCompact: {
        flexDirection: "row",
        justifyContent: "flex-start", 
        alignItems: 'baseline',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    financialLabelCompact: {
        fontSize: 15,
        color: NEUTRAL_GREY,
        fontWeight: "500",
        marginRight: 8, 
        minWidth: 150, 
    },
    
    financialValue: {
        fontSize: 16,
        color: MODERN_PRIMARY,
        fontWeight: "800",
    },
    
    // Balance Row (Stands out - Compact) - Reused for Payment Status
    balanceRowCompact: { 
        flexDirection: "row",
        justifyContent: "flex-start", 
        paddingVertical: 15,
        marginTop: 10,
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        alignItems: 'baseline',
    },
    balanceLabel: {
        fontSize: 13,
        fontWeight: "700",
    },
    balanceValue: {
        fontSize: 17,
        fontWeight: "900",
    },

    // --- FLATLIST ---
    flatListStyle: {
        flex: 1,
    },
    flatListContentContainer: {
        paddingBottom: 120, 
    },

    // --- LOADER/EMPTY STATE ---
    loader: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: height * 0.4,
    },
    loadingTextBlue: {
        marginTop: 10,
        color: ACCENT_BLUE,
        fontSize: 16,
        fontWeight: '600'
    },
    statusText: { 
        fontSize: 16, 
        color: NEUTRAL_GREY, 
        textAlign: "center", 
        marginTop: 20 
    },
    emptyListContainer: { 
        paddingVertical: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 15,
        marginTop: 20,
    },
    emptyText: {
        color: NEUTRAL_GREY,
        marginTop: 15,
        fontWeight: "600",
        fontSize: 18,
    },

    // --- MONTHLY TURNOVER SPECIFIC STYLES ---
    datePickerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: ACCENT_BLUE, 
        borderRadius: 15,
        paddingVertical: 14,
        marginBottom: 20,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    datePickerText: {
        fontSize: 18,
        fontWeight: "900",
        color: CARD_BG,
        marginLeft: 10,
    },
    customersListTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: MODERN_PRIMARY,
        marginBottom: 10,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: CARD_BG,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        paddingHorizontal: 12,
        height: 50,
        marginBottom: 15,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: MODERN_PRIMARY,
        textAlign: "left",
        paddingVertical: 0,
    },
});