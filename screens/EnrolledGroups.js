import {
    View,
    Text,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
    TextInput,
    Image,
    Dimensions
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import { Feather, Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import DateTimePicker from "@react-native-community/datetimepicker";

const { height } = Dimensions.get('window');
const noImage = require('../assets/no.png');

// --- CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0f172a"; 
const ACCENT_BLUE = "#3b82f6"; 
const ACCENT_GREEN = "#10b981";
const NEUTRAL_GREY = "#64748b"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f1f5f9'; 

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

// --- DATE HELPER ---
const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateDisplay = (date) => {
    if (!date) return "Select";
    const d = new Date(date);
    const options = { day: '2-digit', month: 'short', year: 'numeric' }; 
    return d.toLocaleDateString('en-GB', options);
};

// Helper to parse YYYY-MM-DD string to Date object
const parseDateString = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return null;
};

const EnrolledGroups = ({ route, navigation }) => {
    // 1. Destructure passed dates
    const { user, fromDate: initialFromDate, toDate: initialToDate } = route.params;

    const [isLoading, setIsLoading] = useState(false);
    const [customers, setCustomer] = useState([]);
    const [incentiveSummary, setIncentiveSummary] = useState(null);
    const [search, setSearch] = useState("");

    // --- DATE FILTER STATE (Updated Initialization) ---
    const [startDate, setStartDate] = useState(() => {
        return parseDateString(initialFromDate) || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    });
    
    const [endDate, setEndDate] = useState(() => {
        return parseDateString(initialToDate) || new Date();
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState('start');

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || (datePickerMode === 'start' ? startDate : endDate);
        setShowDatePicker(Platform.OS === 'ios');
        if (datePickerMode === 'start') {
            setStartDate(currentDate);
        } else {
            setEndDate(currentDate);
        }
    };

    const showMode = (currentMode) => {
        setDatePickerMode(currentMode);
        setShowDatePicker(true);
    };

    useEffect(() => {
        const fetchEnrolledCustomers = async () => {
            setIsLoading(true);
            try {
                const formattedStart = formatDate(startDate);
                const formattedEnd = formatDate(endDate);

                const response = await axios.get(
                    `${baseUrl}/enroll/employee/${user.userId}/incentive?start_date=${formattedStart}&end_date=${formattedEnd}`
                );

                if (response.status >= 400) throw new Error("Failed to fetch Data");

                const incentiveData = response.data?.incentiveData || [];
                setCustomer(incentiveData);
                setIncentiveSummary(response.data?.incentiveSummary || null);

            } catch (err) {
                console.log(err, "error");
                setCustomer([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEnrolledCustomers();
    }, [user, startDate, endDate]);

    const filteredCustomers = customers.filter(customer =>
        customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const renderEnrolledCustomerCard = ({ item, index }) => {
        const name = item?.user_id?.full_name || "No Name";
        const groupName = item?.group_id?.group_name || "N/A";
        const phoneNumber = item?.user_id?.phone_number;
        const email = item?.user_id?.email;
        const ticket = item?.ticket; 
        const incentiveValue = item?.incentive_value;

        return (
            <View style={styles.customerCardStyle}>
                {/* Top Row: Serial No, Name & Incentive */}
                <View style={styles.cardTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {/* Serial Number Badge */}
                        <View style={styles.serialBadge}>
                            <Text style={styles.serialText}>#{index + 1}</Text>
                        </View>
                        <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={styles.customerName} numberOfLines={1}>
                                {name}
                            </Text>
                            <View style={styles.statusTag}> 
                                <Text style={styles.statusTagText}>ENROLLED</Text>
                            </View>
                        </View>
                    </View>
                    
                    {incentiveValue !== undefined && (
                        <View style={styles.incentiveBadge}>
                            <Text style={styles.incentiveLabel}>Inc.</Text>
                            <Text style={styles.incentiveValue}>₹{incentiveValue?.toLocaleString()}</Text>
                        </View>
                    )}
                </View>

                {/* Middle Row: Details */}
                <View style={styles.cardMiddleRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="people-outline" size={12} color={ACCENT_BLUE} />
                        <Text style={styles.detailText}>{groupName}</Text>
                    </View>
                    <View style={styles.detailSeparator} />
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="ticket-confirmation-outline" size={12} color={ACCENT_BLUE} />
                        <Text style={styles.detailText}>Ticket {ticket}</Text>
                    </View>
                </View>

                {/* Bottom Row: Actions */}
                <View style={styles.cardBottomRow}>
                    <TouchableOpacity 
                        onPress={() => handleAction("call", phoneNumber)} 
                        style={styles.actionBtn} 
                        activeOpacity={0.7}
                    >
                        <Ionicons name="call-outline" size={14} color={ACCENT_GREEN} />
                        <Text style={[styles.actionText, {color: ACCENT_GREEN}]}>Call</Text>
                    </TouchableOpacity>

                    <View style={styles.actionDivider} />

                    <TouchableOpacity 
                        onPress={() => handleAction("whatsapp", phoneNumber)} 
                        style={styles.actionBtn} 
                        activeOpacity={0.7}
                    >
                        <FontAwesome5 name="whatsapp" size={14} color="#25D366" />
                        <Text style={[styles.actionText, {color: "#25D366"}]}>Chat</Text>
                    </TouchableOpacity>

                    {email ? (
                        <>
                            <View style={styles.actionDivider} />
                            <TouchableOpacity 
                                onPress={() => handleAction("email", email)} 
                                style={styles.actionBtn} 
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="email-outline" size={14} color={ACCENT_BLUE} />
                                <Text style={[styles.actionText, {color: ACCENT_BLUE}]}>Email</Text>
                            </TouchableOpacity>
                        </>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
                <View style={styles.headerSpacer}>
                    <Header />
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Enrolled Groups</Text>
                    <Text style={styles.subtitle}>
                        {customers.length || 0} Enrolled  </Text>
                </View>

                <View style={styles.searchContainer}>
                    <Icon name="search" size={16} color="#ffffff" style={styles.searchIcon} />
                    <TextInput
                        value={search}
                        onChangeText={(text) => setSearch(text)}
                        placeholder="Search by name..."
                        placeholderTextColor="#ffffff"
                        style={styles.searchInput}
                    />
                </View>
            </LinearGradient>

            <View style={styles.mainContentArea}>
                {/* --- IMPROVED DATE FILTER UI --- */}
                <View style={styles.dateFilterContainer}>
                    <View style={styles.filterLabelWrapper}>
                        <Ionicons name="calendar" size={14} color={ACCENT_BLUE} />
                        <Text style={styles.filterLabelText}>Filter Period:</Text>
                    </View>
                    
                    <View style={styles.dateButtonsWrapper}>
                        <TouchableOpacity 
                            style={styles.dateButtonActive} 
                            onPress={() => showMode('start')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dateButtonTextDark}>{formatDateDisplay(startDate)}</Text>
                            <Ionicons name="chevron-down" size={14} color={MODERN_PRIMARY} style={{marginLeft: 4}} />
                        </TouchableOpacity>

                        <Text style={styles.dateSeparator}>—</Text>

                        <TouchableOpacity 
                            style={styles.dateButtonActive} 
                            onPress={() => showMode('end')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dateButtonTextDark}>{formatDateDisplay(endDate)}</Text>
                            <Ionicons name="chevron-down" size={14} color={MODERN_PRIMARY} style={{marginLeft: 4}} />
                        </TouchableOpacity>
                    </View>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={datePickerMode === 'start' ? startDate : endDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    {isLoading ? (
                        <ActivityIndicator size="large" color={ACCENT_BLUE} style={{ marginTop: 20 }} />
                    ) : filteredCustomers.length === 0 ? (
                        <View style={styles.noDataContainer}>
                            <Image source={noImage} style={styles.noImage} />
                            <Text style={styles.noDataText}>No customers found</Text>
                            <Text style={styles.noDataSubText}>Try adjusting your date range</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredCustomers}
                            keyExtractor={(item) => item?._id || item.user_id._id}
                            renderItem={renderEnrolledCustomerCard}
                            contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </KeyboardAvoidingView>
                
                <TouchableOpacity
                    onPress={() => navigation.navigate("EnrollCustomer", { user: user })}
                    style={styles.fab}
                >
                    <Feather name="plus" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
    topContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY, 
        borderTopLeftRadius: 25, 
        borderTopRightRadius: 25,
        paddingHorizontal: 16,
        marginTop: -15, 
        paddingTop: 8,
    },
    headerSpacer: { paddingTop: 10 }, 
    titleContainer: { alignItems: 'center', marginBottom: 12 }, 
    title: { fontSize: 20, fontWeight: "800", color: CARD_BG, letterSpacing: 0.5 }, 
    subtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', marginTop: 2 }, 
    
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 4,
        height: 42,
    },
    searchIcon: { marginLeft: 12 },
    searchInput: { flex: 1, height: 38, paddingHorizontal: 10, fontSize: 13, color: '#ffffff', fontWeight: '600' },

    // --- DATE FILTER STYLES ---
    dateFilterContainer: {
        marginTop: 12,
        marginBottom: 12,
        backgroundColor: CARD_BG,
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    filterLabelWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    filterLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: NEUTRAL_GREY,
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateButtonsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateButtonActive: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: '#EFF6FF',
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    dateButtonTextDark: {
        color: MODERN_PRIMARY,
        fontWeight: "700",
        fontSize: 12,
    },
    dateSeparator: {
        marginHorizontal: 8,
        color: NEUTRAL_GREY,
        fontWeight: '400',
        fontSize: 12,
    },

    // --- CARD STYLES WITH STYLISH BORDERS ---
    customerCardStyle: {
        backgroundColor: CARD_BG, 
        borderRadius: 12, 
        marginBottom: 10,
        padding: 12, 
        borderWidth: 1, 
        borderColor: '#E2E8F0', 
        borderLeftWidth: 5,    
        borderLeftColor: ACCENT_GREEN, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    
    cardTopRow: { 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc'
    },
    
    // Serial Number Badge
    serialBadge: {
        backgroundColor: SUBTLE_BG_GREY,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    serialText: {
        fontSize: 11,
        fontWeight: '800',
        color: NEUTRAL_GREY,
    },

    customerName: { 
        fontSize: 14, 
        fontWeight: "700", 
        color: MODERN_PRIMARY, 
        textTransform: 'capitalize' 
    },
    statusTag: { 
        marginTop: 4,
        backgroundColor: ACCENT_GREEN + '15', 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 4, 
        alignSelf: 'flex-start' 
    },
    statusTagText: { 
        fontSize: 9, 
        fontWeight: "700", 
        textTransform: 'uppercase',
        color: ACCENT_GREEN,
        letterSpacing: 0.5
    },
    
    incentiveBadge: {
        alignItems: 'flex-end',
        backgroundColor: '#F0FDF4',
        paddingLeft: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    incentiveLabel: {
        fontSize: 9,
        color: NEUTRAL_GREY,
        textTransform: 'uppercase',
        fontWeight: '600'
    },
    incentiveValue: {
        fontSize: 14,
        fontWeight: '800',
        color: ACCENT_GREEN,
    },

    cardMiddleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 11,
        color: MODERN_PRIMARY,
        marginLeft: 4,
        fontWeight: '600',
    },
    detailSeparator: {
        width: 1,
        height: 10,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 10,
    },

    cardBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        paddingVertical: 6,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
    },
    actionText: {
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 4,
    },
    actionDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#e2e8f0',
    },

    noDataContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 30, 
        paddingHorizontal: 20 
    },
    noDataText: { 
        fontSize: 14, 
        color: MODERN_PRIMARY, 
        textAlign: 'center', 
        fontWeight: '700',
        marginTop: 10
    }, 
    noDataSubText: { 
        fontSize: 12, 
        color: NEUTRAL_GREY, 
        textAlign: 'center', 
        marginTop: 4
    },
    noImage: { width: 100, height: 100, resizeMode: 'contain', opacity: 0.8 }, 
    
    fab: {
        position: "absolute",
        bottom: 80,
        right: 20,
        backgroundColor: ACCENT_BLUE,
        borderRadius: 16,
        width: 52,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: ACCENT_BLUE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    }
});

export default EnrolledGroups;