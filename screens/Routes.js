import React from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity,
    StatusBar,
    Platform,
} from "react-native";
// Import Ionicons for modern icons and SafeAreaView for layout
import { Ionicons } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header"; 

// --- DESIGN CONSTANTS COPIED FROM Due.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for icons/left border)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
// ---------------------------------------------

// Custom Card Component styled to match Due.js
const CustomRouteCard = ({ name, icon, onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.cardContainer} // Renamed for consistency
    activeOpacity={0.7}
  >
    <View style={styles.cardContent}>
      {/* Updated to Ionicons for consistency and a modern feel */}
      <Ionicons name={icon} style={styles.cardIcon} /> 
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>View Customer List</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward-outline" style={styles.arrowIcon} /> 
  </TouchableOpacity>
);

const Routes = ({ route, navigation }) => {
  const { user } = route.params;

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
              <Text style={styles.title}>Customers</Text>
              <Text style={styles.subtitle}>Select a customer category to continue</Text>
          </View>
      </LinearGradient>

      {/* Main Content Area (White Background) */}
      <View style={styles.mainContentArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.cardListContainer}>
            <CustomRouteCard
              name="Chits Customer"
              icon="people-outline" // Updated icon to Ionicons
              onPress={() => navigation.navigate("RouteCustomerChit", { user, areaId: "chits" })}
            />
            <CustomRouteCard
              name="Gold Chits Customer"
              icon="star-outline" // Updated icon to Ionicons
              // onPress={() => navigation.navigate("RouteCustomerGold", { user, areaId: "gold-chits" })}
            />
            <CustomRouteCard
              name="Loan Customer"
              icon="wallet-outline" // Updated icon to Ionicons
              onPress={() => navigation.navigate("RouteCustomerLoan", { user, areaId: "loan-customer" })}
            />
            <CustomRouteCard
              name="Pigmy Customer"
              icon="trending-up-outline" // Updated icon to Ionicons
              onPress={() => navigation.navigate("RouteCustomerPigme", { user, areaId: "Pigme-customer" })}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- LAYOUT STYLES (from Due.js) ---
  safeArea: { 
    flex: 1, 
    backgroundColor: TOP_GRADIENT[0] 
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    paddingTop: 20, // Adjusted padding
    paddingBottom: 5 
  }, 

  // --- TITLE STYLES (from Due.js) ---
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

  // --- CARD LIST STYLES (from Due.js) ---
  scrollContainer: { 
    paddingBottom: 50, 
    paddingTop: 10,
  },
  cardListContainer: {
    gap: 18, 
    alignItems: 'stretch', 
  },
  
  // --- CARD STYLES (from Due.js) ---
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
    borderLeftColor: ACCENT_BLUE, 
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  textContainer: {
    marginLeft: 15,
    flexShrink: 1,
  },
  cardText: {
    fontSize: 18, 
    fontWeight: '800', // Used 800 for consistency with Due.js card text
    color: MODERN_PRIMARY, 
  },
  cardSubText: {
    fontSize: 14,
    color: TEXT_GREY, 
    marginTop: 2,
    fontWeight: '500',
  },
  cardIcon: {
    fontSize: 28, 
    color: ACCENT_BLUE, 
  },
  arrowIcon: {
    fontSize: 24,
    color: TEXT_GREY,
    marginLeft: 10,
  },
});

export default Routes;