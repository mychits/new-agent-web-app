import {
    View,
    Text,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    TextInput,
    SafeAreaView,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
// Assuming COLORS is defined in a constants file
import COLORS from "../constants/color"; 
import Header from "../components/Header";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Feather } from "@expo/vector-icons";

// --- DESIGN CONSTANTS COPIED from EnrollCustomer.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area

// --- DISTINCT VALUE COLORS ---
const VALUE_COLOR_GREEN = '#3ed160ff';
const VALUE_COLOR_ORANGE = '#f1960cff';
const VALUE_COLOR_MAGENTA = '#f70cb4ff';
// ---------------------------------------------


const MyCommission = ({ route, navigation }) => {
    // Safely destructure commissions or use an empty object fallback
    const { commissions = {} } = route.params || {};
    
    const [goldLeads, setGoldLeads] = useState([]);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [searchQuery, setSearchQuery] = useState("");

    const leftAnim = useRef(new Animated.Value(-200)).current;
    const rightAnim = useRef(new Animated.Value(200)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Run animations when component mounts or tab changes
        if (commissions.commission_data && activeTab === "CHIT") {
            setIsChitLoading(false);

            // Reset animation values before starting
            leftAnim.setValue(-200);
            rightAnim.setValue(200);
            opacityAnim.setValue(0);
            
            Animated.parallel([
                Animated.timing(leftAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(rightAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [activeTab, commissions.commission_data]);

    const filteredCommissions = commissions?.commission_data?.filter(commission => {
        const userName = commission?.user_name || "";
        const groupName = commission?.group_name || "";
        const query = searchQuery.toLowerCase();
        return userName.toLowerCase().includes(query) || groupName.toLowerCase().includes(query);
    }) || [];

    const renderCommissionCard = ({ item }) => {
        // Only render if commission_released is true
        if(item.commission_released === false) return null;

        return (
            <TouchableOpacity style={styles.card}>
                <View style={styles.leftSection}>
                    {/* User Name as Main Title */}
                    <Text style={styles.name}>
                        {item?.user_name || "N/A"}
                    </Text> 
                    {/* Group Name as Subtitle */}
                    <Text style={styles.groupName}>
                        {item?.group_name ? item.group_name: "No Group Name"}
                    </Text>
                </View>
                <View style={styles.rightSection}>
                    <View style={styles.commissionContainer}>
                        {/* Display commission value with currency symbol */}
                        <Text style={styles.commissionText}>{item?.actual_commission || '0'}</Text>
                    </View>
                    
                </View>
            </TouchableOpacity>
        );
    }
    
    const ListHeader = () => {
        // Use a safe default object for summary
        const summary = commissions?.summary || {};

        return (
            <View style={styles.summaryBoxesContainer}>
                
                {/* Box 1: Total Customers */}
                <Animated.View style={[styles.summaryBox, { 
                    transform: [{ translateX: leftAnim }], 
                    opacity: opacityAnim, 
                    // Uniform Border Color: ACCENT_BLUE
                    borderColor: ACCENT_BLUE 
                }]}>
                    {/* Uniform Label Color: MODERN_PRIMARY (via styles.summaryText) */}
                    <Text style={styles.summaryText}>Total Customers</Text>
                    {/* Distinct Value Color: ACCENT_BLUE */}
                    <Text style={[styles.summaryValue, { color: ACCENT_BLUE }]}>
                        {summary.total_customers || '0'}
                    </Text>
                </Animated.View>
                
                {/* Box 2: Total Groups */}
                <Animated.View style={[styles.summaryBox, { 
                    transform: [{ translateX: leftAnim }], 
                    opacity: opacityAnim, 
                    // Uniform Border Color: ACCENT_BLUE
                    borderColor: ACCENT_BLUE 
                }]}>
                    {/* Uniform Label Color: MODERN_PRIMARY (via styles.summaryText) */}
                    <Text style={styles.summaryText}>Total Groups</Text>
                    {/* Distinct Value Color: Green */}
                    <Text style={[styles.summaryValue, { color: VALUE_COLOR_GREEN }]}>
                        {summary.total_groups || '0'}
                    </Text>
                </Animated.View>
                
                {/* Box 3: My Business */}
                <Animated.View style={[styles.summaryBox, { 
                    transform: [{ translateX: rightAnim }], 
                    opacity: opacityAnim, 
                    // Uniform Border Color: ACCENT_BLUE
                    borderColor: ACCENT_BLUE 
                }]}>
                    {/* Uniform Label Color: MODERN_PRIMARY (via styles.summaryText) */}
                    <Text style={styles.summaryText}>My Business</Text>
                    {/* Distinct Value Color: Orange */}
                    <Text style={[styles.summaryValue, { color: VALUE_COLOR_ORANGE }]}>
                        {summary.actual_business || '0'}
                    </Text>
                </Animated.View>
                
                {/* Box 4: My Commission */}
                <Animated.View style={[styles.summaryBox, { 
                    transform: [{ translateX: rightAnim }], 
                    opacity: opacityAnim, 
                    // Uniform Border Color: ACCENT_BLUE
                    borderColor: ACCENT_BLUE 
                }]}>
                    {/* Uniform Label Color: MODERN_PRIMARY (via styles.summaryText) */}
                    <Text style={styles.summaryText}>My Commission</Text>
                    {/* Distinct Value Color: Magenta */}
                    <Text style={[styles.summaryValue, { color: VALUE_COLOR_MAGENTA }]}>
                        {summary.total_actual || '0'}
                    </Text>
                </Animated.View>
            </View>
        );
    };

    const renderContent = () => {
        const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;
        const dataAvailable = activeTab === "CHIT" ? commissions?.success : goldLeads.length > 0; 
        
        if (isLoading) {
            return (
                <ActivityIndicator
                    size="large"
                    color={ACCENT_BLUE}
                    style={styles.loadingIndicator}
                />
            );
        }

        if (!dataAvailable || (activeTab === "CHIT" && filteredCommissions.length === 0 && searchQuery.length === 0)) {
             return (
                 <Text style={styles.noLeadsText}>
                     No commission data found.
                 </Text>
             );
        }
        
        if(searchQuery.length > 0 && filteredCommissions.length === 0) {
            return (
                <Text style={styles.noLeadsText}>
                    No matching commissions found.
                </Text>
            );
        }

        return (
            <FlatList
                data={filteredCommissions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderCommissionCard}
                ListHeaderComponent={activeTab === "CHIT" ? ListHeader : null}
                contentContainerStyle={styles.listContent}
            />
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            >
                {/* Top Header Section with Gradient (Blue) */}
                <LinearGradient
                    colors={TOP_GRADIENT}
                    style={styles.topContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerSpacer}>
                        <Header />
                    </View>
                    {/* Title and Subtitle Centered and Up */}
                    <View style={styles.titleContainer}>
                        <View>
                            <Text style={styles.title}>My Commission</Text>
                            <Text style={styles.subtitle}>My business performance</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Main Content Area (White Background, Overlapping Header) */}
                <View style={styles.mainContentArea}>
                    
                    {/* Search Input and Icon */}
                    <View style={styles.searchContainer}>
                        <Feather name="search" size={20} color={TEXT_GREY} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or group"
                            placeholderTextColor={TEXT_GREY}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    
                    {/* Tab Container */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                            onPress={() => setActiveTab("CHIT")}
                        >
                            <MaterialIcons
                                name="groups"
                                size={20}
                                color={activeTab === "CHIT" ? CARD_BG : TEXT_GREY}
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
                            <MaterialIcons
                                name="diamond"
                                size={20}
                                color={activeTab === "GOLD" ? CARD_BG : TEXT_GREY}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "GOLD" && styles.activeTabText,
                                ]}
                            >
                                Gold Chits
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Commission List Content */}
                    <View style={{ flex: 1 }}>
                        {renderContent()}
                    </View>

                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // --- LAYOUT STYLES (Adjusted to push content lower) ---
    safeArea: { 
        flex: 1, 
        backgroundColor: TOP_GRADIENT[0] 
    },
    topContainer: {
        paddingHorizontal: 16,
        paddingBottom: 50, // ADJUSTED: Increased significantly to push white area down
        zIndex: 1,
    },
    headerSpacer: { 
        paddingTop: 37, // Maintained
        paddingBottom: 5 // Maintained
    }, 
    mainContentArea: {
        flex: 1,
        backgroundColor: CARD_BG, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        marginTop: -50, // ADJUSTED: Increased from -20 to -50 (more negative overlap) to counteract the larger padding
        zIndex: 2, 
        paddingHorizontal: 22, 
        paddingTop: 30, 
    },
    listContent: {
        paddingBottom: 50,
        gap: 10,
    },

    // --- TITLE STYLES (From EnrolledGroups.js) ---
    titleContainer: {
        marginTop: 15, 
        marginBottom: 5, 
        paddingHorizontal: 6,
        alignItems: 'center', 
    },
    title: {
        fontSize: 28, 
        fontWeight: "900",
        color: CARD_BG, 
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        textAlign: 'center', 
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)', 
        fontWeight: '500',
        marginTop: 4,
        textAlign: 'center', 
    },
    
    // --- SEARCH STYLES (Modernized) ---
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: MODERN_PRIMARY,
    },

    // --- TAB STYLES (Modernized) ---
    tabContainer: {
        flexDirection: "row",
        backgroundColor: SUBTLE_BG_GREY, 
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: ACCENT_BLUE, 
    },
    tabText: {
        fontSize: 15,
        color: TEXT_GREY,
        fontWeight: "600",
        marginLeft: 5,
    },
    activeTabText: {
        color: CARD_BG, 
        fontWeight: 'bold',
    },

    // --- SUMMARY BOX STYLES (Modernized) ---
    summaryBoxesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 5, 
        marginBottom: 20, 
    },
    summaryBox: {
        backgroundColor: CARD_BG,
        padding: 15,
        borderRadius: 12,
        borderWidth: 2,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        width: '48%',
        marginBottom: 15,
        alignItems: 'center',
    },
    summaryText: {
        fontWeight: '600',
        fontSize: 12,
        color: MODERN_PRIMARY,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: 'bold',
        marginTop: 5,
    },

    // --- CARD STYLES (Modernized) ---
    card: {
        backgroundColor: CARD_BG,
        flexDirection: "row",
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 12,
        borderLeftWidth: 4, 
        borderColor: ACCENT_BLUE, 
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
        borderWidth: 1, 
        borderColor: BORDER_COLOR,
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        alignItems: "flex-end",
        flexDirection: 'row',
        gap: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        color: MODERN_PRIMARY, 
        marginBottom: 3,
    },
    groupName: {
        fontSize: 14,
        color: TEXT_GREY, 
    },
    commissionContainer: {
        backgroundColor: ACCENT_BLUE + '10', 
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    commissionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: VALUE_COLOR_MAGENTA, 
    },
    arrowIcon: {
        fontSize: 24,
        color: TEXT_GREY, 
    },

    // --- MISC STYLES ---
    loadingIndicator: { 
        marginTop: 20 
    },
    noLeadsText: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
        color: TEXT_GREY,
        paddingHorizontal: 20,
    },
});

export default MyCommission;