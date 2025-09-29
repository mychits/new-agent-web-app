// import {
//     View,
//     Text,
//     StyleSheet,
//     KeyboardAvoidingView,
//     Platform,
//     ActivityIndicator,
//     FlatList,
//     TouchableOpacity,
//     StatusBar,
//     Image,
// } from "react-native";
// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { Picker } from '@react-native-picker/picker';
// import { SafeAreaView } from "react-native-safe-area-context";
// import { LinearGradient } from "expo-linear-gradient";
// import DateTimePicker from '@react-native-community/datetimepicker';
// import COLORS from "../constants/color";
// import Header from "../components/Header";
// import { Feather } from '@expo/vector-icons';


// const PRIMARY_COLOR = COLORS.primary || '#3498db';
// const DUE_COLOR = '#e74c3c';
// const SECONDARY_COLOR = '#2c3e50';
// const INFO_COLOR = '#95a5a6';

// const BACKGROUND_GRADIENT = ["#dbf6faff", "#90dafcff"];
// const API_URL = "https://mychits.online/api/group/get-group";
// const AGENT_COLLECTION_API = "https://mychits.online/api/enroll/due/routes/agent/";

// const NO_REPORTS_IMAGE = require('../assets/NoReports.png');



// const formatDate = (date) => {
//     return date ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}` : 'DD/MM/YYYY';
// };


// const GroupDueItem = React.memo(({ item }) => {
//     const dueDateText = formatDate(item.next_due_date_string ? new Date(item.next_due_date_string) : null);

//     const groupName = item.group_name || 'N/A Group Name';

//     const formatCurrency = (amount) => {
//         if (amount === undefined || amount === null) return '₹ N/A';
//         const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
//         return `₹ ${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//     };

//     const totalPayableAmount = formatCurrency(item.total_payable_amount);
//     const totalToBePaid = formatCurrency(item.total_to_be_paid);
//     const balance = formatCurrency(item.Balance);

//     const DUE_SOON_DAYS = 7;
//     const isUrgentDue = item.next_due_date_string && (new Date(item.next_due_date_string) <= new Date(Date.now() + (1 * 86400000)));
//     const isDueSoon = item.next_due_date_string && (new Date(item.next_due_date_string) <= new Date(Date.now() + (DUE_SOON_DAYS * 86400000)));
//     const dueColor = isUrgentDue ? DUE_COLOR : (isDueSoon ? '#f39c12' : SECONDARY_COLOR);

//     return (
//         <View style={styles.groupItem}>

//             <View style={styles.itemHeader_vertical}>
//                 <Text style={styles.groupText_title_vertical}>
//                     {groupName}
//                 </Text>
//             </View>

//             <View style={styles.itemFinancials_vertical}>

//                 <View style={styles.financialRow}>
//                     <Text style={styles.financialLabel_vertical}>Total Payable Amount</Text>
//                     <Text style={styles.financialAmount_Primary_vertical}>{totalPayableAmount}</Text>
//                 </View>

//                 <View style={styles.financialSeparator} />

//                 <View style={styles.financialRow}>
//                     <Text style={styles.financialLabel_vertical}>Total to be Paid</Text>
//                     <Text style={styles.financialAmount_Primary_vertical}>{totalToBePaid}</Text>
//                 </View>

//                 <View style={styles.financialSeparator} />

//                 <View style={styles.financialRow}>
//                     <Text style={styles.financialLabel_vertical_balance}>Outstanding Balance</Text>
//                     <Text style={styles.financialAmount_Outstanding_vertical}>{balance}</Text>
//                 </View>
//             </View>

//             <View style={[styles.dateInfo_simple, {
//                 borderColor: dueColor,
//                 backgroundColor: isUrgentDue ? 'rgba(231, 76, 60, 0.05)' : 'rgba(52, 152, 219, 0.05)',
//             }]}>
//                 <Feather
//                     name="calendar"
//                     size={18}
//                     color={dueColor}
//                 />
//                 <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.dateLabel_simple}>Next Due Date:</Text>
//                     <Text style={[styles.dateText_simple, { color: dueColor }]}>
//                         {dueDateText}
//                     </Text>
//                 </View>
//             </View>
//         </View>
//     );
// });


// /**
//  * ListHeader Component (Used for FlatListHeaderComponent to ensure scrollability)
//  */
// const ListHeader = ({ reportDetails, renderGroupDropdown, renderDatePickers, filteredGroupsCount }) => (
//     <View style={styles.listHeaderContainer}>
//         <Header />
//         <View style={styles.titleContainer}>
//             <Text style={styles.title}>{reportDetails.title}</Text>
//             <Text style={styles.subtitle}>{reportDetails.subtitle}</Text>
//         </View>

