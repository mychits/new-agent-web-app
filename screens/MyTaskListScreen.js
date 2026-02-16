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
  Animated,
  ScrollView,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur';

import COLORS from "../constants/color";
import baseUrl from "../constants/baseUrl";

const COLOR_PALETTE = {
  primary: '#2C3E50',
  secondary: '#7F8C8D',
  lightText: '#FFFFFF',
  cardBackground: 'rgba(255, 255, 255, 0.75)',
  errorRed: '#E74C3C',
  greyText: '#4C4C4C',
  accentGreen: '#2ECC71',
  accentOrange: '#f8c009ff',
  backgroundLight: '#E0F7FA',
  backgroundDark: '#BBDEFB',
  softBorder: 'rgba(200, 200, 200, 0.4)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  shadowColor: 'rgba(0, 0, 0, 0.15)',
  gradientStart: '#A8E0F9',
  gradientEnd: '#DAF0F7',
};

const headerImage = require('../assets/hero1.jpg');

export default function MyTaskListScreen({ navigation, route }) {
  console.log(route,"this s route")
  const { employeeId } = route.params;
 

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const refreshScale = useRef(new Animated.Value(1)).current;
  const listFadeAnim = useRef(new Animated.Value(0)).current;
  const animatedCardValues = useRef(new Map()).current;

  useEffect(() => {
    fetchTasks();
  }, []);

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
      listFadeAnim.setValue(0);
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
      Animated.timing(animatedCardValues.get(taskId), {
        toValue: 1,
        duration: 500,
        delay: 50 * index,
        useNativeDriver: true,
      }).start();
    }
    return animatedCardValues.get(taskId);
  };

  const renderTaskItem = ({ item, index }) => {
    const animValue = getAnimatedValue(item._id, index);
    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0]
    });
    const opacity = animValue;

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
    <LinearGradient colors={['#24C6DC', '#183A5D']}
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
                <Text style={styles.noDataSubText}>Tap + to create a new task.</Text>
                <Animated.View style={{ transform: [{ scale: refreshScale }] }}>
                  <TouchableOpacity onPress={handleRefreshPress} style={styles.refreshButton}>
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ) : (
              <Animated.FlatList
                data={tasks}
                keyExtractor={(item) => item._id}
                renderItem={renderTaskItem}
                contentContainerStyle={styles.flatListContent}
                style={{ opacity: listFadeAnim }}
              />
            )}
          </View>

          {/* ADD TASK FAB */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate("AddTaskScreen", { employeeId })}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={30} color={COLOR_PALETTE.darkText} />
          </TouchableOpacity>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 15,
    zIndex: 10,
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
  backArrow: { padding: 10, marginRight: 10 },
  headerRightImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
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
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 5,
  },
  screenTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLOR_PALETTE.primary,
    alignItems: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.18)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    marginRight: 20,
  },
  titleIcon: {},
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
    padding: 30,
    marginTop: 50,
    backgroundColor: COLOR_PALETTE.cardBackground,
    borderRadius: 30,
    borderLeftWidth: 10,
    borderLeftColor: COLOR_PALETTE.softBorder,
    shadowColor: COLOR_PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  noDataIcon: { marginBottom: 25 },
  noDataText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLOR_PALETTE.greyText,
    textAlign: 'center',
    marginBottom: 15,
  },
  noDataSubText: {
    fontSize: 17,
    color: COLOR_PALETTE.secondary,
    textAlign: 'center',
    paddingHorizontal: 15,
    marginBottom: 30,
  },
  refreshButton: {
    marginTop: 15,
    backgroundColor: COLOR_PALETTE.primary,
    paddingVertical: 16,
    paddingHorizontal: 35,
    borderRadius: 15,
    shadowColor: COLOR_PALETTE.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
  },
  refreshButtonText: {
    color: COLOR_PALETTE.lightText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: COLOR_PALETTE.cardBackground,
    borderRadius: 20,
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 40,
    padding: 25,
    marginVertical: 12,
    width: '100%',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: COLOR_PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 15,
    borderLeftWidth: 8,
    borderColor: COLOR_PALETTE.softBorder,
  },
  cardContent: { flex: 1, marginRight: 15 },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLOR_PALETTE.primary,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.08)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLOR_PALETTE.secondary,
  },
  flatListContent: { paddingBottom: 30 },
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "orange",
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 100,
  },
});