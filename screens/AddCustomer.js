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
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
// Assuming constants and components are in the correct paths
import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "react-native-vector-icons/Feather";

const AddCustomer = ({ route, navigation }) => {
  // Destructure 'user', 'customer' is not used anymore
  const { user } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerType, setSelectedCustomerType] = useState("chit");
  const [focusedInput, setFocusedInput] = useState(null);

  // State with only the required fields
  const [customerInfo, setCustomerInfo] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    address: "",
  });

  // Removed useEffect for fetching 'receipt' data as it's not used in the UI

  const handleInputChange = (field, value) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  };

  const handleAddCustomer = async () => {
    setIsLoading(true);

    const baseUrl =
      selectedCustomerType === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;

    // Validation for all required fields
    if (
      !customerInfo.full_name ||
      !customerInfo.phone_number ||
      !customerInfo.email ||
      !customerInfo.address ||
      !selectedCustomerType
    ) {
      Alert.alert("Required", "All fields must be valid and required.");
      setIsLoading(false);
      return;
    }

    // Enforce phone number is exactly 10 digits
    if (customerInfo.phone_number.length !== 10) {
      ToastAndroid.show(
        "Invalid Phone Number (must be 10 digits)",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      setIsLoading(false);
      return;
    }

    try {
      // Data payload: includes placeholder password as it is often mandatory
      const data = {
        full_name: customerInfo.full_name,
        phone_number: customerInfo.phone_number,
        email: customerInfo.email,
        password: "TempPassword123!", 
        address: customerInfo.address,
        agent: user.userId,
        pincode: "",
        adhaar_no: "",
        pan_no: "",
      };

      const response = await axios.post(`${baseUrl}/user/add-user`, data);

      if (response.status === 201) {
        ToastAndroid.show(
          "Customer Added Successfully!",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        );
        // Reset state
        setCustomerInfo({
          full_name: "",
          phone_number: "",
          email: "",
          address: "",
        });
        setSelectedCustomerType("chit");
        navigation.replace("EnrollCustomer", { user: user });
      }
    } catch (error) {
      console.error("Error adding :", error.message);
      const errorMessage = error?.response?.data?.message || "An unknown error occurred.";
      Alert.alert("Error adding Customer", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render input fields for cleaner JSX
  const renderInputField = (label, field, iconName, keyboardType = "default", maxLength = undefined) => (
    <View style={{ marginBottom: 15 }}>
      <View style={{ flexDirection: "row" }}>
        <Text style={{ fontWeight: "bold" }}>{label}</Text>
        <Text style={{ fontWeight: "bold", color: "red" }}> *</Text>
      </View>
      <View
        style={[
          styles.inputGroup,
          focusedInput === field && styles.inputGroupFocused,
        ]}
      >
        <Feather
          name={iconName}
          size={18}
          color="#888"
          style={styles.icon}
        />
        <TextInput
          style={styles.textInput}
          placeholder={`Enter ${label}`}
          value={customerInfo[field]}
          keyboardType={keyboardType}
          onChangeText={(value) => handleInputChange(field, value)}
          onFocus={() => setFocusedInput(field)}
          onBlur={() => setFocusedInput(null)}
          maxLength={maxLength}
        />
      </View>
    </View>
  );


  return (
    <LinearGradient
      colors={['#b6e4ebff', '#1796d1ff']}
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

              {/* Header and "My Customers" button fixed structure */}
              <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Add Customer</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("ViewEnrollments", {
                      user: { ...user },
                    })
                  }
                  style={styles.myCustomersButton}
                >
                  <Text style={styles.myCustomersButtonText}>My Customers</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardContainer}>
                <View style={styles.contentContainer}>

                  {/* Full Name Input */}
                  {renderInputField("Full Name", "full_name", "user")}

                  {/* Email Input */}
                  {renderInputField("Email", "email", "mail", "email-address")}

                  {/* Phone Number Input */}
                  {renderInputField("Phone Number", "phone_number", "phone", "number-pad", 10)}

                  {/* Address Input */}
                  {renderInputField("Address", "address", "home", "default")}

                  {/* Customer Type Picker */}
                  <View style={{ marginBottom: 15 }}>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "bold" }}>Customer Type</Text>
                      <Text style={{ fontWeight: "bold", color: "red" }}> *</Text>
                    </View>
                    <View style={styles.pickerContainer}>
                      <Picker
                        style={styles.picker}
                        selectedValue={selectedCustomerType}
                        onValueChange={(itemValue) => {
                          setSelectedCustomerType(itemValue);
                        }}
                      >
                        <Picker.Item label="Chit" value={"chit"} />
                        <Picker.Item label="Gold Chit" value={"goldChit"} />
                      </Picker>
                    </View>
                  </View>

                  <Button
                    title={isLoading ? "Please wait..." : "Add Customer"}
                    filled
                    disabled={isLoading}
                    style={styles.addButton}
                    onPress={handleAddCustomer}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    backgroundColor: "#e8f4faff",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroupFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  icon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: "100%",
    color: "#000",
    ...Platform.select({
      android: {
        height: 55,
      },
      ios: {
        height: 55,
      },
    }),
  },
  contentContainer: {
    marginTop: 20,
  },
  pickerContainer: {
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginTop: 5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  gradientOverlay: {
    flex: 1,
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
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
  },
  myCustomersButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: COLORS.third,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  myCustomersButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
  addButton: {
    marginTop: 20,
    marginBottom: 4,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AddCustomer;