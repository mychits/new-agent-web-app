import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../constants/color";
import Header from "../components/Header";

// Custom Card Component with a more attractive, balanced layout
const CustomRouteCard = ({ name, icon, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.card}>
    <View style={styles.cardContent}>
      <Icon name={icon} style={styles.cardIcon} />
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>View Customer List</Text>
      </View>
    </View>
    <Icon name="arrow-right" style={styles.arrowIcon} />
  </TouchableOpacity>
);

const Routes = ({ route, navigation }) => {
  const { user } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#1aa2ccff", "#1aa2ccff"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          // Removed marginTop: 12 from ScrollView style
          style={{ flex: 1, marginHorizontal: 22 }}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Added marginTop to the Header container to push it down */}
          <View style={styles.headerSpacer}>
            <Header />
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Customers</Text>
            <Text style={styles.subtitle}>Select a customer type to continue</Text>
          </View>
          <View style={styles.cardListContainer}>
            <CustomRouteCard
              name="Chits Customer"
              icon="users"
              onPress={() => navigation.navigate("RouteCustomerChit", { user, areaId: "chits" })}
            />
            <CustomRouteCard
              name="Gold Chits Customer"
              // icon="diamond"
              // onPress={() => navigation.navigate("RouteCustomerGold", { user, areaId: "gold-chits" })}
            />
            <CustomRouteCard
              name="Loan Customer"
              icon="money"
              onPress={() => navigation.navigate("RouteCustomerLoan", { user, areaId: "loan-customer" })}
            />
            <CustomRouteCard
              name="Pigmy Customer"
              icon="credit-card"
              onPress={() => navigation.navigate("RouteCustomerPigme", { user, areaId: "Pigme-customer" })}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  // New style to add space above the Header
  headerSpacer: {
    marginTop: 50, // You can adjust this value to control how far down the header is pushed
  },
  titleContainer: {
    marginTop: 40, // Increased top margin for more breathing room
    marginBottom: 2,
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
  cardListContainer: {
    marginTop: 15,
    gap: 20, // Increased gap for better spacing between cards
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15, // Increased border radius for a softer, modern look
    padding: 20,
    width: '90%', // Using percentage width for better responsiveness on different screen sizes
    flexDirection: 'row', // Changed to row layout for a sleek horizontal design
    alignItems: 'center',
    justifyContent: 'space-between', // Distributes content and arrow evenly
    borderLeftWidth: 5, // Added a prominent left border for a stylish accent
    borderColor: '#f8c009ff', // Gold color for the accent border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, // Deeper shadow for a "floating" effect
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 15,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  cardIcon: {
    fontSize: 25, // Increased icon size for more visual impact
    color: '#f8c009ff', // Gold color for consistency
  },
  arrowIcon: {
    fontSize: 22, // Adjusted size to fit the new card design
    color: '#f8c009ff',
  },
});

export default Routes;