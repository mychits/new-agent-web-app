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
  // 💡 IMPORTS FOR ANIMATION
  Animated,
  Easing,
  ToastAndroid,
  ActivityIndicator,
  // 💡 REQUIRED IMPORT
  TextInput,
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

// --- DESIGN CONSTANTS COPIED from EnrollCustomer.js/AddLead.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"];
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
const SUCCESS_COLOR = "#4CAF50"; // Retaining for success

// 💡 NEW DISTINCT COLOR FOR THE "MY OVERVIEW" CARD
const HIGHLIGHT_GOLD = '#f5be6dff'; 
// -----------------------------------------------------------------

const ATTENDANCE_SUBMIT_URL = `${baseUrl}/employee-attendance/punch`; // Updated URL based on usage in handleSubmitAttendance

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
  // NEW STATE FOR ACCORDION
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
      // Ensure note accordion is closed and note cleared when modal opens
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
            colors={[ACCENT_BLUE, ACCENT_BLUE]} // Use ACCENT_BLUE for gradient color
            style={modalStyles.iconHeader}
          >
            <Animated.Image
              source={cardImagePaths.attendence}
              style={[modalStyles.modalImage, animatedImageStyle]}
              resizeMode="contain"
            />
          </LinearGradient>

          <Text style={modalStyles.modalHeading}>Daily Status Check</Text>
          <Text style={modalStyles.modalText}>{message}</Text>

          {/* 💡 STYLISH ACCORDION HEADER (NOTE - OPTIONAL) */}
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

          {/* 💡 ACCORDION CONTENT (TEXT INPUT) */}
          {isNoteOpen && (
            <View style={modalStyles.accordionContent}>
              <TextInput
                style={modalStyles.inputField}
                placeholder="e.g., Working remotely today..."
                placeholderTextColor={TEXT_GREY}
                value={note}
                onChangeText={setNote}
                multiline
              />
            </View>
          )}
          {/* END ACCORDION */}

          <TouchableOpacity
            disabled={!selectedStatus || attendanceLoading}
            onPress={handleSubmitAttendance}
            style={modalStyles.markAttendanceButtonWrapper}
          >
            <LinearGradient
              colors={
                !selectedStatus
                  ? [BORDER_COLOR, BORDER_COLOR] // Disabled color
                  : [ACCENT_BLUE, ACCENT_BLUE]
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={modalStyles.markAttendanceButton}
            >
              {attendanceLoading ? (
                <ActivityIndicator size={"small"} color={CARD_BG} />
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

const Home = ({ route, navigation }) => {
  const { user = {}, agentInfo = {} } = route.params || {};
  const [agent, setAgent] = useState({});
  const [selectedStatus, setSelectedStatus] = useState("Present");
  const { modifyPayment, setModifyPayment } = useContext(AgentContext);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const netInfo = useNetInfo();
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [note, setNote] = useState("");

  // 💡 ANIMATION: Create Animated.Values for each card
  const cardAnimations = useRef([]);
  const hasAnimated = useRef(false);

  // Define cardsData early to use its length for animation array initialization
  const cardsData = [
    // The previous array structure is maintained, but colors are updated to be more harmonious
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "collections",
      name: "Collections",
      imagePath: cardImagePaths.collections,
      onPress: () => navigation.navigate("PaymentNavigator"),
      backgroundColor: SUBTLE_BG_GREY, // Light background
    },
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "qrCode",
      name: "QR Code",
      imagePath: cardImagePaths.qrCode,
      onPress: () => navigation.navigate("qrCode"),
      backgroundColor: SUBTLE_BG_GREY, // Light background
    },
    {
      id: "commission",
      name: "My Overview",
      imagePath: cardImagePaths.commission,
      onPress: () => navigation.navigate("Commissions", { user }),
      // 💡 CHANGE: Use HIGHLIGHT_GOLD for a distinct look
      backgroundColor: HIGHLIGHT_GOLD, 
    },
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
      onPress: () =>
        navigation.navigate("PayNavigation", {
          screen: "Reports",
          params: { user },
        }),
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
      onPress: () =>
        navigation.navigate("PayNavigation", {
          screen: "ViewLeads",
          params: { user },
        }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "addCustomers",
      name: "Add Customers",
      imagePath: cardImagePaths.addCustomers,
      onPress: () =>
        navigation.navigate("CustomerNavigation", {
          screen: "Customer",
          params: { user },
        }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "myCustomers",
      name: "My Customers",
      imagePath: cardImagePaths.myCustomers,
      onPress: () =>
        navigation.navigate("CustomerNavigation", {
          screen: "ViewEnrollments",
          params: { user },
        }),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "customerOnHold",
      name: "Customer On Hold",
      imagePath: cardImagePaths.customerOnHold,
      onPress: () => navigation.navigate("CustomerOnHold"),
      backgroundColor: SUBTLE_BG_GREY,
    },
    {
      id: "myTasks",
      name: "My Tasks",
      imagePath: cardImagePaths.myTasks,
      onPress: () =>
        navigation.navigate("MyTasks", {
          employeeId: user.userId,
          agentName: agent.name,
        }),
      backgroundColor: SUBTLE_BG_GREY,
    },

    {
      id: "groups",
      name: "Groups",
      imagePath: cardImagePaths.groups,
      onPress: () =>
        navigation.navigate("Enrollment", {
          screen: "Enrollment",
          params: { user },
        }),
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
      name: "Outstanding Report",
      imagePath: cardImagePaths.DueReportImage,
      onPress: () =>
        navigation.navigate("PayNavigation", {
          screen: "Due",
          params: { user },
        }),
      backgroundColor: SUBTLE_BG_GREY,
    },
  ].filter(Boolean);

  // Initialize Animated.Value for each card
  if (cardAnimations.current.length !== cardsData.length) {
    cardAnimations.current = cardsData.map(
      (_, i) => cardAnimations.current[i] || new Animated.Value(0)
    );
  }

  // 💡 ANIMATION: Staggered animation effect
  useEffect(() => {
    // Only run the animation once, when data is ready and net is connected
    if (cardsData.length > 0 && netInfo.isConnected && !hasAnimated.current) {
      const animations = cardAnimations.current.map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 400, // Speed of each card's animation
          delay: index * 50, // Staggered delay for each card
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        });
      });

      Animated.stagger(10, animations).start(() => {
        hasAnimated.current = true; // Mark as animated
      });
    }
  }, [cardsData.length, netInfo.isConnected]);


  const handleSubmitAttendance = async () => {
    try {
      setAttendanceLoading(true);

      const response = await axios.post(ATTENDANCE_SUBMIT_URL, {
        employee_id: user?.userId,
        status: selectedStatus, // "Present"
        method: "No Auth",
        type: "in",
        note: note,
      });
      const responseMessage = response?.data?.message;
      ToastAndroid.show(
        responseMessage ? responseMessage : "Attendance Marked Successfully",
        ToastAndroid.SHORT
      );
    } catch (error) {
      console.log(error, "error");
      ToastAndroid.show("Failed to Mark Attendance", ToastAndroid.SHORT);
    } finally {
      setAttendanceLoading(false);
      setShowAttendanceModal(false)
      setNote("");
    }
  };
  useEffect(() => {
    if (agentInfo?.designation_id?.permission) {
      setModifyPayment(
        agentInfo.designation_id.permission.modify_payments === "true"
      );
    }
  }, [agentInfo, setModifyPayment]);

  useEffect(() => {
    const fetchAgent = async () => {
      if (user && user.userId) {
        try {
          const response = await axios.get(
            `${baseUrl}/agent/get-agent-by-id/${user.userId}`
          );
          if (response.data) setAgent(response.data);
        } catch (error) {
          console.error("Error fetching agent data:", error.message);
        }
      }
    };
    if (netInfo.isConnected) fetchAgent();
  }, [user.userId, netInfo.isConnected]);

  useEffect(() => {
    const checkAttendance = async () => {
      const ATTENDANCE_MODAL_URL = `${baseUrl}/employee-attendance/modal`;

      const body = { employee_id: user.userId, };

      try {
        const response = await axios.post(ATTENDANCE_MODAL_URL, { ...body });
        const data = response.data;
        console.log(" Attendance API Response:", data);

        if (data?.showModal === true) {
          setAttendanceMessage(data.message || "Eligible to mark attendance");
          setShowAttendanceModal(true);
        } else if (data?.message) {
          setShowAttendanceModal(false);
        } else {
          setShowAttendanceModal(false);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message;

        if (errorMessage !== "Attendance Already Marked") {
          console.error(
            "❌ Error checking attendance status:",
            errorMessage
          );
        } else {
          console.info("✅ Attendance check complete:", errorMessage);
        }
        setShowAttendanceModal(false);
      }
    };

    if (user.userId && netInfo.isConnected) checkAttendance();
  }, [user.userId, netInfo.isConnected]);

  // handleMarkAttendance is now redundant due to handleSubmitAttendance handling the POST directly

  const renderNoInternet = () => (
    <View style={styles.noInternetContainer}>
      <Image
        source={require("../assets/Nointernetp.png")}
        style={styles.noInternetImage}
        resizeMode="contain"
      />
      <Text style={styles.noInternetText}>Oops! No internet connection.</Text>
      <Text style={styles.noInternetSubText}>
        Please check your network and try again.
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={TOP_GRADIENT} // Use the standard gradient
      style={{ flex: 1 }}
    >
      <View style={styles.mainContentArea_noSafeArea}>
        <Header />
        <View style={styles.introSection}>
          <Text style={styles.welcomeText}>
            Hello {agent.name || "Agent"},
          </Text>
          <Text style={styles.questionText}>
            Welcome to MyChits Agent App
          </Text>
        </View>

        {!user.userId ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
            <Text style={{ marginTop: 10, color: TEXT_GREY }}>Loading Agent Data...</Text>
          </View>
        ) : netInfo.isConnected === false ? (
          renderNoInternet()
        ) : (
          <ScrollView
            contentContainerStyle={styles.cardsScrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardsGridContainer}>
              {cardsData.map((card, index) => {

                // 💡 ANIMATION: Interpolate the scale and translateY
                const scale = cardAnimations.current[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1], // Start smaller, end at normal size
                });

                const translateY = cardAnimations.current[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0], // Start 50 points lower, slide up
                });

                const animatedStyle = {
                  opacity: cardAnimations.current[index], // Fade in
                  transform: [{ scale }, { translateY }],
                };

                // 💡 NEW LOGIC: Determine if the card is the "Overview" card
                const isOverviewCard = card.id === "commission";

                return (
                  <Animated.View
                    key={card.id}
                    style={[
                      styles.gridCardWrapper,
                      isOverviewCard && styles.bigCardWrapper, // 👈 extra width for Overview wrapper
                      animatedStyle,
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.gridCard,
                        // Use the card's backgroundColor property directly, which is now HIGHLIGHT_GOLD
                        { backgroundColor: card.backgroundColor }, 
                        isOverviewCard && styles.bigCardStyle, // 👈 Apply special style to the card itself
                      ]}
                      onPress={card.onPress}
                      activeOpacity={0.7} // Modern button feel
                    >
                      <Image
                        source={card.imagePath}
                        style={[
                          styles.cardImage,
                          isOverviewCard && styles.bigCardImage, // 👈 Apply special image style
                        ]}
                        resizeMode="contain"
                      />
                      <Text
                        style={[
                          styles.gridCardText,
                          isOverviewCard && styles.bigCardText, // 👈 Apply special text style
                        ]}
                      >
                        {card.name}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

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
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
  // 💡 Updated to use MODERN_PRIMARY
  mainContentArea_noSafeArea: { flex: 1, marginHorizontal: 22, marginTop: 40 },

  introSection: { marginTop: 20, marginBottom: 20, paddingHorizontal: 5 },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: MODERN_PRIMARY, // Dark text
    marginBottom: 5,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "600",
    color: TEXT_GREY, // Grey text
    marginBottom: 10,
  },

  // --- Big Card Styles (Overview Card) ---
  bigCardWrapper: {
    width: "100%", // spans full row (like two normal cards)
    height: (width - 22 * 2 - 20) / 2, // same height as other cards
  },
  bigCardStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1, 
    borderColor: HIGHLIGHT_GOLD, // 💡 HIGHLIGHT_GOLD border
    // Modern shadow like in Due.js
    shadowColor: MODERN_PRIMARY, // Keep dark shadow for contrast
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bigCardImage: {
    width: 180,
    height: 100,
    marginBottom: 5,
    marginTop: 0,
    alignSelf: 'center',
  },
  bigCardText: {
    fontSize: 22,
    fontWeight: "900",
    color: CARD_BG, // White text on HIGHLIGHT_GOLD background
    textAlign: "center",
  },
  // --- End Big Card Styles ---


  cardsScrollViewContent: { paddingBottom: 50 },
  cardsGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  gridCardWrapper: {
    width: (width - 22 * 2 - 20) / 2, // Matches the width of gridCard
    height: (width - 22 * 2 - 20) / 2, // Matches the height of gridCard
    marginBottom: 20,
  },
  gridCard: {
    flex: 1, // Fill the wrapper
    borderRadius: 15,
    // Modern shadow like in Due.js
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    // Unified Border
    borderWidth: 1,
    borderColor: BORDER_COLOR, // Lighter border
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  cardImage: { width: 100, height: 70 }, // Slightly smaller generic card image
  gridCardText: {
    fontSize: 15,
    fontWeight: "600",
    color: MODERN_PRIMARY, // Dark text for normal cards
    textAlign: "center",
    marginTop: 5,
  },
  noInternetContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noInternetImage: { width: 200, height: 200 },
  noInternetText: {
    fontSize: 20,
    fontWeight: "bold",
    color: MODERN_PRIMARY,
    marginTop: 20,
  },
  noInternetSubText: { fontSize: 16, color: TEXT_GREY, marginTop: 10 },
});


const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    backgroundColor: CARD_BG, // White background
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    width: "90%",
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 50,
    borderWidth: 2,
    borderColor: BORDER_COLOR, // Lighter border
  },
  iconHeader: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: -80,
    shadowColor: ACCENT_BLUE,
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
    color: MODERN_PRIMARY, // Dark text
    marginBottom: 5,
  },
  modalText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    color: TEXT_GREY, // Grey text
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
  closeButtonText: { fontSize: 28, fontWeight: "300", color: TEXT_GREY },

  // --- STYLISH ACCORDION STYLES (Softened) ---
  accordionHeader: {
    width: "100%",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10, // Increased padding
    paddingHorizontal: 15,
    marginTop: 5,
    backgroundColor: SUBTLE_BG_GREY, // Very light background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR, // Lighter border
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MODERN_PRIMARY,
  },
  arrowIcon: {
    fontSize: 16,
    color: ACCENT_BLUE, // Blue arrow
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
    borderColor: BORDER_COLOR,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: MODERN_PRIMARY,
    backgroundColor: CARD_BG,
    textAlignVertical: 'top',
  },

  // --- Proceed Button (Sleek, Full Gradient) ---
  markAttendanceButtonWrapper: {
    width: "100%",
    marginTop: 30,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: ACCENT_BLUE,
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
    color: CARD_BG, // White text on blue background
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 19,
    letterSpacing: 1,
  },
});

export default Home;