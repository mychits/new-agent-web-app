import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color"; // Assuming this is defined
import Header from "../components/Header"; // Assuming this is defined
import blePrinter from "../components/BluetoothPrinter"; // Assuming this is defined
import Button from "../components/Button"; // Assuming this is defined
import RNPrint from "react-native-print";
import { useNavigation } from "@react-navigation/native";

// Utility function to format the date
const formatDate = (dateString) => {
  if (!dateString) return "";
  // Check if it's already a Date object
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  // Using toLocaleDateString for formatting. Fallback to a simple string if New Date fails
  return date.toLocaleDateString("en-US", options);
};

// Utility function for text alignment in raw thermal print
const centerText = (text, lineWidth = 40) => {
  const totalPadding = lineWidth - text.length;
  // A simple center approximation for a mono-spaced font
  const paddingStart = Math.max(0, Math.floor(totalPadding / 2));
  return " ".repeat(paddingStart) + text;
};

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
    // pigme_id, // Not used in the final display logic
  } = route.params;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBackPress = () => {
      // Navigate back to PigmePayment on hardware back press
      navigation.navigate("PigmePayment");
      return true;
    };

    // The modern way: addEventListener returns a function to remove the listener
    const backHandlerSubscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => {
      // FIX: Use the subscription's `remove` method, which is the correct pattern.
      // If the error persists (e.g., in unsupported environments), the environment
      // itself is the problem, but this is the correct, modern cleanup pattern.
      if (backHandlerSubscription && backHandlerSubscription.remove) {
        backHandlerSubscription.remove();
      } else if (BackHandler.removeEventListener) {
        // Fallback for older RN versions or if subscription.remove is unavailable
        BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
      }
    };
  }, [navigation]); // Depend on navigation

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Assuming blePrinter.scanAndConnect handles the Bluetooth connection logic
      await blePrinter.scanAndConnect(() => {
        setIsConnected(true);
        setIsConnecting(false);
        Alert.alert("Success", "Connected to printer! 🥳");
      });
    } catch (error) {
      setIsConnecting(false);
      Alert.alert(
        "Connection Error",
        "Failed to connect to printer. " + (error.message || "Unknown error.")
      );
    }
  };

  /**
   * Handles the raw text printing for a thermal printer (usually 80mm or 58mm in text mode)
   */
  const handlePrint = async () => {
    if (!isConnected) {
      Alert.alert("Error", "Please connect to the Bluetooth printer first.");
      return;
    }

    setIsPrinting(true);

    const receiptType = isPigmePayment ? "Pigme Receipt" : "Receipt";
    // NOTE: Hardcoded "000 Error 000" for non-Pigme group is preserved from original code
    const groupOrPigme = isPigmePayment
      ? `Pigme ID: ${custom_pigme_id || "N/A"}`
      : `Group: ${"000 Error 000"}`;

    const txnLine =
      pay_type?.toLowerCase() === "online" && transaction_id
        ? `Transaction ID: ${transaction_id}\n`
        : "";

    // 40 characters is a common line width for 80mm receipt printers
    const receiptText = `
${centerText("MY CHITS")}
${centerText("No.11/36-25, 2nd Main,")}
${centerText("Kathriguppe Main Road,")}
${centerText("Bangalore, 560085 9483900777")}
--------------------------------
${centerText(receiptType)}

Receipt No: ${receipt_no || "N/A"}
Date: ${formatDate(pay_date)}

Name: ${customer_name || "N/A"}
Mobile No: ${phone_number || "N/A"}

${groupOrPigme}
==============================
| Received Amount: Rs.${amount || 0} |
==============================
Mode: ${pay_type || "N/A"}
${txnLine}Total: Rs.${total_amount || 0}
--------------------------------
Collected by: ${agent_name || "N/A"}

\n\n\n
`; // Added extra newlines for paper feed after print

    try {
      await blePrinter.printText(receiptText);
    } catch (error) {
      console.error("Thermal Print Error:", error);
      Alert.alert("Print Error", "Failed to print receipt via Bluetooth.");
    } finally {
      setIsPrinting(false);
    }
  };

  /**
   * Generates the HTML content for POS printing, configurable by paper size.
   * @param {string} size - The physical width of the paper (e.g., '58mm', '80mm').
   * @returns {string} The HTML content string.
   */
  const generatePosReceiptHtml = (size) => {
    // NOTE: Hardcoded "Loan" and "loab" for non-Pigme group is preserved from original code
    const groupOrPigmeHtml = isPigmePayment
      ? `<p style="margin: 0; font-weight: bold;">Pigme ID: ${custom_pigme_id || "N/A"}</p>`
      : `<p style="margin: 0; font-weight: bold;">Group: ${"Loan"}</p><p style="margin: 0; font-weight: bold;">Ticket: ${"loab" || "N/A"
      }</p>`;

    const txnLine =
      pay_type?.toLowerCase() === "online" && transaction_id
        ? `<p style="margin-top: 5px;">Transaction ID: ${transaction_id}</p>`
        : "";

    return `
      <html>
      <head>
        <style>
          @page {
            size: ${size} auto;
            margin: 0 0 0 4mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            margin: 0;
            padding: 0;
            width: ${size};
          }
          .receipt {
            padding: 5mm;
          }
          .header, .footer {
            text-align: center;
          }
          .line {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .amount-table {
              border-collapse: collapse;
              width: 100%;
              margin: 10px 0;
          }
          .amount-table td {
              padding: 5px;
              font-size: 14px;
              border: 1px solid #000;
          }
          .amount-table tr:first-child td {
              font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h3 style="margin-bottom: 5px;">MY CHITS</h3>
          </div>
          <div style="text-align: center; font-size: 12px;">
            <p style="margin: 0;">No.11/36-25, 2nd Main,</p>
            <p style="margin: 0;">Kathriguppe Main Road,</p>
            <p style="margin: 0;">Bangalore, 560085 | 9483900777</p>
          </div>
          <div class="line"></div>
          <p style="text-align: center; font-weight:bold; margin-top: 0; margin-bottom: 10px;">
            ${isPigmePayment ? "Pigme Receipt" : "Receipt"}
          </p>
          <p style="margin: 0;">
          <span style="font-weight: bold;">Receipt No:</span> ${receipt_no || "N/A"} <br/>
          <span style="font-weight: bold;">Date:</span> ${formatDate(pay_date)}
          </p>
          <p style="margin: 10px 0 0 0;">
          <span style="font-weight: bold;">Name:</span> ${customer_name || "N/A"} <br/>
          <span style="font-weight: bold;">Mobile No:</span> ${phone_number || "N/A"}
          </p>
          <div style="margin: 10px 0;">
            ${groupOrPigmeHtml}
          </div>
          <table class="amount-table">
            <tr>
              <td>Received Amount</td>
              <td style="text-align: right;">Rs.${amount || 0}</td>
            </tr>
          </table>
          <p style="margin-top: 10px; margin-bottom: 5px;">
          <span style="font-weight: bold;">Mode:</span> ${pay_type || "N/A"}</p>
          ${txnLine}
          <p style="margin-top: 5px; margin-bottom: 10px; font-weight: bold;">Total: Rs.${total_amount || 0}</p>
          <div class="line"></div>
          <p style="text-align: center; margin-bottom: 0;">
          <span style="font-weight: bold;">Collected By:</span> ${agent_name || "N/A"}</p>
          <p style="text-align: center; font-size: 12px; margin-top: 10px;">*** Thank You ***</p>
          <p style="height: 100px;">&nbsp;</p> </div>
      </body>
      </html>
    `;
  };

  /**
   * Handles the general print function using react-native-print for 58mm paper.
   */
  const handlePosPrint = async () => {
    setIsPrinting(true);
    const htmlContent = generatePosReceiptHtml("58mm");
    try {
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      console.error("POS 58MM Print Error:", error);
      Alert.alert("Print Error", "Failed to print the document via POS 58MM.");
    } finally {
      setIsPrinting(false);
    }
  };

  /**
   * Handles the general print function using react-native-print for 80mm paper.
   */
  const handlePos80MMPrint = async () => {
    setIsPrinting(true);
    const htmlContent = generatePosReceiptHtml("80mm");
    try {
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      console.error("POS 80MM Print Error:", error);
      Alert.alert("Print Error", "Failed to print the document via POS 80MM.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <ScrollView style={{flex:1}}>
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={{ marginHorizontal: 22, marginTop: 12, flex: 1 }}>
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

        {/* Receipt Preview */}
        <View
          style={{
            padding: 12, // Increased padding for better look
            backgroundColor: "#f0eeee",
            borderRadius: 8,
            marginTop: 5,
            flexGrow: 1, // Allows the content to grow
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

          <View style={styles.separator} />

          <Text
            style={{
              fontWeight: "bold",
              fontSize: 13,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {isPigmePayment ? "Pigme Receipt" : "Receipt"}
          </Text>

          <Text style={styles.textStyle}>
            <Text style={{ fontWeight: 'bold' }}>Receipt No:</Text> {receipt_no || "N/A"}
          </Text>
          <Text style={styles.textStyle}>
            <Text style={{ fontWeight: 'bold' }}>Date:</Text> {formatDate(pay_date || "")}
          </Text>

          <Text style={{ ...styles.textStyle, marginVertical: 5 }} />

          <Text style={styles.textStyle}>
            <Text style={{ fontWeight: 'bold' }}>Name:</Text> {customer_name || "N/A"}
          </Text>
          <Text style={styles.textStyle}>
            <Text style={{ fontWeight: 'bold' }}>Mobile No:</Text> {phone_number || "N/A"}
          </Text>

          <Text style={{ ...styles.textStyle, marginVertical: 5 }} />

          <Text style={[styles.textStyle, { fontSize: 14, fontWeight: "bold" }]}>
            {isPigmePayment ? `Pigme ID: ${custom_pigme_id || "N/A"}` : `Group: 000 Error 000`}
          </Text>

          <View style={{ ...styles.amountBox, marginVertical: 10 }}>
            <Text style={styles.amountText}>
              Received Amount | Rs.{amount || 0}
            </Text>
          </View>

          <Text style={styles.textStyle}>
            <Text style={{ fontWeight: 'bold' }}>Mode:</Text> {pay_type || "N/A"}
          </Text>
          {pay_type?.toLowerCase() === "online" && transaction_id ? (
            <Text style={styles.textStyle}>
              <Text style={{ fontWeight: 'bold' }}>Transaction ID:</Text> {transaction_id}
            </Text>
          ) : null}
          <Text style={[styles.textStyle, { fontWeight: 'bold' }]}>
            Total: Rs.{total_amount || 0}
          </Text>

          <View style={styles.separator} />

          <Text style={styles.textStyle}>
            <Text style={{ fontWeight: 'bold' }}>Collected by:</Text> {agent_name || "N/A"}
          </Text>
          <Text style={styles.textStyle}> </Text>
        </View>
        {/* End Receipt Preview */}


        {isPrinting && (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 12 }}
          />
        )}

        {/* Print Buttons */}
        <View style={{ marginBottom: 18 }}>
          {/* Print Buttons Row 1 (Thermal and POS 58MM) */}
          <View style={[styles.buttonRow, { marginTop: 18 }]}>
            <Button
              title="Thermal Print"
              filled

              style={styles.printButtonOne}
              onPress={handlePrint}
              disabled={!isConnected || isPrinting}
            />
            <Button
              title="POS Print"
              filled
              style={styles.printButtonTwo}
              onPress={handlePosPrint}
              disabled={isPrinting}
            />
          </View>

          {/* Print Buttons Row 2 (POS 80MM) */}
          <View style={styles.buttonRow}>
            <Button
              title="POS 80MM Print"
              filled
              style={styles.posBiggerButton}
              onPress={handlePos80MMPrint}
              disabled={isPrinting}
            />
          </View>
        </View>
        {/* End Print Buttons */}
      </View>
    </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  textStyle: {
    fontSize: 13,
  },
  separator: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: "#000",
    marginVertical: 10,
  },
  amountBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Corrected style for button rows
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  printButtonOne: {
    backgroundColor: COLORS.third,
    padding: 20
  },
  printButtonTwo: {
    backgroundColor: COLORS.third,
    padding: 20
  },
  posBiggerButton: {
    flex: 1,

    backgroundColor: COLORS.third
  }
});

export default PigmePrint;