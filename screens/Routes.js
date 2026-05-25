import React from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header"; 

const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

const CustomRouteCard = ({ name, icon, onPress, subText, special, isPayment }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[
      styles.cardContainer, 
      special && styles.specialCardContainer,
      isPayment && styles.paymentLinkCard
    ]} 
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
      {/* Icon Wrapper: Circular for payment, standard for others */}
      <View style={[styles.iconWrapper, isPayment && styles.paymentIconCircle]}>
        <Ionicons 
          name={icon} 
          style={[
            styles.cardIcon, 
            special && styles.specialCardIcon,
            isPayment && { color: '#fff', fontSize: 20 } // Reduced size
          ]} 
        /> 
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.cardText, special && styles.specialCardText]}>{name}</Text>
        <Text style={[styles.cardSubText, special && styles.specialCardSubText]}>
          {subText || "View Customers List"}
        </Text>
      </View>
    </View>

    {special ? (
      <View style={styles.actionBadge}>
        <Text style={styles.actionBadgeText}>SEND</Text>
        <Ionicons name="send" size={12} color="#fff" />
      </View>
    ) : (
      <Ionicons 
        name={isPayment ? "arrow-forward-circle" : "chevron-forward-outline"} 
        style={[styles.arrowIcon, isPayment && { color: ACCENT_BLUE, fontSize: 26 }]} // Reduced size
      />
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
              name="Chits Customers"
              icon="people-outline"
              onPress={() => navigation.navigate("RouteCustomerChit", { user, areaId: "chits" })}
            />
           
            <CustomRouteCard
              name="Loan Customers"
              icon="wallet-outline"
              onPress={() => navigation.navigate("RouteCustomerLoan", { user, areaId: "loan-customer" })}
            />
            <CustomRouteCard
              name="Pigmy Customers"
              icon="trending-up-outline"
              onPress={() => navigation.navigate("RouteCustomerPigme", { user, areaId: "Pigme-customer" })}
            />

            {/* --- DIFFERENT STYLED PAYMENT LINK CARD --- */}
            <CustomRouteCard
              name="Payment Link"
              icon="flash"
              subText="Generate & Share Links"
              onPress={() => navigation.navigate("PaymentLinkRoutes")}
              isPayment={true}
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
  mainContentArea: { 
    flex: 1, 
    backgroundColor: SUBTLE_BG_GREY, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 16, 
    marginTop: -20, 
    paddingTop: 25 
  },
  headerSpacer: { paddingTop: 20, paddingBottom: 5 }, 
  titleContainer: { alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 26, fontWeight: "900", color: CARD_BG, marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500', textAlign: 'center' },
  scrollContainer: { paddingBottom: 40, paddingTop: 10 },
  cardListContainer: { gap: 14, alignItems: 'stretch' }, // Reduced gap
  
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 16, // Slightly smaller radius
    padding: 15, // Reduced padding
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3, // Slightly less elevation
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderLeftWidth: 4, // Slightly thinner border
    borderLeftColor: ACCENT_BLUE,
    overflow: 'hidden',
  },

  // Unique Style for Payment Link
  paymentLinkCard: {
    backgroundColor: '#f0f7ff', 
    borderColor: ACCENT_BLUE,
    borderWidth: 1, // thinner dashed border
    borderLeftWidth: 1,
    borderStyle: 'dashed',
  },

  specialCardContainer: {
    borderLeftWidth: 0,
    borderWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  paymentIconCircle: {
    backgroundColor: ACCENT_BLUE,
    width: 40, // Smaller circle
    height: 40,
    borderRadius: 20,
  },

  specialCardText: { color: '#fff', fontSize: 18 }, // Reduced font
  specialCardSubText: { color: 'rgba(255,255,255,0.7)' },
  specialCardIcon: { color: '#fbbf24', fontSize: 28 }, // Reduced size
  actionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, // Smaller badge
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  cardContent: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  textContainer: { marginLeft: 15, flexShrink: 1 },
  cardText: { fontSize: 16, fontWeight: '800', color: MODERN_PRIMARY }, // Reduced font size
  cardSubText: { fontSize: 13, color: TEXT_GREY, marginTop: 2, fontWeight: '500' }, // Reduced font size
  cardIcon: { fontSize: 24, color: ACCENT_BLUE }, // Reduced icon size
  arrowIcon: { fontSize: 22, color: TEXT_GREY, marginLeft: 10 }, // Reduced arrow size
});

export default Routes;
