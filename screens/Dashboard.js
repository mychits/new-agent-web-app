import React, { useEffect, useState, useRef } from "react";
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
// Removed: import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Svg, { G, Circle, Defs, Stop, RadialGradient } from "react-native-svg";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";

import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

const { width } = Dimensions.get("window");
const circumference = 2 * Math.PI * 65;

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const Dashboard = ({ route, navigation }) => {
  const { user = {} } = route.params || {};
  const [agent, setAgent] = useState({});
  const [targetData, setTargetData] = useState({
    total: 0,
    achieved: 0,
    remaining: 0,
  });
  const [totalCollection, setTotalCollection] = useState(0);
  const [todayPayments, setTodayPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation for circular progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
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

  const fetchTargetDetails = async (agentId, designationId) => {
    try {
      const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
      const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");

      const res = await axios.get(`${baseUrl}/target/get-targets`, {
        params: { fromDate: startOfMonth, toDate: endOfMonth },
      });

      const allTargets = res.data || [];
      const selectedTarget = allTargets.find(
        (t) =>
          (t.agentId && (t.agentId._id === agentId || t.agentId === agentId)) ||
          (!t.agentId && t.designationId === designationId)
      );

      if (!selectedTarget) {
        setTargetData({ total: 0, achieved: 0, remaining: 0 });
        setProgress(0);
        return;
      }

      const commRes = await axios.get(
        `${baseUrl}/enroll/get-detailed-commission-per-month`,
        {
          params: {
            agent_id: agentId,
            from_date: startOfMonth,
            to_date: endOfMonth,
          },
        }
      );

      const actualBusiness = commRes.data?.summary?.actual_business || 0;
      const cleanActual =
        typeof actualBusiness === "string"
          ? Number(actualBusiness.replace(/[^0-9.-]+/g, ""))
          : actualBusiness;

      const totalTarget = selectedTarget.totalTarget || 0;
      const achievedAmount = cleanActual;
      const remainingAmount =
        totalTarget > achievedAmount ? totalTarget - achievedAmount : 0;

      setTargetData({
        total: totalTarget,
        achieved: achievedAmount,
        remaining: remainingAmount,
      });

      const newProgress =
        totalTarget > 0 ? (achievedAmount / totalTarget) * 100 : 0;
      setProgress(newProgress);
    } catch (err) {
      console.error(
        "Error fetching target or commission:",
        err.response?.data || err.message
      );
      setTargetData({ total: 0, achieved: 0, remaining: 0 });
      setProgress(0);
    }
  };

  const fetchCollectionDetails = async (agentId) => {
    try {
      const response = await axios.get(
        `${baseUrl}/payment/get-payment-agent/${agentId}`
      );
      const payments = response.data || [];

      const today = moment().format("YYYY-MM-DD");
      const filteredTodayPayments = payments.filter((payment) =>
        moment(payment.pay_date).format("YYYY-MM-DD") === today
      );

      setTodayPayments(filteredTodayPayments);

      const totalAmount = filteredTodayPayments.reduce((sum, payment) => {
        const amount = parseFloat(payment.amount) || 0;
        return sum + amount;
      }, 0);

      setTotalCollection(totalAmount);
    } catch (error) {
      console.error("Error fetching collection data:", error);
      setTotalCollection(0);
      setTodayPayments([]);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const agentInfoJson = await AsyncStorage.getItem("agentInfo");
        const agentInfoData = agentInfoJson ? JSON.parse(agentInfoJson) : null;
        const agentId = agentInfoData?._id;
        const designationId = agentInfoData?.designation_id;

        if (agentId) {
          await Promise.all([
            fetchTargetDetails(agentId, designationId),
            fetchCollectionDetails(agentId),
          ]);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const getStrokeDashoffset = () => {
    const dashoffset = progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: [circumference, 0],
    });
    return dashoffset;
  };

  const getProgressColor = () => {
    if (progress < 50) return "#FF4B2B";
    if (progress < 80) return "#FFD349";
    return "#5EBD3E";
  };

  const getMotivationalMessage = () => {
    const percentage = ((targetData.achieved / targetData.total) * 100).toFixed(0);
    if (targetData.total === 0) {
      return "No target set yet. Check back soon!";
    } else if (percentage === 0) {
      return "Start strong and make today count!";
    } else if (percentage < 50) {
      return "You're off to a great start. Keep pushing!";
    } else if (percentage < 80) {
      return "You're so close to your goal. Go for it!";
    } else if (percentage >= 100) {
      return "Outstanding performance! Exceed your targets!";
    } else {
      return "Keep up the excellent work!";
    }
  };

  const handlePerformancePress = () => {
    navigation.navigate("Target");
  };

  return (
    <LinearGradient
      colors={["#dbf6faff", "#90dafcff"]}
      style={styles.gradientOverlay}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Removed: <SafeAreaView style={{ flex: 1 }}> */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.mainContentArea}>
            <Header />
            <View style={styles.introSection}>
              <View style={styles.greetingContainer}>
                <Text style={styles.welcomeText}>
                  Dear {agent.name || "Agent"},
                </Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
             
              <View style={styles.targetSection}>
                <LinearGradient
                  colors={["#E0E0E0", "#E0E0E0"]}
                  style={styles.performanceCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.performanceContent}>
                    {/* Left side: Circular Progress */}
                    <View style={styles.circularProgressContainer}>
                      <Animated.View style={StyleSheet.absoluteFillObject}>
                        <AnimatedSvg
                          width="100%"
                          height="100%"
                          viewBox="0 0 150 150"
                        >
                          <Defs>
                            <RadialGradient
                              id="grad"
                              cx="50%"
                              cy="50%"
                              r="50%"
                              fx="50%"
                              fy="50%"
                            >
                              <Stop offset="0%" stopColor="#FF4B2B" />
                              <Stop offset="50%" stopColor="#FFD349" />
                              <Stop offset="100%" stopColor="#5EBD3E" />
                            </RadialGradient>
                          </Defs>
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
                              stroke={targetData.total > 0 ? "url(#grad)" : "#E0E0E0"}
                              strokeWidth="10"
                              fill="transparent"
                              strokeDasharray={circumference}
                              strokeDashoffset={getStrokeDashoffset()}
                              strokeLinecap="round"
                            />
                          </G>
                        </AnimatedSvg>
                      </Animated.View>
                      <Text style={[styles.performanceValue, { color: getProgressColor() }]}>
                        {targetData.total > 0
                          ? `${((targetData.achieved / targetData.total) * 100).toFixed(0)}%`
                          : "0%"}
                      </Text>
                    </View>

                    {/* Right side: Text and Button */}
                    <View style={styles.textAndButtonContainer}>
                      <Text style={styles.performanceLabel}>Target Achieved</Text>
                      <Text style={styles.motivationalText}>
                        {getMotivationalMessage()}
                      </Text>
                      <TouchableOpacity
                        style={styles.performanceButton}
                        onPress={handlePerformancePress}
                      >
                        <Text style={styles.performanceButtonText}>
                          Performance
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Today's Collection Section */}
              <View style={styles.collectionSection}>
                <View style={styles.collectionCard}>
                  <LinearGradient
                    colors={["#ecc281ff", "#da8201"]}
                    style={styles.collectionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.collectionContent}>
                      <View style={styles.collectionIconContainer}>
                        <Feather name="trending-up" size={40} color="#fff" />
                      </View>
                      <View style={styles.collectionTextContainer}>
                        <Text style={styles.collectionLabel}>
                          Today's Collection
                        </Text>
                        <Text style={styles.collectionValue}>
                          {`₹${totalCollection.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </View>

              {/* Collection Details List */}
              <View style={[styles.detailListContainer, { marginBottom: 70 }]}>
                <Text style={styles.detailListTitle}>Collection Details</Text>
                {todayPayments.length > 0 ? (
                  <ScrollView style={styles.detailScrollView}>
                    {todayPayments.map((payment, index) => (
                      <View key={index} style={styles.paymentItemCard}>
                        <Text style={styles.paymentItemText}>
                          <Text style={styles.paymentItemLabel}>Customer:</Text>{" "}
                          {payment?.user_id?.full_name || "N/A"}
                        </Text>
                        <Text style={styles.paymentItemText}>
                          <Text style={styles.paymentItemLabel}>Amount:</Text> ₹{" "}
                          {parseFloat(payment.amount || 0).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </Text>
                        <Text style={styles.paymentItemText}>
                          <Text style={styles.paymentItemLabel}>
                            Receipt No:
                          </Text>{" "}
                          {payment.receipt_no || "N/A"}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noPaymentsText}>
                    No payments collected today.
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      {/* Removed: </SafeAreaView> */}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContentArea: {
    flex: 1,
    paddingHorizontal: 28,
    // Pushed the Header down by increasing paddingTop
    paddingTop: 30, 
  },
  introSection: {
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  greetingContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
  },
  targetSection: {
    width: "100%",
    marginBottom: 20,
  },
  performanceCard: {
    borderRadius: 20,
    height: 250,
    padding: 15,
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: "#fff",
  },
  performanceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circularProgressContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  performanceValue: {
    position: "absolute",
    fontSize: 30,
    fontWeight: "bold",
  },
  textAndButtonContainer: {
    flex: 1,
    alignItems: "center",
  },
  performanceLabel: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  motivationalText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 15,
  },
  performanceButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  performanceButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  collectionSection: {
    width: "100%",
    marginBottom: 20,
  },
  collectionCard: {
    borderRadius: 20,
    overflow: "hidden",
    height: 120, // Decreased height
  },
  collectionGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  collectionContent: {
    flexDirection: "row", // Aligns content horizontally
    alignItems: "center",
    justifyContent: "space-around", // Distributes space evenly
    width: "100%",
  },
  collectionIconContainer: {
    // marginBottom: 10, // Removed to align horizontally
  },
  collectionTextContainer: {
    alignItems: "center",
  },
  collectionLabel: {
    color: "#fff",
    fontSize: 14, // Decreased font size
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "center",
  },
  collectionValue: {
    color: "#fff",
    fontSize: 20, // Decreased font size
    fontWeight: "bold",
    textAlign: "center",
  },
  detailListContainer: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    marginBottom: 20,
  },
  detailListTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  detailScrollView: {},
  paymentItemCard: {
    backgroundColor: "#f7f7f7",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  paymentItemText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#555",
  },
  paymentItemLabel: {
    fontWeight: "bold",
    color: "#333",
  },
  noPaymentsText: {
    fontSize: 16,
    textAlign: "center",
    color: "#888",
    paddingVertical: 20,
  },
});

export default Dashboard;