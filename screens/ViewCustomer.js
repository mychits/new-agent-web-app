import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
    Image,
    TextInput,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
// Re-import SafeAreaView from 'react-native-safe-area-context' for consistency with the new design
import { SafeAreaView } from "react-native-safe-area-context"; 
import axios from "axios";
// Replaced COLORS with explicit design constants for consistency
// import COLORS from "../constants/color"; 
import Header from "../components/Header"; 
import baseUrl from "../constants/baseUrl"; 
import { LinearGradient } from "expo-linear-gradient";
// Changed to Ionicons for consistency with the Routes component
import { Ionicons } from "@expo/vector-icons"; 
import { useFocusEffect } from "@react-navigation/native";
const noImage = require('../assets/no.png'); 

// --- DESIGN CONSTANTS COPIED/DERIVED FROM Routes.js ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for icons/left border)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
const WHATSAPP_COLOR = "#25D366"; // Standard WhatsApp color
// -----------------------------------------------------

const whatsappMessage = "Hello from our app!";

const sendWhatsappMessage = (item) => {
    // ... (Your existing sendWhatsappMessage function)
    if (item?.phone_number) {
        const phoneNumber = item.phone_number.replace(/\D/g, ''); 
        let url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(whatsappMessage)}`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    Alert.alert("Error", "WhatsApp is not installed on this device or the link could not be opened.");
                }
            })
            .catch((err) => console.error("An error occurred while opening WhatsApp:", err));
    } else {
        Alert.alert("Error", "Phone number not available for this customer.");
    }
};

const openDialer = (item) => {
    // ... (Your existing openDialer function)
    if (item.phone_number) {
        Linking.canOpenURL(`tel:${item.phone_number}`)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(`tel:${item.phone_number}`);
                }
            })
            .catch((err) => {
                Alert.alert("Error", "Something went wrong trying to open the dialer.");
            });
    } else {
        Alert.alert("Error", "Phone number not available for this customer.");
    }
};

const sendEmail = (item) => {
    // ... (Your existing sendEmail function)
    if (item?.email) {
        Linking.canOpenURL(`mailto:${item.email}`)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(`mailto:${item.email}`);
                } else {
                    Alert.alert("Error", "Mail service is not installed or the link could not be opened.");
                }
            })
            .catch((err) => {
                Alert.alert("Error", "Something went wrong trying to send the email.");
            });
    } else {
        Alert.alert("Error", "Email address not available for this customer.");
    }
};

const ViewCustomer = ({ route, navigation }) => {
    const { user } = route.params;
    
    const REFERRED_TYPE = "Employee"; 

    const [chitCustomers, setChitCustomers] = useState([]);
    const [goldCustomers, setGoldCustomers] = useState([]);
    const [loanCustomers, setLoanCustomers] = useState([]);
    const [pigmyCustomers, setPigmyCustomers] = useState([]);

    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [isLoanLoading, setIsLoanLoading] = useState(false);
    const [isPigmyLoading, setIsPigmyLoading] = useState(false);

    const [activeTab, setActiveTab] = useState("CHIT");
    const [search, setSearch] = useState("");

    const fetchCustomers = useCallback(async (tab) => {
        let currentUrl;
        let apiPath; 
        let setLoading, setCustomers;

        switch (tab) {
            case "CHIT":
                currentUrl = `${baseUrl}`; 
                apiPath = `/user/get-users-by-agent-id/${user.userId}`; 
                setLoading = setIsChitLoading;
                setCustomers = setChitCustomers;
                break;
            case "GOLD":
                currentUrl = "http://13.60.68.201:3000/api"; 
                apiPath = `/user/get-users-by-agent-id/${user.userId}`;
                setLoading = setIsGoldLoading;
                setCustomers = setGoldCustomers;
                break;
            case "LOAN": 
                currentUrl = `${baseUrl}`; 
                apiPath = `/loans/agent-employee/${REFERRED_TYPE}/${user.userId}/customer`;
                setLoading = setIsLoanLoading;
                setCustomers = setLoanCustomers;
                break;
            case "PIGMY": 
                currentUrl = `${baseUrl}`; 
                apiPath = `/pigme/agent-employee/${REFERRED_TYPE}/${user.userId}/customer`;
                setLoading = setIsPigmyLoading;
                setCustomers = setPigmyCustomers;
                break;
            default:
                return;
        }
        
        try {
            setLoading(true);
            
            const response = await axios.get(
                `${currentUrl}${apiPath}`
            );

            if (response.status >= 400) {
                throw new Error("Failed to fetch Customer Data");
            }
            
            let customerData = [];

            if (tab === "LOAN") {
                const rawDatas = response.data.pigmeDatas || response.data.loanDatas || [];
                
                customerData = rawDatas
                    .map(item => {
                        const customerDetails = item.borrower || item; 

                        if (customerDetails && customerDetails.full_name) {
                            return {
                                ...customerDetails, 
                                scheme_type: tab.toLowerCase(),
                                _id: customerDetails._id || item._id, 
                            };
                        }
                        return null; 
                    })
                    .filter(item => item); 

            } else if (tab === "PIGMY") {
                const rawDatas = response.data.pigmeDatas || response.data.loanDatas || [];
                
                customerData = rawDatas
                    .map(item => {
                        const customerDetails = item.customer || item; 

                        if (customerDetails && customerDetails.full_name) {
                            return {
                                ...customerDetails, 
                                scheme_type: tab.toLowerCase(),
                                _id: customerDetails._id || item._id, 
                            };
                        }
                        return null; 
                    })
                    .filter(item => item);
                
            }
            else {
                customerData = Array.isArray(response.data) 
                    ? response.data 
                    : (Array.isArray(response.data?.data) ? response.data.data : []);
            }

            setCustomers(customerData);

        } catch (err) {
            console.error(`Fetch ${tab} customers error:`, err);
            Alert.alert("Data Error", `Could not fetch ${tab.toLowerCase()} customer data. Please check network connection or URL.`);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [user.userId, baseUrl, REFERRED_TYPE]);

    useEffect(() => {
        fetchCustomers(activeTab); 
    }, [activeTab, fetchCustomers]);

    useFocusEffect(
        useCallback(() => {
            fetchCustomers(activeTab);
            return () => setSearch(""); 
        }, [activeTab, fetchCustomers]) 
    );

    const renderCustomerCard = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.leftSection}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.phoneNumber}>{item.phone_number}</Text>
                <Text style={styles.schemeType}>
                    {item.scheme_type 
                        ? item.scheme_type.charAt(0).toUpperCase() + item.scheme_type.slice(1) 
                        : 'N/A'}
                </Text>
                {/* Email is now inside the right contact section for better flow */}
            </View>
            <View style={styles.rightSection}>
                <TouchableOpacity onPress={() => sendWhatsappMessage(item)}>
                    <Ionicons name="logo-whatsapp" size={24} color={WHATSAPP_COLOR} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openDialer(item)}>
                    <Ionicons name="call-outline" size={24} color={ACCENT_BLUE} />
                </TouchableOpacity>
                {item.email && (
                    <TouchableOpacity onPress={() => sendEmail(item)}>
                        <Ionicons name="mail-outline" size={24} color={ACCENT_BLUE} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const getActiveData = (tab) => {
        switch (tab) {
            case "CHIT":
                return { customers: chitCustomers, isLoading: isChitLoading, displayName: "Chit" };
            case "GOLD":
                return { customers: goldCustomers, isLoading: isGoldLoading, displayName: "Gold" };
            case "LOAN":
                return { customers: loanCustomers, isLoading: isLoanLoading, displayName: "Loan" };
            case "PIGMY":
                return { customers: pigmyCustomers, isLoading: isPigmyLoading, displayName: "Pigmy" };
            default:
                return { customers: [], isLoading: false, displayName: "Unknown" };
        }
    };
    
    const { customers, isLoading, displayName } = getActiveData(activeTab);


    const filteredCustomers = customers.filter(customer =>
        customer.full_name && customer.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient
                colors={TOP_GRADIENT}
                style={styles.topContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerSpacer}>
                    <Header />
                </View>

                {/* Title and Count */}
                <View style={styles.pageTitleContainer}>
                    <Text style={styles.title}>{displayName} Customers</Text>
                    <View style={styles.totalCountBadge}>
                        <Text style={styles.totalCountText}>{filteredCustomers.length || 0}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Main Content Area */}
            <View style={styles.mainContentArea}>
                
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color={TEXT_GREY} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={`Search by name...`}
                        placeholderTextColor={TEXT_GREY}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                
                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    {["CHIT", "GOLD", "LOAN", "PIGMY"].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => { setActiveTab(tab); setSearch(""); }}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === tab && styles.activeTabText,
                                ]}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1).toLowerCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                {/* Customer List/Loading/No Data */}
                <View style={{ flex: 1 }}>
                    {isLoading && <ActivityIndicator size="large" color={ACCENT_BLUE} style={{ marginTop: 20 }} />}
                    
                    {!isLoading && filteredCustomers.length > 0 && (
                        <FlatList
                            data={filteredCustomers}
                            keyExtractor={(item, index) => item._id || item.userId || index.toString()} 
                            renderItem={renderCustomerCard}
                            contentContainerStyle={{ paddingBottom: 100 }}
                        />
                    )}

                    {!isLoading && filteredCustomers.length === 0 && (
                        <View style={styles.noDataContainer}>
                            <Image source={noImage} style={styles.noImage} />
                            <Text style={styles.noDataText}>
                                {customers.length === 0 && search === ""
                                    ? `No ${displayName.toLowerCase()} customers found for this agent.`
                                    : `No results found for "${search}" in ${displayName.toLowerCase()} customers.`}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            
            {/* Floating Action Button for Add Customer */}
            <TouchableOpacity
                onPress={() => navigation.navigate("AddCustomer", { user: user })}
                style={styles.floatingButton}
                activeOpacity={0.8}
            >
                <Ionicons name="add-outline" size={30} color={CARD_BG} />
                <Text style={styles.floatingButtonText}>Add</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};
// ** END OF UPDATED COMPONENT **

const styles = StyleSheet.create({
    // --- LAYOUT STYLES (from Routes.js) ---
    safeArea: { 
        flex: 1, 
        backgroundColor: TOP_GRADIENT[0] 
    },
    topContainer: {
        paddingHorizontal: 22,
        paddingBottom: 20,
        // Match Routes component shadow (Optional: keep the original shadow logic for the gradient)
        // shadowColor: MODERN_PRIMARY, 
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.15,
        // shadowRadius: 3,
        // elevation: 3,
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        paddingHorizontal: 22,
        marginTop: -20, 
        paddingTop: 30,
    },
    headerSpacer: { 
        paddingTop: 10,
        paddingBottom: 5 
    }, 

    // --- TITLE STYLES (from Routes.js) ---
    pageTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 5,
    },
    title: {
        fontSize: 24, 
        fontWeight: "800",
        color: CARD_BG, // White text
    },
    totalCountBadge: {
        backgroundColor: CARD_BG,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 15,
    },
    totalCountText: {
        fontSize: 16,
        fontWeight: '700',
        color: ACCENT_BLUE,
    },

    // --- SEARCH STYLES (Modernized) ---
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG, 
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: MODERN_PRIMARY,
    },

    // --- TAB STYLES (Modernized) ---
    tabContainer: {
        flexDirection: "row",
        backgroundColor: CARD_BG,
        borderRadius: 15,
        marginBottom: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: ACCENT_BLUE, // Use the accent blue as the active color
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        color: TEXT_GREY,
        fontWeight: "600",
        textAlign: 'center',
    },
    activeTabText: {
        color: CARD_BG, // White text on active tab background
        fontWeight: 'bold',
    },

    // --- CARD STYLES (from Routes.js) ---
    card: {
        backgroundColor: CARD_BG,
        flexDirection: "row",
        justifyContent: 'space-between',
        padding: 18,
        marginVertical: 8, // Increased margin for separation
        borderRadius: 15,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, 
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderLeftWidth: 5,
        borderLeftColor: ACCENT_BLUE, // Use ACCENT_BLUE for left border
        alignItems: 'center',
    },
    leftSection: {
        flex: 1,
        paddingRight: 10,
    },
    rightSection: {
        flexDirection: 'row',
        gap: 15, // Reduced gap slightly
        paddingLeft: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: "800", // Increased weight to match Routes.js card text
        color: MODERN_PRIMARY,
        marginBottom: 5,
    },
    phoneNumber: {
        fontSize: 14,
        color: TEXT_GREY, // Grey text
        marginBottom: 2,
    },
    schemeType: {
        fontSize: 14,
        color: ACCENT_BLUE, // Use accent color
        fontWeight: "700",
        marginTop: 5,
    },
    
    // --- NO DATA STYLES (Improved) ---
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        padding: 20,
    },
    noDataText: {
        fontSize: 16,
        color: TEXT_GREY,
        textAlign: 'center',
        fontWeight: '500',
    },
    noImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        opacity: 0.5,
        marginBottom: 15,
    },
    
    // --- FLOATING BUTTON STYLES (Modernized) ---
    floatingButton: {
        position: "absolute",
        bottom: 100, // Lowered it slightly
        right: 22,
        backgroundColor: ACCENT_BLUE, // Use accent blue
        borderRadius: 35,
        width: 70,
        height: 70,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: 'column', // Stack icon and text
        elevation: 8, 
        shadowColor: MODERN_PRIMARY, 
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    floatingButtonText: { 
        color: CARD_BG, 
        fontSize: 12, 
        fontWeight: "bold",
        marginTop: -5, // Move text up slightly
    }
});

export default ViewCustomer;