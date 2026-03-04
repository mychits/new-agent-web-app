
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Image,
    Animated,
    Dimensions,
    StatusBar,
    Platform,
    SafeAreaView,
} from "react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from "moment"; // Make sure to install moment: npm install moment
import baseUrl from "../constants/baseUrl";

const { width } = Dimensions.get("window");

// COLORS from the Target UI
const COLORS = {
    primary: "#183A5D",
    accent: "#f8c009ff",
    bgBlue: "#1aa2ccff",
    success: "#27AE60",
    cardBg: "rgba(255, 255, 255, 0.98)",
    white: "#FFFFFF",
    muted: "#8898AA",
    background: "#0f2a44",
    // Theme colors for icons
    customers: { bg: "#E3F2FD", icon: "#1aa2ccff" },
    groups: { bg: "#FFF8E1", icon: "#f8c009ff" },
    business: { bg: "#E8F5E9", icon: "#27AE60" },
    estimate: { bg: "#F3E8FF", icon: "#9333EA" },
    commission: { bg: "#FFEBEE", icon: "#D32F2F" }
};

// Placeholder for background image - Ensure you have this asset or remove it
const backgroundImage = require("../assets/hero1.jpg");

// Helper to format date for API (YYYY-MM-DD)
const formatDate = (date) => {
    return moment(date).format("YYYY-MM-DD");
};

// Reusable Card Component styled like Target UI
const CommissionCard = ({ title, icon, value, onPress, showArrow = true, isCurrency = true, colorTheme, IconComponent = MaterialIcons }) => (
    <TouchableOpacity 
        onPress={onPress} 
        style={styles.targetCard} 
        activeOpacity={0.9}
        disabled={!onPress}
    >
        <View style={styles.cardContentRow}>
            <View style={[styles.iconBox, { backgroundColor: colorTheme.bg }]}>
                <IconComponent name={icon} size={22} color={colorTheme.icon} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.cardLabel}>{title}</Text>
                <Text style={styles.cardValue}>
                    {typeof value === 'number' 
                        ? isCurrency 
                            ? `₹${value.toLocaleString('en-IN')}` 
                            : value.toLocaleString('en-IN') 
                        : value}
                </Text>
            </View>
        </View>
        {showArrow && (
            <View style={styles.arrowIconBg}>
                <Feather name="chevron-right" size={20} color={COLORS.muted} />
            </View>
        )}
    </TouchableOpacity>
);

