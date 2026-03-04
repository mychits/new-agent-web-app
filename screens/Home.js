
import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  ToastAndroid,
  ActivityIndicator,
  TextInput,
  Clipboard,
  StatusBar,
  SafeAreaView,
  Linking,
  PanResponder,
  Image,
  Alert,
  Easing
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentContext } from "../context/AgentContextProvider";
import { useNetInfo } from "@react-native-community/netinfo";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

// --- COLORS FROM YOUR DASHBOARD ---
const COLORS = {
  primary: "#183A5D", // Dark Navy
  accent: "#f8c009ff", // Gold
  bgBlue: "#1aa2ccff", // Light Blue Gradient Start
  success: "#27AE60",
  white: "#FFFFFF",
  muted: "#8898AA",
  glass: "rgba(255, 255, 255, 0.15)",
  helpBlue: "#053B90",
};

// --- COLORS FOR ATTENDANCE MODAL (From Working Code 1) ---
const ATTENDANCE_PRIMARY_COLOR = "#00BCD4";
const ATTENDANCE_GRADIENT_START = "#00E5FF";
const ATTENDANCE_GRADIENT_END = "#0097A7";

const { width } = Dimensions.get('window');

const ATTENDANCE_SUBMIT_URL = `${baseUrl}/employee-attendance/punch`;
const ATTENDANCE_MODAL_URL = `${baseUrl}/employee-attendance/modal`;

// --- ICON & COLOR MAPPING ---
const ICON_CONFIG = {
  collections: { name: 'account-balance-wallet', color: '#009688' },
  qrCode: { name: 'qr-code', color: '#607D8B' },
  daybook: { name: 'book-open-variant', type: 'MaterialCommunityIcons', color: '#795548' },
  targets: { name: 'flag', color: '#F44336' },
  myLeads: { name: 'account-group', type: 'MaterialCommunityIcons', color: COLORS.primary },
  addCustomers: { name: 'person-add', color: '#2196F3' },
  myCustomers: { name: 'groups', color: '#9C27B0' },
  myTasks: { name: 'assignment', color: '#FF9800' },
  reports: { name: 'chart-bar', type: 'MaterialCommunityIcons', color: '#673AB7' },
  commission: { name: 'trending-up', color: COLORS.success },
  overview: { name: 'assessment', color: '#fff' },
  groups: { name: 'layers', color: COLORS.bgBlue },
  customerOnHold: { name: 'pause-circle-outline', type: 'MaterialCommunityIcons', color: '#795548' },
  monthlyTurnover: { name: 'swap-horiz', color: '#E91E63' },
  // UPDATED: Changed key to match data ID and updated icon to 'assignment-late'
  DueReport: { name: 'assignment-late', color: '#eb7aa0' },
  attendanceBtn: { name: 'calendar-clock', type: 'MaterialCommunityIcons', color: COLORS.accent },
  rewards: { name: 'card-giftcard', color: COLORS.accent },
  starPoints: { name: 'star-face', type: 'MaterialCommunityIcons', color: COLORS.accent },
  SalesReport: { name: 'point-of-sale', type: 'MaterialCommunityIcons', color: '#8BC34A' },
  appLogo: { name: 'domain', color: '#fff' },
};

