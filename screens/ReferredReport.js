import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Platform,
    Animated,
    Image,
    TouchableOpacity,
    Modal,
    StatusBar,
    ScrollView,
    Dimensions,
    Linking,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import url from "../constants/baseUrl";

const { width, height } = Dimensions.get("window");

// --- THEME CONSTANTS (Matching OutstandingReports.js) ---
const COLORS = {
    primary: "#183A5D",
    accent: "#f8c009ff", // Gold
    bgBlue: "#1aa2ccff",
    success: "#27AE60",
    danger: "#e74c3c",
    cardBg: "rgba(255, 255, 255, 0.97)",
    white: "#FFFFFF",
    muted: "#8898AA",
    background: "#0f172a", // Dark fallback
};

// Asset for background (Ensure this path exists or use a fallback)
const backgroundImage = require("../assets/hero1.jpg"); 

// =================================================================
// COMPONENT: ReferredReportCard (Stylized)
// =================================================================
const ReferredReportCard = ({ item, index, activeCallId, setActiveCallId }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Entrance animation
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100, // Stagger effect
            useNativeDriver: true,
        }).start();
    }, []);

    const name = item?.user?.full_name || item?.user_id?.full_name || "Unknown Client";
    const email = item?.user?.email || item?.user_id?.email;
    const phone = item?.user?.phone_number || item?.user_id?.phone_number;
    const groupName = item?.group?.group_name || item?.group_id?.group_name || "N/A";
    
    const isCalling = activeCallId === item?._id;

    // Financials
    const getFinancialValue = (value) =>
        Array.isArray(value) && value.length > 0 ? value[0] : value || 0;

    const totalPayable = getFinancialValue(item.total_payable_amount);
    const totalToBePaid = item?.total_to_be_paid || 0;
    const balance = item?.balance || item?.Balance || 0;

    const statusColor = balance > 0 ? COLORS.danger : COLORS.success;
    const statusText = balance > 0 ? "Outstanding" : "Paid Off";

    const handlePhonePress = () => {
        if (phone) {
            setActiveCallId(item?._id);
            Linking.openURL(`tel:${phone}`).catch(() => console.log("Call failed"));
            setTimeout(() => setActiveCallId(null), 3000);
        }
    };

    return (
        <Animated.View style={[styles.listCard, { opacity: fadeAnim }]}>
            <View style={styles.listHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.clientName}>{name}</Text>
                    <View style={styles.rowCenter}>
                        <Ionicons name="layers-outline" size={12} color={COLORS.muted} />
                        <Text style={styles.subText}> {groupName}</Text>
                    </View>
                    {email && (
                        <View style={[styles.rowCenter, { marginTop: 2 }]}>
                            <Ionicons name="mail-outline" size={12} color={COLORS.muted} />
                            <Text style={styles.subText}> {email}</Text>
                        </View>
                    )}
                </View>
                
                {/* Status Tag */}
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                </View>
            </View>

            {/* Balance Section */}
            <View style={[styles.balanceContainer, { borderLeftColor: statusColor }]}>
                <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={[styles.balanceAmount, { color: statusColor }]}>
                        ₹{balance.toLocaleString("en-IN")}
                    </Text>
                </View>
            </View>

            {/* Financial Details Grid */}
            <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Paid</Text>
                    <Text style={styles.detailValue}>₹{Number(totalToBePaid).toLocaleString("en-IN")}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Payable</Text>
                    <Text style={[styles.detailValue, {color: COLORS.success}]}>₹{Number(totalPayable).toLocaleString("en-IN")}</Text>
                </View>
            </View>

            {/* Action Button */}
            {phone && (
                <TouchableOpacity 
                    onPress={handlePhonePress} 
                    style={[styles.actionButton, { backgroundColor: isCalling ? COLORS.muted : COLORS.bgBlue }]}
                >
                    <Feather name={isCalling ? "phone-missed" : "phone-call"} size={14} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>
                        {isCalling ? "Calling..." : "Contact Client"}
                    </Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

// =================================================================
// MAIN COMPONENT: ReferredReport
// =================================================================
const ReferredReport = ({ route, navigation }) => {
    const { user } = route.params || {};
    const [groups, setGroups] = useState([]);
    const [dues, setDues] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState({ _id: "all", group_name: "All Groups" });
    const [loading, setLoading] = useState(true);
    const [activeCallId, setActiveCallId] = useState(null);
    const [showPicker, setShowPicker] = useState(false);

    // Animation Refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const blinkAnim = useRef(new Animated.Value(1)).current;

    // Blinking Animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Fetch Data
    const fetchData = async () => {
        if (!user?.userId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const groupRes = await fetch(`${url}/group/get-group`);
            // Note: Using the updated DUE_API from your provided code
            const dueRes = await fetch(`${url}/enroll/due/referral-agent/${user.userId}`);
            
            const groupJson = await groupRes.json();
            const dueJson = await dueRes.json();

            const allGroups = Array.isArray(groupJson?.data) ? groupJson.data : Array.isArray(groupJson) ? groupJson : [];
            const allDues = dueJson?.enrollments || [];

            setGroups([{ _id: "all", group_name: "All Groups" }, ...allGroups]);
            setDues(allDues);
            setFilteredData(allDues);
            
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        } catch (err) {
            console.error("Error fetching referred reports:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.userId]);

    // Filter Logic
    const applyFilter = (group) => {
        setSelectedGroup(group);
        if (group._id === "all") setFilteredData(dues);
        else setFilteredData(dues.filter((item) => item.group_id?._id === group._id || item.group?._id === group._id));
        setShowPicker(false);
    };

    const totalPending = filteredData.reduce((sum, item) => sum + (item?.balance || item?.Balance || 0), 0);

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            
            {/* Background Styling */}
            <Image source={backgroundImage} style={styles.bgOverlay} blurRadius={10} />
            <LinearGradient colors={["rgba(26, 162, 204, 0.9)", COLORS.primary]} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                            <Feather name="refresh-cw" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerTitle}>Referred Report</Text>
                    <Text style={styles.headerSub}>Track your referral dues</Text>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={COLORS.accent} />
                            <Text style={styles.loadingText}>Fetching Data...</Text>
                        </View>
                    ) : (
                        <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
                            
                            {/* Summary Card */}
                            <View style={styles.summaryCard}>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryIconBg}>
                                        <MaterialCommunityIcons name="account-cash" size={24} color={COLORS.white} />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryLabel}>Total Outstanding</Text>
                                        <Text style={styles.summaryValue}>₹{totalPending.toLocaleString("en-IN")}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Filter Button */}
                            <TouchableOpacity style={styles.filterBtn} onPress={() => setShowPicker(true)}>
                                <View style={styles.filterContent}>
                                    <Ionicons name="filter" size={16} color={COLORS.primary} />
                                    <Text style={styles.filterText}>Filter: {selectedGroup.group_name}</Text>
                                </View>
                                <Animated.View style={{ opacity: blinkAnim }}>
                                    <Feather name="chevron-down" size={18} color={COLORS.primary} />
                                </Animated.View>
                            </TouchableOpacity>

                            {/* List */}
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <ReferredReportCard 
                                        key={item._id || index} 
                                        item={item} 
                                        index={index}
                                        activeCallId={activeCallId}
                                        setActiveCallId={setActiveCallId}
                                    />
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="folder-open-outline" size={50} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.emptyText}>No referred reports found.</Text>
                                </View>
                            )}

                        </Animated.ScrollView>
                    )}
                </View>
            </SafeAreaView>

            {/* Bottom Sheet Modal for Group Selection */}
            <Modal visible={showPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPicker(false)} />
                    <View style={styles.pickerSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Select Group</Text>
                        
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.4 }}>
                            {groups.map((g) => (
                                <TouchableOpacity 
                                    key={g._id} 
                                    style={[styles.pickerOption, selectedGroup._id === g._id && styles.activeOption]} 
                                    onPress={() => applyFilter(g)}
                                >
                                    <Text style={[styles.pickerOptionText, selectedGroup._id === g._id && styles.activeText]}>
                                        {g.group_name}
                                    </Text>
                                    {selectedGroup._id === g._id && (
                                        <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ReferredReport;

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: COLORS.primary },
    bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
    
    // Header
    header: { 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === "android" ? 50 : 20, 
        paddingBottom: 15,
        alignItems: "center"
    },
    headerTopRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 15 },
    headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: 0.5 },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
    iconCircle: { backgroundColor: "#fff", padding: 6, borderRadius: 12 },
    refreshBtn: { backgroundColor: COLORS.accent, padding: 8, borderRadius: 12 },
    
    // Content
    contentContainer: { paddingHorizontal: 16, flex: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: COLORS.white, marginTop: 8, fontWeight: '600', opacity: 0.8 },

    // Summary
    summaryCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 18,
        padding: 20,
        marginBottom: 15,
        borderLeftWidth: 6,
        borderLeftColor: COLORS.accent,
        elevation: 6,
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryIconBg: { 
        backgroundColor: COLORS.primary, 
        width: 48, height: 48, borderRadius: 14, 
        justifyContent: 'center', alignItems: 'center', 
        marginRight: 15 
    },
    summaryLabel: { fontSize: 13, color: COLORS.muted, fontWeight: '700', textTransform: 'uppercase' },
    summaryValue: { fontSize: 26, fontWeight: '900', color: COLORS.primary, marginTop: 2 },

    // Filter
    filterBtn: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 14,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    filterContent: { flexDirection: 'row', alignItems: 'center' },
    filterText: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginLeft: 8 },

    // Cards
    listCard: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
    },
    listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.bgBlue, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    clientName: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
    subText: { fontSize: 12, color: COLORS.muted, fontWeight: '500' },
    rowCenter: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    
    // Status
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

    // Balance
    balanceContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
        borderLeftWidth: 4
    },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
    balanceAmount: { fontSize: 18, fontWeight: '900' },

    // Details
    detailsGrid: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderTopWidth: 1, 
        borderTopColor: '#eee', 
    },
    detailItem: { alignItems: 'center', flex: 1 },
    detailDivider: { width: 1, height: '100%', backgroundColor: '#eee' },
    detailLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
    detailValue: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginTop: 2 },

    // Action Button
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 10,
        marginTop: 8,
    },
    actionButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 13, marginLeft: 8 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    pickerSheet: { 
        backgroundColor: "#fff", 
        padding: 20, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30, 
        paddingBottom: 30 
    },
    sheetHandle: { width: 35, height: 4, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 15 },
    sheetTitle: { fontSize: 18, fontWeight: "900", marginBottom: 15, color: COLORS.primary, textAlign: 'center' },
    pickerOption: { 
        padding: 15, 
        borderRadius: 12, 
        marginBottom: 8, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#F5F7FA' 
    },
    activeOption: { backgroundColor: 'rgba(248, 192, 9, 0.15)' },
    pickerOptionText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
    activeText: { color: COLORS.primary, fontWeight: '800' },

    // Empty
    emptyContainer: { alignItems: 'center', marginTop: 50, padding: 20 },
    emptyText: { color: "rgba(255,255,255,0.8)", marginTop: 10, fontSize: 16, fontWeight: '600', textAlign: 'center' }
});