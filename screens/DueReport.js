import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Image,
} from "react-native";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Picker } from '@react-native-picker/picker'; 
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from '@react-native-community/datetimepicker';
import COLORS from "../constants/color"; 
import Header from "../components/Header"; 
import { Feather, MaterialIcons } from '@expo/vector-icons'; 

// --- Constants (Updated Gradient and Colors) ---
const PRIMARY_COLOR = COLORS.primary || '#3498db'; // Primary Blue
const ACCENT_COLOR = '#2ecc71'; 
const DUE_COLOR = '#e74c3c'; 

// New Gradient for a softer top background look
const BACKGROUND_GRADIENT = ["#dbf6faff", "#90dafcff"]; 
const API_URL = "https://mychits.online/api/group/get-group";

// IMAGE ASSET IMPORTED WITH RELATIVE PATH
const NO_REPORTS_IMAGE = require('../assets/NoReports.png');
// --------------------------------------------------

const formatDate = (date) => {
    return date ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}` : 'DD/MM/YYYY';
};


// GroupDueItem component remains unchanged
const GroupDueItem = React.memo(({ item }) => {
    const dueDateText = formatDate(item.next_due_date_string ? new Date(item.next_due_date_string) : null);
    
    const DUE_SOON_DAYS = 7;
    const isDueSoon = item.next_due_date_string && (new Date(item.next_due_date_string) <= new Date(Date.now() + (DUE_SOON_DAYS * 86400000))); 
    const isUrgentDue = item.next_due_date_string && (new Date(item.next_due_date_string) <= new Date(Date.now() + (1 * 86400000))); 

    const itemBorderColor = isUrgentDue ? DUE_COLOR : (isDueSoon ? '#f39c12' : PRIMARY_COLOR);

    return (
        <View style={[styles.groupItem, { borderLeftColor: itemBorderColor }]}>
            <View style={styles.itemHeader}>
                <Text style={styles.groupText_title}>
                    {item.group_name || `Group ID: ${item.id || 'N/A'}`}
                </Text>
                <View style={[styles.statusBadge, { 
                    backgroundColor: item.status === 'Active' ? ACCENT_COLOR : '#95a5a6' 
                }]}>
                    <Text style={styles.statusText}>{item.status || 'Active'}</Text>
                </View>
            </View>

            <View style={styles.itemDetails}>
                <View style={styles.detailPill}>
                    <Feather name="tag" size={14} color="#7f8c8d" />
                    <Text style={styles.groupText_detail}>ID: {item.id || 'N/A'}</Text>
                </View>
                <View style={styles.detailPill}>
                    <Feather name="users" size={14} color="#7f8c8d" />
                    <Text style={styles.groupText_detail}>Members: {item.members_count || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.itemFooter}>
                <View style={styles.dueInfo}>
                    <Text style={styles.dueLabel}>Outstanding Amount</Text>
                    <Text style={styles.dueAmount}>₹ 4,500.00</Text> 
                </View>
                <View style={[styles.dateInfo, { 
                    backgroundColor: isUrgentDue ? 'rgba(231, 76, 60, 0.1)' : (isDueSoon ? 'rgba(243, 156, 18, 0.1)' : 'rgba(52, 152, 219, 0.1)'),
                    borderColor: itemBorderColor
                }]}>
                    <Feather 
                        name="calendar" 
                        size={18} 
                        color={itemBorderColor} 
                    />
                    <View style={{marginLeft: 10}}>
                        <Text style={styles.dateLabel_bold}>Next Due Date:</Text>
                        <Text style={[styles.dateText_bold, { 
                            color: itemBorderColor
                        }]}>
                            {dueDateText}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
});


const DueReport = ({ route }) => {
    const { user = {}, reportType = 'group' } = route.params || {};
    
    const getReportDetails = (type) => {
        switch (type) {
            case 'collection':
                return {
                    title: "Collection Report",
                    subtitle: "Manage and review all outstanding payments for collection."
                };
            case 'referred':
                return {
                    title: "Referred Report",
                    subtitle: "Track the outstanding payments from your referred customers."
                };
            case 'group':
            default:
                return {
                    title: "Group Report",
                    subtitle: "Track and manage all outstanding reports for each group."
                };
        }
    };
    
    const reportDetails = useMemo(() => getReportDetails(reportType), [reportType]);

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedGroupValue, setSelectedGroupValue] = useState('all'); 
    const [fromDate, setFromDate] = useState(null); 
    const [toDate, setToDate] = useState(new Date()); 
    const [showDatePicker, setShowDatePicker] = useState({ visible: false, mode: 'date', type: '' });

    // --- Data Fetching Effect (Kept unchanged) ---
    const fetchGroups = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const json = await response.json();
            
            let fetchedData = [];
            if (json.data && Array.isArray(json.data)) {
                
                // --- MOCK DATA INJECTION FOR DEMO ---
                fetchedData = json.data.map((item, index) => {
                    const baseDate = new Date();
                    const dateOffsets = [0, 1, 30, -5, 7]; 
                    const dateOffset = dateOffsets[index % 5] * 86400000; 
                    baseDate.setTime(Date.now() + dateOffset);

                    return {
                        ...item,
                        next_due_date_string: baseDate.toISOString(),
                        members_count: item.members_count || (index + 5), 
                    };
                });
                // --- END MOCK DATA INJECTION ---
                
            } else if (Array.isArray(json)) { 
                fetchedData = json;
            } else {
                throw new Error("Invalid data format received from API");
            }
            
            setGroups(fetchedData);
            setSelectedGroupValue('all');

        } catch (e) {
            console.error("Error fetching groups:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchGroups, 500); 
        return () => clearTimeout(timer);
    }, [fetchGroups]);


    const handleDateChange = useCallback((event, selectedDate) => {
        setShowDatePicker({ visible: false, mode: 'date', type: '' });
        
        if (event.type === 'set' && selectedDate) {
            const dateToSet = new Date(selectedDate);
            
            if (showDatePicker.type === 'from') {
                if (toDate && dateToSet > toDate) {
                    setFromDate(toDate); 
                    setToDate(dateToSet); 
                } else {
                    setFromDate(dateToSet);
                }
            } else if (showDatePicker.type === 'to') {
                if (fromDate && dateToSet < fromDate) {
                    setToDate(fromDate); 
                    setFromDate(dateToSet); 
                } else {
                    setToDate(dateToSet);
                }
            }
        }
    }, [fromDate, toDate, showDatePicker.type]);

    const showPicker = useCallback((type) => {
        setShowDatePicker({ visible: true, mode: 'date', type: type });
    }, []);

    
    const filteredGroups = useMemo(() => {
        let filtered = groups;
        // 1. Group Filter
        if (selectedGroupValue !== 'all' && selectedGroupValue) {
            filtered = filtered.filter(group => group.id && group.id.toString() === selectedGroupValue);
        }

        // 2. Date Range Filter
        if (fromDate || toDate) {
            filtered = filtered.filter(group => {
                const due_date_string = group.next_due_date_string; 
                if (!due_date_string) return false; 

                const due_date = new Date(due_date_string);
                const startOfFromDate = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0) : null;
                const endOfToDate = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999) : null; 

                const isAfterFrom = startOfFromDate ? due_date >= startOfFromDate : true;
                const isBeforeTo = endOfToDate ? due_date <= endOfToDate : true;

                return isAfterFrom && isBeforeTo;
            });
        }
        
        return filtered;
    }, [groups, selectedGroupValue, fromDate, toDate]);

    // --- Render Functions for Filters (Remains Unchanged) ---
    const renderGroupDropdown = () => {
        // Only show picker if data is available (not loading or error)
        if (!groups.length && !selectedGroupValue) return null; 

        return (
            <View style={styles.dropdownContainer}>
                <Text style={styles.filterLabel}>Group Filter</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={selectedGroupValue.toString()}
                        onValueChange={(itemValue) => setSelectedGroupValue(itemValue)}
                        style={styles.pickerStyle}
                        mode="dropdown"
                    >
                        <Picker.Item label="All Groups" value="all" style={styles.pickerItemText} />
                        {groups.map((group) => (
                            <Picker.Item
                                key={group.id ? group.id.toString() : group.group_name}
                                label={group.group_name || `Group ID: ${group.id || 'N/A'}`}
                                value={group.id ? group.id.toString() : group.group_name}
                                style={styles.pickerItemText}
                            />
                        ))}
                    </Picker>
                    <Feather 
                        name="chevron-down" 
                        size={20} 
                        color="#7f8c8d" 
                        style={styles.dropdownIcon}
                    />
                </View>
            </View>
        );
    };

    const renderDatePickers = () => (
        <View style={styles.dateFilterContainer}>
            <Text style={styles.filterLabel}>Due Date Range</Text>
            <View style={styles.datePickersRow}>
                <View style={styles.datePickerInput}>
                    <Text style={styles.dateInputLabel}>From</Text>
                    <TouchableOpacity onPress={() => showPicker('from')} style={styles.dateButton}>
                        <Feather name="calendar" size={16} color={PRIMARY_COLOR} />
                        <Text style={styles.dateButtonText}>{formatDate(fromDate)}</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.datePickerInput, { marginLeft: 10 }]}>
                    <Text style={styles.dateInputLabel}>To</Text>
                    <TouchableOpacity onPress={() => showPicker('to')} style={styles.dateButton}>
                        <Feather name="calendar" size={16} color={PRIMARY_COLOR} />
                        <Text style={styles.dateButtonText}>{formatDate(toDate)}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            {showDatePicker.visible && (
                <DateTimePicker
                    value={showDatePicker.type === 'from' ? (fromDate || new Date()) : (toDate || new Date())}
                    mode={showDatePicker.mode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
        </View>
    );

    
    // --- MAIN CONTENT RENDERED AFTER LOADING ---
    const MainContent = () => (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Top Fixed Header */}
            <View style={styles.staticHeaderContainer}>
                <Header /> 
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{reportDetails.title}</Text>
                    <Text style={styles.subtitle}>{reportDetails.subtitle}</Text>
                </View>
                
                <View style={styles.filterSection}>
                    {renderGroupDropdown()}
                    <View style={styles.filterSeparator} />
                    {renderDatePickers()}
                </View>

                <Text style={styles.listSectionTitle}>
                    {`${filteredGroups.length} Pending Due Reports`}
                </Text>
            </View>
            
            {/* Scrolling List Content */}
            <View style={styles.listContainer}>
                {error ? (
                    <View style={styles.errorContainer}>
                        <Feather name="alert-triangle" size={30} color={COLORS.white} />
                        <Text style={styles.errorText_title}>Data Error</Text>
                        <Text style={styles.errorText_subtitle}>Could not load data: {error}</Text>
                        <TouchableOpacity 
                            style={styles.retryButton} 
                            onPress={fetchGroups}
                        >
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredGroups}
                        style={styles.flatList}
                        contentContainerStyle={styles.flatListContent} 
                        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                        ListEmptyComponent={() => ( 
                            <View style={styles.emptyContainer}>
                                    <Image 
                                        source={NO_REPORTS_IMAGE} 
                                        style={styles.emptyImage} 
                                        resizeMode="contain" 
                                    />
                                <Text style={styles.emptyText}>
                                        No Due Reports Found
                                    </Text>
                                <Text style={styles.emptyText_sub}>Great job! All payments seem to be cleared for the selected filters.</Text>
                            </View>
                        )}
                        renderItem={({ item }) => <GroupDueItem item={item} />}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </KeyboardAvoidingView>
    );

    // --- FULL SCREEN LOADING OVERLAY COMPONENT ---
    const FullScreenLoading = () => (
        <View style={styles.fullScreenLoading}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
     
        </View>
    );

    // --- MAIN RETURN: Conditional Rendering for Full Page Load ---
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_GRADIENT[0] }}>
            <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_GRADIENT[0]} />
            <LinearGradient
                colors={BACKGROUND_GRADIENT}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* *** THIS IS THE KEY CHANGE ***
                  If loading is true, only show the FullScreenLoading overlay.
                  Otherwise, render the MainContent with headers, filters, and list.
                */}
                {loading ? <FullScreenLoading /> : <MainContent />}
            </LinearGradient>
        </SafeAreaView>
    );
};

// --- STYLESHEET (Added fullScreenLoading and loadingText styles) ---
const styles = StyleSheet.create({
    
    gradientOverlay: {
        flex: 1,
    },
    // NEW STYLE: Full Screen Loading Overlay
    fullScreenLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white to show gradient slightly
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: PRIMARY_COLOR,
        fontWeight: '700',
    },
    // Existing styles (mostly unchanged)
    staticHeaderContainer: {
        backgroundColor: 'transparent',
        paddingHorizontal: 22, 
        paddingTop: Platform.OS === 'ios' ? 0 : 12, 
    },
    listContainer: {
        flex: 1,
    },
    flatList: {
        flex: 1,
    },
    flatListContent: {
        paddingHorizontal: 22,
        paddingBottom: 80,
    },
    titleContainer: {
        marginTop: 15,
        marginBottom: 25,
        alignItems: 'center', 
        paddingLeft: 0, 
    },
    title: {
        fontSize: 26, 
        fontWeight: '900',
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        marginTop: 5,
        fontWeight: '500',
        textAlign: 'center',
    },
    filterSection: {
        backgroundColor: COLORS.white,
        padding: 20, 
        borderRadius: 18, 
        marginBottom: 25,
        shadowColor: "rgba(0,0,0,0.2)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: PRIMARY_COLOR, 
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    filterSeparator: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.08)', 
        marginVertical: 10, 
    },
    dropdownContainer: {
        
    },
    pickerWrapper: {
        borderWidth: 2, 
        borderColor: '#e1e5e8', 
        borderRadius: 12,
        backgroundColor: '#f9f9f9', 
        overflow: 'hidden',
        justifyContent: 'center',
    },
    pickerStyle: {
        height: Platform.OS === 'ios' ? 150 : 55, 
        width: '100%',
        color: '#333',
    },
    dropdownIcon: {
        position: 'absolute',
        right: 15,
        pointerEvents: 'none',
        top: Platform.OS === 'ios' ? undefined : 16,
    },
    pickerItemText: {
        fontSize: 15,
    },
    dateFilterContainer: {
        
    },
    datePickersRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    datePickerInput: {
        flex: 1,
    },
    dateInputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#7f8c8d',
        marginBottom: 8,
    },
    dateButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 15, 
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e5e8',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "rgba(0,0,0,0.05)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    dateButtonText: {
        color: '#333',
        fontSize: 12,
        marginLeft: 10,
        fontWeight: '700',
    },
   listSectionTitle: {
     fontSize: 18, 
     fontWeight: 'bold',
     color: '#34495e',
     marginBottom: 18, 
     marginTop: 5,
     textAlign: 'center', 
    },
    groupItem: {
        padding: 22, 
        backgroundColor: COLORS.white,
        borderRadius: 15, 
        marginBottom: 18,
        borderLeftWidth: 8, 
        shadowColor: "rgba(0,0,0,0.15)", 
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    groupText_title: {
        fontSize: 20, 
        fontWeight: '800', 
        color: '#2c3e50',
        flexShrink: 1,
    },
    statusBadge: {
        paddingHorizontal: 12, 
        paddingVertical: 6,
        borderRadius: 20, 
        minWidth: 80,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 13, 
        fontWeight: 'bold',
        color: COLORS.white,
        textTransform: 'uppercase',
    },
    itemDetails: {
        flexDirection: 'row',
        marginBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1', 
        paddingBottom: 12,
    },
    detailPill: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 25, 
        backgroundColor: '#f4f6f8', 
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    groupText_detail: {
        fontSize: 14,
        color: '#7f8c8d',
        marginLeft: 5,
        fontWeight: '600',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dueInfo: {
        alignItems: 'flex-start',
    },
    dueLabel: {
        fontSize: 14, 
        color: '#7f8c8d',
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dueAmount: {
        fontSize: 24, 
        fontWeight: '900',
        color: DUE_COLOR, 
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 2, 
    },
    dateLabel_bold: {
        fontSize: 13,
        color: '#555',
        fontWeight: '700',
    },
    dateText_bold: {
        fontSize: 16, 
        fontWeight: '800',
        marginTop: 2,
    },
    errorContainer: {
        backgroundColor: DUE_COLOR,
        padding: 25,
        borderRadius: 15,
        marginTop: 50,
        alignItems: 'center',
        marginHorizontal: 22,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 10,
    },
    errorText_title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
        marginTop: 10,
    },
    errorText_subtitle: {
        fontSize: 15,
        color: '#fefefe',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 15,
    },
    retryButton: {
        marginTop: 15,
        backgroundColor: COLORS.white,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: DUE_COLOR,
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyContainer: {
        padding: 40, 
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    emptyImage: {
        width: 200, 
        height: 150,
        marginBottom: -10,
    },
    emptyText: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginTop: 15,
        fontWeight: '700',
    },
    emptyText_sub: {
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
    }
});

export default DueReport;