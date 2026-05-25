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
    Image,
    Dimensions
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import { Feather, Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";

const { height } = Dimensions.get('window');
const noImage = require('../assets/no.png');

// --- CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0e"; 
const ACCENT_BLUE = "#1796d1"; 
const ACCENT_GREEN = "#10b981";
const NEUTRAL_GREY = "#6b7280"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

// --- HELPER FOR LINKING ---
const handleAction = (type, value) => {
    if (!value) return;

    let url = "";
    if (type === "call") {
      url = `tel:${value}`;
    } else if (type === "whatsapp") {
      const cleanPhone = value.replace(/[^0-9]/g, "");
      url = `whatsapp://send?phone=${cleanPhone}`;
    } else if (type === "email") {
      url = `mailto:${value}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert("Error", `Unable to handle ${type}: ${value}`);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error("An error occurred", err));
};

const ViewEnrollments = ({ route, navigation }) => {
    const { user } = route.params;

    const [chitCustomerLength, setChitCustomerLength] = useState(0);
    const [goldCustomerLength, setGoldCustomerLength] = useState(0);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [customers, setCustomer] = useState([]);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchEnrolledCustomers = async () => {
            const currentUrl =
                activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
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

    const filteredCustomers = customers.filter(customer =>
        customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const renderEnrolledCustomerCard = ({ item }) => {
        const name = item?.user_id?.full_name || "No Name";
        const groupName = item?.group_id?.group_name || "N/A";
        const phoneNumber = item?.user_id?.phone_number;
        const email = item?.user_id?.email;
        const tickets = item?.tickets;

        return (
            <View style={styles.customerCardStyle}>
                {/* Header (Customer Name & Status Tag) */}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.customerName} numberOfLines={1}>
                            {name}
                        </Text>
                        <View style={[styles.statusTag, { backgroundColor: ACCENT_GREEN + '20' }]}> 
                            <Text style={[styles.statusTagText, { color: ACCENT_GREEN }]}>
                                ENROLLED
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Icons Row */}
                <View style={styles.contactActionsRow}>
                    <TouchableOpacity 
                        onPress={() => handleAction("call", phoneNumber)} 
                        style={styles.actionButton} 
                        activeOpacity={0.7}
                    >
                        <Ionicons name="call" size={16} color="#10B981" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => handleAction("whatsapp", phoneNumber)} 
                        style={styles.actionButton} 
                        activeOpacity={0.7}
                    >
                        <FontAwesome5 name="whatsapp" size={18} color="#25D366" />
                    </TouchableOpacity>

                    {email ? (
                        <TouchableOpacity 
                            onPress={() => handleAction("email", email)} 
                            style={styles.actionButton} 
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="email" size={16} color={ACCENT_BLUE} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Customer Info (Group Name & Tickets) */}
                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={14} color={ACCENT_BLUE} />
                        <Text style={styles.infoText}><Text style={styles.label}>Group:</Text> <Text style={styles.value}>{groupName}</Text></Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="ticket-confirmation-outline" size={14} color={ACCENT_BLUE} />
                        <Text style={styles.infoText}><Text style={styles.label}>Tickets:</Text> <Text style={styles.value}>{tickets}</Text></Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
                <View style={styles.headerSpacer}>
                    <Header />
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>My Customers</Text>
                    <Text style={styles.subtitle}>
                        Total Enrolled: {(chitCustomerLength + goldCustomerLength) || 0}
                    </Text>
                </View>

                <View style={styles.searchContainer}>
                    <Icon
                        name="search"
                        size={18}
                        color={NEUTRAL_GREY}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        value={search}
                        onChangeText={(text) => setSearch(text)}
                        placeholder="Search customers..."
                        placeholderTextColor={NEUTRAL_GREY}
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
                            size={18}
                            color={activeTab === "CHIT" ? MODERN_PRIMARY : NEUTRAL_GREY}
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

                 
                </View>
            </LinearGradient>

            <View style={styles.mainContentArea}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    {activeTab === "CHIT" ? (
                        isChitLoading ? (
                            <ActivityIndicator
                                size="large"
                                color={ACCENT_BLUE}
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
                                keyExtractor={(item) => item?._id || item.user_id._id}
                                renderItem={renderEnrolledCustomerCard}
                                contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                            />
                        )
                    ) : isGoldLoading ? (
                        <ActivityIndicator
                            size="large"
                            color={ACCENT_BLUE}
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
                            keyExtractor={(item) => item?._id || item.user_id._id}
                            renderItem={renderEnrolledCustomerCard}
                            contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                        />
                    )}
                </KeyboardAvoidingView>
                
                <TouchableOpacity
                    onPress={() => navigation.navigate("EnrollCustomer", { user: user })}
                    style={styles.fab}
                >
                    <Feather name="plus" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
    topContainer: { paddingHorizontal: 22, paddingBottom: 20 },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        marginTop: -20, 
        paddingTop: 10,
        elevation: 5,
    },
    headerSpacer: { paddingTop: 20, paddingBottom: 5 }, 
    titleContainer: { alignItems: 'center', marginBottom: 15, marginTop: 10 },
    title: { fontSize: 24, fontWeight: "900", color: CARD_BG, marginBottom: 4 }, // Reduced
    subtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500', textAlign: 'center' }, // Reduced
    
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 15,
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: CARD_BG,
        padding: 5,
        elevation: 3,
    },
    searchIcon: { marginLeft: 10 },
    searchInput: { flex: 1, height: 40, paddingHorizontal: 10, fontSize: 14, color: MODERN_PRIMARY }, // Reduced

    tabContainer: {
        flexDirection: "row",
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15,
        marginBottom: 10,
        padding: 5,
    },
    tab: { flex: 1, paddingVertical: 8, alignItems: "center", flexDirection: 'row', justifyContent: 'center', borderRadius: 10 }, // Reduced padding
    activeTab: { backgroundColor: CARD_BG, elevation: 2 },
    tabText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', fontWeight: "600", marginLeft: 5 }, // Reduced
    activeTabText: { color: MODERN_PRIMARY, fontWeight: 'bold' },

    // --- CARD STYLES ---
    customerCardStyle: {
        backgroundColor: CARD_BG, 
        borderRadius: 16, 
        marginBottom: 12,
        padding: 14, // Reduced padding
        borderLeftWidth: 4, 
        borderLeftColor: ACCENT_GREEN,
        elevation: 4,
        borderWidth: 1,
        borderColor: ACCENT_GREEN + '20', 
    },
    
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    headerLeft: { flex: 1, marginRight: 10 },
    customerName: { fontSize: 16, fontWeight: "800", color: MODERN_PRIMARY, marginBottom: 4 }, // Reduced
    statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
    statusTagText: { fontSize: 10, fontWeight: "700", textTransform: 'uppercase' }, // Reduced

    contactActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    cardBody: { paddingVertical: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    infoText: { fontSize: 12, color: MODERN_PRIMARY, marginLeft: 8 }, // Reduced
    label: { color: NEUTRAL_GREY, fontWeight: '500', fontSize: 12 },
    value: { fontWeight: '700', fontSize: 12 },

    noDataContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, backgroundColor: CARD_BG, padding: 20, borderRadius: 15 },
    noDataText: { fontSize: 14, color: NEUTRAL_GREY, textAlign: 'center', fontWeight: '600' }, // Reduced
    noImage: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 20 }, // Reduced
    
    fab: {
        position: "absolute",
        bottom: 100,
        right: 20,
        backgroundColor: ACCENT_BLUE,
        borderRadius: 30,
        width: 56,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
    }
});

export default ViewEnrollments;