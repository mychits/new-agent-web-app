import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Platform, 
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
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for icons/left border)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
// ---------------------------------------------


// MODIFIED: Reordered the display of pigmeId to be after the phone number
const CustomerCard = ({ name, pigmeId, phone, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.cardContainer} activeOpacity={0.7}>
    <View style={styles.cardContent}>
      <Ionicons name="person-circle-outline" style={styles.cardIcon} /> 
      <View style={styles.textContainer}>
        
        {/* Customer Name remains on top */}
        <Text style={styles.cardText}>{name}</Text>
        
        {/* Phone Number is next */}
        <Text style={styles.cardSubText}>Phone: {phone}</Text>
        
        {/* Pigmy ID is now placed after the phone number */}
        <Text style={styles.cardPigmyId}>Pigmy ID: {pigmeId || 'N/A'}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward-outline" style={styles.arrowIcon} /> 
  </TouchableOpacity>
);


const RouteCustomerPigme = ({ route, navigation }) => {
  const { user, areaId } = route.params; 

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    
    const fetchPigmeCustomers = async () => {
      try {
        setLoading(true);
        // API call to fetch Pigme customers for the specific referrerId
        const response = await axios.get(
          `${baseUrl}/pigme?referrerId=${user?.userId}`
        );
        if (response?.data?.data) {
          setCustomers(response?.data?.data);
        } else {
          console.error("Unexpected API response format:", response?.data?.data);
          setCustomers([]);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPigmeCustomers();
  }, [user?.userId]);

  // Filtering Logic
  const filteredCustomers = Array.isArray(customers)
    ? customers.filter(
        (item) =>
          item.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          item.pigme_id?.toLowerCase().includes(search.toLowerCase()) || 
          ""
      )
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header Section with Gradient */}
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
            <Text style={styles.subtitle}>Manage Pigmy accounts</Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={TEXT_GREY}
              style={styles.searchIcon}
            />
            <TextInput
              value={search}
              onChangeText={(text) => setSearch(text)}
              placeholder="Search by Name or Pigmy ID..."
              placeholderTextColor={TEXT_GREY}
              style={styles.searchInput}
            />
        </View>

      </LinearGradient>
      
      {/* Main Content Area */}
      <View style={styles.mainContentArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.cardListContainer}>
              {loading ? (
                  <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={ACCENT_BLUE} />
                  </View>
              ) : (
                  <>
                      {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((item, index) => (
                              <CustomerCard
                                  key={item._id || index}
                                  pigmeId={item.pigme_id || 'N/A'}
                                  name={item.customer?.full_name || "Unknown Customer"}
                                  phone={item.customer?.phone_number || "N/A"}
                                  onPress={() => {
                                     const customId = item?.pigme_id;
                                     // Navigate to the payment screen with necessary IDs
                                     navigation.navigate("PigmePayin", {
                                         user,
                                         customer: item?.customer?._id, // Customer MongoDB ID
                                         pigme_id: item?._id, // Pigme Document MongoDB ID
                                         custom_pigme_id: customId || 'ID Not Available', // Human-readable PGxx ID
                                     });
                                  }}
                              />
                          ))
                      ) : (
                          <Text style={styles.noCustomersText}>No pigmy customers found.</Text>
                      )}
                  </>
              )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// --- STYLE SHEET ---
const styles = StyleSheet.create({
  // --- LAYOUT STYLES ---
  safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  topContainer: {
    paddingHorizontal: 16,
    paddingBottom: 35, 
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    marginTop: -20, 
    paddingTop: 30,
  },
  headerSpacer: { paddingTop: 20, paddingBottom: 5 }, 
  loadingContainer: { paddingTop: 40, alignItems: 'center',},
  titleContainer: { alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: "900", color: CARD_BG, marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500', textAlign: 'center' },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 12, 
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, padding: 0, fontSize: 16, color: MODERN_PRIMARY },
  scrollContainer: { paddingBottom: 50, paddingTop: 10 },
  cardListContainer: { gap: 18, alignItems: 'stretch' },
  
  // --- CARD STYLES ---
  cardContainer: { 
    backgroundColor: CARD_BG,
    borderRadius: 18, 
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, 
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderLeftWidth: 5,
    borderLeftColor: ACCENT_BLUE, 
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 15,
    flexShrink: 1, 
  },
  cardText: {
    fontSize: 18,
    fontWeight: "800", 
    color: MODERN_PRIMARY, 
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 14,
    color: TEXT_GREY, 
    fontWeight: '500', 
    marginBottom: 2,
  },
  // NEW STYLE: For the Pigmy ID 
  cardPigmyId: {
    fontSize: 14,
    fontWeight: "600",
    color: ACCENT_BLUE, // Highlight the ID
    marginTop: 2,
  },
  cardIcon: {
    fontSize: 32,
    color: ACCENT_BLUE, 
  },
  arrowIcon: {
    fontSize: 24, 
    color: TEXT_GREY, 
    marginLeft: 10,
  },
  noCustomersText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: TEXT_GREY,
  },
});

export default RouteCustomerPigme;