import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../screens/Home";
import Welcome from "../screens/Welcome";
import Login from "../screens/Login";
import BottomNavigation from "./BottomNavigation"; // This component contains the tab navigator
import PaymentNavigator from "./PaymentNavigator";
import Enrollment from "../screens/Enrollment";
import Print from "../screens/Print";
import { enableScreens } from "react-native-screens";
import PaymentList from "../screens/PaymentList";
import PayNavigation from "./PayNavigation";
import { StatusBar } from "react-native";
import AddCustomer from "../screens/AddCustomer";
import ViewCustomer from "../screens/ViewCustomer";
import CustomerNavigation from "./CustomerNavigation";
import ForgotPassword from "../screens/ForgotPassword";
import ResetPassword from "../screens/ResetPassword";
import MyTaskListScreen from '../screens/MyTaskListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import CompleteTaskScreen from '../screens/CompleteTaskScreen';
import Becomeanagent from '../screens/Becomeanagent';
import Register from "../screens/Register";
import AboutMyChits from "../screens/AboutMyChits";
import HelpAndSupport from "../screens/HelpAndSupport";
import Commissions from "../screens/Commissions";
import Target from "../screens/Target";
import Dashboard from "../screens/Dashboard";
import CustomerOnHold from "../screens/CustomerOnHold";
import MonthlyTurnover from "../screens/MonthlyTurnover";
import EditLead from "../screens/EditLead";
import QrCodePage from "../screens/QrCodePage";
import LoanPayments from "../screens/LoanPayments";
import PigmePayments from "../screens/PigmePayments";
// NOTE: We import the file named 'Attendence.js' but rename the screen to 'Attendance'
import Attendence from "../screens/Attendence"; 

import GroupReport from "../screens/GroupReport";
import ReferredReport from "../screens/ReferredReport";
import Due from "../screens/Due";
import OutstandingReports from "../screens/OutstandingReports";

enableScreens();

const Stack = createNativeStackNavigator();

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <Stack.Navigator initialRouteName="Welcome">
        {/*
          Keep BottomNavigation as the main entry point for the app's logged-in state.
          The BottomNavigation component will internally handle the Home screen
          and other screens with tabs.
        */}
        <Stack.Screen
          name="BottomNavigation"
          component={BottomNavigation}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen
          name="Welcome"
          options={{ headerShown: false }}
          component={Welcome}
        />
        <Stack.Screen
          name="Login"
          options={{ headerShown: false }}
          component={Login}
        />
        {/* All other screens can remain here as they do not need the bottom tab bar */}
        <Stack.Screen
          name="MonthlyTurnover"
          component={MonthlyTurnover}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PayNavigation"
          component={PayNavigation}
          options={{ headerShown: false }}
        />
          <Stack.Screen
          name="LoanPayments"
          component={LoanPayments}
          options={{headerShown: false}}
          />

          <Stack.Screen
          name="PigmePayments"
          component={PigmePayments}
          options={{headerShown: false}}
          /> 
        <Stack.Screen
          name="qrCode"
          options={{ headerShown: false }}
          component={QrCodePage}
        />
        <Stack.Screen
          name="PaymentNavigator"
          options={{ headerShown: false }}
          component={PaymentNavigator}
        />
          <Stack.Screen
          name="OutstandingReports"
          options={{ headerShown: false }}
          component={OutstandingReports}
          />
          <Stack.Screen
          name="GroupReport"
          options={{ headerShown: false }}
          component={GroupReport}
          />
          <Stack.Screen
          name="ReferredReport"
          options={{ headerShown: false }}
          component={ReferredReport}
          />
          <Stack.Screen name="Attendance" component={Attendence} options={{headerShown: false}} />
          <Stack.Screen
          name="Due"
          options={{ headerShown: false }}
          component={Due}
          />
        <Stack.Screen
          name="CustomerOnHold"
          options={{ headerShown: false }}
          component={CustomerOnHold}
        />
        <Stack.Screen
          name="CustomerNavigation"
          options={{ headerShown: false }}
          component={CustomerNavigation}
        />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ headerShown: false }} />
        <Stack.Screen name="MyTasks" options={{ headerShown: false }} component={MyTaskListScreen} />
        <Stack.Screen name="Task Detail" component={TaskDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CompleteTask" options={{ headerShown: false }} component={CompleteTaskScreen} />
        <Stack.Screen name="ViewCustomer" component={ViewCustomer} options={{ headerShown: false }} />
        <Stack.Screen name="AddCustomer" component={AddCustomer} options={{ headerShown: false }} />
        <Stack.Screen name="Commissions" component={Commissions} options={{ headerShown: false }} />
        <Stack.Screen name="Becomeanagent" component={Becomeanagent} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
        <Stack.Screen name="AboutMyChits" component={AboutMyChits} options={{ headerShown: false }} />
        <Stack.Screen name="HelpAndSupport" component={HelpAndSupport} options={{ headerShown: false }} />
        <Stack.Screen name="Target" component={Target} options={{ headerShown: false }} />
        <Stack.Screen name="EditLead" component={EditLead} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }} />
        <Stack.Screen name="Enrollment" component={Enrollment} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}