import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- COLORS MATCHING YOUR HOME SCREEN ---
const COLORS = {
  primary: "#183A5D",
  accent: "#f8c009ff",
  bgBlue: "#1aa2ccff",
  success: "#27AE60",
  white: "#FFFFFF",
  muted: "#8898AA",
  lightBg: "#f4f7fa",
  warning: "#F39C12",
  danger: "#E74C3C",
};

// --- DUMMY DATA (REPLACE WITH API DATA LATER) ---
const loanData = [
  {
    id: "1",
    customerName: "Rajesh Kumar",
    loanAmount: "₹ 50,000",
    loanId: "LN-2023-001",
    date: "2023-10-24",
    status: "Pending", // Status can be: Pending, Approved, Rejected
    avatar: null // Can use image URL or null to show initials
  },
  {
    id: "2",
    customerName: "Anita Desai",
    loanAmount: "₹ 1,20,000",
    loanId: "LN-2023-002",
    date: "2023-10-23",
    status: "Approved",
    avatar: null
  },
  {
    id: "3",
    customerName: "Vikram Singh",
    loanAmount: "₹ 75,000",
    loanId: "LN-2023-003",
    date: "2023-10-22",
    status: "Rejected",
    avatar: null
  },
  {
    id: "4",
    customerName: "Sneha Reddy",
    loanAmount: "₹ 2,00,000",
    loanId: "LN-2023-004",
    date: "2023-10-21",
    status: "Pending",
    avatar: null
  },
];

const Approvals = ({ navigation, route }) => {
  const { user } = route.params || {}; // Getting user if passed from Home
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState(loanData); // Set initial data
  const [loading, setLoading] = useState(false);

  // --- FILTER LOGIC ---
  const filteredData = data.filter(item =>
    item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.loanId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- STATUS HELPER ---
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return { bg: "rgba(39, 174, 96, 0.15)", text: COLORS.success };
      case "Rejected": return { bg: "rgba(231, 76, 60, 0.15)", text: COLORS.danger };
      default: return { bg: "rgba(243, 156, 18, 0.15)", text: COLORS.warning }; // Pending
    }
  };

  // --- RENDER ITEM ---
  const renderLoanCard = ({ item, index }) => {
    const statusStyle = getStatusColor(item.status);
    
    // Extract initials for avatar
    const initials = item.customerName.split(' ').map(n => n[0]).join('').substring(0,2);

    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <View style={styles.rowInfo}>
              <MaterialIcons name="description" size={14} color={COLORS.muted} />
              <Text style={styles.subText}>{item.loanId}</Text>
            </View>
            <View style={styles.rowInfo}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.muted} />
              <Text style={styles.subText}>{item.date}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.loanAmount}>{item.loanAmount}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
          
          {item.status === "Pending" && (
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => Alert.alert("Action", `Process loan for ${item.customerName}?`)}
            >
              <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBlue} />
      
      {/* HEADER */}
      <LinearGradient colors={[COLORS.bgBlue, COLORS.primary]} style={styles.headerGradient}>
        <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Customers</Text>
          <TouchableOpacity style={styles.iconPlaceholder}>
             {/* Placeholder icon if needed for balance */}
             <Ionicons name="filter-list" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar Floating on Header */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.muted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Name or ID..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* CONTENT */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 10, color: COLORS.muted }}>Loading customers...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderLoanCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="folder-open" size={60} color={COLORS.muted} />
                <Text style={styles.emptyText}>No Loan Customers Found</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  // HEADER
  headerGradient: {
    paddingBottom: 80, // Space for the search bar to overlap
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  iconPlaceholder: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  searchWrapper: {
    position: 'absolute',
    bottom: -25, // Pull down to overlap
    left: 20,
    right: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.primary,
  },

  // CONTENT
  contentContainer: {
    flex: 1,
    marginTop: 35, // Space for the search bar
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // CARD STYLES
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    alignItems: 'center',
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.bgBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardInfo: {
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  subText: {
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 4,
  },

  // RIGHT SIDE OF CARD
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  loanAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionBtn: {
    backgroundColor: '#f0f4f8',
    padding: 6,
    borderRadius: 8,
  },

  // EMPTY STATE
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.muted,
    fontWeight: '500',
  },
});

export default Approvals;