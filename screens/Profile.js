// fileName: Profile.js
import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import Header from "../components/Header";
import COLORS from "../constants/color";
import axios from "axios";
import baseUrl from "../constants/baseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const Profile = ({ route, navigation }) => {
	const { user } = route.params;
	const [form, setForm] = useState({
		darkMode: false,
		emailNotifications: true,
		pushNotifications: false,
	});
	const [agent, setAgent] = useState([]);

	useEffect(() => {
		const fetchAgent = async () => {
			try {
				const response = await axios.get(
					`${baseUrl}/agent/get-agent-by-id/${user.userId}`
				);
				if (response.data) {
					setAgent(response.data);
				} else {
					console.error("Unexpected API response format:", response.data);
				}
			} catch (error) {
				console.error("Error fetching agent data:", error);
			}
		};

		fetchAgent();
	}, []);

	const removeUserLocalStorage = async () => {
		try {
			await AsyncStorage.clear();
		} catch (err) {
			console.log("failed to remove user from localstorage");
		}
	};
	const handleLogout = () => {
		removeUserLocalStorage();
		navigation.navigate("Login", { user });
	};

	const menuItems = [
		{ name: "Language", icon: "globe-outline", component: Ionicons, value: "English", action: () => { } },
		{ name: "Collections", icon: "briefcase", component: MaterialCommunityIcons, action: () => navigation.navigate("PaymentNavigator") },
		{ name: "Payments", icon: "credit-card-outline", component: MaterialCommunityIcons, action: () => navigation.navigate("PayNavigation", { user: user }) },
		{ name: "Leads", icon: "account-plus", component: MaterialCommunityIcons, action: () => navigation.navigate("PayNavigation", { screen: "ViewLeads", params: { user: user } }) },
		{ name: "Commissions", icon: "cash-multiple", component: MaterialCommunityIcons, action: () => navigation.navigate("Commissions") },
		{ name: "About MyChits", icon: "information-circle-outline", component: Ionicons, action: () => navigation.navigate("AboutMyChits") },
		{ name: "Help & Support", icon: "help-circle-outline", component: Ionicons, action: () => navigation.navigate("HelpAndSupport") },
	];

	return (
		<View style={{ flex: 1, backgroundColor: COLORS.white }}>
			<LinearGradient
				colors={['#dbf6faff', '#90dafcff']}
				style={styles.gradientOverlay}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			>
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
				>
					<View style={styles.contentContainer}>
						<Header />
						<View style={styles.container}>
							<Text style={styles.headerTitle}>Profile</Text>
							<ScrollView
								showsVerticalScrollIndicator={false}
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{ paddingBottom: 180 }}
							>
								<View style={styles.mainContainer}>
									<View style={styles.profile}>
										<Image
											alt="Profile Picture"
											source={require('../assets/P.png')}
											style={styles.profileAvatar}
										/>
										<View style={styles.profileInfo}>
											<Text style={styles.agentName}>{agent.name}</Text>
											<Text style={styles.agentPhone}>{agent.phone_number}</Text>
										</View>
									</View>

									<View style={styles.section}>
										<View style={styles.sectionBody}>
											{menuItems.map((item, index) => {
												const IconComponent = item.component;
												return (
													<TouchableOpacity
														key={index}
														onPress={item.action}
														style={styles.menuCard}
													>
														<View style={styles.rowIcon}>
															<IconComponent color="#fff" name={item.icon} size={20} />
														</View>
														<Text style={styles.rowLabel}>{item.name}</Text>
														<View style={styles.rowSpacer} />
														{item.value && <Text style={styles.rowValue}>{item.value}</Text>}
														<MaterialCommunityIcons
															color="#C6C6C6"
															name="chevron-right"
															size={20}
														/>
													</TouchableOpacity>
												);
											})}
										</View>
									</View>

									<TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
										<View style={styles.profileAction}>
											<Text style={styles.profileActionText}>Logout</Text>
										</View>
									</TouchableOpacity>
								</View>
							</ScrollView>
						</View>
					</View>
				</KeyboardAvoidingView>
			</LinearGradient>
		</View>
	);
};

const styles = StyleSheet.create({
	gradientOverlay: {
		flex: 1,
	},
	contentContainer: { 
		marginHorizontal: 22, 
		marginTop: 50, // Pushed the header down by increasing this value
		flex: 1,
	},
	mainContainer: {
		backgroundColor: "#fff",
		borderRadius: 20,
		marginHorizontal: 12,
		marginTop: 10,
		paddingVertical: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 10,
		elevation: 8,
	},
	container: {
		paddingVertical: -2,
		paddingHorizontal: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: "900",
		color: "#1d1d1d",
		letterSpacing: 0.8,
		paddingHorizontal: 14,
		marginBottom: 12,
		marginTop: 10,
	},
	profile: {
		paddingVertical: 20,
		paddingHorizontal: 20,
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
	},
	profileAvatar: {
		width: 80,
		height: 80,
		borderRadius: 9999,
		borderWidth: 4,
		borderColor: "#fff",
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	profileInfo: {
		marginLeft: 15,
		alignItems: 'flex-start',
	},
	agentName: {
		fontSize: 24,
		fontWeight: "700",
		color: "#090909",
		marginBottom: -2,
	},
	agentPhone: {
		fontSize: 16,
		fontWeight: "500",
		color: "#666666",
	},
	section: {
		paddingTop: -10,
	},
	sectionBody: {
		paddingHorizontal: 12,
	},
	menuCard: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 16,
		backgroundColor: "#fff",
		borderRadius: 12,
		marginBottom: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderColor: '#e8f4faff',
		borderWidth: 2,
	},
	rowIcon: {
		width: 30,
		height: 30,
		borderRadius: 12,
		backgroundColor: '#5A9BD6',
		alignItems: "center",
		justifyContent: "center",
		marginRight: 16,
	},
	rowLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
	},
	rowSpacer: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
	},
	rowValue: {
		fontSize: 14,
		fontWeight: "500",
		color: "#8B8B8B",
		marginRight: 8,
	},
	logoutButton: {
		marginTop: 20,
		marginBottom: 20,
		marginHorizontal: 12,
	},
	profileAction: {
		paddingVertical: 16,
		paddingHorizontal: 24,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: '#E74C3C',
		borderRadius: 30,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	profileActionText: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
	},
});

export default Profile;