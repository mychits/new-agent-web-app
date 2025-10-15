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
  Animated, // Import Animated for new animations
  ScrollView,
} from "react-native";
import React, { useEffect, useState, useRef } from "react"; // Import useRef
import axios from "axios";
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons'; // Ensure Feather is imported
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur'; // Import BlurView for true glassmorphism on iOS

import COLORS from "../constants/color";
import baseUrl from "../constants/baseUrl";

const COLOR_PALETTE = {
  primary: '#2C3E50', // Deeper, professional dark blue (matching Target.js)
  secondary: '#7F8C8D', // Muted, sophisticated gray for labels (matching Target.js)
  lightText: '#FFFFFF', // Pure white
  cardBackground: 'rgba(255, 255, 255, 0.75)', // Translucent white for glass effect
  errorRed: '#E74C3C', // Vibrant error red
  greyText: '#4C4C4C', // Dark grey for general text
  accentGreen: '#2ECC71', // Vibrant emerald green for success (matching Target.js)
  accentOrange: '#F39C12', // Warm, energetic orange for attention/progress (matching Target.js)
  backgroundLight: '#E0F7FA', // Soft, light aqua blue (matching Target.js)
  backgroundDark: '#BBDEFB',  // Slightly deeper, calm blue (matching Target.js)
  softBorder: 'rgba(200, 200, 200, 0.4)', // Very soft, translucent grey for borders
  glassBorder: 'rgba(255, 255, 255, 0.3)', // Lighter, more translucent border for glassmorphism
  shadowColor: 'rgba(0, 0, 0, 0.15)', // Default shadow color
  gradientStart: '#A8E0F9', // Light blue, used for background gradient
  gradientEnd: '#DAF0F7', // Slightly lighter blue, used for background gradient
};

const headerImage = require('../assets/hero1.jpg'); // Your header image

