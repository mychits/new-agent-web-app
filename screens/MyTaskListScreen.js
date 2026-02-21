
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
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native'; // IMPORT ADDED
import axios from "axios";
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color";
import baseUrl from "../constants/baseUrl";

// --- Constants & Config ---
const THEME = {
  primary: "#183A5D",
  accent: "#f8c009ff",
  bgBlue: "#1aa2ccff",
  success: "#27AE60",
  error: "#E74C3C",
  cardBg: "rgba(255, 255, 255, 0.98)",
  white: "#FFFFFF",
  muted: "#8898AA",
  background: "#0f2a44",
};

const headerImage = require('../assets/hero1.jpg');

export default function MyTaskListScreen({ navigation, route }) {
  const { employeeId } = route.params;

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // ADDED STATE FOR REFRESH

  // --- Animation Refs ---
  const refreshScale = useRef(new Animated.Value(1)).current;
  const listFadeAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  
  const animatedCardValues = useRef(new Map()).current;

  // ADDED: useFocusEffect to refresh list when screen comes into focus (e.g. returning from AddTask)
  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [employeeId])
  );

  useEffect(() => {
    // Initial animations
    Animated.spring(headerAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
    
    startFabPulse();
  }, []);

  const startFabPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fabScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    if (!loadingTasks && tasks.length > 0) {
      Animated.timing(listFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loadingTasks, tasks]);

  const handleRefreshPress = () => {
    Animated.sequence([
      Animated.timing(refreshScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(refreshScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      listFadeAnim.setValue(0);
      animatedCardValues.clear();
      fetchTasks();
    });
  };

  // UPDATED: Logic to handle both initial load and pull-to-refresh
  const fetchTasks = async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoadingTasks(true);
    }

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
      setRefreshing(false);
    }
  };

  const getAnimatedValue = (taskId, index) => {
    if (!animatedCardValues.has(taskId)) {
      const val = new Animated.Value(0);
      animatedCardValues.set(taskId, val);
      
      Animated.spring(val, {
        toValue: 1,
        tension: 40,
        friction: 7,
        delay: index * 100, 
        useNativeDriver: true,
      }).start();
    }
    return animatedCardValues.get(taskId);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return THEME.success;
      case 'In Progress': return THEME.accent;
      case 'Pending': return THEME.error;
      default: return THEME.muted;
    }
  };

  const renderTaskItem = ({ item, index }) => {
    const animValue = getAnimatedValue(item._id, index);
    
    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [60, 0]
    });
    const opacity = animValue;
    const scale = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1]
    });

    const cardAnimatedStyle = {
      opacity: opacity,
      transform: [{ translateY }, { scale }],
    };

    const statusColor = getStatusColor(item.status);

    return (
      <Animated.View style={cardAnimatedStyle}>
        <TouchableOpacity
          style={styles.listCard}
          onPress={() => navigation.navigate("Task Detail", { task: item })}
          activeOpacity={0.9}
        >
          <View style={styles.listHeader}>
            <View style={[styles.avatar, { backgroundColor: statusColor + '20' }]}>
              <MaterialCommunityIcons 
                name="clipboard-check-outline" 
                size={20} 
                color={statusColor} 
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.clientName} numberOfLines={1}>{item.taskTitle}</Text>
              <Text style={styles.dateText} numberOfLines={1}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
          
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <Image source={headerImage} style={styles.bgOverlay} blurRadius={12} />
      <LinearGradient 
        colors={["rgba(26, 162, 204, 0.9)", THEME.primary]} 
        style={StyleSheet.absoluteFill} 
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={THEME.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefreshPress} style={styles.refreshBtn} activeOpacity={0.7}>
              <Feather name="refresh-cw" size={20} color={THEME.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <Text style={styles.headerSubTitle}>Manage your daily activities</Text>
        </View>

        <View style={styles.contentContainer}>
          {loadingTasks && tasks.length === 0 ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={THEME.accent} />
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.noTargetCard}>
              <View style={styles.noTargetIconBg}>
                <MaterialCommunityIcons name="clipboard-text-off-outline" size={40} color={THEME.accent} />
              </View>
              <Text style={styles.noTargetTitle}>No Tasks Found</Text>
              <Text style={styles.noTargetSub}>
                Your task list is empty. Tap the + button to add a new task.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Tasks</Text>
                <View style={styles.countBadge}>
                   <Text style={styles.countText}>{tasks.length}</Text>
                </View>
              </View>

              <Animated.FlatList
                data={tasks}
                keyExtractor={(item) => item._id}
                renderItem={renderTaskItem}
                contentContainerStyle={{ paddingBottom: 150 }}
                showsVerticalScrollIndicator={false}
                style={{ opacity: listFadeAnim }}
                // ADDED PULL TO REFRESH PROPS
                refreshing={refreshing}
                onRefresh={() => fetchTasks(true)}
              />
            </>
          )}
        </View>

        {/* FAB */}
        <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddTaskScreen", { employeeId })}
            activeOpacity={0.9}
            style={styles.fabTouchable}
          >
            <LinearGradient 
              colors={[THEME.accent, '#F39C12']}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={32} color={THEME.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: THEME.primary 
  },
  bgOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    opacity: 0.15 
  },
  
  header: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 50 : 20,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "900", 
    color: "#fff", 
    textAlign: 'center', 
    marginTop: 5 
  },
  headerSubTitle: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.7)', 
    textAlign: 'center', 
    marginTop: 2 
  },
  iconCircle: { 
    backgroundColor: "#fff", 
    padding: 8, 
    borderRadius: 12, 
    elevation: 4 
  },
  refreshBtn: { 
    backgroundColor: THEME.accent, 
    padding: 10, 
    borderRadius: 12, 
    elevation: 4 
  },

  contentContainer: { 
    paddingHorizontal: 16, 
    flex: 1 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    color: THEME.white, 
    marginTop: 10, 
    fontWeight: '600', 
    opacity: 0.8 
  },

  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    marginTop: 8 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: "#fff", 
    marginRight: 10 
  },
  countBadge: { 
    backgroundColor: THEME.accent, 
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    borderRadius: 12 
  },
  countText: { 
    color: THEME.primary, 
    fontWeight: '900', 
    fontSize: 12 
  },

  listCard: { 
    backgroundColor: THEME.cardBg, 
    borderRadius: 20, 
    padding: 14, 
    marginBottom: 12,
    elevation: 4
  },
  listHeader: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: '#F5F7FA', 
    justifyContent: "center", 
    alignItems: "center" 
  },
  
  clientName: { 
    fontSize: 15, 
    fontWeight: "800", 
    color: THEME.primary, 
    marginBottom: 2 
  },
  dateText: {
    fontSize: 12,
    color: THEME.muted,
    fontWeight: '600'
  },
  
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: 'uppercase'
  },
  
  listFooter: { 
    marginTop: 12, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: "#F1F4F8", 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  idBadge: {
    backgroundColor: '#F8F9FA', 
    padding: 6, 
    borderRadius: 8, 
  },
  idText: { 
    fontSize: 10, 
    color: THEME.muted, 
    fontWeight: '700' 
  },

  noTargetCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
    marginTop: 50
  },
  noTargetIconBg: { 
    backgroundColor: 'rgba(248, 192, 9, 0.15)', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 10 
  },
  noTargetTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: THEME.primary, 
    marginTop: 5 
  },
  noTargetSub: { 
    fontSize: 13, 
    color: THEME.muted, 
    textAlign: 'center', 
    marginTop: 6, 
    lineHeight: 20 
  },

  fab: {
    position: 'absolute',
    bottom: 90, 
    right: 20,
    borderRadius: 30,
    elevation: 10,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    zIndex: 100,
  },
  fabTouchable: {
    width: 70,
    height: 60,
    borderRadius: 30,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});