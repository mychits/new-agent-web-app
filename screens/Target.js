import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Platform,
    Dimensions,
    Animated,
    Image,
    TouchableOpacity,
    Modal,
    StatusBar,
    ScrollView
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import baseUrl from "../constants/baseUrl"; 

const { width } = Dimensions.get("window");

const COLOR_PALETTE = {
    primary: '#183A5D',
    secondary: '#7B8D9E',
    lightText: '#FFFFFF',
    cardBackground: '#FFFFFF',
    errorRed: '#E74C3C',
    accentGreen: '#27AE60',
    accentOrange: '#f8c009ff',
    backgroundBlue: '#1aa2ccff',
};

const TARGET_API_BASE = `${baseUrl}/target/employee`;
const backgroundImage = require('../assets/hero1.jpg'); 

const Target = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [targetData, setTargetData] = useState(null);
    const [error, setError] = useState("");

    const [month, setMonth] = useState(moment().month());
    const [year, setYear] = useState(moment().year());
    const [tmpMonth, setTmpMonth] = useState(moment().month());
    const [tmpYear, setTmpYear] = useState(moment().year());
    const [showPicker, setShowPicker] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const generateYears = () => {
        const currentY = moment().year();
        const startYear = 2023; 
        const years = [];
        for (let i = startYear; i <= currentY; i++) {
            years.push(i);
        }
        return years;
    };

    const getAvailableMonths = () => {
        const allMonths = moment.monthsShort();
        const currentY = moment().year();
        const currentM = moment().month();

        if (tmpYear === currentY) {
            return allMonths.filter((_, index) => index <= currentM);
        }
        return allMonths;
    };

    const fetchTargetDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const agentInfoStr = await AsyncStorage.getItem("agentInfo");
            const agentInfo = agentInfoStr ? JSON.parse(agentInfoStr) : null;
            
            // Dynamic ID extraction - no hardcoding
            const agentId = agentInfo?._id;

            if (!agentId) {
                setError("Authentication Error: Please log in again.");
                setLoading(false);
                return;
            }

            const fromDate = moment().year(year).month(month).startOf("month").format("YYYY-MM-DD");
            const toDate = moment().year(year).month(month).endOf("month").format("YYYY-MM-DD");

            const res = await axios.get(`${TARGET_API_BASE}/${agentId}?from_date=${fromDate}&to_date=${toDate}`);

            if (res.data.success && res.data.summary) {
                const s = res.data.summary;
                setTargetData({
                    total: s.agent.target.value,
                    achieved: s.metrics.actual_business,
                    percent: s.agent.target.achievement_percent,
                    remaining: s.metrics.target_remaining,
                });

                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
                Animated.timing(progressAnim, {
                    toValue: Math.min(100, s.agent.target.achievement_percent),
                    duration: 1000,
                    useNativeDriver: false
                }).start();
            } else {
                setTargetData(null);
                setError("No data found for this period.");
            }
        } catch (err) {
            setError("Failed to load details. Check your connection.");
            console.error("API Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchTargetDetails(); 
    }, [month, year]);

    const animatedWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    const isTargetAchieved = targetData?.remaining <= 0;

    const getMotivation = () => {
        if (!targetData) return "";
        const { achieved, percent } = targetData;
        if (percent >= 100) return "Target achieved! You are a superstar! 🏆";
        if (achieved > 300000) return "Great job! Milestone reached! 🚀";
        if (achieved === 0) return "Let's make a start today! 💪";
        return "Keep pushing! You are doing great! 🔥";
    };

    const SleekMetricCard = ({ title, value, icon, valueColor, iconColor, children, isPeriodCard }) => (
        <TouchableOpacity 
            activeOpacity={isPeriodCard ? 0.7 : 1}
            onPress={isPeriodCard ? () => {
                setTmpYear(year);
                setTmpMonth(month);
                setShowPicker(true);
            } : null}
            style={styles.sleekCard}
        >
            <View style={[styles.iconCircle, { backgroundColor: iconColor + '10' }]}>
                {icon}
            </View>
            <View style={{ flex: 1 }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={styles.cardLabel}>{title}</Text>
                    {isPeriodCard && <Ionicons name="options-outline" size={16} color={COLOR_PALETTE.primary} />}
                </View>
                <Text style={[styles.cardValue, { color: valueColor }]}>{value}</Text>
                {children}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            <Image source={backgroundImage} style={styles.backgroundImage} blurRadius={10} />
            <LinearGradient colors={[COLOR_PALETTE.backgroundBlue, COLOR_PALETTE.backgroundBlue]} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.customHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={32} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={fetchTargetDetails} style={styles.refreshBtn}>
                        <Feather name="refresh-cw" size={22} color={COLOR_PALETTE.accentOrange} />
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContainer}>
                    <Text style={styles.mainTitle}>My Performance 🎯</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={COLOR_PALETTE.accentOrange} style={{ marginTop: 50 }} />
                    ) : (
                        <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
                            
                            <SleekMetricCard
                                title="PERFORMANCE PERIOD"
                                value={`${moment().month(month).format("MMMM")} ${year}`}
                                icon={<Ionicons name="calendar-outline" size={24} color={COLOR_PALETTE.primary} />}
                                valueColor={COLOR_PALETTE.primary}
                                iconColor={COLOR_PALETTE.primary}
                                isPeriodCard={true}
                            />

                            {error ? (
                                <View style={styles.errorCard}>
                                    <MaterialCommunityIcons name="alert-circle-outline" size={40} color={COLOR_PALETTE.errorRed} />
                                    <Text style={styles.errorText}>{error}</Text>
                                    <TouchableOpacity style={[styles.applyBtn, {marginTop: 20}]} onPress={fetchTargetDetails}>
                                        <Text style={styles.applyBtnText}>RETRY</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : targetData && (
                                <>
                                    <SleekMetricCard
                                        title="YOUR TOTAL TARGET"
                                        value={`${targetData.total.toLocaleString('en-IN')}`}
                                        icon={<MaterialCommunityIcons name="bullseye-arrow" size={24} color={COLOR_PALETTE.accentOrange} />}
                                        valueColor={COLOR_PALETTE.primary}
                                        iconColor={COLOR_PALETTE.accentOrange}
                                    />

                                    <SleekMetricCard
                                        title="ACHIEVED BUSINESS"
                                        value={`${targetData.achieved.toLocaleString('en-IN')}`}
                                        icon={<MaterialCommunityIcons name="chart-line-variant" size={24} color={COLOR_PALETTE.accentOrange} />}
                                        valueColor={COLOR_PALETTE.accentOrange}
                                        iconColor={COLOR_PALETTE.accentOrange}
                                    >
                                        <View style={styles.progressBarBackground}>
                                            <Animated.View style={[styles.progressBarFill, { width: animatedWidth, backgroundColor: COLOR_PALETTE.accentOrange }]} />
                                            <Text style={styles.progressText}>{targetData.percent}%</Text>
                                        </View>
                                        {isTargetAchieved && (
                                            <Text style={[styles.encouragementText, { color: COLOR_PALETTE.accentGreen }]}>
                                                {getMotivation()}
                                            </Text>
                                        )}
                                    </SleekMetricCard>

                                    {!isTargetAchieved && (
                                        <SleekMetricCard
                                            title="REMAINING TO ACHIEVE"
                                            value={`${targetData.remaining.toLocaleString('en-IN')}`}
                                            icon={<Ionicons name="hourglass-outline" size={24} color={COLOR_PALETTE.errorRed} />}
                                            valueColor={COLOR_PALETTE.errorRed}
                                            iconColor={COLOR_PALETTE.errorRed}
                                        >
                                            <Text style={styles.encouragementText}>{getMotivation()}</Text>
                                        </SleekMetricCard>
                                    )}
                                </>
                            )}
                        </Animated.ScrollView>
                    )}
                </View>
            </SafeAreaView>

            <Modal visible={showPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Select Period</Text>
                            <TouchableOpacity onPress={() => setShowPicker(false)}>
                                <Ionicons name="close-circle" size={30} color="#ddd" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.filterLabel}>YEAR</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearRow}>
                            {generateYears().map((y) => (
                                <TouchableOpacity key={y} 
                                    style={[styles.yearBox, tmpYear === y && styles.activeBox]} 
                                    onPress={() => {
                                        setTmpYear(y);
                                        if (y === moment().year() && tmpMonth > moment().month()) {
                                            setTmpMonth(moment().month());
                                        }
                                    }}>
                                    <Text style={[styles.boxText, tmpYear === y && styles.activeBoxText]}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.filterLabel}>MONTH</Text>
                        <View style={styles.monthGrid}>
                            {getAvailableMonths().map((m, i) => (
                                <TouchableOpacity key={m} 
                                    style={[styles.monthBox, tmpMonth === i && styles.activeBox]} 
                                    onPress={() => setTmpMonth(i)}>
                                    <Text style={[styles.boxText, tmpMonth === i && styles.activeBoxText]}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.applyBtn} onPress={() => {
                            setMonth(tmpMonth); setYear(tmpYear); setShowPicker(false);
                        }}>
                            <Text style={styles.applyBtnText}>APPLY SELECTION</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    backgroundImage: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
    customHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === 'android' ? 60 : 30, 
        alignItems: 'center'
    },
    mainContainer: { 
        paddingHorizontal: 22, 
        flex: 1, 
        marginTop: 20 
    },
    refreshBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 25, elevation: 5 },
    mainTitle: { fontWeight: "900", fontSize: 30, color: '#fff', textAlign: 'center', marginBottom: 25 },
    sleekCard: { backgroundColor: '#fff', borderRadius: 25, padding: 22, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 8 },
    iconCircle: { width: 55, height: 55, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 15, borderWidth: 1, borderColor: '#f0f0f0' },
    cardLabel: { fontSize: 13, fontWeight: "600", color: COLOR_PALETTE.secondary, textTransform: 'uppercase', letterSpacing: 1 },
    cardValue: { fontSize: 22, fontWeight: "900", color: COLOR_PALETTE.primary },
    progressBarBackground: { height: 12, backgroundColor: '#EAEAEA', borderRadius: 6, marginTop: 10, overflow: 'hidden', position: 'relative', justifyContent: 'center' },
    progressBarFill: { height: '100%', position: 'absolute', left: 0 },
    progressText: { position: 'absolute', right: 8, fontSize: 10, fontWeight: '900', color: COLOR_PALETTE.primary, zIndex: 1 },
    encouragementText: { fontSize: 14, color: COLOR_PALETTE.secondary, marginTop: 8, fontStyle: 'italic', fontWeight: '600' },
    errorCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 20 },
    errorText: { color: COLOR_PALETTE.primary, fontSize: 16, fontWeight: '700', marginTop: 10, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, paddingBottom: 50 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    sheetTitle: { fontSize: 22, fontWeight: '900', color: COLOR_PALETTE.primary },
    filterLabel: { fontSize: 12, fontWeight: '900', color: '#bbb', marginVertical: 10, letterSpacing: 1 },
    yearRow: { flexDirection: 'row', paddingVertical: 5 },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    yearBox: { paddingHorizontal: 25, marginHorizontal: 5, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center', minWidth: 90 },
    monthBox: { width: '30%', marginHorizontal: '1.5%', paddingVertical: 12, marginBottom: 10, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center' },
    activeBox: { backgroundColor: COLOR_PALETTE.primary },
    boxText: { fontWeight: '700', color: '#666' },
    activeBoxText: { color: '#fff' },
    applyBtn: { backgroundColor: COLOR_PALETTE.accentOrange, padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
    applyBtnText: { fontWeight: '900', color: COLOR_PALETTE.primary, fontSize: 16 }
});

export default Target;