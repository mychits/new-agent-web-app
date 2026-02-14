import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    Platform,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get("window");

const COLOR_PALETTE = {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    lightText: '#FFFFFF',
    darkText: '#4C4C4C',
    accentGreen: '#2ECC71',
    accentOrange: '#f8c009ff',
    cardBackground: 'rgba(255, 255, 255, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    buttonGradientStart: '#4A90E2',
    buttonGradientEnd: '#50E3C2',
    softBlue: '#D6EAF8',
};

const headerImage = require('../assets/hero1.jpg');

export default function TaskDetailScreen({ navigation, route }) {
    const { task } = route.params;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return COLOR_PALETTE.accentGreen;
            case 'Pending': return COLOR_PALETTE.accentOrange;
            case 'In Progress': return COLOR_PALETTE.primary;
            default: return COLOR_PALETTE.secondary;
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#24C6DC', '#183A5D']}
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
                        <View style={styles.titleSeparator} />
                        <Text style={styles.taskTitle}>{task.taskTitle}</Text>

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
                            <Text style={styles.taskDetail}>{new Date(task.startDate).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-sharp" size={20} color={COLOR_PALETTE.secondary} style={styles.detailIcon} />
                            <Text style={styles.detailLabel}>End Date:</Text>
                            <Text style={styles.taskDetail}>{new Date(task.endDate).toLocaleDateString()}</Text>
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
    container: { flex: 1, position: 'relative' },
    backgroundGradient: { ...StyleSheet.absoluteFillObject },
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
    backArrow: { padding: 10 },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerRightImage: { width: 55, height: 55, borderRadius: 27.5 },
    contentWrapper: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: Platform.OS === 'android' ? 50 : 130,
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: COLOR_PALETTE.cardBackground,
        width: '100%',
        maxWidth: 450,
        paddingHorizontal: 30,
        paddingVertical: 35,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 12,
        shadowColor: COLOR_PALETTE.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        borderBottomWidth: 3,
        borderBottomColor: COLOR_PALETTE.primary,
        overflow: 'hidden',
    },
    cardMainTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: COLOR_PALETTE.primary,
        marginBottom: 15,
        textAlign: 'center',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    titleSeparator: {
        width: '80%',
        height: 2,
        backgroundColor: COLOR_PALETTE.softBlue,
        marginBottom: 20,
        borderRadius: 1,
    },
    taskTitle: {
        fontSize: 26,
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
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLOR_PALETTE.glassBorder,
    },
    detailIcon: { marginRight: 10, width: 20, textAlign: 'center' },
    detailLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLOR_PALETTE.secondary,
        flexShrink: 0,
    },
    taskDetail: {
        flex: 1,
        fontSize: 17,
        color: COLOR_PALETTE.darkText,
        textAlign: 'right',
        paddingLeft: 10,
    },
    markCompleteButtonWrapper: {
        width: '100%',
        marginTop: 35,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markCompleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: width * 0.75,
        height: 60,
        borderRadius: 30,
        shadowColor: COLOR_PALETTE.buttonGradientEnd,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    markCompleteButtonText: {
        color: COLOR_PALETTE.lightText,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.8,
    },
});