const Commissions = ({ route, navigation }) => {
    const { user } = route.params || {};
    const currentUser = user || {};

    const [isLoading, setIsLoading] = useState(false);
    const [commissions, setCommissions] = useState({});
    const [activeTab, setActiveTab] = useState("CHIT");

    // Date State
    const [fromDateObj, setFromDateObj] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [toDateObj, setToDateObj] = useState(new Date());
    const [fromDate, setFromDate] = useState(formatDate(fromDateObj));
    const [toDate, setToDate] = useState(formatDate(toDateObj));

    // Picker State
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        fetchCommissions();
    }, [fromDate, toDate, activeTab]);

    const fetchCommissions = async () => {
        if (!currentUser.userId) return;
        
        setIsLoading(true);
        fadeAnim.setValue(0);
        slideAnim.setValue(30);

        let pathSegment = "";
        const userId = currentUser.userId;

        switch (activeTab) {
            case "CHIT": 
                pathSegment = `/enroll/get-detailed-commission/${userId}?from_date=${fromDate}&to_date=${toDate}`; 
                break;
            case "GOLD": 
                pathSegment = `/enroll/get-detailed-commission/${userId}`; 
                break;
            case "LOAN": 
                pathSegment = `/payment/agent/${userId}/app-loan-overview?from_date=${fromDate}&to_date=${toDate}`; 
                break;
            case "PIGMY": 
                pathSegment = `/payment/agent/${userId}/pigme-overview?from_date=${fromDate}&to_date=${toDate}`; 
                break;
        }

        try {
            const fullUrl = `${baseUrl}${pathSegment}`;
            const response = await axios.get(fullUrl);

            if (response.data?.success && response.data?.summary) {
                setCommissions(response.data);
                Animated.parallel([
                    Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
                    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 7 })
                ]).start();
            } else {
                setCommissions({});
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setCommissions({});
        } finally {
            setIsLoading(false);
        }
    };

    const onDateChange = (event, selectedDate, type) => {
        if (Platform.OS === 'android') {
            setShowFromPicker(false);
            setShowToPicker(false);
        }
        
        if (selectedDate) {
            if (type === 'from') {
                setFromDateObj(selectedDate);
                setFromDate(formatDate(selectedDate));
            } else {
                setToDateObj(selectedDate);
                setToDate(formatDate(selectedDate));
            }
        }
    };

    const getSummaryValue = (key) => {
        const summary = commissions?.summary;
        if (!summary) return 0;
        
        if (activeTab === "LOAN" || activeTab === "PIGMY") {
            if (key === "total_customers") return summary["number_of_customers"] || 0;
            if (key === "actual_business") return summary["total_paid_collection"] || 0;
            return 0;
        }
        return summary[key] || 0;
    };

    const schemeData = [
        { 
            title: "My Customers", 
            icon: "users", 
            IconComponent: FontAwesome5,
            value: "total_customers", 
            tabs: ["CHIT", "GOLD", "LOAN", "PIGMY"], 
            isCurrency: false,
            colorTheme: COLORS.customers,
            press: () => activeTab === "PIGMY" ? navigation.navigate("RouteCustomerPigme", { user }) : activeTab === "LOAN" ? navigation.navigate("RouteCustomerLoan", { user }) : navigation.navigate("ViewEnrollments", { user }) 
        },
        { 
            title: "Assigned Groups", 
            icon: "grid", 
            IconComponent: Feather,
            value: "total_groups", 
            tabs: ["CHIT", "GOLD"], 
            isCurrency: false,
            colorTheme: COLORS.groups,
            press: () => navigation.navigate("EnrolledGroups", { user }) 
        },
        { 
            title: (activeTab === "CHIT" || activeTab === "GOLD") ? "My Business" : "Total Collection", 
            icon: "account-balance-wallet", 
            IconComponent: MaterialIcons,
            value: "actual_business", 
            tabs: ["CHIT", "GOLD", "LOAN", "PIGMY"], 
            isCurrency: true,
            colorTheme: COLORS.business,
            press: (activeTab === "CHIT" || activeTab === "GOLD") ? () => navigation.navigate("MyCommission", { commissions }) : null 
        },
        { 
            title: "Estimated Business", 
            icon: "trending-up", 
            IconComponent: Feather,
            value: "expected_business", 
            tabs: ["CHIT", "GOLD"], 
            isCurrency: true,
            colorTheme: COLORS.estimate,
            press: () => navigation.navigate("ExpectedCommissions", { user }) 
        },
        { 
            title: "Current Commission", 
            icon: "hand-holding-usd", 
            IconComponent: FontAwesome5,
            value: "total_actual", 
            tabs: ["CHIT", "GOLD"], 
            isCurrency: true,
            colorTheme: COLORS.commission,
            press: () => navigation.navigate("MyCommission", { commissions }) 
        },
    ];

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            
            {/* Target Style Background */}
            <Image source={backgroundImage} style={styles.bgOverlay} blurRadius={12} />
            <LinearGradient colors={["rgba(26, 162, 204, 0.9)", COLORS.primary]} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Target Style Header */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle} activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={fetchCommissions} style={styles.refreshBtn} activeOpacity={0.7}>
                            <Feather name="refresh-cw" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerTitle}>Performance</Text>
                    <Text style={styles.headerSubTitle}>Real-time tracking of your earnings</Text>

                    {/* Tabs styled to fit the Dark Header */}
                    <View style={styles.tabBar}>
                        {["CHIT", "GOLD", "LOAN", "PIGMY"].map((tab) => (
                            <TouchableOpacity 
                                key={tab} 
                                onPress={() => setActiveTab(tab)}
                                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                            >
                                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    {/* Date Filter Section - FIXED: Includes YYYY and adjusted font size */}
                    <View style={styles.dateRow}>
                        <TouchableOpacity style={styles.dateCard} onPress={() => setShowFromPicker(true)} activeOpacity={0.9}>
                            <View style={styles.dateInfo}>
                                <View style={styles.calendarIconBg}>
                                    <Ionicons name="calendar" size={16} color={COLORS.white} />
                                </View>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.dateLabel}>FROM DATE</Text>
                                    {/* FIX: Format includes YYYY now */}
                                    <Text style={styles.dateText}>{moment(fromDate).format("DD MMM YYYY")}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dateCard} onPress={() => setShowToPicker(true)} activeOpacity={0.9}>
                            <View style={styles.dateInfo}>
                                <View style={[styles.calendarIconBg, { backgroundColor: COLORS.success }]}>
                                    <Ionicons name="calendar" size={16} color={COLORS.white} />
                                </View>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.dateLabel}>TO DATE</Text>
                                    {/* FIX: Format includes YYYY now */}
                                    <Text style={styles.dateText}>{moment(toDate).format("DD MMM YYYY")}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {showFromPicker && (
                        <DateTimePicker 
                            value={fromDateObj} 
                            mode="date" 
                            display="default" 
                            onChange={(e, d) => onDateChange(e, d, 'from')} 
                        />
                    )}
                    {showToPicker && (
                        <DateTimePicker 
                            value={toDateObj} 
                            mode="date" 
                            display="default" 
                            onChange={(e, d) => onDateChange(e, d, 'to')} 
                        />
                    )}

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {isLoading ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color={COLORS.accent} />
                                <Text style={styles.loadingText}>Updating insights...</Text>
                            </View>
                        ) : (commissions?.summary) ? (
                            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                                {schemeData
                                    .filter(item => item.tabs.includes(activeTab))
                                    .map((item, idx) => (
                                        <CommissionCard 
                                            key={idx}
                                            title={item.title}
                                            icon={item.icon}
                                            IconComponent={item.IconComponent}
                                            value={getSummaryValue(item.value)}
                                            onPress={item.press}
                                            showArrow={!!item.press}
                                            isCurrency={item.isCurrency}
                                            colorTheme={item.colorTheme}
                                        />
                                    ))
                                }
                            </Animated.View>
                        ) : (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="database-off-outline" size={60} color="rgba(255,255,255,0.3)" />
                                <Text style={styles.emptyTitle}>No Data Found</Text>
                                <Text style={styles.emptySub}>We couldn't find any records for {activeTab} in this period.</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: COLORS.primary },
    bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
    
    // Header Styles - Merged from Target
    header: { 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === "android" ? 50 : 10,
        paddingBottom: 20,
    },
    headerTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 15
    },
    headerTitle: { fontSize: 26, fontWeight: "900", color: "#fff", textAlign: 'center', marginTop: 5 },
    headerSubTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2, marginBottom: 20 },
    iconCircle: { backgroundColor: "#fff", padding: 8, borderRadius: 12, elevation: 4 },
    refreshBtn: { backgroundColor: COLORS.accent, padding: 10, borderRadius: 12, elevation: 4 },

    // Tab Bar - Adapted for Dark Background
    tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 4 },
    tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    tabItemActive: { backgroundColor: '#FFF', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    tabLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
    tabLabelActive: { color: COLORS.primary },

    // Content Body
    contentContainer: { flex: 1, backgroundColor: COLORS.background, marginTop: -25, borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingHorizontal: 20, paddingTop: 25 },

    // Date Row - Target Style
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    dateCard: { 
        backgroundColor: COLORS.white, 
        borderRadius: 16, 
        padding: 12, 
        width: '48%', 
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    dateInfo: { flexDirection: 'row', alignItems: 'center' },
    calendarIconBg: { backgroundColor: COLORS.bgBlue, padding: 8, borderRadius: 10 },
    dateLabel: { fontSize: 9, color: COLORS.muted, fontWeight: "800", letterSpacing: 1 },
    // FIX: Reduced font size to 13 to accommodate the Year (YYYY)
    dateText: { 
        fontSize: 13, 
        fontWeight: "900", 
        color: COLORS.primary, 
        marginTop: 2 
    },

    // Scroll Content
    scrollContent: { paddingBottom: 40 },

    // Target Style Card
    targetCard: { 
        backgroundColor: COLORS.cardBg, 
        borderRadius: 20, 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 14,
        elevation: 6,
        shadowColor: "#183A5D",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
    },
    cardContentRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { padding: 10, borderRadius: 14, marginRight: 14 },
    textContainer: { justifyContent: 'center' },
    cardLabel: { fontSize: 11, color: COLORS.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
    cardValue: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
    arrowIconBg: { padding: 8, borderRadius: 10, backgroundColor: '#F5F7FA' },

    // Loader & Empty State
    loaderContainer: { marginTop: 80, alignItems: 'center' },
    loadingText: { color: COLORS.white, marginTop: 15, fontWeight: '600', opacity: 0.8 },
    
    emptyState: { marginTop: 80, alignItems: 'center', marginBottom: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginTop: 20 },
    emptySub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 22 }
});

export default Commissions;
