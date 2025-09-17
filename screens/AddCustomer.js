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
import Feather from "react-native-vector-icons/Feather"; // Import the icon library

const AddCustomer = ({ route, navigation }) => {
  const { user, customer } = route.params;
  const [receipt, setReceipt] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerType, setSelectedCustomerType] = useState("chit");
  const [focusedInput, setFocusedInput] = useState(null);

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

  const handleInputChange = (field, value) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  };

  const handleAddCustomer = async () => {
    setIsLoading(true);

    const baseUrl =
      selectedCustomerType === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;

    if (
      !customerInfo.full_name ||
      !customerInfo.phone_number ||
      !customerInfo.email ||
      !customerInfo.password ||
      !customerInfo.address ||
      !customerInfo.pincode ||
      !customerInfo.adhaar_no ||
      !selectedCustomerType
    ) {
      Alert.alert("Required", "All fields must be valid and required. ");
      setIsLoading(false);
      return;
    }
    if (customerInfo.phone_number.length > 10) {
      ToastAndroid.show(
        "Invalid Phone Number",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      setIsLoading(false);
      return;
    }

    try {
      const data = {
        full_name: customerInfo.full_name,
        phone_number: customerInfo.phone_number,
        email: customerInfo.email,
        password: customerInfo.password,
        address: customerInfo.address,
        pincode: customerInfo.pincode,
        adhaar_no: customerInfo.adhaar_no,
        pan_no: customerInfo?.pan_no,
        agent: user.userId,
      };
      const response = await axios.post(`${baseUrl}/user/add-user`, data);

      if (response.status === 201) {
        ToastAndroid.show(
          "Customer Added Successfully!",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        );
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
        navigation.replace("EnrollCustomer", { user: user });
      }
    } catch (error) {
      console.error("Error adding :", error.message);
      Alert.alert("Error adding Customer", error?.response?.data?.message);
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
                <Text style={styles.headerText}>Add Customer</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Customer", {
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
                  {/* Full Name Input with Icon */}
                  <View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "bold" }}>Full Name</Text>
                      <Text style={{ fontWeight: "bold", color: "red" }}>
                        {" "}
                        *
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        focusedInput === "full_name" &&
                          styles.inputGroupFocused,
                      ]}
                    >
                      <Feather
                        name="user"
                        size={18}
                        color="#888"
                        style={styles.icon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter Full Name"
                        value={customerInfo.full_name}
                        keyboardType="default"
                        onChangeText={(value) =>
                          handleInputChange("full_name", value)
                        }
                        onFocus={() => setFocusedInput("full_name")}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  {/* Email Input with Icon */}
                  <View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "bold" }}>Email</Text>
                      <Text style={{ fontWeight: "bold", color: "red" }}>
                        {" "}
                        *
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        focusedInput === "email" && styles.inputGroupFocused,
                      ]}
                    >
                      <Feather
                        name="mail"
                        size={18}
                        color="#888"
                        style={styles.icon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter Email"
                        value={customerInfo.email}
                        keyboardType="email-address"
                        onChangeText={(value) =>
                          handleInputChange("email", value)
                        }
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    {/* Phone Number Input with Icon */}
                    <View style={styles.column}>
                      <View style={{ flexDirection: "row" }}>
                        <Text style={{ fontWeight: "bold" }}>Phone</Text>
                        <Text style={{ fontWeight: "bold", color: "red" }}>
                          {" "}
                          *
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.inputGroup,
                          focusedInput === "phone_number" &&
                            styles.inputGroupFocused,
                        ]}
                      >
                        <Feather
                          name="phone"
                          size={18}
                          color="#888"
                          style={styles.icon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Phone Number"
                          keyboardType="number-pad"
                          value={customerInfo.phone_number}
                          onChangeText={(value) =>
                            handleInputChange("phone_number", value)
                          }
                          onFocus={() => setFocusedInput("phone_number")}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                    </View>
                    {/* Pincode Input with Icon */}
                    <View style={styles.column}>
                      <View style={{ flexDirection: "row" }}>
                        <Text style={{ fontWeight: "bold" }}>Pincode</Text>
                        <Text style={{ fontWeight: "bold", color: "red" }}>
                          {" "}
                          *
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.inputGroup,
                          focusedInput === "pincode" &&
                            styles.inputGroupFocused,
                        ]}
                      >
                        <Feather
                          name="map-pin"
                          size={18}
                          color="#888"
                          style={styles.icon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Pincode"
                          keyboardType="number-pad"
                          value={customerInfo.pincode}
                          onChangeText={(value) =>
                            handleInputChange("pincode", value)
                          }
                          onFocus={() => setFocusedInput("pincode")}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Password Input with Icon */}
                  <View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "bold" }}>Password</Text>
                      <Text style={{ fontWeight: "bold", color: "red" }}>
                        {" "}
                        *
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        focusedInput === "password" && styles.inputGroupFocused,
                      ]}
                    >
                      <Feather
                        name="lock"
                        size={18}
                        color="#888"
                        style={styles.icon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter Password"
                        value={customerInfo.password}
                        onChangeText={(value) =>
                          handleInputChange("password", value)
                        }
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  {/* Adhaar Number Input with Icon */}
                  <View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "bold" }}>Adhaar Number</Text>
                      <Text style={{ fontWeight: "bold", color: "red" }}>
                        {" "}
                        *
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        focusedInput === "adhaar_no" &&
                          styles.inputGroupFocused,
                      ]}
                    >
                      <Feather
                        name="credit-card"
                        size={18}
                        color="#888"
                        style={styles.icon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter Adhaar Number"
                        keyboardType="number-pad"
                        value={customerInfo.adhaar_no}
                        onChangeText={(value) =>
                          handleInputChange("adhaar_no", value)
                        }
                        onFocus={() => setFocusedInput("adhaar_no")}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  {/* Pan Number Input with Icon */}
                  <View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "bold" }}>Pan Number</Text>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        focusedInput === "pan_no" && styles.inputGroupFocused,
                      ]}
                    >
                      <Feather
                        name="file-text"
                        size={18}
                        color="#888"
                        style={styles.icon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter Pan Number"
                        value={customerInfo.pan_no}
                        keyboardType="default"
                        onChangeText={(value) =>
                          handleInputChange("pan_no", value)
                        }
                        onFocus={() => setFocusedInput("pan_no")}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  {/* Address Input with Icon */}
                  <View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "bold" }}>Address</Text>
                      <Text style={{ fontWeight: "bold", color: "red" }}>
                        {" "}
                        *
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        focusedInput === "address" && styles.inputGroupFocused,
                      ]}
                    >
                      <Feather
                        name="home"
                        size={18}
                        color="#888"
                        style={styles.icon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter Address"
                        value={customerInfo.address}
                        keyboardType="default"
                        onChangeText={(value) =>
                          handleInputChange("address", value)
                        }
                        onFocus={() => setFocusedInput("address")}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "bold" }}>Customer Type</Text>
                      <Text style={{ fontWeight: "bold", color: "red" }}>
                        {" "}
                        *
                      </Text>
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

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  // New style for the input and icon container
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
  // New style for the icon
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
