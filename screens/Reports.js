import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity, 
    Platform 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ Re-added SafeAreaView
import { Ionicons } from "@expo/vector-icons"; // 🔄 Switched to Ionicons
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color"; 
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

// --- DESIGN CONSTANTS COPIED from PaymentList.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for icons/left border)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
// ---------------------------------------------


// Custom Card Component styled to match PaymentList.js
const CustomReportCard = ({ name, icon, onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.cardContainer} 
    activeOpacity={0.7}
  >
    <View style={styles.cardContent}>
      <Ionicons 
        name={icon} // 🔄 Ionicons name
        style={styles.cardIcon}
      /> 
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>View Full Report</Text>
      </View>
    </View>
    <Ionicons 
      name="chevron-forward-outline" // 🔄 Ionicons arrow
      style={styles.arrowIcon}
    />
  </TouchableOpacity>
);

const Reports = ({ route, navigation }) => {
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
              <Text style={styles.title}>Reports</Text>
              <Text style={styles.subtitle}>Select a Report type to continue</Text>
          </View>
      </LinearGradient>

      {/* Main Content Area (Curved overlap effect) */}
      <View style={styles.mainContentArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer} 
        >
          <View style={styles.cardListContainer}>
            <CustomReportCard
              key="chits-card"
              name="Chits Report"
              icon="stats-chart-outline" 
              onPress={() => navigation.navigate("ChitPayment", { user: user, areaId: "chits" })}
            />
            <CustomReportCard
              key="gold-chits-card"
              name="Gold Report"
              icon="bar-chart-outline" 
              // onPress={() => navigation.navigate("GoldPayment", { user: user, areaId: "gold-chits" })}
            />
            <CustomReportCard
              key="loan-chits-card"
              name="Loan Report"
              icon="wallet-outline" 
              onPress={() => navigation.navigate("LoanPayments", { user: user, areaId: "loan-chits" })}
            />
            <CustomReportCard
              key="pigme-chits-card"
              name="Pigme Report"
              icon="trending-up-outline" 
              onPress={() => navigation.navigate("PigmePayments", { user: user, areaId: "pigme-chits" })}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// --- STYLES COPIED AND ADJUSTED from PaymentList.js ---
const styles = StyleSheet.create({
    // --- LAYOUT STYLES ---
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
        marginTop: -20, // Creates the curved overlap effect
        paddingTop: 30, 
    },
    headerSpacer: { 
        paddingTop: 20, 
        paddingBottom: 5 
    }, 
  
    // --- TITLE STYLES ---
    titleContainer: {
      alignItems: 'center',
      marginBottom: 15,
    },
    title: {
      fontSize: 28, 
      fontWeight: "900",
      color: CARD_BG, 
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
      paddingBottom: 50, 
      paddingTop: 10,
    },
    cardListContainer: {
      gap: 18, 
      alignItems: 'stretch', 
    },
    
    // --- CARD STYLES ---
    cardContainer: {
      backgroundColor: CARD_BG,
      borderRadius: 18, 
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: MODERN_PRIMARY,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05, 
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: BORDER_COLOR,
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
  });

export default Reports;