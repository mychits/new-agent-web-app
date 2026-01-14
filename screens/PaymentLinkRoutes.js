import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  FlatList,
  Dimensions,
  Animated,
  Pressable,
  Linking, // 1. Import Linking
  Alert,
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

/* ------------------ DESIGN CONSTANTS ------------------ */
const { width } = Dimensions.get('window');
const TOP_GRADIENT = ['#24C6DC', '#183A5D'];
const MODERN_PRIMARY = "#1e293b";
const ACCENT_BLUE = "#1796d1";
const ACCENT_LIGHT_BLUE = "#f0f9ff";
const BORDER_COLOR = "#f1f5f9";
const TEXT_GREY = "#64748b";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = "#f8fafc";

/* ------------------ STYLIST CUSTOMER CARD ------------------ */
const CustomerCard = React.memo(
  ({ name, phone, customerId, address, onPress, index }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 80,
        useNativeDriver: true,
      }).start();
    }, [index]);

    // 2. Function to handle calling
    const makeCall = (phoneNumber) => {
      if (!phoneNumber) {
        Alert.alert("Error", "Phone number not available");
        return;
      }
      const url = `tel:${phoneNumber}`;
      Linking.canOpenURL(url)
        .then((supported) => {
          if (!supported) {
            Alert.alert("Error", "Your device does not support calling");
          } else {
            return Linking.openURL(url);
          }
        })
        .catch((err) => console.error("Call Error:", err));
    };

    const handlePressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
      <Animated.View style={{ opacity: opacityAnim }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.topAccentBar} />
            
            <View style={styles.cardHeader}>
              <View style={styles.avatarSection}>
                <LinearGradient colors={['#e0f2fe', '#bae6fd']} style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {name ? name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </LinearGradient>
                <View style={styles.statusDot} />
              </View>

              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{name || "Guest User"}</Text>
                
                <View style={styles.badgeRow}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>ID: {customerId}</Text>
                  </View>
                  
                  {/* 3. Updated Phone Badge with TouchableOpacity to trigger Call */}
                  <TouchableOpacity 
                    style={styles.phoneBadge} 
                    onPress={() => makeCall(phone)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="call" size={10} color={ACCENT_BLUE} />
                    <Text style={styles.phoneBadgeText}>{phone || "No Phone"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionContainer}>
                <LinearGradient colors={[ACCENT_BLUE, '#0e7490']} style={styles.arrowButton}>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.footerIconWrapper}>
                <Ionicons name="location-outline" size={16} color={ACCENT_BLUE} />
              </View>
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabelText}>COMPLETE ADDRESS</Text>
                <Text style={styles.addressText}>
                  {address || "No address details available for this customer."}
                </Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  }
);

/* ------------------ MAIN COMPONENT ------------------ */
const PaymentLinkRoutes = ({ route, navigation }) => {
  const user = route?.params?.user;
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCustomers(); }, [user?.userId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [chitRes, pigmeRes, loanRes] = await Promise.all([
        axios.get(`${baseUrl}/user/collection-area/agent/${user?.userId}`),
        axios.get(`${baseUrl}/pigme?referrerId=${user?.userId}`),
        axios.get(`${baseUrl}/loans?referrerId=${user?.userId}`),
      ]);
      const map = new Map();
      (chitRes.data || []).forEach(c => map.set(c._id, { _id: c._id, name: c.full_name, phone: c.phone_number, address: c.address, customerId: c.customer_id || "CHIT" }));
      (pigmeRes.data?.data || []).forEach(p => p.customer && map.set(p.customer._id, { _id: p.customer._id, name: p.customer.full_name, phone: p.customer.phone_number, address: p.customer.address, customerId: p.customer.customer_id || "PGMY" }));
      (loanRes.data?.data || []).forEach(l => l.borrower && map.set(l.borrower._id, { _id: l.borrower._id, name: l.borrower.full_name, phone: l.borrower.phone_number, address: l.borrower.address || l.borrower.city, customerId: l.borrower.customer_id || "LOAN" }));
      setCustomers([...map.values()]);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase();
    return customers.filter(c => c.name?.toLowerCase().includes(term) || c.phone?.toString().includes(term));
  }, [search, customers]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={TOP_GRADIENT} style={styles.topContainer}>
        <View style={styles.headerSpacer}><Header /></View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Payment Link Hub</Text>
          <Text style={styles.subtitle}>Choose a customer to generate their payment link</Text>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={TEXT_GREY} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or phone..."
            style={styles.searchInput}
            placeholderTextColor={TEXT_GREY}
          />
        </View>
      </LinearGradient>

      <View style={styles.mainContentArea}>
        {loading ? (
          <ActivityIndicator size="large" color={ACCENT_BLUE} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={({ item, index }) => (
              <CustomerCard {...item} index={index} onPress={() => navigation.navigate("CustomerPaymentLink", { user, customer: item })} />
            )}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
  topContainer: { paddingHorizontal: 20, paddingBottom: 45 },
  headerSpacer: { paddingVertical: 10 },
  titleContainer: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 15,
    height: 54,
    elevation: 8,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500', color: MODERN_PRIMARY },
  mainContentArea: { flex: 1, backgroundColor: SUBTLE_BG_GREY, borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: -30, paddingTop: 30 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 50 },
  
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    marginBottom: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden'
  },
  topAccentBar: { height: 4, backgroundColor: ACCENT_BLUE, width: '25%', borderBottomRightRadius: 10 },
  cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  avatarSection: { position: 'relative' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 22, fontWeight: '900', color: ACCENT_BLUE },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff' },
  customerDetails: { flex: 1, marginLeft: 15 },
  customerName: { fontSize: 18, fontWeight: '800', color: MODERN_PRIMARY, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  idBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  idBadgeText: { fontSize: 10, fontWeight: '700', color: TEXT_GREY },
  phoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderVisible: true },
  phoneBadgeText: { fontSize: 10, fontWeight: '700', color: ACCENT_BLUE },
  actionContainer: { marginLeft: 10 },
  arrowButton: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardFooter: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerIconWrapper: { marginTop: 2, marginRight: 10 },
  addressContainer: { flex: 1 },
  addressLabelText: { fontSize: 9, fontWeight: '900', color: ACCENT_BLUE, marginBottom: 4, letterSpacing: 0.5 },
  addressText: { fontSize: 13, color: TEXT_GREY, fontWeight: '500', lineHeight: 18 }
});

export default PaymentLinkRoutes;