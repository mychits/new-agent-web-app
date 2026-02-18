
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

// --- THEME CONSTANTS ---
const COLORS = {
    primary: "#183A5D",
    accent: "#f8c009ff", // Gold for Profit
    bgBlue: "#1aa2ccff",
    success: "#27AE60",
    danger: "#e74c3c",
    cardBg: "rgba(255, 255, 255, 0.97)",
    white: "#FFFFFF",
    muted: "#8898AA",
    background: "#0f172a",
};

const backgroundImage = require("../assets/hero1.jpg"); 

// =================================================================
// COMPONENT: RMReportCard (Stylized)
// =================================================================
const RMReportCard = ({ item, index, activeCallId, setActiveCallId }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, []);

    const name = item?.user_id?.full_name || "Unknown Client";
    const phone = item?.user_id?.phone_number;
    const email = item?.user_id?.email;
    const groupName = item?.group_id?.group_name || "N/A";
    const paymentType = item?.payment_type || "N/A";

    const isCalling = activeCallId === item?._id;

    // Financial Extraction
    const getFinancialValue = (value) =>
        Array.isArray(value) && value.length > 0 ? value[0] : value || 0;

    const totalPayable = getFinancialValue(item.total_payable_amount);
    const totalProfit = getFinancialValue(item.total_profit); // UNIQUE
    const totalToBePaid = item?.total_to_be_paid || 0;
    const balance = item?.balance || item?.Balance || 0;

    const statusColor = balance > 0 ? COLORS.danger : COLORS.success;

    const handlePhonePress = () => {
        if (phone) {
            setActiveCallId(item?._id);
            Linking.openURL(`tel:${phone}`).catch(() => console.log("Call failed"));
            setTimeout(() => setActiveCallId(null), 3000);
        }
    };

    return (
        <Animated.View style={[styles.listCard, { opacity: fadeAnim }]}>
            {/* Top Section: Client Info & Profit Badge */}
            <View style={styles.cardTopSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.clientName}>{name}</Text>
                    <View style={styles.rowCenter}>
                        <Ionicons name="business-outline" size={12} color={COLORS.muted} />
                        <Text style={styles.subText}> {groupName}</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={[styles.subText, {textTransform: 'capitalize'}]}>{paymentType}</Text>
                    </View>
                </View>
                
                {/* UNIQUE: Profit Tag prominently displayed */}
                <View style={styles.profitTag}>
                    <Text style={styles.profitTagText}>₹{Number(totalProfit).toLocaleString("en-IN")}</Text>
                    <Text style={styles.profitTagLabel}>Profit</Text>
                </View>
            </View>

            {/* Financial Details Grid */}
            <View style={styles.detailsGrid}>
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Payable</Text>
                    <Text style={styles.gridValue}>₹{Number(totalPayable).toLocaleString("en-IN")}</Text>
                </View>
                <View style={styles.gridDivider} />
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Paid</Text>
                    <Text style={[styles.gridValue, {color: COLORS.success}]}>₹{Number(totalToBePaid).toLocaleString("en-IN")}</Text>
                </View>
            </View>

            {/* Balance Section */}
            <View style={[styles.balanceFooter, { borderLeftColor: statusColor }]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={[styles.balanceAmount, { color: statusColor }]}>
                        ₹{balance.toLocaleString("en-IN")}
                    </Text>
                </View>

                {phone && (
                    <TouchableOpacity 
                        onPress={handlePhonePress} 
                        style={[styles.smallActionBtn, { backgroundColor: isCalling ? COLORS.muted : COLORS.bgBlue }]}
                    >
                        <Feather name={isCalling ? "phone-missed" : "phone"} size={14} color={COLORS.white} />
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
};

// =================================================================
// MAIN COMPONENT: RelationshipManagerReport
// =================================================================
const RelationshipManagerReport = ({ route, navigation }) => {
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
            const [groupRes, dueRes] = await Promise.all([
                fetch(`${url}/group/get-group`),
                fetch(`${url}/enroll/due/relationship-manager/${user.userId}`),
            ]);
            
            const groupJson = await groupRes.json();
            const dueJson = await dueRes.json();

            const allGroups = Array.isArray(groupJson?.data) ? groupJson.data : Array.isArray(groupJson) ? groupJson : [];
            const allDues = dueJson?.enrollments || [];

            setGroups([{ _id: "all", group_name: "All Groups" }, ...allGroups]);
            setDues(allDues);
            setFilteredData(allDues);
            
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        } catch (err) {
            console.error("Error fetching RM reports:", err);
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
        else setFilteredData(dues.filter((item) => item.group_id?._id === group._id));
        setShowPicker(false);
    };

    // Calculations
    const totalPending = filteredData.reduce((sum, item) => sum + (item?.balance || item?.Balance || 0), 0);
    
    // UNIQUE: Calculate Total Profit
    const totalProfit = filteredData.reduce((sum, item) => {
        const val = Array.isArray(item.total_profit) && item.total_profit.length > 0 
            ? item.total_profit[0] 
            : item.total_profit || 0;
        return sum + Number(val);
    }, 0);

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            
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
                    <Text style={styles.headerTitle}>RM Performance</Text>
                    <Text style={styles.headerSub}>Relationship Manager Report</Text>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={COLORS.accent} />
                            <Text style={styles.loadingText}>Calculating Metrics...</Text>
                        </View>
                    ) : (
                        <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
                            
                            {/* UNIQUE: Dual Summary Dashboard */}
                            <View style={styles.dualSummaryContainer}>
                                <View style={[styles.summaryBox, { borderLeftColor: COLORS.danger }]}>
                                    <View style={[styles.summaryIconBg, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
                                        <MaterialCommunityIcons name="file-document-minus-outline" size={20} color={COLORS.danger} />
                                    </View>
                                    <Text style={styles.summaryBoxLabel}>Total Outstanding</Text>
                                    <Text style={[styles.summaryBoxValue, { color: COLORS.danger }]}>
                                        ₹{totalPending.toLocaleString("en-IN")}
                                    </Text>
                                </View>

                                <View style={[styles.summaryBox, { borderLeftColor: COLORS.accent }]}>
                                    <View style={[styles.summaryIconBg, { backgroundColor: 'rgba(248, 192, 9, 0.15)' }]}>
                                        <MaterialCommunityIcons name="chart-line-variant" size={20} color={COLORS.accent} />
                                    </View>
                                    <Text style={styles.summaryBoxLabel}>Total Profit</Text>
                                    <Text style={[styles.summaryBoxValue, { color: COLORS.primary }]}>
                                        ₹{totalProfit.toLocaleString("en-IN")}
                                    </Text>
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
                                    <RMReportCard 
                                        key={item._id || index} 
                                        item={item} 
                                        index={index}
                                        activeCallId={activeCallId}
                                        setActiveCallId={setActiveCallId}
                                    />
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="account-off-outline" size={50} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.emptyText}>No RM reports found.</Text>
                                </View>
                            )}

                        </Animated.ScrollView>
                    )}
                </View>
            </SafeAreaView>

            {/* Bottom Sheet Modal */}
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

