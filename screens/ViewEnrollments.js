import {
    View,
    Text,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
    TextInput,
    Image,
    Dimensions // Added
} from "react-native";
import { TapGestureHandler } from "react-native-gesture-handler";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import { Feather, Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { whatsappMessage } from "../components/data/messages";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";

// Get dimensions for dynamic styling
const { height } = Dimensions.get('window');

const noImage = require('../assets/no.png');

// --- CONSTANTS COPIED FROM CustomerOnHold.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const ACCENT_GREEN = "#059669";   
const NEUTRAL_GREY = "#6b7280";   
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

const CALL_BUTTON_COLOR = "#f8c009ff"; 
const WHATSAPP_BUTTON_COLOR = "#25D366";
const EMAIL_BUTTON_COLOR = "#3498db";


const ViewEnrollments = ({ route, navigation }) => {
    const { user } = route.params;

    const [chitCustomerLength, setChitCustomerLength] = useState(0);
    const [goldCustomerLength, setGoldCustomerLength] = useState(0);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [customers, setCustomer] = useState([]);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [search, setSearch] = useState("");

    const sendWhatsappMessage = async (item) => {
        const phoneNumber = item?.user_id?.phone_number;
        if (!phoneNumber) return;
        try {
            const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
                whatsappMessage
            )}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Error", "WhatsApp is not installed on this device.");
            }
        } catch (err) {
            console.error("An error occurred", err);
        }
    };

    const openDialer = (item) => {
        const phoneNumber = item?.user_id?.phone_number;
        if (!phoneNumber) return;
        try {
            Linking.openURL(`tel:${phoneNumber}`);
        } catch (err) {
            Alert.alert("Error", "Something went wrong with the dialer.");
        }
    };

    const handleEmail = async (email, customerName) => {
        if (!email) {
            console.warn("Attempted to email customer with no email address.");
            return;
        }
        try {
            const subject = "Regarding your Chit Enrollment";
            const body = `Dear ${customerName},\n\nThank you for enrolling with us!\n\nIf you have any questions about your group, please feel free to reply to this email or call your agent.\n\nSincerely,\nMyChits Team`;
            const url = `mailto:${email}?subject=${encodeURIComponent(
                subject
            )}&body=${encodeURIComponent(body)}`;
            await Linking.openURL(url);
        } catch (error) {
            console.error("Failed to open email client:", error);
            Alert.alert("Error", "Could not open email client.");
        }
    };


    useEffect(() => {
        const fetchEnrolledCustomers = async () => {
            const currentUrl =
                activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
            try {
                activeTab === "CHIT" ? setIsChitLoading(true) : setIsGoldLoading(true);
                const response = await axios.get(
                    `${currentUrl}/enroll/get-enroll-by-agent-id/${user.userId}`
                );
                if (response.status >= 400)
                    throw new Error("Failed to fetch Enrolled customer Data");
                
                setCustomer(response.data);
                activeTab === "CHIT"
                    ? setChitCustomerLength(response?.data?.length)
                    : setGoldCustomerLength(response?.data?.length);
            } catch (err) {
                console.log(err, "error");
                setCustomer([]);
            } finally {
                activeTab === "CHIT"
                    ? setIsChitLoading(false)
                    : setIsGoldLoading(false);
            }
        };
        fetchEnrolledCustomers();
    }, [activeTab, user]);

    const filteredCustomers = customers.filter(customer =>
        customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const renderEnrolledCustomerCard = ({ item }) => {
        const name = item?.user_id?.full_name || "No Name";
        const groupName = item?.group_id?.group_name || "N/A";
        const phoneNumber = item?.user_id?.phone_number;
        const email = item?.user_id?.email;
        const tickets = item?.tickets;
        const hasEmail = !!email;

        return (
            <TapGestureHandler
                numberOfTaps={2}
                onActivated={() => sendWhatsappMessage(item)}
            >
                <View style={styles.customerCardStyle}>
                    
                    {/* Header (Customer Name & Status Tag) */}
                    <View style={styles.cardHeader}>
                        <Text style={styles.customerName} numberOfLines={1}>
                            {name}
                        </Text>
                        {/* Status Tag: ENROLLED and Scheme Type */}
                        <View style={[styles.statusTag, { backgroundColor: ACCENT_GREEN + '20' }]}> 
                            <Text style={[styles.statusTagText, { color: ACCENT_GREEN }]}>
                                ENROLLED ({activeTab})
                            </Text>
                        </View>
                    </View>

                    {/* Customer Info (Group Name & Tickets) */}
                    <View style={styles.cardBody}>
                        {/* Improved Text Style: groupInfoText */}
                        <Text style={styles.groupInfoText}>
                            <Ionicons name="people-outline" size={16} color={ACCENT_BLUE} /> Group: <Text style={styles.groupInfoValue}>{groupName}</Text>
                        </Text>
                        <Text style={styles.groupInfoText}>
                            <MaterialCommunityIcons name="ticket-confirmation-outline" size={16} color={ACCENT_BLUE} /> Tickets: <Text style={styles.groupInfoValue}>{tickets}</Text>
                        </Text>
                        
                        {/* Display Email */}
                        {hasEmail ? ( 
                            <Text style={styles.groupInfoText}>
                                <Ionicons name="mail-outline" size={16} color={ACCENT_BLUE} /> Email: <Text style={styles.groupInfoValue}>{email}</Text>
                            </Text>
                        ) : null}
                    </View>
                    
                    {/* Phone Number Section (Clickable) */}
                    {phoneNumber ? (
                        <View style={styles.phoneSection}>
                            <Text style={styles.phoneLabel}>Contact:</Text>
                            <TouchableOpacity
                                onPress={() => openDialer(item)}
                                style={styles.callLink}
                            >
                                <Ionicons name="call" size={18} color={ACCENT_BLUE} />
                                <Text style={styles.phoneNumberText}>{phoneNumber}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                    
                    {/* Contact Action Buttons */}
                    <View style={styles.buttonContainer}>
                        {/* Call Button */}
                        {phoneNumber ? (
                            <TouchableOpacity
                                style={[styles.contactButton, { backgroundColor: CALL_BUTTON_COLOR }]}
                                onPress={() => openDialer(item)}
                            >
                                <Ionicons name="call" size={15} color="#fff" />
                                <Text style={styles.buttonText}>Call</Text>
                            </TouchableOpacity>
                        ) : null}
                        
                        {/* WhatsApp Button */}
                        {phoneNumber ? (
                            <TouchableOpacity
                                style={[styles.contactButton, { backgroundColor: WHATSAPP_BUTTON_COLOR }]}
                                onPress={() => sendWhatsappMessage(item)}
                            >
                                <FontAwesome5 name="whatsapp" size={15} color="#fff" />
                                <Text style={styles.buttonText}>WhatsApp</Text>
                            </TouchableOpacity>
                        ) : null}
                        
                        {/* Email Button */}
                        {hasEmail ? (
                            <TouchableOpacity
                                style={[styles.contactButton, { backgroundColor: EMAIL_BUTTON_COLOR }]}
                                onPress={() => handleEmail(email, name)}
                            >
                                <MaterialCommunityIcons name="email" size={15} color="#fff" />
                                <Text style={styles.buttonText}>Email</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                </View>
            </TapGestureHandler>
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
                    <Text style={styles.title}>My Customers</Text>
                    <Text style={styles.subtitle}>
                        Total Enrolled: {(chitCustomerLength + goldCustomerLength) || 0}
                    </Text>
                </View>

                <View style={styles.searchContainer}>
                    <Icon
                        name="search"
                        size={20}
                        color={NEUTRAL_GREY}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        value={search}
                        onChangeText={(text) => setSearch(text)}
                        placeholder="Search customers by name..."
                        placeholderTextColor={NEUTRAL_GREY}
                        style={styles.searchInput}
                    />
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                        onPress={() => setActiveTab("CHIT")}
                    >
                        <Icon
                            name="users"
                            size={20}
                            color={activeTab === "CHIT" ? MODERN_PRIMARY : NEUTRAL_GREY}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "CHIT" && styles.activeTabText,
                            ]}
                        >
                            Chits ({chitCustomerLength || 0})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
                        onPress={() => setActiveTab("GOLD")}
                    >
                        <Icon
                            name="money"
                            size={20}
                            color={activeTab === "GOLD" ? MODERN_PRIMARY : NEUTRAL_GREY}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "GOLD" && styles.activeTabText,
                            ]}
                        >
                            Gold Chits ({goldCustomerLength || 0})
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Main Content Area (Light Background) */}
            <View style={styles.mainContentArea}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    {activeTab === "CHIT" ? (
                        isChitLoading ? (
                            <ActivityIndicator
                                size="large"
                                color={ACCENT_BLUE}
                                style={{ marginTop: 20 }}
                            />
                        ) : filteredCustomers.length === 0 ? (
                            <View style={styles.noDataContainer}>
                                <Image source={noImage} style={styles.noImage} />
                                <Text style={styles.noDataText}>No CHIT enrolled customers found.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredCustomers}
                                keyExtractor={(item) => item?._id || item.user_id._id}
                                renderItem={renderEnrolledCustomerCard}
                                contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                            />
                        )
                    ) : isGoldLoading ? (
                        <ActivityIndicator
                            size="large"
                            color={ACCENT_BLUE}
                            style={{ marginTop: 20 }}
                        />
                    ) : filteredCustomers.length === 0 ? (
                        <View style={styles.noDataContainer}>
                            <Image source={noImage} style={styles.noImage} />
                            <Text style={styles.noDataText}>No GOLD CHIT enrolled customers found.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredCustomers}
                            keyExtractor={(item) => item?._id || item.user_id._id}
                            renderItem={renderEnrolledCustomerCard}
                            contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                        />
                    )}
                </KeyboardAvoidingView>
                {/* Floating Action Button (FAB) to navigate to AddCustomer */}
                <TouchableOpacity
                    onPress={() => navigation.navigate("EnrollCustomer", { user: user })}
                    style={styles.fab}
                >
                    <Feather name="plus" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // --- LAYOUT STYLES ---
    safeArea: { 
        flex: 1, 
        backgroundColor: TOP_GRADIENT[0] 
    },
    topContainer: {
        paddingHorizontal: 22,
        paddingBottom: 20,
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        marginTop: -20, 
        paddingTop: 10,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    headerSpacer: { 
        paddingTop: 20, 
        paddingBottom: 5 
    }, 

    // --- TITLE STYLES ---
    titleContainer: {
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
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

    // --- SEARCH BAR ---
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 15,
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: CARD_BG,
        padding: 5,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    searchIcon: {
        marginLeft: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
        fontSize: 16,
        color: MODERN_PRIMARY,
    },

    // --- TABS ---
    tabContainer: {
        flexDirection: "row",
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15,
        marginBottom: 10,
        padding: 5,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: CARD_BG,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: "600",
        marginLeft: 5,
    },
    activeTabText: {
        color: MODERN_PRIMARY,
        fontWeight: 'bold',
    },

    // --- CUSTOMER CARD STYLES (IMPROVED) ---
    customerCardStyle: {
        backgroundColor: CARD_BG, 
        borderRadius: 18, 
        marginBottom: 15,
        padding: 20,
        borderLeftWidth: 6, 
        borderLeftColor: ACCENT_GREEN, // Green for enrolled status
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, 
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: ACCENT_GREEN + '20', 
    },
    
    // CARD CONTENT
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 15, // Use padding instead of margin for better card control
        borderBottomWidth: 1,
        borderBottomColor: SUBTLE_BG_GREY,
    },
    customerName: {
        fontSize: 24, // Increased size
        fontWeight: "900", // Increased weight
        color: MODERN_PRIMARY,
        flexShrink: 1,
        marginRight: 10,
    },
    statusTag: { 
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        alignSelf: 'flex-start', 
    },
    statusTagText: {
        fontSize: 11, // Slightly smaller text for secondary info
        fontWeight: "700",
        textTransform: 'uppercase',
    },
    cardBody: {
        paddingVertical: 15, // Added padding
    },
    // NEW STYLE: Text for Group/Ticket/Email labels
    groupInfoText: {
        fontSize: 15, // Base font size
        color: NEUTRAL_GREY, // Grey for labels
        marginTop: 5,
        fontWeight: "500",
        lineHeight: 24, // Better line spacing
    },
    // NEW STYLE: Value for Group/Ticket/Email
    groupInfoValue: {
        color: MODERN_PRIMARY, // Darker color for values
        fontWeight: '700',
    },


    // PHONE SECTION (CLICKABLE)
    phoneSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 10,
        marginBottom: 5,
        borderTopWidth: 1, // Added top divider
        borderTopColor: SUBTLE_BG_GREY, 
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
        justifyContent: "space-between", 
        gap: 10,
        marginTop: 10,
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10, // Increased padding
        paddingHorizontal: 10,
        borderRadius: 50,
        elevation: 2,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        gap: 6,
        flex: 1,
    },
    buttonText: { 
        color: "#fff", 
        fontWeight: "bold", 
        fontSize: 12
    }, 

    // --- NO DATA / LOADING ---
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        backgroundColor: CARD_BG,
        padding: 20,
        borderRadius: 15,
    },
    noDataText: {
        fontSize: 16,
        color: NEUTRAL_GREY,
        textAlign: 'center',
        fontWeight: '600'
    },
    noImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    fab: {
        position: "absolute",
        bottom: 100,
        right: 20,
        backgroundColor: ACCENT_BLUE,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    }
});

export default ViewEnrollments;