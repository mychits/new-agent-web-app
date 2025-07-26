import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image, // Added Image import as it's used in the JSX
} from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import COLORS from "../constants/color";
import baseUrl from "../constants/baseUrl";
import { SafeAreaView } from "react-native-safe-area-context"; // Added SafeAreaView import

const { width, height } = Dimensions.get("window");

export default function ForgotPassword({ navigation }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false); // To track if OTP has been sent

  // Validate phone number before sending OTP
  const validatePhoneNumber = () => {
    const isValid = phone.length === 10;
    if (!isValid) {
      Alert.alert("Validation Error", "Please enter a valid phone number.");
    }
    return isValid;
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber()) return;

    setLoading(true);
    try {
      // --- DEBUGGING STEP: Log the phone number before sending ---
      console.log("Sending OTP for phone number:", phone);

      const response = await axios.post(`${baseUrl}/agent/forgot-password`, {
        phone_number: phone,
      });

      if (response.status === 200) {
        Alert.alert("Success", "OTP has been sent to your phone.");
        setIsOtpSent(true); // OTP sent, show OTP input field
      } else {
        // Log the full response data for more details on server error
        console.error("Server Error (handleSendOTP):", response.data);
        Alert.alert("Error", response.data?.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Network Error (handleSendOTP):", error.response ? error.response.data : error.message);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!phone || !otp) {
      Alert.alert("Validation Error", "Please enter both phone number and OTP.");
      return;
    }
    setLoading(true);
    try {
      // --- DEBUGGING STEP: Log the phone number and OTP before sending ---
      console.log("Verifying OTP for phone:", phone, "OTP:", otp);

      const response = await axios.post(`${baseUrl}/agent/verify-otp`, {
        phone_number: phone.trim(),
        otp: otp.trim(),
      });

      if (response.status === 200) {
        Alert.alert("Success", "OTP verified successfully!");
        navigation.navigate("ResetPassword", { mobile: phone }); // Ensure the parameter name matches what ResetPassword expects (it was 'mobile' in your ResetPassword.js)
      } else {
        // Log the full response data for more details on server error
        console.error("Server Error (handleVerifyOTP):", response.data);
        Alert.alert("Error", response.data?.message || "OTP verification failed.");
      }
    } catch (error) {
      console.error("OTP Error (handleVerifyOTP):", error.response ? error.response.data : error.message);
      Alert.alert("Error", "An error occurred during OTP verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['rgba(151, 228, 250, 0.7)', 'rgba(250, 221, 168, 0.7)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.backgroundGradient}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header content: Image only */}
        <View style={styles.headerContent}>
          <Image
            source={require("../assets/forgot.png")}
            style={styles.forgotImage}
            resizeMode="contain"
          />
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>
            {isOtpSent ? "Enter OTP" : "Enter Mobile Number"}
          </Text>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your registered mobile number"
              placeholderTextColor="#A9A9A9"
              keyboardType="numeric"
              value={phone}
              onChangeText={setPhone}
              editable={!isOtpSent} // Make phone number input non-editable after OTP is sent
            />
          </View>

          {/* OTP Input (conditionally rendered) */}
          {isOtpSent && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter the OTP"
                placeholderTextColor="#A9A9A9"
                keyboardType="numeric"
                value={otp}
                onChangeText={setOtp}
              />
            </View>
          )}

          {/* Buttons */}
          <Pressable
            onPress={isOtpSent ? handleVerifyOTP : handleSendOTP}
            style={styles.button}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isOtpSent ? "Verify OTP" : "Send OTP"}
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: 'center',
    paddingTop: height * 0.015, // Increased padding top to shift content further up
    paddingBottom: height * 0.03,
  },
  headerContent: {
    alignItems: "center",
    marginBottom: height * 0.03,
  },
  forgotImage: {
    width: width * 0.9,
    height: width * 0.6,
  },
  mainContent: {
    backgroundColor: "#FFFFFF",
    width: "90%",
    maxWidth: 400,
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 30,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C2E4A",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 5,
    color: "#5F6C7D",
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 0,
    paddingLeft: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    color: "#1C2E4A",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#1C2E4A",
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backText: {
    color: "#322383",
    marginTop: 15,
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
});