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
    Keyboard,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import url from "../constants/baseUrl";

const { width, height } = Dimensions.get("window");

// --- THEME CONSTANTS ---
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

// Asset for background (Ensure this path exists or change to a valid path)
const backgroundImage = require("../assets/hero1.jpg"); 

// =================================================================
// COMPONENT: OutstandingReportCard (Stylized)
// =================================================================
const OutstandingReportCard = ({ item, index, activeCallId, setActiveCallId }) => {
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
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

    const name = item?.user_id?.full_name || "Unknown Client";
    const phone = item?.user_id?.phone_number;
    const groupName = item?.group_id?.group_name || "N/A";
    
    // --- TICKET DATA EXTRACTION ---
    const ticketNumber = item?.tickets || "N/A"; // The specific ticket number (e.g., 3, 12)
    const ticketCount = item?.no_of_tickets || 0; // How many tickets they hold

    const isCalling = activeCallId === item?._id;

    const totalPayable = item?.total_to_be_paid?.[0] || item?.total_to_be_paid || 0;
    const totalPaidAmount = item?.overall_payments?.sum_of_amounts || 0;
    const balance = item?.balance || item?.Balance || 0;
    const balanceStatusColor = balance > 0 ? COLORS.danger : COLORS.success;

    const handlePhonePress = () => {
        if (phone) {
            setActiveCallId(item?._id);
            Linking.openURL(`tel:${phone}`).catch(() => console.log("Call failed"));
            setTimeout(() => setActiveCallId(null), 3000);
        }
    };

    const toggleDetails = () => {
        setIsDetailsVisible(!isDetailsVisible);
    };

    return (
        <Animated.View style={[styles.listCard, { opacity: fadeAnim }]}>
            <View style={styles.listHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 }}>
                        <Text style={styles.clientName} numberOfLines={1}>{name}</Text>
                        
                        {/* Ticket Badge */}
                        <View style={styles.ticketBadge}>
                            <Text style={styles.ticketBadgeText}>Ticket {ticketNumber}</Text>
                        </View>
                    </View>
                    
                    <View style={[styles.rowCenter, { marginTop: 4 }]}>
                        <Ionicons name="layers-outline" size={12} color={COLORS.muted} />
                        <Text style={styles.subText}> {groupName}</Text>
                        
                    </View>
                </View>
                
                {phone && (
                    <TouchableOpacity 
                        onPress={handlePhonePress} 
                        style={[styles.callBtnSmall, { backgroundColor: isCalling ? COLORS.muted : COLORS.bgBlue }]}
                    >
                        <Feather name={isCalling ? "phone-missed" : "phone"} size={14} color={COLORS.white} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Balance Section */}
            <View style={styles.balanceContainer}>
                <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Outstanding Balance</Text>
                    <Text style={[styles.balanceAmount, { color: balanceStatusColor }]}>
                        ₹{balance.toLocaleString("en-IN")}
                    </Text>
                </View>
            </View>

            {/* Toggle Button */}
            <TouchableOpacity onPress={toggleDetails} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>
                    {isDetailsVisible ? "Hide Details" : "View Breakdown"}
                </Text>
                <Feather 
                    name={isDetailsVisible ? "chevron-up" : "chevron-down"} 
                    size={14} 
                    color={COLORS.primary} 
                />
            </TouchableOpacity>

            {/* Collapsible Details */}
            {isDetailsVisible && (
                <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Payable</Text>
                        <Text style={styles.detailValue}>₹{Number(totalPayable).toLocaleString("en-IN")}</Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Paid</Text>
                        <Text style={[styles.detailValue, {color: COLORS.success}]}>₹{Number(totalPaidAmount).toLocaleString("en-IN")}</Text>
                    </View>
                </View>
            )}
        </Animated.View>
    );
};

// =================================================================
// MAIN COMPONENT: OutstandingReports
// =================================================================
const OutstandingReports = ({ route, navigation }) => {
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
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // --- LOGS START ---
                console.log("------------------------------------------------");
                console.log("Fetching data for User ID:", user?.userId);

                const groupRes = await fetch(`${url}/group/get-group`);
                const dueRes = await fetch(`${url}/enroll/due/routes/agent/${user?.userId}`);
                
                const groupJson = await groupRes.json();
                const dueJson = await dueRes.json();

                // Console logs to verify data in terminal
                console.log("Group API Response Status:", groupRes.status);
                console.log("Due API Response Status:", dueRes.status);
                console.log("Parsed Groups Count:", Array.isArray(groupJson?.data) ? groupJson.data.length : 0);
                console.log("Parsed Dues Count:", dueJson?.enrollments?.length || 0);
                console.log("------------------------------------------------");

                const allGroups = Array.isArray(groupJson?.data) ? groupJson.data : Array.isArray(groupJson) ? groupJson : [];
                const allDues = dueJson?.enrollments || [];

                setGroups([{ _id: "all", group_name: "All Groups" }, ...allGroups]);
                setDues(allDues);
                setFilteredData(allDues);
                
                // Trigger entrance animation
                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter Logic
    const applyFilter = (group) => {
        setSelectedGroup(group);
        if (group._id === "all") setFilteredData(dues);
        else setFilteredData(dues.filter((item) => item.group_id?._id === group._id));
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
                        <TouchableOpacity onPress={() => fetchData()} style={styles.refreshBtn}>
                            <Feather name="refresh-cw" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerTitle}>Customer Collection Outstanding Report</Text>
                    <Text style={styles.headerSub}>Manage pending dues efficiently</Text>
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
                                        <MaterialCommunityIcons name="cash-multiple" size={24} color={COLORS.white} />
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
                                    <OutstandingReportCard 
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
                                    <Text style={styles.emptyText}>No outstanding reports found.</Text>
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

export default OutstandingReports;

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
    headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: 0.5, textAlign:'center' },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 , textAlign:'center'},
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
    clientName: { fontSize: 16, fontWeight: '800', color: COLORS.primary, flex: 1 },
    
    // New Ticket Styles
    ticketBadge: {
        backgroundColor: '#E8F4F8',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.bgBlue
    },
    ticketBadgeText: {
        color: COLORS.bgBlue,
        fontWeight: '800',
        fontSize: 10
    },
    
    subText: { fontSize: 12, color: COLORS.muted, fontWeight: '500' },
    rowCenter: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    dotSeparator: { marginHorizontal: 5, color: COLORS.muted, fontSize: 8 },
    callBtnSmall: { padding: 8, borderRadius: 10 },

    // Balance
    balanceContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8
    },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
    balanceAmount: { fontSize: 18, fontWeight: '900' },

    // Details
    toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, marginTop: 4 },
    toggleText: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginRight: 5 },
    
    detailsGrid: { 
        marginTop: 12, 
        paddingTop: 12, 
        borderTopWidth: 1, 
        borderTopColor: '#eee', 
        flexDirection: 'row', 
        justifyContent: 'space-between' 
    },
    detailItem: { alignItems: 'center', flex: 1 },
    detailDivider: { width: 1, height: '100%', backgroundColor: '#eee' },
    detailLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
    detailValue: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginTop: 2 },

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