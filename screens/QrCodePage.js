import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";

const QrCodePage = () => {
  const qrCodeImage = require("../assets/kotak_bank_qr.jpeg");

  return (
    <LinearGradient 
      colors={['#b6e4ebff', '#1796d1ff']}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.contentContainer}>
        {/* Header component */}
        <View style={{ marginTop: 30, marginLeft: 10 }}>
          <Header />
        </View>

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>MyChits Payment QR Code</Text>
          </View>

          {/* ******** QR Code Container (The middle block) ******** */}
          <View style={styles.qrContainer}>
            {/* UPI ID TEXT (Inside the box, at the top) */}
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
          
          {/* ******** SCAN INSTRUCTIONS TEXT BLOCK (Below the QR code box) ******** */}
          <View style={styles.infoContainer_Bottom}> 
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
  // *** KEY CHANGE IS HERE ***
  qrContainer: {
    flex: 1,
    // Changed to "flex-start" to align content (UPI ID and QR code)
    // to the top of this container, making it flow top-to-bottom.
    justifyContent: "flex-start", 
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
    // Margin is used to push the image down from the UPI text
    marginBottom: 20, 
    // Ensure the UPI text isn't too close to the top edge of the box
    marginTop: 10, 
  },
  infoContainer_Bottom: { // New style for the text block *below* the QR container
    alignItems: "center",
    marginTop: 10, 
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginVertical: 5,
  },
});

export default QrCodePage;