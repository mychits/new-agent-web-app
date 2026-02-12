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
  Easing,
  ToastAndroid,
  ActivityIndicator,
  TextInput,
  Clipboard,
} from "react-native";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { AgentContext } from "../context/AgentContextProvider";
import { useNetInfo } from "@react-native-community/netinfo";

const { width } = Dimensions.get("window");

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D'];
const MODERN_PRIMARY = "#0d0d0eff";
const ACCENT_BLUE = "#1796d1ff";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb';
const HIGHLIGHT_GOLD = '#f5be6dff';
const REWARD_PURPLE = ["#6366f1", "#a855f7"]; 

// NEW STYLISH BLUE THEME
const QR_CARD_GRADIENT = ['#24C6DC', '#183A5D']; 

const ATTENDANCE_SUBMIT_URL = `${baseUrl}/employee-attendance/punch`;

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
};

const AttendanceModal = ({
  attendanceLoading,
  selectedStatus,
  visible,
  message,
  onClose,
  handleSubmitAttendance,
  note,
  setNote,
}) => {
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const scaleAnim = useState(new Animated.Value(0.5))[0];

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.5);
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }).start();
      setIsNoteOpen(false);
      setNote("");
    }
  }, [visible]);

  const animatedImageStyle = { transform: [{ scale: scaleAnim }] };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Text style={modalStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <LinearGradient colors={[ACCENT_BLUE, ACCENT_BLUE]} style={modalStyles.iconHeader}>
            <Animated.Image source={cardImagePaths.attendence} style={[modalStyles.modalImage, animatedImageStyle]} resizeMode="contain" />
          </LinearGradient>
          <Text style={modalStyles.modalHeading}>Daily Status Check</Text>
          <Text style={modalStyles.modalText}>{message}</Text>
          <TouchableOpacity style={modalStyles.accordionHeader} onPress={() => setIsNoteOpen(!isNoteOpen)}>
            <Text style={modalStyles.noteLabel}>{isNoteOpen ? 'Hide Note' : 'Add a Note (Optional)'}</Text>
            <Text style={modalStyles.arrowIcon}>{isNoteOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {isNoteOpen && (
            <View style={modalStyles.accordionContent}>
              <TextInput style={modalStyles.inputField} placeholder="e.g., Working remotely..." value={note} onChangeText={setNote} multiline />
            </View>
          )}
          <TouchableOpacity disabled={!selectedStatus || attendanceLoading} onPress={handleSubmitAttendance} style={modalStyles.markAttendanceButtonWrapper}>
            <LinearGradient colors={!selectedStatus ? [BORDER_COLOR, BORDER_COLOR] : [ACCENT_BLUE, ACCENT_BLUE]} style={modalStyles.markAttendanceButton}>
              {attendanceLoading ? <ActivityIndicator size="small" color={CARD_BG} /> : <Text style={modalStyles.markAttendanceButtonText}>PRESENT</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Home = ({ route, navigation }) => {
  const { user = {}, agentInfo = {} } = route.params || {};
  const [agent, setAgent] = useState({});
  const [selectedStatus] = useState("Present");
  const { setModifyPayment } = useContext(AgentContext);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const netInfo = useNetInfo();
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [note, setNote] = useState("");
  const cardAnimations = useRef([]);
  const hasAnimated = useRef(false);

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    ToastAndroid.show("UPI ID Copied!", ToastAndroid.SHORT);
  };

  const cardsData = [
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "collections",
      name: "Collections",
      imagePath: cardImagePaths.collections,
      onPress: () => navigation.navigate("PaymentNavigator"),
      backgroundColor: SUBTLE_BG_GREY,
    },
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "qrCode",
      name: "QR Code",
      imagePath: cardImagePaths.qrCode,
      onPress: () => navigation.navigate("qrCode"),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "commission",
      name: "My Overview",
      imagePath: cardImagePaths.commission,
      onPress: () => navigation.navigate("Commissions", { user }),
      backgroundColor: HIGHLIGHT_GOLD,
    },
    // --- NEW REWARDS CARD ---
  
    agentInfo?.designation_id?.permission?.daybook === "true" && {
      id: "daybook",
      name: "Daybook",
      imagePath: cardImagePaths.daybook,
      onPress: () => navigation.navigate("PayNavigation", { user }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    agentInfo?.designation_id?.permission?.reports === "true" && {
      id: "reports",
      name: "Reports",
      imagePath: cardImagePaths.reports,
      onPress: () => navigation.navigate("PayNavigation", { screen: "Reports", params: { user } }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    agentInfo?.designation_id?.permission?.targets === "true" && {
      id: "targets",
      name: "Targets",
      imagePath: cardImagePaths.targets,
      onPress: () => navigation.navigate("Target"),
      backgroundColor: SUBTLE_BG_GREY,
    },
    agentInfo?.designation_id?.permission?.leads === "true" && {
      id: "myLeads",
      name: "My Leads",
      imagePath: cardImagePaths.myLeads,
      onPress: () => navigation.navigate("PayNavigation", { screen: "ViewLeads", params: { user } }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "addCustomers",
      name: "Add Customers",
      imagePath: cardImagePaths.addCustomers,
      onPress: () => navigation.navigate("CustomerNavigation", { screen: "Customer", params: { user } }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "myCustomers",
      name: "My Customers",
      imagePath: cardImagePaths.myCustomers,
      onPress: () => navigation.navigate("CustomerNavigation", { screen: "ViewEnrollments", params: { user } }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "customerOnHold",
      name: "Holded Customers",
      imagePath: cardImagePaths.customerOnHold,
      onPress: () => navigation.navigate("CustomerOnHold"),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "myTasks",
      name: "My Tasks",
      imagePath: cardImagePaths.myTasks,
      onPress: () => navigation.navigate("MyTasks", { employeeId: user.userId, agentName: agent.name }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "groups",
      name: "Groups",
      imagePath: cardImagePaths.groups,
      onPress: () => navigation.navigate("Enrollment", { screen: "Enrollment", params: { user } }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "monthlyTurnover",
      name: "Monthly Turnover",
      imagePath: cardImagePaths.monthlyTurnover,
      onPress: () => navigation.navigate("MonthlyTurnover"),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "DueReport",
      name: "Outstanding Reports",
      imagePath: cardImagePaths.DueReportImage,
      onPress: () => navigation.navigate("PayNavigation", { screen: "Due", params: { user } }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "LogOut",
      name: "Attendence",
      imagePath: cardImagePaths.LogOutImage,
      onPress: () => navigation.navigate("LogOut", { employeeId: user.userId, agentName: agent.name }),
      backgroundColor: SUBTLE_BG_GREY,
    },
      {
      id: "rewards",
      name: "My Rewards",
      imagePath: cardImagePaths.rewards,
      onPress: () => navigation.navigate("Rewards"), // Ensure this screen exists in your Navigator
      isReward: true,
    },
  ].filter(Boolean);

  if (cardAnimations.current.length !== cardsData.length) {
    cardAnimations.current = cardsData.map((_, i) => cardAnimations.current[i] || new Animated.Value(0));
  }

  useEffect(() => {
    if (cardsData.length > 0 && netInfo.isConnected && !hasAnimated.current) {
      const animations = cardAnimations.current.map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        });
      });
      Animated.stagger(10, animations).start(() => { hasAnimated.current = true; });
    }
  }, [cardsData.length, netInfo.isConnected]);

  const handleSubmitAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const response = await axios.post(ATTENDANCE_SUBMIT_URL, {
        employee_id: user?.userId,
        status: "Present",
        method: "No Auth",
        type: "in",
        note: note,
      });
      ToastAndroid.show(response?.data?.message || "Attendance Marked Successfully", ToastAndroid.SHORT);
    } catch (error) {
      ToastAndroid.show("Failed to Mark Attendance", ToastAndroid.SHORT);
    } finally {
      setAttendanceLoading(false);
      setShowAttendanceModal(false);
      setNote("");
    }
  };

  useEffect(() => {
    if (agentInfo?.designation_id?.permission) {
      setModifyPayment(agentInfo.designation_id.permission.modify_payments === "true");
    }
  }, [agentInfo, setModifyPayment]);

  useEffect(() => {
    const fetchAgent = async () => {
      if (user?.userId && netInfo.isConnected) {
        try {
          const response = await axios.get(`${baseUrl}/agent/get-agent-by-id/${user.userId}`);
          if (response.data) setAgent(response.data);
        } catch (error) {
          console.error("Error fetching agent data:", error.message);
        }
      }
    };
    fetchAgent();
  }, [user.userId, netInfo.isConnected]);

  useEffect(() => {
    const checkAttendance = async () => {
      if (user.userId && netInfo.isConnected) {
        try {
          const response = await axios.post(`${baseUrl}/employee-attendance/modal`, { employee_id: user.userId });
          if (response.data?.showModal === true) {
            setAttendanceMessage(response.data.message || "Eligible to mark attendance");
            setShowAttendanceModal(true);
          }
        } catch (error) {
          setShowAttendanceModal(false);
        }
      }
    };
    checkAttendance();
  }, [user.userId, netInfo.isConnected]);

  return (
    <LinearGradient colors={TOP_GRADIENT} style={{ flex: 1 }}>
      <View style={styles.mainContentArea_noSafeArea}>
        <Header />
        <View style={styles.introSection}>
          <Text style={styles.welcomeText}>Hello {agent.name || "Agent"},</Text>
          <Text style={styles.questionText}>Welcome to MyChits Agent App</Text>
        </View>

        {!user.userId ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
          </View>
        ) : netInfo.isConnected === false ? (
          <View style={styles.noInternetContainer}>
            <Image source={require("../assets/Nointernetp.png")} style={styles.noInternetImage} resizeMode="contain" />
            <Text style={styles.noInternetText}>Oops! No internet connection.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.cardsScrollViewContent} showsVerticalScrollIndicator={false}>
            <View style={styles.cardsGridContainer}>
              {cardsData.map((card, index) => {
                const scale = cardAnimations.current[index].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
                const translateY = cardAnimations.current[index].interpolate({ inputRange: [0, 1], outputRange: [50, 0] });
                const animatedStyle = { opacity: cardAnimations.current[index], transform: [{ scale }, { translateY }] };
                
                const isOverviewCard = card.id === "commission";
                const isRewardCard = card.id === "rewards";

                // Special handling for Full Width Cards (Overview & Rewards)
                if (isOverviewCard || isRewardCard) {
                  return (
                    <Animated.View key={card.id} style={[styles.bigCardWrapper, animatedStyle]}>
                      <TouchableOpacity onPress={card.onPress} activeOpacity={0.8} style={{ flex: 1 }}>
                        <LinearGradient 
                          colors={isRewardCard ? REWARD_PURPLE : [card.backgroundColor, card.backgroundColor]} 
                          style={[styles.bigCardStyle, isRewardCard && styles.rewardCardShadow]}
                        >
                          <Image source={card.imagePath} style={styles.bigCardImage} resizeMode="contain" />
                          <View>
                             <Text style={styles.bigCardText}>{card.name}</Text>
                             {isRewardCard && <Text style={styles.rewardSubText}>Claim your points</Text>}
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }

                return (
                  <Animated.View key={card.id} style={[styles.gridCardWrapper, animatedStyle]}>
                    <TouchableOpacity style={[styles.gridCard, { backgroundColor: card.backgroundColor }]} onPress={card.onPress} activeOpacity={0.7}>
                      <Image source={card.imagePath} style={styles.cardImage} resizeMode="contain" />
                      <Text style={styles.gridCardText}>{card.name}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {/* --- STYLISH ROYAL BLUE QR SECTION --- */}
            <View style={styles.phonePeQrContainer}>
              <LinearGradient colors={QR_CARD_GRADIENT} style={styles.qrCardMain}>
                <View style={styles.qrHeaderRow}>
                  <Text style={styles.qrTitleText}>Business QR</Text>
                  <View style={styles.brandBadge}>
                    <Text style={styles.brandBadgeText}>MyChits Pay</Text>
                  </View>
                </View>

                <View style={styles.qrImageContainer}>
                  <Image
                    source={require("../assets/upi_qr (1).png")}
                    style={styles.qrDisplayImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.upiInfoWrapper}>
                  <Text style={styles.upiLabel}>Accept payments via UPI</Text>
                  <TouchableOpacity 
                    onPress={() => copyToClipboard("mychits@kotak")}
                    style={styles.upiCopyRow}
                  >
                    <Text style={styles.qrUpiText}>mychits@kotak</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate("qrCode")}
                  style={styles.viewDetailsBtn}
                >
                  <Text style={styles.viewDetailsBtnText}>VIEW FULL DETAILS</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </ScrollView>
        )}
      </View>
      <AttendanceModal attendanceLoading={attendanceLoading} selectedStatus="Present" visible={showAttendanceModal} message={attendanceMessage} onClose={() => setShowAttendanceModal(false)} handleSubmitAttendance={handleSubmitAttendance} note={note} setNote={setNote} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContentArea_noSafeArea: { flex: 1, marginHorizontal: 22, marginTop: 40 },
  introSection: { marginTop: 20, marginBottom: 20, paddingHorizontal: 5 },
  welcomeText: { fontSize: 20, fontWeight: "bold", color: MODERN_PRIMARY, marginBottom: 5 },
  questionText: { fontSize: 17, fontWeight: "600", color: TEXT_GREY, marginBottom: 10 },
  
  // Full Width Card Styles
  bigCardWrapper: { width: "100%", height: 110, marginBottom: 20 },
  bigCardStyle: { 
    flex: 1, 
    flexDirection: 'row', 
    borderRadius: 20, 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  rewardCardShadow: { elevation: 12, shadowColor: REWARD_PURPLE[1], shadowOpacity: 0.4, shadowRadius: 10 },
  bigCardImage: { width: 70, height: 70, marginRight: 20 },
  bigCardText: { fontSize: 22, fontWeight: "900", color: CARD_BG },
  rewardSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },

  cardsScrollViewContent: { paddingBottom: 50 },
  cardsGridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 10 },
  gridCardWrapper: { width: (width - 22 * 2 - 20) / 2, height: (width - 22 * 2 - 20) / 2, marginBottom: 20 },
  gridCard: { flex: 1, borderRadius: 15, elevation: 8, borderWidth: 1, borderColor: BORDER_COLOR, justifyContent: "center", alignItems: "center", padding: 5 },
  cardImage: { width: 100, height: 70 },
  gridCardText: { fontSize: 15, fontWeight: "600", color: MODERN_PRIMARY, textAlign: "center", marginTop: 5 },
  
  noInternetContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  noInternetImage: { width: 200, height: 200 },
  noInternetText: { fontSize: 20, fontWeight: "bold", color: MODERN_PRIMARY, marginTop: 20 },

  phonePeQrContainer: {
    marginTop: 25,
    marginBottom: 40,
    paddingHorizontal: 2,
  },
  qrCardMain: {
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    elevation: 15,
  },
  qrHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  brandBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  brandBadgeText: {
    color: '#fff', 
    fontSize: 11,
    fontWeight: 'bold',
  },
  qrImageContainer: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 24,
    marginBottom: 20,
    elevation: 5,
  },
  qrDisplayImage: {
    width: width * 0.5,
    height: width * 0.5,
  },
  upiInfoWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  upiLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  upiCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qrUpiText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewDetailsBtn: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    paddingTop: 18,
    alignItems: 'center',
  },
  viewDetailsBtnText: {
    color: HIGHLIGHT_GOLD,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

const modalStyles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.6)" },
  modalView: { backgroundColor: CARD_BG, borderRadius: 15, padding: 30, alignItems: "center", width: "90%", elevation: 10, marginTop: 50, borderWidth: 2, borderColor: BORDER_COLOR },
  iconHeader: { width: 120, height: 120, borderRadius: 60, justifyContent: "center", alignItems: "center", marginBottom: 20, marginTop: -80, elevation: 10 },
  modalImage: { width: 85, height: 65 },
  modalHeading: { fontSize: 26, fontWeight: "900", color: MODERN_PRIMARY, marginBottom: 5 },
  modalText: { textAlign: "center", fontSize: 16, fontWeight: "500", color: TEXT_GREY, lineHeight: 22, marginBottom: 25 },
  closeButton: { position: "absolute", top: 15, right: 15, padding: 5, zIndex: 10 },
  closeButtonText: { fontSize: 28, fontWeight: "300", color: TEXT_GREY },
  accordionHeader: { width: "100%", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, backgroundColor: SUBTLE_BG_GREY, borderRadius: 8, borderWidth: 1, borderColor: BORDER_COLOR },
  noteLabel: { fontSize: 14, fontWeight: '600', color: MODERN_PRIMARY },
  arrowIcon: { fontSize: 16, color: ACCENT_BLUE, fontWeight: '900' },
  accordionContent: { width: "100%", marginTop: 8, marginBottom: 10 },
  inputField: { width:"100%", minHeight: 90, borderColor: BORDER_COLOR, borderWidth: 1, borderRadius: 8, padding: 15, fontSize: 16, color: MODERN_PRIMARY, textAlignVertical: 'top' },
  markAttendanceButtonWrapper: { width: "100%", marginTop: 30, borderRadius: 10, overflow: "hidden", elevation: 10 },
  markAttendanceButton: { paddingVertical: 18, alignItems: "center" },
  markAttendanceButtonText: { color: CARD_BG, fontWeight: "bold", fontSize: 19, letterSpacing: 1 },
});

export default Home;
























// import React, { useEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   Dimensions,
//   Linking,
//   Animated,
//   StatusBar,
//   Image,
//   Platform,
//   Modal,
//   Pressable,
//   ActivityIndicator,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import {
//   Ionicons,
//   FontAwesome5,
//   MaterialIcons,
//   MaterialCommunityIcons,
//   Feather,
//   FontAwesome,
// } from "@expo/vector-icons";

// const { width } = Dimensions.get("window");

// // --- CONSTANTS ---
// const TOP_GRADIENT = ["#24C6DC", "#183A5D"];
// const COLORS = {
//   primary: "#18585d",
//   accent: "#FF6F00",
//   bgLight: "#F8FAFC",
//   success: "#2E7D32",
//   white: "#FFFFFF",
//   muted: "#666666",
//   danger: "#E53935",
// };

// const SlantLine = ({ delay = 0, opacity = 0.05 }) => {
//   const translateX = useRef(new Animated.Value(-300)).current;
//   useEffect(() => {
//     const animate = () => {
//       Animated.timing(translateX, {
//         toValue: width + 300,
//         duration: 5000,
//         delay,
//         useNativeDriver: true,
//       }).start(() => {
//         translateX.setValue(-300);
//         animate();
//       });
//     };
//     animate();
//   }, []);

//   return (
//     <Animated.View
//       style={[
//         styles.slantLine,
//         { opacity, transform: [{ translateX }, { rotate: "25deg" }] },
//       ]}
//     />
//   );
// };

// export default function PendingApproval({ navigation }) {
//   const [profileVisible, setProfileVisible] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);
  
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(30)).current;
//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   const startAnimations = () => {
//     // Reset values first
//     fadeAnim.setValue(0);
//     slideAnim.setValue(30);

//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(pulseAnim, {
//             toValue: 1.03,
//             duration: 1500,
//             useNativeDriver: true,
//           }),
//           Animated.timing(pulseAnim, {
//             toValue: 1,
//             duration: 1500,
//             useNativeDriver: true,
//           }),
//         ])
//       ),
//     ]).start();
//   };

//   useEffect(() => {
//     startAnimations();
//   }, []);

//   const handleRefresh = () => {
//     setIsRefreshing(true);

//     // Simulate an API call / Status Check
//     setTimeout(() => {
//       setIsRefreshing(false);
//       startAnimations(); // Re-run animations to show the "refresh" effect
//     }, 1500);
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar
//         barStyle="light-content"
//         translucent
//         backgroundColor="transparent"
//       />

//       {/* --- CENTERED PROFILE MODAL --- */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={profileVisible}
//         onRequestClose={() => setProfileVisible(false)}
//       >
//         <Pressable
//           style={styles.modalOverlay}
//           onPress={() => setProfileVisible(false)}
//         >
//           <View style={styles.profilePopup}>
//             <View style={styles.popupHeader}>
//               <View style={styles.avatarCircle}>
//                 <FontAwesome5
//                   name="user-shield"
//                   size={30}
//                   color={COLORS.primary}
//                 />
//               </View>
//               <Text style={styles.popupName}>Agent Profile</Text>
//               <View style={styles.statusBadge}>
//                 <View style={styles.pulseDot} />
//                 <Text style={styles.statusBadgeText}>Pending Approval</Text>
//               </View>
//             </View>

//             <View style={styles.popupInfoBox}>
//               <Text style={styles.popupInfoTitle}>Application Status</Text>
//               <Text style={styles.popupInfoDesc}>
//                 We are currently verifying your credentials. You will get full
//                 access once approved.
//               </Text>
//             </View>

//             <TouchableOpacity
//               style={styles.logoutBtn}
//               onPress={() => {
//                 setProfileVisible(false);
//                 // navigation.replace("Login");
//               }}
//             >
//               <LinearGradient
//                 colors={["#FF5252", "#D32F2F"]}
//                 style={styles.logoutGradient}
//               >
//                 <Ionicons name="log-out-outline" size={20} color="#FFF" />
//                 <Text style={styles.logoutBtnText}>Logout</Text>
//               </LinearGradient>
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => setProfileVisible(false)}
//               style={styles.closeBtn}
//             >
//               <Text style={styles.closeBtnText}>Go Back</Text>
//             </TouchableOpacity>
//           </View>
//         </Pressable>
//       </Modal>

//       {/* --- HEADER --- */}
//       <LinearGradient colors={TOP_GRADIENT} style={styles.headerGradient}>
//         <SlantLine delay={0} opacity={0.1} />
//         <SlantLine delay={2000} opacity={0.08} />

//         <SafeAreaView style={styles.safeArea}>
//           <View style={styles.headerNav}>
//             <View style={styles.logoGroup}>
//               {/* Note: Ensure the path to your assets is correct */}
//               <Image
//                 source={require("../assets/Group400.png")}
//                 style={styles.logo}
//                 resizeMode="contain"
//               />
//               <Text style={styles.brandText}>MyChits</Text>
//             </View>

//             <TouchableOpacity
//               style={styles.glassBtn}
//               onPress={() => setProfileVisible(true)}
//             >
//               <FontAwesome5 name="user-circle" size={22} color="#FFF" />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.headerInfo}>
//             <View style={styles.regBadge}>
//               <FontAwesome5 name="shield-alt" size={10} color="#FFF" />
//               <Text style={styles.regBadgeText}>SECURE VERIFICATION</Text>
//             </View>
//             <Text style={styles.mainTitle}>Onboarding in Progress</Text>
//             <Text style={styles.subTitle}>
//               Hello! We're reviewing your agent application.
//             </Text>
//           </View>
//         </SafeAreaView>
//       </LinearGradient>

//       <View style={styles.body}>
//         <Animated.ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContent}
//           style={{
//             opacity: fadeAnim,
//             transform: [{ translateY: slideAnim }],
//           }}
//         >
//           {/* 1. STATUS PROGRESS CARD */}
//           <Animated.View
//             style={[styles.mainCard, { transform: [{ scale: pulseAnim }] }]}
//           >
//             <View style={styles.cardHeader}>
//               <View>
//                 <Text style={styles.labelSmall}>CURRENT PROGRESS</Text>
//                 <Text style={styles.statusValue}>30% Complete</Text>
//               </View>
//               <View style={styles.activeBadge}>
//                 <MaterialCommunityIcons
//                   name="clock-fast"
//                   size={16}
//                   color={COLORS.accent}
//                 />
//                 <Text style={styles.activeBadgeText}> Review</Text>
//               </View>
//             </View>

//             <View style={styles.progressBarBg}>
//               <LinearGradient
//                 colors={[COLORS.accent, "#FFD54F"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={[styles.progressBarFill, { width: "35%" }]}
//               />
//             </View>
//             <Text style={styles.statusHint}>
//               Estimated approval: Within 12-24 hours
//             </Text>
//           </Animated.View>

//           {/* 2. TRUST BAR */}
//           <View style={styles.trustBarContainer}>
//             <View style={styles.trustItem}>
//               <Ionicons
//                 name="shield-checkmark"
//                 size={20}
//                 color={COLORS.success}
//               />
//               <Text style={styles.trustText}>100% Secure</Text>
//             </View>
//             <View style={styles.trustDivider} />
//             <View style={styles.trustItem}>
//               <FontAwesome5
//                 name="file-contract"
//                 size={18}
//                 color={COLORS.primary}
//               />
//               <Text style={styles.trustText}>Govt Regd.</Text>
//             </View>
//             <View style={styles.trustDivider} />
//             <View style={styles.trustItem}>
//               <FontAwesome5 name="university" size={18} color={COLORS.accent} />
//               <Text style={styles.trustText}>Bank Grade</Text>
//             </View>
//           </View>

//           {/* 3. COMPLIANCE SECTION */}
//           <View style={styles.complianceCard}>
//             <View style={styles.complianceHeaderRow}>
//               <Ionicons
//                 name="shield-checkmark"
//                 size={24}
//                 color={COLORS.primary}
//               />
//               <Text style={styles.complianceTitle}>
//                 Fully Compliant & Registered
//               </Text>
//             </View>
//             <Text style={styles.complianceSubtitle}>
//               Registered under The Chit Funds Act, 1982. Your investments are
//               legally protected.
//             </Text>
//             <View style={styles.complianceRow}>
//               <View style={styles.complianceColumn}>
//                 <View style={styles.complianceIconBox}>
//                   <FontAwesome5
//                     name="landmark"
//                     size={30}
//                     color={COLORS.primary}
//                   />
//                 </View>
//                 <Text style={styles.complianceLabel}>Registered with</Text>
//                 <Text style={styles.complianceValue}>Ministry of Corporate</Text>
//                 <Text style={styles.complianceValue}>Affairs (MCA)</Text>
//               </View>
//               <View style={styles.complianceDivider} />
//               <View style={styles.complianceColumn}>
//                 <View style={styles.complianceIconBox}>
//                   <FontAwesome5
//                     name="hands-helping"
//                     size={30}
//                     color={COLORS.primary}
//                   />
//                 </View>
//                 <Text style={styles.complianceLabel}>Recognised By</Text>
//                 <Text style={styles.complianceValue}>Bharti Inclusion</Text>
//                 <Text style={styles.complianceValue}>Initiative</Text>
//               </View>
//             </View>
//           </View>

//           {/* 4. STEP-BY-STEP JOURNEY */}
//           <Text style={styles.sectionTitle}>Application Timeline</Text>
//           <View style={styles.journeyBox}>
//             {[
//               {
//                 t: "Registration Successful",
//                 d: "Received Data successfully",
//                 i: "check-circle",
//                 c: COLORS.success,
//                 done: true,
//               },
//               {
//                 t: "Identity Verification",
//                 d: "Admin is checking",
//                 i: "search",
//                 c: COLORS.accent,
//                 done: true,
//               },
//               {
//                 t: "Final Approval",
//                 d: "Final account activation",
//                 i: "lock",
//                 c: "#CBD5E0",
//                 done: false,
//               },
//             ].map((step, idx) => (
//               <View key={idx} style={styles.stepRow}>
//                 <View style={styles.stepIconCol}>
//                   <View style={[styles.stepDot, { backgroundColor: step.c }]}>
//                     <Feather name={step.i} size={14} color="#FFF" />
//                   </View>
//                   {idx < 2 && <View style={styles.stepConnector} />}
//                 </View>
//                 <View style={styles.stepTextCol}>
//                   <Text
//                     style={[
//                       styles.stepTitle,
//                       { color: step.done ? COLORS.primary : COLORS.muted },
//                     ]}
//                   >
//                     {step.t}
//                   </Text>
//                   <Text style={styles.stepDesc}>{step.d}</Text>
//                 </View>
//               </View>
//             ))}
//           </View>

//           {/* 5. SUPPORT GRID */}
//           <Text style={styles.sectionTitle}>Need Quick Help?</Text>
//           <View style={styles.supportRow}>
//             <TouchableOpacity
//               style={styles.supportCard}
//               onPress={() => Linking.openURL("tel:+919483900777")}
//             >
//               <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
//                 <Feather name="phone" size={20} color={COLORS.primary} />
//               </View>
//               <Text style={styles.supportLabel}>Call Admin</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.supportCard}
//               onPress={() => Linking.openURL("https://wa.me/+919483900777")}
//             >
//               <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
//                 <FontAwesome name="whatsapp" size={22} color="#2E7D32" />
//               </View>
//               <Text style={styles.supportLabel}>WhatsApp</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.supportCard}
//               onPress={() => Linking.openURL("mailto:support@mychits.com")}
//             >
//               <View style={[styles.iconBox, { backgroundColor: "#FFF3E0" }]}>
//                 <Feather name="mail" size={20} color={COLORS.accent} />
//               </View>
//               <Text style={styles.supportLabel}>Email Us</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.footerBranding}>
//             <Text style={styles.madeInText}>MY CHITS • SECURE AGENT NETWORK</Text>
//             <Text style={styles.versionText}> Made with ❤️ in India</Text>
//           </View>
//         </Animated.ScrollView>
//       </View>

//       {/* FOOTER ACTION */}
//       <View style={styles.footerAction}>
//         <TouchableOpacity
//           activeOpacity={0.8}
//           style={styles.refreshBtn}
//           onPress={handleRefresh}
//           disabled={isRefreshing}
//         >
//           <LinearGradient
//             colors={isRefreshing ? ["#94A3B8", "#64748B"] : TOP_GRADIENT}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.btnGradient}
//           >
//             {isRefreshing ? (
//               <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
//             ) : (
//               <MaterialCommunityIcons
//                 name="cached"
//                 size={22}
//                 color="#FFF"
//                 style={{ marginRight: 10 }}
//               />
//             )}
//             <Text style={styles.btnText}>
//               {isRefreshing ? "CHECKING STATUS..." : "REFRESH STATUS"}
//             </Text>
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F8FAFC" },
//   headerGradient: {
//     paddingBottom: 70,
//     borderBottomLeftRadius: 45,
//     borderBottomRightRadius: 45,
//     overflow: "hidden",
//   },
//   slantLine: {
//     position: "absolute",
//     top: 0,
//     bottom: 0,
//     width: 50,
//     backgroundColor: "#FFF",
//     zIndex: 0,
//   },
//   safeArea: { paddingTop: Platform.OS === "android" ? 45 : 10 },

//   headerNav: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     zIndex: 2,
//   },
//   logoGroup: { flexDirection: "row", alignItems: "center" },
//   logo: { width: 42, height: 42},
//   brandText: {
//     color: "#FFF",
//     fontSize: 22,
//     fontWeight: "900",
//     marginLeft: 10,
//     letterSpacing: 0.5,
//   },
//   glassBtn: {
//     padding: 10,
//     borderRadius: 15,
//     backgroundColor: "rgba(255,255,255,0.15)",
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },

