import React, { useState, useEffect } from "react";
import { View, Text, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import Header from "../components/Header";
import blePrinter from "../components/BluetoothPrinter";
import Button from "../components/Button";
import RNPrint from "react-native-print";
import baseUrl from "../constants/baseUrl";
import axios from "axios";

const LoanPrint = ({ route }) => {
  const {
    customer_name,
    phone_number,
    agent_name,
    pay_date,
    amount,
    pay_type,
    transaction_id,
    receipt_no,
    isLoanPayment,
    loanAmount,
    custom_loan_id,
    group_name = "N/A",
    ticket_no = "N/A",
    cus_id,
    actual_loan_id,
  } = route.params;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalPaidAmount, setTotalPaidAmount] = useState("");
  const [remainingLoan, setRemainingLoan] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return dateString;
      const options = { day: "2-digit", month: "short", year: "numeric" };
      return date.toLocaleDateString("en-US", options);
    } catch (e) {
      return dateString;
    }
  };
  useEffect(() => {
    (async () => {
      try {
        setLoading(false);
        console.log(cus_id,actual_loan_id,"actaula")
        const response = await axios.get(
          `${baseUrl}/payment/user/${cus_id}/loan/${actual_loan_id}/summary`
        );
        console.log(response.data,"response date")

        if (Array.isArray(response.data)) {
          const totalPaid = response?.data?.[0]?.totalPaidAmount;
          const remainLoan = (Number(loanAmount) || 0) - (Number(totalPaid) || 0);
          setTotalPaidAmount(totalPaid);
          setRemainingLoan(remainLoan);
        }
      } catch (error) {
        setTotalPaidAmount("0");
         console.log(error,"response date")
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await blePrinter.scanAndConnect(() => {
        setIsConnected(true);
        Alert.alert("Success", "Connected to printer.");
      });
    } catch (error) {
      console.error("Bluetooth Connection Error:", error);
      Alert.alert(
        "Connection Error",
        "Failed to connect to Bluetooth printer. Ensure it's paired and on."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const centerText = (text, lineWidth = 40) => {
    const totalPadding = lineWidth - text.length;
    const paddingStart = Math.floor(totalPadding / 2);
    return " ".repeat(paddingStart) + text;
  };

  const handlePrint = async () => {
    if (!isConnected) {
      Alert.alert("Error", "Please connect to the Bluetooth printer first.");
      return;
    }

    setIsPrinting(true);

    const receiptType = isLoanPayment ? "LOAN RECEIPT" : "RECEIPT";
    const groupOrLoan = isLoanPayment
      ? `Loan ID: ${custom_loan_id}`
      : `Group: ${group_name}\nTicket: ${ticket_no}`;

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

Loan Amount: ${loanAmount || "N/A"}
Receipt No: ${receipt_no || "N/A"}
Date: ${formatDate(pay_date)}

Name: ${customer_name || "N/A"}
Mobile No: ${phone_number || "N/A"}

${groupOrLoan}
================================
|   Received Amount: Rs.${amount || "0"}   |
================================
Mode: ${pay_type || "N/A"}
${txnLine}Remaining Loan: Rs.${remainingLoan || "0"}
${txnLine}Total: Rs.${totalPaidAmount || "0"}
--------------------------------
Collected by: ${agent_name || "N/A"}
\n\n\n
`;

    try {
      await blePrinter.printText(receiptText);
    } catch (error) {
      console.error("Thermal Print Error:", error);
      Alert.alert("Print Error", "Failed to print receipt via Bluetooth.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePosPrint = async () => {
    await printHtmlReceipt(58);
  };

  const handlePos80MMPrint = async () => {
    await printHtmlReceipt(80);
  };

  const printHtmlReceipt = async (widthMM) => {
    setIsPrinting(true);

    const groupOrLoanHtml = isLoanPayment
      ? `<p style="margin: 0; font-weight: bold;">Loan ID: ${
          custom_loan_id || "N/A"
        }</p>`
      : `<p style="margin: 0; font-weight: bold;">Group: ${group_name}</p><p style="margin: 0; font-weight: bold;">Ticket: ${ticket_no}</p>`;

    const txnLine =
      pay_type?.toLowerCase() === "online" && transaction_id
        ? `<p style="margin: 5px 0;">Transaction ID: ${transaction_id}</p>`
        : "";

    const htmlContent = `
      <html>
      <head>
        <style>
          @page {
            size: ${widthMM}mm auto;
            margin: 0 0 0 0;
          }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: ${widthMM > 60 ? "14px" : "10px"};
            margin: 0;
            padding: 0;
            width: ${widthMM}mm;
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
          p { margin: 0; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h3 style="margin-bottom: 5px;">MY CHITS</h3>
          </div>
          <div style="text-align: center; font-size: ${
            widthMM > 60 ? "9px" : "8px"
          };">
            <p>No.11/36-25, 2nd Main,</p>
            <p>Kathriguppe Main Road,</p>
            <p>Bangalore, 560085 | 9483900777</p>
          </div>
          <div class="line"></div>
          <p style="text-align:center; font-weight:bold; font-size: 1.1em; margin-bottom: 5px;">
            ${isLoanPayment ? "LOAN RECEIPT" : "RECEIPT"}
          </p>
          <p>
           <span style="font-weight: bold;">Loan Amount:</span> ${
              loanAmount || "N/A"
            } <br/>
            <span style="font-weight: bold;">Receipt No:</span> ${
              receipt_no || "N/A"
            } <br/>
            <span style="font-weight: bold;">Date:</span> ${formatDate(
              pay_date
            )}
          </p>
          <div class="line" style="margin: 5px 0;"></div>
          <p>
            <span style="font-weight: bold;">Name:</span> ${
              customer_name || "N/A"
            } <br/>
            <span style="font-weight: bold;">Mobile No:</span> ${
              phone_number || "N/A"
            }
          </p>
          <div class="line" style="margin: 5px 0;"></div>
          
          ${groupOrLoanHtml}
          
          <div class="line" style="margin: 5px 0;"></div>
          <table style="border-collapse: collapse; width: 100%; border: 1px solid #000; margin: 5px 0; font-size: 1.2em;">
            <tr>
              <td style="padding: 5px; font-weight: bold;">Received Amount</td>
              <td style="padding: 5px; text-align: right; font-weight: bold;">Rs.${
                amount || "0"
              }</td>
            </tr>
          </table>
          <p>
            <span style="font-weight: bold;">Mode:</span> ${
              pay_type || "N/A"
            }</br>
            ${txnLine}
            <span style="font-weight: bold;">Remaining Loan:</span> ${
              remainingLoan || "N/A"
            }</br>
            <span style="font-weight: bold;">Total:</span> Rs.${
              totalPaidAmount || "0"
            }
          </p>
          <div class="line"></div>
          <p><span style="font-weight: bold;">Collected By:</span> ${
            agent_name || "N/A"
          }</p>
          <p style="margin-top: 10px; text-align: center; font-size: 0.9em;">*** Thank You ***</p>
        </div>
      </body>
      </html>
    `;

    try {
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      console.error(`POS Print (${widthMM}MM) Error:`, error);
      Alert.alert(
        "Print Error",
        `Failed to print the document via OS print dialog. (Width: ${widthMM}MM)`
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const groupOrLoanDisplay = isLoanPayment
    ? `Loan ID: ${custom_loan_id || "N/A"}`
    : `Group: ${group_name || "N/A"} | Ticket: ${ticket_no || "N/A"} `;

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
            padding: 15,
            backgroundColor: "#f0eeee",
            borderRadius: 8,
            marginTop: 10,
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
          <Text
            style={[styles.textStyle, { textAlign: "center", marginBottom: 5 }]}
          >
            Bangalore, 560085 9483900777
          </Text>

          <View style={styles.separator} />

          <Text
            style={{
              fontWeight: "bold",
              fontSize: 14,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {isLoanPayment ? "LOAN RECEIPT" : "RECEIPT"}
          </Text>

          <View style={{ marginBottom: 5 }}>

             <Text style={styles.textStyle}>
              <Text style={{ fontWeight: "bold" }}>Loan Amount:</Text>{" "}
              {loanAmount || "N/A"}
            </Text>
            <Text style={styles.textStyle}>
              <Text style={{ fontWeight: "bold" }}>Receipt No:</Text>{" "}
              {receipt_no || "N/A"}
            </Text>
            <Text style={styles.textStyle}>
              <Text style={{ fontWeight: "bold" }}>Date:</Text>{" "}
              {formatDate(pay_date || "")}
            </Text>
          </View>

          <View style={{ marginBottom: 5 }}>
            <Text style={styles.textStyle}>
              <Text style={{ fontWeight: "bold" }}>Name:</Text>{" "}
              {customer_name || "N/A"}
            </Text>
            <Text style={styles.textStyle}>
              <Text style={{ fontWeight: "bold" }}>Mobile No:</Text>{" "}
              {phone_number || "N/A"}
            </Text>
          </View>

          <Text
            style={[
              styles.textStyle,
              { fontSize: 14, fontWeight: "bold", marginBottom: 5 },
            ]}
          >
            {groupOrLoanDisplay}
          </Text>

          <View style={styles.amountBox}>
            <Text style={styles.amountText}>
              Received Amount | Rs.{amount || "0"}
            </Text>
          </View>

          <View style={{ marginTop: 5 }}>
            <Text style={styles.textStyle}>
              <Text style={{ fontWeight: "bold" }}>Mode:</Text>{" "}
              {pay_type || "N/A"}
            </Text>
            {pay_type?.toLowerCase() === "online" && transaction_id ? (
              <Text style={styles.textStyle}>
                <Text style={{ fontWeight: "bold" }}>Transaction ID:</Text>{" "}
                {transaction_id}
              </Text>
            ) : null}
            <Text
              style={[styles.textStyle, { fontWeight: "bold", marginTop: 2 }]}
            >
              Remaining Loan: Rs.{remainingLoan || "0"}
            </Text>
            <Text
              style={[styles.textStyle, { fontWeight: "bold", marginTop: 2 }]}
            >
              Total: Rs.{totalPaidAmount || "0"}
            </Text>
          </View>

          <View style={styles.separator} />

          <Text style={styles.textStyle}>
            <Text style={{ fontWeight: "bold" }}>Collected by:</Text>{" "}
            {agent_name || "N/A"}
          </Text>
        </View>

        {isPrinting && (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 12 }}
          />
        )}

        <View style={styles.buttonRow}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  textStyle: {
    fontSize: 13,
  },
  separator: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "#000",
    marginVertical: 10,
  },
  amountBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  printButtonOne: {
    backgroundColor: COLORS.third,
    padding: 20,
  },
  printButtonTwo: {
    backgroundColor: COLORS.third,
    padding: 20,
  },
  posBiggerButton: {
    flex: 1,
    backgroundColor: COLORS.third,
  },
});

export default LoanPrint;
