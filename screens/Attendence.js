import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  Platform, 
  ToastAndroid, 
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
// Correct Import for the Base URL
import baseUrl from '../constants/baseUrl'; 

// --- CONSTANTS ---
const { width } = Dimensions.get("window");

const PRIMARY_COLOR = "#00BCD4";
const PRIMARY_GRADIENT_START = "#00E5FF";
const PRIMARY_GRADIENT_END = "#0097A7";
const SUCCESS_COLOR = "#4CAF50";

const ATTENDANCE_SUBMIT_URL = `${baseUrl}/employee-attendance/punch`; 

const cardImagePaths = {
  // Ensure this path is correct relative to Attendence.js
  attendence: require("../assets/ab.png"), 
};
// -----------------------------------------------------


// --- ATTENDANCE MODAL COMPONENT ---
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
  const [scaleAnim] = useState(new Animated.Value(0.5));

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
// -----------------------------------------------------


// --- ATTENDENCE SCREEN COMPONENT ---
const Attendence = ({ navigation, route }) => {
  const { 
    user = {}, 
    status: markedStatus, 
    message: statusMessage, 
    error: isErrorParam 
  } = route.params || {}; 
  
  // Initialize result states based on navigation params
  const [attendanceMarked, setAttendanceMarked] = useState(!!markedStatus);
  const [displayStatus, setDisplayStatus] = useState(markedStatus || '');
  const [displayMessage, setDisplayMessage] = useState(statusMessage || '');
  const [isError, setIsError] = useState(!!isErrorParam);
  
  // Modal visibility: True only if no status was passed (i.e., this is the first interaction)
  const [showModal, setShowModal] = useState(!markedStatus); 
  
  // States for the running submission process
  const [selectedStatus, setSelectedStatus] = useState("Present");
  const [attendanceMessage, setAttendanceMessage] = useState("Eligible to mark attendance");
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // API Submission Logic
  const handleSubmitAttendance = async () => {
    if (!user.userId) {
      Alert.alert("Error", "User ID is missing. Cannot mark attendance.");
      return;
    }

    try {
      setAttendanceLoading(true);
      const response = await axios.post(ATTENDANCE_SUBMIT_URL, {
        employee_id: user.userId,
        status: selectedStatus,
        method: "No Auth",
        type: "in",
      });

      const responseMessage = response?.data?.message || "Attendance Marked Successfully";

      // Set state to display success result on the main screen
      setAttendanceMarked(true);
      setDisplayStatus(selectedStatus);
      setDisplayMessage(responseMessage);
      setIsError(false);

      if (Platform.OS === 'android') {
        ToastAndroid.show(responseMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert("Attendance Marked", responseMessage, [{ text: "OK" }]);
      }
      
    } catch (error) {
      console.log(error.response?.data?.message || error, "error");
      const errorMessage = error.response?.data?.message || "Failed to Mark Attendance. Please try again.";
      
      // Set state to display failure result on the main screen
      setAttendanceMarked(true);
      setDisplayStatus(selectedStatus);
      setDisplayMessage(errorMessage);
      setIsError(true);
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert("Submission Failed", errorMessage, [{ text: "OK" }]);
      }

    } finally {
      setAttendanceLoading(false);
      // 👇 This closes the modal regardless of success/failure, preventing it from showing again automatically.
      setShowModal(false); 
    }
  };

  // Dynamic styles for the result view
  const getStatusStyles = () => {
    const isAbsentOrLeave = displayStatus === 'Absent' || displayStatus === 'On Leave';
    const isFailureStyle = isError || isAbsentOrLeave; 
    
    return {
      container: [
        styles.statusContainer,
        isFailureStyle ? styles.statusContainerNonPresent : styles.statusContainerPresent
      ],
      text: [
        styles.markedText,
        isFailureStyle ? styles.markedTextNonPresent : styles.markedTextPresent
      ]
    };
  };

  const { container: statusContainerStyle, text: markedTextStyle } = attendanceMarked
    ? getStatusStyles()
    : { container: styles.statusContainer, text: styles.markedText };


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#dbf6faff", "#90dafcff"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.container}>
          
          <Text style={styles.title}>Daily Attendance</Text>
          <Text style={styles.dateText}>
            Today is: {new Date().toLocaleDateString()}
          </Text>

          {/* This conditional logic prevents the modal from showing again automatically. */}
          {attendanceMarked ? (
            <View style={statusContainerStyle}>
              <Text style={markedTextStyle}>
                Status: {displayStatus} 
              </Text>
              {displayMessage && (
                   <Text style={styles.timeText}>
                    Message: {displayMessage}
                   </Text>
              )}
              <Text style={styles.timeText}>
                Time: {new Date().toLocaleTimeString()}
              </Text>
            </View>
          ) : (
            // The button is only shown if attendance is NOT marked (either via route or this screen)
            <TouchableOpacity
              style={styles.markButton}
              onPress={() => setShowModal(true)} // User must manually click to open the modal again
              activeOpacity={0.8}
            >
              <Text style={styles.markButtonText}>
                Open Attendance Check
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              Go Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <AttendanceModal
        attendanceLoading={attendanceLoading}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        visible={showModal}
        message={attendanceMessage}
        onClose={() => setShowModal(false)}
        handleSubmitAttendance={handleSubmitAttendance}
      />
    </SafeAreaView>
  );
};

// --- STYLES (Omitted for brevity, assuming they are correct) ---

const styles = StyleSheet.create({
  gradientOverlay: { flex: 1 },
  container: {
    flex: 1,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 40,
  },
  markButton: {
    backgroundColor: PRIMARY_COLOR, 
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    width: '90%', 
  },
  statusContainerPresent: {
    backgroundColor: '#E8F5E9', 
    borderColor: SUCCESS_COLOR,
  },
  statusContainerNonPresent: {
    backgroundColor: '#FFEBEE', 
    borderColor: '#F44336',
  },
  markedText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  markedTextPresent: {
    color: SUCCESS_COLOR,
  },
  markedTextNonPresent: {
    color: '#F44336',
  },
  timeText: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 40,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    textDecorationLine: 'underline',
  }
});


const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)", 
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 12, 
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

  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", 
    width: "100%",
  },
  statusButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    margin: 4,
    minWidth: "47%", 
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statusButtonUnselected: {
  },
  statusButtonSelected: {
    backgroundColor: SUCCESS_COLOR, 
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

export default Attendence;