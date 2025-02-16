import "dotenv/config";

export default {
  expo: {
    extra: {
      GOOGLE_CLOUD_VISION_API_KEY: process.env.GOOGLE_CLOUD_VISION_API_KEY
    }
  }
};
