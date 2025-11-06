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
    Animated,
    Dimensions,
    Easing, // Required for smooth, linear motion
} from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');

const noImage = require('../assets/no.png'); // Assuming this path is correct

const COLOR_PALETTE = {
    primary: '#f8c009ff', // Gold/Orange accent
    secondary: '#333', // Dark text
    backgroundLight: '#f0f0f0',
    cardBackground: '#FFFFFF',
    successGreen: '#27AE60',
    softGrey: '#666',
    celebrationColor: '#FFD700',
};

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


// --------------------------------------------------------
// --- CONFETTI SHOWER COMPONENT (Star Emojis/Symbols) ---
const ConfettiFall = ({ startY, duration, delay, emoji, initialX, scale, rotation }) => {
    const translateY = React.useRef(new Animated.Value(startY)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Initial Fade In (Quick pop into existence)
        Animated.timing(opacity, {
            toValue: 1,
            duration: 100,
            delay: delay,
            useNativeDriver: true,
        }).start();

        // 2. Vertical Fall
        Animated.timing(translateY, {
            toValue: height + 50, // Falls off the bottom of the screen
            duration: duration,
            delay: delay,
            easing: Easing.linear, // Smooth, constant falling speed
            useNativeDriver: true,
        }).start(() => {
            // 3. Fade out at the bottom
            Animated.timing(opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    return (
        <Animated.Text
            style={{
                position: 'absolute',
                top: 0,
                left: initialX,
                fontSize: 18 * scale, // Scale the font size for variety
                opacity: opacity,
                zIndex: 100,
                transform: [
                    { translateY: translateY },
                    { rotate: rotation }, // Random rotation for flair
                    { scale: scale }
                ],
            }}
        >
            {emoji}
        </Animated.Text>
    );
};
// --------------------------------------------------------


const Commissions = ({ route, navigation }) => {
    const { user } = route.params || {};
    const currentUser = user || {};

    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [commissions, setCommissions] = useState({}); 
    const [activeTab, setActiveTab] = useState("CHIT");
    
    // STATE: To hold the array of falling confetti elements
    const [confettiElements, setConfettiElements] = useState([]);
    
    // Animation values for card list slide-in
    const cardListOpacity = React.useRef(new Animated.Value(0)).current; 
    const dataContainerTranslateY = React.useRef(new Animated.Value(-height * 0.1)).current; 
    
    // ... (utility functions remain the same) ...
    const handleEstimatedCommission = () => {
        navigation.navigate("ExpectedCommissions", { user: currentUser });
    };

    const handleMyCommission = () => {
        navigation.navigate("MyCommission", { commissions: commissions });
    };

    const handleMyCustomers = () => {
        navigation.navigate("ViewEnrollments", { user: currentUser });
    };

    const handleGroups = () => {
        navigation.navigate("EnrolledGroups", { user: currentUser });
    };

    const scrollData = [
        { title: "Customers", icon: "person", value: "total_customers", key: "#1", handlePress: handleMyCustomers },
        { title: "Groups", icon: "group", value: "total_groups", key: "#2", handlePress: handleGroups },
        { title: "My Business", icon: "query-stats", value: "actual_business", key: "#6", handlePress: handleMyCommission },
        { title: "Estimated Business", icon: "trending-up", value: "expected_business", key: "#5", handlePress: handleEstimatedCommission },
        { title: "My Commission", icon: "payments", value: "total_actual", key: "#4", handlePress: handleMyCommission },
        { title: "Estimated Commission", icon: "currency-rupee", value: "total_estimated", key: "#3", handlePress: handleEstimatedCommission },
    ];

    const hasData = commissions?.summary && Object.keys(commissions.summary).length > 0;

    const startConfettiAnimation = () => {
        // Updated Star Symbols: Removed all strictly black symbols (like ★ and ✦) 
        // Focus on bright, white, or colored emojis.
        const starSymbols = ['⭐', '🌟', '✨', '💫', '✩', '✰'];
        const numConfetti = 60; 
        const newConfettiElements = [];
        
        // Utility to get a random star symbol
        const getRandomStar = () => starSymbols[Math.floor(Math.random() * starSymbols.length)];

        for (let i = 0; i < numConfetti; i++) {
            const delay = Math.random() * 900; 
            const duration = 2400 + Math.random() * 1600; 
            const initialX = Math.random() * width; 
            const scale = 1.0 + Math.random() * 0.6; 
            const rotation = `${Math.random() * 360}deg`;
            
            newConfettiElements.push(
                <ConfettiFall
                    key={`confetti-${Date.now()}-${i}`}
                    startY={-50} 
                    duration={duration}
                    delay={delay}
                    emoji={getRandomStar()} // Pass a random star symbol
                    initialX={initialX}
                    scale={scale}
                    rotation={rotation}
                />
            );
        }
        setConfettiElements(newConfettiElements);

        // Clear confetti after animation sequence
        setTimeout(() => {
            setConfettiElements([]);
        }, 5000); 
    };

    useEffect(() => {
        const fetchCommissions = async () => {
            // Reset animations and clear old data before fetching
            cardListOpacity.setValue(0); 
            dataContainerTranslateY.setValue(-height * 0.1);
            setConfettiElements([]); 
            setCommissions({}); 

            if (!currentUser.userId) {
                console.warn("User ID is not available for fetching commissions.");
                setIsChitLoading(false);
                setIsGoldLoading(false);
                return;
            }

            const currentUrl =
                activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
            try {
                activeTab === "CHIT" ? setIsChitLoading(true) : setIsGoldLoading(true);
                const response = await axios.get(
                    `${currentUrl}/enroll/get-detailed-commission/${currentUser.userId}`
                );
                
                if (response.status >= 400)
                    throw new Error("Failed to fetch Customer Data");
                
                setCommissions(response.data);
                
                const summaryExists = response.data?.summary && Object.keys(response.data.summary).length > 0;

                if (summaryExists) {
                    // 1. Start the Falling Confetti Animation with star symbols
                    startConfettiAnimation();

                    // 2. Run the Card Slide-Down Animation
                    Animated.parallel([
                        Animated.timing(cardListOpacity, { 
                            toValue: 1,
                            duration: 700, 
                            delay: 500, // Delay slightly more to let the confetti start
                            useNativeDriver: true,
                        }),
                        Animated.spring(dataContainerTranslateY, {
                            toValue: 0,
                            speed: 4, 
                            bounciness: 6, 
                            delay: 500, 
                            useNativeDriver: true,
                        })
                    ]).start();
                }

            } catch (err) {
                console.error("Error fetching commissions:", err.message);
                setCommissions({}); 
            } finally {
                activeTab === "CHIT"
                    ? setIsChitLoading(false)
                    : setIsGoldLoading(false);
            }
        };
        fetchCommissions();
    }, [activeTab, currentUser]); 

    const renderCardList = (isLoading, dataAvailable, activeTabName) => {
        if (isLoading) {
            return (
                <ActivityIndicator
                    size="large"
                    color={COLOR_PALETTE.primary}
                    style={{ marginTop: 20 }}
                />
            );
        }

        if (dataAvailable) {
            const animatedStyle = {
                opacity: cardListOpacity,
                transform: [{ translateY: dataContainerTranslateY }],
            };
            
            return (
                <Animated.View style={[{ gap: 20, width: '100%' }, animatedStyle]}> 
                    {scrollData.map(({ title, icon, value, key, handlePress }) => (
                        <CustomCommissionCard
                            key={key}
                            title={title}
                            icon={icon}
                            value={commissions?.summary?.[value] || 0} 
                            onPress={handlePress}
                        />
                    ))}
                </Animated.View>
            );
        }

        return (
            <View style={styles.noDataContainer}>
                <Ionicons name="alert-circle-outline" size={50} color={COLOR_PALETTE.primary} />
                <Text style={styles.noLeadsText}>
                    No {activeTabName} Commission Data Found
                </Text>
                <Image source={noImage} style={styles.noImage} />
            </View>
        );
    };

    return (
        <LinearGradient
            colors={["#1aa2ccff", "#1aa2ccff"]}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Renders the confetti shower on top of everything else */}
            {confettiElements}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            >
                {/* Fixed Header Section */}
                <View style={styles.fixedHeaderContainer}>
                    <Header />
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>My Overview </Text>
                        <Text style={styles.subtitle}>Select a scheme type to view your achievements</Text>
                    </View>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                            onPress={() => setActiveTab("CHIT")}
                        >
                            <Icon
                                name="users"
                                size={20}
                                color={activeTab === "CHIT" ? COLOR_PALETTE.secondary : COLOR_PALETTE.softGrey}
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
                                color={activeTab === "GOLD" ? COLOR_PALETTE.secondary : COLOR_PALETTE.softGrey}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "GOLD" && styles.activeTabText,
                                ]}
                            >
                                Gold Schemes
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Scrollable Content Section */}
                <ScrollView
                    style={styles.scrollContentContainer}
                    contentContainerStyle={{ paddingBottom: 120 }} 
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.cardListContainer}>
                        {activeTab === "CHIT"
                            ? renderCardList(isChitLoading, hasData, "Chit")
                            : renderCardList(isGoldLoading, hasData, "Gold")
                        }
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    fixedHeaderContainer: {
        paddingHorizontal: 22,
        paddingTop: 50, 
        paddingBottom: 10, 
        zIndex: 1, 
    },
    scrollContentContainer: {
        flex: 1, 
    },
    titleContainer: {
        marginBottom: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLOR_PALETTE.secondary,
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 16,
        color: COLOR_PALETTE.softGrey,
        marginTop: 5,
        fontWeight: '500',
        textAlign: 'center'
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardListContainer: {
        gap: 20, 
        alignItems: 'center',
        paddingHorizontal: 22, 
        width: '100%', 
        paddingTop: 20, 
    },
    card: {
        backgroundColor: COLOR_PALETTE.cardBackground,
        borderRadius: 20,
        padding: 20,
        width: '100%', 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 5,
        borderBottomWidth: 5, 
        borderColor: COLOR_PALETTE.primary,
        shadowColor: COLOR_PALETTE.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 45, 
        height: 45,
        backgroundColor: `${COLOR_PALETTE.primary}30`, 
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 24,
        color: COLOR_PALETTE.primary,
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    cardText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLOR_PALETTE.secondary,
    },
    cardSubText: {
        fontSize: 16, 
        color: COLOR_PALETTE.primary,
        marginTop: 5,
        fontWeight: '700',
    },
 arrowIcon: {
    fontSize: 34, 
    color: COLOR_PALETTE.primary,
    marginLeft: -35, // Adjust this value (e.g., -5, -10) to move the icon left
},
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 15,
        margin: 3, 
    },
    activeTab: {
        backgroundColor: COLOR_PALETTE.primary,
        shadowColor: COLOR_PALETTE.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 8,
    },
    tabText: {
        fontSize: 16,
        color: COLOR_PALETTE.softGrey,
        fontWeight: "500",
        marginLeft: 5,
    },
    activeTabText: {
        color: COLORS.white, 
        fontWeight: 'bold',
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        padding: 20,
        backgroundColor: COLOR_PALETTE.cardBackground,
        borderRadius: 20,
        width: '100%',
    },
    noLeadsText: { 
        fontSize: 18,
        color: COLOR_PALETTE.secondary,
        textAlign: 'center',
        marginTop: 15,
        fontWeight: 'bold',
        lineHeight: 25,
    },
    noImage: {
        width: 250,
        height: 150,
        resizeMode: 'contain',
        marginTop: 20,
    }
});

export default Commissions;