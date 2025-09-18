import { View, Text, Image, StyleSheet } from "react-native";
import React from "react";
import  Header from "../components/Header";

const QrCodePage = () => {
  const qrCodeImage = require("../assets/kotak_bank_qr.jpeg");

  return (
    <>
    <View style={{marginTop:50,marginLeft:10}}>

      <Header />
    </View>
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>MyChits Payment QR Code</Text>
        </View>

        <View style={styles.qrContainer}>
          <Image
            source={qrCodeImage}
            style={styles.qrImage}
            resizeMode="contain"
          />
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>UPI ID mychits@kotak</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Scan this QR code to make payments
          </Text>
          <Text style={styles.infoText}>Kotak Bank</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
   
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#053B90",
    textAlign: "center",
  },
  qrContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginVertical: 20,
  },
  qrImage: {
    width: 300,
    height: 300,
  },
  infoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginVertical: 5,
  },
});

export default QrCodePage;
