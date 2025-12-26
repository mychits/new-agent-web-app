// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   ActivityIndicator,
//   TouchableOpacity,
//   Platform,
//   FlatList,
// } from "react-native";
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { Ionicons } from "@expo/vector-icons";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { LinearGradient } from "expo-linear-gradient";
// import Header from "../components/Header";
// import baseUrl from "../constants/baseUrl";
// import axios from "axios";

// /* ------------------ DESIGN CONSTANTS ------------------ */
// const TOP_GRADIENT = ["#1aa2cc", "#1aa2cc"];
// const MODERN_PRIMARY = "#0d0d0e";
// const ACCENT_BLUE = "#1796d1";
// const BORDER_COLOR = "#e0e0e0";
// const TEXT_GREY = "#4b5563";
// const CARD_BG = "#ffffff";
// const SUBTLE_BG_GREY = "#f9fafb";

// /* ------------------ CUSTOMER CARD ------------------ */
// const CustomerCard = React.memo(
//   ({ name, phone, customerId, address, onPress }) => (
//     <TouchableOpacity
//       onPress={onPress}
//       style={styles.cardContainer}
//       activeOpacity={0.8}
//     >
//       <View style={styles.topCardSection}>
//         <View style={styles.iconCircle}>
//           <Ionicons name="person" size={30} color={ACCENT_BLUE} />
//         </View>

//         <View style={styles.infoContainer}>
//           <Text style={styles.cardTitle}>{name || "Unknown Name"}</Text>

//           <View style={styles.contactRow}>
//             <Ionicons
//               name="call"
//               size={16}
//               color={ACCENT_BLUE}
//               style={{ marginRight: 6 }}
//             />
//             <Text style={styles.phoneText}>{phone || "N/A"}</Text>
//           </View>

//           <View style={styles.badgeContainer}>
//             <Ionicons
//               name="finger-print-outline"
//               size={14}
//               color={TEXT_GREY}
//               style={{ marginRight: 4 }}
//             />
//             <Text style={styles.idBadgeText}>{customerId}</Text>
//           </View>
//         </View>

//         <Ionicons
//           name="chevron-forward"
//           size={24}
//           color={ACCENT_BLUE}
//         />
//       </View>

//       <View style={styles.separator} />

//       <View style={styles.addressSection}>
//         <Ionicons
//           name="location-sharp"
//           size={18}
//           color={ACCENT_BLUE}
//           style={{ marginRight: 8, marginTop: 2 }}
//         />
//         <View style={{ flex: 1 }}>
//           <Text style={styles.addressLabel}>Address:</Text>
//           <Text style={styles.addressText}>
//             {address || "No address provided"}
//           </Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   )
// );

// /* ------------------ MAIN COMPONENT ------------------ */
// const PaymentLinkRoutes = ({ route, navigation }) => {
//   const user = route?.params?.user;

//   const [search, setSearch] = useState("");
//   const [customers, setCustomers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchCustomers();
//   }, [user?.userId]);

//   const fetchCustomers = async () => {
//     try {
//       setLoading(true);

//       const [chitRes, pigmeRes, loanRes] = await Promise.all([
//         axios.get(`${baseUrl}/user/collection-area/agent/${user?.userId}`),
//         axios.get(`${baseUrl}/pigme?referrerId=${user?.userId}`),
//         axios.get(`${baseUrl}/loans?referrerId=${user?.userId}`),
//       ]);

//       const map = new Map();

//       // CHIT
//       (chitRes.data || []).forEach((c) => {
//         map.set(c._id, {
//           _id: c._id,
//           name: c.full_name,
//           phone: c.phone_number,
//           address: c.address,
//           customerId: c.customer_id || c._id,
//         });
//       });

//       // PIGME
//       (pigmeRes.data?.data || []).forEach((p) => {
//         if (p.customer?._id) {
//           map.set(p.customer._id, {
//             _id: p.customer._id,
//             name: p.customer.full_name,
//             phone: p.customer.phone_number,
//             address: p.customer.address,
//             customerId: p.customer.customer_id || p.customer._id,
//           });
//         }
//       });

