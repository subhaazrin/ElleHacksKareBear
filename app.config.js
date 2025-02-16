import "dotenv/config";

export default {
  expo: {
    extra: {
      GOOGLE_CLOUD_VISION_API_KEY: process.env.GOOGLE_CLOUD_VISION_API_KEY,
      DIALOGFLOW_PROJECT_ID: process.env.DIALOGFLOW_PROJECT_ID,
      DIALOGFLOW_PRIVATE_KEY: process.env.DIALOGFLOW_PRIVATE_KEY,
      DIALOGFLOW_CLIENT_EMAIL: process.env.DIALOGFLOW_CLIENT_EMAIL
    }
  }
};
