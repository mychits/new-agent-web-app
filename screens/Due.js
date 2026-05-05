import React from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; 
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color"; 
import Header from "../components/Header"; 

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

// Updated Custom Card Component with dynamic description
const CustomRouteCard = ({ name, description, icon, onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.cardContainer}
    activeOpacity={0.7}
  >
    <View style={styles.cardContent}>
      <Ionicons name={icon} style={styles.cardIcon} /> 
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>{description}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward-outline" style={styles.arrowIcon} />
  </TouchableOpacity>
);

const Due = ({ route, navigation }) => {
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

      {/* Main Content Area */}
      <View style={styles.mainContentArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.cardListContainer}>
            <CustomRouteCard
              name="Customer Collection Outstanding Report"
              description="Review pending dues and payment collections"
              icon="document-text-outline"
              onPress={() => navigation.navigate("OutstandingReports", { user })}
            />
            
            <CustomRouteCard
              name="Referral Customer Outstanding Report"
              description="Track status of all referred leads and customers"
              icon="share-social-outline"
              onPress={() => navigation.navigate("ReferredReport", { user })}
            />
            
            <CustomRouteCard
              name={`Group Outstanding Report`}
              description="Analyze manager-wise performance metrics"
              icon="people-outline"
              onPress={() => navigation.navigate("RelationshipManagerReport", { user })}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: TOP_GRADIENT[0] 
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20, 
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
  scrollContainer: { 
    paddingBottom: 50, 
    paddingTop: 10,
  },
  cardListContainer: {
    gap: 18, 
    alignItems: 'stretch',
  },
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
    fontSize: 15, 
    fontWeight: '800',
    color: MODERN_PRIMARY,
    textAlign: 'center'
  },
  cardSubText: {
    fontSize: 11,
    color: TEXT_GREY, 
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center'

  },
  cardIcon: {
    fontSize: 28, 
    color: ACCENT_BLUE,
  },
  arrowIcon: {
    fontSize: 22,
    color: TEXT_GREY,
    marginLeft: 10,
  },
});

export default Due;