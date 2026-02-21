import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header"; // Assuming same header path
import baseUrl from "../constants/baseUrl";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width } = Dimensions.get("window");

// --- DESIGN CONSTANTS (Matching Home.js) ---
const TOP_GRADIENT = ["#24C6DC", "#183A5D"];
const MODERN_PRIMARY = "#0d0d0eff";
const ACCENT_BLUE = "#1796d1ff";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const HIGHLIGHT_GOLD = "#f5be6dff";

const StarPoints = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pointsData, setPointsData] = useState([]);
  const [totals, setTotals] = useState({});

  // Format date for API (YYYY-MM-DD)
  const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format date for Display (DD-MM-YYYY)
  const formatDateDisplay = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} - ${month} - ${year}`;
  };

  useEffect(() => {
    fetchStarPoints();
  }, [selectedDate]);

  const fetchStarPoints = async () => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await axios.get(
        `${baseUrl}/star-points?date=${formatDateForApi(selectedDate)}`
      );
      
      if (response.data) {
        // Assuming response.data has structure: { rows: [], totals: {} }
        // Adjust keys based on your actual API response
        setPointsData(response.data.rows || []);
        setTotals(response.data.totals || {});
      }
    } catch (error) {
      console.error("Error fetching star points:", error);
      Alert.alert("Error", "Could not fetch star points data.");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };

  // Helper to render table header
  const renderTableHeader = () => (
    <View style={styles.tableRowHeader}>
      <Text style={[styles.tableCell, styles.cellSl, styles.headerText]}>SL</Text>
      <Text style={[styles.tableCell, styles.cellName, styles.headerText]}>Name</Text>
      <Text style={[styles.tableCell, styles.cellSmall, styles.headerText]}>APP</Text>
      <Text style={[styles.tableCell, styles.cellSmall, styles.headerText]}>LEADS</Text>
      <Text style={[styles.tableCell, styles.cellSmall, styles.headerText]}>LOAN</Text>
      <Text style={[styles.tableCell, styles.cellSmall, styles.headerText]}>TOTAL</Text>
    </View>
  );

  // Helper to render table rows
  const renderTableRows = () => {
    if (pointsData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No records found for this date.</Text>
        </View>
      );
    }

    return pointsData.map((item, index) => (
      <View key={item.id || index} style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.cellSl]}>{index + 1}</Text>
        <Text style={[styles.tableCell, styles.cellName, styles.nameText]}>
          {item.employeeName || "N/A"}
        </Text>
        <Text style={[styles.tableCell, styles.cellSmall]}>{item.app || 0}</Text>
        <Text style={[styles.tableCell, styles.cellSmall]}>{item.leads || 0}</Text>
        <Text style={[styles.tableCell, styles.cellSmall]}>{item.loan || 0}</Text>
        <Text style={[styles.tableCell, styles.cellSmall, styles.totalHighlight]}>
          {item.totalPoints || 0}
        </Text>
      </View>
    ));
  };

  // Helper to render totals row
  const renderTotals = () => (
    <View style={styles.tableRowTotal}>
      <Text style={[styles.tableCell, styles.cellSl, styles.totalText]}>-</Text>
      <Text style={[styles.tableCell, styles.cellName, styles.totalText]}>TOTAL</Text>
      <Text style={[styles.tableCell, styles.cellSmall, styles.totalText]}>{totals.app || 0}</Text>
      <Text style={[styles.tableCell, styles.cellSmall, styles.totalText]}>{totals.leads || 0}</Text>
      <Text style={[styles.tableCell, styles.cellSmall, styles.totalText]}>{totals.loan || 0}</Text>
      <Text style={[styles.tableCell, styles.cellSmall, styles.grandTotalText]}>
        {totals.totalPoints || 0}
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={TOP_GRADIENT} style={{ flex: 1 }}>
      <View style={styles.mainContentArea}>
        <Header />
        
        {/* Title Section */}
        <View style={styles.introSection}>
          <Text style={styles.pageTitle}>Star Points</Text>
          <Text style={styles.pageSubtitle}>Agent Performance Overview</Text>
        </View>

        {/* Date Filter Card */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={styles.datePickerButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerIcon}>📅</Text>
            <Text style={styles.datePickerText}>{formatDateDisplay(selectedDate)}</Text>
            <Text style={styles.datePickerAction}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Main Table Card */}
        <ScrollView 
          style={styles.scrollViewStyle} 
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tableCard}>
            {loading ? (
              <ActivityIndicator size="large" color={ACCENT_BLUE} style={{ marginTop: 50 }} />
            ) : (
              <>
                {/* Horizontal Scroll for Table Data if needed */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tableContainer}>
                    {renderTableHeader()}
                    {renderTableRows()}
                    {pointsData.length > 0 && renderTotals()}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContentArea: {
    flex: 1,
    marginHorizontal: 22,
    marginTop: 40,
  },
  introSection: {
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  
  // Date Filter Styles
  filterContainer: {
    marginBottom: 20,
  },
  datePickerButton: {
    flexDirection: "row",
    backgroundColor: CARD_BG,
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  datePickerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: MODERN_PRIMARY,
  },
  datePickerAction: {
    fontSize: 14,
    fontWeight: "800",
    color: ACCENT_BLUE,
    textTransform: "uppercase",
  },

  // Table Card Styles
  scrollViewStyle: {
    flex: 1,
  },
  tableCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    paddingBottom: 20,
  },
  
  // Table Layout
  tableContainer: {
    minWidth: width - 64, // Ensure it fits screen or expands
    paddingBottom: 10,
  },
  tableRowHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: BORDER_COLOR,
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  tableRowTotal: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: HIGHLIGHT_GOLD,
    borderRadius: 10,
  },
  
  // Cell Widths
  tableCell: {
    fontSize: 13,
    textAlign: "center",
    justifyContent: "center",
  },
  cellSl: {
    width: 40,
    textAlign: "left",
  },
  cellName: {
    width: 120,
    textAlign: "left",
  },
  cellSmall: {
    width: 60,
  },
  
  // Text Styles
  headerText: {
    fontWeight: "900",
    color: MODERN_PRIMARY,
    fontSize: 12,
    textTransform: "uppercase",
  },
  nameText: {
    fontWeight: "700",
    color: TEXT_GREY,
  },
  totalHighlight: {
    fontWeight: "bold",
    color: ACCENT_BLUE,
  },
  
  // Total Row Styles
  totalText: {
    fontWeight: "900",
    color: MODERN_PRIMARY,
  },
  grandTotalText: {
    fontWeight: "900",
    color: MODERN_PRIMARY,
    fontSize: 15,
  },
  
  noDataContainer: {
    padding: 40,
    alignItems: "center",
  },
  noDataText: {
    color: TEXT_GREY,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default StarPoints;