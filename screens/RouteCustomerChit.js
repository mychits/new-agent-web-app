import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

const RouteCustomer = ({ route, navigation }) => {
  const { user } = route.params;

  const [search, setSearch] = useState("");
  const [agent, setAgent] = useState([]);
  const [customers, setCustomers] = useState([]);
  // FIX: Initialize loading to true so the ActivityIndicator shows immediately.
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // This is fetching employee data. It should probably set its own loading state 
    // or be merged into the customer fetch if it's a prerequisite.
    // For now, leaving it as is, but noting the dependency flow:
    // 1. fetchEmployee runs and updates `agent`.
    // 2. The second useEffect runs because `agent` changed.
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
      // The initial `loading` state handles the first render, but we need
      // to ensure we set it to true again *before* this fetch runs if it's
      // triggered by a dependency change (like `agent` being updated).
      // However, since `agent` is fetched once, this logic is fine for now.
      if (!agent || agent.length === 0) return;

      try {
        setLoading(true); // Ensure loading is true right before fetching

        const agentId = user.userId;
        if (!agentId) return;

        const response = await axios.get(`${baseUrl}/user/collection-area/agent/${agentId}`);
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
        setLoading(false); // Set to false regardless of success or failure
      }
    };

    fetchCustomers();
  }, [agent]); // Runs when 'agent' changes (after the first useEffect completes)

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer) =>
        customer.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <LinearGradient
        colors={['#dbf6faff', '#90dafcff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={{ flex: 1, marginHorizontal: 22, marginTop: 12 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Chit Customers</Text>
            <Text style={styles.subtitle}>Manage customer accounts</Text>
          </View>
          <View style={styles.searchContainer}>
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
          {/* Display logic is correct: show loader while loading, 
              then show data or "No customers found" when loading is complete. */}
          {loading ? (
            <View style={{ marginTop: 30, alignItems: "center" }}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  titleContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 20,
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    borderColor: '#da8201',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 15,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  cardIcon: {
    fontSize: 32,
    color: '#da8201',
  },
  arrowIcon: {
    fontSize: 22,
    color: '#da8201',
  },
  noCustomersText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  }
});

export default RouteCustomer;