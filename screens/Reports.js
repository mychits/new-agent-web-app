import React from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity, 
    Dimensions,
    Platform,
    StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";

const { width } = Dimensions.get("window");

// LAYOUT CALCULATIONS
const HORIZONTAL_PADDING = 16;
const GAP = 10; // Space between cards
const COLUMN_WIDTH = (width - (HORIZONTAL_PADDING * 2) - (GAP * 2)) / 3;

// COLORS
const TOP_GRADIENT = ["#1aa2ccff", "#0e7ba0ff"]; 
const MODERN_PRIMARY = "#1f2937"; 
const ACCENT_BLUE = "#1796d1ff"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f3f4f6'; 

const GridReportCard = ({ name, icon, onPress, isLastInRow }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[
        styles.gridCard, 
        { marginRight: isLastInRow ? 0 : GAP }
    ]} 
    activeOpacity={0.7}
  >
    <View style={styles.iconWrapper}>
        <View style={styles.iconGlow} />
        <Ionicons name={icon} size={24} color={ACCENT_BLUE} />
    </View>

    <View style={styles.textWrapper}>
        <Text style={styles.mainLabel} numberOfLines={1}>{name}</Text>
        <Text style={styles.subLabel}>REPORT</Text>
    </View>

    <View style={styles.cardFooter}>
        <Text style={styles.viewText}>VIEW</Text>
        <Ionicons name="chevron-forward-circle" size={14} color={ACCENT_BLUE} />
    </View>
  </TouchableOpacity>
);

const Reports = ({ route, navigation }) => {
  const { user } = route.params || { user: { name: "Guest" } };

  const reportItems = [
    { name: "Chits", icon: "stats-chart", route: "ChitPayment", params: { user, areaId: "chits" } },
    { name: "Gold", icon: "ribbon", route: "GoldPayment", params: { user } },
    { name: "Loan", icon: "wallet", route: "LoanPayments", params: { user, areaId: "loan-chits" } },
    { name: "Pigme", icon: "trending-up", route: "PigmePayments", params: { user, areaId: "pigme-chits" } },
    { name: "Collection", icon: "document-text", route: "OutstandingReports", params: { user } },
    { name: "Referred", icon: "share-social", route: "ReferredReport", params: { user } },
    { name: "RM", icon: "people", route: "RelationshipManagerReport", params: { user } },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={TOP_GRADIENT} style={styles.topSection}>
        <View style={styles.circleDecor} />
        <SafeAreaView edges={['top']}>
            <View style={styles.headerSpacer}><Header /></View>
            <View style={styles.titleContainer}>
                <Text style={styles.greeting}>MANAGEMENT SYSTEM</Text>
                <Text style={styles.title}>Report Center</Text>
            </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.mainContentArea}>
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollPadding}
        >
          <View style={styles.gridContainer}>
            {reportItems.map((item, index) => (
              <GridReportCard
                key={index}
                name={item.name}
                icon={item.icon}
                onPress={() => navigation.navigate(item.route, item.params)}
                // Check if item is the 3rd in the row (index 2, 5, 8...)
                isLastInRow={(index + 1) % 3 === 0}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: SUBTLE_BG_GREY },
    topSection: {
        paddingHorizontal: 20,
        paddingBottom: 50,
        overflow: 'hidden',
    },
    circleDecor: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.12)',
        top: -40,
        right: -40,
    },
    headerSpacer: { paddingTop: 10 },
    titleContainer: { marginTop: 15 },
    greeting: { 
        fontSize: 10, 
        color: 'rgba(255,255,255,0.7)', 
        fontWeight: '800', 
        letterSpacing: 2 
    },
    title: {
      fontSize: 26, 
      fontWeight: "900",
      color: "#fff", 
      marginTop: 2,
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY,
        borderTopLeftRadius: 35, 
        borderTopRightRadius: 35,
        marginTop: -30, 
    },
    scrollPadding: { 
        paddingHorizontal: HORIZONTAL_PADDING, 
        paddingTop: 20, 
        paddingBottom: 40 
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    gridCard: {
      backgroundColor: CARD_BG,
      width: COLUMN_WIDTH,
      height: 135, 
      borderRadius: 20,
      marginBottom: GAP,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'space-between',
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
        android: { elevation: 3 },
      }),
    },
    iconWrapper: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconGlow: {
        position: 'absolute',
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: '#f0f9ff',
        transform: [{ rotate: '10deg' }],
    },
    textWrapper: {
        alignItems: 'center',
        width: '100%',
    },
    mainLabel: {
      fontSize: 12, 
      fontWeight: '800', 
      color: MODERN_PRIMARY, 
      textAlign: 'center',
    },
    subLabel: {
        fontSize: 8,
        fontWeight: '600',
        color: '#94a3b8',
        letterSpacing: 1,
        marginTop: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    viewText: {
        fontSize: 8,
        fontWeight: '900',
        color: ACCENT_BLUE,
        marginRight: 4,
    }
});

export default Reports;