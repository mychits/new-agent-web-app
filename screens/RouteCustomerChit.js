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
import Icon from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

const CustomerCard = ({ name, phone, customerId, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.card}>
    <View style={styles.cardContent}>
      <Icon name="user-circle" style={styles.cardIcon} />
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>Phone: {phone}</Text>
        <Text style={styles.cardSubText}>Customer ID: {customerId}</Text>
      </View>
    </View>
    <Icon name="arrow-right" style={styles.arrowIcon} />
  </TouchableOpacity>
);

// --- RouteCustomer Component (FIXED) ---
const RouteCustomer = ({ route, navigation }) => {
  const { user } = route.params;

  const [search, setSearch] = useState("");
  const [agent, setAgent] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ... (useEffect for fetchEmployee - No Change) ...
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

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer) =>
        customer.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Apply a base horizontal margin to the main content area
  const contentHorizontalMargin = 22;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <LinearGradient
        colors={["#b6e4ebff", "#1796d1ff"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Fixed Top Content (Header, Title, Search) */}
        <View
          style={{
            // Use a slightly different padding approach for fixed header
            paddingTop: Platform.OS === "android" ? 40 : 60,
            paddingHorizontal: contentHorizontalMargin,
            paddingBottom: 20, // Add space below search bar before scroll
          }}
        >
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Chit Customers</Text>
            <Text style={styles.subtitle}>Manage customer accounts</Text>
          </View>
          <View style={styles.searchContainerFixed}>
            <Icon
              name="search"
              size={20}
              color="#888"
              style={styles.searchIcon}
            />
            <TextInput
              value={search}
              onChangeText={(text) => setSearch(text)}
              placeholder="Search chit customers..."
              placeholderTextColor="#888"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Scrollable Customer List */}
        <ScrollView
          style={{ flex: 1 }} // Take remaining vertical space
          contentContainerStyle={{
            paddingBottom: 80,
            paddingHorizontal: contentHorizontalMargin, // Apply horizontal padding here
          }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#da8201" />
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
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  // The main container for the fixed top content will handle the padding
  titleContainer: {
    marginTop: 10, // Reduced margin since main padding is applied to the wrapper
    marginBottom: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  // NEW style for the search container when it's fixed
  searchContainerFixed: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    // Removed marginBottom: 20 to adjust spacing in the fixed container
  },
  searchIcon: {
    marginLeft: 5,
  },
  searchInput: {
    flex: 1,
    padding: 5,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  // ... (Rest of the styles: card, cardContent, textContainer, etc. - No Change) ...
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 5,
    borderColor: "#da8201",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 20,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 15,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubText: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  cardIcon: {
    fontSize: 32,
    color: "#da8201",
  },
  arrowIcon: {
    fontSize: 22,
    color: "#da8201",
  },
  noCustomersText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
});

export default RouteCustomer;
