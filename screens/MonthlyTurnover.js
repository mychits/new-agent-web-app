import React, { useState, useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Platform,
  UIManager,
  Linking,
  Animated,
  StatusBar,
  ImageBackground,
  Dimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { FontAwesome5, Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import baseUrl from "../constants/baseUrl";

const backgroundImage = require("../assets/hero1.jpg");

const { width } = Dimensions.get("window");

// --- COLORS ---
const COLORS = {
  primary: "#183A5D",
  accent: "#f8c009ff",
  bgBlue: "#1aa2ccff",
  success: "#27AE60",
  cardBg: "rgba(255, 255, 255, 0.98)",
  white: "#FFFFFF",
  muted: "#8898AA",
  background: "#0f2a44",
  box1: "#E0E7FF",
  box1Text: "#4338ca",
  box2: "#D1FAE5", // Light Green (Used for Negative Balance)
  box2Text: "#059669", // Dark Green Text
  box3: "#FEF3C7",
  box3Text: "#D97706",
  box4: "#E0F2FE",
  box4Text: "#0284c7",
  box5: "#FFE4E6", // Light Red (Used for Positive Balance)
  box5Text: "#e11d48", // Dark Red Text
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FadeInView = ({ children, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
  }, []);
  return <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>;
};

const handleCall = (phoneNumber) => {
  if (!phoneNumber) return;
  Linking.openURL("tel:" + phoneNumber);
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "0";
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

// --- EXTRACTED HEADER COMPONENT TO PREVENT REMOUNTING ---
const TurnoverHeader = memo(({ 
  selectedDate, formattedDate, setShowPicker, 
  searchQuery, setSearchQuery, turnoverData 
}) => {
  return (
    <FadeInView>
      {/* DATE CARD */}
      <TouchableOpacity style={styles.dateCard} onPress={() => setShowPicker(true)} activeOpacity={0.9}>
        <View style={styles.dateInfo}>
          <View style={styles.calendarIconBg}>
            <Ionicons name="calendar" size={18} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.dateLabel}>SELECTED PERIOD</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>
        <View style={styles.editIconBg}>
           <Feather name="edit-3" size={14} color={COLORS.primary} />
        </View>
      </TouchableOpacity>

      {/* SEARCH BAR */}
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, phone, ticket or group..."
          placeholderTextColor={COLORS.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* SUMMARY HERO CARD */}
      <View style={styles.mainCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Monthly Summary</Text>
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(39, 174, 96, 0.15)' }]}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatBox}>
             <Text style={styles.heroStatLabel}>EXPECTED</Text>
             <Text style={styles.heroStatValue}>₹{formatCurrency(turnoverData?.expectedTurnover)}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatBox}>
             <Text style={styles.heroStatLabel}>COLLECTED</Text>
             <Text style={[styles.heroStatValue, { color: COLORS.success }]}>₹{formatCurrency(turnoverData?.totalTurnover)}</Text>
          </View>
        </View>
      </View>
    </FadeInView>
  );
});

const MonthlyTurnover = ({ navigation }) => {
  const [turnoverData, setTurnoverData]   = useState(null);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedDate, setSelectedDate]   = useState(new Date());
  const [showPicker, setShowPicker]       = useState(false);
  const [formattedDate, setFormattedDate] = useState(moment().format("MMMM YYYY"));
  
  // Search State
  const [searchQuery, setSearchQuery]     = useState("");

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedDate]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) { setError("Session expired."); setLoading(false); return; }
      const user    = JSON.parse(userJson);
      const agentId = user?.userId;
      if (!agentId) { setError("No agentId found."); setLoading(false); return; }

      const year  = moment(selectedDate).year();
      const month = moment(selectedDate).month() + 1;
      const apiUrl =
        baseUrl + "/user/agent-monthly-turnover-by-id/" + agentId +
        "?year=" + year + "&month=" + month;

      const response = await axios.get(apiUrl);

      if (response.data?.success) {
        const payingCustomers = response.data.agentData?.payingCustomers || [];
        setTurnoverData(response.data.agentData);

        const customersWithStatus = payingCustomers.map((c) => {
          const monthlyPaid        = parseFloat(c.monthlyPaid       || 0);
          const totalPaid          = parseFloat(c.totalPaid         || 0);
          const monthlyInstallment = parseFloat(c.monthly_installment || 0);
          const balance            = parseFloat(c.balance           || 0);
          const differenceAmount   = monthlyInstallment - monthlyPaid;

          let lastPaymentDate = "N/A";
          if (c.payments && c.payments.length > 0) {
            const latestDate = c.payments
              .map((p) => p.pay_date)
              .filter(Boolean)
              .sort((a, b) => new Date(b) - new Date(a))[0];
            if (latestDate) lastPaymentDate = moment(latestDate).format("DD MMM");
          }

          return {
            ...c,
            enrollmentId:  c._id,
            // EXTRACT TICKET NUMBER FROM API
            ticketNumber:  c.ticket || "N/A", 
            balance:       balance,
            paymentStatus: monthlyPaid >= monthlyInstallment ? "PAID" : "UNPAID",
            lastPaymentDate,
            monthlyPaid,
            totalPaid,
            differenceAmount,
          };
        });

        setCustomersData(customersWithStatus);
        
      } else {
        setError(response.data?.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("TURNOVER_ERROR => " + err.message);
      setError("Error fetching agent details.");
    } finally {
      setLoading(false);
    }
  };

  // Filter logic for Search (Updated to include Ticket)
  const filteredCustomers = customersData.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name  = (item.user_id?.full_name || "").toLowerCase();
    const phone = (item.user_id?.phone_number || "").toLowerCase();
    const group = (item.group_id?.group_name || "").toLowerCase();
    const ticket = (item.ticketNumber || "").toString().toLowerCase();
    
    return name.includes(query) || phone.includes(query) || group.includes(query) || ticket.includes(query);
  });

  const onDateChange = (_event, newDate) => {
    setShowPicker(false);
    if (newDate) {
      const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setSelectedDate(firstDay);
      setFormattedDate(moment(firstDay).format("MMMM YYYY"));
    }
  };

  // --- NORMAL LOADER ---
  const renderNormalLoader = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      <Text style={styles.loadingText}>Loading collection data...</Text>
    </View>
  );

  const renderCustomerCard = ({ item, index }) => {
    const isPaid        = item.paymentStatus === "PAID";
    const statusColor   = isPaid ? COLORS.success : COLORS.box5Text;
    const statusBg      = isPaid ? "rgba(39, 174, 96, 0.15)" : "rgba(225, 29, 72, 0.1)";
    
    const customerPhone = item.user_id?.phone_number;
    const customerName  = item.user_id?.full_name || "Unknown";
    const groupName     = item.group_id?.group_name || "Group";
    const ticketNum     = item.ticketNumber; // Use the extracted ticket number
    const balanceVal    = item.balance || 0;
    const diffVal       = item.differenceAmount || 0;
    const diffColor     = diffVal > 0 ? COLORS.box3Text : COLORS.success;

    // --- LOGIC FOR BALANCE COLOR ---
    // If balance is minus (-), display Green. If positive or plus (+), display Red.
    const isNegativeBalance = balanceVal < 0;
    const balanceBoxBg = isNegativeBalance ? COLORS.box2 : COLORS.box5; // Green bg if negative, Red bg if positive
    const balanceBoxText = isNegativeBalance ? COLORS.box2Text : COLORS.box5Text; // Green text if negative, Red text if positive

    // --- HIDE MINUS SIGN ---
    // Use Math.abs() to remove the negative sign from the displayed number
    const displayBalance = Math.abs(balanceVal);

    return (
      <FadeInView delay={index * 30}>
        <View style={styles.listCard}>
          {/* Header: Avatar + Info */}
          <View style={styles.listHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{customerName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.clientName} numberOfLines={1}>{customerName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                   <Text style={[styles.statusText, { color: statusColor }]}>{item.paymentStatus}</Text>
                </View>
              </View>
              
              <View style={styles.metaRow}>
                {/* DISPLAY TICKET NUMBER AFTER GROUP NAME */}
                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Text style={styles.ticketText} numberOfLines={1}>{groupName}</Text>
                  <Text style={styles.ticketText}> • </Text>
                  <Text style={[styles.ticketText, { color: COLORS.bgBlue, fontWeight: '700' }]}>Ticket #{ticketNum}</Text>
                </View>
                
                {customerPhone && (
                  <TouchableOpacity onPress={() => handleCall(customerPhone)} style={styles.callBtn}>
                    <Feather name="phone" size={12} color={COLORS.bgBlue} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* 5 DIFFERENT BOXES GRID */}
          <View style={styles.statsGrid}>
            {/* 1. Installment */}
            <View style={[styles.gridBox, { backgroundColor: COLORS.box1 }]}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.box1Text} />
              <Text style={[styles.gridVal, { color: COLORS.box1Text }]}>{formatCurrency(item.monthly_installment)}</Text>
              <Text style={styles.gridLabel}>Installment</Text>
            </View>

            {/* 2. Paid */}
            <View style={[styles.gridBox, { backgroundColor: COLORS.box2 }]}>
              <Ionicons name="wallet" size={16} color={COLORS.box2Text} />
              <Text style={[styles.gridVal, { color: COLORS.box2Text }]}>{formatCurrency(item.monthlyPaid)}</Text>
              <Text style={styles.gridLabel}>Paid</Text>
            </View>

            {/* 3. Difference */}
            <View style={[styles.gridBox, { backgroundColor: COLORS.box3 }]}>
              <Ionicons name="calculator" size={16} color={COLORS.box3Text} />
              <Text style={[styles.gridVal, { color: COLORS.box3Text, fontWeight: '900' }]}>{formatCurrency(diffVal)}</Text>
              <Text style={styles.gridLabel}>Diff</Text>
            </View>

            {/* 4. Total Paid */}
            <View style={[styles.gridBox, { backgroundColor: COLORS.box4, width: '48%' }]}>
              <FontAwesome5 name="hand-holding-usd" size={16} color={COLORS.box4Text} />
              <Text style={[styles.gridVal, { color: COLORS.box4Text }]}>{formatCurrency(item.totalPaid)}</Text>
              <Text style={styles.gridLabel}>Total Paid</Text>
            </View>

            {/* 5. Balance - DYNAMIC COLOR */}
            <View style={[styles.gridBox, { backgroundColor: balanceBoxBg, width: '48%' }]}>
              <MaterialCommunityIcons name="scale-balance" size={16} color={balanceBoxText} />
              {/* Using displayBalance (absolute value) to hide the minus sign */}
              <Text style={[styles.gridVal, { color: balanceBoxText }]}>{formatCurrency(displayBalance)}</Text>
              <Text style={styles.gridLabel}>Balance</Text>
            </View>
          </View>
        </View>
      </FadeInView>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={backgroundImage} style={styles.bgOverlay} blurRadius={12} />
      <LinearGradient colors={["rgba(26, 162, 204, 0.9)", COLORS.primary]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchMonthlyData} style={styles.refreshBtn} activeOpacity={0.7}>
              <Feather name="refresh-cw" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Monthly Turnover</Text>
          <Text style={styles.headerSubTitle}>Track your monthly collection</Text>
        </View>

        <View style={styles.contentContainer}>
          {loading ? (
            renderNormalLoader()
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchMonthlyData}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredCustomers}
              renderItem={renderCustomerCard}
              keyExtractor={(_, i) => i.toString()}
              // USE THE EXTRACTED COMPONENT HERE
              ListHeaderComponent={
                <TurnoverHeader 
                  selectedDate={selectedDate}
                  formattedDate={formattedDate}
                  setShowPicker={setShowPicker}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  turnoverData={turnoverData}
                />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                   <MaterialCommunityIcons name="database-off-outline" size={48} color="rgba(255,255,255,0.3)" />
                   <Text style={styles.noDataText}>
                     {searchQuery ? "No matching customers found." : "No customers found for this period."}
                   </Text>
                </View>
              )}
            />
          )}
        </View>
      </SafeAreaView>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "calendar"}
          onChange={onDateChange}
        />
      )}
    </View>
  );
};

