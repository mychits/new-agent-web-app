
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Dimensions,
  RefreshControl,
  Animated,
  TextInput, // <--- ADDED IMPORT
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import chitBaseUrl from "../constants/baseUrl";

const { height, width } = Dimensions.get('window');

// --- THEME CONSTANTS (Unchanged) ---
const THEME = {
  primary: "#24C6DC",
  secondary: "#183A5D",
  accent: "#0f3460",
  highlight: "#e94560",
  success: "#00d09c",
  warning: "#ffb347",
  white: "#ffffff",
  background: "#f4f7fe",
  textDark: "#1e1e1e",
  textMuted: "#7f8c8d",
  cardBg: "#ffffff",
  danger: "#ff4757",
};

const CustomerOnHold = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // <--- ADDED STATE
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Animation References
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // --- PULSE ANIMATION EFFECT ---
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  // --- ENTRY ANIMATION ---
  const animateEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatCurrency = (amount) => {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) return '₹0';
    return '₹' + numberAmount.toLocaleString('en-IN');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const storedAgentInfo = await AsyncStorage.getItem("agentInfo");
      if (!storedAgentInfo) throw new Error("No agent info found. Please login again.");
      const parsedAgent = JSON.parse(storedAgentInfo);
      const agentId = parsedAgent?._id;
      if (!agentId) throw new Error("Agent ID not found in stored info.");

      const apiUrl = `${chitBaseUrl}/enroll/holded?agent=${agentId}`;
      const response = await axios.get(apiUrl);

      const formattedCustomers = response.data.map((item) => ({
        id: item._id,
        name: item.user_id?.full_name || "Unknown",
        groupName: item.group_id?.group_name || "N/A",
        phoneNumber: item.user_id?.phone_number,
        email: item.user_id?.email ? item.user_id.email.trim() : null,
        paid: parseFloat(item.total_paid_amount || 0),
        balance: parseFloat(item.balance || 0),
        enrollmentDate: item.enrollment_date,
        holdedDate: item.holded_date,
      }));

      setCustomers(formattedCustomers);
      if(!isRefresh) animateEntry();
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err.message || "Failed to load information. Please check your network.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, []);

  // --- SEARCH LOGIC ---
  const filteredCustomers = customers.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.groupName.toLowerCase().includes(query) ||
      (item.phoneNumber && item.phoneNumber.includes(query))
    );
  });

  const handleCall = async (phoneNumber) => {
    if (!phoneNumber) return;
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      Alert.alert("Error", "Could not open phone dialer.");
    }
  };

  const handleEmail = async (email, customerName) => {
    if (!email) return;
    try {
      const subject = "Regarding your pending Chit payment";
      const body = `Dear ${customerName},\n\nWe noticed that your recent chit payment is still pending.\n\nTo continue your participation, please complete the payment.\n\nSincerely,\nMyChits Team`;
      const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Could not open email client.");
    }
  };

  const handleWhatsApp = async (phoneNumber) => {
    if (!phoneNumber) return;
    try {
      const url = `whatsapp://send?phone=${phoneNumber}`;
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp is not installed.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(' ');
    return parts.length >= 2 
      ? (parts[0][0] + parts[1][0]).toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };

  // --- STAGGERED ANIMATED ITEM COMPONENT ---
  const AnimatedCustomerCard = ({ item, index }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(itemAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true
        }).start();
    }, []);

    return (
        <Animated.View 
            style={{
                opacity: itemAnim,
                transform: [{ translateY: Animated.multiply(itemAnim, 20) }]
            }}
        >
            <View style={styles.cardContainer}>
                {/* Top Section: Avatar & Name */}
                <View style={styles.cardHeader}>
                    <LinearGradient 
                        colors={['#667eea', '#764ba2']} 
                        style={styles.avatarBox}
                    >
                        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                    </LinearGradient>
                    
                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.customerName} numberOfLines={1}>{item.name}</Text>
                            <Animated.View style={[styles.holdBadgeContainer, { transform: [{ scale: pulseAnim }] }]}>
                                <View style={styles.holdBadge}>
                                    <Ionicons name="alert-circle" size={10} color="#fff" />
                                    <Text style={styles.holdBadgeText}> ON HOLD </Text>
                                </View>
                            </Animated.View>
                        </View>
                        <View style={styles.subInfoRow}>
                            <Ionicons name="people" size={12} color={THEME.textMuted} />
                            <Text style={styles.groupNameText}>{item.groupName}</Text>
                        </View>
                    </View>
                </View>

                {/* Middle Section: Financials Glass Strip */}
                <LinearGradient 
                    colors={['rgba(36, 198, 220, 0.1)', 'rgba(24, 58, 93, 0.05)']} 
                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                    style={styles.financialStrip}
                >
                    <View style={styles.financialCol}>
                        <Text style={styles.finLabel}>Paid</Text>
                        <Text style={styles.finValuePaid}>{formatCurrency(item.paid)}</Text>
                    </View>
                    <View style={[styles.financialDivider, { backgroundColor: THEME.primary }]} />
                    <View style={styles.financialCol}>
                        <Text style={styles.finLabel}>Balance</Text>
                        <Text style={styles.finValueBalance}>{formatCurrency(item.balance)}</Text>
                    </View>
                </LinearGradient>

                {/* Bottom Section: Dates & Actions */}
                <View style={styles.cardFooter}>
                    <View style={styles.dateSection}>
                        <View style={styles.miniDateBlock}>
                            <Ionicons name="calendar-outline" size={12} color={THEME.textMuted} />
                            <Text style={styles.miniDateText}>{formatDate(item.enrollmentDate)}</Text>
                        </View>
                        <View style={styles.miniDateBlock}>
                            <Ionicons name="pause-circle" size={12} color={THEME.highlight} />
                            <Text style={[styles.miniDateText, { color: THEME.highlight }]}>{formatDate(item.holdedDate)}</Text>
                        </View>
                    </View>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleCall(item.phoneNumber)}>
                            <LinearGradient colors={['#00b09b', '#96c93d']} style={styles.iconGradient}>
                                <Ionicons name="call" size={14} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleWhatsApp(item.phoneNumber)}>
                            <LinearGradient colors={['#25D366', '#128C7E']} style={styles.iconGradient}>
                                <FontAwesome5 name="whatsapp" size={14} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        {item.email && (
                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleEmail(item.email, item.name)}>
                                <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.iconGradient}>
                                    <MaterialCommunityIcons name="email" size={14} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient 
            colors={[THEME.primary, THEME.secondary]} 
            style={styles.headerGradient}
        >
            <View style={{ paddingHorizontal: 15, paddingTop: 10 }}>
                <Header />
            </View>
            <View style={styles.headerTitleBox}>
                <Text style={styles.headerTitle}>Holded Customers</Text>
                <Text style={styles.headerSubtitle}>Action required immediately</Text>
            </View>
        </LinearGradient>

        <View style={styles.mainContainer}>
            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={THEME.primary} />
                    <Text style={styles.loadingText}>Syncing data...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="cloud-offline" size={60} color={THEME.textMuted} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData(false)}>
                        <Text style={styles.retryBtnText}>RETRY</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Animated.ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[THEME.primary]}
                        tintColor={THEME.primary}
                      />
                    }
                >
                    {/* Premium Summary Card */}
                    <Animated.View style={{ 
                        transform: [{ scale: pulseAnim }], 
                    }}>
                        <LinearGradient
                            colors={['#232526', '#414345']}
                            style={styles.summaryCard}
                        >
                            <View style={styles.summaryGlow} />
                            <View style={styles.summaryRow}>
                                <View>
                                    <Text style={styles.summaryLabel}>Total Holded Customers</Text>
                                    <Text style={styles.summaryCount}>{customers.length}</Text>
                                </View>
                                <View style={styles.summaryIconBox}>
                                    <Ionicons name="time" size={32} color="rgba(255,255,255,0.9)" />
                                </View>
                            </View>
                            <View style={styles.summaryFooter}>
                                <Ionicons name="warning" size={14} color={THEME.warning} />
                                <Text style={styles.summaryFooterText}>Accounts on hold require immediate contact.</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* --- SEARCH BAR SECTION --- */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color={THEME.textMuted} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search name, group or phone..."
                                placeholderTextColor={THEME.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <Ionicons name="close-circle" size={20} color={THEME.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((item, index) => (
                            <AnimatedCustomerCard key={item.id} item={item} index={index} />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name={searchQuery.length > 0 ? "search-circle" : "checkmark-circle"} size={80} color={searchQuery.length > 0 ? THEME.textMuted : THEME.success} />
                            <Text style={styles.emptyTitle}>
                                {searchQuery.length > 0 ? "No Results Found" : "All Good!"}
                            </Text>
                            <Text style={styles.emptyDesc}>
                                {searchQuery.length > 0 
                                    ? `No customers match "${searchQuery}"` 
                                    : "No customers are currently on hold."}
                            </Text>
                        </View>
                    )}
                </Animated.ScrollView>
            )}
        </View>
    </SafeAreaView>
  );
};

