# EmoLit Mobile App

React Native mobile application for EmoLit - Emotional Intelligence Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. For iOS (Mac only):
```bash
cd ios && pod install && cd ..
```

3. Start the development server:
```bash
npm start
```

4. Run on your platform:
- iOS: `npm run ios` or press `i` in the terminal
- Android: `npm run android` or press `a` in the terminal
- Web: `npm run web` or press `w` in the terminal

## Configuration

Update the API URL in `src/services/api.js` if your backend is running on a different address:
- For Android emulator: `http://10.0.2.2:8000`
- For iOS simulator: `http://localhost:8000`
- For physical device: Use your computer's IP address (e.g., `http://192.168.1.100:8000`)

## Features

- ✅ User authentication (Login/Register)
- ✅ Home screen with word of the day
- ✅ Quiz functionality
- ✅ Journal entries
- ✅ Progress tracking
- ✅ Profile management

## Notes

- Make sure the backend is running on port 8000
- The app uses AsyncStorage for token persistence
- All API calls are authenticated with JWT tokens

