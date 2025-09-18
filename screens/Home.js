import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { AgentContext } from "../context/AgentContextProvider";
import { useNetInfo } from "@react-native-community/netinfo";

const { width } = Dimensions.get("window");

const cardImagePaths = {
  collections: [
    require("../assets/Collection1.png"),
    require("../assets/Collection2.png"),
  ],
    qrCode: [
    require("../assets/qrcode.png"),
    require("../assets/qrcode.png"),
  ],
  daybook: [
    require("../assets/Daybook1.png"),
    require("../assets/Daybook2.png"),
  ],
  targets: [require("../assets/Target1.png"), require("../assets/Target2.png")],
  myLeads: [require("../assets/Lead1.png"), require("../assets/Lead2.png")],
  addCustomers: [
    require("../assets/AddCutomer1.png"),
    require("../assets/AddCutomer2.png"),
  ],
  myCustomers: [
    require("../assets/Mycustomers1.png"),
    require("../assets/Mycustomers2.png"),
  ],
  myTasks: [require("../assets/Target1.png"), require("../assets/Target2.png")],
  reports: [
    require("../assets/Reports1.png"),
    require("../assets/Reports2.png"),
  ],
  commission: [
    require("../assets/commissions1.png"),
    require("../assets/commission2.png"),
  ],
  groups: [
    require("../assets/groups.png"),
    require("../assets/groups1.png"),
  ],
  customerOnHold: [
    require("../assets/Holdon1.png"),
    require("../assets/Holdon2.png"),
  ],
  monthlyTurnover: [require("../assets/MITA.png"), require("../assets/MITB.png")],
};

