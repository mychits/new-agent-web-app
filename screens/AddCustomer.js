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
    ActivityIndicator
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import chitBaseUrl from "../constants/baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";

const AddCustomer = ({ route, navigation }) => {
    const { user } = route.params;
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [customerInfo, setCustomerInfo] = useState({
        full_name: "",
        phone_number: "",
        email: "",
        password: "",
        address: "",
        pincode: "",
        adhaar_no: "", // CORRECTED: Changed 'aadhaar_no' to 'adhaar_no'
        pan_no: "",
    });

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
            Alert.alert("Required Fields Missing", "Please fill out all mandatory fields.");
            return;
        }

        if (customerInfo.phone_number.length !== 10) {
            Alert.alert("Invalid Phone Number", "Please enter a 10-digit phone number.");
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                ...customerInfo,
                agent: user.userId,
            };

            const response = await axios.post(`${chitBaseUrl}/user/add-user`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 201) {
                ToastAndroid.show("Customer Added Successfully!", ToastAndroid.SHORT);
                
                // FIX: Pass the phone number to the next screen instead of a non-existent _id
                navigation.navigate("EnrollCustomer", {
                    user: { ...user },
                    customerPhoneNumber: customerInfo.phone_number,
                });
            } else {
                console.log("Unexpected response status:", response.status, response.data);
                Alert.alert("Error", `Failed to add customer. Server responded with status ${response.status}.`);
            }
        } catch (error) {
            console.error("Error adding customer:", error);
            let errorMessage = "Something went wrong while adding customer. Please try again.";
            if (error.response) {
                console.error("Server Response Data:", error.response.data);
                if (error.response.data && error.response.data.message) {
                    errorMessage = `Error: ${error.response.data.message}`;
                } else if (typeof error.response.data === 'string') {
                    errorMessage = `Server Error: ${error.response.data}`;
                } else {
                    errorMessage = `Server Error (Status ${error.response.status}): An unexpected error occurred on the server.`;
                }
            } else if (error.request) {
                errorMessage = "No response from server. Please check your network connection.";
            } else {
                errorMessage = `Request Error: ${error.message}`;
            }
            Alert.alert("Error Adding Customer", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <Text style={styles.label}>
                            Full Name<Text style={{ color: 'red' }}>*</Text>
                        </Text>
                        <TextInput
                            placeholder="Enter Full Name"
                            style={styles.textInput}
                            value={customerInfo.full_name}
                            onChangeText={(value) => handleInputChange("full_name", value)}
                        />
                        <Text style={styles.label}>
                            Phone Number<Text style={{ color: 'red' }}>*</Text>
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
                            Address<Text style={{ color: 'red' }}>*</Text>
                        </Text>
                        <TextInput
                            placeholder="Enter Address"
                            style={styles.textInput}
                            value={customerInfo.address}
                            onChangeText={(value) => handleInputChange("address", value)}
                        />
                        <Text style={styles.label}>
                            Pincode<Text style={{ color: 'red' }}>*</Text>
                        </Text>
                        <TextInput
                            placeholder="Enter Pincode"
                            style={styles.textInput}
                            value={customerInfo.pincode}
                            keyboardType="number-pad"
                            onChangeText={(value) => handleInputChange("pincode", value)}
                        />
                        <View style={styles.singleButtonContainer}>
                            <Button
                                title="Next"
                                filled
                                style={styles.nextButton}
                                onPress={() => setStep(2)}
                            />
                        </View>
                    </>
                );
            case 2:
                return (
                    <>
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
                            Aadhaar Number
                        </Text>
                        <TextInput
                            placeholder="Enter Aadhaar Number"
                            style={styles.textInput}
                            value={customerInfo.adhaar_no}
                            keyboardType="number-pad"
                            onChangeText={(value) => handleInputChange("adhaar_no", value)}
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
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Back"
                                style={styles.secondaryButton}
                                onPress={() => setStep(1)}
                            />
                            <Button
                                title={isLoading ? "Please wait..." : "Add Customer"}
                                filled
                                disabled={isLoading}
                                style={styles.finalAddCustomerButton}
                                onPress={handleAddCustomer}
                            />
                        </View>
                    </>
                );
            default:
                return null;
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
                            <Header />
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
                                {renderStepContent()}
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
    uploadContainer: {
        marginTop: 10,
        marginBottom: 10,
    },
    uploadButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 5,
    },
    uploadButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    fileName: {
        marginTop: 5,
        fontStyle: 'italic',
        color: '#555',
        textAlign: 'center',
    },
    singleButtonContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    nextButton: {
        width: '100%',
        backgroundColor: COLORS.primary,
    },
    secondaryButton: {
        width: '48%',
        backgroundColor: COLORS.secondary,
    },
    finalBackButton: {
        width: '100%',
        backgroundColor: COLORS.secondary,
        marginTop: 20,
        marginBottom: 10,
    },
    finalAddCustomerButton: {
        width: '48%',
        backgroundColor: COLORS.third,
    },
});

export default AddCustomer;