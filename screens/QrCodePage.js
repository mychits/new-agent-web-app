import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";

const QrCodePage = () => {
  const qrCodeImage = require("../assets/kotak_bank_qr.jpeg");

  return (
    <LinearGradient
      colors={["#dbf6faff", "#90dafcff"]}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.contentContainer}>
        <View style={{ marginTop: 30, marginLeft: 10 }}>
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
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  container: {
    flex: 1,
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
    backgroundColor: "#E0DEDD",
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