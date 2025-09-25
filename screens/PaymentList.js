import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color";
import Header from "../components/Header";

const PaymentCard = ({ name, icon, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.card}>
    <View style={styles.cardContent}>
      <Icon name={icon} style={styles.cardIcon} />
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>View Payment History</Text>
      </View>
    </View>
    <Icon name="arrow-right" style={styles.arrowIcon} />
  </TouchableOpacity>
);

const PaymentList = ({ route, navigation }) => {
  const { user } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <LinearGradient
        colors={['#dbf6faff', '#90dafcff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={{ flex: 1, marginHorizontal: 22, marginTop: 12 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Payments</Text>
            <Text style={styles.subtitle}>Select a payment type to continue</Text>
          </View>
          <View style={styles.cardListContainer}>
            <PaymentCard
              name="Chits Payments"
              icon="money"
              onPress={() =>
                navigation.navigate("ChitPayment", { user, areaId: "chits" })
              }
            />
            <PaymentCard
              name="Gold Chits Payments"
              icon="credit-card"
              onPress={() =>
                navigation.navigate("GoldPayment", { user, areaId: "gold-chits" })
              }
            />
            {/* NEW CARD: Loan Payments */}
            <PaymentCard
              name="Loan Payments"
              icon="bank" // Using 'bank' or could use 'usd' or 'handshake-o'
              onPress={() =>
                navigation.navigate("LoanPayments", { user, areaId: "loans" })
              }
            />
            {/* NEW CARD: Pigmy Payments */}
            <PaymentCard
              name="Pigmy Payments"
              icon="briefcase" // Using 'briefcase' or could use 'inr' or 'book'
              onPress={() =>
                navigation.navigate("PigmyPayments", { user, areaId: "pigmy" })
              }
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  titleContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  cardListContainer: {
    marginTop: 15,
    gap: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    borderColor: '#da8201',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 15,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  cardIcon: {
    fontSize: 32,
    color: '#da8201',
  },
  arrowIcon: {
    fontSize: 22,
    color: '#da8201',
  },
});

export default PaymentList;