import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    SafeAreaView,
    StatusBar,
} from "react-native";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import Header from "../components/Header";
import COLORS from "../constants/color"; // Assuming this defines standard colors
import axios from "axios";
import baseUrl from "../constants/baseUrl"; // Assuming this is correct
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// --- DESIGN CONSTANTS ---
const PRIMARY_GRADIENT_COLOR = "#1aa2ccff";
const DARK_PRIMARY_TEXT = "#053B90"; // Dark blue for titles
const ACCENT_GOLD = "#f8c009ff"; // Gold/Yellow for highlights (like avatar border)
const ACCENT_BLUE = "#1796d1ff"; // Slightly richer blue for buttons/icons
const CARD_RADIUS = 20;

const Profile = ({ route, navigation }) => {
    // Safely destructure user from route.params
    const { user } = route.params || {};
    const [form, setForm] = useState({
        darkMode: false,
        emailNotifications: true,
        pushNotifications: false,
    });
    const [agent, setAgent] = useState({}); // Initialize as empty object

    useEffect(() => {
        const fetchAgent = async () => {
            if (!user || !user.userId) return;

            try {
                const response = await axios.get(
                    `${baseUrl}/agent/get-agent-by-id/${user.userId}`
                );
                if (response.data) {
                    setAgent(response.data);
                } else {
                    console.error("Unexpected API response format:", response.data);
                }
            } catch (error) {
                console.error("Error fetching agent data:", error);
            }
        };

        fetchAgent();
    }, [user]);

    const removeUserLocalStorage = async () => {
        try {
            await AsyncStorage.clear();
        } catch (err) {
            console.log("failed to remove user from localstorage");
        }
    };

    const handleLogout = () => {
        removeUserLocalStorage();
        // Navigating to Login and potentially resetting the stack (depending on your navigation structure)
        navigation.navigate("Login", { user });
    };

    const menuItems = [
        { name: "Language", icon: "globe-outline", component: Ionicons, value: "English", action: () => { } },
        { name: "Collections", icon: "briefcase", component: MaterialCommunityIcons, action: () => navigation.navigate("PaymentNavigator") },
        { name: "Payments", icon: "credit-card-outline", component: MaterialCommunityIcons, action: () => navigation.navigate("PayNavigation", { user: user }) },
        { name: "Leads", icon: "account-plus", component: MaterialCommunityIcons, action: () => navigation.navigate("PayNavigation", { screen: "ViewLeads", params: { user: user } }) },
        { name: "Commissions", icon: "cash-multiple", component: MaterialCommunityIcons, action: () => navigation.navigate("Commissions") },
        { name: "About MyChits", icon: "information-circle-outline", component: Ionicons, action: () => navigation.navigate("AboutMyChits") },
        { name: "Help & Support", icon: "help-circle-outline", component: Ionicons, action: () => navigation.navigate("HelpAndSupport") },
    ];

    return (
        <View style={styles.fullContainer}>
            <LinearGradient
                colors={[PRIMARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
                >
                    {/* Spacer increased to 40 to push Header further down */}
                    <View style={{ height: 40 }} /> 
                    <Header title="Profile" navigation={navigation} userId={user?.userId} />
                    
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.scrollViewContent}
                        style={styles.scrollViewStyle}
                    >
                        {/* Main White Content Card */}
                        <View style={styles.mainContainer}>
                            <View style={styles.profile}>
                                <Image
                                    alt="Profile Picture"
                                    source={require('../assets/P.png')} // Make sure this asset exists
                                    style={styles.profileAvatar}
                                />
                                <View style={styles.profileInfo}>
                                    <Text style={styles.agentName}>{agent.name || 'Agent Name'}</Text>
                                    <Text style={styles.agentPhone}>{agent.phone_number || 'N/A'}</Text>
                                </View>
                            </View>

                            {/* Menu Section */}
                            <View style={styles.section}>
                                <View style={styles.sectionBody}>
                                    {menuItems.map((item, index) => {
                                        const IconComponent = item.component;
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={item.action}
                                                style={styles.menuCard}
                                            >
                                                <View style={styles.rowIcon}>
                                                    <IconComponent color="#fff" name={item.icon} size={20} />
                                                </View>
                                                <Text style={styles.rowLabel}>{item.name}</Text>
                                                <View style={styles.rowSpacer} />
                                                {item.value && <Text style={styles.rowValue}>{item.value}</Text>}
                                                <MaterialCommunityIcons
                                                    color="#C6C6C6"
                                                    name="chevron-right"
                                                    size={20}
                                                />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>

                        {/* Logout Button (Outside main card for emphasis) */}
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                            <View style={styles.profileAction}>
                                <Text style={styles.profileActionText}>Logout</Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        backgroundColor: PRIMARY_GRADIENT_COLOR, // Fallback/base
    },
    safeArea: {
        flex: 1,
        paddingTop: 0, // Handled by Header
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollViewStyle: {
        flex: 1,
        // The Header will sit above this area
    },
    scrollViewContent: {
        paddingTop: 10,
        paddingBottom: height * 0.1, // Ensure space for the floating logout button
        alignItems: 'center', // Center content horizontally
    },

    // --- MAIN CONTENT CARD ---
    mainContainer: {
        backgroundColor: "#fff",
        borderRadius: CARD_RADIUS,
        marginHorizontal: width * 0.05, // Responsive margin
        width: width * 0.9, // Set a specific width to center it
        marginTop: 10,
        marginBottom: 20,
        paddingVertical: 10,
        shadowColor: "rgba(0, 0, 0, 0.15)", // Deeper shadow for card effect
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
        borderWidth: 0.5,
        borderColor: '#E8E8E8',
    },

    // --- PROFILE SECTION ---
    profile: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 9999,
        borderWidth: 4,
        borderColor: ACCENT_GOLD, // Gold Accent Border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    profileInfo: {
        marginLeft: 15,
        alignItems: 'flex-start',
    },
    agentName: {
        fontSize: 24,
        fontWeight: "700",
        color: DARK_PRIMARY_TEXT, // Dark Blue Text
        marginBottom: -2,
    },
    agentPhone: {
        fontSize: 16,
        fontWeight: "500",
        color: "#666666",
    },

    // --- MENU ITEMS ---
    section: {
        paddingTop: 10,
    },
    sectionBody: {
        paddingHorizontal: 12,
    },
    menuCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: 'rgba(0, 0, 0, 0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        // Added a subtle border for definition
        borderColor: '#f0f0f0',
        borderWidth: 1, 
    },
    rowIcon: {
        width: 35,
        height: 35,
        borderRadius: 15,
        backgroundColor: ACCENT_BLUE, // Rich Blue Icon background
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    rowSpacer: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
    },
    rowValue: {
        fontSize: 14,
        fontWeight: "500",
        color: "#8B8B8B",
        marginRight: 8,
    },

    // --- LOGOUT BUTTON ---
    logoutButton: {
        marginTop: 20,
        marginBottom: 40, // Increased margin for bottom
        width: width * 0.9, // Match main container width
        alignSelf: 'center',
    },
    profileAction: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: DARK_PRIMARY_TEXT, // Use Dark Blue for Logout button
        borderRadius: 15, // Slightly less rounded than main card, more rounded than menu card
        elevation: 5,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    profileActionText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        letterSpacing: 0.5,
    },
});

export default Profile;