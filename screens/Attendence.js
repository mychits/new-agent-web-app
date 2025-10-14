import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, ScrollView, Image, Linking } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome"; 

import COLORS from "../constants/color"; 
import Header from "../components/Header"; 

// --- Configuration and Dummy Data ---
const attendanceData = {
  inOffice: { label: 'In Office', percentage: 63, color: '#3498db' }, // Primary Blue
  workFromHome: { label: 'Work from Home', percentage: 22, color: '#4bcffa' }, // Secondary Light Blue
  halfDay: { label: 'Half Day', percentage: 6, color: '#f1c40f' }, // Yellow
  onLeave: { label: 'On Leave', percentage: 9, color: '#e74c3c' }, // Red/Orange
};

// CONTACT CONSTANTS
const LEAVE_CONTACT = {
  email: 'info.mychits@gmail.com',
  phone: '9483900777', 
};

const CHART_SIZE = Dimensions.get('window').width * 0.5;
const PRIMARY_TEXT = '#2c3e50'; // Darker text for high contrast
const SECONDARY_TEXT = '#95a5a6'; // Softer text for details
const BACKGROUND_LIGHT = '#ecf0f1'; // Light background color

// Dummy data for the bar chart and employee cards
const barChartData = [
  { lastWeek: 50, thisWeek: 70, profile: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { lastWeek: 30, thisWeek: 45, profile: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { lastWeek: 60, thisWeek: 55, profile: 'https://randomuser.me/api/portraits/women/67.jpg' },
  { lastWeek: 40, thisWeek: 65, profile: 'https://randomuser.me/api/portraits/men/78.jpg' },
  { lastWeek: 20, thisWeek: 35, profile: 'https://randomuser.me/api/portraits/women/23.jpg' },
];

const employeeTimings = [
  {
    id: '1',
    name: 'Miracle Vetrovs',
    role: 'UX Designer - UXD3',
    profilePic: 'https://randomuser.me/api/portraits/men/32.jpg',
    lastWeekHrs: 36,
    thisWeekHrs: 38,
  },
  {
    id: '2',
    name: 'Makenna Aminoff',
    role: 'UX Designer - UXD3',
    profilePic: 'https://randomuser.me/api/portraits/women/44.jpg',
    lastWeekHrs: 32,
    thisWeekHrs: 34.30,
  },
];

// --- Helper Components ---
const LegendItem = ({ label, percentage, color, barWidth = 8, barHeight = 25 }) => (
  <View style={styles.legendItem}>
    {/* Enhanced Legend Bar style */}
    <View style={[styles.legendBar, { backgroundColor: color, width: barWidth, height: barHeight }]} />
    <View style={styles.legendTextContainer}>
      <Text style={styles.legendLabel}>{label}</Text>
      {percentage !== undefined && <Text style={styles.legendPercentage}>{percentage}%</Text>}
    </View>
  </View>
);

// --- Helper Components (New Condensed Item) ---
const CondensedLegendItem = ({ label, percentage, color }) => (
  <View style={styles.condensedLegendItem}>
    <View style={[styles.condensedBar, { backgroundColor: color }]} />
    <View style={styles.condensedTextWrapper}>
      <Text style={styles.condensedLabel}>{label}</Text>
      <Text style={styles.condensedPercentage}>{percentage}%</Text>
    </View>
  </View>
);

// --- Main Component ---
const AttendanceScreen = ({ navigation }) => {
    
  // Function to handle opening the email app
  const handleContactEmail = () => {
    const emailAddress = LEAVE_CONTACT.email;
    const url = `mailto:${emailAddress}?subject=Leave Request Inquiry&body=Dear HR Team,\n\nI am writing regarding my pending leave requests.`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.log("Don't know how to open URI: " + url);
          alert(`Email function not supported. Please email us at ${emailAddress}`);
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  // Function to handle opening the phone dialer (Not currently linked to a visible icon)
  const handleContactCall = () => {
    const phoneNumber = LEAVE_CONTACT.phone.replace(/ /g, '');
    const url = `tel:${phoneNumber}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.log("Don't know how to open URI: " + url);
          alert(`Call function not supported. Please call us at ${LEAVE_CONTACT.phone}`);
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };
    
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_LIGHT }}>
      <LinearGradient
        // RESTORED ORIGINAL GRADIENT COLORS
        colors={['#dbf6faff', '#90dafcff']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }} 
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.contentWrapper}>
            <Header />

            <View style={styles.customHeader}>
              <TouchableOpacity style={styles.headerIconContainer} onPress={() => console.log('Menu')}>
                <Icon name="bars" size={20} color={PRIMARY_TEXT} />
              </TouchableOpacity>
              <View style={styles.rightIcons}>
                <TouchableOpacity style={styles.headerIconContainer}>
                   <Icon name="envelope-o" size={20} color={PRIMARY_TEXT} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconContainer}>
                   <Icon name="comment-o" size={20} color={PRIMARY_TEXT} />
                </TouchableOpacity>
                {/* Profile Pic with small border */}
                <Image source={{ uri: employeeTimings[0].profilePic }} style={styles.profilePicPlaceholder} />
                <TouchableOpacity style={styles.headerIconContainer}>
                    <Icon name="chevron-down" size={14} color={PRIMARY_TEXT} />
                </TouchableOpacity>
              </View>
            </View>

            {/* --- Main Title and Pending Request Info (Tappable for Email) --- */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Leave & Attendance</Text>
              
              {/* This entire section is now the single contact touch target */}
              <TouchableOpacity onPress={handleContactEmail} activeOpacity={0.7} style={styles.pendingTouchTarget}>
                  <Text style={styles.subtitle}>
                      You have 2 leave requests pending.
                     
                  </Text>
              </TouchableOpacity>
            </View>

            {/* --- Attendance Dashboard Card (Pie Chart) --- */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>My Attendence</Text>
                  <Text style={styles.dateRange}>From 4-10 Sep, 2023</Text>
                </View>
                <TouchableOpacity style={styles.dropdownButton}>
                  <Text style={styles.dropdownText}>This Week <Icon name="chevron-down" size={10} color={PRIMARY_TEXT} /></Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chartArea}>
                <View style={[styles.donutChartPlaceholder, { width: CHART_SIZE, height: CHART_SIZE }]}>
                  <Text style={styles.chartCenterPercentage}>63%</Text>
                </View>
              </View>

              {/* REPLACED with CondensedLegendItem for visual match */}
              <View style={styles.legendContainer}>
                {/* Column 1: In Office & Work from Home */}
                <View style={styles.legendColumn}>
                  <CondensedLegendItem {...attendanceData.inOffice} />
                  <CondensedLegendItem {...attendanceData.workFromHome} />
                </View>
                {/* Column 2: Half Day & On Leave */}
                <View style={styles.legendColumn}>
                  <CondensedLegendItem {...attendanceData.halfDay} />
                  <CondensedLegendItem {...attendanceData.onLeave} />
                </View>
              </View>
              
            </View>

            {/* --- Timings Section (Bar Chart) --- */}
            <View style={[styles.card, styles.timingCard]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Timings</Text>
                  <Text style={styles.dateRange}>From 4-10 Sep, 2023</Text>
                </View>
                <TouchableOpacity style={styles.dropdownButton}>
                  <Text style={styles.dropdownText}>This Week <Icon name="chevron-down" size={10} color={PRIMARY_TEXT} /></Text>
                </TouchableOpacity>
              </View>

              {/* Bar Chart Placeholder */}
              <View style={styles.barChartContainer}>
                {barChartData.map((data, index) => (
                  <View key={index} style={styles.barColumn}>
                    <View style={styles.barWrapper}>
                      {/* Swapped bar order for visual hierarchy: This week (lighter blue) is slightly taller */}
                      <View style={[styles.bar, { height: data.lastWeek * 1.5, backgroundColor: attendanceData.inOffice.color }]} />
                      <View style={[styles.bar, { height: data.thisWeek * 1.5, backgroundColor: attendanceData.workFromHome.color }]} />
                    </View>
                    <Image source={{ uri: data.profile }} style={styles.barProfilePic} />
                  </View>
                ))}
                {/* Highlighted area placeholder */}
                <View style={styles.barChartHighlight} /> 
              </View>

              {/* Bar Chart Legend */}
              <View style={styles.barChartLegend}>
                <LegendItem label="Last week" color={attendanceData.inOffice.color} barWidth={15} barHeight={15} percentage={undefined} />
                <LegendItem label="This week" color={attendanceData.workFromHome.color} barWidth={15} barHeight={15} percentage={undefined} />
              </View>
            </View>

            {/* --- Individual Employee Timing Cards --- */}
            {employeeTimings.map(employee => (
              <View key={employee.id} style={[styles.card, styles.employeeTimingCard]}>
                <View style={styles.employeeHeader}>
                  <Image source={{ uri: employee.profilePic }} style={styles.employeeProfilePic} />
                  <View>
                    <Text style={styles.employeeName}>{employee.name}</Text>
                    <Text style={styles.employeeRole}>{employee.role}</Text>
                  </View>
                </View>
                <View style={styles.employeeHoursContainer}>
                  <View style={styles.employeeHourItem}>
                    <LegendItem label="Last week" color={attendanceData.inOffice.color} barWidth={12} barHeight={12} percentage={undefined} />
                    <Text style={styles.employeeHoursText}>{employee.lastWeekHrs} Hrs</Text>
                  </View>
                  <View style={styles.employeeHourItem}>
                    <LegendItem label="This week" color={attendanceData.workFromHome.color} barWidth={12} barHeight={12} percentage={undefined} />
                    <Text style={styles.employeeHoursText}>{employee.thisWeekHrs} Hrs</Text>
                  </View>
                </View>
              </View>
            ))}

          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// --- Stylesheets ---
const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  contentWrapper: {
    marginHorizontal: 22,
    marginTop: 52,
  },
  // --- Header Styles ---
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  headerIconContainer: {
    padding: 10, // Increased padding for touch target
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Slightly more opaque
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicPlaceholder: {
    width: 32, // Slightly larger
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#fff', // White border for emphasis
  },
  // --- Title Styles ---
  titleSection: {
    marginBottom: 30, 
  },
  mainTitle: {
    fontSize: 30, // Slightly larger title
    fontWeight: '900', // Extra bold title
    color: PRIMARY_TEXT,
  },
  pendingTouchTarget: {
    // Ensure the whole text area is tappable
    paddingVertical: 5,
  },
  subtitle: {
    fontSize: 14,
    color: SECONDARY_TEXT,
  },
  pendingCount: {
    fontWeight: 'bold',
    color: attendanceData.onLeave.color, 
  },
  // --- Card Styles (Advanced Shadow) ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 20, 
    padding: 20,
    // Layer 1: Stronger, but softer drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 20,
    borderColor: 'rgba(52, 152, 219, 0.1)', // Light blue tint on the border
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20, // Slightly larger
    fontWeight: '800',
    color: PRIMARY_TEXT,
  },
  dateRange: {
    fontSize: 13, // Slightly larger
    color: SECONDARY_TEXT,
    marginTop: 2,
  },
  dropdownButton: {
    paddingVertical: 8, // More vertical padding
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: BACKGROUND_LIGHT, 
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 12, // Slightly larger
    fontWeight: '600',
    color: PRIMARY_TEXT,
    marginRight: 5,
  },
  // --- Donut Chart Styles ---
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  donutChartPlaceholder: {
    borderRadius: CHART_SIZE / 2,
    borderWidth: 22, // Even thicker border
    borderColor: BACKGROUND_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chartCenterPercentage: {
    fontSize: 42, // Impactful size
    fontWeight: '900', // Stronger weight
    color: attendanceData.inOffice.color,
  },
  // --- Legend Styles (Original) ---
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10, 
  },
  legendColumn: {
    width: '48%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14, // Increased space
  },
  legendBar: {
    width: 13, 
    height: 30, // Taller bar
    borderRadius: 4,
    marginRight: 15,
    // Subtle shadow on the bar itself
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: 12, // Clearer font size
    color: PRIMARY_TEXT,
  },
  legendPercentage: {
    fontSize: 12, // Emphasize percentage
    fontWeight: '800',
    color: PRIMARY_TEXT,
  },
  // --- Condensed Legend Styles (NEW) ---
  condensedLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, 
    width: '100%', // Take up full width of the legendColumn
  },
  condensedBar: {
    width: 8, 
    height: 60, // Very tall bar
    borderRadius: 4,
    marginRight: 10,
  },
  condensedTextWrapper: {
    justifyContent: 'center',
  },
  condensedLabel: {
    fontSize: 16, 
    color: PRIMARY_TEXT,
    marginBottom: 4,
  },
  condensedPercentage: {
    fontSize: 24, // Large percentage for impact
    fontWeight: '900',
    color: PRIMARY_TEXT,
  },
  // --- Bar Chart Styles ---
  timingCard: {
    marginTop: 5, 
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed to space-between for cleaner look
    alignItems: 'flex-end',
    height: 150, 
    marginBottom: 15,
    position: 'relative',
    paddingHorizontal: 10, // Increased horizontal padding
  },
  barColumn: {
    alignItems: 'center',
  },
  barWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bar: {
    width: 12, // Slightly thinner bar
    borderRadius: 3,
    marginHorizontal: 2, 
  },
  barProfilePic: {
    width: 36, // Larger profile pic under the bar
    height: 36,
    borderRadius: 18,
    marginTop: 5,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  barChartHighlight: {
    position: 'absolute',
    right: '25%', 
    width: '20%', 
    height: '100%',
    backgroundColor: 'rgba(52, 152, 219, 0.1)', // Use a blue tint for highlight
    borderRadius: 10,
    zIndex: -1, 
  },
  barChartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
    paddingHorizontal: 15,
  },
  // --- Employee Timing Cards Styles ---
  employeeTimingCard: {
    padding: 18,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  employeeProfilePic: {
    width: 48, // Larger
    height: 48,
    borderRadius: 24,
    marginRight: 15,
    borderWidth: 3, // Thicker border
    borderColor: BACKGROUND_LIGHT,
  },
  employeeName: {
    fontSize: 18, // Clearer font size
    fontWeight: '700',
    color: PRIMARY_TEXT,
  },
  employeeRole: {
    fontSize: 14, // Clearer font size
    color: SECONDARY_TEXT,
    marginTop: 2,
  },
  employeeHoursContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
    paddingLeft: 5, 
  },
  employeeHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30, // More space
  },
  employeeHoursText: {
    fontSize: 19, // Largest size for metrics
    fontWeight: '900', // Strongest weight for metrics
    color: PRIMARY_TEXT,
    marginLeft: 8, 
  },
});

export default AttendanceScreen;