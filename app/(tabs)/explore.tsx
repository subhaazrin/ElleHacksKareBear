import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet , ImageBackground} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Replace with your Google Cloud API key
const GOOGLE_CLOUD_API_KEY = 'AIzaSyDq_oxnzSGAWHZQnT8nb0OtEezAit-auYw';

export default function SpeechToTextScreen() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(''); // Add error state
  

  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  async function startRecording() {
    try {
      setError(''); // Clear any previous errors
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        setError('Microphone permission not granted');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Use specific recording options that match Google Cloud requirements
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

      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      setError(`Recording failed: ${err.message}`);
    }
  }

  async function stopRecording() {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setError(''); // Clear any previous errors
      
      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording URI:', uri);
      
      // Read the audio file as base64
      console.log('Converting to base64...');
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('Base64 length:', base64Audio.length);

      // Call Google Cloud Speech-to-Text API
      console.log('Calling Google API...');
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

      const responseText = await response.text();
      console.log('API Response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      if (data.results && data.results[0]) {
        setTranscription(data.results[0].alternatives[0].transcript);
      } else {
        setTranscription('No speech detected');
      }

      // Clean up
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
      source={require('./../../assets/images/KareBear.png')} // Replace with your image path
      style={styles.bg}
    ></ImageBackground>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.buttonRecording,
          isProcessing && styles.buttonProcessing
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
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
        <Text style={styles.label}>Your Transcribed Speech Will Appear Here:</Text>
        <Text style={styles.transcriptionText}>{transcription}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg:{
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
    borderRightWidth:0,
    borderBottomWidth:0,
    borderWidth:0,
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
  buttonText: {
    color: '#7a4f38',
    fontSize: 18,
    fontWeight: 'bold',

  },
  transcriptionContainer: {
    marginTop: 40,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
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
  errorText: {
    color: '#b9111e',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
});