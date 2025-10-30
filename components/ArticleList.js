import { View, Text, StyleSheet, Alert } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import COLORS from "../constants/color";

const ArticleList = ({
  text,
  cat_count,
  sub_count,
  item_count,
  idx,
  navigation,
  user,
}) => {
  return (
    <View style={styles.stock}>
      <View style={styles.stock_conatiner}>
        <View style={styles.stock_left}>
          <View style={styles.square}>
            <Text style={{ color: "white" }}>{idx + 1}</Text>
          </View>
          <Text style={styles.stockText}>{text}</Text>
        </View>
        <View style={styles.circular}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("ViewArticles", { user });
            }}
          >
            <Text>!</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.countsContainer}>
        <View style={styles.count}>
          <Text style={styles.countLabelText}>Edit</Text>
          <Text style={styles.countText}>
            <View style={[styles.circular, { marginTop: 20 }]}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("UpdateArticle", { user });
                }}
              >
                <Text>%</Text>
              </TouchableOpacity>
            </View>
          </Text>
        </View>
        <View style={styles.count}>
          <Text style={styles.countLabelText}>Delete</Text>
          <Text style={styles.countText}>
            <View style={[styles.circular, { marginTop: 20 }]}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert("Are you sure to delete ?");
                }}
              >
                <Text>X</Text>
              </TouchableOpacity>
            </View>
          </Text>
        </View>
      </View>
    </View>
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
    fontSize: 18,
  },
  circular: {
    width: 30,
    height: 30,
    borderColor: COLORS.third,
    borderWidth: 2,
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

export default ArticleList;
