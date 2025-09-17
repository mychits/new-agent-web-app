import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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
    const { user, customer, pigme_id, custom_pigme_id } = route.params;

    const [currentDate, setCurrentDate] = useState("");
    const [receipt, setReceipt] = useState({});
    const [paymentDetails, setPaymentDetails] = useState("");
    const [amount, setAmount] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [customerInfo, setCustomerInfo] = useState({});
    const [pigmeData, setPigmeData] = useState([]);
    const [selectedPigme, setSelectedPigme] = useState(null);
    const [agent, setAgent] = useState([]);



    useEffect(() => {
        const fetchCustomerPigme = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/pigme/get-pigme/${pigme_id}`
                );
                if (response.data && response.data.customer) {
                    setCustomerInfo(response.data.customer.full_name);
                    setPigmeData([response.data]);
                } else {
                    console.error("Unexpected API response format:", response.data);
                }
            } catch (error) {
                console.error("Error fetching customer data:", error);
            }
        };

        fetchCustomerPigme();
    }, [customer]);

    useEffect(() => {
        const today = moment().format("DD-MM-YYYY");
        setCurrentDate(today);
    }, []);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/payment/get-latest-receipt`
                );

                setReceipt(response.data);
            } catch (error) {
                console.error("Error fetching customer data:", error);
            }
        };
        fetchReceipt();
    }, []);

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/agent/get-agent-by-id/${user.userId}`
                );
                if (response.data) {
                    setAgent(response.data);
                } else {
                    console.error("Unexpected API response format:", response.data);
                }
            } catch (error) {
                console.error("Error fetching agent data:", error);
            }
        };

        fetchAgent();
    }, [user.userId]);

    const handlePaymentTypeChange = (type) => {
        setPaymentDetails(type);
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

            const PigmeId = selectedPigme?._id;
            const data = {
                user_id: selectedPigme?.customer?._id,
                pay_date: new Date().toISOString().split("T")[0],
                pay_type: paymentDetails,
                amount: amount,
                transaction_id: transactionId,
                collected_by: user?.userId,
                pay_for: "Pigme",
                // Explicitly add pigme_id to the data object for the database
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
                const { pay_date, amount, pay_type, transaction_id, receipt_no } =
                    response.data?.response;
                const agentResponse = await axios.get(
                    `${baseUrl}/agent/get-agent-by-id/${user.userId}`
                );

                const { name } = agentResponse.data;

                const totalAmountResponse = await axios.post(
                    `${baseUrl}/payment/get-total-amount`,
                    { user_id: customer, pigme: pigme_id }
                );


                navigation.navigate("PigmePrint", {
                    customer_name: full_name,
                    phone_number: phone_number,
                    agent_name: name,
                    amount: amount,
                    pay_type: pay_type,
                    pay_date: pay_date,
                    transaction_id: transaction_id,
                    receipt_no: receipt_no,
                    total_amount: totalAmountResponse?.data?.totalAmount || 0,
                    custom_pigme_id: custom_pigme_id,
                    isPigmePayment: true,
                    pigme_id: pigme_id,
                });
            } else {
                console.log("Error:", response.data);
            }
        } catch (error) {
            console.error("Error adding payment:", error);
            Alert.alert("Error adding payment. Please try again.");
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
                            <Header />
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>Add Pigme Payment</Text>
                            </View>
                            <View style={styles.container}>
                                <View style={styles.formBox}>
                                    <Text style={styles.label}>
                                        Name<Text style={styles.star}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Enter The Name"
                                        keyboardType="default"
                                        value={customerInfo || ""}
                                        editable={false}
                                    />
                                    <Text style={styles.label}>
                                        Pigme ID & Payable Amount<Text style={styles.star}>*</Text>
                                    </Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedPigme}
                                            onValueChange={(itemValue) => setSelectedPigme(itemValue)}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Select Pigme ID & Amount" value={null} />
                                            {pigmeData.map((data, index) => (
                                                <Picker.Item
                                                    key={index}
                                                    label={`ID: ${data.pigme_id} | Amount: ${data.payable_amount}`}
                                                    value={data}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                    <View style={styles.row}>
                                        <View style={styles.column}>
                                            <Text style={styles.label}>
                                                Date<Text style={styles.star}>*</Text>
                                            </Text>
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder="Select Date"
                                                keyboardType="default"
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
                                                value={receipt.receipt_no ? receipt.receipt_no : ""}
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
                                                    onValueChange={(itemValues) =>
                                                        handlePaymentTypeChange(itemValues)
                                                    }
                                                    style={styles.picker}
                                                >
                                                    <Picker.Item label="Select" value="" />
                                                    <Picker.Item label="Cash" value="cash" />
                                                    <Picker.Item label="Online" value="online" />
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
                                                onChangeText={(value) => setAmount(value)}
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
                                                onChangeText={(value) => setTransactionId(value)}
                                            />
                                        </>
                                    )}
                                    <Button
                                        title={isLoading ? "Please wait..." : "Add Payment"}
                                        filled
                                        disabled={isLoading}
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