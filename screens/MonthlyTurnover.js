import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
// SafeAreaView removed as requested
import Header from "../components/Header";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import baseUrl from "../constants/baseUrl";

const MonthlyTurnover = () => {
  const [turnoverData, setTurnoverData] = useState(null);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [formattedDate, setFormattedDate] = useState(
    moment().format("MMMM YYYY")
  );
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        // Ensure user data is available before proceeding
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          setError("User session expired. Please login again.");
          setLoading(false);
          return;
        }
        
        const user = JSON.parse(userJson);
        const agentId = user?.userId;
        if (!agentId) {
          setError("No agentId found. Please login again.");
          setLoading(false);
          return;
        }

        const year = moment(selectedDate).year();
        const month = moment(selectedDate).month() + 1; // month() is 0-indexed

        const apiUrl = `${baseUrl}/user/agent-monthly-turnover-by-id/${agentId}?year=${year}&month=${month}`;
        const response = await axios.get(apiUrl);

        if (response.data?.success) {
          setTurnoverData(response.data.agentData);
          
          const customersWithStatus =
            response.data.agentData.payingCustomers.map((c) => {
              const totalPaid = parseFloat(c.totalPaid || 0);
              const monthlyInstallment = parseFloat(c.monthly_installment || 0);
              let lastPaymentDate = 'N/A';

              // Logic to find the last payment date
              if (c.payments && c.payments.length > 0) {
                // Get all pay_dates, sort descending, and take the first one
                const latestDate = c.payments
                  .map(p => p.pay_date)
                  .filter(date => date) // Filter out null/empty dates
                  .sort((a, b) => new Date(b) - new Date(a))[0];
                
                if (latestDate) {
                    lastPaymentDate = moment(latestDate).format("DD MMM YYYY");
                }
              }

              return {
                ...c,
                paymentStatus:
                  totalPaid >= monthlyInstallment ? "PAID" : "UNPAID",
                lastPaymentDate: lastPaymentDate,
              };
            });
          setCustomersData(customersWithStatus);
        } else {
          setError(response.data?.message || "Failed to fetch data.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load data. Please check your network connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [selectedDate]); // Re-fetch data whenever the month/year changes

  const onDateChange = (_event, newDate) => {
    setShowPicker(false);
    if (newDate) {
      // Snap to the first of the month, as only Month & Year are relevant
      const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setSelectedDate(firstDay);
      setFormattedDate(moment(firstDay).format("MMMM YYYY"));
    }
  };

  const renderTurnoverCard = () => (
    <View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="user-tie" size={40} color="#34495E" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.agentName}>{turnoverData?.agentName}</Text>
            <Text style={styles.phoneNumber}>{turnoverData?.phone_number}</Text>
          </View>
        </View>

        {/* clear instruction for agents */}
        <Text style={styles.dateHint}>
          Tap the blue button to change Month & Year
        </Text>

        <TouchableOpacity
          style={styles.datePickerContainer}
          onPress={() => setShowPicker(true)}
        >
          <FontAwesome5 name="calendar-alt" size={18} color="#fff" />
          <Text style={styles.datePickerText}>{formattedDate}</Text>
          <FontAwesome5
            name="chevron-down"
            size={16}
            color="#fff"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Month-Year</Text>
            <Text style={styles.dataValue}>
              {turnoverData?.month}/{turnoverData?.year}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Total Customers</Text>
            <Text style={styles.dataValue}>
              {turnoverData?.totalCustomers}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.turnoverSection}>
            <Text style={styles.turnoverLabel}>Expected</Text>
            <Text style={styles.turnoverValue}>
              ₹{turnoverData?.expectedTurnover || '0.00'}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.turnoverSection}>
            <Text style={styles.turnoverLabel}>Actual</Text>
            <Text style={styles.turnoverValue}>
              ₹{turnoverData?.totalTurnover || '0.00'}
            </Text>
          </View>
        </View>
      </View>

      {customersData.length > 0 && (
        <View style={styles.customersListContainer}>
          <Text style={styles.customersListTitle}>Paying Customers</Text>
          <View style={styles.searchContainer}>
            <FontAwesome5
              name="search"
              size={18}
              color="#777"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by customer or group "
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>
      )}
    </View>
  );

  const renderCustomerCard = ({ item }) => (
    <View style={styles.customerCard}>
      <View
        style={
          item.paymentStatus === "PAID"
            ? styles.paidBadgeContainer
            : styles.unpaidBadgeContainer
        }
      >
        <Text style={styles.badgeText}>{item.paymentStatus}</Text>
      </View>

      <View style={styles.customerContent}>
        <View style={styles.customerDetailRow}>
          <Text style={styles.customerLabel}>Customer Name:</Text>
          <Text style={styles.customerValue}>{item.user_id.full_name}</Text>
        </View>
        <View style={styles.customerDetailRow}>
          <Text style={styles.customerLabel}>Group Name:</Text>
          <Text style={styles.customerValue}>{item.group_id.group_name}</Text>
        </View>
        <View style={styles.customerDetailRow}>
          <Text style={styles.customerLabel}>Ticket Number:</Text>
          <Text style={styles.customerValue}>{item.ticket}</Text>
        </View>
        <View style={styles.customerDetailRow}>
          <Text style={styles.customerLabel}>Monthly Installment:</Text>
          <Text style={styles.customerValue}>₹{item.monthly_installment}</Text>
        </View>
        <View style={styles.customerDetailRow}>
          <Text style={styles.customerLabel}>Last Transaction:</Text>
          <Text style={styles.customerValue}>{item.lastPaymentDate}</Text>
        </View>
        <View style={styles.customerDetailRow}>
          <Text style={styles.customerLabel}>Total Paid:</Text>
          <Text style={styles.customerValue}>₹{item.totalPaid}</Text>
        </View>
      </View>
    </View>
  );

  const filteredCustomers = customersData.filter((c) => {
    const term = searchText.toLowerCase();
    // Safely access nested properties
    const fullName = c.user_id?.full_name?.toLowerCase() || '';
    const groupName = c.group_id?.group_name?.toLowerCase() || '';

    return (
      fullName.includes(term) ||
      groupName.includes(term)
    );
  });

  return (
    // Replaced SafeAreaView with standard View and added padding
    <View style={styles.fullScreen}>
      <LinearGradient 
        colors={['#b6e4ebff', '#1796d1ff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.mainContentArea}>
          <Header />
          <Text style={styles.screenTitle}>Monthly Turnover</Text>
          <Text style={styles.instructionText}>
            This screen displays your monthly financial performance and customer
            payments.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
          ) : error ? (
            <Text style={styles.statusText}>{error}</Text>
          ) : (
            <FlatList
              data={filteredCustomers}
              renderItem={renderCustomerCard}
              keyExtractor={(_, index) => index.toString()}
              ListHeaderComponent={renderTurnoverCard()}
              contentContainerStyle={styles.flatListContent}
              // FIX: Set FlatList style to transparent so the LinearGradient shows through
              style={styles.transparentBackground} 
              // Optional: Add empty component message
              ListEmptyComponent={() => (
                  <View style={styles.emptyListContainer}>
                      <Text style={styles.statusText}>No customer data found for this month or search criteria.</Text>
                  </View>
              )}
            />
          )}
        </View>

        {showPicker && (
          // We only care about Month and Year, but DateTimePicker only supports date/time/datetime modes.
          // We set mode="date" and handle the month/year selection logic in onDateChange.
          <DateTimePicker
            value={selectedDate}
            mode="date" 
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={onDateChange}
          />
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  // Adjusted: Replaced safeArea and added paddingTop for status bar clearance
  fullScreen: { 
    flex: 1, 
    // Manual top padding to prevent overlap with status bar on iOS/Android
    paddingTop: Platform.OS === 'android' ? 25 : 40, 
  },
  gradientOverlay: { flex: 1 },
  mainContentArea: { flex: 1, paddingHorizontal: 20 }, // Removed redundant marginTop
  
  // FIX: New style to make the FlatList itself transparent
  transparentBackground: {
    backgroundColor: 'transparent',
  },

  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0c0c0cff",
    marginTop: 20,
    marginBottom: 5,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    color: "#0a0a0aff",
    marginBottom: 20,
    textAlign: "center",
  },
  loader: { marginTop: 50 },
  statusText: { fontSize: 16, color: "#555", textAlign: "center", marginTop: 20 },
  flatListContent: { paddingBottom: 20 },
  emptyListContainer: { 
      paddingVertical: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffffaa',
      borderRadius: 15,
      marginTop: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    borderColor: "darkblue",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTextContainer: { marginLeft: 15 },
  agentName: { fontSize: 22, fontWeight: "bold", color: "#2C3E50" },
  phoneNumber: { fontSize: 14, color: "#7F8C8D", marginTop: 2 },

  dateHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#555",
    marginBottom: 8,
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },

  cardBody: { marginBottom: 10 },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  dataLabel: { fontSize: 15, color: "#7F8C8D", fontWeight: "500" },
  dataValue: { fontSize: 16, color: "#34495E", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#EAEAEA", marginVertical: 10 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  turnoverSection: { flex: 1, alignItems: "center", padding: 10 },
  turnoverLabel: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  turnoverValue: { fontSize: 17, fontWeight: "bold", color: "#2C3E50", marginTop: 5 },
  verticalDivider: { width: 1, backgroundColor: "#EAEAEA" },

  customersListContainer: { marginTop: 30, paddingHorizontal: 0 }, // Adjusted padding to 0, since mainContentArea already has padding
  customersListTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0c0c0cff",
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 15,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: "#333",
    textAlign: "left",
    paddingVertical: 0,
  },

  customerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    position: "relative",
  },
  customerDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  customerLabel: { fontSize: 14, color: "#555" },
  customerValue: { fontSize: 14, fontWeight: "600", color: "#34495e" },

  paidBadgeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "green",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 15,
  },
  unpaidBadgeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "red",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 15,
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

export default MonthlyTurnover;