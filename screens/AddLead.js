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
    ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import COLORS from "../constants/color";
import Button from "../components/Button";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ["#1aa2cc", "#1aa2cc"];
const MODERN_PRIMARY = "#0d0d0e";
const ACCENT_BLUE = "#1796d1";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb';

const AddLead = ({ route, navigation }) => {
    // FIX: Safety check for route params to prevent immediate crash on entry
    const user = route?.params?.user || {};
    const userId = user?.userId;

    const [receipt, setReceipt] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [leadMode, setLeadMode] = useState("quick"); 
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedTicket, setSelectedTicket] = useState("chit");

    const [customerInfo, setCustomerInfo] = useState({
        full_name: "",
        phone_number: "", 
        profession: "",
    });

    useEffect(() => {
        const fetchGroups = async () => {
            const currentUrl = selectedTicket === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;
            try {
                const response = await axios.get(`${currentUrl}/group/get-group`);
                if (response.data) {
                    setGroups(Array.isArray(response.data) ? response.data : []);
                }
            } catch (error) {
                console.error("Error fetching groups:", error.message);
            }
        };
        fetchGroups();
    }, [selectedTicket]);

    useEffect(() => {
        if (!userId) return;
        const fetchAgentData = async () => {
            try {
                const response = await axios.get(
                    `${chitBaseUrl}/agent/get-agent-by-id/${userId}`
                );
                setReceipt(response.data || {});
            } catch (error) {
                console.error("Error fetching agent data:", error);
            }
        };
        fetchAgentData();
    }, [userId]);

    const handleInputChange = (field, value) => {
        setCustomerInfo(prevState => ({ 
            ...prevState, 
            [field]: value 
        }));
    };

    const handleAddLead = async () => {
        if (!customerInfo.full_name || !customerInfo.phone_number) {
            Alert.alert("Required", "Please fill name and phone number!");
            return;
        }

        setIsLoading(true);
        const baseUrl = selectedTicket === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;

        try {
            const data = {
                lead_name: customerInfo.full_name,
                lead_phone: customerInfo.phone_number,
                lead_profession: leadMode === "quick" && !customerInfo.profession ? "N/A" : customerInfo.profession,
                group_id: selectedGroup || null,
                lead_type: "agent",
                scheme_type: selectedTicket,
                lead_agent: userId,
                agent_number: receipt?.phone_number || "",
            };

            const response = await axios.post(`${baseUrl}/lead/add-lead`, data);

            if (response.status === 201 || response.status === 200) {
                Alert.alert("✅ Success", "Lead added successfully!");
                setCustomerInfo({ full_name: "", phone_number: "", profession: "" });
                setSelectedGroup("");
                navigation.navigate("ViewLeads", { user: user });
            }
        } catch (error) {
            const serverMsg = error.response?.data?.message || "Something went wrong.";
            Alert.alert("Error", serverMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const GroupPickerComponent = () => (
        <View>
            <Text style={styles.label}>Group</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedGroup}
                    onValueChange={(v) => setSelectedGroup(v)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select Group (Optional)" value="" />
                    {groups?.map((g) => (
                        <Picker.Item key={g._id || Math.random().toString()} label={g.group_name} value={g._id} />
                    ))}
                </Picker>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
                <TouchableOpacity style={styles.backCircle} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={24} color={CARD_BG} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>Add Lead</Text>
                    <Text style={styles.subtitle}>Fill in details to add a new lead</Text>
                </View>
            </LinearGradient>

            <View style={styles.mainContentArea}>
                <KeyboardAvoidingView 
                    style={{ flex: 1 }} 
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.modeTabContainer}>
                            <TouchableOpacity
                                style={[styles.modeTab, leadMode === "quick" && styles.activeModeTab]}
                                onPress={() => setLeadMode("quick")}
                            >
                                <Text style={[styles.modeTabText, leadMode === "quick" && styles.activeModeTabText]}>Quick Lead</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeTab, leadMode === "detailed" && styles.activeModeTab]}
                                onPress={() => setLeadMode("detailed")}
                            >
                                <Text style={[styles.modeTabText, leadMode === "detailed" && styles.activeModeTabText]}>Detailed Lead</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter full name"
                                value={customerInfo.full_name}
                                onChangeText={(v) => handleInputChange("full_name", v)}
                            />

                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                                // FIX: Removed String() wrapper and added empty string fallback
                                value={customerInfo.phone_number || ""} 
                                onChangeText={(v) => {
                                    const cleaned = v.replace(/[^0-9]/g, '');
                                    handleInputChange("phone_number", cleaned);
                                }}
                            />

                            <Text style={styles.label}>Scheme Type</Text>
                            {/* FIX: Changed 'div' to 'View' to prevent component error */}
                            <View style={styles.schemeTabs}>
                                <TouchableOpacity
                                    style={[styles.schemeTab, selectedTicket === "chit" && styles.activeSchemeTab]}
                                    onPress={() => setSelectedTicket("chit")}
                                >
                                    <Text style={[styles.schemeText, selectedTicket === "chit" && styles.activeSchemeText]}>Chit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.schemeTab, selectedTicket === "gold" && styles.activeSchemeTab]}
                                    onPress={() => setSelectedTicket("gold")}
                                >
                                    <Text style={[styles.schemeText, selectedTicket === "gold" && styles.activeSchemeText]}>Gold</Text>
                                </TouchableOpacity>
                            </View>

                            {leadMode === "quick" ? (
                                <GroupPickerComponent />
                            ) : (
                                <>
                                    <Text style={styles.label}>Profession</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={customerInfo.profession}
                                            onValueChange={(v) => handleInputChange("profession", v)}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Select Profession" value="" />
                                            <Picker.Item label="Employed" value="Employed" />
                                            <Picker.Item label="Self-Employed" value="Self-Employed" />
                                            <Picker.Item label="Unemployed" value="Unemployed" />
                                        </Picker>
                                    </View>
                                    <GroupPickerComponent />
                                </>
                            )}

                            <Button
                                title={isLoading ? "Please wait..." : "Add Lead"}
                                filled
                                style={[styles.submitButton, { backgroundColor: isLoading ? TEXT_GREY : ACCENT_BLUE }]}
                                onPress={handleAddLead}
                                disabled={isLoading}
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
    topContainer: { paddingHorizontal: 16, paddingBottom: 20, position: 'relative' },
    titleContainer: { alignItems: 'center', marginTop: 35, marginBottom: 15 },
    headerTitle: { color: CARD_BG, fontSize: 28, fontWeight: "900", marginBottom: 4 },
    subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500', textAlign: 'center' },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        marginTop: -20,
        paddingTop: 30,
        elevation: 8,
    },
    scrollContainer: { paddingBottom: 40 },
    backCircle: {
        position: "absolute",
        top: 20,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    modeTabContainer: {
        flexDirection: "row",
        backgroundColor: CARD_BG,
        borderRadius: 25,
        padding: 5,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    modeTab: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: "center" },
    activeModeTab: { backgroundColor: ACCENT_BLUE },
    modeTabText: { color: ACCENT_BLUE, fontWeight: "600" },
    activeModeTabText: { color: CARD_BG, fontWeight: "bold" },
    formCard: {
        backgroundColor: CARD_BG,
        borderRadius: 20,
        padding: 20,
        elevation: 8,
    },
    label: { fontSize: 16, fontWeight: "700", color: MODERN_PRIMARY, marginTop: 15, marginBottom: 5 },
    input: {
        height: 50,
        borderRadius: 12,
        backgroundColor: SUBTLE_BG_GREY,
        marginVertical: 4,
        paddingHorizontal: 15,
        color: MODERN_PRIMARY,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        fontSize: 16,
    },
    schemeTabs: {
        flexDirection: "row",
        borderRadius: 12,
        backgroundColor: SUBTLE_BG_GREY,
        padding: 4,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    schemeTab: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10 },
    activeSchemeTab: { backgroundColor: ACCENT_BLUE },
    schemeText: { color: ACCENT_BLUE, fontWeight: "500" },
    activeSchemeText: { color: CARD_BG, fontWeight: "bold" },
    pickerContainer: {
        backgroundColor: SUBTLE_BG_GREY,
        borderRadius: 12,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    picker: { color: MODERN_PRIMARY, height: 55 },
    submitButton: { marginTop: 25, borderRadius: 30, height: 55, justifyContent: 'center' }
});

export default AddLead;