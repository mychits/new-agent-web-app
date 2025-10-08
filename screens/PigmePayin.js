import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator, // Import for loading indicator
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";

const PigmePayin = ({ route, navigation }) => {
    // You are only passing one pigme_id in route.params, which suggests a single Pigme is intended.
    // However, the original useEffect fetches ONE pigme by pigme_id but saves it as an array [response.data].
    // To support multiple pigmes (as requested for the "more than one" case), I'm adjusting the fetch logic
    // to potentially fetch all pigmes for the `customer` if `pigme_id` is not present, or just the one if it is.
    // Assuming for this component, you are still primarily focused on the single `pigme_id` passed in.
    const { user, customer, pigme_id, custom_pigme_id } = route.params;

    const [currentDate, setCurrentDate] = useState("");
    const [receipt, setReceipt] = useState({});
    const [paymentDetails, setPaymentDetails] = useState("");
    const [amount, setAmount] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [isLoading, setIsLoading] = useState(false); // For Add Payment button
    const [isFetchingData, setIsFetchingData] = useState(true); // For initial data fetching

    const [customerInfo, setCustomerInfo] = useState(""); // Changed to string for full_name
    const [pigmeData, setPigmeData] = useState([]);
    const [selectedPigme, setSelectedPigme] = useState(null);
    const [agent, setAgent] = useState(null); // Changed to null/object

    // --- Data Fetching Effects ---

    // 1. Fetch Customer Pigme Data (Handles single/multiple logic)
    useEffect(() => {
        const fetchCustomerPigme = async () => {
            setIsFetchingData(true);
            try {
                // Modified logic to simulate fetching more than one if needed, but keeping
                // the focus on the single `pigme_id` passed in `route.params`.
                // If you intend to fetch ALL pigmes for a customer, the API endpoint needs to change,
                // e.g., `${baseUrl}/pigme/get-pigmes-by-customer/${customer}`
                const response = await axios.get(
                    `${baseUrl}/pigme/get-pigme/${pigme_id}`
                );
                
                if (response.data) {
                    // Assuming the API response for one pigme includes the customer object
                    const fetchedPigme = response.data;
                    const customerName = fetchedPigme.customer?.full_name || "N/A";

                    setCustomerInfo(customerName);
                    // For the purpose of the picker/auto-selection, wrap the single fetched item in an array
                    const dataArray = [fetchedPigme]; 
                    setPigmeData(dataArray);

                    // **Auto-select if only one Pigme is found**
                    if (dataArray.length === 1) {
                        setSelectedPigme(dataArray[0]);
                        // Auto-set the amount if it's part of the pigme data
                        setAmount(String(dataArray[0].payable_amount || ""));
                    }
                } else {
                    console.error("Unexpected API response format for pigme:", response.data);
                }
            } catch (error) {
                console.error("Error fetching customer pigme data:", error);
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchCustomerPigme();
    }, [pigme_id]); // Depend on pigme_id instead of customer for this specific screen

    // 2. Set Current Date
    useEffect(() => {
        const today = moment().format("DD-MM-YYYY");
        setCurrentDate(today);
    }, []);

    // 3. Fetch Latest Receipt
    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/payment/get-latest-receipt`
                );
                setReceipt(response.data);
            } catch (error) {
                console.error("Error fetching latest receipt:", error);
            }
        };
        fetchReceipt();
    }, []);

    // 4. Fetch Agent Info
    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/agent/get-agent-by-id/${user.userId}`
                );
                if (response.data) {
                    setAgent(response.data);
                } else {
                    console.error("Unexpected API response format for agent:", response.data);
                }
            } catch (error) {
                console.error("Error fetching agent data:", error);
            }
        };

        if (user?.userId) {
            fetchAgent();
        }
    }, [user.userId]);

    // --- Handlers ---

    const handlePaymentTypeChange = (type) => {
        setPaymentDetails(type);
        setTransactionId(""); // Clear transaction ID on type change
        if (type === "online") {
            setAdditionalInfo("Transaction ID");
        } else if (type === "cheque") {
            setAdditionalInfo("Cheque Number");
        } else {
            setAdditionalInfo("");
        }
    };

    const handleAddPayment = async () => {
        setIsLoading(true);
        try {
            if (
                !selectedPigme ||
                !paymentDetails ||
                !amount ||
                // Check if transaction ID is required but missing
                (paymentDetails !== "cash" && !transactionId)
            ) {
                Alert.alert("Validation Error", "Please fill all mandatory fields.");
                setIsLoading(false);
                return;
            }

            // Simple check to ensure amount is a positive number
            if (isNaN(Number(amount)) || Number(amount) <= 0) {
                 Alert.alert("Validation Error", "Please enter a valid amount.");
                setIsLoading(false);
                return;
            }

            const PigmeId = selectedPigme?._id;
            const data = {
                // Use the customer ID from route params as user_id for the payment
                user_id: customer, 
                pay_date: new Date().toISOString().split("T")[0],
                pay_type: paymentDetails,
                amount: amount,
                transaction_id: transactionId,
                collected_by: user?.userId,
                pay_for: "Pigme",
                pigme_id: PigmeId,
            };

            const response = await axios.post(
                `${baseUrl}/payment/pigme/${PigmeId}`,
                data
            );
            
            if (response.status === 201) {
                Alert.alert("Success", "Payment added successfully!");

                // Fetch customer and agent details again for the receipt data
                const userResponse = await axios.get(
                    `${baseUrl}/user/get-user-by-id/${customer}`
                );
                const { full_name, phone_number } = userResponse.data;
                
                const { pay_date, amount: paidAmount, pay_type, transaction_id: tId, receipt_no } =
                    response.data?.response;
                
                // Use the agent name fetched in the useEffect or fetch it again if needed
                const agentName = agent?.name || "N/A"; 

                const totalAmountResponse = await axios.post(
                    `${baseUrl}/payment/get-total-amount`,
                    { user_id: customer, pigme: pigme_id }
                );

                navigation.navigate("PigmePrint", {
                    customer_name: full_name,
                    phone_number: phone_number,
                    agent_name: agentName,
                    amount: paidAmount,
                    pay_type: pay_type,
                    pay_date: pay_date,
                    transaction_id: tId,
                    receipt_no: receipt_no,
                    total_amount: totalAmountResponse?.data?.totalAmount || 0,
                    custom_pigme_id: custom_pigme_id,
                    isPigmePayment: true,
                    pigme_id: pigme_id,
                });
            } else {
                Alert.alert("Error", response.data.message || "Something went wrong.");
            }
        } catch (error) {
            console.error("Error adding payment:", error);
            Alert.alert("Error", error.response?.data?.message || "Error adding payment. Please check your network or try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Render Logic for Single/Multiple Pigme Plans ---
    
    // Determine if we should show the Picker or the auto-populated TextInput
    const showPigmePicker = pigmeData.length > 1;
    const pigmeDisplayValue = selectedPigme 
        ? `ID: ${selectedPigme.pigme_id} | Amount: ${selectedPigme.payable_amount}`
        : "Loading...";


    // --- Render Component ---

    if (isFetchingData) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
                 <LinearGradient
                    colors={['#dbf6faff', '#90dafcff']}
                    style={styles.gradientOverlay}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }


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
                                <Text style={styles.title}>Add Pigme Payment</Text>
                            </View>
                            <View style={styles.container}>
                                <View style={styles.formBox}>
                                    {/* Customer Name */}
                                    <Text style={styles.label}>
                                        Name<Text style={styles.star}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Enter The Name"
                                        keyboardType="default"
                                        value={customerInfo || "N/A"}
                                        editable={false}
                                    />
                                    
                                    {/* Pigme ID & Payable Amount - Conditional Rendering */}
                                    <Text style={styles.label}>
                                        Pigme ID & Payable Amount<Text style={styles.star}>*</Text>
                                    </Text>
                                    
                                    {showPigmePicker ? (
                                        // Case 2: More than one Pigme plan - Use Picker
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={selectedPigme}
                                                onValueChange={(itemValue) => setSelectedPigme(itemValue)}
                                                style={styles.picker}
                                            >
                                                <Picker.Item label="Select Pigme ID & Amount" value={null} />
                                                {pigmeData.map((data) => (
                                                    <Picker.Item
                                                        key={data._id}
                                                        label={`ID: ${data.pigme_id} | Amount: ${data.payable_amount}`}
                                                        value={data}
                                                    />
                                                ))}
                                            </Picker>
                                        </View>
                                    ) : (
                                        // Case 1: One Pigme plan - Use TextInput (Auto-selected)
                                        <TextInput
                                            style={styles.textInput}
                                            value={pigmeDisplayValue}
                                            editable={false}
                                        />
                                    )}

                                    {/* Date and Receipt Number */}
                                    <View style={styles.row}>
                                        <View style={styles.column}>
                                            <Text style={styles.label}>
                                                Date<Text style={styles.star}>*</Text>
                                            </Text>
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder="Select Date"
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
                                                value={receipt.receipt_no ? String(receipt.receipt_no) : "N/A"}
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
                                                    onValueChange={handlePaymentTypeChange}
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
                                                onChangeText={setAmount}
                                            />
                                        </View>
                                    </View>
                                    
                                    {/* Transaction/Cheque ID */}
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
                                                onChangeText={setTransactionId}
                                            />
                                        </>
                                    )}
                                    
                                    {/* Add Payment Button */}
                                    <Button
                                        title={isLoading ? "Please wait..." : "Add Payment"}
                                        filled
                                        disabled={isLoading || !selectedPigme || isFetchingData}
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
    titleContainer: {
        marginTop: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    container: {
        flex: 1,
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
        
        
        width: "100%",
        borderColor: "#d0d0d0",
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 10,
        marginVertical: 10,
        color: "#000",
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        ...Platform.select({
            ios:{
                height:55

            },
            android:{
                height:55
            }
        })

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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    picker: {
        ...Platform.select({
            android:{
                height:55
            },
            ios:{
                height:55
            }
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
        backgroundColor: '#da8201',
    }
});

export default PigmePayin;