
import { View, Image } from "react-native";

import { Feather, Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; // Import navigation and route hooks

const Header = () => {
  const navigation = useNavigation(); // Access navigation object
  const route = useRoute(); // Access the current route

  const isHomeScreen = route.name === "Home"; // Check if current screen is Home

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {!isHomeScreen && (
        <TouchableOpacity onPress={() => navigation.goBack()} >
          <Ionicons name="chevron-back-outline" size={30} color={"Black"} />
        </TouchableOpacity>
      )}
      <Image
        source={require("../assets/hero1.jpg")}
        resizeMode="contain"
        style={{
          width: 95,
          height: 42,
          marginLeft: 'auto',
        }}
      />
    </View>
  );
};

export default Header;