export default function MyTaskListScreen({ navigation, route }) {
  const { employeeId } = route.params;

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Animation values
  const refreshScale = useRef(new Animated.Value(1)).current;
  const listFadeAnim = useRef(new Animated.Value(0)).current; // For FlatList fade-in
  const animatedCardValues = useRef(new Map()).current; // For staggered card entry

  useEffect(() => {
    fetchTasks();
  }, [employeeId]);

  useEffect(() => {
    if (!loadingTasks && tasks.length > 0) {
      Animated.timing(listFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [loadingTasks, tasks]);

  const handleRefreshPress = () => {
    Animated.sequence([
      Animated.timing(refreshScale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(refreshScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      listFadeAnim.setValue(0); // Reset animation
      // Clear card animations so they re-stagger on fetchTasks
      animatedCardValues.clear(); 
      fetchTasks();
    });
  };

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

  const getAnimatedValue = (taskId, index) => {
    if (!animatedCardValues.has(taskId)) {
      animatedCardValues.set(taskId, new Animated.Value(0));
      // Stagger the animation start for a stylish cascade effect
      Animated.timing(animatedCardValues.get(taskId), {
        toValue: 1,
        duration: 500,
        delay: 50 * index, // Staggered delay
        useNativeDriver: true,
      }).start();
    }
    return animatedCardValues.get(taskId);
  };


  const renderTaskItem = ({ item, index }) => {
    // Apply Card Entry Animation
    const animValue = getAnimatedValue(item._id, index);
    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0] // Slide up from 50px below
    });
    const opacity = animValue; // Fade in

    const cardAnimatedStyle = {
        opacity: opacity,
        transform: [{ translateY }],
    };

    return (
        <Animated.View style={cardAnimatedStyle}>
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
                <Ionicons name="chevron-forward" size={26} color={COLOR_PALETTE.secondary} />
            </TouchableOpacity>
        </Animated.View>
    );
  };

  return (
    // 💡 CHANGE APPLIED: LinearGradient is now the root container with style={{ flex: 1 }}
    <LinearGradient
      colors={["#dbf6faff", "#90dafcff"]} 
      style={{ flex: 1 }} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <KeyboardAvoidingView
          style={{ flex: 1, width: '100%', alignItems: 'center' }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Custom Header with Back Arrow and Image */}
          {Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="light" style={styles.customHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                <Ionicons name="chevron-back-outline" size={32} color={COLOR_PALETTE.primary} />
              </TouchableOpacity>
              <Image
                source={headerImage}
                style={styles.headerRightImage}
                resizeMode="cover"
              />
            </BlurView>
          ) : (
            <View style={styles.customHeaderAndroid}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                <Ionicons name="chevron-back-outline" size={32} color={COLOR_PALETTE.primary} />
              </TouchableOpacity>
              <Image
                source={headerImage}
                style={styles.headerRightImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.contentWrapper}>
            {/* Title Section */}
            <View style={styles.titleContainer}>
              <Text style={styles.screenTitle}>My Tasks</Text>
              <Ionicons name="list" size={34} color={COLOR_PALETTE.accentOrange} style={styles.titleIcon} />

            </View>

            {loadingTasks ? (
              <ActivityIndicator size="large" color={COLOR_PALETTE.primary} style={styles.loadingIndicator} />
            ) : tasks.length === 0 ? (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="clipboard-text-off-outline" size={65} color={COLOR_PALETTE.secondary} style={styles.noDataIcon} />
                <Text style={styles.noDataText}>No tasks assigned yet.</Text>
                <Text style={styles.noDataSubText}>Please check back later or contact your manager.</Text>
                {/* Apply Refresh Animation */}
                <Animated.View style={{ transform: [{ scale: refreshScale }] }}>
                  <TouchableOpacity onPress={handleRefreshPress} style={styles.refreshButton}>
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ) : (
              <Animated.FlatList // Apply List Fade-in Animation
                data={tasks}
                keyExtractor={(item) => item._id}
                renderItem={renderTaskItem}
                contentContainerStyle={styles.flatListContent}
                style={{ opacity: listFadeAnim }} // Apply fade animation to the list
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // 💡 REMOVED: styles.container is no longer needed

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
    height: 70, // Slightly taller header
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 15,
    zIndex: 10,
    // Glassmorphism specific for iOS BlurView
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLOR_PALETTE.glassBorder,
    overflow: 'hidden',
    shadowColor: COLOR_PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  customHeaderAndroid: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backArrow: {
    padding: 10, // Increased padding for easier tap
    marginRight: 10,
  },
  headerRightImage: {
    width: 55, // Larger image
    height: 55, // Larger image
    borderRadius: 27.5, // Perfect circle
    marginLeft: 'auto',
    marginRight: 15,
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
  alignItems: 'center',     // vertically centers children in the row
  justifyContent: 'center', // horizontally centers content within the container
  width: '100%',
  marginBottom: 40,
  paddingHorizontal: 5,
},
  screenTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLOR_PALETTE.primary,
     alignItems: 'center',
    letterSpacing: 0.5, // Increased letter spacing
    textShadowColor: 'rgba(0, 0, 0, 0.18)', // More pronounced shadow
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    marginRight: 20, // Keep some margin
  },
  titleIcon: {
    // Icon styling handled inline in render
  },
  refreshIconContainer: {
    padding: 14, // Increased padding
    borderRadius: 30,
    backgroundColor: COLORS.white,
    shadowColor: COLOR_PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 4 }, // Deeper shadow
    shadowOpacity: 0.2, // More visible shadow
    shadowRadius: 6,
    elevation: 6,
    marginLeft: 'auto', // Pushes it to the right
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
    padding: 30, // More padding
    marginTop: 50,
    backgroundColor: COLOR_PALETTE.cardBackground,
    borderRadius: 30, // More rounded
    borderLeftWidth: 10,
    borderLeftColor: COLOR_PALETTE.softBorder,
    shadowColor: COLOR_PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, // More visible
    shadowRadius: 12,
    elevation: 10,
  },
  noDataIcon: {
    marginBottom: 25, // More space
  },
  noDataText: {
    fontSize: 22, // Larger text
    fontWeight: '700',
    color: COLOR_PALETTE.greyText,
    textAlign: 'center',
    marginBottom: 15,
  },
  noDataSubText: {
    fontSize: 17, // Larger text
    color: COLOR_PALETTE.secondary,
    textAlign: 'center',
    paddingHorizontal: 15,
    marginBottom: 30, // More space
  },
  refreshButton: {
    marginTop: 15,
    backgroundColor: COLOR_PALETTE.primary,
    paddingVertical: 16, // More padding
    paddingHorizontal: 35, // More padding
    borderRadius: 15, // More rounded
    shadowColor: COLOR_PALETTE.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
  },
  refreshButtonText: {
    color: COLOR_PALETTE.lightText,
    fontSize: 18, // Larger text
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: COLOR_PALETTE.cardBackground,
    borderRadius: 20, // More uniform rounded corners
    borderTopLeftRadius: 40, // More rounded top-left
    borderBottomRightRadius: 40, // More rounded bottom-right
    padding: 25, // More padding
    marginVertical: 12, // More vertical space
    width: '100%',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: COLOR_PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 8 }, // Deeper shadow
    shadowOpacity: 0.25, // More visible shadow
    shadowRadius: 15, // Softer shadow
    elevation: 15, // Even higher elevation for depth
    borderLeftWidth: 8, // Thicker border
    borderColor: COLOR_PALETTE.softBorder,
  },
  cardContent: {
    flex: 1,
    marginRight: 15,
  },
  cardTitle: {
    fontSize: 20, // Larger
    fontWeight: "bold",
    color: COLOR_PALETTE.primary,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.08)', // Subtle text shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  cardSubtitle: {
    fontSize: 16, // Larger
    fontWeight: "600",
    color: COLOR_PALETTE.secondary,
  },
  flatListContent: {
    paddingBottom: 30,
  },
});