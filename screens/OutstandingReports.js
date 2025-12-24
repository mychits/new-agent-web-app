import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    Platform,
    LayoutAnimation,
    UIManager,
    TouchableOpacity,
    Linking,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

// 🚨 IMPORTING THE ACTUAL HEADER COMPONENT 🚨
import Header from "../components/Header";

// --- BASE URL IMPORT ---
// Assuming baseUrl.js exports 'url' as default from ../constants/baseUrl
import url from "../constants/baseUrl";

const { height } = Dimensions.get('window');

// --- CONSTANTS MATCHING Enrollment.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"];
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent
const ACCENT_GREEN = "#059669";   // Vibrant green for positive/payable
const WARNING_RED = "#dc2626";    // Strong red for negative/balance
const NEUTRAL_GREY = "#6b7280";   // Neutral grey for subtler text
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area


// --- ORIGINAL API/IMAGE CONSTANTS (UPDATED TO USE IMPORTED 'url') ---
const DUE_API = `${url}/enroll/due/routes/agent/`;
const GROUP_API = `${url}/group/get-group`;
const NO_REPORTS_IMAGE = require("../assets/NoReports.png");

// Enable LayoutAnimation for Android
if (
    Platform.OS === "android" &&
    UIManager && // Added check for UIManager itself
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₹0.00";
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(num)) return "₹0.00";
    return `₹ ${num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

// --- FUNCTION TO HANDLE CALLS ---
const handleCall = (phoneNumber) => {
    if (phoneNumber) {
        const telUrl = `tel:${phoneNumber}`;
        Linking.canOpenURL(telUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(telUrl);
                } else {
                    console.log(`Don't know how to open URI: ${telUrl}`);
                }
            })
            .catch((err) => console.error('An error occurred while opening dialer', err));
    }
};

// =================================================================
// STYLIZED COMPONENT: OutstandingReportCard 
// =================================================================

