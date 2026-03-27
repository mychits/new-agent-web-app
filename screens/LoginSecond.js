import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Dimensions, Image, Animated, ActivityIndicator, StatusBar, Platform, KeyboardAvoidingView,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import baseUrl from "../constants/baseUrl"; 
import { Alert } from "react-native";

const { width } = Dimensions.get("window");

const backgroundImages = [
  require('../assets/i1.png'), 
  require('../assets/i.png'), 
  require('../assets/i2.png')
];

export default function LoginSecond({ navigation, route }) {
  const { employeeCode } = route.params || {};
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); 
  const [resendEnabled, setResendEnabled] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- Error State & Animation ---
  const [errorMessage, setErrorMessage] = useState("");
  const slideAnim = useRef(new Animated.Value(-150)).current;

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;

  // Background Image Slider
  useEffect(() => {
    const intervalImg = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(intervalImg);
  }, []);

  // Timer Logic
  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      setResendEnabled(true);
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Entrance Animation
  useEffect(() => {
    Animated.timing(inputAnim, { 
      toValue: 1, 
      duration: 800, 
      delay: 200, 
      useNativeDriver: true 
    }).start();
  }, []);

  // --- Functions to Show/Hide Banner ---
  const showError = (msg) => {
    setErrorMessage(msg);
    Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    setTimeout(() => {
      hideError();
    }, 3000);
  };

  const hideError = () => {
    Animated.timing(slideAnim, { toValue: -150, duration: 400, useNativeDriver: true }).start();
  };

  // API: Verify OTP
  const handleVerifyOTP = async () => {
    hideError();

    if (otp.length < 4) {
      showError("Please enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      const apiUrl = `${baseUrl}/agent/verify-otp/${employeeCode}`;

      console.log("--- VERIFYING OTP ---");
      console.log("URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otp }),
      });

      const data = await response.json();
      console.log("Verify Response:", data);

      if (response.ok && data.status) {
        const userData = data.agent || data;
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        navigation.replace("Home", { 
          user: userData, 
          agentInfo: userData 
        });
      } else {
        showError(data.message || "Invalid OTP.");
      }
    } catch (e) { 
      console.error("Verify Error:", e);
      showError("Network error."); 
    } finally { 
      setLoading(false); 
    }
  };

  // API: Re-generate OTP
  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const apiUrl = `${baseUrl}/agent/re-generate-otp/${employeeCode}`;

      console.log("--- RESENDING OTP ---");
      console.log("URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
      });
      
      const data = await response.json();
      console.log("Resend Response:", data);

      if (response.ok) {
        Alert.alert("Success", "OTP sent successfully.");
        setTimeLeft(30);
        setResendEnabled(false);
      } else {
        showError(data.message || "Unable to resend OTP.");
      }
    } catch (e) {
      console.error("Resend Error:", e);
      showError("Network error.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- ERROR BANNER --- */}
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

      <Animated.Image source={backgroundImages[currentImageIndex]} style={[styles.bgImage, { opacity: fadeAnim }]} />
      <LinearGradient colors={['rgba(36,198,220,0.8)', 'rgba(24,58,93,0.9)']} style={styles.gradientOverlay} />

      <SafeAreaView style={styles.safeArea}>
        
        {/* --- KEYBOARD AVOIDING VIEW WRAPPER --- */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <Animated.View style={[styles.glassCard, { 
            opacity: inputAnim, 
            transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] 
          }]}>
            
            <Image source={require('../assets/Group400.png')} style={styles.logo} resizeMode="contain" />
            
            <Text style={styles.title}>Verify Account</Text>
            
            <Text style={styles.subText}>
              We have sent a verification code to your{"\n"}
              <Text style={styles.boldText}>Registered Mobile Number</Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter OTP</Text>
              <View style={styles.otpContainer}>
                <Ionicons name="shield-checkmark" size={20} color="#5F6C7D" style={{marginLeft: 15}}/>
                <TextInput 
                  style={styles.otpInput} 
                  placeholder="0 0 0 0 0 0" 
                  placeholderTextColor="#c5d2e4" 
                  keyboardType="numeric" 
                  maxLength={6} 
                  value={otp} 
                  onChangeText={setOtp} 
                />
              </View>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleVerifyOTP} disabled={loading}>
              <LinearGradient colors={['#1C2E4A', '#5F6C7D']} style={styles.btnGradiant} start={{x:0, y:0}} end={{x:1, y:0}}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verify & Login</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.resendSection}>
              {resendEnabled ? (
                <TouchableOpacity onPress={handleResendOTP} disabled={resendLoading}>
                  {resendLoading ? (
                      <ActivityIndicator color="#24C6DC" />
                  ) : (
                      <Text style={styles.resendLink}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>Resend code in <Text style={styles.timerHighlight}>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</Text></Text>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
        {/* --- END KEYBOARD AVOIDING VIEW WRAPPER --- */}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#183A5D' },
  
  // --- Error Banner Styles ---
  errorBannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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

  // --- Layout Styles ---
  bgImage: { ...StyleSheet.absoluteFillObject },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // --- Content Styles ---
  backBtn: { 
    width: 45, 
    height: 45, 
    borderRadius: 15, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 10,
    marginLeft:20,
    alignSelf: 'flex-start', // Keep back button aligned left relative to container
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
    marginTop: 20,
    width: '85%', // <--- DECREASED WIDTH
    maxWidth: 320, // <--- ADDED MAX WIDTH
    alignSelf: 'center' // <--- ENSURE IT'S CENTERED
  },
  logo: { width: 70, height: 60, marginBottom: 15 },
  title: { fontSize: 24, fontWeight: '800', color: '#1C2E4A', marginBottom: 10 },
  subText: { fontSize: 14, color: '#5F6C7D', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  boldText: { color: '#1C2E4A', fontWeight: 'bold' },
  inputGroup: { width: '100%', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#1C2E4A', marginBottom: 8, marginLeft: 5 },
  otpContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 15, 
    height: 55, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  otpInput: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#1C2E4A', letterSpacing: 4, marginRight: 35 },
  btn: { width: '100%', height: 55, borderRadius: 15, overflow: 'hidden', marginTop: 10 },
  btnGradiant: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  resendSection: { marginTop: 20, alignItems: 'center', height: 30 },
  resendLink: { color: '#24C6DC', fontWeight: '800', textDecorationLine: 'underline', fontSize: 16 },
  timerText: { color: '#5F6C7D', fontWeight: '600', opacity: 0.5 },
  timerHighlight: { color: '#1C2E4A', fontWeight: 'bold', opacity: 0.5 }
});