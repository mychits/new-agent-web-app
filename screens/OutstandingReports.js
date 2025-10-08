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
  LayoutAnimation,
  UIManager,
  // --- NEW IMPORTS FOR CALL FUNCTIONALITY ---
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import COLORS from "../constants/color"; // Keeping this, though not used below
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
// Darkest text color for contrast
const DARK_TEXT = "#1f2937";

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

// --- NEW FUNCTION TO HANDLE CALLS ---
const handleCall = (phoneNumber) => {
  if (phoneNumber) {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.log(`Don't know how to open URI: ${url}`);
          // In a real app, you might show an Alert here.
        }
      })
      .catch((err) => console.error('An error occurred while opening dialer', err));
  }
};


const OutstandingReports = ({ route }) => {
  const { user } = route.params;
  const [groups, setGroups] = useState([]);
  const [dues, setDues] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [loading, setLoading] = useState(true);
  // --- NEW STATE FOR TRACKING THE ACTIVE CALL/ANIMATION ---
  const [activeCallId, setActiveCallId] = useState(null); 


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

    // --- CHECK IF THIS ITEM IS CURRENTLY "CALLING" ---
    const isCalling = activeCallId === item?._id; 

    // Safely extract financial values
    const getFinancialValue = (value) =>
      Array.isArray(value) && value[0] ? value[0] : value || 0;

    const totalPayable = getFinancialValue(item.total_payable_amount);
    const totalProfit = getFinancialValue(item.total_profit);
    const totalToBePaid = item?.total_to_be_paid || 0;
    const balance = item?.balance || item?.Balance || 0;

    // ******* UNIQUE IDEA: STATUS BAR COLOR *******
    const statusColor = balance > 0 ? WARNING_RED : ACCENT_GREEN;

    // --- NEW FUNCTION TO HANDLE PRESS AND ANIMATION ---
    const handlePhonePress = (phone) => {
        if (phone) {
            setActiveCallId(item?._id); // Start the "calling" state
            handleCall(phone); // Initiate the native call

            // Simulate the "agent should call to customer" animation/status
            // by resetting the state after a short delay (e.g., 3 seconds)
            setTimeout(() => {
                setActiveCallId(null);
            }, 3000);
        }
    }

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
            {/* STYLIST: Use DARK_TEXT for icons for better contrast */}
            {email ? <Text style={styles.customerInfo}><Text style={{color: DARK_TEXT}}>📧</Text> {email}</Text> : null}
            
            {/* --- MAKE PHONE NUMBER TAPPABLE --- */}
            {phone ? (
              <TouchableOpacity
                onPress={() => handlePhonePress(phone)}
                style={styles.phoneTouchable}
              >
                <Text style={styles.customerInfo}>
                  <Text style={{color: DARK_TEXT}}>📞</Text> {phone}
                  {/* Basic Animation/Status Feedback */}
                  {isCalling && <Text style={styles.callingStatus}> - Calling...</Text>}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Financial Info */}
          <View style={styles.cardFinancial}>
            {/* Total Payable */}
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Payable</Text>
              {/* STYLIST: Ensure financial value is clean and uses ACCENT_GREEN for positive values */}
              <Text style={[styles.financialValue, { color: ACCENT_GREEN }]}>
                {formatCurrency(totalPayable)}
              </Text>
            </View>

            {/* Total Profit */}
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Profit</Text>
              {/* STYLIST: Ensure financial value is clean and uses ACCENT_GREEN for positive values */}
              <Text style={[styles.financialValue, { color: ACCENT_GREEN }]}>
                {formatCurrency(totalProfit)}
              </Text>
            </View>

            {/* Total To Be Paid (Neutral) */}
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total To Be Paid</Text>
              <Text style={[styles.financialValue, { color: DARK_TEXT }]}>
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
          {/* STYLIST: Use the new title style for better look */}
          <Text style={styles.title}>Outstanding Reports</Text>
          {/* STYLIST: Use the new subtitle style for better look */}
          <Text style={styles.subtitle}>
            Select a group to view pending details
          </Text>

          {/* Group Filter */}
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

          {/* Total Summary (Highlighted Card) - STYLIST: Total is now much bolder */}
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
              // STYLIST: Padding for the list moved to style prop
              style={styles.flatListStyle}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default OutstandingReports;

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
  // --- TITLES (STYLIST: Bolder, use MODERN_PRIMARY for title) ---
  title: {
    fontSize: 28,
    fontWeight: "900", // Bolder
    color: MODERN_PRIMARY, // Primary color
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: NEUTRAL_GREY, // Better contrast with a shade of grey
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

  // --- TOTAL SUMMARY (STYLIST: More impact, use a deeper border color) ---
  totalWrapper: {
    backgroundColor: "#fff7ed", // Soft orange/yellow background
    borderRadius: 12, // Slightly larger radius
    padding: 18, // Slightly more padding
    marginBottom: 20,
    borderLeftWidth: 6, // Slightly thicker border
    borderLeftColor: "#f97316", // Vibrant orange
    alignItems: 'center',
    // Slight shadow to lift it
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  totalText: {
    color: "#c2410c",
    fontWeight: "700", // Bolder text
    fontSize: 17,
    marginBottom: 4,
  },
  totalAmount: {
    color: WARNING_RED,
    fontWeight: "900",
    fontSize: 26, // Larger amount
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
    fontSize: 18, // Slightly larger
    fontWeight: "900", // Bolder
    color: MODERN_PRIMARY,
  },
  paymentType: {
    fontSize: 13,
    color: MODERN_PRIMARY, // Use primary color for tag text
    textTransform: "uppercase", // Uppercase tag
    fontWeight: "700",
    backgroundColor: "#eef2ff", // Light blue background for a tag feel
    paddingHorizontal: 10, // More padding
    paddingVertical: 4,
    borderRadius: 8, // More rounded
  },
  cardBody: {
    marginBottom: 15,
  },
  customerName: {
    fontSize: 20, // Bolder name
    fontWeight: "900",
    color: DARK_TEXT,
    marginBottom: 5,
  },
  customerInfo: {
    fontSize: 14,
    color: NEUTRAL_GREY,
    marginTop: 3,
    fontWeight: "500",
  },

  // --- NEW STYLES FOR CALL FEATURE ---
  phoneTouchable: {
    // We apply padding here so the touch area is larger
    paddingVertical: 3, 
    // This allows the Text to sit next to the previous Text element
    alignSelf: 'flex-start', 
  },
  callingStatus: {
    color: MODERN_PRIMARY, // Highlight the status text
    fontWeight: '700',
    marginLeft: 8,
    fontStyle: 'italic', // Subtle animation look
  },
  // ------------------------------------

  cardFinancial: {
    paddingTop: 10,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10, // More spacing
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  financialLabel: {
    fontSize: 15,
    color: DARK_TEXT, // Darker label for better readability
    fontWeight: "600",
  },
  financialValue: {
    fontSize: 16, // Slightly larger
    color: DARK_TEXT,
    fontWeight: "800",
  },
  // Balance Row (Stands out)
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12, // More padding
    marginTop: 15, // More margin
    backgroundColor: "#fee2e2", // Very light red background
    borderRadius: 10, // More rounded
    paddingHorizontal: 15,
    // Add a light shadow to the balance row for pop
    shadowColor: WARNING_RED,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  balanceLabel: {
    fontSize: 17, // Larger label
    color: WARNING_RED,
    fontWeight: "800",
  },
  balanceValue: {
    fontSize: 18, // Larger amount
    color: WARNING_RED,
    fontWeight: "900",
  },

  // --- FLATLIST STYLE (STYLIST: Adds padding to the bottom) ---
  flatListStyle: {
    paddingBottom: 50,
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