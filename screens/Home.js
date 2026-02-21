
import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  Animated,
  ToastAndroid,
  ActivityIndicator,
  TextInput,
  Clipboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AgentContext } from "../context/AgentContextProvider";
import { useNetInfo } from "@react-native-community/netinfo";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

const { width } = Dimensions.get("window");

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D'];
const MODERN_PRIMARY = "#0d0d0eff";
const ACCENT_BLUE = "#1796d1ff";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#d8adad";
const HIGHLIGHT_GOLD = '#f5be6dff';
const REWARD_PURPLE = ["#6366f1", "#a855f7"];
const STAR_POINTS_GRADIENT = ["#FFD700", "#FFA500"]; 
const QR_CARD_GRADIENT = ['#24C6DC', '#183A5D'];

// Vibrant colors for the rotating border animation
const NEON_COLORS = ['#85f6b2', '#73a6d8', '#dc628d', '#c188e7', '#8cebb2'];

const ATTENDANCE_SUBMIT_URL = `${baseUrl}/employee-attendance/punch`;
const EMPLOYEE_DETAILS_URL = `${baseUrl}/employee`; 

const cardImagePaths = {
  attendence: require("../assets/ab.png"),
  collections: require("../assets/Collection2.png"),
  qrCode: require("../assets/upi_qr (1).png"),
  daybook: require("../assets/Daybook2.png"),
  targets: require("../assets/Target2.png"),
  myLeads: require("../assets/Lead1.png"),
  addCustomers: require("../assets/AddCutomer1.png"),
  myCustomers: require("../assets/Mycustomers1.png"),
  myTasks: require("../assets/Target2.png"),
  reports: require("../assets/Reports2.png"),
  commission: require("../assets/commissions1.png"),
  groups: require("../assets/groups1.png"),
  customerOnHold: require("../assets/Holdon2.png"),
  monthlyTurnover: require("../assets/MITB.png"),
  DueReportImage: require("../assets/dues.png"),
  LogOutImage: require("../assets/logout.png"),
  rewards: require("../assets/rewardsidea.png"),
  SalesReport: require("../assets/sales.png"),
};

