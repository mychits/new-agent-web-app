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
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import baseUrl from "../constants/baseUrl";

const { width: screenWidth } = Dimensions.get("window");

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

// --- Toast Component ---
const Toast = React.forwardRef(({ duration = 2000 }, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const opacity = useRef(new Animated.Value(0)).current;

  React.useImperativeHandle(ref, () => ({
    show: (msg) => {
      setMessage(msg);
      setVisible(true);
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
            setVisible(false);
          });
        }, duration);
      });
    },
  }));

  if (!visible) return null;
  return (
    <Animated.View style={[styles.toastContainer, { opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
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
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 4000);

    Animated.timing(inputAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    return () => clearInterval(interval);
  }, []);

  const handleRegister = async () => {
    // Validation logic
    if (!fullName || !phoneNumber || !password) {
      toastRef.current?.show("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      toastRef.current?.show("Passwords do not match.");
      return;
    }
    if (phoneNumber.length < 10) {
      toastRef.current?.show("Invalid phone number.");
      return;
    }

    setLoading(true);

    const signupData = {
      name: fullName,
      phone_number: phoneNumber,
      password: password,
      agent_type: "agent" 
    };

    console.log("Registering with:", signupData);

    try {
      const response = await fetch(`${baseUrl}/agent/signup-agent`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (response.ok) {
        toastRef.current?.show("Registration successful!");
        setTimeout(() => navigation.navigate("Login"), 1500);
      } else {
        console.log("Signup error response:", data);
        toastRef.current?.show(data.message || "Registration Failed.");
      }
    } catch (e) {
      console.error("Network error during signup:", e);
      toastRef.current?.show("Network Error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Image
        source={backgroundImages[currentImageIndex]}
        style={[styles.backgroundOverlayImage, { opacity: fadeAnim }]}
        resizeMode="cover"
      />
      <LinearGradient colors={['#24C6DC', '#183A5D']} style={styles.gradientOverlay} />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView} 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topSection}>
              <Image 
                source={require('../assets/Group400.png')} 
                style={styles.headerImage}
                resizeMode="contain"
              />
              <Text style={styles.welcomeTitle}>Create Your{"\n"}Account</Text>
            </View>

            <View style={styles.bottomSection}>
              <Animated.View style={[styles.inputGroup, { opacity: inputAnim }]}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={COLOR_PALETTE.secondary} style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="#A0A0A0"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </Animated.View>

              <Animated.View style={[styles.inputGroup, { opacity: inputAnim }]}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color={COLOR_PALETTE.secondary} style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Example: 234567890"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ""))}
                  />
                </View>
              </Animated.View>

              <Animated.View style={[styles.inputGroup, { opacity: inputAnim }]}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLOR_PALETTE.secondary} style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="***************"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={COLOR_PALETTE.secondary} />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View style={[styles.inputGroup, { opacity: inputAnim }]}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLOR_PALETTE.secondary} style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="***************"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={COLOR_PALETTE.secondary} />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', marginTop: 20 }}>
                <TouchableOpacity
                  onPress={handleRegister}
                  onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()}
                  onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
                  disabled={loading}
                  activeOpacity={1}
                >
                  <LinearGradient colors={[COLOR_PALETTE.primary, COLOR_PALETTE.secondary]} style={styles.btn}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Register</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Pressable onPress={() => navigation.navigate("Login")} style={styles.loginLink}>
                <Text style={styles.loginText}>Already have an account? <Text style={styles.linkText}>Log in</Text></Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast ref={toastRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundOverlayImage: { ...StyleSheet.absoluteFillObject },
  gradientOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.88 },
  safeArea: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 30, justifyContent: 'center' },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    marginBottom: 40,
  },
  headerImage: {
    width: 70,
    height: 70,
    marginRight: 15,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 34,
  },
  bottomSection: { width: '100%' },
  inputGroup: { marginBottom: 15 },
  inputLabel: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
  },
  icon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, color: '#1C2E4A' },
  btn: { width: screenWidth * 0.75, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  loginLink: { marginTop: 25, alignItems: 'center' },
  loginText: { color: '#FFF', fontSize: 14 },
  linkText: { fontWeight: 'bold', textDecorationLine: 'underline' },
  toastContainer: { 
    position: 'absolute', 
    top: 60, 
    alignSelf: 'center', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 25, 
    elevation: 5,
    zIndex: 999
  },
  toastText: { color: '#1C2E4A', fontWeight: '700' }
});