// import {
//   View, Text, TextInput, TouchableOpacity, StyleSheet,
//   Dimensions, Image, Pressable, Animated, ActivityIndicator,
//   KeyboardAvoidingView, Platform, ScrollView, StatusBar,
// } from "react-native";
// import { useState, useRef, useEffect } from "react";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import axios from "axios";

// import baseUrl from "../constants/baseUrl";

// const { width, height } = Dimensions.get("window");

// const backgroundImages = [
//   require('../assets/i1.png'),
//   require('../assets/i.png'),
//   require('../assets/i2.png'),
// ];

// export default function Login({ navigation }) {
//   const [employeeCode, setEmployeeCode] = useState("");
//   const [loading, setLoading] = useState(false);
  
//   // --- RESTORED: Error State & Animation ---
//   const [errorMessage, setErrorMessage] = useState("");
//   const slideAnim = useRef(new Animated.Value(-150)).current; // Start hidden above screen
  
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const fadeAnim = useRef(new Animated.Value(1)).current;
//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const inputAnim = useRef(new Animated.Value(0)).current; 

//   useEffect(() => {
//     const intervalImg = setInterval(() => {
//       Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
//         setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
//         Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
//       });
//     }, 4000);

//     Animated.timing(inputAnim, { toValue: 1, duration: 800, delay: 500, useNativeDriver: true }).start();
//     return () => clearInterval(intervalImg);
//   }, []);

//   // --- RESTORED: Functions to Show/Hide Banner ---
//   const showError = (msg) => {
//     setErrorMessage(msg);
//     Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    
//     // Auto hide after 3 seconds
//     setTimeout(() => {
//       hideError();
//     }, 3000);
//   };

//   const hideError = () => {
//     Animated.timing(slideAnim, { toValue: -150, duration: 400, useNativeDriver: true }).start();
//   };

//   const handleGetOTP = async () => {
//     console.log("Button Pressed - Function Started"); 

//     // Hide previous error if any
//     hideError();

//     // --- VALIDATION: Shows on Screen AND Terminal ---
//     if (!employeeCode.trim()) {
//       console.log("❌ Validation Error: Please enter your Employee Code.");
//       showError("Please enter your Employee Code."); // Shows UI Banner
//       return;
//     }

//     console.log("Validation Passed. Setting Loading to TRUE.");
//     setLoading(true);

//     try {
//       const apiUrl = `${baseUrl}/agent/generate-otp/${employeeCode}`;
      
//       console.log("--- API CALL DETAILS ---");
//       console.log("URL:", apiUrl);

//       const response = await axios.post(apiUrl);

//       console.log("✅ SUCCESS - Response Received");
      
//       if (response.status === 200 || response.status === 201) {
//         navigation.navigate("LoginSecond", { employeeCode: employeeCode });
//       } else {
//         showError("Unexpected response from server.");
//       }

//     } catch (error) {
//       console.error("❌ ERROR CAUGHT");
//       let errMsg = "Network Error";
      
//       if (error.response) {
//         errMsg = error.response.data?.message || error.response.data?.error || "Server Error";
//       } else if (error.request) {
//         errMsg = "No internet connection";
//       } else {
//         errMsg = error.message;
//       }
      
//       console.error("Error details for terminal:", errMsg);
//       showError(errMsg); // Shows API error on screen as well
//     } finally {
//       console.log("Setting Loading to FALSE");
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" />
      
//       {/* --- RESTORED: STYLISH ERROR BANNER --- */}
//       <Animated.View style={[styles.errorBannerContainer, { transform: [{ translateY: slideAnim }] }]}>
//         <LinearGradient 
//           colors={['rgba(36,198,220,0.95)', 'rgba(24,58,93,0.98)']} 
//           start={{x: 0, y: 0}} 
//           end={{x: 1, y: 0}} 
//           style={styles.errorGradient}
//         >
//           <View style={styles.errorContentRow}>
//             <Image source={require('../assets/Group400.png')} style={styles.errorLogo} resizeMode="contain" />
//             <Text style={styles.errorText} numberOfLines={2}>
//               {errorMessage}
//             </Text>
//             <TouchableOpacity onPress={hideError} style={styles.errorCloseBtn}>
//               <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.8)" />
//             </TouchableOpacity>
//           </View>
//         </LinearGradient>
//       </Animated.View>

//       {/* --- BACKGROUND CONTENT --- */}
//       <Animated.Image source={backgroundImages[currentImageIndex]} style={[styles.bgImage, { opacity: fadeAnim }]} resizeMode="cover" />
//       <LinearGradient colors={['rgba(36,198,220,0.8)', 'rgba(24,58,93,0.9)']} style={styles.gradientOverlay} />

//       <SafeAreaView style={styles.safeArea}>
//         <KeyboardAvoidingView 
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           style={styles.keyboardContainer}
//           keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
//         >
//           <ScrollView 
//             contentContainerStyle={styles.scrollContent}
//             bounces={false}
//             keyboardShouldPersistTaps="handled"
//             enableOnAndroid={true} 
//           >
//             <Animated.View style={[styles.glassCard, { opacity: inputAnim, transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
//               <Image source={require('../assets/Group400.png')} style={styles.logo} resizeMode="contain" />
//               <Text style={styles.title}>Welcome Back{"\n"}<Text style={styles.brandText}>Mychits</Text></Text>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>Employee Code</Text>
//                 <View style={styles.inputContainer}>
//                   <Ionicons name="lock-closed" size={20} color="#5F6C7D" />
//                   <TextInput 
//                     style={styles.input} 
//                     placeholder="MCF-EMP-1011" 
//                     placeholderTextColor="#94A3B8" 
//                     autoCapitalize="characters" 
//                     value={employeeCode} 
//                     onChangeText={setEmployeeCode} 
//                   />
//                 </View>
//               </View>

