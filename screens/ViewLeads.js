import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Linking,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import moment from "moment";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
const noImage = require("../assets/no.png");

const ViewLeads = ({ route, navigation }) => {
    const { user } = route.params;

    const [currentDate, setCurrentDate] = useState("");
    const [receipt, setReceipt] = useState({});
    const [chitLeads, setChitLeads] = useState([]);
    const [goldLeads, setGoldLeads] = useState([]);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [chitLoaded, setChitLoaded] = useState(false);
    const [goldLoaded, setGoldLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [expandedLeadId, setExpandedLeadId] = useState(null); // State to manage expanded lead

    useEffect(() => {
        setCurrentDate(moment().format("DD-MM-YYYY"));
    }, []);

    useEffect(() => {
        const fetchAgentData = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/agent/get-agent-by-id/${user.userId}`
                );
                setReceipt(response.data);
            } catch (error) {
                console.error("Error fetching agent data:", error);
            }
        };
        fetchAgentData();
    }, [user.userId]);

    const fetchChitLeads = async (phone) => {
        setIsChitLoading(true);
        setChitLoaded(false);
        try {
            const response = await axios.get(
                `${baseUrl}/lead/get-lead-by-agent/${phone}`
            );
            setChitLeads(response.data);
        } catch (error) {
            console.error("Error fetching chit leads data:", error);
            setChitLeads([]);
        } finally {
            setIsChitLoading(false);
            setChitLoaded(true);
        }
    };

    const fetchGoldLeads = async (phone) => {
        setIsGoldLoading(true);
        setGoldLoaded(false);
        try {
            const response = await axios.get(
                `${goldBaseUrl}/lead/get-lead-by-agent/${phone}`
            );
            setGoldLeads(response.data);
        } catch (error) {
            console.error("Error fetching gold leads data:", error);
            setGoldLeads([]);
        } finally {
            setIsGoldLoading(false);
            setGoldLoaded(true);
        }
    };

    useEffect(() => {
        if (receipt?.phone_number) {
            fetchChitLeads(receipt.phone_number);
            fetchGoldLeads(receipt.phone_number);
        }
    }, [receipt.phone_number]);

    useFocusEffect(
        useCallback(() => {
            if (receipt?.phone_number) {
                fetchChitLeads(receipt.phone_number);
                fetchGoldLeads(receipt.phone_number);
            }
        }, [receipt.phone_number])
    );

    // Function to handle direct calls
    const handleCall = (phoneNumber) => {
        Linking.openURL(`tel:${phoneNumber}`);
    };

    // Function to handle WhatsApp messaging
    const handleWhatsApp = (phoneNumber) => {
        Linking.openURL(`whatsapp://send?phone=${phoneNumber}`);
    };

    // Function to toggle expanded state
    const toggleExpand = (id) => {
        setExpandedLeadId(expandedLeadId === id ? null : id);
    };

    // Checks if the lead was created today
    const isFreshLead = (createdAt) => {
        const leadDate = moment(createdAt);
        return leadDate.isSame(moment(), "day");
    };

    // Checks if the lead was created within the last 10 days (excluding today)
    const isNewLead = (createdAt) => {
        const leadDate = moment(createdAt);
        const tenDaysAgo = moment().subtract(10, "days").startOf("day");
        return leadDate.isAfter(tenDaysAgo) && !isFreshLead(createdAt);
    };

    const renderLeadCard = ({ item }) => {
        const isExpanded = expandedLeadId === item._id; // Use _id or unique identifier
        let cardStyle = styles.card; // Default card style
        let badgeText = null;
        let badgeContainerStyle = null; // Style for the badge container
        let badgeTextStyle = null; // Style for the badge text itself

        if (isFreshLead(item.createdAt)) {
            cardStyle = { ...styles.card, ...styles.freshLeadCard };
            badgeText = "FRESH";
            badgeContainerStyle = styles.freshLeadBadgeContainer;
            badgeTextStyle = styles.freshLeadBadgeText;
        } else if (isNewLead(item.createdAt)) {
            cardStyle = { ...styles.card, ...styles.newLeadCard };
            badgeText = "NEW";
            badgeContainerStyle = styles.newLeadBadgeContainer;
            badgeTextStyle = styles.newLeadBadgeText;
        }

        // Format the date and time separately for display
        const createdDate = moment(item.createdAt).format("DD-MM-YYYY");
        const createdTime = moment(item.createdAt).format("HH:mm");

        return (
            <TouchableOpacity onPress={() => toggleExpand(item._id)} style={cardStyle}>
                <View style={styles.cardHeader}>
                    <View style={styles.leftSection}>
                        <Text style={styles.name}>{item.lead_name}</Text>
                        <Text style={styles.groupName}>
                            {item.group_id ? item.group_id.group_name : "No Group"}
                        </Text>
                    </View>
                    {/* The right section contains the scheme type and the expand icon */}
                    <View style={styles.rightSection}>
                        <Text style={styles.schemeType}>
                            {item.scheme_type.charAt(0).toUpperCase() +
                                item.scheme_type.slice(1)}
                        </Text>
                        <Icon
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#666"
                            style={styles.expandIcon}
                        />
                    </View>
                </View>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <Text style={styles.phoneNumber}>Phone: {item.lead_phone}</Text>
                        {/* Display created date and time separately on the same line */}
                        <Text style={styles.createdAt}>
                            Created: {createdDate} at {createdTime}
                        </Text>

                        <View style={styles.contactButtons}>
                            <TouchableOpacity
                                onPress={() => handleCall(item.lead_phone)}
                                style={styles.callButton}
                            >
                                <Icon name="phone" size={18} color={COLORS.white} />
                                <Text style={styles.buttonText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleWhatsApp(item.lead_phone)}
                                style={styles.whatsappButton}
                            >
                                <Icon name="whatsapp" size={18} color={COLORS.white} />
                                <Text style={styles.buttonText}>WhatsApp</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {badgeText && (
                    <View style={badgeContainerStyle}>
                        <Text style={badgeTextStyle}>{badgeText}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;
    const dataLoaded = activeTab === "CHIT" ? chitLoaded : goldLoaded;
    const leads = activeTab === "CHIT" ? chitLeads : goldLeads;
    const noDataMessage =
        activeTab === "CHIT" ? "No chit leads found" : "No gold leads found";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
            <LinearGradient
                colors={["#A8E0F9", "#F9E5B5"]}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ marginHorizontal: 22, marginTop: 12, flex: 1 }}>
                        <Header />
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Leads</Text>
                            <Text style={styles.totalAmountText}>
                                {chitLeads.length + goldLeads.length || 0}
                            </Text>
                        </View>

                        <View style={styles.container}>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                                    onPress={() => setActiveTab("CHIT")}
                                >
                                    <Icon
                                        name="users"
                                        size={20}
                                        color={activeTab === "CHIT" ? "#333" : "#666"}
                                        style={styles.tabIcon}
                                    />
                                    <Text
                                        style={[
                                            styles.tabText,
                                            activeTab === "CHIT" && styles.activeTabText,
                                        ]}
                                    >
                                        Chit Leads {chitLeads.length || 0}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
                                    onPress={() => setActiveTab("GOLD")}
                                >
                                    <Icon
                                        name="money"
                                        size={20}
                                        color={activeTab === "GOLD" ? "#333" : "#666"}
                                        style={styles.tabIcon}
                                    />
                                    <Text
                                        style={[
                                            styles.tabText,
                                            activeTab === "GOLD" && styles.activeTabText,
                                        ]}
                                    >
                                        Gold Leads {goldLeads.length || 0}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ minHeight: 200 }}>
                                {isLoading && (
                                    <ActivityIndicator
                                        size="large"
                                        color="#000"
                                        style={{ marginTop: 20 }}
                                    />
                                )}
                                {!isLoading && dataLoaded && leads.length > 0 && (
                                    <FlatList
                                        data={leads}
                                        keyExtractor={(item, index) => item._id || index.toString()}
                                        renderItem={renderLeadCard}
                                    />
                                )}
                                {!isLoading && dataLoaded && leads.length === 0 && (
                                    <View style={styles.noDataContainer}>
                                        <Image source={noImage} style={styles.noImage} />
                                        <Text style={styles.noDataText}>{noDataMessage}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>

            <TouchableOpacity
                onPress={() => navigation.navigate("AddLead", { user: user })}
                style={{
                    position: "absolute",
                    bottom: 20,
                    right: 20,
                    backgroundColor: COLORS.primary,
                    borderRadius: 30,
                    width: 60,
                    height: 60,
                    justifyContent: "center",
                    alignItems: "center",
                    elevation: 5,
                }}
            >
                <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                    + Add
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    gradientOverlay: {
        flex: 1,
    },
    titleContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
    },
    totalAmountText: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
    },
    container: {
        flex: 1,
        marginTop: 20,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 15,
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
    },
    activeTab: {
        backgroundColor: "#FFC000",
    },
    tabText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
    },
    activeTabText: {
        color: "#333",
        fontWeight: "bold",
    },
    tabIcon: {
        marginRight: 5,
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        padding: 15,
        marginVertical: 5,
        borderRadius: 15,
        borderLeftWidth: 5,
        borderColor: "#FFC000",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        position: "relative",
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        // Removed paddingRight to allow expandIcon to position freely relative to rightSection
    },
    freshLeadCard: {
        borderColor: "green",
    },
    newLeadCard: {
        borderColor: COLORS.primary,
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        flexDirection: "row",
        alignItems: "center",
        // Add some right padding to this container so the icon doesn't go off the edge of the card
        paddingRight: 10,
        position: 'relative', // Ensure this is relative for absolute children
    },
    name: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000",
        marginBottom: 5,
    },
    groupName: {
        fontSize: 14,
        color: "#666",
    },
    schemeType: {
        fontSize: 14,
        color: "#000",
        fontWeight: "500",
        // Adjust this margin based on your desired spacing from the right edge of the card,
        // considering the space taken by the icon.
        marginRight: 25, // Slightly reduced to give more space for the icon if needed
    },
    expandIcon: {
        position: 'absolute',
        right: 0, // Position at the right edge of its parent (rightSection)
        top: '50%', // Vertically center the icon
        transform: [{ translateY: -9 }], // Adjust for half of the icon's height (18/2)
    },
    expandedContent: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    phoneNumber: {
        fontSize: 14,
        color: "#333",
        marginBottom: 5,
    },
    createdAt: {
        fontSize: 12,
        color: "#888",
        fontStyle: "italic",
        marginBottom: 10,
    },
    contactButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 10,
    },
    callButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    whatsappButton: {
        backgroundColor: "#25D366", // WhatsApp green
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    buttonText: {
        color: COLORS.white,
        marginLeft: 5,
        fontWeight: "bold",
    },
    // Badge styles adjusted for better positioning
    freshLeadBadgeContainer: {
        position: "absolute",
        top: 0,    // Adjusted from 15
        right: 0,  // Adjusted from -25
        backgroundColor: "green",
        // Removed borderRadius, width, height, justifyContent, alignItems, zIndex, transform, shadow styles
        // to simplify positioning and avoid overlap with the main card content and icon.
        paddingHorizontal: 8, // Add padding for better visual
        paddingVertical: 4,
        borderBottomLeftRadius: 15, // Curve the bottom-left corner
    },
    freshLeadBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "bold",
    },
    newLeadBadgeContainer: {
        position: "absolute",
        top: 0,    // Adjusted from 15
        right: 0,  // Adjusted from -25
        backgroundColor: "orange",
        // Removed borderRadius, width, height, justifyContent, alignItems, zIndex, transform, shadow styles
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderBottomLeftRadius: 15,
    },
    newLeadBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "bold",
    },
    noDataContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 50,
    },
    noDataText: {
        fontSize: 14,
        color: "#555",
        textAlign: "center",
    },
    noImage: {
        width: 250,
        height: 150,
        resizeMode: "contain",
        marginBottom: 20,
    },
});

export default ViewLeads;