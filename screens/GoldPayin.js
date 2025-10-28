import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import React, { useState, useEffect } from "react";

import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";

const GoldPayin = ({ route, navigation }) => {
  const { user, customer } = route.params;

  const [currentDate, setCurrentDate] = useState("");
  const [receipt, setReceipt] = useState({});
  const [paymentDetails, setPaymentDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // New state for initial data loading
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // Existing state for payment submission loading
  const [isLoading, setIsLoading] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({});
  const [groups, setGroups] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTicket, setSelectedTicket] = useState("");
  const [allData, setAllData] = useState([]);
  const [agent, setAgent] = useState([]);

  // Helper to track when all initial data fetching is complete
  const [fetchStatuses, setFetchStatuses] = useState({
    customer: false,
    enrollment: false,
    receipt: false,
    agent: false,
  });

  // Master useEffect to control isInitialLoading
  useEffect(() => {
    const allLoaded = Object.values(fetchStatuses).every((status) => status);
    if (allLoaded) {
      setIsInitialLoading(false);
    }
  }, [fetchStatuses]);

  // Helper function to handle group and ticket selection logic
  const handleSelectionLogic = (uniqueGroups, allEnrollmentData) => {
    if (uniqueGroups.length === 1) {
      const onlyGroup = uniqueGroups[0];
      const groupId = onlyGroup?.group_id?._id;
      setSelectedGroup(groupId);

      const groupTickets = allEnrollmentData
        .filter((item) => item?.group_id?._id === groupId)
        .map((item) => item.tickets);

      setTickets(groupTickets);

      if (groupTickets.length === 1) {
        setSelectedTicket(groupTickets[0].toString());
      }
    }
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await axios.get(
          `http://13.51.87.99:3000/api/user/get-user-by-id/${customer}`
        );
        if (response.data) {
          setCustomerInfo(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setFetchStatuses((prev) => ({ ...prev, customer: true }));
      }
    };

    fetchCustomer();
  }, [customer]);

  useEffect(() => {
    const fetchEnrollDetails = async () => {
      try {
        const response = await axios.post(
          `http://13.51.87.99:3000/api/enroll/get-user-tickets/${customer}`
        );
        const enrollmentData = response.data;
        setAllData(enrollmentData);

        const uniqueGroups = enrollmentData.reduce((acc, group) => {
          if (
            !acc.some(
              (g) => g?.group_id?.group_name === group?.group_id?.group_name
            )
          ) {
            acc.push(group);
          }
          return acc;
        }, []);

        setGroups(uniqueGroups);
        handleSelectionLogic(uniqueGroups, enrollmentData);
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setFetchStatuses((prev) => ({ ...prev, enrollment: true }));
      }
    };
    fetchEnrollDetails();
  }, [customer, baseUrl]);

  useEffect(() => {
    const today = moment().format("DD-MM-YYYY");
    setCurrentDate(today);
    // Date is synchronous, so no need for fetchStatuses update here
  }, []);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await axios.get(
          `http://13.51.87.99:3000/api/payment/get-latest-receipt`
        );

        setReceipt(response.data);
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setFetchStatuses((prev) => ({ ...prev, receipt: true }));
      }
    };
    fetchReceipt();
  }, []);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/agent/get-agent-by-id/${user.userId}`
        );
        if (response.data) {
          setAgent(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching agent data:", error);
      } finally {
        setFetchStatuses((prev) => ({ ...prev, agent: true }));
      }
    };

    fetchAgent();
  }, [user.userId, baseUrl]);

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    setSelectedTicket("");

    if (groupId) {
      const groupTickets = allData
        .filter((item) => item?.group_id?._id === groupId)
        .map((item) => item.tickets);

      setTickets(groupTickets);

      if (groupTickets.length === 1) {
        setSelectedTicket(groupTickets[0].toString());
      } else {
        setSelectedTicket("");
      }
    } else {
      setTickets([]);
      setSelectedTicket("");
    }
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentDetails(type);
    if (type === "online") {
      setAdditionalInfo("Transaction ID");
    } else if (type === "cheque") {
      setAdditionalInfo("Cheque Number");
    } else {
      setAdditionalInfo("");
      setTransactionId("");
    }
  };

  const handleAddPayment = async () => {
    setIsLoading(true);
    try {
      if (
        !selectedGroup ||
        !selectedTicket ||
        !paymentDetails ||
        !amount ||
        (paymentDetails !== "cash" && !transactionId)
      ) {
        Alert.alert("Validation Error", "Please fill all mandatory fields.");
        setIsLoading(false);
        return;
      }

      const data = {
        user_id: customer,
        group_id: selectedGroup,
        ticket: selectedTicket,
        pay_date: new Date().toISOString().split("T")[0],
        receipt_no: receipt.receipt_no
          ? (receipt.receipt_no + 1).toString()
          : "1",
        pay_type: paymentDetails,
        amount: amount,
        transaction_id: transactionId,
        collected_name: agent.name,
        collected_phone: agent.phone_number,
      };

      const response = await axios.post(
        `http://13.51.87.99:3000/api/payment/add-payment`,
        data
      );

      if (response.status === 201) {
        Alert.alert("Success", "Payment added successfully!");
        navigation.navigate("GoldPrint", { store_id: response.data?._id });
      } else {
        console.log("Error:", response.data);
        Alert.alert("Error", response.data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      Alert.alert("Error", "Error adding payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderGroupPicker = () => {
    if (groups.length === 1 && selectedGroup) {
      const groupName = groups[0]?.group_id?.group_name;
      return (
        <TextInput
          style={styles.textInput}
          value={groupName}
          editable={false}
        />
      );
    }

    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedGroup}
          onValueChange={handleGroupChange}
          style={styles.picker}
        >
          <Picker.Item label="Select Group" value="" />
          {groups.map((group, index) => (
            <Picker.Item
              key={index}
              label={group?.group_id?.group_name}
              value={group?.group_id?._id}
            />
          ))}
        </Picker>
      </View>
    );
  };

  const renderTicketPicker = () => {
    if (tickets.length === 1 && selectedTicket) {
      return (
        <TextInput
          style={styles.textInput}
          value={selectedTicket}
          editable={false}
        />
      );
    }

    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTicket}
          onValueChange={(itemValue) => setSelectedTicket(itemValue)}
          style={styles.picker}
          enabled={selectedGroup !== "" && tickets.length > 1}
        >
          <Picker.Item label="Select Ticket" value="" />
          {tickets.map((ticket, index) => (
            <Picker.Item
              key={index}
              label={`${ticket}`}
              value={ticket.toString()}
            />
          ))}
        </Picker>
      </View>
    );
  };

  // --- Conditional Rendering for Loading State ---
  if (isInitialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
        <LinearGradient
          colors={["#b6e4ebff", "#1796d1ff"]}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <LinearGradient
        colors={["#b6e4ebff", "#1796d1ff"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          // Removed the explicit keyboardVerticalOffset or set to 0.
          // Let the default behavior handle it first to fix vibration.
          keyboardVerticalOffset={0} 
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ marginHorizontal: 22, marginTop: 42 }}>
              <Header />

              <View style={styles.titleContainer}>
                <Text style={styles.title}>Add Payment</Text>
              </View>
              <View style={styles.container}>
                <View style={styles.formBox}>
                  {/* Name Input (Read-only) */}
                  <Text style={styles.label}>
                    Name<Text style={styles.star}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter The Name"
                    keyboardType="default"
                    value={customerInfo.full_name}
                    editable={false}
                  />

                  {/* Group Selection */}
                  <Text style={styles.label}>
                    Group<Text style={styles.star}>*</Text>
                  </Text>
                  {renderGroupPicker()}

                  {/* Ticket Selection */}
                  <Text style={styles.label}>
                    Ticket<Text style={styles.star}>*</Text>
                  </Text>
                  {renderTicketPicker()}

                  {/* Date and Receipt */}
                  <View style={styles.row}>
                    <View style={styles.column}>
                      <Text style={styles.label}>
                        Date<Text style={styles.star}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Select Date"
                        keyboardType="default"
                        value={currentDate}
                        editable={false}
                      />
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>
                        Receipt<Text style={styles.star}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Select Receipt"
                        keyboardType="numeric"
                        value={
                          receipt.receipt_no
                            ? (receipt.receipt_no + 1).toString()
                            : "1"
                        }
                        editable={false}
                      />
                    </View>
                  </View>

                  {/* Payment Type and Amount */}
                  <View style={styles.row}>
                    <View style={styles.column}>
                      <Text style={styles.label}>
                        Payment Type<Text style={styles.star}>*</Text>
                      </Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={paymentDetails}
                          onValueChange={(itemValues) =>
                            handlePaymentTypeChange(itemValues)
                          }
                          style={styles.picker}
                        >
                          <Picker.Item label="Select" value="" />
                          <Picker.Item label="Cash" value="cash" />
                          <Picker.Item label="Online" value="online" />
                          <Picker.Item label="Cheque" value="cheque" />
                        </Picker>
                      </View>
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>
                        Amount<Text style={styles.star}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter The Amount"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={(value) => setAmount(value)}
                      />
                    </View>
                  </View>

                  {/* Additional Info (Transaction/Cheque ID) */}
                  {additionalInfo !== "" && (
                    <>
                      <Text style={styles.label}>
                        {additionalInfo}
                        <Text style={styles.star}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder={`Enter ${additionalInfo}`}
                        keyboardType="default"
                        value={transactionId}
                        onChangeText={(value) => setTransactionId(value)}
                      />
                    </>
                  )}

                  <Button
                    title={isLoading ? "Please wait..." : "Add Payment"}
                    filled
                    disabled={isLoading}
                    style={styles.button}
                    onPress={handleAddPayment}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  loadingContainer: {
    // <--- New style for initial loading
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    // <--- New style for loading text
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  titleContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  container: {
    flex: 1,
  },
  formBox: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  column: {
    flex: 1,
    marginHorizontal: 3,
  },
  textInput: {
    ...Platform.select({
      android: {
        height: 55,
      },
      ios: {
        height: 55,
      },
    }),
    width: "100%",
    borderColor: "#d0d0d0",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginVertical: 10,
    color: "#000",
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  contentContainer: {
    marginTop: 20,
  },
  pickerContainer: {
    borderColor: "#d0d0d0",
    borderWidth: 1,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  picker: {
    ...Platform.select({
      android: {
        height: 55,
      },
      ios: {
        height: 55,
      },
    }),
    width: "100%",
  },
  label: {
    fontWeight: "bold",
    marginTop: 10,
  },
  star: {
    color: "red",
  },
  button: {
    marginTop: 18,
    marginBottom: 50,
    backgroundColor: "#da8201",
  },
});

export default GoldPayin;