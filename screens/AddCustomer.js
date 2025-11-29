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
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import Feather from "react-native-vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import * as Contacts from "expo-contacts";

import COLORS from "../constants/color";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";
// 🎯 Added placeholder for new base URLs. Define these correctly in your constants file.
// Assuming pigmeBaseUrl and loanBaseUrl are the same as chitBaseUrl unless defined separately.
const pigmeBaseUrl = chitBaseUrl; // Placeholder
const loanBaseUrl = chitBaseUrl; // Placeholder

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AddCustomer = ({ route, navigation }) => {
  const { user } = route.params;
  
  // 🎯 STEP 1: Define the referred type based on your context (Employee/Agent)
  const REFERRED_TYPE = "Employee"; 

  const [isQuickAdd, setIsQuickAdd] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerType, setSelectedCustomerType] = useState("chit");
  const [focusedInput, setFocusedInput] = useState(null);
  // ✅ New state to manage password visibility
  const [showPassword, setShowPassword] = useState(false); 

  const [customerInfo, setCustomerInfo] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    password: "",
    address: "",
    pincode: "",
    adhaar_no: "",
    pan_no: "",
  });

  const handleInputChange = (field, value) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  };

  const toggleAddMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsQuickAdd(!isQuickAdd);
  };

  const showCustomToast = (msg) => {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  };

  // ✅ Contact Picker (One button below fields)
  const handlePickContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      showCustomToast("Permission to access contacts was denied.");
      return;
    }

    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;

      const name = contact.name ?? "";
      const phoneNumbers = contact.phoneNumbers;
      let phone = "";
      if (phoneNumbers && phoneNumbers.length > 0) {
        // Simple sanitization for phone number
        phone = phoneNumbers[0].number.replace(/\D/g, "");
      }

      setCustomerInfo((prev) => ({
        ...prev,
        full_name: name || prev.full_name,
        phone_number: phone || prev.prev_number, 
      }));

      showCustomToast("Contact selected successfully.");
    } catch (err) {
      console.error("Error picking contact:", err);
      showCustomToast("Failed to pick contact.");
    }
  };
  
  const handleAddCustomer = async () => {
    setIsLoading(true);

    // 🎯 Determine the base URL and the API route based on the selected customer type
    let baseUrl;
    let apiRoute;
    let successMessage = "Customer Added Successfully!";

    switch (selectedCustomerType) {
      case "chit":
        baseUrl = chitBaseUrl;
        apiRoute = "/user/add-user"; // Existing route
        break;
      case "goldChit":
        baseUrl = goldBaseUrl;
        apiRoute = "/user/add-user"; // Existing route
        break;
      case "pigme":
        baseUrl = pigmeBaseUrl;
        apiRoute = "/pigme/user/add"; // New Pigme route
        successMessage = "Pigme Customer Added Successfully!";
        break;
      case "loan":
        baseUrl = loanBaseUrl;
        apiRoute = "/loans/user/add"; // New Loan route
        successMessage = "Loan Customer Added Successfully!";
        break;
      default:
        showCustomToast("Invalid Customer Type selected.");
        setIsLoading(false);
        return;
    }

    if (!customerInfo.full_name || !customerInfo.phone_number || !customerInfo.password) {
      Alert.alert("Required", "Full Name, Phone Number, and Password are required.");
      setIsLoading(false);
      return;
    }

    if (customerInfo.phone_number.length !== 10) {
      showCustomToast("Invalid Phone Number (must be 10 digits)");
      setIsLoading(false);
      return;
    }

    if (
      !isQuickAdd &&
      (!customerInfo.email ||
        !customerInfo.address ||
        !customerInfo.pincode ||
        !customerInfo.adhaar_no)
    ) {
      Alert.alert("Required", "Please fill all mandatory fields in detailed form.");
      setIsLoading(false);
      return;
    }

    try {
      let data;

      // 🎯 STEP 2: Include 'referred_type' for Pigme and Loan schemes, and 'agent_id'
      if (selectedCustomerType === "pigme" || selectedCustomerType === "loan") {
        data = { 
          ...customerInfo, 
          agent_id: user.userId, 
          referred_type: REFERRED_TYPE // <-- **Critical addition for Pigme/Loan**
        }; 
      } else {
        data = { ...customerInfo, agent: user.userId }; // Keep 'agent' for chit & goldChit
      }

      // 🎯 Use the determined baseUrl and apiRoute
      const response = await axios.post(`${baseUrl}${apiRoute}`, data);

      if (response.status === 201) {
        showCustomToast(successMessage);
        
        // Reset form fields
        setCustomerInfo({
          full_name: "",
          phone_number: "",
          email: "",
          password: "",
          address: "",
          pincode: "",
          adhaar_no: "",
          pan_no: "",
        });
        setSelectedCustomerType("chit");
        
        // ✅ NAVIGATION CHANGE: Navigate to EnrollCustomer screen
        navigation.navigate("EnrollCustomer", { 
          user, 
          newCustomer: response.data.customer || response.data.user // Assuming API returns customer/user data
        }); 
      }
    } catch (error) {
      console.error("Error adding customer:", error.message);
      Alert.alert("Error", error?.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient colors={["#1aa2ccff", "#1aa2ccff"]} style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isQuickAdd ? "Quick Add Customer" : "Detailed Add Customer"}
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("Customer", { user })}
          style={styles.myCustomersButton}
        >
          <Text style={styles.myCustomersButtonText}>MY Cust</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Main Form */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.formCard}>
            {/* Toggle Mode Button */}
            <TouchableOpacity style={styles.toggleButton} onPress={toggleAddMode}>
              <Feather
                name={isQuickAdd ? "list" : "zap"}
                size={16}
                color="#1aa2ccff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.toggleButtonText}>
                {isQuickAdd ? "Switch to Detailed Add" : "Switch to Quick Add"}
              </Text>
            </TouchableOpacity>
            
            
            
            
            {/* Full Name */}
            <InputField
              label="Full Name"
              icon="user"
              required
              value={customerInfo.full_name}
              onChangeText={(v) => handleInputChange("full_name", v)}
              focused={focusedInput === "full_name"}
              onFocus={() => setFocusedInput("full_name")}
              onBlur={() => setFocusedInput(null)}
            />

            {/* Phone Number */}
            <InputField
              label="Phone Number"
              icon="phone"
              required
              keyboardType="number-pad"
              value={customerInfo.phone_number}
              onChangeText={(v) => handleInputChange("phone_number", v)}
              focused={focusedInput === "phone_number"}
              onFocus={() => setFocusedInput("phone_number")}
              onBlur={() => setFocusedInput(null)}
            />

            {/* Password */}
            <InputField
              label="Password"
              icon="lock"
              required
              // Pass the showPassword state and its toggle function to the InputField
              secureTextEntry={!showPassword} 
              isPassword
              onTogglePassword={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
              // End of new props
              value={customerInfo.password}
              onChangeText={(v) => handleInputChange("password", v)}
              focused={focusedInput === "password"}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
            />

            {/* Customer Type - UPDATED PICKER */}
            <Text style={styles.label}>Customer Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCustomerType}
                onValueChange={(val) => setSelectedCustomerType(val)}
                style={styles.picker}
                itemStyle={styles.pickerItem} 
              >
                <Picker.Item label="Chit" value="chit" />
                <Picker.Item label="Gold Chit" value="goldChit" />
                {/* 🎯 Added new customer types */}
                <Picker.Item label="Pigme" value="pigme" />
                <Picker.Item label="Loan" value="loan" />
              </Picker>
            </View>

            {/* Detailed Fields */}
            {!isQuickAdd && (
              <>
                <InputField
                  label="Email"
                  icon="mail"
                  required
                  keyboardType="email-address"
                  value={customerInfo.email}
                  onChangeText={(v) => handleInputChange("email", v)}
                />
                <InputField
                  label="Address"
                  icon="home"
                  required
                  value={customerInfo.address}
                  onChangeText={(v) => handleInputChange("address", v)}
                />
                <InputField
                  label="Pincode"
                  icon="map-pin"
                  required
                  keyboardType="number-pad"
                  value={customerInfo.pincode}
                  onChangeText={(v) => handleInputChange("pincode", v)}
                />
                <InputField
                  label="Aadhaar Number"
                  icon="credit-card"
                  required
                  keyboardType="number-pad"
                  value={customerInfo.adhaar_no}
                  onChangeText={(v) => handleInputChange("adhaar_no", v)}
                />
                <InputField
                  label="PAN Number"
                  icon="file-text"
                  value={customerInfo.pan_no}
                  onChangeText={(v) => handleInputChange("pan_no", v)}
                />
              </>
            )}

            {/* Add Button */}
            <TouchableOpacity
              style={[styles.addButton, isLoading && { opacity: 0.7 }]}
              onPress={handleAddCustomer}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>
                  {isQuickAdd ? "Quick Add" : "Add Customer"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

// Reusable input component (UPDATED to handle password visibility)
const InputField = ({
  label,
  icon,
  required,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  isPassword, // New prop to identify password field
  onTogglePassword, // New prop for eye icon press
  showPassword, // New prop for current visibility state
}) => (
  <View style={{ marginBottom: 15 }}>
    <Text style={styles.label}>
      {label} {required && <Text style={{ color: "red" }}>*</Text>}
    </Text>
    <View style={styles.inputGroup}>
      <Feather name={icon} size={18} color="#888" style={styles.icon} />
      <TextInput
        style={styles.textInput}
        placeholder={`Enter ${label}`}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#999"
      />
      
      {/* Eye Icon for Password Field */}
      {isPassword && (
        <TouchableOpacity onPress={onTogglePassword} style={styles.passwordToggle}>
          <Feather 
            name={showPassword ? "eye-off" : "eye"} 
            size={18} 
            color="#888" 
          />
        </TouchableOpacity>
      )}
      
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f2f8" },
  headerContainer: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingVertical: 35,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 6,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 50,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  myCustomersButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 25,
  },
  myCustomersButtonText: { color: "#1aa2ccff", fontSize: 12, fontWeight: "bold" },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 25,
    marginHorizontal: 20,
    marginTop: 25,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE9FB",
    borderRadius: 25,
    paddingVertical: 10,
    marginBottom: 20,
  },
  toggleButtonText: { color: "#1aa2ccff", fontWeight: "bold", fontSize: 14 },
  label: { fontWeight: "bold", color: "#333", marginBottom: 5 },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  icon: { marginRight: 8 },
  textInput: { flex: 1, color: "#000", fontSize: 14 },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8c009ff",
    borderRadius: 25,
    paddingVertical: 10,
    marginBottom: 15,
    elevation: 3,
  },
  contactButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 5,
    marginBottom: 15,
    // *** MODIFIED *** Increased height on Android to prevent clipping
    height: Platform.OS === "android" ? 55 : undefined, 
  },
  picker: { 
    // *** MODIFIED *** Increased height to match container on Android
    height: Platform.OS === "android" ? 55 : 100, 
    color: "#333", 
  },
  pickerItem: {
    // Set item height to match the picker
    fontSize: 14, 
    height: 55, 
  },
  // ✅ New style for the password eye icon
  passwordToggle: {
    paddingLeft: 10, // Add some padding for better tap area
  },
  addButton: {
    backgroundColor: "#1aa2ccff",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 25,
    alignItems: "center",
    elevation: 5,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default AddCustomer;