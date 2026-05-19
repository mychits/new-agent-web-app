import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Dimensions,
    Platform,
    Modal, // 1. Import Modal
} from "react-native";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import baseUrl from "../constants/baseUrl";

const { width, height } = Dimensions.get("window");

// --- DESIGN CONSTANTS ---
const COLORS = {
    primary: "#183A5D",
    accent: "#f8c009ff",
    bgBlue: "#1aa2ccff",
    success: "#27AE60",
    cardBg: "rgba(255, 255, 255, 0.98)",
    white: "#FFFFFF",
    muted: "#8898AA",
    background: "#0f2a44",
    danger: "#FF6B6B",
};

const Profile = ({ route, navigation }) => {
    const { user } = route.params || {};
    const [isLoading, setIsLoading] = useState(true);
    const [agent, setAgent] = useState({});
    
    // 2. State for controlling the Image Zoom Modal
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);

    useEffect(() => {
        fetchAgent();
    }, [user]);

    const fetchAgent = async () => {
        if (!user || !user.userId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.clear();
            navigation.replace("Login");
        } catch (err) {
            console.log("failed to remove user from localstorage");
        }
    };

    // Helper to determine image source
    const imageSource = agent.employee_profile_photo
        ? { uri: agent.employee_profile_photo }
        : require('../assets/P.png');

    const menuItems = [
        { name: "Language", icon: "globe-outline", component: Ionicons, value: "English", action: () => { } },
        
        agent?.designation_id?.permission?.collection === "true" && {
            name: "Collections",
            icon: "briefcase",
            component: MaterialCommunityIcons,
            action: () => navigation.navigate("Routes")
        },

        agent?.designation_id?.permission?.collection === "true" && {
            name: "Payments",
            icon: "credit-card-outline",
            component: MaterialCommunityIcons,
            action: () => navigation.navigate("PayNavigation", { user: user })
        },
        
        { name: "Leads", icon: "account-plus", component: MaterialCommunityIcons, action: () => navigation.navigate("PayNavigation", { screen: "ViewLeads", params: { user: user } }) },
        { name: "Commissions", icon: "cash-multiple", component: MaterialCommunityIcons, action: () => navigation.navigate("Commissions") },
        { name: "About MyChits", icon: "information-circle-outline", component: Ionicons, action: () => navigation.navigate("AboutMyChits") },
        { name: "Help & Support", icon: "help-circle-outline", component: Ionicons, action: () => navigation.navigate("HelpAndSupport") },
    ].filter(Boolean);

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient 
                colors={[COLORS.bgBlue, COLORS.primary]} 
                style={StyleSheet.absoluteFill} 
            />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <View style={{ width: 40 }} />
                        <Text style={styles.headerTitle}>My Profile</Text>
                        <TouchableOpacity onPress={handleLogout} style={styles.headerIconBtn}>
                            <Feather name="log-out" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerSubTitle}>Manage your account settings</Text>
                </View>

                <View style={styles.contentContainer}>
                    {isLoading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={COLORS.accent} />
                            <Text style={styles.loadingText}>Loading Profile...</Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {/* Profile Card */}
                            <View style={styles.profileCard}>
                                {/* 3. Made Avatar Touchable to open Modal */}
                                <TouchableOpacity 
                                    onPress={() => setIsImageModalVisible(true)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.avatarWrapper}>
                                        <Image
                                            alt="Profile Picture"
                                            source={imageSource}
                                            style={styles.avatar}
                                            resizeMode="contain"
                                            onError={() =>
                                                setAgent(prev => ({ ...prev, employee_profile_photo: null }))
                                            }
                                        />
                                        <View style={styles.verifiedBadge}>
                                            <Feather name="check" size={10} color="#fff" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                
                                <Text style={styles.agentName}>{agent.name || 'Agent Name'}</Text>
                                
                                <View style={styles.infoRow}>
                                    <View style={styles.infoItem}>
                                        <Feather name="phone" size={12} color={COLORS.primary} />
                                        <Text style={styles.infoText}>{agent.phone_number || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.infoDot} />
                                    <View style={styles.infoItem}>
                                        <Feather name="mail" size={12} color={COLORS.primary} />
                                        <Text style={styles.infoText}>{agent.email || 'No Email'}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Menu List */}
                            <View style={styles.menuContainer}>
                                {menuItems.map((item, index) => {
                                    const IconComponent = item.component;
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.menuCard}
                                            onPress={item.action}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.menuIconBox}>
                                                <IconComponent name={item.icon} size={18} color={COLORS.bgBlue} />
                                            </View>
                                            <Text style={styles.menuLabel}>{item.name}</Text>
                                            <View style={{ flex: 1 }} />
                                            {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                                            <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.muted} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Logout Button */}
                            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                                <Feather name="log-out" size={16} color={COLORS.white} style={{marginRight: 8}} />
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    )}
                </View>
            </SafeAreaView>

            {/* 4. Image Zoom Modal Implementation */}
            <Modal
                visible={isImageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsImageModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Close Button */}
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={() => setIsImageModalVisible(false)}
                    >
                        <Ionicons name="close-circle" size={32} color={COLORS.white} />
                    </TouchableOpacity>

                    {/* Zoomable ScrollView */}
                    <ScrollView
                        maximumZoomScale={3} // Allow 3x zoom
                        minimumZoomScale={1}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.zoomContainer}
                    >
                        <Image
                            source={imageSource}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { 
        flex: 1, 
        backgroundColor: COLORS.primary 
    },
    
    header: { 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === "android" ? 65 : 50, 
        paddingBottom: 5, 
        marginBottom: 5 
    },
    headerTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
    },
    headerTitle: { 
        fontSize: 22, 
        fontWeight: "900", 
        color: COLORS.white, 
        textAlign: 'center',
        flex: 1
    },
    headerSubTitle: { 
        fontSize: 12, 
        color: 'rgba(255,255,255,0.7)', 
        textAlign: 'center', 
        marginTop: 0 
    },
    headerIconBtn: {
        backgroundColor: COLORS.white,
        padding: 8,
        borderRadius: 10,
        elevation: 4
    },

    contentContainer: { 
        flex: 1, 
        paddingHorizontal: 16 
    },
    
    loaderContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    loadingText: { 
        color: COLORS.white, 
        marginTop: 10, 
        fontWeight: '600', 
        opacity: 0.8 
    },

    profileCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 8,
        backgroundColor: '#F0F4F8', 
        borderRadius: 50, 
        padding: 2
    },
    avatar: {
        width: 100, 
        height: 100,
        borderRadius: 50,
        borderWidth: 0, 
        borderColor: 'transparent',
        backgroundColor: COLORS.white 
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.success,
        borderRadius: 8,
        padding: 3,
        borderWidth: 1.5,
        borderColor: COLORS.white
    },
    agentName: {
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.primary,
        marginBottom: 0
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        width: '100%',
        justifyContent: 'center'
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    infoText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.primary,
        marginLeft: 4
    },
    infoDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.muted,
        marginHorizontal: 8
    },

    menuContainer: {
        marginBottom: 10
    },
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 10,
        marginBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    menuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: '#E3F2FD'
    },
    menuLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.primary
    },
    menuValue: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.muted,
        marginRight: 8
    },

    logoutBtn: {
        backgroundColor: COLORS.danger,
        padding: 14,
        borderRadius: 16,
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: COLORS.danger,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logoutText: {
        color: COLORS.white,
        fontWeight: "900",
        fontSize: 15,
        letterSpacing: 1
    },

    // --- Modal Styles ---
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)', // Dark overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomContainer: {
        flex: 1,
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: width,
        height: height * 0.8, // Occupy 80% of screen height
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 16,
    }
});

export default Profile;