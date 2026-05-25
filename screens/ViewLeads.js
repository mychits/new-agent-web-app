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
    Alert,
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

// --- MODERN COLOR PALETTE ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#1e293b"; 
const ACCENT_BLUE = "#1796d1"; 
const ACCENT_GREEN = "#10b981";
const WARNING_ORANGE = "#f59e0b";
const NEUTRAL_GREY = "#64748b"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f8fafc'; 

// --- BUTTON GRADIENTS ---
const CALL_GRADIENT = ['#fbbf24', '#d97706']; 
const WHATSAPP_GRADIENT = ['#34d399', '#059669']; 
const EDIT_GRADIENT = ['#60a5fa', '#2563eb']; 

// --- HELPER FOR LINKING ---
const handleAction = (type, value) => {
    if (!value) return;

    let url = "";
    if (type === "call") {
      url = `tel:${value}`;
    } else if (type === "whatsapp") {
      const cleanPhone = value.replace(/[^0-9]/g, "");
      url = `whatsapp://send?phone=${cleanPhone}`;
    } else if (type === "email") {
      url = `mailto:${value}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert("Error", `Unable to handle ${type}: ${value}`);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error("An error occurred", err));
};

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
        
        // Styling based on status
        let statusColor = ACCENT_BLUE;
        let statusText = "LEAD";
        let statusBgColor = '#e0f2fe';
        let avatarGradient = ['#93c5fd', '#3b82f6'];

        if (freshLead) {
            statusColor = ACCENT_GREEN;
            statusText = "FRESH";
            statusBgColor = '#dcfce7';
            avatarGradient = ['#6ee7b7', '#10b981'];
        } else if (newLead) {
            statusColor = WARNING_ORANGE;
            statusText = "NEW";
            statusBgColor = '#ffedd5';
            avatarGradient = ['#fbbf24', '#f59e0b'];
        }

        const schemeTypeDisplay = item.scheme_type ? item.scheme_type.charAt(0).toUpperCase() + item.scheme_type.slice(1) : "N/A";
        const groupName = item.group_id?.group_name ? item.group_id.group_name : "N/A";
        
        // Combined Date and Time formatted
        const createdDateTime = moment(item.createdAt).format("DD MMM YYYY, hh:mm A");
        
        // Check for email
        const leadEmail = item.lead_email || item.email;

        return (
            <View style={styles.cardContainer}>
                {/* HEADER: Avatar, Name, Status, Date */}
                <View style={styles.cardHeader}>
                    <View style={[styles.avatarWrapper, { borderColor: statusColor }]}>
                        <LinearGradient colors={avatarGradient} style={styles.avatarGradient}>
                            <Text style={styles.avatarText}>
                                {item.lead_name ? item.lead_name.charAt(0).toUpperCase() : "?"}
                            </Text>
                        </LinearGradient>
                    </View>
                    
                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.customerName} numberOfLines={1}>{item.lead_name || 'No Name'}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusBgColor, borderColor: statusColor }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                            </View>
                        </View>
                        <Text style={styles.subText} numberOfLines={1}>{groupName}</Text>
                    </View>
                </View>

                {/* INFO GRID: Combined Date & Time */}
                <View style={styles.infoGrid}>
                    <InfoItem icon="star-outline" label="Scheme" value={schemeTypeDisplay} />
                    <InfoItem icon="calendar-outline" label="Created" value={createdDateTime} />
                </View>

                {/* ACTIONS: Circular Icon Buttons */}
                <View style={styles.contactActionsRow}>
                    <TouchableOpacity 
                        onPress={() => handleAction("call", item.lead_phone)} 
                        style={styles.actionButton} 
                        activeOpacity={0.7}
                    >
                        <Ionicons name="call" size={16} color="#10B981" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => handleAction("whatsapp", item.lead_phone)} 
                        style={styles.actionButton} 
                        activeOpacity={0.7}
                    >
                        <Icon name="whatsapp" size={18} color="#25D366" />
                    </TouchableOpacity>

                    {leadEmail ? (
                        <TouchableOpacity 
                            onPress={() => handleAction("email", leadEmail)} 
                            style={styles.actionButton} 
                            activeOpacity={0.7}
                        >
                            <Ionicons name="mail" size={16} color={ACCENT_BLUE} />
                        </TouchableOpacity>
                    ) : null}

                    {freshLead && (
                         <TouchableOpacity 
                            onPress={() => handleEditLead(item)} 
                            style={styles.actionButton} 
                            activeOpacity={0.7}
                        >
                            <Icon name="pencil" size={14} color={ACCENT_BLUE} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* EXPANDED IMAGE ONLY */}
                {isExpanded && item.lead_image && (
                    <View style={styles.expandedSection}>
                         <Image source={{ uri: item.lead_image }} style={styles.leadImage} />
                    </View>
                )}
            </View>
        );
    };

    // Helper for Info Grid Items
    const InfoItem = ({ icon, label, value }) => (
        <View style={styles.infoItem}>
            <Ionicons name={icon} size={14} color={NEUTRAL_GREY} />
            <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

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
                            <Feather name="search" size={18} color={NEUTRAL_GREY} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchBar}
                                placeholder="Search leads..."
                                placeholderTextColor={NEUTRAL_GREY}
                                onChangeText={searchFilterFunction}
                                value={searchQuery}
                            />
                        </View>
                        <TouchableOpacity style={styles.filterBtn} onPress={() => setModalVisible(true)}>
                            <Feather name="sliders" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === "CHIT" && styles.activeTab]} onPress={() => setActiveTab("CHIT")}>
                        <Text style={[styles.tabText, activeTab === "CHIT" && styles.activeTabText]}>Chit ({chitLeads.length})</Text>
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
                    <Feather name="plus" size={24} color="white" />
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
    title: { fontSize: 24, fontWeight: "800", color: 'white', letterSpacing: -1 }, 
    totalCountBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 16 },
    totalCountText: { color: 'white', fontWeight: '700', fontSize: 12 }, 
    
    // Search
    searchRow: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: 10 },
    searchBarContainer: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 40 },
    searchIcon: { marginRight: 8 },
    searchBar: { flex: 1, color: MODERN_PRIMARY, fontSize: 13 }, 
    filterBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    // Tabs
    tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 10, padding: 3 },
    tab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 7 },
    activeTab: { backgroundColor: 'white' },
    tabText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }, 
    activeTabText: { color: TOP_GRADIENT[1], fontWeight: '800' },

    // Main Area
    mainContentArea: { flex: 1, backgroundColor: SUBTLE_BG_GREY, paddingHorizontal: 16, paddingTop: 15 },
    listContent: { paddingBottom: 100 },
    
    // --- COMPACT DETAILED CARD ---
    cardContainer: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        marginBottom: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    // Header
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarWrapper: {
        borderWidth: 2,
        borderRadius: 18, 
        marginRight: 10,
    },
    avatarGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 14, fontWeight: '800', color: 'white' },
    headerInfo: { flex: 1, marginRight: 5 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    customerName: { 
        fontSize: 14, 
        fontWeight: '700', 
        color: MODERN_PRIMARY, 
        flex: 1,
        marginRight: 6
    },
    statusBadge: { 
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        borderRadius: 4, 
        borderWidth: 1 
    },
    statusText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.3 }, 
    subText: { fontSize: 11, color: NEUTRAL_GREY, fontWeight: '500' }, 
    expandIcon: { padding: 2 },

    // Info Grid
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
        backgroundColor: SUBTLE_BG_GREY,
        borderRadius: 8,
        padding: 8,
    },
    infoItem: {
        width: '100%', // Full width for combined date
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoTextBlock: { marginLeft: 6, flex: 1 },
    infoLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },
    infoValue: { fontSize: 11, color: MODERN_PRIMARY, fontWeight: '600' }, 

    // Action Row
    contactActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    // Expanded
    expandedSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
    leadImage: { width: '100%', height: 120, borderRadius: 8, resizeMode: 'cover' },

    // Misc
    noDataContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, backgroundColor: CARD_BG, borderRadius: 16, margin: 16 },
    noDataText: { fontSize: 14, color: NEUTRAL_GREY, marginTop: 10, fontWeight: '600' }, 
    noImage: { width: 100, height: 100, resizeMode: "contain", opacity: 0.5 },
    
    // FAB
    fab: { position: 'absolute', bottom: 85, right: 20, width: 56, height: 56, borderRadius: 28, shadowColor: ACCENT_BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
    fabGradient: { width: '100%', height: '100%', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalView: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, paddingTop: 30 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: MODERN_PRIMARY, marginBottom: 20, textAlign: 'center' },
    modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalOptionText: { fontSize: 15, color: MODERN_PRIMARY, fontWeight: '500', textAlign: 'center' }
});

export default ViewLeads;