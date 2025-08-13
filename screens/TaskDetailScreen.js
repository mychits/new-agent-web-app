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
    Platform,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get("window");

const COLOR_PALETTE = {
    primary: '#2C3E50', // Deeper, professional dark blue
    secondary: '#7F8C8D', // Muted, sophisticated gray for labels
    lightText: '#FFFFFF', // Pure white
    darkText: '#4C4C4C', // Dark grey for general text
    accentGreen: '#2ECC71', // Vibrant emerald green for success
    accentOrange: '#F39C12', // Warm, energetic orange for attention/progress
    cardBackground: 'rgba(255, 255, 255, 0.75)', // Translucent white for glass effect
    glassBorder: 'rgba(255, 255, 255, 0.3)', // Lighter, more translucent border for glassmorphism
    shadowColor: 'rgba(0, 0, 0, 0.15)', // Default shadow color
    buttonGradientStart: '#4A90E2', // A modern blue for buttons
    buttonGradientEnd: '#50E3C2', // A vibrant teal for buttons
    softBlue: '#D6EAF8', // A very light blue for subtle accents
};

const headerImage = require('../assets/hero1.jpg');

export default function TaskDetailScreen({ navigation, route }) {
    const { task } = route.params;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return COLOR_PALETTE.accentGreen;
            case 'Pending':
                return COLOR_PALETTE.accentOrange;
            case 'In Progress':
                return COLOR_PALETTE.primary;
            default:
                return COLOR_PALETTE.secondary;
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#dbf6faff', '#90dafcff']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                {Platform.OS === 'ios' ? (
                    <BlurView intensity={30} tint="light" style={styles.customHeader}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                            <Ionicons name="chevron-back-outline" size={32} color={COLOR_PALETTE.primary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer} />
                        <Image
                            source={headerImage}
                            style={styles.headerRightImage}
                            resizeMode="cover"
                        />
                    </BlurView>
                ) : (
                    <View style={styles.customHeaderAndroid}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                            <Ionicons name="chevron-back-outline" size={32} color={COLOR_PALETTE.primary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer} />
                        <Image
                            source={headerImage}
                            style={styles.headerRightImage}
                            resizeMode="cover"
                        />
                    </View>
                )}

                <View style={styles.contentWrapper}>
                    <View style={styles.card}>
                        <Text style={styles.cardMainTitle}>Task Details</Text>
                        
                        {/* Added a decorative separator */}
                        <View style={styles.titleSeparator} />
                        <Text style={styles.taskTitle}>{task.taskTitle}</Text>

                        {/* Enhanced detail rows */}
                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={20} color={COLOR_PALETTE.secondary} style={styles.detailIcon} />
                            <Text style={styles.detailLabel}>Description:</Text>
                            <Text style={styles.taskDetail}>{task.taskDescription}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="stats-chart-outline" size={20} color={COLOR_PALETTE.secondary} style={styles.detailIcon} />
                            <Text style={styles.detailLabel}>Status:</Text>
                            <Text style={[styles.taskDetail, { color: getStatusColor(task.status), fontWeight: 'bold' }]}>{task.status}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={20} color={COLOR_PALETTE.secondary} style={styles.detailIcon} />
                            <Text style={styles.detailLabel}>Start Date:</Text>
                            <Text style={styles.taskDetail}>{new Date(task.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-sharp" size={20} color={COLOR_PALETTE.secondary} style={styles.detailIcon} />
                            <Text style={styles.detailLabel}>End Date:</Text>
                            <Text style={styles.taskDetail}>{new Date(task.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.markCompleteButtonWrapper}
                            onPress={() => navigation.navigate('CompleteTask', { taskId: task._id })}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={[COLOR_PALETTE.buttonGradientStart, COLOR_PALETTE.buttonGradientEnd]}
                                style={styles.markCompleteButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.markCompleteButtonText}>Mark as Complete</Text>
                                <Ionicons name="checkmark-circle-outline" size={24} color={COLOR_PALETTE.lightText} style={{ marginLeft: 8 }} />
                            </LinearGradient>
                        </TouchableOpacity>
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
        justifyContent: 'flex-start',
        backgroundColor: 'transparent',
    },
    customHeader: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 50,
        left: 0,
        right: 0,
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        zIndex: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLOR_PALETTE.glassBorder,
        overflow: 'hidden',
        shadowColor: COLOR_PALETTE.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    customHeaderAndroid: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
       
    },
    backArrow: {
        padding: 10,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRightImage: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
    },
    contentWrapper: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
        // Adjust marginTop to account for header height, and allow card to be centered
        marginTop: Platform.OS === 'android' ? 50 : 130, // Adjusted to push content down from header
        flex: 1, // Allows card to be centered vertically if there's extra space
        justifyContent: 'center', // Centers the card vertically within the remaining space
    },
    card: {
        backgroundColor: COLOR_PALETTE.cardBackground,
        width: '100%',
        maxWidth: 450,
        paddingHorizontal: 30,
        paddingVertical: 35, // Slightly less vertical padding
        borderRadius: 25,
        alignItems: 'center',
        elevation: 12,
        shadowColor: COLOR_PALETTE.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        borderBottomWidth: 3,
        borderBottomColor: COLOR_PALETTE.primary,
        overflow: 'hidden', // Ensures inner shadows/borders are clipped
    },
    cardMainTitle: {
        fontSize: 30, // Slightly smaller to fit better
        fontWeight: '800',
        color: COLOR_PALETTE.primary,
        marginBottom: 15, // Reduce space slightly
        textAlign: 'center',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    titleSeparator: { // New separator style
        width: '80%',
        height: 2,
        backgroundColor: COLOR_PALETTE.softBlue,
        marginBottom: 20,
        borderRadius: 1,
    },
    cardIcon: {
        marginBottom: 20, // Keep space below icon
        opacity: 0.8,
        // Added a subtle shadow to the icon for depth
        shadowColor: COLOR_PALETTE.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    taskTitle: {
        fontSize: 26, // Slightly smaller to be less overwhelming
        fontWeight: '800',
        color: COLOR_PALETTE.primary,
        marginBottom: 25,
        textAlign: 'center',
        lineHeight: 32,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0,0,0,0.05)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center', // Align items vertically in the center
        width: '100%',
        marginBottom: 15,
        paddingHorizontal: 5, // Reduced horizontal padding
        paddingVertical: 5, // Added vertical padding for spacing
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLOR_PALETTE.glassBorder,
    },
    detailIcon: { // New style for icons in detail rows
        marginRight: 10,
        width: 20, // Ensure consistent spacing
        textAlign: 'center',
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLOR_PALETTE.secondary,
        // No longer needs marginRight as the icon takes its place
        flexShrink: 0, // Prevent label from shrinking
    },
    taskDetail: {
        flex: 1, // Allow detail text to take remaining space
        fontSize: 17,
        color: COLOR_PALETTE.darkText,
        textAlign: 'right', // Align detail text to the right
        paddingLeft: 10, // Add a little space between label and detail
    },
    markCompleteButtonWrapper: {
        width: '100%',
        marginTop: 35, // Adjusted spacing
        marginBottom: 20, // Adjusted spacing
        justifyContent: 'center',
        alignItems: 'center',
    },
    markCompleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: width * 0.75,
        height: 60, // Slightly shorter button
        borderRadius: 30, // Adjusted for new height
        shadowColor: COLOR_PALETTE.buttonGradientEnd,
        shadowOffset: { width: 0, height: 8 }, // Slightly less deep shadow
        shadowOpacity: 0.3, // Slightly less prominent shadow
        shadowRadius: 12, // Softer shadow
        elevation: 10, // Adjusted elevation
    },
    markCompleteButtonText: {
        color: COLOR_PALETTE.lightText,
        fontSize: 18, // Slightly smaller font
        fontWeight: 'bold',
        letterSpacing: 0.8,
    },
    backButton: {
        marginTop: 20,
        paddingVertical: 12, // Increased padding
        paddingHorizontal: 25, // Increased padding
        borderRadius: 12, // More rounded corners
        backgroundColor: COLOR_PALETTE.softBlue, // Use a soft blue for background
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)', // Very subtle border
        shadowColor: COLOR_PALETTE.shadowColor,
        shadowOffset: { width: 0, height: 3 }, // Slightly deeper shadow
        shadowOpacity: 0.15, // More visible shadow
        shadowRadius: 6, // Softer shadow
        elevation: 4,
    },
    backButtonText: {
        color: COLOR_PALETTE.primary,
        fontSize: 16,
        fontWeight: '600',
        textDecorationLine: 'none',
    },
});