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
    ScrollView
} from "react-native";
import { TapGestureHandler } from "react-native-gesture-handler";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import { MaterialIcons } from "@expo/vector-icons";


const EnrolledGroups = ({ route, navigation }) => {
    const { user } = route.params;
    const [chitCustomerLength, setChitCustomerLength] = useState(0);
    const [goldCustomerLength, setGoldCustomerLength] = useState(0);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [customers, setCustomer] = useState([]);
    const [activeTab, setActiveTab] = useState("CHIT");
    const sendWhatsappMessage = async (item) => {
        if (item.user_id?.phone_number) {
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
            const currentUrl =
                activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
            try {
                activeTab === "CHIT" ? setIsChitLoading(true) : setIsGoldLoading(true);
                const response = await axios.get(
                    `${currentUrl}/enroll/get-enroll-by-agent-id/${user.userId}`
                );
                console.log(response.data);
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

    const renderEnrolledCustomerCard = ({ item }) => (
        <Pressable
            onPress={() => openDialer(item)}
            onLongPress={() => sendWhatsappMessage(item)}
            style={styles.card}
        >
            <View style={styles.leftSection}>
                <Text style={styles.name}>
                    {item?.group_id?.group_name || "No Group Name"}
                </Text>
                <Text style={styles.groupName}>
                    {item?.user_id?.full_name || "No User Name"}
                </Text>
            </View>
            <View style={styles.rightSection}>
                <View style={styles.ticketContainer}>
                    <Text style={styles.ticketsText}>
                        {`TNo : ${item?.tickets} `}
                    </Text>
                </View>
                <MaterialIcons name="keyboard-arrow-right" style={styles.arrowIcon} />
            </View>
        </Pressable>
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
                            <Text style={styles.title}>Groups</Text>
                            <Text style={styles.subtitle}>Enrolled groups by you</Text>
                        </View>

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
                        {activeTab === "CHIT" ? (
                            isChitLoading ? (
                                <ActivityIndicator
                                    size="large"
                                    color="#000"
                                    style={{ marginTop: 20 }}
                                />
                            ) : chitCustomerLength === 0 ? (
                                <Text style={styles.noLeadsText}>
                                    No CHIT enrolled customers found.
                                </Text>
                            ) : (
                                <FlatList
                                    data={customers}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={renderEnrolledCustomerCard}
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
                                No GOLD CHIT enrolled customers found.
                            </Text>
                        ) : (
                            <FlatList
                                data={customers}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={renderEnrolledCustomerCard}
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
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
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
        backgroundColor: '#FFD700',
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
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        flexDirection: "row",
        justifyContent: 'space-between',
        padding: 15,
        marginVertical: 5,
        borderRadius: 15,
        borderLeftWidth: 5,
        borderColor: '#FFD700',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      
        alignItems: 'center',
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        alignItems: "flex-end",
        flexDirection: 'row',
        gap: 10,
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
    ticketContainer: {
        backgroundColor: '#FFD70020',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    ticketsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    arrowIcon: {
        fontSize: 22,
        color: '#FFC000',
    },
    noLeadsText: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
        color: "#666",
    },
});

export default EnrolledGroups;

































