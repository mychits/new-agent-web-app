import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  SafeAreaView,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Pressable, // Added Pressable for consistency with Login.js
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, Ionicons } from "@expo/vector-icons"; // Added Ionicons for consistency
import { useNavigation } from "@react-navigation/native";
import axios from 'axios';

import baseUrl from "../constants/baseUrl";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window"); // Added screenWidth

const COLOR_PALETTE = {
  primary: '#1C2E4A', // Dark blue/charcoal for text and buttons
  secondary: '#5F6C7D', // Grayish blue for labels and icons
  lightText: '#FFFFFF', // White text for contrast
  darkText: '#000', // Black text for specific elements
};

// Define your background images for the animated transition
const backgroundImages = [
  require('../assets/i1.png'), // Assuming these paths are correct
  require('../assets/i.png'),
  require('../assets/i2.png'),
];

const Toast = React.forwardRef(({ duration = 2000 }, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const opacity = useRef(new Animated.Value(0)).current;

  React.useImperativeHandle(ref, () => ({
    show: (msg) => {
      setMessage(msg);
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            setMessage("");
          });
        }, duration);
      });
    },
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, { opacity }]}>
      <View style={styles.toastContent}>
        {/* Ensure message is always wrapped in Text */}
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
});

export default function Register() {
  const navigation = useNavigation();
  const toastRef = useRef();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false); // Retained for keyboard offset logic
  const [loading, setLoading] = useState(false);

  // Animation for dynamic background image transitions
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animation for the register button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animation for the input fields
  const inputAnim = useRef(new Animated.Value(0)).current;

  // Effect for background image animation and input field fade-in
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out current image
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // After fade out, change to next image and fade in
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    // Fade in input fields after a delay
    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(interval); // Cleanup on unmount
  }, [fadeAnim, backgroundImages.length, inputAnim]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const showAppToast = (message) => {
    if (toastRef.current) {
      toastRef.current.show(message);
    }
  };

  // Animation handlers for the register button
  const onPressInButton = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95, // Scale down slightly
      useNativeDriver: true,
    }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, // Scale back to original size
      friction: 3, // Adds a little bounce
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleRegister = async () => {
    const trimmedFullName = fullName.trim();
    const trimmedPhoneNumber = phoneNumber.replace(/\s/g, "");
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (
      !trimmedFullName ||
      !trimmedPhoneNumber ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      showAppToast("Please fill all fields.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      showAppToast("Passwords do not match.");
      return;
    }

    if (trimmedPhoneNumber.length !== 10 || isNaN(trimmedPhoneNumber)) {
      showAppToast("Phone number must be 10 digits.");
      return;
    }

    setLoading(true);

    try {
      // Adjusted the fetch URL: if baseUrl already includes '/api',
      // then we don't need to add it again here.
      const response = await fetch(`${baseUrl}/agent/signup-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: trimmedFullName,
          phone_number: trimmedPhoneNumber,
          password: trimmedPassword,
          track_source: "mobile",
        }),
      });
      

      if (response.ok) {
        const data = await response.json();
        showAppToast("Registration Successful!");

        setTimeout(() => {
          navigation.navigate("Login");
        }, 2000);
      } else {
        const errorData = await response.json();
        if (response.status === 400) {
          showAppToast("User with this phone number already exists");
        } else if (response.status === 500) {
          showAppToast(
            errorData.message || "Server error. Please try again later."
          );
        } else {
          showAppToast(
            errorData.message || "Registration failed. Please try again."
          );
        }
      }
    } catch (error) {
      showAppToast("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Background Image */}
      <Animated.Image
        source={backgroundImages[currentImageIndex]}
        style={[styles.backgroundOverlayImage, { opacity: fadeAnim }]}
        resizeMode="cover"
      />

      {/* A richer, semi-transparent gradient overlay */}
      <LinearGradient
         colors={['#dbf6faff', '#90dafcff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          // Adjust keyboardVerticalOffset if needed for Android, but usually not required with 'height'
        >
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Section - Welcome Title like Login.js */}
            <View style={styles.topSection}>
              <Text style={styles.welcomeTitle}>Create Your{"\n"}Account</Text>
            </View>

            {/* Bottom Section with Register Form */}
            <View style={styles.bottomSection}>

              {/* Full Name Input */}
              <Animated.View style={[styles.inputGroup, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={24} color={COLOR_PALETTE.secondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="#A9A9A9"
                    value={fullName}
                    onChangeText={setFullName}
                    accessible
                    accessibilityLabel="Full name input"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </Animated.View>

              {/* Phone Number Input */}
              <Animated.View style={[styles.inputGroup, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call" size={24} color={COLOR_PALETTE.secondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 8765349076"
                    placeholderTextColor="#A9A9A9"
                    keyboardType="numeric"
                    value={phoneNumber}
                    onChangeText={(text) =>
                      setPhoneNumber(text.replace(/[^0-9]/g, ""))
                    }
                    maxLength={10}
                    accessible
                    accessibilityLabel="Phone number input"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </Animated.View>

              {/* Create Password Input */}
              <Animated.View style={[styles.inputGroup, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <Text style={styles.inputLabel}>Create Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={24} color={COLOR_PALETTE.secondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="***************"
                    placeholderTextColor="#A9A9A9"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    accessible
                    accessibilityLabel="Password input"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    accessible
                    accessibilityLabel="Toggle password visibility"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color={COLOR_PALETTE.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Confirm Password Input */}
              <Animated.View style={[styles.inputGroup, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={24} color={COLOR_PALETTE.secondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="***************"
                    placeholderTextColor="#A9A9A9"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    accessible
                    accessibilityLabel="Confirm password input"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    accessible
                    accessibilityLabel="Toggle confirm password visibility"
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={24}
                      color={COLOR_PALETTE.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Register Button with Gradient and Animation */}
              <Animated.View style={[styles.registerButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
                <TouchableOpacity
                  onPress={handleRegister}
                  onPressIn={onPressInButton}
                  onPressOut={onPressOutButton}
                  activeOpacity={1}
                  accessible
                  accessibilityLabel="Register"
                >
                  <LinearGradient
                    colors={[COLOR_PALETTE.primary, COLOR_PALETTE.secondary]}
                    style={styles.registerButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={COLOR_PALETTE.lightText} />
                    ) : (
                      <Text style={styles.registerButtonText}>Register</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Already have an account? Login link */}
              <Animated.View style={[styles.loginLinkWrapper, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <Pressable onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginText}>
                    Already have an account? <Text style={styles.loginButtonTextLink}>Log in</Text>
                  </Text>
                </Pressable>
              </Animated.View>

            </View>

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLOR_PALETTE.primary} />
                <Text style={styles.loadingText}>Registering...</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast ref={toastRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent', // Ensure container is transparent to show background image
  },
  backgroundOverlayImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "space-around", // Distributes space
    alignItems: 'center', // Center content horizontally
    paddingVertical: 20, // Add some padding at top/bottom
  },
  topSection: {
    // This section acts as a container for the main title, similar to Login.js
    justifyContent: "center",
    alignItems: "center",
    marginBottom: -50, // Space below title
    width: '100%',
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: COLOR_PALETTE.lightText,
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: 0.5,
  },
  bottomSection: {
    width: '100%', // Take full width
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20, // Adjust as needed
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.lightText,
    marginBottom: 8,
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLOR_PALETTE.primary,
  },
  eyeIcon: {
    padding: 8,
  },
  registerButtonWrapper: {
    width: '100%',
    marginTop: 30,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButton: {
    width: screenWidth * 0.7, // Match login button width
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  registerButtonText: {
    color: COLOR_PALETTE.lightText,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginLinkWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20, // Space below the register button
  },
  loginText: {
    fontSize: 16,
    color: COLOR_PALETTE.lightText,
  },
  loginButtonTextLink: { // Renamed from loginButtonText to avoid conflict and clarify purpose
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLOR_PALETTE.primary,
  },
  toastContainer: {
    position: "absolute",
    top: 60, // Adjusted top position
    left: "5%",
    right: "5%",
    backgroundColor: "rgba(238, 243, 247, 0.9)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    zIndex: 9999,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastText: {
    color: "#053B90", // A darker blue for better contrast
    fontSize: 14,
    fontWeight: "600",
    // marginLeft: 10, // Removed if no image
  },
});
