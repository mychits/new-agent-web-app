import {
    View,
    Text,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    TextInput,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
// Assuming COLORS is defined in a constants file
import COLORS from "../constants/color"; 
import Header from "../components/Header";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Feather } from "@expo/vector-icons";

const MyCommission = ({ route, navigation }) => {
    // Safely destructure commissions or use an empty object fallback
    const { commissions = {} } = route.params || {};
    
    const [goldLeads, setGoldLeads] = useState([]);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [searchQuery, setSearchQuery] = useState("");

    const leftAnim = useRef(new Animated.Value(-200)).current;
    const rightAnim = useRef(new Animated.Value(200)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Run animations when component mounts or tab changes
        if (commissions.commission_data && activeTab === "CHIT") {
            setIsChitLoading(false);

            // Reset animation values before starting
            leftAnim.setValue(-200);
            rightAnim.setValue(200);
            opacityAnim.setValue(0);
            
            Animated.parallel([
                Animated.timing(leftAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(rightAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [activeTab, commissions.commission_data]);

    const filteredCommissions = commissions?.commission_data?.filter(commission => {
        const userName = commission?.user_name || "";
        const groupName = commission?.group_name || "";
        const query = searchQuery.toLowerCase();
        return userName.toLowerCase().includes(query) || groupName.toLowerCase().includes(query);
    }) || [];

    const renderCommissionCard = ({ item }) => {
        // Only render if commission_released is true
        if(item.commission_released === false) return null;

        return (
            <TouchableOpacity style={styles.card}>
                <View style={styles.leftSection}>
                    {/* FIXED: Added || "N/A" for null-safety */}
                    <Text style={styles.name}>{item?.user_name || "N/A"}</Text> 
                    <Text style={styles.groupName}>
                        {item?.group_name ? item.group_name: "No Group Name"}
                    </Text>
                </View>
                <View style={styles.rightSection}>
                    <View style={styles.commissionContainer}>
                        {/* FIXED: Added || '0' for null-safety */}
                        <Text style={styles.commissionText}>{item?.actual_commission || '0'}</Text>
                    </View>
                     <MaterialIcons name="keyboard-arrow-right" style={styles.arrowIcon} />
                </View>
            </TouchableOpacity>
        );
    }
    
    const ListHeader = () => {
        // Use a safe default object for summary
        const summary = commissions?.summary || {};

        return (
            <View style={styles.summaryBoxesContainer}>
                
                {/* Box 1: Total Customers - Blue/Primary Color */}
                <Animated.View style={[styles.summaryBox, { transform: [{ translateX: leftAnim }], opacity: opacityAnim, borderColor: '#f8c009ff' }]}>
                    <Text style={styles.summaryText}>Total Customers</Text>
                    {/* FIXED: Use || '0' to ensure a string is always passed to <Text> */}
                    <Text style={[styles.summaryValue, { color: '#04aefdff' }]}>
                        {summary.total_customers || '0'}
                    </Text>
                </Animated.View>
                
                {/* Box 2: Total Groups - Green Color */}
                <Animated.View style={[styles.summaryBox, { transform: [{ translateX: leftAnim }], opacity: opacityAnim, borderColor: '#f8c009ff' }]}>
                    <Text style={styles.summaryText}>Total Groups</Text>
                    <Text style={[styles.summaryValue, { color: '#3ed160ff' }]}>
                        {summary.total_groups || '0'}
                    </Text>
                </Animated.View>
                
                {/* Box 3: My Business - Red/Accent Color */}
                <Animated.View style={[styles.summaryBox, { transform: [{ translateX: rightAnim }], opacity: opacityAnim, borderColor: '#f8c009ff' }]}>
                    <Text style={styles.summaryText}>My Business</Text>
                    <Text style={[styles.summaryValue, { color: '#f70cb4ff' }]}>
                        {summary.actual_business || '0'}
                    </Text>
                </Animated.View>
                
                {/* Box 4: My Commission - Gold/Accent Color */}
                <Animated.View style={[styles.summaryBox, { transform: [{ translateX: rightAnim }], opacity: opacityAnim, borderColor: '#f8c009ff' }]}>
                    <Text style={styles.summaryText}>My Commission</Text>
                    <Text style={[styles.summaryValue, { color: '#f1960cff' }]}>
                        {summary.total_actual || '0'}
                    </Text>
                </Animated.View>
            </View>
        );
    };

    const renderContent = () => {
        const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;
        const dataAvailable = activeTab === "CHIT" ? commissions?.success : goldLeads.length > 0;
        
        if (isLoading) {
            return (
                <ActivityIndicator
                    size="large"
                    color="#000"
                    style={{ marginTop: 20 }}
                />
            );
        }

        // Only show "No matching..." if a search query is present
        if (!dataAvailable || (activeTab === "CHIT" && filteredCommissions.length === 0 && searchQuery.length > 0)) {
             return (
                 <Text style={styles.noLeadsText}>
                     {searchQuery.length > 0 ? "No matching commissions found." : "No commission data found."}
                 </Text>
             );
        }

        return (
            <FlatList
                data={filteredCommissions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderCommissionCard}
                // Only render ListHeader for the CHIT tab
                ListHeaderComponent={activeTab === "CHIT" ? ListHeader : null}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.white }}>
            <LinearGradient 
                colors={["#1aa2ccff", "#1aa2ccff"]}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <KeyboardAvoidingView
                    style={styles.contentWrapper}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
                >
                    {/* --- FIXED TOP CONTENT --- */}
                    <Header />
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>My Commission</Text>
                        <Text style={styles.subtitle}>My business performance</Text>
                    </View>
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
                                Chits
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
                                Gold Chits
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* --- SCROLLABLE CONTENT AREA --- */}
                    <View style={{ flex: 1 }}>
                        {renderContent()}
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
    contentWrapper: { 
        flex: 1, 
        marginHorizontal: 22, 
        paddingTop: 50, // Pushes content down
    },
    titleContainer: {
        marginTop: 10,
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
    summaryBoxesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 5, 
        marginBottom: 10,
        borderColor: "#f8c009ff",
    },
    summaryBox: {
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        padding: 15,
        borderRadius: 15,
        // BorderColor is set inline for dynamic color
        borderWidth:2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        
        width: '48%',
        marginBottom: 15,
        alignItems: 'center',
    },
    summaryText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: 'bold',
        // Color is set inline for dynamic color
        marginTop: 5,
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        flexDirection: "row",
        justifyContent: 'space-between',
        padding: 15,
        marginVertical: 5,
        borderRadius: 15,
        borderLeftWidth: 5,
        borderColor: '#f8c009ff',
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
        fontSize: 14,
        fontWeight: "600",
        color: "#000",
        marginBottom: 5,
    },
    groupName: {
        fontSize: 14,
        color: "#666",
    },
    commissionContainer: {
        backgroundColor: '#FFD70020',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    commissionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6d56f0ff',
    },
    arrowIcon: {
        fontSize: 22,
        color: '#f8c009ff',
    },
    noLeadsText: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
        color: "#666",
    },
});

export default MyCommission;