//               <TouchableOpacity style={styles.btn} onPress={handleGetOTP} disabled={loading}>
//                 <LinearGradient colors={['#1C2E4A', '#5F6C7D']} style={styles.btnGradiant} start={{x:0, y:0}} end={{x:1, y:0}}>
//                   {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Get OTP</Text>}
//                 </LinearGradient>
//               </TouchableOpacity>

//               <Pressable onPress={() => navigation.navigate("Becomeanagent")} style={styles.linkContainer}>
//                 <Text style={styles.linkText}>Want to become an agent?</Text>
//               </Pressable>

//               <Pressable onPress={() => navigation.navigate("Register")} style={styles.signUpContainer}>
//                 <Text style={styles.footerText}>Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text></Text>
//               </Pressable>
//             </Animated.View>
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#183A5D' },
  
//   // --- RESTORED: Error Banner Styles ---
//   errorBannerContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100, // Sit on top of everything
//     paddingTop: Platform.OS === 'ios' ? 50 : 20, // Clear status bar area
//     paddingHorizontal: 15,
//   },
//   errorGradient: {
//     borderRadius: 15,
//     paddingVertical: 12,
//     paddingHorizontal: 15,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.4,
//     shadowRadius: 6,
//     elevation: 10,
//   },
//   errorContentRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   errorLogo: {
//     width: 35, 
//     height: 30, 
//     marginRight: 12,
//   },
//   errorText: {
//     flex: 1,
//     color: '#FFF',
//     fontSize: 15,
//     fontWeight: '600',
//   },
//   errorCloseBtn: {
//     marginLeft: 10,
//     padding: 2,
//   },

//   // --- Existing Styles ---
//   bgImage: { ...StyleSheet.absoluteFillObject },
//   gradientOverlay: { ...StyleSheet.absoluteFillObject },
//   safeArea: { flex: 1 },
//   keyboardContainer: { flex: 1 },
//   scrollContent: {
//     flexGrow: 1, 
//     justifyContent: 'center', 
//     padding: 20, 
//     minHeight: '100%'
//   },
//   glassCard: { 
//     backgroundColor: 'rgba(255, 255, 255, 0.95)', 
//     borderRadius: 30, 
//     padding: 25, 
//     alignItems: 'center', 
//     elevation: 10, 
//     shadowColor: '#000', 
//     shadowOpacity: 0.2, 
//     shadowRadius: 15,
//     width: '100%',
//     maxWidth: 400,
//     alignSelf: 'center'
//   },
//   logo: { width: 70, height: 60, marginBottom: 10 },
//   title: { fontSize: 24, fontWeight: '800', color: '#1C2E4A', textAlign: 'center', marginBottom: 20 },
//   brandText: { color: '#24C6DC' },
//   inputGroup: { width: '100%', marginBottom: 20 },
//   label: { fontSize: 14, fontWeight: '700', color: '#1C2E4A', marginBottom: 8, marginLeft: 5 },
//   inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#E2E8F0' },
//   input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1C2E4A' },
//   btn: { width: '100%', height: 55, borderRadius: 15, overflow: 'hidden', marginTop: 10 },
//   btnGradiant: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   btnText: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
//   linkContainer: { marginTop: 15 },
//   linkText: { color: '#1C2E4A', textDecorationLine: 'underline', fontWeight: '600' },
//   signUpContainer: { marginTop: 25, marginBottom: 10 }, 
//   footerText: { color: '#5F6C7D' },
//   signUpLink: { color: '#1C2E4A', fontWeight: 'bold', textDecorationLine: 'underline' }
// });



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
  ActivityIndicator,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import baseUrl from "../constants/baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

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

// Import the new image
const logoImage = require('../assets/Group400.png');

export default function Login({ navigation }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for background/UI animation
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const inputAnim = useRef(new Animated.Value(0)).current; // Animation for the form elements

  // 1. Background and Input Animations (Runs on component mount)
  useEffect(() => {
    // Background Image Cycling Animation
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

    // Form/Input Fade-in and Slide-up Animation (Start immediately)
    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 800,
      delay: 500, // Short delay to let the screen load
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

    setLoading(true);

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
        // Store user and agent info for future auto-login
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
      setLoading(false);
    }
  };

  // The full login screen is now rendered immediately
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
        colors={['#24C6DC', '#183A5D']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentWrapper}>
          {/* Logo */}
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

          {/* Become an agent? link */}
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
              disabled={loading}
            >
              <LinearGradient
                colors={[COLOR_PALETTE.primary, COLOR_PALETTE.secondary]}
                style={styles.loginButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Conditional rendering for loader */}
                {loading ? (
                  <ActivityIndicator color={COLOR_PALETTE.lightText} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Log in</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Don't have an account? Sign Up link */}
          

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF', // Fallback background
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
  logoContainer: {
    marginBottom: 1,
  },
  logo: {
    width: 80,
    height: 70,
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