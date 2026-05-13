import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import COLORS from "../constants/color";

const PaymentChitList = ({
  name,
  cus_id,
  phone,
  idx,
  navigation,
  user,
  onPress,
  receipt,
  amount,
  date,
  group,
  type,
  customer,
  ticket,
}) => {
  const handlePhonePress = (phoneNumber) => {
    if (!phoneNumber || phoneNumber === "N/A") {
      Alert.alert("Error", "No phone number available");
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`).catch(() =>
      Alert.alert("Error", "Unable to make a call")
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const options = { day: "2-digit", month: "short", year: "numeric" };
      return date.toLocaleDateString("en-US", options);
    } catch {
      return "N/A";
    }
  };

  const getPaymentTypeStyle = (paymentType) => {
    const t = paymentType?.toLowerCase();

    if (t === "cash") {
      return { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" };
    } else if (t === "online") {
      return { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" };
    } else if (t === "check" || t === "cheque") {
      return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
    } else {
      return { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" };
    }
  };

  const currentTypeStyle = getPaymentTypeStyle(type);

  const handleReprint = () => {
    if (!navigation || !user || !customer) {
      Alert.alert("Error", "Missing required data for reprint.");
      return;
    }
    try {
      navigation.navigate("PaymentNavigator", {
        screen: "Reprint",
        params: { user, store_id: customer },
      });
    } catch {
      Alert.alert("Navigation Error", "Unable to navigate to Reprint screen.");
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{idx + 1}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.customerName} numberOfLines={1}>
                {name || "N/A"}
              </Text>
              <Text style={styles.receiptNumber}>
                Receipt #{receipt || "N/A"}
              </Text>
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={styles.amountValue}>
              ₹{parseFloat(amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="calendar" size={14} color={COLORS.gray} />
              <Text style={styles.infoLabel}>Date</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => handlePhonePress(phone)}
              activeOpacity={0.6}
            >
              <Feather name="phone" size={14} color="#4A90E2" />
              <Text style={styles.infoLabel}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handlePhonePress(phone)}>
              <Text style={[styles.infoValue, styles.phoneNumber]}>
                {phone || "N/A"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="users" size={14} color={COLORS.gray} />
              <Text style={styles.infoLabel}>Group</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {group || "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="tag" size={14} color={COLORS.gray} />
              <Text style={styles.infoLabel}>Ticket</Text>
            </View>
            <Text style={styles.infoValue}>{ticket || "N/A"}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: currentTypeStyle.bg,
                borderColor: currentTypeStyle.border,
              },
            ]}
          >
            <Text style={[styles.typeText, { color: currentTypeStyle.text }]}>
              {type ? type.charAt(0).toUpperCase() + type.slice(1) : "N/A"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.reprintButton}
            onPress={handleReprint}
            activeOpacity={0.7}
          >
            <Feather name="printer" size={16} color="#FF8C00" />
            <Text style={styles.reprintText}>Reprint</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  indexBadge: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  indexText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  receiptNumber: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
  },
  amountContainer: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  amountLabel: {
    fontSize: 11,
    color: "#666666",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10B981",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 16,
  },
  infoGrid: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "600",
    maxWidth: 180,
  },
  phoneNumber: {
    color: "#4A90E2",
    textDecorationLine: "underline",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reprintButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  reprintText: {
    fontSize: 14,
    color: "#FF8C00",
    fontWeight: "600",
  },
});

export default PaymentChitList;