const CardWithAnimatedImage = ({ card, cardStyles, initialImageIndex }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(
    initialImageIndex || 0
  );
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (card.imagePaths.length > 1) {
      const interval = setInterval(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setCurrentImageIndex(
            (prevIndex) => (prevIndex + 1) % card.imagePaths.length
          );
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [fadeAnim, card.imagePaths.length]);

  return (
    <TouchableOpacity
      key={card.id}
      style={[cardStyles.gridCard, { backgroundColor: card.backgroundColor }]}
      onPress={card.onPress}
    >
      <Animated.Image
        source={card.imagePaths[currentImageIndex]}
        style={[cardStyles.cardImage, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
      <Text style={cardStyles.gridCardText}>{card.name}</Text>
    </TouchableOpacity>
  );
};

const Home = ({ route, navigation }) => {
  const { user = {}, agentInfo = {} } = route.params || {};
  const [agent, setAgent] = useState({});
  const [initialVisit, setInitialVisit] = useState(true);
  const { modifyPayment, setModifyPayment } = useContext(AgentContext);

  // Use the useNetInfo hook to get real-time network status
  const netInfo = useNetInfo();

  setModifyPayment(
    agentInfo.designation_id?.permission?.modify_payments === "true"
  );

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
            console.error("Unexpected API response format:", response.data);
            setAgent({});
          }
        } catch (error) {
          console.error("Error fetching agent data:", error);
          setAgent({});
        }
      } else {
        console.warn("User ID not available, skipping agent data fetch.");
        setAgent({});
      }
    };
    if (netInfo.isConnected) {
      fetchAgent();
    }
  }, [user.userId, agentInfo, netInfo.isConnected]);

  useEffect(() => {
    const checkFirstVisit = async () => {
      try {
        const hasVisited = await AsyncStorage.getItem("hasVisitedHome");
        if (hasVisited === null) {
          setInitialVisit(true);
          await AsyncStorage.setItem("hasVisitedHome", "true");
        } else {
          setInitialVisit(false);
        }
      } catch (error) {
        console.error("Error managing AsyncStorage for initial visit:", error);
        setInitialVisit(true);
      }
    };
    checkFirstVisit();
  }, []);

  const getInitialImageIndex = useCallback(() => {
    return initialVisit ? 0 : 1;
  }, [initialVisit]);

  const cardsData = [
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "collections",
      name: "Collections",
      imagePaths: cardImagePaths.collections,
      onPress: () => navigation.navigate("PaymentNavigator"),
      backgroundColor: "#FFEBEE",
    },
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "qrCode",
      name: "QR Code",
      imagePaths: cardImagePaths.qrCode,
      onPress: () => navigation.navigate("qrCode"),
      backgroundColor: "#FFEBEE",
    },
    agentInfo?.designation_id?.permission?.daybook === "true" && {
      id: "daybook",
      name: "Daybook",
      imagePaths: cardImagePaths.daybook,
      onPress: () => navigation.navigate("PayNavigation", { user: user }),
      backgroundColor: "#E8F5E9",
    },
    agentInfo?.designation_id?.permission?.targets === "true" && {
      id: "targets",
      name: "Targets",
      imagePaths: cardImagePaths.targets,
      onPress: () => navigation.navigate("Target"),
      backgroundColor: "#FFFDE7",
    },
    agentInfo?.designation_id?.permission?.leads === "true" && {
      id: "myLeads",
      name: "My Leads",
      imagePaths: cardImagePaths.myLeads,
      onPress: () =>
        navigation.navigate("PayNavigation", {
          screen: "ViewLeads",
          params: { user: user },
        }),
      backgroundColor: "#E3F2FD",
    },
    {
      id: "addCustomers",
      name: "Add Customers",
      imagePaths: cardImagePaths.addCustomers,
      onPress: () =>
        navigation.navigate("CustomerNavigation", {
          screen: "Customer",
          params: { user },
        }),
      backgroundColor: "#F3E5F5",
    },
    {
      id: "myCustomers",
      name: "My Customers",
      imagePaths: cardImagePaths.myCustomers,
      onPress: () =>
        navigation.navigate("CustomerNavigation", {
          screen: "ViewEnrollments",
          params: { user },
        }),
      backgroundColor: "#FFECB3",
    },
    {
      id: "myTasks",
      name: "My Tasks",
      imagePaths: cardImagePaths.myTasks,
      onPress: () =>
        navigation.navigate("MyTasks", {
          employeeId: user.userId,
          agentName: agent.name,
        }),
      backgroundColor: "#E0F7FA",
    },
    agentInfo?.designation_id?.permission?.reports === "true" && {
      id: "reports",
      name: "Reports",
      imagePaths: cardImagePaths.reports,
      onPress: () =>
        navigation.navigate("PayNavigation", {
          screen: "Reports",
          params: { user: user },
        }),
      backgroundColor: "#FCE4EC",
    },
    agentInfo?.designation_id?.permission?.commission === "true" && {
      id: "commission",
      name: "Commission",
      imagePaths: cardImagePaths.commission,
      onPress: () =>
        navigation.navigate("CustomerNavigation", {
          screen: "Commissions",
          params: { user: user },
        }),
      backgroundColor: "#DCEDC8",
    },
    {
      id: "groups",
      name: "Groups",
      imagePaths: cardImagePaths.groups,
      onPress: () =>
        navigation.navigate("Enrollment", {
          screen: "Enrollment",
          params: { user: user },
        }),
      backgroundColor: "#D1C4E9",
    },
    {
      id: "customerOnHold",
      name: "Customer on Hold",
      imagePaths: cardImagePaths.customerOnHold,
      onPress: () => navigation.navigate("CustomerOnHold"),
      backgroundColor: "#FFF3E0",
    },
    {
      id: "monthlyTurnover",
      name: "MIT",
      imagePaths: cardImagePaths.monthlyTurnover,
      onPress: () => navigation.navigate("MonthlyTurnover"),
      backgroundColor: "#D0F0C0",
    },
  ].filter(Boolean);

  // "No Internet" component to be rendered when offline
  const renderNoInternet = () => (
    <View style={styles.noInternetContainer}>
      <Image
        source={require("../assets/Nointernetp.png")}
        style={styles.noInternetImage}
        resizeMode="contain"
      />
      <Text style={styles.noInternetText}>
        Oops! No internet connection.
      </Text>
      <Text style={styles.noInternetSubText}>
        Please check your network settings and try again.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#dbf6faff", "#90dafcff"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.mainContentArea}>
          <Header />
          <View style={styles.introSection}>
            <Text style={styles.welcomeText}>
              Hello {agent.name || "Agent"},
            </Text>
            <Text style={styles.questionText}>
              Welcome to MyChits Agent App
            </Text>
          </View>

          {netInfo.isConnected === false ? (
            renderNoInternet()
          ) : (
            <ScrollView
              contentContainerStyle={styles.cardsScrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.cardsGridContainer}>
                {cardsData.map((card) => (
                  <CardWithAnimatedImage
                    key={card.id}
                    card={card}
                    cardStyles={styles}
                    initialImageIndex={getInitialImageIndex()}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContentArea: {
    flex: 1,
    marginHorizontal: 22,
    marginTop: 12,
  },
  introSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#555",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: "#777",
  },
  cardsScrollViewContent: {
    paddingBottom: 50,
  },
  cardsGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  gridCard: {
    width: (width - 22 * 2 - 20) / 2,
    height: (width - 22 * 2 - 20) / 2,
    borderRadius: 15,
    borderColor: "gold",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    padding: 10,
  },
  cardImage: {
    width: 155,
    height: 90,
    marginBottom: 5,
  },
  gradientOverlay: {
    flex: 1,
  },
  gridCardText: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    textAlign: "center",
  },
  // No Internet styles
  noInternetContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noInternetImage: {
    width: 200,
    height: 200,
  },
  noInternetText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    textAlign: "center",
  },
  noInternetSubText: {
    fontSize: 16,
    color: "#777",
    marginTop: 10,
    textAlign: "center",
  },
});

export default Home;