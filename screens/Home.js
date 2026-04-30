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
  Easing,
  Platform
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
  glass: "rgba(255, 255, 255, 0.25)",
  glassBorder: "rgba(255, 255, 255, 0.4)",
  helpBlue: "#053B90",
};

const ATTENDANCE_PRIMARY_COLOR = "#00BCD4";
const ATTENDANCE_GRADIENT_START = "#00E5FF";
const ATTENDANCE_GRADIENT_END = "#0097A7";

const { width, height } = Dimensions.get('window');

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
  DueReport: { name: 'assignment-late', color: '#eb7aa0' },
  attendanceBtn: { name: 'calendar-clock', type: 'MaterialCommunityIcons', color: COLORS.accent },
  rewards: { name: 'card-giftcard', color: COLORS.accent },
  starPoints: { name: 'star-face', type: 'MaterialCommunityIcons', color: COLORS.accent },
  SalesReport: { name: 'point-of-sale', type: 'MaterialCommunityIcons', color: '#8BC34A' },
  appLogo: { name: 'domain', color: '#fff' },
  approvals: { name: 'approval', color: '#673AB7' }, // NEW: Approvals Icon
};

// --- COMPONENT: HELP MODAL ---
const HelpModal = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: width, duration: 250, useNativeDriver: true }).start();
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
          {/* Glass Header for Modal */}
          <LinearGradient colors={[COLORS.bgBlue, COLORS.primary]} style={styles.helpModalHeader}>
             <Text style={styles.modalTitle}>How can we help?</Text>
             <TouchableOpacity onPress={onClose} style={styles.closeCircleBtn}>
                <Ionicons name="close" size={22} color="#fff" />
             </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView showsVerticalScrollIndicator={false} style={styles.helpScroll}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.modalMenuItem} onPress={() => handleMenuItemPress(item)}>
                <View style={styles.modalMenuItemLeft}>
                  {item.icon === "whatsapp" ? <Ionicons name="logo-whatsapp" size={24} color={COLORS.success} /> : <MaterialIcons name={item.icon} size={24} color={COLORS.helpBlue} />}
                  <Text style={styles.modalMenuText}>{item.title}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalCallSection}>
            <TouchableOpacity style={styles.modalCallButton} onPress={handleCallUs}>
              <MaterialIcons name="phone-in-talk" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.modalCallButtonText}>Call Us Now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// --- COMPONENT: ATTENDANCE MODAL ---
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      rotateAnim.setValue(-10);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 400, easing: Easing.elastic(1.5), useNativeDriver: true })
      ]).start();
      setIsNoteOpen(false);
      setNote("");
    }
  }, [visible]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.centeredView}>
        <Animated.View style={[modalStyles.modalView, { transform: [{ scale: scaleAnim }, { rotate: rotateAnim.interpolate({inputRange: [-10, 0], outputRange: ['-10deg', '0deg']}) }] }]}>
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={32} color="#bdc3c7" />
          </TouchableOpacity>

          <LinearGradient
            colors={[ATTENDANCE_GRADIENT_START, ATTENDANCE_GRADIENT_END]}
            style={modalStyles.iconHeader}
          >
            <Image
              source={require("../assets/ab.png")} 
              style={modalStyles.modalImage}
              resizeMode="contain"
            />
          </LinearGradient>

          <Text style={modalStyles.modalHeading}>Daily Status Check</Text>
          <Text style={modalStyles.modalText}>{message}</Text>

          <TouchableOpacity
            style={modalStyles.accordionHeader}
            onPress={() => setIsNoteOpen(!isNoteOpen)}
            activeOpacity={0.7}
          >
            <Text style={modalStyles.noteLabel}>
              {isNoteOpen ? 'Hide Note' : 'Add a Note (Optional)'}
            </Text>
            <Animated.View style={{transform: [{rotate: isNoteOpen ? '180deg' : '0deg'}]}}>
               <Ionicons name="chevron-down" size={20} color={COLORS.muted} />
            </Animated.View>
          </TouchableOpacity>

          {isNoteOpen && (
            <Animated.View style={modalStyles.accordionContent}>
              <TextInput
                style={modalStyles.inputField}
                placeholder="e.g., Working remotely today..."
                placeholderTextColor="#a0a0a0"
                value={note}
                onChangeText={setNote}
                multiline
              />
            </Animated.View>
          )}

          <TouchableOpacity
            disabled={!selectedStatus || attendanceLoading}
            onPress={handleSubmitAttendance}
            activeOpacity={0.8}
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
        </Animated.View>
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);

  // Staggered Entrance Animation
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 6,
      delay: index * 50,
      useNativeDriver: true
    }).start();
  }, []);

  const config = ICON_CONFIG[item.id] || { name: 'help', color: COLORS.primary };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.gridItemWrapper]}>
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={1}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.gridItemBox,
          isPressed && styles.gridItemPressed,
          { shadowColor: config.color } // Dynamic shadow color based on icon
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
          <IconRenderer iconName={config.name} iconType={config.type} size={26} color={config.color} />
        </View>
        <Text style={styles.gridTitle}>{item.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- COMPONENT: WIDE CARD ---
const WideCard = ({ item, onPress, index }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  // Shimmer effect for overview card
  const shimmerAnim = useRef(new Animated.Value(-200)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true })
    ]).start();
  }, []);

  useEffect(() => {
    if (item.variant === 'overview') {
      // Shimmer Loop
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 400,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.linear
        })
      ).start();

      // Pulse Loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
        ])
      ).start();
    }
  }, [item.variant]);

  let gradientColors = [COLORS.primary, '#102a45'];
  let iconName = 'trending-up';
  let iconType = 'MaterialIcons';

  if (item.variant === 'reward') {
    gradientColors = ['#ffd700', '#ffb900']; // Gold gradient
    iconName = 'card-giftcard';
  }
  if (item.variant === 'star') {
    gradientColors = ['#ffd700', '#ffb900'];
    iconName = 'star-face';
    iconType = 'MaterialCommunityIcons';
  }
  if (item.variant === 'overview') {
    gradientColors = ['#183A5D', '#1aa2ccff']; // Deep Navy to Blue
    iconName = 'assessment';
  }

  return (
    <Animated.View style={[{ transform: [{ translateX: slideAnim }], opacity }, styles.wideCardWrapper]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={gradientColors}
          style={[styles.wideCard, item.variant === 'overview' && styles.overviewLayout]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Shimmer Effect Overlay for Overview */}
          {item.variant === 'overview' && (
            <Animated.View 
              style={[
                styles.shimmerOverlay, 
                { 
                  transform: [{ translateX: shimmerAnim }] 
                }
              ]} 
            />
          )}

          {item.variant === 'overview' ? (
            <>
              <Animated.View style={[styles.wideIconCircle, styles.overviewIcon, { transform: [{ scale: pulseAnim }] }]}>
                <IconRenderer iconName={iconName} iconType={iconType} size={32}  />
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
  
  // QR Scanner Animation State
  const scanLineY = useRef(new Animated.Value(0)).current;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Present");
  const [attendanceMessage, setAttendanceMessage] = useState("");

  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();

  // QR Scanner Animation Loop
  useEffect(() => {
     Animated.loop(
       Animated.sequence([
         Animated.timing(scanLineY, { toValue: 1, duration: 2000, useNativeDriver: true }),
         Animated.timing(scanLineY, { toValue: 0, duration: 2000, useNativeDriver: true })
       ])
     ).start();
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (user?.userId && netInfo.isConnected) {
        try {
          const response = await axios.get(`${baseUrl}/agent/get-agent-by-id/${user.userId}`);
          if (response.data) {
            setAgent(response.data);
            if (response.data?.designation_id?.permission) {
              setModifyPayment(response.data.designation_id.permission.modify_payments === "true");
            }
          }
        } catch (error) { console.log("Error fetching agent details."); }
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
          if (data?.showModal === true) {
            setAttendanceMessage(data.message || "Eligible to mark attendance");
            setShowAttendanceModal(true);
          } else {
            setShowAttendanceModal(false);
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
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
        status: selectedStatus,
        method: "No Auth",
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
    {
      id: "approvals", name: "Loan Applications", // NEW ITEM ADDED HERE
      onPress: () => navigation.navigate("approvals", { user }),
    },
  ].filter(Boolean);

  const copyToClipboard = (text) => { Clipboard.setString(text); ToastAndroid.show("UPI ID Copied!", ToastAndroid.SHORT); };

  const topWideCards = cardsData.filter(item => item.isFullWidth && item.id !== 'rewards' && item.id !== 'starPoints');
  const rewardsStarPointsCards = cardsData.filter(item => item.id === 'rewards' || item.id === 'starPoints');
  const gridCards = cardsData.filter(item => !item.isFullWidth);

  const filteredGridCards = gridCards.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {/* Background Gradient */}
      <LinearGradient colors={[COLORS.bgBlue, COLORS.primary]} style={StyleSheet.absoluteFill} />

      {/* Header */}
   <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={openSideMenu} style={styles.iconBtn}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/Group400.png")} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>My Chits</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowHelpModal(true)}>
          <Ionicons name="help-buoy" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Greeting Section */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingLabel}>{greeting},</Text>
            <Text style={styles.agentName}>{agent.name || "Agent"}</Text>
          </View>
          <View style={styles.statusBadgeContainer}>
             <LinearGradient colors={[COLORS.success, '#219150']} style={styles.statusBadge}>
                <Text style={styles.statusText}>Active</Text>
             </LinearGradient>
          </View>
        </View>

        {/* Wide Cards (Overview) */}
        {topWideCards.length > 0 && (
          <View style={styles.wideCardsSection}>
            {topWideCards.map((item, index) => (
              <WideCard key={item.id} item={item} index={index} onPress={item.onPress} />
            ))}
          </View>
        )}

        {/* Grid Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          
          {/* MOVED SEARCH BAR HERE */}
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

          {/* SEARCHING FOR TEXT */}
          {searchQuery.length > 0 && (
            <Text style={styles.searchingText}>
              Searching for "{searchQuery}"
            </Text>
          )}

          <View style={styles.gridContainer}>
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

        {/* Rewards/Stars Wide Cards */}
        {rewardsStarPointsCards.length > 0 && (
          <View style={styles.wideCardsSection}>
            {rewardsStarPointsCards.map((item, index) => (
              <WideCard key={item.id} item={item} index={index} onPress={item.onPress} />
            ))}
          </View>
        )}

        {/* QR Section with Scanner Animation */}
        <View style={styles.qrSection}>
          <LinearGradient 
            colors={[COLORS.primary, '#0f2b47']} 
            start={{x:0, y:0}} end={{x:1, y:1}}
            style={styles.qrCard}
          >
            <View style={styles.qrHeader}>
              <MaterialIcons name="qr-code-scanner" size={24} color={COLORS.accent} style={{ marginRight: 8 }} />
              <Text style={styles.qrTitle}>Business QR</Text>
            </View>
            
            <View style={styles.qrBox}>
              <Image source={require("../assets/upi_qr (1).png")} style={styles.qrImage} />
              {/* Animated Scanner Line */}
              <Animated.View 
                style={[
                  styles.scanLine, 
                  { 
                    opacity: 0.7,
                    transform: [{ translateY: scanLineY.interpolate({inputRange: [0, 1], outputRange: [0, 150]}) }] 
                  }
                ]} 
              />
            </View>

            <TouchableOpacity onPress={() => copyToClipboard("mychits@kotak")} style={styles.upiButton}>
              <Text style={styles.upiText}>mychits@kotak</Text>
              <MaterialIcons name="content-copy" size={16} color="#fff" style={{ marginLeft: 5 }} />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>Agent Support</Text>
          <View style={styles.supportRow}>
            <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('tel:9483900777')}>
              <View style={styles.supportCircle}>
                <MaterialIcons name="phone" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.supportLabel}>Call Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('whatsapp://send?phone=919483900777')}>
              <View style={styles.supportCircle}>
                <Ionicons name="logo-whatsapp" size={22} color={COLORS.success} />
              </View>
              <Text style={styles.supportLabel}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{height: 30}} />
      </ScrollView>

      {/* SIDE MENU */}
      {isSideMenuVisible && (
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeSideMenu}>
          <Animated.View style={[styles.sideMenu, { transform: [{ translateX: slideAnim }] }]} {...panResponder.panHandlers}>
            <LinearGradient colors={[COLORS.bgBlue, COLORS.primary]} style={styles.menuHeader}>
              <TouchableOpacity onPress={closeSideMenu} style={styles.closeMenuBtn}><MaterialIcons name="close" size={28} color="#fff" /></TouchableOpacity>
              <View style={styles.headerContainer}>
                <Image source={require("../assets/Group400.png")} style={styles.headerLogo} resizeMode="contain" />
              </View>
              <Text style={styles.menuAgentName}>{agent.name || "Agent"}</Text>
            </LinearGradient>
            <ScrollView style={styles.menuScroll}>
              <MenuItem icon="home-outline" text="Dashboard" onPress={() => { navigation.navigate("Dashboard"); closeSideMenu(); }} />
              <MenuItem icon="person-outline" text="My Profile" onPress={() => { navigation.navigate("Profile", { user }); closeSideMenu(); }} />
              <MenuItem icon="settings-outline" text="Settings" onPress={() => { navigation.navigate("Profile", { user }); closeSideMenu(); }} />
              <View style={styles.menuDivider} />
              <MenuItem icon="log-out-outline" text="Logout" color="#e74c3c" onPress={() => { closeSideMenu(); navigation.replace("Login"); }} />
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
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  
  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 15, paddingHorizontal: 15, justifyContent: 'space-between', zIndex: 10 },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 15 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginLeft: 10, letterSpacing: 0.5 },
  headerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerLogo: { width: 45, height: 35 },

  // GREETING
  scrollView: { flex: 1, marginTop: 10 },
  greetingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 15, marginTop: 10, marginBottom: 20, padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', elevation: 12, shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
  greetingTextContainer: { flex: 1 }, 
  greetingLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  agentName: { fontSize: 16, color: COLORS.primary, fontWeight: '900', marginTop: 4 },
  statusBadgeContainer: { shadowColor: COLORS.success, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 },
  
  // SEARCH
  servicesSection: { paddingHorizontal: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 15, marginLeft: 5, letterSpacing: 0.5 },
  searchContainer: { paddingHorizontal: 0, marginBottom: 15 }, // Adjusted padding for new location
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, elevation: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  searchIcon: { marginRight: 12 }, searchInput: { flex: 1, height: 45, fontSize: 15, color: COLORS.primary, fontWeight: '500' },
  clearButton: { padding: 5 },
  searchingText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 15, marginLeft: 5, fontStyle: 'italic' },
  noResultContainer: { width: '100%', paddingVertical: 30, alignItems: 'center' },
  noResultText: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '500' },

  // WIDE CARDS
  wideCardsSection: { paddingHorizontal: 15, marginBottom: 20 },
  wideCardWrapper: { marginBottom: 12 },
  wideCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 22, elevation: 12, shadowColor: COLORS.primary, shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, overflow: 'hidden', position: 'relative' },
  shimmerOverlay: { position: 'absolute', top: 0, left: 0, width: '60%', height: '100%', backgroundColor: 'rgba(255,255,255,0.15)', transform: [{ skewX: '-15deg' }] },
  overviewLayout: { flexDirection: 'column', alignItems: 'center', paddingVertical: 25, justifyContent: 'center' },
  wideIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5 },
  overviewIcon: { marginRight: 0, marginBottom: 12, backgroundColor: '#fff', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 15, elevation: 8 },
  wideTextContainer: { flex: 1 }, overviewTextContainer: { alignItems: 'center' },
  wideTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' }, overviewTitleText: { fontSize: 18, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  wideSubTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3, fontWeight: '500' },

  // GRID CARDS
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItemWrapper: { width: '31%', marginBottom: 10 },
  gridItemBox: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, height: 100 },
  gridItemPressed: { transform: [{ scale: 0.95 }] }, // Active state
  iconContainer: { width: 45, height: 45, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridTitle: { fontSize: 10, fontWeight: '600', color: COLORS.primary, textAlign: 'center' },

  // QR SECTION
  qrSection: { paddingHorizontal: 15, marginBottom: 30 },
  qrCard: { borderRadius: 28, padding: 25, alignItems: 'center', elevation: 15, shadowColor: COLORS.bgBlue, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  qrHeader: { width: '100%', marginBottom: 20, flexDirection: 'row', alignItems: 'center' }, qrTitle: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
  qrBox: { backgroundColor: '#fff', padding: 12, borderRadius: 20, marginBottom: 18, position: 'relative', overflow: 'hidden' }, 
  qrImage: { width: 180, height: 180 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: COLORS.accent, shadowColor: COLORS.accent, shadowRadius: 10, shadowOpacity: 1 },
  upiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  upiText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // FOOTER
  footerSection: { alignItems: 'center', paddingVertical: 25, marginHorizontal: 15, backgroundColor: '#fff', borderRadius: 28, marginBottom: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  footerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 20 },
  supportRow: { flexDirection: 'row', width: '60%', justifyContent: 'space-between' },
  supportBtn: { alignItems: 'center' },
  supportCircle: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#f4f7fa', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#eef2f5' },
  supportLabel: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },

  // MODALS
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  helpModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, height: '55%', width: '100%', position: 'absolute', bottom: 0, elevation: 20 },
  helpModalHeader: { padding: 25, paddingTop: 35, borderTopLeftRadius: 35, borderTopRightRadius: 35, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeCircleBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 15 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  helpScroll: { flex: 1, paddingHorizontal: 25 }, modalMenuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalMenuItemLeft: { flexDirection: 'row', alignItems: 'center' }, modalMenuText: { fontSize: 17, color: '#333', marginLeft: 15, fontWeight: '600' },
  modalCallSection: { marginTop: 10, alignItems: 'center', paddingTop: 20, borderTopColor: '#f0f0f0', marginBottom: 25 },
  modalCallButton: { flexDirection: 'row', backgroundColor: COLORS.success, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30, alignItems: 'center', elevation: 5, shadowColor: COLORS.success, shadowOpacity: 0.4, shadowRadius: 10 },
  modalCallButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  // SIDE MENU
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10 },
  sideMenu: { width: '80%', height: '100%', backgroundColor: '#fff', position: 'absolute', left: 0, top: 0, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  menuHeader: { padding: 30, paddingTop: 80, borderBottomLeftRadius: 35 }, closeMenuBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 },
  menuAgentName: { fontSize: 22, color: '#fff', fontWeight: 'bold', marginTop: 50, textAlign: 'center' },
  menuScroll: { flex: 1, paddingTop: 30 }, menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 30 },
  menuIcon: { marginRight: 20, width: 26 }, menuText: { fontSize: 17, color: '#444', fontWeight: '600' }, menuDivider: { height: 1, backgroundColor: '#eee', marginVertical: 15, marginHorizontal: 25 },
});

