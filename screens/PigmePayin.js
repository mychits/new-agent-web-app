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
    Dimensions,
    Animated,
} from "react-native";

import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";

import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";

const { width } = Dimensions.get("window");

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D'];
const MODERN_PRIMARY = "#0d0d0d";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb";
const PRIMARY_BUTTON_COLOR = "#f8c009";

const PigmePayin = ({ route, navigation }) => {

    // --- LOGGING: Incoming Route Params ---
    useEffect(() => {
        console.log("------------------------------------------------");
        console.log("[Navigation] Navigated TO: PigmePayin");
        console.log("[Navigation] Params Received:", route.params);
        console.log("------------------------------------------------");
    }, [route.params]);

    // --- LOGGING: Screen Focus and Blur Events ---
    useEffect(() => {
        const unsubscribeFocus = navigation.addListener('focus', () => {
            console.log("[Navigation] Screen Focused: PigmePayin");
        });

        const unsubscribeBlur = navigation.addListener('blur', () => {
            console.log("[Navigation] Screen Blurred (Left): PigmePayin");
        });

        return () => {
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [navigation]);

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

    // State for Overview
    const [pigmeOverview, setPigmeOverview] = useState(null);
    const [isOverviewLoading, setIsOverviewLoading] = useState(false);

    // Animation States
    const [anim1] = useState(new Animated.Value(0));
    const [anim2] = useState(new Animated.Value(0));

    // Fetch Customer and Basic Pigme Data
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

    // Fetch Pigme Overview
    useEffect(() => {
        const fetchPigmeOverview = async () => {
            if (selectedPigme?._id) {
                setIsOverviewLoading(true);
                try {
                    const apiUrl = `${baseUrl}/pigme/overview/${selectedPigme._id}`;
                    const response = await axios.get(apiUrl);

                    if (response.data && response.data.data) {
                        setPigmeOverview(response.data.data);
                    } else {
                        console.warn("[API] Data structure missing or success:false");
                    }

                } catch (error) {
                    console.error("Error fetching pigme overview:", error);
                } finally {
                    setIsOverviewLoading(false);
                }
            }
        };

        if (selectedPigme) {
            fetchPigmeOverview();
        } else {
            setPigmeOverview(null);
        }
    }, [selectedPigme]);

    // Trigger animations when overview data changes
    useEffect(() => {
        if (pigmeOverview) {
            Animated.timing(anim1, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
                delay: 0,
            }).start();

            Animated.timing(anim2, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
                delay: 100,
            }).start();
        }
    }, [pigmeOverview]);

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

    const handleAmountChange = (text) => {
        let filteredText = text.replace(/[^0-9]/g, '');
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

                const navigationParams = {
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
                };

                navigation.navigate("PigmePrint", navigationParams);
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

    // Helper for animated PREMIUM box with Sub Text
    const renderAnimatedBox = (title, value, anim, colorStart, colorEnd, subText = "") => {
        return (
            <Animated.View
                style={[
                    styles.overviewBox,
                    {
                        opacity: anim,
                        transform: [
                            {
                                translateY: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <LinearGradient
                    colors={[colorStart, colorEnd]}
                    style={styles.boxGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Glass Shine Effect */}
                    <View style={styles.glassShine} />

                    <Text style={styles.boxTitle}>{title}</Text>
                    
                    {/* Container to align Value and SubText side-by-side */}
                    <View style={styles.valueRow}>
                        <Text style={styles.boxValue} numberOfLines={1} adjustsFontSizeToFit>
                            {value}
                        </Text>
                        {subText !== "" && (
                            <Text style={styles.boxSubText} numberOfLines={1}>
                                {subText}
                            </Text>
                        )}
                    </View>
                </LinearGradient>
            </Animated.View>
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
            <View style={{ paddingBottom: 20 }}>

                {/* --- SECTION 1: 2 PREMIUM BOXES (OUTSIDE WHITE CONTAINER) --- */}
                {isOverviewLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                    </View>
                ) : pigmeOverview ? (
                    <View style={styles.overviewContainer}>
                        {/* Box 1: Pigme ID */}
                        {renderAnimatedBox(
                            "Pigme ID",
                            pigmeOverview.pigme_id || selectedPigme?.pigme_id || "--",
                            anim1,
                            "#30cfd0",
                            "#330867",
                            
                        )}

                        {/* Box 2: Total Paid Amount */}
                        {renderAnimatedBox(
                            "Total Paid Amount",
                            pigmeOverview.total_paid_amount || pigmeOverview._total_paid_amount || "0",
                            anim2,
                            "#15ec5d",
                            "#0b7663",
                            
                        )}
                    </View>
                ) : null}

                {/* --- SECTION 2: WHITE FORM CARD --- */}
                <View style={styles.formBox}>
                    <Text style={styles.sectionTitle}>Payment Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Borrower Name</Text>
                        <View style={styles.inputContainer}>
                             <Text style={styles.fakeInputText}>{customerInfo}</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Pigmy ID</Text>
                        {renderPigmeSelection()}
                    </View>

                    <View style={styles.rowInputs}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>Date</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.fakeInputText}>{currentDate}</Text>
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>Receipt No.</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.fakeInputText}>{receipt.receipt_no !== undefined ? String(receipt.receipt_no) : "N/A"}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Payment Method</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={paymentDetails}
                                onValueChange={handlePaymentTypeChange}
                                style={styles.picker}
                                dropdownIconColor="#111827"
                            >
                                <Picker.Item label="Cash" value="cash" color="#1F2937" />
                                <Picker.Item label="Online" value="online" color="#1F2937" />
                                <Picker.Item label="Cheque" value="cheque" color="#1F2937" />
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter The Amount"
                            keyboardType="number-pad"
                            value={amount}
                            onChangeText={handleAmountChange}
                            placeholderTextColor={TEXT_GREY}
                        />
                    </View>

                    {additionalInfo !== "" && (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{additionalInfo}</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder={`Enter ${additionalInfo}`}
                                    value={transactionId}
                                    onChangeText={setTransactionId}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </>
                    )}

                    <Button
                        title={isLoading ? "Please wait..." : "Add Payment"}
                        filled
                        disabled={isLoading || !selectedPigme || isFetchingData}
                        style={styles.stylishButton}
                        onPress={handleAddPayment}
                    />
                </View>
            </View>
        );
    };

    if (isFetchingData) {
        return (
            <LinearGradient colors={TOP_GRADIENT} style={styles.gradientOverlay}>
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={CARD_BG} /></View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={TOP_GRADIENT} style={styles.gradientOverlay}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            >
                <View style={styles.headerContainer}>
                    <Header />
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Add Pigmy Payment</Text>
                        <Text style={styles.subtitle}>Enter payment details to record a transaction.</Text>
                    </View>
                </View>
                
                <ScrollView 
                    style={styles.scrollableContent} 
                    contentContainerStyle={{ paddingVertical: 5 }}
                    showsVerticalScrollIndicator={false}
                >
                    {renderContent()}
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientOverlay: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 10, minHeight: 50 },
    errorText: { marginTop: 10, fontSize: 18, color: CARD_BG, fontWeight: 'bold', textAlign: 'center' },
    goBackButton: { marginTop: 20, backgroundColor: PRIMARY_BUTTON_COLOR },

    // Header
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
        paddingBottom: 10,
        backgroundColor: 'transparent',
    },
    titleContainer: { marginTop: 15 },
    title: { 
        fontSize: 24, 
        fontWeight: '800', 
        color: "#fff", 
        letterSpacing: 0.5 ,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: "#E0F7FA", 
        marginTop: 4,
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    scrollableContent: { flex: 1, paddingHorizontal: 20 },

    // --- PREMIUM BOX STYLES (OUTSIDE) ---
    overviewContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 25, 
        marginHorizontal: 2,
    },
    overviewBox: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 20,
        height: 110,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden',
    },
    boxGradient: {
        flex: 1,
        padding: 15,
        justifyContent: "space-between",
    },
    glassShine: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 40,
    },
    boxTitle: {
        fontSize: 10,
        color: "rgba(255, 255, 255, 0.8)",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'flex-start',
    },
    boxValue: {
        fontSize: 18,
        color: "#fff",
        fontWeight: "800",
        textAlign: "left",
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        flexShrink: 1,
    },
    boxSubText: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
        fontWeight: "500",
        marginLeft: 6,
        textTransform: 'uppercase',
    },

    // Form Styles
    formBox: {
        backgroundColor: "#ffffff",
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 15, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, 
        shadowRadius: 12,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: "#111827",
        marginBottom: 16,
        marginTop: 5,
    },
    inputGroup: {
        marginBottom: 14, 
    },
    label: {
        fontSize: 12, 
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        fontWeight: "600",
        marginBottom: 6,
        marginLeft: 2,
    },
    textInput: {
        height: 52, 
        backgroundColor: "#F9FAFB",
        borderRadius: 12, 
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#111827",
        borderWidth: 1,
        borderColor: "#E5E7EB", 
    },
    inputContainer: {
        height: 52,
        backgroundColor: "#F3F4F6", 
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    fakeInputText: {
        fontSize: 16,
        color: "#374151",
        fontWeight: "600",
    },
    rowInputs: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    pickerContainer: {
        height: 52,
        backgroundColor: "#FFFFFF", 
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        justifyContent: "center",
        overflow: 'hidden',
    },
    picker: { 
        width: "100%", 
        height: 52, 
        color: "#111827", 
        backgroundColor: "#FFFFFF",
        fontSize: 16,
        marginLeft: -4,
    },
    stylishButton: {
        marginTop: 10,
        height: 52, 
        borderRadius: 14,
        backgroundColor: "#111827",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
});

export default PigmePayin;