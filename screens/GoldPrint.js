import React, { useState, useEffect } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import Header from "../components/Header";
import blePrinter from '../components/BluetoothPrinter';
import Button from "../components/Button";
import RNPrint from 'react-native-print';
import axios from "axios";
import baseUrl from "../constants/baseUrl";

import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const GoldPrint = ({ route }) => {
  const navigation = useNavigation();
  const { user, store_id } = route.params
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [payInfo, setPayInfo] = useState({})

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(
          `http://13.51.87.99:3000/api/payment/get-payment-by-id/${store_id}`
        );
        setPayInfo(response.data)
        console.log(response.data)
        
      } catch (error) {x
        console.error("Error fetching customer data:", error);
      }
    };

    fetchDetails();
  }, [store_id]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await blePrinter.scanAndConnect(() => {
        setIsConnected(true);
      });
    } catch (error) {
      Alert.alert("Connection Error", "Failed to connect to Bluetooth printer.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrint = () => {
    if (!isConnected) {
      Alert.alert("Error", "Please connect to the Bluetooth printer first.");
      return;
    }

    const receiptText = `
Receipt Preview
--------------------------------
Receipt No: ${payInfo?.receipt_no}
Date: ${formatDate(payInfo?.pay_date)}

MY CHIT FUND INDIA PVT LTD
No.11/36-25,2nd Main,Kathriguppe Main Road,
Karnataka, 9483900777

Name: ${payInfo?.user_id?.full_name}
Mobile No: ${payInfo?.user_id?.phone_number}
--------------------------------
Group: ${payInfo?.group_id?.group_name}
Ticket: ${payInfo?.ticket}
Received Amount:${payInfo?.amount}
Paid Till Date:
Payment Mode: ${payInfo?.pay_type}
--------------------------------
*System Generated Bill
No Signature Needed

Thank You
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
            font-size: 12px;
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
            margin: 5mm 0;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>Receipt Preview</h1>
          </div>
          <div class="line"></div>
          <p>Receipt No: ${payInfo?.receipt_no}</p>
          <p>Date: ${formatDate(payInfo?.pay_date)}</p>
          <p>MY CHIT FUND INDIA PVT LTD</p>
          <p>No.11/36-25, 2nd Main, Kathriguppe Main Road, Karnataka, 9483900777</p>
          <p>Name: ${payInfo?.user_id?.full_name}</p>
          <p>Mobile No: ${payInfo?.user_id?.phone_number}</p>
          <div class="line"></div>
          <p>Group: ${payInfo?.group_id?.group_name}</p>
          <p>Ticket: ${payInfo?.ticket}</p>
          <p>Received Amount: ${payInfo?.amount}</p>
          <p>Paid Till Date:</p>
          <p>Payment Mode: ${payInfo?.pay_type}</p>
          <div class="line"></div>
          <p>*System Generated Bill</p>
          <p>No Signature Needed</p>
          <div class="footer">
            <p>Thank You</p>
          </div>
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
      navigation.navigate('RouteCustomerGold');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={{ marginHorizontal: 22, marginTop: 12 }}>
        <Header />

        <Button
          title={isConnecting ? "Connecting..." : isConnected ? "Connected" : "Connect to Printer"}
          filled
          style={{ marginTop: 18, marginBottom: 4 }}
          onPress={handleConnect}
          disabled={isConnecting || isConnected}
        />

        <View style={{ padding: 8, backgroundColor: "#f0eeee", borderRadius: 8, marginTop: 5 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 0, fontSize: 13 }}>Receipt Preview</Text>
          <Text style={styles.textStyle}>--------------------------------</Text>
          <Text style={styles.textStyle}>Receipt No: {payInfo?.receipt_no}</Text>
          <Text style={styles.textStyle}>Date: {formatDate(payInfo?.pay_date)}</Text>
          <Text style={styles.textStyle}> </Text>
          <Text style={styles.textStyle}>MY CHIT FUND INDIA PVT LTD</Text>
          <Text style={styles.textStyle}>No.11/36-25, 2nd Main, Kathriguppe Main Road,</Text>
          <Text style={styles.textStyle}>Karnataka, 9483900777</Text>
          <Text style={styles.textStyle}> </Text>
          <Text style={styles.textStyle}>Name: {payInfo?.user_id?.full_name}</Text>
          <Text style={styles.textStyle}>Mobile No: {payInfo?.user_id?.phone_number}</Text>
          <Text style={styles.textStyle}>--------------------------------</Text>
          <Text style={styles.textStyle}>Group: {payInfo?.group_id?.group_name}</Text>
          <Text style={styles.textStyle}>Ticket: {payInfo?.ticket}</Text>
          <Text style={styles.textStyle}>Received Amount: {payInfo?.amount}</Text>
          <Text style={styles.textStyle}>Paid Till Date:</Text>
          <Text style={styles.textStyle}>Payment Mode: {payInfo?.pay_type}</Text>
          <Text style={styles.textStyle}>--------------------------------</Text>
          <Text style={styles.textStyle}>*System Generated Bill</Text>
          <Text style={styles.textStyle}>No Signature Needed</Text>
          {/* <Text style={styles.textStyle}>Prepared By: {user.name}</Text> */}
          <Text style={styles.textStyle}> </Text>
          <Text style={styles.textStyle}>Thank You</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  textStyle: {
    fontSize: 13
  }
});

export default GoldPrint;
