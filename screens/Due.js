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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // Use Ionicons for a modern look
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color"; // Keeping existing import
import Header from "../components/Header"; // Keeping existing import

// --- DESIGN CONSTANTS FROM Enrollment.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (status/chip)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area


// Custom Card Component styled to match Enrollment.js
const CustomRouteCard = ({ name, icon, onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.cardContainer}
    activeOpacity={0.7}
  >
    <View style={styles.cardContent}>
      {/* Updated to Ionicons for consistency and a modern feel */}
      <Ionicons name={icon} style={styles.cardIcon} /> 
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>View detailed report</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward-outline" style={styles.arrowIcon} />
  </TouchableOpacity>
);

const Due = ({ route, navigation }) => {
  // Defensive destructuring remains in place 
  const { user } = route.params || {}; 

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header Section with Gradient */}
      <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
          <View style={styles.headerSpacer}>
              <Header />
          </View>

          <View style={styles.titleContainer}>
              <Text style={styles.title}>Outstanding Reports</Text>
              <Text style={styles.subtitle}>
                  Select a report type to view outstanding data
              </Text>
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
              name="Collection Report"
              icon="document-text-outline" // Modern Ionicons
              onPress={() => navigation.navigate("OutstandingReports", { user })}
            />
            <CustomRouteCard
              name="Referred Report"
              icon="share-social-outline" // Modern Ionicons
              onPress={() => navigation.navigate("ReferredReport", { user })}
            />
            <CustomRouteCard
              name={`Relationship Manager\nReport`}
              icon="people-outline" // Modern Ionicons
              onPress={() => navigation.navigate("RelationshipManagerReport", { user })}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- LAYOUT STYLES (from Enrollment.js) ---
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
    paddingTop: 20, 
    paddingBottom: 5 
  }, 

  // --- TITLE STYLES (from Enrollment.js) ---
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

  // --- CARD LIST STYLES ---
  scrollContainer: { 
    paddingBottom: 50, // Reduced padding
    paddingTop: 10,
  },
  cardListContainer: {
    gap: 18, // Gap matches the marginBottom of Enrollment cards
    alignItems: 'stretch', // Fill the container width
  },
  
  // --- CARD STYLES (Styled like cardContainer from Enrollment.js) ---
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 18, 
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Modern shadow from Enrollment.js
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, 
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    // Accent border kept but made subtle
    borderLeftWidth: 5,
    borderLeftColor: ACCENT_BLUE, // Using the accent blue color
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
    fontSize: 18, // Slightly larger
    fontWeight: '800',
    color: MODERN_PRIMARY, // Dark text
  },
  cardSubText: {
    fontSize: 14,
    color: TEXT_GREY, // Grey text
    marginTop: 2,
    fontWeight: '500',
  },
  cardIcon: {
    fontSize: 28, // Larger icon
    color: ACCENT_BLUE, // Blue accent color
  },
  arrowIcon: {
    fontSize: 24,
    color: TEXT_GREY,
    marginLeft: 10,
  },
});

export default Due;