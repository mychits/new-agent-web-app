import React, { useEffect, useState, useContext } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  customerOnHold: require("../assets/Holdon2.png"), // Image path for Customer On Hold
  monthlyTurnover: require("../assets/MITB.png"),
  DueReportImage: require("../assets/dues.png"),
};

const AttendanceModal = ({
  attendanceLoading,
  setSelectedStatus,
  selectedStatus,
  visible,
  message,
  onClose,
  handleSubmitAttendance,
}) => {
  const attendanceStatuses = ["Absent", "Present", "On Leave", "Half Day"];

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

          <View style={modalStyles.statusContainer}>
            {attendanceStatuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  modalStyles.statusButton,
                  selectedStatus === status
                    ? modalStyles.statusButtonSelected
                    : modalStyles.statusButtonUnselected,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    modalStyles.statusText,
                    selectedStatus === status && modalStyles.statusTextSelected,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            disabled={!selectedStatus}
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
                <ActivityIndicator size={"large"} />
              ) : (
                <Text style={modalStyles.markAttendanceButtonText}>
                  Submit Status
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

  const handleSubmitAttendance = async () => {
    const ATTENDANCE_SUBMIT_URL = `${baseUrl}/employee-attendance/punch`;
    try {
      setAttendanceLoading(true);
      const response = await axios.post(ATTENDANCE_SUBMIT_URL, {
        employee_id: user?.userId,
        status: selectedStatus,
        method: "No Auth",
        type: "in",
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
          console.warn("Attendance API message:", data.message);
          setShowAttendanceModal(false);
        } else {
          setShowAttendanceModal(false);
        }
      } catch (error) {
        console.error(
          "❌ Error checking attendance status:",
          error.response?.data?.message || error.message
        );
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

  const cardsData = [
    {
      id: "attendence",
      name: "Attendance",
      imagePath: cardImagePaths.attendence,
      // NOTE: Using "Attendance" to match your AppNavigation file (case-sensitive)
      onPress: () => navigation.navigate("Attendance"),
      backgroundColor: "#D9D7F1",
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
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#dbf6faff", "#90dafcff"]}
        style={styles.gradientOverlay}
      >
        <View style={styles.mainContentArea}>
          <Header />
          <View style={styles.introSection}>
            <Text style={styles.welcomeText}>
              Hello {agent.name || "Agent"},
            </Text>
            <Text style={styles.questionText}>
              Welcome to MyChits Agent App
            </Text>
          </View>

          {netInfo.isConnected === false ? (
            renderNoInternet()
          ) : (
            <ScrollView
              contentContainerStyle={styles.cardsScrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.cardsGridContainer}>
                {cardsData.map((card) => (
                  <TouchableOpacity
                    key={card.id}
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
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </LinearGradient>

      <AttendanceModal
        attendanceLoading={attendanceLoading}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        visible={showAttendanceModal}
        message={attendanceMessage}
        onClose={() => setShowAttendanceModal(false)}
        onProceed={handleMarkAttendance}
        handleSubmitAttendance={handleSubmitAttendance}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  mainContentArea: { flex: 1, marginHorizontal: 22, marginTop: 12 },
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
  gridCard: {
    width: (width - 22 * 2 - 20) / 2,
    height: (width - 22 * 2 - 20) / 2,
    borderRadius: 15,
    borderColor: "gold",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
  gradientOverlay: { flex: 1 },
});


const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Very dark overlay
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 12, // Sharp, modern look
    padding: 25,
    alignItems: "center",
    width: "88%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 15,
    marginTop: 50,
    borderWidth: 3,
    borderColor: PRIMARY_COLOR,
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
    shadowRadius: 15,
    elevation: 10,
  },
  modalImage: {
    width: 85,
    height: 65,
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2c3e50",
    marginBottom: 5,
  },
  modalText: {
    marginBottom: 30,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    color: "#7f8c8d",
    lineHeight: 22,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
  closeButtonText: { fontSize: 26, fontWeight: "500", color: "#95a5a6" },

  // --- Status Buttons (Flat, High-Contrast) ---
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Spread out the two main buttons
    width: "100%",
  },
  statusButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    margin: 4,
    minWidth: "47%", // Take up half the width
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statusButtonUnselected: {
    // inherits background
  },
  statusButtonSelected: {
    backgroundColor: SUCCESS_COLOR, // Green for selected status
    borderColor: SUCCESS_COLOR,
    shadowColor: SUCCESS_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#34495e",
  },
  statusTextSelected: {
    color: "white",
  },

  // --- Proceed Button (Sleek, Full Gradient) ---
  markAttendanceButtonWrapper: {
    width: "100%",
    marginTop: 30,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  markAttendanceButton: {
    paddingVertical: 18,
    alignItems: "center",
  },
  markAttendanceButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 0.8,
  },
});

export default Home;
