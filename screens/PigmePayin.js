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
    TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"];
const MODERN_PRIMARY = "#0d0d0eff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb"; 
const PRIMARY_BUTTON_COLOR = "#f8c009ff"; 

const PigmePayin = ({ route, navigation }) => {
    const { user, customer, pigme_id, custom_pigme_id } = route.params;

    const [currentDate, setCurrentDate] = useState("");
    const [receipt, setReceipt] = useState({});
    const [paymentDetails, setPaymentDetails] = useState("cash"); 
    const [amount, setAmount] = useState(""); 
    const [transactionId, setTransactionId] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [pigmeAmt, setPigmeAmt] = useState("");

    const [customerInfo, setCustomerInfo] = useState("");
    const [pigmeData, setPigmeData] = useState([]);
    const [selectedPigme, setSelectedPigme] = useState(null);
    const [agent, setAgent] = useState(null);
    const [singlePigmeMode, setSinglePigmeMode] = useState(false);

    useEffect(() => {
        const fetchCustomerPigme = async () => {
            setIsFetchingData(true);
            try {
                const response = await axios.get(`${baseUrl}/pigme/get-pigme/${pigme_id}`);

                if (response.data) {
                    const fetchedPigme = response.data;
                    const customerName = fetchedPigme.customer?.full_name || "N/A";
                    setPigmeAmt(fetchedPigme?.payable_amount || "0");
                    setCustomerInfo(customerName);
                    const dataArray = [fetchedPigme];
                    setPigmeData(dataArray);

                    if (dataArray.length === 1) {
                        setSelectedPigme(dataArray[0]);
                        setSinglePigmeMode(true);
                    } else {
                         setSinglePigmeMode(false);
                    }
                }
            } catch (error) {
                console.error("Error fetching customer pigme data:", error);
                setPigmeAmt("0");
                setSinglePigmeMode(false);
            } finally {
                setIsFetchingData(false);
            }
        };
        fetchCustomerPigme();
    }, [pigme_id]);

    useEffect(() => {
        const today = moment().format("DD-MM-YYYY");
        setCurrentDate(today);
    }, []);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const response = await axios.get(`${baseUrl}/payment/get-latest-receipt`);
                setReceipt(response.data);
            } catch (error) {
                console.error("Error fetching latest receipt:", error);
            }
        };
        fetchReceipt();
    }, []);

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await axios.get(`${baseUrl}/agent/get-agent-by-id/${user.userId}`);
                if (response.data) setAgent(response.data);
            } catch (error) {
                console.error("Error fetching agent data:", error);
            }
        };
        if (user?.userId) fetchAgent();
    }, [user.userId]);

    const handlePaymentTypeChange = (type) => {
        setPaymentDetails(type);
        setTransactionId("");
        if (type === "online") setAdditionalInfo("Transaction ID");
        else if (type === "cheque") setAdditionalInfo("Cheque Number");
        else setAdditionalInfo("");
    };

    /**
     * Logic to prevent negative values, decimal points, and leading zeros
     */
    const handleAmountChange = (text) => {
        // 1. Remove any non-numeric characters
        let filteredText = text.replace(/[^0-9]/g, '');
        
        // 2. Prevent starting with 0 (removes 0 if it's the first character)
        if (filteredText.startsWith('0')) {
            filteredText = filteredText.replace(/^0+/, '');
        }
        
        setAmount(filteredText);
    };

    const handleAddPayment = async () => {
        if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
            Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0.");
            return;
        }

        setIsLoading(true);
        try {
            if (!selectedPigme || !paymentDetails || !amount || (paymentDetails !== "cash" && !transactionId)) {
                Alert.alert("Validation Error", "Please fill all mandatory fields.");
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

            const response = await axios.post(`${baseUrl}/payment/pigme/${PigmeId}`, data);

            if (response.status === 201) {
                Alert.alert("Success", "Payment added successfully!");
                const userResponse = await axios.get(`${baseUrl}/user/get-user-by-id/${customer}`);
                const { full_name, phone_number } = userResponse.data;
                const { pay_date, amount: paidAmount, pay_type, transaction_id: tId, receipt_no } = response.data?.response;

                const totalAmountResponse = await axios.post(`${baseUrl}/payment/get-total-amount`, { user_id: customer, pigme: pigme_id });

                navigation.navigate("PigmePrint", {
                    customer_name: full_name,
                    cus_id: customer,
                    phone_number: phone_number,
                    agent_name: agent?.name || "N/A",
                    amount: paidAmount,
                    pay_type: pay_type,
                    pay_date: pay_date,
                    transaction_id: tId,
                    receipt_no: receipt_no,
                    total_amount: totalAmountResponse?.data?.totalAmount || 0,
                    custom_pigme_id: custom_pigme_id,
                    isPigmePayment: true,
                    actual_pigme_id: pigme_id,
                    pigme_amount: pigmeAmt,
                });
            }
        } catch (error) {
            Alert.alert("Error", error.response?.data?.message || "Error adding payment.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderPigmeSelection = () => {
        if (singlePigmeMode && selectedPigme) {
            return (
                <TextInput
                    style={styles.textInput}
                    value={`ID: ${selectedPigme.pigme_id}`}
                    editable={false}
                    placeholderTextColor={TEXT_GREY}
                />
            );
        }

        return (
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedPigme}
                    onValueChange={(itemValue) => {
                        setSelectedPigme(itemValue);
                    }}
                    style={styles.picker}
                >
                    <Picker.Item label="Select Pigme ID" value={null} color={TEXT_GREY} />
                    {pigmeData.map((data) => (
                        <Picker.Item
                            key={data._id}
                            label={`ID: ${data.pigme_id}`}
                            value={data}
                        />
                    ))}
                </Picker>
            </View>
        );
    };

    const renderContent = () => {
        if (!customerInfo || pigmeData.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>No open Pigmy plans found.</Text>
                    <Button title="Go Back" filled onPress={() => navigation.goBack()} style={styles.goBackButton} />
                </View>
            );
        }
        
        return (
            <View style={styles.formBox}>
                <Text style={styles.label}>Name<Text style={styles.star}>*</Text></Text>
                <TextInput style={styles.textInput} value={customerInfo || "N/A"} editable={false} />

                <Text style={styles.label}>Pigmy ID <Text style={styles.star}>*</Text></Text>
                {renderPigmeSelection()}

                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.label}>Date<Text style={styles.star}>*</Text></Text>
                        <TextInput style={styles.textInput} value={currentDate} editable={false} />
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.label}>Receipt<Text style={styles.star}>*</Text></Text>
                        <TextInput style={styles.textInput} value={receipt.receipt_no !== undefined ? String(receipt.receipt_no) : "N/A"} editable={false} />
                    </View>
                </View>

                <Text style={styles.label}>Payment Type<Text style={styles.star}>*</Text></Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={paymentDetails}
                        onValueChange={handlePaymentTypeChange}
                        style={styles.picker}
                    >
                        <Picker.Item label="Cash" value="cash" />
                        <Picker.Item label="Online" value="online" />
                        <Picker.Item label="Cheque" value="cheque" />
                    </Picker>
                </View>

                <Text style={styles.label}>Amount<Text style={styles.star}>*</Text></Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter The Amount"
                    keyboardType="number-pad"
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholderTextColor={TEXT_GREY}
                />

                {additionalInfo !== "" && (
                    <>
                        <Text style={styles.label}>{additionalInfo}<Text style={styles.star}>*</Text></Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder={`Enter ${additionalInfo}`}
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
        );
    };

    if (isFetchingData) {
        return (
            <LinearGradient colors={TOP_GRADIENT} style={styles.safeArea}>
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={CARD_BG} /></View>
            </LinearGradient>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient colors={TOP_GRADIENT} style={styles.fixedHeaderArea}>
                <View style={styles.headerSpacer}><Header /></View>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Add Pigmy Payment</Text>
                    <Text style={styles.subtitle}>{customerInfo || 'Customer Details'}</Text>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView style={styles.scrollableContentWrapper} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <View style={styles.mainContentArea}>
                    <ScrollView contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
                        {renderContent()}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
    errorText: { marginTop: 10, fontSize: 18, color: CARD_BG, fontWeight: 'bold', textAlign: 'center' },
    goBackButton: { marginTop: 20, backgroundColor: PRIMARY_BUTTON_COLOR },
    fixedHeaderArea: { paddingHorizontal: 16, paddingBottom: 20, elevation: 3 },
    scrollableContentWrapper: { flex: 1 },
    mainContentArea: { flex: 1, backgroundColor: SUBTLE_BG_GREY, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 16, marginTop: -20, paddingTop: 30 },
    headerSpacer: { paddingTop: 20, paddingBottom: 5 },
    titleContainer: { alignItems: "center", marginBottom: 15 },
    title: { fontSize: 28, fontWeight: "900", color: CARD_BG, marginBottom: 4 },
    subtitle: { fontSize: 14, color: "rgba(255, 255, 255, 0.85)", fontWeight: "500", textAlign: "center" },
    scrollContentContainer: { paddingBottom: 50, paddingTop: 10, flexGrow: 1 },
    formBox: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR, elevation: 5 },
    row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    column: { flex: 1, marginHorizontal: 3 },
    label: { fontWeight: "600", marginTop: 10, fontSize: 14, color: MODERN_PRIMARY },
    star: { color: '#ff0000' },
    textInput: { height: 50, width: "100%", borderColor: BORDER_COLOR, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, marginVertical: 8, color: MODERN_PRIMARY, backgroundColor: SUBTLE_BG_GREY, fontSize: 16 },
    pickerContainer: { borderColor: BORDER_COLOR, borderWidth: 1, borderRadius: 12, backgroundColor: SUBTLE_BG_GREY, marginVertical: 8, minHeight: 50, justifyContent: 'center', overflow: 'hidden' },
    picker: { width: "100%", height: 50 },
    button: { flex: 1, marginTop: 20, backgroundColor: PRIMARY_BUTTON_COLOR, height: 55, borderRadius: 12 },
});

export default PigmePayin;