
/**
 * EmotionDetector
 * A camera-based emotion detection app for children with ASD (ages 2-8)
 * Features real-time emotion recognition and child-friendly feedback
 */

import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import { useRef, useState, useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text, View, Dimensions, Platform } from "react-native";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system";
import * as SplashScreen from "expo-splash-screen";

// ============================================================================
// Configuration Constants
// ============================================================================

const CONFIG = {
  API: {
    VISION: Constants.expoConfig?.extra?.GOOGLE_CLOUD_VISION_API_KEY,
    ENDPOINT: 'https://vision.googleapis.com/v1/images:annotate',
  },
  SCREEN: {
    WIDTH: Dimensions.get("window").width,
    HEIGHT: Dimensions.get("window").height,
  },
  CAMERA: {
    FACING: "front",
    CAPTURE_SIZE: {
      BUTTON: 100,
      INNER: 80,
    },
  },
  UI: {
    ANIMATION_DELAY: 2000,
    BORDER_RADIUS: {
      LARGE: 25,
      MEDIUM: 20,
    },
    SHADOW: {
      COLOR: "#000",
      OFFSET: { width: 0, height: 2 },
      OPACITY: 0.25,
      RADIUS: 3.84,
    },
  },
};

/**
 * Emotion configurations with child-friendly messages and colors
 */
