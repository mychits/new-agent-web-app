import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  FlatList,
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context"; 
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ["#1aa2cc", "#1aa2cc"]; 
const MODERN_PRIMARY = "#0d0d0e"; 
const ACCENT_BLUE = "#1796d1"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

// --- CUSTOMER CARD COMPONENT ---
const CustomerCard = React.memo(({ name, phone, customerId, address, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.cardContainer} activeOpacity={0.8}>
    <View style={styles.topCardSection}>
      <View style={styles.iconCircle}>
        <Ionicons name="person" size={30} color={ACCENT_BLUE} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cardTitle}>{name || "Unknown Name"}</Text>
        <View style={styles.contactRow}>
          <Ionicons name="call" size={16} color={ACCENT_BLUE} style={{marginRight: 6}} />
          <Text style={styles.phoneText}>{phone || "N/A"}</Text>
        </View>
        <View style={styles.badgeContainer}>
          <Ionicons name="finger-print-outline" size={14} color={TEXT_GREY} style={{marginRight: 4}}/>
          <Text style={styles.idBadgeText}>Customer ID: {customerId}</Text>
        </View>
      </View>

      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={24} color={ACCENT_BLUE} />
      </View>
    </View>

    <View style={styles.separator} />

    <View style={styles.addressSection}>
      <Ionicons name="location-sharp" size={18} color={ACCENT_BLUE} style={{marginRight: 8, marginTop: 2}} />
      <View style={{flex: 1}}>
        <Text style={styles.addressLabel}> Address:</Text>
        <Text style={styles.addressText}>{address || "No address provided"}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

// --- MAIN COMPONENT ---
const RouteCustomer = ({ route, navigation }) => {
  const user = route?.params?.user;
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const agentId = user?.userId;
        if (!agentId) {
            setLoading(false);
            return;
        }

        const response = await axios.get(
          `${baseUrl}/user/collection-area/agent/${agentId}`
        );
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [user?.userId]);

  // UseMemo prevents the filter from recalculating unless search or customers change
  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const searchTerm = search.toLowerCase();
    return customers.filter((customer) => {
      const nameMatch = customer.full_name?.toLowerCase().includes(searchTerm);
      const phoneMatch = customer.phone_number?.toString().includes(searchTerm);
      const idMatch = customer.customer_id?.toString().toLowerCase().includes(searchTerm);
      return nameMatch || phoneMatch || idMatch;
    });
  }, [search, customers]);

  // UseCallback prevents FlatList from re-rendering items unnecessarily
  const renderItem = useCallback(({ item }) => (
    <CustomerCard
      name={item.full_name}
      phone={item.phone_number}
      customerId={item.customer_id}
      address={item.address}
      onPress={() => navigation.navigate("Payin", { customer: item._id })}
    />
  ), [navigation]);

  const clearSearch = () => setSearch("");

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
        <View style={styles.headerSpacer}><Header /></View>

        <View style={styles.titleContainer}>
            <Text style={styles.title}>Chit Customers</Text>
            <Text style={styles.subtitle}>Search by Name, Phone, or ID</Text>
        </View>
        
        <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={TEXT_GREY} style={styles.searchIcon} />
            <TextInput
              value={search}
              onChangeText={(text) => setSearch(text)}
              placeholder="Search customers..."
              placeholderTextColor={TEXT_GREY}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              underlineColorAndroid="transparent"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={22} color={TEXT_GREY} />
              </TouchableOpacity>
            )}
        </View>
      </LinearGradient>

      <View style={styles.mainContentArea}>
        {loading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ACCENT_BLUE} />
            </View>
        ) : (
            <FlatList
              data={filteredCustomers}
              renderItem={renderItem}
              // Fixed KeyExtractor: DO NOT use Math.random() as it causes crashes
              keyExtractor={(item, index) => (item._id || item.customer_id || index).toString()}
              ListEmptyComponent={
                <Text style={styles.noCustomersText}>No matching customers found.</Text>
              }
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
              // Performance optimizations for large lists
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}
            />
        )}
      </View>
    </SafeAreaView>
  );
};

// ... Styles remain the same as your original code
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  topContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY, 
    borderTopLeftRadius: 35, 
    borderTopRightRadius: 35,
    marginTop: -25, 
    paddingTop: 20,
  },
  headerSpacer: { paddingTop: 10, paddingBottom: 10 }, 
  titleContainer: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "900", color: CARD_BG, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4, textAlign: 'center' },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
        android: { elevation: 5 },
    }),
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: MODERN_PRIMARY, paddingVertical: 8 },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    elevation: 3,
  },
  topCardSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#e8f6fc', justifyContent: 'center', alignItems: 'center',
  },
  infoContainer: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: MODERN_PRIMARY, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  phoneText: { fontSize: 15, color: TEXT_GREY, fontWeight: '600' },
  badgeContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start',
  },
  idBadgeText: { fontSize: 11, fontWeight: '700', color: MODERN_PRIMARY },
  chevronContainer: { paddingLeft: 10 },
  separator: { height: 1, backgroundColor: BORDER_COLOR, marginVertical: 15 },
  addressSection: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 5 },
  addressLabel: { fontSize: 12, fontWeight: '700', color: ACCENT_BLUE, marginBottom: 3 },
  addressText: { 
    fontSize: 14, 
    color: MODERN_PRIMARY, 
    lineHeight: 20, 
    fontWeight: '500',
  },
  loadingContainer: { marginTop: 100, alignItems: 'center' },
  noCustomersText: { textAlign: "center", marginTop: 40, fontSize: 16, color: TEXT_GREY },
});

export default RouteCustomer;