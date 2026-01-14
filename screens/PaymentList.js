import React from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity, 
    StatusBar,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Added SafeAreaView
import { Ionicons } from "@expo/vector-icons"; // Updated to Ionicons
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome"; // Kept for FontAwesome icons if needed, but switching to Ionicons for new style

import COLORS from "../constants/color"; // Retained, though not heavily used
import Header from "../components/Header";

// --- DESIGN CONSTANTS COPIED from Routes.js ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for icons/left border)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
// ---------------------------------------------


// Custom Card Component styled to match Routes.js
const PaymentCard = ({ name, icon, onPress, disabled = false }) => ( // 1. Added disabled prop
  <TouchableOpacity 
    onPress={disabled ? null : onPress} // 2. Conditional onPress: null if disabled
    style={[
      styles.cardContainer, 
      disabled && styles.cardContainerDisabled // 3. Apply disabled container style
    ]} 
    activeOpacity={disabled ? 1 : 0.7} // 4. Disable active opacity change
    disabled={disabled} // 5. Use native disabled prop
  >
    <View style={styles.cardContent}>
      {/* Using Ionicons for consistency with the new design */}
      <Ionicons 
        name={icon} 
        style={[styles.cardIcon, disabled && styles.cardIconDisabled]} // 6. Apply disabled icon style
      /> 
      <View style={styles.textContainer}>
        <Text style={[styles.cardText, disabled && styles.cardTextDisabled]}>{name}</Text>
        <Text style={[styles.cardSubText, disabled && styles.cardSubTextDisabled]}>
          {/* Optional: Better message for disabled card */}
          {disabled ? "Payments temporarily unavailable" : "View Payment History"} 
        </Text>
      </View>
    </View>
    <Ionicons 
      name="chevron-forward-outline" 
      style={[styles.arrowIcon, disabled && styles.arrowIconDisabled]} // 7. Apply disabled arrow style
    />
  </TouchableOpacity>
);

const PaymentList = ({ route, navigation }) => {
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
              <Text style={styles.title}>Payments</Text>
              <Text style={styles.subtitle}>Select a payment type to continue</Text>
          </View>
      </LinearGradient>

      {/* Main Content Area (White Background) */}
      <View style={styles.mainContentArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.cardListContainer}>
            <PaymentCard
              name="Chits Payments"
              icon="cash-outline" // Modern Ionicons icon
              onPress={() =>
                navigation.navigate("ChitPayment", { user, areaId: "chits" })
              }
            />
            <PaymentCard
              name="Gold Chits Payments"
              icon="diamond-outline" // Modern Ionicons icon
              disabled={true} // *** MODIFICATION: Disable Gold Chits Payments ***
              onPress={() =>
                navigation.navigate("GoldPayment", { user, areaId: "gold-chits" })
              }
            />
            {/* NEW CARD: Loan Payments */}
            <PaymentCard
              name="Loan Payments"
              icon="wallet-outline" // Modern Ionicons icon
              onPress={() =>
                navigation.navigate("LoanPayments", { user, areaId: "loans" })
              }
            />
            {/* NEW CARD: Pigmy Payments */}
            <PaymentCard
              name="Pigme Payments"
              icon="trending-up-outline" // Modern Ionicons icon
              onPress={() =>
                navigation.navigate("PigmePayments", { user, areaId: "pigmy" })
              }
            />
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
    paddingBottom: 20,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY, // Light grey background for scroll area
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    marginTop: -20, // Creates the curved overlap effect
    paddingTop: 30, // Pushes content below the curve
  },
  headerSpacer: { 
    paddingTop: 20, 
    paddingBottom: 5 
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

  // --- CARD LIST STYLES (Copied from Routes.js) ---
  scrollContainer: { 
    paddingBottom: 50, 
    paddingTop: 10,
  },
  cardListContainer: {
    gap: 18, 
    alignItems: 'stretch', 
  },
  
  // --- CARD STYLES (Copied and Renamed from Routes.js) ---
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
    fontWeight: '800', 
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

  // *** NEW DISABLED STYLES (Grayed out) ***
  cardContainerDisabled: {
    backgroundColor: '#f1f1f1', // Light grey background
    borderColor: '#e0e0e0',
    borderLeftColor: '#b0b0b0', // Grey accent border
    shadowOpacity: 0, // Remove shadow for flat look
    elevation: 0,
  },
  cardIconDisabled: {
    color: '#b0b0b0', // Gray icon
  },
  cardTextDisabled: {
    color: '#888888', // Medium grey for title
    fontWeight: '600',
  },
  cardSubTextDisabled: {
    color: '#a0a0a0', // Lighter grey for subtitle
  },
  arrowIconDisabled: {
    color: '#c0c0c0', // Very light grey arrow
  },
});

export default PaymentList;