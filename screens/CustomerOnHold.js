import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
}
 from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import chitBaseUrl from "../constants/baseUrl";

const { height } = Dimensions.get('window');

// --- CONSTANTS MATCHING ReferredReport.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const ACCENT_GREEN = "#059669";   
const WARNING_RED = "#dc2626";    
const NEUTRAL_GREY = "#6b7280";   
const BORDER_COLOR = "#e0e0e0"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

// Keeping original action colors for brand recognition, but updating the call button aesthetic
const CALL_BUTTON_COLOR = "#f8c009ff"; 
const WHATSAPP_BUTTON_COLOR = "#25D366";
const EMAIL_BUTTON_COLOR = "#3498db";


const CustomerOnHold = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agent, setAgent] = useState(null);

  // Fetch agent details from AsyncStorage → then fetch agent info from API
  useEffect(() => {
    const fetchAgentById = async () => {
      try {
        const storedAgentInfo = await AsyncStorage.getItem("agentInfo");
        if (!storedAgentInfo) {
          setError("No agent info found. Please login again.");
          setLoading(false);
          return;
        }

        const parsedAgent = JSON.parse(storedAgentInfo);
        const agentId = parsedAgent?._id; 

        if (!agentId) {
          setError("Agent ID not found in stored info.");
          setLoading(false);
          return;
        }

        // Fetch agent from backend
        const response = await axios.get(
          `${chitBaseUrl}/agent/get-agent-by-id/${agentId}`
        );
        setAgent(response.data);
      } catch (error) {
        console.error("Error fetching agent data:", error);
        setError("Failed to load agent information.");
        setLoading(false);
      }
    };

    fetchAgentById();
  }, []);

  // Fetch customers on hold when agent is loaded
  useEffect(() => {
    if (!agent || !agent._id) return;

    const fetchCustomersOnHold = async () => {
      try {
        const apiUrl = `${chitBaseUrl}/enroll/holded?agent=${agent._id}`;
        const response = await axios.get(apiUrl);

        const formattedCustomers = response.data.map((item) => ({
          // FIX: Use the unique enrollment ID (item._id) as the key
          // instead of the user ID (item.user_id._id) to prevent key collisions
          id: item._id, 
          name: item.user_id.full_name,
          groupName: item.group_id.group_name,
          phoneNumber: item.user_id.phone_number,
          // Ensure email is a non-empty string or null/undefined
          email: item.user_id.email ? item.user_id.email.trim() : null, 
        }));

        setCustomers(formattedCustomers);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        setError(
          "Failed to load customer information. Please check your network and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersOnHold();
  }, [agent]);

  // -------- helper functions for call, email, whatsapp ----------
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
    // Only proceed if email exists
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
      // The URL format is correct: `whatsapp://send?phone=` 
      const url = `whatsapp://send?phone=${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        // This is the alert you were seeing, which means the OS couldn't verify WhatsApp 
        // (due to missing 'queries' in app.json on Android 11+).
        Alert.alert("Error", "WhatsApp is not installed on this device.");
      }
    } catch (error) {
      console.error("Failed to open WhatsApp:", error);
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  const renderCustomerCard = (customer) => {
    // Check if email is valid (non-null and non-empty string)
    const hasEmail = !!customer.email;

    return (
        <View key={customer.id} style={styles.customerCardStyle}> 
            
            {/* Header (Customer Name & Status Tag) */}
            <View style={styles.cardHeader}>
                <Text style={styles.customerName} numberOfLines={1}>{customer.name}</Text>
                {/* Fixed "On Hold" status tag */}
                <View style={[styles.statusTag, { backgroundColor: '#fef3c7' }]}> 
                    <Text style={[styles.statusTagText, { color: WARNING_RED }]}>
                        ON HOLD
                    </Text>
                </View>
            </View>

            {/* Customer Info (Group Name & Email) */}
            <View style={styles.cardBody}>
                <Text style={styles.groupInfo}><Ionicons name="people" size={14} color={NEUTRAL_GREY} /> Group: {customer.groupName}</Text>
                
                {/* Display Email only if customer.email is present */}
                {hasEmail ? ( 
                    <Text style={styles.groupInfo}>
                        <Ionicons name="mail" size={14} color={NEUTRAL_GREY} /> {customer.email}
                    </Text>
                ) : null}
            </View>
            
            {/* Phone Number Section (Clickable) */}
            <View style={styles.phoneSection}>
                <Text style={styles.phoneLabel}>Phone:</Text>
                <TouchableOpacity
                    onPress={() => handleCall(customer.phoneNumber)}
                    style={styles.callLink}
                >
                    <Ionicons name="call" size={18} color={ACCENT_BLUE} />
                    <Text style={styles.phoneNumberText}>{customer.phoneNumber}</Text>
                </TouchableOpacity>
            </View>
            
            {/* Contact Action Buttons */}
            <View style={styles.buttonContainer}>
                {/* Call Button (Always displayed if phone number is available, which it should be) */}
                <TouchableOpacity
                    style={[styles.contactButton, { backgroundColor: CALL_BUTTON_COLOR }]}
                    onPress={() => handleCall(customer.phoneNumber)}
                >
                    <Ionicons name="call" size={15} color="#fff" />
                    <Text style={styles.buttonText}>Call</Text>
                </TouchableOpacity>
                
                {/* WhatsApp Button (Always displayed if phone number is available) */}
                <TouchableOpacity
                    style={[styles.contactButton, { backgroundColor: WHATSAPP_BUTTON_COLOR }]}
                    onPress={() => handleWhatsApp(customer.phoneNumber)}
                >
                    <FontAwesome5 name="whatsapp" size={15} color="#fff" />
                    <Text style={styles.buttonText}>WhatsApp</Text>
                </TouchableOpacity>
                
                {/* Email Button (Only displayed if customer.email is present) */}
                {hasEmail ? (
                    <TouchableOpacity
                        style={[styles.contactButton, { backgroundColor: EMAIL_BUTTON_COLOR }]}
                        onPress={() => handleEmail(customer.email, customer.name)}
                    >
                        <MaterialCommunityIcons name="email" size={15} color="#fff" />
                        <Text style={styles.buttonText}>Email</Text>
                    </TouchableOpacity>
                ) : null}

            </View>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header Section with Gradient */}
        <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
            <View style={styles.headerSpacer}>
                <Header />
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>Customers On Hold</Text>
                <Text style={styles.subtitle}>
                    Follow up with these customers to resolve their hold status.
                </Text>
            </View>
        </LinearGradient>

        {/* Main Content Area (Light Background) */}
        <View style={styles.mainContentArea}>
            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={ACCENT_BLUE} />
                    <Text style={styles.loadingTextBlue}>Fetching customers on hold...</Text>
                </View>
            ) : error ? (
                <Text style={styles.statusText}>{error}</Text>
            ) : (
                <ScrollView contentContainerStyle={styles.cardsScrollViewContent} style={styles.scrollViewStyle}>
                    {customers.length > 0 ? (
                        // This mapping now uses the unique enrollment ID as the key
                        customers.map(renderCustomerCard)
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="documents-outline" size={50} color={NEUTRAL_GREY} />
                            <Text style={styles.emptyText}>No customers currently on hold.</Text>
                            <Text style={{ color: NEUTRAL_GREY, marginTop: 5, fontSize: 14 }}>
                                Great job! Your follow-up is working.
                            </Text>
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
    // --- LAYOUT STYLES (MATCHING ReferredReport.js) ---
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

    // --- TITLE STYLES (MATCHING ReferredReport.js) ---
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

    // --- NEW REDESIGNED CUSTOMER CARD STYLE ---
    customerCardStyle: {
        backgroundColor: '#fff7f7', // Light red/pink background for urgency
        borderRadius: 18, 
        marginBottom: 18,
        padding: 20,
        borderLeftWidth: 6, // Thick left border
        borderLeftColor: WARNING_RED, // Red for urgency
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, 
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#fcd3d1', // Lighter red border
    },
    
    // CARD CONTENT
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15, // Increased padding
    },
    customerName: {
        fontSize: 22,
        fontWeight: "900",
        color: MODERN_PRIMARY,
        flexShrink: 1,
        marginRight: 10,
    },
    statusTag: { // Used for "ON HOLD" status
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
        marginBottom: 20, // Increased padding
    },
    groupInfo: {
        fontSize: 12, // Slightly increased font size
        color: NEUTRAL_GREY,
        marginTop: 5,
        fontWeight: "500",
        flexDirection: 'row',
        alignItems: 'center',
    },

    // PHONE SECTION (CLICKABLE)
    phoneSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 10,
        marginBottom: 10,
        borderBottomWidth: 1, // Added a bottom divider to visually separate from buttons
        borderBottomColor: '#fcd3d1', // Light red divider
    },
    phoneLabel: {
        fontSize: 15,
        color: NEUTRAL_GREY,
        fontWeight: "500",
        marginRight: 15,
    },
    callLink: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 5,
    },
    phoneNumberText: {
        color: ACCENT_BLUE,
        textDecorationLine: 'underline',
        fontWeight: '700',
        fontSize: 18,
        marginLeft: 5,
    },
    
    // Contact Buttons
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between", // Changed to space-between to spread buttons out
        gap: 10,
        marginTop: 10,
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 50,
        elevation: 2,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        gap: 6,
        flex: 1, // Make buttons take up equal space
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 12 }, // Slightly smaller text for fit

    // --- SCROLLVIEW / LOADER / EMPTY STATE ---
    scrollViewStyle: {
        flex: 1,
    },
    cardsScrollViewContent: { 
        paddingBottom: 120,
    },
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
        marginTop: 20,
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 80,
        padding: 20,
        backgroundColor: CARD_BG,
        borderRadius: 15,
    },
    emptyText: {
        color: NEUTRAL_GREY,
        marginTop: 15,
        fontWeight: "600",
        fontSize: 18,
    },
});