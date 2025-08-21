import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert, // Keep Alert for now, but consider custom modals for production
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";

import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";

const EditLead = ({ route, navigation }) => {
    const { user, lead } = route.params; // Receive lead object from navigation

    const [currentDate, setCurrentDate] = useState("");
    const [receipt, setReceipt] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const [customerInfo, setCustomerInfo] = useState({
        full_name: "",
        phone_number: "",
        profession: "",
    });

    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedTicket, setSelectedTicket] = useState("chit");

    useEffect(() => {
        const fetchGroups = async () => {
            const currentUrl =
                selectedTicket === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;

            try {
                const response = await axios.get(`${currentUrl}/group/get-group`);
                if (response.data) {
                    setGroups(response.data || []);
                    // If a lead is being edited, try to set its group
                    if (lead && lead.group_id && lead.scheme_type === selectedTicket) {
                        setSelectedGroup(lead.group_id._id || lead.group_id); // Handle cases where group_id might be an object or just the ID
                    } else {
                        setSelectedGroup("");
                    }
                } else {
                    console.error("No data in response");
                    setGroups([]);
                }
            } catch (error) {
                console.error("Error fetching groups:", error.message);
                setGroups([]);
            }
        };

        if (selectedTicket) {
            fetchGroups();
        }
    }, [selectedTicket, lead]);

    useEffect(() => {
        const today = moment().format("DD-MM-YYYY");
        setCurrentDate(today);

        // Populate form fields with existing lead data if available
        if (lead) {
            setCustomerInfo({
                full_name: lead.lead_name || "",
                phone_number: lead.lead_phone || "",
                // Ensure profession is always a string, defaulting to "" if lead.lead_profession is null/undefined
                profession: lead.lead_profession || "",
            });
            setSelectedTicket(lead.scheme_type || "chit");
        }
    }, [lead]);

    useEffect(() => {
        const fetchAgentData = async () => {
            try {
                const response = await axios.get(
                    `${chitBaseUrl}/agent/get-agent-by-id/${user.userId}`
                );
                setReceipt(response.data);
            } catch (error) {
                console.error("Error fetching agent data:", error);
            }
        };
        fetchAgentData();
    }, [user.userId]);

    const handleInputChange = (field, value) => {
        setCustomerInfo({ ...customerInfo, [field]: value });
    };

    const handleUpdateLead = async () => {
        setIsLoading(true);
        const baseUrl =
            selectedTicket === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;

        if (
            !customerInfo.full_name ||
            !customerInfo.phone_number ||
            !customerInfo.profession ||
            !selectedTicket ||
            !selectedGroup
        ) {
            Alert.alert("Required", "Please fill out all fields!");
            setIsLoading(false);
            return;
        }

        try {
            const data = {
                lead_name: customerInfo.full_name,
                lead_phone: customerInfo.phone_number,
                lead_profession: customerInfo.profession, // This will now send 'employed' or 'self_employed'
                group_id: selectedGroup,
                lead_type: "agent",
                scheme_type: selectedTicket,
                lead_agent: selectedTicket === "chit" ? user.userId : receipt.name,
                agent_number: receipt.phone_number,
            };

            const response = await axios.put(`${baseUrl}/lead/update-lead/${lead._id}`, data);

            if (response.status === 200) { // Assuming 200 for successful update
                Alert.alert("Success", "Lead updated successfully!");
                navigation.navigate("ViewLeads", { user: user });
            } else {
                console.log("Error:", response.data);
                Alert.alert("Error", response.data?.message || "Error updating lead.");
            }
        } catch (error) {
            console.error("Error updating lead:", error);
            Alert.alert("Error", "Error updating lead. Please try again.");
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
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        <View style={{ marginHorizontal: 22, marginTop: 12 }}>
                            <Header />
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>Edit Lead</Text>
                                <TouchableOpacity
                                    style={styles.myLeadsButton}
                                    onPress={() => navigation.navigate("ViewLeads", { user: user })}
                                >
                                    <Text style={styles.myLeadsButtonText}>My Leads</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.contentContainer}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter Name"
                                    keyboardType="default"
                                    value={customerInfo.full_name}
                                    onChangeText={(value) =>
                                        handleInputChange("full_name", value)
                                    }
                                />

                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter Phone Number"
                                    keyboardType="phone-pad"
                                    value={customerInfo.phone_number}
                                    onChangeText={(value) =>
                                        handleInputChange("phone_number", value)
                                    }
                                />

                                <Text style={styles.label}>Profession</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={customerInfo.profession}
                                        onValueChange={(itemValue) =>
                                            handleInputChange("profession", itemValue)
                                        }
                                    >
                                        <Picker.Item label="Select Profession" value="" />
                                        <Picker.Item label="Employed" value="employed" />
                                        <Picker.Item label="Selfemployed" value="self_employed" />
                                    </Picker>
                                </View>

                                <View style={styles.tabContainer}>
                                    <TouchableOpacity
                                        style={[styles.tab, selectedTicket === "chit" && styles.activeTab]}
                                        onPress={() => setSelectedTicket("chit")}
                                    >
                                        <Text style={[styles.tabText, selectedTicket === "chit" && styles.activeTabText]}>
                                            Chit
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.tab, selectedTicket === "gold" && styles.activeTab]}
                                        onPress={() => setSelectedTicket("gold")}
                                    >
                                        <Text style={[styles.tabText, selectedTicket === "gold" && styles.activeTabText]}>
                                            Gold
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>Group</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedGroup}
                                        onValueChange={(value) => setSelectedGroup(value)}
                                    >
                                        <Picker.Item label="Select Group" value="" />
                                        {groups.map((group) => (
                                            <Picker.Item
                                                key={group._id}
                                                label={group.group_name}
                                                value={group._id}
                                            />
                                        ))}
                                    </Picker>
                                </View>

                                <Button
                                    title={isLoading ? "Please wait..." : "Update Lead"}
                                    filled
                                    style={{
                                        marginTop: 18,
                                        marginBottom: 4,
                                        backgroundColor: isLoading ? "gray" : COLORS.third,
                                    }}
                                    onPress={handleUpdateLead}
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
    container: {
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
        marginTop: -4,
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
        backgroundColor: '#da8201',
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
});

export default EditLead;
