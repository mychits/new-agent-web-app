import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    StatusBar,
    Platform,
    LayoutAnimation,
    UIManager,
    TouchableOpacity,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import Header from "../components/Header";

// --- ORIGINAL CONSTANTS ---
const DUE_API = "https://mychits.online/api/enroll/due/routes/agent/";
const GROUP_API = "https://mychits.online/api/group/get-group";
// 🚨 LINEAR GRADIENT COLOR AS PREVIOUSLY REQUESTED 🚨
const BACKGROUND_GRADIENT = ["#dbf6faff", "#90dafcff"]; 
const NO_REPORTS_IMAGE = require("../assets/NoReports.png");

// --- MODERN STYLING CONSTANTS (Curated for a professional, clean look) ---
const MODERN_PRIMARY = "#1e3a8a"; // Deep, professional blue
const ACCENT_GREEN = "#059669";   // Vibrant green for positive/payable
const WARNING_RED = "#dc2626";     // Strong red for negative/balance
const NEUTRAL_GREY = "#6b7280";   // Neutral grey for subtler text
const DARK_TEXT = "#1f2937";     // Darkest text color for contrast
const LIGHT_GREY_BACKGROUND = "#f9fafb"; // Very light background for elements
const BORDER_COLOR = "#e5e7eb"; // Light border for subtle separation

