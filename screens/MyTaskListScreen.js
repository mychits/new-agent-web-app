import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  Image,
  ScrollView, // Still imported but not directly used for Payin form anymore
} from "react-native";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient"; // Correctly imported LinearGradient

import COLORS from "../constants/color";
import baseUrl from "../constants/baseUrl";

const COLOR_PALETTE = {
  primary: '#0F2C59',
  secondary: '#607D8B',
  lightText: '#FFFFFF',
  cardBackground: '#FFFFFF',
  errorRed: '#E74C3C',
  greyText: '#5A5A5A',
  accentGreen: '#28B463',
  accentOrange: '#F57C00',
  backgroundLight: '#EBF5F9',
  backgroundDark: '#D6ECF5',
  softBorder: '#C9DCEC',
  successDark: '#1E8449',
  warningDark: '#D35400',
};

const headerImage = require('../assets/hero1.jpg');

export default function MyTaskListScreen({ navigation, route }) {
  const { employeeId } = route.params; // Only employeeId is needed now

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // --- Task List Logic ---
  useEffect(() => {
    fetchTasks();
  }, [employeeId]);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await axios.get(
        `${baseUrl}/task/get-tasks/${employeeId}`
      );
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error.message);
      Alert.alert("Error", "Could not fetch tasks.");
    } finally {
      setLoadingTasks(false);
    }
  };

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Task Detail", { task: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.taskTitle}</Text>
        <Text style={[
          styles.cardSubtitle,
          { color: item.status === "Completed" ? COLOR_PALETTE.accentGreen : COLOR_PALETTE.secondary }
        ]}>
          Status: {item.status}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLOR_PALETTE.secondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#A8E0F9', '#F9E5B5']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <KeyboardAvoidingView
          style={{ flex: 1, width: '100%', alignItems: 'center' }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Custom Header with Back Arrow and Image */}
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
              <Ionicons name="chevron-back-outline" size={30} color={COLOR_PALETTE.primary} />
            </TouchableOpacity>
            <Image
              source={headerImage}
              style={styles.headerRightImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.contentWrapper}>
            {/* Title Section */}
            <View style={styles.titleContainer}>
              <Text style={styles.screenTitle}>My Tasks</Text>
              <Ionicons name="list" size={32} color={COLOR_PALETTE.accentOrange} style={styles.titleIcon} />
            </View>

            {loadingTasks ? (
              <ActivityIndicator size="large" color={COLOR_PALETTE.primary} style={styles.loadingIndicator} />
            ) : tasks.length === 0 ? (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="clipboard-text-off-outline" size={60} color={COLOR_PALETTE.secondary} style={styles.noDataIcon} />
                <Text style={styles.noDataText}>No tasks assigned yet.</Text>
                <Text style={styles.noDataSubText}>Please check back later or contact your manager.</Text>
                <TouchableOpacity onPress={fetchTasks} style={styles.refreshButton}>
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={tasks}
                keyExtractor={(item) => item._id}
                renderItem={renderTaskItem}
                contentContainerStyle={styles.flatListContent}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.white,
  },
  // The gradientOverlay style is correctly defined here
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
  },
  customHeader: {
  position: 'absolute',
  top: Platform.OS === 'android' ? 40 : 50,
  left: 0,
  right: 0,
  height: 65,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start', // Changed
  paddingHorizontal: 10,  

  },
  backArrow: {
     padding: 8,
  marginRight: 6,
  },
  headerRightImage: {

    width: 48,
    height: 48,
    marginLeft: 232,  // Slight space from previous element (if needed)

  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 130 : 125,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40, // Reverted to original margin as toggle button is gone
  },
  screenTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLOR_PALETTE.primary,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    marginRight: 10,
  },
  titleIcon: {
    // Icon styling can go here if needed, color is set inline
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
    backgroundColor: COLOR_PALETTE.cardBackground,
    borderRadius: 28,
    borderLeftWidth: 10,
    borderLeftColor: COLOR_PALETTE.softBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  noDataIcon: {
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLOR_PALETTE.greyText,
    textAlign: 'center',
    marginBottom: 10,
  },
  noDataSubText: {
    fontSize: 16,
    color: COLOR_PALETTE.secondary,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 25,
  },
  refreshButton: {
    marginTop: 15,
    backgroundColor: COLOR_PALETTE.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    shadowColor: COLOR_PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  refreshButtonText: {
    color: COLOR_PALETTE.lightText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: COLOR_PALETTE.cardBackground,
    borderRadius: 15,
    padding: 18,
    marginVertical: 10,
    width: '100%',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    borderColor: COLOR_PALETTE.softBorder,
    borderWidth: 1.5,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: COLOR_PALETTE.primary,
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: COLOR_PALETTE.secondary,
  },
  flatListContent: {
    paddingBottom: 30,
  },
});