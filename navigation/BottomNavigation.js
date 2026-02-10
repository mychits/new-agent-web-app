import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import Home from "../screens/Home";
import Dashboard from "../screens/Dashboard";
import PaymentNavigator from "./PaymentNavigator";
import ProfileNavigator from "./ProfileNavigator";
import { enableScreens } from "react-native-screens";
import Attendence from "../screens/Attendence";
import { View, TouchableOpacity, StyleSheet } from "react-native"; 

enableScreens();

const Tab = createBottomTabNavigator();

const INACTIVE_COLOR = "#A2B2A7"; 
const ACTIVE_COLOR = "#f8c009ff"; 
const FAB_BACKGROUND_COLOR = "#f8c009ff"; 
const ICON_COLOR_ON_FAB = "#FFFFFF"; 
const BACKGROUND_COLOR = "#445C4B"; 
const FAB_BORDER_COLOR = "#FFFFFF"; 

const BottomNavigation = ({ route }) => {
  const { user, agentInfo } = route.params;

  // The condition check
  const hasCollectionPermission = agentInfo?.designation_id?.permission?.collection === "true";

  const getTabBarStyle = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? "";
    if (["ViewLeads", "Customer", "ViewEnrollments", "Reports", "Commissions", "Enrollment"].includes(routeName)) {
      return { display: "none" };
    }
    return null;
  };

  const ArchIcon = ({ focused, name, size, IconComponent }) => (
    <View style={{ alignItems: 'center', paddingTop: 8 }}>
        <IconComponent
            name={name}
            size={size}
            color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
        {focused && (
            <View style={{
                height: 3,
                width: 20,
                backgroundColor: ACTIVE_COLOR,
                borderRadius: 2,
                marginTop: 6, 
            }} />
        )}
    </View>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: "absolute",
          bottom: 25, 
          right: 15,
          left: 15,
          elevation: 15, 
          height: 75, 
          borderRadius: 40, 
          backgroundColor: BACKGROUND_COLOR, 
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        initialParams={{ user, agentInfo }}
        options={({ route }) => ({
          tabBarStyle: getTabBarStyle(route),
          tabBarIcon: ({ focused }) => (
            <ArchIcon
              focused={focused}
              name={focused ? "home-variant" : "home-variant-outline"}
              size={28}
              IconComponent={MaterialCommunityIcons}
            />
          ),
        })}
      />

      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        initialParams={{ user, agentInfo }}
        options={({ route }) => ({
          tabBarStyle: getTabBarStyle(route),
          tabBarIcon: ({ focused }) => (
            <ArchIcon
              focused={focused}
              name={focused ? "chart-areaspline" : "chart-areaspline-variant"}
              size={28}
              IconComponent={MaterialCommunityIcons}
            />
          ),
        })}
      />

 <Tab.Screen
  name="Attendence"
  component={Attendence}
  initialParams={{ user, agentInfo }}
  options={{
    tabBarButton: (props) => (
      <TouchableOpacity 
        style={styles.centerFab} 
        // Use the onPress passed in from React Navigation props
        onPress={props.onPress} 
      >
        <View style={styles.centerFabInner}>
          <MaterialCommunityIcons 
            name="calendar-clock" 
            size={32} 
            color={ICON_COLOR_ON_FAB} 
          />
        </View>
      </TouchableOpacity>
    ),
  }}
  // REMOVED the e.preventDefault() listener that was blocking the click
/>

      <Tab.Screen
        name="PaymentNavigator"
        component={PaymentNavigator}
        initialParams={{ user, agentInfo }}
        options={({ route }) => ({
          tabBarStyle: getTabBarStyle(route),
          tabBarIcon: ({ focused }) => (
            <ArchIcon
              focused={focused}
              name={focused ? "wallet" : "wallet-outline"}
              size={28}
              IconComponent={Ionicons}
            />
          ),
        })}
        listeners={{
          tabPress: (e) => {
            // If permission is not "true", stop the click from doing anything
            if (!hasCollectionPermission) {
              e.preventDefault();
            }
          },
        }}
      />

      <Tab.Screen
        name="ProfileNavigator"
        component={ProfileNavigator}
        initialParams={{ user, agentInfo }}
        options={({ route }) => ({
          tabBarStyle: getTabBarStyle(route),
          tabBarIcon: ({ focused }) => (
            <ArchIcon
              focused={focused}
              name={focused ? "settings" : "settings-outline"}
              size={28}
              IconComponent={Ionicons}
            />
          ),
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  centerFab: { top: -20, justifyContent: 'center', alignItems: 'center' },
  centerFabInner: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: FAB_BACKGROUND_COLOR,
    justifyContent: 'center', alignItems: 'center', elevation: 18, borderWidth: 5, borderColor: FAB_BORDER_COLOR,
  }
});

export default BottomNavigation;