import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../constants/color";
import Header from "../components/Header";

// Custom Card Component with a more attractive, balanced layout
const CustomRouteCard = ({ name, icon, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.card}>
    <View style={styles.cardContent}>
      <Icon name={icon} style={styles.cardIcon} />
      <View style={styles.textContainer}>
        <Text style={styles.cardText}>{name}</Text>
        <Text style={styles.cardSubText}>View detailed report</Text>
      </View>
    </View>
    <Icon name="arrow-right" style={styles.arrowIcon} />
  </TouchableOpacity>
);

const Due = ({ route, navigation }) => {
  // Defensive destructuring remains in place to prevent the previous crash
  const { user} = route.params 



  // Removed the navigateToDueReport function and replaced calls below
  // to navigate directly to the specific report screens.

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
          
            <Text style={styles.title}>Outstanding Reports</Text>
            <Text style={styles.subtitle}>Select a report type to view outstanding data</Text>
          </View>
          <View style={styles.cardListContainer}>
          
            <CustomRouteCard
             
              name="Collection Report"
              icon="inbox" 
              onPress={() => navigation.navigate("OutstandingReports", { user})}
            />
            <CustomRouteCard
             
              name="Referred Report"
              icon="share-alt" 
              onPress={() => navigation.navigate("ReferredReport", { user})}
            />
            <CustomRouteCard
             
              name="Group Report"
              icon="users" 
              onPress={() => navigation.navigate("GroupReport", { user})}
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
     textAlign: 'center',
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
    borderColor: '#da8201', // Gold color for the accent border
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
    fontSize: 25,
    color: '#da8201',
  },
  arrowIcon: {
    fontSize: 22,
    color: '#da8201',
  },
});

export default Due;