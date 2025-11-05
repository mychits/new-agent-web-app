import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";

// Assuming these are defined elsewhere and available
import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";

const PigmePayin = ({ route, navigation }) => {
    const { user, customer, pigme_id, custom_pigme_id } = route.params;

    const [currentDate, setCurrentDate] = useState("");
    const [receipt, setReceipt] = useState({});
    const [paymentDetails, setPaymentDetails] = useState("");
    const [amount, setAmount] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [pigmeAmt,setPigmeAmt] = useState("")

    const [customerInfo, setCustomerInfo] = useState("");
    const [pigmeData, setPigmeData] = useState([]);
    const [selectedPigme, setSelectedPigme] = useState(null);
    const [agent, setAgent] = useState(null);

    // --- Data Fetching Effects ---

    // 1. Fetch Customer Pigme Data (Handles single pigme fetch)
    useEffect(() => {
        const fetchCustomerPigme = async () => {
            setIsFetchingData(true);
            try {
                // Fetch the single Pigme using pigme_id
                const response = await axios.get(
                    `${baseUrl}/pigme/get-pigme/${pigme_id}`
                );
                
                if (response.data) {
                    const fetchedPigme = response.data;
                    const customerName = fetchedPigme.customer?.full_name || "N/A";
                    setPigmeAmt(fetchedPigme?.payable_amount || "0")

                    setCustomerInfo(customerName);
                    // Wrap the single fetched item in an array for consistency
                    const dataArray = [fetchedPigme]; 
                    setPigmeData(dataArray);

                    // Auto-select and auto-set amount
                    if (dataArray.length === 1) {
                        setSelectedPigme(dataArray[0]);
                        setAmount(String(dataArray[0].payable_amount || ""));
                    }
                } else {
                    console.error("Unexpected API response format for pigme:", response.data);
                }
            } catch (error) {
                console.error("Error fetching customer pigme data:", error);
                    setPigmeAmt( "0")

            } finally {
                setIsFetchingData(false);
            }
        };

        fetchCustomerPigme();
    }, [pigme_id]);

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
        setTransactionId("");
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
                (paymentDetails !== "cash" && !transactionId)
            ) {
                Alert.alert("Validation Error", "Please fill all mandatory fields.");
                setIsLoading(false);
                return;
            }

            if (isNaN(Number(amount)) || Number(amount) <= 0) {
                 Alert.alert("Validation Error", "Please enter a valid amount.");
                setIsLoading(false);
                return;
            }

            const PigmeId = selectedPigme?._id;
            const data = {
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

                const userResponse = await axios.get(
                    `${baseUrl}/user/get-user-by-id/${customer}`
                );
                const { full_name, phone_number } = userResponse.data;
                
                const { pay_date, amount: paidAmount, pay_type, transaction_id: tId, receipt_no } =
                    response.data?.response;
                
                const agentName = agent?.name || "N/A"; 

                const totalAmountResponse = await axios.post(
                    `${baseUrl}/payment/get-total-amount`,
                    { user_id: customer, pigme: pigme_id }
                );

                navigation.navigate("PigmePrint", {
                    customer_name: full_name,
                    cus_id:customer,
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
                    actual_pigme_id: pigme_id,
                    pigme_amount:pigmeAmt,
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
    
    // --- Render Logic ---
    
    const showPigmePicker = pigmeData.length > 1;
    const pigmeDisplayValue = selectedPigme 
        ? `ID: ${selectedPigme.pigme_id} | Amount: ${selectedPigme.payable_amount}`
        : "Loading...";


    // Initial Data Fetching Loading Screen
    if (isFetchingData) {
        return (
            // Replaced SafeAreaView with LinearGradient
            <LinearGradient 
                colors={["#1aa2ccff", "#1aa2ccff"]}
                style={styles.gradientOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </LinearGradient>
        );
    }


    // Main Component View
    return (
        <LinearGradient 
            colors={["#1aa2ccff", "#1aa2ccff"]}
            style={styles.gradientOverlay} // Takes up full screen
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                // Reduced vertical offset as SafeAreaView is removed
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} 
            >
                {/* 1. FIXED HEADER AND TITLE AREA - Fixed at the top */}
                <View style={styles.fixedHeader}>
                    <Header />
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Add Pigmy Payment</Text>
                    </View>
                </View>

                {/* 2. SCROLLABLE FORM CONTENT AREA - Takes up the remaining space */}
                <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                    <View style={styles.scrollInnerContainer}>
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
                                Pigmy ID & Payable Amount<Text style={styles.star}>*</Text>
                            </Text>
                            
                            {showPigmePicker ? (
                                // Case 2: More than one Pigme plan - Use Picker
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedPigme}
                                        onValueChange={(itemValue) => {
                                            setSelectedPigme(itemValue);
                                            // Update amount when a new Pigme is selected
                                            if (itemValue) {
                                                setAmount(String(itemValue.payable_amount || ""));
                                            }
                                        }}
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
                                <TextInput
                                    style={styles.textInput}
                                    value={pigmeDisplayValue}
                                    editable={false}
                                />
                            )}

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
                            
                            <Button
                                title={isLoading ? "Please wait..." : "Add Payment"}
                                filled
                                disabled={isLoading || !selectedPigme || isFetchingData}
                                style={styles.button}
                                onPress={handleAddPayment}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientOverlay: {
        flex: 1,
    },
   
    fixedHeader: {
        
        paddingTop: Platform.OS === 'android' ? 40 : 40,
        paddingHorizontal: 22,
      
        backgroundColor: 'transparent', 
        zIndex: 10, 
    },
    titleContainer: {
        marginTop: 10, 
        marginBottom: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
   
    scrollInnerContainer: {
        paddingHorizontal: 22,
    },
   
    scrollContentContainer: {
        flexGrow: 1,
        paddingBottom: 50, 
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
        backgroundColor: '#f8c009ff',
    }
});

export default PigmePayin;
