import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	Linking,
	Alert,
	Image,
	TextInput,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import baseUrl from "../constants/baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";
const noImage = require('../assets/no.png');

const whatsappMessage = "Hello from our app!";

const sendWhatsappMessage = (item) => {
	if (item?.phone_number) {
		let url = `whatsapp://send?phone=${item.phone_number
			}&text=${encodeURIComponent(whatsappMessage)}`;

		Linking.canOpenURL(url)
			.then((supported) => {
				if (supported) {
					return Linking.openURL(url);
				} else {
					Alert.alert("WhatsApp is not installed");
				}
			})
			.catch((err) => console.error("An error occurred", err));
	}
};

const openDialer = (item) => {
	if (item.phone_number) {
		Linking.canOpenURL(`tel:${item.phone_number}`)
			.then((supported) => {
				if (supported) {
					Linking.openURL(`tel:${item.phone_number}`);
				}
			})
			.catch((err) => {
				Alert.alert("Something went wrong!");
			});
	}
};
const sendEmail = (item) => {
	if (item?.email) {
		Linking.canOpenURL(`mailto:${item.email}`)
			.then((supported) => {
				if (supported) {
					Linking.openURL(`mailto:${item.email}`);
				} else {
					Alert.alert("Mail service is not installed");
				}
			})
			.catch((err) => {
				Alert.alert("Something went wrong!");
			});
	}
};

