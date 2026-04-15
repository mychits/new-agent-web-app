import React, { useState, useEffect, useRef } from "react";
import { View, Text, Alert, StyleSheet, ActivityIndicator, BackHandler, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import Header from "../components/Header";
import blePrinter from "../components/BluetoothPrinter";
import Button from "../components/Button";
import * as ExpoPrint from 'expo-print';
import axios from "axios";
import baseUrl from "../constants/baseUrl";
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { FontAwesome5 } from "@expo/vector-icons";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

const centerText = (text, lineWidth = 40) => {
  const totalPadding = lineWidth - text.length;
  const paddingStart = Math.max(0, Math.floor(totalPadding / 2));
  return " ".repeat(paddingStart) + text;
};

const PigmeRePrint = ({ route, navigation }) => {
  const { 
    customer_name, 
    phone_number, 
    agent_name, 
    cus_id, 
    actual_pigme_id, 
    pigme_amount, 
    pay_date, 
    amount, 
    pay_type, 
    transaction_id, 
    custom_pigme_id, 
    receipt_no, 
    isPigmePayment, 
    user 
  } = route.params;

  const [totalPaidAmount, setTotalPaidAmount] = useState("0");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(true);
  const viewRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/payment/user/${cus_id}/pigme/${actual_pigme_id}/summary`);
        if (response.data && Array.isArray(response.data) && response.data.length > 0) { 
          setTotalPaidAmount(response.data[0].totalPaidAmount || "0"); 
        } else {
            setTotalPaidAmount("0");
        }
      } catch (error) { 
        console.error("Error fetching summary", error);
        setTotalPaidAmount("0"); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, [cus_id, actual_pigme_id]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try { 
      await blePrinter.scanAndConnect(() => { 
        setIsConnected(true); 
        setIsConnecting(false); 
        Alert.alert("Success", "Connected!"); 
      }); 
    }
    catch (error) { 
      setIsConnecting(false); 
      Alert.alert("Error", "Failed to connect to printer."); 
    }
  };

  // CRASH FIX: Renamed function to match the onPress call
  const handleWhatsAppShare = async () => {
    try {
      const uri = await captureRef(viewRef, { format: "png", quality: 0.9 });
      if (!(await Sharing.isAvailableAsync())) { 
        Alert.alert("Error", "Sharing is not available on this device"); 
        return; 
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Receipt' });
    } catch (error) { 
      console.error(error);
      Alert.alert("Error", "Failed to share receipt."); 
    }
  };

  const handlePrint = async () => {
    if (!isConnected) { Alert.alert("Error", "Please connect to printer first."); return; }
    setIsPrinting(true);
    const receiptText = `
 ${centerText("MY CHITS")}
 ${centerText("No.11/36-25,2nd Main,")}
 ${centerText("Kathriguppe Main Road,")}
 ${centerText("Bangalore, 560085 9483900777")}
--------------------------------
 ${centerText(isPigmePayment ? "Pigmy Receipt" : "Receipt")}
Receipt No: ${receipt_no || "N/A"}
Date: ${formatDate(pay_date)}
Name: ${customer_name || "N/A"}
Mobile No: ${phone_number || "N/A"}
 ${isPigmePayment ? `Pigmy ID: ${custom_pigme_id || "N/A"}` : `Group: 000 Error 000`}
==============================
| Received Amount: Rs.${amount || 0} |
==============================
Mode: ${pay_type || "N/A"}
 ${pay_type?.toLowerCase() === "online" && transaction_id ? `Transaction ID: ${transaction_id}\n` : ""}
Total: Rs.${totalPaidAmount || 0}
--------------------------------
Collected by: ${agent_name || "N/A"}
\n\n\n`;
    try { await blePrinter.printText(receiptText); } catch (e) { Alert.alert("Error", "Printing failed."); } finally { setIsPrinting(false); }
  };

  const generatePosReceiptHtml = (size) => {
    const isDuplicate = size === "58mm";
    const groupOrPigmeHtml = isPigmePayment 
      ? `<p style="margin: 0; font-weight: bold;">Pigmy ID: ${custom_pigme_id || "N/A"}</p>` 
      : `<p style="margin: 0; font-weight: bold;">Group: Loan</p><p style="margin: 0; font-weight: bold;">Ticket: Loan</p>`;
    const txnLine = pay_type?.toLowerCase() === "online" && transaction_id ? `<p style="margin-top: 5px ;">Transaction ID: ${transaction_id}</p>` : "";
    return `<html><head><style>@page { size: ${size} auto; margin: 0 0 0 4mm; } body { font-family: Arial, sans-serif; font-size: 14px; margin: 0; padding: 0; width: ${size}; } .receipt { padding: 5mm; } .header, .footer { text-align: center; } .line { border-top: 1px dashed #000; margin: 5px 0; } .amount-table { border-collapse: collapse; width: 100%; margin: 10px 0; } .amount-table td { padding: 5px; font-size: 14px; border: 1px solid #000; } .amount-table tr:first-child td { font-weight: bold; }</style></head><body><div class="receipt"><div class="header"><h3 style="margin-bottom: 5px;">MY CHITS</h3></div><div style="text-align: center; font-size: 12px;"><p style="margin: 0;">No.11/36-25, 2nd Main,</p><p style="margin: 0;">Kathriguppe Main Road,</p><p style="margin: 0;">Bangalore, 560085 | 9483900777</p></div><div class="line"></div><p style="text-align: center; font-weight:bold; margin-top: 0; margin-bottom: 10px;">${isPigmePayment ? "Pigmy Receipt" : "Receipt"}</p><p style="margin: 0;"><br/><span style="font-weight: bold;">Date:</span> ${formatDate(pay_date)}</p><p style="margin: 0;"><span style="font-weight: bold;">Receipt No:</span> ${receipt_no || "N/A"} <br/></p><p style="margin: 10px 0 0 0;"><span style="font-weight: bold;">Name:</span> ${customer_name || "N/A"} <br/><span style="font-weight: bold;">Mobile No:</span> ${phone_number || "N/A"}</p><div style="margin: 10px 0;">${groupOrPigmeHtml}</div><table class="amount-table"><tr><td>Received Amount</td><td style="text-align: right;">Rs.${amount || 0}</td></tr></table><p style="margin-top: 10px; margin-bottom: 5px;"><span style="font-weight: bold;">Mode:</span> ${pay_type || "N/A"}</p>${txnLine}<p style="margin-top: 5px; margin-bottom: 10px; font-weight: bold;">Total: Rs.${totalPaidAmount || 0}</p><div class="line"></div><p style="text-align: center; margin-bottom: 0;"><span style="font-weight: bold;">Collected By:</span> ${agent_name || "N/A"}</p><p style="text-align: center; font-size: 10px; margin-top: 10px;">*** Thank You ***</p>${isDuplicate ? `<p style="margin-top: 5px; text-align: center; font-weight:bold; font-size: 11px;">duplicate copy</p>` : ""}<p style="height: 100px;">&nbsp;</p></div></body></html>`;
  };

  const handlePosPrint = async () => { 
    setIsPrinting(true); 
    const html = generatePosReceiptHtml("58mm"); 
    try { await ExpoPrint.printAsync({ html }); } catch (e) { Alert.alert("Error", "Printing failed."); } finally { setIsPrinting(false); } 
  };

  const handlePos80MMPrint = async () => { 
    setIsPrinting(true); 
    const html = generatePosReceiptHtml("80mm"); 
    try { await ExpoPrint.printAsync({ html }); } catch (e) { Alert.alert("Error", "Printing failed."); } finally { setIsPrinting(false); } 
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
        <View style={{ marginHorizontal: 22, marginTop: 12, flex: 1 }}>
          <Header />
          <View style={styles.topActionRow}>
            <Button 
                title={isConnecting ? "Connecting..." : isConnected ? "Connected" : "Connect to Printer"} 
                filled 
                style={styles.connectButton} 
                onPress={handleConnect} 
                disabled={isConnecting || isConnected} 
            />
            <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppShare}>
              <FontAwesome5 name="whatsapp" size={20} color="#fff" />
              <Text style={styles.btnText}> Share</Text>
            </TouchableOpacity>
          </View>
          {isConnecting && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 8 }} />}
          
          <View ref={viewRef} collapsable={false} style={{ padding: 12, backgroundColor: "#f0eeee", borderRadius: 8, marginTop: 5, flexGrow: 1 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, textAlign: "center" }}>MY CHITS</Text>
            <Text style={[styles.textStyle, { textAlign: "center", marginTop: 3 }]}>No.11/36-25, 2nd Main,</Text>
            <Text style={[styles.textStyle, { textAlign: "center" }]}>Kathriguppe Main Road,</Text>
            <Text style={[styles.textStyle, { textAlign: "center" }]}>Bangalore, 560085 9483900777</Text>
            <View style={styles.separator} />
            <Text style={{ fontWeight: "bold", fontSize: 13, textAlign: "center", marginBottom: 10 }}>
              {isPigmePayment ? "Pigmy Receipt" : "Receipt"}
            </Text>
            <Text style={styles.textStyle}><Text style={{ fontWeight: "bold" }}>Receipt No:</Text> {receipt_no || "N/A"}</Text>
            <Text style={styles.textStyle}><Text style={{ fontWeight: "bold" }}>Date:</Text> {formatDate(pay_date || "")}</Text>
            <Text style={{ ...styles.textStyle, marginVertical: 5 }} />
            <Text style={styles.textStyle}><Text style={{ fontWeight: "bold" }}>Name:</Text> {customer_name || "N/A"}</Text>
            <Text style={styles.textStyle}><Text style={{ fontWeight: "bold" }}>Mobile No:</Text> {phone_number || "N/A"}</Text>
            <Text style={{ ...styles.textStyle, marginVertical: 5 }} />
            <Text style={[styles.textStyle, { fontSize: 14, fontWeight: "bold" }]}>
              {isPigmePayment ? `Pigmy ID: ${custom_pigme_id || "N/A"}` : `Group: 000 Error 000`}
            </Text>
            <View style={{ ...styles.amountBox, marginVertical: 10 }}>
              <Text style={styles.amountText}>Received Amount | Rs.{amount || 0}</Text>
            </View>
            <Text style={styles.textStyle}><Text style={{ fontWeight: "bold" }}>Mode:</Text> {pay_type || "N/A"}</Text>
            {pay_type?.toLowerCase() === "online" && transaction_id ? (
                <Text style={styles.textStyle}><Text style={{ fontWeight: "bold" }}>Transaction ID:</Text> {transaction_id}</Text>
            ) : null}
            <Text style={[styles.textStyle, { fontWeight: "bold" }]}>Total: Rs.{totalPaidAmount || 0}</Text>
            <View style={styles.separator} />
            <Text style={styles.textStyle}><Text style={{ fontWeight: "bold" }}>Collected by:</Text> {agent_name || "N/A"}</Text>
            <Text style={styles.textStyle}> </Text>
          </View>
          
          {isPrinting && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 12 }} />}
          
          <View style={{ marginBottom: 18 }}>
            <View style={[styles.buttonRow, { marginTop: 18 }]}>
              <Button title="Thermal Print" filled style={styles.printButtonOne} onPress={handlePrint} disabled={!isConnected || isPrinting} />
              <Button title="POS Print" filled style={styles.printButtonTwo} onPress={handlePosPrint} disabled={isPrinting} />
            </View>
            <View style={styles.buttonRow}>
              <Button title="POS 80MM Print" filled style={styles.posBiggerButton} onPress={handlePos80MMPrint} disabled={isPrinting} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  textStyle: { fontSize: 13 }, 
  separator: { borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#000", marginVertical: 10 },
  amountBox: { borderWidth: 1, borderColor: "#000", padding: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: 4 },
  amountText: { fontSize: 16, fontWeight: "bold" }, 
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  printButtonOne: { flex: 1, marginRight: 5, backgroundColor: COLORS.third, padding: 15 }, 
  printButtonTwo: { flex: 1, marginLeft: 5, backgroundColor: COLORS.third, padding: 15 }, 
  posBiggerButton: { flex: 1, backgroundColor: COLORS.third },
  topActionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 4 },
  connectButton: { flex: 1, marginRight: 10 },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default PigmeRePrint;