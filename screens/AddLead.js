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
    TextInput
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
    const [receipt, setReceipt] = useState({});
    const [chitLeads, setChitLeads] = useState([]);
    const [goldLeads, setGoldLeads] = useState([]);
    const [isChitLoading, setIsChitLoading] = useState(false);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [chitLoaded, setChitLoaded] = useState(false);
    const [goldLoaded, setGoldLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState('chit');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [filteredChitLeads, setFilteredChitLeads] = useState([]);
    const [filteredGoldLeads, setFilteredGoldLeads] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchChitLeads, setSearchChitLeads] = useState([]);
    const [searchGoldLeads, setSearchGoldLeads] = useState([]);
    const [isSearchActive, setIsSearchActive] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchChitLeads();
            fetchGoldLeads();
            setCurrentDate(moment().format("MMMM Do, YYYY"));
        }, [])
    );

    useEffect(() => {
        applySearch();
    }, [searchQuery, activeTab, filteredChitLeads, filteredGoldLeads]);

    const isToday = (date) => {
        return moment(date).isSame(moment(), 'day');
    };

    const fetchChitLeads = async () => {
        setIsChitLoading(true);
        try {
            const response = await axios.get(`${baseUrl}/api/chitLeads/${user._id}`);
            const data = response.data;
            if (data.success) {
                setChitLeads(data.data);
                setFilteredChitLeads(data.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsChitLoading(false);
        }
    };

    const fetchGoldLeads = async () => {
        setIsGoldLoading(true);
        try {
            const response = await axios.get(`${goldBaseUrl}/api/leads/${user._id}`);
            const data = response.data;
            if (data.success) {
                setGoldLeads(data.data);
                setFilteredGoldLeads(data.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsGoldLoading(false);
        }
    };

    const toggleFilterModal = () => {
        setFilterModalVisible(!isFilterModalVisible);
    };

    const handleFilterSelection = (filter) => {
        setSelectedFilter(filter);
        if (activeTab === 'chit') {
            applyChitFilter(filter);
        } else {
            applyGoldFilter(filter);
        }
        toggleFilterModal();
    };

    const applyChitFilter = (filter) => {
        let leadsToFilter = [...chitLeads];
        if (filter === 'today') {
            leadsToFilter = leadsToFilter.filter(lead => isToday(lead.date));
        } else if (filter === 'last7Days') {
            const sevenDaysAgo = moment().subtract(7, 'days');
            leadsToFilter = leadsToFilter.filter(lead => moment(lead.date).isSameOrAfter(sevenDaysAgo, 'day'));
        } else if (filter === 'thisMonth') {
            leadsToFilter = leadsToFilter.filter(lead => moment(lead.date).isSame(moment(), 'month'));
        }
        setFilteredChitLeads(leadsToFilter);
    };

    const applyGoldFilter = (filter) => {
        let leadsToFilter = [...goldLeads];
        if (filter === 'today') {
            leadsToFilter = leadsToFilter.filter(lead => isToday(lead.date));
        } else if (filter === 'last7Days') {
            const sevenDaysAgo = moment().subtract(7, 'days');
            leadsToFilter = leadsToFilter.filter(lead => moment(lead.date).isSameOrAfter(sevenDaysAgo, 'day'));
        } else if (filter === 'thisMonth') {
            leadsToFilter = leadsToFilter.filter(lead => moment(lead.date).isSame(moment(), 'month'));
        }
        setFilteredGoldLeads(leadsToFilter);
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    const applySearch = () => {
        setIsSearchActive(searchQuery.length > 0);
        if (activeTab === 'chit') {
            const results = filteredChitLeads.filter(lead =>
                lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.contactNumber.includes(searchQuery)
            );
            setSearchChitLeads(results);
        } else {
            const results = filteredGoldLeads.filter(lead =>
                lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.contactNumber.includes(searchQuery)
            );
            setSearchGoldLeads(results);
        }
    };

    const renderItem = ({ item }) => {
        const formattedDate = isToday(item.date) ? "Today" : moment(item.date).format('DD/MM/YYYY');
        const formattedTime = moment(item.date).format('h:mm A');
        const currentData = activeTab === "chit" ? chitLeads : goldLeads;

        return (
            <View style={styles.leadCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.leadName}>{item.name}</Text>
                    <View style={styles.dateTimeContainer}>
                        <Text style={styles.dateTimeText}>{formattedTime}</Text>
                        <Text style={styles.dateTimeText}>{formattedDate}</Text>
                    </View>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.leadInfo}>
                        <Icon name="phone" size={12} color="#000" /> {item.contactNumber}
                    </Text>
                    {item.email && (
                        <Text style={styles.leadInfo}>
                            <Icon name="envelope" size={12} color="#000" /> {item.email}
                        </Text>
                    )}
                    <Text style={styles.leadInfo}>
                        <Icon name="user" size={12} color="#000" /> {item.source}
                    </Text>
                    <Text style={styles.leadInfo}>
                        <Icon name="info-circle" size={12} color="#000" /> {item.reference}
                    </Text>
                    {item.chitName && (
                        <Text style={styles.leadInfo}>
                            <Icon name="inr" size={12} color="#000" /> {item.chitName}
                        </Text>
                    )}
                </View>
                <View style={styles.cardFooter}>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => Linking.openURL(`tel:${item.contactNumber}`)}
                    >
                        <Icon name="phone" size={16} color="white" />
                        <Text style={styles.callButtonText}>Call</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#f0f0f0', '#ffffff']}
                style={styles.gradient}
            >
                <Header title="All Leads" />
                <View style={styles.searchBarContainer}>
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search by name or number..."
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                    />
                    <TouchableOpacity onPress={toggleFilterModal}>
                        <Icon name="filter" size={20} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'chit' && styles.activeTab]}
                        onPress={() => setActiveTab('chit')}
                    >
                        <Text style={styles.tabText}>Chit Leads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'gold' && styles.activeTab]}
                        onPress={() => setActiveTab('gold')}
                    >
                        <Text style={styles.tabText}>Gold Leads</Text>
                    </TouchableOpacity>
                </View>

                {isChitLoading || isGoldLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={styles.loadingIndicator} />
                ) : (
                    <ScrollView style={styles.scrollView}>
                        <View style={styles.flatListContainer}>
                            <Text style={styles.listHeader}>
                                Leads for {currentDate}
                            </Text>
                            <FlatList
                                data={activeTab === 'chit' ? (isSearchActive ? searchChitLeads : filteredChitLeads) : (isSearchActive ? searchGoldLeads : filteredGoldLeads)}
                                renderItem={renderItem}
                                keyExtractor={(item, index) => item._id || index.toString()}
                                ListEmptyComponent={
                                    <View style={styles.noDataContainer}>
                                        <Image source={noImage} style={styles.noImage} />
                                        <Text style={styles.noDataText}>No leads found.</Text>
                                    </View>
                                }
                            />
                        </View>
                    </ScrollView>
                )}
            </LinearGradient>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isFilterModalVisible}
                onRequestClose={toggleFilterModal}
            >
                <View style={styles.modalView}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Filter Leads</Text>
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => handleFilterSelection('all')}
                        >
                            <Icon
                                name={selectedFilter === "all" ? "check-circle" : "circle-o"}
                                size={20}
                                color="black"
                            />
                            <Text style={styles.optionText}>All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => handleFilterSelection('today')}
                        >
                            <Icon
                                name={selectedFilter === "today" ? "check-circle" : "circle-o"}
                                size={20}
                                color="black"
                            />
                            <Text style={styles.optionText}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => handleFilterSelection('last7Days')}
                        >
                            <Icon
                                name={selectedFilter === "last7Days" ? "check-circle" : "circle-o"}
                                size={20}
                                color="black"
                            />
                            <Text style={styles.optionText}>Last 7 Days</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => handleFilterSelection('thisMonth')}
                        >
                            <Icon
                                name={selectedFilter === "thisMonth" ? "check-circle" : "circle-o"}
                                size={20}
                                color="black"
                            />
                            <Text style={styles.optionText}>This Month</Text>
                        </TouchableOpacity>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={toggleFilterModal}>
                                <Text style={styles.modalButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        paddingHorizontal: 20,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    searchBar: {
        flex: 1,
        fontSize: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
    },
    loadingIndicator: {
        marginTop: 50,
    },
    scrollView: {
        flex: 1,
    },
    flatListContainer: {
        marginBottom: 20,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORS.primary,
        textAlign: 'center',
    },
    leadCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
        marginBottom: 10,
    },
    leadName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    dateTimeContainer: {
        alignItems: 'flex-end',
    },
    dateTimeText: {
        fontSize: 12,
        color: '#777',
    },
    cardBody: {
        marginBottom: 10,
    },
    leadInfo: {
        fontSize: 14,
        marginBottom: 5,
        color: '#555',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    callButtonText: {
        color: 'white',
        marginLeft: 10,
        fontWeight: 'bold',
    },
    noDataContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    noImage: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    noDataText: {
        fontSize: 18,
        color: '#888',
        textAlign: 'center',
    },
    modalView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        margin: 20,
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
    }
});

export default ViewLeads;