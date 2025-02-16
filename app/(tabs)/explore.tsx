/**
 * EmotionHelper
 * A voice-interactive emotion learning component for children with ASD (ages 2-8)
 * Features speech-to-text, AI responses, and text-to-speech capabilities
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import Constants from 'expo-constants';

// ============================================================================
// Configuration Constants
// ============================================================================

const CONFIG = {
  API_KEYS: {
    GEMINI: Constants.expoConfig?.extra?.geminiApiKey,
    GOOGLE_CLOUD: Constants.expoConfig?.extra?.GOOGLE_CLOUD_API_KEY,
  },
  SPEECH: {
    LANGUAGE: 'en',
    PITCH: 1.6,
    RATE: 0.5,
  },
  AUDIO: {
    SAMPLE_RATE: 16000,
    CHANNELS: 1,
    BIT_RATE: 16000,
    FORMAT: 'LINEAR16',
  },
};

// ============================================================================
// API Service Functions
// ============================================================================

/**
 * Handles Gemini AI API requests for emotion explanation
 * @param {string} transcribedText - The child's transcribed speech
 * @returns {Promise<string>} AI-generated explanation
 */
const getGeminiResponse = async (transcribedText) => {
  if (!CONFIG.API_KEYS.GEMINI) {
    throw new Error('Gemini API key is not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${CONFIG.API_KEYS.GEMINI}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

/**
 * Handles speech-to-text conversion using Google Cloud API
 * @param {string} base64Audio - Base64 encoded audio data
 * @returns {Promise<string>} Transcribed text
 */
const convertSpeechToText = async (base64Audio) => {
  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${CONFIG.API_KEYS.GOOGLE_CLOUD}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: CONFIG.AUDIO.FORMAT,
          sampleRateHertz: CONFIG.AUDIO.SAMPLE_RATE,
          languageCode: 'en-US',
          model: 'default',
        },
        audio: { content: base64Audio },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Speech-to-Text API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results?.[0]?.alternatives?.[0]?.transcript || 'No speech detected';
};

// ============================================================================
// Main Component
// ============================================================================

export default function EmotionHelper() {
  // State Management
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [geminiResponse, setGeminiResponse] = useState('');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cleanup Effect
  useEffect(() => {
    return () => {
      recording?.stopAndUnloadAsync();
      Speech.stop();
    };
  }, []);

  /**
   * Handles text-to-speech conversion
   * @param {string} text - Text to be spoken
   */
  const speakResponse = async (text) => {
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: CONFIG.SPEECH.LANGUAGE,
        pitch: CONFIG.SPEECH.PITCH,
        rate: CONFIG.SPEECH.RATE,
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

  /**
   * Initiates voice recording
   */
  const startRecording = async () => {
    try {
      // Reset states
      setError('');
      setGeminiResponse('');
      await Speech.stop();

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission not granted');
        return;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(getRecordingOptions());
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      setError(`Recording failed: ${err.message}`);
    }
  };

  /**
   * Stops recording and processes the audio
   */
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setError('');

      // Stop recording and get audio file
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // Convert audio to base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Process audio
      const transcribedText = await convertSpeechToText(base64Audio);
      setTranscription(transcribedText);
      
      // Get AI response
      if (transcribedText !== 'No speech detected') {
        setIsGeminiLoading(true);
        const response = await getGeminiResponse(transcribedText);
        setGeminiResponse(response);
        await speakResponse(response);
      }

      // Cleanup
      await FileSystem.deleteAsync(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to process recording', err);
      setError(`Processing failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setIsGeminiLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('./../../assets/images/KareBear.png')}
        style={styles.bg}
      />
      
      {/* Recording Button */}
      <RecordButton 
        isRecording={isRecording}
        isProcessing={isProcessing}
        isDisabled={isProcessing || isGeminiLoading || isSpeaking}
        onPress={isRecording ? stopRecording : startRecording}
      />

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

      {/* Transcription Display */}
      {transcription && (
        <TranscriptionView transcription={transcription} />
      )}

      {/* Loading Indicator */}
      {(isProcessing || isGeminiLoading) && (
        <ActivityIndicator size="large" color="#7a4f38" style={styles.loader} />
      )}

      {/* Response Display */}
      {geminiResponse && (
        <ResponseView 
          response={geminiResponse}
          isSpeaking={isSpeaking}
          onReplay={() => speakResponse(geminiResponse)}
        />
      )}
    </View>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

const RecordButton = ({ isRecording, isProcessing, isDisabled, onPress }) => (
  <TouchableOpacity
    style={[
      styles.button,
      isRecording && styles.buttonRecording,
      isProcessing && styles.buttonProcessing
    ]}
    onPress={onPress}
    disabled={isDisabled}
  >
    <Text style={styles.buttonText}>
      {isProcessing ? 'Processing...' : 
       isRecording ? 'Stop Recording' : 
       'Start Recording'}
    </Text>
  </TouchableOpacity>
);

const ErrorMessage = ({ message }) => (
  <Text style={styles.errorText}>{message}</Text>
);

const TranscriptionView = ({ transcription }) => (
  <View style={styles.transcriptionContainer}>
    <Text style={styles.label}>Your Speech:</Text>
    <Text style={styles.transcriptionText}>{transcription}</Text>
  </View>
);

const ResponseView = ({ response, isSpeaking, onReplay }) => (
  <View style={styles.responseContainer}>
    <Text style={styles.label}>Helper Response:</Text>
    <Text style={styles.responseText}>{response}</Text>
    
    <TouchableOpacity
      style={[styles.replayButton, isSpeaking && styles.replayButtonDisabled]}
      onPress={onReplay}
      disabled={isSpeaking}
    >
      <Text style={styles.replayButtonText}>
        {isSpeaking ? 'Speaking...' : 'Listen Again 🔊'}
      </Text>
    </TouchableOpacity>
  </View>
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Returns recording options for both iOS and Android
 */
const getRecordingOptions = () => ({
  android: {
    extension: '.wav',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
    sampleRate: CONFIG.AUDIO.SAMPLE_RATE,
    numberOfChannels: CONFIG.AUDIO.CHANNELS,
    bitRate: CONFIG.AUDIO.BIT_RATE,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: CONFIG.AUDIO.SAMPLE_RATE,
    numberOfChannels: CONFIG.AUDIO.CHANNELS,
    bitRate: CONFIG.AUDIO.BIT_RATE,
    linearPCM: true,
    keepAudioActiveHint: true,
  },
});

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  button: {
    backgroundColor: '#f9e6d8',
    top: 50,
    padding: 15,
    borderRadius: 25,
    width: 200,
    alignItems: 'center',
  },
  buttonRecording: {
    backgroundColor: '#FFB6C1',
  },
  buttonProcessing: {
    backgroundColor: '#E0E0E0',
  },
  replayButton: {
    backgroundColor: '#7a4f38',
    padding: 10,
    borderRadius: 25,
    marginTop: 10,
    width: 150,
    alignItems: 'center',
  },
  replayButtonDisabled: {
    backgroundColor: '#ccc',
  },
  replayButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#7a4f38',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transcriptionContainer: {
    top: 50,
    marginTop: 20,
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
  },
  responseContainer: {
    top: 50,
    marginTop: 20,
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
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
    backgroundColor: '#f9e6d8',
    borderRadius: 10,
  },
  responseText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#f9e6d8',
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#b9111e',
    marginTop: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 5,
    borderRadius: 5,
  },
  loader: {
    marginTop: 20,
  },
});