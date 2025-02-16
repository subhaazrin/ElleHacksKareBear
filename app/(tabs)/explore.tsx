import { useState } from "react";
import { StyleSheet, View, TextInput, Button, Text } from "react-native";
import Constants from "expo-constants";

// ✅ Ensure variables are loaded correctly
const projectId = Constants.expoConfig?.extra?.DIALOGFLOW_PROJECT_ID;
const privateKey = Constants.expoConfig?.extra?.DIALOGFLOW_PRIVATE_KEY?.replace(/\\n/g, "\n");
const clientEmail = Constants.expoConfig?.extra?.DIALOGFLOW_CLIENT_EMAIL;

export default function TabTwoScreen() {
  const [inputText, setInputText] = useState("");
  const [responseText, setResponseText] = useState("");

  const sendMessageToDialogflow = async () => {
    const sessionId = "123456";

    const url = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/sessions/${sessionId}:detectIntent`;

    const requestBody = {
      queryInput: {
        text: {
          text: inputText,
          languageCode: "en",
        },
      },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${privateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      // ✅ Ensure we have valid data from Dialogflow
      if (result?.queryResult?.fulfillmentText) {
        setResponseText(result.queryResult.fulfillmentText);
      } else {
        setResponseText("No response from Dialogflow.");
        console.error("Dialogflow response error:", result);
      }
    } catch (error) {
      console.error("Error sending message to Dialogflow:", error);
      setResponseText("Error communicating with Dialogflow.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Dialogflow Chat</Text>

      {/* User Input Field */}
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        value={inputText}
        onChangeText={setInputText}
      />

      {/* Send Button */}
      <Button title="Send" onPress={sendMessageToDialogflow} />

      {/* Response Display */}
      <Text style={styles.response}>{responseText}</Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  response: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "blue",
  },
});
