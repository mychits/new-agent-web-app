import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons"; 
import { SafeAreaView } from "react-native-safe-area-context"; 
import { LinearGradient } from "expo-linear-gradient";

import Header from "../components/Header";
import baseUrl from "../constants/baseUrl"; 
import axios from "axios";

// --- DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D']; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const ACCENT_BLUE = "#1796d1ff"; 
const BORDER_COLOR = "#e0e0e0"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb'; 

// --- BIG CARD COMPONENT ---
const CustomerCard = ({ name, phone, loanAmount, loanId, address, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.cardContainer} activeOpacity={0.8}>
    
    <View style={styles.topCardSection}>
      <View style={styles.iconCircle}>
        <Ionicons name="wallet-outline" size={30} color={ACCENT_BLUE} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cardTitle}>{name}</Text>
        
        <View style={styles.contactRow}>
          <Ionicons name="call" size={16} color={ACCENT_BLUE} style={{marginRight: 6}} />
          <Text style={styles.phoneText}>{phone}</Text>
        </View>

        <View style={styles.amountBadgeContainer}>
          <Text style={styles.amountBadgeText}>Loan Amount: ₹{loanAmount}</Text>
        </View>
      </View>

      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={24} color={ACCENT_BLUE} />
      </View>
    </View>

    <View style={styles.separator} />

    <View style={styles.detailRowSection}>
      <Ionicons name="finger-print-outline" size={18} color={TEXT_GREY} style={{marginRight: 8}} />
      <View style={{flex: 1}}>
        <Text style={styles.detailLabel}> Loan ID:</Text>
        <Text style={styles.detailText}>{loanId}</Text>
      </View>
    </View>

    <View style={styles.separator} />

    {/* UPDATED ADDRESS SECTION: Similar to Chit layout */}
    <View style={styles.detailRowSection}>
      <Ionicons name="location-sharp" size={18} color={ACCENT_BLUE} style={{marginRight: 8, marginTop: 2}} />
      <View style={{flex: 1}}>
        <Text style={styles.detailLabel}>Address:</Text>
        <Text style={styles.addressText}>
          {address || "No address provided"}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const RouteCustomerLoan = ({ route, navigation }) => {
  const { user } = route.params;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLoanCustomers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseUrl}/loans?referrerId=${user?.userId}`
        );

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
  }, []);
  
  // --- UPDATED HELPER: Format Complete Address ---
  // This checks for the full 'address' field first (like Chit), 
  // then falls back to concatenated fields if 'address' is missing.
  const formatCompleteAddress = (borrower) => {
    if (!borrower) return "Address details missing";
    
    // If the API provides a single 'address' field like in Chit:
    if (borrower.address) return borrower.address;

    // Otherwise, combine all split fields:
    const parts = [
      borrower.address_line_1,
      borrower.address_line_2,
      borrower.city,
      borrower.state,
      borrower.pincode
    ].filter(part => part && String(part).trim() !== ""); 

    return parts.length > 0 ? parts.join(', ') : "Address Not Available";
  };
  
  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer) =>
        customer.borrower?.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={TOP_GRADIENT}
        style={styles.topContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerSpacer}>
            <Header />
        </View>

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
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color={TEXT_GREY} />
              </TouchableOpacity>
            )}
        </View>
      </LinearGradient>

      <View style={styles.mainContentArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.cardListContainer}>
              {loading ? (
                  <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={ACCENT_BLUE} />
                  </View>
              ) : (
                  <>
                      {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((customer, index) => (
                              <CustomerCard
                                  key={index}
                                  name={customer.borrower?.full_name || "Unknown Customer"}
                                  phone={customer.borrower?.phone_number || "N/A"}
                                  loanAmount={customer.loan_amount || "N/A"}
                                  loanId={customer.loan_id || "N/A"}
                                  // Use the improved formatter
                                  address={formatCompleteAddress(customer.borrower)}
                                  onPress={() =>
                                      navigation.navigate("LoanPayin", {
                                          user,
                                          customer: customer?.borrower?._id,
                                          loan_id: customer._id,
                                          custom_loan_id: customer.loan_id,
                                      })
                                  }
                              />
                          ))
                      ) : (
                          <Text style={styles.noCustomersText}>No loan customers found.</Text>
                      )}
                  </>
              )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

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
  headerSpacer: { paddingTop: 10, paddingBottom: 10 }, 
  loadingContainer: { marginTop: 100, alignItems: 'center' },
  titleContainer: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "900", color: CARD_BG, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4, textAlign: 'center' },
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
  cardListContainer: { gap: 18 },
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 25,
    padding: 22,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    elevation: 5,
  },
  topCardSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#e8f6fc', justifyContent: 'center', alignItems: 'center',
  },
  infoContainer: { flex: 1, marginLeft: 20 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: MODERN_PRIMARY, marginBottom: 6 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  phoneText: { fontSize: 16, color: TEXT_GREY, fontWeight: '600' },
  amountBadgeContainer: {
    backgroundColor: ACCENT_BLUE,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start',
    marginTop: 4,
  },
  amountBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  chevronContainer: { paddingLeft: 10 },
  separator: { height: 1, backgroundColor: BORDER_COLOR, marginVertical: 12 },
  detailRowSection: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { fontSize: 12, fontWeight: '700', color: ACCENT_BLUE, marginBottom: 2 },
  detailText: { fontSize: 14, color: MODERN_PRIMARY, fontWeight: '600' },
  addressText: { 
    fontSize: 14, 
    color: MODERN_PRIMARY, 
    lineHeight: 20, 
    fontWeight: '500',
    marginTop: 2,
  },
  noCustomersText: { textAlign: "center", marginTop: 40, fontSize: 16, color: TEXT_GREY },
});

export default RouteCustomerLoan;