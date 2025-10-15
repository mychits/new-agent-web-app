import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";

// Custom Card Component with a more attractive, balanced layout
const CustomReportCard = ({ name, icon, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.card}>
    <View style={styles.cardContent}>
      <Icon name={icon} style={styles.cardIcon} />
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>View Full Report</Text>
      </View>
    </View>
    <Icon name="arrow-right" style={styles.arrowIcon} />
  </TouchableOpacity>
);

const Reports = ({ route, navigation }) => {
  const { user } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <LinearGradient
        colors={['#dbf6faff', '#90dafcff']} // Refined gradient colors for a more modern, cohesive look
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={{flex: 1, marginHorizontal: 22, marginTop: 12 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Reports</Text>
            <Text style={styles.subtitle}>Select a Report type to continue</Text>
          </View>
          <View style={styles.cardListContainer}>
            <CustomReportCard
              key="chits-card"
              name="Chits Report"
              icon="line-chart"
              onPress={() => navigation.navigate("ChitPayment", { user: user, areaId: "chits" })}
            />
            <CustomReportCard
              key="gold-chits-card"
              name="Gold Chits Report"
              icon="bar-chart"
              onPress={() => navigation.navigate("GoldPayment", { user: user, areaId: "gold-chits" })}
            />
            <CustomReportCard
              key="loan-chits-card"
              name="Loan Chits Report"
              icon="bank"
              onPress={() => navigation.navigate("LoanPayments", { user: user, areaId: "loan-chits" })}
            />
            <CustomReportCard
              key="pigme-chits-card"
              name="Pigme Chits Report"
              icon="briefcase"
              onPress={() => navigation.navigate("PigmePayments", { user: user, areaId: "pigme-chits" })}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 0,
    color: '#333',
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
    fontSize: 24,
    color: '#da8201', // Changed to gold color for consistency with the routes page
  },
  arrowIcon: {
    fontSize: 20,
    color: '#da8201', // Changed to gold color for consistency with the routes page
  },
});

export default Reports;