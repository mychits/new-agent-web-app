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
import { Picker } from "@react-native-picker/picker";
import * as Contacts from "expo-contacts";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";

import COLORS from "../constants/color";
import Button from "../components/Button";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";

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

  // 🔹 Fetch Groups
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

  // 🔹 Fetch Agent Info
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

  // 🔹 Input Change
  const handleInputChange = (field, value) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  };

  // 🔹 Pick Contact from Phone
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
        phone = phoneNumbers[0].number.replace(/\D/g, ""); // remove non-digits
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

  // 🔹 Add Lead
  const handleAddLead = async () => {
    setIsLoading(true);
    const baseUrl =
      selectedTicket === "chit" ? `${chitBaseUrl}` : `${goldBaseUrl}`;

    if (
      !customerInfo.full_name ||
      !customerInfo.phone_number ||
      (leadMode === "detailed" &&
        (!customerInfo.profession || !selectedGroup))
    ) {
      Alert.alert("Required", "Please fill all required fields!");
      setIsLoading(false);
      return;
    }

    try {
      const data = {
        lead_name: customerInfo.full_name,
        lead_phone: customerInfo.phone_number,
        lead_profession:
          leadMode === "quick" ? "N/A" : customerInfo.profession,
        group_id: leadMode === "quick" ? null : selectedGroup,
        lead_type: "agent",
        scheme_type: selectedTicket,
        lead_agent: user.userId,
        agent_number: receipt.phone_number,
      };

      const response = await axios.post(`${baseUrl}/lead/add-lead`, data);

      if (response.status === 201) {
        Alert.alert("✅ Success", "Lead added successfully!");
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
      Alert.alert("Already Exists", "Phone number already exists.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fullScreenContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* === Violet Curved Header === */}
        <LinearGradient
          colors={["#1aa2ccff", "#1aa2ccff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerContainer}
        >
          <TouchableOpacity
            style={styles.backCircle}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Lead</Text>
        </LinearGradient>

        {/* === White Form Area === */}
        <View style={styles.contentContainer}>
          {/* Mode Switch */}
          <View style={styles.modeTabContainer}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                leadMode === "quick" && styles.activeModeTab,
              ]}
              onPress={() => setLeadMode("quick")}
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

          {/* Form Card */}
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handlePickContact}
            >
              <Icon name="address-book" size={18} color="#fff" />
              <Text style={styles.contactButtonText}>Select from Contacts</Text>
            </TouchableOpacity>
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
              value={customerInfo.phone_number}
              onChangeText={(v) => handleInputChange("phone_number", v)}
            />

            {/* 🔹 Select from Contact Button */}
            {/* <TouchableOpacity
              style={styles.contactButton}
              onPress={handlePickContact}
            >
              <Icon name="address-book" size={18} color="#fff" />
              <Text style={styles.contactButtonText}>Select from Contacts</Text>
            </TouchableOpacity> */}

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

            {leadMode === "detailed" && (
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
                  </Picker>
                </View>

                <Text style={styles.label}>Group</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedGroup}
                    onValueChange={(v) => setSelectedGroup(v)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Group" value="" />
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
            )}

            <Button
              title={isLoading ? "Please wait..." : "Add Lead"}
              filled
              style={{
                marginTop: 18,
                marginBottom: 4,
                backgroundColor: isLoading ? "#999" : "#1aa2ccff",
              }}
              onPress={handleAddLead}
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    height: 180,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backCircle: {
    position: "absolute",
    top: 55,
    left: 25,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 40,
  },
  contentContainer: {
    marginTop: -40,
    paddingHorizontal: 20,
  },
  modeTabContainer: {
    flexDirection: "row",
    backgroundColor: "#f2e9ff",
    borderRadius: 25,
    padding: 5,
    marginBottom: 15,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  activeModeTab: { backgroundColor: "#1aa2ccff" },
  modeTabText: { color: "#1aa2ccff", fontWeight: "600" },
  activeModeTabText: { color: "#fff", fontWeight: "bold" },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1aa2ccff",
    marginTop: 10,
  },
  input: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f2f0ff",
    marginVertical: 8,
    paddingHorizontal: 15,
    color: "#000",
  },
  contactButton: {
    flexDirection: "row",
    backgroundColor: "#f8c009ff",
    borderRadius: 30,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  contactButtonText: {
    color: "#000",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 15,
  },
  schemeTabs: {
    flexDirection: "row",
    borderRadius: 12,
    backgroundColor: "#eee5ff",
    padding: 4,
    marginVertical: 10,
  },
  schemeTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeSchemeTab: { backgroundColor: "#1aa2ccff" },
  schemeText: { color: "#1aa2ccff", fontWeight: "500" },
  activeSchemeText: { color: "#fff", fontWeight: "bold" },
  pickerContainer: {
    backgroundColor: "#f2f0ff",
    borderRadius: 12,
    marginVertical: 10,
  },
  picker: { color: "#000", height: 50 },
});

export default AddLead;
