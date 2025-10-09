import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const Attendence = ({ navigation, route }) => {
  const [isMarked, setIsMarked] = useState(false);
  const handleMarkAttendance = () => {
    setIsMarked(true);
    Alert.alert("Success", "Attendance marked successfully!");
    // -----------------------------------
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#dbf6faff", "#90dafcff"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.container}>
          
          <Text style={styles.title}>Daily Attendance</Text>
          <Text style={styles.dateText}>
            Today is: {new Date().toLocaleDateString()}
          </Text>

          {isMarked ? (
            <View style={styles.statusContainer}>
              <Text style={styles.markedText}>
                Attendance already marked for today.
              </Text>
              <Text style={styles.timeText}>
                Marked at: {new Date().toLocaleTimeString()}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.markButton}
              onPress={handleMarkAttendance}
              activeOpacity={0.8}
            >
              <Text style={styles.markButtonText}>
                Mark Present
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 40,
  },
  markButton: {
    backgroundColor: '#00BFFF', // A bright blue color
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#E8F5E9', // Light green for marked status
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  markedText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  timeText: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  backButton: {
    marginTop: 40,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00BFFF',
    textDecorationLine: 'underline',
  }
});

export default Attendence;