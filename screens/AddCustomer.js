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

// *** IMPORTS (MUST BE KEPT) ***
import COLORS from "../constants/color";
import Header from "../components/Header";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "react-native-vector-icons/Feather";
import * as Contacts from "expo-contacts";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Red star color constant ---
const REQUIRED_STAR_COLOR = "#ff0000";

// Reusable input component
const InputField = ({
  label,
  field,
  iconName,
  keyboardType = "default",
  maxLength,
  secureTextEntry = false,
  value,
  onChangeText,
  focusedInput,
  setFocusedInput,
  required = false,
  multiline = false,
  showPasswordToggle = false,
  onTogglePassword,
}) => (
  <View style={{ marginBottom: 15 }}>
    <View style={{ flexDirection: "row" }}>
      <Text style={{ fontWeight: "600", color: COLORS.dark }}>{label}</Text>
      {required && <Text style={{ fontWeight: "bold", color: REQUIRED_STAR_COLOR }}> *</Text>}
    </View>
    <View
      style={[
        styles.inputGroup,
        focusedInput === field && styles.inputGroupFocused,
        multiline && { height: 80, alignItems: "flex-start" },
      ]}
    >
      <Feather
        name={iconName}
        size={18}
        color={focusedInput === field ? COLORS.primary : COLORS.gray}
        style={styles.icon}
      />
      <TextInput
        style={[styles.textInput, multiline && styles.multilineTextInput]}
        placeholder={`Enter ${label}`}
        value={value}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onFocus={() => setFocusedInput(field)}
        onBlur={() => setFocusedInput(null)}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={COLORS.gray}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {showPasswordToggle && (
        <TouchableOpacity onPress={onTogglePassword}>
          <Feather
            name={secureTextEntry ? "eye-off" : "eye"}
            size={18}
            color={COLORS.gray}
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const AddCustomer = ({ route, navigation }) => {
  const { user } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerType, setSelectedCustomerType] = useState("chit");
  const [focusedInput, setFocusedInput] = useState(null);
  const [isQuickAdd, setIsQuickAdd] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const initialCustomerInfo = {
    full_name: "",
    phone_number: "",
    email: "",
    password: "123456",
    address: "",
    pincode: "",
    adhaar_no: "",
    pan_no: "",
  };

  const [customerInfo, setCustomerInfo] = useState(initialCustomerInfo);

  const handleInputChange = (field, value) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  };

  const showCustomToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("Info", msg);
    }
  };

  const toggleAddMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsQuickAdd(!isQuickAdd);
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
        phone = phoneNumbers[0].number.replace(/\D/g, "").slice(-10);
      }

      setCustomerInfo((prev) => ({
        ...prev,
        full_name: name || prev.full_name,
        phone_number: phone || prev.phone_number,
      }));

      showCustomToast("Contact selected successfully.");
    } catch (err) {
      console.error("Error picking contact:", err);
      showCustomToast("Failed to pick contact.");
    }
  };

  const handleAddCustomer = async () => {
    setIsLoading(true);

    if (!customerInfo.full_name || !customerInfo.phone_number || !selectedCustomerType) {
      Alert.alert("Required", "Customer Name, Customer Type, and Mobile Number are required.");
      setIsLoading(false);
      return;
    }

    if (customerInfo.phone_number.length !== 10 || !/^\d{10}$/.test(customerInfo.phone_number)) {
      showCustomToast("Invalid Phone Number (must be exactly 10 digits)");
      setIsLoading(false);
      return;
    }

    const baseUrl =
      selectedCustomerType === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;

    try {
      const data = {
        full_name: customerInfo.full_name,
        phone_number: customerInfo.phone_number,
        email: customerInfo.email,
        password: customerInfo.password || "123456",
        address: customerInfo.address,
        agent: user.userId,
        pincode: customerInfo.pincode,
        adhaar_no: customerInfo.adhaar_no,
        pan_no: customerInfo.pan_no,
      };

      Object.keys(data).forEach((key) => data[key] === "" && delete data[key]);

      const response = await axios.post(`${baseUrl}/user/add-user`, data);

      if (response.status === 201) {
        showCustomToast("Customer Added Successfully!");
        setCustomerInfo(initialCustomerInfo);
        setSelectedCustomerType("chit");
        navigation.replace("EnrollCustomer", { user });
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      const msg = error?.response?.data?.message || error.message || "Unknown error occurred.";
      Alert.alert("Error adding Customer", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#b6e4ebff", "#1796d1ff"]}
      style={styles.gradientOverlay}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ marginHorizontal: 22, marginTop: 12, flex: 1 }}>
              <Header />

              <View style={styles.headerContainer}>
                <Text style={styles.headerText}>
                  {isQuickAdd ? "Quick Add Customer" : "Detailed Add Customer"}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ViewEnrollments", { user })}
                  style={styles.myCustomersButton}
                >
                  <Text style={styles.myCustomersButtonText}>
                    My{"\n"}Customers
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardContainer}>
                <TouchableOpacity style={styles.toggleButton} onPress={toggleAddMode}>
                  <Feather
                    name={isQuickAdd ? "list" : "zap"}
                    size={16}
                    color={COLORS.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.toggleButtonText}>
                    {isQuickAdd ? "Switch to Detailed Add" : "Switch to Quick Add"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactButton} onPress={handlePickContact}>
                  <Feather name="book" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={styles.contactButtonText}>Select From Contact</Text>
                </TouchableOpacity>

                <InputField
                  label="Customer Name"
                  field="full_name"
                  iconName="user"
                  required
                  value={customerInfo.full_name}
                  onChangeText={(v) => handleInputChange("full_name", v)}
                  focusedInput={focusedInput}
                  setFocusedInput={setFocusedInput}
                />

                <InputField
                  label="Mobile Number"
                  field="phone_number"
                  iconName="phone"
                  required
                  keyboardType="number-pad"
                  maxLength={10}
                  value={customerInfo.phone_number}
                  onChangeText={(v) => handleInputChange("phone_number", v.replace(/[^0-9]/g, ""))}
                  focusedInput={focusedInput}
                  setFocusedInput={setFocusedInput}
                />

                {/* Password Field */}
                <InputField
                  label="Password"
                  field="password"
                  iconName="lock"
                  secureTextEntry={!showPassword}
                  value={customerInfo.password}
                  onChangeText={(v) => handleInputChange("password", v)}
                  focusedInput={focusedInput}
                  setFocusedInput={setFocusedInput}
                  showPasswordToggle
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                {/* Customer Type */}
                <View style={{ marginBottom: 15 }}>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ fontWeight: "600", color: COLORS.dark }}>Customer Type</Text>
                    <Text style={{ fontWeight: "bold", color: REQUIRED_STAR_COLOR }}> *</Text>
                  </View>
                  <View style={styles.pickerContainer}>
                    <Picker
                      style={styles.picker}
                      selectedValue={selectedCustomerType}
                      onValueChange={(itemValue) => setSelectedCustomerType(itemValue)}
                      dropdownIconColor={COLORS.primary}
                    >
                      <Picker.Item label="Chit" value={"chit"} />
                      <Picker.Item label="Gold Chit" value={"goldChit"} />
                    </Picker>
                  </View>
                </View>

                {/* Optional Fields */}
                {!isQuickAdd && (
                  <View style={styles.detailedFieldsContainer}>
                    <InputField
                      label="Email (Optional)"
                      field="email"
                      iconName="mail"
                      keyboardType="email-address"
                      value={customerInfo.email}
                      onChangeText={(v) => handleInputChange("email", v)}
                      focusedInput={focusedInput}
                      setFocusedInput={setFocusedInput}
                    />
                    <InputField
                      label="Address (Optional)"
                      field="address"
                      iconName="home"
                      multiline
                      value={customerInfo.address}
                      onChangeText={(v) => handleInputChange("address", v)}
                      focusedInput={focusedInput}
                      setFocusedInput={setFocusedInput}
                    />
                    <InputField
                      label="Pincode (Optional)"
                      field="pincode"
                      iconName="map-pin"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={customerInfo.pincode}
                      onChangeText={(v) => handleInputChange("pincode", v.replace(/[^0-9]/g, ""))}
                      focusedInput={focusedInput}
                      setFocusedInput={setFocusedInput}
                    />
                    <InputField
                      label="Aadhaar Number (Optional)"
                      field="adhaar_no"
                      iconName="credit-card"
                      keyboardType="number-pad"
                      maxLength={12}
                      value={customerInfo.adhaar_no}
                      onChangeText={(v) => handleInputChange("adhaar_no", v.replace(/[^0-9]/g, ""))}
                      focusedInput={focusedInput}
                      setFocusedInput={setFocusedInput}
                    />
                    <InputField
                      label="PAN Number (Optional)"
                      field="pan_no"
                      iconName="file-text"
                      maxLength={10}
                      value={customerInfo.pan_no}
                      onChangeText={(v) => handleInputChange("pan_no", v.toUpperCase())}
                      focusedInput={focusedInput}
                      setFocusedInput={setFocusedInput}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.addButton, isLoading && { opacity: 0.7 }]}
                  onPress={handleAddCustomer}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.addButtonText}>
                      {isQuickAdd ? "Quick Add" : "Add Customer"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: { flex: 1 },
  headerContainer: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 20,
    color: COLORS.white,
  },
  myCustomersButton: {
    width: 80,
    height: 45,
    paddingHorizontal: 5,
    paddingVertical: 4,
    backgroundColor: COLORS.third,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  myCustomersButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    backgroundColor: COLORS.lightBackground || "#f9f9f9",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.lightGray || "#CCCCCC",
  },
  inputGroupFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  icon: { marginRight: 10 },
  textInput: {
    flex: 1,
    height: "100%",
    color: COLORS.dark || "#333333",
  },
  multilineTextInput: {
    paddingTop: 10,
    height: "100%",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F7FF",
    borderRadius: 25,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  toggleButtonText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.third,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 20,
  },
  contactButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 15,
  },
  pickerContainer: {
    borderRadius: 10,
    backgroundColor: COLORS.lightBackground || "#f9f9f9",
    marginTop: 5,
    borderWidth: 1,
    borderColor: COLORS.lightGray || "#CCCCCC",
    overflow: "hidden",
  },
  picker: { height: 50, width: "100%", color: COLORS.dark || "#333333" },
  addButton: {
    marginTop: 25,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    alignItems: "center",
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 18,
  },
  detailedFieldsContainer: {
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray || "#CCCCCC",
    marginTop: 5,
  },
});

export default AddCustomer;
