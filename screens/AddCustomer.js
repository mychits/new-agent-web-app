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
    ActivityIndicator // Added ActivityIndicator import
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
import { LinearGradient } from "expo-linear-gradient"; // Added LinearGradient import
import Icon from "react-native-vector-icons/FontAwesome"; // Added Icon import


const AddCustomer = ({ route, navigation }) => {
    const { user, customer } = route.params;
    const [receipt, setReceipt] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCustomerType, setSelectedCustomerType] = useState("chit");

    const [customerInfo, setCustomerInfo] = useState({
        full_name: "",
        phone_number: "",
        email: "",
        password: "",
        address: "",
        pincode: "",
        aadhaar_no: "",
        pan_no: "",
    });
    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                // Mocking axios for web compatibility
                const response = { data: { /* Mock agent data here if needed */ } }; // await axios.get(`${chitBaseUrl}/agent/get-agent-by-id/${user.userId}`);
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
        if (
            !customerInfo.full_name ||
            !customerInfo.phone_number ||
            !customerInfo.address ||
            !customerInfo.pincode
        ) {
            Alert.alert("Required Fields Missing", "Please fill out all mandatory fields (Full Name, Phone Number, Address, Pincode).");
            return;
        }

        if (customerInfo.phone_number.length !== 10) {
            Alert.alert("Invalid Phone Number", "Please enter a 10-digit phone number.");
            return;
        }

        setIsLoading(true);
        try {
            const customerData = {
                ...customerInfo,
                agent: user.userId, // Ensure user.userId is correctly passed from previous screen
                customer_type: selectedCustomerType,
            };

            // Log the data being sent for debugging
            console.log("Customer data being sent:", customerData);

            const baseUrl =
                selectedCustomerType === "chit" ? chitBaseUrl : goldBaseUrl;

            // Mocking axios for web compatibility
            const response = { status: 201, data: { customer: { _id: "mockCustomerId123" } } }; // await axios.post(`${baseUrl}/user/add-user`, customerData);

            if (response.status === 201) {
                ToastAndroid.show("Customer Added Successfully!", ToastAndroid.SHORT);
                navigation.navigate("EnrollCustomer", {
                    user: { ...user },
                    customer: response.data.customer._id,
                });
            } else {
                console.log("Unexpected response status:", response.status, response.data);
                Alert.alert("Error", `Failed to add customer. Server responded with status ${response.status}.`);
            }
        } catch (error) {
            console.error("Error adding customer:", error);
            let errorMessage = "Something went wrong while adding customer. Please try again.";

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("Server Response Data:", error.response.data);
                console.error("Server Response Status:", error.response.status);
                console.error("Server Response Headers:", error.response.headers);

                if (error.response.data && error.response.data.message) {
                    errorMessage = `Error: ${error.response.data.message}`;
                } else if (typeof error.response.data === 'string') {
                    errorMessage = `Server Error: ${error.response.data}`;
                } else {
                    errorMessage = `Server Error (Status ${error.response.status}): An unexpected error occurred on the server.`;
                }
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = "No response from server. Please check your network connection.";
            } else {
                // Something happened in setting up the request that triggered an Error
                errorMessage = `Request Error: ${error.message}`;
            }
            Alert.alert("Error Adding Customer", errorMessage);
        } finally {
            setIsLoading(false);
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
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        <View style={{ marginHorizontal: 22, marginTop: 12 }}>
                            {/* Assuming Header component is defined elsewhere */}
                            {/* <Header /> */}
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>
                                    Add Customer
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("MyLeads", { user: user })}
                                    style={styles.myLeadsButton}
                                >
                                    <Text style={styles.myLeadsButtonText}>My Leads</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.formBox}>
                                <Text style={styles.label}>
                                    Customer Type
                                </Text>
                                <View style={styles.tabContainer}>
                                    <TouchableOpacity
                                        style={[styles.tab, selectedCustomerType === "chit" && styles.activeTab]}
                                        onPress={() => setSelectedCustomerType("chit")}
                                    >
                                        <Text style={[styles.tabText, selectedCustomerType === "chit" && styles.activeTabText]}>
                                            Chit
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.tab, selectedCustomerType === "gold_chit" && styles.activeTab]}
                                        onPress={() => setSelectedCustomerType("gold_chit")}
                                    >
                                        <Text style={[styles.tabText, selectedCustomerType === "gold_chit" && styles.activeTabText]}>
                                            Gold Chit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.label}>
                                    Full Name
                                </Text>
                                <TextInput
                                    placeholder="Enter Full Name"
                                    style={styles.textInput}
                                    value={customerInfo.full_name}
                                    onChangeText={(value) => handleInputChange("full_name", value)}
                                />
                                <Text style={styles.label}>
                                    Phone Number
                                </Text>
                                <TextInput
                                    placeholder="Enter Phone Number"
                                    style={styles.textInput}
                                    value={customerInfo.phone_number}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    onChangeText={(value) => handleInputChange("phone_number", value)}
                                />
                                <Text style={styles.label}>
                                    Email
                                </Text>
                                <TextInput
                                    placeholder="Enter Email"
                                    style={styles.textInput}
                                    value={customerInfo.email}
                                    keyboardType="email-address"
                                    onChangeText={(value) => handleInputChange("email", value)}
                                />
                                <Text style={styles.label}>
                                    Password
                                </Text>
                                <TextInput
                                    placeholder="Enter Password"
                                    style={styles.textInput}
                                    value={customerInfo.password}
                                    onChangeText={(value) => handleInputChange("password", value)}
                                />
                                <Text style={styles.label}>
                                    Address
                                </Text>
                                <TextInput
                                    placeholder="Enter Address"
                                    style={styles.textInput}
                                    value={customerInfo.address}
                                    onChangeText={(value) => handleInputChange("address", value)}
                                />
                                <Text style={styles.label}>
                                    Pincode
                                </Text>
                                <TextInput
                                    placeholder="Enter Pincode"
                                    style={styles.textInput}
                                    value={customerInfo.pincode}
                                    keyboardType="number-pad"
                                    onChangeText={(value) => handleInputChange("pincode", value)}
                                />
                                <Text style={styles.label}>
                                    Aadhaar Number
                                </Text>
                                <TextInput
                                    placeholder="Enter Aadhaar Number"
                                    style={styles.textInput}
                                    value={customerInfo.aadhaar_no}
                                    keyboardType="number-pad"
                                    onChangeText={(value) => handleInputChange("aadhaar_no", value)}
                                />
                                <Text style={styles.label}>
                                    PAN Number
                                </Text>
                                <TextInput
                                    placeholder="Enter PAN Number"
                                    style={styles.textInput}
                                    value={customerInfo.pan_no}
                                    onChangeText={(value) => handleInputChange("pan_no", value)}
                                />
                                <Button
                                    title={isLoading ? "Please wait..." : "Add Customer"}
                                    filled
                                    disabled={isLoading}
                                    style={{
                                        marginTop: 18,
                                        marginBottom: 4,
                                        backgroundColor: isLoading ? "gray" : COLORS.third, // Assuming COLORS.third exists
                                    }}
                                    onPress={handleAddCustomer}
                                />
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
    myLeadsButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    myLeadsButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    formBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    textInput: {
        height: 50,
        width: "100%",
        backgroundColor: COLORS.white,
        borderColor: "#d0d0d0",
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 15,
        marginVertical: 10,
        color: "#000",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    contentContainer: {
        // marginTop: -4, This style is no longer needed
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 15,
        marginBottom: 10,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        marginTop: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#FFC000',
    },
    tabText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
    },
    activeTabText: {
        color: '#333',
        fontWeight: 'bold',
    },
    pickerContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#d0d0d0",
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    picker: {
        height: 50,
        width: "100%",
    },
});

export default AddCustomer;
