import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    StatusBar,
    SafeAreaView,
    Platform,
    Image,
    Alert,
    ToastAndroid,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import baseUrl from "../constants/baseUrl";
import COLORS from "../constants/color";
import axios from "axios";

// New Header Component
const Header = ({ navigation }) => {
    return (
        <View style={headerStyles.headerContainer}>
            <TouchableOpacity style={headerStyles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back-outline" size={30} color={"Black"} />
            </TouchableOpacity>
            <Image
                source={require('../assets/hero1.jpg')}
                style={headerStyles.headerImage}
            />
        </View>
    );
};

const formatNumberIndianStyle = (num) => {
    if (num === null || num === undefined) {
        return "0";
    }
    const parts = num.toString().split('.');
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? ',' + parts[1] : '';
    let isNegative = false;
    if (integerPart.startsWith('-')) {
        isNegative = true;
        integerPart = integerPart.substring(1);
    }

    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
        const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        return (isNegative ? '-' : '') + formattedOtherNumbers + ',' + lastThree + decimalPart;
    } else {
        return (isNegative ? '-' : '') + lastThree + decimalPart;
    }
};

const Enrollment = ({ route, navigation }) => {
    const { groupFilter, user } = route.params;
    const userId = user?.userId || {};

    const [selectedCardIndex, setSelectedCardIndex] = useState(null);
    const [cardsData, setCardsData] = useState([]);
    const [vacantSeats, setVacantSeats] = useState({});
    const initialGroupFilter = groupFilter === "New Groups" ? "NewGroups" : (groupFilter === "Ongoing Groups" ? "OngoingGroups" : "All Groups");
    const [selectedGroup, setSelectedGroup] = useState(initialGroupFilter);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollmentModalVisible, setEnrollmentModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const groupColors = {
        new: { primary: '#E0F7FA', secondary: '#00BCD4', text: '#00BCD4', darkText: '#263238', buttonBackground: '#00BCD4', selectedBorder: '#00BCD4', iconColor: '#00BCD4' },
        ongoing: { primary: '#E8F5E9', secondary: '#4CAF50', text: '#4CAF50', darkText: '#263232', buttonBackground: '#4CAF50', selectedBorder: '#4CAF50', iconColor: '#4CAF50' },
        ended: { primary: '#FBE9E7', secondary: '#FF7043', text: '#FF7043', darkText: '#263238', buttonBackground: '#FF7043', selectedBorder: '#FF7043', iconColor: '#FF7043' },
        members_5_value_1000: { primary: '#FFFDE7', secondary: '#FFC107', text: '#E65100', darkText: '#5D4037', buttonBackground: '#FF8F00', selectedBorder: '#FF8F00', iconColor: '#FFC107' },
        members_10_value_500: { primary: '#F3E5F5', secondary: '#9C27B0', text: '#4A148C', darkText: '#424242', buttonBackground: '#7B1FA2', selectedBorder: '#6A1B9A', iconColor: '#9C27B0' },
        value_very_high: { primary: '#E3F2FD', secondary: '#2196F3', text: '#1565C0', darkText: '#1A237E', buttonBackground: '#1976D2', selectedBorder: '#0D47A1', iconColor: '#2196F3' },
        small_members_high_value: { primary: '#FCE4EC', secondary: '#EC407A', text: '#C2185B', darkText: '#880E4F', buttonBackground: '#D81B60', selectedBorder: '#AD1457', iconColor: '#EC407A' },
        large_members_any_value: { primary: '#F1F8E9', secondary: '#8BC34A', text: '#558B2F', darkText: '#33691E', buttonBackground: '#689F38', selectedBorder: '#33691E', iconColor: '#8BC34A' },
        high_performing: { primary: '#F0FFF4', secondary: '#388E3C', text: '#1B5E20', darkText: '#33691E', buttonBackground: '#4CAF50', selectedBorder: '#2E7D32', iconColor: '#388E3C' },
        low_engagement: { primary: '#FFF8E1', secondary: '#FFB300', text: '#E65100', darkText: '#BF360C', buttonBackground: '#FB8C00', selectedBorder: '#EF6C00', iconColor: '#FFB300' },
        very_small_group: { primary: '#F3E5F5', secondary: '#EF6C00', text: '#4A148C', darkText: '#2D0B4B', buttonBackground: '#EF6C00', selectedBorder: '#EF6C00', iconColor: '#EF6C00' },
        medium_sized_group: { primary: '#E1F5FE', secondary: '#03A9F4', text: '#0277BD', darkText: '#01579B', buttonBackground: '#29B6F6', selectedBorder: '#0288D1', iconColor: '#03A9F4' },
        tech_innovation: { primary: '#E0F7FA', secondary: '#00BCD4', text: '#00838F', darkText: '#006064', buttonBackground: '#00ACC1', selectedBorder: '#00838F', iconColor: '#00BCD4' },
        community_outreach: { primary: '#FCE4EC', secondary: '#E91E63', text: '#C2185B', darkText: '#880E4F', buttonBackground: '#D81B60', selectedBorder: '#AD1457', iconColor: '#E91E63' },
        members_value_other: { primary: '#F5F5DC', secondary: '#A1887F', text: '#5D4037', darkText: '#3E2723', buttonBackground: '#8D6E63', selectedBorder: '#4E342E', iconColor: '#795548' },
        creative_arts: { primary: '#FFF3E0', secondary: '#FF9800', text: '#E65100', darkText: '#BF360C', buttonBackground: '#FB8C00', selectedBorder: '#EF6C00', iconColor: '#FF9800' },
        health_wellness: { primary: '#E0F2F7', secondary: '#607D8B', text: '#37474F', darkText: '#263238', buttonBackground: '#78909C', selectedBorder: '#455A64', iconColor: '#607D8B' },
        finance_investment: { primary: '#E6EE9C', secondary: '#AFB42B', text: '#827717', darkText: '#33691E', buttonBackground: '#CDDC39', selectedBorder: '#9E9D24', iconColor: '#AFB42B' },
        environmental_sustainability: { primary: '#E8F5E9', secondary: '#388E3C', text: '#1B5E20', darkText: '#1B5E20', buttonBackground: '#4CAF50', selectedBorder: '#2E7D32', iconColor: '#388E3C' },
        education_development: { primary: '#EDE7F6', secondary: '#673AB7', text: '#4527A0', darkText: '#311B92', buttonBackground: '#7E57C2', selectedBorder: '#5E35B1', iconColor: '#673AB7' },
        social_impact: { primary: '#FFE0B2', secondary: '#FB8C00', text: '#EF6C00', darkText: '#BF360C', buttonBackground: '#FF9800', selectedBorder: '#F57C00', iconColor: '#FB8C00' },
        sports_fitness: { primary: '#FFEBF0', secondary: '#D81B60', text: '#C2185B', darkText: '#880E4F', buttonBackground: '#E91E63', selectedBorder: '#AD1457', iconColor: '#D81B60' },
        travel_adventure: { primary: '#E0F7FA', secondary: '#00ACC1', text: '#00838F', darkText: '#006064', buttonBackground: '#00BCD4', selectedBorder: '#00838F', iconColor: '#00ACC1' },
        culinary_arts: { primary: '#FFFDE7', secondary: '#FFD600', text: '#FFAB00', darkText: '#FF6F00', buttonBackground: '#FFC107', selectedBorder: '#FF8F00', iconColor: '#FFD600' },
        default: { primary: '#ECEFF1', secondary: '#90A4AE', text: '#455A64', darkText: '#263238', buttonBackground: '#90A4AE', selectedBorder: '#78909C', iconColor: '#78909C' }
    };

    const fetchVacantSeats = async (groupId) => {
        try {
            const ticketsResponse = await axios.post(
                `${baseUrl}/enroll/get-next-tickets/${groupId}`
            );
            const fetchedTickets = Array.isArray(
                ticketsResponse.data.availableTickets
            )
                ? ticketsResponse.data.availableTickets
                : [];
            return fetchedTickets.length;
        } catch (err) {
            console.error(`Error fetching tickets for group ${groupId}:`, err);
            return 0;
        }
    };

    const fetchGroups = async () => {
        setIsLoading(true);
        setError(null);
        let endpoint = `${baseUrl}/group/get-group`;

        if (selectedGroup === "NewGroups") {
            endpoint = `${baseUrl}/group/get-group-by-filter/NewGroups`;
        } else if (selectedGroup === "OngoingGroups") {
            endpoint = `${baseUrl}/group/get-group-by-filter/OngoingGroups`;
        } else if (selectedGroup === "All Groups") {
            // No specific filter needed, base endpoint gets all groups
        }

        try {
            const response = await axios.get(endpoint);
            if (response.status === 200) {
                const groups = response.data;
                setCardsData(groups);

                const vacantSeatCounts = {};
                for (const group of groups) {
                    const count = await fetchVacantSeats(group._id);
                    vacantSeatCounts[group._id] = count;
                }
                setVacantSeats(vacantSeatCounts);
                setIsLoading(false);
            } else {
                const errorData = response.data;
                setError(errorData.message || "Failed to load groups. Please try again.");
                setIsLoading(false);
                Alert.alert('Data Load Error', errorData.message || 'Could not fetch groups. Please retry.');
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
            setError("An unexpected error occurred while fetching groups. Please retry.");
            setIsLoading(false);
            Alert.alert('Network Error', 'Could not fetch groups. Please check your internet connection and retry.');
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [selectedGroup]);

    useEffect(() => {
        if (groupFilter) {
            const normalizedGroupFilter = groupFilter === "New Groups" ? "NewGroups" : (groupFilter === "Ongoing Groups" ? "OngoingGroups" : groupFilter);
            if (normalizedGroupFilter !== selectedGroup) {
                setSelectedGroup(normalizedGroupFilter);
            }
        }
    }, [groupFilter]);

    const getGroupType = (card) => {
        const now = new Date();
        const startDate = new Date(card.start_date);
        const endDate = new Date(card.end_date);

        if (startDate > now) {
            return 'new';
        } else if (startDate <= now && endDate > now) {
            return 'ongoing';
        } else if (endDate <= now) {
            return 'ended';
        }
        return 'default';
    };

    const getCustomCardColorKey = (card) => {
        const members = typeof card.group_members === 'number' ? card.group_members : parseInt(card.group_members);
        const value = typeof card.group_value === 'number' ? card.group_value : parseFloat(card.group_value);
        const performanceStatus = card.performance_status;
        const category = card.category;

        if (category === 'tech_innovation') return 'tech_innovation';
        if (category === 'community_outreach') return 'community_outreach';
        if (category === 'creative_arts') return 'creative_arts';
        if (category === 'health_wellness') return 'health_wellness';
        if (category === 'finance_investment') return 'finance_investment';
        if (category === 'environmental_sustainability') return 'environmental_sustainability';
        if (category === 'education_development') return 'education_development';
        if (category === 'social_impact') return 'social_impact';
        if (category === 'sports_fitness') return 'sports_fitness';
        if (category === 'travel_adventure') return 'travel_adventure';
        if (category === 'culinary_arts') return 'culinary_arts';
        if (performanceStatus === 'high') return 'high_performing';
        if (performanceStatus === 'low') return 'low_engagement';
        if (value > 10000) return 'value_very_high';
        if (members >= 1 && members <= 2) return 'very_small_group';
        if (members >= 4 && members <= 10) return 'medium_sized_group';
        if (members > 20) return 'large_members_any_value';
        if (members === 5 && value === 1000) return 'members_5_value_1000';
        if (members === 10 && value === 500) return 'members_10_value_500';
        if (isNaN(members) || isNaN(value)) return 'default';
        return 'members_value_other';
    };

    const getDisplayCards = () => {
        const now = new Date();
        const newGroups = cardsData.filter(card => new Date(card.start_date) > now);
        const ongoingGroups = cardsData.filter(card => {
            const startDate = new Date(card.start_date);
            const endDate = new Date(card.end_date);
            return startDate <= now && endDate > now;
        });
        const endedGroups = cardsData.filter(card => new Date(card.end_date) <= now);

        if (selectedGroup === "All Groups") {
            return {
                new: newGroups,
                ongoing: ongoingGroups,
                ended: endedGroups
            };
        } else if (selectedGroup === "New Groups") {
            return { new: cardsData, ongoing: [], ended: [] };
        } else if (selectedGroup === "Ongoing Groups") {
            return { new: [], ongoing: cardsData, ended: [] };
        }
        return { new: [], ongoing: [], ended: [] };
    };

    const handleEnrollment = (card) => {
        const selectedGroupId = card._id;
        if (selectedGroupId) {
            navigation.navigate("EnrollForm", { groupId: selectedGroupId, user: user });
        } else {
            setModalMessage("Error: Could not retrieve group ID.");
            setEnrollmentModalVisible(true);
        }
    };

    const CardContent = ({ card, colors, isSelected, vacantSeats }) => {
        const formatDate = (dateString) => {
            const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-GB', options);
        };

        const vacantSeatCount = vacantSeats[card._id] !== undefined ? vacantSeats[card._id] : "Loading...";
        const isVacant = vacantSeatCount > 0;

        return (
            <View style={styles.cardContent}>
                <View style={styles.chitValueContainer}>
                    <Text style={[styles.chitValueText, { color: '#263238' }]}>CHIT VALUE:</Text>
                    <Text style={[styles.groupValue, { color: '#da8201' }]}>
                        ₹ {formatNumberIndianStyle(card.group_value)}
                    </Text>
                </View>

                <View style={styles.headerSeparator} />

                <View style={styles.groupNameContainer}>
                    <Text style={[styles.groupName, { color: '#263238' }]}>
                        {card.group_name || 'N/A'}
                    </Text>
                </View>

                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: '#263238' }]}>Starts Date</Text>
                        <Text style={[styles.detailValue, { color: '#263238' }]}>
                            {formatDate(card.start_date)}
                        </Text>
                    </View>
                    <View style={styles.detailItemRight}>
                        <Text style={[styles.detailLabel, { color: '#263238' }]}>Ends Date</Text>
                        <Text style={[styles.detailValue, { color: '#263238' }]}>
                            {formatDate(card.end_date)}
                        </Text>
                    </View>
                </View>
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: '#263238' }]}>Members</Text>
                        <Text style={[styles.detailValue, { color: '#da8201' }]}>
                            {card.group_members}
                        </Text>
                    </View>
                    <View style={styles.detailItemRight}>
                        <Text style={[styles.detailLabel, { color: '#263238' }]}>Vacant Seats</Text>
                        <Text style={[styles.detailValue, { color: '#da8201' }, isVacant ? styles.vacantSeatsHighlight : null]}>
                            {vacantSeatCount}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <LinearGradient
                colors={['#dbf6faff', '#90dafcff']}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
                    <Header userId={userId} navigation={navigation} />
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (error) {
        return (
            <LinearGradient
                colors={['#dbf6faff', '#90dafcff']}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
                    <Header userId={userId} navigation={navigation} />
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={50} color="#DC143C" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primary }}>
            <LinearGradient
                colors={['#dbf6faff', '#90dafcff']}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
                <Header userId={userId} navigation={navigation} />

                <View style={styles.mainContentWrapper}>
                    <View style={styles.innerContentArea}>
                        <View style={styles.filterContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScrollContainer}>
                                <View style={styles.chipsContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            selectedGroup === "All Groups" && styles.selectedChip,
                                        ]}
                                        onPress={() => setSelectedGroup("All Groups")}
                                    >
                                        <Ionicons
                                            name="grid"
                                            size={16}
                                            color={selectedGroup === "All Groups" ? '#fff' : '#666'}
                                            style={styles.chipIcon}
                                        />
                                        <Text style={[styles.chipText, selectedGroup === "All Groups" && styles.selectedChipText]}>All Groups</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            selectedGroup === "New Groups" && styles.selectedChip,
                                        ]}
                                        onPress={() => setSelectedGroup("New Groups")}
                                    >
                                        <Ionicons
                                            name="sparkles"
                                            size={16}
                                            color={selectedGroup === "New Groups" ? '#fff' : '#666'}
                                            style={styles.chipIcon}
                                        />
                                        <Text style={[styles.chipText, selectedGroup === "New Groups" && styles.selectedChipText]}>New Groups</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            selectedGroup === "Ongoing Groups" && styles.selectedChip,
                                        ]}
                                        onPress={() => setSelectedGroup("Ongoing Groups")}
                                    >
                                        <Ionicons
                                            name="hourglass"
                                            size={16}
                                            color={selectedGroup === "Ongoing Groups" ? '#fff' : '#666'}
                                            style={styles.chipIcon}
                                        />
                                        <Text style={[styles.chipText, selectedGroup === "OngoingGroups" && styles.selectedChipText]}>Ongoing Groups</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                        <ScrollView
                            contentContainerStyle={styles.scrollContentContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {(() => {
                                const { new: newGroups, ongoing: ongoingGroups, ended: endedGroups } = getDisplayCards();

                                const renderGroupSection = (data) => (
                                    data.length > 0 && (
                                        <View style={styles.groupSection}>
                                            {data.map((card) => {
                                                const primaryGroupType = getGroupType(card);
                                                const customColorKey = getCustomCardColorKey(card);

                                                const colors = {
                                                    key: customColorKey,
                                                    ...(groupColors[customColorKey] || groupColors[primaryGroupType] || groupColors.default)
                                                };
                                                const isSelected = selectedCardIndex === card._id;

                                                const CardWrapper = ({ children }) => (
                                                    <View
                                                        style={[
                                                            styles.card,
                                                            {
                                                                backgroundColor: colors.primary,
                                                                borderColor: isSelected ? colors.selectedBorder : colors.primary,
                                                                borderWidth: isSelected ? 2 : 1,
                                                            },
                                                        ]}
                                                    >
                                                        {children}
                                                    </View>
                                                );

                                                return (
                                                    <TouchableOpacity
                                                        key={card._id}
                                                        activeOpacity={0.8}
                                                        onPress={() => handleEnrollment(card)}
                                                    >
                                                        <CardWrapper>
                                                            <CardContent
                                                                card={card}
                                                                colors={colors}
                                                                isSelected={isSelected}
                                                                vacantSeats={vacantSeats}
                                                            />
                                                        </CardWrapper>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )
                                );

                                if (selectedGroup === "All Groups") {
                                    const allCardsPresent = newGroups.length > 0 || ongoingGroups.length > 0 || endedGroups.length > 0;
                                    if (!allCardsPresent) {
                                        return (
                                            <View style={styles.emptyStateContainer}>
                                                <Ionicons name="information-circle-outline" size={80} color={COLORS.primary} />
                                                <Text style={styles.noGroupsTitle}>No Groups Available</Text>
                                                <Text style={styles.noGroupsText}>
                                                    It looks like there are no groups that match your current filter.
                                                    Try changing the filter or check back later for new additions!
                                                </Text>
                                            </View>
                                        );
                                    }
                                    return (
                                        <>
                                            {renderGroupSection(newGroups)}
                                            {renderGroupSection(ongoingGroups)}
                                            {renderGroupSection(endedGroups)}
                                        </>
                                    );
                                } else if (selectedGroup === "New Groups") {
                                    if (newGroups.length === 0) {
                                        return (
                                            <View style={styles.emptyStateContainer}>
                                                <Ionicons name="information-circle-outline" size={80} color={COLORS.primary} />
                                                <Text style={styles.noGroupsTitle}>No New Groups</Text>
                                                <Text style={styles.noGroupsText}>
                                                    No new groups found. Check back later for exciting additions!
                                                </Text>
                                            </View>
                                        );
                                    }
                                    return renderGroupSection(newGroups);
                                } else if (selectedGroup === "Ongoing Groups") {
                                    if (ongoingGroups.length === 0) {
                                        return (
                                            <View style={styles.emptyStateContainer}>
                                                <Ionicons name="information-circle-outline" size={80} color={COLORS.primary} />
                                                <Text style={styles.noGroupsTitle}>No Ongoing Groups</Text>
                                                <Text style={styles.noGroupsText}>
                                                    No ongoing groups found. Check back later!
                                                </Text>
                                            </View>
                                        );
                                    }
                                    return renderGroupSection(ongoingGroups);
                                }
                            })()}
                        </ScrollView>
                    </View>
                </View>
                <Modal
                    visible={enrollmentModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setEnrollmentModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {modalMessage || "Please select a group to continue!"}
                            </Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setEnrollmentModalVisible(false)}
                            >
                                <Text style={styles.modalCloseButtonText}>
                                    Got It!
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </LinearGradient>
        </SafeAreaView>
    );
};

// New styles for the header
const headerStyles = StyleSheet.create({
    headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 33,
    borderBottomColor: '#E0E0E0',
},
backButton: {
    padding: 5,
    marginRight: 10,
},
headerImage: {
    width: 150,
    height: 40,
    resizeMode: 'contain',
    marginLeft: 'auto', // Pushes the image to the right
},
});

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingTop: 0,
    },
    gradientOverlay: {
        flex: 1,
    },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
    errorText: { fontSize: 15, color: '#DC143C', textAlign: 'center', marginTop: 10, fontWeight: 'bold' },
    retryButton: { marginTop: 20, backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    mainContentWrapper: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 15
    },
    innerContentArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        marginHorizontal: -15,
        borderRadius: 15,
        paddingTop: 20,
        paddingBottom: 25,
        width: '100%'
    },
    filterContainer: { paddingHorizontal: 15, paddingBottom: 10, },
    chipsScrollContainer: { paddingRight: 30 },
    chipsContainer: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 22, borderRadius: 5, backgroundColor: '#E0EFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 1, minWidth: 100, justifyContent: 'center', borderColor: '#da8201', borderWidth: 1 },
    selectedChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
    chipIcon: { marginRight: 2 },
    chipText: { fontSize: 12, fontWeight: '600', color: '#4A4A4A' },
    selectedChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlignVertical: 'center' },
    scrollContentContainer: { paddingVertical: 10, paddingHorizontal: 0 },
    card: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 15,
        marginVertical: 4,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
        width: '105%',
        borderWidth: 0.5,
        alignSelf: 'center'

    },
    cardContent: {
        flexDirection: 'column',
    },
    chitValueContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    groupNameContainer: {
        flexDirection: 'row',
        justifyContent: 'center', // Center the content horizontally
        alignItems: 'center', // Center the content vertically
        marginBottom: 10,
    },
    groupName: {
        fontSize: 24, // Increased font size for prominence
        fontWeight: 'bold', // Bolder style
        flexShrink: 1,
        textAlign: 'center', // Ensure text is centered
    },
    chitValueText: {
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginRight: 5,
    },
    groupValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSeparator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 10,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailItem: {
        flex: 1,
        alignItems: 'flex-start',
        paddingHorizontal: 5,
    },
    detailItemRight: {
        flex: 1,
        alignItems: 'flex-end',
        paddingHorizontal: 5,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#777',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '700',
    },
    viewMoreContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 5,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 1,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    viewMoreButtonText: {
        fontSize: 16,
        fontWeight: '900',
        marginRight: 5,
    },
    viewMoreIcon: {},
    emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    noGroupsImage: {
        width: 250,
        height: 250,
        marginBottom: 20,
    },
    noGroupsTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    radioButtonContainer: {
        paddingRight: 20,
        marginRight: 15,
    },
    noGroupsText: { fontSize: 16, color: '#777', textAlign: 'center', marginTop: 15, lineHeight: 22 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 25, alignItems: 'center', marginHorizontal: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 7 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    modalCloseButton: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10 },
    modalCloseButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    groupSection: { marginBottom: 25, width: '100%', paddingHorizontal: 15 },
    vacantSeatsHighlight: {
        backgroundColor: '#1de94cff',
        color: '#060806ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        fontWeight: 'bold',
        overflow: 'hidden', // Ensures the background color is contained
    },
});

export default Enrollment;