// import React, { useState, useEffect } from "react";
// import { View, Text, Alert, StyleSheet } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import COLORS from "../constants/color";
// import Header from "../components/Header";
// import blePrinter from '../components/BluetoothPrinter';
// import Button from "../components/Button";
// import RNPrint from 'react-native-print';


// import { BackHandler } from 'react-native';
// import { useNavigation } from '@react-navigation/native';

// const PigmePrint = ({ route }) => {
//   const navigation = useNavigation();
//  const {
//     customer_name,
//     phone_number,
//     agent_name,
//     total_amount,
//     pay_date,
//     amount,
//     pay_type,
//     transaction_id,
//     custom_pigme_id,
//     receipt_no,
//     isPigmePayment,
//     pigme_id,
//   } = route.params;
//   const [isConnected, setIsConnected] = useState(false);
//   const [isConnecting, setIsConnecting] = useState(false);

//   const [payInfo, setPayInfo] = useState({})



//   const handleConnect = async () => {
//     setIsConnecting(true);
//     try {
//       await blePrinter.scanAndConnect(() => {
//         setIsConnected(true);
//       });
//     } catch (error) {
//       Alert.alert("Connection Error", "Failed to connect to Bluetooth printer.");
//     } finally {
//       setIsConnecting(false);
//     }
//   };

//   const handlePrint = () => {
//     if (!isConnected) {
//       Alert.alert("Error", "Please connect to the Bluetooth printer first.");
//       return;
//     }

//     const centerText = (text, lineWidth = 40) => {
//       const totalPadding = lineWidth - text.length;
//       const paddingStart = Math.floor(totalPadding / 3);
//       return " ".repeat(paddingStart) + text;
//     };

//     const receiptType = isPigmePayment ? "Pigme Receipt" : "Receipt";
//     const groupOrPigme = isPigmePayment
//   ? `Pigme ID: ${custom_pigme_id || "N/A"}`
//   : `Group: N/A`;

//     const receiptText = `
// ${centerText("MY CHITS")}
// ${centerText("No.11/36-25,2nd Main,")}
// ${centerText("Kathriguppe Main Road,")}
// ${centerText("Bangalore, 560085 9483900777")}
// --------------------------------
// ${centerText(receiptType)}

// Receipt No: ${receipt_no}
// Date: ${formatDate(pay_date)}

// Name: ${customer_name}
// Mobile No: ${phone_number}

// ${groupOrPigme}
// ==============================
// |   Received Amount: Rs.${amount}  |
// ==============================
// Mode: ${pay_type}
// Total: Rs.${total_amount || 0}
// --------------------------------
// Collected by: ${agent_name}
// `;

//     blePrinter.printText(receiptText);
//   };

//   const handlePosPrint = async () => {
//     const groupOrPigmeHtml = isPigmePayment
//   ? `<p style="margin: 0;">Pigme ID: ${custom_pigme_id || "N/A"}</p>`
//   : `<p style="margin: 0;">Group: N/A</p>`;

//     const htmlContent = `
//       <html>
//       <head>
//         <style>
//           @page {
//             size: 58mm auto;
//             margin: 0 0 0 4mm;
//           }
//           body {
//             font-family: Arial, sans-serif;
//             font-size: 14px;
//             margin: 0;
//             padding: 0;
//             width: 58mm;
//           }
//           .receipt {
//             padding: 5mm;
//           }
//           .header, .footer {
//             text-align: center;
//           }
//           .line {
//             border-top: 1px dashed #000;
//             margin: 2mm 0;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="receipt">
//           <div class="header">
//             <h3 align="center">MY CHITS</h3>
//           </div>
//           <div>
//             <p align="center">No.11/36-25, 2nd Main,</br>
//             Kathriguppe Main Road,</br>
//             Bangalore, 560085
//             9483900777</p>
//           </div>
//           <div class="line"></div>
//           <p align="center" style="font-weight:bold">${
//             isPigmePayment ? "Pigme Receipt" : "Receipt"
//           }</p>
//           <p>
//           Receipt No: ${receipt_no} <br/>
//           Date: ${formatDate(pay_date)}
//           </p>
//           <p>
//           Name: ${customer_name} <br/>
//           Mobile No: ${phone_number}
//           </p>
//           <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 10px;">
//             ${groupOrPigmeHtml}
//           </div>
//           <table style="border-collapse: collapse; width: 100%;" border="1">
//             <tr>
//               <td style="padding: 5px; font-size:14px">Received Amount</td>
//               <td style="padding: 5px; font-size:14px">Rs.${
//                 amount
//               }</td>
//             </tr>
//           </table>
//           <p>Mode: ${pay_type}</br>
//           Total: Rs.${total_amount || 0}</p>
//           <div class="line"></div>
//           <p>Collected By: ${agent_name}</p>
//         </div>
//       </body>
//       </html>
//     `;