//         <View style={styles.filterSection}>
//             {renderGroupDropdown()}
//             <View style={styles.filterSeparator} />
//             {renderDatePickers()}
//         </View>

//         <Text style={styles.listSectionTitle}>
//             {`${filteredGroupsCount} Pending Due Reports`}
//         </Text>
//     </View>
// );

// const OutstandingReports = ({ route }) => {
//     const { user } = route.params
//     console.log(user, "preetha's user")


//     const getReportDetails = () => {
//         return {
//             title: "Collection Due Report",
//             subtitle: "View pending amounts for all assigned collection groups."
//         };
//     };

//     const reportDetails = useMemo(() => getReportDetails(), []);

//     const [groups, setGroups] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [selectedGroupValue, setSelectedGroupValue] = useState('all');
//     const [fromDate, setFromDate] = useState(null);
//     const [toDate, setToDate] = useState(() => {
//         const futureDate = new Date();
//         futureDate.setFullYear(futureDate.getFullYear() + 10);
//         return futureDate;
//     });
//     const [showDatePicker, setShowDatePicker] = useState({ visible: false, mode: 'date', type: '' });

//     // --- Data Fetching Effect ---
//     const fetchGroups = useCallback(async () => {
//         setLoading(true);
//         setError(null);
//         let allData = [];

//         try {
//             // 1. Fetch from Original Group API
//             const groupResponse = await fetch(API_URL);
//             if (!groupResponse.ok) throw new Error(`Group API error! status: ${groupResponse.status}`);
//             const groupJson = await groupResponse.json();

//             let fetchedGroupData = [];
//             if (groupJson.data && Array.isArray(groupJson.data)) {
//                 fetchedGroupData = groupJson.data;
//             } else if (Array.isArray(groupJson)) {
//                 fetchedGroupData = groupJson;
//             }
//             allData = [...allData, ...fetchedGroupData];

//             // 2. Fetch from Agent Collection API (Uses the static agent_id)
//             try {
//                 console.log(user, "user id iser")
//                 const collectionResponse = await fetch(`${AGENT_COLLECTION_API}${user?.userId}`);
//                 if (!collectionResponse.ok) console.error(`Collection API error! status: ${collectionResponse.status}`);
//                 else {
//                     const collectionJson = await collectionResponse.json();
//                     let fetchedCollectionData = [];
//                     if (collectionJson.data && Array.isArray(collectionJson.data)) {
//                         fetchedCollectionData = collectionJson.data;
//                     } else if (Array.isArray(collectionJson)) {
//                         fetchedCollectionData = collectionJson;
//                     }
//                     allData = [...allData, ...fetchedCollectionData];
//                 }
//             } catch (e) {
//                 console.error("Error fetching Collection API:", e);
//             }

//             // 3. Process and Set State with MOCK FINANCIAL DATA
//             const finalData = allData.map((item, index) => {
//                 const baseDate = new Date();
//                 const dateOffsets = [0, 1, 30, -5, 7, 14, 45, 60, -10];
//                 const dateOffset = dateOffsets[index % dateOffsets.length] * 86400000;
//                 baseDate.setTime(Date.now() + dateOffset);

//                 // --- Mock Financial Data based on index ---
//                 const baseAmount = 50000 + (index * 10000);
//                 const mockTotalToBePaid = 4500 + (index * 500);
//                 const mockBalance = mockTotalToBePaid * (1 + (index % 3) * 0.5);

//                 return {
//                     ...item,
//                     next_due_date_string: item.next_due_date_string || baseDate.toISOString(),
//                     id: item.id || `mock-${index}-${Math.random() * 1000}`,
//                     group_name: item.group_name || `Group Alpha ${index + 1}`,

//                     // Fields required in the component display
//                     total_payable_amount: item.total_payable_amount || Math.round(baseAmount / 100) * 100,
//                     total_to_be_paid: item.total_to_be_paid || Math.round(mockTotalToBePaid / 10) * 10,
//                     Balance: item.Balance || Math.round(mockBalance / 10) * 10,
//                 };
//             });

//             setGroups(finalData);
//             setSelectedGroupValue('all');

//         } catch (e) {
//             console.error("Error fetching data:", e);
//             setError(e.message);
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         const timer = setTimeout(fetchGroups, 500);
//         return () => clearTimeout(timer);
//     }, [fetchGroups]);


//     const handleDateChange = useCallback((event, selectedDate) => {
//         setShowDatePicker({ visible: false, mode: 'date', type: '' });

//         if (event.type === 'set' && selectedDate) {
//             const dateToSet = new Date(selectedDate);

