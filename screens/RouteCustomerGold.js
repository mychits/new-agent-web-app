import { View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity,SafeAreaView } from "react-native";
import React, { useState, useEffect } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

import axios from "axios";

// CustomerCard component remains the same
const CustomerCard = ({ name, phone, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.card}>
    <View style={styles.cardContent}>
      <Icon name="user-circle" style={styles.cardIcon} />
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>Phone: {phone}</Text>
      </View>
    </View>
    <Icon name="arrow-right" style={styles.arrowIcon} />
  </TouchableOpacity>
);


const RouteCustomerGold = ({ route, navigation }) => {
  const { user, areaId } = route.params;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        const response = await axios.get(
          // NOTE: It's best practice to use the baseUrl constant instead of a hardcoded IP
          `http://13.51.87.99:3000/api/user/get-user`
        );
        if (response.data) {
          setCustomers(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false)
      }
    };

    fetchCustomers();
  }, []);

  return (
    // REMOVED SafeAreaView and its background color
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#1aa2ccff", "#1aa2ccff"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={{ flex: 1, marginHorizontal: 22, marginTop: 40 }} // Increased marginTop to push content down
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Gold Customers</Text>
            <Text style={styles.subtitle}>Manage gold accounts</Text>
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
              placeholder="Search gold customers..."
              placeholderTextColor="#888"
              style={styles.searchInput}
            />
          </View>
          {
            loading ? (
              <View style={{ marginTop: 30, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#f8c009ff" />
              </View>
            ) : (
              <>
                {Array.isArray(customers) &&
                  customers
                    .filter((customer) =>
                      customer.full_name?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((customer, index) => (
                      <CustomerCard
                        key={index}
                        name={customer.full_name}
                        phone={customer.phone_number}
                        onPress={() =>
                          navigation.navigate("GoldPayin", { customer: customer._id })
                        }
                      />
                    ))}
              </>
            )
          }
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

// Styles remain the same, as they were not directly affected by the structural change
const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  titleContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
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
  // Styles for the new CustomerCard component
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    borderColor: '#f8c009ff',
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
    color: '#f8c009ff',
  },
  arrowIcon: {
    fontSize: 22,
    color: '#f8c009ff',
  },
});

export default RouteCustomerGold;