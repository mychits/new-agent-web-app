import { View, Text, ScrollView, StyleSheet, TextInput, Modal, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import RNPrint from 'react-native-print';
const noImage = require('../assets/no.png');
import { LinearGradient } from "expo-linear-gradient";


import COLORS from "../constants/color";
import Header from "../components/Header";
import RouteCustomerList from "../components/RouteCustomerList";
import baseUrl from "../constants/baseUrl";

import axios from "axios";
import PaymentChitList from "../components/PaymentChitList";

const GoldPayments = ({ route, navigation }) => {
  const { user, areaId } = route.params;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [cus, setCus] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState({})


  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [activeChitId, setActiveChitId] = useState(null);


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
    { id: 'group', title: 'Group', value: 'All', icon: 'users' },
    { id: 'paymentMode', title: 'Payment Mode', value: 'All', icon: 'money' },
  ]);

  const paymentModes = ['cash', 'online'];

  const handleFilterPress = (filterId) => {
    setSelectedFilter(filterId);
    setShowPicker(true);
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
      if (!user?.userId) {
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(
          `http://13.51.87.99:3000/api/payment/get-payment?agentId=${user.userId}`
        );
        if (response.data) {
          setCustomers(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [user.userId]);

  useEffect(() => {
    const fetchCus = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://13.51.87.99:3000/api/user/get-user`
        );
        if (response.data) {
          setCus(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCus();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://13.51.87.99:3000/api/group/get-group`
        );
        if (response.data && Array.isArray(response.data)) {
          setGroups(response.data);
        } else {
          Alert.alert("Data Error", "Unexpected API response format for groups.");
        }
      } catch (error) {
        Alert.alert("Network Error", "Failed to fetch groups. Please check your network connection.");
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
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
        setAgent(response.data);
      } catch (error) {
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
      const groupMatch = !selectedGroup || customer?.group_id?._id === selectedGroup;
      const paymentModeMatch = !selectedPaymentMode || customer.pay_type === selectedPaymentMode;
      return nameMatch && dateMatch && customerMatch && groupMatch && paymentModeMatch;
    })
    : [];

  const totalAmount = filteredCustomers.reduce((sum, customer) => {
    const amount = parseFloat(customer.amount) || 0;
    return sum + amount;
  }, 0);


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
      case 'group':
        return (
          <Picker
            selectedValue={selectedGroup}
            onValueChange={(value) => {
              const selected = groups.find((group) => group._id === value);
              setSelectedGroup(value);
              setSelectedGroupName(selected?.group_name || '');
              updateFilterValue('group', selected?.group_name);
              setShowPicker(false);
            }}
          >
            <Picker.Item label="All Groups" value="" />
            {Array.isArray(groups) && groups.map((group) => (
              <Picker.Item
                key={group._id}
                label={`${group.group_name}`}
                value={group._id}
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

    const filteredCustomers = customers
      .filter((customer) => {
        const nameMatch = customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase());
        const dateMatch = isSameDate(customer.pay_date, selectedDate);
        const customerMatch = !selectedCustomer || customer?.user_id?._id === selectedCustomer;
        const groupMatch = !selectedGroup || customer?.group_id?._id === selectedGroup;
        const paymentModeMatch = !selectedPaymentMode || customer.pay_type === selectedPaymentMode;
        return nameMatch && dateMatch && customerMatch && groupMatch && paymentModeMatch;
      })
      .map((customer, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${customer?.group_id?.group_name || "N/A"}</td>
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
          <h1>Gold Payments</h1>
          <table class="table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Group Name</th>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Amount</th>
                <th>Receipt Number</th>
                <th>Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCustomers}
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


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <LinearGradient
         colors={['#dbf6faff', '#90dafcff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={{ marginHorizontal: 22, marginTop: 12 }}>
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Gold Payments</Text>
            <Text style={styles.totalAmountText}>₹ {totalAmount.toFixed(2)}</Text>
          </View>

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
              placeholder="Search gold payments..."
              placeholderTextColor={COLORS.darkGray}
              style={styles.searchInput}
            />
          </View>
        </View>
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[styles.card, selectedFilter === filter.id && styles.activeCard]}
                onPress={() => handleFilterPress(filter.id)}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.radioCircle, selectedFilter === filter.id && styles.radioCircleActive]} />
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
                  style={styles.closeButton}
                  onPress={() => setShowPicker(false)}>
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
                {renderPicker()}
              </View>
            </View>
          </Modal>
        </View>
        {
          loading ? (
            <>
              <View style={{ marginTop: 30, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            </>
          ) : (
            <>
              <ScrollView
                style={{ flex: 1, marginHorizontal: 22, marginTop: 0 }}
                contentContainerStyle={{ paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
              >
                {Array.isArray(customers) && customers.filter((customer) => {
                  const nameMatch = customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase());
                  const dateMatch = isSameDate(customer.pay_date, selectedDate);
                  const customerMatch = !selectedCustomer || customer?.user_id?._id === selectedCustomer;
                  const groupMatch = !selectedGroup || customer?.group_id?._id === selectedGroup;
                  const paymentModeMatch = !selectedPaymentMode || customer.pay_type === selectedPaymentMode;
                  return nameMatch && dateMatch && customerMatch && groupMatch && paymentModeMatch;
                }).length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Image source={noImage} style={styles.noImage} />
                    <Text style={styles.noDataText}>No Payments are available</Text>
                  </View>
                ) : (
                  customers
                    .filter((customer) => {
                      const nameMatch = customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase());
                      const dateMatch = isSameDate(customer.pay_date, selectedDate);
                      const customerMatch = !selectedCustomer || customer?.user_id?._id === selectedCustomer;
                      const groupMatch = !selectedGroup || customer?.group_id?._id === selectedGroup;
                      const paymentModeMatch = !selectedPaymentMode || customer.pay_type === selectedPaymentMode;
                      return nameMatch && dateMatch && customerMatch && groupMatch && paymentModeMatch;
                    })
                    .map((customer, index) => (
                      <PaymentChitList
                        key={index}
                        idx={index}
                        name={customer?.user_id?.full_name || 'N/A'}
                        cus_id={customer._id}
                        phone={customer?.user_id?.phone_number || 'N/A'}
                        receipt={customer.receipt_no}
                        date={customer.pay_date}
                        amount={customer.amount}
                        group={customer?.group_id?.group_name || 'N/A'}
                        type={customer.pay_type}
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
          )
        }
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  titleContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmountText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
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
  printButton: {
    marginHorizontal: 22,
    marginTop: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
    backgroundColor: '#FFC000',
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
    width: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
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
  }
});

export default GoldPayments;