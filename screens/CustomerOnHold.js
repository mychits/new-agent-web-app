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
  TextInput,
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
  const [searchQuery, setSearchQuery] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  const animateEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
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

  // --- HELPER FOR LINKING ---
  const handleAction = (type, value) => {
    if (!value) return;
    let url = "";
    if (type === "call") {
      url = `tel:${value}`;
    } else if (type === "whatsapp") {
      const cleanPhone = value.replace(/[^0-9]/g, "");
      url = `whatsapp://send?phone=${cleanPhone}`;
    } else if (type === "email") {
      url = `mailto:${value}`;
    }
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert("Error", `Unable to handle ${type}: ${value}`);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
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

  useEffect(() => { fetchData(false); }, []);

  const onRefresh = useCallback(() => { fetchData(true); }, []);

  const filteredCustomers = customers.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.groupName.toLowerCase().includes(query) ||
      (item.phoneNumber && item.phoneNumber.includes(query))
    );
  });

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(' ');
    return parts.length >= 2 
      ? (parts[0][0] + parts[1][0]).toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };

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
                                    <Ionicons name="alert-circle" size={8} color="#fff" />
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

                {/* Action Icons Row */}
                <View style={styles.contactActionsRow}>
                    <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={() => handleAction("call", item.phoneNumber)}
                        activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={16} color="#10B981" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={() => handleAction("whatsapp", item.phoneNumber)}
                        activeOpacity={0.7}
                    >
                      <FontAwesome5 name="whatsapp" size={18} color="#25D366" />
                    </TouchableOpacity>

                    {item.email ? (
                        <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => handleAction("email", item.email)}
                            activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="email" size={16} color={THEME.primary} />
                        </TouchableOpacity>
                    ) : null}
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

                {/* Bottom Section: Dates */}
                <View style={styles.cardFooter}>
                    <View style={styles.miniDateBlock}>
                        <Ionicons name="calendar-outline" size={12} color={THEME.textMuted} />
                        <Text style={styles.miniDateText}>{formatDate(item.enrollmentDate)}</Text>
                    </View>
                    <View style={[styles.miniDateBlock, { marginLeft: 15 }]}>
                        <Ionicons name="pause-circle" size={12} color={THEME.highlight} />
                        <Text style={[styles.miniDateText, { color: THEME.highlight }]}>{formatDate(item.holdedDate)}</Text>
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
                    {/* Summary Card */}
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
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

                    {/* SEARCH BAR */}
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
        flex:1,
        backgroundColor: THEME.background,
    },
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
        fontSize: 22, // Reduced
        fontWeight: "800",
        color: THEME.white,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 12, // Reduced
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
    
    // --- Summary Card ---
    summaryCard: {
        borderRadius: 24,
        padding: 16, // Reduced
        marginBottom: 20, // Reduced
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
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    summaryCount: {
        fontSize: 36, // Reduced
        fontWeight: '900',
        color: THEME.white,
        marginTop: 5,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    summaryIconBox: {
        width: 50, // Reduced
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    summaryFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 6, // Reduced
        paddingHorizontal: 10, // Reduced
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    summaryFooterText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        marginLeft: 8,
        fontWeight: '600',
    },

    // --- Search ---
    searchContainer: {
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        backgroundColor: THEME.cardBg,
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 10, // Reduced
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    searchIcon: { marginRight: 10 },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: THEME.textDark,
        padding: 0,
        height: 20,
    },

    // --- Customer Card ---
    cardContainer: {
        backgroundColor: THEME.cardBg,
        borderRadius: 20,
        marginBottom: 16,
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
        padding: 12, // Reduced
        alignItems: 'center',
    },
    avatarBox: {
        width: 44, // Reduced
        height: 44,
        borderRadius: 14, // Reduced
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: "#764ba2",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    avatarText: {
        fontSize: 16, // Reduced
        fontWeight: '800',
        color: '#fff',
    },
    headerInfo: { flex: 1 },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    customerName: {
        fontSize: 14, // Reduced
        fontWeight: '700',
        color: THEME.textDark,
        flex: 1,
        marginRight: 8,
    },
    holdBadgeContainer: {},
    holdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.highlight,
        paddingHorizontal: 6, // Reduced
        paddingVertical: 2, // Reduced
        borderRadius: 10,
        shadowColor: THEME.highlight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
    },
    holdBadgeText: {
        color: '#fff',
        fontSize: 8, // Reduced
        fontWeight: '800',
        marginLeft: 3,
        letterSpacing: 0.5,
    },
    subInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupNameText: {
        fontSize: 11, // Reduced
        color: THEME.textMuted,
        marginLeft: 5,
        fontWeight: '500',
    },
    
    // --- Action Row ---
    contactActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginLeft: 68, // Align with text
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    // Financial Strip
    financialStrip: {
        flexDirection: 'row',
        paddingVertical: 10, // Reduced
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
        fontSize: 9, // Reduced
        color: THEME.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    finValuePaid: {
        fontSize: 13, // Reduced
        fontWeight: '800',
        color: THEME.success,
    },
    finValueBalance: {
        fontSize: 13, // Reduced
        fontWeight: '800',
        color: THEME.highlight,
    },

    // Card Footer (Dates)
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: 12, // Reduced
        paddingTop: 8,
    },
    miniDateBlock: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniDateText: {
        fontSize: 10, // Reduced
        color: THEME.textDark,
        marginLeft: 5,
        fontWeight: '600',
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
        fontSize: 13,
    },
    errorText: {
        marginTop: 15,
        color: THEME.textMuted,
        textAlign: 'center',
        fontSize: 13,
    },
    retryBtn: {
        marginTop: 20,
        backgroundColor: THEME.highlight,
        paddingVertical: 10, // Reduced
        paddingHorizontal: 24, // Reduced
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
        fontSize: 13, // Reduced
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 20, // Reduced
        fontWeight: 'bold',
        color: THEME.textDark,
        marginTop: 20,
    },
    emptyDesc: {
        fontSize: 13, // Reduced
        color: THEME.textMuted,
        marginTop: 8,
        textAlign: 'center',
    }
});