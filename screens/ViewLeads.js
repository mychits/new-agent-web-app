
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    TextInput,
    Platform,
    Dimensions,
    KeyboardAvoidingView,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import moment from "moment";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const noImage = require("../assets/no.png");

// Get dimensions for dynamic styling
const { height, width } = Dimensions.get('window');

// --- MODERN COLOR PALETTE ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#1e293b"; // Dark Slate
const ACCENT_BLUE = "#3b82f6"; 
const ACCENT_GREEN = "#10b981";
const WARNING_ORANGE = "#f59e0b";
const NEUTRAL_GREY = "#94a3b8";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f1f5f9'; 

// --- BUTTON GRADIENTS ---
const CALL_GRADIENT = ['#fbbf24', '#d97706']; // Gold to Orange
const WHATSAPP_GRADIENT = ['#34d399', '#059669']; // Emerald to Green
const EDIT_GRADIENT = ['#60a5fa', '#2563eb']; // Blue to Dark Blue

const ViewLeads = ({ route, navigation }) => {
    const { user } = route.params;

    const [currentDate, setCurrentDate] = useState("");
    const [chitLeads, setChitLeads] = useState([]);
    const [goldLeads, setGoldLeads] = useState([]);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [chitLoaded, setChitLoaded] = useState(false);
    const [goldLoaded, setGoldLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [expandedLeadId, setExpandedLeadId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState(moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
    const [filterText, setFilterText] = useState("Last Month");

    useEffect(() => {
        setCurrentDate(moment().format("DD-MM-YYYY"));
    }, []);

    const fetchData = useCallback(async (start, end) => {
        fetchChitLeads(start, end);
        fetchGoldLeads(start, end);
    }, []);

    const fetchChitLeads = async (startDate, endDate) => {
        setIsChitLoading(true);
        setChitLoaded(false);
        try {
            const response = await axios.get(
                `${baseUrl}/lead/agent/${user.userId}/records`,
                { params: { start_date: startDate, end_date: endDate } }
            );
            setChitLeads(response.data);
        } catch (error) {
            console.error("Error fetching chit leads data:", error);
            setChitLeads([]);
        } finally {
            setIsChitLoading(false);
            setChitLoaded(true);
        }
    };

    const fetchGoldLeads = async (startDate, endDate) => {
        setIsGoldLoading(true);
        setGoldLoaded(false);
        try {
            const response = await axios.get(
                `${goldBaseUrl}/lead/agent/${user.userId}/records`,
                { params: { start_date: startDate, end_date: endDate } }
            );
            setGoldLeads(response.data);
        } catch (error) {
            console.error("Error fetching gold leads data:", error);
            setGoldLeads([]);
        } finally {
            setIsGoldLoading(false);
            setGoldLoaded(true);
        }
    };

    useEffect(() => {
        fetchData(startDate, endDate);
    }, [startDate, endDate, fetchData]);

    useFocusEffect(
        useCallback(() => {
            fetchData(startDate, endDate);
        }, [startDate, endDate, fetchData])
    );

    const handleCall = (phoneNumber) => {
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleWhatsApp = (phoneNumber) => {
        Linking.openURL(`whatsapp://send?phone=${phoneNumber}`);
    };

    const handleEditLead = (lead) => {
        navigation.navigate("EditLead", { user: user, lead: lead });
    };

    const toggleExpand = (id) => {
        setExpandedLeadId(expandedLeadId === id ? null : id);
    };

    const isFreshLead = (createdAt) => {
        const leadDate = moment(createdAt);
        return leadDate.isSame(moment(), "day");
    };

    const isNewLead = (createdAt) => {
        const leadDate = moment(createdAt);
        const tenDaysAgo = moment().subtract(10, "days").startOf("day");
        return leadDate.isAfter(tenDaysAgo) && !isFreshLead(createdAt);
    };

    const handleDateRangeSelect = (range) => {
        let newStartDate, newEndDate;
        switch (range) {
            case "All": newStartDate = ""; newEndDate = ""; break;
            case "Today": newStartDate = moment().format('YYYY-MM-DD'); newEndDate = moment().format('YYYY-MM-DD'); break;
            case "Yesterday": newStartDate = moment().subtract(1, 'day').format('YYYY-MM-DD'); newEndDate = moment().subtract(1, 'day').format('YYYY-MM-DD'); break;
            case "This Week": newStartDate = moment().startOf('isoWeek').format('YYYY-MM-DD'); newEndDate = moment().endOf('isoWeek').format('YYYY-MM-DD'); break;
            case "Last Week": newStartDate = moment().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD'); newEndDate = moment().subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD'); break;
            case "This Month": newStartDate = moment().startOf('month').format('YYYY-MM-DD'); newEndDate = moment().endOf('month').format('YYYY-MM-DD'); break;
            case "Last Month": newStartDate = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'); newEndDate = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'); break;
            case "This Year": newStartDate = moment().startOf('year').format('YYYY-MM-DD'); newEndDate = moment().endOf('year').format('YYYY-MM-DD'); break;
            case "Last Year": newStartDate = moment().subtract(1, 'year').startOf('year').format('YYYY-MM-DD'); newEndDate = moment().subtract(1, 'year').endOf('year').format('YYYY-MM-DD'); break;
            default: break;
        }
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        setFilterText(range);
        setModalVisible(false);
    };

    const searchFilterFunction = (text) => {
        setSearchQuery(text);
    };

    const renderLeadCard = ({ item }) => {
        const isExpanded = expandedLeadId === item._id;
        const freshLead = isFreshLead(item.createdAt);
        const newLead = isNewLead(item.createdAt);
        
        let statusColor = ACCENT_BLUE;
        let badgeText = "LEAD";
        let gradientColor = ['#cbd5e1', '#94a3b8']; // Grey default

        if (freshLead) {
            statusColor = ACCENT_GREEN;
            badgeText = "FRESH";
            gradientColor = ['#6ee7b7', '#059669'];
        } else if (newLead) {
            statusColor = WARNING_ORANGE;
            badgeText = "NEW";
            gradientColor = ['#fcd34d', '#f59e0b'];
        }

        const createdDate = moment(item.createdAt).format("DD-MM-YYYY");
        const createdTime = moment(item.createdAt).format("HH:mm");
        const schemeTypeDisplay = item.scheme_type ? item.scheme_type.charAt(0).toUpperCase() + item.scheme_type.slice(1) : "N/A";
        const groupName = item.group_id?.group_name ? item.group_id.group_name : "N/A";

        return (
            <View style={styles.cardContainer}>
                <TouchableOpacity 
                    onPress={() => toggleExpand(item._id)} 
                    activeOpacity={0.95}
                >
                    {/* CARD HEADER: Name & Badge */}
                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {item.lead_name ? item.lead_name.charAt(0).toUpperCase() : "?"}
                                </Text>
                            </View>
                            <View style={styles.titleBlock}>
                                <Text style={styles.customerName}>{item.lead_name || 'No Name'}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                                    <Text style={[styles.statusText, { color: statusColor }]}>{badgeText} LEAD</Text>
                                </View>
                            </View>
                        </View>
                        <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={NEUTRAL_GREY} />
                    </View>

                    {/* CARD BODY: Info & Actions Grid */}
                    <View style={styles.cardBody}>
                        <View style={styles.infoColumn}>
                            {/* Row 1: Group */}
                            <View style={styles.infoRow}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="people" size={16} color={ACCENT_BLUE} />
                                </View>
                                <View style={styles.textGroup}>
                                    <Text style={styles.labelText}>Group</Text>
                                    <Text style={styles.valueText}>{groupName}</Text>
                                </View>
                            </View>
                            
                            {/* Row 2: Scheme */}
                            <View style={styles.infoRow}>
                                <View style={styles.iconBox}>
                                    <MaterialCommunityIcons name="star-four-points" size={16} color={WARNING_ORANGE} />
                                </View>
                                <View style={styles.textGroup}>
                                    <Text style={styles.labelText}>Scheme</Text>
                                    <Text style={styles.valueText}>{schemeTypeDisplay}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.actionsColumn}>
                            {/* Action 1: Call (Aligned with Group) */}
                            <TouchableOpacity 
                                onPress={() => handleCall(item.lead_phone)} 
                                style={styles.fabButton}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={CALL_GRADIENT} style={styles.fabGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                                    <Ionicons name="call" size={18} color="white" />
                                </LinearGradient>
                            </TouchableOpacity>
                            
                            {/* Action 2: WhatsApp (Aligned with Scheme) */}
                            <TouchableOpacity 
                                onPress={() => handleWhatsApp(item.lead_phone)} 
                                style={[styles.fabButton, { marginTop: 20 }]}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={WHATSAPP_GRADIENT} style={styles.fabGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                                    <Icon name="whatsapp" size={20} color="white" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* EXPANDED CONTENT */}
                {isExpanded && (
                    <View style={styles.expandedContainer}>
                        <View style={styles.expandedInner}>
                            <Text style={styles.expandedText}>
                                Created on {createdDate} at {createdTime}
                            </Text>
                            
                            {item.lead_image && (
                                <Image source={{ uri: item.lead_image }} style={styles.leadImage} />
                            )}

                            {freshLead && (
                                <TouchableOpacity
                                    onPress={() => handleEditLead(item)}
                                    style={styles.editButton}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient colors={EDIT_GRADIENT} style={styles.editButtonGradient}>
                                        <Icon name="pencil" size={16} color="white" />
                                        <Text style={styles.editButtonText}>Edit Lead Details</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;
    const dataLoaded = activeTab === "CHIT" ? chitLoaded : goldLoaded;
    const allLeads = activeTab === "CHIT" ? chitLeads : goldLeads;

    const filteredLeads = searchQuery
        ? allLeads.filter((item) => {
            const itemData = `${item.lead_name.toUpperCase()} ${item.lead_phone.toUpperCase()} ${item.group_id?.group_name ? item.group_id.group_name.toUpperCase() : ""}`;
            const textData = searchQuery.toUpperCase();
            return itemData.includes(textData);
        })
        : allLeads;

    const noDataMessage = activeTab === "CHIT" ? "No chit leads found" : "No gold leads found";

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
                <View style={styles.headerSpacer}><Header /></View>

                <View style={styles.titleContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>Leads</Text>
                        <View style={styles.totalCountBadge}>
                            <Text style={styles.totalCountText}>{chitLeads.length + goldLeads.length}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.searchRow}>
                        <View style={styles.searchBarContainer}>
                            <Feather name="search" size={20} color={NEUTRAL_GREY} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchBar}
                                placeholder="Search leads..."
                                placeholderTextColor={NEUTRAL_GREY}
                                onChangeText={searchFilterFunction}
                                value={searchQuery}
                            />
                        </View>
                        <TouchableOpacity style={styles.filterBtn} onPress={() => setModalVisible(true)}>
                            <Feather name="sliders" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === "CHIT" && styles.activeTab]} onPress={() => setActiveTab("CHIT")}>
                        <Text style={[styles.tabText, activeTab === "CHIT" && styles.activeTabText]}>Chit ({chitLeads.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === "GOLD" && styles.activeTab]} onPress={() => setActiveTab("GOLD")}>
                        <Text style={[styles.tabText, activeTab === "GOLD" && styles.activeTabText]}>Gold ({goldLeads.length})</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.mainContentArea}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    {isLoading && <ActivityIndicator size="large" color={ACCENT_BLUE} style={{ marginTop: 30 }} />}
                    {!isLoading && dataLoaded && filteredLeads.length > 0 && (
                        <FlatList
                            data={filteredLeads}
                            keyExtractor={(item, index) => item._id || index.toString()}
                            renderItem={renderLeadCard}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                    {!isLoading && dataLoaded && filteredLeads.length === 0 && (
                        <View style={styles.noDataContainer}>
                            <Image source={noImage} style={styles.noImage} />
                            <Text style={styles.noDataText}>{noDataMessage}</Text>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("AddLead", { user: user })} style={styles.fab}>
                <LinearGradient colors={EDIT_GRADIENT} style={styles.fabGradient}>
                    <Feather name="plus" size={26} color="white" />
                </LinearGradient>
            </TouchableOpacity>

            <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalView} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Filter Leads</Text>
                        {["All", "Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "This Year", "Last Year"].map((range) => (
                            <TouchableOpacity key={range} style={styles.modalOption} onPress={() => handleDateRangeSelect(range)}>
                                <Text style={styles.modalOptionText}>{range}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
    topContainer: { paddingHorizontal: 20, paddingBottom: 10, paddingTop: 10 },
    headerSpacer: { paddingBottom: 5 },
    titleContainer: { alignItems: 'center', marginVertical: 10 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 32, fontWeight: '800', color: 'white', letterSpacing: -1 },
    totalCountBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    totalCountText: { color: 'white', fontWeight: '700', fontSize: 14 },
    
    // Search
    searchRow: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: 10 },
    searchBarContainer: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 48 },
    searchIcon: { marginRight: 10 },
    searchBar: { flex: 1, color: MODERN_PRIMARY, fontSize: 15 },
    filterBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    // Tabs
    tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: 'white' },
    tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
    activeTabText: { color: TOP_GRADIENT[1], fontWeight: '800' },

    // Main Area
    mainContentArea: { flex: 1, backgroundColor: SUBTLE_BG_GREY, paddingHorizontal: 16, paddingTop: 20 },
    listContent: { paddingBottom: 100 },
    
    // --- STYLISH CARD DESIGN ---
    cardContainer: {
        backgroundColor: CARD_BG,
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    avatarText: { fontSize: 20, fontWeight: '800', color: MODERN_PRIMARY },
    titleBlock: { flex: 1 },
    customerName: { fontSize: 20, fontWeight: '800', color: MODERN_PRIMARY, marginBottom: 6 },
    statusBadge: { 
        alignSelf: 'flex-start', 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 8, 
        borderWidth: 1,
        backgroundColor: 'transparent'
    },
    statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

    // Card Body
    cardBody: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        justifyContent: 'space-between',
    },
    infoColumn: { flex: 1, justifyContent: 'space-between' },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, // Spacing between rows
    iconBox: { 
        width: 32, 
        height: 32, 
        borderRadius: 8, 
        backgroundColor: '#f1f5f9', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12 
    },
    textGroup: { justifyContent: 'center' },
    labelText: { fontSize: 11, color: NEUTRAL_GREY, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
    valueText: { fontSize: 15, color: MODERN_PRIMARY, fontWeight: '600' },

    // Actions Column
    actionsColumn: { justifyContent: 'flex-start', alignItems: 'center', width: 60 },
    fabButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    fabGradient: { 
        width: '100%', 
        height: '100%', 
        borderRadius: 24, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },

    // Expanded
    expandedContainer: { backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
    expandedInner: { padding: 20 },
    expandedText: { fontSize: 13, color: NEUTRAL_GREY, marginBottom: 15, fontStyle: 'italic' },
    leadImage: { width: '100%', height: 160, borderRadius: 16, marginBottom: 15 },
    
    editButton: { borderRadius: 12, overflow: 'hidden', shadowColor: ACCENT_BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
    editButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    editButtonText: { color: 'white', fontWeight: '700', fontSize: 15, marginLeft: 8 },

    // Misc
    noDataContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, backgroundColor: CARD_BG, borderRadius: 20, margin: 16 },
    noDataText: { fontSize: 16, color: NEUTRAL_GREY, marginTop: 10, fontWeight: '600' },
    noImage: { width: 120, height: 120, resizeMode: "contain", opacity: 0.6 },
    
    // FAB
    fab: { position: 'absolute', bottom: 30, right: 24, width: 64, height: 64, borderRadius: 32, shadowColor: ACCENT_BLUE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
    
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalView: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, paddingTop: 30 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: MODERN_PRIMARY, marginBottom: 20, textAlign: 'center' },
    modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalOptionText: { fontSize: 16, color: MODERN_PRIMARY, fontWeight: '500', textAlign: 'center' }
});

export default ViewLeads;
