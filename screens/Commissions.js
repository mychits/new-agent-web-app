import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Image,
    Animated,
    Dimensions,
    Easing,
} from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context"; 

const { width, height } = Dimensions.get('window');

const noImage = require('../assets/no.png'); // Assuming this path is correct

// --- DESIGN CONSTANTS COPIED FROM RouteCustomerPigme.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers (Used instead of secondary)
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (Used instead of primary)
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext (Used instead of softGrey)
const CARD_BG = "#ffffff";
// MODIFICATION 1: Setting SUBTLE_BG_GREY to white (CARD_BG)
const SUBTLE_BG_GREY = CARD_BG; // Very light background for content area (Used instead of backgroundLight)
// ---------------------------------------------

import COLORS from "../constants/color"; 
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

const CustomCommissionCard = ({ title, icon, value, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.card}>
        <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={24} style={styles.cardIcon} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.cardText}>{title}</Text>
                <Text style={styles.cardSubText}>{value}</Text>
            </View>
        </View>
        <MaterialIcons name="keyboard-arrow-right" style={styles.arrowIcon} />
    </TouchableOpacity>
);


// --------------------------------------------------------
// --- CONFETTI SHOWER COMPONENT (REMOVED) ---
// The ConfettiFall component is removed as per request.
// --------------------------------------------------------