//             if (showDatePicker.type === 'from') {
//                 if (toDate && dateToSet > toDate) {
//                     setFromDate(toDate);
//                     setToDate(dateToSet);
//                 } else {
//                     setFromDate(dateToSet);
//                 }
//             } else if (showDatePicker.type === 'to') {
//                 if (fromDate && dateToSet < fromDate) {
//                     setToDate(fromDate);
//                     setFromDate(dateToSet);
//                 } else {
//                     setToDate(dateToSet);
//                 }
//             }
//         }
//     }, [fromDate, toDate, showDatePicker.type]);

//     const showPicker = useCallback((type) => {
//         setShowDatePicker({ visible: true, mode: 'date', type: type });
//     }, []);


//     const filteredGroups = useMemo(() => {
//         let filtered = groups;
//         // 1. Group Filter
//         if (selectedGroupValue !== 'all' && selectedGroupValue) {
//             filtered = filtered.filter(group => group.id && group.id.toString() === selectedGroupValue);
//         }

//         // 2. Date Range Filter
//         if (fromDate || toDate) {
//             filtered = filtered.filter(group => {
//                 const due_date_string = group.next_due_date_string;
//                 if (!due_date_string) return false;

//                 const due_date = new Date(due_date_string);
//                 const startOfFromDate = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0) : null;
//                 const endOfToDate = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999) : null;

//                 const isAfterFrom = startOfFromDate ? due_date >= startOfFromDate : true;
//                 const isBeforeTo = endOfToDate ? due_date <= endOfToDate : true;

//                 return isAfterFrom && isBeforeTo;
//             });
//         }

//         return filtered;
//     }, [groups, selectedGroupValue, fromDate, toDate]);


//     const renderGroupDropdown = () => {
//         const availableGroups = groups.map(group => ({
//             id: group.id ? group.id.toString() : group.group_name,
//             name: group.group_name || `Group ID: ${group.id || 'N/A'}`
//         })).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

//         if (!availableGroups.length && selectedGroupValue !== 'all') return null;

//         return (
//             <View style={styles.dropdownContainer}>
//                 <Text style={styles.filterLabel}>Group Filter</Text>
//                 <View style={styles.pickerWrapper}>
//                     <Picker
//                         selectedValue={selectedGroupValue.toString()}
//                         onValueChange={(itemValue) => setSelectedGroupValue(itemValue)}
//                         style={styles.pickerStyle}
//                         mode="dropdown"
//                     >
//                         <Picker.Item label="All Groups" value="all" style={styles.pickerItemText} />
//                         {availableGroups.map((group) => (
//                             <Picker.Item
//                                 key={group.id}
//                                 label={group.name}
//                                 value={group.id}
//                                 style={styles.pickerItemText}
//                             />
//                         ))}
//                     </Picker>
//                     <Feather name="chevron-down" size={20} color="#7f8c8d" style={styles.dropdownIcon} />
//                 </View>
//             </View>
//         );
//     };

//     const renderDatePickers = () => (
//         <View style={styles.dateFilterContainer}>
//             <Text style={styles.filterLabel}>Due Date Range</Text>
//             <View style={styles.datePickersRow}>
//                 <View style={styles.datePickerInput}>
//                     <Text style={styles.dateInputLabel}>From</Text>
//                     <TouchableOpacity onPress={() => showPicker('from')} style={styles.dateButton}>
//                         <Feather name="calendar" size={16} color={PRIMARY_COLOR} />
//                         <Text style={styles.dateButtonText}>{formatDate(fromDate)}</Text>
//                     </TouchableOpacity>
//                 </View>

//                 <View style={[styles.datePickerInput, { marginLeft: 10 }]}>
//                     <Text style={styles.dateInputLabel}>To</Text>
//                     <TouchableOpacity onPress={() => showPicker('to')} style={styles.dateButton}>
//                         <Feather name="calendar" size={16} color={PRIMARY_COLOR} />
//                         <Text style={styles.dateButtonText}>{formatDate(toDate)}</Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>

//             {showDatePicker.visible && (
//                 <DateTimePicker
//                     value={showDatePicker.type === 'from' ? (fromDate || new Date()) : (toDate || new Date())}
//                     mode={showDatePicker.mode}
//                     display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                     onChange={handleDateChange}
//                 />
//             )}
//         </View>
//     );


//     const MainContent = () => (
//         <KeyboardAvoidingView
//             style={styles.mainContentContainer}
//             behavior={Platform.OS === "ios" ? "padding" : "height"}
//         >
//             {error ? (
//                 <View style={styles.errorContainer}>
//                     <Feather name="alert-triangle" size={30} color={COLORS.white} />
//                     <Text style={styles.errorText_title}>Data Error</Text>
//                     <Text style={styles.errorText_subtitle}>Could not load data: {error}</Text>
//                     <TouchableOpacity
//                         style={styles.retryButton}
//                         onPress={fetchGroups}
//                     >
//                         <Text style={styles.retryButtonText}>Try Again</Text>
//                     </TouchableOpacity>
//                 </View>
//             ) : (
//                 <FlatList
//                     data={filteredGroups}
//                     style={styles.flatList}
//                     contentContainerStyle={styles.flatListContent}
//                     keyExtractor={(item) => item.id.toString()}

