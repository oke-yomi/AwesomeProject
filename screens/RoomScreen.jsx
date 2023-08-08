import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Platform,
} from "react-native";
import React, { useRef } from "react";
import { MODERATOR_AUTH_TOKEN, MODERATOR_ROOM_CODE } from "../utils/constants";
import { ActivityIndicator } from "react-native";
import { TouchableHighlight } from "react-native";

const ROOM_CODE = MODERATOR_ROOM_CODE;
const AUTH_TOKEN = MODERATOR_AUTH_TOKEN;
const USERNAME = "Test User";

const RoomScreen = ({ navigate }) => {
  const hmsInstanceRef = useRef(null);

  const { peerTrackNodes, loading, leaveRoom } = usePeerTrackNodes({
    navigate,
    hmsInstanceRef,
  });

  const HmsView = hmsInstanceRef.current?.HmsView;
  const _keyExtractor = (item) => item.id;

  const _renderItem = ({ item }) => {
    const { peer, track } = item;

    return (
      <View
        style={{
          height: 300,
          margin: 8,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#A0C3D2",
        }}
      >
        {/* Checking if we have "HmsView" component, valid trackId and "track is not muted" */}
        {HmsView && track && track.trackId && !track.isMute() ? (
          <HmsView
            trackId={track.trackId}
            mirror={peer.isLocal}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FD8A8A",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 28,
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {peer.name
                  .split(" ")
                  .map((item) => item[0])
                  .join("")}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleRoomEnd = () => {
    leaveRoom();

    navigate("HomeScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        {loading ? (
          // Showing loader while Join is under process
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size={"large"} color="#2471ED" />
          </View>
        ) : (
          <View style={{ flex: 1, position: "relative" }}>
            {peerTrackNodes.length > 0 ? (
              // Rendering list of Peers
              <FlatList
                centerContent={true}
                data={peerTrackNodes}
                showsVerticalScrollIndicator={false}
                keyExtractor={_keyExtractor}
                renderItem={_renderItem}
                contentContainerStyle={{
                  paddingBottom: 120,
                  flexGrow: Platform.OS === "android" ? 1 : undefined,
                  justifyContent:
                    Platform.OS === "android" ? "center" : undefined,
                }}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 32 }}>Welcome!</Text>
                <Text style={{ fontSize: 16 }}>You’re the first one here.</Text>
                <Text style={{ fontSize: 16 }}>
                  Sit back and relax till the others join.
                </Text>
              </View>
            )}

            {/* Button to Leave Room */}
            <TouchableHighlight
              onPress={handleRoomEnd}
              underlayColor="#6e2028"
              style={{
                position: "absolute",
                bottom: 40,
                alignSelf: "center",
                backgroundColor: "#CC525F",
                width: 60,
                height: 60,
                borderRadius: 30,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "#ffffff",
                  fontWeight: "bold",
                }}
              >
                Leave Room
              </Text>
            </TouchableHighlight>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default RoomScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const usePeerTrackNodes = ({ navigate, hmsInstanceRef }) => {
  const [loading, setLoading] = useState(true);
  const [peerTrackNodes, setPeerTrackNodes] = useState([]);

  const handleRoomLeave = async () => {
    try {
      const hmsInstance = hmsInstanceRef.current;

      if (!hmsInstance) {
        return Promise.reject("HMSSDK instance is null");
      }

      hmsInstance.removeAllListeners();

      const leaveResult = await hmsInstance.leave();
      console.log("Leave Success: ", leaveResult);

      const destroyResult = await hmsInstance.destroy();
      console.log("Destroy Success: ", destroyResult);

      // Removing HMSSDK instance
      hmsInstanceRef.current = null;
    } catch (error) {
      console.log("Leave or Destroy Error: ", error);
    }
  };

  const onJoinSuccess = (data) => {
    const { localPeer } = data.room;

    setPeerTrackNodes((prevPeerTrackNodes) =>
      updateNode({
        nodes: prevPeerTrackNodes,
        peer: localPeer,
        track: localPeer.videoTrack,
        createNew: true,
      })
    );

    setLoading(false);
  };

  const onPeerListener = ({ peer, type }) => {
    if (type === HMSPeerUpdate.PEER_JOINED) return;

    if (type === HMSPeerUpdate.PEER_LEFT) {
      setPeerTrackNodes((prevPeerTrackNodes) =>
        removeNodeWithPeerId(prevPeerTrackNodes, peer.peerID)
      );
      return;
    }

    if (peer.isLocal) {
      setPeerTrackNodes((prevPeerTrackNodes) =>
        updateNodeWithPeer({ nodes: prevPeerTrackNodes, peer, createNew: true })
      );
      return;
    }

    if (
      type === HMSPeerUpdate.ROLE_CHANGED ||
      type === HMSPeerUpdate.METADATA_CHANGED ||
      type === HMSPeerUpdate.NAME_CHANGED ||
      type === HMSPeerUpdate.NETWORK_QUALITY_UPDATED
    ) {
      // Ignoring these update types because we want to keep this implementation simple.
      return;
    }
  };

  const onTrackListener = ({ peer, track, type }) => {
    if (
      type === HMSTrackUpdate.TRACK_ADDED &&
      track.type === HMSTrackType.VIDEO
    ) {
      setPeerTrackNodes((prevPeerTrackNodes) =>
        updateNode({
          nodes: prevPeerTrackNodes,
          peer,
          track,
          createNew: true,
        })
      );

      return;
    }

    if (
      type === HMSTrackUpdate.TRACK_MUTED ||
      type === HMSTrackUpdate.TRACK_UNMUTED
    ) {
      if (track.type === HMSTrackType.VIDEO) {
        setPeerTrackNodes((prevPeerTrackNodes) =>
          updateNode({
            nodes: prevPeerTrackNodes,
            peer,
            track,
          })
        );
      } else {
        setPeerTrackNodes((prevPeerTrackNodes) =>
          updateNodeWithPeer({
            nodes: prevPeerTrackNodes,
            peer,
          })
        );
      }
      return;
    }

    if (type === HMSTrackUpdate.TRACK_REMOVED) {
      return;
    }

    if (
      type === HMSTrackUpdate.TRACK_RESTORED ||
      type === HMSTrackUpdate.TRACK_DEGRADED
    ) {
      return;
    }
  };

  const onErrorListener = (error) => {
    setLoading(false);

    console.log(`${error?.code} ${error?.description}`);
  };

  useEffect(() => {
    const joinRoom = async () => {
      try {
        setLoading(true);

        const hmsInstance = await HMSSDK.build();
        if (hmsInstance) {
          console.log("hmsInstance built");
        }

        hmsInstanceRef.current = hmsInstance;

        let token = AUTH_TOKEN;

        if (!token) {
          token = await hmsInstance.getAuthTokenByRoomCode(ROOM_CODE);
        }

        hmsInstance.addEventListener(
          HMSUpdateListenerActions.ON_JOIN,
          onJoinSuccess
        );

        hmsInstance.addEventListener(
          HMSUpdateListenerActions.ON_PEER_UPDATE,
          onPeerListener
        );

        hmsInstance.addEventListener(
          HMSUpdateListenerActions.ON_TRACK_UPDATE,
          onTrackListener
        );

        hmsInstance.addEventListener(
          HMSUpdateListenerActions.ON_ERROR,
          onErrorListener
        );

        hmsInstance.join(
          new HMSConfig({ authToken: token, username: USERNAME })
        );
      } catch (error) {
        navigate("HomeScreen");
        console.error(error);
        Alert.alert("Error", "Check your console to see error logs!");
      }
    };

    joinRoom();

    return () => {
      handleRoomLeave();
    };
  }, [navigate]);

  return {
    loading,
    leaveRoom: handleRoomLeave,
    peerTrackNodes,
    hmsInstanceRef,
  };
};

export const checkPermissions = async (permissions) => {
  try {
    if (Platform.OS === "ios") {
      return true;
    }
    const requiredPermissions = permissions.filter(
      (permission) =>
        permission.toString() !== PERMISSIONS.ANDROID.BLUETOOTH_CONNECT
    );

    const results = await requestMultiple(requiredPermissions);

    let allPermissionsGranted = true;
    for (let permission in requiredPermissions) {
      if (!(results[requiredPermissions[permission]] === RESULTS.GRANTED)) {
        allPermissionsGranted = false;
      }
      console.log(
        `${requiredPermissions[permission]} : ${
          results[requiredPermissions[permission]]
        }`
      );
    }

    if (
      permissions.findIndex(
        (permission) =>
          permission.toString() === PERMISSIONS.ANDROID.BLUETOOTH_CONNECT
      ) >= 0
    ) {
      const bleConnectResult = await request(
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT
      );
      console.log(
        `${PERMISSIONS.ANDROID.BLUETOOTH_CONNECT} : ${bleConnectResult}`
      );
    }

    return allPermissionsGranted;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const getPeerTrackNodeId = (peer, track) => {
  return peer.peerID + (track?.source ?? HMSTrackSource.REGULAR);
};

export const createPeerTrackNode = (peer, track) => {
  let isVideoTrack = false;
  if (track && track?.type === HMSTrackType.VIDEO) {
    isVideoTrack = true;
  }
  const videoTrack = isVideoTrack ? track : undefined;
  return {
    id: getPeerTrackNodeId(peer, track),
    peer: peer,
    track: videoTrack,
  };
};

export const removeNodeWithPeerId = (nodes, peerID) => {
  return nodes.filter((node) => node.peer.peerID !== peerID);
};

export const updateNodeWithPeer = (data) => {
  const { nodes, peer, createNew = false } = data;

  const peerExists = nodes.some((node) => node.peer.peerID === peer.peerID);

  if (peerExists) {
    return nodes.map((node) => {
      if (node.peer.peerID === peer.peerID) {
        return { ...node, peer };
      }
      return node;
    });
  }

  if (!createNew) return nodes;

  if (peer.isLocal) {
    return [createPeerTrackNode(peer), ...nodes];
  }

  return [...nodes, createPeerTrackNode(peer)];
};

export const removeNode = (nodes, peer, track) => {
  const uniqueId = getPeerTrackNodeId(peer, track);

  return nodes.filter((node) => node.id !== uniqueId);
};

export const updateNode = (data) => {
  const { nodes, peer, track, createNew = false } = data;

  const uniqueId = getPeerTrackNodeId(peer, track);

  const nodeExists = nodes.some((node) => node.id === uniqueId);

  if (nodeExists) {
    return nodes.map((node) => {
      if (node.id === uniqueId) {
        return { ...node, peer, track };
      }
      return node;
    });
  }

  if (!createNew) return nodes;

  if (peer.isLocal) {
    return [createPeerTrackNode(peer, track), ...nodes];
  }

  return [...nodes, createPeerTrackNode(peer, track)];
};
