// screens/ItemList.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Routes from "../screens/Routes";
import RouteCustomerChit from "../screens/RouteCustomerChit";
import RouteCustomerGold from "../screens/RouteCustomerGold";
import RouteCustomerLoan from "../screens/RouteCustomerLoan";
import RouteCustomerPigme from "../screens/RouteCustomerPigme";
import PigmePayin from "../screens/PigmePayin";
import Payin from "../screens/Payin";
import { enableScreens } from "react-native-screens";
import LoanPayin from "../screens/LoanPayin";
import Print from "../screens/Print";
import GoldPayin from "../screens/GoldPayin";
import GoldPrint from "../screens/GoldPrint";
import LoanPrint from "../screens/LoanPrint";
import PaymentList from "../screens/PaymentList";
import ChitPayments from "../screens/ChitPayments";
import Reprint from "../screens/Reprint";
import PigmePrint from "../screens/PigmePrint";


enableScreens();

const stack = createNativeStackNavigator();

const ScannerNavigator = ({ route }) => {
	const { user, store_id } = route.params;

	return (
		<stack.Navigator>
			<stack.Screen
				name="Routes"
				component={Routes}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
				<stack.Screen
				name="LoanPayin"
				component={LoanPayin}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
				<stack.Screen
				name="PigmePayin"
				component={PigmePayin}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="RouteCustomerChit"
				component={RouteCustomerChit}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
			name="RouteCustomerLoan"
			component={RouteCustomerLoan}
			initialParams={{ user }}
			options={{ headerShown:false}}
			 />

			<stack.Screen
				name="RouteCustomerGold"
				component={RouteCustomerGold}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="Payin"
				component={Payin}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="GoldPayin"
				component={GoldPayin}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="RouteCustomerPigme"
				component={RouteCustomerPigme}
				initialParams={{ user }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="Print"
				component={Print}
				initialParams={{ user, store_id }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="Reprint"
				component={Reprint}
				initialParams={{ user, store_id }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="GoldPrint"
				component={GoldPrint}
				initialParams={{ user, store_id }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="LoanPrint"
				component={LoanPrint}
				initialParams={{ user, store_id }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="PigmePrint"
				component={PigmePrint}
				initialParams={{ user, store_id }}
				options={{ headerShown: false }}
			/>
			<stack.Screen
				name="ChitPayment"
				component={ChitPayments}
				initialParams={{ user, store_id }}
				options={{ headerShown: false }}
			/>
				
			
		</stack.Navigator>
	);
};

export default ScannerNavigator;