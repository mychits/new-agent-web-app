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

// --- DESIGN CONSTANTS COPIED from Due.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
// ---------------------------------------------


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
  }, [selectedCustomerType, baseUrl]);
  
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
  }, [selectedCustomerType, baseUrl]);
  
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
  }, [user.userId]);

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
    if (field === "group_id" && value) {
      try {
        const response = await axios.post(
          `${baseUrl}/enroll/get-next-tickets/${value}`
        );
        if (response.status >= 400)
          throw new Error("Failed to fetch available tickets");
        setAvailableTickets(response.data.availableTickets);
      } catch (err) {
        console.error("Error fetching next tickets");
        setAvailableTickets([]); // Clear tickets on error
      }
    } else if (field === "group_id" && !value) {
        setAvailableTickets([]); // Clear tickets if no group is selected
    }
  };

  const handleEnrollCustomer = async () => {
    if (!formFields.group_id || !formFields.user_id) {
      Alert.alert("Required", "Please select a Customer and a Group.");
      return;
    }
    
    if (!formFields.no_of_tickets || isNaN(formFields.no_of_tickets) || Number(formFields.no_of_tickets) <= 0) {
      ToastAndroid.showWithGravity(
        "Number of tickets must be a valid number greater than zero.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      return;
    }
    
    const ticketsCount = parseInt(formFields.no_of_tickets, 10);
    
    if (ticketsCount > availableTickets.length) {
      ToastAndroid.showWithGravity(
        `Number of Tickets is more than available tickets. Only ${availableTickets.length} available.`,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      return;
    }

    const { group_id, user_id } = formFields;
    

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
        payment_type: "cash", 
        referred_type: "self", 
        referred_customer: null,
        referred_lead: null,
        chit_asking_month: "0",
      }));

    try {
      // Loop through and post each ticket entry
      for (const ticketEntry of ticketEntries) {
        await axios.post(`${baseUrl}/enroll/add-enroll`, ticketEntry);
      }

      ToastAndroid.show("Customer Enrolled Successfully!", ToastAndroid.SHORT);
      setFormFields({
        group_id: "",
        user_id: "",
        no_of_tickets: "",
      });

      // Navigate back to the main screen after successful enrollment
      navigation.replace("BottomNavigation", { user: { ...user } });
    } catch (error) {
      console.error("Error enrolling customer:", error?.response?.data || error.message);
      Alert.alert("Error", error?.response?.data?.message || "Error Enrolling Customer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        {/* Top Header Section with Gradient */}
        <LinearGradient
            colors={TOP_GRADIENT}
            style={styles.topContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.headerSpacer}>
                <Header />
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>Add Enrollment</Text>
                <TouchableOpacity
                    onPress={handleCancel}
                    style={styles.skipButton}
                >
                    <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>

        {/* Main Content Area (White Background with Border Radius) */}
        <View style={styles.mainContentArea}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* Form Fields container, replacing the old cardContainer */}
            <View style={styles.formContentWrapper}> 
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
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
                  <Text style={styles.label}>
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
                  <Text style={styles.label}>
                    Customer
                  </Text>
                  <TouchableOpacity
                    style={[styles.inputGroup]}
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
                  <Text style={styles.label}>
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
                      placeholderTextColor={TEXT_GREY}
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
                      style={styles.ticketInfoText}
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
          </ScrollView>
        </View>

      </KeyboardAvoidingView>
      
      {/* Search Modal - MOVED INSIDE SafeAreaView */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: CARD_BG }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsSearchModalVisible(false)}>
              <Feather name="arrow-left" size={24} color={MODERN_PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Customer</Text>
          </View>
          <View style={styles.searchContainer}>
            <Feather
              name="search"
              size={20}
              color={TEXT_GREY}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- LAYOUT STYLES (from Due.js/Commissions.js) ---
  safeArea: { 
    flex: 1, 
    backgroundColor: TOP_GRADIENT[0] 
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingBottom: 25, // Adjusted for spacing above content area
    zIndex: 1,
  },
  headerSpacer: { 
      paddingTop: 20, 
      paddingBottom: 5 
  }, 
  mainContentArea: {
    flex: 1,
    backgroundColor: CARD_BG, // Solid white background
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    marginTop: -20, // Overlap the top container for the curved effect
    zIndex: 2, // Ensure it's above the gradient edge
  },
  scrollContainer: { 
    paddingBottom: 50, 
    paddingTop: 30, // Space inside the curve
    paddingHorizontal: 22, // Apply horizontal padding here
  },
  formContentWrapper: {
    gap: 15,
  },

  // --- TITLE STYLES (Combined header and button) ---
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30, // Pushes it down a bit from Header
    paddingHorizontal: 6, // Small adjustment for alignment
  },
  title: {
    fontSize: 28, 
    fontWeight: "900",
    color: CARD_BG, // White text
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: CARD_BG, // White background
    borderRadius: 20,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  skipButtonText: {
    color: ACCENT_BLUE, // Blue text color
    fontSize: 14,
    fontWeight: "700",
  },

  // --- FORM FIELD STYLES (Updated to modern look) ---
  label: { 
    fontWeight: "bold", 
    marginTop: 10,
    fontSize: 16,
    color: MODERN_PRIMARY, // Dark text
  },
  formGroup: {
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    height: 50, // Standard height for TextInputs
    backgroundColor: CARD_BG,
    borderRadius: 12, // Rounded corners for inputs
    paddingHorizontal: 15,
    marginTop: 5,
    borderWidth: 1,
    borderColor: BORDER_COLOR, // Light border
    // Remove heavy shadow, use a subtle elevation
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputGroupFocused: {
    borderColor: ACCENT_BLUE, // Blue border when focused
    borderWidth: 2,
    elevation: 3,
    shadowOpacity: 0.2,
  },
  textInput: {
    flex: 1,
    height: "100%",
    color: MODERN_PRIMARY, // Dark text color
    paddingRight: 10,
    fontSize: 16,
  },
  // *** PICKER STYLES MODIFIED FOR ANDROID VISIBILITY ***
  pickerInput: {
    paddingHorizontal: 0,
    height: Platform.OS === 'android' ? 55 : 50, // Increased height for Android
    justifyContent: 'center', // Vertical alignment helper
  },
  picker: {
    flex: 1,
    height: Platform.OS === 'android' ? 55 : 50, // Picker component height matches container
    // CRITICAL FIX FOR ANDROID TEXT ALIGNMENT
    ...(Platform.OS === 'android' && { textAlignVertical: 'center' }), 
  },
  // *** END OF PICKER MODIFICATIONS ***
  selectedCustomerText: {
    color: MODERN_PRIMARY,
    paddingLeft: 0, // No extra padding needed if inputGroup has it
    fontSize: 16,
  },
  ticketInfoText: {
    textAlign: "center",
    fontWeight: "600",
    color: ACCENT_BLUE,
    marginTop: 5,
    fontSize: 14,
  },
  addButton: {
    marginTop: 25,
    marginBottom: 10,
    backgroundColor: ACCENT_BLUE, // Use ACCENT_BLUE for the primary button
    borderRadius: 12,
    // Modern shadow
    shadowColor: ACCENT_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // --- MODAL STYLES (Updated Colors) ---
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
    color: MODERN_PRIMARY, // Dark text
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 12, // Match form input style
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: MODERN_PRIMARY,
  },
  customerItem: {
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  customerItemText: {
    fontSize: 16,
    color: MODERN_PRIMARY,
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: TEXT_GREY,
  },
});

export default EnrollCustomer;