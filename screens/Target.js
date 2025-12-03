import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    Animated,
    Image,
    TouchableOpacity
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import baseUrl from "../constants/baseUrl"; // Assuming this is defined
import axios from "axios";
import COLORS from "../constants/color"; // Assuming this is defined
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Adjusted Color Palette for High Impact
const COLOR_PALETTE = {
    primary: '#183A5D', // Dark Blue/Indigo for main text
    secondary: '#7B8D9E', // Muted Grey for labels
    lightText: '#FFFFFF', // White
    cardBackground: '#FFFFFF', // Pure White for cards
    errorRed: '#E74C3C', // Red
    greyText: '#4C4C4C', // Dark Grey
    accentGreen: '#27AE60', // Vibrant Green for Success
    accentOrange: '#f8c009ff', // Vibrant Gold/Orange for Progress/Attention
    backgroundLight: '#DFF6FC',
    backgroundDark: '#BDE0F3',
    softBorder: '#c2b9f3ff', 
    shadowDark: 'rgba(0, 0, 0, 0.2)', // Darker shadow for elevation
    shadowLight: 'rgba(0, 0, 0, 0.05)', // Lighter shadow for progress bar
};

// Placeholder images - ensure these paths are correct in your project
const backgroundImage = require('../assets/hero1.jpg'); 

// *** NEW API ROUTE CONSTANT ***
const NEW_TARGET_API_BASE_URL = "https://mychits.online/api/target/employee/current";

// Helper function to clean and convert currency string to number
const cleanCurrencyToNumber = (currencyString) => {
    if (typeof currencyString === 'string') {
        return Number(currencyString.replace(/,/g, ''));
    }
    return Number(currencyString) || 0;
};