//       // LOAN
//       (loanRes.data?.data || []).forEach((l) => {
//         if (l.borrower?._id) {
//           map.set(l.borrower._id, {
//             _id: l.borrower._id,
//             name: l.borrower.full_name,
//             phone: l.borrower.phone_number,
//             address:
//               l.borrower.address ||
//               [
//                 l.borrower.address_line_1,
//                 l.borrower.city,
//                 l.borrower.state,
//                 l.borrower.pincode,
//               ]
//                 .filter(Boolean)
//                 .join(", "),
//             customerId: l.borrower.customer_id || l.borrower._id,
//           });
//         }
//       });

//       setCustomers([...map.values()]);
//     } catch (err) {
//       console.error("Customer fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredCustomers = useMemo(() => {
//     if (!search) return customers;
//     const term = search.toLowerCase();
//     return customers.filter(
//       (c) =>
//         c.name?.toLowerCase().includes(term) ||
//         c.phone?.toString().includes(term) ||
//         c.customerId?.toString().toLowerCase().includes(term)
//     );
//   }, [search, customers]);

//   const renderItem = useCallback(
//     ({ item }) => (
//       <CustomerCard
//         {...item}
//         onPress={() =>
//           navigation.navigate("CustomerPaymentLink", {
//             user,
//             customer: item,
//           })
//         }
//       />
//     ),
//     [navigation, user]
//   );

//   return (
//     <SafeAreaView style={styles.safeArea} edges={["top"]}>
//       <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
//         <View style={styles.headerSpacer}>
//           <Header />
//         </View>

//         <View style={styles.titleContainer}>
//           <Text style={styles.title}>Payment Links</Text>
//           <Text style={styles.subtitle}>Select Customer</Text>
//         </View>

//         <View style={styles.searchContainer}>
//           <Ionicons
//             name="search-outline"
//             size={20}
//             color={TEXT_GREY}
//             style={styles.searchIcon}
//           />
//           <TextInput
//             value={search}
//             onChangeText={setSearch}
//             placeholder="Search customer..."
//             placeholderTextColor={TEXT_GREY}
//             style={styles.searchInput}
//           />
//           {search.length > 0 && (
//             <TouchableOpacity onPress={() => setSearch("")}>
//               <Ionicons name="close-circle" size={22} color={TEXT_GREY} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </LinearGradient>

//       <View style={styles.mainContentArea}>
//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color={ACCENT_BLUE} />
//           </View>
//         ) : (
//           <FlatList
//             data={filteredCustomers}
//             renderItem={renderItem}
//             keyExtractor={(item) => item._id.toString()}
//             contentContainerStyle={styles.scrollContainer}
//             ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
//             showsVerticalScrollIndicator={false}
//             removeClippedSubviews={Platform.OS === "android"}
//           />
//         )}
//       </View>
//     </SafeAreaView>
//   );
// };

// /* ------------------ STYLES ------------------ */
// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
//   topContainer: { paddingHorizontal: 20, paddingBottom: 40 },
//   mainContentArea: {
//     flex: 1,
//     backgroundColor: SUBTLE_BG_GREY,
//     borderTopLeftRadius: 35,
//     borderTopRightRadius: 35,
//     marginTop: -25,
//     paddingTop: 20,
//   },
//   headerSpacer: { paddingVertical: 10 },
//   titleContainer: { marginBottom: 20 },
//   title: { fontSize: 26, fontWeight: "900", color: CARD_BG, textAlign: "center" },
//   subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" },
//   searchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: CARD_BG,
//     borderRadius: 15,
//     paddingHorizontal: 15,
//     height: 50,
//     elevation: 5,
//   },
//   searchIcon: { marginRight: 10 },
//   searchInput: { flex: 1, fontSize: 16, color: MODERN_PRIMARY },
//   scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
//   cardContainer: {
//     backgroundColor: CARD_BG,
//     borderRadius: 25,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: BORDER_COLOR,
//     elevation: 3,
//   },
//   topCardSection: { flexDirection: "row", alignItems: "center" },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: "#e8f6fc",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   infoContainer: { flex: 1, marginLeft: 15 },
//   cardTitle: { fontSize: 15, fontWeight: "900", color: MODERN_PRIMARY },
//   contactRow: { flexDirection: "row", alignItems: "center" },
//   phoneText: { fontSize: 15, color: TEXT_GREY, fontWeight: "600" },
//   badgeContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
//   idBadgeText: { fontSize: 11, fontWeight: "700", color: MODERN_PRIMARY },
//   separator: { height: 1, backgroundColor: BORDER_COLOR, marginVertical: 15 },
//   addressSection: { flexDirection: "row", alignItems: "flex-start" },
//   addressLabel: { fontSize: 12, fontWeight: "700", color: ACCENT_BLUE },
//   addressText: { fontSize: 14, color: MODERN_PRIMARY, fontWeight: "500" },
//   loadingContainer: { marginTop: 100, alignItems: "center" },
// });

