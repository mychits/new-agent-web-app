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
import { whatsappMessage } from "../components/data/messages";
import { LinearGradient } from "expo-linear-gradient";


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
                const totalCommission = response?.data?.total_commission || "0";
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
                            {`Rs ${item?.calculated_commission || "0"}`}
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
        <View style={{ flex: 1, backgroundColor: COLORS.white }}>
            <LinearGradient colors={["#1aa2ccff", "#1aa2ccff"]}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1, paddingHorizontal: 22 }}
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
                        
                        {/* Search Input and Icon */}
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by customer name or group"
                                placeholderTextColor="#888"
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
                                    color={activeTab === "CHIT" ? "#333" : "#666"}
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
                                    color={activeTab === "GOLD" ? "#333" : "#666"}
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
                                        <Text style={styles.totalCardValue}>
                                            {`Rs ${totalCommission || 0}`}
                                        </Text>
                                    </View>
                                    <MaterialIcons name="trending-up" size={24} style={styles.cardIcon} />
                                </View>
                            </View>
                        </View>
                    </View>
                    
                    {/* Scrolling Content Section (FlatList) */}
                    <View style={styles.listContainer}>
                        {isLoading ? (
                            <ActivityIndicator
                                size="large"
                                color="#000"
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
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    gradientOverlay: {
        flex: 1,
    },
    // UPDATED STYLE: Increased marginTop to push the header content down
    fixedHeaderArea: {
        marginTop: Platform.OS === 'android' ? 50 : 32, 
        marginBottom: 10,
    },
    // --- Rest of the styles are unchanged ---
    listContainer: {
        flex: 1,
    },
    titleContainer: {
        marginTop: 30,
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.7)", 
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 10,
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
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
        backgroundColor: '#f8c009ff',
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
    totalCardContainer: {
        marginTop: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    totalCard: {
        backgroundColor: "rgba(255, 255, 255, 0.7)", 
        flexDirection: "row",
        justifyContent: 'space-between',
        padding: 15,
        marginVertical: 5,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#f8c009ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalCardValue: {
        fontSize: 24,
        color: '#666',
        fontWeight: 'bold',
        marginTop: 5,
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.7)", 
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        marginVertical: 5,
        borderRadius: 15,
        borderLeftWidth: 5,
        borderColor: '#f8c009ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        alignItems: "center",
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 5,
    },
    groupNameValue: { 
        fontSize: 14,
        color: "#333",
        fontWeight: '600',
    },
    name: {
        fontSize: 16, 
        fontWeight: "600",
        color: "#000",
        marginBottom: 5,
        textAlign: 'left',
    },
    groupName: {
        fontSize: 14,
        color: "#666",
        textAlign: 'left',
    },
    commissionContainer: {
        backgroundColor: '#FFD70020', 
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignSelf: 'center',
    },
    commissionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        textAlign: 'center',
    },
    cardIcon: {
        color: '#f8c009ff',
    },
    noLeadsText: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        color: "#666",
        fontWeight: '500',
    },
});

export default ExpectedCommissions;