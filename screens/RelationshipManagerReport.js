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
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import url from "../constants/baseUrl"; // Assuming 'url' constant is available for API base path

const { height } = Dimensions.get('window');

// --- CONSTANTS MATCHING ReferredReport.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"];
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent
const ACCENT_GREEN = "#059669";   // Vibrant green for positive/payable
const WARNING_RED = "#dc2626";    // Strong red for negative/balance
const NEUTRAL_GREY = "#6b7280";   // Neutral grey for subtler text
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb';

// --- API CONSTANTS ---
// NOTE: Replaced hardcoded URL with the template from ReferredReport.js
const DUE_API = `${url}/enroll/due/relationship-manager/`;
const GROUP_API = `${url}/group/get-group`;

if (
    Platform.OS === "android" &&
    UIManager &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Formats a number into Indian Rupee currency string.
 * @param {number|string} amount
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₹0.00";
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(num)) return "₹0.00";
    return `₹ ${num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const RelationshipManagerReport = ({ route }) => {
    // Ensure user data is available
    const { user } = route.params || {};

    const [groups, setGroups] = useState([]);
    const [dues, setDues] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("all");
    const [loading, setLoading] = useState(true);

    // Fetch groups + dues
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [groupRes, dueRes] = await Promise.all([
                    fetch(GROUP_API),
                    fetch(`${DUE_API}${user.userId}`),
                ]);
                const groupJson = await groupRes.json();
                const dueJson = await dueRes.json();

                const allGroups = Array.isArray(groupJson?.data)
                    ? groupJson.data
                    : Array.isArray(groupJson)
                        ? groupJson
                        : [];

                // Assuming `dueJson.enrollments` holds the report data
                const allDues = dueJson?.enrollments || [];

                setGroups(allGroups);
                setDues(allDues);

                // *** ANIMATION TRIGGER ***
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setFilteredData(allDues);
            } catch (err) {
                console.error("Error fetching Relationship Manager reports:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.userId]);

    // Filter dues by group
    useEffect(() => {
        // *** ANIMATION TRIGGER ***
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (selectedGroup === "all") setFilteredData(dues);
        else
            setFilteredData(
                dues.filter((item) => item.group_id?._id === selectedGroup)
            );
    }, [selectedGroup, dues]);

    const renderItem = ({ item }) => {
        // Data structure cleanup: Assuming referred data structure looks like:
        const name = item?.user_id?.full_name || "Unknown";
        const email = item?.user_id?.email;
        const phone = item?.user_id?.phone_number;
        const groupName = item?.group_id?.group_name || "N/A";
        const paymentType = item?.payment_type || "N/A"; // Retaining this unique data point

        // Safely extract financial values which might be nested in an array
        const getFinancialValue = (value) =>
            Array.isArray(value) && value.length > 0 ? value[0] : value || 0;

        const totalPayable = getFinancialValue(item.total_payable_amount);
        const totalProfit = getFinancialValue(item.total_profit); // UNIQUE TO RM REPORT
        const totalToBePaid = item?.total_to_be_paid || 0;
        const balance = item?.balance || item?.Balance || 0;

        // Status bar color: Red for positive balance (outstanding), Green otherwise
        const statusColor = balance > 0 ? WARNING_RED : ACCENT_GREEN;

        return (
            <View style={styles.cardContainer}>
                {/* Main Card Content */}
                <View style={styles.card}>
                    {/* Header (Group + Status Tag) */}
                    <View style={styles.cardHeader}>
                        <Text style={styles.groupName} numberOfLines={1}>{groupName}</Text>
                        <View style={[styles.statusTag, { backgroundColor: balance > 0 ? '#fee2e2' : '#d1fae5' }]}>
                            <Text style={[styles.statusTagText, { color: statusColor }]}>
                                {balance > 0 ? 'Outstanding' : 'Paid'}
                            </Text>
                        </View>
                    </View>

                    {/* Customer Info */}
                    <View style={styles.cardBody}>
                        <Text style={styles.customerName}>{name}</Text>
                        {phone ? <Text style={styles.customerInfo}><Ionicons name="call" size={14} color={NEUTRAL_GREY} /> {phone}</Text> : null}
                        {email ? <Text style={styles.customerInfo}><Ionicons name="mail" size={14} color={NEUTRAL_GREY} /> {email}</Text> : null}
                        <Text style={styles.customerInfo}>Payment Type: {paymentType}</Text>
                    </View>

                    {/* Financial Info */}
                    <View style={styles.cardFinancial}>

                        {/* Total Payable Row (Compact) */}
                        <View style={styles.financialRowCompact}>
                            <Text style={styles.financialLabelCompact}>Total Payable :</Text>
                            <Text style={[styles.financialValue, { color: ACCENT_GREEN }]}>
                                {formatCurrency(totalPayable)}
                            </Text>
                        </View>

                        {/* Total Profit Row (Compact) - Unique to RM Report */}
                        <View style={styles.financialRowCompact}>
                            <Text style={styles.financialLabelCompact}>Total Profit :</Text>
                            <Text style={[styles.financialValue, { color: ACCENT_GREEN }]}>
                                {formatCurrency(totalProfit)}
                            </Text>
                        </View>

                        {/* Total Paid Row (Compact) */}
                        <View style={styles.financialRowCompact}>
                            <Text style={styles.financialLabelCompact}>Total Paid :</Text>
                            <Text style={styles.financialValue}>
                                {formatCurrency(totalToBePaid)}
                            </Text>
                        </View>

                        {/* Balance (Stands out - Compact) */}
                        <View style={[styles.balanceRowCompact, { backgroundColor: balance > 0 ? '#fff7f7' : '#f0fff5', borderColor: balance > 0 ? WARNING_RED : ACCENT_GREEN }]}>
                            <Text style={[styles.balanceLabel, { color: balance > 0 ? WARNING_RED : ACCENT_GREEN, marginRight: 5 }]}>
                                {balance > 0 ? 'Outstanding Balance :' : 'Current Balance :'}
                            </Text>
                            <Text style={[styles.balanceValue, { color: balance > 0 ? WARNING_RED : ACCENT_GREEN }]}>
                                {formatCurrency(balance)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const totalPending = filteredData.reduce(
        (sum, item) => sum + (item?.balance || item?.Balance || 0),
        0
    );

    const EmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={50} color={NEUTRAL_GREY} />
            <Text style={styles.emptyText}>No pending dues found.</Text>
            <Text style={{ color: NEUTRAL_GREY, marginTop: 5, fontSize: 14 }}>
                Try selecting "All Groups" or check back later.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Top Header Section with Gradient */}
            <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
                <View style={styles.headerSpacer}>
                    <Header />
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>RM Report</Text>
                    <Text style={styles.subtitle}>
                        Select a group to view pending details
                    </Text>
                </View>
            </LinearGradient>

            {/* Main Content Area (Light Background) */}
            <View style={styles.mainContentArea}>

                {/* Total Summary (Highlighted Card) */}
                <View style={styles.totalWrapper}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Ionicons name="wallet-outline" size={20} color={MODERN_PRIMARY} style={{ marginRight: 8 }} />
                        <Text style={styles.totalText}>
                            Overall Outstanding Balance:
                        </Text>
                    </View>
                    <Text style={styles.totalAmount}>
                        {formatCurrency(totalPending)}
                    </Text>
                </View>

                {/* Group Filter */}
                <View style={styles.dropdownWrapper}>
                    <Text style={styles.dropdownLabel}>Filter by Group</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={selectedGroup}
                            onValueChange={(itemValue) => setSelectedGroup(itemValue)}
                            style={styles.picker}
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

                {/* Content List / Loader */}
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={ACCENT_BLUE} />
                        <Text style={styles.loadingTextBlue}>Fetching reports...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item?._id?.toString() || index.toString()}
                        ListEmptyComponent={EmptyList}
                        style={styles.flatListStyle}
                        contentContainerStyle={styles.flatListContentContainer}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default RelationshipManagerReport;

const styles = StyleSheet.create({
    // --- LAYOUT STYLES (from ReferredReport.js) ---
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

    // --- TITLE STYLES (from ReferredReport.js) ---
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

    // --- DROP DOWN / FILTER (from ReferredReport.js) ---
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
        // ** FIX 1: Increased height for Android container **
        height: Platform.OS === 'android' ? 55 : 40,
        justifyContent: 'center',
    },
    picker: {
        color: MODERN_PRIMARY,
        // ** FIX 2: Increased height for Android Picker **
        height: Platform.OS === 'android' ? 55 : 40,
        // ** FIX 3: CRITICAL for Android text alignment **
        ...(Platform.OS === 'android' && { textAlignVertical: 'center' }),
    },

    // --- TOTAL SUMMARY CARD (from ReferredReport.js) ---
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

    // --- REPORT CARD (Matching ReferredReport.js) ---
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
    card: {
        flex: 1,
        padding: 20,
    },

    // CARD CONTENT
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
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
    statusTag: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        alignSelf: 'flex-start',
    },
    statusTagText: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: 'uppercase',
    },
    cardBody: {
        marginBottom: 15,
    },
    customerName: {
        fontSize: 22,
        fontWeight: "900",
        color: MODERN_PRIMARY,
        marginBottom: 5,
    },
    customerInfo: {
        fontSize: 14,
        color: NEUTRAL_GREY,
        marginTop: 5,
        fontWeight: "500",
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardFinancial: {
        paddingTop: 10,
    },

    // Compact row for label and value
    financialRowCompact: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: 'baseline',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    financialLabelCompact: {
        fontSize: 15,
        color: NEUTRAL_GREY,
        fontWeight: "500",
        marginRight: 8,
    },

    financialValue: {
        fontSize: 16,
        color: MODERN_PRIMARY,
        fontWeight: "800",
    },

    // Balance Row (Stands out - Compact)
    balanceRowCompact: {
        flexDirection: "row",
        justifyContent: "flex-start",
        paddingVertical: 15,
        marginTop: 10,
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        alignItems: 'baseline',
    },
    balanceLabel: {
        fontSize: 13,
        fontWeight: "700",
    },
    balanceValue: {
        fontSize: 17,
        fontWeight: "900",
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