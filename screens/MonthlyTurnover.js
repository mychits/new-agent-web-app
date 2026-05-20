// import React, { useState, useEffect, useRef, memo } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   FlatList,
//   TouchableOpacity,
//   Platform,
//   UIManager,
//   Linking,
//   Animated,
//   StatusBar,
//   ImageBackground,
//   Dimensions,
//   TextInput,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { LinearGradient } from "expo-linear-gradient";
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import moment from "moment";
// import { FontAwesome5, Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import baseUrl from "../constants/baseUrl";

// const backgroundImage = require("../assets/hero1.jpg");

// const { width } = Dimensions.get("window");

// // --- COLORS ---
// const COLORS = {
//   primary: "#183A5D",
//   accent: "#f8c009ff",
//   bgBlue: "#1aa2ccff",
//   success: "#27AE60",
//   cardBg: "rgba(255, 255, 255, 0.98)",
//   white: "#FFFFFF",
//   muted: "#8898AA",
//   background: "#0f2a44",
//   box1: "#E0E7FF",
//   box1Text: "#4338ca",
//   box2: "#D1FAE5",
//   box2Text: "#059669",
//   box3: "#FEF3C7",
//   box3Text: "#D97706",
//   box4: "#E0F2FE",
//   box4Text: "#0284c7",
//   box5: "#FFE4E6",
//   box5Text: "#e11d48",
// };

