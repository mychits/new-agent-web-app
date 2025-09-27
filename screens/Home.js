import React, {
  useEffect,
  useState,
  useContext,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
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

// Updated to single image paths instead of arrays
const cardImagePaths = {
  collections: require("../assets/Collection2.png"),
  qrCode: require("../assets/qrcode.png"),
  daybook: require("../assets/Daybook2.png"),
  targets: require("../assets/Target2.png"),
  myLeads: require("../assets/Lead1.png"),
  addCustomers: require("../assets/AddCutomer1.png"),
  myCustomers: require("../assets/Mycustomers1.png"),
  myTasks: require("../assets/Target2.png"),
  reports: require("../assets/Reports2.png"),
  commission: require("../assets/commissions1.png"),
  groups: require("../assets/groups1.png"),
  customerOnHold: require("../assets/Holdon2.png"),
  monthlyTurnover: require("../assets/MITB.png"),
  DueReportImage: require("../assets/dues.png"),
};

const Home = ({ route, navigation }) => {
  const { user = {}, agentInfo = {} } = route.params || {};
  const [agent, setAgent] = useState({});
  const { modifyPayment, setModifyPayment } = useContext(AgentContext);

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

  // The cardsData array now references single image paths
  const cardsData = [
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "collections",
      name: "Collections",
      imagePath: cardImagePaths.collections,
      onPress: () => navigation.navigate("PaymentNavigator"),
      backgroundColor: "#FFEBEE",
    },
    agentInfo?.designation_id?.permission?.collection === "true" && {
      id: "qrCode",
      name: "QR Code",
      imagePath: cardImagePaths.qrCode,
      onPress: () => navigation.navigate("qrCode"),
      backgroundColor: "#FFEBEE",
    },
    agentInfo?.designation_id?.permission?.daybook === "true" && {
      id: "daybook",
      name: "Daybook",
      imagePath: cardImagePaths.daybook,
      onPress: () => navigation.navigate("PayNavigation", { user: user }),
      backgroundColor: "#E8F5E9",
    },
    agentInfo?.designation_id?.permission?.targets === "true" && {
      id: "targets",
      name: "Targets",
      imagePath: cardImagePaths.targets,
      onPress: () => navigation.navigate("Target"),
      backgroundColor: "#FFFDE7",
    },
    agentInfo?.designation_id?.permission?.leads === "true" && {
      id: "myLeads",
      name: "My Leads",
      imagePath: cardImagePaths.myLeads,
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
      imagePath: cardImagePaths.addCustomers,
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
      imagePath: cardImagePaths.myCustomers,
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
      imagePath: cardImagePaths.myTasks,
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
      imagePath: cardImagePaths.reports,
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
      imagePath: cardImagePaths.commission,
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
      imagePath: cardImagePaths.groups,
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
      imagePath: cardImagePaths.customerOnHold,
      onPress: () => navigation.navigate("CustomerOnHold"),
      backgroundColor: "#FFF3E0",
    },
    {
      id: "monthlyTurnover",
      name: "MIT",
      imagePath: cardImagePaths.monthlyTurnover,
      onPress: () => navigation.navigate("MonthlyTurnover"),
      backgroundColor: "#D0F0C0",
    },
    {
      id: "DueReport",
      name: "DueReport",
      imagePath: cardImagePaths.DueReportImage,
      onPress: () => navigation.navigate("Due"),
      backgroundColor: "#e9d0e3ff",
    },
  ].filter(Boolean);

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
                  <TouchableOpacity
                    key={card.id}
                    style={[styles.gridCard, { backgroundColor: card.backgroundColor }]}
                    onPress={card.onPress}
                  >
                    <Image
                      source={card.imagePath}
                      style={styles.cardImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.gridCardText}>{card.name}</Text>
                  </TouchableOpacity>
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
    padding: 5,
  },
  cardImage: {
    width: 155,
    height: 90,
    marginBottom: 1,
  },
  gradientOverlay: {
    flex: 1,
  },
  gridCardText: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    textAlign: "center",
  },
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