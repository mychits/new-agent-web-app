import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Routes from "../screens/Routes";

import { enableScreens } from "react-native-screens";
import ViewCustomers from "../screens/ViewCustomer";
import AddCustomer from "../screens/AddCustomer";
import EnrollCustomer from "../screens/EnrollCustomer";
import ViewEnrollments from "../screens/ViewEnrollments";
import Commissions from "../screens/Commissions";
import ActualCommissions from "../screens/ActualCommissions";
import ExpectedCommissions from "../screens/ExpectedCommissions";
import EnrolledGroups from "../screens/EnrolledGroups";

import MyCommission from "../screens/MyCommission";

enableScreens();

const stack = createNativeStackNavigator();

const CustomerNavigation = ({ route }) => {
	const { user,commissions } = route.params;

	return (
		<stack.Navigator>
			<stack.Screen
				name="Customer"
				component={ViewCustomers}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="AddCustomer"
				component={AddCustomer}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="ViewEnrollments"
				component={ViewEnrollments}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>

			<stack.Screen
				name="EnrollCustomer"
				component={EnrollCustomer}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="EnrolledGroups"
				component={EnrolledGroups}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="Commissions"
				component={Commissions}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="ActualCommissions"
				component={ActualCommissions}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="ExpectedCommissions"
				component={ExpectedCommissions}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="MyCommission"
				component={MyCommission}
				initialParams={{ commissions }}
				options={{ headerShown: false }}
			/>
		</stack.Navigator>
	);
};

export default CustomerNavigation;
