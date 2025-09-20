import { View, Text, ScrollView, StyleSheet, TextInput, Modal, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from "react-native";
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
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState({})


  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
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
    { id: 'date', title: 'Date', value: new Date(), displayValue: formatDate(new Date()), icon: 'calendar' },
    { id: 'customer', title: 'Customer', value: 'All', displayValue: 'All', icon: 'user' },
    { id: 'group', title: 'Group', value: 'All', displayValue: 'All', icon: 'users' },
    { id: 'paymentMode', title: 'Payment Mode', value: 'All', displayValue: 'All', icon: 'money' },
  ]);

  const paymentModes = ['cash', 'online'];

  const handleFilterPress = (filterId) => {
    setSelectedFilter(filterId);
    setShowPicker(true);
  };

  const updateFilterValue = (id, value, newDisplayValue) => {
    setFilters(prevFilters =>
      prevFilters.map(filter =>
        filter.id === id ? { ...filter, value: value, displayValue: newDisplayValue || value } : filter
      )
    );
  };

  const handleChitPress = (chitId) => {
    setActiveChitId(chitId);
  };


  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [customersResponse, cusResponse, groupsResponse, agentResponse] =
          await Promise.all([
            axios.get(`${baseUrl}/payment/get-payment-agent/${user.userId}`),
            axios.get(`${baseUrl}/user/get-user`),
            axios.get(`${baseUrl}/group/get-group`),
            axios.get(`${baseUrl}/agent/get-agent-by-id/${user.userId}`)
          ]);

        setCustomers(customersResponse.data || []);
        setCus(cusResponse.data || []);
        setGroups(groupsResponse.data || []);
        setAgent(agentResponse.data || {});
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.userId]);


  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer) => {
      const dateFilter = filters.find(f => f.id === 'date');
      const customerFilter = filters.find(f => f.id === 'customer');
      const groupFilter = filters.find(f => f.id === 'group');
      const paymentModeFilter = filters.find(f => f.id === 'paymentMode');

      const nameMatch = customer?.user_id?.full_name?.toLowerCase().includes(search.toLowerCase());
      const dateMatch = isSameDate(customer.pay_date, dateFilter.value);
      const customerMatch = customerFilter.value === 'All' || customer?.user_id?._id === customerFilter.value;
      const groupMatch = groupFilter.value === 'All' || customer?.group_id?._id === groupFilter.value;
      const paymentModeMatch = paymentModeFilter.value === 'All' || customer.pay_type === paymentModeFilter.value;
      return nameMatch && dateMatch && customerMatch && groupMatch && paymentModeMatch;
    })
    : [];

  const totalAmount = filteredCustomers.reduce((sum, customer) => {
    const amount = parseFloat(customer.amount) || 0;
    return sum + amount;
  }, 0);


  const renderPicker = () => {
    const currentFilter = filters.find(f => f.id === selectedFilter);

    if (!currentFilter) {
      return null;
    }

    switch (selectedFilter) {
      case 'date':
        return (
          <DateTimePicker
            key={currentFilter.value.toISOString()}
            value={currentFilter.value}
            mode="date"
            display={Platform.OS === "android" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={(event, date) => {
              if (date) {
                updateFilterValue('date', date, formatDate(date));
              }
              setTimeout(() => {
                setShowPicker(false);
              }, 50);
            }}
          />
        );
      case 'group':
        return (
          <Picker
            selectedValue={currentFilter.value}
            onValueChange={(value) => {
              const selected = groups.find((group) => group._id === value);
              updateFilterValue('group', value, selected ? selected.group_name : 'All');
              setShowPicker(false);
            }}
          >
            <Picker.Item label="All Groups" value="All" />
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
            selectedValue={currentFilter.value}
            onValueChange={(value) => {
              const selected = cus.find((customer) => customer._id === value);
              updateFilterValue('customer', value, selected ? selected.full_name : 'All');
              setShowPicker(false);
            }}
          >
            <Picker.Item label="All Customers" value="All" />
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
            selectedValue={currentFilter.value}
            onValueChange={(value) => {
              updateFilterValue('paymentMode', value, value);
              setShowPicker(false);
            }}>
            <Picker.Item label="All" value="All" />
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
    const filteredCustomersForPrint = filteredCustomers
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

    const dateFilter = filters.find(f => f.id === 'date');
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
              ${filteredCustomersForPrint}
            </tbody>
          </table>
          <div class="footer">
            <p>${agent.name} | ${formatDate(dateFilter.value)} </p>
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

        <View style={{ marginTop: 20 }}>
          <Header />
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <>
            <View style={{ marginHorizontal: 22, marginTop: 12 }}>

              <View style={styles.titleCollectionContainer}>
                <View>
                  <Text style={styles.title}>Gold Payments</Text>
                  <Text style={styles.totalAmountText}>
                    ₹ {totalAmount.toFixed(2)}
                  </Text>
                </View>
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
                        <Text style={styles.cardValue}>{filter.displayValue}</Text>
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
                    {renderPicker()}
                    {selectedFilter !== 'date' && (
                      <TouchableOpacity
                        onPress={() => setShowPicker(false)}
                        style={{
                          margin: 20,
                          justifyContent: "center",
                          alignItems: "center"
                        }}
                      >
                        <Text
                          style={[
                            styles.close,
                            { textAlign: "center", paddingVertical: 10, paddingHorizontal: 20 }
                          ]}
                        >
                          Close
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Modal>
            </View>

            <ScrollView
              style={{ flex: 1, marginHorizontal: 22, marginTop: 0 }}
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
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  titleCollectionContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmountText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#555",
    marginTop: 5,
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 2,
  },
  pickerContainer: {
    backgroundColor: "white",




    width: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  close: {
    color: 'white',
    backgroundColor: "#D25D5D",
    borderRadius: 20,
    borderWidth: 2,
    width: "100%",
    height: 50,
    overflow: "hidden",
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