export default MonthlyTurnover;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.primary },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
  
  header: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 20 : 20,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", textAlign: 'center', marginTop: 1 },
  headerSubTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 },
  iconCircle: { backgroundColor: "#fff", padding: 8, borderRadius: 12, elevation: 4 },
  refreshBtn: { backgroundColor: COLORS.accent, padding: 10, borderRadius: 12, elevation: 4 },
  
  contentContainer: { paddingHorizontal: 16, flex: 1 },
  listContent: { paddingBottom: 40 },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.white, marginTop: 10, fontWeight: '600', opacity: 0.8 },

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

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    padding: 0,
    height: 20,
  },

  mainCard: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 20, 
    elevation: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardLabel: { fontSize: 11, fontWeight: "800", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  
  heroStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStatBox: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '700', marginBottom: 4 },
  heroStatValue: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
  heroStatDivider: { width: 1, height: 30, backgroundColor: '#E9ECEF' },

  listCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  listHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  
  clientName: { fontSize: 16, fontWeight: "800", color: COLORS.primary, marginBottom: 4, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketText: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  callBtn: { padding: 4, marginLeft: 8 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridBox: {
    width: '31%', 
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8, 
  },
  gridVal: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.muted,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  errorBox:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText:  { color: COLORS.white, fontSize: 16, textAlign: "center", marginBottom: 20, fontWeight: '500' },
  retryBtn:   { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText:  { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 50, opacity: 0.7 },
  noDataText: { color: "#fff", textAlign: "center", marginTop: 12, fontSize: 15, fontWeight: '600' },
});