import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Header from "../components/Header";
import { LinearGradient } from "expo-linear-gradient";

import axios from 'axios';

// Import the baseUrl from the constants directory
import baseUrl from "../constants/baseUrl"; // Ensure this path is correct based on your project structure

const Colors = {
  lightBackground: "#F0F5F9",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  accentGreen: "#2ECC71",
  accentBlue: "#3499DB",
  buttonPrimary: "#00BCD4",
  buttonText: "#FFFFFF",
  shadowColor: "rgba(0,0,0,0.1)",
  gradientStart: "#FFFFFF",
  gradientEnd: "#E3F2FD",
  actionBoxBackground: "#F8F8F8",
  borderColor: "#E0E0E0",
  amountHighlight: "#E74C3C",
  darkInvestment: "#0A2647",
  darkProfit: "#196F3D",
};

const Becomeanagent = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  // currentUserId is no longer strictly required for submission,
  // but it's kept as null if you want to pass it in the future for logged-in users.
  const currentUserId = null; 

  // State variables for all fields from the Mongoose schema
  const [agent_full_name, setAgentFullName] = useState("");
  const [agent_email, setAgentEmail] = useState("");
  const [agent_phone_number, setAgentPhoneNumber] = useState("");
  const [agent_address, setAgentAddress] = useState("");
  const [agent_id_proof_type, setAgentIdProofType] = useState("");
  const [agent_id_proof_number, setAgentIdProofNumber] = useState("");
  const [agent_bank_account_number, setAgentBankAccountNumber] = useState("");
  const [agent_bank_account_ifsc_code, setAgentBankAccountIfscCode] = useState("");
  const [agent_experience, setAgentExperience] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (
      !agent_full_name ||
      !agent_email ||
      !agent_phone_number ||
      !agent_address ||
      !agent_id_proof_type ||
      !agent_id_proof_number ||
      !agent_bank_account_number ||
      !agent_bank_account_ifsc_code ||
      !agent_experience
    ) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill in all required fields.",
        position: "bottom",
      });
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(agent_email)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address.",
        position: "bottom",
      });
      return false;
    }
    if (!/^\d{10}$/.test(agent_phone_number)) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2: "Please enter a 10-digit phone number.",
        position: "bottom",
      });
      return false;
    }
    return true;
  };

  const handleSubmitApplication = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const formData = {
        // Mapping state variables to schema fields
        agent_full_name,
        agent_email,
        agent_phone_number,
        agent_address,
        agent_id_proof_type,
        agent_id_proof_number,
        agent_bank_account_number,
        agent_bank_account_ifsc_code,
        agent_experience,
        // Assuming 'deleted' is handled by the backend with a default of false
        // status and appliedAt fields might be added by backend as well, or you can add them here if needed
        status: "pending", // Example field, if your backend expects it
        appliedAt: new Date().toISOString(), // Example field, if your backend expects it
      };

      // Use the imported baseUrl here
      const fullUrl = `${baseUrl}/become-agent/agents/become`;

      const response = await axios.post(fullUrl, formData);

      if (response.status === 201 || response.status === 200) {
        Toast.show({
          type: "success",
          text1: "Application Submitted!",
          text2: "We will review your application shortly. Our team will contact you soon.", // Added new sentence here
          position: "bottom",
          visibilityTime: 4000,
        });

        // Clear form fields on successful submission
        setAgentFullName("");
        setAgentEmail("");
        setAgentPhoneNumber("");
        setAgentAddress("");
        setAgentIdProofType("");
        setAgentIdProofNumber("");
        setAgentBankAccountNumber("");
        setAgentBankAccountIfscCode("");
        setAgentExperience("");

      } else {
        Toast.show({
          type: "info",
          text1: "Submission Issue",
          text2: response.data.message || "Something went wrong with the submission.",
          position: "bottom",
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      console.error("Error submitting agent application: ", error);
      let errorMessage = "Failed to submit application. Please try again later.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: errorMessage,
        position: "bottom",
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
        },
      ]}
    >
      {/* The main gradient background for the entire safe area */}
      <LinearGradient
         colors={['#dbf6faff', '#90dafcff']}
        style={styles.safeAreaGradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="dark-content" />
        <Header
          userId={currentUserId}
          navigation={navigation}
          title="Become an Agent"
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {/* Existing gradientOverlay wrapping the formContainer */}
            <LinearGradient
               colors={['#dbf6faff', '#90dafcff']}
              style={styles.gradientOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                 colors={['#dbf6faff', '#90dafcff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.formContainer}
              >
                <Text style={styles.formTitle}>Agent Application Form</Text>
                <Text style={styles.formSubtitle}>
                  Please fill in your details to apply.
                </Text>

                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={agent_full_name}
                  onChangeText={setAgentFullName}
                  autoCapitalize="words"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={agent_email}
                  onChangeText={setAgentEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={agent_phone_number}
                  onChangeText={setAgentPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Full Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter your full address"
                  value={agent_address}
                  onChangeText={setAgentAddress}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>
                  ID Proof Type (e.g., Aadhaar, PAN)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Aadhaar Card"
                  value={agent_id_proof_type}
                  onChangeText={setAgentIdProofType}
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>ID Proof Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter ID proof number"
                  value={agent_id_proof_number}
                  onChangeText={setAgentIdProofNumber}
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Bank Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter bank account number"
                  value={agent_bank_account_number}
                  onChangeText={setAgentBankAccountNumber}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter IFSC code"
                  value={agent_bank_account_ifsc_code}
                  onChangeText={setAgentBankAccountIfscCode}
                  autoCapitalize="characters"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>
                  Relevant Experience (Optional)
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., 2 years in sales, managed a chits group"
                  value={agent_experience}
                  onChangeText={setAgentExperience}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isLoading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitApplication}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Application</Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    
  },
  safeArea: {
    flex: 1,
    // Removed backgroundColor if any, to allow gradient to show through
  },
  // New style for the full screen gradient background
  safeAreaGradientBackground: { 
    flex: 1, 
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 20,
    // Removed backgroundColor if any, to allow gradient to show through
  },
  gradientOverlay: {
    borderRadius: 15,
    padding: 3,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    width: "100%",
  },
  formContainer: {
    width: "100%",
    borderRadius: 12,
    padding: 25,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 0,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#053B90",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formSubtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: 14,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    borderColor: "#A9D6E5",
    borderWidth: 1,
    marginBottom: 18,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  submitButton: {
    backgroundColor: "#053B90",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#A9BEDA",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default Becomeanagent;
