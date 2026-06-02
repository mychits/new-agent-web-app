import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigation from "./navigation/appNavigation";
import "react-native-gesture-handler";
import { enableScreens } from 'react-native-screens';
import { AgentContextProvider } from "./context/AgentContextProvider";
import { Platform, useWindowDimensions, View } from "react-native";
enableScreens();

export default function App() {
  const { width, height } = useWindowDimensions();

  const isDesktop = Platform.OS === "web" && width >= 1024;
  return (
    <AgentContextProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
     <View
  style={{
    flex: 1,
    backgroundColor: isDesktop ? "#e5e7eb" : "#fff",
    alignItems: isDesktop ? "center" : "stretch",
  }}
>
  <View
    style={{
      flex: 1,
      width: isDesktop ? 500 : "100%",
      backgroundColor: "#fff",

      borderRadius: isDesktop ? 32 : 0,
      overflow: "hidden",

      ...(isDesktop && {
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
      }),
    }}
  >
    <AppNavigation />
  </View>
</View>
      </GestureHandlerRootView>
    </AgentContextProvider>
  );
}