//                     // Uses ListHeaderComponent to make the filter section scrollable with the list
//                     ListHeaderComponent={
//                         <ListHeader
//                             reportDetails={reportDetails}
//                             renderGroupDropdown={renderGroupDropdown}
//                             renderDatePickers={renderDatePickers}
//                             filteredGroupsCount={filteredGroups.length}
//                         />
//                     }

//                     ListEmptyComponent={() => (
//                         <View style={styles.emptyContainer}>
//                             <Image
//                                 source={NO_REPORTS_IMAGE}
//                                 style={styles.emptyImage}
//                                 resizeMode="contain"
//                             />
//                             <Text style={styles.emptyText}>
//                                 No Due Reports Found
//                             </Text>
//                             <Text style={styles.emptyText_sub}>Great job! All payments seem to be cleared for the selected filters.</Text>
//                         </View>
//                     )}
//                     renderItem={({ item }) => <GroupDueItem item={item} />}
//                     showsVerticalScrollIndicator={false}
//                 />
//             )}
//         </KeyboardAvoidingView>
//     );

//     const FullScreenLoading = () => (
//         <View style={styles.fullScreenLoading}>
//             <ActivityIndicator size="large" color={PRIMARY_COLOR} />
//         </View>
//     );

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_GRADIENT[0] }}>
//             <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_GRADIENT[0]} />
//             <LinearGradient
//                 colors={BACKGROUND_GRADIENT}
//                 style={styles.gradientOverlay}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 1 }}
//             >
//                 {loading ? <FullScreenLoading /> : <MainContent />}
//             </LinearGradient>
//         </SafeAreaView>
//     );
// };

