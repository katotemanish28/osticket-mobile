# 📱 osTicket Mobile

A cross-platform mobile application built with **React Native + Expo** that provides a mobile interface for the [osTicket](https://osticket.com/) open-source help desk system. Manage and interact with support tickets on Android, iOS, and web — all from one codebase.

---

## ✨ Features

- 🎫 View, create, and manage support tickets
- 💬 Reply to ticket threads in real time
- 📎 Attach files and images to tickets (via `expo-document-picker` & `expo-image-picker`)
- 🔔 Haptic feedback for interactive actions
- 🗂️ Bottom tab and stack navigation
- 🔐 Async storage for persistent session/auth data
- 🌐 REST API integration with your osTicket backend via `axios`
- 📦 Global state management with Redux Toolkit

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 / React Native 0.81 |
| Language | JavaScript (ES2023) + TypeScript |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| State Management | Redux Toolkit + React Redux |
| HTTP Client | Axios |
| UI Library | React Native Paper |
| Storage | AsyncStorage |
| Animations | React Native Reanimated |
| Icons | Expo Vector Icons |

---

## 📁 Project Structure

```
osticket-mobile/
├── App.js                  # Entry point
├── app.json                # Expo configuration
├── src/                    # Core application source
│   ├── api/                # Axios API calls to osTicket backend
│   ├── screens/            # App screens (Tickets, Login, Details, etc.)
│   ├── store/              # Redux slices and store setup
│   └── navigation/         # Navigation configuration
├── components/             # Reusable UI components
├── constants/              # App-wide constants (colors, API URLs, etc.)
└── assets/
    └── images/             # App images and icons
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or above recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A running [osTicket](https://osticket.com/) instance with API access enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/katotemanish28/osticket-mobile.git
cd osticket-mobile

# Install dependencies
npm install
```

### Configuration

Update your osTicket API base URL in `constants/` (e.g., `constants/api.js`):

```js
export const API_BASE_URL = 'https://your-osticket-instance.com/api';
export const API_KEY = 'your-api-key-here';
```

### Running the App

```bash
# Start the Expo development server
npx expo start
```

Then open the app using one of:

| Platform | Command / Method |
|---|---|
| Android | Press `a` or scan QR in Expo Go |
| iOS | Press `i` or scan QR in Expo Go |
| Web | Press `w` |

---

## 📦 Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run android` | Launch on Android emulator |
| `npm run ios` | Launch on iOS simulator |
| `npm run web` | Launch in browser |
| `npm run lint` | Run ESLint |

---

## 🔗 osTicket API

This app connects to your osTicket backend using the [osTicket REST API](https://docs.osticket.com/en/latest/Developer%20Documentation/API/). Make sure:

1. API access is **enabled** in your osTicket admin panel (`Admin > Settings > API`)
2. An **API key** is generated and has the necessary permissions
3. Your server allows **CORS** if testing on web

---

## 🧹 Reset to Blank Project

If you want to start fresh from the Expo template:

```bash
npm run reset-project
```

This moves the starter code to `app-example/` and creates a clean `app/` directory.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change, then submit a pull request.

---

## 📄 License

This project is private. All rights reserved © katotemanish28.

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [osTicket API Docs](https://docs.osticket.com/en/latest/Developer%20Documentation/API/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
