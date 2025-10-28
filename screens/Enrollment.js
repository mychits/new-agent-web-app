import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import baseUrl from "../constants/baseUrl";
import COLORS from "../constants/color";
import Header from "../components/Header";

// Enable smooth layout animations for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Background Gradient
const BACKGROUND_GRADIENT = ["#b6e4ebff", "#1796d1ff"];

// Design Constants
const MODERN_PRIMARY = "#0d0d0eff";
const ACCENT_BLUE = "#1796d1ff";
const BORDER_COLOR = "#e5e7eb";
const TEXT_GREY = "#374151";

// Format numbers in Indian style
const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "," + parts[1] : "";
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== "") {
    const formattedOtherNumbers = otherNumbers.replace(
      /\B(?=(\d{2})+(?!\d))/g,
      ","
    );
    return formattedOtherNumbers + "," + lastThree + decimalPart;
  } else {
    return lastThree + decimalPart;
  }
};

const Enrollment = ({ route, navigation }) => {
  const { groupFilter, user } = route.params || {};
  const [cardsData, setCardsData] = useState([]);
  const [vacantSeats, setVacantSeats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("AllGroups");

  const normalizeFilter = (filter) => {
    if (filter === "New Groups") return "NewGroups";
    if (filter === "Ongoing Groups") return "OngoingGroups";
    if (filter === "Vacant Groups") return "VacantGroups";
    return "AllGroups";
  };

  useEffect(() => {
    if (groupFilter) setSelectedGroup(normalizeFilter(groupFilter));
  }, [groupFilter]);

  const fetchVacantSeats = async (groupId) => {
    try {
      const res = await axios.post(`${baseUrl}/enroll/get-next-tickets/${groupId}`);
      const tickets = Array.isArray(res.data.availableTickets)
        ? res.data.availableTickets
        : [];
      return tickets.length;
    } catch (err) {
      console.error(`Error fetching tickets for ${groupId}:`, err);
      return 0;
    }
  };

  const fetchGroups = async () => {
    setIsLoading(true);
    setError(null);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    let endpoint = `${baseUrl}/group/filter/AllGroups`;
    if (selectedGroup === "NewGroups")
      endpoint = `${baseUrl}/group/filter/NewGroups`;
    else if (selectedGroup === "OngoingGroups")
      endpoint = `${baseUrl}/group/filter/OngoingGroups`;
    else if (selectedGroup === "VacantGroups")
      endpoint = `${baseUrl}/group/filter/VacantGroups`;

    try {
      const response = await axios.get(endpoint);
      if (response.status === 200) {
        const groups = response.data.groups || response.data;
        const vacantSeatCounts = {};
        for (const group of groups) {
          const count = await fetchVacantSeats(group._id);
          vacantSeatCounts[group._id] = count;
        }
        if (selectedGroup === "VacantGroups") {
          const onlyVacant = groups.filter((g) => vacantSeatCounts[g._id] > 0);
          setCardsData(onlyVacant);
        } else {
          setCardsData(groups);
        }
        setVacantSeats(vacantSeatCounts);
      } else {
        setError("Failed to load groups.");
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError("Network error. Please check your connection.");
      Alert.alert("Error", "Unable to fetch groups. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [selectedGroup]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={[]}>
      <LinearGradient colors={BACKGROUND_GRADIENT} style={{ flex: 1 }}>
        <View style={styles.headerSpacer}>
          <Header />
        </View>

        {isLoading ? (
          <View style={styles.loaderFullScreen}>
            <ActivityIndicator size="large" color={MODERN_PRIMARY} />
          </View>
        ) : (
          <View style={styles.container}>
            <Text style={styles.title}>Enrollment Groups</Text>
            <Text style={styles.subtitle}>
              Browse, manage and view all active chit groups
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
            >
              {["AllGroups", "NewGroups", "OngoingGroups", "VacantGroups"].map(
                (filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.chip,
                      selectedGroup === filter && styles.selectedChip,
                    ]}
                    onPress={() => setSelectedGroup(filter)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedGroup === filter && styles.selectedChipText,
                      ]}
                    >
                      {filter.replace("Groups", " Groups")}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={50} color="#DC143C" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : cardsData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No groups found</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
              >
                {cardsData.map((group) => (
                  <View key={group._id} style={styles.cardContainer}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.groupName}>{group.group_name}</Text>
                      <Text style={styles.tagText}>
                        {group.status || "Active"}
                      </Text>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.cardText}>
                        Value: ₹{formatNumberIndianStyle(group.group_value)}
                      </Text>
                      <Text style={styles.cardText}>
                        Members: {group.group_members}
                      </Text>
                      <Text style={styles.vacantSeatText}>
                        Vacant Seats: {vacantSeats[group._id] ?? "Loading..."}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Enrollment;

const styles = StyleSheet.create({
  headerSpacer: { paddingHorizontal: 16, paddingTop: 45, paddingBottom: 15 },
  container: { flex: 1, paddingHorizontal: 16 },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: MODERN_PRIMARY,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 15,
    color: TEXT_GREY,
    marginBottom: 20,
  },

  filterContainer: {
    marginBottom: 15,
    flexDirection: "row",
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  selectedChip: {
    backgroundColor: "#fff",
    borderColor: ACCENT_BLUE,
  },
  chipText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  selectedChipText: {
    color: ACCENT_BLUE,
    fontWeight: "800",
    fontSize: 16,
  },

  loaderFullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "800",
    color: MODERN_PRIMARY,
  },
  tagText: {
    backgroundColor: "#e0f2fe",
    color: ACCENT_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    textAlign: "center",
  },
  cardBody: { gap: 6 },
  cardText: { fontSize: 15, color: TEXT_GREY },
  vacantSeatText: {
    color: "#0d9488",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 4,
  },

  errorContainer: { alignItems: "center", marginTop: 60 },
  errorText: { color: "#DC143C", fontSize: 16, marginVertical: 12, textAlign: "center" },
  retryButton: {
    backgroundColor: ACCENT_BLUE,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  scrollContainer: { paddingBottom: 120 },
});
