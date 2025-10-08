import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
  LayoutAnimation, // <-- NEW: For Animation
  UIManager, // <-- NEW: For Animation on Android
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import COLORS from "../constants/color"; 
import Header from "../components/Header";

// --- ORIGINAL CONSTANTS ---
const DUE_API = "https://mychits.online/api/enroll/due/routes/agent/";
const GROUP_API = "https://mychits.online/api/group/get-group";
// Using the linear gradient from the original file
const BACKGROUND_GRADIENT = ["#dbf6faff", "#90dafcff"]; 
const NO_REPORTS_IMAGE = require("../assets/NoReports.png");

// --- CUSTOM STYLING CONSTANTS (Updated) ---
// New Color Palette for a professional look
const MODERN_PRIMARY = "#1e3a8a"; // Deep, professional blue
const ACCENT_GREEN = "#059669";   // Vibrant green for positive/payable
const WARNING_RED = "#dc2626";     // Strong red for negative/balance
// Adding a neutral grey constant for cleaner styles
const NEUTRAL_GREY = "#6b7280"; 

// Enable LayoutAnimation for Android
if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "₹0.00";
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "₹0.00";
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const ReferredReport = ({ route }) => {
  const { user } = route.params;
  const [groups, setGroups] = useState([]);
  const [dues, setDues] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [loading, setLoading] = useState(true);

  // Fetch groups + dues
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupRes, dueRes] = await Promise.all([
          fetch(GROUP_API),
          fetch(`${DUE_API}${user?.userId}`),
        ]);
        const groupJson = await groupRes.json();
        const dueJson = await dueRes.json();

        const allGroups = Array.isArray(groupJson?.data)
          ? groupJson.data
          : Array.isArray(groupJson)
          ? groupJson
          : [];

        const allDues = dueJson?.enrollments || [];

        setGroups(allGroups);
        setDues(allDues);
        // ******* ANIMATION TRIGGER *******
        // Apply LayoutAnimation to make the initial load smooth
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFilteredData(allDues);
      } catch (err) {
        console.error("Error fetching:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.userId]);

  // Filter dues by group
  useEffect(() => {
    // ******* ANIMATION TRIGGER *******
    // Apply LayoutAnimation before changing state for a smooth filter transition
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); 
    if (selectedGroup === "all") setFilteredData(dues);
    else
      setFilteredData(
        dues.filter((item) => item.group_id?._id === selectedGroup)
      );
  }, [selectedGroup, dues]);

  const renderItem = ({ item }) => {
    const name = item?.user_id?.full_name || "Unknown";
    const email = item?.user_id?.email;
    const phone = item?.user_id?.phone_number;
    const groupName = item?.group_id?.group_name || "N/A";
    const paymentType = item?.payment_type || "N/A";

    // Safely extract financial values
    const getFinancialValue = (value) =>
      Array.isArray(value) && value[0] ? value[0] : value || 0;

    const totalPayable = getFinancialValue(item.total_payable_amount);
    const totalProfit = getFinancialValue(item.total_profit);
    const totalToBePaid = item?.total_to_be_paid || 0;
    const balance = item?.balance || item?.Balance || 0;
    
    // ******* UNIQUE IDEA: STATUS BAR COLOR *******
    const statusColor = balance > 0 ? WARNING_RED : ACCENT_GREEN;

    return (
      <View style={styles.cardContainer}>
        {/* Status Indicator Bar */}
        <View style={[styles.cardStatusIndicator, { backgroundColor: statusColor }]} />

        <View style={styles.card}>
          {/* Header (Group and Type) */}
          <View style={styles.cardHeader}>
            <Text style={styles.groupName}>{groupName}</Text>
            <Text style={styles.paymentType}>{paymentType}</Text>
          </View>

          {/* Customer Info */}
          <View style={styles.cardBody}>
            <Text style={styles.customerName}>{name}</Text>
            {email ? <Text style={styles.customerInfo}>📧 {email}</Text> : null}
            {phone ? <Text style={styles.customerInfo}>📞 {phone}</Text> : null}
          </View>

          {/* Financial Info */}
          <View style={styles.cardFinancial}>
            {/* Total Payable */}
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Payable</Text>
              <Text style={[styles.financialValue, { color: ACCENT_GREEN }]}>
                {formatCurrency(totalPayable)}
              </Text>
            </View>

            {/* Total Profit */}
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Profit</Text>
              <Text style={[styles.financialValue, { color: ACCENT_GREEN }]}>
                {formatCurrency(totalProfit)}
              </Text>
            </View>

            {/* Total To Be Paid */}
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total To Be Paid</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(totalToBePaid)}
              </Text>
            </View>

            {/* Balance (Stands out) */}
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Outstanding Balance</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const totalPending = filteredData.reduce(
    (sum, item) => sum + (item?.balance || item?.Balance || 0),
    0
  );

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image source={NO_REPORTS_IMAGE} style={styles.emptyImage} />
      <Text style={styles.emptyText}>No pending dues found</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      {/* USING ORIGINAL LINEAR GRADIENT */}
      <LinearGradient colors={BACKGROUND_GRADIENT} style={{ flex: 1 }}>
        
        {/* WRAPPER ADDED TO PUSH HEADER DOWN */}
        <View style={styles.headerSpacer}>
            <Header />
        </View>

        <View style={styles.container}>
          <Text style={styles.title}>Referred Report</Text>
          <Text style={styles.subtitle}>
            Select a group to view pending details
          </Text>

          {/* Group Filter (FIXED TEXT COLOR/STYLE HERE) */}
          <View style={styles.dropdownWrapper}>
            <Text style={styles.dropdownLabel}>Filter by Group</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={(itemValue) => setSelectedGroup(itemValue)}
                // FIX: Set the style and color directly on the Picker component (Good for Android contrast/style)
                style={[styles.picker, { color: MODERN_PRIMARY }]} 
                // itemStyle is primarily for iOS list appearance
                itemStyle={{ color: MODERN_PRIMARY, fontSize: 16 }} 
              >
                <Picker.Item label="All Groups" value="all" />
                {groups.map((g) => (
                  // Use the group name as the label
                  <Picker.Item key={g._id} label={g.group_name} value={g._id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Total Summary (Highlighted Card) */}
          <View style={styles.totalWrapper}>
            <Text style={styles.totalText}>
              Total Pending Balance:
            </Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(totalPending)}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={MODERN_PRIMARY} />
              <Text style={{ marginTop: 10, color: NEUTRAL_GREY }}>Loading data...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={(item, index) => item?._id?.toString() || index.toString()}
              ListEmptyComponent={EmptyList}
              contentContainerStyle={{ paddingBottom: 50 }}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default ReferredReport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // --- NEW STYLE FOR HEADER SPACING ---
  headerSpacer: {
    paddingHorizontal: 16,
    paddingVertical: 10, // Adjust this value to push the header down
  },
  // --- TITLES ---
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: 'Black',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
     color: 'Black',
    marginBottom: 20,
    textAlign: 'center',
  },

  // --- DROP DOWN / FILTER ---
  dropdownWrapper: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    // Stronger, cleaner shadow for better elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownLabel: {
    fontWeight: "700",
    marginBottom: 8,
    color: MODERN_PRIMARY,
    fontSize: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
  },

  totalWrapper: {
    backgroundColor: "#fff7ed", // Soft orange/yellow background
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: "#f97316", // Vibrant orange
    alignItems: 'center',
  },
  totalText: {
    color: "#c2410c",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 2,
  },
  totalAmount: {
    color: WARNING_RED,
    fontWeight: "900",
    fontSize: 24,
  },

  // --- REPORT CARD (Nicely Styled) ---
  // NEW WRAPPER FOR STATUS INDICATOR
  cardContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  // UNIQUE IDEA: STATUS BAR
  cardStatusIndicator: {
    width: 6, // Width of the indicator
    backgroundColor: 'red', // Default, will be overridden
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    // Ensure it matches the card height (via flex: 1) and shadow offset
    marginTop: 0, 
    marginBottom: 0,
    height: 'auto',
  },
  card: {
    flex: 1, // Take up the remaining space next to the indicator
    backgroundColor: "#ffffff",
    borderTopRightRadius: 16, // Only right side for the main card
    borderBottomRightRadius: 16, // Only right side for the main card
    padding: 20,
    // Premium, larger shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    marginLeft: -6, // Overlap the indicator bar to make it look cohesive
    zIndex: 1,
  },

  // CARD CONTENT
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  groupName: {
    fontSize: 17,
    fontWeight: "800",
    color: MODERN_PRIMARY,
  },
  paymentType: {
    fontSize: 13,
    color: NEUTRAL_GREY,
    textTransform: "capitalize",
    fontWeight: "600",
    backgroundColor: "#eef2ff", // Light blue background for a tag feel
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  cardBody: {
    marginBottom: 15,
  },
  customerName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 5,
  },
  customerInfo: {
    fontSize: 14,
    color: NEUTRAL_GREY,
    marginTop: 3,
    fontWeight: "500",
  },
  cardFinancial: {
    paddingTop: 10,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  financialLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },
  financialValue: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "700",
  },
  // Balance Row (Stands out)
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: "#fee2e2", // Very light red background
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: WARNING_RED,
    fontWeight: "700",
  },
  balanceValue: {
    fontSize: 17,
    color: WARNING_RED,
    fontWeight: "900",
  },
  
  // --- LOADER/EMPTY STATE ---
  loader: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    padding: 20,
  },
  emptyImage: {
    width: 200,
    height: 160,
    opacity: 0.8,
  },
  emptyText: {
    color: NEUTRAL_GREY,
    marginTop: 20,
    fontWeight: "700",
    fontSize: 18,
  },
});