import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated, // Keeping Animated for potential future use or if it was part of a previous version you want to restore
  TouchableOpacity, // Keeping TouchableOpacity for consistent button press handling
} from "react-native";
import React, { useState, useRef } from "react"; // Keeping useRef for Animated.Value
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import COLORS from "../constants/color"; // Keeping this import, but using COLOR_PALETTE for consistency
import baseUrl from "../constants/baseUrl";

const { width, height } = Dimensions.get("window");

// Define a consistent color palette to match the ForgotPassword page
const COLOR_PALETTE = {
  primary: '#1C2E4A', // Dark blue/charcoal for text and buttons
  secondary: '#5F6C7D', // Grayish blue for labels and icons
  lightText: '#FFFFFF', // White text for contrast
};

export default function ResetPassword({ route, navigation }) {
  const { mobile } = route.params;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Animation value for the login button (kept for consistency if needed)
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animation handlers for the button (kept for consistency if needed)
  const onPressInButton = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // IMPORTANT: Clean the password before sending to match login behavior
      const cleanedPassword = password.replace(/\s/g, "");

      const response = await axios.post(`${baseUrl}/agent/reset-password`, {
        phone_number: mobile,
        newPassword: cleanedPassword, // Use the cleaned password here
      });

      if (response.status === 200) {
        Alert.alert("Success", "Password reset successfully.");
        navigation.navigate("Login"); // Redirect to Login
      } else {
        Alert.alert("Error", response.data?.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Reset Password Error:", error.response ? error.response.data : error.message);
      Alert.alert("Error", "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
       colors={['#dbf6faff', '#90dafcff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.backgroundGradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentWrapper}>
          {/* The "Reset Password" title at the very top was removed in a previous iteration */}
          {/* If you want to add it back, uncomment the following: */}
          <Text style={styles.welcomeTitle}>Reset Password</Text>


          <View style={styles.card}>
            <Text style={styles.title}>Create New Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={COLOR_PALETTE.secondary} // Using COLOR_PALETTE
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your new password"
                placeholderTextColor={COLOR_PALETTE.secondary} // Using COLOR_PALETTE
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {/* Reset Password Button with Gradient and Animation */}
            <Animated.View style={[styles.loginButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity
                onPress={handleResetPassword}
                onPressIn={onPressInButton}
                onPressOut={onPressOutButton}
                disabled={loading}
                activeOpacity={1}
              >
                <LinearGradient
                  // Updated gradient colors to match ForgotPassword.js button
                  colors={[COLOR_PALETTE.primary, COLOR_PALETTE.secondary]}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>Back to Login</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: { // Renamed from 'container' for clarity and consistency
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeTitle: { // This style is kept but the component is commented out
    fontSize: 40,
    fontWeight: '800',
    color: COLOR_PALETTE.lightText,
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly transparent white
    width: '100%',
    paddingHorizontal: 30,
    paddingVertical: 40, // Increased vertical padding
    borderRadius: 20, // More rounded corners
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLOR_PALETTE.primary, // Using COLOR_PALETTE
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  inputGroup: { // Renamed from 'inputContainer' for consistency with previous ResetPassword.js
    width: "100%",
    marginBottom: 20, // Increased margin for better spacing
  },
  inputLabel: { // Renamed from 'label' for consistency with previous ResetPassword.js
    fontSize: 16,
    fontWeight: "600", // Adjusted font weight
    marginBottom: 8, // Adjusted margin
    marginLeft: 10, // Adjusted margin
    color: COLOR_PALETTE.primary, // Using COLOR_PALETTE
  },
  input: {
    width: "100%",
    height: 60, // Increased height for better touch target
    backgroundColor: '#FFFFFF',
    borderRadius: 30, // Fully rounded input fields
    paddingHorizontal: 20, // Adjusted padding
    fontSize: 16,
    color: COLOR_PALETTE.primary, // Using COLOR_PALETTE
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    borderColor: '#E0E0E0', // Added border for subtle definition
    borderWidth: 1,
  },
  loginButtonWrapper: {
    width: '100%',
    marginTop: 30, // Increased margin top
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: width * 0.7, // Adjusted width for consistency
    height: 60, // Increased height
    borderRadius: 16, // Rounded button
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 }, // Enhanced shadow
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  buttonText: {
    color: COLOR_PALETTE.lightText, // Using COLOR_PALETTE
    fontSize: 20, // Increased font size
    fontWeight: '700', // Adjusted font weight
    letterSpacing: 1, // Added letter spacing
  },
  backText: {
    color: COLOR_PALETTE.primary, // Using COLOR_PALETTE
    marginTop: 15,
    textDecorationLine: "underline",
    fontWeight: "bold",
    fontSize: 14, // Adjusted font size
  },
});
