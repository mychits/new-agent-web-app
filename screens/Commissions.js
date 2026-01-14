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
} from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get('window');

// Assuming this path is correct
const noImage = require('../assets/no.png'); 

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D'];
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = CARD_BG; 
// ------------------------

import Header from "../components/Header";
import baseUrl from "../constants/baseUrl"; 
const CustomCommissionCard = ({ title, icon, value, onPress, showArrow = true }) => (
    <TouchableOpacity onPress={onPress} style={styles.card} disabled={!showArrow}>
        <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={24} style={styles.cardIcon} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.cardText}>{title}</Text>
                <Text style={styles.cardSubText}>{value}</Text>
            </View>
        </View>
        {showArrow && <MaterialIcons name="keyboard-arrow-right" style={styles.arrowIcon} />}
    </TouchableOpacity>
);


const Commissions = ({ route, navigation }) => {
    const { user } = route.params || {};
    const currentUser = user || {};

    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [isLoanLoading, setIsLoanLoading] = useState(false);
    const [isPigmyLoading, setIsPigmyLoading] = useState(false);

    const [commissions, setCommissions] = useState({});
    const [activeTab, setActiveTab] = useState("CHIT");

    // Animation values for card list slide-in
    const cardListOpacity = React.useRef(new Animated.Value(0)).current;
    const dataContainerTranslateY = React.useRef(new Animated.Value(-height * 0.1)).current;

    const handleEstimatedCommission = () => {
        navigation.navigate("ExpectedCommissions", { user: currentUser });
    };

    const handleMyCommission = () => {
        navigation.navigate("MyCommission", { commissions: commissions });
    };

    /**
     * Navigates to a different customer screen based on the currently active tab.
     */
    const handleMyCustomers = (tab) => {
        if (tab === "PIGMY") {
            navigation.navigate("RouteCustomerPigme", { user: currentUser });
        } else if (tab === "LOAN") {
            navigation.navigate("RouteCustomerLoan", { user: currentUser });
        } else {
            // Default navigation for CHIT/GOLD
            navigation.navigate("ViewEnrollments", { user: currentUser });
        }
    };

    const handleGroups = () => {
        navigation.navigate("EnrolledGroups", { user: currentUser });
    };

    // Card data now includes a 'schemeType' array for filtering
    const scrollData = [
        { title: "Customers", icon: "person", value: "total_customers", key: "#1", handlePress: null, schemeType: ["CHIT", "GOLD", "LOAN", "PIGMY"] },
        { title: "Groups", icon: "group", value: "total_groups", key: "#2", handlePress: handleGroups, schemeType: ["CHIT", "GOLD"] }, 
        { title: "My Business", icon: "query-stats", value: "actual_business", key: "#6", handlePress: handleMyCommission, schemeType: ["CHIT", "GOLD", "LOAN", "PIGMY"] },
        { title: "Estimated Business", icon: "trending-up", value: "expected_business", key: "#5", handlePress: handleEstimatedCommission, schemeType: ["CHIT", "GOLD"] },
        { title: "My Commission", icon: "payments", value: "total_actual", key: "#4", handlePress: handleMyCommission, schemeType: ["CHIT", "GOLD"] },
        { title: "Estimated Commission", icon: "currency-rupee", value: "total_estimated", key: "#3", handlePress: handleEstimatedCommission, schemeType: ["CHIT", "GOLD"] },
    ];

    const hasData = commissions?.summary && Object.keys(commissions.summary).length > 0;

    // Helper function to map data fields based on the active tab 
    const getCommissionValue = (key) => {
        const summary = commissions?.summary;
        if (!summary) return 0;

        // Custom mapping for LOAN and PIGMY data fields
        if (activeTab === "LOAN" || activeTab === "PIGMY") {
            switch (key) {
                case "total_customers":
                    return summary["number_of_customers"] || 0;
                case "actual_business":
                    return summary["total_paid_collection"] || 0;
                default:
                    return 0; 
            }
        }
        // Use the original key for CHIT and GOLD
        return summary[key] || 0;
    };

    // Helper to get current loading state
    const getCurrentLoadingState = () => {
        switch (activeTab) {
            case "CHIT":
                return isChitLoading;
            case "GOLD":
                return isGoldLoading;
            case "LOAN":
                return isLoanLoading;
            case "PIGMY":
                return isPigmyLoading;
            default:
                return false;
        }
    };

    // Helper to set current loading state
    const setCurrentLoadingState = (isLoading) => {
        switch (activeTab) {
            case "CHIT":
                setIsChitLoading(isLoading);
                break;
            case "GOLD":
                setIsGoldLoading(isLoading);
                break;
            case "LOAN":
                setIsLoanLoading(isLoading);
                break;
            case "PIGMY":
                setIsPigmyLoading(isLoading);
                break;
            default:
                break;
        }
    };

    /**
     * MODIFIED useEffect: Fetches commissions with ALL console logging removed from try/catch.
     */
    useEffect(() => {
        const fetchCommissions = async () => {
            // Reset animations and clear old data before fetching
            cardListOpacity.setValue(0);
            dataContainerTranslateY.setValue(-height * 0.1);
            setCommissions({});

            setCurrentLoadingState(true);

            if (!currentUser.userId) {
                // Keep this warning as it indicates a user data issue, not a network error
                console.warn("User ID is not available for fetching commissions.");
                setCurrentLoadingState(false);
                return;
            }

            let currentUrl = `${baseUrl}`;
            let pathSegment = ""; 
            const userId = currentUser.userId;

            switch (activeTab) {
                case "CHIT":
                    pathSegment = `/enroll/get-detailed-commission/${userId}`;
                    break;
                case "GOLD":
                    pathSegment = `/enroll/get-detailed-commission/${userId}`;
                    break;
                case "LOAN":
                    pathSegment = `/payment/agent/${userId}/loan-overview`;
                    break;
                case "PIGMY":
                    pathSegment = `/payment/agent/${userId}/pigme-overview`;
                    break;
                default:
                    break;
            }
            
            const apiPath = `${currentUrl}${pathSegment}`; 
            
            try {
                // console.log(`--- Fetching ${activeTab} Commissions ---`); <--- REMOVED LOG
                const response = await axios.get(apiPath);
                
                if (response.data?.success === true && response.data?.summary) {
                    setCommissions(response.data);

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
                } else {
                     setCommissions({});
                }

            } catch (err) {
                // CATCH BLOCK IS NOW EMPTY - NO LOGGING FOR ERRORS
                setCommissions({}); // Ensure UI displays 'No Data Found' on any error
            } finally {
                setCurrentLoadingState(false);
            }
        };
        fetchCommissions();
    }, [activeTab, currentUser]);

    // MODIFIED renderCardList function (for custom No Data messages)
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

            const filteredData = scrollData.filter(card => 
                card.schemeType.includes(activeTab)
            );

            return (
                <Animated.View style={[{ gap: 20, width: '100%' }, animatedStyle]}>
                    {filteredData.map(({ title, icon, value, key, handlePress }) => {
                        
                        let finalHandler = handlePress;
                        let showArrow = true;
                        let finalTitle = title;

                        if (title === "Customers") {
                            finalHandler = () => handleMyCustomers(activeTab);
                            
                        } else if (title === "My Business" && (activeTab === "LOAN" || activeTab === "PIGMY")) {
                            finalTitle = "Total Collection"; 
                            showArrow = false;
                            finalHandler = null; 
                        }

                        return (
                            <CustomCommissionCard
                                key={key}
                                title={finalTitle} 
                                icon={icon}
                                value={getCommissionValue(value)} 
                                onPress={finalHandler} 
                                showArrow={showArrow} 
                            />
                        );
                    })}
                </Animated.View>
            );
        }

        // --- NO DATA FALLBACK ---
        
        let customNoDataMessage;
        
        // Customize the message for LOAN and PIGMY as requested
        if (activeTab === "LOAN") {
            customNoDataMessage = "No Loan Data Found";
        } else if (activeTab === "PIGMY") {
            customNoDataMessage = "No Pigmy Data Found";
        } else {
            // Default message for CHIT/GOLD (using the passed activeTabName)
            customNoDataMessage = `No ${activeTabName} Commission Data Found`;
        }

        return (
            <View style={styles.noDataContainer}>
                <Ionicons name="alert-circle-outline" size={50} color={ACCENT_BLUE} />
                <Text style={styles.noLeadsText}>
                    {customNoDataMessage} {/* Use the new custom message */}
                </Text>
                <Image source={noImage} style={styles.noImage} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
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

                    {/* Tab Container for 4 Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                            onPress={() => setActiveTab("CHIT")}
                        >
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
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "GOLD" && styles.activeTabText,
                                ]}
                            >
                                Gold
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === "LOAN" && styles.activeTab]}
                            onPress={() => setActiveTab("LOAN")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "LOAN" && styles.activeTabText,
                                ]}
                            >
                                Loan
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === "PIGMY" && styles.activeTab]}
                            onPress={() => setActiveTab("PIGMY")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "PIGMY" && styles.activeTabText,
                                ]}
                            >
                                Pigmy
                            </Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
                <View style={styles.mainContentArea}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >
                        <View style={styles.cardListContainer}>
                            {activeTab === "CHIT" && renderCardList(isChitLoading, hasData, "Chit")}
                            {activeTab === "GOLD" && renderCardList(isGoldLoading, hasData, "Gold ")}
                            {activeTab === "LOAN" && renderCardList(isLoanLoading, hasData, "Loan")}
                            {activeTab === "PIGMY" && renderCardList(isPigmyLoading, hasData, "Pigmy")}
                        </View>
                    </ScrollView>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ------------------------------------------------------------------
// --- STYLESHEET ---
// ------------------------------------------------------------------

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: TOP_GRADIENT[0]
    },
    topContainer: {
        paddingHorizontal: 16,
        paddingBottom: 25,
        zIndex: 1,
    },
    headerSpacer: {
        paddingTop: 20,
        paddingBottom: 5
    },
    mainContentArea: {
        flex: 1,
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
        alignItems: 'stretch', 
        width: '100%',
    },

    // --- TITLE STYLES ---
    titleContainer: {
        marginBottom: 15,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: CARD_BG, 
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 5,
        fontWeight: '500',
        textAlign: 'center'
    },

    // --- CARD STYLES ---
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 18, 
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
        backgroundColor: `${ACCENT_BLUE}30`, 
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 24,
        color: ACCENT_BLUE, 
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    cardText: {
        fontSize: 18,
        fontWeight: '800', 
        color: MODERN_PRIMARY, 
    },
    cardSubText: {
        fontSize: 16,
        color: ACCENT_BLUE, 
        marginTop: 5,
        fontWeight: '700',
    },
    arrowIcon: {
        fontSize: 24,
        color: TEXT_GREY, 
        marginLeft: 10, 
    },

    // --- TAB STYLES ---
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.9)", 
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 15,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        padding: 5, 
    },
    tab: {
        flex: 1, 
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 12, 
        margin: 2,
    },
    activeTab: {
        backgroundColor: ACCENT_BLUE, 
        shadowColor: ACCENT_BLUE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
    },
    tabText: {
        fontSize: 14, 
        color: MODERN_PRIMARY, 
        fontWeight: "500",
        marginLeft: 5,
    },
    activeTabText: {
        color: CARD_BG, 
        fontWeight: 'bold',
    },

    // --- NO DATA STYLES ---
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