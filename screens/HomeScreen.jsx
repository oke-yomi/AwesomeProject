import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableHighlight,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Camera } from "expo-camera";
// import { Audio } from "expo-av";

const HomeScreen = ({ navigate }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [hasAudioPermission, setHasAudioPermission] = useState();

  const getCameraPermission = async () => {
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cameraStatus.status === "granted");
  };

//   const getAudioPermission = async () => {
//     await Audio.requestPermissionsAsync()
//       .then((permission) => {
//         setHasAudioPermission(permission.granted);
//       })
//       .catch((err) => console.log(err));
//   };

  useEffect(() => {
    getCameraPermission();
    // getAudioPermission();
  }, []);

  const handleJoinPress = async () => {
    if (hasCameraPermission) {
      navigate("RoomScreen");
    } else {
      console.log("Permission Not Granted!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <TouchableHighlight
          onPress={handleJoinPress}
          underlayColor="#143466"
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: "#2471ED",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 20, color: "#ffffff" }}>Join Room</Text>
        </TouchableHighlight>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
