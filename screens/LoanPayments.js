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
    Platform 
} from "react-native";
import React, { useState, useEffect } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ExpoPrint from 'expo-print';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons"; 

import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

import axios from "axios";
import LoanPaymentList from "../components/LoanPaymentList";

const noImage = require('../assets/no.png');

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0dff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 
const DANGER_RED = '#f04e6c';
const SUCCESS_GREEN = '#3ed160ff';
// ---------------------------------------------

const LoanPayments = ({ route, navigation }) => { 
  const { user, areaId } = route.params;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [cus, setCus] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState({})
  const [customerSearch, setCustomerSearch] = useState("");
const [loanSearch, setLoanSearch] = useState("");

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [agentName,setAgentName] = useState("")
  
  const [selectedloanId, setSelectedloanId] = useState(''); 
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedloanName, setSelectedloanName] = useState(''); 
  const [activeChitId, setActiveChitId] = useState(null);
  const [showTotalCollectionDetails, setShowTotalCollectionDetails] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  const isSameDate = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const [filters, setFilters] = useState([
    { id: 'date', title: 'Date', value: formatDate(selectedDate), icon: 'calendar' },
    { id: 'customer', title: 'Customer', value: 'All', icon: 'user' },
    { id: 'loan', title: 'Loan ID', value: 'All', icon: 'money' }, 
    { id: 'paymentMode', title: 'Payment Mode', value: 'All', icon: 'money' },
    { id: 'totalCollection', title: 'Total Collection', value: '...', icon: 'money' },
  ]);

  const paymentModes = ['cash', 'online'];

