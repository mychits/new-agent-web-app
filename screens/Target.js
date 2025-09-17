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
import baseUrl from "../constants/baseUrl"; // Ensure this path is correct
import axios from "axios";
import COLORS from "../constants/color"; // Assuming COLORS.white exists
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const COLOR_PALETTE = {
    primary: '#183A5D', // Darker, richer blue for main text/elements
    secondary: '#7B8D9E', // Muted blue-gray for labels
    lightText: '#FFFFFF', // Pure white
    cardBackground: '#FFFFFF', // White
    errorRed: '#E74C3C', // Vibrant error red
    greyText: '#4C4C4C', // Dark grey for general text
    accentGreen: '#27AE60', // Stronger green for success
    accentOrange: '#F39C12', // More vivid orange for attention
    backgroundLight: '#DFF6FC', // Very light, cool blue
    backgroundDark: '#BDE0F3',  // Slightly deeper, cool blue
    softBorder: '#c2b9f3ff', // Soft blue for general borders
};

const backgroundImage = require('../assets/hero1.jpg'); // Your background image
const headerImage = require('../assets/hero1.jpg'); // Your header logo/image

const Target = ({ route, navigation }) => {
    const [targetData, setTargetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Animation values
    const refreshScale = useRef(new Animated.Value(1)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current; // For content fade-in
    const achievedProgress = useRef(new Animated.Value(0)).current; // For progress bar
    const bannerScale = useRef(new Animated.Value(0)).current; // For achievement banner scale

    const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");

    useEffect(() => {
        fetchTargetDetails();
    }, []);

    useEffect(() => {
        if (targetData) {
            // Animate cards into view after data loads
            Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 500,
                delay: 100, // Small delay after loading indicator disappears
                useNativeDriver: true,
            }).start();

            // Animate progress bar
            const progress = targetData.total > 0 ? (targetData.achieved / targetData.total) * 100 : 0;
            Animated.timing(achievedProgress, {
                toValue: progress,
                duration: 800, // Smooth animation for progress
                delay: 200,
                useNativeDriver: false, // Width animation needs false
            }).start();

            // Animate achievement banner if target is achieved
            if (targetData.achieved >= targetData.total) {
                Animated.spring(bannerScale, {
                    toValue: 1,
                    friction: 5, // Controls bounciness
                    tension: 80, // Controls speed
                    useNativeDriver: true,
                }).start();
            }
        }
    }, [targetData]); // Dependency on targetData

    const handleRefreshPress = () => {
        Animated.sequence([
            Animated.timing(refreshScale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
            Animated.timing(refreshScale, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            // Reset animations when fetching new data
            cardOpacity.setValue(0);
            achievedProgress.setValue(0);
            bannerScale.setValue(0); // Reset banner scale
            fetchTargetDetails();
        });
    };

    const fetchTargetDetails = async () => {
        setLoading(true);
        setError("");

        try {
            const agentInfoJson = await AsyncStorage.getItem("agentInfo");
            const agentInfo = agentInfoJson ? JSON.parse(agentInfoJson) : null;

            const agentId = agentInfo?._id;
            const designationId = agentInfo?.designation_id;

            if (!agentId) {
                setError("User ID not found in stored information. Please log in again.");
                setLoading(false);
                return;
            }


            const res = await axios.get(`${baseUrl}/target/get-targets`, {
                params: {
                    fromDate: startOfMonth,
                    toDate: endOfMonth,
                },
            });

            const allTargets = res.data || [];
            let selectedTarget = null;

            selectedTarget = allTargets.find(
                (t) => (t.agentId && (t.agentId._id === agentId || t.agentId === agentId))
            );

            if (!selectedTarget && designationId) {
                selectedTarget = allTargets.find(
                    (t) =>
                        (!t.agentId || t.agentId === null || (typeof t.agentId === 'object' && !t.agentId._id)) &&
                        t.designationId === designationId
                );
            }

            if (!selectedTarget && allTargets.length > 0) {
                selectedTarget = allTargets[0];
            }

            if (!selectedTarget) {
                setError("No target set for this user for the current period.");
                setTargetData(null);
                setLoading(false);
                return;
            }

            const targetStartDate = moment(selectedTarget.startDate).format("YYYY-MM-DD");
            const targetEndDate = moment(selectedTarget.endDate).format("YYYY-MM-DD");

            const commRes = await axios.get(`${baseUrl}/enroll/get-detailed-commission-per-month`, {
                params: {
                    agent_id: agentId,
                    from_date: startOfMonth,
                    to_date: endOfMonth,
                },
            });

            const actualBusiness = commRes.data?.summary?.actual_business || 0;
            const cleanActual = typeof actualBusiness === "string"
                ? Number(actualBusiness.replace(/[^0-9.-]+/g, ""))
                : actualBusiness;

            const totalTarget = selectedTarget.totalTarget || 0;
            const achievedAmount = cleanActual;
            const remainingAmount = totalTarget > achievedAmount ? totalTarget - achievedAmount : 0;

            setTargetData({
                total: totalTarget,
                achieved: achievedAmount,
                remaining: remainingAmount,
                startDate: targetStartDate,
                endDate: targetEndDate,
            });

        } catch (err) { // Removed ': any' type annotation
            console.error("Error fetching target or commission:", err.response?.data || err.message);
            setError("Failed to load data. Please check network or try again.");
            Alert.alert("Error", err.response?.data?.message || "Something went wrong while fetching data.");
        } finally {
            setLoading(false);
        }
    };

    const isTargetAchieved = targetData && targetData.achieved >= targetData.total;
    const progressPercentage = targetData && targetData.total > 0
        ? Math.min(100, (targetData.achieved / targetData.total) * 100)
        : 0;

    const animatedProgressWidth = achievedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Subtle Background Image */}
            <Image
                source={backgroundImage}
                style={styles.backgroundImage}
                blurRadius={Platform.OS === 'ios' ? 15 : 8} // Adjust blur for platform
            />

            <LinearGradient
                 colors={['#dbf6faff', '#90dafcff']}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                {/* Custom Header with Glassmorphism Effect */}
                <View style={styles.customHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                        <Ionicons name="chevron-back-outline" size={30} color={COLOR_PALETTE.primary} />
                    </TouchableOpacity>
                    <Image
                        source={headerImage}
                        style={styles.headerRightImage}
                        resizeMode="cover"
                    />
                </View>

                <View style={styles.contentContainer}>
                    {/* Title Row */}
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>My Performance ✨</Text>
                       
                    </View>

                    {/* Conditional Rendering: Loading, Error, No Data, or Content */}
                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color={COLOR_PALETTE.primary}
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
                    ) : !targetData ? (
                        <View style={styles.noDataCard}>
                            <MaterialCommunityIcons name="folder-outline" size={55} color={COLOR_PALETTE.secondary} style={styles.noDataIcon} />
                            <Text style={styles.noDataText}>
                                No active target details found for this period.
                            </Text>
                            <Text style={styles.noDataSubText}>
                                It seems there's no target assigned for you this month. Please check with your administrator if you believe this is an error.
                            </Text>
                        </View>
                    ) : (
                        <Animated.ScrollView
                            style={[styles.scrollView, { opacity: cardOpacity }]}
                            contentContainerStyle={styles.scrollViewContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Achievement Banner */}
                            {isTargetAchieved && (
                                <Animated.View style={[styles.achievementBanner, { transform: [{ scale: bannerScale }] }]}>
                                    <MaterialCommunityIcons name="medal" size={35} color={COLOR_PALETTE.lightText} />
                                    <Text style={styles.achievementText}>Congratulations! Target ACCOMPLISHED! 🎉</Text>
                                </Animated.View>
                            )}

                            {/* Target Details Cards */}
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="calendar-outline" size={22} color={COLOR_PALETTE.secondary} />
                                    <Text style={styles.label}>Performance Period:</Text>
                                </View>
                                <Text style={styles.value}>
                                    <Text style={{ fontWeight: '600' }}>{targetData.startDate}</Text> to <Text style={{ fontWeight: '600' }}>{targetData.endDate}</Text>
                                </Text>
                            </View>

                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <MaterialCommunityIcons name="bullseye-arrow" size={22} color={COLOR_PALETTE.secondary} />
                                    <Text style={styles.label}>Your Total Target:</Text>
                                </View>
                                <Text style={styles.value}>₹{targetData.total.toLocaleString('en-IN')}</Text>
                            </View>

                            <View style={[styles.card, isTargetAchieved ? styles.cardAchieved : styles.cardProgress]}>
                                <View style={styles.cardHeader}>
                                    <MaterialCommunityIcons
                                        name={isTargetAchieved ? "check-circle-outline" : "chart-line-variant"}
                                        size={22}
                                        color={isTargetAchieved ? COLOR_PALETTE.accentGreen : COLOR_PALETTE.primary}
                                    />
                                    <Text style={[styles.label, isTargetAchieved && { color: COLOR_PALETTE.accentGreen }]}>
                                        Achieved Business:
                                    </Text>
                                </View>
                                <Text style={[styles.value, isTargetAchieved && { color: COLOR_PALETTE.accentGreen }]}>
                                    ₹{targetData.achieved.toLocaleString('en-IN')}
                                </Text>
                                {/* Progress Bar */}
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
                            </View>

                            {!isTargetAchieved && (
                                <View style={[styles.card, styles.cardRemaining]}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="hourglass-outline" size={22} color={COLOR_PALETTE.accentOrange} />
                                        <Text style={[styles.label, { color: COLOR_PALETTE.accentOrange }]}>
                                            Remaining to Achieve:
                                        </Text>
                                    </View>
                                    <Text style={[styles.value, { color: COLOR_PALETTE.accentOrange }]}>
                                        ₹{targetData.remaining.toLocaleString('en-IN')}
                                    </Text>
                                    {/* Conditional motivational sentence */}
                                    {targetData.achieved === 0 ? (
                                        <Text style={styles.motivationText}>
                                            Keep working hard; success is within your reach! ✨
                                        </Text>
                                    ) : (
                                        <Text style={styles.encouragementText}>
                                            Keep going! You're almost there! 💪
                                        </Text>
                                    )}
                                </View>
                            )}
                        </Animated.ScrollView>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        backgroundColor: COLORS.white, // Using COLORS.white as it's a direct import
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: width,
        height: height,
        opacity: 0.15, // Make it subtle
        zIndex: -2, // Behind everything
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1, // Between image and content
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    customHeader: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 50,
        left: 0,
        right: 0,
        height: 65,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 10,
        zIndex: 10, // Ensure header is above content
    },
    backArrow: {
        padding: 8,
        marginRight: 6, // Adjust space to next element (decreased from 10)
    },
    headerRightImage: {
        width: 48,
        height: 48,
        marginLeft: 'auto', // Pushes the image to the right
        marginRight: 10, // Small margin from the right edge
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 22,
        marginTop: Platform.OS === 'android' ? 125 : 120, // Adjusted margin top
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 30, // More space below title
    },
    title: {
        fontWeight: "800",
        fontSize: 30, // Larger, more impactful title
        color: COLOR_PALETTE.primary,
        letterSpacing: 0.2,
        textShadowColor: 'rgba(0, 0, 0, 0.1)', // Subtle text shadow
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    refreshIconContainer: {
        padding: 12, // Increased padding
        borderRadius: 30, // Perfectly round
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15, // More visible shadow
        shadowRadius: 5,
        elevation: 4,
    },
    loadingIndicator: {
        flex: 1, // Take full space
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: height * 0.15, // Position more centrally
    },
    errorCard: {
        backgroundColor: COLOR_PALETTE.cardBackground,
        borderRadius: 25, // More rounded
        padding: 35, // More padding
        marginTop: height * 0.1, // Position more centrally
        alignItems: 'center',
        shadowColor: COLOR_PALETTE.errorRed,
        shadowOffset: { width: 0, height: 6 }, // Deeper shadow
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
        borderLeftWidth: 8, // Thicker border
        borderLeftColor: COLOR_PALETTE.errorRed,
    },
    errorText: {
        fontSize: 20, // Larger text
        color: COLOR_PALETTE.errorRed,
        marginTop: 20,
        textAlign: "center",
        fontWeight: "700",
        lineHeight: 28,
    },
    errorRefreshButton: {
        marginTop: 30,
        backgroundColor: COLOR_PALETTE.primary,
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 12,
        shadowColor: COLOR_PALETTE.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    errorRefreshButtonText: {
        color: COLOR_PALETTE.lightText,
        fontSize: 17,
        fontWeight: 'bold',
    },
    noDataCard: {
        backgroundColor: COLOR_PALETTE.cardBackground,
        borderRadius: 25, // More rounded
        padding: 35,
        marginTop: height * 0.1,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        borderLeftWidth: 8,
        borderLeftColor: COLOR_PALETTE.softBorder,
    },
    noDataIcon: {
        marginBottom: 25,
    },
    noDataText: {
        fontSize: 19,
        color: COLOR_PALETTE.greyText,
        textAlign: "center",
        fontWeight: "600",
        lineHeight: 28,
        marginBottom: 12,
    },
    noDataSubText: {
        fontSize: 15,
        color: COLOR_PALETTE.secondary,
        textAlign: "center",
        paddingHorizontal: 15,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 40, // More padding at the bottom for scroll
    },
    card: {
        backgroundColor: COLOR_PALETTE.cardBackground,
        // Unique rounded corners
        borderRadius: 15,
        borderTopLeftRadius: 35, // More rounded top-left
        borderBottomRightRadius: 35, // More rounded bottom-right
        padding: 28, // More padding
        elevation: 12, // Even higher elevation for depth
        marginBottom: 25, // More space between cards
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 }, // Deeper shadow
        shadowOpacity: 0.18, // More visible shadow
        shadowRadius: 10, // Softer shadow
        borderLeftWidth: 8, // Thicker border
        borderColor: COLOR_PALETTE.softBorder, // Default border color
        
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: "700",
        color: COLOR_PALETTE.secondary,
        marginLeft: 15, // More space after icon
    },
    value: {
        fontSize: 20, // Larger value text
        color: COLOR_PALETTE.primary,
        fontWeight: "800",
        marginTop: 5,
        // Subtle text shadow for values
        textShadowColor: 'rgba(0, 0, 0, 0.05)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    cardAchieved: {
        borderLeftColor: COLOR_PALETTE.accentGreen,
    },
    cardProgress: {
        borderLeftColor: COLOR_PALETTE.accentOrange,
    },
    cardRemaining: {
        borderLeftColor: COLOR_PALETTE.accentOrange,
    },
    achievementBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLOR_PALETTE.accentGreen,
        borderRadius: 20, // More rounded
        paddingVertical: 20, // More vertical padding
        marginBottom: 30, // More space below banner
        shadowColor: COLOR_PALETTE.accentGreen,
        shadowOffset: { width: 0, height: 8 }, // Deeper shadow
        shadowOpacity: 0.4, // More visible shadow
        shadowRadius: 15, // Softer shadow
        elevation: 15, // Even higher elevation
    },
    achievementText: {
        color: COLOR_PALETTE.lightText,
        fontSize: 20, // Larger text
        fontWeight: 'bold',
        marginLeft: 15, // More space after icon
        textShadowColor: 'rgba(0, 0, 0, 0.2)', // Text shadow for banner
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    progressBarBackground: {
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        marginTop: 15,
        overflow: 'hidden', // Ensures fill stays within bounds
        position: 'relative',
        justifyContent: 'center',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
        position: 'absolute',
        left: 0,
    },
    progressText: {
        position: 'absolute',
        right: 10,
        fontSize: 10,
        fontWeight: 'bold',
        color: COLOR_PALETTE.greyText, // Or white if background is dark enough
    },
    encouragementText: {
        fontSize: 14,
        color: COLOR_PALETTE.secondary,
        textAlign: 'center',
        marginTop: 15,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    // New style for the motivation sentence when achieved is 0 in Remaining card
    motivationText: {
        fontSize: 15,
        color: COLOR_PALETTE.primary, // Using primary for a stronger message
        textAlign: 'center',
        marginTop: 18, // A bit more space
        fontWeight: '700', // Bolder
        fontStyle: 'normal', // Not italic by default for stronger message
        lineHeight: 22,
    }
});

export default Target;
