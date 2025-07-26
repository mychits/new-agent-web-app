import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    Pressable,
    Platform, // Added Platform for platform-specific styling
    Image, // Added Image for header image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

// Define a consistent color palette based on the existing design (from Login/Register)
const COLOR_PALETTE = {
    primary: '#1C2E4A', // Dark blue/charcoal for text and buttons
    secondary: '#5F6C7D', // Grayish blue for labels and icons
    lightText: '#FFFFFF', // White text for contrast
    darkText: '#000', // Black text for specific elements
};

const headerImage = require('../assets/hero1.jpg'); // Assuming this path is correct for your project

export default function TaskDetailScreen({ navigation, route }) {
    const { task } = route.params;

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#A8E0F9', '#F9E5B5']} // Matching Login.js gradient
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Custom Header with Back Arrow and Image */}
                <View style={styles.customHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                        <Ionicons name="chevron-back-outline" size={30} color={COLOR_PALETTE.primary} />
                    </TouchableOpacity>
                    <Image
                        source={headerImage}
                        style={styles.headerRightImage}
                        resizeMode="cover"
                    />
                </View>

                <View style={styles.contentWrapper}>
                    {/* Header/Title Section */}
                    <Text style={styles.screenTitle}>Task Details</Text>

                    {/* Task Details Card */}
                    <View style={styles.card}>
                        <Text style={styles.taskTitle}>Title: {task.taskTitle}</Text>
                        <Text style={styles.taskDetail}>Description: {task.taskDescription}</Text>
                        <Text style={styles.taskDetail}>Status: {task.status}</Text>
                        <Text style={styles.taskDetail}>Start: {new Date(task.startDate).toLocaleDateString()}</Text>
                        <Text style={styles.taskDetail}>End: {new Date(task.endDate).toLocaleDateString()}</Text>

                        {/* Mark as Complete Button */}
                        <TouchableOpacity
                            style={styles.markCompleteButtonWrapper}
                            onPress={() => navigation.navigate('CompleteTask', { taskId: task._id })}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={[COLOR_PALETTE.primary, COLOR_PALETTE.secondary]} // Matching Login.js button gradient
                                style={styles.markCompleteButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.markCompleteButtonText}>Mark as Complete</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Back Button */}
                        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Text style={styles.backButtonText}>Back to Tasks</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center', // Center content vertically
        paddingHorizontal: 0,
        backgroundColor: 'transparent',
    },
    // New Header Styles
    customHeader: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 50,
        left: 0,
        right: 0,
        height: 65,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Changed as per your request
        paddingHorizontal: 10,
        zIndex: 1, // Ensure header is above other content if needed
    },
    backArrow: {
        padding: 8,
        marginRight: 6,
    },
    headerRightImage: {
        width: 48,
        height: 48,
        marginLeft: 232, // Adjusted as per your request
    },
    // End New Header Styles
    contentWrapper: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
        // Adjust marginTop to accommodate the header
        marginTop: Platform.OS === 'android' ? 105 : 115, // Roughly header height + desired spacing
    },
    screenTitle: {
        fontSize: 32, // Slightly smaller than login welcome, but still prominent
        fontWeight: '800',
        color: COLOR_PALETTE.lightText,
        textAlign: 'center',
        marginBottom: 30, // Space between title and card
        lineHeight: 38,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly transparent white, matching ResetPassword
        width: '100%',
        maxWidth: 400, // Max width for larger screens
        paddingHorizontal: 30,
        paddingVertical: 40,
        borderRadius: 20,
        alignItems: 'center',
        borderColor:"#FFC000",
        borderWidth:2,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    taskTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLOR_PALETTE.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    taskDetail: {
        fontSize: 16,
        marginBottom: 12,
        color: COLOR_PALETTE.darkText,
        width: '100%',
        paddingHorizontal: 10,
        lineHeight: 24,
    },
    markCompleteButtonWrapper: {
        width: '100%',
        marginTop: 30,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markCompleteButton: {
        width: width * 0.7, // Consistent button width with Login/ResetPassword
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 12,
    },
    markCompleteButtonText: {
        color: COLOR_PALETTE.lightText,
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 1,
    },
    backButton: {
        marginTop: 15,
    },
    backButtonText: {
        color: COLOR_PALETTE.primary, // Consistent color for links
        fontSize: 16,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});