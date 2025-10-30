import { View, Text, StyleSheet, Alert } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import COLORS from "../constants/color";
import { Feather } from "@expo/vector-icons";
import EvilIcons from '@expo/vector-icons/EvilIcons';

const RouteList = ({ name, idx, navigation, user, areaId, redirect }) => {
  return (
    <>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(redirect, { user: user, areaId: areaId });
        }}
      >
        <View style={styles.stock}>
          <View style={styles.stock_conatiner}>
            <View style={styles.stock_left}>
              <View style={styles.square}>
                <Text style={{ color: "white" }}>{idx + 1}</Text>
              </View>
              <Text style={styles.stockText}>{name}</Text>
            </View>
            <View style={styles.circular}>
              <Text>
                <Feather name="arrow-right-circle" size={20} color={COLORS.darkGray} />
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  stock: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    borderWidth: 0.5,
  },
  stock_conatiner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  square: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.primary,
    opacity: 1,
    borderRadius: 5,
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  stock_left: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  stockText: {
    maxWidth: "80%",
    fontWeight: "bold",
    fontSize: 16,
  },
  circular: {
    width: 30,
    height: 30,
    borderColor: COLORS.third,
    borderWidth: 0,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  countsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  count: {
    alignItems: "center",
    marginBottom: 5,
  },
  countLabelText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.black,
  },
  countText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});

export default RouteList;
