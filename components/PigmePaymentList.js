import { View, Text, StyleSheet, Alert, Linking } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import COLORS from "../constants/color";
import { Feather } from "@expo/vector-icons";

const PigmePaymentList = ({
    agent_name,
    
    actual_pigme_id,
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
  pigmeId,
  pigmeAmount="0",
  type,
  customer,

}) => {
  const handlePhonePress = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
      Alert.alert("Error", "Unable to make a call")
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{idx + 1}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.customerName}>{name}</Text>
              <Text style={styles.receiptNumber}>Receipt #{receipt}</Text>
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={styles.amountValue}>₹{amount}</Text>
          </View>
        </View>

        {/* Divider */}
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
                {phone}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="credit-card" size={14} color={COLORS.gray} />
              <Text style={styles.infoLabel}>Pigme ID</Text>
            </View>
            <Text style={styles.infoValue}>{pigmeId}</Text>
          </View>

          {pigmeAmount && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Feather name="sun" size={14} color={COLORS.gray} />
                <Text style={styles.infoLabel}>Pigme Amount</Text>
              </View>
              <Text style={styles.infoValue}>₹{pigmeAmount}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.reprintButton}
            onPress={() => {
              return navigation.navigate("PaymentNavigator", {
                screen: "PigmeRePrint",
                params: {
                  customer_name: name,
                  phone_number: phone,
                  agent_name,
                  actual_pigme_id,
                  amount: amount,
                  pay_type: type,
                  pay_date: date,
                  transaction_id: idx,
                  receipt_no: receipt,
                  cus_id,
                    pigme_amount:pigmeAmount,
                  custom_pigme_id: pigmeId,
                  isPigmePayment: true,
                  customer,
                  user,
                },
              });
            }}
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
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    color: "#374151",
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

export default PigmePaymentList;