// if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// const FadeInView = ({ children, delay = 0 }) => {
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   useEffect(() => {
//     Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
//   }, []);
//   return <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>;
// };

// // --- HELPER FOR LINKING ---
// const handleAction = (type, value) => {
//   if (!value) return;

//   let url = "";
//   if (type === "call") {
//     url = `tel:${value}`;
//   } else if (type === "whatsapp") {
//     const cleanPhone = value.replace(/[^0-9]/g, "");
//     url = `whatsapp://send?phone=${cleanPhone}`;
//   } else if (type === "email") {
//     url = `mailto:${value}`;
//   }

//   Linking.canOpenURL(url)
//     .then((supported) => {
//       if (!supported) {
//         Alert.alert("Error", `Unable to handle ${type}: ${value}`);
//       } else {
//         return Linking.openURL(url);
//       }
//     })
//     .catch((err) => console.error("An error occurred", err));
// };

// const formatCurrency = (amount) => {
//   if (amount === undefined || amount === null) return "0";
//   const num = typeof amount === "number" ? amount : parseFloat(amount);
//   if (isNaN(num)) return "0";
//   return num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
// };

// // --- EXTRACTED HEADER COMPONENT ---
// const TurnoverHeader = memo(({ 
//   selectedDate, formattedDate, setShowPicker, 
//   searchQuery, setSearchQuery, turnoverData 
// }) => {
//   return (
//     <FadeInView>
//       <TouchableOpacity style={styles.dateCard} onPress={() => setShowPicker(true)} activeOpacity={0.9}>
//         <View style={styles.dateInfo}>
//           <View style={styles.calendarIconBg}>
//             <Ionicons name="calendar" size={18} color={COLORS.white} />
//           </View>
//           <View>
//             <Text style={styles.dateLabel}>SELECTED PERIOD</Text>
//             <Text style={styles.dateText}>{formattedDate}</Text>
//           </View>
//         </View>
//         <View style={styles.editIconBg}>
//            <Feather name="edit-3" size={14} color={COLORS.primary} />
//         </View>
//       </TouchableOpacity>

//       <View style={styles.searchBarContainer}>
//         <Feather name="search" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search name, phone, ticket or group..."
//           placeholderTextColor={COLORS.muted}
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           autoCapitalize="none"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//             <Feather name="x" size={18} color={COLORS.muted} />
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.mainCard}>
//         <View style={styles.cardHeader}>
//           <Text style={styles.cardLabel}>Monthly Summary</Text>
//           <View style={[styles.statusBadge, { backgroundColor: 'rgba(39, 174, 96, 0.15)' }]}>
//             <Text style={styles.statusText}>Active</Text>
//           </View>
//         </View>

//         <View style={styles.heroStatsRow}>
//           <View style={styles.heroStatBox}>
//              <Text style={styles.heroStatLabel}>EXPECTED</Text>
//              <Text style={styles.heroStatValue}>₹{formatCurrency(turnoverData?.expectedTurnover)}</Text>
//           </View>
//           <View style={styles.heroStatDivider} />
//           <View style={styles.heroStatBox}>
//              <Text style={styles.heroStatLabel}>COLLECTED</Text>
//              <Text style={[styles.heroStatValue, { color: COLORS.success }]}>₹{formatCurrency(turnoverData?.totalTurnover)}</Text>
//           </View>
//         </View>
//       </View>
//     </FadeInView>
//   );
// });

// const MonthlyTurnover = ({ navigation }) => {
//   const [turnoverData, setTurnoverData]   = useState(null);
//   const [customersData, setCustomersData] = useState([]);
//   const [loading, setLoading]             = useState(true);
//   const [error, setError]                 = useState(null);
//   const [selectedDate, setSelectedDate]   = useState(new Date());
//   const [showPicker, setShowPicker]       = useState(false);
//   const [formattedDate, setFormattedDate] = useState(moment().format("MMMM YYYY"));
  
//   const [searchQuery, setSearchQuery]     = useState("");

//   useEffect(() => {
//     fetchMonthlyData();
//   }, [selectedDate]);

//   const fetchMonthlyData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const userJson = await AsyncStorage.getItem("user");
//       if (!userJson) { setError("Session expired."); setLoading(false); return; }
//       const user    = JSON.parse(userJson);
//       const agentId = user?.userId;
//       if (!agentId) { setError("No agentId found."); setLoading(false); return; }

//       const year  = moment(selectedDate).year();
//       // const month = moment(selectedDate).month() + 1;
//       const month = moment(selectedDate).month();
//       const apiUrl =
//         baseUrl + "/user/agent-monthly-turnover-by-id/" + agentId +
//         "?year=" + year + "&month=" + month;

//       const response = await axios.get(apiUrl);

//       if (response.data?.success) {
//         const payingCustomers = response.data.agentData?.payingCustomers || [];
//         setTurnoverData(response.data.agentData);

//         const customersWithStatus = payingCustomers.map((c) => {
//           const monthlyPaid        = parseFloat(c.monthlyPaid       || 0);
//           const totalPaid          = parseFloat(c.totalPaid         || 0);
//           const monthlyInstallment = parseFloat(c.monthly_installment || 0);
//           const balance            = parseFloat(c.balance           || 0);
//           const differenceAmount   = monthlyInstallment - monthlyPaid;

//           let lastPaymentDate = "N/A";
//           if (c.payments && c.payments.length > 0) {
//             const latestDate = c.payments
//               .map((p) => p.pay_date)
//               .filter(Boolean)
//               .sort((a, b) => new Date(b) - new Date(a))[0];
//             if (latestDate) lastPaymentDate = moment(latestDate).format("DD MMM");
//           }

//           return {
//             ...c,
//             enrollmentId:  c._id,
//             ticketNumber:  c.ticket || "N/A", 
//             balance:       balance,
//             paymentStatus: monthlyPaid >= monthlyInstallment ? "PAID" : "UNPAID",
//             lastPaymentDate,
//             monthlyPaid,
//             totalPaid,
//             differenceAmount,
//           };
//         });

//         setCustomersData(customersWithStatus);
        
//       } else {
//         setError(response.data?.message || "Failed to fetch data");
//       }
//     } catch (err) {
//       console.error("TURNOVER_ERROR => " + err.message);
//       setError("Error fetching agent details.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredCustomers = customersData.filter((item) => {
//     if (!searchQuery) return true;
//     const query = searchQuery.toLowerCase();
//     const name  = (item.user_id?.full_name || "").toLowerCase();
//     const phone = (item.user_id?.phone_number || "").toLowerCase();
//     const group = (item.group_id?.group_name || "").toLowerCase();
//     const ticket = (item.ticketNumber || "").toString().toLowerCase();
    
//     return name.includes(query) || phone.includes(query) || group.includes(query) || ticket.includes(query);
//   });

//   // const onDateChange = (_event, newDate) => {
//   //   setShowPicker(false);
//   //   if (newDate) {
//   //     const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
//   //     setSelectedDate(firstDay);
//   //     setFormattedDate(moment(firstDay).format("MMMM YYYY"));
//   //   }
//   // };

//   const onDateChange = (event, pickedDate) => {
//   // Handle dismiss for Android
//   if (Platform.OS !== "ios" && event?.type === "dismissed") {
//     setShowPicker(false);
//     return;
//   }

//   // For iOS and when date is selected
//   if (Platform.OS === "ios") {
//     setShowPicker(false);
//   }

//   const currentDate = pickedDate || selectedDate;

//   // Set to the first day of the selected month
//   const firstDayOfMonth = new Date(
//     currentDate.getFullYear(),
//     currentDate.getMonth(),
//     1
//   );

//   setSelectedDate(firstDayOfMonth);
//   setFormattedDate(moment(firstDayOfMonth).format("MMMM YYYY"));
  
//   // Close picker for Android after selection
//   if (Platform.OS !== "ios") {
//     setShowPicker(false);
//   }
// };

// // For month-only picker on iOS, use mode="date" with custom display
// // Alternatively, use this for a cleaner month picker experience:
// const renderDatePicker = () => {
//   if (Platform.OS === "ios") {
//     return (
//       showPicker && (
//         <DateTimePicker
//           value={selectedDate}
//           mode="date"
//           display="spinner"
//           onChange={onDateChange}
//           maximumDate={new Date()} // Optional: prevent future months
//         />
//       )
//     );
//   } else if (Platform.OS === "android") {
//     return (
//       showPicker && (
//         <DateTimePicker
//           value={selectedDate}
//           mode="date"
//           display="calendar"
//           onChange={onDateChange}
//           maximumDate={new Date()} // Optional: prevent future months
//         />
//       )
//     );
//   }
//   return null;
// };

//   const renderNormalLoader = () => (
//     <View style={styles.loaderContainer}>
//       <ActivityIndicator size="large" color={COLORS.accent} />
//       <Text style={styles.loadingText}>Loading collection data...</Text>
//     </View>
//   );

//   const renderCustomerCard = ({ item, index }) => {
//     const isPaid        = item.paymentStatus === "PAID";
//     const statusColor   = isPaid ? COLORS.success : COLORS.box5Text;
//     const statusBg      = isPaid ? "rgba(39, 174, 96, 0.15)" : "rgba(225, 29, 72, 0.1)";
    
//     const customerPhone = item.user_id?.phone_number;
//     const customerEmail = item.user_id?.email;
//     const customerName  = item.user_id?.full_name || "Unknown";
//     const groupName     = item.group_id?.group_name || "Group";
//     const ticketNum     = item.ticketNumber;
//     const balanceVal    = item.balance || 0;
//     const diffVal       = item.differenceAmount || 0;

//     const isNegativeBalance = balanceVal < 0;
//     const balanceBoxBg = isNegativeBalance ? COLORS.box2 : COLORS.box5;
//     const balanceBoxText = isNegativeBalance ? COLORS.box2Text : COLORS.box5Text;
//     const displayBalance = Math.abs(balanceVal);

//     return (
//       <FadeInView delay={index * 30}>
//         <View style={styles.listCard}>
//           {/* Header: Avatar + Info */}
//           <View style={styles.listHeader}>
//             <View style={styles.avatar}>
//               <Text style={styles.avatarText}>{customerName.charAt(0).toUpperCase()}</Text>
//             </View>
//             <View style={{ flex: 1, marginLeft: 12 }}>
//               <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
//                 <Text style={styles.clientName} numberOfLines={1}>{customerName}</Text>
//                 <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
//                    <Text style={[styles.statusText, { color: statusColor }]}>{item.paymentStatus}</Text>
//                 </View>
//               </View>
              
//               <View style={styles.metaRow}>
//                 <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
//                   <Text style={styles.ticketText} numberOfLines={1}>{groupName}</Text>
//                   <Text style={styles.ticketText}> • </Text>
//                   <Text style={[styles.ticketText, { color: COLORS.bgBlue, fontWeight: '700' }]}>Ticket #{ticketNum}</Text>
//                 </View>
//               </View>
//             </View>
//           </View>

//           {/* ACTION ICONS ROW */}
//           <View style={styles.contactActionsRow}>
//             <TouchableOpacity 
//                 style={styles.actionButton} 
//                 onPress={() => handleAction("call", customerPhone)}
//                 activeOpacity={0.7}
//             >
//               <Ionicons name="call" size={16} color="#10B981" />
//             </TouchableOpacity>

//             <TouchableOpacity 
//                 style={styles.actionButton} 
//                 onPress={() => handleAction("whatsapp", customerPhone)}
//                 activeOpacity={0.7}
//             >
//               <FontAwesome5 name="whatsapp" size={18} color="#25D366" />
//             </TouchableOpacity>

//             {customerEmail ? (
//                 <TouchableOpacity 
//                     style={styles.actionButton} 
//                     onPress={() => handleAction("email", customerEmail)}
//                     activeOpacity={0.7}
//                 >
//                   <Ionicons name="mail" size={16} color={COLORS.bgBlue} />
//                 </TouchableOpacity>
//             ) : null}
//           </View>

//           {/* 5 DIFFERENT BOXES GRID */}
//           <View style={styles.statsGrid}>
//             <View style={[styles.gridBox, { backgroundColor: COLORS.box1 }]}>
//               <MaterialCommunityIcons name="calendar-clock" size={14} color={COLORS.box1Text} />
//               <Text style={[styles.gridVal, { color: COLORS.box1Text }]}>{formatCurrency(item.monthly_installment)}</Text>
//               <Text style={styles.gridLabel}>Installment</Text>
//             </View>

//             <View style={[styles.gridBox, { backgroundColor: COLORS.box2 }]}>
//               <Ionicons name="wallet" size={14} color={COLORS.box2Text} />
//               <Text style={[styles.gridVal, { color: COLORS.box2Text }]}>{formatCurrency(item.monthlyPaid)}</Text>
//               <Text style={styles.gridLabel}>Paid</Text>
//             </View>

//             <View style={[styles.gridBox, { backgroundColor: COLORS.box3 }]}>
//               <Ionicons name="calculator" size={14} color={COLORS.box3Text} />
//               <Text style={[styles.gridVal, { color: COLORS.box3Text, fontWeight: '900' }]}>{formatCurrency(diffVal)}</Text>
//               <Text style={styles.gridLabel}>Diff</Text>
//             </View>

//             <View style={[styles.gridBox, { backgroundColor: COLORS.box4, width: '48%' }]}>
//               <FontAwesome5 name="hand-holding-usd" size={14} color={COLORS.box4Text} />
//               <Text style={[styles.gridVal, { color: COLORS.box4Text }]}>{formatCurrency(item.totalPaid)}</Text>
//               <Text style={styles.gridLabel}>Total Paid</Text>
//             </View>

//             <View style={[styles.gridBox, { backgroundColor: balanceBoxBg, width: '48%' }]}>
//               <MaterialCommunityIcons name="scale-balance" size={14} color={balanceBoxText} />
//               <Text style={[styles.gridVal, { color: balanceBoxText }]}>{formatCurrency(displayBalance)}</Text>
//               <Text style={styles.gridLabel}>Balance</Text>
//             </View>
//           </View>
//         </View>
//       </FadeInView>
//     );
//   };

//   return (
//     <View style={styles.mainContainer}>
//       <StatusBar barStyle="light-content" />
//       <ImageBackground source={backgroundImage} style={styles.bgOverlay} blurRadius={12} />
//       <LinearGradient colors={["rgba(26, 162, 204, 0.9)", COLORS.primary]} style={StyleSheet.absoluteFill} />

//       <SafeAreaView style={{ flex: 1 }}>
//         <View style={styles.header}>
//           <View style={styles.headerTopRow}>
//             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle} activeOpacity={0.7}>
//               <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={fetchMonthlyData} style={styles.refreshBtn} activeOpacity={0.7}>
//               <Feather name="refresh-cw" size={20} color={COLORS.primary} />
//             </TouchableOpacity>
//           </View>
//           <Text style={styles.headerTitle}>Monthly Turnover</Text>
//           <Text style={styles.headerSubTitle}>Track your monthly collection</Text>
//         </View>

//         <View style={styles.contentContainer}>
//           {loading ? (
//             renderNormalLoader()
//           ) : error ? (
//             <View style={styles.errorBox}>
//               <Text style={styles.errorText}>{error}</Text>
//               <TouchableOpacity style={styles.retryBtn} onPress={fetchMonthlyData}>
//                 <Text style={styles.retryText}>Retry</Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <FlatList
//               data={filteredCustomers}
//               renderItem={renderCustomerCard}
//               keyExtractor={(_, i) => i.toString()}
//               ListHeaderComponent={
//                 <TurnoverHeader 
//                   selectedDate={selectedDate}
//                   formattedDate={formattedDate}
//                   setShowPicker={setShowPicker}
//                   searchQuery={searchQuery}
//                   setSearchQuery={setSearchQuery}
//                   turnoverData={turnoverData}
//                 />
//               }
//               contentContainerStyle={styles.listContent}
//               showsVerticalScrollIndicator={false}
//               keyboardShouldPersistTaps="handled"
//               ListEmptyComponent={() => (
//                 <View style={styles.emptyContainer}>
//                    <MaterialCommunityIcons name="database-off-outline" size={48} color="rgba(255,255,255,0.3)" />
//                    <Text style={styles.noDataText}>
//                      {searchQuery ? "No matching customers found." : "No customers found for this period."}
//                    </Text>
//                 </View>
//               )}
//             />
//           )}
//         </View>
//       </SafeAreaView>
//       {/* Date Picker - Works for both platforms */}
// {Platform.OS === "web" ? (
//   showPicker && (
//     <View style={styles.webDatePickerContainer}>
//       <input
//         type="month"
//         value={moment(selectedDate).format("YYYY-MM")}
//         onChange={(e) => {
//           const value = e.target.value;
//           if (value) {
//             const [year, month] = value.split("-");
//             const newDate = new Date(Number(year), Number(month) - 1, 1);
//             setSelectedDate(newDate);
//             setFormattedDate(moment(newDate).format("MMMM YYYY"));
//           }
//           setShowPicker(false);
//         }}
//         style={styles.webDateInput}
//         autoFocus
//       />
//     </View>
//   )
// ) : (
//   showPicker && (
//     <DateTimePicker
//       value={selectedDate}
//       mode="date"
//       display={Platform.OS === "ios" ? "spinner" : "default"}
//       onChange={onDateChange}
//       maximumDate={new Date()}
//     />
//   )
// )}
//       {/* {showPicker && (
//         <DateTimePicker
//           value={selectedDate}
//           mode="date"
//           display={Platform.OS === "ios" ? "spinner" : "calendar"}
//           onChange={onDateChange}
//         />
//       )} */}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   mainContainer: { flex: 1, backgroundColor: COLORS.primary },
//   bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
  
//   header: { 
//     paddingHorizontal: 20, 
//     paddingTop: Platform.OS === "android" ? 20 : 20,
//     paddingBottom: 10,
//   },
//   headerTopRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     width: "100%",
//     marginBottom: 15
//   },
//   webDatePickerContainer: {
//   position: "absolute",
//   top: 120,
//   alignSelf: "center",
//   paddingTop:3,
//   marginTop:'30px',
//   padding: 10,
//   borderRadius: 15,
//   zIndex: 999,
//   elevation: 10,
  
//   paddingLeft:'850px',
// },
// webDateInput: {
//   borderRadius: 12,
//   borderWidth: 1,
//   borderColor: "#ccc",
//   fontSize: 16,
//   fontFamily: Platform.OS === "web" ? "system-ui" : undefined,
//   width: 200,
//   backgroundColor:'grey',
// },
//   headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", textAlign: 'center', marginTop: 1 }, // Decreased
//   headerSubTitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 }, // Decreased
//   iconCircle: { backgroundColor: "#fff", padding: 8, borderRadius: 12, elevation: 4 },
//   refreshBtn: { backgroundColor: COLORS.accent, padding: 10, borderRadius: 12, elevation: 4 },
  
//   contentContainer: { paddingHorizontal: 16, flex: 1 },
//   listContent: { paddingBottom: 40 },

//   loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   loadingText: { color: COLORS.white, marginTop: 10, fontWeight: '600', opacity: 0.8 },

//   dateCard: { 
//     backgroundColor: COLORS.white, 
//     borderRadius: 16, 
//     padding: 12, // Decreased slightly
//     marginBottom: 16, 
//     flexDirection: "row", 
//     alignItems: "center", 
//     justifyContent: "space-between",
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//   },
//   dateInfo: { flexDirection: 'row', alignItems: 'center' },
//   calendarIconBg: { backgroundColor: COLORS.bgBlue, padding: 8, borderRadius: 10, marginRight: 12 },
//   dateLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '800', letterSpacing: 1 },
//   dateText: { fontSize: 16, fontWeight: "900", color: COLORS.primary }, // Decreased
//   editIconBg: { backgroundColor: '#F5F7FA', padding: 8, borderRadius: 10 },

//   searchBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.white,
//     paddingHorizontal: 16,
//     paddingVertical: 10, // Decreased
//     borderRadius: 16,
//     marginBottom: 16,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     color: COLORS.primary,
//     padding: 0,
//     height: 20,
//   },

//   mainCard: { 
//     backgroundColor: COLORS.cardBg, 
//     borderRadius: 20, 
//     padding: 14, // Decreased
//     marginBottom: 20, 
//     elevation: 6,
//   },
//   cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
//   cardLabel: { fontSize: 11, fontWeight: "800", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 },
//   statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
//   statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  
//   heroStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   heroStatBox: { flex: 1, alignItems: 'center' },
//   heroStatLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '700', marginBottom: 4 },
//   heroStatValue: { fontSize: 14, fontWeight: "900", color: COLORS.primary }, // Decreased
//   heroStatDivider: { width: 1, height: 30, backgroundColor: '#E9ECEF' },

//   listCard: { 
//     backgroundColor: COLORS.white, 
//     borderRadius: 16, 
//     padding: 12, // Decreased padding
//     marginBottom: 16,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 5,
//   },
//   listHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 }, // Decreased margin
//   avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" }, // Decreased size
//   avatarText: { color: "#fff", fontSize: 16, fontWeight: "900" }, // Decreased
  
//   clientName: { fontSize: 14, fontWeight: "800", color: COLORS.primary, marginBottom: 4, flex: 1 }, // Decreased
//   metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   ticketText: { fontSize: 11, color: COLORS.muted, fontWeight: '600' }, // Decreased

//   contactActionsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   actionButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F3F4F6',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 8,
//   },

//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   gridBox: {
//     width: '31%', 
//     backgroundColor: '#F5F7FA',
//     borderRadius: 12,
//     padding: 8, // Decreased
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 8, 
//   },
//   gridVal: {
//     fontSize: 11, // Decreased
//     fontWeight: "800",
//     marginTop: 4,
//   },
//   gridLabel: {
//     fontSize: 8, // Decreased
//     fontWeight: "700",
//     color: COLORS.muted,
//     marginTop: 2,
//     textTransform: 'uppercase',
//   },

//   errorBox:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   errorText:  { color: COLORS.white, fontSize: 16, textAlign: "center", marginBottom: 20, fontWeight: '500' },
//   retryBtn:   { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
//   retryText:  { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
//   emptyContainer: { alignItems: 'center', marginTop: 50, opacity: 0.7 },
//   noDataText: { color: "#fff", textAlign: "center", marginTop: 12, fontSize: 15, fontWeight: '600' },
// });

// export default MonthlyTurnover;


import React, { useState, useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Platform,
  UIManager,
  Linking,
  Animated,
  StatusBar,
  ImageBackground,
  Dimensions,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { FontAwesome5, Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import baseUrl from "../constants/baseUrl";

const backgroundImage = require("../assets/hero1.jpg");

const { width } = Dimensions.get("window");

// --- COLORS ---
const COLORS = {
  primary: "#183A5D",
  accent: "#f8c009ff",
  bgBlue: "#1aa2ccff",
  success: "#27AE60",
  cardBg: "rgba(255, 255, 255, 0.98)",
  white: "#FFFFFF",
  muted: "#8898AA",
  background: "#0f2a44",
  box1: "#E0E7FF",
  box1Text: "#4338ca",
  box2: "#D1FAE5",
  box2Text: "#059669",
  box3: "#FEF3C7",
  box3Text: "#D97706",
  box4: "#E0F2FE",
  box4Text: "#0284c7",
  box5: "#FFE4E6",
  box5Text: "#e11d48",
  slate: "#64748b",
  dark: "#1e293b",
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FadeInView = ({ children, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
  }, []);
  return <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>;
};

// --- Animated Date Filter Component (Same as LogOut) ---
const AnimatedDateFilter = ({ month, year, formattedDate, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      })
    ]).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width]
  });

  return (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress} 
        style={{ borderRadius: 16 }}
      >
        <Animated.View style={[styles.dateFilterWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]}>
            <LinearGradient 
              colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']} 
              start={{x: 0, y: 0.5}} 
              end={{x: 1, y: 0.5}}
              style={styles.shimmerGradient} 
            />
          </Animated.View>

          <View style={styles.dateFilterIconBox}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.white} />
          </View>
          <View style={styles.dateFilterTextContainer}>
            <Text style={styles.dateFilterStaticLabel}>Selected Period</Text>
            <Text style={styles.dateFilterDynamicText}>{formattedDate}</Text>
          </View>
          <View style={styles.dateFilterAction}>
            <Text style={styles.dateFilterChangeText}>Change</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.bgBlue} />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

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

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "0";
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

