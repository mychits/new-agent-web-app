
import React, { useState, useEffect, useCallback } from "react";
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

// --- THEME CONSTANTS ---
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [agent, setAgent] = useState(null);

  const formatCurrency = (amount) => {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) {
      return '₹0';
    }
    return '₹' + numberAmount.toLocaleString('en-IN');
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
      if (!storedAgentInfo) {
        throw new Error("No agent info found. Please login again.");
      }

      const parsedAgent = JSON.parse(storedAgentInfo);
      const agentId = parsedAgent?._id;

      if (!agentId) {
        throw new Error("Agent ID not found in stored info.");
      }

      const agentResponse = await axios.get(
        `${chitBaseUrl}/agent/get-agent-by-id/${agentId}`
      );
      setAgent(agentResponse.data);

      const apiUrl = `${chitBaseUrl}/enroll/holded?agent=${agentId}`;
      const response = await axios.get(apiUrl);

      const formattedCustomers = response.data.map((item) => ({
        id: item._id,
        name: item.user_id?.full_name || "Unknown",
        groupName: item.group_id?.group_name || "N/A",
        phoneNumber: item.user_id?.phone_number,
        email: item.user_id?.email ? item.user_id.email.trim() : null,
        paid: parseFloat(item.paid_amount || item.paid || 0),
        balance: parseFloat(item.balance_amount || item.balance || item.due_amount || 0),
      }));

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(
        err.message || "Failed to load information. Please check your network."
      );
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

  const handleCall = async (phoneNumber) => {
    if (!phoneNumber) return;
    try {
      const url = `tel:${phoneNumber}`;
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open phone dialer:", error);
      Alert.alert("Error", "Could not open phone dialer.");
    }
  };

  const handleEmail = async (email, customerName) => {
    if (!email) {
      console.warn("Attempted to email customer with no email address.");
      return;
    }
    try {
      const subject = "Regarding your pending Chit payment";
      const body = `Dear ${customerName},\n\nWe noticed that your recent chit payment is still pending for the group\n\nTo continue your participation and avoid any interruptions, please complete the payment at your earliest convenience.\n\nThank you for your cooperation.\n\nSincerely,\nMyChits Team`;

      const url = `mailto:${email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open email client:", error);
      Alert.alert("Error", "Could not open email client.");
    }
  };

  const handleWhatsApp = async (phoneNumber) => {
    if (!phoneNumber) return;
    try {
      const url = `whatsapp://send?phone=${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on this device.");
      }
    } catch (error) {
      console.error("Failed to open WhatsApp:", error);
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderCustomerCard = (customer) => {
    const hasEmail = !!customer.email;
    const initials = getInitials(customer.name);

    return (
      <View key={customer.id} style={styles.cardContainer}>
        <View style={styles.cardContent}>
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            <LinearGradient 
                colors={['#667eea', '#764ba2']} 
                style={styles.avatarContainer}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            
            <View style={styles.infoContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.customerName} numberOfLines={1}>{customer.name}</Text>
                <View style={styles.holdBadge}>
                    <Text style={styles.holdBadgeText}>Holded</Text>
                </View>
              </View>
              <Text style={styles.groupNameText}>
                <Ionicons name="people-circle-outline" size={12} color={THEME.textMuted} /> {customer.groupName}
              </Text>
            </View>
          </View>

          {/* Payment Info Row - Compact */}
          <View style={styles.paymentRow}>
             <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Paid</Text>
                <Text style={styles.paidAmountText}>{formatCurrency(customer.paid)}</Text>
             </View>
             <View style={styles.paymentDivider} />
             <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Balance</Text>
                <Text style={styles.balanceAmountText}>{formatCurrency(customer.balance)}</Text>
             </View>
          </View>

          {/* Contact Details Row - Inline & Small */}
          <View style={styles.contactRow}>
             <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={13} color={THEME.highlight} />
                <Text style={styles.contactText}>{customer.phoneNumber}</Text>
             </View>
             {hasEmail && (
                <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={13} color={THEME.highlight} />
                    <Text style={styles.contactText} numberOfLines={1}>{customer.email}</Text>
                </View>
             )}
          </View>

          {/* Action Buttons Footer */}
          <View style={styles.actionFooter}>
            <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => handleCall(customer.phoneNumber)}
                activeOpacity={0.7}
            >
                <LinearGradient colors={['#00b09b', '#96c93d']} style={styles.btnGradient}>
                    <Ionicons name="call" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => handleWhatsApp(customer.phoneNumber)}
                activeOpacity={0.7}
            >
                <LinearGradient colors={['#25D366', '#128C7E']} style={styles.btnGradient}>
                    <FontAwesome5 name="whatsapp" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>

            {hasEmail && (
                <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => handleEmail(customer.email, customer.name)}
                    activeOpacity={0.7}
                >
                    <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.btnGradient}>
                        <MaterialCommunityIcons name="email" size={14} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.actionBtnText}>Email</Text>
                </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient 
            colors={[THEME.primary, THEME.secondary]} 
            style={styles.headerGradient}
        >
            <View style={{ paddingTop: 10, paddingHorizontal: 10 }}>
                <Header />
            </View>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Holded Customers</Text>
                <Text style={styles.headerSubtitle}>Customers requiring attention</Text>
            </View>
        </LinearGradient>

        <View style={styles.mainContainer}>
            {loading && !refreshing ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={THEME.highlight} />
                    <Text style={styles.loadingText}>Fetching customers...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="cloud-offline-outline" size={50} color={THEME.textMuted} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData(false)}>
                        <Text style={styles.retryBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView 
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
                    <LinearGradient
                        colors={['#232526', '#414345']}
                        style={styles.summaryBox}
                    >
                        <View style={styles.summaryDecorativeCircle} />
                        <View style={styles.summaryDecorativeCircle2} />
                        
                        <View style={styles.summaryTopRow}>
                            <View style={styles.summaryIconCircle}>
                                <Ionicons name="warning" size={24} color="#fff" />
                            </View>
                            <View style={styles.summaryTextCol}>
                                <Text style={styles.summaryLabel}>Total Holded Customers</Text>
                                <Text style={styles.summaryBigNumber}>{customers.length}</Text>
                            </View>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryMessageRow}>
                            <Ionicons name="information-circle" size={20} color={THEME.warning} />
                            <Text style={styles.summaryMessageText}>
                                Please contact your customers immediately to resolve pending issues.
                            </Text>
                        </View>
                    </LinearGradient>

                    {customers.length > 0 ? (
                        customers.map(renderCustomerCard)
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-done-circle" size={80} color={THEME.success} />
                            <Text style={styles.emptyTitle}>All Clear!</Text>
                            <Text style={styles.emptyDesc}>No customers are currently on hold. Great work!</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    </SafeAreaView>
  );
};