export default CustomerOnHold;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    // --- Header Styles ---
    headerGradient: {
        paddingTop: 10,
        paddingBottom: 30,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        shadowColor: THEME.secondary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        zIndex: 10,
    },
    headerTitleBox: {
        paddingHorizontal: 25,
        marginTop: 15,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: THEME.white,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
        fontWeight: "500",
    },
    mainContainer: {
        flex: 1,
        backgroundColor: THEME.background,
        marginTop: -20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 35,
        paddingBottom: 40,
    },
    
    // --- Summary Card Styles ---
    summaryCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 25, // Adjusted spacing for search bar
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    summaryGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    summaryCount: {
        fontSize: 42,
        fontWeight: '900',
        color: THEME.white,
        marginTop: 5,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    summaryIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    summaryFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    summaryFooterText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        marginLeft: 8,
        fontWeight: '600',
    },

    // --- Search Bar Styles (NEW) ---
    searchContainer: {
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        backgroundColor: THEME.cardBg,
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: THEME.textDark,
        padding: 0,
        height: 20,
    },

    // --- Customer Card Styles ---
    cardContainer: {
        backgroundColor: THEME.cardBg,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    avatarBox: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        shadowColor: "#764ba2",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    headerInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME.textDark,
        flex: 1,
        marginRight: 10,
    },
    holdBadgeContainer: {
    },
    holdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.highlight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: THEME.highlight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
    },
    holdBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    subInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupNameText: {
        fontSize: 12,
        color: THEME.textMuted,
        marginLeft: 5,
        fontWeight: '500',
    },
    
    // Financial Strip
    financialStrip: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    financialCol: {
        flex: 1,
        alignItems: 'center',
    },
    financialDivider: {
        width: 1,
        height: '70%',
        alignSelf: 'center',
    },
    finLabel: {
        fontSize: 10,
        color: THEME.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    finValuePaid: {
        fontSize: 15,
        fontWeight: '800',
        color: THEME.success,
    },
    finValueBalance: {
        fontSize: 15,
        fontWeight: '800',
        color: THEME.highlight,
    },

    // Card Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        paddingTop: 10,
    },
    dateSection: {
        flex: 1,
    },
    miniDateBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    miniDateText: {
        fontSize: 11,
        color: THEME.textDark,
        marginLeft: 6,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    iconBtn: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    iconGradient: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // UI States
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginTop: 50,
    },
    loadingText: {
        marginTop: 15,
        color: THEME.textMuted,
        fontWeight: '600',
        fontSize: 14,
    },
    errorText: {
        marginTop: 15,
        color: THEME.textMuted,
        textAlign: 'center',
        fontSize: 14,
    },
    retryBtn: {
        marginTop: 20,
        backgroundColor: THEME.highlight,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        shadowColor: THEME.highlight,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    retryBtnText: {
        color: THEME.white,
        fontWeight: '800',
        letterSpacing: 1,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.textDark,
        marginTop: 20,
    },
    emptyDesc: {
        fontSize: 14,
        color: THEME.textMuted,
        marginTop: 8,
        textAlign: 'center',
    }
});
