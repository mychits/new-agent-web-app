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
// Removed: import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color"; 
import Header from "../components/Header"; 
import baseUrl from "../constants/baseUrl"; 
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";
const noImage = require('../assets/no.png'); 

// Function to send WhatsApp message (remains unchanged)
const whatsappMessage = "Hello from our app!";

const sendWhatsappMessage = (item) => {
    // ... (Your existing sendWhatsappMessage function)
    if (item?.phone_number) {
        // Sanitizing phone number for WhatsApp URL
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

// Function to open phone dialer (remains unchanged)
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

// Function to send email (remains unchanged)
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
    // Destructure user from route.params
    const { user } = route.params;
    
    // Define the referred type (must match what is used in AddCustomer.js and your backend)
    const REFERRED_TYPE = "Employee"; 

    // State management for customer data and loading status
    const [chitCustomers, setChitCustomers] = useState([]);
    const [goldCustomers, setGoldCustomers] = useState([]);
    const [loanCustomers, setLoanCustomers] = useState([]);
    const [pigmyCustomers, setPigmyCustomers] = useState([]);

    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [isLoanLoading, setIsLoanLoading] = useState(false);
    const [isPigmyLoading, setIsPigmyLoading] = useState(false);

    // State for active tab and search input
    const [activeTab, setActiveTab] = useState("CHIT");
    const [search, setSearch] = useState("");

    // Memoized function for fetching data
    const fetchCustomers = useCallback(async (tab) => {
        // Determine the base URL and API path based on the tab
        let currentUrl;
        let apiPath; 
        let setLoading, setCustomers;

        switch (tab) {
            case "CHIT":
                // Chit Route: /user/get-users-by-agent-id/:agent_id
                currentUrl = `${baseUrl}`; 
                apiPath = `/user/get-users-by-agent-id/${user.userId}`; 
                setLoading = setIsChitLoading;
                setCustomers = setChitCustomers;
                break;
            case "GOLD":
                // Gold Route: /user/get-users-by-agent-id/:agent_id (assuming different base URL)
                currentUrl = "http://13.60.68.201:3000/api"; // Existing GOLD URL
                apiPath = `/user/get-users-by-agent-id/${user.userId}`;
                setLoading = setIsGoldLoading;
                setCustomers = setGoldCustomers;
                break;
            case "LOAN": 
                // CORRECTED Loan Route: /loans/agent-employee/:referred_type/:agent_id/customer
                currentUrl = `${baseUrl}`;  // Assuming loan service uses the main baseUrl
                apiPath = `/loans/agent-employee/${REFERRED_TYPE}/${user.userId}/customer`;
                setLoading = setIsLoanLoading;
                setCustomers = setLoanCustomers;
                break;
            case "PIGMY": 
                // CORRECTED Pigmy Route: /pigme/agent-employee/:referred_type/:agent_id/customer
                currentUrl = `${baseUrl}`;  // Assuming pigmy service uses the main baseUrl
                apiPath = `/pigme/agent-employee/${REFERRED_TYPE}/${user.userId}/customer`;
                setLoading = setIsPigmyLoading;
                setCustomers = setPigmyCustomers;
                break;
            default:
                return; // Do nothing if tab is unrecognized
        }
        
        try {
            setLoading(true);
            
            // Use the dynamic 'apiPath' constructed above
            const response = await axios.get(
                `${currentUrl}${apiPath}`
            );

            if (response.status >= 400) {
                throw new Error("Failed to fetch Customer Data");
            }
            
            let customerData = [];

            if (tab === "LOAN") {
                // Handle the nested structure of Pigmy/Loan response
                const rawDatas = response.data.pigmeDatas || response.data.loanDatas || [];
                
                customerData = rawDatas
                    // Map the nested customer object and add scheme type for display
                    .map(item => {
                        // 🎯 CORRECTION APPLIED HERE: Use item.customer, but fall back to 'item' if 'customer' is null/undefined
                        const customerDetails = item.borrower || item; 

                        if (customerDetails && customerDetails.full_name) {
                            return {
                                // Spread customer details (full_name, phone_number, etc.)
                                ...customerDetails, 
                                // Add the scheme type for the card display
                                scheme_type: tab.toLowerCase(),
                                // Ensure a unique key using the customer's ID or scheme's ID
                                _id: customerDetails._id || item._id, 
                            };
                        }
                        return null; // Ignore entries without a customer
                    })
                    .filter(item => item); // Filter out nulls

            } else if (tab === "PIGMY") {
                  const rawDatas = response.data.pigmeDatas || response.data.loanDatas || [];
                
                customerData = rawDatas
                    // Map the nested customer object and add scheme type for display
                    .map(item => {
                        // 🎯 CORRECTION APPLIED HERE: Use item.customer, but fall back to 'item' if 'customer' is null/undefined
                        const customerDetails = item.customer || item; 

                        if (customerDetails && customerDetails.full_name) {
                            return {
                                // Spread customer details (full_name, phone_number, etc.)
                                ...customerDetails, 
                                // Add the scheme type for the card display
                                scheme_type: tab.toLowerCase(),
                                // Ensure a unique key using the customer's ID or scheme's ID
                                _id: customerDetails._id || item._id, 
                            };
                        }
                        return null; // Ignore entries without a customer
                    })
                    .filter(item => item); // Filter out nulls
              
            }
            else {
                // Handle the simpler array structure of Chit/Gold response
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
    }, [user.userId, baseUrl, REFERRED_TYPE]); // Dependency on user.userId, baseUrl, and REFERRED_TYPE

    // Effect for initial load or tab change (remains the same)
    useEffect(() => {
        // Fetch data for the currently active tab
        fetchCustomers(activeTab); 
    }, [activeTab, fetchCustomers]);

    // Effect to re-fetch data when the screen comes into focus (remains the same)
    useFocusEffect(
        useCallback(() => {
            fetchCustomers(activeTab);
            return () => setSearch(""); // Optional: Clear search when screen blurs
        }, [activeTab, fetchCustomers]) 
    );

    // Render function for each customer item in the FlatList (remains the same)
    const renderCustomerCard = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.leftSection}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.phoneNumber}>{item.phone_number}</Text>
                <Text style={styles.schemeType}>
                    {/* Safely display scheme type, capitalized */}
                    {item.scheme_type 
                        ? item.scheme_type.charAt(0).toUpperCase() + item.scheme_type.slice(1) 
                        : 'N/A'}
                </Text>
                {/* Optional: Add email contact icon if email is present */}
                {item.email && (
                    <TouchableOpacity onPress={() => sendEmail(item)} style={{ marginTop: 10 }}>
                        <Icon name="envelope" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.rightSection}>
                <TouchableOpacity onPress={() => sendWhatsappMessage(item)}>
                    <Icon name="whatsapp" size={24} color="#25D366" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openDialer(item)}>
                    <Icon name="phone" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    // ** UPDATED: Determine current data based on active tab **
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


    // Filter customers based on search input (case-insensitive)
    const filteredCustomers = customers.filter(customer =>
        customer.full_name && customer.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.white }}>
            <LinearGradient
                colors={["#1aa2ccff", "#1aa2ccff"]}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Main content view */}
                <View style={{ flexGrow: 1, marginHorizontal: 22, marginTop: 52 }}>
                    <Header />
                    
                    {/* Title and Count - UPDATED to use displayName */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{displayName} Customers</Text>
                        <Text style={styles.totalCountText}>{filteredCustomers.length || 0}</Text>
                    </View>
                    
                    {/* Search Bar (remains the same) */}
                    <View style={styles.searchContainer}>
                        <Icon name="search" size={20}  style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search by name...`}
                            
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    
                    {/* ** UPDATED: Tab Navigation to include LOAN and PIGMY ** */}
                    <View style={styles.tabContainer}>
                        {/* CHIT Tab */}
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                            onPress={() => { setActiveTab("CHIT"); setSearch(""); }} // Clear search on tab switch
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "CHIT" && styles.activeTabText,
                                ]}
                            >
                                Chit
                            </Text>
                        </TouchableOpacity>

                        {/* GOLD Tab */}
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
                            onPress={() => { setActiveTab("GOLD"); setSearch(""); }} // Clear search on tab switch
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "GOLD" && styles.activeTabText,
                                ]}
                            >
                                Gold
                            </Text>
                        </TouchableOpacity>

                        {/* LOAN Tab */}
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "LOAN" && styles.activeTab]}
                            onPress={() => { setActiveTab("LOAN"); setSearch(""); }} 
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "LOAN" && styles.activeTabText,
                                ]}
                            >
                                Loan
                            </Text>
                        </TouchableOpacity>

                        {/* PIGMY Tab */}
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "PIGMY" && styles.activeTab]}
                            onPress={() => { setActiveTab("PIGMY"); setSearch(""); }} 
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "PIGMY" && styles.activeTabText,
                                ]}
                            >
                                Pigmy
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Customer List/Loading/No Data (remains the same logic) */}
                    <View style={{ minHeight: 200, flex: 1 }}>
                        {isLoading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}
                        
                        {!isLoading && filteredCustomers.length > 0 && (
                            <FlatList
                                data={filteredCustomers}
                                // Use item._id as key, falling back to index for stability
                                keyExtractor={(item, index) => item._id || item.userId || index.toString()} 
                                renderItem={renderCustomerCard}
                                contentContainerStyle={{ paddingBottom: 80 }} // Add padding for the Floating Action Button
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
            </LinearGradient>
            
            {/* Floating Action Button for Add Customer (remains the same) */}
            <TouchableOpacity
                onPress={() => navigation.navigate("AddCustomer", { user: user })}
                style={styles.floatingButton}
            >
                <Text style={styles.floatingButtonText}>+ Add</Text>
            </TouchableOpacity>
        </View>
    );
};
// ** END OF UPDATED COMPONENT **

const styles = StyleSheet.create({
    gradientOverlay: {
        flex: 1,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
    },
    totalCountText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 10,
     
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    // ** UPDATED: Adjusted tab flex to accommodate 4 tabs **
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 15,
        marginBottom: 15,
        padding: 4,
       
    },
    tab: {
        flex: 1, // Distributes space equally among the 4 tabs
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#f8c009ff', // Accent color for active tab
        shadowColor: '#da8201',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    tabText: {
        fontSize: 13, // Reduced font size to fit all 4 tabs on smaller screens
        color: "#666",
        fontWeight: "500",
        textAlign: 'center',
    },
    activeTabText: {
        color: '#fff', // White text on active tab background
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.85)", // Slightly more opaque card
        flexDirection: "row",
        justifyContent: 'space-between',
        padding: 18,
        marginVertical: 6,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
        alignItems: 'center',
        borderLeftWidth: 5,
        borderLeftColor: COLORS.primary, // Visual cue
    },
    leftSection: {
        flex: 1,
        paddingRight: 10,
    },
    rightSection: {
        flexDirection: 'row',
        gap: 20,
        paddingLeft: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
        marginBottom: 5,
    },
    phoneNumber: {
        fontSize: 14,
        color: "#666",
        marginBottom: 2,
    },
    schemeType: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "600",
        marginTop: 5,
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        padding: 20,
    },
    noDataText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        fontWeight: '500',
    },
    noImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        opacity: 0.6,
        marginBottom: 15,
    },
    floatingButton: {
        position: "absolute",
        bottom: 60,
        right: 30,
        backgroundColor: COLORS.primary,
        borderRadius: 35,
        width: 70,
        height: 70,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    floatingButtonText: { 
        color: "white", 
        fontSize: 14, 
        fontWeight: "bold" 
    }
});

export default ViewCustomer;