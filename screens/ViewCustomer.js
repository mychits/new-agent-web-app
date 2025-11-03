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
import COLORS from "../constants/color"; // Assuming this path is correct in your project structure
import Header from "../components/Header"; // Assuming this path is correct in your project structure
import baseUrl from "../constants/baseUrl"; // Assuming this path is correct in your project structure
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";
const noImage = require('../assets/no.png'); // Assuming this path is correct in your project structure

// Function to send WhatsApp message
const whatsappMessage = "Hello from our app!";

const sendWhatsappMessage = (item) => {
    // Note: Alert is used here as it was in the original code, but remember that in a web environment, 
    // it can be disruptive. In a real React Native app, this is fine.
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

// Function to open phone dialer
const openDialer = (item) => {
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

// Function to send email
const sendEmail = (item) => {
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

    // State management for customer data and loading status
    const [chitCustomers, setChitCustomers] = useState([]);
    const [goldCustomers, setGoldCustomers] = useState([]);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    // State for active tab and search input
    const [activeTab, setActiveTab] = useState("CHIT");
    const [search, setSearch] = useState("");

    // Memoized function for fetching data
    const fetchCustomers = useCallback(async (tab) => {
        const currentUrl =
            tab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
        
        try {
            if (tab === "CHIT") {
                setIsChitLoading(true);
            } else {
                setIsGoldLoading(true);
            }
            
            const response = await axios.get(
                `${currentUrl}/user/get-users-by-agent-id/${user.userId}`
            );

            if (response.status >= 400) {
                throw new Error("Failed to fetch Customer Data");
            }

            if (tab === "CHIT") {
                setChitCustomers(response.data);
            } else {
                setGoldCustomers(response.data);
            }
        } catch (err) {
            console.error("Fetch customers error:", err);
            Alert.alert("Data Error", "Could not fetch customer data. Please check network connection.");
            if (tab === "CHIT") {
                setChitCustomers([]);
            } else {
                setGoldCustomers([]);
            }
        } finally {
            if (tab === "CHIT") {
                setIsChitLoading(false);
            } else {
                setIsGoldLoading(false);
            }
        }
    }, [user.userId]); // Dependency on user.userId

    // Effect for initial load or tab change
    useEffect(() => {
        fetchCustomers(activeTab);
    }, [activeTab, fetchCustomers]);

    // Effect to re-fetch data when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchCustomers(activeTab);
            // Cleanup function is typically not needed for a simple fetch, but the dependency array is crucial.
            // The dependency on activeTab ensures re-fetch if the tab changes while the screen is out of focus.
        }, [activeTab, fetchCustomers]) 
    );

    // Render function for each customer item in the FlatList
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

    // Determine current data based on active tab
    const customers = activeTab === "CHIT" ? chitCustomers : goldCustomers;
    const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;

    // Filter customers based on search input (case-insensitive)
    const filteredCustomers = customers.filter(customer =>
        customer.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.white }}>
            <LinearGradient
                colors={['#b6e4ebff', '#1796d1ff']}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Main content view */}
                <View style={{ flexGrow: 1, marginHorizontal: 22, marginTop: 52 }}>
                    <Header />
                    
                    {/* Title and Count */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{activeTab === "CHIT" ? "Chit" : "Gold"} Customers</Text>
                        <Text style={styles.totalCountText}>{filteredCustomers.length || 0}</Text>
                    </View>
                    
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Icon name="search" size={20}  style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search by name...`}
                           
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    
                    {/* Tab Navigation */}
                    <View style={styles.tabContainer}>
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
                                Chit Schemes
                            </Text>
                        </TouchableOpacity>
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
                                Gold Schemes
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Customer List/Loading/No Data */}
                    <View style={{ minHeight: 200, flex: 1 }}>
                        {isLoading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}
                        
                        {!isLoading && filteredCustomers.length > 0 && (
                            <FlatList
                                data={filteredCustomers}
                                keyExtractor={(item, index) => item.userId || index.toString()} // Use a unique ID if available
                                renderItem={renderCustomerCard}
                                contentContainerStyle={{ paddingBottom: 80 }} // Add padding for the Floating Action Button
                            />
                        )}

                        {!isLoading && filteredCustomers.length === 0 && (
                            <View style={styles.noDataContainer}>
                                <Image source={noImage} style={styles.noImage} />
                                <Text style={styles.noDataText}>
                                    {customers.length === 0 && search === ""
                                        ? `No ${activeTab.toLowerCase()} customers found for this agent.`
                                        : `No results found for "${search}" in ${activeTab.toLowerCase()} customers.`}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </LinearGradient>
            
            {/* Floating Action Button for Add Customer */}
            <TouchableOpacity
                onPress={() => navigation.navigate("AddCustomer", { user: user })}
                style={styles.floatingButton}
            >
                <Text style={styles.floatingButtonText}>+ Add</Text>
            </TouchableOpacity>
        </View>
    );
};

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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
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
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 15,
        marginBottom: 15,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#da8201', // Accent color for active tab
        shadowColor: '#da8201',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    tabText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
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
        bottom: 30,
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