const Commissions = ({ route, navigation }) => {
    const { user } = route.params || {};
    const currentUser = user || {};

    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [commissions, setCommissions] = useState({}); 
    const [activeTab, setActiveTab] = useState("CHIT");
    
    // MODIFICATION 2: Removed state for confetti elements:
    // const [confettiElements, setConfettiElements] = useState([]);
    
    // Animation values for card list slide-in
    const cardListOpacity = React.useRef(new Animated.Value(0)).current; 
    const dataContainerTranslateY = React.useRef(new Animated.Value(-height * 0.1)).current; 
    
    // ... (utility functions remain the same) ...
    const handleEstimatedCommission = () => {
        navigation.navigate("ExpectedCommissions", { user: currentUser });
    };

    const handleMyCommission = () => {
        navigation.navigate("MyCommission", { commissions: commissions });
    };

    const handleMyCustomers = () => {
        navigation.navigate("ViewEnrollments", { user: currentUser });
    };

    const handleGroups = () => {
        navigation.navigate("EnrolledGroups", { user: currentUser });
    };

    const scrollData = [
        { title: "Customers", icon: "person", value: "total_customers", key: "#1", handlePress: handleMyCustomers },
        { title: "Groups", icon: "group", value: "total_groups", key: "#2", handlePress: handleGroups },
        { title: "My Business", icon: "query-stats", value: "actual_business", key: "#6", handlePress: handleMyCommission },
        { title: "Estimated Business", icon: "trending-up", value: "expected_business", key: "#5", handlePress: handleEstimatedCommission },
        { title: "My Commission", icon: "payments", value: "total_actual", key: "#4", handlePress: handleMyCommission },
        { title: "Estimated Commission", icon: "currency-rupee", value: "total_estimated", key: "#3", handlePress: handleEstimatedCommission },
    ];

    const hasData = commissions?.summary && Object.keys(commissions.summary).length > 0;

    // MODIFICATION 2: Removed startConfettiAnimation function:
    // const startConfettiAnimation = () => { ... };

    useEffect(() => {
        const fetchCommissions = async () => {
            // Reset animations and clear old data before fetching
            cardListOpacity.setValue(0); 
            dataContainerTranslateY.setValue(-height * 0.1);
            // MODIFICATION 2: Removed setConfettiElements call:
            // setConfettiElements([]); 
            setCommissions({}); 

            if (!currentUser.userId) {
                console.warn("User ID is not available for fetching commissions.");
                setIsChitLoading(false);
                setIsGoldLoading(false);
                return;
            }

            const currentUrl =
                activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
            try {
                activeTab === "CHIT" ? setIsChitLoading(true) : setIsGoldLoading(true);
                const response = await axios.get(
                    `${currentUrl}/enroll/get-detailed-commission/${currentUser.userId}`
                );
                
                if (response.status >= 400)
                    throw new Error("Failed to fetch Customer Data");
                
                setCommissions(response.data);
                
                const summaryExists = response.data?.summary && Object.keys(response.data.summary).length > 0;

                if (summaryExists) {
                    // MODIFICATION 2: Removed call to startConfettiAnimation():
                    // startConfettiAnimation();

                    // 2. Run the Card Slide-Down Animation
                    Animated.parallel([
                        Animated.timing(cardListOpacity, { 
                            toValue: 1,
                            duration: 700, 
                            delay: 500, 
                            useNativeDriver: true,
                        }),
                        Animated.spring(dataContainerTranslateY, {
                            toValue: 0,
                            speed: 4, 
                            bounciness: 6, 
                            delay: 500, 
                            useNativeDriver: true,
                        })
                    ]).start();
                }

            } catch (err) {
                console.error("Error fetching commissions:", err.message);
                setCommissions({}); 
            } finally {
                activeTab === "CHIT"
                    ? setIsChitLoading(false)
                    : setIsGoldLoading(false);
            }
        };
        fetchCommissions();
    }, [activeTab, currentUser]); 

    const renderCardList = (isLoading, dataAvailable, activeTabName) => {
        if (isLoading) {
            return (
                <ActivityIndicator
                    size="large"
                    color={ACCENT_BLUE}
                    style={{ marginTop: 20 }}
                />
            );
        }

        if (dataAvailable) {
            const animatedStyle = {
                opacity: cardListOpacity,
                transform: [{ translateY: dataContainerTranslateY }],
            };
            
            return (
                <Animated.View style={[{ gap: 20, width: '100%' }, animatedStyle]}> 
                    {scrollData.map(({ title, icon, value, key, handlePress }) => (
                        <CustomCommissionCard
                            key={key}
                            title={title}
                            icon={icon}
                            value={commissions?.summary?.[value] || 0} 
                            onPress={handlePress}
                        />
                    ))}
                </Animated.View>
            );
        }

        return (
            <View style={styles.noDataContainer}>
                <Ionicons name="alert-circle-outline" size={50} color={ACCENT_BLUE} />
                <Text style={styles.noLeadsText}>
                    No {activeTabName} Commission Data Found
                </Text>
                <Image source={noImage} style={styles.noImage} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* MODIFICATION 2: Removed confetti rendering: */}
            {/* {confettiElements} */}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            >
                {/* Top Header Section with Gradient */}
                <LinearGradient
                    colors={TOP_GRADIENT}
                    style={styles.topContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Fixed Header Section */}
                    <View style={styles.headerSpacer}>
                        <Header />
                    </View>

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>My Overview </Text>
                        <Text style={styles.subtitle}>Select a scheme type to view your achievements</Text>
                    </View>
                    
                    {/* Tab Container */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                            onPress={() => setActiveTab("CHIT")}
                        >
                            <Icon
                                name="users"
                                size={20}
                                color={activeTab === "CHIT" ? CARD_BG : MODERN_PRIMARY}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "CHIT" && styles.activeTabText,
                                ]}
                            >
                                Chits
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
                            onPress={() => setActiveTab("GOLD")}
                        >
                            <Icon
                                name="money"
                                size={20}
                                color={activeTab === "GOLD" ? CARD_BG : MODERN_PRIMARY}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "GOLD" && styles.activeTabText,
                                ]}
                            >
                                Gold Schemes
                            </Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Main Content Area (Now solid White Background with Rounded Corners) */}
                <View style={styles.mainContentArea}>
                    {/* Scrollable Content Section */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer} 
                    >
                        <View style={styles.cardListContainer}>
                            {activeTab === "CHIT"
                                ? renderCardList(isChitLoading, hasData, "Chit")
                                : renderCardList(isGoldLoading, hasData, "Gold")
                            }
                        </View>
                    </ScrollView>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // --- NEW LAYOUT STYLES (Copied from RouteCustomerPigme.js) ---
    safeArea: { 
        flex: 1, 
        backgroundColor: TOP_GRADIENT[0] 
    },
    topContainer: {
        paddingHorizontal: 16,
        paddingBottom: 25, // Adjusted for spacing above content area
        zIndex: 1,
    },
    headerSpacer: { 
        paddingTop: 20, 
        paddingBottom: 5 
    }, 
    mainContentArea: {
        flex: 1,
        // MODIFICATION 1: SUBTLE_BG_GREY is now CARD_BG (White)
        backgroundColor: SUBTLE_BG_GREY, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        marginTop: -20, // Overlap the top container for the curved effect
        paddingTop: 30, // Space inside the curve
    },
    scrollContainer: { 
        paddingBottom: 50, 
        paddingTop: 10,
    },
    cardListContainer: {
        gap: 18, 
        alignItems: 'stretch', // Changed to stretch for full width cards
        width: '100%', 
    },

    // --- TITLE STYLES (Updated to new color scheme) ---
    titleContainer: {
        marginBottom: 15,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: CARD_BG, // White text
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 5,
        fontWeight: '500',
        textAlign: 'center'
    },

    // --- CARD STYLES (Updated to modern style) ---
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 18, // Slightly smaller radius
        padding: 20,
        width: '100%', 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Modern shadow
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, 
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        // Accent border on the left only
        borderLeftWidth: 5,
        borderLeftColor: ACCENT_BLUE,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    iconContainer: {
        width: 45, 
        height: 45,
        backgroundColor: `${ACCENT_BLUE}30`, // Use ACCENT_BLUE
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 24,
        color: ACCENT_BLUE, // Use ACCENT_BLUE
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    cardText: {
        fontSize: 18,
        fontWeight: '800', // Increased weight
        color: MODERN_PRIMARY, // Dark text
    },
    cardSubText: {
        fontSize: 16, 
        color: ACCENT_BLUE, // Use ACCENT_BLUE for value
        marginTop: 5,
        fontWeight: '700',
    },
    arrowIcon: {
        fontSize: 24, 
        color: TEXT_GREY, // Grey arrow color
        marginLeft: 10, // Adjusted margin
    },
    
    // --- TAB STYLES (Updated to modern style) ---
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.9)", // Slightly opaque white
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 15,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        padding: 5, // Internal padding for cleaner look
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 12, // Match the card radius
        margin: 2, 
    },
    activeTab: {
        backgroundColor: ACCENT_BLUE, // Use ACCENT_BLUE
        shadowColor: ACCENT_BLUE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
    },
    tabText: {
        fontSize: 16,
        color: MODERN_PRIMARY, // Dark grey for inactive
        fontWeight: "500",
        marginLeft: 5,
    },
    activeTabText: {
        color: CARD_BG, // White text for active
        fontWeight: 'bold',
    },

    // --- NO DATA STYLES (Updated colors) ---
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        padding: 20,
        backgroundColor: CARD_BG,
        borderRadius: 20,
        width: '100%',
    },
    noLeadsText: { 
        fontSize: 18,
        color: MODERN_PRIMARY,
        textAlign: 'center',
        marginTop: 15,
        fontWeight: 'bold',
        lineHeight: 25,
    },
    noImage: {
        width: 250,
        height: 150,
        resizeMode: 'contain',
        marginTop: 20,
    }
});

export default Commissions;