const EMOTIONS = {
  "Happy 😊": {
    message: "You're smiling! That's wonderful!",
    color: "#FFE5E5",
    textColor: "#FF6B6B",
    borderColor: "#FF9999"
  },
  "Sad 😢": {
    message: "It's okay to feel sad sometimes",
    color: "#E5F0FF",
    textColor: "#4D96FF",
    borderColor: "#99C2FF"
  },
  "Surprised 😲": {
    message: "Wow! What a big surprise!",
    color: "#FFF4E5",
    textColor: "#FFA726",
    borderColor: "#FFB74D"
  },
  "Angry 😡": {
    message: "Let's take deep breaths together",
    color: "#FFE5E5",
    textColor: "#FF6B6B",
    borderColor: "#FF9999"
  },
  "Neutral": {
    message: "You're being very calm",
    color: "#E5FFE5",
    textColor: "#4CAF50",
    borderColor: "#81C784"
  },
  "No face detected 😕": {
    message: "Let's try to get your whole face in the picture!",
    color: "#F5E5FF",
    textColor: "#9C27B0",
    borderColor: "#BA68C8"
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Analyzes an image for emotion detection using Google Cloud Vision API
 * @param {string} imageUri - URI of the captured image
 * @returns {Promise<string>} Detected emotion
 */
const analyzeEmotion = async (imageUri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(
      `${CONFIG.API.ENDPOINT}?key=${CONFIG.API.VISION}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: "FACE_DETECTION" }],
          }],
        }),
      }
    );

    const result = await response.json();
    const face = result.responses?.[0]?.faceAnnotations?.[0];

    if (!face) return "No face detected 😕";

    // Determine emotion based on likelihood values
    if (face.joyLikelihood === "VERY_LIKELY") return "Happy 😊";
    if (face.angerLikelihood === "VERY_LIKELY") return "Angry 😡";
    if (face.sorrowLikelihood === "VERY_LIKELY") return "Sad 😢";
    if (face.surpriseLikelihood === "VERY_LIKELY") return "Surprised 😲";
    return "Neutral";

  } catch (error) {
    console.error("Error analyzing image:", error);
    return "No face detected 😕";
  }
};

// ============================================================================
// Component Parts
// ============================================================================

/**
 * Permission request screen component
 */
const PermissionRequest = ({ onRequestPermission }) => (
  <View style={styles.permissionContainer}>
    <Text style={styles.permissionText}>
      Let's play with the camera! 📸{"\n"}
      Can you help me see your face?
    </Text>
    <Pressable 
      style={styles.permissionButton}
      onPress={onRequestPermission}
    >
      <Text style={styles.permissionButtonText}>Yes, let's play! 🎮</Text>
    </Pressable>
  </View>
);

/**
 * Camera view component
 */
const CameraScreen = ({ cameraRef, onCapture }) => (
  <CameraView style={styles.camera} ref={cameraRef} facing={CONFIG.CAMERA.FACING}>
    <View style={styles.cameraOverlay}>
      <Text style={styles.cameraPrompt}>Show me how you feel! 🌈</Text>
    </View>
    
    <Pressable style={styles.captureButton} onPress={onCapture}>
      <View style={styles.captureButtonInner}>
        <Text style={styles.captureButtonText}>📸</Text>
      </View>
    </Pressable>
  </CameraView>
);

/**
 * Result display component
 */
const ResultScreen = ({ uri, emotion, onPlayAgain }) => (
  <View style={styles.imageContainer}>
    <Image source={{ uri }} contentFit="cover" style={styles.image} />
    
    {emotion && (
      <View style={[
        styles.emotionOverlay,
        {
          backgroundColor: EMOTIONS[emotion]?.color || '#FFF',
          borderColor: EMOTIONS[emotion]?.borderColor || '#DDD'
        }
      ]}>
        <Text style={[
          styles.emotionText,
          { color: EMOTIONS[emotion]?.textColor || '#000' }
        ]}>
          {emotion}
        </Text>
        <Text style={[
          styles.emotionMessage,
          { color: EMOTIONS[emotion]?.textColor || '#000' }
        ]}>
          {EMOTIONS[emotion]?.message || "Let's try again!"}
        </Text>
      </View>
    )}

    <Pressable style={styles.playAgainButton} onPress={onPlayAgain}>
      <Text style={styles.playAgainText}>Let's Play Again! 🎮</Text>
    </Pressable>
  </View>
);

// ============================================================================
// Main Component
// ============================================================================

export default function EmotionDetector() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [uri, setUri] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [appIsReady, setAppIsReady] = useState(false);

  // Initialize app and handle splash screen
  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await new Promise(resolve => setTimeout(resolve, CONFIG.UI.ANIMATION_DELAY));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (appIsReady) {
      SplashScreen.hide();
    }
  }, [appIsReady]);

  // Handle photo capture
  const takePicture = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (photo?.uri) {
      setUri(photo.uri);
      const detectedEmotion = ""
       detectedEmotion = await analyzeEmotion(photo.uri);
      setEmotion(detectedEmotion);
    }
  };

  // Reset state for new game
  const resetGame = () => {
    setUri(null);
    setEmotion(null);
  };

  if (!permission) return null;
  if (!permission.granted) {
    return <PermissionRequest onRequestPermission={requestPermission} />;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      {uri ? (
        <ResultScreen 
          uri={uri}
          emotion={emotion}
          onPlayAgain={resetGame}
        />
      ) : (
        <CameraScreen 
          cameraRef={cameraRef}
          onCapture={takePicture}
        />
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5E6", // Warm, calming background
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#FFF5E6",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  permissionText: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 30,
    color: "#4A4A4A",
    lineHeight: 32,
  },
  permissionButton: {
    backgroundColor: "#FFB6C1",
    padding: 20,
    borderRadius: CONFIG.UI.BORDER_RADIUS.LARGE,
    minWidth: 200,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  cameraOverlay: {
    position: "absolute",
    top: "10%",
    width: "100%",
    alignItems: "center",
  },
  cameraPrompt: {
    fontSize: 28,
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    backgroundColor: "rgba(255,182,193,0.7)",
    padding: 15,
    borderRadius: CONFIG.UI.BORDER_RADIUS.MEDIUM,
  },
  captureButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    width: CONFIG.CAMERA.CAPTURE_SIZE.BUTTON,
    height: CONFIG.CAMERA.CAPTURE_SIZE.BUTTON,
    borderRadius: CONFIG.CAMERA.CAPTURE_SIZE.BUTTON / 2,
    backgroundColor: "#FFB6C1",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: CONFIG.UI.SHADOW.COLOR,
        shadowOffset: CONFIG.UI.SHADOW.OFFSET,
        shadowOpacity: CONFIG.UI.SHADOW.OPACITY,
        shadowRadius: CONFIG.UI.SHADOW.RADIUS,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  captureButtonInner: {
    width: CONFIG.CAMERA.CAPTURE_SIZE.INNER,
    height: CONFIG.CAMERA.CAPTURE_SIZE.INNER,
    borderRadius: CONFIG.CAMERA.CAPTURE_SIZE.INNER / 2,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonText: {
    fontSize: 40,
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  emotionOverlay: {
    position: "absolute",
    top: "15%",
    left: "10%",
    right: "10%",
    padding: 20,
    borderRadius: CONFIG.UI.BORDER_RADIUS.LARGE,
    borderWidth: 3,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: CONFIG.UI.SHADOW.COLOR,
        shadowOffset: CONFIG.UI.SHADOW.OFFSET,
        shadowOpacity: CONFIG.UI.SHADOW.OPACITY,
        shadowRadius: CONFIG.UI.SHADOW.RADIUS,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  emotionText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  emotionMessage: {
    fontSize: 24,
    textAlign: "center",
    lineHeight: 28,
  },
  playAgainButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "#FFB6C1",
    padding: 20,
    borderRadius: CONFIG.UI.BORDER_RADIUS.LARGE,
    minWidth: 200,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: CONFIG.UI.SHADOW.COLOR,
        shadowOffset: CONFIG.UI.SHADOW.OFFSET,
        shadowOpacity: CONFIG.UI.SHADOW.OPACITY,
        shadowRadius: CONFIG.UI.SHADOW.RADIUS,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  playAgainText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});