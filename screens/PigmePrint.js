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

const PigmePrint = ({ route }) => {
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
    custom_pigme_id,
    receipt_no,
    isPigmePayment,
    pigme_id,
  } = route.params;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate("PigmePayment");
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    };
  }, [navigation]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await blePrinter.scanAndConnect(() => {
        setIsConnected(true);
        setIsConnecting(false);
      });
    } catch (error) {
      setIsConnecting(false);
      Alert.alert(
        "Connection Error",
        "Failed to connect to printer. " + error.message
      );
    }
  };

  const generateReceiptHtml = () => {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; }
                    .receipt-container { width: 80mm; margin: 0 auto; padding: 10px; border: 1px solid #000; box-sizing: border-box; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .title { font-size: 20px; font-weight: bold; margin: 0; }
                    .subtitle { font-size: 14px; margin: 0; }
                    .details { margin-top: 20px; line-height: 1.6; }
                    .label { font-weight: bold; }
                    .info { text-align: right; }
                    .flex-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                    .footer { text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        <h1 class="title">Receipt</h1>
                    </div>
                    <div class="details">
                        <div class="flex-row">
                            <span class="label">Customer:</span>
                            <span class="info">${customer_name}</span>
                        </div>
                        <div class="flex-row">
                            <span class="label">Pigme ID:</span>
                            <span class="info">${
                              custom_pigme_id || "N/A"
                            }</span>
                        </div>
                        <div class="flex-row">
                            <span class="label">Date:</span>
                            <span class="info">${pay_date}</span>
                        </div>
                        <div class="flex-row">
                            <span class="label">Receipt No:</span>
                            <span class="info">${receipt_no || "N/A"}</span>
                        </div>
                        <div class="flex-row">
                            <span class="label">Paid Amount:</span>
                            <span class="info">Rs.${amount}</span>
                        </div>
                        <div class="flex-row">
                            <span class="label">Payment Type:</span>
                            <span class="info">${pay_type}</span>
                        </div>
                        ${
                          transaction_id
                            ? `
                        <div class="flex-row">
                            <span class="label">Transaction ID:</span>
                            <span class="info">${transaction_id}</span>
                        </div>`
                            : ""
                        }
                    </div>
                    <div class="divider"></div>
                    <div class="flex-row">
                        <span class="label">Total Amount:</span>
                        <span class="info">Rs.${total_amount || 0}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p>Collected by: ${agent_name}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
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

    const receiptType = isPigmePayment ? "Pigme Receipt" : "Receipt";
    const groupOrPigme = isPigmePayment
      ? `Pigme ID: ${custom_pigme_id}`
      : `Group:${"000 Error 000"}`;

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

${groupOrPigme}
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

    const groupOrPigmeHtml = isPigmePayment
      ? `<p style="margin: 0;">Pigme ID: ${custom_pigme_id}</p>`
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
            isPigmePayment ? "Pigme Receipt" : "Receipt"
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
            ${groupOrPigmeHtml}
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
  
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

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
          <Text
            style={[styles.textStyle, { textAlign: "center", marginTop: 3 }]}
          >
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
            Receipt
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
              <Text style={styles.textStyle}>Name: {customer_name || ""}</Text>
              <Text style={styles.textStyle}>
                Mobile No: {phone_number || ""}
              </Text>
            </View>
          </View>

          <Text style={styles.textStyle}> </Text>

          <Text
            style={[styles.textStyle, { fontSize: 14, fontWeight: "bold" }]}
          >
            Pigme ID: {custom_pigme_id || "N/A"}
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

export default PigmePrint;
