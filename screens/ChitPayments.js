import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ExpoPrint from "expo-print";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

import axios from "axios";
import PaymentChitList from "../components/PaymentChitList";

const noImage = require("../assets/no.png");

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ["#24C6DC", "#183A5D"];
const MODERN_PRIMARY = "#0d0d0dff";
const ACCENT_BLUE = "#1796d1ff";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb";
const SUCCESS_GREEN = "#3ed160ff";
// ---------------------------------------------

const ChitPayments = ({ route, navigation }) => {
  const { user, areaId } = route.params;

  // --- STATE ---
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [cus, setCus] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState({});
  const [fetchError, setFetchError] = useState(null); // renamed to avoid conflict

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [activeChitId, setActiveChitId] = useState(null);
  const [showTotalCollectionDetails, setShowTotalCollectionDetails] =
    useState(false);

  // --- HELPERS ---
  const formatDate = (date) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
      return (
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // --- FILTERS STATE ---
  const [filters, setFilters] = useState([
    { id: "date", title: "Date", value: formatDate(new Date()), icon: "calendar" },
    { id: "customer", title: "Customer", value: "All", icon: "user" },
    { id: "group", title: "Group", value: "All", icon: "users" },
    { id: "paymentMode", title: "Payment Mode", value: "All", icon: "money" },
    { id: "totalCollection", title: "Total Collection", value: "...", icon: "money" },
  ]);

  const paymentModes = ["cash", "online"];

  const handleFilterPress = (filterId) => {
    if (filterId === "totalCollection") {
      setSelectedFilter(filterId);
      setShowTotalCollectionDetails(true);
    } else {
      setSelectedFilter(filterId);
      setShowPicker(true);
    }
  };

  const updateFilterValue = useCallback((id, value) => {
    setFilters((prevFilters) =>
      prevFilters.map((filter) =>
        filter.id === id ? { ...filter, value: value || "All" } : filter
      )
    );
  }, []);

  const handleChitPress = (chitId) => {
    setActiveChitId(chitId);
  };

  const closePicker = () => {
    setShowPicker(false);
    setSelectedFilter(null);
  };

  // --- API CALLS ---
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const response = await axios.get(
          `${baseUrl}/payment/get-payment-agent/${user.userId}`
        );
        if (response.data) {
          // Ensure it's always an array
          const data = Array.isArray(response.data) ? response.data : [];
          setCustomers(data);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setFetchError("Failed to load payment data. Please try again.");
        setCustomers([]); // prevent undefined crashes downstream
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      fetchCustomers();
    } else {
      setLoading(false);
      setFetchError("User ID is missing.");
    }
  }, [user?.userId]);

  useEffect(() => {
    const fetchCus = async () => {
      try {
        const response = await axios.get(`${baseUrl}/user/get-user`);
        if (response.data && Array.isArray(response.data)) {
          setCus(response.data);
        } else {
          setCus([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setCus([]);
      }
    };
    fetchCus();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`${baseUrl}/group/get-group`);
        if (response.data && Array.isArray(response.data)) {
          setGroups(response.data);
        } else {
          setGroups([]);
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
        setGroups([]);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/agent/get-agent-by-id/${user.userId}`
        );
        setAgent(response.data || {});
      } catch (error) {
        console.error("Error fetching agent data:", error);
        setAgent({});
      }
    };
    if (user?.userId) {
      fetchAgent();
    }
  }, [user?.userId]);

  // --- FILTERING LOGIC ---
  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer) => {
        if (!customer) return false;

        const nameMatch = customer?.user_id?.full_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ?? true;

        const dateMatch = isSameDate(customer.pay_date, selectedDate);

        const customerMatch =
          !selectedCustomer || customer?.user_id?._id === selectedCustomer;

        const groupMatch =
          !selectedGroup || customer?.group_id?._id === selectedGroup;

        const paymentModeMatch =
          !selectedPaymentMode || customer.pay_type === selectedPaymentMode;

        return nameMatch && dateMatch && customerMatch && groupMatch && paymentModeMatch;
      })
    : [];

  const totalAmount = filteredCustomers.reduce((sum, customer) => {
    const amount = parseFloat(customer?.amount) || 0;
    return sum + amount;
  }, 0);

  // Update total collection filter value whenever totalAmount changes
  useEffect(() => {
    if (!loading) {
      updateFilterValue("totalCollection", `₹ ${totalAmount.toFixed(2)}`);
    }
  }, [totalAmount, loading, updateFilterValue]);

  // --- PICKER RENDERER ---
  const renderPicker = () => {
    switch (selectedFilter) {
      case "date":
        return (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              if (Platform.OS === "android") {
                if (date) {
                  setSelectedDate(date);
                  updateFilterValue("date", formatDate(date));
                }
                closePicker();
              } else if (date) {
                setSelectedDate(date);
                updateFilterValue("date", formatDate(date));
              }
            }}
            minimumDate={new Date(2000, 0, 1)}
            maximumDate={new Date(2100, 11, 31)}
          />
        );

      case "group":
        return (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedGroup}
              onValueChange={(value) => {
                const selected = groups.find((g) => g._id === value);
                setSelectedGroup(value);
                setSelectedGroupName(selected?.group_name || "");
                updateFilterValue("group", selected?.group_name || "All");
                closePicker();
              }}
              style={{ color: MODERN_PRIMARY }}
              itemStyle={{ color: MODERN_PRIMARY }}
            >
              <Picker.Item label="All Groups" value="" />
              {groups.map((group) => (
                <Picker.Item
                  key={group._id}
                  label={group.group_name || "Unknown"}
                  value={group._id}
                />
              ))}
            </Picker>
            <TouchableOpacity style={styles.pickerCancelButton} onPress={closePicker}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case "customer":
        return (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedCustomer}
              onValueChange={(value) => {
                const selected = cus.find((c) => c._id === value);
                setSelectedCustomer(value);
                setSelectedCustomerName(selected?.full_name || "");
                updateFilterValue("customer", selected?.full_name || "All");
                closePicker();
              }}
              style={{ color: MODERN_PRIMARY }}
              itemStyle={{ color: MODERN_PRIMARY }}
            >
              <Picker.Item label="All Customers" value="" />
              {cus.map((customer) => (
                <Picker.Item
                  key={customer._id}
                  label={`${customer.full_name || "Unknown"} - ${customer.phone_number || ""}`}
                  value={customer._id}
                />
              ))}
            </Picker>
            <TouchableOpacity style={styles.pickerCancelButton} onPress={closePicker}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case "paymentMode":
        return (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedPaymentMode}
              onValueChange={(value) => {
                setSelectedPaymentMode(value);
                updateFilterValue("paymentMode", value || "All");
                closePicker();
              }}
              style={{ color: MODERN_PRIMARY }}
              itemStyle={{ color: MODERN_PRIMARY }}
            >
              <Picker.Item label="All Modes" value="" />
              {paymentModes.map((mode) => (
                <Picker.Item
                  key={mode}
                  label={mode.charAt(0).toUpperCase() + mode.slice(1)}
                  value={mode}
                />
              ))}
            </Picker>
            <TouchableOpacity style={styles.pickerCancelButton} onPress={closePicker}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // --- PRINT FUNCTIONS ---
  const printPDF = async () => {
    try {
      const rows = filteredCustomers
        .map(
          (customer, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${customer?.group_id?.group_name || "N/A"}</td>
            <td>${customer?.ticket || "N/A"}</td>
            <td>${customer?.user_id?.full_name || "N/A"}</td>
            <td>${customer?.user_id?.phone_number || "N/A"}</td>
            <td>${customer?.amount || "N/A"}</td>
            <td>${customer?.receipt_no || "N/A"}</td>
            <td>${customer?.pay_type || "N/A"}</td>
          </tr>`
        )
        .join("");

      const htmlContent = `
        <html>
        <head>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 0; }
            .container { padding: 10mm; }
            h1 { text-align: center; margin-bottom: 20px; color: ${MODERN_PRIMARY}; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .table th { background-color: ${SUBTLE_BG_GREY}; color: ${MODERN_PRIMARY}; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; color: ${TEXT_GREY}; }
            .total { font-weight: bold; font-size: 14px; margin-top: 10px; text-align: right; color: ${SUCCESS_GREEN}; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Chit Payment Collection Report</h1>
            <p><strong>Agent:</strong> ${agent?.name || "N/A"}</p>
            <p><strong>Date:</strong> ${selectedDate.toDateString()}</p>
            <table class="table">
              <thead>
                <tr>
                  <th>Sl.No</th>
                  <th>Group Name</th>
                  <th>Ticket</th>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Amount</th>
                  <th>Receipt Number</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p class="total">Total Collection: ₹ ${totalAmount.toFixed(2)}</p>
            <div class="footer">
              <p>Report Generated: ${new Date().toLocaleString()}</p>
              <p>Thank You!</p>
            </div>
          </div>
        </body>
        </html>`;

      await ExpoPrint.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Failed to print the document.");
      console.error("Print error:", error);
    }
  };

  const printTotalCollectionDetails = async () => {
    try {
      const htmlContent = `
        <html>
        <head>
          <style>
            @page { size: A6; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 14px; margin: 0; padding: 0; text-align: center; }
            .container { padding: 5mm; }
            h1 { font-size: 24px; margin-bottom: 10px; color: ${ACCENT_BLUE}; }
            p { font-size: 16px; margin-bottom: 5px; color: ${MODERN_PRIMARY}; }
            .amount { font-size: 36px; font-weight: bold; color: ${SUCCESS_GREEN}; margin: 15px 0; }
            .footer { margin-top: 20px; font-size: 12px; color: ${TEXT_GREY}; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Total Collection Summary</h1>
            <p class="amount">₹ ${totalAmount.toFixed(2)}</p>
            <p>Agent: ${agent?.name || "N/A"}</p>
            <p>Date: ${formatDate(selectedDate)}</p>
            <div class="footer">
              <p>Generated by Chit Payments App</p>
            </div>
          </div>
        </body>
        </html>`;

      await ExpoPrint.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Failed to print the total collection details.");
      console.error("Print summary error:", error);
    }
  };

  // --- RENDER ---
  return (
    <View style={{ flex: 1, backgroundColor: TOP_GRADIENT[0] }}>
      <LinearGradient
        colors={TOP_GRADIENT}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <TouchableOpacity
              style={styles.loadingBackButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back-outline" size={30} color={"black"} />
            </TouchableOpacity>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={CARD_BG} />
              <Text style={styles.loadingText}>Loading Payments...</Text>
            </View>
          </View>
        ) : (
          <View style={styles.screenContainer}>
            {/* Fixed Blue Header */}
            <View style={styles.fixedHeaderArea}>
              <View
                style={{
                  marginHorizontal: 22,
                  marginTop: Platform.OS === "android" ? 0 : 22,
                }}
              >
                <Header />
                <View style={styles.titleCollectionContainer}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={styles.title}>Chit Payments</Text>
                    <Text style={styles.totalAmountText}>
                      ₹ {totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Error Banner */}
                {fetchError ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{fetchError}</Text>
                  </View>
                ) : null}

                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <Icon
                    name="search"
                    size={20}
                    color={TEXT_GREY}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    value={search}
                    onChangeText={(text) => setSearch(text)}
                    placeholder="Search customer name..."
                    placeholderTextColor={TEXT_GREY}
                    style={styles.searchInput}
                  />
                </View>
              </View>
            </View>

            {/* Main Content Area */}
            <View style={styles.mainContentArea}>
              {/* Filters & Print */}
              <View style={styles.filterContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContainer}
                >
                  {filters.map((filter) => (
                    <TouchableOpacity
                      key={filter.id}
                      style={[
                        styles.card,
                        selectedFilter === filter.id && styles.activeCard,
                        filter.id === "totalCollection" &&
                          styles.totalCollectionCard,
                      ]}
                      onPress={() => handleFilterPress(filter.id)}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.cardIconContainer}>
                          <Icon
                            name={filter.icon}
                            size={20}
                            color={
                              filter.id === "totalCollection"
                                ? SUCCESS_GREEN
                                : ACCENT_BLUE
                            }
                          />
                        </View>
                        <View style={styles.cardTextContainer}>
                          <Text style={styles.cardTitle}>{filter.title}</Text>
                          <Text
                            style={[
                              styles.cardValue,
                              filter.id === "totalCollection" &&
                                styles.totalCollectionValue,
                            ]}
                          >
                            {filter.value}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity onPress={printPDF} style={styles.printButton}>
                  <Ionicons
                    name="print-outline"
                    size={20}
                    color={MODERN_PRIMARY}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.printButtonText}>Print Report</Text>
                </TouchableOpacity>
              </View>

              {/* Customer List */}
              <ScrollView
                style={styles.listScrollView}
                contentContainerStyle={{ paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
              >
                {filteredCustomers.length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Image source={noImage} style={styles.noImage} />
                    <Text style={styles.noDataText}>
                      No Payments are available
                    </Text>
                  </View>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <PaymentChitList
                      key={customer._id ? customer._id.toString() : `item-${index}`}
                      idx={index}
                      name={customer?.user_id?.full_name || "N/A"}
                      cus_id={customer._id}
                      phone={customer?.user_id?.phone_number || "N/A"}
                      receipt={customer.receipt_no}
                      date={customer.pay_date}
                      amount={customer.amount}
                      group={customer?.group_id?.group_name || "N/A"}
                      type={customer.pay_type}
                      navigation={navigation}
                      user={user}
                      onPress={() => handleChitPress(customer._id)}
                      customer={customer}
                      isActive={customer._id === activeChitId}
                      ticket={customer.ticket}
                    />
                  ))
                )}
              </ScrollView>
            </View>

            {/* ---- MODALS ---- */}

            {/* Non-date filter modal */}
            {showPicker &&
              selectedFilter &&
              selectedFilter !== "date" && (
                <Modal
                  visible={showPicker}
                  transparent
                  animationType="fade"
                  onRequestClose={closePicker}
                >
                  <View style={styles.modalContainer}>
                    <View style={styles.pickerContainer}>
                      <TouchableOpacity
                        onPress={closePicker}
                        style={styles.pickerCloseButton}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={30}
                          color={TEXT_GREY}
                        />
                      </TouchableOpacity>
                      {renderPicker()}
                    </View>
                  </View>
                </Modal>
              )}

            {/* iOS Date Picker Modal */}
            {showPicker &&
              selectedFilter === "date" &&
              Platform.OS === "ios" && (
                <Modal
                  visible={showPicker}
                  transparent
                  animationType="slide"
                  onRequestClose={closePicker}
                >
                  <View style={styles.modalContainer}>
                    <View style={styles.pickerContainer}>
                      <View style={styles.datePickerHeader}>
                        <Text style={styles.datePickerTitle}>Select Date</Text>
                        <TouchableOpacity
                          onPress={closePicker}
                          style={styles.pickerCloseButton}
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={30}
                            color={TEXT_GREY}
                          />
                        </TouchableOpacity>
                      </View>
                      {renderPicker()}
                      <TouchableOpacity
                        style={styles.datePickerDoneButton}
                        onPress={closePicker}
                      >
                        <Text style={styles.datePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              )}

            {/* Android Date Picker — renders natively */}
            {showPicker &&
              selectedFilter === "date" &&
              Platform.OS === "android" && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 100,
                  }}
                >
                  {renderPicker()}
                </View>
              )}

            {/* Total Collection Details Modal */}
            <Modal
              visible={showTotalCollectionDetails}
              transparent={false}
              animationType="slide"
              onRequestClose={() => {
                setShowTotalCollectionDetails(false);
                setSelectedFilter(null);
              }}
            >
              <LinearGradient
                colors={TOP_GRADIENT}
                style={styles.fullScreenModalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.fullScreenModalContainer}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setShowTotalCollectionDetails(false);
                      setSelectedFilter(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={30} color={CARD_BG} />
                  </TouchableOpacity>

                  <View style={styles.totalDetailsCard}>
                    <Text style={styles.totalDetailsTitle}>
                      Collection Summary
                    </Text>
                    <Text style={styles.totalDetailsAmount}>
                      ₹ {totalAmount.toFixed(2)}
                    </Text>
                    <View style={styles.summaryInfo}>
                      <Text style={styles.totalDetailsAgent}>
                        Agent: {agent?.name || "N/A"}
                      </Text>
                      <Text style={styles.totalDetailsDate}>
                        Date: {formatDate(selectedDate)}
                      </Text>
                    </View>

                    <Text style={styles.paymentDetailsHeader}>
                      Individual Payments ({filteredCustomers.length})
                    </Text>

                    <ScrollView style={styles.paymentDetailsScrollView}>
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer, index) => (
                          <View key={`detail-${customer._id || index}`} style={styles.paymentDetailItem}>
                            <Text style={styles.paymentDetailText}>
                              <Text style={styles.paymentDetailLabel}>
                                Customer:{" "}
                              </Text>
                              {customer?.user_id?.full_name || "N/A"}
                            </Text>
                            <Text style={styles.paymentDetailText}>
                              <Text style={styles.paymentDetailLabel}>
                                Group:{" "}
                              </Text>
                              {customer?.group_id?.group_name || "N/A"}
                            </Text>
                            <Text style={styles.paymentDetailText}>
                              <Text style={styles.paymentDetailLabel}>
                                Amount:{" "}
                              </Text>
                              <Text style={{ fontWeight: "bold", color: SUCCESS_GREEN }}>
                                ₹ {parseFloat(customer?.amount || 0).toFixed(2)}
                              </Text>
                            </Text>
                            <Text style={styles.paymentDetailText}>
                              <Text style={styles.paymentDetailLabel}>
                                Mode:{" "}
                              </Text>
                              {customer?.pay_type || "N/A"}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noPaymentsText}>
                          No payments matching the current filters.
                        </Text>
                      )}
                    </ScrollView>

                    <TouchableOpacity
                      onPress={printTotalCollectionDetails}
                      style={styles.printDetailsButton}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={20}
                        color={MODERN_PRIMARY}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.printDetailsButtonText}>
                        Print Summary
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </Modal>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: { flex: 1 },
  screenContainer: { flex: 1 },
  fixedHeaderArea: {
    paddingTop: Platform.OS === "android" ? 35 : 0,
    paddingBottom: 20,
    zIndex: 10,
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    zIndex: 2,
    paddingTop: 20,
  },
  listScrollView: {
    flex: 1,
    marginHorizontal: 22,
  },

  // Loading
  loadingContainer: { flex: 1 },
  loadingBackButton: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 80,
    left: 15,
    zIndex: 10,
    padding: 5,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: CARD_BG,
    fontWeight: "500",
  },

  // Error banner
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },

  // Title
  titleCollectionContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 1,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: CARD_BG,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  totalAmountText: {
    fontSize: 22,
    fontWeight: "bold",
    color: CARD_BG,
    marginTop: 5,
    opacity: 0.9,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    marginBottom: 20,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    height: 50,
    marginHorizontal: 22,
  },
  searchIcon: { marginLeft: 15, color: TEXT_GREY },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 10,
    fontSize: 16,
    color: MODERN_PRIMARY,
  },

  // Filters
  filterContainer: { marginBottom: 15 },
  scrollContainer: { paddingHorizontal: 22 },
  card: {
    backgroundColor: CARD_BG,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    marginRight: 12,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 120,
  },
  activeCard: {
    borderColor: ACCENT_BLUE,
    backgroundColor: SUBTLE_BG_GREY,
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  cardIconContainer: { marginRight: 10 },
  cardTextContainer: { flexDirection: "column" },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_GREY,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 15,
    color: MODERN_PRIMARY,
    fontWeight: "bold",
  },
  totalCollectionCard: {
    borderLeftWidth: 5,
    borderLeftColor: SUCCESS_GREEN,
    backgroundColor: "#E6F7E9",
  },
  totalCollectionValue: { color: SUCCESS_GREEN, fontSize: 16 },
  printButton: {
    marginHorizontal: 22,
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8c009ff",
    borderRadius: 15,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  printButtonText: { fontSize: 16, fontWeight: "bold", color: MODERN_PRIMARY },

  // Modals
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  pickerContainer: {
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    width: "90%",
  },
  pickerCloseButton: { alignSelf: "flex-end", marginBottom: 10 },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: MODERN_PRIMARY,
  },
  datePickerDoneButton: {
    backgroundColor: ACCENT_BLUE,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },
  datePickerDoneText: { color: "white", fontWeight: "bold", fontSize: 16 },
  pickerWrapper: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    width: "90%",
    alignSelf: "center",
  },
  pickerCancelButton: {
    backgroundColor: MODERN_PRIMARY,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  pickerCancelText: { color: "white", fontWeight: "bold" },

  // Total Collection Modal
  fullScreenModalGradient: { flex: 1 },
  fullScreenModalContainer: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
  },
  totalDetailsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    width: "100%",
    flex: 1,
    maxWidth: 500,
    maxHeight: "100%",
  },
  totalDetailsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: MODERN_PRIMARY,
    marginBottom: 15,
  },
  totalDetailsAmount: {
    fontSize: 40,
    fontWeight: "900",
    color: SUCCESS_GREEN,
    marginBottom: 10,
  },
  summaryInfo: { alignItems: "center", marginBottom: 20 },
  totalDetailsAgent: { fontSize: 16, color: TEXT_GREY, marginBottom: 5 },
  totalDetailsDate: { fontSize: 14, color: TEXT_GREY, opacity: 0.8 },
  paymentDetailsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: ACCENT_BLUE,
    marginBottom: 10,
    alignSelf: "flex-start",
    width: "100%",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 5,
  },
  paymentDetailsScrollView: { width: "100%", flexGrow: 1 },
  paymentDetailItem: {
    backgroundColor: SUBTLE_BG_GREY,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  paymentDetailText: { fontSize: 14, color: TEXT_GREY, marginBottom: 2 },
  paymentDetailLabel: { fontWeight: "bold", color: MODERN_PRIMARY },
  printDetailsButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: "#f8c009ff",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  printDetailsButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: MODERN_PRIMARY,
  },

  // No data
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    color: TEXT_GREY,
    textAlign: "center",
    fontWeight: "500",
  },
  noImage: {
    width: 200,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
    opacity: 0.6,
  },
  noPaymentsText: { textAlign: "center", color: TEXT_GREY, marginTop: 20 },
});

export default ChitPayments;