export default RelationshipManagerReport;

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

    // UNIQUE: Dual Summary
    dualSummaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    summaryBox: {
        width: '48%',
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 14,
        borderLeftWidth: 4,
        elevation: 2,
    },
    summaryIconBg: { 
        width: 36, height: 36, borderRadius: 10, 
        justifyContent: 'center', alignItems: 'center', 
        marginBottom: 10 
    },
    summaryBoxLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '700', textTransform: 'uppercase' },
    summaryBoxValue: { fontSize: 18, fontWeight: '900', marginTop: 2 },

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
    cardTopSection: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 12, 
        paddingBottom: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f0f0f0' 
    },
    avatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    clientName: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
    subText: { fontSize: 12, color: COLORS.muted, fontWeight: '500' },
    rowCenter: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    dotSeparator: { marginHorizontal: 5, color: COLORS.muted },

    // Profit Tag (Unique)
    profitTag: {
        alignItems: 'flex-end',
    },
    profitTagText: { fontSize: 14, fontWeight: '900', color: COLORS.accent },
    profitTagLabel: { fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', fontWeight: '700' },

    // Grid
    detailsGrid: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    gridItem: { alignItems: 'center', flex: 1 },
    gridDivider: { width: 1, height: '100%', backgroundColor: '#eee' },
    gridLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
    gridValue: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginTop: 2 },

    // Footer Balance
    balanceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        borderLeftWidth: 3, // Indicator color set inline
    },
    balanceLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
    balanceAmount: { fontSize: 18, fontWeight: '900' },
    smallActionBtn: { 
        padding: 8, 
        borderRadius: 8, 
        flexDirection: 'row', 
        alignItems: 'center' 
    },

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
