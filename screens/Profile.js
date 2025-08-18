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
	Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
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
					<View style={{ marginHorizontal: 22, marginTop: 12, flex: 1 }}>
						<Header />
						<View style={styles.container}>
							<View style={styles.header}>
								<Text style={styles.headerTitle}>Profile</Text>
							</View>
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
											<View style={styles.rowWrapper}>
												<TouchableOpacity
													onPress={() => {
														/* handle onPress */
													}}
													style={styles.row}
												>
													<View style={styles.rowIcon}>
														<Ionicons color="#fff" name="globe-outline" size={20} />
													</View>
													<Text style={styles.rowLabel}>Language</Text>
													<View style={styles.rowSpacer} />
													<Text style={styles.rowValue}>English</Text>
													<MaterialCommunityIcons
														color="#C6C6C6"
														name="chevron-right"
														size={20}
													/>
												</TouchableOpacity>
											</View>
											<View style={styles.rowWrapper}>
												<TouchableOpacity
													onPress={() => navigation.navigate("PaymentNavigator")}
													style={styles.row}
												>
													<View style={styles.rowIcon}>
														<MaterialCommunityIcons color="#fff" name="briefcase" size={20} />
													</View>
													<Text style={styles.rowLabel}>Collections</Text>
													<View style={styles.rowSpacer} />
													<MaterialCommunityIcons
														color="#C6C6C6"
														name="chevron-right"
														size={20}
													/>
												</TouchableOpacity>
											</View>
											<View style={styles.rowWrapper}>
												<TouchableOpacity
													onPress={() =>
														navigation.navigate("PayNavigation", { user: user })
													}
													style={styles.row}
												>
													<View style={styles.rowIcon}>
														<MaterialCommunityIcons color="#fff" name="credit-card-outline" size={20} />
													</View>
													<Text style={styles.rowLabel}>Payments</Text>
													<View style={styles.rowSpacer} />
													<MaterialCommunityIcons
														color="#C6C6C6"
														name="chevron-right"
														size={20}
													/>
												</TouchableOpacity>
											</View>
											<View style={styles.rowWrapper}>
												<TouchableOpacity
													onPress={() =>
														navigation.navigate("PayNavigation", {
															screen: "ViewLeads",
															params: { user: user },
														})
													}
													style={styles.row}
												>
													<View style={styles.rowIcon}>
														<MaterialCommunityIcons color="#fff" name="account-plus" size={20} />
													</View>
													<Text style={styles.rowLabel}>Leads</Text>
													<View style={styles.rowSpacer} />
													<MaterialCommunityIcons
														color="#C6C6C6"
														name="chevron-right"
														size={20}
													/>
												</TouchableOpacity>
											</View>
											<View style={styles.rowWrapper}>
												<TouchableOpacity
													onPress={() => navigation.navigate("Commissions")}
													style={styles.row}
												>
													<View style={styles.rowIcon}>
														<MaterialCommunityIcons color="#fff" name="cash-multiple" size={20} />
													</View>
													<Text style={styles.rowLabel}>Commissions</Text>
													<View style={styles.rowSpacer} />
													<MaterialCommunityIcons
														color="#C6C6C6"
														name="chevron-right"
														size={20}
													/>
												</TouchableOpacity>
											</View>

											{/* New Menu Item: About MyChits */}
											<View style={styles.rowWrapper}>
												<TouchableOpacity
													onPress={() => navigation.navigate("AboutMyChits")} // Navigate to 'AboutMyChits' screen
													style={styles.row}
												>
													<View style={styles.rowIcon}>
														<Ionicons color="#fff" name="information-circle-outline" size={20} />
													</View>
													<Text style={styles.rowLabel}>About MyChits</Text>
													<View style={styles.rowSpacer} />
													<MaterialCommunityIcons
														color="#C6C6C6"
														name="chevron-right"
														size={20}
													/>
												</TouchableOpacity>
											</View>

											{/* New Menu Item: Help & Support */}
											<View style={styles.rowWrapper}>
												<TouchableOpacity
													onPress={() => navigation.navigate("HelpAndSupport")} // Corrected to "HelpAndSupport"
													style={styles.row}
												>
													<View style={styles.rowIcon}>
														<Ionicons color="#fff" name="help-circle-outline" size={20} />
													</View>
													<Text style={styles.rowLabel}>Help & Support</Text>
													<View style={styles.rowSpacer} />
													<MaterialCommunityIcons
														color="#C6C6C6"
														name="chevron-right"
														size={20}
													/>
												</TouchableOpacity>
											</View>

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
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	gradientOverlay: {
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
		paddingVertical: 4,
		paddingHorizontal: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	header: {
		paddingHorizontal: 14,
		marginBottom: 12,
		marginTop: 20,
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: "900",
		color: "#1d1d1d",
		letterSpacing: 0.8,
	},
	profile: {
		paddingVertical: 16,
		paddingHorizontal: 12,
		flexDirection: "column",
		alignItems: "center",
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
		marginTop: 16,
		alignItems: 'center',
	},
	agentName: {
		fontSize: 24,
		fontWeight: "700",
		color: "#090909",
		marginBottom: 4,
	},
	agentPhone: {
		fontSize: 16,
		fontWeight: "500",
		color: "#666666",
	},
	section: {
		paddingTop: 10,
	},
	sectionBody: {
		paddingHorizontal: 14,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		paddingVertical: 14,
	},
	rowWrapper: {
		borderBottomWidth: 1,
		borderColor: "#f0f0f0",
	},
	rowIcon: {
		width: 38,
		height: 38,
		borderRadius: 12,
		backgroundColor: '#5A9BD6', // A more vibrant blue
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
	separator: {
		height: 1.5,
		backgroundColor: "#e3e3e3",
		marginVertical: 15,
		marginHorizontal: 20,
	},
	logoutButton: {
		marginTop: 30,
		marginBottom: 20,
		marginHorizontal: 12,
	},
	profileAction: {
		paddingVertical: 14,
		paddingHorizontal: 20,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: '#E74C3C', // A darker, more elegant red
		borderRadius: 16,
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