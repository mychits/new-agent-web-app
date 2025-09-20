// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
// import Home from "../screens/Home";
// import Dashboard from "../screens/Dashboard"; // Import the new Dashboard screen
// import COLORS from "../constants/color";
// import PaymentNavigator from "./PaymentNavigator";
// import ProfileNavigator from "./ProfileNavigator";
// import { enableScreens } from "react-native-screens";
// enableScreens();

// const Tab = createBottomTabNavigator();

// const screenOptions = {
// 	tabBarShowLabel: false,
// 	headerShown: false,
// 	tabBarHideOnKeyboard: true,
// 	tabBarStyle: {
// 		position: "absolute",
// 		bottom: 0,
// 		right: 0,
// 		left: 0,
// 		elevation: 0,
// 		height: 45,
// 		 backgroundColor: '#e29f39ff',
// 	},
// };

// const BottomNavigation = ({ route }) => {
// 	const { user, agentInfo } = route.params;

// 	return (
		
// 		<Tab.Navigator screenOptions={screenOptions}>
// 			<Tab.Screen
// 				name="Home"
// 				component={Home}
// 				initialParams={{ user, agentInfo }}
// 				options={{
// 					tabBarIcon: ({ focused }) => (
// 						<MaterialCommunityIcons
// 							name={focused ? "home" : "home-outline"}
// 							size={34}
// 							color={COLORS.black}
// 						/>
// 					),
// 				}}
// 			/>
//             {/* Added the new Dashboard screen */}
// 			<Tab.Screen
// 				name="Dashboard"
// 				component={Dashboard}
// 				initialParams={{ user, agentInfo }}
// 				options={{
// 					tabBarIcon: ({ focused }) => (
// 						<MaterialCommunityIcons
// 							name={focused ? "view-dashboard" : "view-dashboard-outline"}
// 							size={26}
// 							color={COLORS.black}
// 						/>
// 					),
// 				}}
// 			/>
// 			<Tab.Screen
// 				name="PaymentNavigator"
// 				component={PaymentNavigator}
// 				initialParams={{ user, agentInfo }}
// 				options={{
// 					tabBarIcon: ({ focused }) => (
// 						<Ionicons
// 							name={focused ? "document" : "document-outline"}
// 							size={26}
// 							color={COLORS.black}
// 						/>
// 					),
// 				}}
// 			/>
// 			<Tab.Screen
// 				name="ProfileNavigator"
// 				component={ProfileNavigator}
// 				initialParams={{ user, agentInfo }}
// 				options={{
// 					tabBarIcon: ({ focused }) => (
// 						<Ionicons
// 							name={focused ? "person" : "person-outline"}
// 							size={26}
// 							color={COLORS.black}
// 						/>
// 					),
// 				}}
// 			/>
// 		</Tab.Navigator>
		
// 	);
// };

// export default BottomNavigation;








import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import Home from "../screens/Home";
import Dashboard from "../screens/Dashboard"; 
import COLORS from "../constants/color";
import PaymentNavigator from "./PaymentNavigator";
import ProfileNavigator from "./ProfileNavigator";
import { enableScreens } from "react-native-screens";
enableScreens();

const Tab = createBottomTabNavigator();

const screenOptions = {
  tabBarShowLabel: false,
  headerShown: false,
  tabBarHideOnKeyboard: true,
  tabBarStyle: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    elevation: 0,
    height: 90,
    backgroundColor: "#c9720fff",
  },
};

const BottomNavigation = ({ route }) => {
  const { user, agentInfo } = route.params;

  // Helper to hide tab bar on certain screens
  const getTabBarStyle = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? "";

    // Add any screen names where you want to hide the bottom tab
    if (
      routeName === "ViewLeads" ||
      routeName === "Customer" ||
      routeName === "ViewEnrollments" ||
      routeName === "Reports" ||
      routeName === "Commissions" ||
      routeName === "Enrollment"
    ) {
      return { display: "none" };
    }

    return {
      position: "absolute",
      bottom: 200,
      right: 0,
      left: 0,
      elevation: 0,
      height: 800,
      
    };
  };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={Home}
        initialParams={{ user, agentInfo }}
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={30}
              color={COLORS.black}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        initialParams={{ user, agentInfo }}
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "view-dashboard" : "view-dashboard-outline"}
              size={28}
              color={COLORS.black}
            />
          ),
        }}
      />
   
	  <Tab.Screen
				name="PaymentNavigator"
				component={PaymentNavigator}
				initialParams={{ user, agentInfo }}
				options={{
					tabBarIcon: ({ focused }) => (
						<Ionicons
							name={focused ? "document" : "document-outline"}
							size={28}
							color={COLORS.black}
						/>
					),
				}}
			/>

    

      <Tab.Screen
				name="ProfileNavigator"
				component={ProfileNavigator}
				initialParams={{ user, agentInfo }}
				options={{
					tabBarIcon: ({ focused }) => (
						<Ionicons
							name={focused ? "person" : "person-outline"}
							size={28}
							color={COLORS.black}
						/>
					),
				}}
			/>
		
    </Tab.Navigator>
  );
};

export default BottomNavigation;
