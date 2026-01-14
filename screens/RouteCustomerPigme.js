import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context"; 
import { LinearGradient } from "expo-linear-gradient";

// Assume these imports are correctly set up in your project
import Header from "../components/Header"; 
import baseUrl from "../constants/baseUrl"; 
import axios from "axios";

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e5e7eb"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f3f4f6'; 

// --- BIG CARD COMPONENT ---
const CustomerCard = ({ name, pigmeId, phone, address, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.cardContainer} activeOpacity={0.8}>
    {/* Header: Avatar, Name and Arrow */}
    <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color={CARD_BG} />
        </View>
        <View style={styles.headerTextInfo}>
            <Text style={styles.cardNameText} numberOfLines={3}>
                {name || "Unknown Customer"}
            </Text>
            <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>Pigmy ID: {pigmeId || 'N/A'}</Text>
            </View>
        </View>
        <Ionicons name="chevron-forward-circle" size={28} color={ACCENT_BLUE} />
    </View>

    <View style={styles.divider} />

    {/* Body: Phone and Address Details */}
    <View style={styles.cardBody}>
        <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
                <Ionicons name="call" size={14} color={ACCENT_BLUE} />
            </View>
            <Text style={styles.infoValueText}>{phone || "No phone number"}</Text>
        </View>
        
        <View style={[styles.infoRow, { marginTop: 12, alignItems: 'flex-start' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="location" size={14} color="#ef4444" />
            </View>
            <Text style={styles.addressValueText} numberOfLines={7}>
                {address || "No address provided for this customer"}
            </Text>
        </View>
    </View>
  </TouchableOpacity>
);


const RouteCustomerPigme = ({ route, navigation }) => {
  const { user } = route.params; 

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPigmeCustomers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseUrl}/pigme?referrerId=${user?.userId}`
        );
        if (response?.data?.data) {
          setCustomers(response?.data?.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPigmeCustomers();
  }, [user?.userId]);

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter(
        (item) =>
          item.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          item.pigme_id?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={TOP_GRADIENT}
        style={styles.topContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerSpacer}>
            <Header /> 
        </View>

        <View style={styles.titleContainer}>
            <Text style={styles.title}>Pigmy Customers</Text>
            <Text style={styles.subtitle}>Directory and Collections</Text>
        </View>
        
        <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={TEXT_GREY} style={styles.searchIcon} />
            <TextInput
              value={search}
              onChangeText={(text) => setSearch(text)}
              placeholder="Search by Name or ID..."
              placeholderTextColor={TEXT_GREY}
              style={styles.searchInput}
            />
        </View>
      </LinearGradient>
      
      <View style={styles.mainContentArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {loading ? (
              <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={ACCENT_BLUE} />
              </View>
          ) : (
              <View style={styles.cardListContainer}>
                  {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((item, index) => (
                          <CustomerCard
                              key={item._id || index}
                              pigmeId={item.pigme_id}
                              name={item.customer?.full_name}
                              phone={item.customer?.phone_number}
                              address={item.customer?.address}
                              onPress={() => {
                                 navigation.navigate("PigmePayin", {
                                     user,
                                     customer: item?.customer?._id,
                                     pigme_id: item?._id,
                                     custom_pigme_id: item?.pigme_id,
                                 });
                              }}
                          />
                      ))
                  ) : (
                      <Text style={styles.noCustomersText}>No customers found.</Text>
                  )}
              </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  topContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40, 
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY, 
    borderTopLeftRadius: 35, 
    borderTopRightRadius: 35,
    marginTop: -25, 
    paddingTop: 25,
  },
  headerSpacer: { paddingTop: 10, paddingBottom: 10 }, 
  titleContainer: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "900", color: CARD_BG },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 16, 
    paddingHorizontal: 15,
    height: 55,
    elevation: 4,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: MODERN_PRIMARY },
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  cardListContainer: { gap: 16 },

  // --- BIG CARD STYLES ---
  cardContainer: { 
    backgroundColor: CARD_BG,
    borderRadius: 24, 
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, 
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ACCENT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextInfo: {
    flex: 1,
    marginLeft: 15,
  },
  cardNameText: {
    fontSize: 19,
    fontWeight: "800", 
    color: MODERN_PRIMARY,
  },
  idBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT_BLUE,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginBottom: 15,
  },
  cardBody: {
    paddingLeft: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoValueText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_GREY,
  },
  addressValueText: {
    fontSize: 14,
    color: TEXT_GREY,
    flex: 1,
    lineHeight: 20,
    fontWeight: '400',
  },
  loadingContainer: { marginTop: 100 },
  noCustomersText: { textAlign: "center", marginTop: 50, color: TEXT_GREY, fontSize: 16 },
});

export default RouteCustomerPigme;