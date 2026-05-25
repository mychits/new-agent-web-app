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
import Feather from "react-native-vector-icons/Feather";

import COLORS from "../constants/color";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";

const AddLead = ({ route, navigation }) => {
  const { user } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [receipt, setReceipt] = useState({});
  const [groups, setGroups] = useState([]);
  
  const [customerInfo, setCustomerInfo] = useState({
    full_name: "",
    phone_number: "",
    profession: "",
  });

  const [selectedTicket, setSelectedTicket] = useState("chit");
  const [selectedGroup, setSelectedGroup] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      const currentUrl = selectedTicket === "chit" ? chitBaseUrl : goldBaseUrl;
      try {
        const response = await axios.get(`${currentUrl}/group/get-group`);
        if (response.data) {
          setGroups(response.data || []);
          setSelectedGroup("");
        }
      } catch (error) {
        console.error("Error fetching groups:", error.message);
        setGroups([]);
      }
    };
    fetchGroups();
  }, [selectedTicket]);

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

  const handleAddLead = async () => {
    setIsLoading(true);
    const baseUrl = selectedTicket === "chit" ? chitBaseUrl : goldBaseUrl;

    if (!customerInfo.full_name || !customerInfo.phone_number || !customerInfo.profession || !selectedGroup) {
      Alert.alert("Required", "Please fill out all fields!");
      setIsLoading(false);
      return;
    }

    try {
      const data = {
        lead_name: customerInfo.full_name,
        lead_phone: customerInfo.phone_number,
        lead_profession: customerInfo.profession,
        group_id: selectedGroup,
        lead_type: "agent",
        scheme_type: selectedTicket,
        lead_agent: selectedTicket === "chit" ? user.userId : receipt.name,
        agent_number: receipt.phone_number,
      };

      const response = await axios.post(`${baseUrl}/lead/add-lead`, data);

      if (response.status === 201 || response.status === 200) {
        Alert.alert("Success", "Lead added successfully!");
        setCustomerInfo({ full_name: "", phone_number: "", profession: "" });
        setSelectedGroup("");
        navigation.navigate("ViewLeads", { user });
      }
    } catch (error) {
      // --- Error Handling for 400 and others ---
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        if (error.response.status === 400) {
          const serverMessage = error.response.data.message || "Invalid details or lead already exists.";
          Alert.alert("Request Failed", serverMessage);
        } else {
          Alert.alert("Server Error", `Something went wrong (Status: ${error.response.status})`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        Alert.alert("Network Error", "No response from server. Please check your internet.");
      } else {
        // Something happened in setting up the request
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#24C6DC', '#183A5D']} style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Add Lead</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("ViewLeads", { user })}
          style={styles.myCustomersButton}
        >
          <Text style={styles.myCustomersButtonText}>My Leads</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.formCard}>
            
            <Text style={styles.subHeaderText}>
              Please provide the lead details to initiate a new connection.
            </Text>
            
            <InputField
              label="Name"
              icon="user"
              required
              value={customerInfo.full_name}
              onChangeText={(v) => handleInputChange("full_name", v)}
              onFocus={() => setFocusedInput("full_name")}
              onBlur={() => setFocusedInput(null)}
              focused={focusedInput === "full_name"}
            />

            <InputField
              label="Phone Number"
              icon="phone"
              required
              keyboardType="phone-pad"
              value={customerInfo.phone_number}
              onChangeText={(v) => handleInputChange("phone_number", v)}
              onFocus={() => setFocusedInput("phone_number")}
              onBlur={() => setFocusedInput(null)}
              focused={focusedInput === "phone_number"}
            />

            <Text style={styles.label}>Profession *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={customerInfo.profession}
                onValueChange={(val) => handleInputChange("profession", val)}
                style={styles.picker}
                dropdownIconColor="#1aa2ccff"
              >
                <Picker.Item label="Select Profession" value="" />
                <Picker.Item label="Employed" value="Employed" />
                <Picker.Item label="Self-Employed" value="Self-Employed" />
              </Picker>
            </View>

            <Text style={styles.label}>Scheme Type *</Text>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, selectedTicket === "chit" && styles.activeTab]}
                onPress={() => setSelectedTicket("chit")}
              >
                <Text style={[styles.tabText, selectedTicket === "chit" && styles.activeTabText]}>Chit</Text>
              </TouchableOpacity>
             
            </View>

            <Text style={styles.label}>Group *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={(val) => setSelectedGroup(val)}
                style={styles.picker}
                dropdownIconColor="#1aa2ccff"
              >
                <Picker.Item label="Select Group" value="" />
                {groups.map((g) => (
                  <Picker.Item key={g._id} label={g.group_name} value={g._id} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={[styles.addButton, isLoading && { opacity: 0.7 }]}
              onPress={handleAddLead}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Add Lead</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const InputField = ({ label, icon, required, value, onChangeText, keyboardType, onFocus, onBlur, focused }) => (
  <View style={{ marginBottom: 15 }}>
    <Text style={styles.label}>
      {label} {required && <Text style={{ color: "red" }}>*</Text>}
    </Text>
    <View style={[styles.inputGroup, focused && { borderColor: "#1aa2ccff" }]}>
      <Feather name={icon} size={18} color={focused ? "#1aa2ccff" : "#888"} style={styles.icon} />
      <TextInput
        style={styles.textInput}
        placeholder={`Enter ${label}`}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholderTextColor="#999"
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f2f8" },
  headerContainer: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingVertical: 35,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 6,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 50,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  myCustomersButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 25,
  },
  myCustomersButtonText: { color: "#1aa2ccff", fontSize: 12, fontWeight: "bold" },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 25,
    marginHorizontal: 20,
    marginTop: 25,
    padding: 20,
    elevation: 3,
  },
  subHeaderText: {
    color: "#666",
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic"
  },
  label: { fontWeight: "bold", color: "#333", marginBottom: 5, marginTop: 5 },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  icon: { marginRight: 8 },
  textInput: { flex: 1, color: "#000", fontSize: 14 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    backgroundColor: "#f7f7f7",
    overflow: "hidden",
    marginBottom: 15,
    height: 55,
  },
  picker: { height: 55, color: "#333" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    padding: 4,
    marginBottom: 15,
    marginTop: 5,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 18 },
  activeTab: { backgroundColor: "#1aa2ccff" },
  tabText: { fontWeight: "bold", color: "#666" },
  activeTabText: { color: "#fff" },
  addButton: {
    backgroundColor: "#1aa2ccff",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 10,
    alignItems: "center",
    elevation: 5,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default AddLead;