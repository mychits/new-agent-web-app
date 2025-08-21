import React, { useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Image,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Header from "../components/Header"; // Ensure this path is correct

const { width, height } = Dimensions.get("window");

const AboutMyChits = ({ route, navigation }) => {
    // Safely get userId from route.params, or default to an empty string if not found
    // This assumes userId is passed during navigation to this screen.
    const { userId } = route.params || {};

    return (
        <View style={styles.container}>
            <LinearGradient
                 colors={['#dbf6faff', '#90dafcff']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                {/* Pass the retrieved userId to the Header component */}
                <Header title="About Us" userId={userId} navigation={navigation} />
                <ScrollView
                    style={styles.scrollViewStyle}
                    contentContainerStyle={styles.whiteContentContainer}
                >
                    <View style={styles.aboutUsContainer}>
                        <View style={styles.imageFrame}>
                            <Image
                                source={require('../assets/image.png')} // Make sure this image path is correct
                                style={styles.aboutImage}
                                resizeMode="cover"
                            />
                        </View>

                        <Text style={styles.aboutTitle}>MY CHITS:</Text>
                        <Text style={styles.tagline}>India's 100% Digital Chit Fund Firm</Text>

                        <Text style={styles.aboutText}>
                            We are a registered chit fund company helping people from all walks of life. We understand the necessity of financial independence and thus connect them with necessary funds when they require it.
                        </Text>
                        <Text style={styles.aboutText}>
                            Join our fast-growing team that's disrupting the traditional chit fund segment and offering exciting new opportunities to retail investors in India.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { // New container for the gradient
        flex: 1,
        position: 'relative',
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: { // Adjusted SafeAreaView
        flex: 1,
        paddingTop: StatusBar.currentHeight || 0,
        backgroundColor: 'transparent', // Make sure it's transparent to show gradient
    },
    scrollViewStyle: {
        flex: 2,
        backgroundColor: 'transparent', // Make transparent to show the main gradient
    },
    whiteContentContainer: {
        backgroundColor: "#fff", // White background for the main content area
        borderRadius: 20, // Reverted to 20 for consistency with other cards
        marginHorizontal: width * 0.05, // Adjusted margin for better appearance
        marginTop: height * 0.05,
        marginBottom: height * 0.03,
        paddingVertical: height * 0.035,
        paddingHorizontal: width * 0.05,
        paddingBottom: height * 0.1,
        shadowColor: "rgba(0, 0, 0, 0.1)",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 0.5,
        borderColor: '#E8E8E8',
    },

    imageFrame: {
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: height * 0.03,
        shadowColor: "rgba(0, 0, 0, 0.08)",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
        backgroundColor: '#fff',
    },
    aboutImage: {
        width: '100%',
        height: width * 0.55,
        alignSelf: 'center',
    },
    aboutTitle: {
        fontSize: width * 0.08,
        fontWeight: "800",
        color: "#053B90",
        marginBottom: height * 0.003,
        textAlign: 'center',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tagline: {
        fontSize: width * 0.05,
        fontWeight: "600",
        color: "#da8201",
        marginBottom: height * 0.035,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    aboutText: {
        fontSize: width * 0.04,
        lineHeight: width * 0.065,
        color: "#444",
        marginBottom: height * 0.02,
        textAlign: 'justify',
    },
});

export default AboutMyChits;