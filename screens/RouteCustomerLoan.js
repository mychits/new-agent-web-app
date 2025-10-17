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

const RouteCustomerLoan = ({ route, navigation }) => {
  const { user, areaId } = route.params;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLoanCustomers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/loans/get-all-borrowers`);

        if (response.data) {
          setCustomers(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanCustomers();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <LinearGradient
       colors={['#b6e4ebff', '#1796d1ff']}
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
            <Text style={styles.title}>Loan Customers</Text>
            <Text style={styles.subtitle}>Manage Loan accounts</Text>
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
              placeholder="Search Loan customers..."
              placeholderTextColor="#888"
              style={styles.searchInput}
            />
          </View>
          {loading ? (
            <View style={{ marginTop: 30, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#da8201" />
            </View>
          ) : (
            <>
              {Array.isArray(customers) &&
                customers
                  .filter((customer) =>
                    customer.borrower?.full_name
                      ?.toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((customer, index) => (
                    <CustomerCard
                      key={index}
                      name={customer.borrower.full_name}
                      phone={customer.borrower.phone_number}
                      onPress={() =>
                        navigation.navigate("LoanPayin", {
                          customer: customer?.borrower?._id,
                          loan_id: customer._id,
                          custom_loan_id: customer.loan_id,
                        })
                      }
                    />
                  ))}
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
  searchContainer: {
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
});

export default RouteCustomerLoan;
