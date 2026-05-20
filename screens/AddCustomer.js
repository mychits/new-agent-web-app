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

// Placeholder for other base URLs
const pigmeBaseUrl = chitBaseUrl; 
const loanBaseUrl = chitBaseUrl; 

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AddCustomer = ({ route, navigation }) => {
  const { user } = route.params;
  
  const REFERRED_TYPE = "Employee"; 

  const [isQuickAdd, setIsQuickAdd] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerType, setSelectedCustomerType] = useState("chit");
  const [focusedInput, setFocusedInput] = useState(null);
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

    let baseUrl;
    let apiRoute;
    let successMessage = "Customer Added Successfully!";

    switch (selectedCustomerType) {
      case "chit":
        baseUrl = chitBaseUrl;
        apiRoute = "/user/add-user";
        break;
  
      case "pigme":
        baseUrl = pigmeBaseUrl;
        apiRoute = "/pigme/user/add";
        successMessage = "Pigme Customer Added Successfully!";
        break;
      case "loan":
        baseUrl = loanBaseUrl;
        apiRoute = "/loans/user/add";
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

      if (selectedCustomerType === "pigme" || selectedCustomerType === "loan") {
        data = { 
          ...customerInfo, 
          agent_id: user.userId, 
          referred_type: REFERRED_TYPE
        }; 
      } else {
        data = { ...customerInfo, agent: user.userId };
      }

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

        // ✅ CONDITIONAL NAVIGATION LOGIC
        if (selectedCustomerType === "chit") {
          // Navigate ONLY if type is 'chit'
          navigation.navigate("EnrollCustomer", { 
            user, 
            newCustomer: response.data.customer || response.data.user
          });
        } else {
          // For 'pigme' or 'loan', stay on screen and just reset type
          setSelectedCustomerType("chit"); 
        }
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
      <LinearGradient colors={['#24C6DC', '#183A5D']} style={styles.headerContainer}>
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
              secureTextEntry={!showPassword} 
              isPassword
              onTogglePassword={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
              value={customerInfo.password}
              onChangeText={(v) => handleInputChange("password", v)}
              focused={focusedInput === "password"}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
            />

            {/* Customer Type Picker */}
            <Text style={styles.label}>Customer Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCustomerType}
                onValueChange={(val) => setSelectedCustomerType(val)}
                style={styles.picker}
                itemStyle={styles.pickerItem} 
              >
                <Picker.Item label="Chit" value="chit" />
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

// Reusable input component
const InputField = ({
  label,
  icon,
  required,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  isPassword,
  onTogglePassword,
  showPassword,
  focused,
  onFocus,
  onBlur
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
        onFocus={onFocus}
        onBlur={onBlur}
      />
      
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
    height: Platform.OS === "android" ? 55 : undefined, 
  },
  picker: { 
    height: Platform.OS === "android" ? 55 : 100, 
    color: "#333", 
  },
  pickerItem: {
    fontSize: 14, 
    height: 55, 
  },
  passwordToggle: {
    paddingLeft: 10,
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