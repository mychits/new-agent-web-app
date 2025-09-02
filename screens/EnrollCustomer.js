import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	ToastAndroid,
	FlatList,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import COLORS from "../constants/color";
import Header from "../components/Header";
import Button from "../components/Button";
import chitBaseUrl from "../constants/baseUrl";
import goldBaseUrl from "../constants/goldBaseUrl";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";

const EnrollCustomer = ({ route, navigation }) => {
	const { user, customerPhoneNumber } = route.params;
	const [receipt, setReceipt] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [selectedCustomerType, setSelectedCustomerType] = useState("chits");
	const [agentCustomers, setAgentCustomers] = useState([]);
	const [filteredCustomers, setFilteredCustomers] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [showCustomerList, setShowCustomerList] = useState(false);
	const [groups, setGroups] = useState([]);
	const [availableTickets, setAvailableTickets] = useState([]);
	const baseUrl =
		selectedCustomerType === "chits" ? `${chitBaseUrl}` : `${goldBaseUrl}`;
	const [formFields, setFormFields] = useState({
		user_id: "",
		group_id: "",
		no_of_tickets: "",
		tickets: "",
	});
	const [customerDetails, setCustomerDetails] = useState(null);
	
	const [showPaymentButton, setShowPaymentButton] = useState(false);

	useEffect(() => {
		const fetchCustomerDetails = async () => {
			if (customerPhoneNumber) {
				try {
					const response = await axios.get(`${baseUrl}/user/get-user-by-phone/${customerPhoneNumber}`);
					if (response.status >= 400) throw new Error("Customer not found.");
					const fetchedCustomer = response.data;
					setCustomerDetails(fetchedCustomer);
					setFormFields(prev => ({ ...prev, user_id: fetchedCustomer._id }));
					setSearchQuery(fetchedCustomer.full_name);
				} catch (err) {
					console.error("Failed to load Customer Data by phone:", err);
					Alert.alert("Error", "Failed to fetch customer details. Please try again.");
				}
			}
		};
		fetchCustomerDetails();
	}, [customerPhoneNumber, baseUrl]);

	useEffect(() => {
		const fetchGroups = async () => {
			try {
				const response = await axios.get(`${baseUrl}/group/get-group`);
				if (response.status >= 400) throw new Error("Something went wrong!");
				setGroups(response.data);
			} catch (err) {
				console.error("Failed to load Group Data");
			}
		};
		fetchGroups();
	}, [selectedCustomerType]);
	
	useEffect(() => {
		const fetchAgentUsers = async () => {
			try {
				const response = await axios.get(`${baseUrl}/user/get-user`);
				if (response.status >= 400) throw new Error("Something went wrong");
				setAgentCustomers(response.data);
				setFilteredCustomers(response.data);
			} catch (err) {
				console.error("Failed to load Customers Data");
			}
		};
		fetchAgentUsers();
	}, [selectedCustomerType]);
	
	useEffect(() => {
		const fetchReceipt = async () => {
			try {
				const response = await axios.get(
					`${chitBaseUrl}/agent/get-agent-by-id/${user.userId}`
				);
				setReceipt(response.data);
			} catch (error) {
				console.error("Error fetching agent data:", error);
			}
		};
		fetchReceipt();
	}, []);
	
	const handleCancel = () => {
		Alert.alert("Confirmation", "Are you sure you want to Close?", [
			{
				text: "No",
			},
			{
				text: "Yes",
				onPress: () => {
					navigation.navigate("Home", { user: user });
				},
			},
		]);
	};
	
	const handleInputChange = async (field, value) => {
		setFormFields({ ...formFields, [field]: value });
		if (field === "group_id") {
			try {
				const response = await axios.post(
					`${baseUrl}/enroll/get-next-tickets/${value}`
				);
				if (response.status >= 400)
					throw new Error("Failed to fetch available tickets");
				setAvailableTickets(response.data.availableTickets);
			} catch (err) {
				console.error("Error fetching next tickets");
			}
		}
	};
	
	const handleSearchCustomer = (query) => {
		setSearchQuery(query);
		if (query === "") {
			setFilteredCustomers(agentCustomers);
		} else {
			const lowerCaseQuery = query.toLowerCase();
			const filteredData = agentCustomers.filter((customer) =>
				customer.full_name.toLowerCase().includes(lowerCaseQuery)
			);
			setFilteredCustomers(filteredData);
		}
	};

	const handleSelectCustomer = (customer) => {
		setCustomerDetails(customer);
		setFormFields({ ...formFields, user_id: customer._id });
		setSearchQuery(customer.full_name);
		setShowCustomerList(false);
	};
	
	const handleEnrollCustomer = async () => {
		if (!formFields.no_of_tickets || isNaN(formFields.no_of_tickets)) {
			ToastAndroid.showWithGravity(
				"Number of tickets cannot be empty or zero.",
				ToastAndroid.SHORT,
				ToastAndroid.CENTER
			);
			return;
		}
		if (Number(formFields.no_of_tickets) > availableTickets.length) {
			ToastAndroid.showWithGravity(
				"Number of Tickets is more than available tickets.",
				ToastAndroid.SHORT,
				ToastAndroid.CENTER
			);
			return;
		}
		if (
			!formFields.user_id ||
			!formFields.group_id ||
			!formFields.no_of_tickets
		) {
			Alert.alert("Required", "Please fill out all fields!");
			return;
		}

		if (!customerDetails || !customerDetails._id) {
			Alert.alert("Error", "Customer data not found. Please try again or go back.");
			return;
		}

		const userId = customerDetails._id;
		const { no_of_tickets, group_id } = formFields;
		const ticketsCount = parseInt(no_of_tickets, 10);
		setIsLoading(true);

		try {
			// Construct the payload for all tickets
			const enrollmentPromises = availableTickets.slice(0, ticketsCount).map(ticketNumber => {
				const payload = {
					user_id: userId,
					group_id: group_id,
					no_of_tickets: ticketsCount, // Pass the total number of tickets in each request
					tickets: ticketNumber, // The specific ticket number for this enrollment
					agent: user.userId,
				};
				console.log("Sending payload:", payload); // Log the payload to verify
				return axios.post(`${baseUrl}/enroll/add-enroll`, payload);
			});

			await Promise.all(enrollmentPromises);

			ToastAndroid.show("Customer Enrolled Successfully!", ToastAndroid.SHORT);
			setShowPaymentButton(true);
			
		} catch (error) {
			console.error("Error adding :", error);
			if (error.response) {
				console.error("Server responded with data:", error.response.data);
				console.error("Server responded with status:", error.response.status);
				Alert.alert("Error", `Failed to enroll customer. Server says: ${error.response.data.message || 'Unknown error'}`);
			} else if (error.request) {
				Alert.alert("Error", "No response from server. Please check your network connection.");
			} else {
				Alert.alert("Error", `Request Error: ${error.message}`);
			}
		} finally {
			setIsLoading(false);
		}
	};


	const handleProceedToPayment = () => {
		navigation.replace("PaymentScreen", { 
			user: { ...user }, 
			customer: { ...customerDetails, ...formFields } 
		});
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
					style={styles.container}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
				>
					<ScrollView contentContainerStyle={{ flexGrow: 1 }}>
						<View style={{ marginHorizontal: 22, marginTop: 12 }}>
							<Header />
							<View style={styles.titleContainer}>
								<Text style={styles.title}>
									Add Enrollment
								</Text>
								<TouchableOpacity
									onPress={handleCancel}
									style={styles.myLeadsButton}
								>
									<Text style={styles.myLeadsButtonText}>Skip</Text>
								</TouchableOpacity>
							</View>
							
							<View style={styles.contentBox}>
								<Text style={styles.label}>
									Customer Type
								</Text>
								<View style={styles.tabContainer}>
									<TouchableOpacity
										style={[styles.tab, selectedCustomerType === "chits" && styles.activeTab]}
										onPress={() => setSelectedCustomerType("chits")}
									>
										<Text style={[styles.tabText, selectedCustomerType === "chits" && styles.activeTabText]}>
											Chits
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.tab, selectedCustomerType === "goldChit" && styles.activeTab]}
										onPress={() => setSelectedCustomerType("goldChit")}
									>
										<Text style={[styles.tabText, selectedCustomerType === "goldChit" && styles.activeTabText]}>
											Gold Chits
										</Text>
									</TouchableOpacity>
								</View>
								<Text style={styles.label}>
									Groups
								</Text>
								<View style={styles.pickerContainer}>
									<Picker
										style={styles.picker}
										selectedValue={formFields.group_id}
										onValueChange={(value) =>
											handleInputChange("group_id", value)
										}
									>
										<Picker.Item label="Select Group" value={""} />
										{groups.map((group) => (
											<Picker.Item
												key={group._id}
												label={`${group?.group_name}`}
												value={group._id}
											/>
										))}
									</Picker>
								</View>
								
								{/* Customer Search Section */}
								<Text style={styles.label}>
									Customer
								</Text>
								<TextInput
									placeholder="Search or Select Customer"
									style={styles.textInput}
									value={searchQuery}
									onFocus={() => setShowCustomerList(true)}
									onChangeText={handleSearchCustomer}
								/>
								{showCustomerList && (
									<View style={styles.customerListContainer}>
										<FlatList
											data={filteredCustomers}
											keyExtractor={(item) => item._id}
											renderItem={({ item }) => (
												<TouchableOpacity
													style={styles.customerListItem}
													onPress={() => handleSelectCustomer(item)}
												>
													<Text>{item.full_name}</Text>
												</TouchableOpacity>
											)}
										/>
									</View>
								)}
								
								<Text style={styles.label}>
									Number of Tickets
								</Text>
								<TextInput
									placeholder="Enter Number of Tickets"
									style={styles.textInput}
									value={formFields.no_of_tickets}
									keyboardType="number-pad"
									onChangeText={(value) =>
										handleInputChange("no_of_tickets", value)
									}
								/>
								{formFields.group_id && (
									<Text
										style={{
											textAlign: "center",
											fontWeight: "bold",
											color: availableTickets.length > 0 ? "blue" : "red",
										}}
									>
										{availableTickets.length > 0
											? `Only ${availableTickets.length} tickets left`
											: "Group is Full"}
									</Text>
								)}
								<Button
									title={isLoading ? "Please wait..." : "Enroll Customer"}
									filled
									disabled={isLoading}
									style={{
										marginTop: 18,
										marginBottom: 4,
										backgroundColor: isLoading ? "gray" : COLORS.third,
									}}
									onPress={handleEnrollCustomer}
								/>
								{showPaymentButton && (
									<Button
										title="Proceed to Payment"
										filled
										style={{
											marginTop: 10,
											backgroundColor: COLORS.primary,
										}}
										onPress={handleProceedToPayment}
									/>
								)}
							</View>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</LinearGradient>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	gradientOverlay: {
		flex: 1,
	},
	container: {
		flex: 1,
	},
	titleContainer: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 10,
		marginTop: 20,
		marginBottom: 20,
	},
	title: {
		fontSize: 26,
		fontWeight: 'bold',
		color: '#333',
	},
	myLeadsButton: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		backgroundColor: COLORS.primary,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 5,
	},
	myLeadsButtonText: {
		color: COLORS.white,
		fontWeight: 'bold',
	},
	label: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginTop: 10,
	},
	textInput: {
		height: 50,
		width: "100%",
		backgroundColor: COLORS.white,
		borderColor: "#d0d0d0",
		borderWidth: 1,
		borderRadius: 15,
		paddingHorizontal: 15,
		marginVertical: 10,
		color: "#000",
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 3,
	},
	contentBox: {
		backgroundColor: COLORS.white,
		borderRadius: 20,
		padding: 20,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 5,
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
		marginTop: 10,
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
	pickerContainer: {
		backgroundColor: COLORS.white,
		borderRadius: 15,
		borderWidth: 1,
		borderColor: "#d0d0d0",
		marginVertical: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 3,
	},
	picker: {
		height: 50,
		width: "100%",
	},
	customerListContainer: {
		backgroundColor: '#fff',
		borderColor: '#d0d0d0',
		borderWidth: 1,
		borderRadius: 15,
		maxHeight: 200,
		marginTop: -10,
		marginBottom: 10,
		elevation: 3,
		zIndex: 10,
	},
	customerListItem: {
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
});

export default EnrollCustomer;