// export default PaymentLinkRoutes;
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  FlatList,
  Dimensions,
  Animated,
  Pressable,
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

/* ------------------ DESIGN CONSTANTS ------------------ */
const { width } = Dimensions.get('window');
const TOP_GRADIENT = ["#1aa2cc", "#1aa2cc"];
const MODERN_PRIMARY = "#0d0d0e";
const ACCENT_BLUE = "#1796d1";
const ACCENT_LIGHT_BLUE = "#e8f6fc";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb";

/* ------------------ CUSTOMER CARD ------------------ */
const CustomerCard = React.memo(
  ({ name, phone, customerId, address, onPress, index }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, [opacityAnim, index]);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    return (
      <Animated.View style={{ opacity: opacityAnim }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
            {/* Card Header with Avatar */}
            <View style={styles.cardHeader}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[ACCENT_BLUE, ACCENT_LIGHT_BLUE]}
                    style={styles.avatarGradient}
                  >
                    <Ionicons name="person" size={32} color={CARD_BG} />
                  </LinearGradient>
                  <View style={styles.onlineIndicator} />
                </View>
              </View>

              <View style={styles.customerDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.customerName}>{name || "Unknown Name"}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={ACCENT_BLUE} />
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="call"
                      size={16}
                      color={ACCENT_BLUE}
                      style={styles.infoIcon}
                    />
                    <Text style={styles.infoText}>{phone || "N/A"}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="finger-print-outline"
                      size={14}
                      color={TEXT_GREY}
                      style={styles.infoIcon}
                    />
                    <Text style={styles.idText}>Customer ID: {customerId}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.chevronSection}>
                <View style={styles.chevronCircle}>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={ACCENT_BLUE}
                  />
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Address Section */}
            <View style={styles.addressSection}>
              <View style={styles.addressIconWrapper}>
                <LinearGradient
                  colors={[ACCENT_BLUE, ACCENT_LIGHT_BLUE]}
                  style={styles.addressIconGradient}
                >
                  <Ionicons
                    name="location-sharp"
                    size={18}
                    color={CARD_BG}
                  />
                </LinearGradient>
              </View>
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Address</Text>
                <Text style={styles.addressText}>
                  {address || "No address provided"}
                </Text>
              </View>
            </View>

            {/* Action Bar */}
           
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  }
);

