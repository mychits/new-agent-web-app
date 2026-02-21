
import React, { useState, useEffect, useRef } from "react";
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
  Linking,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import baseUrl from "../constants/baseUrl";

const { width, height } = Dimensions.get('window');

// --- THEME CONSTANTS (Preserved) ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#24C6DC";     
const ACCENT_GREEN = "#0c704f";    
const WARNING_RED = "#EF4444";     
const NEUTRAL_GREY = "#6b7280";   
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f3f4f6'; 

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- ANIMATION COMPONENTS ---

// 1. Fade In View
const FadeInView = ({ children, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>{children}</Animated.View>;
};

// 2. Shimmer Loading Effect
const ShimmerLoader = ({ style }) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmerValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return <Animated.View style={[style, { opacity }]} />;
};

/**
 * Initiates a phone call
 */
const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`);
};

/**
 * Formats currency
 */
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₹0";
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(num)) return "₹0";
    return `₹ ${num.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

const MonthlyTurnover = () => {
  const [turnoverData, setTurnoverData] = useState(null);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [formattedDate, setFormattedDate] = useState(moment().format("MMMM YYYY"));
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedDate]); 

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) { setError("Session expired."); setLoading(false); return; }
      
      const user = JSON.parse(userJson);
      const agentId = user?.userId;
      if (!agentId) { setError("No agentId found."); setLoading(false); return; }

      const year = moment(selectedDate).year();
      const month = moment(selectedDate).month() + 1; 

      const apiUrl = `${baseUrl}/user/agent-monthly-turnover-by-id/${agentId}?year=${year}&month=${month}`;
      const response = await axios.get(apiUrl);

      if (response.data?.success) {
        setTurnoverData(response.data.agentData);
        
        const customersWithStatus = response.data.agentData.payingCustomers.map((c) => {
          const monthlyPaid = parseFloat(c.totalPaid || 0); 
          const monthlyInstallment = parseFloat(c.monthly_installment || 0);
          
          const overallPaid = parseFloat(c.paid_amount || 0); 
          const totalTicketValue = parseFloat(c.total_amount || 0);
          const totalBalance = totalTicketValue - overallPaid;

          let lastPaymentDate = 'N/A';

          if (c.payments && c.payments.length > 0) {
            const latestDate = c.payments.map(p => p.pay_date).filter(date => date).sort((a, b) => new Date(b) - new Date(a))[0];
            if (latestDate) lastPaymentDate = moment(latestDate).format("DD MMM");
          }

          return {
            ...c,
            paymentStatus: monthlyPaid >= monthlyInstallment ? "PAID" : "UNPAID",
            lastPaymentDate: lastPaymentDate,
            monthlyPaid: monthlyPaid,
            overallPaid: overallPaid,
            totalBalance: totalBalance
          };
        });
        
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCustomersData(customersWithStatus);
      } else {
        setError(response.data?.message || "Failed to fetch data.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (_event, newDate) => {
    setShowPicker(false);
    if (newDate) {
      const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setSelectedDate(firstDay);
      setFormattedDate(moment(firstDay).format("MMMM YYYY"));
    }
  };

  // --- SKELETON UI FOR LOADING STATE ---
  const renderSkeleton = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <ShimmerLoader style={{ width: '60%', height: 28, borderRadius: 12, backgroundColor: '#e0e0e0' }} />
        <ShimmerLoader style={{ width: 80, height: 28, borderRadius: 12, backgroundColor: '#e0e0e0' }} />
      </View>
      <ShimmerLoader style={{ width: '100%', height: 180, borderRadius: 24, backgroundColor: '#e0e0e0', marginBottom: 25 }} />
      {[1,2,3].map(i => (
        <View key={i} style={{ backgroundColor: CARD_BG, borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                <ShimmerLoader style={{ width: '40%', height: 18, borderRadius: 8, backgroundColor: '#f0f0f0' }} />
                <ShimmerLoader style={{ width: 60, height: 24, borderRadius: 12, backgroundColor: '#f0f0f0' }} />
            </View>
            <ShimmerLoader style={{ width: '70%', height: 16, borderRadius: 8, backgroundColor: '#f0f0f0', marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ShimmerLoader style={{ width: '48%', height: 60, borderRadius: 12, backgroundColor: '#f0f0f0' }} />
                <ShimmerLoader style={{ width: '48%', height: 60, borderRadius: 12, backgroundColor: '#f0f0f0' }} />
            </View>
        </View>
      ))}
    </View>
  );

  const renderTurnoverCard = () => (
    <FadeInView>
      {/* Screen Title Section */}
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>Monthly Turnover</Text>
        <Text style={styles.screenSubtitle}>Track your monthly collection progress</Text>
      </View>

      {/* Modern Date Selector Card */}
      <TouchableOpacity style={styles.dateSelectorCard} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
          <View style={styles.dateIconBox}>
              <Ionicons name="calendar" size={22} color={ACCENT_BLUE} />
          </View>
          <View style={styles.dateTextContainer}>
              <Text style={styles.dateSelectorLabel}>Selected Period</Text>
              <Text style={styles.dateSelectorValue}>{formattedDate}</Text>
          </View>
          <View style={styles.dateArrowBox}>
              <Ionicons name="chevron-down" size={20} color={NEUTRAL_GREY} />
          </View>
      </TouchableOpacity>

      {/* Hero Turnover Card */}
      <View style={styles.heroCard}>
        <LinearGradient colors={['#183A5D', '#24C6DC']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.heroGradient}>
            <View style={styles.heroTop}>
                <View style={{flex:1}}>
                    <Text style={styles.heroLabel}>EXPECTED TURNOVER</Text>
                    <Text style={styles.heroAmountText}>{formatCurrency(turnoverData?.expectedTurnover)}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={{flex:1, alignItems:'flex-end'}}>
                    <Text style={styles.heroLabel}>COLLECTED</Text>
                    <Text style={[styles.heroAmountText, { color: '#34D399' }]}>{formatCurrency(turnoverData?.totalTurnover)}</Text>
                </View>
            </View>
            
            <View style={styles.heroBottom}>
                <View style={styles.statItem}>
                    <View style={styles.iconBgLight}>
                       <Ionicons name="people" size={14} color="#fff" />
                    </View>
                    <Text style={styles.statText}> {turnoverData?.totalCustomers} Customers</Text>
                </View>
                <View style={styles.statItem}>
                    <View style={styles.iconBgLight}>
                       <FontAwesome5 name="user-tie" size={12} color="#fff" />
                    </View>
                    <Text style={styles.statText}> {turnoverData?.agentName}</Text>
                </View>
            </View>
        </LinearGradient>
      </View>

      {/* Search Bar */}
      {customersData.length > 0 && (
        <View style={styles.searchWrapper}>
            <Ionicons name="search" size={20} color={NEUTRAL_GREY} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search customer or group..."
                placeholderTextColor={NEUTRAL_GREY}
                value={searchText}
                onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                 <Ionicons name="close-circle" size={20} color={NEUTRAL_GREY} />
              </TouchableOpacity>
            )}
        </View>
      )}
    </FadeInView>
  );

  const renderCustomerCard = ({ item, index }) => {
    const isPaid = item.paymentStatus === "PAID";
    const statusColor = isPaid ? ACCENT_GREEN : WARNING_RED;
    const customerPhone = item.user_id?.phone_number;

    return (
      <FadeInView delay={index * 100}>
        <View style={styles.customerCard}>
            {/* Decorative Top Strip */}
            <View style={[styles.cardTopStrip, { backgroundColor: statusColor }]} />

            <View style={styles.cardContent}>
                {/* Row 1: Group & Status */}
                <View style={styles.cardRowTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.groupIconBox}>
                           <Ionicons name="layers-outline" size={16} color={ACCENT_BLUE} />
                        </View>
                        <Text style={styles.groupNameText} numberOfLines={1}>{item.group_id?.group_name || 'Group'}</Text>
                    </View>
                    <View style={[styles.pillTag, { backgroundColor: isPaid ? 'rgba(12, 112, 79, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.pillText, { color: statusColor }]}>{item.paymentStatus}</Text>
                    </View>
                </View>

                {/* Row 2: Customer Info */}
                <View style={styles.cardRowMiddle}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.user_id?.full_name?.charAt(0) || 'U'}</Text>
                    </View>
                    <View style={styles.customerInfoWrapper}>
                        <Text style={styles.customerNameText}>{item.user_id?.full_name || 'Unknown'}</Text>
                        {customerPhone && (
                            <TouchableOpacity onPress={() => handleCall(customerPhone)} style={styles.callRow}>
                                <Ionicons name="call-outline" size={14} color={ACCENT_BLUE} />
                                <Text style={styles.phoneText}>{customerPhone}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <View style={styles.ticketBox}>
                        <Text style={styles.ticketLabel}>Ticket</Text>
                        <Text style={styles.ticketValue}>#{item.ticket}</Text>
                    </View>
                </View>

                {/* Row 3: Financial Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Item 1: Installment */}
                    <View style={styles.statsGridItem}>
                        <Text style={styles.gridLabel}>Installment</Text>
                        <Text style={styles.gridValuePrimary}>{formatCurrency(item.monthly_installment)}</Text>
                    </View>
                    
                    {/* Item 2: Paid This Month */}
                    <View style={styles.statsGridItem}>
                        <Text style={styles.gridLabel}>Paid (Month)</Text>
                        <Text style={styles.gridValueGreen}>{formatCurrency(item.monthlyPaid)}</Text>
                    </View>
                    
                    {/* Item 3: Total Paid Overall */}
                    <View style={[styles.statsGridItem, { borderRightWidth: 0 }]}>
                        <Text style={styles.gridLabel}>Total Paid</Text>
                        <Text style={styles.gridValueBlue}>{formatCurrency(item.overallPaid)}</Text>
                    </View>

                    {/* Item 4: Balance */}
                    <View style={[styles.statsGridItem, { borderRightWidth: 0 }]}>
                        <Text style={styles.gridLabel}>Balance</Text>
                        <Text style={styles.gridValueRed}>{formatCurrency(item.totalBalance)}</Text>
                    </View>
                </View>
            </View>
        </View>
      </FadeInView>
    );
  };

  const filteredCustomers = customersData.filter((c) => {
    const term = searchText.toLowerCase();
    const fullName = c.user_id?.full_name?.toLowerCase() || '';
    const groupName = c.group_id?.group_name?.toLowerCase() || '';
    return fullName.includes(term) || groupName.includes(term);
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={TOP_GRADIENT} style={styles.headerBg}>
            <Header />
        </LinearGradient>
        
        <View style={styles.contentContainer}>
            {loading ? (
                renderSkeleton()
            ) : error ? (
                <View style={styles.errorBox}>
                    <Ionicons name="cloud-offline-outline" size={40} color={NEUTRAL_GREY} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchMonthlyData}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredCustomers}
                    renderItem={renderCustomerCard}
                    keyExtractor={(_, index) => index.toString()}
                    ListHeaderComponent={renderTurnoverCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyBox}>
                            <Ionicons name="file-tray-outline" size={50} color="#ccc" />
                            <Text style={styles.emptyTitle}>No Customers Found</Text>
                            <Text style={styles.emptySub}>Try adjusting your month filter.</Text>
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
    safeArea: { 
        flex: 1, 
        backgroundColor: TOP_GRADIENT[1] 
    },
    headerBg: {
        paddingBottom: 15,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden'
    },
    contentContainer: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY,
        marginTop: 5,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        paddingTop: 24
    },

    // --- HEADER & DATE SECTION ---
    headerSection: {
        marginBottom: 20,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: MODERN_PRIMARY,
        letterSpacing: -0.5
    },
    screenSubtitle: {
        fontSize: 14,
        color: NEUTRAL_GREY,
        marginTop: 4,
        fontWeight: '500'
    },
    
    // Modern Date Selector
    dateSelectorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    dateIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(36, 198, 220, 0.1)', // Light Blue Tint
        justifyContent: 'center',
        alignItems: 'center'
    },
    dateTextContainer: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'center'
    },
    dateSelectorLabel: {
        fontSize: 11,
        color: NEUTRAL_GREY,
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 0.5
    },
    dateSelectorValue: {
        fontSize: 18,
        color: MODERN_PRIMARY,
        fontWeight: '700',
        marginTop: 2
    },
    dateArrowBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: SUBTLE_BG_GREY,
        justifyContent: 'center',
        alignItems: 'center'
    },

    // Hero Card (Turnover)
    heroCard: {
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    heroGradient: {
        padding: 22,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroDivider: {
        width: 1,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 15
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8
    },
    heroAmountText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800'
    },
    heroBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 25,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)'
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBgLight: {
        backgroundColor: 'rgba(255,255,255,0.2)', 
        padding: 6, 
        borderRadius: 8, 
        marginRight: 8
    },
    statText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13
    },

    // Search
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 54,
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: MODERN_PRIMARY,
        fontWeight: '500'
    },

    // Customer Card
    customerCard: {
        backgroundColor: CARD_BG,
        borderRadius: 20,
        marginBottom: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    cardTopStrip: {
        height: 4,
        width: '100%'
    },
    cardContent: {
        paddingTop: 12,
        paddingBottom: 8
    },
    cardRowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    groupIconBox: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    groupNameText: {
        fontSize: 14,
        fontWeight: '700',
        color: NEUTRAL_GREY,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    pillTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6
    },
    pillText: {
        fontWeight: '800',
        fontSize: 11
    },
    
    cardRowMiddle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5'
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        color: ACCENT_BLUE,
        fontWeight: '800',
        fontSize: 20
    },
    customerInfoWrapper: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'center'
    },
    customerNameText: {
        fontSize: 17,
        fontWeight: '800',
        color: MODERN_PRIMARY,
        marginBottom: 3
    },
    callRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        alignSelf: 'flex-start'
    },
    phoneText: {
        marginLeft: 6,
        color: ACCENT_BLUE,
        fontSize: 13,
        fontWeight: '700'
    },
    ticketBox: {
        alignItems: 'flex-end',
        backgroundColor: SUBTLE_BG_GREY,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8
    },
    ticketLabel: {
        fontSize: 9,
        color: NEUTRAL_GREY,
        textTransform: 'uppercase',
        fontWeight: '700'
    },
    ticketValue: {
        fontSize: 16,
        fontWeight: '800',
        color: MODERN_PRIMARY
    },

    // Financial Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingTop: 12,
    },
    statsGridItem: {
        width: '50%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRightWidth: 1,
        borderRightColor: '#f5f5f5'
    },
    gridLabel: {
        fontSize: 11,
        color: NEUTRAL_GREY,
        marginBottom: 4,
        fontWeight: '600'
    },
    gridValuePrimary: {
        fontSize: 16,
        fontWeight: '800',
        color: MODERN_PRIMARY
    },
    gridValueGreen: {
        fontSize: 16,
        fontWeight: '800',
        color: ACCENT_GREEN
    },
    gridValueBlue: {
        fontSize: 16,
        fontWeight: '800',
        color: ACCENT_BLUE
    },
    gridValueRed: {
        fontSize: 16,
        fontWeight: '800',
        color: WARNING_RED
    },

    // Empty & Error
    errorBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    errorText: {
        marginTop: 10,
        color: NEUTRAL_GREY,
        fontSize: 16,
        textAlign: 'center'
    },
    retryBtn: {
        marginTop: 15,
        backgroundColor: ACCENT_BLUE,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8
    },
    retryText: {
        color: '#fff',
        fontWeight: '700'
    },
    emptyBox: {
        alignItems: 'center',
        marginTop: 50,
        padding: 20
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: MODERN_PRIMARY,
        marginTop: 10
    },
    emptySub: {
        color: NEUTRAL_GREY,
        marginTop: 5
    }
});
