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
// Changed to Ionicons for consistency
import { Ionicons } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context"; // Added SafeAreaView
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

// --- DESIGN CONSTANTS COPIED FROM Routes.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for icons/left border)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
// ---------------------------------------------


const CustomerCard = ({ name, phone, customerId, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.cardContainer} activeOpacity={0.7}>
    <View style={styles.cardContent}>
      {/* Updated to Ionicons for consistency */}
      <Ionicons name="person-circle-outline" style={styles.cardIcon} /> 
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>Phone: {phone}</Text>
        <Text style={styles.cardSubText}>Customer ID: {customerId}</Text>
      </View>
    </View>
    {/* Updated to Ionicons for consistency */}
    <Ionicons name="chevron-forward-outline" style={styles.arrowIcon} /> 
  </TouchableOpacity>
);

// --- RouteCustomer Component ---
const RouteCustomer = ({ route, navigation }) => {
  const { user } = route.params;

  const [search, setSearch] = useState("");
  const [agent, setAgent] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Employee (Agent) ID
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await axios.get(`${baseUrl}/agent/get-employee`);
        setAgent(response?.data?.employee);
      } catch (error) {
        console.error("unable to get agent id");
      }
    };
    fetchEmployee();
  }, []);

  // Fetch Customers for the Agent
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!agent || agent.length === 0) return;

      try {
        setLoading(true);

        const agentId = user.userId;
        if (!agentId) return;

        const response = await axios.get(
          `${baseUrl}/user/collection-area/agent/${agentId}`
        );
        console.info(response.data, "Customer data fetched");

        if (Array.isArray(response.data)) {
          setCustomers(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
          setCustomers([]);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [agent]);

  // Filtering Logic
  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer) =>
        customer.full_name?.toLowerCase().includes(search.toLowerCase())
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
            <Text style={styles.title}>Chit Customers</Text>
            <Text style={styles.subtitle}>Manage customer accounts</Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
            {/* Updated to Ionicons for consistency */}
            <Ionicons
              name="search-outline"
              size={20}
              color={TEXT_GREY}
              style={styles.searchIcon}
            />
            <TextInput
              value={search}
              onChangeText={(text) => setSearch(text)}
              placeholder="Search chit customers..."
              placeholderTextColor={TEXT_GREY}
              style={styles.searchInput}
            />
        </View>

      </LinearGradient>

      {/* Main Content Area (Light Background with Rounded Corners) */}
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
                          filteredCustomers.map((customer, index) => (
                              <CustomerCard
                                  key={index}
                                  name={customer.full_name}
                                  phone={customer.phone_number}
                                  customerId={customer.customer_id}
                                  onPress={() =>
                                      navigation.navigate("Payin", { customer: customer._id })
                                  }
                              />
                          ))
                      ) : (
                          <Text style={styles.noCustomersText}>No customers found.</Text>
                      )}
                  </>
              )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- LAYOUT STYLES (Copied from Routes.js) ---
  safeArea: { 
    flex: 1, 
    backgroundColor: TOP_GRADIENT[0] 
  },
  topContainer: {
    paddingHorizontal: 16,
    // Increased paddingBottom to create space between the search bar and the content area
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
  headerSpacer: { 
    paddingTop: 20, 
    paddingBottom: 5 
  }, 
  loadingContainer: { 
    paddingTop: 20 
  },

  // --- TITLE STYLES (Copied from Routes.js) ---
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28, 
    fontWeight: "900",
    color: CARD_BG, // White text
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)', 
    fontWeight: '500',
    textAlign: 'center',
  },

  // --- SEARCH BAR STYLES (Redesigned) ---
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG, // White background
    borderRadius: 12, // Slightly smaller border radius
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    color: MODERN_PRIMARY,
  },
  
  // --- CARD LIST STYLES (Copied from Routes.js) ---
  scrollContainer: { 
    paddingBottom: 50, 
    paddingTop: 10,
  },
  cardListContainer: {
    gap: 18, 
    alignItems: 'stretch', 
  },

  // --- CARD STYLES (Copied from Routes.js and modified) ---
  cardContainer: { 
    backgroundColor: CARD_BG,
    borderRadius: 18, 
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Modern shadow
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, 
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    // Accent border
    borderLeftWidth: 5,
    borderLeftColor: ACCENT_BLUE, // Used ACCENT_BLUE for consistency
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
    color: MODERN_PRIMARY, // Dark text
  },
  cardSubText: {
    fontSize: 14,
    color: TEXT_GREY, // Grey subtext
    marginTop: 2,
    fontWeight: '500', 
  },
  cardIcon: {
    fontSize: 32,
    color: ACCENT_BLUE, // Blue icon color
  },
  arrowIcon: {
    fontSize: 24, 
    color: TEXT_GREY, // Grey arrow color
    marginLeft: 10,
  },
  noCustomersText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: TEXT_GREY,
  },
});

export default RouteCustomer;