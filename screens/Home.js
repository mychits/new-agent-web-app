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
// import { SafeAreaView } from "react-native-safe-area-context"; // ❌ REMOVED
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { AgentContext } from "../context/AgentContextProvider";
import { useNetInfo } from "@react-native-community/netinfo";

const { width } = Dimensions.get("window");

// Primary color for this stylish version (Deep Teal/Cyan)
const PRIMARY_COLOR = "#00BCD4";
const PRIMARY_GRADIENT_START = "#00E5FF";
const PRIMARY_GRADIENT_END = "#0097A7";
const SUCCESS_COLOR = "#4CAF50";
const ATTENDANCE_SUBMIT_URL = `${baseUrl}/employee-attendance/mark-attendance`;

const cardImagePaths = {
  attendence: require("../assets/ab.png"),
  collections: require("../assets/Collection2.png"),
  qrCode: require("../assets/qrcode.png"),
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
  monthlyTurnover: require("../assets/MITB.png"), // Monthly Turnover image path
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
            colors={[PRIMARY_GRADIENT_START, PRIMARY_GRADIENT_END]}
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
                      // 💡 UPDATED SMALLER PLACEHOLDER
                      placeholder="e.g., Working remotely today..."
                      placeholderTextColor="#a0a0a0"
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
                  ? ["#B0B0B0", "#909090"]
                  : [PRIMARY_GRADIENT_START, PRIMARY_GRADIENT_END]
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
    // {
    //   id: "attendence",
    //   name: "Attendance",
    //   imagePath: cardImagePaths.attendence,
    //   onPress: () => navigation.navigate("Attendance", { user }),
    //   backgroundColor: "#D9D7F1",
    // },

    {
        id: "monthlyTurnover", 
        name: "Monthly Turnover",
        imagePath: cardImagePaths.monthlyTurnover,
        onPress: () => navigation.navigate("MonthlyTurnover"),
        backgroundColor: "#FFECB3", 
    },
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "collections",
      name: "Collections",
      imagePath: cardImagePaths.collections,
      onPress: () => navigation.navigate("PaymentNavigator"),
      backgroundColor: "#FFEBEE",
    },
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "qrCode",
      name: "QR Code",
      imagePath: cardImagePaths.qrCode,
      onPress: () => navigation.navigate("qrCode"),
      backgroundColor: "#FFEBEE",
    },
    agentInfo?.designation_id?.permission?.daybook === "true" && {
      id: "daybook",
      name: "Daybook",
      imagePath: cardImagePaths.daybook,
      onPress: () => navigation.navigate("PayNavigation", { user }),
      backgroundColor: "#E8F5E9",
    },
        {
        id: "commission",
        name: "Commissions",
        imagePath: cardImagePaths.commission,
        onPress: () => navigation.navigate("Commissions",{ user }),
      backgroundColor: "#E8F5E9",
    }, 
    


    agentInfo?.designation_id?.permission?.targets === "true" && {
      id: "targets",
      name: "Targets",
      imagePath: cardImagePaths.targets,
      onPress: () => navigation.navigate("Target"),
      backgroundColor: "#FFFDE7",
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
      backgroundColor: "#E3F2FD",
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
      backgroundColor: "#F3E5F5",
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
      backgroundColor: "#FFECB3",
    },
    {
      id: "customerOnHold",
      name: "Customer On Hold",
      imagePath: cardImagePaths.customerOnHold,
      onPress: () => navigation.navigate("CustomerOnHold"),
      backgroundColor: "#FFCDD2",
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
      backgroundColor: "#E0F7FA",
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
      backgroundColor: "#FCE4EC",
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
      backgroundColor: "#D1C4E9",
    },
    
    {
      id: "DueReport",
      name: "DueReport",
      imagePath: cardImagePaths.DueReportImage,
      onPress: () =>
        navigation.navigate("PayNavigation", {
          screen: "Due",
          params: { user },
        }),
      backgroundColor: "#e9d0e3ff",
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
    const ATTENDANCE_SUBMIT_URL = `${baseUrl}/employee-attendance/punch`;
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
      
      const body = { employee_id: user.userId,};

      try {
        const response = await axios.post(ATTENDANCE_MODAL_URL, { ...body });
        const data = response.data;
        console.log(" Attendance API Response:", data);

        if (data?.showModal === true) {
          setAttendanceMessage(data.message || "Eligible to mark attendance");
          setShowAttendanceModal(true);
        } else if (data?.message) {
          // If showModal is false but there's a message (like "Attendance Already Marked"),
          // we treat it as a successful check and suppress the warning/error logging.
          // console.warn("Attendance API message:", data.message); // Commented out to reduce console noise
          setShowAttendanceModal(false);
        } else {
          setShowAttendanceModal(false);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message;

        // 💡 MODIFICATION HERE: Check if the "error" is actually the expected "Attendance Already Marked" status.
        // The API might be using a non-200 status code to return this state.
        if (errorMessage !== "Attendance Already Marked") {
          console.error(
            "❌ Error checking attendance status:",
            errorMessage
          );
        } else {
            // Success case, but returned as an HTTP error code (e.g., 400).
            // We log it as an info message instead of an error.
            console.info("✅ Attendance check complete:", errorMessage);
        }
        setShowAttendanceModal(false);
      }
    };

    if (user.userId && netInfo.isConnected) checkAttendance();
  }, [user.userId, netInfo.isConnected]);

  const handleMarkAttendance = async (selectedStatus) => {
    setShowAttendanceModal(false);

    const submissionBody = {
      employee_id: user.userId,
      status: selectedStatus,
      
    };

    try {
      const response = await axios.post(ATTENDANCE_SUBMIT_URL, submissionBody);

      if (response.status === 200 || response.status === 201) {
        console.log("Attendance marked successfully:", response.data.message);

        navigation.navigate("Attendance", {
          status: selectedStatus,
          message: response.data.message || "Attendance marked successfully!",
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to mark attendance. Please try again.";
      console.error("❌ Error marking attendance:", errorMessage);

      navigation.navigate("Attendance", {
        status: selectedStatus,
        message: errorMessage,
        error: true,
      });
    }
  };


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
    // 💡 FIX APPLIED: LinearGradient now wraps the entire screen for full coverage.
    <LinearGradient
      colors={["#dbf6faff", "#90dafcff"]}
      style={{ flex: 1 }} // Apply flex: 1 to the gradient for full viewport height
    >
      {/* ❌ REMOVED SafeAreaView - now the content will start from the top edge */}
      {/* <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}> */}
        <View style={styles.mainContentArea_noSafeArea}> 
        {/* 💡 MODIFIED STYLE NAME to account for no SafeAreaView */}
          <Header />
          <View style={styles.introSection}>
            <Text style={styles.welcomeText}>
              Hello {agent.name || "Agent"},
            </Text>
            <Text style={styles.questionText}>
              Welcome to MyChits Agent App
            </Text>
          </View>

          {/* FIX: Only render the main content if user.userId is available */}
          {!user.userId ? (
             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading Agent Data...</Text>
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

                  return (
                    <Animated.View key={card.id} style={[styles.gridCardWrapper, animatedStyle]}>
                      <TouchableOpacity
                        style={[
                          styles.gridCard,
                          { backgroundColor: card.backgroundColor },
                        ]}
                        onPress={card.onPress}
                      >
                        <Image
                          source={card.imagePath}
                          style={styles.cardImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.gridCardText}>{card.name}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      {/* </SafeAreaView> */}

      <AttendanceModal
        attendanceLoading={attendanceLoading}
        selectedStatus={selectedStatus}
        visible={showAttendanceModal}
        message={attendanceMessage}
        onClose={() => setShowAttendanceModal(false)}
        onProceed={handleMarkAttendance}
        handleSubmitAttendance={handleSubmitAttendance}
        note={note}
        setNote={setNote}
      />
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
  // 💡 NEW STYLE TO REPLACE SafeAreaView wrapper behavior (padding from the top for header and content)
  mainContentArea_noSafeArea: { flex: 1, marginHorizontal: 22, marginTop: 40 }, // Increased marginTop to avoid status bar overlap
  
  // mainContentArea: { flex: 1, marginHorizontal: 22, marginTop: 12 }, // ORIGINAL STYLE

  introSection: { marginTop: 20, marginBottom: 20, paddingHorizontal: 5 },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#555",
    marginBottom: 10,
  },
  cardsScrollViewContent: { paddingBottom: 50 },
  cardsGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  // 💡 NEW WRAPPER STYLE for animation (handles spacing and size)
  gridCardWrapper: {
    width: (width - 22 * 2 - 20) / 2, // Matches the width of gridCard
    height: (width - 22 * 2 - 20) / 2, // Matches the height of gridCard
    marginBottom: 20,
  },
  gridCard: {
    // Note: Dimensions are removed from here and moved to gridCardWrapper
    flex: 1, // Fill the wrapper
    borderRadius: 15,
    borderColor: "gold",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    // marginBottom: 20, // Removed from here, moved to gridCardWrapper
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    padding: 5,
  },
  cardImage: { width: 155, height: 90 },
  gridCardText: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    textAlign: "center",
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
    color: "#333",
    marginTop: 20,
  },
  noInternetSubText: { fontSize: 16, color: "#777", marginTop: 10 },
  gradientOverlay: { flex: 1 }, // Retained this style definition although it's no longer used in the component body
});


const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Slightly lighter overlay
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 15, 
    padding: 30,
    alignItems: "center",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1, // Softer shadow
    shadowRadius: 10,
    elevation: 10,
    marginTop: 50,
    borderWidth: 2,
    borderColor: '#108da3ff', // Very light border
  },
  iconHeader: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: -80,
    shadowColor: PRIMARY_COLOR,
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

  // --- STYLISH ACCORDION STYLES (Softened) ---
  accordionHeader: {
    width: "100%",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 5,
    backgroundColor: '#f8f9fa', // Off-white/light background
    borderRadius: 8, // Softer radius
    borderWidth: 1,
    borderColor: '#dcdcdc', // Lighter border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, // Very light shadow
    shadowRadius: 3,
    elevation: 1,
  },
  noteLabel: {
    fontSize: 13, // Slightly smaller font for a cleaner look
    fontWeight: '600',
    color: '#34495e',
  },
  arrowIcon: {
    fontSize: 15,
    color:'#c2c3c4ff' ,
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
  
  // --- Proceed Button (Sleek, Full Gradient) ---
  markAttendanceButtonWrapper: {
    width: "100%",
    marginTop: 30,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: PRIMARY_COLOR,
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