//   headerInfo: { paddingHorizontal: 25, marginTop: 20, zIndex: 2 },
//   regBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.2)",
//     alignSelf: "flex-start",
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 6,
//     marginBottom: 10,
//   },
//   regBadgeText: {
//     color: "#FFF",
//     fontSize: 9,
//     fontWeight: "800",
//     marginLeft: 5,
//     letterSpacing: 1,
//   },
//   mainTitle: { color: "#FFF", fontSize: 26, fontWeight: "900" },
//   subTitle: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4 },

//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(15, 23, 42, 0.75)",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 25,
//   },
//   profilePopup: {
//     width: "100%",
//     maxWidth: 320,
//     backgroundColor: "#FFF",
//     borderRadius: 30,
//     padding: 25,
//     alignItems: "center",
//     elevation: 25,
//   },
//   popupHeader: { alignItems: "center", marginBottom: 20 },
//   avatarCircle: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "#F0F9FF",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#E0F2FE",
//   },
//   popupName: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
//   statusBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFF7ED",
//     paddingHorizontal: 12,
//     paddingVertical: 5,
//     borderRadius: 20,
//     marginTop: 8,
//     borderWidth: 1,
//     borderColor: "#FFEDD5",
//   },
//   pulseDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#F97316",
//     marginRight: 8,
//   },
//   statusBadgeText: { fontSize: 12, color: "#C2410C", fontWeight: "800" },
//   popupInfoBox: {
//     backgroundColor: "#F8FAFC",
//     padding: 15,
//     borderRadius: 15,
//     width: "100%",
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: "#F1F5F9",
//   },
//   popupInfoTitle: {
//     fontSize: 13,
//     fontWeight: "800",
//     color: "#64748B",
//     marginBottom: 5,
//     textAlign: "center",
//   },
//   popupInfoDesc: {
//     fontSize: 13,
//     color: "#475569",
//     textAlign: "center",
//     lineHeight: 18,
//   },
//   logoutBtn: { width: "100%", height: 55, borderRadius: 16, overflow: "hidden" },
//   logoutGradient: {
//     flex: 1,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   logoutBtnText: {
//     color: "#FFF",
//     fontSize: 16,
//     fontWeight: "800",
//     marginLeft: 10,
//   },
//   closeBtn: { marginTop: 15, padding: 10 },
//   closeBtnText: { color: "#94A3B8", fontSize: 14, fontWeight: "700" },