//     try {
//       await RNPrint.print({ html: htmlContent });
//     } catch (error) {
//       Alert.alert("Print Error", "Failed to print the document.");
//     }
//   };

//   useEffect(() => {
//     const backAction = () => {
//       navigation.navigate('RouteCustomerPigme');
//       return true;
//     };

//     const backHandler = BackHandler.addEventListener(
//       'hardwareBackPress',
//       backAction
//     );

//     return () => backHandler.remove();
//   }, []);

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     const options = { day: '2-digit', month: 'short', year: 'numeric' };
//     return date.toLocaleDateString('en-US', options);
//   };

//    const groupOrPigmeDisplay = isPigmePayment
//   ? `Pigme ID: ${custom_pigme_id || "N/A"}`
//   : `Group: N/A`;

//    return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
//       <View style={{ marginHorizontal: 22, marginTop: 12 }}>
//         <Header />

//         <Button
//           title={
//             isConnecting
//               ? "Connecting..."
//               : isConnected
//               ? "Connected"
//               : "Connect to Printer"
//           }
//           filled
//           style={{ marginTop: 18, marginBottom: 4 }}
//           onPress={handleConnect}
//           disabled={isConnecting || isConnected}
//         />

//         <View
//           style={{
//             padding: 8,
//             backgroundColor: "#f0eeee",
//             borderRadius: 8,
//             marginTop: 5,
//           }}
//         >
//           <Text
//             style={{
//               fontWeight: "bold",
//               marginBottom: 0,
//               fontSize: 18,
//               textAlign: "center",
//             }}
//           >
//             MY CHITS
//           </Text>
//           <Text
//             style={[styles.textStyle, { textAlign: "center", marginTop: 3 }]}
//           >
//             No.11/36-25, 2nd Main,
//           </Text>
//           <Text style={[styles.textStyle, { textAlign: "center" }]}>
//             Kathriguppe Main Road,
//           </Text>
//           <Text style={[styles.textStyle, { textAlign: "center" }]}>
//             Bangalore, 560085 9483900777
//           </Text>

//           <View
//             style={{
//               borderBottomWidth: 1,
//               borderColor: "#000",
//               marginVertical: 5,
//             }}
//           />

//           <Text
//             style={{
//               fontWeight: "bold",
//               marginBottom: 0,
//               fontSize: 13,
//               textAlign: "center",
//               marginBottom: 10,
//             }}
//           >
//             {isPigmePayment ? "Pigme Receipt" : "Receipt"}
//           </Text>

//           <View
//             style={{ flexDirection: "row", justifyContent: "space-between" }}
//           >
//             <View>
//               <Text style={styles.textStyle}>
//                 Receipt No: {receipt_no || ""}
//               </Text>
//               <Text style={styles.textStyle}>
//                 Date: {formatDate(pay_date || "")}
//               </Text>
//             </View>
//           </View>

//           <Text style={styles.textStyle}> </Text>

//           <View
//             style={{ flexDirection: "row", justifyContent: "space-between" }}
//           >
//             <View>
//               <Text style={styles.textStyle}>
//                 Name: {customer_name || ""}
//               </Text>
//               <Text style={styles.textStyle}>
//                 Mobile No: {phone_number || ""}
//               </Text>
//             </View>
//           </View>

//           <Text style={styles.textStyle}> </Text>

//           <Text
//             style={[styles.textStyle, { fontSize: 14, fontWeight: "bold" }]}
//           >
//             {groupOrPigmeDisplay}
//           </Text>

