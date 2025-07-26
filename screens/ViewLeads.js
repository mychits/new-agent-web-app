import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import moment from "moment";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl"; // Import goldBaseUrl
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient"; // Added LinearGradient import
import Icon from "react-native-vector-icons/FontAwesome"; // Added Icon import
const noImage = require('../assets/no.png'); // Assuming this path is correct

const ViewLeads = ({ route, navigation }) => {
  const { user } = route.params;

  const [currentDate, setCurrentDate] = useState("");
  const [receipt, setReceipt] = useState({});
  const [chitLeads, setChitLeads] = useState([]);
  const [goldLeads, setGoldLeads] = useState([]);
  const [isChitLoading, setIsChitLoading] = useState(false);
  const [isGoldLoading, setIsGoldLoading] = useState(false);
  const [chitLoaded, setChitLoaded] = useState(false);
  const [goldLoaded, setGoldLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("CHIT");

  useEffect(() => {
    setCurrentDate(moment().format("DD-MM-YYYY"));
  }, []);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/agent/get-agent-by-id/${user.userId}` // Corrected API endpoint
        );
        setReceipt(response.data);
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };
    fetchReceipt();
  }, [user.userId]);

  const fetchChitLeads = async (phone) => {
    setIsChitLoading(true);
    setChitLoaded(false);
    try {
      const response = await axios.get(
        `${baseUrl}/lead/get-lead-by-agent/${phone}`
      );
      setChitLeads(response.data);
    } catch (error) {
      console.error("Error fetching chit leads data:", error);
      setChitLeads([]);
    } finally {
      setIsChitLoading(false);
      setChitLoaded(true);
    }
  };

  const fetchGoldLeads = async (phone) => {
    setIsGoldLoading(true);
    setGoldLoaded(false);
    try {
      const response = await axios.get(
        `http://13.60.68.201:3000/api/lead/get-lead-by-agent/${phone}`
      );
      setGoldLeads(response.data);
    } catch (error) {
      console.error("Error fetching gold leads data:", error);
      setGoldLeads([]);
    } finally {
      setIsGoldLoading(false);
      setGoldLoaded(true);
    }
  };
  useEffect(() => {
    if (receipt?.phone_number) {
      fetchChitLeads(receipt.phone_number);
      fetchGoldLeads(receipt.phone_number);
    }
  }, [receipt.phone_number]);

  useFocusEffect(
    useCallback(() => {
      if (receipt?.phone_number) {
        fetchChitLeads(receipt.phone_number);
        fetchGoldLeads(receipt.phone_number);
      }
    }, [receipt.phone_number])
  );

  const renderLeadCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <Text style={styles.name}>{item.lead_name}</Text>
        <Text style={styles.groupName}>
          {item.group_id ? item.group_id.group_name : "No Group"}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.schemeType}>
          {item.scheme_type.charAt(0).toUpperCase() + item.scheme_type.slice(1)}
        </Text>
        <Text style={styles.phoneNumber}>{item.lead_phone}</Text>
      </View>
    </View>
  );

  // Pick active data, loading and loaded flags
  const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;
  const dataLoaded = activeTab === "CHIT" ? chitLoaded : goldLoaded;
  const leads = activeTab === "CHIT" ? chitLeads : goldLeads;
  const noDataMessage =
    activeTab === "CHIT" ? "No chit leads found" : "No gold leads found";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <LinearGradient
        colors={['#A8E0F9', '#F9E5B5']} // Added linear gradient colors
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginHorizontal: 22, marginTop: 12, flex: 1 }}>
            <Header />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Leads</Text>
              <Text style={styles.totalAmountText}>
                {chitLeads.length + goldLeads.length || 0}
              </Text>
            </View>

            <View style={styles.container}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
                  onPress={() => setActiveTab("CHIT")}
                >
                  <Icon name="users" size={20} color={activeTab === "CHIT" ? "#333" : "#666"} />
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "CHIT" && styles.activeTabText,
                    ]}
                  >
                    Chit Leads {chitLeads.length || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
                  onPress={() => setActiveTab("GOLD")}
                >
                  <Icon name="money" size={20} color={activeTab === "GOLD" ? "#333" : "#666"} />
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "GOLD" && styles.activeTabText,
                    ]}
                  >
                    Gold Leads {goldLeads.length || 0}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ minHeight: 200 }}>
                {isLoading && <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />}
                {!isLoading && dataLoaded && leads.length > 0 && (
                  <FlatList
                    data={leads}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderLeadCard}
                  />
                )}
                {!isLoading && dataLoaded && leads.length === 0 && (
                  <View style={styles.noDataContainer}>
                    <Image source={noImage} style={styles.noImage} />
                    <Text style={styles.noDataText}>{noDataMessage}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <TouchableOpacity
        onPress={() => navigation.navigate("AddLead", { user: user })}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: COLORS.primary,
          borderRadius: 30,
          width: 60,
          height: 60,
          justifyContent: "center",
          alignItems: "center",
          elevation: 5,
        }}
      >
        <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
          + Add
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  titleContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmountText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
    marginTop: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 15,
    marginBottom: 10,


  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#FFC000',
  },
  tabText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    marginLeft: 5,
  },
  activeTabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    flexDirection: "row",
    padding: 15,
    marginVertical: 5,
    borderRadius: 15,
    borderLeftWidth: 5,
    borderColor: '#FFC000',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 5,
  },
  groupName: {
    fontSize: 14,
    color: "#666",
  },
  schemeType: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    marginBottom: 5,
  },
  phoneNumber: {
    fontSize: 14,
    color: "#666",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  noImage: {
    width: 250,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  }
});

export default ViewLeads;
