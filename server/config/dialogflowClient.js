const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const path = require('path');
console.log("Key File Path:", path);

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'dialogflow.json');

const projectId = 'fair-melody-451021-b9';
const location = 'us-east1'; 
const agentId = 'fair-melody-451021-b9';
const sessionId = 'test-session';
const query = 'Hello, how are you?';
console.log('Project ID:', projectId);
console.log('Location:', location);
console.log('Agent ID:', agentId);
console.log('Session ID:', sessionId);


async function detectIntent() {
    const client = new SessionsClient({
        apiEndpoint: 'us-east1-dialogflow.googleapis.com'
      });
      console.log("Project ID:", 'fair-melody-451021-b9'); // Or however you're getting the ID
      const sessionPath = client.projectLocationAgentSessionPath(projectId, location, agentId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
      },
      languageCode: 'en',
    },
  };

  const [response] = await client.detectIntent(request);
  console.log('Dialogflow Response:', response.queryResult.responseMessages);
}

detectIntent().catch(console.error);
