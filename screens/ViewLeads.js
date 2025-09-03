import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    TextInput,
    Platform
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import moment from "moment";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
const noImage = require("../assets/no.png");

const ViewLeads = ({ route, navigation }) => {
    const { user } = route.params;

    const [currentDate, setCurrentDate] = useState("");
    const [chitLeads, setChitLeads] = useState([]);
    const [goldLeads, setGoldLeads] = useState([]);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [chitLoaded, setChitLoaded] = useState(false);
    const [goldLoaded, setGoldLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("CHIT");
    const [expandedLeadId, setExpandedLeadId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState(moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
    const [filterText, setFilterText] = useState("Last Month");

    useEffect(() => {
        setCurrentDate(moment().format("DD-MM-YYYY"));
    }, []);

    const fetchChitLeads = async (startDate, endDate) => {
        setIsChitLoading(true);
        setChitLoaded(false);
        try {
            const response = await axios.get(
                `${baseUrl}/lead/agent/${user.userId}/records`,
                {
                    params: {
                        start_date: startDate,
                        end_date: endDate
                    }
                }
            );
            setChitLeads(response.data);
        } catch (error) {
            console.error("Error fetching chit leads data:", error);
            setChitLeads([]);
        } finally {
            setIsChitLoading(false);
            setChitLoaded(true);
        }
    };

    const fetchGoldLeads = async (startDate, endDate) => {
        setIsGoldLoading(true);
        setGoldLoaded(false);
        try {
            const response = await axios.get(
                `${goldBaseUrl}/lead/agent/${user.userId}/records`,
                {
                    params: {
                        start_date: startDate,
                        end_date: endDate
                    }
                }
            );
            setGoldLeads(response.data);
        } catch (error) {
            console.error("Error fetching gold leads data:", error);
            setGoldLeads([]);
        } finally {
            setIsGoldLoading(false);
            setGoldLoaded(true);
        }
    };

    // Use an effect to fetch data whenever startDate or endDate changes
    useEffect(() => {
        fetchChitLeads(startDate, endDate);
        fetchGoldLeads(startDate, endDate);
    }, [startDate, endDate]);

    // Use focus effect to refresh data when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchChitLeads(startDate, endDate);
            fetchGoldLeads(startDate, endDate);
        }, [startDate, endDate])
    );

    const handleCall = (phoneNumber) => {
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleWhatsApp = (phoneNumber) => {
        Linking.openURL(`whatsapp://send?phone=${phoneNumber}`);
    };

    const handleEditLead = (lead) => {
        navigation.navigate("EditLead", { user: user, lead: lead });
    };

    const toggleExpand = (id) => {
        setExpandedLeadId(expandedLeadId === id ? null : id);
    };

    const isFreshLead = (createdAt) => {
        const leadDate = moment(createdAt);
        return leadDate.isSame(moment(), "day");
    };

    const isNewLead = (createdAt) => {
        const leadDate = moment(createdAt);
        const tenDaysAgo = moment().subtract(10, "days").startOf("day");
        return leadDate.isAfter(tenDaysAgo) && !isFreshLead(createdAt);
    };

    const handleDateRangeSelect = (range) => {
        let newStartDate, newEndDate;
        switch (range) {
            case "All":
                newStartDate = "";
                newEndDate = "";
                break;
            case "Today":
                newStartDate = moment().format('YYYY-MM-DD');
                newEndDate = moment().format('YYYY-MM-DD');
                break;
            case "Yesterday":
                newStartDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
                newEndDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
                break;
            case "This Week":
                newStartDate = moment().startOf('isoWeek').format('YYYY-MM-DD');
                newEndDate = moment().endOf('isoWeek').format('YYYY-MM-DD');
                break;
            case "Last Week":
                newStartDate = moment().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD');
                newEndDate = moment().subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD');
                break;
            case "This Month":
                newStartDate = moment().startOf('month').format('YYYY-MM-DD');
                newEndDate = moment().endOf('month').format('YYYY-MM-DD');
                break;
            case "Last Month":
                newStartDate = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
                newEndDate = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
                break;
            case "This Year":
                newStartDate = moment().startOf('year').format('YYYY-MM-DD');
                newEndDate = moment().endOf('year').format('YYYY-MM-DD');
                break;
            case "Last Year":
                newStartDate = moment().subtract(1, 'year').startOf('year').format('YYYY-MM-DD');
                newEndDate = moment().subtract(1, 'year').endOf('year').format('YYYY-MM-DD');
                break;
            default:
                break;
        }
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        setFilterText(range);
        setModalVisible(false);
    };

    const searchFilterFunction = (text) => {
        setSearchQuery(text);
    };

    const renderLeadCard = ({ item }) => {
        const isExpanded = expandedLeadId === item._id;
        const freshLead = isFreshLead(item.createdAt);
        let cardStyle = styles.card;
        let badgeText = null;
        let badgeContainerStyle = null;
        let badgeTextStyle = null;

        if (freshLead) {
            cardStyle = { ...styles.card, ...styles.freshLeadCard };
            badgeText = "FRESH";
            badgeContainerStyle = styles.freshLeadBadgeContainer;
            badgeTextStyle = styles.freshLeadBadgeText;
        } else if (isNewLead(item.createdAt)) {
            cardStyle = { ...styles.card, ...styles.newLeadCard };
            badgeText = "NEW";
            badgeContainerStyle = styles.newLeadBadgeContainer;
            badgeTextStyle = styles.newLeadBadgeText;
        }

        const createdDate = moment(item.createdAt).format("DD-MM-YYYY");
        const createdTime = moment(item.createdAt).format("HH:mm");

        const schemeTypeDisplay = item.scheme_type ?
            item.scheme_type.charAt(0).toUpperCase() + item.scheme_type.slice(1) :
            "";


        const groupName = item.group_id?.group_name ? item.group_id?.group_name : "No Group";

        return (
            <TouchableOpacity onPress={() => toggleExpand(item._id)} style={cardStyle}>
                <View style={styles.cardHeader}>
                    <View style={styles.leftSection}>
                        <View>
                            <Text style={styles.name}>{item.lead_name}</Text>
                            <Text style={styles.groupName}>{groupName}</Text>
                        </View>
                    </View>
                    <View style={styles.rightSection}>
                        <Text style={styles.schemeType}>
                            {schemeTypeDisplay}
                        </Text>
                        <Icon
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#666"
                            style={styles.expandIcon}
                        />
                    </View>
                </View>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <Text style={styles.phoneNumber}>Phone: {item.lead_phone}</Text>
                        <Text style={styles.createdAt}>
                            Created: {createdDate} at {createdTime}
                        </Text>

                        {item.lead_image && (
                            <Image source={{ uri: item.lead_image }} style={styles.leadImage} />
                        )}

                        <View style={styles.contactButtons}>
                            <TouchableOpacity
                                onPress={() => handleCall(item.lead_phone)}
                                style={styles.callButton}
                            >
                                <Icon name="phone" size={18} color={COLORS.white} />
                                <Text style={styles.buttonText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleWhatsApp(item.lead_phone)}
                                style={styles.whatsappButton}
                            >
                                <Icon name="whatsapp" size={18} color={COLORS.white} />
                                <Text style={styles.buttonText}>WhatsApp</Text>
                            </TouchableOpacity>
                            {freshLead && (
                                <TouchableOpacity
                                    onPress={() => handleEditLead(item)}
                                    style={styles.editButton}
                                >
                                    <Icon name="edit" size={18} color={COLORS.white} />
                                    <Text style={styles.buttonText}>Edit</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {badgeText && (
                    <View style={badgeContainerStyle}>
                        <Text style={badgeTextStyle}>{badgeText}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;
    const dataLoaded = activeTab === "CHIT" ? chitLoaded : goldLoaded;
    const allLeads = activeTab === "CHIT" ? chitLeads : goldLeads;

    const filteredLeads = searchQuery
        ? allLeads.filter((item) => {
            const itemData = `${item.lead_name.toUpperCase()} ${item.lead_phone.toUpperCase()} ${item.group_name ? item.group_name.toUpperCase() : ""
                }`;
            const textData = searchQuery.toUpperCase();
            return itemData.indexOf(textData) > -1;
        })
        : allLeads;

    const noDataMessage =
        activeTab === "CHIT" ? "No chit leads found" : "No gold leads found";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
            <LinearGradient
                colors={['#dbf6faff', '#90dafcff']}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ marginHorizontal: 22, marginTop: 12, flex: 1 }}>
                        <Header />

                        <View style={styles.titleContainer}>
                            <View style={styles.titleAndCountRow}>
                                <Text style={styles.title}>Leads</Text>
                                <Text style={styles.totalAmountText}>
                                    {chitLeads.length + goldLeads.length || 0}
                                </Text>
                            </View>
                            <View style={styles.searchAndFilterContainer}>
                                <View style={styles.searchBarContainer}>
                                    <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
                                    <TextInput
                                        style={styles.searchBar}
                                        placeholder="Search leads..."
                                        onChangeText={searchFilterFunction}
                                        value={searchQuery}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={styles.filterBox}
                                    onPress={() => setModalVisible(true)}
                                >
                                    <Icon name="filter" size={18} color="#000" style={styles.filterIcon} />
                                    <Text style={styles.filterText}>{filterText}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.container}>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                                    onPress={() => setActiveTab("CHIT")}
                                >
                                    <Icon
                                        name="users"
                                        size={20}
                                        color={activeTab === "CHIT" ? "#333" : "#666"}
                                        style={styles.tabIcon}
                                    />
                                    <Text
                                        style={[
                                            styles.tabText,
                                            activeTab === "CHIT" && styles.activeTabText,
                                        ]}
                                    >
                                        Chit Leads {chitLeads.length || 0}
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
                                        style={styles.tabIcon}
                                    />
                                    <Text
                                        style={[
                                            styles.tabText,
                                            activeTab === "GOLD" && styles.activeTabText,
                                        ]}
                                    >
                                        Gold Leads {goldLeads.length || 0}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ minHeight: 200 }}>
                                {isLoading && (
                                    <ActivityIndicator
                                        size="large"
                                        color="#000"
                                        style={{ marginTop: 20 }}
                                    />
                                )}
                                {!isLoading && dataLoaded && filteredLeads.length > 0 && (
                                    <FlatList
                                        data={filteredLeads}
                                        keyExtractor={(item, index) => item._id || index.toString()}
                                        renderItem={renderLeadCard}
                                        contentContainerStyle={styles.flatListContent}
                                    />
                                )}
                                {!isLoading && dataLoaded && filteredLeads.length === 0 && (
                                    <View style={styles.noDataContainer}>
                                        <Image source={noImage} style={styles.noImage} />
                                        <Text style={styles.noDataText}>{noDataMessage}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>

            <TouchableOpacity
                onPress={() => navigation.navigate("AddLead", { user: user })}
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
                }}
            >
                <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                    + Add
                </Text>
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Filter</Text>
                        {["All",
                            "Today",
                            "Yesterday",
                            "This Week",
                            "Last Week",
                            "This Month",
                            "Last Month",
                            "This Year",
                            "Last Year",
                        ].map((range) => (
                            <TouchableOpacity
                                key={range}
                                style={styles.dateRangeOption}
                                onPress={() => handleDateRangeSelect(range)}
                            >
                                <Text style={styles.dateRangeText}>{range}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalButtonText}>CLOSE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    gradientOverlay: {
        flex: 1,
    },
    titleContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    titleAndCountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginBottom: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
    },
    totalAmountText: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
    },
    container: {
        flex: 1,
        marginTop: -3,
    },
    searchAndFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 15,
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
    },
    activeTab: {
        backgroundColor: "#da8201",
    },
    tabText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
    },
    activeTabText: {
        color: "#333",
        fontWeight: "bold",
    },
    tabIcon: {
        marginRight: 5,
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        padding: 15,
        marginVertical: 5,
        borderRadius: 15,
        borderLeftWidth: 5,
        borderColor: "#da8201",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        position: "relative",
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    freshLeadCard: {
        borderColor: "green",
    },
    newLeadCard: {
        borderColor: COLORS.primary,
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 10,
        position: 'relative',
    },
    name: {
        fontSize: 20,
        fontWeight: "600",
        color: "#000",
        marginBottom: 5,  // gap between name and groupName
    },
    groupName: {
        fontSize: 16,
        color: "#666",
    },
    schemeType: {
        fontSize: 14,
        color: "#000",
        fontWeight: "500",
        marginRight: 25,
    },
    expandIcon: {
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: [{ translateY: -9 }],
    },
    expandedContent: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    phoneNumber: {
        fontSize: 14,
        color: "#333",
        marginBottom: 5,
    },
    createdAt: {
        fontSize: 12,
        color: "#888",
        fontStyle: "italic",
        marginBottom: 10,
    },
    contactButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 10,
    },
    callButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    whatsappButton: {
        backgroundColor: "#25D366",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    editButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    buttonText: {
        color: COLORS.white,
        marginLeft: 5,
        fontWeight: "bold",
    },
    freshLeadBadgeContainer: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "green",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderBottomLeftRadius: 15,
    },
    freshLeadBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "bold",
    },
    newLeadBadgeContainer: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "orange",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderBottomLeftRadius: 15,
    },
    newLeadBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "bold",
    },
    noDataContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 50,
    },
    noDataText: {
        fontSize: 14,
        color: "#555",
        textAlign: "center",
    },
    noImage: {
        width: 250,
        height: 150,
        resizeMode: "contain",
        marginBottom: 20,
    },
    flatListContent: {
        paddingBottom: 100,
    },
    leadImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 10,
        resizeMode: 'cover',
    },
    filterBox: {
        backgroundColor: "rgba(192, 223, 248, 0.7)",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 15,
        borderColor: "rgba(192, 223, 248, 0.7)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        flex: 3,
        height: 50,
    },
    filterIcon: {
        marginRight: 5,
        fontSize: 15,
    },
    filterText: {
        fontSize: 12,
        fontWeight: "bold",
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 25,
        alignItems: "flex-start",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "left",
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    optionText: {
        marginLeft: 15,
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        marginTop: 30,
    },
    modalButtonText: {
        fontSize: 16,
        color: 'blue',
        fontWeight: 'bold',
        marginLeft: 20,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 25,
        paddingHorizontal: 15,
        flex: 7,
        height: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginRight: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchBar: {
        flex: 1,
        height: 50,
        color: '#333'
    },
    dateRangeOption: {
        paddingVertical: 10,
        width: '100%',
    },
    dateRangeText: {
        fontSize: 16,
        color: '#333',
    },
});

export default ViewLeads;