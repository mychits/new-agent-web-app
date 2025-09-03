import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Sample data for demonstration purposes only
const sampleCustomers = [
  {
    id: "1",
    name: "John Doe",
    groupName: "Alpha Group",
    phoneNumber: "1234567890",
    email: "john.doe@example.com",
  },
  {
    id: "2",
    name: "Jane Smith",
    groupName: "Beta Group",
    phoneNumber: "0987654321",
    email: "jane.smith@example.com",
  },
  {
    id: "3",
    name: "Peter Jones",
    groupName: "Gamma Group",
    phoneNumber: "1122334455",
    email: "peter.jones@example.com",
  },
];

const CustomerOnHold = () => {
  const handleCall = (phoneNumber) => {
    console.log(`Calling ${phoneNumber}...`);
  };

  const handleEmail = (email) => {
    console.log(`Emailing ${email}...`);
  };

  const handleWhatsApp = (phoneNumber) => {
    console.log(`WhatsApping ${phoneNumber}...`);
  };

  const renderCustomerCard = (customer) => (
    <View key={customer.id} style={styles.card}>
      <Text style={styles.customerName}>{customer.name}</Text>
      <Text style={styles.groupName}>Group: {customer.groupName}</Text>
      <View style={styles.contactContainer}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleCall(customer.phoneNumber)}
        >
          <Ionicons name="call" size={24} color="#007bff" />
          <Text style={styles.contactText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleEmail(customer.email)}
        >
          <Ionicons name="mail" size={24} color="#dc3545" />
          <Text style={styles.contactText}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleWhatsApp(customer.phoneNumber)}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          <Text style={styles.contactText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#dbf6faff", "#90dafcff"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.mainContentArea}>
          <Header />
          <Text style={styles.screenTitle}>Customer On Hold</Text>
          <Text style={styles.instructionText}>
            Please initiate contact to follow up on their hold status.
          </Text>
          <ScrollView contentContainerStyle={styles.cardsScrollViewContent}>
            {sampleCustomers.map(renderCustomerCard)}
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
  },
  mainContentArea: {
    flex: 1,
    paddingHorizontal: 22,
    marginTop: 10, 
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 5,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 16,
    color: "#777",
    marginBottom: 20,
    textAlign: "center",
  },
  cardsScrollViewContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 5,
  },
  groupName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  contactContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  contactButton: {
    alignItems: "center",
  },
  contactText: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: "600",
  },
});

export default CustomerOnHold;