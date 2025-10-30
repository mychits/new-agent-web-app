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
  ActivityIndicator, // 👈 Import ActivityIndicator
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import baseUrl from "../constants/baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const COLOR_PALETTE = {
  primary: '#1C2E4A',
  secondary: '#5F6C7D',
  lightText: '#FFFFFF',
};


const backgroundImages = [
  require('../assets/i1.png'),
  require('../assets/i.png'),
  require('../assets/i2.png'),
];

// 1. Import the new image
const logoImage = require('../assets/Group400.png');

export default function Login({ navigation }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [loading, setLoading] = useState(false); // 👈 New state for loader

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(interval);
  }, [fadeAnim, backgroundImages.length, inputAnim]);

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

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert(
        "Validation Error",
        "Please enter both mobile number and password."
      );
      return;
    }

    setLoading(true); // 👈 Show loader

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
    } finally {
      setLoading(false); // 👈 Hide loader
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
        colors={['#b6e4ebff', '#1796d1ff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentWrapper}>
          {/* 2. Add the Image component (e.g., as a logo above the title) */}
          <Animated.View style={[styles.logoContainer, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Text style={styles.welcomeTitle}>Welcome Back{"\n"}to Mychits</Text>

          {/* Phone Number Input */}
          <Animated.View style={[styles.inputGroup, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={24} color={COLOR_PALETTE.secondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="eg. 1234567890"
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
              <Ionicons name="lock-closed" size={24} color={COLOR_PALETTE.secondary} style={{ marginRight: 10 }} />
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
              disabled={loading} // 👈 Disable button while loading
            >
              <LinearGradient
                colors={[COLOR_PALETTE.primary, COLOR_PALETTE.secondary]}
                style={styles.loginButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* 👈 Conditional rendering for loader */}
                {loading ? (
                  <ActivityIndicator color={COLOR_PALETTE.lightText} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Log in</Text>
                )}
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
  // 3. Add styles for the new logo image
  logoContainer: {
    marginBottom: 1, // Space below the logo
  },
  logo: {
    width: 80, // Adjust size as needed
    height: 70, // Adjust size as needed
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
    borderWidth:1,
    borderColor: 'orange',
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
    marginTop: 60,
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
  becomeAgentLinkWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  becomeAgentLink: {},
  becomeAgentText: {
    fontSize: 18,
    fontWeight: '600',
    color: "black",
    textDecorationLine: 'underline',
  },
  signUpLinkWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
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