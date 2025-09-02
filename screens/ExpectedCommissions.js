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
import { TapGestureHandler } from "react-native-gesture-handler";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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
        const fetchExpectedCommissions = async () => {
            const currentUrl =
                activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
            try {
                activeTab === "CHIT" ? setIsChitLoading(true) : setIsGoldLoading(true);
                const response = await axios.get(
                    `${currentUrl}/enroll/get-commission-info/${user.userId}`
                );

                if (response.status >= 400)
                    throw new Error("Failed to fetch Enrolled customer Data");

                setCustomer(response.data.dataWithCommission);
                setTotalChitCommissions(response?.data?.total_commission);

                activeTab === "CHIT"
                    ? setChitCustomerLength(response?.data?.dataWithCommission.length)
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
        fetchExpectedCommissions();
    }, [activeTab, user]);

    const filteredCustomers = customers.filter(customer => {
        const groupName = customer?.group_id?.group_name || "";
        const userName = customer?.user_id?.full_name || "";
        const query = searchQuery.toLowerCase();
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
                        {item?.group_id?.group_name || "No Group Name"}
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

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
            <LinearGradient
                colors={['#dbf6faff', '#90dafcff']}
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
                        <Header />
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Expected Commissions</Text>
                            <Text style={styles.subtitle}>View your estimated commissions</Text>
                        </View>

                        {/* Search Input and Icon */}
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name or group"
                                placeholderTextColor="#888"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        {/* End Search Input */}

                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                                onPress={() => setActiveTab("CHIT")}
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
                                    Chits {chitCustomerLength || 0}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
                                onPress={() => setActiveTab("GOLD")}
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
                                    Gold Chits {goldCustomerLength || 0}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.totalCardContainer}>
                            <View style={styles.totalCard}>
                                <View style={styles.totalCardContent}>
                                    <View>
                                        <Text style={styles.totalCardText}>Total Expected Commission</Text>
                                        <Text style={styles.totalCardValue}>
                                            {` ${totalChitCommmissions || 0}`}
                                        </Text>
                                    </View>
                                    <MaterialIcons name="trending-up" size={24} style={styles.cardIcon} />
                                </View>
                            </View>
                        </View>
                        {activeTab === "CHIT" ? (
                            isChitLoading ? (
                                <ActivityIndicator
                                    size="large"
                                    color="#000"
                                    style={{ marginTop: 20 }}
                                />
                            ) : chitCustomerLength === 0 ? (
                                <Text style={styles.noLeadsText}>
                                    No CHIT expected commissions found.
                                </Text>
                            ) : (
                                <FlatList
                                    data={filteredCustomers}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={renderEnrolledCustomerCard}
                                    ListEmptyComponent={() => (
                                        <Text style={styles.noLeadsText}>No matching customers found.</Text>
                                    )}
                                />
                            )
                        ) : isGoldLoading ? (
                            <ActivityIndicator
                                size="large"
                                color="#000"
                                style={{ marginTop: 20 }}
                            />
                        ) : goldCustomerLength === 0 ? (
                            <Text style={styles.noLeadsText}>
                                No GOLD CHIT expected commissions found.
                            </Text>
                        ) : (
                            <FlatList
                                data={filteredCustomers}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={renderEnrolledCustomerCard}
                                ListEmptyComponent={() => (
                                    <Text style={styles.noLeadsText}>No matching customers found.</Text>
                                )}
                            />
                        )}
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
        borderColor: '#da8201',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,

        alignItems: 'center',
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
        fontWeight: 'bold',
        color: '#666',
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
        borderColor: '#da8201',
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
    name: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000",
        marginBottom: 5,
        textAlign: 'center',
    },
    groupName: {
        fontSize: 14,
        color: "#666",
        textAlign: 'center',
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
        color: '#da8201',
    },
    arrowIcon: {
        fontSize: 22,
        color: '#da8201',
    },
    noLeadsText: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
        color: "#666",
    },
});

export default ExpectedCommissions;