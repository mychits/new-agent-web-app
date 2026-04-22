import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  FlatList,
  Linking,
  Alert,
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D'];
const MODERN_PRIMARY = "#0d0d0e";
const ACCENT_BLUE = "#1796d1";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb';

// --- HELPER FOR LINKING ---
const handleAction = (type, value) => {
  if (!value) return;

  let url = "";
  if (type === "call") {
    url = `tel:${value}`;
  } else if (type === "whatsapp") {
    // Remove non-numeric characters for WhatsApp
    const cleanPhone = value.replace(/[^0-9]/g, "");
    url = `whatsapp://send?phone=${cleanPhone}`;
  } else if (type === "email") {
    url = `mailto:${value}`;
  }

  Linking.canOpenURL(url)
    .then((supported) => {
      if (!supported) {
        Alert.alert("Error", `Unable to handle ${type}: ${value}`);
      } else {
        return Linking.openURL(url);
      }
    })
    .catch((err) => console.error("An error occurred", err));
};

// --- CUSTOMER CARD COMPONENT ---
const CustomerCard = React.memo(({ name, phone, loanAmount, loanId, address, email, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.cardContainer} activeOpacity={0.8}>
    <View style={styles.topCardSection}>
      <View style={styles.iconCircle}>
        <Ionicons name="wallet-outline" size={20} color={ACCENT_BLUE} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.cardTitle}>{name}</Text>
        
        {/* Action Icons Row */}
        <View style={styles.contactActionsRow}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleAction("call", phone)}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={16} color="#10B981" /> 
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleAction("whatsapp", phone)}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          </TouchableOpacity>

          {email ? (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleAction("email", email)}
              activeOpacity={0.7}
            >
              <Ionicons name="mail" size={16} color={ACCENT_BLUE} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.amountBadgeContainer}>
          <Text style={styles.amountBadgeText}>Loan Amount: ₹{loanAmount}</Text>
        </View>
      </View>
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={20} color={ACCENT_BLUE} />
      </View>
    </View>
    <View style={styles.separator} />
    <View style={styles.detailRowSection}>
      <Ionicons name="finger-print-outline" size={14} color={TEXT_GREY} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>Loan ID:</Text>
        <Text style={styles.detailText}>{loanId}</Text>
      </View>
    </View>
    <View style={styles.separator} />
    <View style={styles.detailRowSection}>
      <Ionicons name="location-sharp" size={14} color={ACCENT_BLUE} style={{ marginRight: 8, marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>Address:</Text>
        <Text style={styles.addressText}>{address || "No address provided"}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

const RouteCustomerLoan = ({ route, navigation }) => {
  const { user } = route.params;
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLoanCustomers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/loans?referrerId=${user?.userId}`);
        if (response?.data?.data) {
          setCustomers(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLoanCustomers();
  }, [user?.userId]);

  const formatCompleteAddress = (borrower) => {
    if (!borrower) return "Address details missing";
    if (borrower.address) return borrower.address;
    const parts = [borrower.address_line_1, borrower.address_line_2, borrower.city, borrower.state, borrower.pincode].filter(part => part && String(part).trim() !== "");
    return parts.length > 0 ? parts.join(', ') : "Address Not Available";
  };

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    return Array.isArray(customers) ? customers.filter((customer) =>
      customer.borrower?.full_name?.toLowerCase().includes(search.toLowerCase())
    ) : [];
  }, [search, customers]);

  const renderItem = useCallback(({ item }) => (
    <CustomerCard
      name={item.borrower?.full_name || "Unknown Customer"}
      phone={item.borrower?.phone_number || "N/A"}
      email={item.borrower?.email} // Added Email prop
      loanAmount={item.loan_amount || "N/A"}
      loanId={item.loan_id || "N/A"}
      address={formatCompleteAddress(item.borrower)}
      onPress={() => navigation.navigate("LoanPayin", { user, customer: item?.borrower?._id, loan_id: item._id, custom_loan_id: item.loan_id })}
    />
  ), [navigation, user]);

  const clearSearch = () => setSearch("");

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
        <View style={styles.headerSpacer}><Header /></View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Loan Customers</Text>
          <Text style={styles.subtitle}>Manage loan accounts & addresses</Text>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={TEXT_GREY} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name..."
            placeholderTextColor={TEXT_GREY}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
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
            keyExtractor={(item) => (item._id || item.loan_id).toString()}
            ListEmptyComponent={<Text style={styles.noCustomersText}>No loan customers found.</Text>}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  topContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  mainContentArea: {
    flex: 1,
    backgroundColor: SUBTLE_BG_GREY,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingTop: 15,
  },
  headerSpacer: { paddingTop: 10, paddingBottom: 10 },
  loadingContainer: { marginTop: 80, alignItems: 'center' },
  titleContainer: { marginBottom: 15 },
  title: { fontSize: 22, fontWeight: "900", color: CARD_BG, textAlign: 'center' }, // Decreased
  subtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4, textAlign: 'center' }, // Decreased
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 46, // Decreased
    elevation: 4,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: MODERN_PRIMARY }, // Decreased
  scrollContainer: { paddingHorizontal: 15, paddingBottom: 30 },
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 16, // Decreased
    padding: 12, // Decreased
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    elevation: 2,
  },
  topCardSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22, // Decreased
    backgroundColor: '#e8f6fc', justifyContent: 'center', alignItems: 'center',
  },
  infoContainer: { flex: 1, marginLeft: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: MODERN_PRIMARY, marginBottom: 4 }, // Decreased
  contactActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  amountBadgeContainer: {
    backgroundColor: ACCENT_BLUE,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', // Tighter padding
    marginTop: 2,
  },
  amountBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' }, // Decreased
  chevronContainer: { paddingLeft: 8 },
  separator: { height: 1, backgroundColor: BORDER_COLOR, marginVertical: 8 }, // Decreased margin
  detailRowSection: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 2 },
  detailLabel: { fontSize: 10, fontWeight: '700', color: ACCENT_BLUE, marginBottom: 2 }, // Decreased
  detailText: { fontSize: 12, color: MODERN_PRIMARY, fontWeight: '600' }, // Decreased
  addressText: {
    fontSize: 12, // Decreased
    color: MODERN_PRIMARY,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  noCustomersText: { textAlign: "center", marginTop: 30, fontSize: 14, color: TEXT_GREY }, // Decreased
});

export default RouteCustomerLoan;