const OutstandingReportCard = ({ item, activeCallId, setActiveCallId }) => {
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    const name = item?.user_id?.full_name || "Unknown";
    const phone = item?.user_id?.phone_number;
    const groupName = item?.group_id?.group_name || "N/A";
    const paymentType = item?.payment_type || "N/A";

    const isCalling = activeCallId === item?._id;

    const getFinancialValue = (value) =>
        Array.isArray(value) && value[0] ? value[0] : value || 0;

    const totalPayable = getFinancialValue(item.total_payable_amount);
    const totalToBePaid = item?.total_to_be_paid || 0;
    const balance = item?.balance || item?.Balance || 0;

    const balanceStatusColor = balance > 0 ? WARNING_RED : ACCENT_GREEN;

    const handlePhonePress = (phone) => {
        if (phone) {
            setActiveCallId(item?._id);
            handleCall(phone);

            setTimeout(() => {
                setActiveCallId(null);
            }, 3000);
        }
    }

    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsDetailsVisible(!isDetailsVisible);
    };

    return (
        <View style={cardStyles.cardContainer}>
            {/* Main Content Area */}
            <View style={cardStyles.cardContent}>
                {/* Header: Group Name & Payment Type */}
                <View style={cardStyles.cardHeader}>
                    <Text style={cardStyles.groupName} numberOfLines={1}>{groupName}</Text>
                    <View style={[
                        cardStyles.paymentTypeTag,
                        paymentType === 'Normal' && cardStyles.tagNormal,
                    ]}>
                        <Text style={cardStyles.paymentTypeText}>{paymentType}</Text>
                    </View>
                </View>

                {/* Customer Name and Call Button */}
                <View style={cardStyles.customerInfoRow}>
                    <Text style={cardStyles.customerName}>{name}</Text>
                    {phone ? (
                        <TouchableOpacity
                            onPress={() => handlePhonePress(phone)}
                            style={[
                                cardStyles.callButton,
                                { backgroundColor: isCalling ? ACCENT_BLUE : ACCENT_GREEN }
                            ]}
                            disabled={isCalling}
                        >
                            <Ionicons name="call" size={16} color={CARD_BG} style={{ marginRight: 5 }} />
                            <Text style={cardStyles.callButtonText}>
                                {isCalling ? 'Calling...' : 'Call'}
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Outstanding Balance */}
                <View style={cardStyles.balanceRow}>
                    <Text style={cardStyles.balanceLabel}>Outstanding Balance:</Text>
                    <Text style={[cardStyles.balanceValue, { color: balanceStatusColor }]}>
                        {formatCurrency(balance)}
                    </Text>
                </View>

                {/* Toggler for Details */}
                <TouchableOpacity onPress={toggleDetails} style={cardStyles.detailsToggle}>
                    <Text style={cardStyles.detailsToggleText}>
                        {isDetailsVisible ? 'Hide Details' : 'Show More Details'}
                        <Ionicons name={isDetailsVisible ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color={ACCENT_BLUE} style={{ marginLeft: 5 }} />
                    </Text>
                </TouchableOpacity>

                {/* Financial Details (Only visible when toggled) */}
                {isDetailsVisible && (
                    <View style={cardStyles.detailsSection}>
                        {/* Total To Be Paid */}
                        <View style={cardStyles.financialRow}>
                            <Text style={cardStyles.financialLabel}>Total To Be Paid</Text>
                            <Text style={cardStyles.financialValue}>
                                {formatCurrency(totalToBePaid)}
                            </Text>
                        </View>

                        {/* Total Payable */}
                        <View style={cardStyles.financialRow}>
                            <Text style={cardStyles.financialLabel}>Total Payable</Text>
                            <Text style={[cardStyles.financialValue, { color: ACCENT_GREEN }]}>
                                {formatCurrency(totalPayable)}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

// =================================================================
// MAIN COMPONENT: OutstandingReports (Styled like Enrollment.js)
// =================================================================
const OutstandingReports = ({ route }) => {
    const { user } = route.params || {}; // Defensive destructuring
    const [groups, setGroups] = useState([]);
    const [dues, setDues] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("all");
    const [loading, setLoading] = useState(true);
    const [activeCallId, setActiveCallId] = useState(null);


    // Fetch groups + dues
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [groupRes, dueRes] = await Promise.all([
                    fetch(GROUP_API),
                    fetch(`${DUE_API}${user?.userId}`),
                ]);
                const groupJson = await groupRes.json();
                const dueJson = await dueRes.json();

                const allGroups = Array.isArray(groupJson?.data)
                    ? groupJson.data
                    : Array.isArray(groupJson)
                        ? groupJson
                        : [];

                const allDues = dueJson?.enrollments || [];

                setGroups(allGroups);
                setDues(allDues);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setFilteredData(allDues);
            } catch (err) {
                console.error("Error fetching:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.userId]);

    // Filter dues by group
    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (selectedGroup === "all") setFilteredData(dues);
        else
            setFilteredData(
                dues.filter((item) => item.group_id?._id === selectedGroup)
            );
    }, [selectedGroup, dues]);

    const renderItem = ({ item }) => (
        <OutstandingReportCard
            item={item}
            activeCallId={activeCallId}
            setActiveCallId={setActiveCallId}
        />
    );

    const totalPending = filteredData.reduce(
        (sum, item) => sum + (item?.balance || item?.Balance || 0),
        0
    );

    const EmptyList = () => (
        <View style={pageStyles.emptyContainer}>
            <Ionicons name="documents-outline" size={50} color={NEUTRAL_GREY} />
            <Text style={pageStyles.emptyText}>No outstanding reports found.</Text>
        </View>
    );

    return (
        <SafeAreaView style={pageStyles.safeArea} edges={['top']}>
            {/* Top Header Section with Gradient */}
            <LinearGradient colors={TOP_GRADIENT} style={pageStyles.topContainer}>
                <View style={pageStyles.headerSpacer}>
                    <Header />
                </View>

                <View style={pageStyles.titleContainer}>
                    <Text style={pageStyles.title}>Outstanding Report</Text>
                    <Text style={pageStyles.subtitle}>
                        Easily manage and track pending payments
                    </Text>
                </View>
            </LinearGradient>

            {/* Main Content Area (Light Background) */}
            <View style={pageStyles.mainContentArea}>

                {/* Total Summary (Highlighted Card) */}
                <View style={pageStyles.totalWrapper}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Ionicons name="wallet-outline" size={20} color={MODERN_PRIMARY} style={{ marginRight: 8 }} />
                        <Text style={pageStyles.totalText}>
                            Overall Outstanding Balance:
                        </Text>
                    </View>
                    <Text style={pageStyles.totalAmount}>
                        {formatCurrency(totalPending)}
                    </Text>
                </View>

                {/* Group Filter */}
                <View style={pageStyles.dropdownWrapper}>
                    <Text style={pageStyles.dropdownLabel}>Filter by Group</Text>
                    <View style={pageStyles.pickerWrapper}>
                        <Picker
                            selectedValue={selectedGroup}
                            onValueChange={(itemValue) => setSelectedGroup(itemValue)}
                            style={pageStyles.picker}
                        >
                            <Picker.Item label="All Groups" value="all" color={MODERN_PRIMARY} />
                            {groups.map((g) => (
                                <Picker.Item
                                    key={g._id}
                                    label={g.group_name}
                                    value={g._id}
                                    color={MODERN_PRIMARY}
                                />
                            ))}
                        </Picker>
                    </View>
                </View>

                {loading ? (
                    <View style={pageStyles.loader}>
                        <ActivityIndicator size="large" color={ACCENT_BLUE} />
                        <Text style={pageStyles.loadingTextBlue}>Fetching reports...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item?._id?.toString() || index.toString()}
                        ListEmptyComponent={EmptyList}
                        style={pageStyles.flatListStyle}
                        contentContainerStyle={pageStyles.flatListContentContainer}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default OutstandingReports;

// =================================================================
// STYLES 
// =================================================================
const pageStyles = StyleSheet.create({
    // --- LAYOUT STYLES (from Enrollment.js) ---
    safeArea: {
        flex: 1,
        backgroundColor: TOP_GRADIENT[0]
    },
    topContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        marginTop: -20,
        paddingTop: 30,
    },
    headerSpacer: {
        paddingTop: 20,
        paddingBottom: 5
    },

    // --- TITLE STYLES (from Enrollment.js) ---
    titleContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: CARD_BG,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '500',
        textAlign: 'center',
    },

    // --- DROP DOWN / FILTER ---
    dropdownWrapper: {
        backgroundColor: CARD_BG,
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    dropdownLabel: {
        fontWeight: "700",
        marginBottom: 8,
        color: MODERN_PRIMARY,
        fontSize: 15,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: SUBTLE_BG_GREY,
        // Increased height for Android container
        height: Platform.OS === 'android' ? 55 : 40, 
        justifyContent: 'center', // Helps center content vertically
    },
    picker: {
        color: MODERN_PRIMARY,
        // Increased height for Android Picker
        height: Platform.OS === 'android' ? 55 : 40, 
        // CRITICAL FIX FOR ANDROID TEXT ALIGNMENT
        ...(Platform.OS === 'android' && { textAlignVertical: 'center' }),
    },

    // --- TOTAL SUMMARY ---
    totalWrapper: {
        backgroundColor: "#fef3c7",
        borderRadius: 18,
        padding: 20,
        marginBottom: 25,
        borderLeftWidth: 6,
        borderLeftColor: ACCENT_BLUE,
        alignItems: 'center',
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    totalText: {
        color: MODERN_PRIMARY,
        fontWeight: "700",
        fontSize: 18,
    },
    totalAmount: {
        color: WARNING_RED,
        fontWeight: "900",
        fontSize: 28,
        marginTop: 5,
    },

    // --- FLATLIST ---
    flatListStyle: {
        flex: 1,
    },
    flatListContentContainer: {
        paddingBottom: 120,
    },

    // --- LOADER/EMPTY STATE ---
    loader: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: height * 0.4,
    },
    loadingTextBlue: {
        marginTop: 10,
        color: ACCENT_BLUE,
        fontSize: 16,
        fontWeight: '600'
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 80,
        padding: 20,
    },
    emptyText: {
        color: NEUTRAL_GREY,
        marginTop: 15,
        fontWeight: "600",
        fontSize: 18,
    },
});

// =================================================================
// CARD-SPECIFIC STYLES 
// =================================================================
const cardStyles = StyleSheet.create({
    cardContainer: {
        backgroundColor: CARD_BG,
        borderRadius: 18,
        marginBottom: 18,
        overflow: 'hidden',
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    groupName: {
        fontSize: 18,
        fontWeight: "900",
        color: MODERN_PRIMARY,
        marginRight: 10,
        flexShrink: 1,
    },
    paymentTypeTag: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        alignSelf: 'flex-start',
    },
    tagNormal: {
        backgroundColor: '#ffedd5',
    },
    paymentTypeText: {
        fontSize: 11,
        color: ACCENT_BLUE,
        textTransform: "uppercase",
        fontWeight: "800",
    },

    customerInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    customerName: {
        fontSize: 22,
        fontWeight: "900",
        color: MODERN_PRIMARY,
        flexShrink: 1,
        marginRight: 10,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
    },
    callButtonText: {
        color: CARD_BG,
        fontWeight: '700',
        fontSize: 14,
    },

    // --- ADJUSTED BALANCE ROW STYLES ---
    balanceRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: 'center',
        paddingVertical: 15,
        // Reduced paddingHorizontal to move content left
        paddingHorizontal: 10,
        backgroundColor: "#fff7f7",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        marginBottom: 10,
    },
    balanceLabel: {
        fontSize: 13,
        color: MODERN_PRIMARY,
        fontWeight: '700',
        marginRight: 8,
    },
    balanceValue: {
        fontSize: 20,
        fontWeight: "900",
    },
    // ------------------------------------

    detailsToggle: {
        paddingVertical: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: BORDER_COLOR,
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    detailsToggleText: {
        color: ACCENT_BLUE,
        fontWeight: '700',
        fontSize: 14,
        marginRight: 5,
    },

    detailsSection: {
        paddingTop: 10,
    },
    financialRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    financialLabel: {
        fontSize: 15,
        color: NEUTRAL_GREY,
        fontWeight: "500",
    },
    financialValue: {
        fontSize: 16,
        color: MODERN_PRIMARY,
        fontWeight: "800",
    },
});