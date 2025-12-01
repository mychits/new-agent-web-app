import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";

// --- DESIGN CONSTANTS COPIED FROM PigmePayin.js ---
const TOP_GRADIENT = ["#1aa2ccff", "#1aa2ccff"]; 
const MODERN_PRIMARY = "#0d0d0eff"; // Dark text/headers
const ACCENT_BLUE = "#1796d1ff"; // Blue accent 
const BORDER_COLOR = "#e0e0e0"; // Lighter border
const TEXT_GREY = "#4b5563"; // Grey text for subtitles/subtext
const CARD_BG = "#ffffff"; // White for cards/form background
const SUBTLE_BG_GREY = '#f9fafb'; // Very light background for content area
// --------------------------------------------------


const QrCodePage = () => {
    // Assuming this asset path is correct for the user's project structure
    const qrCodeImage = require("../assets/upi_qr (1).png"); 

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient
                colors={TOP_GRADIENT}
                style={styles.fixedHeaderArea}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerSpacer}>
                    <Header />
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Payment QR Code</Text>
                    <Text style={styles.subtitle}>
                        Use this code to make payments instantly
                    </Text>
                </View>
            </LinearGradient>


            {/* =======================================================
               SCROLLABLE CONTENT AREA (The QR Card)
               =======================================================
            */}
            <View style={styles.mainContentArea}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formBox}>
                        
                        {/* Title inside the card */}
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>MyChits Payments</Text>
                        </View>

                        {/* ******** QR Code Container (The central block) ******** */}
                        <View style={styles.qrContainer}>
                            
                            {/* UPI ID TEXT */}
                            <View style={styles.infoContainer_QR}>
                                <Text style={styles.upiIdText}>UPI ID: mychits@kotak</Text>
                            </View>

                            {/* QR CODE IMAGE */}
                            <Image
                                source={qrCodeImage}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        </View>
                        
                        {/* ******** SCAN INSTRUCTIONS TEXT BLOCK ******** */}
                        <View style={styles.infoContainer_Bottom}> 
                            <Text style={styles.infoInstructionText}>
                                Scan this QR code to make payments
                            </Text>
                            <Text style={styles.bankText}>
                                Kotak Bank
                            </Text>
                        </View>
                        
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // --- LAYOUT STYLES ---
    safeArea: {
        flex: 1,
        backgroundColor: TOP_GRADIENT[0],
    },
    
    fixedHeaderArea: { 
        paddingHorizontal: 16,
        paddingBottom: 20, 
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    
    mainContentArea: {
        flex: 1,
        backgroundColor: SUBTLE_BG_GREY,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        marginTop: -20, // Pulls content up under the header
        paddingTop: 30, 
    },
    headerSpacer: {
        paddingTop: 20,
        paddingBottom: 5,
    },

    // --- TITLE STYLES (Matching PigmePayin) ---
    titleContainer: {
        alignItems: "center",
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: CARD_BG, // White text
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.85)",
        fontWeight: "500",
        textAlign: "center",
    },

    // --- FORM/CARD STYLES (Matching PigmePayin's formBox) ---
    scrollContentContainer: {
        paddingBottom: 50,
        paddingTop: 10,
        flexGrow: 1,
    },
    formBox: {
        backgroundColor: CARD_BG,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        shadowColor: MODERN_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },

    // --- QR CODE SPECIFIC STYLES ---
    cardHeader: {
        marginBottom: 20,
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: MODERN_PRIMARY,
        textAlign: "center",
    },
    qrContainer: {
        justifyContent: "center",
        alignItems: "center",
        // Removed the previous background color and box shadow, 
        // as the white CARD_BG/formBox handles the main styling now.
        padding: 10,
        marginVertical: 10,
    },
    qrImage: {
        width: 250,
        height: 250, // Reduced height slightly to fit better
        alignSelf: 'center',
    },
    
    // --- INFO TEXT STYLES ---
    infoContainer_QR: { 
        alignItems: "center",
        marginBottom: 15,
    },
    upiIdText: {
        fontSize: 18,
        fontWeight: '600',
        color: MODERN_PRIMARY, // Primary color for important info
    },
    infoContainer_Bottom: { 
        alignItems: "center",
        marginTop: 15, 
        borderTopWidth: 1,
        borderTopColor: BORDER_COLOR,
        paddingTop: 15,
    },
    infoInstructionText: {
        fontSize: 15,
        color: TEXT_GREY,
        textAlign: "center",
        marginVertical: 5,
        fontWeight: '500',
    },
    bankText: {
        fontSize: 16,
        color: MODERN_PRIMARY,
        fontWeight: 'bold',
        textAlign: "center",
        marginVertical: 5,
    }
});

export default QrCodePage;