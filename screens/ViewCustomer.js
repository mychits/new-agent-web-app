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
    Dimensions, // Added
    KeyboardAvoidingView, // Added
    Platform,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context"; // Added
import axios from "axios";
import COLORS from "../constants/color"; 
import Header from "../components/Header"; 
import baseUrl from "../constants/baseUrl"; 
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Feather } from "@expo/vector-icons"; // Added icons

// Get dimensions for dynamic styling
const { height } = Dimensions.get('window');

const noImage = require('../assets/no.png'); 

// --- CONSTANTS COPIED FROM RelationshipManagerReport.js/CustomerOnHold.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent
const ACCENT_GREEN = "#059669";   
const NEUTRAL_GREY = "#6b7280";   // Neutral grey for subtler text
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

const CALL_BUTTON_COLOR = "#f8c009ff"; 
const WHATSAPP_BUTTON_COLOR = "#25D366";
const EMAIL_BUTTON_COLOR = "#3498db";

// Function to send WhatsApp message (remains unchanged)
const whatsappMessage = "Hello from our app! I am following up on your registration.";

const sendWhatsappMessage = (item) => {
    if (item?.phone_number) {
        // Sanitizing phone number for WhatsApp URL
        const phoneNumber = item.phone_number.replace(/\D/g, ''); 
        let url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(whatsappMessage)}`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    Alert.alert("Error", "WhatsApp is not installed on this device.");
                }
            })
            .catch((err) => console.error("An error occurred", err));
    }
};

const openDialer = (item) => {
    const phoneNumber = item?.phone_number;
    if (!phoneNumber) return;
    try {
        Linking.openURL(`tel:${phoneNumber}`);
    } catch (err) {
        Alert.alert("Error", "Something went wrong with the dialer.");
    }
};

const handleEmail = async (email, customerName) => {
    if (!email) {
        console.warn("Attempted to email customer with no email address.");
        return;
    }
    try {
        const subject = "Following up from MyChits";
        const body = `Dear ${customerName},\n\nWe hope this message finds you well. \n\nIf you have any questions, please reply to this email or call us directly.\n\nSincerely,\nMyChits Team`;
        const url = `mailto:${email}?subject=${encodeURIComponent(
            subject
        )}&body=${encodeURIComponent(body)}`;
        await Linking.openURL(url);
    } catch (error) {
        console.error("Failed to open email client:", error);
        Alert.alert("Error", "Could not open email client.");
    }
};


const ViewCustomer = ({ route, navigation }) => {
    const { user } = route.params;
    const [customers, setCustomer] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${baseUrl}/customer/get-customer-by-agent-id/${user.userId}`
            );
            if (response.status >= 400)
                throw new Error("Failed to fetch Customer Data");
            setCustomer(response.data);
        } catch (err) {
            console.log(err, "error");
            setCustomer([]);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCustomers();
        }, [user.userId])
    );

    const filteredCustomers = customers.filter(customer =>
        customer?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => {
        const hasEmail = !!item.email;

        return (
            <TouchableOpacity 
                style={styles.customerCardStyle}
                // Double tap action (optional, but good for quick contact)
                onLongPress={() => sendWhatsappMessage(item)} 
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.customerName} numberOfLines={1}>
                        {item.full_name || 'No Name'}
                    </Text>
                    {/* Status Tag: Just a general 'Customer' tag */}
                    <View style={[styles.statusTag, { backgroundColor: ACCENT_BLUE + '20' }]}> 
                        <Text style={[styles.statusTagText, { color: ACCENT_BLUE }]}>
                            CUSTOMER
                        </Text>
                    </View>
                </View>

                {/* Customer Info (Phone & Email) */}
                <View style={styles.cardBody}>
                    {/* Phone Number (Primary visibility, separated from buttons) */}
                    <Text style={styles.groupInfoText}>
                        <Ionicons name="call-outline" size={16} color={ACCENT_BLUE} /> Phone: <Text style={styles.groupInfoValue}>{item.phone_number || 'N/A'}</Text>
                    </Text>
                    
                    {/* Display Email */}
                    {hasEmail ? ( 
                        <Text style={styles.groupInfoText}>
                            <Ionicons name="mail-outline" size={16} color={ACCENT_BLUE} /> Email: <Text style={styles.groupInfoValue}>{item.email}</Text>
                        </Text>
                    ) : null}

                    {/* Other info like schemeType is usually for enrollments, so we omit or adapt it here if needed */}
                    {item.schemeType ? (
                        <Text style={styles.groupInfoText}>
                            <MaterialCommunityIcons name="star-outline" size={16} color={ACCENT_BLUE} /> Scheme Preference: <Text style={styles.groupInfoValue}>{item.schemeType}</Text>
                        </Text>
                    ) : null}
                </View>

                {/* Contact Action Buttons */}
                <View style={styles.buttonContainer}>
                    {/* Call Button */}
                    {item.phone_number ? (
                        <TouchableOpacity
                            style={[styles.contactButton, { backgroundColor: CALL_BUTTON_COLOR }]}
                            onPress={() => openDialer(item)}
                        >
                            <Ionicons name="call" size={15} color="#fff" />
                            <Text style={styles.buttonText}>Call</Text>
                        </TouchableOpacity>
                    ) : null}
                    
                    {/* WhatsApp Button */}
                    {item.phone_number ? (
                        <TouchableOpacity
                            style={[styles.contactButton, { backgroundColor: WHATSAPP_BUTTON_COLOR }]}
                            onPress={() => sendWhatsappMessage(item)}
                        >
                            <FontAwesome5 name="whatsapp" size={15} color="#fff" />
                            <Text style={styles.buttonText}>WhatsApp</Text>
                        </TouchableOpacity>
                    ) : null}
                    
                    {/* Email Button */}
                    {hasEmail ? (
                        <TouchableOpacity
                            style={[styles.contactButton, { backgroundColor: EMAIL_BUTTON_COLOR }]}
                            onPress={() => handleEmail(item.email, item.full_name)}
                        >
                            <MaterialCommunityIcons name="email" size={15} color="#fff" />
                            <Text style={styles.buttonText}>Email</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
                <View style={styles.headerSpacer}>
                    <Header />
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Customer List</Text>
                    <Text style={styles.subtitle}>
                        Manage all customers added by you.
                    </Text>
                </View>

                <View style={styles.searchContainer}>
                    <Icon
                        name="search"
                        size={20}
                        color={NEUTRAL_GREY}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        value={search}
                        onChangeText={(text) => setSearch(text)}
                        placeholder="Search customers by name..."
                        placeholderTextColor={NEUTRAL_GREY}
                        style={styles.searchInput}
                    />
                </View>
            </LinearGradient>

            <View style={styles.mainContentArea}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    {isLoading ? (
                        <ActivityIndicator
                            size="large"
                            color={ACCENT_BLUE}
                            style={{ marginTop: 20 }}
                        />
                    ) : filteredCustomers.length === 0 ? (
                        <View style={styles.noDataContainer}>
                            <Image source={noImage} style={styles.noImage} />
                            <Text style={styles.noDataText}>No customers found.</Text>
                            <Text style={{ color: NEUTRAL_GREY, marginTop: 5, fontSize: 14 }}>
                                Tap the '+' button to add a new customer.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredCustomers}
                            keyExtractor={(item) => item?._id}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                        />
                    )}
                </KeyboardAvoidingView>
                
                {/* Floating Action Button (FAB) to navigate to AddCustomer */}
                <TouchableOpacity
                    onPress={() => navigation.navigate("AddCustomer", { user: user })}
                    style={styles.fab}
                >
                    <Feather name="plus" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // --- LAYOUT STYLES (FROM VIEWENROLLMENTS/CUSTOMERONHOLD) ---
    safeArea: { 
        flex: 1, 
        backgroundColor: TOP_GRADIENT[0] 
    },
    topContainer: {
        paddingHorizontal: 22,
        paddingBottom: 20,
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        marginTop: -20, 
        paddingTop: 10,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    headerSpacer: { 
        paddingTop: 20, 
        paddingBottom: 5 
    }, 

    // --- TITLE STYLES ---
    titleContainer: {
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
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

    // --- SEARCH BAR ---
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 15,
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: CARD_BG,
        padding: 5,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    searchIcon: {
        marginLeft: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
        fontSize: 16,
        color: MODERN_PRIMARY,
    },

    // --- CUSTOMER CARD STYLES (IMPROVED) ---
    customerCardStyle: {
        backgroundColor: CARD_BG, 
        borderRadius: 18, 
        marginBottom: 15,
        padding: 20,
        borderLeftWidth: 6, 
        borderLeftColor: ACCENT_BLUE, // Blue for general customer info
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, 
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: ACCENT_BLUE + '20', 
    },
    
    // CARD CONTENT
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: SUBTLE_BG_GREY,
    },
    customerName: {
        fontSize: 24,
        fontWeight: "900",
        color: MODERN_PRIMARY,
        flexShrink: 1,
        marginRight: 10,
    },
    statusTag: { 
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        alignSelf: 'flex-start', 
    },
    statusTagText: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: 'uppercase',
    },
    cardBody: {
        paddingVertical: 15,
        marginBottom: 5,
    },
    groupInfoText: {
        fontSize: 15,
        color: NEUTRAL_GREY,
        marginTop: 5,
        fontWeight: "500",
        lineHeight: 24,
    },
    groupInfoValue: {
        color: MODERN_PRIMARY,
        fontWeight: '700',
    },
    
    // Contact Buttons
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between", 
        gap: 10,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: SUBTLE_BG_GREY,
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 50,
        elevation: 2,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        gap: 6,
        flex: 1,
    },
    buttonText: { 
        color: "#fff", 
        fontWeight: "bold", 
        fontSize: 14 
    }, 

    // --- NO DATA / FAB ---
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        backgroundColor: CARD_BG,
        padding: 20,
        borderRadius: 15,
    },
    noDataText: {
        fontSize: 16,
        color: NEUTRAL_GREY,
        textAlign: 'center',
        fontWeight: '600'
    },
    noImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    fab: {
        position: "absolute",
        bottom: 40,
        right: 20,
        backgroundColor: ACCENT_BLUE,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    }
});

export default ViewCustomer;