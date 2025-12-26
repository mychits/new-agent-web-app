import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import baseUrl from "../constants/baseUrl";

const COLORS = {
  chit: "#1aa2cc",
  loan: "#e53935",
  pigme: "#43a047",
};

export default function CustomerPaymentLink({ route }) {
  const { customer } = route.params;

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH ALL CARDS ---------------- */
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // --- Chit cards ---
      const chitRes = await axios.post(`${baseUrl}/enroll/get-user-tickets`, {
        user_id: customer._id,
      });

      // --- Loan cards ---
      const loanRes = await axios.get(`${baseUrl}/loans/get-loans-by-user`, {
        params: { user_id: customer._id },
      });

      // --- Pigme cards ---
      const pigmeRes = await axios.get(`${baseUrl}/pigme/get-pigme-by-user`, {
        params: { user_id: customer._id },
      });

      // --- Map responses to cards ---
      const chitCards = (chitRes.data || []).map((c) => ({
        type: "chit",
        title: c.group_id?.group_name || "Chit Group",
        subtitle: `Tickets: ${c.tickets}`,
      }));

      const loanCards = (loanRes.data || []).map((l) => ({
        type: "loan",
        title: `Loan ID: ${l.loan_id}`,
        subtitle: `Amount: ₹${l.loan_amount}`,
      }));

      const pigmeCards = (pigmeRes.data || []).map((p) => ({
        type: "pigme",
        title: `Pigme ID: ${p.pigme_id}`,
        subtitle: `Payable: ₹${p.payable_amount}`,
      }));

      setCards([...chitCards, ...loanCards, ...pigmeCards]);
    } catch (e) {
      console.error("Fetch error:", e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1aa2cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {cards.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View
              style={[styles.badge, { backgroundColor: COLORS[item.type] }]}
            >
              <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub}>{item.subtitle}</Text>
            </View>

            <Ionicons name="layers-outline" size={22} color="#888" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  title: { fontSize: 16, fontWeight: "700" },
  sub: { fontSize: 13, color: "#666" },
});
