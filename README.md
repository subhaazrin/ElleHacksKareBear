# KareBEar 🌈

KareBEar is a mobile application and virtual plushie designed to help children with Autism Spectrum Disorder (ASD) ages 2-8 understand and express emotions through interactive features and child-friendly interfaces.

## Features 🎯

### Emotion Detection Camera 📸
- Real-time emotion recognition using Google Cloud Vision API
- Child-friendly interface with engaging visuals
- Simple, intuitive controls for young users
- Immediate feedback with age-appropriate messages

### Emotion Learning Helper 🎤
- Voice-based interaction for expressing feelings
- Speech-to-text conversion
- AI-powered responses using Google's Gemini API
- Text-to-speech feedback with adjustable speech parameters

### User Interface 🎨
- Warm, soothing color schemes
- Large, accessible buttons
- Clear, simple navigation
- Visual feedback for all interactions
- Child-friendly animations and transitions

## Technologies Used 💻

### Core Framework
- React Native with Expo
- Expo Router for navigation
- JavaScript/TypeScript

### APIs and Services
- Google Cloud Vision API for facial emotion detection
- Google Cloud Speech-to-Text API
- Google Gemini API for AI responses
- Expo Speech for text-to-speech

### Key Libraries
- expo-camera: Camera functionality
- expo-av: Audio recording
- expo-speech: Text-to-speech
- expo-file-system: File handling
- expo-constants: Environment configuration

## Setup Instructions 🚀

### Prerequisites
1. Node.js (v16 or higher)
2. npm or yarn
3. Expo CLI
4. Google Cloud Platform account
5. Xcode (for iOS development)
6. Android Studio (for Android development)

### Environment Setup
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd emotisense
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key
   GOOGLE_CLOUD_API_KEY=your_speech_to_text_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Configure app.config.js:
   ```javascript
   export default {
     expo: {
       extra: {
         googleCloudVisionApiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
         googleCloudApiKey: process.env.GOOGLE_CLOUD_API_KEY,
         geminiApiKey: process.env.GEMINI_API_KEY,
       },
     },
   };
   ```

### Running the App

Development mode:
```bash
npx expo start
```

Building for iOS:
```bash
npx expo run:ios
```

Building for Android:
```bash
npx expo run:android
```

## Project Structure 📁

```
emotisense/
├── app/                    # Main application code
│   ├── index.js           # Emotion detection camera
│   └── explore.js         # Emotion learning helper
├── components/            # Reusable components
├── constants/             # App-wide constants
├── hooks/                 # Custom React hooks
└── assets/               # Images and other static files
```

## Development Guidelines 📝

### Code Style
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Add comprehensive comments
- Follow the established project structure

### Testing
1. Unit Tests:
   ```bash
   npm run test
   ```

2. E2E Tests:
   ```bash
   npm run test:e2e
   ```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request

## Acknowledgments 🙏

- Google Cloud Platform for API services
- Expo team for the development framework
- Team RubyBytes 
- The ASD community for valuable feedback

## Version History 📈

- v1.0.0 (Current)
  - Initial release
  - Basic emotion detection
  - Voice interaction features
  - Child-friendly UI

## Future Roadmap 🗺️

- Offline mode support
- Built-in Harware Plushie
- Multiple language support
- Customizable UI themes
- Progress tracking
- Parent/Caregiver dashboard
- Educational games and activities

---

Built with ❤️ for children with ASD
