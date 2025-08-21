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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Svg, { G, Circle } from "react-native-svg";
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

  return (
    <LinearGradient
      colors={["#dbf6faff", "#90dafcff"]}
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
                <Text style={styles.welcomeText}>
                  Dear {agent.name || "Agent"},
                </Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.topSection}>
                <LinearGradient
                  colors={["#64B5F6", "#2196F3"]}
                  style={styles.performanceCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.performanceContent}>
                    <View style={styles.circularProgressContainer}>
                      <Text style={styles.performanceValue}>
                        {`${(
                          (targetData.achieved / targetData.total) *
                          100
                        ).toFixed(0)}%`}
                      </Text>
                      <Animated.View style={StyleSheet.absoluteFillObject}>
                        <AnimatedSvg
                          width="100%"
                          height="100%"
                          viewBox="0 0 150 150"
                        >
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
                              stroke="#da8201"
                              strokeWidth="10"
                              fill="transparent"
                              strokeDasharray={circumference}
                              strokeDashoffset={getStrokeDashoffset()}
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
                  colors={["#81C784", "#4CAF50"]}
                  style={styles.metricsCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>Total Target</Text>
                      <Text style={styles.metricValue}>
                        {`₹${targetData.total.toLocaleString("en-IN")}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>Achieved Business</Text>
                      <Text style={styles.metricValue}>
                        {`₹${targetData.achieved.toLocaleString("en-IN")}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>
                        Remaining to Achieve
                      </Text>
                      <Text style={styles.metricValue}>
                        {`₹${targetData.remaining.toLocaleString("en-IN")}`}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

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
      </SafeAreaView>
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
    paddingHorizontal: 22,
    paddingTop: 12,
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
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  performanceCard: {
    width: "48%",
    borderRadius: 20,
    height: 200,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  performanceContent: {
    alignItems: "center",
  },
  circularProgressContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  performanceValue: {
    position: "absolute",
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  performanceLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
  metricsCard: {
    width: "48%",
    borderRadius: 20,
    height: 200,
    padding: 20,
    justifyContent: "space-around",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  metricItem: {
    marginBottom: 5,
  },
  metricHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  metricLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  metricValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  collectionSection: {
    marginBottom: 20,
  },
  collectionCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  collectionGradient: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  collectionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  collectionIconContainer: {
    marginRight: 20,
  },
  collectionTextContainer: {
    flex: 1,
  },
  collectionLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  collectionValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
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
  detailScrollView: {
    // maxHeight: 250,  // This line is now removed.
  },
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