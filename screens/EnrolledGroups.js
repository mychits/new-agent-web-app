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
    ScrollView,
    TextInput
} from "react-native";

import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Feather } from "@expo/vector-icons";

// --- DESIGN CONSTANTS COPIED from EnrollCustomer.js ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
// ---------------------------------------------


const EnrolledGroups = ({ route, navigation }) => {
    const { user } = route.params;
    const [chitCustomerLength, setChitCustomerLength] = useState(0);
    const [goldCustomerLength, setGoldCustomerLength] = useState(0);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [customers, setCustomer] = useState([]);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [searchQuery, setSearchQuery] = useState("");
    
    const sendWhatsappMessage = async (item) => {
        if (item.user_id?.phone_number) {
            // Note: The original code used a hardcoded "Hello there!" message.
            let url = `whatsapp://send?phone=${
                item.user_id?.phone_number
            }&text=${encodeURIComponent("Hello there!")}`;

            Linking.canOpenURL(url)
                .then((supported) => {
                    if (supported) {
                        return Linking.openURL(url);
                    } else {
                        Alert.alert("WhatsApp is not installed");
                    }
                })
                .catch((err) => console.error("An error occurred", err));
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
                    }
                })
                .catch((err) => {
                    Alert.alert("Somthing went wrong!");
                });
        } else {
            return;
        }
    };

    useEffect(() => {
        const fetchEnrolledCustomers = async () => {
            // Assuming goldBaseUrl for gold is 'http://13.60.68.201:3000/api' based on original code.
            const goldBaseUrl = "http://13.60.68.201:3000/api";
            const currentUrl = activeTab === "CHIT" ? `${baseUrl}` : goldBaseUrl; 
            
            try {
                activeTab === "CHIT" ? setIsChitLoading(true) : setIsGoldLoading(true);
                const response = await axios.get(
                    `${currentUrl}/enroll/get-enroll-by-agent-id/${user.userId}`
                );
                if (response.status >= 400)
                    throw new Error("Failed to fetch Enrolled customer Data");
                setCustomer(response.data);
                activeTab === "CHIT"
                    ? setChitCustomerLength(response?.data?.length)
                    : setGoldCustomerLength(response?.data?.length);
            } catch (err) {
                console.log(err, "error");
                setCustomer([]);
            } finally {
                activeTab === "CHIT"
                    ? setIsChitLoading(false)
                    : setIsGoldLoading(false);
            }
        };
        fetchEnrolledCustomers();
    }, [activeTab, user]);

    const filteredCustomers = customers.filter(customer => {
        const groupName = customer?.group_id?.group_name || "";
        const userName = customer?.user_id?.full_name || "";
        const query = searchQuery.toLowerCase();
        return groupName.toLowerCase().includes(query) || userName.toLowerCase().includes(query);
    });

    const renderEnrolledCustomerCard = ({ item }) => (
        <Pressable
            onPress={() => openDialer(item)}
            onLongPress={() => sendWhatsappMessage(item)}
            style={styles.card}
        >
            <View style={styles.leftSection}>
                {/* User Name as Main Title */}
                <Text style={styles.groupName}>
                    {item?.user_id?.full_name || "No User Name"}
                </Text>
                {/* Group Name as Subtitle */}
                <Text style={styles.name}>
                    {item?.group_id?.group_name || "No Group Name"}
                </Text>
            </View>
            <View style={styles.rightSection}>
                <View style={styles.ticketContainer}>
                    <Text style={styles.ticketsText}>
                        {`TNo : ${item?.tickets} `}
                    </Text>
                </View>
                {/* Updated icon to Feather for consistency */}
                <Feather name="chevron-right" style={styles.arrowIcon} /> 
            </View>
        </Pressable>
    );


    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            >
                {/* Top Header Section with Gradient (Copied from EnrollCustomer.js) */}
                <LinearGradient
                    colors={TOP_GRADIENT}
                    style={styles.topContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerSpacer}>
                        <Header />
                    </View>

                    <View style={styles.titleContainer}>
                        <View>
                            <Text style={styles.title}>Enrolled Groups</Text>
                            <Text style={styles.subtitle}>Groups enrolled by you</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Main Content Area (White Background with Border Radius) */}
                <View style={styles.mainContentArea}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >
                        {/* Search Input and Icon - Styled like inputs in EnrollCustomer.js */}
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={20} color={TEXT_GREY} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name or group"
                                placeholderTextColor={TEXT_GREY}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        {/* End Search Input */}
                        
                        {/* Tab Container - Styled to match the modern look */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                                onPress={() => setActiveTab("CHIT")}
                            >
                                <MaterialIcons
                                    name="groups"
                                    size={20}
                                    color={activeTab === "CHIT" ? MODERN_PRIMARY : TEXT_GREY}
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
                                onPress={() => setActiveTab("GOLD")}
                            >
                                <MaterialIcons
                                    name="diamond"
                                    size={20}
                                    color={activeTab === "GOLD" ? MODERN_PRIMARY : TEXT_GREY}
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

                        {/* FlatList/Content Area */}
                        {activeTab === "CHIT" ? (
                            isChitLoading ? (
                                <ActivityIndicator
                                    size="large"
                                    color={ACCENT_BLUE}
                                    style={styles.loadingIndicator}
                                />
                            ) : chitCustomerLength === 0 && filteredCustomers.length === 0 ? (
                                <Text style={styles.noLeadsText}>
                                    No CHIT enrolled customers found.
                                </Text>
                            ) : (
                                <FlatList
                                    data={filteredCustomers}
                                    keyExtractor={(item, index) => item._id || index.toString()}
                                    renderItem={renderEnrolledCustomerCard}
                                    ListEmptyComponent={() => (
                                        <Text style={styles.noLeadsText}>No matching groups found.</Text>
                                    )}
                                    scrollEnabled={false} // Use parent ScrollView
                                    contentContainerStyle={styles.listContent}
                                />
                            )
                        ) : isGoldLoading ? (
                            <ActivityIndicator
                                size="large"
                                color={ACCENT_BLUE}
                                style={styles.loadingIndicator}
                            />
                        ) : goldCustomerLength === 0 && filteredCustomers.length === 0 ? (
                            <Text style={styles.noLeadsText}>
                                No GOLD CHIT enrolled customers found.
                            </Text>
                        ) : (
                            <FlatList
                                data={filteredCustomers}
                                keyExtractor={(item, index) => item._id || index.toString()}
                                renderItem={renderEnrolledCustomerCard}
                                ListEmptyComponent={() => (
                                    <Text style={styles.noLeadsText}>No matching groups found.</Text>
                                )}
                                scrollEnabled={false} // Use parent ScrollView
                                contentContainerStyle={styles.listContent}
                            />
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // --- LAYOUT STYLES (Copied from EnrollCustomer.js) ---
    safeArea: { 
        flex: 1, 
        backgroundColor: TOP_GRADIENT[0] 
    },
    topContainer: {
        paddingHorizontal: 16,
        paddingBottom: 25, 
        zIndex: 1,
    },
    headerSpacer: { 
        paddingTop: 20, 
        paddingBottom: 5 
    }, 
    mainContentArea: {
        flex: 1,
        backgroundColor: CARD_BG, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        marginTop: -20, 
        zIndex: 2, 
    },
    scrollContainer: { 
        paddingBottom: 50, 
        paddingTop: 30, 
        paddingHorizontal: 22,
    },

    // --- TITLE STYLES (UPDATED for position and center alignment) ---
    titleContainer: {
        marginTop: 15, // Adjusted from 30 to move it up
        marginBottom: 5, 
        paddingHorizontal: 6,
        alignItems: 'center', // Centers the content horizontally
    },
    title: {
        fontSize: 28, 
        fontWeight: "900",
        color: CARD_BG, 
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        textAlign: 'center', // Centers the text lines
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)', 
        fontWeight: '500',
        marginTop: 4,
        textAlign: 'center', // Centers the text lines
    },
    
    // --- SEARCH STYLES (Styled like inputGroup in EnrollCustomer.js) ---
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
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: MODERN_PRIMARY,
    },

    // --- TAB STYLES (Updated to modern look) ---
    tabContainer: {
        flexDirection: "row",
        backgroundColor: SUBTLE_BG_GREY, // Use very light grey for background
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
        borderRadius: 12, // Apply border radius here for inner tab
    },
    activeTab: {
        backgroundColor: ACCENT_BLUE, // Use ACCENT_BLUE for active tab background
    },
    tabText: {
        fontSize: 15,
        color: TEXT_GREY,
        fontWeight: "600",
        marginLeft: 5,
    },
    activeTabText: {
        color: CARD_BG, // White text for active tab
        fontWeight: 'bold',
    },

    // --- CARD STYLES (Updated to modern look) ---
    listContent: {
        gap: 10, // Consistent spacing between cards
    },
    card: {
        backgroundColor: CARD_BG,
        flexDirection: "row",
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 12,
        borderLeftWidth: 4, // Left border for highlight
        borderColor: ACCENT_BLUE, // Use ACCENT_BLUE for highlight
        // Modern subtle shadow
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
        borderWidth: 1, // Add subtle border
        borderColor: BORDER_COLOR,
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        alignItems: "flex-end",
        flexDirection: 'row',
        gap: 8,
    },
    groupName: {
        fontSize: 16,
        fontWeight: "700",
        color: MODERN_PRIMARY, // Dark text for main name
        marginBottom: 3,
    },
    name: {
        fontSize: 14,
        color: TEXT_GREY, // Grey text for group name (subtitle)
    },
    ticketContainer: {
        backgroundColor: ACCENT_BLUE + '10', // Very light blue background
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    ticketsText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: ACCENT_BLUE, // Blue text for ticket number
    },
    arrowIcon: {
        fontSize: 24,
        color: TEXT_GREY, // Subtle grey arrow
    },

    // --- MISC STYLES ---
    loadingIndicator: { 
        marginTop: 20 
    },
    noLeadsText: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
        color: TEXT_GREY,
        paddingHorizontal: 20,
    },
});

export default EnrolledGroups;