const ViewCustomer = ({ route, navigation }) => {
	const { user } = route.params;

	const [chitCustomers, setChitCustomers] = useState([]);
	const [goldCustomers, setGoldCustomers] = useState([]);
	const [isChitLoading, setIsChitLoading] = useState(false);
	const [isGoldLoading, setIsGoldLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("CHIT");
	const [search, setSearch] = useState("");

	useEffect(() => {
		const fetchCustomers = async () => {
			const currentUrl =
				activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
			try {
				if (activeTab === "CHIT") {
					setIsChitLoading(true);
				} else {
					setIsGoldLoading(true);
				}
				const response = await axios.get(
					`${currentUrl}/user/get-users-by-agent-id/${user.userId}`
				);
				if (response.status >= 400)
					throw new Error("Failed to fetch Customer Data");

				if (activeTab === "CHIT") {
					setChitCustomers(response.data);
				} else {
					setGoldCustomers(response.data);
				}
			} catch (err) {
				console.log(err, "error");
				if (activeTab === "CHIT") {
					setChitCustomers([]);
				} else {
					setGoldCustomers([]);
				}
			} finally {
				if (activeTab === "CHIT") {
					setIsChitLoading(false);
				} else {
					setIsGoldLoading(false);
				}
			}
		};
		fetchCustomers();
	}, [activeTab, user]);

	useFocusEffect(
		useCallback(() => {
			const fetchCustomersOnFocus = async () => {
				const currentUrl =
					activeTab === "CHIT" ? `${baseUrl}` : "http://13.60.68.201:3000/api";
				try {
					if (activeTab === "CHIT") {
						setIsChitLoading(true);
					} else {
						setIsGoldLoading(true);
					}
					const response = await axios.get(
						`${currentUrl}/user/get-users-by-agent-id/${user.userId}`
					);
					if (response.status >= 400)
						throw new Error("Failed to fetch Customer Data");

					if (activeTab === "CHIT") {
						setChitCustomers(response.data);
					} else {
						setGoldCustomers(response.data);
					}
				} catch (err) {
					console.log(err, "error");
					if (activeTab === "CHIT") {
						setChitCustomers([]);
					} else {
						setGoldCustomers([]);
					}
				} finally {
					if (activeTab === "CHIT") {
						setIsChitLoading(false);
					} else {
						setIsGoldLoading(false);
					}
				}
			};
			fetchCustomersOnFocus();
		}, [activeTab, user])
	);

	const renderCustomerCard = ({ item }) => (
		<View style={styles.card}>
			<View style={styles.leftSection}>
				<Text style={styles.name}>{item.full_name}</Text>
				<Text style={styles.phoneNumber}>{item.phone_number}</Text>
				<Text style={styles.schemeType}>
					{item.scheme_type ? item.scheme_type.charAt(0).toUpperCase() + item.scheme_type.slice(1) : ''}
				</Text>
			</View>
			<View style={styles.rightSection}>
				<TouchableOpacity onPress={() => sendWhatsappMessage(item)}>
					<Icon name="whatsapp" size={24} color="#25D366" style={{ marginBottom: 10 }} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => openDialer(item)}>
					<Icon name="phone" size={24} color={COLORS.primary} />
				</TouchableOpacity>
			</View>
		</View>
	);

	const customers = activeTab === "CHIT" ? chitCustomers : goldCustomers;
	const isLoading = activeTab === "CHIT" ? isChitLoading : isGoldLoading;

	const filteredCustomers = customers.filter(customer =>
		customer.full_name.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
			<LinearGradient
				 colors={['#dbf6faff', '#90dafcff']}
				style={styles.gradientOverlay}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			>
				<View style={{ flexGrow: 1, marginHorizontal: 22, marginTop: 12 }}>
					<Header />
					<View style={styles.titleContainer}>
						<Text style={styles.title}>Customers</Text>
						<Text style={styles.totalCountText}>{filteredCustomers.length || 0}</Text>
					</View>
					<View style={styles.searchContainer}>
						<Icon name="search" size={20} color="#666" style={styles.searchIcon} />
						<TextInput
							style={styles.searchInput}
							placeholder="Search..."
							value={search}
							onChangeText={setSearch}
						/>
					</View>
					<View style={styles.tabContainer}>
						<TouchableOpacity
							style={[styles.tab, activeTab === "CHIT" && styles.activeTab]}
							onPress={() => setActiveTab("CHIT")}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === "CHIT" && styles.activeTabText,
								]}
							>
								Chit Customers
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.tab, activeTab === "GOLD" && styles.activeTab]}
							onPress={() => setActiveTab("GOLD")}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === "GOLD" && styles.activeTabText,
								]}
							>
								Gold Customers
							</Text>
						</TouchableOpacity>
					</View>
					<View style={{ minHeight: 200, flex: 1 }}>
						{isLoading && <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />}
						{!isLoading && filteredCustomers.length > 0 && (
							<FlatList
								data={filteredCustomers}
								keyExtractor={(item, index) => index.toString()}
								renderItem={renderCustomerCard}
							/>
						)}
						{!isLoading && filteredCustomers.length === 0 && (
							<View style={styles.noDataContainer}>
								<Image source={noImage} style={styles.noImage} />
								<Text style={styles.noDataText}>No customers found</Text>
							</View>
						)}
					</View>
				</View>
			</LinearGradient>
			<TouchableOpacity
				onPress={() => navigation.navigate("AddCustomer", { user: user })}
				style={{
					position: "absolute",
					bottom: 20,
					right: 20,
					backgroundColor: COLORS.primary,
					borderRadius: 30,
					width: 60,
					height: 60,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
					+ Add
				</Text>
			</TouchableOpacity>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	gradientOverlay: {
		flex: 1,
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 10,
		marginTop: 20,
		marginBottom: 20,
	},
	title: {
		fontSize: 26,
		fontWeight: 'bold',
		color: '#333',
	},
	totalCountText: {
		fontSize: 26,
		fontWeight: 'bold',
		color: '#333',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.7)',
		borderRadius: 15,
		paddingHorizontal: 15,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},
	searchIcon: {
		marginRight: 10,
	},
	searchInput: {
		flex: 1,
		height: 50,
	},
	tabContainer: {
		flexDirection: "row",
		backgroundColor: "rgba(255, 255, 255, 0.7)",
		borderRadius: 15,
		marginBottom: 10,
		padding: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},
	tab: {
		flex: 1,
		paddingVertical: 10,
		alignItems: "center",
		borderRadius: 12,
	},
	activeTab: {
		backgroundColor: '#da8201',
	},
	tabText: {
		fontSize: 16,
		color: "#666",
		fontWeight: "500",
	},
	activeTabText: {
		color: '#333',
		fontWeight: 'bold',
	},
	card: {
		backgroundColor: "rgba(255, 255, 255, 0.7)",
		flexDirection: "row",
		justifyContent: 'space-between',
		padding: 15,
		marginVertical: 5,
		borderRadius: 15,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		alignItems: 'center',
	},
	leftSection: {
		flex: 1,
	},
	rightSection: {
		alignItems: "flex-end",
		flexDirection: 'row',
		gap: 15,
	},
	name: {
		fontSize: 18,
		fontWeight: "600",
		color: "#000",
		marginBottom: 5,
	},
	phoneNumber: {
		fontSize: 14,
		color: "#666",
	},
	schemeType: {
		fontSize: 14,
		color: "#000",
		fontWeight: "500",
		marginTop: 5,
	},
	noDataContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 50,
	},
	noDataText: {
		fontSize: 14,
		color: '#555',
		textAlign: 'center',
	},
	noImage: {
		width: 250,
		height: 150,
		resizeMode: 'contain',
		marginBottom: 20,
	}
});

export default ViewCustomer;