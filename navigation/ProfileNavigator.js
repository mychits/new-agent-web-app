// screens/ItemList.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Profile from "../screens/Profile";
import { enableScreens } from 'react-native-screens';
enableScreens();

const stack = createNativeStackNavigator();

const ProfileNavigator = ({ route }) => {
  const { user } = route.params;

  return (
    <stack.Navigator>
      <stack.Screen
        name="Profile"
        component={Profile}
        initialParams={{ user }}
        options={{ headerShown: false }}
      />
    </stack.Navigator>
  );
};

export default ProfileNavigator;