//           <Text style={styles.textStyle}> </Text>

//           <View
//             style={{ flexDirection: "row", justifyContent: "space-between" }}
//           >
//             <Text
//               style={[
//                 styles.textStyle,
//                 {
//                   fontSize: 16,
//                   fontWeight: "bold",
//                   borderWidth: 1,
//                   padding: 5,
//                 },
//               ]}
//             >
//               Received Amount | Rs.{amount || ""}
//             </Text>
//           </View>

//           <Text style={styles.textStyle}> </Text>
//           <Text style={styles.textStyle}>
//             Mode:{" "}
//             {pay_type?pay_type
//               : ""}
//           </Text>
//           <Text style={styles.textStyle}>Total: Rs.{total_amount}</Text>

//           <View
//             style={{
//               borderBottomWidth: 1,
//               borderColor: "#000",
//               marginVertical: 5,
//             }}
//           />

//           <Text style={styles.textStyle}>Collected by: {agent_name}</Text>
//           <Text style={styles.textStyle}> </Text>
//         </View>

//         <View
//           style={{
//             flexDirection: "row",
//             justifyContent: "space-between",
//             marginTop: 18,
//           }}
//         >
//           <Button
//             title="Thermal Print"
//             filled
//             style={{ flex: 1, marginRight: 8, backgroundColor: COLORS.third }}
//             onPress={handlePrint}
//             disabled={!isConnected}
//           />
//           <Button
//             title="POS Print"
//             filled
//             style={{ flex: 1, marginLeft: 8, backgroundColor: COLORS.third }}
//             onPress={() => handlePosPrint()}
//             disabled={!isConnected}
//           />
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   textStyle: {
//     fontSize: 13
//   }
// });

// export default PigmePrint;




import React, { useState, useEffect } from "react";
import { View, Text, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/color";
import Header from "../components/Header";
import blePrinter from "../components/BluetoothPrinter";
import Button from "../components/Button";
import RNPrint from "react-native-print";
import { BackHandler } from "react-native";
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
      ? `Pigme ID: ${custom_pigme_id || "N/A"}`
      : `Group: N/A`;

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
${pay_type?.toLowerCase() === "online" ? `Transaction ID: ${transaction_id || "N/A"}` : ""}
Total: Rs.${total_amount || 0}
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
    if (!isConnected) {
      Alert.alert("Error", "Please connect to the Bluetooth printer first.");
      return;
    }

    setIsPrinting(true);

    const groupOrPigmeHtml = isPigmePayment
      ? `<p style="margin: 0;">Pigme ID: ${custom_pigme_id || "N/A"}</p>`
      : `<p style="margin: 0;">Group: N/A</p>`;

    const transactionHtml =
      pay_type?.toLowerCase() === "online"
        ? `<p>Transaction ID: ${transaction_id || "N/A"}</p>`
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
          ${groupOrPigmeHtml}
          <table style="border-collapse: collapse; width: 100%;" border="1">
            <tr>
              <td style="padding: 5px; font-size:14px">Received Amount</td>
              <td style="padding: 5px; font-size:14px">Rs.${amount}</td>
            </tr>
          </table>
          <p>Mode: ${pay_type}</br>
          ${transactionHtml}
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
      navigation.navigate("RouteCustomerPigme");
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

  const groupOrPigmeDisplay = isPigmePayment
    ? `Pigme ID: ${custom_pigme_id || "N/A"}`
    : `Group: N/A`;

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
          <ActivityIndicator size="large" color={COLORS.primary} />
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
            {isPigmePayment ? "Pigme Receipt" : "Receipt"}
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

          <Text style={[styles.textStyle, { fontSize: 14, fontWeight: "bold" }]}>
            {groupOrPigmeDisplay}
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
          <Text style={styles.textStyle}>
            Mode: {pay_type ? pay_type : ""}
          </Text>

          {pay_type?.toLowerCase() === "online" && (
            <Text style={styles.textStyle}>
              Transaction ID: {transaction_id || "N/A"}
            </Text>
          )}

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
            color={COLORS.secondary}
            style={{ marginTop: 10 }}
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
            onPress={handlePosPrint}
            disabled={!isConnected || isPrinting}
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