const modalStyles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.6)" },
  modalView: { backgroundColor: "white", borderRadius: 25, padding: 30, alignItems: "center", width: "90%", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  iconHeader: { width: 110, height: 110, borderRadius: 55, justifyContent: "center", alignItems: "center", marginBottom: 20, marginTop: -90, shadowColor: ATTENDANCE_PRIMARY_COLOR, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10, borderWidth: 4, borderColor: '#fff' },
  modalImage: { width: 70, height: 55, tintColor: '#fff' },
  modalHeading: { fontSize: 24, fontWeight: "900", color: COLORS.primary, marginBottom: 5 },
  modalText: { textAlign: "center", fontSize: 15, fontWeight: "500", color: "#7f8c8d", lineHeight: 22, marginBottom: 25 },
  closeButton: { position: "absolute", top: 15, right: 15, padding: 5, zIndex: 10 },
  accordionHeader: { width: "100%", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, marginTop: 5, backgroundColor: '#f8f9fa', borderRadius: 12 },
  noteLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  accordionContent: { width: "100%", marginTop: 10, marginBottom: 10 },
  inputField: { width: "100%", minHeight: 80, borderColor: '#ddd', borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 15, color: '#333', backgroundColor: '#fff', textAlignVertical: 'top' },
  markAttendanceButtonWrapper: { width: "100%", marginTop: 30, borderRadius: 15, overflow: "hidden", shadowColor: ATTENDANCE_PRIMARY_COLOR, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  markAttendanceButton: { paddingVertical: 16, alignItems: "center" },
  markAttendanceButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center", fontSize: 18, letterSpacing: 1 },
});

export default Home;