/* ------------------ MAIN COMPONENT ------------------ */
const PaymentLinkRoutes = ({ route, navigation }) => {
  const user = route?.params?.user;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [user?.userId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const [chitRes, pigmeRes, loanRes] = await Promise.all([
        axios.get(`${baseUrl}/user/collection-area/agent/${user?.userId}`),
        axios.get(`${baseUrl}/pigme?referrerId=${user?.userId}`),
        axios.get(`${baseUrl}/loans?referrerId=${user?.userId}`),
      ]);

      const map = new Map();

      // CHIT
      (chitRes.data || []).forEach((c) => {
        map.set(c._id, {
          _id: c._id,
          name: c.full_name,
          phone: c.phone_number,
          address: c.address,
          customerId: c.customer_id || c._id,
        });
      });

      // PIGME
      (pigmeRes.data?.data || []).forEach((p) => {
        if (p.customer?._id) {
          map.set(p.customer._id, {
            _id: p.customer._id,
            name: p.customer.full_name,
            phone: p.customer.phone_number,
            address: p.customer.address,
            customerId: p.customer.customer_id || p.customer._id,
          });
        }
      });

      // LOAN
      (loanRes.data?.data || []).forEach((l) => {
        if (l.borrower?._id) {
          map.set(l.borrower._id, {
            _id: l.borrower._id,
            name: l.borrower.full_name,
            phone: l.borrower.phone_number,
            address:
              l.borrower.address ||
              [
                l.borrower.address_line_1,
                l.borrower.city,
                l.borrower.state,
                l.borrower.pincode,
              ]
                .filter(Boolean)
                .join(", "),
            customerId: l.borrower.customer_id || l.borrower._id,
          });
        }
      });

      setCustomers([...map.values()]);
    } catch (err) {
      console.error("Customer fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const term = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.phone?.toString().includes(term) ||
        c.customerId?.toString().toLowerCase().includes(term)
    );
  }, [search, customers]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <CustomerCard
        {...item}
        index={index}
        onPress={() =>
          navigation.navigate("CustomerPaymentLink", {
            user,
            customer: item,
          })
        }
      />
    ),
    [navigation, user]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
        <View style={styles.headerSpacer}>
          <Header />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Customers</Text>
          <Text style={styles.subtitle}>Select Customer</Text>
        </View>

        <View style={[styles.searchContainer, searchFocused && styles.searchFocused]}>
          <Ionicons
            name="search-outline"
            size={20}
            color={TEXT_GREY}
            style={styles.searchIcon}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search customer..."
            placeholderTextColor={TEXT_GREY}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={22} color={TEXT_GREY} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={styles.mainContentArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color={TEXT_GREY} />
            <Text style={styles.emptyStateTitle}>No customers found</Text>
            <Text style={styles.emptyStateMessage}>
              {search ? "Try adjusting your search terms" : "There are no customers to display"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderItem}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === "android"}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: TOP_GRADIENT[0] 
  },
  topContainer: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginTop: -25,
    paddingTop: 20,
  },
  headerSpacer: { 
    paddingVertical: 10 
  },
  titleContainer: { 
    marginBottom: 20 
  },
  title: { 
    fontSize: 26, 
    fontWeight: "900", 
    color: CARD_BG, 
    textAlign: "center" 
  },
  subtitle: { 
    fontSize: 14, 
    color: "rgba(255,255,255,0.8)", 
    textAlign: "center" 
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchFocused: {
    borderColor: ACCENT_BLUE,
    borderWidth: 2,
  },
  searchIcon: { 
    marginRight: 10 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: MODERN_PRIMARY 
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: TEXT_GREY,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: MODERN_PRIMARY,
    marginTop: 20,
  },
  emptyStateMessage: {
    fontSize: 15,
    color: TEXT_GREY,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  listContainer: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  itemSeparator: {
    height: 16,
  },
  
  // Enhanced Card Styles
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 15,
  },
  avatarSection: {
    marginRight: 15,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#48BB78',
    borderWidth: 3,
    borderColor: CARD_BG,
  },
  customerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "700",
    color: MODERN_PRIMARY,
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: ACCENT_LIGHT_BLUE,
    borderRadius: 10,
    padding: 2,
  },
  infoRow: {
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: TEXT_GREY,
    fontWeight: "500",
  },
  idText: {
    fontSize: 13,
    color: TEXT_GREY,
    fontWeight: "600",
  },
  chevronSection: {
    marginLeft: 10,
  },
  chevronCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT_LIGHT_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },
  cardDivider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginHorizontal: 20,
  },
  addressSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    paddingTop: 15,
    paddingBottom: 12,
  },
  addressIconWrapper: {
    marginRight: 12,
  },
  addressIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: ACCENT_BLUE,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 14,
    color: MODERN_PRIMARY,
    lineHeight: 20,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: ACCENT_LIGHT_BLUE,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: MODERN_PRIMARY,
  },
});

export default PaymentLinkRoutes;