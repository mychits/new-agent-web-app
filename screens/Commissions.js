import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/FontAwesome";

const noImage = require('../assets/no.png');

import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

const CustomCommissionCard = ({ title, icon, value, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.card}>
        <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={24} style={styles.cardIcon} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.cardText}>{title}</Text>
                <Text style={styles.cardSubText}>{value}</Text>
            </View>
        </View>
        <MaterialIcons name="keyboard-arrow-right" style={styles.arrowIcon} />
    </TouchableOpacity>
);

const Commissions = ({ route, navigation }) => {
    // Safely access user with optional chaining and provide a default empty object
    const { user } = route.params || {};
    // Ensure user object exists, otherwise provide a fallback to prevent errors
    const currentUser = user || {};

    const [chitCommissionLength, setChitCommissionLength] = useState(0);
    const [goldCommissionLength, setGoldCommissionLength] = useState(0);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [commissions, setCommissions] = useState([]);
    const [activeTab, setActiveTab] = useState("CHIT");

    const handleEstimatedCommission = () => {
        // Pass currentUser to the next screen
        navigation.navigate("ExpectedCommissions", { user: currentUser });
    };

    const handleMyCommission = () => {
        navigation.navigate("MyCommissions", { commissions: commissions });
    };

    const handleMyCustomers = () => {
        // Pass currentUser to the next screen
        navigation.navigate("ViewEnrollments", { user: currentUser });
    };

    const handleGroups = () => {
        // Pass currentUser to the next screen
        navigation.navigate("MyGroups", { user: currentUser });
    };

    const scrollData = [
        { title: "Customers", icon: "person", value: "total_customers", key: "#1", handlePress: handleMyCustomers },
        { title: "Groups", icon: "group", value: "total_groups", key: "#2", handlePress: handleGroups },
        { title: "My Business", icon: "query-stats", value: "actual_business", key: "#6", handlePress: handleMyCommission },
        { title: "Estimated Business", icon: "trending-up", value: "expected_business", key: "#5", handlePress: handleEstimatedCommission },
        { title: "My Commission", icon: "payments", value: "total_actual", key: "#4", handlePress: handleMyCommission },
        { title: "Estimated Commission", icon: "currency-rupee", value: "total_estimated", key: "#3", handlePress: handleEstimatedCommission },
    ];

    useEffect(() => {
        const fetchCommissions = async () => {
            // Check if currentUser.userId exists before making API call
            if (!currentUser.userId) {
                console.warn("User ID is not available for fetching commissions.");
                setCommissions([]);
                setIsChitLoading(false);
                setIsGoldLoading(false);
                return;
            }

            const currentUrl =
                activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
            try {
                activeTab === "CHIT" ? setIsChitLoading(true) : setIsGoldLoading(true);
                const response = await axios.get(
                    `${currentUrl}/enroll/get-detailed-commission/${currentUser.userId}` // Use currentUser.userId
                );
                if (response.status >= 400)
                    throw new Error("Failed to fetch Customer Data");
                setCommissions(response.data);
                activeTab === "CHIT"
                    ? setChitCommissionLength(response?.data?.length)
                    : setGoldCommissionLength(response?.data?.length);
            } catch (err) {
                console.log(err, "error");
                setCommissions([]);
            } finally {
                activeTab === "CHIT"
                    ? setIsChitLoading(false)
                    : setIsGoldLoading(false);
            }
        };
        fetchCommissions();
    }, [activeTab, currentUser]); // Depend on currentUser to re-fetch if user changes

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
            <LinearGradient
                colors={['#A8E0F9', '#F9E5B5']}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
                >
                    <ScrollView
                        style={{ flex: 1, marginHorizontal: 22, marginTop: 12 }}
                        contentContainerStyle={{ paddingBottom: 80 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Ensure Header receives necessary props if it depends on them */}
                        <Header />
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Commissions</Text>
                            <Text style={styles.subtitle}>Select a chit type to view details</Text>
                        </View>
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                                onPress={() => setActiveTab("CHIT")}
                            >
                                <Icon
                                    name="users"
                                    size={20}
                                    color={activeTab === "CHIT" ? "#333" : "#666"}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "CHIT" && styles.activeTabText,
                                    ]}
                                >
                                    Chits
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
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "GOLD" && styles.activeTabText,
                                    ]}
                                >
                                    Gold Chits
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.cardListContainer}>
                            {activeTab === "CHIT" ? (
                                isChitLoading ? (
                                    <ActivityIndicator
                                        size="large"
                                        color="#000"
                                        style={{ marginTop: 20 }}
                                    />
                                ) : chitCommissionLength === 0 ? (
                                    <Text style={styles.noLeadsText}>
                                        No Chit Commission Found
                                    </Text>
                                ) : (
                                    <View style={{ gap: 20 }}>
                                        {scrollData.map(({ title, icon, value, key, handlePress }) => (
                                            <CustomCommissionCard
                                                key={key}
                                                title={title}
                                                icon={icon}
                                                value={commissions?.summary?.[value]}
                                                onPress={handlePress}
                                            />
                                        ))}
                                    </View>
                                )
                            ) : isGoldLoading ? (
                                <ActivityIndicator
                                    size="large"
                                    color="#000"
                                    style={{ marginTop: 20 }}
                                />
                            ) : goldCommissionLength === 0 ? (
                                <View style={styles.noDataContainer}>
                                    <Image source={noImage} style={styles.noImage} />
                                    <Text style={styles.noLeadsText}>No Gold Commission Found</Text>
                                </View>
                            ) : (
                                <View style={{ gap: 20 }}>
                                    {scrollData.map(({ title, icon, value, key, handlePress }) => (
                                        <CustomCommissionCard
                                            key={key}
                                            title={title}
                                            icon={icon}
                                            value={commissions?.summary?.[value]}
                                            onPress={handlePress}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    gradientOverlay: {
        flex: 1,
    },
    titleContainer: {
        marginTop: 30,
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    cardListContainer: {
        marginTop: 15,
        gap: 20,
        alignItems: 'center',
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 5,
        borderRightWidth: 5,
         borderTopWidth: 5,
        borderButtonWidth: 5,
        borderColor: '#FFC000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 15,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#FFD70020',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 24,
        color: '#FFC000',
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    cardText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cardSubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    arrowIcon: {
        fontSize: 22,
        color: '#FFC000',
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 15,
        marginBottom: 10,
        overflow: 'hidden',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 15,
    },
    activeTab: {
        backgroundColor: '#FFC000',
        shadowColor: '#FFC000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 8,
    },
    tabText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
        marginLeft: 5,
    },
    activeTabText: {
        color: '#333',
        fontWeight: 'bold',
    },
   noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  noImage: {
    width: 250,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  }
});

export default Commissions;