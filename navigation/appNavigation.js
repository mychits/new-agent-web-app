import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../screens/Home";
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
import Rewards from "../screens/Rewards";
import ResetPassword from "../screens/ResetPassword";
import MyTaskListScreen from '../screens/MyTaskListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import CompleteTaskScreen from '../screens/CompleteTaskScreen';
import EnrolledGroups from '../screens/EnrolledGroups';
import Becomeanagent from '../screens/Becomeanagent';
import Register from "../screens/Register";
import AboutMyChits from "../screens/AboutMyChits";
import LoanPayin from "../screens/LoanPayin";
import PigmePayin from "../screens/PigmePayin";
import PaymentLinkRoutes from "../screens/PaymentLinkRoutes";
import CustomerPaymentLink from "../screens/CustomerPaymentLink";
import EnrollCustomer from "../screens/EnrollCustomer";
import HelpAndSupport from "../screens/HelpAndSupport";
import Commissions from "../screens/Commissions";
import Target from "../screens/Target";
import LogOut from "../screens/LogOut";
import Dashboard from "../screens/Dashboard";
import CustomerOnHold from "../screens/CustomerOnHold";
import MonthlyTurnover from "../screens/MonthlyTurnover";
import EditLead from "../screens/EditLead";
import QrCodePage from "../screens/QrCodePage";
import LoanPayments from "../screens/LoanPayments";
import PigmePayments from "../screens/PigmePayments";
import MyCommission from "../screens/MyCommission";
import ViewEnrollments from "../screens/ViewEnrollments";
import ExpectedCommissions from "../screens/ExpectedCommissions";
import Attendence from "../screens/Attendence"; 

import RelationshipManagerReport from "../screens/RelationshipManagerReport";
import ReferredReport from "../screens/ReferredReport";
import Due from "../screens/Due";
import OutstandingReports from "../screens/OutstandingReports";
import RouteCustomerGold from "../screens/RouteCustomerGold";
import RouteCustomerLoan from "../screens/RouteCustomerLoan";
import RouteCustomerPigme from "../screens/RouteCustomerPigme";
import RouteCustomerChit from "../screens/RouteCustomerChit";
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

      <Stack.Navigator initialRouteName="Login">
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
          name="Login"
          options={{ headerShown: false }}
          component={Login}
        />
        <Stack.Screen
          name="MonthlyTurnover"
          component={MonthlyTurnover}
          options={{ headerShown: false }}
        />
          <Stack.Screen
          name="Rewards"
          component={Rewards}
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
          <Stack.Screen name="MyCommission" component={MyCommission} options={{headerShown: false}}/>
           <Stack.Screen name="ViewEnrollments" component={ViewEnrollments} options={{headerShown: false}} />

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
        name= "PaymentLinkRoutes"
        options={{headerShown: false}}
        component={PaymentLinkRoutes}
        />
        <Stack.Screen
        name= "CustomerPaymentLink"
        options={{headerShown: false}}
        component={CustomerPaymentLink}
        />
          <Stack.Screen
          name="OutstandingReports"
          options={{ headerShown: false }}
          component={OutstandingReports}
          />
          <Stack.Screen name="EnrollCustomer" options={{headerShown: false}} component={EnrollCustomer} />
          <Stack.Screen name="EnrolledGroups" options={{headerShown: false}} component={EnrolledGroups} />
            <Stack.Screen name="LoanPayin" options={{headerShown: false}} component={LoanPayin} />
          <Stack.Screen
          name="RelationshipManagerReport"
          options={{ headerShown: false }}
          component={RelationshipManagerReport}
          />
          <Stack.Screen
          name="ReferredReport"
          options={{ headerShown: false }}
          component={ReferredReport}
          />
          <Stack.Screen name="RouteCustomerChit" options={{headerShown: false}} component={RouteCustomerChit}/>

           <Stack.Screen name="RouteCustomerLoan" options={{headerShown: false}} component={RouteCustomerLoan}/>
            <Stack.Screen name="RouteCustomerGold" options={{headerShown: false}} component={RouteCustomerGold}/>
             <Stack.Screen name="RouteCustomerPigme" options={{headerShown: false}} component={RouteCustomerPigme}/>



          <Stack.Screen name="Attendance" component={Attendence} options={{headerShown: false}} />
          <Stack.Screen
          name="Due"
          options={{ headerShown: false }}
          component={Due}
          />
          <Stack.Screen name="LogOut" component={LogOut} options={{headerShown: false}} />
          <Stack.Screen name="ExpectedCommissions" component={ExpectedCommissions} options={{headerShown: false}} />
            <Stack.Screen name="PigmePayin" component={PigmePayin} options={{headerShown: false}} />
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