// // --- STYLESHEET ---
// const styles = StyleSheet.create({
//     gradientOverlay: { flex: 1 },
//     fullScreenLoading: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(255, 255, 255, 0.9)',
//         alignItems: 'center',
//         justifyContent: 'center',
//         zIndex: 10,
//     },
//     mainContentContainer: {
//         flex: 1,
//         paddingHorizontal: 22,
//         paddingTop: Platform.OS === 'ios' ? 0 : 12,
//     },
//     listHeaderContainer: {
//         backgroundColor: 'transparent',
//     },
//     flatList: {
//         flex: 1,
//     },
//     flatListContent: {
//         paddingBottom: 80,
//     },
//     titleContainer: {
//         marginTop: 15,
//         marginBottom: 25,
//         alignItems: 'center',
//         paddingLeft: 0,
//     },
//     title: {
//         fontSize: 26,
//         fontWeight: '900',
//         color: SECONDARY_COLOR,
//     },
//     subtitle: {
//         fontSize: 16,
//         color: '#7f8c8d',
//         marginTop: 5,
//         fontWeight: '500',
//         textAlign: 'center',
//     },
//     filterSection: {
//         backgroundColor: COLORS.white,
//         padding: 20,
//         borderRadius: 18,
//         marginBottom: 25,
//         shadowColor: "rgba(0,0,0,0.2)",
//         shadowOffset: { width: 0, height: 8 },
//         shadowOpacity: 0.1,
//         shadowRadius: 15,
//         elevation: 8,
//     },
//     filterLabel: {
//         fontSize: 14,
//         fontWeight: '700',
//         color: PRIMARY_COLOR,
//         marginBottom: 10,
//         textTransform: 'uppercase',
//         letterSpacing: 1,
//     },
//     filterSeparator: {
//         height: 1,
//         backgroundColor: 'rgba(0,0,0,0.08)',
//         marginVertical: 10,
//     },
//     dropdownContainer: {},
//     pickerWrapper: {
//         borderWidth: 2,
//         borderColor: '#e1e5e8',
//         borderRadius: 12,
//         backgroundColor: '#f9f9f9',
//         overflow: 'hidden',
//         justifyContent: 'center',
//     },
//     pickerStyle: {
//         height: Platform.OS === 'ios' ? 150 : 55,
//         width: '100%',
//         color: '#333',
//     },
//     dropdownIcon: {
//         position: 'absolute',
//         right: 15,
//         pointerEvents: 'none',
//         top: Platform.OS === 'ios' ? undefined : 16,
//     },
//     pickerItemText: { fontSize: 15 },
//     dateFilterContainer: {},
//     datePickersRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//     },
//     datePickerInput: { flex: 1 },
//     dateInputLabel: {
//         fontSize: 14,
//         fontWeight: '700',
//         color: '#7f8c8d',
//         marginBottom: 8,
//     },
//     dateButton: {
//         backgroundColor: COLORS.white,
//         paddingVertical: 15,
//         paddingHorizontal: 15,
//         borderRadius: 12,
//         borderWidth: 1,
//         borderColor: '#e1e5e8',
//         flexDirection: 'row',
//         alignItems: 'center',
//         shadowColor: "rgba(0,0,0,0.05)",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     dateButtonText: {
//         color: '#333',
//         fontSize: 12,
//         marginLeft: 10,
//         fontWeight: '700',
//     },
//     listSectionTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#34495e',
//         marginBottom: 18,
//         marginTop: 5,
//         textAlign: 'center',
//     },
//     groupItem: {
//         padding: 22,
//         backgroundColor: COLORS.white,
//         borderRadius: 15,
//         marginBottom: 18,
//         shadowColor: "rgba(0,0,0,0.15)",
//         shadowOffset: { width: 0, height: 5 },
//         shadowOpacity: 0.15,
//         shadowRadius: 10,
//         elevation: 8,
//     },
//     itemHeader_vertical: {
//         marginBottom: 15,
//     },
//     groupText_title_vertical: {
//         fontSize: 20,
//         fontWeight: '900',
//         color: SECONDARY_COLOR,
//     },
//     itemFinancials_vertical: {
//         backgroundColor: '#f8f9fa',
//         borderRadius: 12,
//         padding: 15,
//         marginBottom: 15,
//         borderWidth: 1,
//         borderColor: '#ecf0f1',
//     },
//     financialRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingVertical: 8,
//     },
//     financialSeparator: {
//         height: 1,
//         backgroundColor: '#e1e5e8',
//         marginVertical: 4,
//     },
//     financialLabel_vertical: {
//         fontSize: 14,
//         color: INFO_COLOR,
//         fontWeight: '600',
//     },
//     financialLabel_vertical_balance: {
//         fontSize: 15,
//         color: SECONDARY_COLOR,
//         fontWeight: '700',
//     },
//     financialAmount_Primary_vertical: {
//         fontSize: 16,
//         fontWeight: '700',
//         color: PRIMARY_COLOR,
//     },
//     financialAmount_Outstanding_vertical: {
//         fontSize: 18,
//         fontWeight: '900',
//         color: DUE_COLOR,
//     },
//     dateInfo_simple: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 12,
//         borderRadius: 10,
//         borderWidth: 1,
//     },
//     dateLabel_simple: {
//         fontSize: 12,
//         color: '#555',
//         fontWeight: '700',
//     },
//     dateText_simple: {
//         fontSize: 15,
//         fontWeight: '800',
//         marginTop: 2,
//     },
//     errorContainer: {
//         backgroundColor: DUE_COLOR,
//         padding: 25,
//         borderRadius: 15,
//         marginTop: 50,
//         alignItems: 'center',
//         marginHorizontal: 0,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 5 },
//         shadowOpacity: 0.4,
//         shadowRadius: 6,
//         elevation: 10,
//     },
//     errorText_title: {
//         fontSize: 22,
//         fontWeight: 'bold',
//         color: COLORS.white,
//         marginTop: 10,
//     },
//     errorText_subtitle: {
//         fontSize: 15,
//         color: '#fefefe',
//         textAlign: 'center',
//         marginTop: 5,
//         marginBottom: 15,
//     },
//     retryButton: {
//         marginTop: 15,
//         backgroundColor: COLORS.white,
//         paddingVertical: 10,
//         paddingHorizontal: 20,
//         borderRadius: 8,
//     },
//     retryButtonText: {
//         color: DUE_COLOR,
//         fontWeight: 'bold',
//         fontSize: 16,
//     },
//     emptyContainer: {
//         padding: 40,
//         borderRadius: 15,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginTop: 20,
//     },
//     emptyImage: {
//         width: 200,
//         height: 150,
//         marginBottom: -10,
//     },
//     emptyText: {
//         fontSize: 18,
//         color: '#555',
//         textAlign: 'center',
//         marginTop: 15,
//         fontWeight: '700',
//     },
//     emptyText_sub: {
//         fontSize: 15,
//         color: '#999',
//         textAlign: 'center',
//         marginTop: 5,
//     }
// });

// export default OutstandingReports;





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
import { Feather } from '@expo/vector-icons';

const PRIMARY_COLOR = COLORS.primary || '#3498db';
const DUE_COLOR = '#e74c3c';
const SECONDARY_COLOR = '#2c3e50';
const INFO_COLOR = '#95a5a6';

