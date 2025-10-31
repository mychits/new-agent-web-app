import { View, 
  Text, ScrollView, 
  StyleSheet, TextInput, Modal, TouchableOpacity, 
  Alert, ActivityIndicator, Image, Dimensions} from "react-native";
import React, { useState, useEffect } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import RNPrint from 'react-native-print';
import { LinearGradient } from "expo-linear-gradient";


import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

import axios from "axios";
import PaymentChitList from "../components/PaymentChitList";
import LoanPaymentList from "../components/LoanPaymentList";

const noImage = require('../assets/no.png');

// NOTE: Component name is assumed to be ChitPayments as per the original file structure
const LoanPayments = ({ route, navigation }) => { 
  const { user, areaId } = route.params;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [cus, setCus] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState({})

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


  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/payment/loan/agent/${user.userId}`
        );
        if (response.data) {
          setCustomers(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching loan payment data:", error);
      } finally {
        setLoading(false)
      }
    };

    fetchCustomers();
  }, [user.userId]);

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
      // CORRECTION: Filtering by 'loan_id' from the nested 'loan' object
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
            display="default"
            onChange={(event, date) => {
              setShowPicker(false);
              if (date) {
                setSelectedDate(date);
                updateFilterValue('date', formatDate(date));
              }
            }}
          />
        );
      case 'loan':
        const uniqueloanIds = [...new Set(customers.map(c => c?.loan?.loan_id).filter(Boolean))];
        return (
          <Picker
            selectedValue={selectedloanId}
            onValueChange={(value) => {
              setSelectedloanId(value);
              setSelectedloanName(value || ''); 
              updateFilterValue('loan', value);
              setShowPicker(false);
            }}
          >
            <Picker.Item label="All loan Accounts" value="" />
            {uniqueloanIds.map((loanId) => (
              <Picker.Item
                key={loanId}
                label={`Loan ID: ${loanId}`}
                value={loanId}
              />
            ))}
          </Picker>
        );
      case 'customer':
        return (
          <Picker
            selectedValue={selectedCustomer}
            onValueChange={(value) => {
              const selected = cus.find((customer) => customer._id === value);
              setSelectedCustomer(value);
              setSelectedCustomerName(selected?.full_name || '');
              updateFilterValue('customer', selected?.full_name);
              setShowPicker(false);
            }}
          >
            <Picker.Item label="All Customers" value="" />
            {cus.map((customer) => (
              <Picker.Item
                key={customer._id}
                label={`${customer.full_name} - ${customer.phone_number}`}
                value={customer._id}
              />
            ))}
          </Picker>

        );
      case 'paymentMode':
        return (
          <Picker
            selectedValue={selectedPaymentMode}
            onValueChange={(value) => {
              setSelectedPaymentMode(value);
              updateFilterValue('paymentMode', value);
              setShowPicker(false);
            }}>
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
            background-color: #f2f2f2;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>loan Payment Collection Print</h1>
          <table class="table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Loan ID</th> <th>Ticket</th>
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
          <div class="footer">
            <p>${agent.name} | ${selectedDate.toDateString()} </p>
            <p>Thank You!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Failed to print the document.");
    }
  };

  const printTotalCollectionDetails = async () => {
    const htmlContent = `
      <html>
      <head>
        <style>
          @page {
            size: A6; /* Smaller size suitable for a summary */
            margin: 10mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            margin: 0;
            padding: 0;
            text-align: center;
          }
          .container {
            padding: 5mm;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #053B90;
          }
          p {
            font-size: 16px;
            margin-bottom: 5px;
          }
          .amount {
            font-size: 30px;
            font-weight: bold;
            color: #333;
            margin: 15px 0;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Total Collection Summary</h1>
          <p class="amount">₹ ${totalAmount.toFixed(2)}</p>
          <p>Agent: ${agent.name || 'N/A'}</p>
          <p>Date: ${formatDate(selectedDate)}</p>
          <div class="footer">
            <p>Generated by loan Payments App</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Failed to print the total collection details.");
    }
  };


  return (
    // Replaced SafeAreaView with View
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <LinearGradient colors={['#b6e4ebff', '#1796d1ff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f7f7f7ff" />
            
          </View>
        ) : (
          // Added a marginTop to account for status bar/notch space
          <View style={styles.contentContainer}> 
            <View style={{ marginHorizontal: 22, marginTop: 12 }}>
              <Header />
              <View style={styles.titleCollectionContainer}>
                <View>
                  <Text style={styles.title}>Loan Payments</Text>
                  <Text style={styles.totalAmountText}>₹ {totalAmount.toFixed(2)}</Text>
                </View>
              </View>

              <Modal
                visible={showTotalCollectionDetails}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setShowTotalCollectionDetails(false)}
              >
                <LinearGradient colors={['#b6e4ebff', '#1796d1ff']}
                  style={styles.fullScreenModalGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Changed SafeAreaView inside Modal to a standard View */}
                  <View style={styles.fullScreenModalContainer}> 
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => {
                        setShowTotalCollectionDetails(false);
                        setSelectedFilter(null);
                      }}
                    >
                      <Icon name="times-circle" size={30} color={COLORS.darkGray} />
                    </TouchableOpacity>

                    <View style={styles.totalDetailsCard}>
                      <Text style={styles.totalDetailsTitle}>Total Collection</Text>
                      <Text style={styles.totalDetailsAmount}>₹ {totalAmount.toFixed(2)}</Text>
                      <Text style={styles.totalDetailsAgent}>Agent: {agent.name || 'N/A'}</Text>
                      <Text style={styles.totalDetailsDate}>Date: {formatDate(selectedDate)}</Text>

                      <Text style={styles.paymentDetailsHeader}>Individual Payments:</Text>
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
                                <Text style={styles.paymentDetailLabel}>Amount:</Text> ₹ {parseFloat(customer.amount || 0).toFixed(2)}
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
                          <Text style={styles.noPaymentsText}>No payments for selected date.</Text>
                        )}
                      </ScrollView>
                       <TouchableOpacity onPress={printTotalCollectionDetails} style={styles.printDetailsButton}>
                        <Text style={styles.printDetailsButtonText}>Print Summary</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </Modal>

              {!showTotalCollectionDetails && (
                <>
                  <View style={styles.searchContainer}>
                    <Icon
                      name="search"
                      size={20}
                      color="#ccc"
                      style={styles.searchIcon}
                    />
                    <TextInput
                      value={search}
                      onChangeText={(text) => setSearch(text)}
                      placeholder="Search loan payments..."
                      placeholderTextColor={COLORS.darkGray}
                      style={styles.searchInput}
                    />
                  </View>
                </>
              )}
            </View>

            {!showTotalCollectionDetails && (
              <>
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
                          {filter.id !== 'totalCollection' && (
                            <View style={[styles.radioCircle, selectedFilter === filter.id && styles.radioCircleActive]} />
                          )}
                          <View style={styles.cardTextContainer}>
                            <View style={styles.cardIconContainer}>
                              <Icon name={filter.icon} size={20} color={selectedFilter === filter.id ? COLORS.darkGray : '#666'} />
                              <Text style={[styles.cardTitle, selectedFilter === filter.id && styles.activeCardTitle]}>
                                {filter.title}
                              </Text>
                            </View>
                            <Text style={styles.cardValue}>{filter.value}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity onPress={printPDF} style={styles.printButton}>
                    <Text style={styles.printButtonText}>Print PDF</Text>
                  </TouchableOpacity>
                  <Modal
                    visible={showPicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowPicker(false)}>
                    <View style={styles.modalContainer}>
                      <View style={styles.pickerContainer}>
                        <TouchableOpacity
                          onPress={() => {
                            setShowPicker(false);
                            setSelectedFilter(null);
                          }}
                        >
                        </TouchableOpacity>
                        {renderPicker()}
                      </View>
                    </View>
                  </Modal>
                </View>

                <ScrollView
                  style={{ flex: 1, marginHorizontal: 22, marginTop: 0 }}
                  contentContainerStyle={{ paddingBottom: 80 }}
                  showsVerticalScrollIndicator={false}
                >
                  {Array.isArray(customers) && customers.filter((customer) => {
                    const nameMatch = customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase());
                    const dateMatch = isSameDate(customer?.pay_date, selectedDate);
                    const customerMatch = !selectedCustomer || customer?.user_id?._id === selectedCustomer;
                    const loanMatch = !selectedloanId || customer?.loan?.loan_id === selectedloanId; 
                    const paymentModeMatch = !selectedPaymentMode || customer?.pay_type === selectedPaymentMode;
                    return nameMatch && dateMatch && customerMatch && loanMatch && paymentModeMatch;
                  }).length === 0 ? (
                    <View style={styles.noDataContainer}>
                      <Image source={noImage} style={styles.noImage} />
                      <Text style={styles.noDataText}>No Payments are available</Text>
                    </View>
                  ) : (
                    customers
                      .filter((customer) => {
                        const nameMatch = customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase());
                        const dateMatch = isSameDate(customer?.pay_date, selectedDate);
                        const customerMatch = !selectedCustomer || customer?.user_id?._id === selectedCustomer;
                        const loanMatch = !selectedloanId || customer?.loan?.loan_id === selectedloanId; 
                        const paymentModeMatch = !selectedPaymentMode || customer?.pay_type === selectedPaymentMode;
                        return nameMatch && dateMatch && customerMatch && loanMatch && paymentModeMatch;
                      })
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
              </>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};
const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 40, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  titleCollectionContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: -2,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmountText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#d0d0d0",
    borderWidth: 1,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: '100%',
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    padding: 5,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  filterContainer: {
    marginBottom: 15,
  },
  scrollContainer: {
    paddingHorizontal: 22,
  },
  card: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#d0d0d0",
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCard: {
    borderColor: '#333',
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: '#333',
    backgroundColor: '#333',
  },
  cardTextContainer: {
    flexDirection: 'column',
  },
  cardIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '400',
  },
  activeCardTitle: {
    color: COLORS.darkGray,
  },
  totalCollectionCard: {
    backgroundColor: '#E0F7FA',
    borderColor: '#00BCD4',
  },
  printButton: {
    marginHorizontal: 22,
    marginTop: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
    backgroundColor: '#da8201',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    width: '90%',
  },

  fullScreenModalGradient: {
    flex: 1,
  },
  fullScreenModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingTop: 70, 
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50, 
    right: 20,
    zIndex: 1,
  },
  totalDetailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    width: '110%',
    maxWidth: 500,
    height: '100%',
    maxHeight: '110%',
  },
  totalDetailsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#053B90',
    marginBottom: 15,
  },
  totalDetailsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  totalDetailsAgent: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  totalDetailsDate: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  printDetailsButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#FFC000',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  printDetailsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  noImage: {
    width: 250,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  paymentDetailsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#053B90',
    marginBottom: 10,
    alignSelf: 'flex-start',
    width: '100%',
    textAlign: 'center',
  },
  paymentDetailsScrollView: {
    width: '100%',
    maxHeight: 500,
    marginBottom: 15,
  },
  paymentDetailItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentDetailText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  paymentDetailLabel: {
    fontWeight: 'bold',
    color: '#222',
  },
  noPaymentsText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 10,
  },
});

export default LoanPayments;