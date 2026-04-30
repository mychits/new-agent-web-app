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

const COLORS = {
    primary: "#183A5D",
    accent: "#f8c009ff", 
    bgBlue: "#1aa2ccff",
    success: "#27AE60",
    danger: "#e74c3c",
    cardBg: "rgba(255, 255, 255, 0.97)",
    white: "#FFFFFF",
    muted: "#8898AA",
    background: "#0f172a",
};

const backgroundImage = require("../assets/hero1.jpg");

const ReferredReportCard = ({ item, index, activeCallId, setActiveCallId }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, []);

    const name = item?.user?.full_name || item?.user_id?.full_name || "Unknown Client";
    const email = item?.user?.email || item?.user_id?.email;
    const phone = item?.user?.phone_number || item?.user_id?.phone_number;
    const groupName = item?.group?.group_name || item?.group_id?.group_name || "N/A";
    const tickets = item?.tickets || "0";
    
    const isCalling = activeCallId === item?._id;
    const paidAmount = item?.paid_amount || 0;
    const totalPayable = item?.total_to_be_paid || 0;
    const balance = item?.balance || 0;

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
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.clientName}>{name}</Text>
                    <View style={styles.rowCenter}>
                        <Ionicons name="layers-outline" size={11} color={COLORS.muted} />
                        <Text style={styles.subText}> {groupName}</Text>
                        <View style={styles.ticketBadgeMini}>
                            <Text style={styles.ticketBadgeText}>Ticket: {tickets}</Text>
                        </View>
                    </View>
                   
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                </View>
            </View>

            <View style={[styles.balanceContainer, { borderLeftColor: statusColor }]}>
                <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={[styles.balanceAmount, { color: statusColor }]}>
                        ₹{balance.toLocaleString("en-IN")}
                    </Text>
                </View>
            </View>

            <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Paid</Text>
                    <Text style={styles.detailValue}>₹{Number(paidAmount).toLocaleString("en-IN")}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Payable</Text>
                    <Text style={[styles.detailValue, {color: COLORS.success}]}>₹{Number(totalPayable).toLocaleString("en-IN")}</Text>
                </View>
            </View>

            {phone && (
                <TouchableOpacity 
                    onPress={handlePhonePress} 
                    style={[styles.actionButton, { backgroundColor: isCalling ? COLORS.muted : COLORS.bgBlue }]}
                >
                    <Feather name={isCalling ? "phone-missed" : "phone-call"} size={12} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>
                        {isCalling ? "Calling..." : "Contact Client"}
                    </Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const ReferredReport = ({ route, navigation }) => {
    const { user } = route.params || {};
    const [groups, setGroups] = useState([]);
    const [dues, setDues] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState({ _id: "all", group_name: "All Groups" });
    const [loading, setLoading] = useState(true);
    const [activeCallId, setActiveCallId] = useState(null);
    const [showPicker, setShowPicker] = useState(false);

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

    const fetchData = async () => {
        if (!user?.userId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const groupRes = await fetch(`${url}/group/get-group`);
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
            console.error("Error fetching reports:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.userId]);

    const applyFilter = (group) => {
        setSelectedGroup(group);
        if (group._id === "all") setFilteredData(dues);
        else setFilteredData(dues.filter((item) => item.group_id?._id === group._id || item.group?._id === group._id));
        setShowPicker(false);
    };

    const totalPending = filteredData.reduce((sum, item) => sum + (item?.balance || 0), 0);

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <Image source={backgroundImage} style={styles.bgOverlay} blurRadius={10} />
            <LinearGradient colors={["rgba(26, 162, 204, 0.9)", COLORS.primary]} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                            <Feather name="refresh-cw" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerTitle}>Outstanding Report</Text>
                    <Text style={styles.headerSub}>Track your referral dues</Text>
                </View>

                <View style={styles.contentContainer}>
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="small" color={COLORS.accent} />
                            <Text style={styles.loadingText}>Fetching Data...</Text>
                        </View>
                    ) : (
                        <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
                            <View style={styles.summaryCard}>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryIconBg}>
                                        <MaterialCommunityIcons name="account-cash" size={20} color={COLORS.white} />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryLabel}>Total Outstanding</Text>
                                        <Text style={styles.summaryValue}>₹{totalPending.toLocaleString("en-IN")}</Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.filterBtn} onPress={() => setShowPicker(true)}>
                                <View style={styles.filterContent}>
                                    <Ionicons name="filter" size={14} color={COLORS.primary} />
                                    <Text style={styles.filterText}>Filter: {selectedGroup.group_name}</Text>
                                </View>
                                <Animated.View style={{ opacity: blinkAnim }}>
                                    <Feather name="chevron-down" size={16} color={COLORS.primary} />
                                </Animated.View>
                            </TouchableOpacity>

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
                                    <MaterialCommunityIcons name="folder-open-outline" size={40} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.emptyText}>No reports found.</Text>
                                </View>
                            )}
                        </Animated.ScrollView>
                    )}
                </View>
            </SafeAreaView>

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
                                        <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
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
    header: { 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === "android" ? 40 : 15, 
        paddingBottom: 10,
        alignItems: "center"
    },
    headerTopRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 10 },
    headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: 0.4, textAlign:'center' },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2, textAlign:'center' },
    iconCircle: { backgroundColor: "#fff", padding: 5, borderRadius: 10 },
    refreshBtn: { backgroundColor: COLORS.accent, padding: 6, borderRadius: 10 },
    contentContainer: { paddingHorizontal: 16, flex: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: COLORS.white, marginTop: 6, fontWeight: '600', opacity: 0.8, fontSize: 13 },
    summaryCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 14,
        padding: 15,
        marginBottom: 12,
        borderLeftWidth: 5,
        borderLeftColor: COLORS.accent,
        elevation: 4,
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryIconBg: { 
        backgroundColor: COLORS.primary, 
        width: 38, height: 38, borderRadius: 10, 
        justifyContent: 'center', alignItems: 'center', 
        marginRight: 12 
    },
    summaryLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '700', textTransform: 'uppercase' },
    summaryValue: { fontSize: 22, fontWeight: '900', color:'red', marginTop: 1 },
    filterBtn: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterContent: { flexDirection: 'row', alignItems: 'center' },
    filterText: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginLeft: 6 },
    listCard: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        elevation: 2,
    },
    listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bgBlue, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 14, fontWeight: '900' },
    clientName: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
    subText: { fontSize: 11, color: COLORS.muted, fontWeight: '500' },
    rowCenter: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
    ticketBadgeMini: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        marginLeft: 6,
    },
    ticketBadgeText: { fontSize: 9, fontWeight: 'bold', color: COLORS.primary },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
    statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    balanceContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
        borderLeftWidth: 3
    },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
    balanceAmount: { fontSize: 16, fontWeight: '900' },
    detailsGrid: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTopWidth: 1, 
        borderTopColor: '#f0f0f0', 
    },
    detailItem: { alignItems: 'center', flex: 1 },
    detailValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
    detailLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '600' },
    detailDivider: { width: 1, height: '80%', backgroundColor: '#eee', alignSelf:'center' },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 8,
        marginTop: 4,
    },
    actionButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 12, marginLeft: 6 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    emptyText: { color: 'rgba(255,255,255,0.7)', marginTop: 8, fontWeight: '600', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    pickerSheet: { 
        backgroundColor: "#fff", 
        padding: 15, 
        borderTopLeftRadius: 25, 
        borderTopRightRadius: 25, 
        paddingBottom: 25 
    },
    sheetHandle: { width: 30, height: 4, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 12 },
    sheetTitle: { fontSize: 16, fontWeight: "900", marginBottom: 12, color: COLORS.primary, textAlign: 'center' },
    pickerOption: { 
        padding: 12, 
        borderRadius: 10, 
        marginBottom: 6, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#F5F7FA' 
    },
    activeOption: { backgroundColor: COLORS.primary + '10', borderWidth: 1, borderColor: COLORS.accent },
    pickerOptionText: { fontSize: 13, fontWeight: '600', color: '#444' },
    activeText: { color: COLORS.primary, fontWeight: '800' }
});