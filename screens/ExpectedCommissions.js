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
    Pressable,
    TextInput,
    Image,
    StatusBar,
    SafeAreaView,
    Animated,
    Dimensions,
} from "react-native";
import { TapGestureHandler } from "react-native-gesture-handler";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import { Feather, MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { whatsappMessage } from "../components/data/messages";
import { LinearGradient } from "expo-linear-gradient";

const backgroundImage = require("../assets/hero1.jpg");
const { width } = Dimensions.get("window");

// --- DESIGN TOKENS ---
const C = {
    primary: "#183A5D",
    accent: "#f8c009ff",
    bgBlue: "#1aa2ccff",
    success: "#27AE60",
    magenta: "#f70cb4ff",
    cardBg: "rgba(255, 255, 255, 0.98)",
    white: "#FFFFFF",
    muted: "#8898AA",
    background: "#0f2a44",
    border: "#F1F4F8",
    subtleBg: "#F5F7FA",
    shimmer1: "#E8EDF2",
    shimmer2: "#F5F7FA",
};

// --- SKELETON COMPONENTS ---
const SkeletonBox = ({ width: w, height: h, borderRadius = 8, style }) => {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

    return (
        <Animated.View
            style={[
                { width: w, height: h, borderRadius, backgroundColor: C.shimmer1, opacity },
                style,
            ]}
        />
    );
};

const SkeletonCard = () => (
    <View style={[styles.listCard, { gap: 10 }]}>
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
            <SkeletonBox width={44} height={44} borderRadius={14} />
            <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
                <SkeletonBox width="60%" height={14} />
                <SkeletonBox width="40%" height={10} />
                <SkeletonBox width="50%" height={10} />
            </View>
            <SkeletonBox width={90} height={52} borderRadius={12} />
        </View>
        {/* Divider */}
        <View style={styles.cardDivider} />
        {/* Footer row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <SkeletonBox width="35%" height={30} />
            <SkeletonBox width={70} height={30} borderRadius={8} />
            <SkeletonBox width="30%" height={30} />
        </View>
    </View>
);

const SkeletonMainCard = () => (
    <View style={[styles.mainCard, { gap: 12 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBox width={160} height={12} />
            <SkeletonBox width={50} height={22} borderRadius={6} />
        </View>
        <View style={{ alignItems: "center", marginVertical: 6, gap: 6 }}>
            <SkeletonBox width={140} height={38} borderRadius={10} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBox width="40%" height={36} borderRadius={8} />
            <SkeletonBox width={1} height={24} />
            <SkeletonBox width="40%" height={36} borderRadius={8} />
        </View>
    </View>
);

const ExpectedCommissions = ({ route, navigation }) => {
    const { user } = route.params;
    // null = not yet loaded (prevents 0 flash); number = loaded
    const [chitCustomerLength, setChitCustomerLength] = useState(null);
    const [goldCustomerLength, setGoldCustomerLength] = useState(null);
    const [isChitLoading, setIsChitLoading] = useState(true);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [customers, setCustomer] = useState([]);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [totalChitCommissions, setTotalChitCommissions] = useState(null);
    const [totalGoldCommissions, setTotalGoldCommissions] = useState(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const blinkAnim = useRef(new Animated.Value(1)).current;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    const getPhone = (userObj) => {
        if (!userObj) return null;
        return (
            userObj.phone_number ||
            userObj.phoneNumber ||
            userObj.phone ||
            userObj.mobile ||
            userObj.mobile_number ||
            null
        );
    };

    const sendWhatsappMessage = async (item) => {
        const phone = getPhone(item.user_id);
        if (!phone) return;
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(whatsappMessage)}`;
        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) return Linking.openURL(url);
                Alert.alert("Error", "WhatsApp is not installed.");
            })
            .catch((err) => console.error(err));
    };

    const openDialer = (item) => {
        const phone = getPhone(item?.user_id);
        if (!phone) return;
        Linking.canOpenURL(`tel:${phone}`)
            .then((supported) => {
                if (supported) Linking.openURL(`tel:${phone}`);
                else Alert.alert("Error", "Dialer not supported.");
            })
            .catch((err) => Alert.alert("Error", "Could not initiate call."));
    };

    useEffect(() => {
        const fetchExpectedCommissions = async () => {
            const setLoading = activeTab === "CHIT" ? setIsChitLoading : setIsGoldLoading;
            setLoading(true);
            fadeAnim.setValue(0);
            progressAnim.setValue(0);

            try {
                const apiUrl = `${baseUrl.replace(/\/+$/, "")}/enroll/get-commission-info/${user.userId}`;
                const response = await axios.get(apiUrl);
                if (response.status >= 400) throw new Error("Failed to fetch data");

                const data = response.data.dataWithCommission || [];
                const totalCommission = (response?.data?.total_commission || "0").toString();
                const customerCount = data.length || 0;

                setCustomer(data);
                if (activeTab === "CHIT") {
                    setTotalChitCommissions(totalCommission);
                    setChitCustomerLength(customerCount);
                } else {
                    setTotalGoldCommissions(totalCommission);
                    setGoldCustomerLength(customerCount);
                }

                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
                Animated.spring(progressAnim, { toValue: Math.min(customerCount * 5, 100), tension: 40, friction: 7, useNativeDriver: false }).start();
            } catch (err) {
                console.error("Error fetching commissions:", err);
                setCustomer([]);
                if (activeTab === "CHIT") { setTotalChitCommissions("0"); setChitCustomerLength(0); }
                else { setTotalGoldCommissions("0"); setGoldCustomerLength(0); }
            } finally {
                setLoading(false);
            }
        };
        fetchExpectedCommissions();
    }, [activeTab, user.userId]);

    const filteredCustomers = customers;

    const formatCommission = (value) => {
        const numericValue = String(value || "0").replace(/[^\d.]/g, "");
        return Number(numericValue).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    const totalCommission = activeTab === "CHIT" ? totalChitCommissions : totalGoldCommissions;
    const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;
    const customerCount = activeTab === "CHIT" ? chitCustomerLength : goldCustomerLength;

    // Helper: show "—" while loading, actual value once loaded
    const displayCount = (val) => (val === null ? "—" : val);
    const displayCommission = (val) => (val === null ? "—" : `₹${formatCommission(val)}`);

    // --- CARD RENDER ---
    const renderEnrolledCustomerCard = ({ item, index }) => {
        const phone = getPhone(item?.user_id);
        const groupName = item?.group_id?.group_name || "N/A";
        const groupValue = item?.group_id?.group_value
            ? Number(item.group_id.group_value).toLocaleString("en-IN")
            : null;
        const commission = item?.calculated_commission || "₹0";

        return (
            <TapGestureHandler numberOfTaps={2} onActivated={() => sendWhatsappMessage(item)}>
                <Pressable onPress={() => openDialer(item)} style={styles.listCard}>

                    {/* Card Header */}
                    <View style={styles.listHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {item?.user_id?.full_name?.charAt(0)?.toUpperCase() || "U"}
                            </Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.clientName} numberOfLines={1}>
                                {item?.user_id?.full_name || "No User Name"}
                            </Text>
                            <Text style={styles.dateSmall}>
                                Enrolled: {formatDate(item.createdAt)}
                            </Text>
                            {phone ? (
                                <TouchableOpacity
                                    style={styles.contactRow}
                                    onPress={() => openDialer(item)}
                                >
                                    <Feather name="phone" size={11} color={C.bgBlue} />
                                    <Text style={styles.contactText}> {phone}</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Commission Pill */}
                        <View style={styles.amountPill}>
                            <Text style={styles.amountLabel}>Commission</Text>
                            <Text style={styles.amountText}>{commission}</Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Group Info Row */}
                    <View style={styles.groupInfoRow}>
                        <View style={styles.groupInfoItem}>
                            <MaterialCommunityIcons name="file-document-outline" size={12} color={C.muted} />
                            <View style={{ marginLeft: 5 }}>
                                <Text style={styles.groupInfoLabel}>Group</Text>
                                <Text style={styles.groupInfoValue} numberOfLines={1}>{groupName}</Text>
                            </View>
                        </View>

                        <View style={styles.actionRow}>
                            {phone && (
                                <TouchableOpacity style={styles.actionBtn} onPress={() => openDialer(item)}>
                                    <Feather name="phone-call" size={12} color={C.bgBlue} />
                                </TouchableOpacity>
                            )}
                            {phone && (
                                <TouchableOpacity style={[styles.actionBtn, { marginLeft: 8 }]} onPress={() => sendWhatsappMessage(item)}>
                                    <MaterialCommunityIcons name="whatsapp" size={12} color={C.success} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {groupValue && (
                            <View style={styles.groupInfoItem}>
                                <MaterialCommunityIcons name="currency-inr" size={12} color={C.muted} />
                                <View style={{ marginLeft: 5 }}>
                                    <Text style={styles.groupInfoLabel}>Chit Value</Text>
                                    <Text style={styles.groupInfoValue}>₹{groupValue}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                </Pressable>
            </TapGestureHandler>
        );
    };

    // --- LIST HEADER ---
    const renderListHeader = () => (
        <View>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                    onPress={() => { setActiveTab("CHIT"); }}
                    activeOpacity={0.85}
                >
                    <MaterialIcons name="groups" size={18} color={activeTab === "CHIT" ? C.white : C.muted} />
                    <Text style={[styles.tabText, activeTab === "CHIT" && styles.activeTabText]}>
                        {/* Show dash while loading, count once loaded */}
                        Chits {isChitLoading && chitCustomerLength === null ? "(—)" : `(${chitCustomerLength ?? 0})`}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
                    onPress={() => { setActiveTab("GOLD"); }}
                    activeOpacity={0.85}
                >
                    <MaterialIcons name="diamond" size={18} color={activeTab === "GOLD" ? C.white : C.muted} />
                    <Text style={[styles.tabText, activeTab === "GOLD" && styles.activeTabText]}>
                        Gold {isGoldLoading && goldCustomerLength === null ? "(—)" : `(${goldCustomerLength ?? 0})`}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Total Commission Card — skeleton while loading */}
            {isLoading ? (
                <SkeletonMainCard />
            ) : (
                <Animated.View style={[styles.mainCard, { opacity: fadeAnim }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardLabel}>Total Expected Commission</Text>
                        <View style={[styles.statusBadge, styles.badgeBlue]}>
                            <Text style={[styles.statusText, { color: C.bgBlue }]}>
                                {activeTab === "CHIT" ? "CHIT" : "GOLD"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressCenter}>
                        <Text style={styles.commissionBigValue}>
                            {displayCommission(totalCommission)}
                        </Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <View style={[styles.statIconSmall, { backgroundColor: "rgba(27, 162, 204, 0.12)" }]}>
                                <MaterialCommunityIcons name="account-group" size={11} color={C.bgBlue} />
                            </View>
                            <View style={{ marginLeft: 6 }}>
                                <Text style={styles.statLabel}>Customers</Text>
                                <Text style={[styles.statValue, { color: C.primary }]}>
                                    {displayCount(customerCount)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statBox}>
                            <View style={[styles.statIconSmall, { backgroundColor: "rgba(247, 12, 180, 0.12)" }]}>
                                <MaterialCommunityIcons name="cash-multiple" size={11} color={C.magenta} />
                            </View>
                            <View style={{ marginLeft: 6 }}>
                                <Text style={styles.statLabel}>Commission</Text>
                                <Text style={[styles.statValue, { color: C.magenta }]}>
                                    {displayCommission(totalCommission)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            )}

            {/* Section Header */}
            {!isLoading && (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Customer List</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{filteredCustomers.length}</Text>
                    </View>
                </View>
            )}
        </View>
    );

    // --- EMPTY / LOADING STATE ---
    const renderListEmpty = () => {
        if (isLoading) {
            // Skeleton cards instead of spinner
            return (
                <View>
                    {/* Section header skeleton */}
                    <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                        <SkeletonBox width={110} height={16} borderRadius={6} />
                        <SkeletonBox width={28} height={22} borderRadius={10} style={{ marginLeft: 10 }} />
                    </View>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </View>
            );
        }
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="database-off-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.noDataText}>
                    {activeTab === "CHIT"
                        ? "No CHIT commissions yet. Start enrolling!"
                        : "No GOLD commissions yet. Start enrolling!"}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />

            {/* Background layers */}
            <Image source={backgroundImage} style={styles.bgOverlay} blurRadius={12} />
            <LinearGradient
                colors={["rgba(26, 162, 204, 0.9)", C.primary]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTopRow}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.iconCircle}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={24} color={C.primary} />
                            </TouchableOpacity>
                            <View style={styles.refreshBtn}>
                                <MaterialCommunityIcons name="cash-check" size={20} color={C.primary} />
                            </View>
                        </View>
                        <Text style={styles.headerTitle}>Expected Commissions</Text>
                        <Text style={styles.headerSubTitle}>View your estimated earnings</Text>
                    </View>

                    {/* White content area with rounded top */}
                    <View style={styles.contentContainer}>
                        <FlatList
                            data={isLoading ? [] : filteredCustomers}
                            keyExtractor={(item, index) => `${activeTab}-${index}`}
                            renderItem={renderEnrolledCustomerCard}
                            ListHeaderComponent={renderListHeader}
                            ListEmptyComponent={renderListEmpty}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        />
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

export default ExpectedCommissions;

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: C.primary },
    bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },

    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 50 : 20,
        paddingBottom: 10,
    },
    headerTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: C.white,
        textAlign: "center",
        marginTop: -2,
    },
    headerSubTitle: {
        fontSize: 13,
        color: "rgba(255,255,255,0.7)",
        textAlign: "center",
        marginTop: 2,
    },
    iconCircle: {
        backgroundColor: C.white,
        padding: 8,
        borderRadius: 12,
        elevation: 4,
    },
    refreshBtn: {
        backgroundColor: C.accent,
        padding: 10,
        borderRadius: 12,
        elevation: 4,
    },

    contentContainer: {
        flex: 1,
        backgroundColor: C.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 20,
        paddingHorizontal: 16,
        marginTop: -4,
    },

    tabContainer: {
        flexDirection: "row",
        backgroundColor: C.subtleBg,
        borderRadius: 14,
        marginBottom: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: C.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        borderRadius: 14,
        gap: 6,
    },
    activeTab: {
        backgroundColor: C.primary,
        elevation: 4,
    },
    tabText: {
        fontSize: 14,
        color: C.muted,
        fontWeight: "700",
    },
    activeTabText: {
        color: C.white,
        fontWeight: "900",
    },

    mainCard: {
        backgroundColor: C.cardBg,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeBlue: { backgroundColor: "rgba(26, 162, 204, 0.12)" },
    statusText: { fontSize: 9, fontWeight: "900", textTransform: "uppercase" },

    progressCenter: { alignItems: "center", marginVertical: 6 },
    commissionBigValue: {
        fontSize: 34,
        fontWeight: "900",
        color: C.primary,
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
    statBox: { flexDirection: "row", alignItems: "center" },
    statIconSmall: { padding: 5, borderRadius: 8 },
    statLabel: { fontSize: 10, color: C.muted, fontWeight: "700" },
    statValue: { fontSize: 13, fontWeight: "900", marginTop: 1 },
    statDivider: { width: 1, height: 24, backgroundColor: C.border },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "900",
        color: C.primary,
        marginRight: 10,
    },
    countBadge: {
        backgroundColor: C.accent,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    countText: { color: C.primary, fontWeight: "900", fontSize: 12 },

    listCard: {
        backgroundColor: C.white,
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: C.border,
    },
    listHeader: { flexDirection: "row", alignItems: "center" },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: C.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: { color: C.white, fontSize: 18, fontWeight: "900" },
    clientName: {
        fontSize: 15,
        fontWeight: "800",
        color: C.primary,
        marginBottom: 2,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    contactText: { fontSize: 12, color: C.bgBlue, fontWeight: "700" },
    dateSmall: {
        fontSize: 11,
        color: C.muted,
        marginTop: 2,
        fontStyle: "italic",
    },
    amountPill: {
        backgroundColor: "rgba(247, 12, 180, 0.08)",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(247, 12, 180, 0.2)",
        alignItems: "center",
        minWidth: 90,
    },
    amountLabel: {
        fontSize: 9,
        color: C.magenta,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    amountText: { fontSize: 13, fontWeight: "900", color: "#f70cb4ff" },

    cardDivider: {
        height: 1,
        backgroundColor: C.border,
        marginVertical: 10,
    },

    groupInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
    },
    groupInfoItem: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        minWidth: 100,
    },
    groupInfoLabel: {
        fontSize: 9,
        color: C.muted,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    groupInfoValue: {
        fontSize: 12,
        color: C.primary,
        fontWeight: "800",
        marginTop: 1,
    },

    actionRow: { flexDirection: "row", alignItems: "center" },
    actionBtn: {
        backgroundColor: C.subtleBg,
        padding: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.border,
    },

    emptyContainer: { alignItems: "center", marginTop: 40, opacity: 0.7 },
    noDataText: {
        color: C.muted,
        textAlign: "center",
        marginTop: 12,
        fontSize: 15,
        fontWeight: "600",
    },
});