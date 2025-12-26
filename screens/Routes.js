import React from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header"; 

const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

// Updated Card Component with "special" styling logic
const CustomRouteCard = ({ name, icon, onPress, subText, special }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[styles.cardContainer, special && styles.specialCardContainer]} 
    activeOpacity={0.7}
  >
    {special && (
      <LinearGradient 
        colors={['#1e293b', '#334155']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }} 
        style={StyleSheet.absoluteFill} 
      />
    )}
    
    <View style={styles.cardContent}>
      <Ionicons 
        name={icon} 
        style={[styles.cardIcon, special && styles.specialCardIcon]} 
      /> 
      <View style={styles.textContainer}>
        <Text style={[styles.cardText, special && styles.specialCardText]}>{name}</Text>
        <Text style={[styles.cardSubText, special && styles.specialCardSubText]}>
          {subText || "View Customer List"}
        </Text>
      </View>
    </View>

    {special ? (
      <View style={styles.actionBadge}>
        <Text style={styles.actionBadgeText}>SEND</Text>
        <Ionicons name="send" size={12} color="#fff" />
      </View>
    ) : (
      <Ionicons name="chevron-forward-outline" style={styles.arrowIcon} />
    )}
  </TouchableOpacity>
);

const Routes = ({ route, navigation }) => {
  const { user } = route.params;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
          <View style={styles.headerSpacer}><Header /></View>
          <View style={styles.titleContainer}>
              <Text style={styles.title}>Customers</Text>
              <Text style={styles.subtitle}>Select a customer category to continue</Text>
          </View>
      </LinearGradient>

      <View style={styles.mainContentArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.cardListContainer}>
            <CustomRouteCard
              name="Chits Customer"
              icon="people-outline"
              onPress={() => navigation.navigate("RouteCustomerChit", { user, areaId: "chits" })}
            />
            <CustomRouteCard
              name="Gold Chits Customer"
              icon="star-outline"
            />
            <CustomRouteCard
              name="Loan Customer"
              icon="wallet-outline"
              onPress={() => navigation.navigate("RouteCustomerLoan", { user, areaId: "loan-customer" })}
            />
            <CustomRouteCard
              name="Pigmy Customer"
              icon="trending-up-outline"
              onPress={() => navigation.navigate("RouteCustomerPigme", { user, areaId: "Pigme-customer" })}
            />

            {/* --- SPECIALLY STYLED PAYMENT LINK CARD --- */}
            <CustomRouteCard
              name="Payment Link"
              icon="flash-outline"
              subText="Generate & Share Links"
              special={true}
              onPress={() => navigation.navigate("PaymentLinkRoutes")}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  topContainer: { paddingHorizontal: 16, paddingBottom: 20, elevation: 3 },
  mainContentArea: { flex: 1, backgroundColor: SUBTLE_BG_GREY, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 16, marginTop: -20, paddingTop: 30 },
  headerSpacer: { paddingTop: 20, paddingBottom: 5 }, 
  titleContainer: { alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: "900", color: CARD_BG, marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500', textAlign: 'center' },
  scrollContainer: { paddingBottom: 50, paddingTop: 10 },
  cardListContainer: { gap: 18, alignItems: 'stretch' },
  
  // Normal Card Style
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 18, 
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderLeftWidth: 5,
    borderLeftColor: ACCENT_BLUE,
    overflow: 'hidden', // Required for gradient background
  },

  // --- SPECIAL PAYMENT LINK CARD CSS ---
  specialCardContainer: {
    borderLeftWidth: 0, // Remove the blue border for the special card
    borderWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  specialCardText: {
    color: '#fff',
    fontSize: 20,
  },
  specialCardSubText: {
    color: 'rgba(255,255,255,0.7)',
  },
  specialCardIcon: {
    color: '#fbbf24', // Gold/Amber icon color
    fontSize: 32,
  },
  actionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  // -------------------------------------

  cardContent: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  textContainer: { marginLeft: 15, flexShrink: 1 },
  cardText: { fontSize: 18, fontWeight: '800', color: MODERN_PRIMARY },
  cardSubText: { fontSize: 14, color: TEXT_GREY, marginTop: 2, fontWeight: '500' },
  cardIcon: { fontSize: 28, color: ACCENT_BLUE },
  arrowIcon: { fontSize: 24, color: TEXT_GREY, marginLeft: 10 },
});

export default Routes;