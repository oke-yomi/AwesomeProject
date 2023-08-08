import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native";
import RoomScreen from "./screens/RoomScreen";
import HomeScreen from "./screens/HomeScreen";

export default function App() {
  const [joinRoom, setJoinRoom] = useState(false);

  const navigate = useCallback((screen) => {
    setJoinRoom(screen === "RoomScreen");
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EFF7FF" }}>
      <StatusBar style="auto" />

      {joinRoom ? (
        <RoomScreen navigate={navigate} />
      ) : (
        <HomeScreen navigate={navigate} />
      )}
    </SafeAreaView>
  );
}