//   body: { flex: 1, marginTop: -40 },
//   scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
//   mainCard: {
//     backgroundColor: "#FFF",
//     borderRadius: 25,
//     padding: 25,
//     elevation: 12,
//     borderColor: "#e7b085",
//     borderWidth: 1,
//   },
//   cardHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//   },
//   labelSmall: {
//     fontSize: 10,
//     fontWeight: "800",
//     color: COLORS.muted,
//     letterSpacing: 1,
//   },
//   statusValue: {
//     fontSize: 32,
//     fontWeight: "900",
//     color: COLORS.primary,
//     marginTop: 5,
//   },
//   activeBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFF7ED",
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#FFEDD5",
//   },
//   activeBadgeText: {
//     fontSize: 11,
//     fontWeight: "800",
//     color: COLORS.accent,
//     marginLeft: 5,
//   },
//   progressBarBg: {
//     height: 10,
//     backgroundColor: "#F1F5F9",
//     borderRadius: 5,
//     marginTop: 20,
//     overflow: "hidden",
//   },
//   progressBarFill: { height: "100%", borderRadius: 5 },
//   statusHint: {
//     fontSize: 12,
//     color: COLORS.muted,
//     marginTop: 15,
//     fontStyle: "italic",
//   },

//   trustBarContainer: {
//     flexDirection: "row",
//     borderColor: "#f3e5d7",
//     borderWidth: 1,
//     backgroundColor: "#FFF",
//     borderRadius: 16,
//     paddingVertical: 15,
//     marginTop: 20,
//     elevation: 4,
//   },
//   trustItem: { flex: 1, alignItems: "center" },
//   trustText: { fontSize: 11, fontWeight: "800", color: "#333", marginTop: 5 },
//   trustDivider: { width: 1, height: "60%", backgroundColor: "#F0F0F0" },