const handleFilterPress = (filterId) => {
    if (filterId === 'totalCollection') {
        setSelectedFilter(filterId);
        setShowTotalCollectionDetails(true);
    } else if (filterId === 'date') {
        // For date, handle platform-specific behavior
        setSelectedFilter(filterId);
        setShowPicker(true);
    } else {
        // Other filters use the standard modal
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

  // useEffect(() => {
  //   const fetchCustomers = async () => {
  //     try {
  //       const response = await axios.get(
  //         `${baseUrl}/api/v1/mobile/payments/daily-report/${user.userId}`
  //       );
  //       if (response.data) {
  //         setCustomers(response.data);
  //       } else {
  //         console.error("Unexpected API response format:", response.data);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching loan payment data:", error);
  //     } finally {
  //       setLoading(false)
  //     }
  //   };

  //   fetchCustomers();
  // }, [user.userId]);

useEffect(() => {
  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // format selected date => YYYY-MM-DD
      const formattedDate = selectedDate
        ? new Date(selectedDate)
            .toISOString()
            .split("T")[0]
        : "";

      const params = {
        collected_by: user?.userId,
        userId: selectedCustomer || undefined,
        loanId: selectedloanId || undefined,
        pay_type: selectedPaymentMode || undefined,

        // optional backend filter
        payment_type: "Loan Payment",

        from_date: formattedDate,
        to_date: formattedDate,
      };

      console.log(
        "========== LOAN API DEBUG =========="
      );

      console.log(
        "REQUEST PARAMS :",
        JSON.stringify(params, null, 2)
      );

      const response = await axios.get(
        `${baseUrl}/v1/mobile/payments/daily-report`,
        {
          params,
        }
      );

      console.log(
        "ALL PAYMENTS FROM API :",
        JSON.stringify(response?.data, null, 2)
      );

      if (
        response?.data &&
        Array.isArray(response.data)
      ) {

        // ONLY LOAN PAYMENTS
        const loanPayments =
          response.data.filter((item) => {
            return (
              item?.pay_for === "Loan" ||
              item?.payment_type ===
                "Loan Payment"
            );
          });

        console.log(
          "ONLY LOAN PAYMENTS :",
          JSON.stringify(
            loanPayments,
            null,
            2
          )
        );

        // set only loan payments
        setCustomers(loanPayments);

        // unique users only from loan payments
        const uniqueUsers =
          loanPayments.reduce(
            (acc, item) => {
              const user =
                item?.user_id;

              if (
                user &&
                !acc.some(
                  (u) =>
                    u._id === user._id
                )
              ) {
                acc.push(user);
              }

              return acc;
            },
            []
          );

        setCus(uniqueUsers);

      } else {
        setCustomers([]);
        setCus([]);
      }

    } catch (error) {

      console.error(
        "Error fetching loan payment data:",
        error
      );

      console.log(
        "ERROR RESPONSE :",
        JSON.stringify(
          error?.response?.data,
          null,
          2
        )
      );

      setCustomers([]);
      setCus([]);

    } finally {
      setLoading(false);
    }
  };

  if (user?.userId) {
    fetchCustomers();
  } else {
    setLoading(false);
  }

}, [
  user?.userId,
  selectedDate,
  selectedCustomer,
  selectedloanId,
  selectedPaymentMode,
]);

  useEffect(() => {
    const fetchCus = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/user/get-user`
        );
        if (response.data) {
          setCus(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
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
        const response = await axios.get(
          `${baseUrl}/group/get-group`
        );
        if (response.data && Array.isArray(response.data)) {
          setGroups(response.data);
        } else {
          Alert.alert("Data Error", "Unexpected API response format for groups.");
        }
      } catch (error) {
        Alert.alert("Network Error", "Failed to fetch groups. Please check your network connection.");
        console.error("Error fetching group data:", error);
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
        setAgent(response.data)
        setAgentName(response?.data?.name)

      } catch (error) {
        setAgentName("")
        console.error("Error fetching customer data:", error);
      }
    };

    fetchAgent();
  }, [user.userId]);

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer) => {
      const nameMatch = customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase());
      const dateMatch = isSameDate(customer.pay_date, selectedDate);
      const customerMatch = !selectedCustomer || customer?.user_id?._id === selectedCustomer;
      const loanMatch = !selectedloanId || customer?.loan?.loan_id === selectedloanId; 
      const paymentModeMatch = !selectedPaymentMode || customer.pay_type === selectedPaymentMode;
      return nameMatch && dateMatch && customerMatch && loanMatch && paymentModeMatch;
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

  const renderPicker = () => {
    switch (selectedFilter) {
      case 'date':
    return (
        <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
                // Android: Hide picker after selection
                if (Platform.OS === 'android') {
                    if (date) {
                        setSelectedDate(date);
                        updateFilterValue('date', formatDate(date));
                    }
                    setShowPicker(false);
                    setSelectedFilter(null);
                } 
                // iOS: Just update date, keep modal open for "Done" button
                else if (date) {
                    setSelectedDate(date);
                    updateFilterValue('date', formatDate(date));
                }
            }}
            minimumDate={new Date(2000, 0, 1)}
            maximumDate={new Date(2100, 11, 31)}
        />
    );
      // case 'loan':
      //   const uniqueloanIds = [...new Set(customers.map(c => c?.loan?.loan_id).filter(Boolean))];
      //   return (
      //     <Picker
      //       selectedValue={selectedloanId}
      //       onValueChange={(value) => {
      //         setSelectedloanId(value);
      //         setSelectedloanName(value || ''); 
      //         updateFilterValue('loan', value);
      //         setShowPicker(false);
      //       }}
      //       style={{ color: MODERN_PRIMARY }}
      //       itemStyle={{ color: MODERN_PRIMARY }}
      //     >
      //       <Picker.Item label="All loan Accounts" value="" />
      //       {uniqueloanIds.map((loanId) => (
      //         <Picker.Item
      //           key={loanId}
      //           label={`Loan ID: ${loanId}`}
      //           value={loanId}
      //         />
      //       ))}
      //     </Picker>
      //   );
      // case 'customer':
      //   return (
      //     <Picker
      //       selectedValue={selectedCustomer}
      //       onValueChange={(value) => {
      //         const selected = cus.find((customer) => customer._id === value);
      //         setSelectedCustomer(value);
      //         setSelectedCustomerName(selected?.full_name || '');
      //         updateFilterValue('customer', selected?.full_name);
      //         setShowPicker(false);
      //       }}
      //       style={{ color: MODERN_PRIMARY }}
      //       itemStyle={{ color: MODERN_PRIMARY }}
      //     >
      //       <Picker.Item label="All Customers" value="" />
      //       {cus.map((customer) => (
      //         <Picker.Item
      //           key={customer._id}
      //           label={`${customer.full_name} - ${customer.phone_number}`}
      //           value={customer._id}
      //         />
      //       ))}
      //     </Picker>

      //   );
  case 'customer':
  const filteredCus = cus.filter((customer) => {
    const searchText = customerSearch.toLowerCase();

    return (
      customer?.full_name
        ?.toLowerCase()
        .includes(searchText) ||
      customer?.phone_number
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  return (
    <View style={styles.pickerWrapper}>
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          paddingHorizontal: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <TextInput
          value={customerSearch}
          onChangeText={(text) => {
            setCustomerSearch(text);
          }}
          placeholder="Search customer..."
          placeholderTextColor="#999"
          style={{
            height: 50,
            color: MODERN_PRIMARY,
            fontSize: 16,
          }}
        />
      </View>

      <ScrollView
        style={{
          maxHeight: 350,
          backgroundColor: "#fff",
          borderRadius: 12,
        }}
      >
        <TouchableOpacity
          style={{
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
          onPress={() => {
            setSelectedCustomer('');
            setSelectedCustomerName('');
            updateFilterValue('customer', 'All');

            closePicker();
          }}
        >
          <Text
            style={{
              color: MODERN_PRIMARY,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            All Customers
          </Text>
        </TouchableOpacity>

        {filteredCus.map((customer) => (
          <TouchableOpacity
            key={customer._id}
            style={{
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
            onPress={() => {
              setSelectedCustomer(customer._id);

              setSelectedCustomerName(
                customer?.full_name || ''
              );

              updateFilterValue(
                'customer',
                customer?.full_name || 'All'
              );

              setCustomerSearch('');

              setShowPicker(false);
            }}
          >
            <Text
              style={{
                color: MODERN_PRIMARY,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {customer?.full_name || 'Unknown'}
            </Text>

            <Text
              style={{
                color: TEXT_GREY,
                marginTop: 4,
              }}
            >
              {customer?.phone_number || ''}
            </Text>
          </TouchableOpacity>
        ))}

        {filteredCus.length === 0 && (
          <View
            style={{
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ color: TEXT_GREY }}>
              No customers found
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.pickerCancelButton}
        onPress={() => {
          setCustomerSearch('');
          setShowPicker(false);
        }}
      >
        <Text style={styles.pickerCancelText}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );

  case 'loan':
  const uniqueloanIds = [
    ...new Set(
      customers
        .map((c) => c?.loan?.loan_id)
        .filter(Boolean)
    ),
  ];

  const filteredLoans = uniqueloanIds.filter((loanId) =>
    loanId
      ?.toString()
      .toLowerCase()
      .includes(loanSearch.toLowerCase())
  );

  return (
    <View style={styles.pickerWrapper}>
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          paddingHorizontal: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <TextInput
          value={loanSearch}
          onChangeText={(text) => {
            setLoanSearch(text);
          }}
          placeholder="Search loan ID..."
          placeholderTextColor="#999"
          style={{
            height: 50,
            color: MODERN_PRIMARY,
            fontSize: 16,
          }}
        />
      </View>

      <ScrollView
        style={{
          maxHeight: 350,
          backgroundColor: "#fff",
          borderRadius: 12,
        }}
      >
        <TouchableOpacity
          style={{
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
          onPress={() => {
            setSelectedloanId('');
            setSelectedloanName('');

            updateFilterValue('loan', 'All');

            closePicker();
          }}
        >
          <Text
            style={{
              color: MODERN_PRIMARY,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            All Loan Accounts
          </Text>
        </TouchableOpacity>

        {filteredLoans.map((loanId) => (
          <TouchableOpacity
            key={loanId}
            style={{
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
            onPress={() => {
              setSelectedloanId(loanId);

              setSelectedloanName(loanId);

              updateFilterValue(
                'loan',
                loanId
              );

              setLoanSearch('');

              setShowPicker(false);
            }}
          >
            <Text
              style={{
                color: MODERN_PRIMARY,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Loan ID : {loanId}
            </Text>
          </TouchableOpacity>
        ))}

        {filteredLoans.length === 0 && (
          <View
            style={{
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ color: TEXT_GREY }}>
              No loan IDs found
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.pickerCancelButton}
        onPress={() => {
          setLoanSearch('');
          setShowPicker(false);
        }}
      >
        <Text style={styles.pickerCancelText}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
  
        case 'paymentMode':
        return (
          <Picker
            selectedValue={selectedPaymentMode}
            onValueChange={(value) => {
              setSelectedPaymentMode(value);
              updateFilterValue('paymentMode', value);
              setShowPicker(false);
            }}
            style={{ color: MODERN_PRIMARY }}
            itemStyle={{ color: MODERN_PRIMARY }}
          >
             <Picker.Item label="All Modes" value="" />
            {paymentModes.map((mode) => (
              <Picker.Item key={mode} label={mode} value={mode} />
            ))}
          </Picker>
        );

      default:
        return null;
    }
  };

  const printPDF = async () => {
    const isSameDate = (date1, date2) => {
      const d1 = new Date(date1).toDateString();
      const d2 = new Date(date2).toDateString();
      return d1 === d2;
    };

    const filteredCustomersForPrint = customers
      .filter((customer) => {
        const nameMatch = customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase());
        const dateMatch = isSameDate(customer.pay_date, selectedDate);
        const customerMatch = !selectedCustomer || customer?.user_id?._id === selectedCustomer;
        const loanMatch = !selectedloanId || customer?.loan?.loan_id === selectedloanId; 
        const paymentModeMatch = !selectedPaymentMode || customer.pay_type === selectedPaymentMode;
        return nameMatch && dateMatch && customerMatch && loanMatch && paymentModeMatch;
      })
      .map((customer, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${customer?.loan?.loan_id || "N/A"}</td> <td>${customer.ticket || "N/A"}</td>
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
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 12px;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        padding: 10mm;
                    }
                    h1 {
                        text-align: center;
                        margin-bottom: 20px;
                        color: ${MODERN_PRIMARY};
                    }
                    .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .table th, .table td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: left;
                    }
                    .table th {
                        background-color: ${SUBTLE_BG_GREY};
                        color: ${MODERN_PRIMARY};
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 10px;
                        color: ${TEXT_GREY};
                    }
                    .total {
                        font-weight: bold;
                        font-size: 14px;
                        margin-top: 10px;
                        text-align: right;
                        color: ${SUCCESS_GREEN};
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Loan Payment Collection Report</h1>
                    <p><strong>Agent:</strong> ${agent.name || 'N/A'}</p>
                    <p><strong>Date:</strong> ${selectedDate.toDateString()}</p>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Sl.No</th>
                                <th>Loan ID</th>
                                <th>Ticket</th>
                                <th>Customer Name</th>
                                <th>Phone Number</th>
                                <th>Amount</th>
                                <th>Receipt Number</th>
                                <th>Payment Mode</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredCustomersForPrint}
                        </tbody>
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
    // Generate HTML rows for each customer
    const customerListHtml = filteredCustomers.map((customer) => `
      <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #ccc;">
        <div style="font-size: 14px; margin-bottom: 2px; color: #000;">
          <strong>Customer:</strong> ${customer?.user_id?.full_name || 'N/A'}
        </div>
        <div style="font-size: 13px; margin-bottom: 2px; color: #444;">
          <strong>Loan ID:</strong> ${customer?.loan?.loan_id || 'N/A'}
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
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            padding: 0mm;
          }
          h1 {
            text-align: center;
            font-size: 22px;
            margin-bottom: 5px;
            color: #183A5D;
          }
          .header-info {
            text-align: center;
            margin-bottom: 15px;
            font-size: 13px;
            color: #555;
            border-bottom: 2px solid #183A5D;
            padding-bottom: 10px;
          }
          .total-amount {
            text-align: center;
            font-size: 26px;
            font-weight: bold;
            color: #3ed160ff;
            margin: 10px 0 20px 0;
            background-color: #f0fdf4;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #3ed160ff;
          }
          .list-container {
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 10px;
            color: #888;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Loan Collection Summary</h1>
          
          <div class="header-info">
            <p><strong>Agent:</strong> ${agent.name || 'N/A'}</p>
            <p><strong>Date:</strong> ${formatDate(selectedDate)}</p>
          </div>

          <div class="total-amount">
            Total: ₹ ${totalAmount.toFixed(2)}
          </div>

          <div class="list-container">
            ${customerListHtml}
          </div>

          <div class="footer">
            <p>Generated by Loan Payments App</p>
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
        {loading ? (
          <View style={styles.loadingContainer}>
            {/* --- BACK BUTTON ADDED --- */}
            <TouchableOpacity
              style={styles.loadingBackButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back-outline" size={30} color={"Black"} />
            </TouchableOpacity>
            
            {/* Wrapper for centering content */}
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
                            <Text style={styles.title}>Loan Payments</Text>
                            <Text style={styles.totalAmountText}>₹ {totalAmount.toFixed(2)}</Text>
                        </View>
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <Icon
                            name="search"
                            size={17}
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

            {/* Main Content Area (White Background) */}
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
                                        <Text style={styles.cardTitle}>
                                            {filter.title}
                                        </Text>
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
                >
                    {filteredCustomers.length === 0 ? (
                        <View style={styles.noDataContainer}>
                            <Image source={noImage} style={styles.noImage} />
                            <Text style={styles.noDataText}>No Payments are available</Text>
                        </View>
                    ) : (
                        filteredCustomers
                            .map((customer, index) => (
                                <LoanPaymentList
                                    key={index}
                                    idx={index}
                                    name={customer?.user_id?.full_name || 'N/A'}
                                    cus_id={customer?.user_id?._id}
                                    phone={customer?.user_id?.phone_number || 'N/A'}
                                    receipt={customer.receipt_no}
                                    date={customer.pay_date}
                                    amount={customer.amount}
                                    actual_loan_id={customer?.loan?._id || 'N/A'}
                                    loanId={customer?.loan?.loan_id || 'N/A'} 
                                    loanAmount={customer?.loan?.loan_amount || "N/A"}
                                    type={customer.pay_type}
                                    agentName={agentName}
                                    navigation={navigation}
                                    user={user}
                                    onPress={() => handleChitPress(customer._id)}
                                    customer={customer}
                                    isActive={customer._id === activeChitId}
                                />
                            ))
                    )}
                </ScrollView>
            </View>
            
            {/* Modals for Pickers and Total Collection */}

{/* Standard modal for non-date filters (customer, loan, paymentMode) */}
{showPicker && selectedFilter && selectedFilter !== 'date' && (
    <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
            setShowPicker(false);
            setSelectedFilter(null);
        }}
    >
        <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
                <TouchableOpacity
                    onPress={() => {
                        setShowPicker(false);
                        setSelectedFilter(null);
                    }}
                    style={styles.pickerCloseButton}
                >
                   <Ionicons name="close-circle-outline" size={30} color={TEXT_GREY} />
                </TouchableOpacity>
                {renderPicker()}
            </View>
        </View>
    </Modal>
)}

{/* iOS: Date picker in custom modal with Done button */}
{showPicker && selectedFilter === 'date' && Platform.OS === 'ios' && (
    <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
            setShowPicker(false);
            setSelectedFilter(null);
        }}
    >
        <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
                <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select Date</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setShowPicker(false);
                            setSelectedFilter(null);
                        }}
                        style={styles.pickerCloseButton}
                    >
                        <Ionicons name="close-circle-outline" size={30} color={TEXT_GREY} />
                    </TouchableOpacity>
                </View>
                {renderPicker()}
                <TouchableOpacity
                    style={styles.datePickerDoneButton}
                    onPress={() => {
                        setShowPicker(false);
                        setSelectedFilter(null);
                    }}
                >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
)}

