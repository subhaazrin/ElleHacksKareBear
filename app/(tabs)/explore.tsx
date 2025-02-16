import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Constants from 'expo-constants';

export default function App() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get API key from Constants
  const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey;

  const askGemini = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      console.log('API Key available:', !!GEMINI_API_KEY);
      
      if (!GEMINI_API_KEY) {
        throw new Error('API key is not configured');
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
                     The child asks: ${question}
                     
                     Please respond with a simple explanation that:
                     - Uses concrete examples
                     - Avoids idioms or abstract concepts
                     - Uses short, clear sentences
                     - Focuses on visual or physical signs of emotions
                     - Provides practical ways to respond to the emotion
                     
                     Keep the response under 3 sentences.`
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Unexpected API response format');
      }

      const explanation = data.candidates[0].content.parts[0].text;
      setResponse(explanation);
    } catch (error) {
      console.error('Detailed error:', error);
      setResponse(`Error: ${error.message}. Please check your configuration and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Emotion Helper</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Ask about an emotion..."
          value={question}
          onChangeText={setQuestion}
          multiline
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={askGemini}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Thinking...' : 'Ask Question'}
          </Text>
        </TouchableOpacity>

        {isLoading && <ActivityIndicator size="large" color="#6200ee" />}

        {response ? (
          <View style={styles.responseContainer}>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  input: {
    width: '100%',
    height: 100,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
  },
});