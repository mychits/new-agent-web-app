import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";

const CustomerOnHold = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomersOnHold = async () => {
      try {
        const agentId = '67a9dbcb2f3189bb854e8af6'; 
        const apiUrl = `http://51.21.197.152:3000/api/enroll/holded?agent=${agentId}`;
        const response = await axios.get(apiUrl);
        
        const formattedCustomers = response.data.map(item => ({
          id: item.user_id._id,
          name: item.user_id.full_name,
          groupName: item.group_id.group_name,
          phoneNumber: item.user_id.phone_number,
          email: item.user_id.email,
        }));
        
        setCustomers(formattedCustomers);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        setError("Failed to load customer information. Please check your network and try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomersOnHold();
  }, []);

  const handleCall = async (phoneNumber) => {
    try {
      const url = `tel:${phoneNumber}`;
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open phone dialer:", error);
      Alert.alert("Error", "Could not open phone dialer.");
    }
  };

  const handleEmail = async (email) => {
    try {
      const url = `mailto:${email}`;
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open email client:", error);
      Alert.alert("Error", "Could not open email client.");
    }
  };

  const handleWhatsApp = async (phoneNumber) => {
    try {
      const url = `whatsapp://send?phone=${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on this device.");
      }
    } catch (error) {
      console.error("Failed to open WhatsApp:", error);
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  const renderCustomerCard = (customer) => (
    <View key={customer.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{customer.name}</Text>
        <Text style={styles.groupType}>Chit</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.groupName}>{customer.groupName}</Text>
        <Text style={styles.phoneNumber}>Phone: {customer.phoneNumber}</Text>
        
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.contactButton, styles.callButton]}
          onPress={() => handleCall(customer.phoneNumber)}
        >
          <Ionicons name="call" size={15} color="#fff" />
          <Text style={styles.buttonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.contactButton, styles.whatsappButton]}
          onPress={() => handleWhatsApp(customer.phoneNumber)}
        >
          <FontAwesome5 name="whatsapp" size={15} color="#fff" />
          <Text style={styles.buttonText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.contactButton, styles.emailButton]}
          onPress={() => handleEmail(customer.email)}
        >
          <MaterialCommunityIcons name="email" size={15} color="#fff" />
          <Text style={styles.buttonText}>Email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#dbf6faff', '#90dafcff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.mainContentArea}>
          <Header />
          <Text style={styles.screenTitle}>Customers On Hold</Text>
          <Text style={styles.instructionText}>
            Follow up with these customers to resolve their hold status.
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
          ) : error ? (
            <Text style={styles.statusText}>{error}</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.cardsScrollViewContent}>
              {customers.length > 0 ? (
                customers.map(renderCustomerCard)
              ) : (
                <Text style={styles.statusText}>No customers currently on hold.</Text>
              )}
            </ScrollView>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
  },
  mainContentArea: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 20,
    marginBottom: 5,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 25,
    textAlign: "center",
  },
  loader: {
    marginTop: 50,
  },
  statusText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
  cardsScrollViewContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#e8f4faff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    borderLeftWidth: 5,
    borderColor: "#da8201",
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  groupType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardBody: {
    marginBottom: 15,
  },
  groupName: {
    fontSize: 16,
    color: "#777",
    fontWeight: "400",
  },
  phoneNumber: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
    marginTop: 5,
  },
  createdDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
    marginTop: 10,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    gap: 8,
  },
  callButton: {
    backgroundColor: '#ff8c00',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  emailButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CustomerOnHold;