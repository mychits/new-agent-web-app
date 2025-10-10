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
  Animated,
  Easing,
  ToastAndroid,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import baseUrl from "../constants/baseUrl";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { AgentContext } from "../context/AgentContextProvider";
import { useNetInfo } from "@react-native-community/netinfo";

const { width } = Dimensions.get("window");

const PRIMARY_COLOR = "#00BCD4";
const PRIMARY_GRADIENT_START = "#00E5FF";
const PRIMARY_GRADIENT_END = "#0097A7";
const SUCCESS_COLOR = "#4CAF50";

const AttendanceModal = ({
  attendanceLoading,
  selectedStatus,
  visible,
  message,
  onClose,
  handleSubmitAttendance,
  note,
  setNote,
  isAlreadyMarked, // ✅ Use this prop for conditional rendering
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
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
{/*           <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Text style={modalStyles.closeButtonText}>✕</Text>
          </TouchableOpacity> */}

          <LinearGradient
            colors={[PRIMARY_GRADIENT_START, PRIMARY_GRADIENT_END]}
            style={modalStyles.iconHeader}
          >
            <Animated.View style={[modalStyles.modalImagePlaceholder, animatedImageStyle]}>
              {/* Change icon based on status */}
              <Text style={modalStyles.modalImagePlaceholderText}>
                {isAlreadyMarked ? "✅" : "🗓️"}
              </Text>
            </Animated.View>
          </LinearGradient>

          <Text style={modalStyles.modalHeading}>Daily Status Check</Text>
          <Text style={modalStyles.modalText}>{message}</Text>
          {!isAlreadyMarked && (
            <>
              <TouchableOpacity
                style={modalStyles.accordionHeader}
                onPress={() => setIsNoteOpen(!isNoteOpen)}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.noteLabel}>
                  {isNoteOpen ? "Hide Note" : "Add a Note (Optional)"}
                </Text>
                <Text style={modalStyles.arrowIcon}>{isNoteOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>

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
                      : [PRIMARY_GRADIENT_START, PRIMARY_GRADIENT_END]
                  }
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={modalStyles.markAttendanceButton}
                >
                  {attendanceLoading ? (
                    <ActivityIndicator size={"small"} color={"#fff"} />
                  ) : (
                    <Text style={modalStyles.markAttendanceButtonText}>PRESENT</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const Home = ({ route, navigation }) => {
  const { user = {}, agentInfo = {} } = route.params || {};
  const [agent, setAgent] = useState({});
  const [selectedStatus] = useState("Present");
  const { modifyPayment, setModifyPayment } = useContext(AgentContext);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const netInfo = useNetInfo();
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [note, setNote] = useState("");
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  // ✅ Renaming for clarity and ensuring it controls the modal's internal state
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false); 

  // Function to show box when already marked or submit attendance
  const handleSubmitAttendance = async () => {
    const ATTENDANCE_SUBMIT_URL = `${baseUrl}/employee-attendance/punch`;
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

      if (responseMessage === "Attendance Already Marked") {
        // Show the "Attendance Already Marked" box on the home screen
        setAlreadyMarked(true); 
        // Set this to true so the modal hides the buttons/note next time it opens
        setIsAlreadyMarked(true); 
      } else {
        ToastAndroid.show(
          responseMessage || "Attendance Marked Successfully",
          ToastAndroid.SHORT
        );
        setAlreadyMarked(false);
        setIsAlreadyMarked(false);
      }
    } catch (error) {
      console.log("❌ Error marking attendance:", error.message);
      ToastAndroid.show("Failed to Mark Attendance", ToastAndroid.SHORT);
      setAlreadyMarked(false);
      setIsAlreadyMarked(false);
    } finally {
      setAttendanceLoading(false);
      setShowAttendanceModal(false);
      setNote("");
    }
  };

  // ... (Other useEffects remain the same)

  useEffect(() => {
    const checkAttendance = async () => {
      const ATTENDANCE_MODAL_URL = `${baseUrl}/employee-attendance/modal`;
      const body = { employee_id: user.userId };

      try {
        const response = await axios.post(ATTENDANCE_MODAL_URL, body);
        const data = response.data;
        console.log(" Attendance API Response:", data);
        
        if (data?.showModal === true) {
          setAttendanceMessage(data.message || "Eligible to mark attendance");
          setAlreadyMarked(false); 
          // ✅ User can mark attendance, so button/note should be visible
          setIsAlreadyMarked(false); 
          setShowAttendanceModal(true);
        } else {
          setAttendanceMessage("Attendance Already Marked");
          setAlreadyMarked(false); // Only show the status in the modal
          // ✅ Attendance is already marked, so button/note should be hidden
          setIsAlreadyMarked(true); 
          setShowAttendanceModal(true);
        }
      } catch (error) {
        console.error(
          "❌ Error checking attendance status:",
          error.response?.data?.message || error.message
        );

        setAttendanceMessage(
          error.response?.data?.message || "Unable to fetch attendance status"
        );
        // On API error, we assume the user can't mark attendance.
        setIsAlreadyMarked(true); 
        setShowAttendanceModal(true);
      }
    };

    if (user.userId && netInfo.isConnected) checkAttendance();
  }, [user.userId, netInfo.isConnected]);


  const renderNoInternet = () => (
    <View style={styles.noInternetContainer}>
      <Text style={styles.noInternetTextEmoji}>📵</Text> 
      <Text style={styles.noInternetText}>Oops! No internet connection.</Text>
      <Text style={styles.noInternetSubText}>
        Please check your network and try again.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#dbf6faff", "#90dafcff"]} style={styles.gradientOverlay}>
        <View style={styles.mainContentArea}>
          {/* Show Attendance Already Marked Box */}
          {alreadyMarked && (
            <View style={styles.attendanceBox}>
              <Text style={styles.attendanceBoxText}>Attendance Already Marked</Text>
            </View>
          )}

          {!user.userId ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={{ marginTop: 10, color: "#666" }}>Loading Agent Data...</Text>
            </View>
          ) : netInfo.isConnected === false ? (
            renderNoInternet()
          ) : (
            <ScrollView
              contentContainerStyle={styles.cardsScrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.cardsGridContainer}></View>
              {/* Add your home screen content cards here */}
            </ScrollView>
          )}
        </View>
      </LinearGradient>
        {/* The modal is shown regardless, but its internal content depends on isAlreadyMarked */}
        <AttendanceModal
          attendanceLoading={attendanceLoading}
          selectedStatus={selectedStatus}
          visible={showAttendanceModal}
          message={attendanceMessage}
          onClose={() => setShowAttendanceModal(false)}
          handleSubmitAttendance={handleSubmitAttendance}
          note={note}
          setNote={setNote}
          isAlreadyMarked={isAlreadyMarked} // ✅ Passing the state to control modal elements
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContentArea: { flex: 1, marginHorizontal: 22, marginTop: 12 },
  cardsScrollViewContent: { paddingBottom: 50 },
  cardsGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  gradientOverlay: { flex: 1 },
  attendanceBox: {
    backgroundColor: "#ffe4b5",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffb84d",
    marginBottom: 10,
    alignItems: "center",
  },
  attendanceBoxText: {
    color: "#ff6600",
    fontWeight: "bold",
    fontSize: 16,
  },
  noInternetContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  noInternetText: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 20 },
  noInternetSubText: { fontSize: 16, color: "#777", marginTop: 10 },
  noInternetTextEmoji: { fontSize: 100 },
});

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
    borderColor: "#108da3ff",
  },
  iconHeader: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: -80,
  },
  modalImagePlaceholder: { 
    width: 85, 
    height: 65, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalImagePlaceholderText: {
    fontSize: 50,
  },
  modalHeading: { fontSize: 26, fontWeight: "900", color: "#2c3e50", marginBottom: 5 },
  modalText: { textAlign: "center", fontSize: 16, color: "#7f8c8d", marginBottom: 25 },
  closeButton: { position: "absolute", top: 15, right: 15, padding: 5, zIndex: 10 },
  closeButtonText: { fontSize: 28, fontWeight: "300", color: "#95a5a6" },
  accordionHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 5,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dcdcdc",
  },
  noteLabel: { fontSize: 13, fontWeight: "600", color: "#34495e" },
  arrowIcon: { fontSize: 15, color: "#c2c3c4ff", fontWeight: "900" },
  accordionContent: { width: "100%", marginTop: 6, marginBottom: 8, marginRight: 50 },
  inputField: {
    width: "100%",
    minHeight: 90,
    borderColor: "#dcdcdc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#34495e",
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  markAttendanceButtonWrapper: {
    width: "100%",
    marginTop: 30,
    borderRadius: 10,
    overflow: "hidden",
  },
  markAttendanceButton: { paddingVertical: 18, alignItems: "center" },
  markAttendanceButtonText: {
    color: "white", 
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 19,
    letterSpacing: 1,
  },
});

export default Home;