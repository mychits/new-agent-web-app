import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import Svg, { G, Circle } from 'react-native-svg';

const { width } = Dimensions.get("window");

const Home = ({ route, navigation }) => {
  const { user = {} } = route.params || {};
  const [agent, setAgent] = useState({});
  const [targetData, setTargetData] = useState({ total: 0, achieved: 0, remaining: 0 });
  const [loadingTarget, setLoadingTarget] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Animation for circular progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Use this state to trigger the animation
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    const fetchAgent = async () => {
      if (user && user.userId) {
        try {
          const response = await axios.get(
            `${baseUrl}/agent/get-agent-by-id/${user.userId}`
          );
          if (response.data) {
            setAgent(response.data);
          } else {
            setAgent({});
          }
        } catch (error) {
          setAgent({});
        }
      } else {
        setAgent({});
      }
    };
    fetchAgent();
  }, [user.userId]);

  const fetchTargetDetails = async () => {
    setLoadingTarget(true);
    setIsLoading(true);
    try {
      const agentInfoJson = await AsyncStorage.getItem("agentInfo");
      const agentInfoData = agentInfoJson ? JSON.parse(agentInfoJson) : null;
      const agentId = agentInfoData?._id;
      const designationId = agentInfoData?.designation_id;

      if (!agentId) {
        console.error("User ID not found.");
        setLoadingTarget(false);
        setIsLoading(false);
        return;
      }

      const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
      const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");

      const res = await axios.get(`${baseUrl}/target/get-targets`, {
        params: { fromDate: startOfMonth, toDate: endOfMonth },
      });

      const allTargets = res.data || [];
      const selectedTarget = allTargets.find(
        (t) => (t.agentId && (t.agentId._id === agentId || t.agentId === agentId)) ||
        (!t.agentId && t.designationId === designationId)
      );

      if (!selectedTarget) {
        setLoadingTarget(false);
        setIsLoading(false);
        return;
      }

      const commRes = await axios.get(`${baseUrl}/enroll/get-detailed-commission-per-month`, {
        params: {
          agent_id: agentId,
          from_date: startOfMonth,
          to_date: endOfMonth,
        },
      });

      const actualBusiness = commRes.data?.summary?.actual_business || 0;
      const cleanActual = typeof actualBusiness === "string"
        ? Number(actualBusiness.replace(/[^0-9.-]+/g, ""))
        : actualBusiness;

      const totalTarget = selectedTarget.totalTarget || 0;
      const achievedAmount = cleanActual;
      const remainingAmount = totalTarget > achievedAmount ? totalTarget - achievedAmount : 0;

      setTargetData({
        total: totalTarget,
        achieved: achievedAmount,
        remaining: remainingAmount,
      });

      const newProgress = totalTarget > 0 ? (achievedAmount / totalTarget) * 100 : 0;
      setProgress(newProgress);

    } catch (err) {
      console.error("Error fetching target or commission:", err.response?.data || err.message);
    } finally {
      setLoadingTarget(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTargetDetails();
  }, []);

  const getStrokeDashoffset = (radius, circumference) => {
    const progress = progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: [circumference, 0],
    });
    return progress;
  };

  const circumference = 2 * Math.PI * 65;

  const cardsData = [
    { id: 'addCustomers', name: 'Add Customers', icon: <Feather name="user-plus" size={30} color="#fff" />, onPress: () => navigation.navigate("CustomerNavigation", { screen: "Customer", params: { user } }), bgColor: '#7ab7f3ff', textColor: '#fff' },
    { id: 'myCustomers', name: 'My Customers', icon: <Feather name="users" size={30} color="#fff" />, onPress: () => navigation.navigate("CustomerNavigation", { screen: "ViewEnrollments", params: { user } }), bgColor: '#4CAF50', textColor: '#fff' },
    { id: 'myLeads', name: 'My Leads', icon: <Feather name="share" size={30} color="#fff" />, onPress: () => navigation.navigate("PayNavigation", { screen: "ViewLeads", params: { user: user } }), bgColor: '#FF8C00', textColor: '#fff' },
    { id: 'targets', name: 'Targets', icon: <MaterialCommunityIcons name="bullseye-arrow" size={30} color="#fff" />, onPress: () => navigation.navigate("Target"), bgColor: '#9370DB', textColor: '#fff' },
    { id: 'daybook', name: 'Daybook', icon: <Feather name="book" size={30} color="#fff" />, onPress: () => navigation.navigate("PayNavigation", { user: user }), bgColor: '#00CED1', textColor: '#fff' },
    { id: 'collections', name: 'Collections', icon: <Feather name="credit-card" size={30} color="#fff" />, onPress: () => navigation.navigate("PaymentNavigator"), bgColor: '#DC143C', textColor: '#fff' },
    { id: 'reports', name: 'Reports', icon: <Feather name="bar-chart-2" size={30} color="#fff" />, onPress: () => navigation.navigate("PayNavigation", { screen: "Reports", params: { user: user } }), bgColor: '#696969', textColor: '#fff' },
    { id: 'commission', name: 'Commission', icon: <Feather name="dollar-sign" size={30} color="#fff" />, onPress: () => navigation.navigate("CustomerNavigation", { screen: "Commissions", params: { user: user } }), bgColor: '#20B2AA', textColor: '#fff' },
    { id: 'myTasks', name: 'My Tasks', icon: <Feather name="check-square" size={30} color="#fff" />, onPress: () => navigation.navigate("MyTasks", { employeeId: user.userId, agentName: agent.name }), bgColor: '#999049ff', textColor: '#fff' },
  ].filter(Boolean);

  return (
    <LinearGradient
      colors={['#dbf6faff', '#90dafcff']}
      style={styles.gradientOverlay}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.mainContentArea}>
            <Header />
            <View style={styles.introSection}>
              <View style={styles.greetingContainer}>
                <Text style={styles.welcomeText}>Dear {agent.name || 'Agent'},</Text>
              </View>
            </View>
            <View style={styles.topSection}>
              <LinearGradient
                colors={['#64B5F6', '#2196F3']}
                style={styles.performanceCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.performanceContent}>
                  <View style={styles.circularProgressContainer}>
                    <Text style={styles.performanceValue}>
                      {loadingTarget ? '...' : `${(targetData.achieved / targetData.total * 100).toFixed(0)}%`}
                    </Text>
                    <Animated.View style={StyleSheet.absoluteFillObject}>
                      <AnimatedSvg width="100%" height="100%" viewBox="0 0 150 150">
                        <G rotation="-90" origin="75, 75">
                          <Circle
                            cx="75"
                            cy="75"
                            r="65"
                            stroke="#E0E0E0"
                            strokeWidth="10"
                            fill="transparent"
                          />
                          <Circle
                            cx="75"
                            cy="75"
                            r="65"
                            stroke="#FFD700"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={getStrokeDashoffset(65, circumference)}
                            strokeLinecap="round"
                          />
                        </G>
                      </AnimatedSvg>
                    </Animated.View>
                  </View>
                  <Text style={styles.performanceLabel}>Target Achieved</Text>
                </View>
              </LinearGradient>
              <LinearGradient
                colors={['#81C784', '#4CAF50']}
                style={styles.metricsCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricLabel}>Total Target</Text>
                    <Text style={styles.metricValue}>
                      {loadingTarget ? '...' : `₹${targetData.total.toLocaleString('en-IN')}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricLabel}>Achieved Business</Text>
                    <Text style={styles.metricValue}>
                      {loadingTarget ? '...' : `₹${targetData.achieved.toLocaleString('en-IN')}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricLabel}>Remaining to Achieve</Text>
                    <Text style={styles.metricValue}>
                      {loadingTarget ? '...' : `₹${targetData.remaining.toLocaleString('en-IN')}`}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
            <Text style={styles.gridSectionTitle}>Services</Text>
            <ScrollView contentContainerStyle={styles.cardsScrollViewContent} showsVerticalScrollIndicator={false}>
              <View style={styles.cardsGridContainer}>
                {cardsData.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.gridCardWrapper}
                    onPress={card.onPress}
                  >
                    <View style={[styles.gridCard, { backgroundColor: card.bgColor }]}>
                      {card.icon}
                      <Text style={[styles.gridCardText, { color: card.textColor }]}>{card.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContentArea: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  introSection: {
    marginTop: 1,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  greetingContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "bold",
    color: '#333',
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    color: '#555',
    marginTop: 5,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  performanceCard: {
    width: '48%',
    borderRadius: 20,
    height: 200,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  performanceContent: {
    alignItems: 'center',
  },
  circularProgressContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  performanceValue: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  performanceLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  metricsCard: {
    width: '48%',
    borderRadius: 20,
    height: 200,
    padding: 20,
    justifyContent: 'space-around',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  metricItem: {
    marginBottom: 5,
  },
  metricHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  metricLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  metricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 1,
  },
  cardsScrollViewContent: {
    paddingBottom: 50,
  },
  cardsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCardWrapper: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  gridCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  gridCardText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Home;