{/* Android: Date picker renders natively - no wrapper modal */}
{showPicker && selectedFilter === 'date' && Platform.OS === 'android' && (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
        {renderPicker()}
    </View>
)}

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
                                <Text style={styles.totalDetailsDate}>Date: {formatDate(selectedDate)}</Text>
                            </View>
                            
                            <Text style={styles.paymentDetailsHeader}>Individual Payments ({filteredCustomers.length})</Text>
                            <ScrollView style={styles.paymentDetailsScrollView}>
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer, index) => (
                                        <View key={index} style={styles.paymentDetailItem}>
                                            <Text style={styles.paymentDetailText}>
                                                <Text style={styles.paymentDetailLabel}>Customer:</Text> {customer?.user_id?.full_name || 'N/A'}
                                            </Text>
                                            <Text style={styles.paymentDetailText}>
                                                <Text style={styles.paymentDetailLabel}>Loan ID:</Text> {customer?.loan?.loan_id || 'N/A'}
                                            </Text>
                                            <Text style={styles.paymentDetailText}>
                                                <Text style={styles.paymentDetailLabel}>Amount:</Text> <Text style={{fontWeight: 'bold', color: SUCCESS_GREEN}}>₹ {parseFloat(customer.amount || 0).toFixed(2)}</Text>
                                            </Text>
                                            <Text style={styles.paymentDetailText}>
                                                <Text style={styles.paymentDetailLabel}>Mode:</Text> {customer.pay_type || 'N/A'}
                                            </Text>
                                            <Text style={styles.paymentDetailText}>
                                                <Text style={styles.paymentDetailLabel}>Receipt No:</Text> {customer.receipt_no || 'N/A'}
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
    // --- LAYOUT STYLES ---
    gradientOverlay: {
        flex: 1,
    },
    screenContainer: {
        flex: 1,
    },
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

    // --- LOADING STYLES ---
    loadingContainer: {
        flex: 1,
        // Centering moved to loadingContent to allow absolute positioning for back button
    },
    loadingBackButton: {
        position: 'absolute',
        // INCREASED these numbers to move the button down
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

    // --- TITLE/HEADER STYLES ---
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

    // --- SEARCH STYLES ---
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
        marginHorizontal: 0, 
    },
    searchIcon: {
        marginLeft: 15,
        color: TEXT_GREY,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 10,
        fontSize: 15,
        color: MODERN_PRIMARY,
    },

    // --- FILTER & PRINT STYLES ---
    filterContainer: {
        marginBottom: 15,
    },
    scrollContainer: {
        paddingHorizontal: 22,
    },
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
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIconContainer: {
        marginRight: 10,
    },
    cardTextContainer: {
        flexDirection: 'column',
    },
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
    totalCollectionValue: {
        color: SUCCESS_GREEN,
        fontSize: 16,
    },
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
    printButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: MODERN_PRIMARY,
    },

    // --- MODAL STYLES ---
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
    },
    pickerCloseButton: {
        alignSelf: 'flex-end',
        marginBottom: 10,
    },

    // --- TOTAL COLLECTION MODAL STYLES ---
    fullScreenModalGradient: {
        flex: 1,
    },
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
    summaryInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    totalDetailsAgent: {
        fontSize: 16,
        color: TEXT_GREY,
        marginBottom: 5,
    },
    totalDetailsDate: {
        fontSize: 14,
        color: TEXT_GREY,
        opacity: 0.8,
    },
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
    paymentDetailsScrollView: {
        width: '100%',
        flexGrow: 1,
    },
    paymentDetailItem: {
        backgroundColor: SUBTLE_BG_GREY,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    paymentDetailText: {
        fontSize: 14,
        color: TEXT_GREY,
        marginBottom: 2,
    },
    paymentDetailLabel: {
        fontWeight: 'bold',
        color: MODERN_PRIMARY,
    },
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
});

export default LoanPayments;