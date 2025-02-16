import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { GOOGLE_CLOUD_VISION_API_KEY } from '@env';
import { useRef, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View, Dimensions } from "react-native";
import { Image } from "expo-image";
import { AntDesign, Feather, FontAwesome6 } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";

const { width, height } = Dimensions.get("window");

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);
  const [emotion, setEmotion] = useState<string | null>(null);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  // ✅ Take picture and send it to Google Cloud Vision API
  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    if (photo?.uri) {
      setUri(photo.uri);
      analyzeEmotion(photo.uri);
    }
  };

  // ✅ Function to analyze image using Google Vision REST API
  const analyzeEmotion = async (imageUri: string) => {
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // API request to Google Cloud Vision
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64 },
                features: [{ type: "FACE_DETECTION" }],
              },
            ],
          }),
        }
      );

      const result = await response.json();
      console.log("🚀 API Response:", JSON.stringify(result, null, 2));

      if (
        result.responses &&
        result.responses[0] &&
        result.responses[0].faceAnnotations
      ) {
        const face = result.responses[0].faceAnnotations[0];

        let detectedEmotion = "Neutral"; // Default emotion
        if (face.joyLikelihood === "VERY_LIKELY") detectedEmotion = "Happy 😊";
        if (face.angerLikelihood === "VERY_LIKELY") detectedEmotion = "Angry 😡";
        if (face.sorrowLikelihood === "VERY_LIKELY") detectedEmotion = "Sad 😢";
        if (face.surpriseLikelihood === "VERY_LIKELY") detectedEmotion = "Surprised 😲";

        setEmotion(detectedEmotion);
      } else {
        setEmotion("No face detected 😕");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      setEmotion("Error detecting emotions");
    }
  };

  const toggleMode = () => setMode((prev) => (prev === "picture" ? "video" : "picture"));
  const toggleFacing = () => setFacing((prev) => (prev === "back" ? "front" : "back"));

  const renderPicture = () => (
    <View style={styles.imageContainer}>
      {/* Captured Image with Full Width */}
      <Image source={{ uri }} contentFit="cover" style={styles.image} />

      {/* Emotion Overlay on Image */}
      {emotion && (
        <View style={styles.emotionOverlay}>
          <Text style={styles.emotionText}>{emotion}</Text>
        </View>
      )}

      <Button onPress={() => setUri(null)} title="Take another picture" />
    </View>
  );

  const renderCamera = () => (
    <CameraView style={styles.camera} ref={ref} mode={mode} facing={facing} mute={false}>
      <View style={styles.shutterContainer}>
        <Pressable onPress={toggleMode}>
          {mode === "picture" ? <AntDesign name="picture" size={32} color="white" /> : <Feather name="video" size={32} color="white" />}
        </Pressable>
        <Pressable onPress={takePicture}>
          {({ pressed }) => (
            <View style={[styles.shutterBtn, { opacity: pressed ? 0.5 : 1 }]}>
              <View style={[styles.shutterBtnInner, { backgroundColor: "white" }]} />
            </View>
          )}
        </Pressable>
        <Pressable onPress={toggleFacing}>
          <FontAwesome6 name="rotate-left" size={32} color="white" />
        </Pressable>
      </View>
    </CameraView>
  );

  return <View style={styles.container}>{uri ? renderPicture() : renderCamera()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover", // Ensure full screen fit
  },
  emotionOverlay: {
    position: "absolute",
    top: "10%", // Adjust position dynamically
    left: "50%",
    transform: [{ translateX: -50 }],
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderRadius: 8,
  },
  emotionText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});

