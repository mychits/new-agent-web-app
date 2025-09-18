import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ToastAndroid,
  Modal,
  FlatList,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "react-native-vector-icons/Feather";

const EnrollCustomer = ({ route, navigation }) => {
  const { user, customer } = route.params;
  const [receipt, setReceipt] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerType, setSelectedCustomerType] = useState("chits");
  const [agentCustomers, setAgentCustomers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [focusedInput, setFocusedInput] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const baseUrl =
    selectedCustomerType === "chits" ? `${chitBaseUrl}` : `${goldBaseUrl}`;
  const [formFields, setFormFields] = useState({
    user_id: "",
    group_id: "",
    no_of_tickets: "",
    tickets: "",
  });
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`${baseUrl}/group/get-group`);
        if (response.status >= 400) throw new Error("Something went wrong!");
        setGroups(response.data);
      } catch (err) {
        console.error("Failed to load Group Data");
      }
    };
    fetchGroups();
  }, [selectedCustomerType]);
  useEffect(() => {
    const fetchAgentUsers = async () => {
      try {
        const response = await axios.get(`${baseUrl}/user/get-user`);
        if (response.status >= 400) throw new Error("Something went wrong");
        setAgentCustomers(response.data);
      } catch (err) {
        console.error("Failed to load Customers Data");
      }
    };
    fetchAgentUsers();
  }, [selectedCustomerType]);
  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await axios.get(
          `${chitBaseUrl}/agent/get-agent-by-id/${user.userId}`
        );
        setReceipt(response.data);
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };
    fetchReceipt();
  }, []);

  const filteredCustomers = agentCustomers.filter((customer) =>
    customer.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCustomer = (customer) => {
    setFormFields({ ...formFields, user_id: customer._id });
    setIsSearchModalVisible(false);
    setSearchQuery(""); // Reset search query on selection
  };

  const handleCancel = () => {
    Alert.alert("Confirmation", "Are you sure you want to Close?", [
      {
        text: "No",
      },
      {
        text: "Yes",
        onPress: () => {
          navigation.navigate("Home", { user: user });
        },
      },
    ]);
  };
  const handleInputChange = async (field, value) => {
    setFormFields({ ...formFields, [field]: value });
    if (field === "group_id") {
      try {
        const response = await axios.post(
          `${baseUrl}/enroll/get-next-tickets/${value}`
        );
        if (response.status >= 400)
          throw new Error("Failed to fetch available tickets");
        setAvailableTickets(response.data.availableTickets);
      } catch (err) {
        console.error("Error fetching next tickets");
      }
    }
  };

  const handleEnrollCustomer = async () => {
    if (!formFields.no_of_tickets || isNaN(formFields.no_of_tickets)) {
      ToastAndroid.showWithGravity(
        "Number of tickets cannot be empty or zero.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      return;
    }

    if (Number(formFields.no_of_tickets) > availableTickets.length) {
      ToastAndroid.showWithGravity(
        "Number of Tickets is more than available tickets.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      return;
    }

    if (
      !formFields.user_id ||
      !formFields.group_id ||
      !formFields.no_of_tickets
    ) {
      Alert.alert("Required", "Please fill out all fields!");
      return;
    }

    const { no_of_tickets, group_id, user_id } = formFields;
    const ticketsCount = parseInt(no_of_tickets, 10);

    setIsLoading(true);

    // Create ticket entries
    const ticketEntries = availableTickets
      .slice(0, ticketsCount)
      .map((ticketNumber) => ({
        user_id,
        group_id,
        no_of_tickets: "1", // each entry is one ticket
        tickets: ticketNumber.toString(),
        agent: user.userId,
        created_by: user.userId,

        // 🔑 Add required defaults
        payment_type: "cash", // or "online" (choose what fits your app)
        referred_type: "self", // or "agent" / "customer"
        referred_customer: null,
        referred_lead: null,
        chit_asking_month: "0",
      }));

    try {
      for (const ticketEntry of ticketEntries) {
        await axios.post(`${baseUrl}/enroll/add-enroll`, ticketEntry);
      }

      ToastAndroid.show("Customer Enrolled Successfully!", ToastAndroid.SHORT);
      setFormFields({
        group_id: "",
        user_id: "",
        no_of_tickets: "",
      });

      navigation.replace("BottomNavigation", { user: { ...user } });
    } catch (error) {
      console.error("Error adding :", error?.response?.data || error.message);
      Alert.alert("Error", "Error Enrolling Customer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#dbf6faff", "#90dafcff"]}
      style={styles.gradientOverlay}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ marginHorizontal: 22, marginTop: 12, flex: 1 }}>
              <Header />
              <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Add Enrollment</Text>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={styles.myCustomersButton}
                >
                  <Text style={styles.myCustomersButtonText}>Skip</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardContainer}>
                <View style={styles.contentContainer}>
                  <View style={styles.formGroup}>
                    <Text style={{ fontWeight: "bold", marginTop: 10 }}>
                      Customer Type
                    </Text>
                    <View style={[styles.inputGroup, styles.pickerInput]}>
                      <Picker
                        style={styles.picker}
                        selectedValue={selectedCustomerType}
                        onValueChange={(value) =>
                          setSelectedCustomerType(value)
                        }
                      >
                        <Picker.Item label="Chits" value={"chits"} />
                        <Picker.Item label="Gold Chits" value={"goldChit"} />
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={{ fontWeight: "bold", marginTop: 10 }}>
                      Groups
                    </Text>
                    <View style={[styles.inputGroup, styles.pickerInput]}>
                      <Picker
                        style={styles.picker}
                        selectedValue={formFields.group_id}
                        onValueChange={(value) =>
                          handleInputChange("group_id", value)
                        }
                      >
                        <Picker.Item label="Select Group" value={""} />
                        {groups.map((group) => (
                          <Picker.Item
                            label={`${group?.group_name}`}
                            value={group._id}
                            key={group._id}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  {/* Customer selection with search */}
                  <View style={styles.formGroup}>
                    <Text style={{ fontWeight: "bold", marginTop: 10 }}>
                      Customer
                    </Text>
                    <TouchableOpacity
                      style={[styles.inputGroup, styles.pickerInput]}
                      onPress={() => setIsSearchModalVisible(true)}
                    >
                      <Text style={styles.selectedCustomerText}>
                        {formFields.user_id
                          ? agentCustomers.find(
                              (c) => c._id === formFields.user_id
                            )?.full_name || "Select Customer"
                          : "Select Customer"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={{ fontWeight: "bold", marginTop: 10 }}>
                      Number of Tickets
                    </Text>
                    <View
                      style={[
                        styles.inputGroup,
                        focusedInput === "no_of_tickets" &&
                          styles.inputGroupFocused,
                      ]}
                    >
                      <TextInput
                        placeholder="Enter Number of Tickets"
                        style={styles.textInput}
                        value={formFields.no_of_tickets}
                        keyboardType="number-pad"
                        onChangeText={(value) =>
                          handleInputChange("no_of_tickets", value)
                        }
                        onFocus={() => setFocusedInput("no_of_tickets")}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                    {formFields.group_id && (
                      <Text
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          color: availableTickets.length > 0 ? "blue" : "red",
                          marginTop: 5,
                        }}
                      >
                        {availableTickets.length > 0
                          ? `Only ${availableTickets.length} tickets left`
                          : "Group is Full"}
                      </Text>
                    )}
                  </View>
                  <Button
                    title={isLoading ? "Please wait..." : "Enroll Customer"}
                    filled
                    disabled={isLoading}
                    style={styles.addButton}
                    onPress={handleEnrollCustomer}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Search Modal */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsSearchModalVisible(false)}>
              <Feather name="arrow-left" size={24} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Customer</Text>
          </View>
          <View style={styles.searchContainer}>
            <Feather
              name="search"
              size={20}
              color={COLORS.gray}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search by name"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => handleSelectCustomer(item)}
              >
                <Text style={styles.customerItemText}>{item.full_name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.emptyListText}>No customers found.</Text>
            )}
          />
        </SafeAreaView>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  headerContainer: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 28,
    color: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  myCustomersButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: COLORS.third,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  myCustomersButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    marginTop: 25,
    marginBottom: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    marginTop: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    height: 45,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputGroupFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    ...Platform.select({ android: { height: 55 }, ios: { height: 55 } }),
    color: "#000",
    paddingRight: 10,
  },
  pickerInput: {
    paddingHorizontal: 0,
  },
  picker: {
    flex: 1,
    height: "100%",
    ...Platform.select({
      android: {
        height: 55,
      },
      ios: {
        height: 55,
      },
    }),
  },
  selectedCustomerText: {
    color: COLORS.black,
    paddingLeft: 15,
  },
  addButton: {
    marginTop: 25,
    marginBottom: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 25,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.black,
  },
  customerItem: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    // borderBottomWidth: 1, // This line was removed in a previous request
    // borderBottomColor: COLORS.lightGray, // This line was removed in a previous request
  },
  customerItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: COLORS.gray,
  },
});

export default EnrollCustomer;