const MonthlyTurnover = ({ navigation }) => {
  const [turnoverData, setTurnoverData]   = useState(null);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedDate, setSelectedDate]   = useState(new Date());
  const [showPicker, setShowPicker]       = useState(false);
  const [formattedDate, setFormattedDate] = useState(moment().format("MMMM YYYY"));
  const [month, setMonth]                 = useState(moment().month());
  const [year, setYear]                   = useState(moment().year());
  const [searchQuery, setSearchQuery]     = useState("");

  const currentYear = moment().year();
  const currentMonth = moment().month();

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedDate]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) { setError("Session expired."); setLoading(false); return; }
      const user    = JSON.parse(userJson);
      const agentId = user?.userId;
      if (!agentId) { setError("No agentId found."); setLoading(false); return; }

      const year  = moment(selectedDate).year();
      const month = moment(selectedDate).month();
      const apiUrl = baseUrl + "/user/agent-monthly-turnover-by-id/" + agentId +
        "?year=" + year + "&month=" + month;

      const response = await axios.get(apiUrl);

      if (response.data?.success) {
        const payingCustomers = response.data.agentData?.payingCustomers || [];
        setTurnoverData(response.data.agentData);

        const customersWithStatus = payingCustomers.map((c) => {
          const monthlyPaid        = parseFloat(c.monthlyPaid       || 0);
          const totalPaid          = parseFloat(c.totalPaid         || 0);
          const monthlyInstallment = parseFloat(c.monthly_installment || 0);
          const balance            = parseFloat(c.balance           || 0);
          const differenceAmount   = monthlyInstallment - monthlyPaid;

          let lastPaymentDate = "N/A";
          if (c.payments && c.payments.length > 0) {
            const latestDate = c.payments
              .map((p) => p.pay_date)
              .filter(Boolean)
              .sort((a, b) => new Date(b) - new Date(a))[0];
            if (latestDate) lastPaymentDate = moment(latestDate).format("DD MMM");
          }

          return {
            ...c,
            enrollmentId:  c._id,
            ticketNumber:  c.ticket || "N/A", 
            balance:       balance,
            paymentStatus: monthlyPaid >= monthlyInstallment ? "PAID" : "UNPAID",
            lastPaymentDate,
            monthlyPaid,
            totalPaid,
            differenceAmount,
          };
        });

        setCustomersData(customersWithStatus);
      } else {
        setError(response.data?.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("TURNOVER_ERROR => " + err.message);
      setError("Error fetching agent details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelection = (selectedYear, selectedMonth) => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    setSelectedDate(newDate);
    setFormattedDate(moment(newDate).format("MMMM YYYY"));
    setMonth(selectedMonth);
    setYear(selectedYear);
    setShowPicker(false);
  };

  const filteredCustomers = customersData.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name  = (item.user_id?.full_name || "").toLowerCase();
    const phone = (item.user_id?.phone_number || "").toLowerCase();
    const group = (item.group_id?.group_name || "").toLowerCase();
    const ticket = (item.ticketNumber || "").toString().toLowerCase();
    
    return name.includes(query) || phone.includes(query) || group.includes(query) || ticket.includes(query);
  });

  const renderNormalLoader = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      <Text style={styles.loadingText}>Loading collection data...</Text>
    </View>
  );

  const renderCustomerCard = ({ item, index }) => {
    const isPaid        = item.paymentStatus === "PAID";
    const statusColor   = isPaid ? COLORS.success : COLORS.box5Text;
    const statusBg      = isPaid ? "rgba(39, 174, 96, 0.15)" : "rgba(225, 29, 72, 0.1)";
    
    const customerPhone = item.user_id?.phone_number;
    const customerEmail = item.user_id?.email;
    const customerName  = item.user_id?.full_name || "Unknown";
    const groupName     = item.group_id?.group_name || "Group";
    const ticketNum     = item.ticketNumber;
    const balanceVal    = item.balance || 0;
    const diffVal       = item.differenceAmount || 0;

    const isNegativeBalance = balanceVal < 0;
    const balanceBoxBg = isNegativeBalance ? COLORS.box2 : COLORS.box5;
    const balanceBoxText = isNegativeBalance ? COLORS.box2Text : COLORS.box5Text;
    const displayBalance = Math.abs(balanceVal);

    return (
      <FadeInView delay={index * 30}>
        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{customerName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.clientName} numberOfLines={1}>{customerName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{item.paymentStatus}</Text>
                </View>
              </View>
              
              <View style={styles.metaRow}>
                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Text style={styles.ticketText} numberOfLines={1}>{groupName}</Text>
                  <Text style={styles.ticketText}> • </Text>
                  <Text style={[styles.ticketText, { color: COLORS.bgBlue, fontWeight: '700' }]}>Ticket #{ticketNum}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.contactActionsRow}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleAction("call", customerPhone)}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={16} color="#10B981" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleAction("whatsapp", customerPhone)}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="whatsapp" size={18} color="#25D366" />
            </TouchableOpacity>

            {customerEmail ? (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => handleAction("email", customerEmail)}
                activeOpacity={0.7}
              >
                <Ionicons name="mail" size={16} color={COLORS.bgBlue} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.gridBox, { backgroundColor: COLORS.box1 }]}>
              <MaterialCommunityIcons name="calendar-clock" size={14} color={COLORS.box1Text} />
              <Text style={[styles.gridVal, { color: COLORS.box1Text }]}>{formatCurrency(item.monthly_installment)}</Text>
              <Text style={styles.gridLabel}>Installment</Text>
            </View>

            <View style={[styles.gridBox, { backgroundColor: COLORS.box2 }]}>
              <Ionicons name="wallet" size={14} color={COLORS.box2Text} />
              <Text style={[styles.gridVal, { color: COLORS.box2Text }]}>{formatCurrency(item.monthlyPaid)}</Text>
              <Text style={styles.gridLabel}>Paid</Text>
            </View>

            <View style={[styles.gridBox, { backgroundColor: COLORS.box3 }]}>
              <Ionicons name="calculator" size={14} color={COLORS.box3Text} />
              <Text style={[styles.gridVal, { color: COLORS.box3Text, fontWeight: '900' }]}>{formatCurrency(diffVal)}</Text>
              <Text style={styles.gridLabel}>Diff</Text>
            </View>

            <View style={[styles.gridBox, { backgroundColor: COLORS.box4, width: '48%' }]}>
              <FontAwesome5 name="hand-holding-usd" size={14} color={COLORS.box4Text} />
              <Text style={[styles.gridVal, { color: COLORS.box4Text }]}>{formatCurrency(item.totalPaid)}</Text>
              <Text style={styles.gridLabel}>Total Paid</Text>
            </View>

            <View style={[styles.gridBox, { backgroundColor: balanceBoxBg, width: '48%' }]}>
              <MaterialCommunityIcons name="scale-balance" size={14} color={balanceBoxText} />
              <Text style={[styles.gridVal, { color: balanceBoxText }]}>{formatCurrency(displayBalance)}</Text>
              <Text style={styles.gridLabel}>Balance</Text>
            </View>
          </View>
        </View>
      </FadeInView>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={backgroundImage} style={styles.bgOverlay} blurRadius={12} />
      <LinearGradient colors={["rgba(26, 162, 204, 0.9)", COLORS.primary]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchMonthlyData} style={styles.refreshBtn} activeOpacity={0.7}>
              <Feather name="refresh-cw" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Monthly Turnover</Text>
          <Text style={styles.headerSubTitle}>Track your monthly collection</Text>
        </View>

        <View style={styles.contentContainer}>
          {loading ? (
            renderNormalLoader()
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchMonthlyData}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredCustomers}
              renderItem={renderCustomerCard}
              keyExtractor={(_, i) => i.toString()}
              ListHeaderComponent={
                <>
                  <AnimatedDateFilter 
                    month={month}
                    year={year}
                    formattedDate={formattedDate}
                    onPress={() => setShowPicker(true)}
                  />

                  <View style={styles.searchBarContainer}>
                    <Feather name="search" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search name, phone, ticket or group..."
                      placeholderTextColor={COLORS.muted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Feather name="x" size={18} color={COLORS.muted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.mainCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardLabel}>Monthly Summary</Text>
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(39, 174, 96, 0.15)' }]}>
                        <Text style={styles.statusText}>Active</Text>
                      </View>
                    </View>

                    <View style={styles.heroStatsRow}>
                      <View style={styles.heroStatBox}>
                        <Text style={styles.heroStatLabel}>EXPECTED</Text>
                        <Text style={styles.heroStatValue}>₹{formatCurrency(turnoverData?.expectedTurnover)}</Text>
                      </View>
                      <View style={styles.heroStatDivider} />
                      <View style={styles.heroStatBox}>
                        <Text style={styles.heroStatLabel}>COLLECTED</Text>
                        <Text style={[styles.heroStatValue, { color: COLORS.success }]}>₹{formatCurrency(turnoverData?.totalTurnover)}</Text>
                      </View>
                    </View>
                  </View>
                </>
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="database-off-outline" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.noDataText}>
                    {searchQuery ? "No matching customers found." : "No customers found for this period."}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Month Picker Modal - Same as LogOut */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Period</Text>
            <View style={styles.yearSwitcher}>
              <TouchableOpacity onPress={() => setYear(year - 1)}>
                <Ionicons name="chevron-back" size={24} color={COLORS.bgBlue} />
              </TouchableOpacity>
              <Text style={styles.yearLabel}>{year}</Text>
              <TouchableOpacity 
                disabled={year >= currentYear} 
                onPress={() => setYear(year + 1)} 
                style={{ opacity: year >= currentYear ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-forward" size={24} color={COLORS.bgBlue} />
              </TouchableOpacity>
            </View>
            <View style={styles.monthGrid}>
              {moment.monthsShort().map((m, i) => {
                const isFutureMonth = year === currentYear && i > currentMonth;
                const isDisabled = isFutureMonth;
                return (
                  <TouchableOpacity 
                    key={m} 
                    disabled={isDisabled} 
                    onPress={() => handleDateSelection(year, i)} 
                    style={[styles.monthItem, month === i && styles.activeMonthItem, isDisabled && styles.disabledMonthItem]}
                  >
                    <Text style={[styles.monthItemText, month === i && styles.activeMonthItemText]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.cancelPickerBtn}>
              <Text style={styles.cancelPickerText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.primary },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
  
  header: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 20 : 20,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", textAlign: 'center', marginTop: 1 },
  headerSubTitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 },
  iconCircle: { backgroundColor: "#fff", padding: 8, borderRadius: 12, elevation: 4 },
  refreshBtn: { backgroundColor: COLORS.accent, padding: 10, borderRadius: 12, elevation: 4 },
  
  contentContainer: { paddingHorizontal: 16, flex: 1 },
  listContent: { paddingBottom: 40 },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.white, marginTop: 10, fontWeight: '600', opacity: 0.8 },

  // Animated Date Filter Styles
  dateFilterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden'
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '50%',
    zIndex: 1
  },
  shimmerGradient: {
    flex: 1,
    width: width
  },
  dateFilterIconBox: {
    backgroundColor: COLORS.bgBlue,
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  dateFilterTextContainer: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
    zIndex: 2
  },
  dateFilterStaticLabel: {
    fontSize: 10,
    color: COLORS.slate || "#64748b",
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  dateFilterDynamicText: {
    fontSize: 16,
    color: COLORS.dark || "#1e293b",
    fontWeight: '800',
    marginTop: 1
  },
  dateFilterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    marginRight: 4,
    zIndex: 2
  },
  dateFilterChangeText: {
    color: COLORS.bgBlue,
    fontWeight: '700',
    fontSize: 12,
    marginRight: 2
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    padding: 0,
    height: 20,
  },

  mainCard: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 20, 
    padding: 14,
    marginBottom: 20, 
    elevation: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 11, fontWeight: "800", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  
  heroStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStatBox: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '700', marginBottom: 4 },
  heroStatValue: { fontSize: 14, fontWeight: "900", color: COLORS.primary },
  heroStatDivider: { width: 1, height: 30, backgroundColor: '#E9ECEF' },

  listCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  listHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  
  clientName: { fontSize: 14, fontWeight: "800", color: COLORS.primary, marginBottom: 4, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketText: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },

  contactActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridBox: {
    width: '31%', 
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8, 
  },
  gridVal: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  gridLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: COLORS.muted,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  errorBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { color: COLORS.white, fontSize: 16, textAlign: "center", marginBottom: 20, fontWeight: '500' },
  retryBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 50, opacity: 0.7 },
  noDataText: { color: "#fff", textAlign: "center", marginTop: 12, fontSize: 15, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 118, 153, 0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  pickerSheet: { 
    width: '100%', 
    backgroundColor: '#fff', 
    borderRadius: 30, 
    padding: 30 
  },
  pickerTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: COLORS.primary, 
    marginBottom: 25, 
    textAlign: 'center' 
  },
  yearSwitcher: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20, 
    backgroundColor: '#f1f5f9', 
    padding: 12, 
    borderRadius: 16 
  },
  yearLabel: { 
    color: COLORS.primary, 
    fontSize: 20, 
    fontWeight: '900' 
  },
  monthGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  monthItem: { 
    width: '30%', 
    paddingVertical: 14, 
    alignItems: 'center', 
    borderRadius: 14, 
    marginBottom: 10, 
    backgroundColor: '#f1f5f9' 
  },
  activeMonthItem: { 
    backgroundColor: COLORS.bgBlue 
  },
  disabledMonthItem: { 
    opacity: 0.3 
  },
  monthItemText: { 
    color: COLORS.slate || "#64748b", 
    fontSize: 12, 
    fontWeight: '700' 
  },
  activeMonthItemText: { 
    color: COLORS.white 
  },
  cancelPickerBtn: { 
    marginTop: 15, 
    alignSelf: 'center' 
  },
  cancelPickerText: { 
    color: COLORS.box5Text, 
    fontWeight: '800', 
    fontSize: 14 
  },
});

export default MonthlyTurnover;