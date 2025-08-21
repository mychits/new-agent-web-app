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
} from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";

import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import baseUrl from "../constants/baseUrl";
import { AgentContext } from "../context/AgentContextProvider";

const Payin = ({ route, navigation }) => {
    const { user, customer } = route.params;
    const {modifyPayment} = useContext(AgentContext);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [receipt, setReceipt] = useState({});
    const [paymentDetails, setPaymentDetails] = useState("cash");
    const [amount, setAmount] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [customerInfo, setCustomerInfo] = useState({});
    const [groups, setGroups] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedTicket, setSelectedTicket] = useState("");
    const [allData, setAllData] = useState([]);

    // Fetch customer details
    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/user/get-user-by-id/${customer}`
                );
                if (response.data) {
                    setCustomerInfo(response.data);
                } else {
                    console.error("Unexpected API response format:", response.data);
                }
            } catch (error) {
                console.error("Error fetching customer data:", error);
            }
        };

        fetchCustomer();
    }, [customer]);

    // Fetch enrollment details (groups and tickets)
    useEffect(() => {
        const fetchEnrollDetails = async () => {
            try {
                const response = await axios.post(
                    `${baseUrl}/enroll/get-user-tickets/${customer}`
                );
                console.log(response.data, "test jsghsg");

                setAllData(response.data);

                // Extract unique groups
                const uniqueGroups = response.data
                    .filter((group) => group.group_id !== null)
                    .reduce((acc, group) => {
                        if (
                            !acc.some(
                                (g) => g.group_id.group_name === group.group_id.group_name
                            )
                        ) {
                            acc.push(group);
                        }
                        return acc;
                    }, []);

                setGroups(uniqueGroups);
            } catch (error) {
                console.error("Error fetching customer enrollment data:", error);
            }
        };

        fetchEnrollDetails();
    }, [customer]);

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

    const handleDateChange = (event, selectedDate) => {
        const newDate = selectedDate || currentDate;
        setShowDatePicker(Platform.OS === "ios");
        setCurrentDate(newDate);
    };

    const handleGroupChange = (groupId) => {
        setSelectedGroup(groupId);
        setSelectedTicket("");

        if (groupId) {
            const groupTickets = allData
                .filter((item) => item.group_id && item.group_id._id === groupId)
                .map((item) => item.tickets);
            setTickets(groupTickets);
        } else {
            setTickets([]);
        }
    };
    const handlePaymentTypeChange = (type) => {
        setPaymentDetails(type);
        if (type === "online") {
            setAdditionalInfo("Transaction ID");
        } else if (type === "cheque") {
            setAdditionalInfo("Cheque Number");
        } else {
            setAdditionalInfo("");
        }
        setTransactionId("");
    };
    const handleAddPayment = async () => {
        if (
            !customerInfo.full_name ||
            !selectedGroup ||
            !selectedTicket ||
            !currentDate ||
            !(receipt.receipt_no || receipt.receipt_no === 0) ||
            !paymentDetails ||
            !amount ||
            (additionalInfo !== "" && !transactionId)
        ) {
            Alert.alert("Validation Error", "Please fill all mandatory fields.");
            return;
        }

        setIsLoading(true);
        try {
            const data = {
                user_id: customer,
                group_id: selectedGroup,
                ticket: selectedTicket,
                pay_date: moment(currentDate).format("YYYY-MM-DD"), // Corrected line
                receipt_no: (receipt.receipt_no === 0) ? "0" : (receipt.receipt_no ? String(receipt.receipt_no) : ""),
                pay_type: paymentDetails,
                amount: amount,
                transaction_id: transactionId,
                collected_by: user.userId,
            };

            const response = await axios.post(`${baseUrl}/payment/add-payment`, data);

            if (response.status === 201) {
                Alert.alert("Success", "Payment added successfully!");
                navigation.navigate("Print", { store_id: response.data._id });
            } else {
                console.log("Unexpected response status:", response.status, response.data);
                Alert.alert("Payment Error", "An unexpected error occurred. Please try again.");
            }
        } catch (error) {
            console.error("Error adding payment:", error);
            let errorMessage = "Error adding payment. Please try again.";
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
                errorMessage = error.response.data.message || JSON.stringify(error.response.data) || errorMessage;
            } else if (error.request) {
                console.error("Error request:", error.request);
                errorMessage = "No response from server. Please check your network connection.";
            } else {
                console.error("Error message:", error.message);
                errorMessage = error.message;
            }
            Alert.alert("Payment Error", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-select ticket if only one is available for the selected group
    useEffect(() => {
        if (tickets.length === 1) {
            setSelectedTicket(tickets[0].toString());
        }
    }, [tickets]);

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
                                <Text style={styles.title}>Add Payment</Text>
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
                                        value={customerInfo.full_name}
                                        editable={false}
                                    />
                                    <Text style={styles.label}>
                                        Group<Text style={styles.star}>*</Text>
                                    </Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedGroup}
                                            onValueChange={handleGroupChange}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Select Group" value="" />
                                            {groups.map((group, index) => (
                                                <Picker.Item
                                                    key={index}
                                                    label={group.group_id.group_name}
                                                    value={group.group_id._id}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                    <Text style={styles.label}>
                                        Ticket<Text style={styles.star}>*</Text>
                                    </Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedTicket}
                                            onValueChange={(itemValue) => setSelectedTicket(itemValue)}
                                            style={styles.picker}
                                            enabled={selectedGroup !== ""}
                                        >
                                            <Picker.Item label="Select Ticket" value="" />
                                            {tickets.map((ticket, index) => (
                                                <Picker.Item
                                                    key={index}
                                                    label={`${ticket}`}
                                                    value={ticket.toString()}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                    <View style={styles.row}>
                                        <View style={styles.column}>
                                            <Text style={styles.label}>
                                                Date<Text style={styles.star}>*</Text>
                                            </Text>
                                            <TouchableOpacity onPress={() => setShowDatePicker((modifyPayment===true)?true:false)}>
                                                <TextInput
                                                    style={styles.textInput}
                                                    placeholder="Select Date"
                                                    keyboardType="default"
                                                    value={moment(currentDate).format("DD-MM-YYYY")}
                                                    editable={false}
                                                />
                                            </TouchableOpacity>
                                            {showDatePicker && (
                                                <DateTimePicker
                                                    testID="dateTimePicker"
                                                    value={currentDate}
                                                    mode="date"
                                                    display="default"
                                                    onChange={handleDateChange}
                                                />
                                            )}
                                        </View>
                                        <View style={styles.column}>
                                            <Text style={styles.label}>
                                                Receipt<Text style={styles.star}>*</Text>
                                            </Text>
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder="Select Receipt"
                                                keyboardType="numeric"
                                                value={receipt.receipt_no !== undefined && receipt.receipt_no !== null ? String(receipt.receipt_no) : ""}
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
        height: 40,
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
    },
    contentContainer: {},
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
        height: 40,
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

export default Payin;