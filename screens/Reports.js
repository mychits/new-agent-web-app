import React from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity,
    Platform,
    StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";

// --- CONSTANTS MATCHING ROUTES.JS DESIGN ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

const CustomReportCard = ({ name, icon, onPress, subText }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.cardContainer} 
    activeOpacity={0.7}
  >
    <View style={styles.cardContent}>
      <View style={styles.iconWrapper}>
          <Ionicons name={icon} style={styles.cardIcon} /> 
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>
          {subText || "View Detailed Report"}
        </Text>
      </View>
    </View>

    <View style={styles.actionBadge}>
        <Text style={styles.actionBadgeText}>VIEW</Text>
        <Ionicons name="chevron-forward-outline" size={14} color={ACCENT_BLUE} />
    </View>
  </TouchableOpacity>
);

const Reports = ({ route, navigation }) => {
  const { user } = route.params || { user: { name: "Guest" } };

  const reportItems = [
    { name: "Chits Report", icon: "stats-chart-outline", route: "ChitPayment", params: { user, areaId: "chits" }, sub: "Chit payment history" },
    { name: "Gold Report", icon: "ribbon-outline", route: "GoldPayment", params: { user }, sub: "Gold scheme analytics" },
    { name: "Loan Report", icon: "wallet-outline", route: "LoanPayments", params: { user, areaId: "loan-chits" }, sub: "Loan & interest status" },
    { name: "Pigme Report", icon: "trending-up-outline", route: "PigmePayments", params: { user, areaId: "pigme-chits" }, sub: "Daily collection tracking" },
    { name: "Collection Report", icon: "document-text-outline", route: "OutstandingReports", params: { user }, sub: "Outstanding balance list" },
    { name: "Referred Report", icon: "share-social-outline", route: "ReferredReport", params: { user }, sub: "Referral performance" },
    { name: "RM Report", icon: "people-outline", route: "RelationshipManagerReport", params: { user }, sub: "Manager activity logs" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
          <View style={styles.headerSpacer}><Header /></View>
          <View style={styles.titleContainer}>
              <Text style={styles.title}>Report Center</Text>
              <Text style={styles.subtitle}>Select a report to view detailed analytics</Text>
          </View>
      </LinearGradient>

      <View style={styles.mainContentArea}>
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContainer}
        >
          {/* THE BIG BOX CONTAINER */}
          <View style={styles.bigBoxContainer}>
            <View style={styles.cardListContainer}>
              {reportItems.map((item, index) => (
                <CustomReportCard
                  key={index}
                  name={item.name}
                  icon={item.icon}
                  subText={item.sub}
                  onPress={() => navigation.navigate(item.route, item.params)}
                />
              ))}
            </View>
          </View>

          {/* SPACE BELOW THE BIG BOX */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  topContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  mainContentArea: { 
    flex: 1, 
    backgroundColor: SUBTLE_BG_GREY, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    marginTop: -20, 
    paddingTop: 20 
  },
  headerSpacer: { paddingTop: 20, paddingBottom: 5 }, 
  titleContainer: { alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: "900", color: CARD_BG, marginBottom: 4 },
  subtitle: { 
    fontSize: 14, 
    color: 'rgba(255, 255, 255, 0.85)', 
    fontWeight: '500', 
    textAlign: 'center' 
  },
  scrollContainer: { 
    paddingHorizontal: 16,
    paddingTop: 10 
  },
  // STYLING FOR THE "BIG BOX"
  bigBoxContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  cardListContainer: { 
    gap: 15, // Space between cards inside the big box
    alignItems: 'stretch' 
  },
  cardContainer: {
    backgroundColor: SUBTLE_BG_GREY, // Subtle difference from white big box
    borderRadius: 18, 
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderLeftWidth: 5,
    borderLeftColor: ACCENT_BLUE,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: { marginLeft: 12, flexShrink: 1 },
  cardText: { fontSize: 17, fontWeight: '800', color: MODERN_PRIMARY },
  cardSubText: { fontSize: 12, color: TEXT_GREY, marginTop: 2, fontWeight: '500' },
  cardIcon: { fontSize: 22, color: ACCENT_BLUE },
  actionBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  actionBadgeText: { color: ACCENT_BLUE, fontSize: 10, fontWeight: '900' },
  // ADDED SPACE BELOW THE BIG BOX
  bottomSpace: {
    height: 100, 
  },
});

export default Reports;