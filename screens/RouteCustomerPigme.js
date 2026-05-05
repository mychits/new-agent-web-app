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
  Animated,
  StatusBar,
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

// --- ORIGINAL DESIGN CONSTANTS ---
const TOP_GRADIENT = ['#24C6DC', '#183A5D'];
const MODERN_PRIMARY = "#0d0d0e";
const ACCENT_BLUE = "#1796d1";
const BORDER_COLOR = "#e0e0e0";
const TEXT_GREY = "#4b5563";
const CARD_BG = "#ffffff";
const SUBTLE_BG_GREY = '#f9fafb';

// Nav pill accents
const ACCENT_CHIT = "#1796d1";
const ACCENT_LOAN = "#c098e6";

// Pigme highlight
const ACCENT_PIGME = "#F59E0B";

// --- HELPER ---
const handleAction = (type, value) => {
  if (!value) return;
  let url = "";
  if (type === "call") url = `tel:${value}`;
  else if (type === "whatsapp") {
    const cleanPhone = value.replace(/[^0-9]/g, "");
    url = `whatsapp://send?phone=${cleanPhone}`;
  } else if (type === "email") url = `mailto:${value}`;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (!supported) Alert.alert("Error", `Unable to handle ${type}: ${value}`);
      else return Linking.openURL(url);
    })
    .catch((err) => console.error("An error occurred", err));
};

// --- NAV PILL ---
const NavPill = ({ label, icon, color, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.navPill, { borderColor: color }]}>
    <View style={[styles.navPillInner, { backgroundColor: color + '22' }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.navPillText, { color }]}>{label}</Text>
      <Ionicons name="arrow-forward-circle" size={14} color={color} style={{ opacity: 0.8 }} />
    </View>
  </TouchableOpacity>
);

// --- ACTION BUTTON ---
const ActionBtn = ({ icon, color, bg, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.actionBtn, { backgroundColor: bg }]}>
    <Ionicons name={icon} size={16} color={color} />
  </TouchableOpacity>
);