export default CustomerOnHold;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.primary,
    },
    headerGradient: {
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: THEME.white,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    mainContainer: {
        flex: 1,
        backgroundColor: THEME.background,
        marginTop: -15,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 100,
    },
    summaryBox: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    summaryDecorativeCircle: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    summaryDecorativeCircle2: {
        position: 'absolute',
        bottom: -50,
        left: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    summaryTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: THEME.highlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    summaryTextCol: {
        justifyContent: 'center',
    },
    summaryLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    summaryBigNumber: {
        fontSize: 40,
        fontWeight: '800',
        color: THEME.white,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 15,
    },
    summaryMessageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        padding: 12,
        borderRadius: 12,
    },
    summaryMessageText: {
        color: THEME.white,
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 10,
        flex: 1,
    },
    // --- SMALLER CARD STYLES ---
    cardContainer: {
        marginBottom: 12, // Reduced margin
        borderRadius: 16, // Slightly smaller radius
        backgroundColor: THEME.cardBg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    cardContent: {
        padding: 12, // Reduced padding
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarContainer: {
        width: 40, // Smaller avatar
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: "#764ba2",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    avatarText: {
        fontSize: 16, // Smaller text
        fontWeight: 'bold',
        color: '#fff',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    customerName: {
        fontSize: 15, // Smaller font
        fontWeight: '700',
        color: THEME.textDark,
        flex: 1,
    },
    holdBadge: {
        backgroundColor: 'rgba(233, 69, 96, 0.1)',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 20,
        marginLeft: 8,
    },
    holdBadgeText: {
        color: THEME.highlight,
        fontSize: 9, // Smaller badge text
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    groupNameText: {
        fontSize: 12, // Smaller font
        color: THEME.textMuted,
        fontWeight: '500',
        marginTop: 1,
    },
    paymentRow: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        paddingVertical: 8, // Reduced padding
        paddingHorizontal: 10,
        marginBottom: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentItem: {
        flex: 1,
        alignItems: 'center',
    },
    paymentDivider: {
        width: 1,
        height: 20, // Smaller divider
        backgroundColor: '#e0e0e0',
    },
    paymentLabel: {
        fontSize: 10, // Smaller font
        color: THEME.textMuted,
        marginBottom: 2,
        fontWeight: '600',
    },
    paidAmountText: {
        fontSize: 14, // Smaller font
        fontWeight: '700',
        color: THEME.success,
    },
    balanceAmountText: {
        fontSize: 14, // Smaller font
        fontWeight: '700',
        color: THEME.danger,
    },
    // --- INLINE CONTACT ROW ---
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        marginBottom: 10,
        marginTop: 2,
        // Removed borders and padding for compact look
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12, // Space between phone and email
    },
    contactText: {
        marginLeft: 4,
        fontSize: 11, // Smaller font
        color: THEME.textDark,
        fontWeight: '500',
    },
    actionFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // Left align buttons
        marginTop: 5,
        gap: 10, // Gap between buttons (RN 0.71+)
    },
    actionBtn: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnGradient: {
        width: 36, // Smaller buttons
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    actionBtnText: {
        fontSize: 9, // Smaller text
        color: THEME.textMuted,
        fontWeight: '600',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: THEME.textMuted,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 10,
        color: THEME.textMuted,
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 15,
        backgroundColor: THEME.highlight,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryBtnText: {
        color: THEME.white,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.textDark,
        marginTop: 15,
    },
    emptyDesc: {
        fontSize: 14,
        color: THEME.textMuted,
        marginTop: 8,
        textAlign: 'center',
    }
});