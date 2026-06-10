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
  Dimensions, 
  Platform,
  RefreshControl 
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ExpoPrint from 'expo-print';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// Web-specific imports
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

import axios from "axios";
import PigmePaymentList from "../components/PigmePaymentList";

const noImage = require('../assets/no.png');

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0dff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 
const SUCCESS_GREEN = '#3ed160ff';
// ---------------------------------------------

const PigmePayments = ({ route, navigation }) => { 
  const { user, areaId } = route.params;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [cus, setCus] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agent, setAgent] = useState({});

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [pigmeSearch, setPigmeSearch] = useState('');
  const [selectedPigmyId, setSelectedPigmyId] = useState(''); 
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedPigmyName, setSelectedPigmyName] = useState(''); 
  const [activeChitId, setActiveChitId] = useState(null);
  const [showTotalCollectionDetails, setShowTotalCollectionDetails] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Web date picker state
  const [showWebDatePicker, setShowWebDatePicker] = useState(false);

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateForAPI = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    });
  };

  const [filters, setFilters] = useState([
    { id: 'date', title: 'Date', value: formatDisplayDate(new Date()), icon: 'calendar' },
    { id: 'customer', title: 'Customer', value: 'All', icon: 'user' },
    { id: 'pigme', title: 'Pigme ID', value: 'All', icon: 'money' }, 
    { id: 'paymentMode', title: 'Payment Mode', value: 'All', icon: 'credit-card' }, 
    { id: 'totalCollection', title: 'Total Collection', value: '...', icon: 'dollar' }, 
  ]);

  const paymentModes = ['cash', 'online'];

  const handleFilterPress = (filterId) => {
    if (filterId === 'totalCollection') {
      setSelectedFilter(filterId);
      setShowTotalCollectionDetails(true);
    } else if (filterId === 'date') {
      if (Platform.OS === "web") {
        setShowWebDatePicker(true);
      } else {
        setSelectedFilter(filterId);
        setShowPicker(true);
      }
    } else {
      setSelectedFilter(filterId);
      setShowPicker(true);
    }
  };

  const updateFilterValue = (id, value) => {
    setFilters(prevFilters =>
      prevFilters.map(filter =>
        filter.id === id ? { ...filter, value: value || 'All' } : filter
      )
    );
  };

  const handleChitPress = (chitId) => {
    setActiveChitId(chitId);
  };

  const closePicker = () => {
    setShowPicker(false);
    setSelectedFilter(null);
  };

  const handleDateChange = (date) => {
    if (date) {
      console.log("📅 Date Selected:", date);
      setSelectedDate(date);
      updateFilterValue('date', formatDisplayDate(date));
      setShowWebDatePicker(false);
    }
  };

  // --- API CALLS ---
  const fetchCustomers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const formattedDate = formatDateForAPI(selectedDate);

      const params = {
        collected_by: user?.userId,
        userId: selectedCustomer || undefined,
        pigme_id: selectedPigmyId || undefined,
        pay_type: selectedPaymentMode || undefined,
        payment_type: "Pigme Payment",
        from_date: formattedDate,
        to_date: formattedDate,
      };

      console.log("========== PIGME API DEBUG ==========");
      console.log("Selected Date:", selectedDate);
      console.log("Formatted Date:", formattedDate);
      console.log("REQUEST PARAMS:", JSON.stringify(params, null, 2));

      const response = await axios.get(
        `${baseUrl}/v1/mobile/payments/daily-report`,
        { params }
      );

      console.log("API Response Status:", response.status);

      if (response?.data && Array.isArray(response.data)) {
        console.log("Total payments received:", response.data.length);
        
        const pigmePayments = response.data.filter((item) => {
          return (
            item?.pay_for === "Pigme" ||
            item?.payment_type === "Pigme Payment"
          );
        });

        console.log("Pigme payments filtered:", pigmePayments.length);
        setCustomers(pigmePayments);

        const uniqueUsers = pigmePayments.reduce((acc, item) => {
          const user = item?.user_id;
          if (user && !acc.some((u) => u._id === user._id)) {
            acc.push(user);
          }
          return acc;
        }, []);

        setCus(uniqueUsers);
      } else {
        setCustomers([]);
        setCus([]);
      }
    } catch (error) {
      console.error("Error fetching pigme payment data:", error);
      setCustomers([]);
      setCus([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId, selectedDate, selectedCustomer, selectedPigmyId, selectedPaymentMode]);

  useEffect(() => {
    if (user?.userId) {
      fetchCustomers();
    } else {
      setLoading(false);
    }
  }, [fetchCustomers, user?.userId]);

  useEffect(() => {
    const fetchCus = async () => {
      try {
        const response = await axios.get(`${baseUrl}/user/get-user`);
        if (response.data) {
          setCus(response.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
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
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await axios.get(`${baseUrl}/agent/get-agent-by-id/${user.userId}`);
        setAgent(response.data);
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };
    if (user?.userId) {
      fetchAgent();
    }
  }, [user?.userId]);

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer) => {
        const nameMatch = customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase());
        const customerMatch = !selectedCustomer || customer?.user_id?._id === selectedCustomer;
        const pigmyMatch = !selectedPigmyId || customer?.pigme?.pigme_id === selectedPigmyId; 
        const paymentModeMatch = !selectedPaymentMode || customer.pay_type === selectedPaymentMode;
        return nameMatch && customerMatch && pigmyMatch && paymentModeMatch;
      })
    : [];

  const totalAmount = filteredCustomers.reduce((sum, customer) => {
    const amount = parseFloat(customer.amount) || 0;
    return sum + amount;
  }, 0);

  useEffect(() => {
    if (!loading) {
      updateFilterValue('totalCollection', `₹ ${totalAmount.toFixed(2)}`);
    }
  }, [totalAmount, loading]);

  const onRefresh = useCallback(() => {
    fetchCustomers(true);
  }, [fetchCustomers]);

  const renderPicker = () => {
    switch (selectedFilter) {
      case 'pigme':
        const uniquePigmyIds = [
          ...new Set(customers.map((c) => c?.pigme?.pigme_id).filter(Boolean)),
        ];

        const filteredPigmes = uniquePigmyIds.filter((pigmyId) =>
          pigmyId?.toString().toLowerCase().includes(pigmeSearch.toLowerCase())
        );

        return (
          <View style={styles.pickerWrapper}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                value={pigmeSearch}
                onChangeText={setPigmeSearch}
                placeholder="Search Pigme ID..."
                placeholderTextColor="#999"
                style={styles.pickerSearchInput}
              />
            </View>

            <ScrollView style={styles.pickerScrollView}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedPigmyId('');
                  setSelectedPigmyName('');
                  updateFilterValue('pigme', 'All');
                  closePicker();
                }}
              >
                <Text style={styles.pickerItemText}>All Pigme Accounts</Text>
              </TouchableOpacity>

              {filteredPigmes.map((pigmyId) => (
                <TouchableOpacity
                  key={pigmyId}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedPigmyId(pigmyId);
                    setSelectedPigmyName(pigmyId || '');
                    updateFilterValue('pigme', `ID: ${pigmyId}`);
                    setPigmeSearch('');
                    closePicker();
                  }}
                >
                  <Text style={styles.pickerItemText}>Pigme ID: {pigmyId}</Text>
                </TouchableOpacity>
              ))}

              {filteredPigmes.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No Pigme IDs found</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.pickerCancelButton} onPress={closePicker}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case 'customer':
        const filteredCus = cus.filter((customer) => {
          const searchText = customerSearch.toLowerCase();
          return (
            customer?.full_name?.toLowerCase().includes(searchText) ||
            customer?.phone_number?.toLowerCase().includes(searchText)
          );
        });

        return (
          <View style={styles.pickerWrapper}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholder="Search customer..."
                placeholderTextColor="#999"
                style={styles.pickerSearchInput}
              />
            </View>

            <ScrollView style={styles.pickerScrollView}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedCustomer('');
                  setSelectedCustomerName('');
                  updateFilterValue('customer', 'All');
                  closePicker();
                }}
              >
                <Text style={styles.pickerItemText}>All Customers</Text>
              </TouchableOpacity>

              {filteredCus.map((customer) => (
                <TouchableOpacity
                  key={customer._id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedCustomer(customer?._id || '');
                    setSelectedCustomerName(customer?.full_name || '');
                    updateFilterValue('customer', customer?.full_name || 'All');
                    setCustomerSearch('');
                    closePicker();
                  }}
                >
                  <Text style={styles.pickerItemText}>{customer?.full_name || 'Unknown'}</Text>
                  <Text style={styles.pickerItemSubText}>{customer?.phone_number || ''}</Text>
                </TouchableOpacity>
              ))}

              {filteredCus.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No customers found</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.pickerCancelButton} onPress={closePicker}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case 'paymentMode':
        return (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedPaymentMode}
              onValueChange={(value) => {
                setSelectedPaymentMode(value);
                updateFilterValue('paymentMode', value ? value.charAt(0).toUpperCase() + value.slice(1) : 'All');
                closePicker();
              }}
              style={{ color: MODERN_PRIMARY }}
              itemStyle={{ color: MODERN_PRIMARY }}
            >
              <Picker.Item label="All Modes" value="" />
              {paymentModes.map((mode) => (
                <Picker.Item key={mode} label={mode.charAt(0).toUpperCase() + mode.slice(1)} value={mode} />
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

  const printPDF = async () => {
    const filteredCustomersForPrint = filteredCustomers
      .map((customer, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${customer?.pigme?.pigme_id || "N/A"}</td>
          <td>${customer.ticket || "N/A"}</td>
          <td>${customer?.user_id?.full_name || "N/A"}</td>
          <td>${customer?.user_id?.phone_number || "N/A"}</td>
          <td>${customer.amount || "N/A"}</td>
          <td>${customer.receipt_no || "N/A"}</td>
          <td>${customer.pay_type || "N/A"}</td>
        </tr>
      `)
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
          <h1>Pigmy Payment Collection Report</h1>
          <p><strong>Agent:</strong> ${agent.name || 'N/A'}</p>
          <p><strong>Date:</strong> ${formatDisplayDate(selectedDate)}</p>
          <table class="table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Pigmy ID</th>
                <th>Ticket</th>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Amount</th>
                <th>Receipt Number</th>
                <th>Payment Mode</th>
              </tr>
            </thead>
            <tbody>${filteredCustomersForPrint}</tbody>
          </table>
          <p class="total">Total Collection: ₹ ${totalAmount.toFixed(2)}</p>
          <div class="footer">
            <p>Report Generated: ${new Date().toLocaleString()}</p>
            <p>Thank You!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await ExpoPrint.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Failed to print the document.");
    }
  };

  const printTotalCollectionDetails = async () => {
    const customerListHtml = filteredCustomers.map((customer) => `
      <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #ccc;">
        <div style="font-size: 14px; margin-bottom: 2px; color: #000;">
          <strong>Customer:</strong> ${customer?.user_id?.full_name || 'N/A'}
        </div>
        <div style="font-size: 13px; margin-bottom: 2px; color: #444;">
          <strong>Pigmy ID:</strong> ${customer?.pigme?.pigme_id || 'N/A'}
        </div>
        <div style="font-size: 13px; margin-bottom: 2px; color: #444;">
          <strong>Receipt:</strong> ${customer.receipt_no || 'N/A'}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px;">
          <div style="font-size: 13px; color: #444;">
            <strong>Mode:</strong> ${customer.pay_type || 'N/A'}
          </div>
          <div style="font-size: 14px; font-weight: bold; color: #3ed160ff;">
            ₹ ${parseFloat(customer.amount || 0).toFixed(2)}
          </div>
        </div>
      </div>
    `).join("");

    const htmlContent = `
      <html>
      <head>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 0; color: #333; }
          .container { padding: 0mm; }
          h1 { text-align: center; font-size: 22px; margin-bottom: 5px; color: #183A5D; }
          .header-info { text-align: center; margin-bottom: 15px; font-size: 13px; color: #555; border-bottom: 2px solid #183A5D; padding-bottom: 10px; }
          .total-amount { text-align: center; font-size: 26px; font-weight: bold; color: #3ed160ff; margin: 10px 0 20px 0; background-color: #f0fdf4; padding: 10px; border-radius: 8px; border: 1px solid #3ed160ff; }
          .list-container { margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Pigmy Collection Summary</h1>
          <div class="header-info">
            <p><strong>Agent:</strong> ${agent.name || 'N/A'}</p>
            <p><strong>Date:</strong> ${formatDisplayDate(selectedDate)}</p>
          </div>
          <div class="total-amount">Total: ₹ ${totalAmount.toFixed(2)}</div>
          <div class="list-container">${customerListHtml}</div>
          <div class="footer">
            <p>Generated by Pigmy Payments App</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await ExpoPrint.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Failed to print the total collection details.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: TOP_GRADIENT[0] }}>
      <LinearGradient 
        colors={TOP_GRADIENT}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <TouchableOpacity
              style={styles.loadingBackButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back-outline" size={30} color={"Black"} />
            </TouchableOpacity>
            
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={CARD_BG} />
              <Text style={styles.loadingText}>Loading Payments...</Text>
            </View>
          </View>
        ) : (
          <View style={styles.screenContainer}> 
            {/* Fixed Blue Header Content */}
            <View style={styles.fixedHeaderArea}>
              <View style={{ marginHorizontal: 22, marginTop: Platform.OS === 'android' ? 0 : 32 }}>
                <Header />
                <View style={styles.titleCollectionContainer}>
                  <View style={{alignItems: 'center'}}>
                    <Text style={styles.title}>Pigmy Payments</Text>
                    <Text style={styles.totalAmountText}>₹ {totalAmount.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <Icon
                    name="search"
                    size={18}
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
              {/* Filters and Print Button */}
              <View style={styles.filterContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContainer}>
                  {filters.map((filter) => (
                    <TouchableOpacity
                      key={filter.id}
                      style={[
                        styles.card,
                        selectedFilter === filter.id && styles.activeCard,
                        filter.id === 'totalCollection' && styles.totalCollectionCard
                      ]}
                      onPress={() => handleFilterPress(filter.id)}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.cardIconContainer}>
                          <Icon name={filter.icon} size={20} color={filter.id === 'totalCollection' ? SUCCESS_GREEN : ACCENT_BLUE} />
                        </View>
                        <View style={styles.cardTextContainer}>
                          <Text style={styles.cardTitle}>{filter.title}</Text>
                          <Text style={[styles.cardValue, filter.id === 'totalCollection' && styles.totalCollectionValue]}>
                            {filter.value}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity onPress={printPDF} style={styles.printButton}>
                  <Ionicons name="print-outline" size={20} color={MODERN_PRIMARY} style={{ marginRight: 5 }} />
                  <Text style={styles.printButtonText}>Print Report</Text>
                </TouchableOpacity>
              </View>

              {/* Customer List */}
              <ScrollView
                style={styles.listScrollView}
                contentContainerStyle={{ paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={ACCENT_BLUE}
                    colors={[ACCENT_BLUE]}
                  />
                }
              >
                {filteredCustomers.length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Image source={noImage} style={styles.noImage} />
                    <Text style={styles.noDataText}>No Payments are available</Text>
                  </View>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <PigmePaymentList
                      key={customer?._id || index}
                      idx={index}
                      name={customer?.user_id?.full_name || 'N/A'}
                      cus_id={customer?.user_id?._id}
                      phone={customer?.user_id?.phone_number || 'N/A'}
                      receipt={customer?.receipt_no}
                      date={customer?.pay_date}
                      amount={customer.amount}
                      pigmeId={customer?.pigme?.pigme_id || 'N/A'} 
                      actual_pigme_id={customer?.pigme?._id || "N/A"}
                      pigmeAmount={customer?.pigme?.payable_amount || 'N/A'} 
                      type={customer?.pay_type}
                      agent_name={agent.name || "N/A"}
                      navigation={navigation}
                      user={user}
                      onPress={() => handleChitPress(customer._id)}
                      customer={customer}
                      isActive={customer._id === activeChitId}
                    />
                  ))
                )}
              </ScrollView>

              {/* Web Date Picker Modal */}
              {Platform.OS === "web" && showWebDatePicker && (
                <Modal
                  visible={showWebDatePicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowWebDatePicker(false)}
                >
                  <View style={styles.webModalOverlay}>
                    <View style={styles.webDatePickerContainer}>
                      <View style={styles.webDatePickerHeader}>
                        <Text style={styles.webDatePickerTitle}>Select Date</Text>
                        <TouchableOpacity onPress={() => setShowWebDatePicker(false)}>
                          <Ionicons name="close" size={24} color={MODERN_PRIMARY} />
                        </TouchableOpacity>
                      </View>
                      <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        inline
                        maxDate={new Date()}
                        minDate={new Date(2000, 0, 1)}
                        dateFormat="dd/MM/yyyy"
                      />
                      <TouchableOpacity
                        style={styles.webDatePickerDoneButton}
                        onPress={() => setShowWebDatePicker(false)}
                      >
                        <Text style={styles.webDatePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              )}

              {/* Standard modal for non-date filters */}
              {Platform.OS !== "web" && showPicker && selectedFilter && selectedFilter !== 'date' && (
                <Modal
                  visible={showPicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={closePicker}
                >
                  <View style={styles.modalContainer}>
                    <View style={styles.pickerContainer}>
                      <TouchableOpacity onPress={closePicker} style={styles.pickerCloseButton}>
                        <Ionicons name="close-circle-outline" size={30} color={TEXT_GREY} />
                      </TouchableOpacity>
                      {renderPicker()}
                    </View>
                  </View>
                </Modal>
              )}

              {/* iOS Date Picker Modal */}
              {Platform.OS !== "web" && showPicker && selectedFilter === 'date' && Platform.OS === 'ios' && (
                <Modal
                  visible={showPicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={closePicker}
                >
                  <View style={styles.modalContainer}>
                    <View style={styles.pickerContainer}>
                      <View style={styles.datePickerHeader}>
                        <Text style={styles.datePickerTitle}>Select Date</Text>
                        <TouchableOpacity onPress={closePicker} style={styles.pickerCloseButton}>
                          <Ionicons name="close-circle-outline" size={30} color={TEXT_GREY} />
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="spinner"
                        onChange={(event, date) => {
                          if (date) {
                            setSelectedDate(date);
                            updateFilterValue('date', formatDisplayDate(date));
                          }
                        }}
                        minimumDate={new Date(2000, 0, 1)}
                        maximumDate={new Date(2100, 11, 31)}
                      />
                      <TouchableOpacity style={styles.datePickerDoneButton} onPress={closePicker}>
                        <Text style={styles.datePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              )}

              {/* Android Date Picker */}
              {Platform.OS !== "web" && showPicker && selectedFilter === 'date' && Platform.OS === 'android' && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowPicker(false);
                      setSelectedFilter(null);
                      if (date) {
                        setSelectedDate(date);
                        updateFilterValue('date', formatDisplayDate(date));
                      }
                    }}
                    minimumDate={new Date(2000, 0, 1)}
                    maximumDate={new Date(2100, 11, 31)}
                  />
                </View>
              )}
            </View>

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
                    <Text style={styles.totalDetailsTitle}>Collection Summary</Text>
                    <Text style={styles.totalDetailsAmount}>₹ {totalAmount.toFixed(2)}</Text>
                    <View style={styles.summaryInfo}>
                      <Text style={styles.totalDetailsAgent}>Agent: {agent.name || 'N/A'}</Text>
                      <Text style={styles.totalDetailsDate}>Date: {formatDisplayDate(selectedDate)}</Text>
                    </View>

                    <Text style={styles.paymentDetailsHeader}>Individual Payments ({filteredCustomers.length}):</Text>
                    <ScrollView style={styles.paymentDetailsScrollView}>
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer, index) => (
                          <View key={customer?._id || index} style={styles.paymentDetailItem}>
                            <Text style={styles.paymentDetailText}>
                              <Text style={styles.paymentDetailLabel}>Customer:</Text> {customer?.user_id?.full_name || 'N/A'}
                            </Text>
                            <Text style={styles.paymentDetailText}>
                              <Text style={styles.paymentDetailLabel}>Pigmy ID:</Text> {customer?.pigme?.pigme_id || 'N/A'} 
                            </Text>
                            <Text style={styles.paymentDetailText}>
                              <Text style={styles.paymentDetailLabel}>Amount:</Text> <Text style={{fontWeight: 'bold', color: SUCCESS_GREEN}}>₹ {parseFloat(customer.amount || 0).toFixed(2)}</Text>
                            </Text>
                            <Text style={styles.paymentDetailText}>
                              <Text style={styles.paymentDetailLabel}>Mode:</Text> {customer.pay_type || 'N/A'}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noPaymentsText}>No payments matching the current filters.</Text>
                      )}
                    </ScrollView>
                    <TouchableOpacity onPress={printTotalCollectionDetails} style={styles.printDetailsButton}>
                      <Ionicons name="document-text-outline" size={20} color={MODERN_PRIMARY} style={{ marginRight: 5 }}/>
                      <Text style={styles.printDetailsButtonText}>Print Summary</Text>
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
    paddingTop: Platform.OS === 'android' ? 35 : 0, 
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
  loadingContainer: { flex: 1 },
  loadingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 80, 
    left: 15,
    zIndex: 10,
    padding: 5,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: CARD_BG,
    fontWeight: '500',
  },
  titleCollectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 1,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: CARD_BG,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  totalAmountText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: CARD_BG,
    marginTop: 5,
    opacity: 0.9,
  },
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
    height: 40,
  },
  searchIcon: { marginLeft: 15, color: TEXT_GREY },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 15,
    color: MODERN_PRIMARY,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  activeCard: {
    borderColor: ACCENT_BLUE,
    backgroundColor: SUBTLE_BG_GREY,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardIconContainer: { marginRight: 10 },
  cardTextContainer: { flexDirection: 'column' },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_GREY,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 15,
    color: MODERN_PRIMARY,
    fontWeight: 'bold',
  },
  totalCollectionCard: {
    borderLeftWidth: 5,
    borderLeftColor: SUCCESS_GREEN,
    backgroundColor: '#E6F7E9', 
  },
  totalCollectionValue: { color: SUCCESS_GREEN, fontSize: 16 },
  printButton: {
    marginHorizontal: 22,
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    backgroundColor: '#f8c009ff', 
    borderRadius: 15,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  printButtonText: { fontSize: 16, fontWeight: 'bold', color: MODERN_PRIMARY },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    width: '90%',
    maxWidth: 400,
  },
  pickerCloseButton: { alignSelf: 'flex-end', marginBottom: 10 },
  pickerWrapper: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "100%",
  },
  searchInputWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pickerSearchInput: {
    height: 40,
    color: MODERN_PRIMARY,
    fontSize: 14,
  },
  pickerScrollView: {
    maxHeight: 350,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pickerItemText: {
    color: MODERN_PRIMARY,
    fontSize: 16,
    fontWeight: "600",
  },
  pickerItemSubText: {
    color: TEXT_GREY,
    marginTop: 4,
    fontSize: 12,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: { color: TEXT_GREY },
  pickerCancelButton: {
    backgroundColor: MODERN_PRIMARY,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  pickerCancelText: { color: "white", fontWeight: "bold" },
  fullScreenModalGradient: { flex: 1 },
  fullScreenModalContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 60, 
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  totalDetailsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    width: '100%',
    flex: 1,
    maxWidth: 500,
    maxHeight: '100%',
  },
  totalDetailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: MODERN_PRIMARY,
    marginBottom: 15,
  },
  totalDetailsAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: SUCCESS_GREEN,
    marginBottom: 10,
  },
  summaryInfo: { alignItems: 'center', marginBottom: 20 },
  totalDetailsAgent: { fontSize: 16, color: TEXT_GREY, marginBottom: 5 },
  totalDetailsDate: { fontSize: 14, color: TEXT_GREY, opacity: 0.8 },
  paymentDetailsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ACCENT_BLUE,
    marginBottom: 10,
    alignSelf: 'flex-start',
    width: '100%',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 5,
  },
  paymentDetailsScrollView: { width: '100%', flexGrow: 1 },
  paymentDetailItem: {
    backgroundColor: SUBTLE_BG_GREY,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  paymentDetailText: { fontSize: 14, color: TEXT_GREY, marginBottom: 2 },
  paymentDetailLabel: { fontWeight: 'bold', color: MODERN_PRIMARY },
  printDetailsButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#f8c009ff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  printDetailsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MODERN_PRIMARY,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    color: TEXT_GREY,
    textAlign: 'center',
    fontWeight: '500',
  },
  noImage: {
    width: 200,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
    opacity: 0.6,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MODERN_PRIMARY,
  },
  datePickerDoneButton: {
    backgroundColor: ACCENT_BLUE,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  datePickerDoneText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  webModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  webDatePickerContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  webDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  webDatePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: MODERN_PRIMARY,
  },
  webDatePickerDoneButton: {
    backgroundColor: ACCENT_BLUE,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  webDatePickerDoneText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  noPaymentsText: { textAlign: "center", color: TEXT_GREY, marginTop: 20 },
});

export default PigmePayments;