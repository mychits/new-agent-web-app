import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Alert,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions, // Added Dimensions for responsive styling
    StatusBar, // Added StatusBar for consistent look
    SafeAreaView, // Added SafeAreaView for consistent layout
    Pressable, // Added Pressable for consistent button interaction
    Platform, // Added Platform for platform-specific styling
    Image, // Added Image for header image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // For gradient backgrounds and buttons
import { Ionicons } from '@expo/vector-icons'; // For potential icons in inputs/dropdown
import COLORS from '../constants/color'; // Keeping this, but will primarily use COLOR_PALETTE
import baseUrl from '../constants/baseUrl';
import axios from 'axios';

const { width, height } = Dimensions.get("window");

// Define a consistent color palette based on the existing design (from Login/Register)
const COLOR_PALETTE = {
    primary: '#1C2E4A', // Dark blue/charcoal for text and buttons
    secondary: '#5F6C7D', // Grayish blue for labels and icons
    lightText: '#FFFFFF', // White text for contrast
    darkText: '#000', // Black text for specific elements
};

const headerImage = require('../assets/hero1.jpg'); // Assuming this path is correct for your project

export default function CompleteTaskScreen({ route, navigation }) {
    const { taskId } = route.params;
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('Completed'); // Initial status
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
            Alert.alert('Validation Error', 'Please enter a message.');
            return;
        }

        try {
            setLoading(true);
            await axios.put(`${baseUrl}/task/complete-task/${taskId}`, {
                message,
                status,
            });

            Alert.alert('Success', 'Task updated successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating task:', error.response ? error.response.data : error.message);
            Alert.alert('Error', 'Failed to update task.');
        } finally {
            setLoading(false);
        }
    };

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
                    {/* Screen Title */}
                    <Text style={styles.screenTitle}>Complete Task</Text>

                    {/* Main Content Card */}
                    <View style={styles.card}>
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
                                numberOfLines={4}
                                style={styles.textInputMultiline} // Use a specific style for multiline
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
                                colors={[COLOR_PALETTE.primary, COLOR_PALETTE.secondary]}
                                style={styles.submitButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color={COLOR_PALETTE.lightText} />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit</Text>
                                )}
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
        fontSize: 32,
        fontWeight: '800',
        color: COLOR_PALETTE.lightText,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 38,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        width: '100%',
        maxWidth: 400,
        paddingHorizontal: 30,
        paddingVertical: 40,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 8,
        borderColor:"#FFC000",
        borderWidth:2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
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
        borderRadius: 30,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        borderColor: '#E0E0E0',
        borderWidth: 1,
    },
    statusDropdownText: {
        fontSize: 16,
        color: COLOR_PALETTE.primary,
    },
    textInputMultiline: { // Specific style for multiline input
        width: "100%",
        minHeight: 120, // Increased minHeight for multiline
        backgroundColor: '#FFFFFF',
        borderRadius: 15, // Slightly less rounded for multiline
        paddingHorizontal: 20,
        paddingVertical: 15, // Add vertical padding for multiline
        fontSize: 16,
        color: COLOR_PALETTE.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        textAlignVertical: 'top', // Aligns text to the top for multiline
    },
    submitButtonWrapper: {
        width: '100%',
        marginTop: 30,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButton: {
        width: width * 0.7,
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
    submitButtonText: {
        color: COLOR_PALETTE.lightText,
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 1,
    },
    backButton: {
        marginTop: 15,
    },
    backButtonText: {
        color: COLOR_PALETTE.primary,
        fontSize: 16,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});