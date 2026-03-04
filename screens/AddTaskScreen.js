
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import axios from 'axios';

import baseUrl from "../constants/baseUrl";
import moment from "moment-timezone";
import DateTimePicker from "@react-native-community/datetimepicker";

// Reusing the consistent Color Palette
const COLOR_PALETTE = {
  primary: '#2C3E50',
  secondary: '#7F8C8D',
  lightText: '#FFFFFF',
  darkText: '#000',
  softBlue: '#D6EAF8',
  glassBackground: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.4)',
  shadowColor: 'rgba(0, 0, 0, 0.15)',
  buttonGradientStart: '#4A90E2',
  buttonGradientEnd: '#50E3C2',
  cardBorder: '#D6EAF8',
  accentOrange: '#f8c009ff',
};

const headerImage = require('../assets/hero1.jpg');

/**
 * HELPER: Generates IST time for DISPLAY (12-hour format)
 * Returns format: "25-10-2023 4:04 PM"
 */
const formatIST = (date) => {
  if (!date) return "";
  return moment(date).tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm A");
};

export default function AddTaskScreen({ route, navigation }) {
  const { employeeId: assignedBy } = route.params;

  // --- DATE LOGIC ---
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [startDate, setStartDate] = useState(now);
  const [endDate, setEndDate] = useState(oneHourLater);
  const [status, setStatus] = useState('Pending');
  
  // Picker visibility states
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  // --- EMPLOYEE & LIST LOGIC ---
  const [listData, setListData] = useState([]); // Only holds employees now
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    setSelectedItem(null);
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoadingList(true);
    try {
      const response = await axios.get(`${baseUrl}/agent/get-employee`);
      
      let employees = [];
      // Handle various possible API response structures
      if (Array.isArray(response.data)) {
        employees = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        employees = response.data.data;
      } else if (response.data.employees && Array.isArray(response.data.employees)) {
        employees = response.data.employees;
      } else {
        const keys = Object.keys(response.data);
        for (let key of keys) {
          if (Array.isArray(response.data[key])) {
            employees = response.data[key];
            break;
          }
        }
      }
      setListData(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      Alert.alert("Error", "Could not fetch employees.");
      setListData([]);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSubmit = async () => {
    if (!taskTitle || !taskDescription || !startDate || !endDate || !selectedItem) {
      Alert.alert("Validation Error", "Please fill in all fields and select an employee.");
      return;
    }

    if (endDate <= startDate) {
      Alert.alert("Invalid Date", "End date must be after start date");
      return;
    }

    setSubmitting(true);

    // Payload construction - Hardcoded for Employee logic
    const payload = {
      assignedBy: assignedBy,
      taskTitle,
      taskDescription,
      startDate: startDate,
      endDate: endDate,
      status,
      referred_type: "Employee", // Hardcoded
      assignedTo: selectedItem._id, // Always assigned to employee ID
      lead: null // Not used
    };

    const apiUrl = `${baseUrl}/task/add-new-task`;
    console.log(">>> SENDING REQUEST TO: ", apiUrl);
    console.log(">>> PAYLOAD: ", JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(apiUrl, payload);
      console.log(">>> SUCCESS: ", response.data);
      Alert.alert("Success", "Task added successfully!");
      navigation.goBack();
    } catch (error) {
      console.error(">>> ERROR ADDING TASK:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to add task.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderModalItem = (item, index) => (
    <TouchableOpacity
      style={styles.modalItem}
      key={item._id || item.id || index}
      onPress={() => {
        setSelectedItem(item);
        setIsModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>
        {item.name || item.firstName || item.leadName || JSON.stringify(item)}
      </Text>
      {selectedItem?._id === item._id && (
        <Ionicons name="checkmark-circle" size={24} color={COLOR_PALETTE.buttonGradientEnd} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#24C6DC', '#183A5D']} style={styles.backgroundGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {Platform.OS === 'ios' ? (
          <BlurView intensity={25} tint="light" style={styles.customHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
              <Ionicons name="chevron-back-outline" size={30} color={COLOR_PALETTE.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Task</Text>
            <Image source={headerImage} style={styles.headerRightImage} resizeMode="cover" />
          </BlurView>
        ) : (
          <View style={styles.customHeaderAndroid}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
              <Ionicons name="chevron-back-outline" size={30} color={COLOR_PALETTE.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Task</Text>
            <Image source={headerImage} style={styles.headerRightImage} resizeMode="cover" />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>

            {/* REMOVED TOGGLE CONTAINER - Defaults to Employee */}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Employee</Text>
              <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setIsModalVisible(true)}>
                <Text style={styles.dropdownText}>
                  {selectedItem 
                    ? (selectedItem.name || selectedItem.firstName) 
                    : "Choose an Employee..."}
                </Text>
                <Ionicons name="caret-down" size={20} color={COLOR_PALETTE.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Title</Text>
              <TextInput
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Enter task title"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder="Enter description"
                multiline
                numberOfLines={4}
                style={styles.textInputMultiline}
              />
            </View>

            <View style={styles.rowInputs}>
              {/* START DATE */}
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Start Date (IST)</Text>
                <TouchableOpacity
                  style={styles.textInput}
                  onPress={() => setShowStart(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: startDate ? "#000" : "#999" }}>
                    {startDate ? formatIST(startDate) : "Select start date & time"}
                  </Text>
                </TouchableOpacity>

                {showStart && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    is24Hour={false}
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStart(false);
                      if (selectedDate) setStartDate(selectedDate);
                    }}
                  />
                )}
              </View>

              {/* END DATE */}
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.inputLabel}>End Date (IST)</Text>
                <TouchableOpacity
                  style={styles.textInput}
                  onPress={() => setShowEnd(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: endDate ? "#000" : "#999" }}>
                    {endDate ? formatIST(endDate) : "Select end date & time"}
                  </Text>
                </TouchableOpacity>

                {showEnd && (
                  <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    is24Hour={false}
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEnd(false);
                      if (selectedDate) setEndDate(selectedDate);
                    }}
                  />
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.submitButtonWrapper} onPress={handleSubmit} disabled={submitting}>
              <LinearGradient
                colors={[COLOR_PALETTE.buttonGradientStart, COLOR_PALETTE.buttonGradientEnd]}
                style={styles.submitButton}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLOR_PALETTE.lightText} />
                ) : (
                  <Text style={styles.submitButtonText}>Create Task</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Employee</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={30} color={COLOR_PALETTE.primary} />
              </TouchableOpacity>
            </View>
            {loadingList ? (
              <ActivityIndicator size="large" color={COLOR_PALETTE.primary} style={{ marginTop: 20 }} />
            ) : (
              <ScrollView>
                {Array.isArray(listData) && listData.length > 0 ? (
                  listData.map((item, index) => renderModalItem(item, index))
                ) : (
                  <View style={{ padding: 20, alignItems: 'center', marginTop: 20 }}>
                    <Text style={{ fontSize: 16, color: '#888' }}>
                      No employees found.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', backgroundColor: 'transparent' },
  backgroundGradient: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1, width: '100%', backgroundColor: 'transparent' },
  customHeader: {
    position: 'absolute', top: Platform.OS === 'android' ? 40 : 50, left: 0, right: 0, height: 65,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15,
    zIndex: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLOR_PALETTE.glassBorder,
  },
  customHeaderAndroid: {
    position: 'absolute', top: 40, left: 0, right: 0, height: 65,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15,
  },
  backArrow: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLOR_PALETTE.primary, flex: 1, textAlign: 'center', paddingHorizontal: 10 },
  headerRightImage: { width: 48, height: 48, borderRadius: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 120, paddingBottom: 40 },
  card: {
    backgroundColor: COLOR_PALETTE.glassBackground, width: '100%', padding: 25, borderRadius: 25,
    shadowColor: COLOR_PALETTE.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25,
    shadowRadius: 15, elevation: 12, borderWidth: 1, borderColor: COLOR_PALETTE.cardBorder,
  },
  // Removed toggle styles (toggleContainer, toggleButton, etc.)
  
  inputGroup: { marginBottom: 15, width: '100%' },
  rowInputs: { flexDirection: 'row', width: '100%', marginBottom: 15 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: COLOR_PALETTE.primary, marginBottom: 8, marginLeft: 5 },
  textInput: {
    width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15,
    fontSize: 16, color: COLOR_PALETTE.darkText, borderWidth: 1, borderColor: COLOR_PALETTE.cardBorder,
    justifyContent: 'center', // Added to center text vertically when used as Touchable
  },
  textInputMultiline: {
    width: '100%', minHeight: 100, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15,
    paddingTop: 15, fontSize: 16, color: COLOR_PALETTE.darkText, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLOR_PALETTE.cardBorder,
  },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15,
    borderWidth: 1, borderColor: COLOR_PALETTE.cardBorder,
  },
  dropdownText: { fontSize: 16, color: COLOR_PALETTE.darkText },
  submitButtonWrapper: { width: '100%', marginTop: 20, alignItems: 'center' },
  submitButton: {
    width: '100%', height: 55, borderRadius: 30, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', shadowColor: COLOR_PALETTE.buttonGradientEnd, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 10,
  },
  submitButtonText: { color: COLOR_PALETTE.lightText, fontSize: 18, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '50%',
    paddingTop: 20, paddingHorizontal: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLOR_PALETTE.primary },
  modalItem: {
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  modalItemText: { fontSize: 16, color: COLOR_PALETTE.darkText },
});
