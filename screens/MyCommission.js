import {
    View,
    Text,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    TextInput,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import Header from "../components/Header";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Feather } from "@expo/vector-icons";

const MyCommission = ({ route, navigation }) => {
    const { commissions } = route.params;
    const [goldLeads, setGoldLeads] = useState([]);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [searchQuery, setSearchQuery] = useState("");

    const leftAnim = useRef(new Animated.Value(-200)).current;
    const rightAnim = useRef(new Animated.Value(200)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (commissions.commission_data) {
            setIsChitLoading(false)

            if (activeTab === "CHIT") {
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
        }
    }, [activeTab, commissions.commission_data]);

    const filteredCommissions = commissions?.commission_data?.filter(commission => {
        const userName = commission?.user_name || "";
        const groupName = commission?.group_name || "";
        const query = searchQuery.toLowerCase();
        return userName.toLowerCase().includes(query) || groupName.toLowerCase().includes(query);
    }) || [];

    const renderCommissionCard = ({ item }) => {
        if(item.commission_released === false) return;

        return (
            <TouchableOpacity style={styles.card}>
                <View style={styles.leftSection}>
                    <Text style={styles.name}>{item?.user_name}</Text>
                    <Text style={styles.groupName}>
                        {item?.group_name ? item.group_name: "No Group Name"}
                    </Text>
                </View>
                <View style={styles.rightSection}>
                    <View style={styles.commissionContainer}>
                        <Text style={styles.commissionText}>{item?.actual_commission}</Text>
                    </View>
                     <MaterialIcons name="keyboard-arrow-right" style={styles.arrowIcon} />
                </View>
            </TouchableOpacity>
        );
    }

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

                        {activeTab === "CHIT" ? (
                            isChitLoading ? (
                                <ActivityIndicator
                                    size="large"
                                    color="#000"
                                    style={{ marginTop: 20 }}
                                />
                            ) : !(commissions?.success) ? (
                                <Text style={styles.noLeadsText}>No Commission Data Found</Text>
                            ) : (

                                <FlatList
                                    data={filteredCommissions}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={renderCommissionCard}
                                    ListHeaderComponent={() => (
                                        <View style={styles.summaryBoxesContainer}>
                                            <Animated.View style={[styles.summaryBox, { transform: [{ translateX: leftAnim }], opacity: opacityAnim }]}>
                                                <Text style={styles.summaryText}>Total Customers</Text>
                                                <Text style={styles.summaryValue}>{commissions?.summary?.total_customers}</Text>
                                            </Animated.View>
                                            <Animated.View style={[styles.summaryBox, { transform: [{ translateX: leftAnim }], opacity: opacityAnim }]}>
                                                <Text style={styles.summaryText}>Total Groups</Text>
                                                <Text style={styles.summaryValue}>{commissions?.summary?.total_groups}</Text>
                                            </Animated.View>
                                            <Animated.View style={[styles.summaryBox, { transform: [{ translateX: rightAnim }], opacity: opacityAnim }]}>
                                                <Text style={styles.summaryText}>My Business</Text>
                                                <Text style={styles.summaryValue}>{commissions?.summary?.actual_business}</Text>
                                            </Animated.View>
                                            <Animated.View style={[styles.summaryBox, { transform: [{ translateX: rightAnim }], opacity: opacityAnim }]}>
                                                <Text style={styles.summaryText}>My Commission</Text>
                                                <Text style={styles.summaryValue}>{commissions?.summary?.total_actual}</Text>
                                            </Animated.View>
                                        </View>
                                    )}
                                    ListEmptyComponent={() => (
                                        <Text style={styles.noLeadsText}>No matching commissions found.</Text>
                                    )}
                                />
                            )
                        ) : isGoldLoading ? (
                            <ActivityIndicator
                                size="large"
                                color="#000"
                                style={{ marginTop: 20 }}
                            />
                        ) : goldLeads.length === 0 ? (
                            <Text style={styles.noLeadsText}>No commission Data Found</Text>
                        ) : (
                            <FlatList
                                data={filteredCommissions}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={renderCommissionCard}
                                ListEmptyComponent={() => (
                                    <Text style={styles.noLeadsText}>No matching commissions found.</Text>
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
    summaryBoxesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
        borderColor: "#da8201",
    },
    summaryBox: {
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        padding: 15,
        borderRadius: 15,
       borderColor: "#da8201",
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
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
        borderColor: '#da8201',
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
    commissionContainer: {
        backgroundColor: '#FFD70020',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    commissionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
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

export default MyCommission;