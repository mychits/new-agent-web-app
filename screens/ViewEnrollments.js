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
    TextInput,
    Image
} from "react-native";
import { TapGestureHandler } from "react-native-gesture-handler";
import React, { useState, useEffect, useCallback } from "react";
// SafeAreaView removed as per request
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import { Feather } from "@expo/vector-icons";
import { whatsappMessage } from "../components/data/messages";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";


const noImage = require('../assets/no.png');

const ViewEnrollments = ({ route, navigation }) => {
    // Destructure user from route.params
    const { user } = route.params;

    // State variables
    const [chitCustomerLength, setChitCustomerLength] = useState(0);
    const [goldCustomerLength, setGoldCustomerLength] = useState(0);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [customers, setCustomer] = useState([]);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [search, setSearch] = useState("");

    // Helper function to send WhatsApp message
    const sendWhatsappMessage = async (item) => {
        if (item.user_id?.phone_number) {
            let url = `whatsapp://send?phone=${item.user_id?.phone_number
                }&text=${encodeURIComponent(whatsappMessage)}`;

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

    // Helper function to open dialer
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

    // useEffect hook to fetch data
    useEffect(() => {
        const fetchEnrolledCustomers = async () => {
            // Determine API endpoint based on active tab
            const currentUrl =
                activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
            try {
                activeTab === "CHIT" ? setIsChitLoading(true) : setIsGoldLoading(true);
                const response = await axios.get(
                    `${currentUrl}/enroll/get-enroll-by-agent-id/${user.userId}`
                );
                if (response.status >= 400)
                    throw new Error("Failed to fetch Enrolled customer Data");
                
                // Update customers list and count based on active tab
                setCustomer(response.data);
                activeTab === "CHIT"
                    ? setChitCustomerLength(response?.data?.length)
                    : setGoldCustomerLength(response?.data?.length);
            } catch (err) {
                console.log(err, "error");
                setCustomer([]);
            } finally {
                // Set loading state to false
                activeTab === "CHIT"
                    ? setIsChitLoading(false)
                    : setIsGoldLoading(false);
            }
        };
        fetchEnrolledCustomers();
    }, [activeTab, user]);

    // Filter customers based on search input
    const filteredCustomers = customers.filter(customer =>
        customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    // Render function for FlatList item
    const renderEnrolledCustomerCard = ({ item }) => (
        <TapGestureHandler
            numberOfTaps={2}
            onActivated={() => {
                sendWhatsappMessage(item);
            }}
        >
            <View style={styles.card}>
                <View style={styles.leftSection}>
                    <TouchableOpacity onPress={() => openDialer(item)}>
                        <Text style={styles.name}>
                            {item?.user_id?.full_name || "No Name"}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.groupName}>
                        {item?.group_id?.group_name || "No Group Name"}
                    </Text>
                </View>
                <View style={styles.rightSection}>
                    <Text style={styles.schemeType}>
                        {activeTab[0] + activeTab?.slice(1).toLowerCase()}
                    </Text>

                    <Text style={styles.phoneNumber}>
                        {`TNo : ${item?.tickets} `}
                    </Text>
                </View>
            </View>
        </TapGestureHandler>
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.white }}>
            <LinearGradient
                colors={['#b6e4ebff', '#1796d1ff']}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
                >
                    <View style={{ flexGrow: 1 }}>
                        <View style={{ marginHorizontal: 22, marginTop: 38, flex: 1 }}>
                            <Header />
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>My Customers</Text>
                                <Text style={styles.totalAmountText}>
                                    {(chitCustomerLength + goldCustomerLength) || 0}
                                </Text>
                            </View>

                            <View style={styles.searchContainer}>
                                <Icon
                                    name="search"
                                    size={20}
                                    color="#ccc"
                                    style={styles.searchIcon}
                                />
                                <TextInput
                                    value={search}
                                    onChangeText={(text) => setSearch(text)}
                                    placeholder="Search customers..."
                                    placeholderTextColor={COLORS.darkGray}
                                    style={styles.searchInput}
                                />
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
                                        Chits {chitCustomerLength || 0}
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
                                        Gold Chits {goldCustomerLength || 0}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Render content based on active tab and loading state */}
                            {activeTab === "CHIT" ? (
                                isChitLoading ? (
                                    <ActivityIndicator
                                        size="large"
                                        color="#000"
                                        style={{ marginTop: 20 }}
                                    />
                                ) : filteredCustomers.length === 0 ? (
                                    <View style={styles.noDataContainer}>
                                        <Image source={noImage} style={styles.noImage} />
                                        <Text style={styles.noDataText}>No CHIT enrolled customers found.</Text>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={filteredCustomers}
                                        keyExtractor={(item, index) => item?._id || index.toString()}
                                        renderItem={renderEnrolledCustomerCard}
                                        contentContainerStyle={{ paddingBottom: 20 }}
                                    />
                                )
                            ) : isGoldLoading ? (
                                <ActivityIndicator
                                    size="large"
                                    color="#000"
                                    style={{ marginTop: 20 }}
                                />
                            ) : filteredCustomers.length === 0 ? (
                                <View style={styles.noDataContainer}>
                                    <Image source={noImage} style={styles.noImage} />
                                    <Text style={styles.noDataText}>No GOLD CHIT enrolled customers found.</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={filteredCustomers}
                                    keyExtractor={(item, index) => item?._id || index.toString()}
                                    renderItem={renderEnrolledCustomerCard}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                />
                            )}
                        </View>
                    </View>

                    {/* Floating Action Button (FAB) to navigate to AddCustomer */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate("EnrollCustomer", { user: user })}
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
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                        }}
                    >
                        <Text
                            style={{
                                color: "white",
                                fontSize: 12,
                                fontWeight: "bold",
                                textAlign: "center",
                            }}
                        >
                            <Feather name="plus" size={20} />
                        </Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    gradientOverlay: {
        flex: 1,
    },
    titleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
    },
    totalAmountText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: "#d0d0d0",
        borderWidth: 1,
        borderRadius: 15,
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    searchIcon: {
        marginLeft: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        padding: 5,
        fontSize: 16,
        color: COLORS.darkGray,
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
        backgroundColor: '#da8201',
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
    card: {
        backgroundColor: "#fff",
        flexDirection: "row",
        padding: 15,
        marginHorizontal: 5,
        marginVertical: 5,
        borderRadius: 15,
        borderLeftWidth: 5,
        borderColor: '#da8201',
        elevation: 2,
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        alignItems: "flex-end",
    },
    name: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        marginBottom: 15,
    },
    groupName: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    schemeType: {
        fontSize: 14,
        color: "#000",
        fontWeight: "500",
        marginBottom: 15,
    },
    phoneNumber: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
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

export default ViewEnrollments;