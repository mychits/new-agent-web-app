
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

// --- THEME CONSTANTS ---
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
          const totalPaid = parseFloat(c.totalPaid || 0);
          const monthlyInstallment = parseFloat(c.monthly_installment || 0);
          let lastPaymentDate = 'N/A';

          if (c.payments && c.payments.length > 0) {
            const latestDate = c.payments.map(p => p.pay_date).filter(date => date).sort((a, b) => new Date(b) - new Date(a))[0];
            if (latestDate) lastPaymentDate = moment(latestDate).format("DD MMM");
          }

          return {
            ...c,
            paymentStatus: totalPaid >= monthlyInstallment ? "PAID" : "UNPAID",
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
      {/* Header Skeleton */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <ShimmerLoader style={{ width: '60%', height: 25, borderRadius: 8, backgroundColor: '#e0e0e0' }} />
        <ShimmerLoader style={{ width: 80, height: 25, borderRadius: 8, backgroundColor: '#e0e0e0' }} />
      </View>
      {/* Summary Skeleton */}
      <ShimmerLoader style={{ width: '100%', height: 160, borderRadius: 20, backgroundColor: '#e0e0e0', marginBottom: 20 }} />
      {/* List Skeleton */}
      {[1,2,3].map(i => (
        <View key={i} style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: 15, marginBottom: 15, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                <ShimmerLoader style={{ width: '40%', height: 18, borderRadius: 6, backgroundColor: '#f0f0f0' }} />
                <ShimmerLoader style={{ width: 60, height: 22, borderRadius: 10, backgroundColor: '#f0f0f0' }} />
            </View>
            <ShimmerLoader style={{ width: '70%', height: 14, borderRadius: 6, backgroundColor: '#f0f0f0', marginBottom: 10 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ShimmerLoader style={{ width: '45%', height: 40, borderRadius: 8, backgroundColor: '#f0f0f0' }} />
                <ShimmerLoader style={{ width: '45%', height: 40, borderRadius: 8, backgroundColor: '#f0f0f0' }} />
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
              <Ionicons name="calendar-outline" size={22} color={ACCENT_BLUE} />
          </View>
          <View style={styles.dateTextContainer}>
              <Text style={styles.dateSelectorLabel}>Selected Period</Text>
              <Text style={styles.dateSelectorValue}>{formattedDate}</Text>
          </View>
          <View style={styles.dateArrowBox}>
              <Ionicons name="chevron-down-sharp" size={20} color={NEUTRAL_GREY} />
          </View>
      </TouchableOpacity>

      {/* Hero Turnover Card */}
      <View style={styles.heroCard}>
        <LinearGradient colors={['#183A5D', '#24C6DC']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.heroGradient}>
            <View style={styles.heroTop}>
                <View>
                    <Text style={styles.heroLabel}>EXPECTED</Text>
                    <Text style={styles.heroAmountText}>{formatCurrency(turnoverData?.expectedTurnover)}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View>
                    <Text style={styles.heroLabel}>ACTUAL</Text>
                    <Text style={[styles.heroAmountText, { color: ACCENT_GREEN }]}>{formatCurrency(turnoverData?.totalTurnover)}</Text>
                </View>
            </View>
            
            <View style={styles.heroBottom}>
                <View style={styles.statItem}>
                    <Ionicons name="people" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.statText}> {turnoverData?.totalCustomers} Customers</Text>
                </View>
                <View style={styles.statItem}>
                    <FontAwesome5 name="user-tie" size={12} color="rgba(255,255,255,0.7)" />
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
        <View style={[styles.customerCard, { borderLeftColor: statusColor }]}>
            {/* Row 1: Group & Status */}
            <View style={styles.cardRowTop}>
                <Text style={styles.groupNameText} numberOfLines={1}>{item.group_id?.group_name || 'Group'}</Text>
                <View style={[styles.pillTag, { backgroundColor: isPaid ? '#D1FAE5' : '#FEE2E2' }]}>
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
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.subLabel}>Ticket</Text>
                    <Text style={styles.subValue}>{item.ticket}</Text>
                </View>
            </View>

            {/* Row 3: Financial Grid */}
            <View style={styles.cardGrid}>
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Installment</Text>
                    <Text style={styles.gridValue}>{formatCurrency(item.monthly_installment)}</Text>
                </View>
                <View style={[styles.gridItem, { borderLeftWidth: 1, borderLeftColor: '#f0f0f0' }]}>
                    <Text style={styles.gridLabel}>Total Paid</Text>
                    <Text style={[styles.gridValue, { color: ACCENT_GREEN }]}>{formatCurrency(item.totalPaid)}</Text>
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
        paddingBottom: 10,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
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
        paddingTop: 20
    },

    // --- HEADER & DATE SECTION ---
    headerSection: {
        marginBottom: 15,
    },
    screenTitle: {
        fontSize: 26,
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
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    dateIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    dateTextContainer: {
        flex: 1,
        marginLeft: 12,
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
        fontSize: 17,
        color: MODERN_PRIMARY,
        fontWeight: '700',
        marginTop: 2
    },
    dateArrowBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: SUBTLE_BG_GREY,
        justifyContent: 'center',
        alignItems: 'center'
    },

    // Hero Card (Turnover)
    heroCard: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    heroGradient: {
        padding: 20,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 5
    },
    heroAmountText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900'
    },
    heroBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)'
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12
    },

    // Search
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: MODERN_PRIMARY,
        fontWeight: '500'
    },

    // Customer Card
    customerCard: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        marginBottom: 12,
        borderLeftWidth: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        overflow: 'hidden'
    },
    cardRowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5'
    },
    groupNameText: {
        fontSize: 14,
        fontWeight: '700',
        color: NEUTRAL_GREY,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    pillTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    pillText: {
        fontWeight: '800',
        fontSize: 11
    },
    
    cardRowMiddle: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        color: ACCENT_BLUE,
        fontWeight: '800',
        fontSize: 18
    },
    customerInfoWrapper: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center'
    },
    customerNameText: {
        fontSize: 16,
        fontWeight: '800',
        color: MODERN_PRIMARY,
        marginBottom: 2
    },
    callRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2
    },
    phoneText: {
        marginLeft: 5,
        color: ACCENT_BLUE,
        fontSize: 13,
        fontWeight: '600'
    },
    subLabel: {
        fontSize: 10,
        color: NEUTRAL_GREY,
        textTransform: 'uppercase'
    },
    subValue: {
        fontSize: 14,
        fontWeight: '800',
        color: MODERN_PRIMARY
    },

    cardGrid: {
        flexDirection: 'row',
        backgroundColor: '#FAFAFA',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    gridItem: {
        flex: 1
    },
    gridLabel: {
        fontSize: 11,
        color: NEUTRAL_GREY,
        marginBottom: 2
    },
    gridValue: {
        fontSize: 15,
        fontWeight: '800',
        color: MODERN_PRIMARY
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
