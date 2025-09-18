import React, { useState, useEffect } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import Header from "../components/Header";
import blePrinter from "../components/BluetoothPrinter";
import Button from "../components/Button";
import RNPrint from "react-native-print";
import axios from "axios";
import baseUrl from "../constants/baseUrl";

import { BackHandler } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Print = ({ route }) => {
  const navigation = useNavigation();
  const { user, store_id } = route.params;
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [payInfo, setPayInfo] = useState({});
  const [agent, setAgent] = useState({});
  const [totalAmount, setTotalAmount] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/payment/get-payment-by-id/${store_id}`
        );
        setPayInfo(response.data);
      } catch (error) {
        x;
        console.error("Error fetching customer data:", error);
      }
    };

    fetchDetails();
  }, [store_id]);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/agent/get-agent-by-id/${user.userId}`
        );
        setAgent(response.data);
      } catch (error) {
        x;
        console.error("Error fetching customer data:", error);
      }
    };

    fetchAgent();
  }, [user.userId]);

  useEffect(() => {
    const fetchAmount = async () => {
      try {
        const response = await axios.post(
          `${baseUrl}/payment/get-total-amount`,
          {
            user_id: payInfo?.user_id?._id,
            group_id: payInfo?.group_id?._id,
            ticket: payInfo?.ticket,
          }
        );
        setTotalAmount(response.data.totalAmount);
      } catch (err) {
        console.error("Error fetching total amount:", err);
        setError("Failed to fetch the total amount.");
      }
    };
    fetchAmount();
  }, [payInfo?.user_id?._id, payInfo?.group_id?._id, payInfo?.ticket]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await blePrinter.scanAndConnect(() => {
        setIsConnected(true);
      });
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Failed to connect to Bluetooth printer."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrint = () => {
    if (!isConnected) {
      Alert.alert("Error", "Please connect to the Bluetooth printer first.");
      return;
    }

    const centerText = (text, lineWidth = 40) => {
      const totalPadding = lineWidth - text.length;
      const paddingStart = Math.floor(totalPadding / 3);
      return " ".repeat(paddingStart) + text;
    };

    const receiptText = `
${centerText("MY CHITS")}
${centerText("No.11/36-25,2nd Main,")}
${centerText("Kathriguppe Main Road,")}
${centerText("Bangalore, 560085 9483900777")}
--------------------------------
${centerText("Receipt")}

Receipt No: ${payInfo?.receipt_no}
Date: ${formatDate(payInfo?.pay_date)}

Name: ${payInfo?.user_id?.full_name}
Mobile No: ${payInfo?.user_id?.phone_number}

Group:${payInfo?.group_id?.group_name}    Ticket:${payInfo?.ticket}
==============================
|  Received Amount: Rs.${payInfo?.amount}  |
==============================
Mode: ${payInfo?.pay_type}
Total: Rs.${totalAmount || 0}
--------------------------------
Collected by: ${agent.name}
`;

    blePrinter.printText(receiptText);
  };

  const handlePosPrint = async () => {
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
          <p align="center" style="font-weight:bold">Receipt</p>
          <p>
          Receipt No: ${payInfo?.receipt_no} <br/>
          Date: ${formatDate(payInfo?.pay_date)}
          </p>
          <p>
          Name: ${payInfo?.user_id?.full_name} <br/>
          Mobile No: ${payInfo?.user_id?.phone_number}
          </p>
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <p style="margin: 0;">Group: ${
              payInfo?.group_id?.group_name || "N/A"
            }</p>
            <p style="margin: 0;">Ticket: ${payInfo?.ticket || "N/A"}</p>
          </div>
          <table style="border-collapse: collapse; width: 100%;" border="1">
            <tr>
              <td style="padding: 5px; font-size:14px">Received Amount</td>
              <td style="padding: 5px; font-size:14px">Rs.${
                payInfo?.amount
              }</td>
            </tr>
          </table>
          <p>Mode: ${payInfo?.pay_type}</br>
          Total: Rs.${totalAmount || 0}</p>
          <div class="line"></div>
          <p>Collected By: ${agent.name}</p>
        </div>
      </body>
      </html>
    `;

    try {
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Failed to print the document.");
    }
  };
  const handlePos80MMPrint = async () => {
    const htmlContent = `
  <html>
<head>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      margin: 0;
      padding: 0;
      width: 80mm;
    }
    .receipt {
      padding: 3mm 2mm;
      line-height: 1.3;
    }
    .header, .footer {
      text-align: center;
      margin-bottom: 2mm;
    }
    .line {
      border-top: 1px dashed #000;
      margin: 2mm 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 2mm 0;
    }
    td {
      padding: 2px 4px;
      font-size: 11px;
    }
    p {
      margin: 1px 0;
    }
    .flex-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 1px 0;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <strong>MY CHITS</strong><br/>
      No.11/36-25, 2nd Main,<br/>
      Kathriguppe Main Road,<br/>
      Bangalore, 560085<br/>
      9483900777
    </div>

    <div class="line"></div>

    <p align="center"><strong>RECEIPT</strong></p>

    <p><strong>Receipt No:</strong> ${payInfo?.receipt_no}</p>
    <p><strong>Date:</strong> ${formatDate(payInfo?.pay_date)}</p>

    <p><strong>Name:</strong> ${payInfo?.user_id?.full_name}</p>
    <p><strong>Mobile:</strong> ${payInfo?.user_id?.phone_number}</p>

    <div class="flex-row">
      <span><strong>Group:</strong> ${
        payInfo?.group_id?.group_name || "N/A"
      }</span>
      <span><strong>Ticket:</strong> ${payInfo?.ticket || "N/A"}</span>
    </div>

    <table>
      <tr>
        <td>Received Amount</td>
        <td style="text-align: right;">Rs. ${payInfo?.amount}</td>
      </tr>
    </table>

    <p><strong>Mode:</strong> ${payInfo?.pay_type}</p>
    <p><strong>Total:</strong> Rs. ${totalAmount || 0}</p>

    <div class="line"></div>

    <p><strong>Collected By:</strong> ${agent.name}</p>
  </div>