// --- PIGME CUSTOMER CARD ---
const CustomerCard = React.memo(({ name, pigmeId, phone, address, email, onPress, index }) => {
  const scaleAnim   = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1, delay: index * 55,
        useNativeDriver: true, tension: 120, friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1, duration: 300, delay: index * 55, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const initial = (name || "?")[0].toUpperCase();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}>
        {/* Gold accent bar */}
        <View style={styles.cardTopAccent} />

        <View style={styles.cardTop}>
          {/* Avatar */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{name || "Unknown Customer"}</Text>
            <Text style={styles.cardPhone}>{phone || "—"}</Text>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <ActionBtn icon="call"          color="#10B981"    bg="#10B98118" onPress={() => handleAction("call", phone)} />
              <ActionBtn icon="logo-whatsapp" color="#25D366"    bg="#25D36618" onPress={() => handleAction("whatsapp", phone)} />
              {email ? (
                <ActionBtn icon="mail" color={ACCENT_BLUE} bg={ACCENT_BLUE + '18'} onPress={() => handleAction("email", email)} />
              ) : null}
            </View>

            {/* Pigme ID Badge */}
            <View style={styles.pigmeBadge}>
              <Ionicons name="wallet-outline" size={11} color={ACCENT_PIGME} />
              <Text style={styles.pigmeBadgeText}> Pigmy ID: {pigmeId}</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward-circle" size={24} color={ACCENT_BLUE} style={{ opacity: 0.65 }} />
        </View>

        <View style={styles.separator} />

        {/* Address */}
        <View style={styles.addressRow}>
          <Ionicons name="location-sharp" size={13} color={ACCENT_BLUE} style={{ marginTop: 1 }} />
          <View style={{ flex: 1, marginLeft: 7 }}>
            <Text style={styles.addressLabel}>Address</Text>
            <Text style={styles.addressText} numberOfLines={2}>{address || "No address provided"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// --- MAIN SCREEN ---
const RouteCustomerPigme = ({ route, navigation }) => {
  const { user } = route.params;
  const [search, setSearch]       = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const fetchPigmeCustomers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/pigme?referrerId=${user?.userId}`);
        if (response?.data?.data) setCustomers(response.data.data);
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPigmeCustomers();
  }, [user?.userId]);

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const searchTerm = search.toLowerCase();
    return Array.isArray(customers)
      ? customers.filter(
          (item) =>
            item.customer?.full_name?.toLowerCase().includes(searchTerm) ||
            item.pigme_id?.toLowerCase().includes(searchTerm)
        )
      : [];
  }, [search, customers]);

  const renderItem = useCallback(({ item, index }) => (
    <CustomerCard
      pigmeId={item.pigme_id}
      name={item.customer?.full_name}
      phone={item.customer?.phone_number}
      email={item.customer?.email}
      address={item.customer?.address}
      index={index}
      onPress={() =>
        navigation.navigate("PigmePayin", {
          user,
          customer: item?.customer?._id,
          pigme_id: item?._id,
          custom_pigme_id: item?.pigme_id,
        })
      }
    />
  ), [navigation, user]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={TOP_GRADIENT[0]} />

      {/* HEADER */}
      <LinearGradient colors={TOP_GRADIENT} style={styles.headerGradient}>
        <View style={styles.headerSpacer}><Header /></View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Pigmy Customers</Text>
          <Text style={styles.screenSubtitle}>
            {loading ? "Loading..." : `${filteredCustomers.length} pigmy accounts`}
          </Text>
        </View>

        {/* Navigation Pills */}
        <View style={styles.navRow}>
          <NavPill
            label="Chit Customers"
            icon="people-outline"
            color={ACCENT_CHIT}
            onPress={() => navigation.navigate("RouteCustomerChit", { user })}
          />
          <NavPill
            label="Loan Customers"
            icon="cash-outline"
            color={ACCENT_LOAN}
            onPress={() => navigation.navigate("RouteCustomerLoan", { user })}
          />
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={19} color={TEXT_GREY} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by Name or ID..."
            placeholderTextColor={TEXT_GREY}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={21} color={TEXT_GREY} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* LIST */}
      <View style={styles.listArea}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
            <Text style={styles.loadingText}>Fetching pigmy accounts...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderItem}
            keyExtractor={(item) => (item._id || item.pigme_id).toString()}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="wallet-outline" size={52} color={BORDER_COLOR} />
                <Text style={styles.emptyText}>No customers found.</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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

  headerGradient: { paddingHorizontal: 18, paddingBottom: 28 },
  headerSpacer: { paddingTop: 8, paddingBottom: 6 },

  titleBlock: { alignItems: 'center', marginBottom: 14 },
  screenTitle: { fontSize: 22, fontWeight: '900', color: CARD_BG, letterSpacing: 0.3 },
  screenSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3, fontWeight: '500' },

  navRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  navPill: { flex: 1, borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  navPillInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10, gap: 6 },
  navPillText: { fontSize: 12, fontWeight: '700', flex: 1 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: 13,
    paddingHorizontal: 14, height: 46,
    elevation: 5, shadowColor: '#000',
    shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  searchInput: { flex: 1, fontSize: 14, color: MODERN_PRIMARY, paddingVertical: 0, fontWeight: '500' },

  listArea: {
    flex: 1, backgroundColor: SUBTLE_BG_GREY,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -16, paddingTop: 6,
  },
  listContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 34 },

  card: {
    backgroundColor: CARD_BG, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER_COLOR,
    overflow: 'hidden', elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  cardTopAccent: {
    height: 3, width: '28%',
    backgroundColor: ACCENT_PIGME,
    marginLeft: 14, marginTop: 12, borderRadius: 4,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 12,
  },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: ACCENT_PIGME + '18',
    borderWidth: 1.5, borderColor: ACCENT_PIGME + '55',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: ACCENT_PIGME },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '800', color: MODERN_PRIMARY, marginBottom: 2 },
  cardPhone: { fontSize: 12, color: TEXT_GREY, fontWeight: '500', marginBottom: 6 },
  actionsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },

  pigmeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: ACCENT_PIGME + '18',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: ACCENT_PIGME + '44',
  },
  pigmeBadgeText: { fontSize: 10, fontWeight: '800', color: ACCENT_PIGME },

  separator: { height: 1, backgroundColor: BORDER_COLOR, marginHorizontal: 14 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 10 },
  addressLabel: { fontSize: 10, fontWeight: '700', color: ACCENT_BLUE, marginBottom: 2 },
  addressText: { fontSize: 12, color: MODERN_PRIMARY, fontWeight: '500', lineHeight: 17 },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 70, gap: 12 },
  loadingText: { color: TEXT_GREY, fontSize: 13, fontWeight: '500' },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: TEXT_GREY, fontSize: 14, fontWeight: '600' },
});

export default RouteCustomerPigme;