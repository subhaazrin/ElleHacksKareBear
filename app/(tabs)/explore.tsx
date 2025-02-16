import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import Constants from 'expo-constants';

// Replace with your API keys
const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey;
const GOOGLE_CLOUD_API_KEY = Constants.expoConfig?.extra?.GOOGLE_CLOUD_API_KEY;

export default function EmotionHelper() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [geminiResponse, setGeminiResponse] = useState('');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
      Speech.stop();
    };
  }, []);

  // New function to speak the Gemini response
  const speakResponse = async (text) => {
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: 'en',
        pitch: 1.6,
        rate: 0.5, // Slightly slower rate for better comprehension
        onDone: () => setIsSpeaking(false),
        onError: (error) => {
          setError(`Speech Error: ${error}`);
          setIsSpeaking(false);
        }
      });
    } catch (err) {
      console.error('Speech Error:', err);
      setError(`Speech Error: ${err.message}`);
      setIsSpeaking(false);
    }
  };

  const askGemini = async (transcribedText) => {
    if (!transcribedText.trim()) return;
    
    setIsGeminiLoading(true);
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are helping a young child (Age 2-8) with ASD understand emotions.
                     The child says: ${transcribedText}
                     
                     Please respond with a simple explanation that:
                     - Uses concrete examples
                     - Avoids idioms or abstract concepts
                     - Uses short, clear sentences + simple words
                     - Focuses on visual or physical signs of emotions
                     - Provides practical ways to respond to the emotion
                     
                     Keep the response under 3 sentences.`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.status}`);
      }

      const data = await response.json();
      const explanation = data.candidates[0].content.parts[0].text;
      setGeminiResponse(explanation);
      // Automatically speak the response
      await speakResponse(explanation);
    } catch (err) {
      console.error('Gemini API Error:', err);
      setError(`Gemini API Error: ${err.message}`);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  async function startRecording() {
    try {
      setError('');
      setGeminiResponse(''); // Clear previous response
      await Speech.stop(); // Stop any ongoing speech
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        setError('Microphone permission not granted');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
          linearPCM: true,
          keepAudioActiveHint: true,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      setError(`Recording failed: ${err.message}`);
    }
  }

  async function stopRecording() {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setError('');
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_CLOUD_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
            model: 'default',
          },
          audio: {
            content: base64Audio,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Speech-to-Text API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.results && data.results[0]) {
        const transcribedText = data.results[0].alternatives[0].transcript;
        setTranscription(transcribedText);
        // Automatically send transcribed text to Gemini
        await askGemini(transcribedText);
      } else {
        setTranscription('No speech detected');
      }

      await FileSystem.deleteAsync(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to process recording', err);
      setError(`Processing failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('./../../assets/images/KareBear.png')}
        style={styles.bg}
      />
      
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.buttonRecording,
          isProcessing && styles.buttonProcessing
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || isGeminiLoading || isSpeaking}
      >
        <Text style={styles.buttonText}>
          {isProcessing ? 'Processing...' : 
           isRecording ? 'Stop Recording' : 
           'Start Recording'}
        </Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <View style={styles.transcriptionContainer}>
        <Text style={styles.label}>Your Speech:</Text>
        <Text style={styles.transcriptionText}>{transcription}</Text>
      </View>

      {(isProcessing || isGeminiLoading) && (
        <ActivityIndicator size="large" color="#7a4f38" style={styles.loader} />
      )}

      {geminiResponse && (
        <View style={styles.responseContainer}>
          <Text style={styles.label}>Helper Response:</Text>
          <Text style={styles.responseText}>{geminiResponse}</Text>
          
          {/* Add replay button */}
          <TouchableOpacity
            style={[styles.replayButton, isSpeaking && styles.replayButtonDisabled]}
            onPress={() => speakResponse(geminiResponse)}
            disabled={isSpeaking}
          >
            <Text style={styles.replayButtonText}>
              {isSpeaking ? 'Speaking...' : 'Replay Response'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    padding: 50,
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 100,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderWidth: 0,
    backgroundColor: '#fff',
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#f9e6d8',
    padding: 15,
    borderRadius: 0,
    width: 200,
    alignItems: 'center',
    fontFamily: 'Helvetica',
  },
  buttonRecording: {
    backgroundColor: '#ffffff',
  },
  buttonProcessing: {
    backgroundColor: '#ffffff',
  },
  replayButton: {
    backgroundColor: '#7a4f38',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: 150,
    alignItems: 'center',
  },
  replayButtonDisabled: {
    backgroundColor: '#ccc',
  },
  replayButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#7a4f38',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transcriptionContainer: {
    marginTop: 40,
    width: '100%',
  },
  responseContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#7a4f38',
  },
  transcriptionText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#7a4f38',
    borderRadius: 5,
    minHeight: 100,
    fontFamily: 'Helvetica',
  },
  responseText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#7a4f38',
    borderRadius: 5,
    minHeight: 100,
    fontFamily: 'Helvetica',
    backgroundColor: '#f9e6d8',
  },
  errorText: {
    color: '#b9111e',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
  loader: {
    marginTop: 20,
  },
});