</body>
</html>
  `;

    try {
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Failed to print the document.");
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
              marginBottom: 0,
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
              marginBottom: 0,
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
                Receipt No: {payInfo?.receipt_no || ""}
              </Text>
              <Text style={styles.textStyle}>
                Date: {formatDate(payInfo?.pay_date || "")}
              </Text>
            </View>
          </View>

          <Text style={styles.textStyle}> </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={styles.textStyle}>
                Name: {payInfo?.user_id?.full_name || ""}
              </Text>
              <Text style={styles.textStyle}>
                Mobile No: {payInfo?.user_id?.phone_number || ""}
              </Text>
            </View>
          </View>

          <Text style={styles.textStyle}> </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={[styles.textStyle, { fontSize: 14, fontWeight: "bold" }]}
            >
              Group: {payInfo?.group_id?.group_name || ""}
            </Text>
            <Text
              style={[styles.textStyle, { fontSize: 14, fontWeight: "bold" }]}
            >
              Ticket: {payInfo?.ticket || ""}
            </Text>
          </View>

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
              Received Amount | Rs.{payInfo?.amount || ""}
            </Text>
          </View>

          <Text style={styles.textStyle}> </Text>
          <Text style={styles.textStyle}>
            Mode:{" "}
            {payInfo?.pay_type
              ? payInfo.pay_type.charAt(0).toUpperCase() +
                payInfo.pay_type.slice(1)
              : ""}
          </Text>
          <Text style={styles.textStyle}>Total: Rs.{totalAmount}</Text>

          <View
            style={{
              borderBottomWidth: 1,
              borderColor: "#000",
              marginVertical: 5,
            }}
          />

          <Text style={styles.textStyle}>Collected by: {agent.name}</Text>
          <Text style={styles.textStyle}> </Text>
        </View>

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
            disabled={!isConnected}
          />
          <Button
            title="POS Print"
            filled
            style={{ flex: 1, marginLeft: 8, backgroundColor: COLORS.third }}
            onPress={() => handlePosPrint()}
            disabled={false}
          />
          
        </View>
         <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 18,
          }}
        >
          <Button
            title="POS 80MM Print"
            filled
            style={{ flex: 1, marginLeft: 8, backgroundColor: COLORS.third }}
            onPress={() => handlePos80MMPrint()}
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

export default Print;
