import { View, Text, StyleSheet, Alert, Linking } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import COLORS from "../constants/color";
import { Feather } from "@expo/vector-icons";

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
    customer
}) => {
    const handlePhonePress = (phoneNumber) => {
        Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
            Alert.alert("Error", "Unable to make a call")
        );
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    return (
        <>
            <TouchableOpacity onPress={onPress}>
                <View style={styles.stock}>
                    <View style={styles.stock_conatiner}>
                        <View style={styles.stock_left}>
                            <View style={styles.square}>
                                <Text style={{ color: "white" }}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.stockText}>{name}</Text>
                        </View>
                        <Text>
                            <Text style={{ fontWeight: "900", color: "green" }}>₹{amount}</Text>
                        </Text>
                    </View>
                    <View style={styles.countsContainer}>
                        <View style={styles.count}>
                            <Text style={styles.countLabelText}></Text>
                            <Text style={styles.countText}>
                                <Text>{formatDate(date)}</Text>
                            </Text>
                        </View>
                        <View style={styles.count}>
                            <Text style={styles.countLabelText}></Text>
                            <Text style={styles.countText}>
                                <Text>{receipt}</Text>
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => handlePhonePress(phone)}>
                            <View style={styles.count}>
                                <Text style={styles.countLabelText}></Text>
                                <Text style={styles.countText}>
                                    <Text>{phone}</Text>
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.countsContainer}>
                        <View style={styles.count}>
                            <Text style={styles.countLabelText}></Text>
                            <Text style={styles.countText}>
                                <Text>Group: {group}</Text>
                            </Text>
                        </View>
                        <View style={styles.count}>
                            <Text style={styles.countLabelText}></Text>
                            <Text style={styles.countText}>
                                <Text>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.countsContainer,{justifyContent:"flex-end", marginTop:-5}]}>
                        <View style={styles.count}>
                            <Text style={styles.countLabelText}></Text>
                            <TouchableOpacity style={styles.countText} onPress={() => navigation.navigate("PaymentNavigator", { screen: "Reprint", params: { user, store_id: customer } })}>
                                <Text style={{ color: "orange" }}>Reprint</Text>
                            </TouchableOpacity>
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

export default PaymentChitList;