const AttendanceModal = ({ attendanceLoading, visible, message, onClose, handleSubmitAttendance, note, setNote }) => {
  const scaleAnim = useState(new Animated.Value(0.5))[0];

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(0.5);
    }
  }, [visible]);

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.centeredView}>
        <Animated.View style={[modalStyles.modalView, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}><Text style={modalStyles.closeButtonText}>✕</Text></TouchableOpacity>
          <LinearGradient colors={[ACCENT_BLUE, ACCENT_BLUE]} style={modalStyles.iconHeader}>
             <Image source={cardImagePaths.attendence} style={{width: 60, height: 60}} resizeMode="contain" />
          </LinearGradient>
          <Text style={modalStyles.modalHeading}>Daily Status Check</Text>
          <Text style={modalStyles.modalText}>{message}</Text>
          
          <TextInput 
            style={modalStyles.inputField} 
            placeholder="Add a note (optional)..." 
            value={note} 
            onChangeText={setNote} 
            multiline 
          />
          
          <TouchableOpacity onPress={handleSubmitAttendance} style={{width: '100%'}}>
            <LinearGradient colors={[ACCENT_BLUE, ACCENT_BLUE]} style={modalStyles.markAttendanceButton}>
              {attendanceLoading ? <ActivityIndicator color="#fff" /> : <Text style={modalStyles.markAttendanceButtonText}>MARK PRESENT</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// --- COMPONENT: ANIMATED GRID CARD WITH COLOR ANIMATION ---
const AnimatedGridCard = ({ item, index, onPress, parentAnimStyle }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Floating Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // 2. Spinning Color Border Animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 4000, // 4 seconds for a full spin
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.boxCardWrapper, parentAnimStyle]}>
      <TouchableOpacity style={styles.boxCard} onPress={onPress} activeOpacity={0.7}>
        
        {/* --- COLORED ANIMATION CONTAINER --- */}
        <View style={styles.iconContainerRelative}>
          {/* 1. Rotating Gradient Ring (The Color Animation) */}
          <Animated.View style={[styles.rotatingRing, { transform: [{ rotate: spin }] }]}>
            <LinearGradient
              colors={NEON_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientStyle}
            />
          </Animated.View>

          {/* 2. Inner White Circle (Masks the center of the gradient) */}
          <View style={styles.iconCircle}>
            <Animated.Image 
              source={item.imagePath} 
              style={[styles.boxImage, { transform: [{ translateY }] }]} 
              resizeMode="contain" 
            />
          </View>
        </View>

        <Text style={styles.boxText}>{item.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedFullWidthCard = ({ item, onPress, parentAnimStyle }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const isStar = item.variant === 'star';
  const isReward = item.variant === 'reward';
  const isOverview = item.variant === 'overview';

  let gradientColors = [HIGHLIGHT_GOLD, HIGHLIGHT_GOLD];
  if (isReward) gradientColors = REWARD_PURPLE;
  if (isStar) gradientColors = STAR_POINTS_GRADIENT;

  return (
    <Animated.View key={item.id} style={[styles.fullWidthCardWrapper, parentAnimStyle]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <LinearGradient 
          colors={gradientColors} 
          style={[styles.fullWidthCard, isOverview && styles.centeredCard ]}
        >
          {!isOverview && (
            <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]} />
          )}

          {isOverview ? (
            <>
              <Image source={item.imagePath} style={[styles.fullWidthImage, { marginRight: 0, marginBottom: 8 }]} resizeMode="contain" />
              <View style={{alignItems: 'center'}}>
                <Text style={[styles.fullWidthText, { color: MODERN_PRIMARY }]}>{item.name}</Text>
                <Text style={{ color: TEXT_GREY, fontSize: 12, marginTop: 2 }}>Performance</Text>
              </View>
            </>
          ) : (
            <>
              {isStar ? (
                <View style={styles.starIconContainer}><Text style={{fontSize: 28}}>⭐</Text></View>
              ) : (
                <Image source={item.imagePath} style={styles.fullWidthImage} resizeMode="contain" />
              )}
              <View>
                <Text style={[styles.fullWidthText, { color: isReward ? '#fff' : MODERN_PRIMARY }]}>{item.name}</Text>
                <Text style={{ color: isReward ? 'rgba(255,255,255,0.8)' : TEXT_GREY, fontSize: 12, marginTop: 2 }}>
                  {isStar ? "Redeem rewards" : isReward ? "Claim points" : "Performance"}
                </Text>
              </View>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};


const Home = ({ route, navigation }) => {
  const { user = {}, agentInfo = {} } = route.params || {};
  const [agent, setAgent] = useState(agentInfo || {});
  const { setModifyPayment } = useContext(AgentContext);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [note, setNote] = useState("");
  const netInfo = useNetInfo();

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (user?.userId && netInfo.isConnected) {
        try {
          const response = await axios.get(`${EMPLOYEE_DETAILS_URL}/get-employee/${user.userId}`);
          if (response.data) {
            setAgent(response.data);
            if (response.data?.designation_id?.permission) {
              setModifyPayment(response.data.designation_id.permission.modify_payments === "true");
            }
          }
        } catch (error) {
          console.log("Error fetching agent details.");
        }
      }
    };
    fetchAgentDetails();
  }, [user?.userId, netInfo.isConnected]);

  useEffect(() => {
    const checkAttendance = async () => {
      if (user.userId && netInfo.isConnected) {
        try {
          const response = await axios.post(`${baseUrl}/employee-attendance/modal`, { employee_id: user.userId });
          if (response.data?.showModal === true) {
            setAttendanceMessage(response.data.message || "Please mark your attendance");
            setShowAttendanceModal(true);
          }
        } catch (error) {
          console.log("Attendance check failed");
        }
      }
    };
    checkAttendance();
  }, [user.userId, netInfo.isConnected]);

  const cardsData = [
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "collections", name: "Collections", imagePath: cardImagePaths.collections,
      onPress: () => navigation.navigate("PaymentNavigator"), backgroundColor: CARD_BG,
    },
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "qrCode", name: "QR Code", imagePath: cardImagePaths.qrCode,
      onPress: () => navigation.navigate("qrCode"), backgroundColor: CARD_BG,
    },
     agentInfo?.designation_id?.permission?.daybook === "true" && {
      id: "daybook", name: "Daybook", imagePath: cardImagePaths.daybook,
      onPress: () => navigation.navigate("PayNavigation", { user }), backgroundColor: CARD_BG,
    },
    {
      id: "commission", name: "My Overview", imagePath: cardImagePaths.commission,
      onPress: () => navigation.navigate("Commissions", { user }),
      isFullWidth: true, variant: 'overview'
    },
    agentInfo?.designation_id?.permission?.reports === "true" && {
      id: "reports", name: "Reports", imagePath: cardImagePaths.reports,
      onPress: () => navigation.navigate("PayNavigation", { screen: "Reports", params: { user } }), backgroundColor: CARD_BG,
    },
    agentInfo?.designation_id?.permission?.targets === "true" && {
      id: "targets", name: "Targets", imagePath: cardImagePaths.targets,
      onPress: () => navigation.navigate("Target"), backgroundColor: CARD_BG,
    },
    agentInfo?.designation_id?.permission?.leads === "true" && {
      id: "myLeads", name: "My Leads", imagePath: cardImagePaths.myLeads,
      onPress: () => navigation.navigate("PayNavigation", { screen: "ViewLeads", params: { user } }), backgroundColor: CARD_BG,
    },
    {
      id: "addCustomers", name: "Add Customers", imagePath: cardImagePaths.addCustomers,
      onPress: () => navigation.navigate("CustomerNavigation", { screen: "Customer", params: { user } }), backgroundColor: CARD_BG,
    },
    {
      id: "myCustomers", name: "My Customers", imagePath: cardImagePaths.myCustomers,
      onPress: () => navigation.navigate("CustomerNavigation", { screen: "ViewEnrollments", params: { user } }), backgroundColor: CARD_BG,
    },
     {
      id: "myTasks", name: "My Tasks", imagePath: cardImagePaths.myTasks,
      onPress: () => navigation.navigate("MyTasks", { employeeId: user.userId, agentName: agent.name }), backgroundColor: CARD_BG,
    },
    {
      id: "groups", name: "Groups", imagePath: cardImagePaths.groups,
      onPress: () => navigation.navigate("Enrollment", { screen: "Enrollment", params: { user } }), backgroundColor: CARD_BG,
    },
     {
      id: "LogOut", name: "Attendance", imagePath: cardImagePaths.LogOutImage,
      onPress: () => navigation.navigate("LogOut", { employeeId: user.userId, agentName: agent.name }), backgroundColor: CARD_BG,
    },
    {
      id: "monthlyTurnover", name: "MIT", imagePath: cardImagePaths.monthlyTurnover,
      onPress: () => navigation.navigate("MonthlyTurnover"), backgroundColor: CARD_BG,
    },
       {
      id: "DueReport", name: "Outstanding Reports", imagePath: cardImagePaths.DueReportImage,
      onPress: () => navigation.navigate("PayNavigation", { screen: "Due", params: { user } }), backgroundColor: CARD_BG,
    },
       {
      id: "customerOnHold", name: "Holded Customers", imagePath: cardImagePaths.customerOnHold,
      onPress: () => navigation.navigate("CustomerOnHold"), backgroundColor: CARD_BG,
    },
    {
      id: "SalesReport", name: "Sales Report", imagePath: cardImagePaths.SalesReport,
      onPress: () => navigation.navigate("SalesReport", { employeeId: user.userId, agentName: agent.name }), backgroundColor: CARD_BG,
    },
    {
      id: "rewards", name: "My Rewards", imagePath: cardImagePaths.rewards,
      onPress: () => navigation.navigate("Rewards"),
      isFullWidth: true, variant: 'reward'
    },
    {
      id: "starPoints", name: "Star Points",
      onPress: () => navigation.navigate("StarPoints"),
      isFullWidth: true, variant: 'star'
    },
  ].filter(Boolean);

  const cardAnims = useRef(cardsData.map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    if (cardsData.length > 0) {
       Animated.stagger(
         80,
         cardAnims.map(anim => 
           Animated.spring(anim, { 
             toValue: 1, 
             friction: 7, 
             tension: 40, 
             useNativeDriver: true 
           })
         )
       ).start();
    }
  }, [cardsData.length]);

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    ToastAndroid.show("UPI ID Copied!", ToastAndroid.SHORT);
  };

  const handleSubmitAttendance = async () => {
    setAttendanceLoading(true);
    try {
      await axios.post(ATTENDANCE_SUBMIT_URL, { 
        employee_id: user?.userId, 
        status: "Present", 
        type: "in", 
        note 
      });
      ToastAndroid.show("Attendance Marked", ToastAndroid.SHORT);
      setShowAttendanceModal(false);
    } catch (e) { 
      ToastAndroid.show("Failed to mark attendance", ToastAndroid.SHORT);
    }
    setAttendanceLoading(false);
  };

  return (
    <LinearGradient colors={TOP_GRADIENT} style={{ flex: 1 }}>
      <View style={styles.mainContentArea}>
        <Header />
        <View style={styles.introSection}>
          <Text style={styles.welcomeText}>Hello {agent.name || "Agent"},</Text>
          <Text style={styles.questionText}>Welcome to MyChits</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={styles.cardsGridContainer}>
            {cardsData.map((item, index) => {
              const translateY = cardAnims[index]?.interpolate({inputRange: [0, 1], outputRange: [40, 0]}) || 0;
              const scale = cardAnims[index]?.interpolate({inputRange: [0, 1], outputRange: [0.8, 1]}) || 1;
              const animStyle = { opacity: cardAnims[index], transform: [{ translateY }, { scale }] };

              if (item.isFullWidth) {
                return (
                   <AnimatedFullWidthCard 
                     key={item.id}
                     item={item}
                     onPress={item.onPress}
                     parentAnimStyle={animStyle}
                   />
                );
              }

              return (
                <AnimatedGridCard 
                  key={item.id}
                  item={item}
                  index={index}
                  onPress={item.onPress}
                  parentAnimStyle={animStyle}
                />
              );
            })}
          </View>

          <View style={styles.qrContainer}>
            <LinearGradient colors={QR_CARD_GRADIENT} style={styles.qrCardMain}>
              <View style={styles.qrHeaderRow}>
                <Text style={styles.qrTitleText}>Business QR</Text>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>MyChits Pay</Text>
                </View>
              </View>
              <View style={styles.qrWhiteBox}>
                <Image source={require("../assets/upi_qr (1).png")} style={styles.qrImage} resizeMode="contain" />
              </View>
              <TouchableOpacity onPress={() => copyToClipboard("mychits@kotak")} style={styles.upiBadge}>
                <Text style={styles.upiText}>mychits@kotak</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </View>
      
      <AttendanceModal 
        visible={showAttendanceModal} 
        message={attendanceMessage} 
        onClose={() => setShowAttendanceModal(false)} 
        handleSubmitAttendance={handleSubmitAttendance} 
        note={note} 
        setNote={setNote} 
        attendanceLoading={attendanceLoading} 
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContentArea: { flex: 1, marginHorizontal: 20, marginTop: 40 },
  introSection: { marginBottom: 25, paddingHorizontal: 5 },
  welcomeText: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  questionText: { fontSize: 16, color: "rgba(255,255,255,0.85)" },
  cardsGridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  
  boxCardWrapper: { 
    width: (width - 70) / 3, 
    height: (width - 70) / 3, 
    marginBottom: 18 
  },
  boxCard: { 
    flex: 1, 
    borderRadius: 22, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)', 
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },

  // --- NEW STYLES FOR COLORED ANIMATION ---
  iconContainerRelative: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  rotatingRing: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 28,
    padding: 2, // Acts as the border thickness
  },
  gradientStyle: {
    flex: 1,
    borderRadius: 28,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff', // White background to cover the center
    justifyContent: 'center',
    alignItems: 'center',
    // Add a subtle shadow to lift it off the gradient
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  boxImage: { 
    width: 30, 
    height: 30, 
  },
  boxText: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: MODERN_PRIMARY, 
    textAlign: 'center' 
  },

  fullWidthCardWrapper: { width: "100%", marginBottom: 18 },
  fullWidthCard: { 
    borderRadius: 22, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    elevation: 6,
    overflow: 'hidden'
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ skewX: '-20deg' }]
  },
  centeredCard: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 22
  },
  fullWidthImage: { width: 45, height: 45, marginRight: 15 },
  fullWidthText: { fontSize: 18, fontWeight: "bold" },
  starIconContainer: { 
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 3 
  },
  qrContainer: { marginTop: 15 },
  qrCardMain: { borderRadius: 30, padding: 25, alignItems: 'center', elevation: 10 },
  qrHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  qrTitleText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  brandBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  brandBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  qrWhiteBox: { backgroundColor: '#fff', padding: 10, borderRadius: 20 },
  qrImage: { width: 160, height: 160 },
  upiBadge: { marginTop: 15, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  upiText: { color: '#fff', fontWeight: 'bold' }
});

const modalStyles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  modalView: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: "85%", alignItems: "center", overflow: 'hidden' },
  iconHeader: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15, marginTop: -60 },
  modalHeading: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: MODERN_PRIMARY },
  modalText: { textAlign: "center", marginBottom: 20, color: TEXT_GREY },
  inputField: { width: "100%", borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 12, height: 70, marginBottom: 20, textAlignVertical: 'top' },
  markAttendanceButton: { padding: 15, borderRadius: 12, alignItems: 'center', width: '100%' },
  markAttendanceButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeButton: { position: 'absolute', top: 10, right: 15 },
  closeButtonText: { fontSize: 20, color: TEXT_GREY }
});

export default Home;
