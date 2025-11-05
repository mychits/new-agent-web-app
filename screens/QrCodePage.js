import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";

const QrCodePage = () => {
  const qrCodeImage = require("../assets/kotak_bank_qr.jpeg");

  return (
    <LinearGradient       colors={["#1aa2ccff", "#1aa2ccff"]}
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

          {/* ******** QR Code Container (The middle block) ******** */}
          <View style={styles.qrContainer}>
            {/* UPI ID TEXT (Still above the QR image, inside the box) */}
            <View style={styles.infoContainer_QR}>
              <Text style={styles.infoText}>UPI ID mychits@kotak</Text>
            </View>

            {/* QR CODE IMAGE */}
            <Image
              source={qrCodeImage}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          
          {/* ******** SCAN INSTRUCTIONS TEXT BLOCK - MOVED BELOW THE QR CODE BOX ******** */}
          <View style={styles.infoContainer_Bottom}> 
            <Text style={styles.infoText}>
              Scan this QR code to make payments
            </Text>
            <Text style={styles.infoText}>Kotak Bank</Text>
          </View>
          {/* ******** END MOVED BLOCK ******** */}
          
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
    padding: 13,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#01070fff",
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
    width: 250,
    height: 300,
  },
  
  // ******** UPDATED STYLES ********
  infoContainer_QR: { // For UPI ID text *inside* the QR container
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  infoContainer_Bottom: { // New style for the text block *below* the QR container
    alignItems: "center",
    marginTop: 10, // Small space above the text block
    // No large margin here, unlike the original code
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginVertical: 5,
  },
});

export default QrCodePage;