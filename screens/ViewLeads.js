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
    Dimensions, // Added
    KeyboardAvoidingView, // Added
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context"; // Added SafeAreaView
import axios from "axios";
import moment from "moment";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons"; // Added Icons

const noImage = require("../assets/no.png");

// Get dimensions for dynamic styling
const { height } = Dimensions.get('window');

// --- CONSTANTS MATCHING MODERN DESIGN ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (General/Edit)
const ACCENT_GREEN = "#059669";   // Vibrant green for FRESH leads
const WARNING_ORANGE = "#f8c009ff"; // Orange/Yellow for NEW leads
const NEUTRAL_GREY = "#6b7280";   // Neutral grey for subtler text
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

// Keeping original action colors for consistency
const CALL_BUTTON_COLOR = "#f8c009ff"; 
const WHATSAPP_BUTTON_COLOR = "#25D366";
const EDIT_BUTTON_COLOR = ACCENT_BLUE; // Using the main accent color for consistency


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
                {
                    params: {
                        start_date: startDate,
                        end_date: endDate
                    }
                }
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
                {
                    params: {
                        start_date: startDate,
                        end_date: endDate
                    }
                }
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

    // Use an effect to fetch data whenever startDate or endDate changes
    useEffect(() => {
        fetchData(startDate, endDate);
    }, [startDate, endDate, fetchData]);

    // Use focus effect to refresh data when the screen comes into focus
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
            case "All":
                newStartDate = "";
                newEndDate = "";
                break;
            case "Today":
                newStartDate = moment().format('YYYY-MM-DD');
                newEndDate = moment().format('YYYY-MM-DD');
                break;
            case "Yesterday":
                newStartDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
                newEndDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
                break;
            case "This Week":
                newStartDate = moment().startOf('isoWeek').format('YYYY-MM-DD');
                newEndDate = moment().endOf('isoWeek').format('YYYY-MM-DD');
                break;
            case "Last Week":
                newStartDate = moment().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD');
                newEndDate = moment().subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD');
                break;
            case "This Month":
                newStartDate = moment().startOf('month').format('YYYY-MM-DD');
                newEndDate = moment().endOf('month').format('YYYY-MM-DD');
                break;
            case "Last Month":
                newStartDate = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
                newEndDate = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
                break;
            case "This Year":
                newStartDate = moment().startOf('year').format('YYYY-MM-DD');
                newEndDate = moment().endOf('year').format('YYYY-MM-DD');
                break;
            case "Last Year":
                newStartDate = moment().subtract(1, 'year').startOf('year').format('YYYY-MM-DD');
                newEndDate = moment().subtract(1, 'year').endOf('year').format('YYYY-MM-DD');
                break;
            default:
                break;
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
        
        // Determine Status Color and Border
        let borderColor = ACCENT_BLUE + '20';
        let statusColor = ACCENT_BLUE;
        let badgeText = "LEAD";

        if (freshLead) {
            borderColor = ACCENT_GREEN;
            statusColor = ACCENT_GREEN;
            badgeText = "FRESH LEAD";
        } else if (newLead) {
            borderColor = WARNING_ORANGE;
            statusColor = WARNING_ORANGE;
            badgeText = "NEW LEAD";
        }

        const createdDate = moment(item.createdAt).format("DD-MM-YYYY");
        const createdTime = moment(item.createdAt).format("HH:mm");

        const schemeTypeDisplay = item.scheme_type ?
            item.scheme_type.charAt(0).toUpperCase() + item.scheme_type.slice(1) :
            "N/A";

        const groupName = item.group_id?.group_name ? item.group_id?.group_name : "N/A";

        return (
            <TouchableOpacity 
                onPress={() => toggleExpand(item._id)} 
                style={[
                    styles.customerCardStyle, 
                    { borderLeftColor: borderColor }
                ]}
                activeOpacity={0.9}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.customerName} numberOfLines={1}>
                        {item.lead_name || 'No Name'}
                    </Text>
                    {/* Status Tag */}
                    <View style={[styles.statusTag, { backgroundColor: statusColor + '20' }]}> 
                        <Text style={[styles.statusTagText, { color: statusColor }]}>
                            {badgeText} ({activeTab})
                        </Text>
                    </View>
                </View>

                {/* Card Body - Static Info */}
                <View style={styles.cardBody}>
                    <Text style={styles.groupInfoText}>
                        <Ionicons name="people-outline" size={16} color={ACCENT_BLUE} /> Group: <Text style={styles.groupInfoValue}>{groupName}</Text>
                    </Text>
                    <Text style={styles.groupInfoText}>
                        <MaterialCommunityIcons name="star-outline" size={16} color={ACCENT_BLUE} /> Scheme: <Text style={styles.groupInfoValue}>{schemeTypeDisplay}</Text>
                    </Text>
                </View>

                {/* Card Footer - Phone and Expand Icon */}
                <View style={styles.cardFooter}>
                    <Text style={styles.groupInfoText}>
                        <Ionicons name="call-outline" size={16} color={NEUTRAL_GREY} /> Phone: <Text style={styles.groupInfoValue}>{item.lead_phone || 'N/A'}</Text>
                    </Text>
                    <Icon
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={NEUTRAL_GREY}
                    />
                </View>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <Text style={styles.createdAt}>
                            <Ionicons name="time-outline" size={14} color={NEUTRAL_GREY} /> Created: {createdDate} at {createdTime}
                        </Text>

                        {item.lead_image && (
                            <Image source={{ uri: item.lead_image }} style={styles.leadImage} />
                        )}

                        <View style={styles.contactButtons}>
                            <TouchableOpacity
                                onPress={() => handleCall(item.lead_phone)}
                                style={[styles.contactButton, { backgroundColor: CALL_BUTTON_COLOR }]}
                            >
                                <Ionicons name="call" size={15} color={CARD_BG} />
                                <Text style={styles.buttonText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleWhatsApp(item.lead_phone)}
                                style={[styles.contactButton, { backgroundColor: WHATSAPP_BUTTON_COLOR }]}
                            >
                                <Icon name="whatsapp" size={15} color={CARD_BG} />
                                <Text style={styles.buttonText}>WhatsApp</Text>
                            </TouchableOpacity>
                            {/* Edit Button only for Fresh Leads, using ACCENT_BLUE */}
                            {freshLead && (
                                <TouchableOpacity
                                    onPress={() => handleEditLead(item)}
                                    style={[styles.contactButton, { backgroundColor: EDIT_BUTTON_COLOR }]}
                                >
                                    <Icon name="edit" size={15} color={CARD_BG} />
                                    <Text style={styles.buttonText}>Edit</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;
    const dataLoaded = activeTab === "CHIT" ? chitLoaded : goldLoaded;
    const allLeads = activeTab === "CHIT" ? chitLeads : goldLeads;

    const filteredLeads = searchQuery
        ? allLeads.filter((item) => {
            const itemData = `${item.lead_name.toUpperCase()} ${item.lead_phone.toUpperCase()} ${item.group_id?.group_name ? item.group_id.group_name.toUpperCase() : ""
                }`;
            const textData = searchQuery.toUpperCase();
            return itemData.includes(textData);
        })
        : allLeads;

    const noDataMessage =
        activeTab === "CHIT" ? "No chit leads found" : "No gold leads found";

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
                <View style={styles.headerSpacer}>
                    <Header />
                </View>

                <View style={styles.titleContainer}>
                    <View style={styles.titleAndCountRow}>
                        <Text style={styles.title}>Leads</Text>
                        <Text style={styles.totalAmountText}>
                            Total: {chitLeads.length + goldLeads.length || 0}
                        </Text>
                    </View>
                    <View style={styles.searchAndFilterContainer}>
                        <View style={styles.searchBarContainer}>
                            <Icon name="search" size={20} color={NEUTRAL_GREY} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchBar}
                                placeholder="Search leads by name or phone..."
                                placeholderTextColor={NEUTRAL_GREY}
                                onChangeText={searchFilterFunction}
                                value={searchQuery}
                                autoCapitalize="none"
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.filterBox}
                            onPress={() => setModalVisible(true)}
                        >
                            <Feather name="filter" size={18} color={MODERN_PRIMARY} style={styles.filterIcon} />
                            <Text style={styles.filterText}>{filterText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                        onPress={() => setActiveTab("CHIT")}
                    >
                        <Icon
                            name="users"
                            size={20}
                            color={activeTab === "CHIT" ? MODERN_PRIMARY : CARD_BG}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "CHIT" && styles.activeTabText,
                            ]}
                        >
                            Chit Leads ({chitLeads.length || 0})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
                        onPress={() => setActiveTab("GOLD")}
                    >
                        <Icon
                            name="money"
                            size={20}
                            color={activeTab === "GOLD" ? MODERN_PRIMARY : CARD_BG}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "GOLD" && styles.activeTabText,
                            ]}
                        >
                            Gold Leads ({goldLeads.length || 0})
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Scrollable Content Area */}
            <View style={styles.mainContentArea}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    {isLoading && (
                        <ActivityIndicator
                            size="large"
                            color={ACCENT_BLUE}
                            style={{ marginTop: 20 }}
                        />
                    )}
                    {!isLoading && dataLoaded && filteredLeads.length > 0 && (
                        <FlatList
                            data={filteredLeads}
                            keyExtractor={(item, index) => item._id || index.toString()}
                            renderItem={renderLeadCard}
                            contentContainerStyle={styles.flatListContent}
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

            <TouchableOpacity
                onPress={() => navigation.navigate("AddLead", { user: user })}
                style={styles.floatingActionButton}
            >
                <Feather name="plus" size={24} color="white" />
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Filter Leads By Date</Text>
                        {["All",
                            "Today",
                            "Yesterday",
                            "This Week",
                            "Last Week",
                            "This Month",
                            "Last Month",
                            "This Year",
                            "Last Year",
                        ].map((range) => (
                            <TouchableOpacity
                                key={range}
                                style={styles.dateRangeOption}
                                onPress={() => handleDateRangeSelect(range)}
                            >
                                <Text style={styles.dateRangeText}>{range}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalButtonText}>CLOSE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // --- LAYOUT STYLES (MODERN) ---
    safeArea: { 
        flex: 1, 
        backgroundColor: TOP_GRADIENT[0] 
    },
    topContainer: {
        paddingHorizontal: 22,
        paddingBottom: 20,
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        marginTop: -20, 
        paddingTop: 10,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    headerSpacer: { 
        paddingTop: 20, 
        paddingBottom: 5 
    }, 

    // --- TITLE STYLES ---
    titleContainer: {
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    titleAndCountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline", // Align text baselines
        width: "100%",
        marginBottom: 10,
    },
    title: {
        fontSize: 28, 
        fontWeight: "900",
        color: CARD_BG, 
    },
    totalAmountText: {
        fontSize: 16,
        fontWeight: "600",
        color: 'rgba(255, 255, 255, 0.85)',
    },
    
    // --- SEARCH & FILTER ---
    searchAndFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 15, // Made less rounded than before
        paddingHorizontal: 15,
        flex: 7,
        height: 45, // Adjusted height
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        marginRight: 10,
    },
    searchIcon: {
        marginRight: 10,
        color: NEUTRAL_GREY
    },
    searchBar: {
        flex: 1,
        height: 45,
        color: MODERN_PRIMARY,
        fontSize: 14,
        paddingVertical: 0,
    },
    filterBox: {
        backgroundColor: CARD_BG, // White background
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        flex: 3,
        height: 45,
    },
    filterIcon: {
        marginRight: 5,
        fontSize: 16,
        color: ACCENT_BLUE,
    },
    filterText: {
        fontSize: 14,
        fontWeight: "600",
        color: MODERN_PRIMARY,
    },
    
    // --- TABS ---
    tabContainer: {
        flexDirection: "row",
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Lighter background for tabs in header
        borderRadius: 15,
        marginBottom: 10,
        padding: 5,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: CARD_BG, // White/Card BG when active
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)', // White-ish text when inactive
        fontWeight: "600",
        marginLeft: 5,
    },
    activeTabText: {
        color: MODERN_PRIMARY, // Dark text when active
        fontWeight: 'bold',
    },

    // --- LEAD CARD STYLES (MODERN) ---
    customerCardStyle: {
        backgroundColor: CARD_BG, 
        borderRadius: 18, 
        marginBottom: 15,
        padding: 20,
        borderLeftWidth: 6, 
        // borderLeftColor set dynamically in renderLeadCard
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, 
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: SUBTLE_BG_GREY, 
    },
    
    // CARD CONTENT
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: SUBTLE_BG_GREY,
    },
    customerName: {
        fontSize: 22,
        fontWeight: "900",
        color: MODERN_PRIMARY,
        flexShrink: 1,
        marginRight: 10,
    },
    statusTag: { 
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        alignSelf: 'flex-start', 
    },
    statusTagText: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: 'uppercase',
    },
    cardBody: {
        paddingVertical: 15,
    },
    groupInfoText: {
        fontSize: 15,
        color: NEUTRAL_GREY,
        marginTop: 5,
        fontWeight: "500",
        lineHeight: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupInfoValue: {
        color: MODERN_PRIMARY,
        fontWeight: '700',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: SUBTLE_BG_GREY,
    },

    // EXPANDED CONTENT
    expandedContent: {
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: SUBTLE_BG_GREY,
    },
    createdAt: {
        fontSize: 14,
        color: NEUTRAL_GREY,
        fontStyle: "italic",
        marginBottom: 10,
        fontWeight: '500',
    },
    leadImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 15,
        resizeMode: 'cover',
    },

    // CONTACT BUTTONS (STANDARD STYLE)
    contactButtons: {
        flexDirection: "row",
        justifyContent: "space-between", 
        gap: 10,
        marginTop: 10,
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 50,
        elevation: 2,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        gap: 6,
        flex: 1,
    },
    buttonText: { 
        color: CARD_BG, 
        fontWeight: "bold", 
        fontSize: 14 
    }, 
    
    // --- NO DATA / FAB ---
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        backgroundColor: CARD_BG,
        padding: 20,
        borderRadius: 15,
    },
    noDataText: {
        fontSize: 16,
        color: NEUTRAL_GREY,
        textAlign: 'center',
        fontWeight: '600'
    },
    noImage: {
        width: 150,
        height: 150,
        resizeMode: "contain",
        marginBottom: 20,
    },
    flatListContent: {
        paddingBottom: 120,
    },
    floatingActionButton: {
        position: "absolute",
        bottom: 70,
        right: 20,
        backgroundColor: ACCENT_BLUE,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 10,
    },
    
    // --- MODAL STYLES (MODERN) ---
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalView: {
        backgroundColor: CARD_BG,
        borderRadius: 20,
        padding: 25,
        alignItems: "flex-start",
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '85%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: MODERN_PRIMARY,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: SUBTLE_BG_GREY,
        width: '100%',
        paddingBottom: 10,
    },
    dateRangeOption: {
        paddingVertical: 12,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: SUBTLE_BG_GREY,
    },
    dateRangeText: {
        fontSize: 16,
        color: MODERN_PRIMARY,
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        marginTop: 20,
    },
    modalButtonText: {
        fontSize: 16,
        color: ACCENT_BLUE,
        fontWeight: 'bold',
        marginLeft: 20,
    },
});

export default ViewLeads;