//   complianceCard: {
//     backgroundColor: "#FFF",
//     borderRadius: 20,
//     padding: 25,
//     marginTop: 25,
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 15,
//     shadowOffset: { width: 0, height: 5 },
//     borderTopWidth: 6,
//     borderTopColor: COLORS.primary,
//   },
//   complianceHeaderRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   complianceTitle: {
//     fontSize: 18,
//     fontWeight: "800",
//     color: COLORS.primary,
//     marginLeft: 12,
//     flex: 1,
//   },
//   complianceSubtitle: {
//     fontSize: 13,
//     color: "#666",
//     marginLeft: 36,
//     marginBottom: 25,
//     lineHeight: 20,
//   },
//   complianceRow: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center",
//     marginTop: 10,
//   },
//   complianceColumn: { flex: 1, alignItems: "center", justifyContent: "center" },
//   complianceDivider: { width: 1, height: "80%", backgroundColor: "#F0F0F0" },
//   complianceIconBox: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     backgroundColor: "#F5F7FA",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#EEE",
//   },
//   complianceLabel: {
//     fontSize: 11,
//     color: "#888",
//     fontWeight: "600",
//     marginTop: 5,
//   },
//   complianceValue: {
//     fontSize: 12,
//     color: "#333",
//     fontWeight: "800",
//     textAlign: "center",
//   },

