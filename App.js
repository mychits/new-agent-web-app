import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigation from "./navigation/appNavigation";
import "react-native-gesture-handler";
import { enableScreens } from 'react-native-screens';
import { AgentContextProvider } from "./context/AgentContextProvider";
enableScreens();

export default function App() {

  return (
    <AgentContextProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppNavigation />
      </GestureHandlerRootView>
    </AgentContextProvider>
  );
}