const Target = ({ route, navigation }) => {
    const [targetData, setTargetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Animation values
    const refreshScale = useRef(new Animated.Value(1)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current; 
    const achievedProgress = useRef(new Animated.Value(0)).current; 
    const bannerScale = useRef(new Animated.Value(0)).current; 

    useEffect(() => {
        fetchTargetDetails();
    }, []);

    useEffect(() => {
        if (targetData) {
            // Animate cards into view after data loads
            Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 500,
                delay: 100,
                useNativeDriver: true,
            }).start();

            // Animate progress bar
            const progress = targetData.achievement_percent || (targetData.total > 0 ? (targetData.achieved / targetData.total) * 100 : 0);
            Animated.timing(achievedProgress, {
                toValue: progress,
                duration: 800,
                delay: 200,
                useNativeDriver: false, 
            }).start();

            // Animate achievement banner if target is achieved
            if (targetData.achieved >= targetData.total && targetData.total > 0) {
                Animated.spring(bannerScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 80,
                    useNativeDriver: true,
                }).start();
            }
        }
    }, [targetData]); 

    const handleRefreshPress = () => {
        Animated.sequence([
            Animated.timing(refreshScale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
            Animated.timing(refreshScale, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            cardOpacity.setValue(0);
            achievedProgress.setValue(0);
            bannerScale.setValue(0); 
            fetchTargetDetails();
        });
    };

    const fetchTargetDataFromNewRoute = async (agentId) => {
        const url = `${NEW_TARGET_API_BASE_URL}/${agentId}`;
        const res = await axios.get(url);

        if (!res.data.success) {
            throw new Error(res.data.message || "Failed to fetch target data.");
        }

        const data = res.data;

        const totalTarget = cleanCurrencyToNumber(data.target.target_value);
        const achievedAmount = cleanCurrencyToNumber(data.target.achieved);
        const achievementPercent = parseFloat(data.target.achievement_percent);

        const remainingAmount = totalTarget > achievedAmount ? totalTarget - achievedAmount : 0;

        return {
            total: totalTarget,
            achieved: achievedAmount,
            remaining: remainingAmount,
            startDate: data.period.from,
            endDate: data.period.to,
            achievement_percent: achievementPercent, 
        };
    };
    
    const fetchTargetDetails = async () => {
        setLoading(true);
        setError("");

        try {
            const agentInfoJson = await AsyncStorage.getItem("agentInfo");
            const agentInfo = agentInfoJson ? JSON.parse(agentInfoJson) : null;

            const agentId = agentInfo?._id; 

            if (!agentId) {
                setError("User ID not found in stored information. Please log in again.");
                setLoading(false);
                return;
            }

            const targetDetails = await fetchTargetDataFromNewRoute(agentId);

            if (!targetDetails || targetDetails.total === undefined || targetDetails.total === 0) {
                setError("No target set for this user for the current period.");
                setTargetData(null);
                setLoading(false);
                return;
            }

            setTargetData(targetDetails);

        } catch (err) {
            console.error("Error fetching target or commission:", err.response?.data || err.message);
            const apiMessage = err.response?.data?.message;
            const fallbackMessage = "Failed to load data. Please check network or try again.";
            
            setError(apiMessage || fallbackMessage);
            Alert.alert("Error", apiMessage || "Something went wrong while fetching data.");
        } finally {
            setLoading(false);
        }
    };

    const isTargetAchieved = targetData && targetData.achieved >= targetData.total && targetData.total > 0;
    
    const progressPercentage = targetData?.achievement_percent !== undefined
        ? Math.min(100, targetData.achievement_percent)
        : targetData && targetData.total > 0
            ? Math.min(100, (targetData.achieved / targetData.total) * 100)
            : 0;


    const animatedProgressWidth = achievedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    /**
     * Reusable Sleek Metric Card Component
     * @param {object} props 
     * @param {string} props.title 
     * @param {string} props.value 
     * @param {React.ReactNode} props.icon
     * @param {string} props.valueColor
     * @param {string} props.iconColor
     * @param {React.ReactNode} [props.children]
     * @param {object} [props.style]
     */
    const SleekMetricCard = ({ title, value, icon, valueColor, iconColor, children, style }) => (
        <View style={[styles.sleekCard, style]}>
            <View style={[styles.iconCircle, { backgroundColor: iconColor + '10' }]}>
                {React.cloneElement(icon, { color: iconColor, size: 24 })}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>{title}</Text>
                <Text style={[styles.cardValue, { color: valueColor }]}>{value}</Text>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Image
                source={backgroundImage}
                style={styles.backgroundImage}
                blurRadius={Platform.OS === 'ios' ? 15 : 8}
            />

            <LinearGradient
                colors={["#1aa2ccff", "#1aa2ccff"]}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <View style={styles.customHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                        <Ionicons name="chevron-back-outline" size={30} color={COLOR_PALETTE.lightText} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={handleRefreshPress} 
                        style={styles.refreshIconContainer}
                        disabled={loading} 
                    >
                        <Animated.View style={{ transform: [{ scale: refreshScale }] }}>
                            <Feather name="refresh-cw" size={24} color={COLOR_PALETTE.accentOrange} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>My Performance ✨</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color={COLOR_PALETTE.accentOrange} 
                            style={styles.loadingIndicator}
                        />
                    ) : error ? (
                        <View style={styles.errorCard}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={45} color={COLOR_PALETTE.errorRed} />
                            <Text style={styles.errorText}>Oops! {error}</Text>
                            <TouchableOpacity onPress={handleRefreshPress} style={styles.errorRefreshButton}>
                                <Text style={styles.errorRefreshButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : !targetData || targetData.total === 0 ? (
                        <View style={styles.noDataCard}>
                            <MaterialCommunityIcons name="folder-outline" size={55} color={COLOR_PALETTE.secondary} style={styles.noDataIcon} />
                            <Text style={styles.noDataText}>
                                No active target details found for this period.
                            </Text>
                            <Text style={styles.noDataSubText}>
                                It seems there's no target assigned for you this month.
                            </Text>
                        </View>
                    ) : (
                        <Animated.ScrollView
                            style={[styles.scrollView, { opacity: cardOpacity }]}
                            contentContainerStyle={styles.scrollViewContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {isTargetAchieved && (
                                <Animated.View style={[styles.achievementBanner, { transform: [{ scale: bannerScale }] }]}>
                                    <MaterialCommunityIcons name="medal" size={35} color={COLOR_PALETTE.lightText} />
                                    <Text style={styles.achievementText}>Congratulations! Target ACCOMPLISHED! 🎉</Text>
                                </Animated.View>
                            )}

                            {/* --- Performance Period Card (Sleeker) --- */}
                            <SleekMetricCard
                                title="Performance Period"
                                value={`${moment(targetData.startDate).format("YYYY-MM-DD")} to ${moment(targetData.endDate).format("YYYY-MM-DD")}`}
                                icon={<Ionicons name="calendar-outline" />}
                                valueColor={COLOR_PALETTE.primary}
                                iconColor={COLOR_PALETTE.primary}
                            />

                            {/* --- Total Target Card (Sleeker) --- */}
                            <SleekMetricCard
                                title="Your Total Target"
                                value={`₹${targetData.total.toLocaleString('en-IN')}`}
                                icon={<MaterialCommunityIcons name="bullseye-arrow" />}
                                valueColor={COLOR_PALETTE.primary}
                                iconColor={COLOR_PALETTE.accentOrange}
                            />

                            {/* --- Achieved Business Card (High-Impact with Progress Bar) --- */}
                            <SleekMetricCard
                                title="Achieved Business"
                                value={`₹${targetData.achieved.toLocaleString('en-IN')}`}
                                icon={isTargetAchieved ? <MaterialCommunityIcons name="check-circle-outline" /> : <MaterialCommunityIcons name="chart-line-variant" />}
                                valueColor={isTargetAchieved ? COLOR_PALETTE.accentGreen : COLOR_PALETTE.accentOrange}
                                iconColor={isTargetAchieved ? COLOR_PALETTE.accentGreen : COLOR_PALETTE.accentOrange}
                                style={styles.achievedCard}
                            >
                                <View style={styles.progressBarBackground}>
                                    <Animated.View style={[
                                        styles.progressBarFill,
                                        {
                                            width: animatedProgressWidth,
                                            backgroundColor: isTargetAchieved ? COLOR_PALETTE.accentGreen : COLOR_PALETTE.accentOrange,
                                        }
                                    ]} />
                                    <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
                                </View>
                            </SleekMetricCard>
                            
                            {/* --- Remaining to Achieve Card (High-Contrast) --- */}
                            {!isTargetAchieved && (
                                <SleekMetricCard
                                    title="Remaining to Achieve"
                                    value={`₹${targetData.remaining.toLocaleString('en-IN')}`}
                                    icon={<Ionicons name="hourglass-outline" />}
                                    valueColor={COLOR_PALETTE.errorRed} // Use red/orange to highlight the remaining gap
                                    iconColor={COLOR_PALETTE.errorRed}
                                    style={styles.remainingCard}
                                >
                                    {targetData.achieved === 0 ? (
                                        <Text style={styles.motivationText}>
                                            Keep working hard; success is within your reach! ✨
                                        </Text>
                                    ) : (
                                        <Text style={styles.encouragementText}>
                                            Keep going! You're almost there! 💪
                                        </Text>
                                    )}
                                </SleekMetricCard>
                            )}
                        </Animated.ScrollView>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// --- STYLES (UPDATED FOR SLEEK DESIGN) ---
const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative' },
    backgroundImage: { ...StyleSheet.absoluteFillObject, width: width, height: height, opacity: 0.15, zIndex: -2 },
    gradientOverlay: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    keyboardAvoidingView: { flex: 1 },
    customHeader: {
        position: 'absolute', top: Platform.OS === 'android' ? 40 : 50, left: 0, right: 0, height: 65,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, zIndex: 10,
    },
    backArrow: { padding: 8, marginRight: 'auto' },
    refreshIconContainer: {
        padding: 10, borderRadius: 30, backgroundColor: COLORS.white,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 4, marginRight: 10, 
    },
    contentContainer: {
        flex: 1, paddingHorizontal: 22,
        marginTop: Platform.OS === 'android' ? 110 : 105,
    },
    titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 },
    title: { fontWeight: "800", fontSize: 30, color: COLOR_PALETTE.lightText, letterSpacing: 0.2, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, textAlign: 'center' },
    loadingIndicator: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: height * 0.15 },
    errorCard: {
        backgroundColor: COLOR_PALETTE.cardBackground, borderRadius: 25, padding: 35, marginTop: height * 0.1, alignItems: 'center', shadowColor: COLOR_PALETTE.errorRed, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 10, borderLeftWidth: 8, borderLeftColor: COLOR_PALETTE.errorRed,
    },
    errorText: { fontSize: 20, color: COLOR_PALETTE.errorRed, marginTop: 20, textAlign: "center", fontWeight: "700", lineHeight: 28 },
    errorRefreshButton: { marginTop: 30, backgroundColor: COLOR_PALETTE.primary, paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12, shadowColor: COLOR_PALETTE.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
    errorRefreshButtonText: { color: COLOR_PALETTE.lightText, fontSize: 17, fontWeight: 'bold' },
    noDataCard: {
        backgroundColor: COLOR_PALETTE.cardBackground, borderRadius: 25, padding: 35, marginTop: height * 0.1, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, borderLeftWidth: 8, borderLeftColor: COLOR_PALETTE.softBorder,
    },
    noDataIcon: { marginBottom: 25 },
    noDataText: { fontSize: 19, color: COLOR_PALETTE.greyText, textAlign: "center", fontWeight: "600", lineHeight: 28, marginBottom: 12 },
    noDataSubText: { fontSize: 15, color: COLOR_PALETTE.secondary, textAlign: "center", paddingHorizontal: 15 },
    scrollView: { flex: 1 },
    scrollViewContent: { paddingBottom: 40 },
    
    // --- SLEEK METRIC CARD STYLES ---
    sleekCard: {
        backgroundColor: COLOR_PALETTE.cardBackground,
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 15, 
        flexDirection: 'row', // Horizontal layout
        alignItems: 'center',
        shadowColor: COLOR_PALETTE.shadowDark,
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 1, // Subtle border
        borderColor: '#F0F0F0',
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    cardContent: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 14, 
        fontWeight: "600",
        color: COLOR_PALETTE.secondary,
        marginBottom: 3,
        textTransform: 'uppercase', // Give a modern feel
        letterSpacing: 0.5,
    },
    cardValue: {
        fontSize: 22, 
        fontWeight: "800",
        color: COLOR_PALETTE.primary,
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.05)', 
        textShadowOffset: { width: 1, height: 1 }, 
        textShadowRadius: 1,
    },
    achievedCard: {
        borderWidth: 2, // Thicker border for high-impact card
        borderColor: COLOR_PALETTE.accentOrange + '50',
    },
    remainingCard: {
        borderWidth: 2, 
        borderColor: COLOR_PALETTE.errorRed + '50',
    },

    // Achievement Banner
    achievementBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR_PALETTE.accentGreen,
        borderRadius: 20, paddingVertical: 15, 
        marginBottom: 20, shadowColor: COLOR_PALETTE.accentGreen, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 15,
    },
    achievementText: { color: COLOR_PALETTE.lightText, fontSize: 17, fontWeight: 'bold', marginLeft: 10, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
    
    // Progress Bar
    progressBarBackground: {
        height: 10, // Increased height for better visibility
        backgroundColor: '#EAEAEA', 
        borderRadius: 5, 
        marginTop: 5, 
        overflow: 'hidden', 
        position: 'relative', 
        justifyContent: 'center',
        width: '100%',
        shadowColor: COLOR_PALETTE.shadowLight, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2,
    },
    progressBarFill: { height: '100%', borderRadius: 5, position: 'absolute', left: 0 },
    progressText: { position: 'absolute', right: 8, fontSize: 10, fontWeight: '900', color: COLOR_PALETTE.greyText },
    
    // Motivation Text
    encouragementText: { fontSize: 13, color: COLOR_PALETTE.secondary, textAlign: 'left', marginTop: 10, fontStyle: 'italic', fontWeight: '500' },
    motivationText: { fontSize: 14, color: COLOR_PALETTE.primary, textAlign: 'left', marginTop: 12, fontWeight: '700', fontStyle: 'normal', lineHeight: 22 }
});

export default Target; 