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
import * as Contacts from "expo-contacts";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons"; // 🔄 Switched to Ionicons

import COLORS from "../constants/color";
import Button from "../components/Button";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";

// --- DESIGN CONSTANTS COPIED from PaymentList.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"];
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent (for primary buttons/highlights)
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
// ---------------------------------------------

const AddLead = ({ route, navigation }) => {
    const { user } = route.params;

    const [receipt, setReceipt] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [leadMode, setLeadMode] = useState("quick"); // quick | detailed
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedTicket, setSelectedTicket] = useState("chit");

    const [customerInfo, setCustomerInfo] = useState({
        full_name: "",
        phone_number: "",
        profession: "",
    });

    // ⬇️ Fetch Groups
    useEffect(() => {
        const fetchGroups = async () => {
            const currentUrl =
                selectedTicket === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;
            try {
                const response = await axios.get(`${currentUrl}/group/get-group`);
                if (response.data) {
                    setGroups(response.data || []);
                }
            } catch (error) {
                console.error("Error fetching groups:", error.message);
            }
        };
        fetchGroups();
    }, [selectedTicket]);

    // ⬇️ Fetch Agent Info
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

    // ⬇️ Input Change
    const handleInputChange = (field, value) => {
        setCustomerInfo({ ...customerInfo, [field]: value });
    };

    // ⬇️ Pick Contact from Phone
    const handlePickContact = async () => {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Denied", "Cannot access contacts.");
            return;
        }

        try {
            const contact = await Contacts.presentContactPickerAsync();
            if (!contact) return;

            const name = contact.name ?? "";
            const phoneNumbers = contact.phoneNumbers;
            let phone = "";
            if (phoneNumbers && phoneNumbers.length > 0) {
                // Ensure number is cleaned up for consistent format
                phone = phoneNumbers[0].number.replace(/\D/g, "");
            }

            setCustomerInfo({
                ...customerInfo,
                full_name: name || customerInfo.full_name,
                phone_number: phone || customerInfo.phone_number,
            });

            Alert.alert("Contact Selected", "Contact details filled successfully!");
        } catch (err) {
            console.error("Error picking contact:", err);
            Alert.alert("Error", "Failed to pick contact.");
        }
    };

    // ⬇️ Add Lead
    const handleAddLead = async () => {
        setIsLoading(true);
        const baseUrl =
            selectedTicket === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;

        // Validation logic updated: group_id is now only required for 'detailed' 
        // if profession is also provided, otherwise, it's optional in quick/detailed.
        if (
            !customerInfo.full_name ||
            !customerInfo.phone_number ||
            (leadMode === "detailed" && !customerInfo.profession)
            // Note: selectedGroup is now OPTIONAL for both modes.
        ) {
            Alert.alert("Required", "Please fill all required fields!");
            setIsLoading(false);
            return;
        }

        try {
            const data = {
                lead_name: customerInfo.full_name,
                lead_phone: customerInfo.phone_number,
                // If quick mode, set profession to 'N/A' unless it was filled.
                lead_profession:
                    leadMode === "quick" && !customerInfo.profession ? "N/A" : customerInfo.profession,
                // group_id is sent if selected, otherwise null
                group_id: selectedGroup || null,
                lead_type: "agent",
                scheme_type: selectedTicket,
                lead_agent: user.userId,
                agent_number: receipt.phone_number,
            };

            const response = await axios.post(`${baseUrl}/lead/add-lead`, data);

            if (response.status === 201) {
                Alert.alert("✅ Success", "Lead added successfully!");
                // Clear form after success
                setCustomerInfo({
                    full_name: "",
                    phone_number: "",
                    profession: "",
                });
                setSelectedGroup("");
                setSelectedTicket("chit");
                navigation.navigate("ViewLeads", { user: user });
            } else {
                Alert.alert("Error", response.data?.message || "Error adding lead.");
            }
        } catch (error) {
            console.error("Error adding lead:", error);
            // Enhanced error message check
            if (error.response && error.response.status === 409) {
                Alert.alert("Already Exists", "Phone number already exists.");
            } else {
                Alert.alert("Error", "An unexpected error occurred while adding the lead.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Helper component for the Group Picker
    const GroupPickerComponent = () => (
        <>
            <Text style={styles.label}>Group</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedGroup}
                    onValueChange={(v) => setSelectedGroup(v)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                >
                    {/* The label that was cutting off */}
                    <Picker.Item label="Select Group (Optional)" value="" />
                    {groups.map((g) => (
                        <Picker.Item
                            key={g._id}
                            label={g.group_name}
                            value={g._id}
                        />
                    ))}
                </Picker>
            </View>
            
        </>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* === Blue Curved Header === */}
            <LinearGradient
                colors={TOP_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topContainer}
            >
                <TouchableOpacity
                    style={styles.backCircle}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back-outline" size={24} color={CARD_BG} />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>Add Lead</Text>
                    <Text style={styles.subtitle}>Fill in details to add a new lead</Text>
                </View>
            </LinearGradient>

            {/* === White/Grey Form Area (Curved Overlap) === */}
            <View style={styles.mainContentArea}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Mode Switch */}
                        <View style={styles.modeTabContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.modeTab,
                                    leadMode === "quick" && styles.activeModeTab,
                                ]}
                                onPress={() => {
                                    setLeadMode("quick");
                                    // Optionally clear less relevant fields when switching to quick
                                    setCustomerInfo(prev => ({ ...prev, profession: "" }));
                                }}
                            >
                                <Text
                                    style={[
                                        styles.modeTabText,
                                        leadMode === "quick" && styles.activeModeTabText,
                                    ]}
                                >
                                    Quick Lead
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modeTab,
                                    leadMode === "detailed" && styles.activeModeTab,
                                ]}
                                onPress={() => setLeadMode("detailed")}
                            >
                                <Text
                                    style={[
                                        styles.modeTabText,
                                        leadMode === "detailed" && styles.activeModeTabText,
                                    ]}
                                >
                                    Detailed Lead
                                </Text>
                            </TouchableOpacity>
                        </View>


                        <View style={styles.formCard}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter full name"
                                placeholderTextColor={TEXT_GREY}
                                value={customerInfo.full_name}
                                onChangeText={(v) => handleInputChange("full_name", v)}
                            />

                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter phone number"
                                placeholderTextColor={TEXT_GREY}
                                keyboardType="phone-pad"
                                value={customerInfo.phone_number}
                                onChangeText={(v) => handleInputChange("phone_number", v)}
                            />

                            <Text style={styles.label}>Scheme Type</Text>
                            <View style={styles.schemeTabs}>
                                <TouchableOpacity
                                    style={[
                                        styles.schemeTab,
                                        selectedTicket === "chit" && styles.activeSchemeTab,
                                    ]}
                                    onPress={() => setSelectedTicket("chit")}
                                >
                                    <Text
                                        style={[
                                            styles.schemeText,
                                            selectedTicket === "chit" && styles.activeSchemeText,
                                        ]}
                                    >
                                        Chit
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.schemeTab,
                                        selectedTicket === "gold" && styles.activeSchemeTab,
                                    ]}
                                    onPress={() => setSelectedTicket("gold")}
                                >
                                    <Text
                                        style={[
                                            styles.schemeText,
                                            selectedTicket === "gold" && styles.activeSchemeText,
                                        ]}
                                    >
                                        Gold
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Group picker shown for Quick Lead */}
                            {leadMode === "quick" && <GroupPickerComponent />}


                            {leadMode === "detailed" && (
                                <>
                                    <Text style={styles.label}>Profession</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={customerInfo.profession}
                                            onValueChange={(v) => handleInputChange("profession", v)}
                                            style={styles.picker}
                                            itemStyle={styles.pickerItem}
                                        >
                                            <Picker.Item label="Select Profession" value="" />
                                            <Picker.Item label="Employed" value="Employed" />
                                            <Picker.Item label="Self-Employed" value="Self-Employed" />
                                            <Picker.Item label="Unemployed" value="Unemployed" />
                                        </Picker>
                                    </View>

                                    {/* Group picker also shown for Detailed Lead */}
                                    <GroupPickerComponent />
                                </>
                            )}

                            <Button
                                title={isLoading ? "Please wait..." : "Add Lead"}
                                filled
                                style={[
                                    styles.submitButton, // Using new style object
                                    {
                                        backgroundColor: isLoading ? TEXT_GREY : ACCENT_BLUE,
                                    }
                                ]}
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
    // --- LAYOUT STYLES (New) ---
    safeArea: {
        flex: 1,
        backgroundColor: TOP_GRADIENT[0]
    },
    topContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        position: 'relative',
    },
    titleContainer: {
        alignItems: 'center',
        marginTop: 35,
        marginBottom: 15,
    },
    headerTitle: {
        color: CARD_BG,
        fontSize: 28,
        fontWeight: "900",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '500',
        textAlign: 'center',
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        marginTop: -20, // Curved overlap
        paddingTop: 30,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    scrollContainer: {
        paddingBottom: 40,
    },

    // --- HEADER BACK BUTTON (Updated) ---
    backCircle: {
        position: "absolute",
        top: 20, // Adjusted position for SafeAreaView
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },

    // --- MODE TABS (Updated colors) ---
    modeTabContainer: {
        flexDirection: "row",
        backgroundColor: CARD_BG, // White background
        borderRadius: 25,
        padding: 5,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    modeTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: "center",
    },
    activeModeTab: { backgroundColor: ACCENT_BLUE }, // Blue highlight
    modeTabText: { color: ACCENT_BLUE, fontWeight: "600" }, // Blue text
    activeModeTabText: { color: CARD_BG, fontWeight: "bold" }, // White text

    // --- CONTACT BUTTON (NEW STYLE) ---
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: CARD_BG,
        borderRadius: 12,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 15, // Added margin top to separate it from the Picker
        borderWidth: 1,
        borderColor: ACCENT_BLUE,
        // Optional subtle shadow
        shadowColor: ACCENT_BLUE,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    contactButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: MODERN_PRIMARY,
        flex: 1, // Take up middle space
        marginLeft: 10,
    },


    // --- FORM CARD (Updated shadow/radius) ---
    formCard: {
        backgroundColor: CARD_BG,
        borderRadius: 20,
        padding: 20,
        elevation: 8,
        shadowColor: MODERN_PRIMARY,
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
    },

    // --- INPUTS & LABELS (Updated colors/styles) ---
    label: {
        fontSize: 16,
        fontWeight: "700",
        color: MODERN_PRIMARY, // Dark primary text
        marginTop: 15,
        marginBottom: 5,
    },
    input: {
        height: 50,
        borderRadius: 12,
        backgroundColor: SUBTLE_BG_GREY, // Light grey input background
        marginVertical: 4,
        paddingHorizontal: 15,
        color: MODERN_PRIMARY,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        fontSize: 16,
    },



    // --- SCHEME TABS (Updated colors) ---
    schemeTabs: {
        flexDirection: "row",
        borderRadius: 12,
        backgroundColor: SUBTLE_BG_GREY, // Light grey background
        padding: 4,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    schemeTab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
        borderRadius: 10,
    },
    activeSchemeTab: { backgroundColor: ACCENT_BLUE }, // Blue highlight
    schemeText: { color: ACCENT_BLUE, fontWeight: "500" }, // Blue text
    activeSchemeText: { color: CARD_BG, fontWeight: "bold" }, // White text

    // --- PICKER (Updated colors/styles) ---
    pickerContainer: {
        backgroundColor: SUBTLE_BG_GREY,
        borderRadius: 12,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    picker: {
        color: MODERN_PRIMARY,
        height: 55, // Increased height to prevent clipping
    },
    pickerItem: {
        color: MODERN_PRIMARY,
        fontSize: 18, // Added font size to prevent clipping on iOS
    },

    // --- SUBMIT BUTTON (Updated colors/styles) ---
    submitButton: {
        marginTop: 25,
        marginBottom: 0,
        borderRadius: 30, // Make it more rounded
        height: 55,
        justifyContent: 'center',
    }
});

export default AddLead;