//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "900",
//     color: COLORS.primary,
//     marginTop: 30,
//     marginBottom: 15,
//   },
//   journeyBox: {
//     backgroundColor: "#FFF",
//     borderRadius: 25,
//     padding: 20,
//     elevation: 3,
//   },
//   stepRow: { flexDirection: "row", height: 75 },
//   stepIconCol: { alignItems: "center", width: 30 },
//   stepDot: {
//     width: 26,
//     height: 26,
//     borderRadius: 13,
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 2,
//   },
//   stepConnector: {
//     width: 2,
//     flex: 1,
//     backgroundColor: "#F1F5F9",
//     marginVertical: -2,
//   },
//   stepTextCol: { marginLeft: 15, flex: 1 },
//   stepTitle: { fontSize: 15, fontWeight: "800" },
//   stepDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
//   supportRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 10,
//   },
//   supportCard: {
//     width: "31%",
//     backgroundColor: "#FFF",
//     borderRadius: 20,
//     padding: 15,
//     alignItems: "center",
//     elevation: 3,
//   },
//   iconBox: {
//     width: 45,
//     height: 45,
//     borderRadius: 15,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   supportLabel: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
//   footerBranding: { alignItems: "center", marginTop: 40, paddingBottom: 20 },
//   madeInText: {
//     fontSize: 10,
//     color: COLORS.muted,
//     fontWeight: "800",
//     letterSpacing: 1.5,
//   },
//   versionText: { fontSize: 11, color: COLORS.muted, marginTop: 5 },
//   footerAction: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     padding: 20,
//     backgroundColor: "rgba(248, 250, 252, 0.95)",
//   },
//   refreshBtn: { height: 60, borderRadius: 20, overflow: "hidden", elevation: 8 },
//   btnGradient: {
//     flex: 1,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   btnText: {
//     color: "#FFF",
//     fontSize: 15,
//     fontWeight: "900",
//     letterSpacing: 1,
//   },
// });