const BACKGROUND_GRADIENT = ["#dbf6faff", "#90dafcff"];
const API_URL = "https://mychits.online/api/group/get-group";
const AGENT_COLLECTION_API = "https://mychits.online/api/enroll/due/routes/agent/";

const NO_REPORTS_IMAGE = require('../assets/NoReports.png');

/* ------------------ Helpers ------------------ */
const formatDate = (date) =>
    date
        ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}/${date.getFullYear()}`
        : 'DD/MM/YYYY';

const formatCurrency = (amount) => {
    const num = Number(
        typeof amount === 'string'
            ? amount.replace(/[^0-9.-]+/g, '')
            : amount
    );
    if (isNaN(num)) return '₹ 0.00';
    return `₹ ${num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

/* ------------------ Item Component ------------------ */
const GroupDueItem = React.memo(({ item }) => {
    const dueDateText = formatDate(
        item.next_due_date_string ? new Date(item.next_due_date_string) : null
    );
    const groupName = item.group_name || 'N/A Group Name';

    const totalPayableAmount = formatCurrency(item.total_payable_amount);
    const totalToBePaid = formatCurrency(item.total_to_be_paid);
    const balance = formatCurrency(item.balance); // <-- fixed key

    const DUE_SOON_DAYS = 7;
    const isUrgentDue =
        item.next_due_date_string &&
        new Date(item.next_due_date_string) <=
            new Date(Date.now() + 1 * 86400000);
    const isDueSoon =
        item.next_due_date_string &&
        new Date(item.next_due_date_string) <=
            new Date(Date.now() + DUE_SOON_DAYS * 86400000);
    const dueColor = isUrgentDue
        ? DUE_COLOR
        : isDueSoon
        ? '#f39c12'
        : SECONDARY_COLOR;

    return (
        <View style={styles.groupItem}>
            <View style={styles.itemHeader_vertical}>
                <Text style={styles.groupText_title_vertical}>{groupName}</Text>
            </View>

            <View style={styles.itemFinancials_vertical}>
                <View style={styles.financialRow}>
                    <Text style={styles.financialLabel_vertical}>
                        Total Payable Amount
                    </Text>
                    <Text style={styles.financialAmount_Primary_vertical}>
                        {totalPayableAmount}
                    </Text>
                </View>

                <View style={styles.financialSeparator} />

                <View style={styles.financialRow}>
                    <Text style={styles.financialLabel_vertical}>
                        Total to be Paid
                    </Text>
                    <Text style={styles.financialAmount_Primary_vertical}>
                        {totalToBePaid}
                    </Text>
                </View>

                <View style={styles.financialSeparator} />

                <View style={styles.financialRow}>
                    <Text style={styles.financialLabel_vertical_balance}>
                        Outstanding Balance
                    </Text>
                    <Text style={styles.financialAmount_Outstanding_vertical}>
                        {balance}
                    </Text>
                </View>
            </View>

            <View
                style={[
                    styles.dateInfo_simple,
                    {
                        borderColor: dueColor,
                        backgroundColor: isUrgentDue
                            ? 'rgba(231, 76, 60, 0.05)'
                            : 'rgba(52, 152, 219, 0.05)',
                    },
                ]}
            >
                <Feather name="calendar" size={18} color={dueColor} />
                <View style={{ marginLeft: 10 }}>
                    <Text style={styles.dateLabel_simple}>Next Due Date:</Text>
                    <Text
                        style={[styles.dateText_simple, { color: dueColor }]}
                    >
                        {dueDateText}
                    </Text>
                </View>
            </View>
        </View>
    );
});

/* ------------------ Header Component ------------------ */
const ListHeader = ({
    reportDetails,
    renderGroupDropdown,
    renderDatePickers,
    filteredGroupsCount,
}) => (
    <View style={styles.listHeaderContainer}>
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
            {`${filteredGroupsCount} Pending Due Reports`}
        </Text>
    </View>
);

/* ------------------ Main Screen ------------------ */
const OutstandingReports = ({ route }) => {
    const { user } = route.params;

    const reportDetails = useMemo(
        () => ({
            title: 'Collection Due Report',
            subtitle:
                'View pending amounts for all assigned collection groups.',
        }),
        []
    );

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedGroupValue, setSelectedGroupValue] = useState('all');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(() => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 10);
        return futureDate;
    });
    const [showDatePicker, setShowDatePicker] = useState({
        visible: false,
        mode: 'date',
        type: '',
    });

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        setError(null);
        let allData = [];

        try {
            const groupResponse = await fetch(API_URL);
            if (!groupResponse.ok)
                throw new Error(`Group API error! status: ${groupResponse.status}`);
            const groupJson = await groupResponse.json();

            let fetchedGroupData = [];
            if (groupJson.data && Array.isArray(groupJson.data)) {
                fetchedGroupData = groupJson.data;
            } else if (Array.isArray(groupJson)) {
                fetchedGroupData = groupJson;
            }
            allData = [...allData, ...fetchedGroupData];

            try {
                const collectionResponse = await fetch(
                    `${AGENT_COLLECTION_API}${user?.userId}`
                );
                console.log(collectionResponse, "gjsgjsgjgfggf");
                if (!collectionResponse.ok)
                    console.error(
                        `Collection API error! status: ${collectionResponse.status}`
                    );
                else {
                    const collectionJson = await collectionResponse.json();
                    let fetchedCollectionData = [];
                    if (
                        collectionJson.data &&
                        Array.isArray(collectionJson.data)
                    ) {
                        fetchedCollectionData = collectionJson.data;
                    } else if (Array.isArray(collectionJson)) {
                        fetchedCollectionData = collectionJson;
                    }
                    allData = [...allData, ...fetchedCollectionData];
                }
            } catch (e) {
                console.error('Error fetching Collection API:', e);
            }

            // ---------- Flatten API fields ----------
            const finalData = allData.map((item, index) => {
                const extractFirst = (val) => {
                    if (!val) return 0;
                    if (Array.isArray(val)) {
                        if (typeof val[0] === 'number') return val[0];
                        if (
                            typeof val[0] === 'object' &&
                            val[0] &&
                            'total' in val[0]
                        )
                            return Number(val[0].total);
                    }
                    return Number(val) || 0;
                };
                console.log(finalData, "yffgsdfgsdjvgg");

                const totalPayable = extractFirst(item.total_payable_amount);
                const totalToBePaid = Number(item.total_to_be_paid) || 0;
                const balance = Number(item.balance ?? 0);

                const baseDate = new Date();
                baseDate.setTime(Date.now() + index * 86400000);

                return {
                    ...item,
                    next_due_date_string:
                        item.next_due_date_string || baseDate.toISOString(),
                    id: item._id || `mock-${index}`,
                    group_name:
                        item.group_id?.group_name ||
                        item.group_name ||
                        `Group ${index + 1}`,
                    total_payable_amount: totalPayable,
                    total_to_be_paid: totalToBePaid,
                    balance: balance,
                };
            });

            setGroups(finalData);
            setSelectedGroupValue('all');
        } catch (e) {
            console.error('Error fetching data:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(fetchGroups, 500);
        return () => clearTimeout(timer);
    }, [fetchGroups]);

    const handleDateChange = useCallback(
        (event, selectedDate) => {
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
        },
        [fromDate, toDate, showDatePicker.type]
    );

    const showPicker = useCallback((type) => {
        setShowDatePicker({ visible: true, mode: 'date', type });
    }, []);

    const filteredGroups = useMemo(() => {
        let filtered = groups;
        if (selectedGroupValue !== 'all' && selectedGroupValue) {
            filtered = filtered.filter(
                (group) => group.id && group.id.toString() === selectedGroupValue
            );
        }

        if (fromDate || toDate) {
            filtered = filtered.filter((group) => {
                const due_date_string = group.next_due_date_string;
                if (!due_date_string) return false;

                const due_date = new Date(due_date_string);
                const startOfFromDate = fromDate
                    ? new Date(
                          fromDate.getFullYear(),
                          fromDate.getMonth(),
                          fromDate.getDate(),
                          0,
                          0,
                          0,
                          0
                      )
                    : null;
                const endOfToDate = toDate
                    ? new Date(
                          toDate.getFullYear(),
                          toDate.getMonth(),
                          toDate.getDate(),
                          23,
                          59,
                          59,
                          999
                      )
                    : null;

                const isAfterFrom = startOfFromDate
                    ? due_date >= startOfFromDate
                    : true;
                const isBeforeTo = endOfToDate ? due_date <= endOfToDate : true;

                return isAfterFrom && isBeforeTo;
            });
        }

        return filtered;
    }, [groups, selectedGroupValue, fromDate, toDate]);

    const renderGroupDropdown = () => {
        const availableGroups = groups
            .map((group) => ({
                id: group.id ? group.id.toString() : group.group_name,
                name:
                    group.group_name ||
                    `Group ID: ${group.id || 'N/A'}`,
            }))
            .filter(
                (v, i, a) => a.findIndex((t) => t.id === v.id) === i
            );

        if (!availableGroups.length && selectedGroupValue !== 'all')
            return null;

        return (
            <View style={styles.dropdownContainer}>
                <Text style={styles.filterLabel}>Group Filter</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={selectedGroupValue.toString()}
                        onValueChange={(itemValue) =>
                            setSelectedGroupValue(itemValue)
                        }
                        style={styles.pickerStyle}
                        mode="dropdown"
                    >
                        <Picker.Item
                            label="All Groups"
                            value="all"
                            style={styles.pickerItemText}
                        />
                        {availableGroups.map((group) => (
                            <Picker.Item
                                key={group.id}
                                label={group.name}
                                value={group.id}
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
                    <TouchableOpacity
                        onPress={() => showPicker('from')}
                        style={styles.dateButton}
                    >
                        <Feather name="calendar" size={16} color={PRIMARY_COLOR} />
                        <Text style={styles.dateButtonText}>
                            {formatDate(fromDate)}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.datePickerInput, { marginLeft: 10 }]}>
                    <Text style={styles.dateInputLabel}>To</Text>
                    <TouchableOpacity
                        onPress={() => showPicker('to')}
                        style={styles.dateButton}
                    >
                        <Feather name="calendar" size={16} color={PRIMARY_COLOR} />
                        <Text style={styles.dateButtonText}>
                            {formatDate(toDate)}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {showDatePicker.visible && (
                <DateTimePicker
                    value={
                        showDatePicker.type === 'from'
                            ? fromDate || new Date()
                            : toDate || new Date()
                    }
                    mode={showDatePicker.mode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
        </View>
    );

    const MainContent = () => (
        <KeyboardAvoidingView
            style={styles.mainContentContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {error ? (
                <View style={styles.errorContainer}>
                    <Feather name="alert-triangle" size={30} color={COLORS.white} />
                    <Text style={styles.errorText_title}>Data Error</Text>
                    <Text style={styles.errorText_subtitle}>
                        Could not load data: {error}
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredGroups}
                    style={styles.flatList}
                    contentContainerStyle={styles.flatListContent}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={
                        <ListHeader
                            reportDetails={reportDetails}
                            renderGroupDropdown={renderGroupDropdown}
                            renderDatePickers={renderDatePickers}
                            filteredGroupsCount={filteredGroups.length}
                        />
                    }
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
                            <Text style={styles.emptyText_sub}>
                                Great job! All payments seem to be cleared for the selected
                                filters.
                            </Text>
                        </View>
                    )}
                    renderItem={({ item }) => <GroupDueItem item={item} />}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </KeyboardAvoidingView>
    );

    const FullScreenLoading = () => (
        <View style={styles.fullScreenLoading}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_GRADIENT[0] }}>
            <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_GRADIENT[0]} />
            <LinearGradient
                colors={BACKGROUND_GRADIENT}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {loading ? <FullScreenLoading /> : <MainContent />}
            </LinearGradient>
        </SafeAreaView>
    );
};

/* ------------------ Styles ------------------ */

const styles = StyleSheet.create({
    gradientOverlay: { flex: 1 },
    fullScreenLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    mainContentContainer: {
        flex: 1,
        paddingHorizontal: 22,
        paddingTop: Platform.OS === 'ios' ? 0 : 12,
    },
    listHeaderContainer: {
        backgroundColor: 'transparent',
    },
    flatList: {
        flex: 1,
    },
    flatListContent: {
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
        color: SECONDARY_COLOR,
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
    dropdownContainer: {},
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
    pickerItemText: { fontSize: 15 },
    dateFilterContainer: {},
    datePickersRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    datePickerInput: { flex: 1 },
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
        shadowColor: "rgba(0,0,0,0.15)",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    itemHeader_vertical: {
        marginBottom: 15,
    },
    groupText_title_vertical: {
        fontSize: 20,
        fontWeight: '900',
        color: SECONDARY_COLOR,
    },
    itemFinancials_vertical: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ecf0f1',
    },
    financialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    financialSeparator: {
        height: 1,
        backgroundColor: '#e1e5e8',
        marginVertical: 4,
    },
    financialLabel_vertical: {
        fontSize: 14,
        color: INFO_COLOR,
        fontWeight: '600',
    },
    financialLabel_vertical_balance: {
        fontSize: 15,
        color: SECONDARY_COLOR,
        fontWeight: '700',
    },
    financialAmount_Primary_vertical: {
        fontSize: 16,
        fontWeight: '700',
        color: PRIMARY_COLOR,
    },
    financialAmount_Outstanding_vertical: {
        fontSize: 18,
        fontWeight: '900',
        color: DUE_COLOR,
    },
    dateInfo_simple: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    dateLabel_simple: {
        fontSize: 12,
        color: '#555',
        fontWeight: '700',
    },
    dateText_simple: {
        fontSize: 15,
        fontWeight: '800',
        marginTop: 2,
    },
    errorContainer: {
        backgroundColor: DUE_COLOR,
        padding: 25,
        borderRadius: 15,
        marginTop: 50,
        alignItems: 'center',
        marginHorizontal: 0,
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

export default OutstandingReports;