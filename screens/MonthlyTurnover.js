import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { FontAwesome5 } from "@expo/vector-icons";

const MonthlyTurnover = () => {
  const [turnoverData, setTurnoverData] = useState(null);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(await AsyncStorage.getItem("user"));
        const agentId = user?.userId;

        if (!agentId) {
          setError("No agentId found. Please login again.");
          setLoading(false);
          return;
        }

        const currentYear = moment().year();
        const currentMonth = moment().month() + 1;

        const apiUrl = `http://51.21.197.152:3000/api/user/agent-monthly-turnover-by-id/${agentId}?year=${currentYear}&month=${currentMonth}`;

        const response = await axios.get(apiUrl);

        if (response.data && response.data.success) {
          setTurnoverData(response.data.agentData);
          const customersWithStatus = response.data.agentData.payingCustomers.map(customer => ({
            ...customer,
            paymentStatus: customer.totalPaid >= customer.monthly_installment ? 'Paid' : 'Unpaid'
          }));
          setCustomersData(customersWithStatus);
        } else {
          setError("Failed to fetch data. No success message from API.");
        }
      } catch (err) {
        console.error("Failed to fetch monthly turnover data:", err);
        setError(
          "Failed to load monthly turnover information. Please check your network and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

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
            <Text style={styles.turnoverValue}>₹{turnoverData?.expectedTurnover}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.turnoverSection}>
            <Text style={styles.turnoverLabel}>Total</Text>
            <Text style={styles.turnoverValue}>₹{turnoverData?.totalTurnover}</Text>
          </View>
        </View>
      </View>
      {customersData.length > 0 && (
        <View style={styles.customersListContainer}>
          <Text style={styles.customersListTitle}>Paying Customers</Text>
        </View>
      )}
    </View>
  );

  const renderCustomerCard = ({ item }) => (
    <View style={styles.customerCard}>
      <View style={item.paymentStatus === 'Paid' ? styles.freshLeadBadgeContainer : styles.newLeadBadgeContainer}>
        <Text style={styles.freshLeadBadgeText}>{item.paymentStatus}</Text>
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
          <Text style={styles.customerLabel}>Total Paid:</Text>
          <Text style={styles.customerValue}>₹{item.totalPaid}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#dbf6faff", "#90dafcff"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.mainContentArea}>
          <Header />
          <Text style={styles.screenTitle}>Monthly Turnover</Text>
          <Text style={styles.instructionText}>
            This screen displays your monthly financial performance and customer payments.
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
          ) : error ? (
            <Text style={styles.statusText}>{error}</Text>
          ) : (
            <FlatList
              data={customersData}
              renderItem={renderCustomerCard}
              keyExtractor={(item, index) => index.toString()}
              ListHeaderComponent={renderTurnoverCard()}
              contentContainerStyle={styles.flatListContent}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
  },
  mainContentArea: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 15,
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
    marginBottom: 25,
    textAlign: "center",
  },
  loader: {
    marginTop: 50,
  },
  statusText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    borderColor: "dark blue",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    marginLeft: 15,
  },
  agentName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  phoneNumber: {
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 2,
  },
  cardBody: {
    marginBottom: 10,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  dataLabel: {
    fontSize: 15,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  dataValue: {
    fontSize: 16,
    color: "#34495E",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  turnoverSection: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  turnoverLabel: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "600",
    textTransform: 'uppercase',
  },
  turnoverValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 5,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: "#EAEAEA",
  },
  customersListContainer: {
    marginTop: 30,
    paddingHorizontal: 10,
  },
  customersListTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0c0c0cff",
    marginBottom: 15,
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
    position: 'relative',
  },
  customerHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a90e2",
    marginBottom: 10,
  },
  customerDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  customerLabel: {
    fontSize: 14,
    color: "#555",
  },
  customerValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#34495e",
  },
  
  freshLeadBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'green',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 15,
  },
  newLeadBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'Red',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 15,
  },
  freshLeadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default MonthlyTurnover;