// --- COMPONENT: HELP MODAL ---
const HelpModal = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: width, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Error", "Cannot open URL");
    } catch (error) { console.error(error); }
  };

  const handleWhatsAppPress = async () => {
    const message = "Hello, I need assistance with MyChits App.";
    const whatsappUrl = `https://wa.me/919483900777?text=${encodeURIComponent(message)}`;
    await openLink(whatsappUrl);
  };

  const handleCallUs = () => Linking.openURL(`tel:9483900777`).catch(err => console.error(err));

  const menuItems = [{ title: "WhatsApp Support", icon: "whatsapp", onPress: handleWhatsAppPress }];

  const handleMenuItemPress = (item) => {
    if (item.onPress) item.onPress();
    onClose();
  };

  return (
    <Modal animationType="none" transparent={true} visible={visible}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={onClose}>
        <Animated.View style={[styles.helpModalContent, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>How can we help?</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#585858" /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.helpScroll}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.modalMenuItem} onPress={() => handleMenuItemPress(item)}>
                <View style={styles.modalMenuItemLeft}>
                  {item.icon === "whatsapp" ? <Ionicons name="logo-whatsapp" size={24} color={COLORS.helpBlue} /> : <MaterialIcons name={item.icon} size={24} color={COLORS.helpBlue} />}
                  <Text style={styles.modalMenuText}>{item.title}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#585858" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalCallSection}>
            <Text style={styles.modalCallText}>Still need help? Give us a call.</Text>
            <TouchableOpacity style={styles.modalCallButton} onPress={handleCallUs}>
              <MaterialIcons name="phone" size={20} color="#fff" style={styles.modalCallIcon} />
              <Text style={styles.modalCallButtonText}>Call Us Now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// --- COMPONENT: ATTENDANCE MODAL (From Working Code 1) ---
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

  const animatedImageStyle = {
    transform: [{ scale: scaleAnim }],
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Text style={modalStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={[ATTENDANCE_GRADIENT_START, ATTENDANCE_GRADIENT_END]}
            style={modalStyles.iconHeader}
          >
            <Animated.Image
              source={require("../assets/ab.png")} // Ensure this path is correct
              style={[modalStyles.modalImage, animatedImageStyle]}
              resizeMode="contain"
            />
          </LinearGradient>

          <Text style={modalStyles.modalHeading}>Daily Status Check</Text>
          <Text style={modalStyles.modalText}>{message}</Text>

          {/* ACCORDION HEADER */}
          <TouchableOpacity
            style={modalStyles.accordionHeader}
            onPress={() => setIsNoteOpen(!isNoteOpen)}
            activeOpacity={0.8}
          >
            <Text style={modalStyles.noteLabel}>
              {isNoteOpen ? 'Hide Note' : 'Add a Note (Optional)'}
            </Text>
            <Text style={modalStyles.arrowIcon}>
              {isNoteOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {/* ACCORDION CONTENT */}
          {isNoteOpen && (
            <View style={modalStyles.accordionContent}>
              <TextInput
                style={modalStyles.inputField}
                placeholder="e.g., Working remotely today..."
                placeholderTextColor="#a0a0a0"
                value={note}
                onChangeText={setNote}
                multiline
              />
            </View>
          )}

          <TouchableOpacity
            disabled={!selectedStatus || attendanceLoading}
            onPress={handleSubmitAttendance}
            style={modalStyles.markAttendanceButtonWrapper}
          >
            <LinearGradient
              colors={
                !selectedStatus
                  ? ["#B0B0B0", "#909090"]
                  : [ATTENDANCE_GRADIENT_START, ATTENDANCE_GRADIENT_END]
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={modalStyles.markAttendanceButton}
            >
              {attendanceLoading ? (
                <ActivityIndicator size={"small"} color={"#fff"} />
              ) : (
                <Text style={modalStyles.markAttendanceButtonText}>
                  PRESENT
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// --- COMPONENT: ICON HELPER ---
const IconRenderer = ({ iconName, iconType, size, color }) => {
  if (iconType === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  return <MaterialIcons name={iconName} size={size} color={color} />;
};

// --- COMPONENT: CLEAN GRID CARD ---
const GridCard = ({ item, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true, delay: index * 50 })
    ]).start();
  }, []);

  const config = ICON_CONFIG[item.id] || { name: 'help', color: COLORS.primary };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }, styles.gridItemWrapper]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.gridItemBox}>
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
          <IconRenderer iconName={config.name} iconType={config.type} size={26} color={config.color} />
        </View>
        <Text style={styles.gridTitle}>{item.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- COMPONENT: WIDE CARD ---
const WideCard = ({ item, onPress, index }) => {
  const translateX = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true })
    ]).start();
  }, []);

  useEffect(() => {
    if (item.variant === 'overview') {
      Animated.loop(Animated.timing(shimmerAnim, { toValue: 1, duration: 2500, useNativeDriver: true })).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    }
  }, [item.variant]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  let gradientColors = [COLORS.primary, '#102a45'];
  let iconName = 'trending-up';
  let iconType = 'MaterialIcons';

  if (item.variant === 'reward') {
    gradientColors = ['#f8c009ff', '#d4a006'];
    iconName = 'card-giftcard';
  }
  if (item.variant === 'star') {
    gradientColors = ['#f8c009ff', '#d4a006'];
    iconName = 'star-face';
    iconType = 'MaterialCommunityIcons';
  }
  if (item.variant === 'overview') {
    gradientColors = ['#f8c009ff', '#d4a006'];
    iconName = 'assessment';
  }

  return (
    <Animated.View style={[{ transform: [{ translateX }], opacity }, styles.wideCardWrapper]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={gradientColors}
          style={[styles.wideCard, item.variant === 'overview' && styles.overviewLayout]}
        >
          {item.variant === 'overview' && (
            <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]} />
          )}
          {item.variant === 'overview' ? (
            <>
              <Animated.View style={[styles.wideIconCircle, styles.overviewIcon, { transform: [{ scale: pulseAnim }] }]}>
                <IconRenderer iconName={iconName} iconType={iconType} size={32} />
              </Animated.View>
              <View style={styles.overviewTextContainer}>
                <Text style={[styles.wideTitle, styles.overviewTitleText]}>My Overview</Text>
                <Text style={[styles.wideSubTitle, { color: 'rgba(255,255,255,0.9)' }]}>Performance Status</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.wideIconCircle}>
                <IconRenderer iconName={iconName} iconType={iconType} size={32} color="#fff" />
              </View>
              <View style={styles.wideTextContainer}>
                <Text style={styles.wideTitle}>{item.name}</Text>
                <Text style={styles.wideSubTitle}>
                  {item.variant === 'star' ? "Redeem Points" : item.variant === 'reward' ? "Claim Rewards" : "View Details"}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={28} color="rgba(255,255,255,0.6)" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Home = ({ route, navigation }) => {
  const { user = {}, agentInfo = {} } = route.params || {};
  const { setModifyPayment } = useContext(AgentContext);

  const [agent, setAgent] = useState(agentInfo || {});
  const [greeting, setGreeting] = useState('');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [note, setNote] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isSideMenuVisible, setSideMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  // --- NEW: SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");

  // Attendance specific states
  const [selectedStatus, setSelectedStatus] = useState("Present");
  const [attendanceMessage, setAttendanceMessage] = useState("");

  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // --- CORRECTED FETCH LOGIC ---
  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (user?.userId && netInfo.isConnected) {
        try {
          // FIXED: Using the correct endpoint from Code 1
          const response = await axios.get(`${baseUrl}/agent/get-agent-by-id/${user.userId}`);
          
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
          const response = await axios.post(ATTENDANCE_MODAL_URL, { employee_id: user.userId });
          const data = response.data;
          console.log("Attendance API Response:", data);

          if (data?.showModal === true) {
            setAttendanceMessage(data.message || "Eligible to mark attendance");
            setShowAttendanceModal(true);
          } else if (data?.message) {
             setShowAttendanceModal(false);
          } else {
            setShowAttendanceModal(false);
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
          // FIXED: Log as Info if it's just "Already Marked"
          if (errorMessage !== "Attendance Already Marked") {
            console.error("Error checking attendance status:", errorMessage);
          } else {
            console.info("✅ Attendance check complete:", errorMessage);
          }
          setShowAttendanceModal(false);
        }
      }
    };
    checkAttendance();
  }, [user.userId, netInfo.isConnected]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => isSideMenuVisible && gestureState.dx < -10,
      onPanResponderMove: (_, gestureState) => { if (gestureState.dx < 0) slideAnim.setValue(Math.max(gestureState.dx, -width)); },
      onPanResponderRelease: (_, gestureState) => { if (gestureState.dx < -width / 2) closeSideMenu(); else openSideMenu(); },
    })
  ).current;

  const openSideMenu = () => { setSideMenuVisible(true); Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(); };
  const closeSideMenu = () => { Animated.timing(slideAnim, { toValue: -width, duration: 300, useNativeDriver: true }).start(() => setSideMenuVisible(false)); };

  const handleSubmitAttendance = async () => {
    try {
      setAttendanceLoading(true);

      const response = await axios.post(ATTENDANCE_SUBMIT_URL, {
        employee_id: user?.userId,
        status: selectedStatus, // "Present"
        method: "No Auth", // Included from Code 1
        type: "in",
        note: note,
      });
      const responseMessage = response?.data?.message;
      ToastAndroid.show(
        responseMessage ? responseMessage : "Attendance Marked Successfully",
        ToastAndroid.SHORT
      );
      setShowAttendanceModal(false);
      setNote("");
    } catch (error) {
      console.log(error, "error");
      ToastAndroid.show("Failed to Mark Attendance", ToastAndroid.SHORT);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const cardsData = [
    {
      id: "overview", name: "My Overview",
      onPress: () => navigation.navigate("Commissions", { user }),
      isFullWidth: true, variant: 'overview'
    },
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "collections", name: "Collections",
      onPress: () => navigation.navigate("PaymentNavigator"),
    },
    {
      id: "rewards", name: "My Rewards",
      onPress: () => navigation.navigate("Rewards"),
      isFullWidth: true, variant: 'reward'
    },
    {
      id: "starPoints", name: "Star Points",
      onPress: () => navigation.navigate("StarPoints"),
      isFullWidth: true, variant: 'star'
    },
    agentInfo?.designation_id?.permission?.daybook === "true" && {
      id: "daybook", name: "Daybook",
      onPress: () => navigation.navigate("PayNavigation", { user }),
    },
    {
      id: "qrCode", name: "QR Code",
      onPress: () => navigation.navigate("qrCode"),
    },
    agentInfo?.designation_id?.permission?.reports === "true" && {
      id: "reports", name: "Reports",
      onPress: () => navigation.navigate("PayNavigation", { screen: "Reports", params: { user } }),
    },
    agentInfo?.designation_id?.permission?.targets === "true" && {
      id: "targets", name: "Targets",
      onPress: () => navigation.navigate("Target"),
    },
    agentInfo?.designation_id?.permission?.leads === "true" && {
      id: "myLeads", name: "My Leads",
      onPress: () => navigation.navigate("PayNavigation", { screen: "ViewLeads", params: { user } }),
    },
    {
      id: "addCustomers", name: "Add Customer",
      onPress: () => navigation.navigate("CustomerNavigation", { screen: "Customer", params: { user } }),
    },
    {
      id: "myCustomers", name: "My Customers",
      onPress: () => navigation.navigate("CustomerNavigation", { screen: "ViewEnrollments", params: { user } }),
    },
    {
      id: "myTasks", name: "My Tasks",
      onPress: () => navigation.navigate("MyTasks", { employeeId: user.userId, agentName: agent.name }),
    },
    {
      id: "groups", name: "Groups",
      onPress: () => navigation.navigate("Enrollment", { screen: "Enrollment", params: { user } }),
    },
    {
      id: "attendanceBtn", name: "Attendance",
      onPress: () => navigation.navigate("LogOut", { user }),
    },
    {
      id: "monthlyTurnover", name: "MIT",
      onPress: () => navigation.navigate("MonthlyTurnover"),
    },
    {
      id: "DueReport", name: "Outstanding Reports",
      onPress: () => navigation.navigate("PayNavigation", { screen: "Due", params: { user } }),
    },
    {
      id: "customerOnHold", name: "On Hold Customers",
      onPress: () => navigation.navigate("CustomerOnHold"),
    },
    {
      id: "SalesReport", name: "Sales Report",
      onPress: () => navigation.navigate("SalesReport", { employeeId: user.userId, agentName: agent.name }),
    },
  ].filter(Boolean);

  const copyToClipboard = (text) => { Clipboard.setString(text); ToastAndroid.show("UPI ID Copied!", ToastAndroid.SHORT); };

  const topWideCards = cardsData.filter(item => item.isFullWidth && item.id !== 'rewards' && item.id !== 'starPoints');
  const rewardsStarPointsCards = cardsData.filter(item => item.id === 'rewards' || item.id === 'starPoints');
  const gridCards = cardsData.filter(item => !item.isFullWidth);

  // --- NEW: SEARCH FILTER LOGIC ---
  const filteredGridCards = gridCards.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.bgBlue, COLORS.primary]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top, marginTop: 15 }]}>
        <TouchableOpacity onPress={openSideMenu} style={styles.hamburgerContainer}>
          <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/Group400.png")} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>My Chits </Text>
        </View>
        <TouchableOpacity style={styles.helpButton} onPress={() => setShowHelpModal(true)}>
          <Ionicons name="help-circle-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingCard}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingLabel}>{greeting},</Text>
            <Text style={styles.agentName}>{agent.name || "Agent"}</Text>
          </View>
          <View style={styles.statusBadge}><Text style={styles.statusText}>Active</Text></View>
        </View>

        {/* --- NEW: SEARCH BAR SECTION --- */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Quick Access..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {topWideCards.length > 0 && (
          <View style={styles.wideCardsSection}>
            {topWideCards.map((item, index) => (
              <WideCard key={item.id} item={item} index={index} onPress={item.onPress} />
            ))}
          </View>
        )}

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.gridContainer}>
            {/* --- UPDATED: Use filteredGridCards --- */}
            {filteredGridCards.length > 0 ? (
              filteredGridCards.map((item, index) => (
                <GridCard key={item.id} item={item} index={index} onPress={item.onPress} />
              ))
            ) : (
              <View style={styles.noResultContainer}>
                <Text style={styles.noResultText}>No services found</Text>
              </View>
            )}
          </View>
        </View>

        {rewardsStarPointsCards.length > 0 && (
          <View style={styles.wideCardsSection}>
            {rewardsStarPointsCards.map((item, index) => (
              <WideCard key={item.id} item={item} index={index} onPress={item.onPress} />
            ))}
          </View>
        )}

        <View style={styles.qrSection}>
          <LinearGradient colors={[COLORS.bgBlue, COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="qr-code-scanner" size={24} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.qrTitle}>Business QR</Text>
              </View>
            </View>
            <View style={styles.qrBox}><Image source={require("../assets/upi_qr (1).png")} style={styles.qrImage} /></View>
            <TouchableOpacity onPress={() => copyToClipboard("mychits@kotak")} style={styles.upiButton}>
              <Text style={styles.upiText}>mychits@kotak</Text>
              <MaterialIcons name="content-copy" size={16} color="#fff" style={{ marginLeft: 5 }} />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>Agent Support</Text>
          <View style={styles.supportRow}>
            <View style={styles.supportItem}>
              <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL('tel:9483900777')}>
                <MaterialIcons name="phone" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.supportLabel}>Call Us</Text>
            </View>
            <View style={styles.supportItem}>
              <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL('whatsapp://send?phone=919483900777')}>
                <Ionicons name="logo-whatsapp" size={20} color={COLORS.success} />
              </TouchableOpacity>
              <Text style={styles.supportLabel}>WhatsApp</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* SIDE MENU */}
      {isSideMenuVisible && (
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeSideMenu}>
          <Animated.View style={[styles.sideMenu, { transform: [{ translateX: slideAnim }] }]} {...panResponder.panHandlers}>
            <LinearGradient colors={[COLORS.bgBlue, COLORS.primary]} style={styles.menuHeader}>
              <TouchableOpacity onPress={closeSideMenu} style={styles.closeMenuBtn}><MaterialIcons name="close" size={28} color="#fff" /></TouchableOpacity>
              <View style={styles.headerContainer}>
                <Image
                  source={require("../assets/Group400.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.menuAgentName}>{agent.name || "Agent"}</Text>
            </LinearGradient>
            <ScrollView style={styles.menuScroll}>
              <MenuItem icon="home-outline" text="Dashboard" onPress={() => { navigation.navigate("Dashboard"); closeSideMenu(); }} />
              <MenuItem icon="person-outline" text="My Profile" onPress={() => { navigation.navigate("Profile", { user }); closeSideMenu(); }} />
              <MenuItem icon="settings-outline" text="Settings" onPress={() => { navigation.navigate("Profile", { user }); closeSideMenu(); }} />
              <View style={styles.menuDivider} />
              <MenuItem icon="log-out-outline" text="Logout" color="red" onPress={() => { closeSideMenu(); navigation.replace("Login"); }} />
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      )}

      <AttendanceModal
        attendanceLoading={attendanceLoading}
        selectedStatus={selectedStatus}
        visible={showAttendanceModal}
        message={attendanceMessage}
        onClose={() => setShowAttendanceModal(false)}
        handleSubmitAttendance={handleSubmitAttendance}
        note={note}
        setNote={setNote}
      />
      <HelpModal visible={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </SafeAreaView>
  );
};

