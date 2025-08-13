import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Alert,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    SafeAreaView,
    Platform,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Use BlurView for iOS glassmorphism
import axios from 'axios';

// A more comprehensive and stylish color palette
const COLOR_PALETTE = {
    primary: '#1C2E4A',
    secondary: '#5F6C7D',
    lightText: '#FFFFFF',
    darkText: '#000',
    softBlue: '#97c7ff', // A new, soft blue for accents
    glassBackground: 'rgba(255, 255, 255, 0.6)', // Translucent background
    glassBorder: 'rgba(255, 255, 255, 0.4)', // Lighter border
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    buttonGradientStart: '#4A90E2', // A modern blue for buttons
    buttonGradientEnd: '#50E3C2', // A vibrant teal for buttons
    cardBorder: '#D6EAF8', // A very light, subtle card border color
};

const headerImage = require('../assets/hero1.jpg');
const baseUrl = 'your_base_url_here'; // Placeholder for the original baseUrl

const { width, height } = Dimensions.get("window");

export default function CompleteTaskScreen({ route, navigation }) {
    const { taskId } = route.params;
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('Completed');
    const [loading, setLoading] = useState(false);

    // Function to cycle through statuses
    const toggleStatus = () => {
        setStatus(prevStatus => {
            switch (prevStatus) {
                case 'Completed':
                    return 'Pending';
                case 'Pending':
                    return 'In Progress';
                case 'In Progress':
                    return 'Completed';
                default:
                    return 'Completed';
            }
        });
    };

    const handleCompleteTask = async () => {
        if (!message) {
            // Using a custom modal or component instead of Alert
            Alert.alert('Validation Error', 'Please enter a message.');
            return;
        }

        try {
            setLoading(true);
            await axios.put(`${baseUrl}/task/complete-task/${taskId}`, {
                message,
                status,
            });

            // Using a custom modal or component instead of Alert
            Alert.alert('Success', 'Task updated successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating task:', error.response ? error.response.data : error.message);
            // Using a custom modal or component instead of Alert
            Alert.alert('Error', 'Failed to update task.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                 colors={['#dbf6faff', '#90dafcff']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Custom Header with a glassmorphism effect */}
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={25} tint="light" style={styles.customHeader}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                            <Ionicons name="chevron-back-outline" size={30} color={COLOR_PALETTE.primary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Update Task</Text>
                        <Image
                            source={headerImage}
                            style={styles.headerRightImage}
                            resizeMode="cover"
                        />
                    </BlurView>
                ) : (
                    // Android header without BlurView
                    <View style={styles.customHeaderAndroid}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                            <Ionicons name="chevron-back-outline" size={30} color={COLOR_PALETTE.primary} />
                        </TouchableOpacity>
                        
                        <Image
                            source={headerImage}
                            style={styles.headerRightImage}
                            resizeMode="cover"
                        />
                    </View>
                )}

                <View style={styles.contentWrapper}>
                    {/* Main Content Card with glassmorphism effect */}
                    <View style={styles.card}>
                        {/* Screen Title with a subtle text shadow */}
                        <Text style={styles.screenTitle}>Complete Task</Text>
                        <View style={styles.screenTitleSeparator} />

                        <Ionicons name="checkmark-done-circle-outline" size={80} color={COLOR_PALETTE.softBlue} style={styles.cardIcon} />

                        {/* Status Dropdown */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Status</Text>
                            <TouchableOpacity
                                style={styles.statusDropdown}
                                onPress={toggleStatus}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.statusDropdownText}>{status}</Text>
                                <Ionicons name="caret-down" size={20} color={COLOR_PALETTE.secondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Message Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Message</Text>
                            <TextInput
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Enter message"
                                placeholderTextColor="#A9A9A9"
                                multiline
                                numberOfLines={3} 
                                style={styles.textInputMultiline}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButtonWrapper}
                            onPress={handleCompleteTask}
                            activeOpacity={0.7}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={[COLOR_PALETTE.buttonGradientStart, COLOR_PALETTE.buttonGradientEnd]}
                                style={styles.submitButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color={COLOR_PALETTE.lightText} />
                                ) : (
                                    <View style={styles.submitButtonContent}>
                                        <Text style={styles.submitButtonText}>Submit</Text>
                                        <Ionicons name="arrow-forward-circle-outline" size={24} color={COLOR_PALETTE.lightText} style={{ marginLeft: 8 }} />
                                    </View>
                                )}
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
        backgroundColor: 'transparent',
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
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
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        zIndex: 1,
        overflow: 'hidden',
        shadowColor: COLOR_PALETTE.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLOR_PALETTE.glassBorder,
    },
    customHeaderAndroid: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        height: 65,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        
    },
    backArrow: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLOR_PALETTE.primary,
        flex: 1, // Allows title to take up remaining space
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    headerRightImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    // End New Header Styles
    contentWrapper: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 100,
        flex: 1, 
        justifyContent: 'center',
    },
    screenTitle: {
        fontSize: 28, // Reduced font size for better fit
        fontWeight: '800',
        color: COLOR_PALETTE.primary,
        textAlign: 'center',
        marginBottom: 4,
        lineHeight: 32,
        letterSpacing: 0.5,
    },
    screenTitleSeparator: {
        width: '40%',
        height: 2,
        backgroundColor: COLOR_PALETTE.primary,
        marginBottom: 20, // Adjusted spacing
        borderRadius: 1,
    },
    card: {
        backgroundColor: COLOR_PALETTE.glassBackground, // Translucent background
        width: '100%',
        maxWidth: 400,
        paddingHorizontal: 30,
        paddingVertical: 40,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 12,
        borderColor: COLOR_PALETTE.cardBorder, // A subtle, light border
        borderWidth: 2,
        shadowColor: COLOR_PALETTE.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        overflow: 'hidden',
    },
    cardIcon: {
        marginBottom: 20,
        opacity: 0.7,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLOR_PALETTE.primary,
        marginBottom: 8,
        marginLeft: 10,
    },
    statusDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 20,
        shadowColor: COLOR_PALETTE.shadowColor,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        borderColor: COLOR_PALETTE.cardBorder,
        borderWidth: 1,
    },
    statusDropdownText: {
        fontSize: 16,
        color: COLOR_PALETTE.primary,
    },
    textInputMultiline: {
        width: "100%",
        minHeight: 120,
        maxHeight: 200, // Added to enable scrolling within the text area
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontSize: 16,
        color: COLOR_PALETTE.primary,
        shadowColor: COLOR_PALETTE.shadowColor,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        borderColor: COLOR_PALETTE.cardBorder,
        borderWidth: 1,
        textAlignVertical: 'top',
    },
    submitButtonWrapper: {
        width: '100%',
        marginTop: 30,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: width * 0.7,
        height: 60,
        borderRadius: 30,
        shadowColor: COLOR_PALETTE.buttonGradientEnd,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 15,
    },
    submitButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    submitButtonText: {
        color: COLOR_PALETTE.lightText,
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 1,
    },
    backButton: {
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLOR_PALETTE.glassBackground,
        borderColor: COLOR_PALETTE.glassBorder,
        borderWidth: 1,
    },
    backButtonText: {
        color: COLOR_PALETTE.primary,
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    },
});

