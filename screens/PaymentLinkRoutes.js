import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  FlatList,
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

/* ------------------ DESIGN CONSTANTS ------------------ */
const TOP_GRADIENT = ["#1aa2cc", "#1aa2cc"];
const MODERN_PRIMARY = "#0d0d0e";
const ACCENT_BLUE = "#1796d1";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f9fafb";

/* ------------------ CUSTOMER CARD ------------------ */
const CustomerCard = React.memo(
  ({ name, phone, customerId, address, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.cardContainer}
      activeOpacity={0.8}
    >
      <View style={styles.topCardSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="person" size={30} color={ACCENT_BLUE} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.cardTitle}>{name || "Unknown Name"}</Text>

          <View style={styles.contactRow}>
            <Ionicons
              name="call"
              size={16}
              color={ACCENT_BLUE}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.phoneText}>{phone || "N/A"}</Text>
          </View>

          <View style={styles.badgeContainer}>
            <Ionicons
              name="finger-print-outline"
              size={14}
              color={TEXT_GREY}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.idBadgeText}>{customerId}</Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={24}
          color={ACCENT_BLUE}
        />
      </View>

      <View style={styles.separator} />

      <View style={styles.addressSection}>
        <Ionicons
          name="location-sharp"
          size={18}
          color={ACCENT_BLUE}
          style={{ marginRight: 8, marginTop: 2 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.addressLabel}>Address:</Text>
          <Text style={styles.addressText}>
            {address || "No address provided"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
);

/* ------------------ MAIN COMPONENT ------------------ */
const PaymentLinkRoutes = ({ route, navigation }) => {
  const user = route?.params?.user;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, [user?.userId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const [chitRes, pigmeRes, loanRes] = await Promise.all([
        axios.get(`${baseUrl}/user/collection-area/agent/${user?.userId}`),
        axios.get(`${baseUrl}/pigme?referrerId=${user?.userId}`),
        axios.get(`${baseUrl}/loans?referrerId=${user?.userId}`),
      ]);

      const map = new Map();

      // CHIT
      (chitRes.data || []).forEach((c) => {
        map.set(c._id, {
          _id: c._id,
          name: c.full_name,
          phone: c.phone_number,
          address: c.address,
          customerId: c.customer_id || c._id,
        });
      });

      // PIGME
      (pigmeRes.data?.data || []).forEach((p) => {
        if (p.customer?._id) {
          map.set(p.customer._id, {
            _id: p.customer._id,
            name: p.customer.full_name,
            phone: p.customer.phone_number,
            address: p.customer.address,
            customerId: p.customer.customer_id || p.customer._id,
          });
        }
      });

      // LOAN
      (loanRes.data?.data || []).forEach((l) => {
        if (l.borrower?._id) {
          map.set(l.borrower._id, {
            _id: l.borrower._id,
            name: l.borrower.full_name,
            phone: l.borrower.phone_number,
            address:
              l.borrower.address ||
              [
                l.borrower.address_line_1,
                l.borrower.city,
                l.borrower.state,
                l.borrower.pincode,
              ]
                .filter(Boolean)
                .join(", "),
            customerId: l.borrower.customer_id || l.borrower._id,
          });
        }
      });

      setCustomers([...map.values()]);
    } catch (err) {
      console.error("Customer fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const term = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.phone?.toString().includes(term) ||
        c.customerId?.toString().toLowerCase().includes(term)
    );
  }, [search, customers]);

  const renderItem = useCallback(
    ({ item }) => (
      <CustomerCard
        {...item}
        onPress={() =>
          navigation.navigate("CustomerPaymentLink", {
            user,
            customer: item,
          })
        }
      />
    ),
    [navigation, user]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
        <View style={styles.headerSpacer}>
          <Header />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Payment Links</Text>
          <Text style={styles.subtitle}>Select Customer</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={TEXT_GREY}
            style={styles.searchIcon}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search customer..."
            placeholderTextColor={TEXT_GREY}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={22} color={TEXT_GREY} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={styles.mainContentArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderItem}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.scrollContainer}
            ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === "android"}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  topContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginTop: -25,
    paddingTop: 20,
  },
  headerSpacer: { paddingVertical: 10 },
  titleContainer: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "900", color: CARD_BG, textAlign: "center" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    elevation: 5,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: MODERN_PRIMARY },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    elevation: 3,
  },
  topCardSection: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e8f6fc",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: MODERN_PRIMARY },
  contactRow: { flexDirection: "row", alignItems: "center" },
  phoneText: { fontSize: 15, color: TEXT_GREY, fontWeight: "600" },
  badgeContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  idBadgeText: { fontSize: 11, fontWeight: "700", color: MODERN_PRIMARY },
  separator: { height: 1, backgroundColor: BORDER_COLOR, marginVertical: 15 },
  addressSection: { flexDirection: "row", alignItems: "flex-start" },
  addressLabel: { fontSize: 12, fontWeight: "700", color: ACCENT_BLUE },
  addressText: { fontSize: 14, color: MODERN_PRIMARY, fontWeight: "500" },
  loadingContainer: { marginTop: 100, alignItems: "center" },
});

export default PaymentLinkRoutes;