// Enable LayoutAnimation for Android
if (
    Platform.OS === "android" &&
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
        const url = `tel:${phoneNumber}`;
        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    console.log(`Don't know how to open URI: ${url}`);
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
    // 🚨 TOTAL PROFIT REMOVED 🚨
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
                    <View style={cardStyles.paymentTypeTag}>
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
                                { backgroundColor: isCalling ? MODERN_PRIMARY : ACCENT_GREEN }
                            ]}
                            disabled={isCalling}
                        >
                            <Text style={cardStyles.callButtonText}>
                                {isCalling ? '📞 Calling...' : '📞 Call'}
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
                        {isDetailsVisible ? 'Hide Details ▲' : 'Show More Details ▼'}
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
const OutstandingReports = ({ route }) => {
    const { user } = route.params;
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
            <Image source={NO_REPORTS_IMAGE} style={pageStyles.emptyImage} />
            <Text style={pageStyles.emptyText}>No pending dues found</Text>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" />
            {/* 🚨 LINEAR GRADIENT APPLIED HERE 🚨 */}
            <LinearGradient colors={BACKGROUND_GRADIENT} style={{ flex: 1 }}>

                <View style={pageStyles.headerSpacer}>
                    <Header />
                </View>

                <View style={pageStyles.container}>
                    <Text style={pageStyles.title}>Outstanding Reports</Text>
                    <Text style={pageStyles.subtitle}>
                        Easily manage and track pending payments
                    </Text>

                    {/* Group Filter */}
                    <View style={pageStyles.dropdownWrapper}>
                        <Text style={pageStyles.dropdownLabel}>Filter by Group</Text>
                        <View style={pageStyles.pickerWrapper}>
                            <Picker
                                selectedValue={selectedGroup}
                                onValueChange={(itemValue) => setSelectedGroup(itemValue)}
                                style={[pageStyles.picker, { color: MODERN_PRIMARY }]}
                                itemStyle={{ color: MODERN_PRIMARY, fontSize: 16 }} // iOS picker item style
                            >
                                <Picker.Item label="All Groups" value="all" />
                                {groups.map((g) => (
                                    <Picker.Item key={g._id} label={g.group_name} value={g._id} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {/* Total Summary (Highlighted Card) */}
                    <View style={pageStyles.totalWrapper}>
                        <Text style={pageStyles.totalText}>
                            Overall Pending Balance:
                        </Text>
                        <Text style={pageStyles.totalAmount}>
                            {formatCurrency(totalPending)}
                        </Text>
                    </View>

                    {loading ? (
                        <View style={pageStyles.loader}>
                            <ActivityIndicator size="large" color={MODERN_PRIMARY} />
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
            </LinearGradient>
        </SafeAreaView>
    );
};

export default OutstandingReports;

// =================================================================
// PAGE-LEVEL STYLES
// =================================================================
const pageStyles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    headerSpacer: {
        paddingHorizontal: 16,
        paddingVertical: 10, 
    },
    title: {
        fontSize: 28,
        fontWeight: "900", // Extra bold
        color: MODERN_PRIMARY,
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: NEUTRAL_GREY,
        marginBottom: 20,
        textAlign: 'center',
    },

    // --- DROP DOWN / FILTER ---
    dropdownWrapper: {
        backgroundColor: "#ffffff",
        padding: 15,
        borderRadius: 12, // Rounded corners
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 5,
    },
    dropdownLabel: {
        fontWeight: "700",
        marginBottom: 8,
        color: MODERN_PRIMARY,
        fontSize: 16,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: LIGHT_GREY_BACKGROUND,
    },
    picker: {
        color: MODERN_PRIMARY, // Dark text for Picker
    },

    // --- TOTAL SUMMARY ---
    totalWrapper: {
        backgroundColor: "#fff7ed", // Soft orange/yellow background
        borderRadius: 12,
        padding: 18,
        marginBottom: 20,
        borderLeftWidth: 6,
        borderLeftColor: "#f97316", // Vibrant orange
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    totalText: {
        color: "#c2410c",
        fontWeight: "700",
        fontSize: 17,
        marginBottom: 4,
    },
    totalAmount: {
        color: WARNING_RED,
        fontWeight: "900", // Extra bold
        fontSize: 26,
    },

    // --- FLATLIST ---
    flatListStyle: {
        flex: 1,
    },
    flatListContentContainer: {
        paddingBottom: 20, // Add some bottom padding
    },

    // --- LOADER/EMPTY STATE ---
    loader: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 50,
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 80,
        padding: 20,
    },
    emptyImage: {
        width: 200,
        height: 160,
        opacity: 0.8,
    },
    emptyText: {
        color: NEUTRAL_GREY,
        marginTop: 20,
        fontWeight: "700",
        fontSize: 18,
    },
});

// =================================================================
// CARD-SPECIFIC STYLES (for OutstandingReportCard)
// =================================================================
const cardStyles = StyleSheet.create({
    cardContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 16, // Large rounded corners
        marginBottom: 15,
        overflow: 'hidden', // Ensures shadow and content play well
        // Premium, larger shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
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
        fontSize: 16,
        fontWeight: "800", // Bolder
        color: MODERN_PRIMARY,
        marginRight: 10,
        flexShrink: 1, // Allows text to shrink
    },
    paymentTypeTag: {
        backgroundColor: "#eef2ff", // Light blue background for a tag feel
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start', // Align to start of its line
    },
    paymentTypeText: {
        fontSize: 12,
        color: MODERN_PRIMARY,
        textTransform: "uppercase",
        fontWeight: "700",
    },

    customerInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    customerName: {
        fontSize: 20,
        fontWeight: "900", // Extra bold
        color: DARK_TEXT,
        flexShrink: 1,
        marginRight: 10,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    callButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 5, // Space for icon if added to text
    },

    balanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: "#fef2f2", // Very light red background for attention
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fde0e0',
        marginBottom: 10,
    },
    balanceLabel: {
        fontSize: 13,
        color: DARK_TEXT,
        fontWeight: '700',
    },
    balanceValue: {
        fontSize: 20, // Prominent
        fontWeight: "900",
    },

    detailsToggle: {
        paddingVertical: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: BORDER_COLOR,
        marginTop: 10,
    },
    detailsToggleText: {
        color: MODERN_PRIMARY,
        fontWeight: '700',
        fontSize: 14,
    },

    detailsSection: {
        paddingTop: 10,
    },
    financialRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6', // Lighter border
    },
    financialLabel: {
        fontSize: 15,
        color: NEUTRAL_GREY,
        fontWeight: "500",
    },
    financialValue: {
        fontSize: 16,
        color: DARK_TEXT,
        fontWeight: "700",
    },
});