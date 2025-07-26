import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
  Animated,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import baseUrl from "../constants/baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

// Define a consistent color palette based on the existing design
const COLOR_PALETTE = {
  primary: '#1C2E4A', // Dark blue/charcoal for text and buttons
  secondary: '#5F6C7D', // Grayish blue for labels and icons
  lightText: '#FFFFFF', // White text for contrast
};

// Define your background images for the animated transition
const backgroundImages = [
  require('../assets/i1.png'),
  require('../assets/i.png'),
  require('../assets/i2.png'),
];

export default function Login({ navigation }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordShown, setIsPasswordShown] = useState(false);

  // State and animation for dynamic background image transitions
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animation for the login button
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

  // Animation handlers for the login button
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

  // Login handler
  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert(
        "Validation Error",
        "Please enter both mobile number and password."
      );
      return;
    }
    try {
      const cleanedPassword = password.replace(/\s/g, "");
      const response = await fetch(`${baseUrl}/agent/login-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: mobile, password: cleanedPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        const agentDetail = await axios.get(
          `${baseUrl}/agent/get-agent-by-id/${data.userId}`
        );
        await AsyncStorage.setItem("user", JSON.stringify(data));
        await AsyncStorage.setItem("agentInfo", JSON.stringify(agentDetail?.data));
        navigation.navigate("BottomNavigation", {
          user: data,
          agentInfo: agentDetail?.data,
        });
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
      console.error(error);
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
        colors={['#A8E0F9', '#F9E5B5']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentWrapper}>
          <Text style={styles.welcomeTitle}>Welcome Back{"\n"}to Mychits</Text>

          {/* Phone Number Input */}
          <Animated.View style={[styles.inputGroup, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="call" size={24} color={COLOR_PALETTE.secondary} style={{marginRight: 10}} />
                <TextInput
                  style={styles.textInput}
                  placeholder="eg. 8765349076"
                  placeholderTextColor="#A9A9A9"
                  keyboardType="numeric"
                  value={mobile}
                  onChangeText={setMobile}
                />
            </View>
          </Animated.View>

          {/* Password Input */}
          <Animated.View style={[styles.inputGroup, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={24} color={COLOR_PALETTE.secondary} style={{marginRight: 10}} />
              <TextInput
                style={styles.textInput}
                placeholder="***************"
                placeholderTextColor="#A9A9A9"
                secureTextEntry={!isPasswordShown}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordShown(!isPasswordShown)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={isPasswordShown ? "eye-off" : "eye"}
                  size={24}
                  color={COLOR_PALETTE.secondary}
                />
              </TouchableOpacity>
            </View>
            <Pressable style={{ marginTop: 10, alignSelf: 'flex-end' }} onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>
          </Animated.View>
          
          {/* Become an agent? link - Moved here, between password and login button */}
          <Animated.View style={[styles.becomeAgentLinkWrapper, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Pressable style={styles.becomeAgentLink} onPress={() => navigation.navigate("Becomeanagent")}>
              <Text style={styles.becomeAgentText}>Become an Agent ?</Text>
            </Pressable>
          </Animated.View>

          {/* Login Button with Gradient and Animation */}
          <Animated.View style={[styles.loginButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
              onPress={handleLogin}
              onPressIn={onPressInButton}
              onPressOut={onPressOutButton}
              activeOpacity={1}
            >
              <LinearGradient
                colors={[COLOR_PALETTE.primary, COLOR_PALETTE.secondary]}
                style={styles.loginButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.loginButtonText}>Log in</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* NEW: Don't have an account? Sign Up link */}
          <Animated.View style={[styles.signUpLinkWrapper, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Pressable onPress={() => navigation.navigate("Register")}>
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </Pressable>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
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
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: COLOR_PALETTE.lightText,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 48,
    letterSpacing: 0.5,
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
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_PALETTE.lightText,
    textDecorationLine: 'underline',
  },
  loginButtonWrapper: {
    width: '100%',
    marginTop: 60, // Adjusted margin to control spacing from "Become an agent?"
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    width: width * 0.7,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  loginButtonText: {
    color: COLOR_PALETTE.lightText,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Styles for the "Become an agent?" link
  becomeAgentLinkWrapper: { // Added a wrapper for consistent animated styling
    width: '100%',
    alignItems: 'center', // Aligns the text to the right
    marginTop: 10, // Adjust this as needed for vertical spacing
    marginBottom: 10, // Adjust this as needed for vertical spacing before the login button
  },
  becomeAgentLink: {
    // No specific styles needed here, as the wrapper handles alignment
  },
  becomeAgentText: {
    fontSize: 18,
    fontWeight: '600',
    color: "black",
    textDecorationLine: 'underline',
  },
  // NEW Styles for "Don't have an account? Sign Up" link
  signUpLinkWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20, // Space below the login button
  },
  signUpText: {
    fontSize: 16,
    color: COLOR_PALETTE.lightText,
  },
  signUpLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
