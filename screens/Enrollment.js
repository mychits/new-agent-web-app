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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import baseUrl from "../constants/baseUrl";
import COLORS from "../constants/color";
import Header from "../components/Header";

const { height } = Dimensions.get("window");

// Enable smooth layout animations for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Background Gradient
const TOP_GRADIENT = ["#24C6DC", "#183A5D"];

// Design Constants
const MODERN_PRIMARY = "#0d0d0eff";
const ACCENT_BLUE = "#1796d1ff";
const BORDER_COLOR = "#e0e0e0";
const TEXT_DARK = "#1f2937";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const VACANCY_COLOR = "#059669";
const SUBTLE_BG_GREY = "#f9fafb";

// Format numbers in Indian style
const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1] : "";
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  let formattedIntegerPart = lastThree;

  if (otherNumbers !== "") {
    formattedIntegerPart =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }

  return formattedIntegerPart + decimalPart;
};

const getDisplayVacantSeats = (group, vacantSeatsState) => {
  const appDisplaySeats = parseInt(group.app_display_vacany_seat, 10);
  if (!isNaN(appDisplaySeats) && appDisplaySeats >= 0) {
    return appDisplaySeats;
  }
  return vacantSeatsState[group._id];
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
      const res = await axios.post(
        `${baseUrl}/enroll/get-next-tickets/${groupId}`
      );
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

        const fetchPromises = groups.map(async (group) => {
          const count = await fetchVacantSeats(group._id);
          vacantSeatCounts[group._id] = count;
        });

        await Promise.all(fetchPromises);

        if (selectedGroup === "VacantGroups") {
          const onlyVacant = groups.filter((g) => {
            const appDisplaySeats = parseInt(g.app_display_vacany_seat, 10);
            if (!isNaN(appDisplaySeats) && appDisplaySeats > 0) return true;
            return vacantSeatCounts[g._id] > 0;
          });
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Header Section with Gradient */}
      <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
        <View style={styles.headerSpacer}>
          <Header />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Enrollment Groups</Text>
          <Text style={styles.subtitle}>
            Browse, manage and view all active chit groups
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterWrapper}
          contentContainerStyle={styles.filterContainer}
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
      </LinearGradient>

      {/* Main Content Area (White Background) */}
      <View style={styles.mainContentArea}>
        {isLoading ? (
          <View style={styles.loaderFullScreen}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
            <Text style={styles.loadingTextBlue}>Fetching groups...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={50}
              color={MODERN_PRIMARY}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : cardsData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={50} color={ACCENT_BLUE} />
            <Text style={styles.emptyTextBlue}>
              No groups found for this filter.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {cardsData.map((group) => (
              <TouchableOpacity
                key={group._id}
                style={styles.cardContainer}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    "Group Details",
                    `Navigating to details for ${group.group_name}`
                  )
                }
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.groupName}>{group.group_name}</Text>
                  <View
                    style={[
                      styles.tagWrapper,
                      group.status === "Active" && styles.tagActive,
                      group.status === "New" && styles.tagNew,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        group.status === "New" && { color: MODERN_PRIMARY },
                      ]}
                    >
                      {group.status || "Active"}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Value:</Text>
                    <Text
                      style={[styles.cardTextBold, { color: ACCENT_BLUE }]}
                    >
                      ₹{formatNumberIndianStyle(group.group_value)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Monthly Installment:</Text>
                    <Text style={styles.cardTextBold}>
                      ₹{formatNumberIndianStyle(group.monthly_installment)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Members:</Text>
                    <Text style={styles.cardText}>{group.group_members}</Text>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.rowVacant}>
                    <MaterialIcons
                      name="event-seat"
                      size={20}
                      color={VACANCY_COLOR}
                    />
                    <Text style={styles.vacantSeatText}>
                      Vacant Seats:{" "}
                      {getDisplayVacantSeats(group, vacantSeats) ??
                        "Loading..."}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Enrollment;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOP_GRADIENT[0],
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    marginTop: -20,
    paddingTop: 30,
  },
  headerSpacer: {
    paddingTop: 20,
    paddingBottom: 5,
  },

  titleContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: CARD_BG,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
    textAlign: "center",
  },

  // --- FILTER CHIPS (FIXED ALIGNMENT) ---
  filterWrapper: {
    marginHorizontal: -16,
    marginTop: 10,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    // ADDED: Centers the chips horizontally to match the Title
    justifyContent: "center",
    alignItems: "center",
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedChip: {
    backgroundColor: CARD_BG,
    borderColor: ACCENT_BLUE,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chipText: {
    color: CARD_BG,
    fontWeight: "600",
    fontSize: 14,
    // ADDED: Better vertical alignment for Android
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  selectedChipText: {
    color: MODERN_PRIMARY,
    fontWeight: "800",
  },

  // --- LOADING/ERROR/EMPTY STATES ---
  loaderFullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: height * 0.5,
  },
  loadingTextBlue: {
    marginTop: 10,
    color: ACCENT_BLUE,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    alignItems: "center",
    marginTop: 60,
    padding: 30,
    borderRadius: 15,
    backgroundColor: CARD_BG,
  },
  errorText: {
    color: TEXT_DARK,
    fontSize: 16,
    marginVertical: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: ACCENT_BLUE,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: { color: CARD_BG, fontWeight: "700", fontSize: 16 },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    padding: 20,
  },
  emptyTextBlue: {
    color: TEXT_GREY,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },

  // --- CARD STYLES ---
  scrollContainer: {
    paddingBottom: 150,
    paddingTop: 10,
  },
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    shadowColor: MODERN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_COLOR,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "900",
    color: TEXT_DARK,
    flexShrink: 1,
    marginRight: 15,
    lineHeight: 24,
  },
  tagWrapper: {
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagActive: {
    backgroundColor: "#d1fae5",
  },
  tagNew: {
    backgroundColor: "#ffedd5",
  },
  tagText: {
    color: VACANCY_COLOR,
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
  },
  cardBody: {
    gap: 12,
    paddingTop: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontWeight: "500",
    color: TEXT_GREY,
    fontSize: 15,
  },
  cardText: {
    fontSize: 15,
    color: TEXT_GREY,
  },
  cardTextBold: {
    fontSize: 16,
    fontWeight: "800",
    color: MODERN_PRIMARY,
  },
  separator: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginVertical: 6,
  },
  rowVacant: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  vacantSeatText: {
    color: VACANCY_COLOR,
    fontWeight: "800",
    fontSize: 16,
  },
});