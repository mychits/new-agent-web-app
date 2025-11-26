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
    Pressable,
    TextInput
} from "react-native";
import { TapGestureHandler } from "react-native-gesture-handler";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { whatsappMessage } from "../components/data/messages"; // Assuming this path is correct
import { LinearGradient } from "expo-linear-gradient";

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area

// --- DISTINCT VALUE COLORS ---
const VALUE_COLOR_GREEN = '#3ed160ff';
const VALUE_COLOR_MAGENTA = '#f70cb4ff';
// ---------------------------------------------


const ExpectedCommissions = ({ route, navigation }) => {
    const { user } = route.params;
    const [chitCustomerLength, setChitCustomerLength] = useState(0);
    const [goldCustomerLength, setGoldCustomerLength] = useState(0);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [customers, setCustomer] = useState([]);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [totalChitCommmissions, setTotalChitCommissions] = useState("");
    const [totalGoldCommmissions, setTotalGoldCommissions] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const sendWhatsappMessage = async (item) => {
        if (item.user_id?.phone_number) {
            let url = `whatsapp://send?phone=${item.user_id.phone_number}&text=${encodeURIComponent(whatsappMessage)}`;

            Linking.canOpenURL(url)
                .then((supported) => {
                    if (supported) {
                        return Linking.openURL(url);
                    } else {
                        Alert.alert("Error", "WhatsApp is not installed on your device or not supported.");
                    }
                })
                .catch((err) => console.error("An error occurred trying to open WhatsApp", err));
        } else {
            return;
        }
    };

    const openDialer = (item) => {
        if (item?.user_id?.phone_number) {
            Linking.canOpenURL(`tel:${item.user_id.phone_number}`)
                .then((supported) => {
                    if (supported) {
                        Linking.openURL(`tel:${item.user_id.phone_number}`);
                    } else {
                        Alert.alert("Error", "Dialer not supported on this device.");
                    }
                })
                .catch((err) => {
                    console.error("An error occurred trying to open dialer", err);
                    Alert.alert("Error", "Something went wrong! Could not initiate call.");
                });
        } else {
            return;
        }
    };

    useEffect(() => {
        const fetchExpectedCommissions = async () => {
            // NOTE: The GOLD base URL is hardcoded here, ensure it's correct for your environment.
            const currentBaseUrl =
                activeTab === "CHIT" ? baseUrl : "http://13.60.68.201:3000/api";
            
            const setLoading = activeTab === "CHIT" ? setIsChitLoading : setIsGoldLoading;

            setLoading(true);

            try {
                const apiUrl = `${currentBaseUrl.replace(/\/+$/, '')}/enroll/get-commission-info/${user.userId}`;

                const response = await axios.get(apiUrl);

                if (response.status >= 400)
                    throw new Error("Failed to fetch Enrolled customer Data");

                const data = response.data.dataWithCommission || [];
                // Ensure commission is a string before setting
                const totalCommission = (response?.data?.total_commission || "0").toString();
                const customerCount = data.length || 0;

                setCustomer(data);
                
                if (activeTab === "CHIT") {
                    setTotalChitCommissions(totalCommission);
                    setChitCustomerLength(customerCount);
                } else {
                    setTotalGoldCommissions(totalCommission); 
                    setGoldCustomerLength(customerCount);
                }


            } catch (err) {
                console.error("Error fetching commissions:", err);
                setCustomer([]);
                if (activeTab === "CHIT") {
                    setTotalChitCommissions("0");
                    setChitCustomerLength(0);
                } else {
                    setTotalGoldCommissions("0");
                    setGoldCustomerLength(0);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchExpectedCommissions();
    }, [activeTab, user.userId]);

    const filteredCustomers = customers.filter(customer => {
        const groupName = customer?.group_id?.group_name || "";
        const userName = customer?.user_id?.full_name || "";
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return groupName.toLowerCase().includes(query) || userName.toLowerCase().includes(query);
    });

    const formatCommission = (value) => {
        // Strip non-numeric characters and format as currency
        const numericValue = String(value || '0').replace(/[^\d.]/g, '');
        return Number(numericValue).toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };

    const renderEnrolledCustomerCard = ({ item }) => (
        <TapGestureHandler
            numberOfTaps={2}
            onActivated={() => {
                sendWhatsappMessage(item);
            }}
        >
            <Pressable
                onPress={() => openDialer(item)}
                style={styles.card}
            >
                <View style={styles.leftSection}>
                    <Text style={styles.groupName}>
                        <Text style={styles.groupNameValue}>
                             {item?.group_id?.group_name || "N/A"}
                        </Text>
                    </Text>
                    <Text style={styles.name}>
                       {item?.user_id?.full_name || "No User Name"}
                    </Text>
                </View>
                <View style={styles.rightSection}>
                    <View style={styles.commissionContainer}>
                        <Text style={styles.commissionText}>
                            {`₹${formatCommission(item?.calculated_commission)}`}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </TapGestureHandler>
    );

    const totalCommission = activeTab === "CHIT" ? totalChitCommmissions : totalGoldCommmissions;
    const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;
    const customerCount = activeTab === "CHIT" ? chitCustomerLength : goldCustomerLength;
    const noCommissionText = activeTab === "CHIT" 
        ? "No CHIT expected commissions found. Start enrolling new customers!"
        : "No GOLD CHIT expected commissions found. Start enrolling new customers!";


    return (
        <View style={{ flex: 1, backgroundColor: TOP_GRADIENT[0] }}>
            <LinearGradient colors={TOP_GRADIENT}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
                >
                    {/* Fixed Header Section (Elements that should NOT scroll) */}
                    <View style={styles.fixedHeaderArea}>
                        <Header />
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Expected Commissions</Text>
                            <Text style={styles.subtitle}>View your estimated earnings</Text>
                        </View>
                    </View>
                    
                    {/* Main Content Area (White Background, Overlapping Header) */}
                    <View style={styles.mainContentArea}>
                        
                        {/* Search Input and Icon */}
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={20} color={TEXT_GREY} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by customer name or group"
                                placeholderTextColor={TEXT_GREY}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        
                        {/* Tabs */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                                onPress={() => { setActiveTab("CHIT"); setSearchQuery(""); }}
                            >
                                <MaterialIcons
                                    name="groups"
                                    size={20}
                                    color={activeTab === "CHIT" ? CARD_BG : TEXT_GREY}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "CHIT" && styles.activeTabText,
                                    ]}
                                >
                                    Chits ({chitCustomerLength || 0}) 
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
                                onPress={() => { setActiveTab("GOLD"); setSearchQuery(""); }}
                            >
                                <MaterialIcons
                                    name="diamond"
                                    size={20}
                                    color={activeTab === "GOLD" ? CARD_BG : TEXT_GREY}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "GOLD" && styles.activeTabText,
                                    ]}
                                >
                                    Gold Chits ({goldCustomerLength || 0})
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Total Card */}
                        <View style={styles.totalCardContainer}>
                            <View style={styles.totalCard}>
                                <View style={styles.totalCardContent}>
                                    <View>
                                        <Text style={styles.totalCardText}>Total Expected Commission</Text>
                                        <Text style={[styles.totalCardValue, { color: VALUE_COLOR_GREEN }]}>
                                            {`₹${formatCommission(totalCommission)}`}
                                        </Text>
                                    </View>
                                    <MaterialIcons name="trending-up" size={32} style={styles.cardIcon} />
                                </View>
                            </View>
                        </View>

                        {/* Scrolling Content Section (FlatList) */}
                        <View style={styles.listContainer}>
                            {isLoading ? (
                                <ActivityIndicator
                                    size="large"
                                    color={ACCENT_BLUE}
                                    style={{ marginTop: 20 }}
                                />
                            ) : customerCount === 0 && searchQuery === "" ? (
                                <Text style={styles.noLeadsText}>
                                    {noCommissionText}
                                </Text>
                            ) : filteredCustomers.length === 0 && searchQuery !== "" ? (
                                 <Text style={styles.noLeadsText}>
                                     No customers match your search criteria.
                                 </Text>
                            ) : (
                                <FlatList
                                    data={filteredCustomers}
                                    keyExtractor={(item, index) => `${activeTab}-${index}`}
                                    renderItem={renderEnrolledCustomerCard}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                />
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    // --- LAYOUT STYLES (Modernized) ---
    gradientOverlay: {
        flex: 1,
        paddingHorizontal: 0, 
        paddingTop: 0, 
    },
    fixedHeaderArea: {
        paddingHorizontal: 22, 
        paddingTop: Platform.OS === 'android' ? 50 : 32, 
        paddingBottom: 20, 
        zIndex: 10,
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: CARD_BG, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        // Adjusted from -30 to -10 to increase the space between the subtitle and the white container
        marginTop: -10, 
        zIndex: 2, 
        paddingHorizontal: 22, 
        paddingTop: 30,
    },
    listContainer: {
        flex: 1,
    },

    // --- TITLE STYLES ---
    titleContainer: {
        marginTop: 15,
        marginBottom: 5,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: CARD_BG, 
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)', 
        fontWeight: '500',
        marginTop: 4,
        textAlign: 'center',
    },

    // --- SEARCH STYLES ---
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 10,
        color: TEXT_GREY,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: MODERN_PRIMARY,
    },

    // --- TAB STYLES ---
    tabContainer: {
        flexDirection: "row",
        backgroundColor: SUBTLE_BG_GREY, 
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: ACCENT_BLUE, 
    },
    tabText: {
        fontSize: 15,
        color: TEXT_GREY,
        fontWeight: "600",
        marginLeft: 5,
    },
    activeTabText: {
        color: CARD_BG, 
        fontWeight: 'bold',
    },
    
    // --- TOTAL CARD STYLES ---
    totalCardContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    totalCard: {
        backgroundColor: CARD_BG, 
        flexDirection: "row",
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: ACCENT_BLUE, 
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
        width: '100%',
    },
    totalCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    totalCardText: {
        fontSize: 16,
        fontWeight: '600',
        color: MODERN_PRIMARY,
    },
    totalCardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 5,
    },
    cardIcon: {
        color: ACCENT_BLUE, 
    },

    // --- LIST CARD STYLES ---
    card: {
        backgroundColor: CARD_BG,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        marginVertical: 6,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderColor: ACCENT_BLUE, 
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1, 
        borderColor: BORDER_COLOR,
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        alignItems: "flex-end",
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 5,
    },
    groupNameValue: { 
        fontSize: 16,
        color: MODERN_PRIMARY,
        fontWeight: '700',
    },
    name: {
        fontSize: 14, 
        fontWeight: "500",
        color: TEXT_GREY,
        marginTop: 3,
        textAlign: 'left',
    },
    groupName: {
        textAlign: 'left',
    },
    commissionContainer: {
        backgroundColor: VALUE_COLOR_MAGENTA + '10', 
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignSelf: 'center',
    },
    commissionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: VALUE_COLOR_MAGENTA, 
        textAlign: 'center',
    },
    noLeadsText: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        color: TEXT_GREY,
        fontWeight: '500',
    },
});

export default ExpectedCommissions;