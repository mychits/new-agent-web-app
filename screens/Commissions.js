import React, { useState, useEffect, useCallback, useRef } from "react";
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
    StatusBar,
} from "react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: "#29547e",
    accent: "#f8c009ff",
    bgBlue: "rgb(86, 171, 197)",
    success: "#27AE60",
    cardBg: "rgba(255, 255, 255, 1)",
    white: "#FFFFFF",
    muted: "#8898AA",
    background: "#2c5071",
    GRADIENT: ["#1a62a4", "#122b46"],
    TEXT_MAIN: "#2d5379",
    BG_LIGHT: "#f0f4f8", // Lightened for better contrast with stylized cards
    
    // Stylized Section Colors
    customers: { bg: "#e0f2fe", icon: "#0284c7" },
    groups: { bg: "#fef3c7", icon: "#d97706" },
    business: { bg: "#dcfce7", icon: "#16a34a" },
    estimate: { bg: "#f3e8ff", icon: "#9333ea" },
    commission: { bg: "#ffedd5", icon: "#ea580c" }
};

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CommissionCard = ({ title, icon, value, onPress, showArrow = true, isCurrency = true, colorTheme, IconComponent = MaterialIcons }) => (
    <TouchableOpacity 
        onPress={onPress} 
        style={styles.enhancedCard} 
        activeOpacity={0.8}
        disabled={!onPress}
    >
        <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: colorTheme.bg }]}>
                <IconComponent name={icon} size={24} color={colorTheme.icon} />
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
            <View style={styles.arrowCircle}>
                <Feather name="chevron-right" size={20} color="#cbd5e1" />
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

    const [fromDateObj, setFromDateObj] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [toDateObj, setToDateObj] = useState(new Date());
    const [fromDate, setFromDate] = useState(formatDate(fromDateObj));
    const [toDate, setToDate] = useState(formatDate(toDateObj));

    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

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
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={COLORS.GRADIENT} style={styles.headerHero}>
                <Header />
                <View style={styles.heroTextContent}>
                    <Text style={styles.heroTitle}>Performance</Text>
                    <Text style={styles.heroSubtitle}>Real-time tracking of your earnings</Text>
                </View>

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
            </LinearGradient>

            <View style={styles.contentBody}>
                {(activeTab === "CHIT" || activeTab === "LOAN" || activeTab === "PIGMY") && (
                    <View style={styles.filterSection}>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
                            <Feather name="calendar" size={16} color={COLORS.primary} />
                            <Text style={styles.dateBtnText}>{fromDate}</Text>
                        </TouchableOpacity>
                        <View style={styles.dateSeparator} />
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
                            <Feather name="calendar" size={16} color={COLORS.primary} />
                            <Text style={styles.dateBtnText}>{toDate}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showFromPicker && (
                    <DateTimePicker value={fromDateObj} mode="date" display="default" onChange={(e, d) => onDateChange(e, d, 'from')} />
                )}
                {showToPicker && (
                    <DateTimePicker value={toDateObj} mode="date" display="default" onChange={(e, d) => onDateChange(e, d, 'to')} />
                )}

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInside}>
                    {isLoading ? (
                        <View style={styles.loaderCenter}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
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
                            <MaterialCommunityIcons name="database-off-outline" size={80} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No Data Found</Text>
                            <Text style={styles.emptySub}>We couldn't find any records for {activeTab} in this period.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#1a62a4" },
    headerHero: { paddingHorizontal: 20, paddingBottom: 40, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    heroTextContent: { marginTop: 20, marginBottom: 25 },
    heroTitle: { fontSize: 34, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
    heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '400' },
    
    tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 5 },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    tabItemActive: { backgroundColor: '#FFF', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    tabLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
    tabLabelActive: { color: COLORS.primary },

    contentBody: { flex: 1, backgroundColor: COLORS.BG_LIGHT, marginTop: -25, borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingHorizontal: 20 },
    filterSection: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: COLORS.white, 
        marginTop: 20, 
        padding: 15, 
        borderRadius: 20, 
        elevation: 8, 
        shadowColor: '#2d5379', 
        shadowOpacity: 0.1, 
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    dateBtn: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 10 },
    dateBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_MAIN },
    dateSeparator: { width: 1, height: 25, backgroundColor: '#cbd5e1', marginHorizontal: 5 },

    scrollInside: { paddingTop: 25, paddingBottom: 40 },
    enhancedCard: { 
        backgroundColor: COLORS.cardBg, 
        borderRadius: 24, 
        padding: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 16,
        elevation: 4,
        shadowColor: "#2d5379",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    textContainer: { marginLeft: 18 },
    cardLabel: { fontSize: 13, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    cardValue: { fontSize: 22, fontWeight: '800', color: COLORS.TEXT_MAIN },
    arrowCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },

    loaderCenter: { marginTop: 80, alignItems: 'center' },
    loadingText: { marginTop: 15, color: COLORS.primary, fontWeight: '600', fontSize: 15 },
    emptyState: { marginTop: 80, alignItems: 'center' },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginTop: 20 },
    emptySub: { fontSize: 15, color: COLORS.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 22 }
});

export default Commissions;