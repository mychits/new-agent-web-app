import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Dimensions, Image, Pressable, Animated, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";

import baseUrl from "../constants/baseUrl";

const { width, height } = Dimensions.get("window");

const backgroundImages = [
  require('../assets/i1.png'),
  require('../assets/i.png'),
  require('../assets/i2.png'),
];

export default function Login({ navigation }) {
  const [employeeCode, setEmployeeCode] = useState("");
  const [loading, setLoading] = useState(false);
  
  // --- RESTORED: Error State & Animation ---
  const [errorMessage, setErrorMessage] = useState("");
  const slideAnim = useRef(new Animated.Value(-150)).current; // Start hidden above screen
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const inputAnim = useRef(new Animated.Value(0)).current; 

  useEffect(() => {
    const intervalImg = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 4000);

    Animated.timing(inputAnim, { toValue: 1, duration: 800, delay: 500, useNativeDriver: true }).start();
    return () => clearInterval(intervalImg);
  }, []);

  // --- RESTORED: Functions to Show/Hide Banner ---
  const showError = (msg) => {
    setErrorMessage(msg);
    Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      hideError();
    }, 3000);
  };

  const hideError = () => {
    Animated.timing(slideAnim, { toValue: -150, duration: 400, useNativeDriver: true }).start();
  };

  const handleGetOTP = async () => {
    console.log("Button Pressed - Function Started"); 

    // Hide previous error if any
    hideError();

    // --- VALIDATION: Shows on Screen AND Terminal ---
    if (!employeeCode.trim()) {
      console.log("❌ Validation Error: Please enter your Employee Code.");
      showError("Please enter your Employee Code."); // Shows UI Banner
      return;
    }

    console.log("Validation Passed. Setting Loading to TRUE.");
    setLoading(true);

    try {
      const apiUrl = `${baseUrl}/agent/generate-otp/${employeeCode}`;
      
      console.log("--- API CALL DETAILS ---");
      console.log("URL:", apiUrl);

      const response = await axios.post(apiUrl);

      console.log("✅ SUCCESS - Response Received");
      
      if (response.status === 200 || response.status === 201) {
        navigation.navigate("LoginSecond", { employeeCode: employeeCode });
      } else {
        showError("Unexpected response from server.");
      }

    } catch (error) {
      console.error("❌ ERROR CAUGHT");
      let errMsg = "Network Error";
      
      if (error.response) {
        errMsg = error.response.data?.message || error.response.data?.error || "Server Error";
      } else if (error.request) {
        errMsg = "No internet connection";
      } else {
        errMsg = error.message;
      }
      
      console.error("Error details for terminal:", errMsg);
      showError(errMsg); // Shows API error on screen as well
    } finally {
      console.log("Setting Loading to FALSE");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* --- RESTORED: STYLISH ERROR BANNER --- */}
      <Animated.View style={[styles.errorBannerContainer, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient 
          colors={['rgba(36,198,220,0.95)', 'rgba(24,58,93,0.98)']} 
          start={{x: 0, y: 0}} 
          end={{x: 1, y: 0}} 
          style={styles.errorGradient}
        >
          <View style={styles.errorContentRow}>
            <Image source={require('../assets/Group400.png')} style={styles.errorLogo} resizeMode="contain" />
            <Text style={styles.errorText} numberOfLines={2}>
              {errorMessage}
            </Text>
            <TouchableOpacity onPress={hideError} style={styles.errorCloseBtn}>
              <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* --- BACKGROUND CONTENT --- */}
      <Animated.Image source={backgroundImages[currentImageIndex]} style={[styles.bgImage, { opacity: fadeAnim }]} resizeMode="cover" />
      <LinearGradient colors={['rgba(36,198,220,0.8)', 'rgba(24,58,93,0.9)']} style={styles.gradientOverlay} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true} 
          >
            <Animated.View style={[styles.glassCard, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
              <Image source={require('../assets/Group400.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>Welcome Back{"\n"}<Text style={styles.brandText}>Mychits</Text></Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Employee Code</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="#5F6C7D" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="MCF-EMP-1011" 
                    placeholderTextColor="#94A3B8" 
                    autoCapitalize="characters" 
                    value={employeeCode} 
                    onChangeText={setEmployeeCode} 
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.btn} onPress={handleGetOTP} disabled={loading}>
                <LinearGradient colors={['#1C2E4A', '#5F6C7D']} style={styles.btnGradiant} start={{x:0, y:0}} end={{x:1, y:0}}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Get OTP</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <Pressable onPress={() => navigation.navigate("Becomeanagent")} style={styles.linkContainer}>
                <Text style={styles.linkText}>Want to become an agent?</Text>
              </Pressable>

              <Pressable onPress={() => navigation.navigate("Register")} style={styles.signUpContainer}>
                <Text style={styles.footerText}>Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text></Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#183A5D' },
  
  // --- RESTORED: Error Banner Styles ---
  errorBannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Sit on top of everything
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Clear status bar area
    paddingHorizontal: 15,
  },
  errorGradient: {
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  errorContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorLogo: {
    width: 35, 
    height: 30, 
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorCloseBtn: {
    marginLeft: 10,
    padding: 2,
  },

  // --- Existing Styles ---
  bgImage: { ...StyleSheet.absoluteFillObject },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
  keyboardContainer: { flex: 1 },
  scrollContent: {
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 20, 
    minHeight: '100%'
  },
  glassCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: 30, 
    padding: 25, 
    alignItems: 'center', 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 15,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },
  logo: { width: 70, height: 60, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#1C2E4A', textAlign: 'center', marginBottom: 20 },
  brandText: { color: '#24C6DC' },
  inputGroup: { width: '100%', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#1C2E4A', marginBottom: 8, marginLeft: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1C2E4A' },
  btn: { width: '100%', height: 55, borderRadius: 15, overflow: 'hidden', marginTop: 10 },
  btnGradiant: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  linkContainer: { marginTop: 15 },
  linkText: { color: '#1C2E4A', textDecorationLine: 'underline', fontWeight: '600' },
  signUpContainer: { marginTop: 25, marginBottom: 10 }, 
  footerText: { color: '#5F6C7D' },
  signUpLink: { color: '#1C2E4A', fontWeight: 'bold', textDecorationLine: 'underline' }
});