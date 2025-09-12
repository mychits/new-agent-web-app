import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import Header from "../components/Header";
import blePrinter from "../components/BluetoothPrinter";
import Button from "../components/Button";
import RNPrint from "react-native-print";
import { useNavigation } from "@react-navigation/native";

const LoanPrint = ({ route }) => {
  const navigation = useNavigation();
  const {
    customer_name,
    phone_number,
    agent_name,
    total_amount,
    pay_date,
    amount,
    pay_type,
    transaction_id,
    receipt_no,
    isLoanPayment,
    custom_loan_id,
  } = route.params;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await blePrinter.scanAndConnect(() => {
        setIsConnected(true);
        Alert.alert("Success", "Connected to printer.");
      });
    } catch (error) {
      Alert.alert("Connection Error", "Failed to connect to Bluetooth printer.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrint = async () => {
    if (!isConnected) {
      Alert.alert("Error", "Please connect to the Bluetooth printer first.");
      return;
    }

    setIsPrinting(true);

    const centerText = (text, lineWidth = 40) => {
      const totalPadding = lineWidth - text.length;
      const paddingStart = Math.floor(totalPadding / 3);
      return " ".repeat(paddingStart) + text;
    };

    const receiptType = isLoanPayment ? "Loan Receipt" : "Receipt";
    const groupOrLoan = isLoanPayment
      ? `Loan ID: ${custom_loan_id}`
      : `Group:${"hello"}      `;

    const txnLine =
      pay_type?.toLowerCase() === "online" && transaction_id
        ? `Transaction ID: ${transaction_id}\n`
        : "";

    const receiptText = `
${centerText("MY CHITS")}
${centerText("No.11/36-25,2nd Main,")}
${centerText("Kathriguppe Main Road,")}
${centerText("Bangalore, 560085 9483900777")}
--------------------------------
${centerText(receiptType)}

Receipt No: ${receipt_no}
Date: ${formatDate(pay_date)}

Name: ${customer_name}
Mobile No: ${phone_number}

${groupOrLoan}
==============================
|   Received Amount: Rs.${amount}  |
==============================
Mode: ${pay_type}
${txnLine}Total: Rs.${total_amount || 0}
--------------------------------
Collected by: ${agent_name}
`;

    try {
      await blePrinter.printText(receiptText);
    } catch (error) {
      Alert.alert("Print Error", "Failed to print receipt.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePosPrint = async () => {
   

    setIsPrinting(true);

    const groupOrLoanHtml = isLoanPayment
      ? `<p style="margin: 0;">Loan ID: ${custom_loan_id}</p>`
      : `<p style="margin: 0;">Group: ${"Loan"}</p><p style="margin: 0;">Ticket: ${
          "loab" || "N/A"
        }</p>`;

    const txnLine =
      pay_type?.toLowerCase() === "online" && transaction_id
        ? `<p>Transaction ID: ${transaction_id}</p>`
        : "";

    const htmlContent = `
      <html>
      <head>
        <style>
          @page {
            size: 58mm auto;
            margin: 0 0 0 4mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            margin: 0;
            padding: 0;
            width: 58mm;
          }
          .receipt {
            padding: 5mm;
          }
          .header, .footer {
            text-align: center;
          }
          .line {
            border-top: 1px dashed #000;
            margin: 2mm 0;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h3 align="center">MY CHITS</h3>
          </div>
          <div>
            <p align="center">No.11/36-25, 2nd Main,</br>
            Kathriguppe Main Road,</br>
            Bangalore, 560085
            9483900777</p>
          </div>
          <div class="line"></div>
          <p align="center" style="font-weight:bold">${
            isLoanPayment ? "Loan Receipt" : "Receipt"
          }</p>
          <p>
          Receipt No: ${receipt_no} <br/>
          Date: ${formatDate(pay_date)}
          </p>
          <p>
          Name: ${customer_name} <br/>
          Mobile No: ${phone_number}
          </p>
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            ${groupOrLoanHtml}
          </div>
          <table style="border-collapse: collapse; width: 100%;" border="1">
            <tr>
              <td style="padding: 5px; font-size:14px">Received Amount</td>
              <td style="padding: 5px; font-size:14px">Rs.${amount}</td>
            </tr>
          </table>
          <p>Mode: ${pay_type}</br>
          ${txnLine}
          Total: Rs.${total_amount || 0}</p>
          <div class="line"></div>
          <p>Collected By: ${agent_name}</p>
        </div>
      </body>
      </html>
    `;

    try {
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Failed to print the document.");
    } finally {
      setIsPrinting(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      navigation.navigate("RouteCustomerChit");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const groupOrLoanDisplay = isLoanPayment
    ? `Loan ID: ${custom_loan_id}`
    : `Loan Amount: ${"group" || ""} `;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={{ marginHorizontal: 22, marginTop: 12 }}>
        <Header />

        <Button
          title={
            isConnecting
              ? "Connecting..."
              : isConnected
              ? "Connected"
              : "Connect to Printer"
          }
          filled
          style={{ marginTop: 18, marginBottom: 4 }}
          onPress={handleConnect}
          disabled={isConnecting || isConnected}
        />

        {isConnecting && (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={{ marginVertical: 8 }}
          />
        )}

        <View
          style={{
            padding: 8,
            backgroundColor: "#f0eeee",
            borderRadius: 8,
            marginTop: 5,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              textAlign: "center",
            }}
          >
            MY CHITS
          </Text>
          <Text style={[styles.textStyle, { textAlign: "center", marginTop: 3 }]}>
            No.11/36-25, 2nd Main,
          </Text>
          <Text style={[styles.textStyle, { textAlign: "center" }]}>
            Kathriguppe Main Road,
          </Text>
          <Text style={[styles.textStyle, { textAlign: "center" }]}>
            Bangalore, 560085 9483900777
          </Text>

          <View
            style={{
              borderBottomWidth: 1,
              borderColor: "#000",
              marginVertical: 5,
            }}
          />

          <Text
            style={{
              fontWeight: "bold",
              fontSize: 13,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {isLoanPayment ? "Loan Receipt" : "Receipt"}
          </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={styles.textStyle}>
                Receipt No: {receipt_no || ""}
              </Text>
              <Text style={styles.textStyle}>
                Date: {formatDate(pay_date || "")}
              </Text>
            </View>
          </View>

          <Text style={styles.textStyle}> </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={styles.textStyle}>
                Name: {customer_name || ""}
              </Text>
              <Text style={styles.textStyle}>
                Mobile No: {phone_number || ""}
              </Text>
            </View>
          </View>

          <Text style={styles.textStyle}> </Text>

          <Text
            style={[styles.textStyle, { fontSize: 14, fontWeight: "bold" }]}
          >
            {groupOrLoanDisplay}
          </Text>

          <Text style={styles.textStyle}> </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={[
                styles.textStyle,
                {
                  fontSize: 16,
                  fontWeight: "bold",
                  borderWidth: 1,
                  padding: 5,
                },
              ]}
            >
              Received Amount | Rs.{amount || ""}
            </Text>
          </View>

          <Text style={styles.textStyle}> </Text>
          <Text style={styles.textStyle}>Mode: {pay_type || ""}</Text>
          {pay_type?.toLowerCase() === "online" && transaction_id ? (
            <Text style={styles.textStyle}>
              Transaction ID: {transaction_id}
            </Text>
          ) : null}
          <Text style={styles.textStyle}>Total: Rs.{total_amount}</Text>

          <View
            style={{
              borderBottomWidth: 1,
              borderColor: "#000",
              marginVertical: 5,
            }}
          />

          <Text style={styles.textStyle}>Collected by: {agent_name}</Text>
          <Text style={styles.textStyle}> </Text>
        </View>

        {isPrinting && (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 12 }}
          />
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 18,
          }}
        >
          <Button
            title="Thermal Print"
            filled
            style={{ flex: 1, marginRight: 8, backgroundColor: COLORS.third }}
            onPress={handlePrint}
            disabled={!isConnected || isPrinting}
          />
          <Button
            title="POS Print"
            filled
            style={{ flex: 1, marginLeft: 8, backgroundColor: COLORS.third }}
            onPress={() => handlePosPrint()}
            disabled={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  textStyle: {
    fontSize: 13,
  },
});

export default LoanPrint;
