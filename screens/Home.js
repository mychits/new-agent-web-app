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
  welcomeText: { fontSize: 28, fontWeight: "bold", color: MODERN_PRIMARY, marginBottom: 5 },
  questionText: { fontSize: 20, fontWeight: "600", color: TEXT_GREY, marginBottom: 10 },
  
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