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
    TouchableOpacity, // Added for consistency
} from "react-native";
import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context"; // Added SafeAreaView

// Assuming these are defined elsewhere and available
import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";
import COLORS from "../constants/color"; // Kept for consistency if needed elsewhere

// --- DESIGN CONSTANTS COPIED FROM LoanPayin.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"];
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for icons/left border/primary color)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb"; // Very light background for content area
const PRIMARY_BUTTON_COLOR = "#f8c009ff"; // Assuming the yellow color for main action
// ---------------------------------------------


const PigmePayin = ({ route, navigation }) => {
    const { user, customer, pigme_id, custom_pigme_id } = route.params;

    const [currentDate, setCurrentDate] = useState("");
    const [receipt, setReceipt] = useState({});
    const [paymentDetails, setPaymentDetails] = useState("cash"); // Set default to 'cash'
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
                        setSinglePigmeMode(true);
                    } else {
                         setSinglePigmeMode(false);
                    }
                } else {
                    console.error("Unexpected API response format for pigme:", response.data);
                    setSinglePigmeMode(false);
                }
            } catch (error) {
                console.error("Error fetching customer pigme data:", error);
                setPigmeAmt("0")
                setSinglePigmeMode(false);

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
                    cus_id: customer,
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
                    pigme_amount: pigmeAmt,
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

    const renderPigmeSelection = () => {
        // Case 1: Only one Pigme plan - Display read-only
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

        // Case 2: More than one Pigme plan or loading - Use Picker
        return (
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
                    itemStyle={styles.pickerItem}
                >
                    <Picker.Item label="Select Pigme ID & Amount" value={null} color={TEXT_GREY} />
                    {pigmeData.map((data) => (
                        <Picker.Item
                            key={data._id}
                            label={`ID: ${data.pigme_id} | Amt: ${data.payable_amount || 0}`}
                            value={data}
                            color={MODERN_PRIMARY}
                        />
                    ))}
                </Picker>
            </View>
        );
    };

    const renderContent = () => {
        // If no data was found and we've finished loading, show an error state
        if (!customerInfo || pigmeData.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>No open Pigmy plans found for this customer.</Text>
                    <Button
                        title="Go Back"
                        filled
                        onPress={() => navigation.goBack()}
                        style={styles.goBackButton}
                    />
                </View>
            );
        }
        
        // Main Form Content
        return (
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
                    placeholderTextColor={TEXT_GREY}
                />

                {/* Pigme ID & Payable Amount Selection */}
                <Text style={styles.label}>
                    Pigmy ID <Text style={styles.star}>*</Text>
                </Text>
                {renderPigmeSelection()}


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
                            placeholderTextColor={TEXT_GREY}
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
                            value={receipt.receipt_no !== undefined && receipt.receipt_no !== null ? String(receipt.receipt_no) : "N/A"}
                            editable={false}
                            placeholderTextColor={TEXT_GREY}
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
                                itemStyle={styles.pickerItem}
                            >
                                <Picker.Item label="Cash" value="cash" color={MODERN_PRIMARY} />
                                <Picker.Item label="Online" value="online" color={MODERN_PRIMARY} />
                                <Picker.Item label="Cheque" value="cheque" color={MODERN_PRIMARY} />
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
                            placeholderTextColor={TEXT_GREY}
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
                            placeholderTextColor={TEXT_GREY}
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


    // Initial Data Fetching Loading Screen
    if (isFetchingData) {
        return (
            <LinearGradient
                colors={TOP_GRADIENT}
                style={styles.safeArea}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={CARD_BG} />
                </View>
            </LinearGradient>
        );
    }


    // Main Component View
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* =======================================================
               FIXED TOP SECTION (Gradient, Header, Title)
               =======================================================
            */}
            <LinearGradient
                colors={TOP_GRADIENT}
                style={styles.fixedHeaderArea}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerSpacer}>
                    <Header />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Add Pigmy Payment</Text>
                    <Text style={styles.subtitle}>
                        {customerInfo || 'Customer Details'}
                    </Text>
                </View>
            </LinearGradient>


            {/* =======================================================
               SCROLLABLE CONTENT AREA (Form)
               =======================================================
            */}
            <KeyboardAvoidingView
                style={styles.scrollableContentWrapper}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.mainContentArea}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {renderContent()}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// --- STYLES COPIED/MODIFIED FROM LoanPayin.js ---
const styles = StyleSheet.create({
    // --- LAYOUT STYLES ---
    safeArea: {
        flex: 1,
        backgroundColor: TOP_GRADIENT[0],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: TOP_GRADIENT[0], // Use top gradient background
        minHeight: 200,
    },
    errorText: {
        marginTop: 10,
        fontSize: 18,
        color: CARD_BG, // White text on blue background
        fontWeight: 'bold',
        textAlign: 'center',
    },
    goBackButton: {
        marginTop: 20,
        backgroundColor: PRIMARY_BUTTON_COLOR,
    },

    fixedHeaderArea: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    scrollableContentWrapper: {
        flex: 1,
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        marginTop: -20,
        paddingTop: 30,
    },
    headerSpacer: {
        paddingTop: 20,
        paddingBottom: 5,
    },

    // --- TITLE STYLES ---
    titleContainer: {
        alignItems: "center",
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: CARD_BG, // White text
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.85)",
        fontWeight: "500",
        textAlign: "center",
    },

    // --- FORM CONTAINER ---
    scrollContentContainer: {
        paddingBottom: 50,
        paddingTop: 10,
        flexGrow: 1,
    },
    formBox: {
        backgroundColor: CARD_BG,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },

    // --- INPUT/PICKER STYLES ---
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    column: {
        flex: 1,
        marginHorizontal: 3,
    },
    label: {
        fontWeight: "600",
        marginTop: 10,
        fontSize: 14,
        color: MODERN_PRIMARY,
    },
    star: {
        color: ACCENT_BLUE, // Use blue accent for *
    },
    textInput: {
        height: 50,
        width: "100%",
        borderColor: BORDER_COLOR,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginVertical: 8,
        color: MODERN_PRIMARY,
        backgroundColor: SUBTLE_BG_GREY,
        fontSize: 16,
    },
    pickerContainer: {
        borderColor: BORDER_COLOR,
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: SUBTLE_BG_GREY,
        marginVertical: 8,
        minHeight: 50,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    picker: {
        width: "100%",
        minHeight: 50,
        ...Platform.select({
            ios: {
                height: 50,
            },
            android: {
                height: 50,
                color: MODERN_PRIMARY,
            },
        }),
    },
    pickerItem: {
        color: MODERN_PRIMARY,
        fontSize: 16,
    },

    // --- BUTTON STYLES ---
    button: {
        flex: 1,
        margin: 0,
        marginTop: 20,
        marginBottom: 0,
        backgroundColor: PRIMARY_BUTTON_COLOR,
        height: 55,
        borderRadius: 12,
    },
});

export default PigmePayin;