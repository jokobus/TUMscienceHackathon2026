# WEave — Student App (React Native / Expo)

The student-facing WEave client, ported 1:1 from the Next.js `Student_App` to React
Native (Expo + expo-router + NativeWind), wired to the FastAPI backend.

## Stack
- Expo SDK 56 · expo-router (file-based) · NativeWind (Tailwind) · lucide-react-native
- expo-camera (QR scanner) · WebSocket chat · AsyncStorage session

## Run
```bash
# 1. Start the backend (separate terminal)
cd ../Backend && uvicorn app.main:app --reload      # http://localhost:8000

# 2. Start the app
npm install            # only if node_modules is missing
npm run web            # or: npm run ios / npm run android
```

`.env` points the app at the backend:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000   # Android emulator: http://10.0.2.2:8000
```

## Auth
The **Feed is browsable without login**. Other features prompt for **Sign In / Sign Up /
Continue as Guest** when needed (`/login`).

Demo student: `thiviyan.saravanamuthu@tum.de` · password `weave`
(others: `nakulan.sundarraju@tum.de`, `michael.brandt@tum.de`, … — all `weave`).

## Structure
```
src/
  app/
    index.tsx            redirect → Feed
    login.tsx            Sign In / Sign Up / Guest
    camera.tsx           full-screen QR scanner
    (tabs)/
      _layout.tsx        custom 5-slot tab bar (Feed · Requests · Camera · Chat · Profile)
      feed/index.tsx     event feed (search + filters)
      feed/[id].tsx      event page (Information / File Drive / Capture a Memory)
      requests.tsx       event suggestions + voting
      chat/index.tsx     conversations + people search
      chat/[chatId].tsx  message thread (WebSocket realtime)
      profile.tsx        profile, interests, memories, settings
  components/ui/         reusable UI (Button, Card, Input, Toast, BottomSheet, …)
  components/student/    EventCard, FeedFilters, Navigation (tab bar + Live-Event FAB)
  lib/                   http · api · auth · ws · types · utils
  theme.ts               design tokens (wuerth + we)
```

## Backend endpoints consumed
Feed/search/current/detail/files/memories/repost/application/feedback ·
check-in/scan/interactions · profile/interests/password/memories ·
suggestions(+vote) · chats/messages/search-people · `ws/chat`.