const MenuItem = ({ icon, text, onPress, color }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuItem}>
    <Ionicons name={icon} size={22} color={color || "#333"} style={styles.menuIcon} />
    <Text style={[styles.menuText, { color: color || "#333" }]}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, paddingHorizontal: 15, paddingTop: 24, justifyContent: 'space-between', zIndex: 10 },
  hamburgerContainer: { padding: 5 }, hamburgerLine: { width: 24, height: 2.5, backgroundColor: '#fff', borderRadius: 2, marginVertical: 2.5 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 50 },
  headerTitle: { color: '#fff', fontSize: 25, fontWeight: 'bold', marginLeft: 10 },
  headerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  headerLogo: { width: 50, height: 40 },
  helpButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  scrollView: { flex: 1 },
  greetingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 15, marginTop: 15, marginBottom: 20, padding: 20, borderRadius: 30, backgroundColor: '#FFFFFF', elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  greetingTextContainer: { flex: 1 }, greetingLabel: { fontSize: 14, color: COLORS.muted, fontWeight: '700' },
  agentName: { fontSize: 22, color: COLORS.primary, fontWeight: '900', marginTop: 2 },
  statusBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  
  // --- SEARCH STYLES ---
  searchContainer: { paddingHorizontal: 15, marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: 5, 
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: { marginRight: 10 },
  searchInput: { 
    flex: 1, 
    height: 45, 
    fontSize: 15, 
    color: COLORS.primary, 
    fontWeight: '600' 
  },
  clearButton: { padding: 5 },
  noResultContainer: { width: '100%', paddingVertical: 20, alignItems: 'center' },
  noResultText: { color: '#fff', fontSize: 16, opacity: 0.8 },

  wideCardsSection: { paddingHorizontal: 15, marginBottom: 25 },
  wideCardWrapper: { marginBottom: 15 },
  wideCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 30, elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, overflow: 'hidden' },
  shimmerOverlay: { position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', backgroundColor: 'rgba(255,255,255,0.25)', transform: [{ skewX: '-20deg' }] },
  overviewLayout: { flexDirection: 'column', alignItems: 'center', paddingVertical: 25, justifyContent: 'center' },
  wideIconCircle: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5 },
  overviewIcon: { marginRight: 0, marginBottom: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10, elevation: 8 },
  wideTextContainer: { flex: 1 }, overviewTextContainer: { alignItems: 'center' },
  wideTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, overviewTitleText: { fontSize: 20, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  wideSubTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  servicesSection: { paddingHorizontal: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 15, marginLeft: 5 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItemWrapper: { width: '31%', marginBottom: 12 },
  gridItemBox: { backgroundColor: '#FFFFFF', borderRadius: 25, paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5, height: 110 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },
  qrSection: { paddingHorizontal: 15, marginBottom: 30 },
  qrCard: { borderRadius: 30, padding: 25, alignItems: 'center', elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  qrHeader: { width: '100%', marginBottom: 20 }, qrTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  qrBox: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 15 }, qrImage: { width: 180, height: 180 },
  upiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  upiText: { color: '#fff', fontWeight: 'bold' },
  footerSection: { alignItems: 'center', paddingVertical: 20, marginHorizontal: 15, backgroundColor: '#fff', borderRadius: 30, marginBottom: 20, elevation: 10 },
  footerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15 },
  supportRow: { flexDirection: 'row' }, supportItem: { alignItems: 'center', marginHorizontal: 25 },
  callBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.bgBlue },
  supportLabel: { fontSize: 12, color: COLORS.muted, marginTop: 5, fontWeight: '600' }, versionText: { marginTop: 20, fontSize: 12, color: COLORS.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '60%', width: '100%', position: 'absolute', bottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary }, modalBody: { flex: 1, padding: 25, alignItems: 'center' },
  modalIconContainer: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalSubText: { fontSize: 16, color: COLORS.muted, marginBottom: 20 },
  inputField: { width: '100%', height: 80, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 10, textAlignVertical: 'top', marginBottom: 20, backgroundColor: '#F9F9F9' },
  buttonRow: { flexDirection: 'row', width: '100%', marginTop: 10, justifyContent: 'space-between' },
  halfButton: { width: '48%' },
  submitButton: { width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  helpModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '38%', width: '100%', position: 'absolute', bottom: 0, elevation: 5 },
  helpScroll: { flex: 1, paddingHorizontal: 25 }, modalMenuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', backgroundColor: 'transparent' },
  modalMenuItemLeft: { flexDirection: 'row', alignItems: 'center' }, modalMenuText: { fontSize: 17, color: '#424242', marginLeft: 20, fontWeight: '500' },
  modalCallSection: { marginTop: 20, alignItems: 'center', paddingTop: 15, borderTopColor: '#f0f0f0', marginBottom: 20, paddingHorizontal: 25 },
  modalCallText: { fontSize: 16, color: '#616161', marginBottom: 15, textAlign: 'center' },
  modalCallButton: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 26, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  modalCallIcon: { marginRight: 12 }, modalCallButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
  sideMenu: { width: '80%', height: '100%', backgroundColor: '#fff', position: 'absolute', left: 0, top: 0 },
  menuHeader: { padding: 30, paddingTop: 70, borderBottomLeftRadius: 30 }, closeMenuBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, padding: 5 },
  menuAgentName: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginTop: 45, textAlign: 'center' },
  menuAgentId: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 5 },
  menuScroll: { flex: 1, paddingTop: 20 }, menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 25 },
  menuIcon: { marginRight: 15, width: 25 }, menuText: { fontSize: 16, color: '#333' }, menuDivider: { height: 1, backgroundColor: '#eee', marginVertical: 10, marginHorizontal: 20 },
});

// --- STYLES FOR ATTENDANCE MODAL (From Code 1) ---
const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 50,
    borderWidth: 2,
    borderColor: '#108da3ff',
  },
  iconHeader: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: -80,
    shadowColor: ATTENDANCE_PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  modalImage: {
    width: 85,
    height: 65,
  },
  modalHeading: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2c3e50",
    marginBottom: 5,
  },
  modalText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    color: "#7f8c8d",
    lineHeight: 22,
    marginBottom: 25,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
  closeButtonText: { fontSize: 28, fontWeight: "300", color: "#95a5a6" },
  accordionHeader: {
    width: "100%",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34495e',
  },
  arrowIcon: {
    fontSize: 15,
    color: '#c2c3c4ff',
    fontWeight: '900',
  },
  accordionContent: {
    width: "100%",
    marginTop: 8,
    marginBottom: 10,
  },
  inputField: {
    width: "100%",
    minHeight: 90,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#34495e',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  markAttendanceButtonWrapper: {
    width: "100%",
    marginTop: 30,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: ATTENDANCE_PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  markAttendanceButton: {
    paddingVertical: 18,
    alignItems: "center",
  },
  markAttendanceButtonText: {
    color: "Green",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 19,
    letterSpacing: 1,
  },
});

export default Home;
