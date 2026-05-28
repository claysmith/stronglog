# StrongLog Workout Tracker

A simple strength training tracker for linear progression programs (e.g. Starting Strength). Built with Expo SDK 56.

## Stack

- **Expo SDK 56** · **React Native 0.85** · **React 19** · **TypeScript 6**
- **expo-router** — file-based tab navigation (Workout, History, Settings)
- **AsyncStorage** — local-only persistence (no backend)
- **react-native-reanimated** — animations
- **react-native-svg** — progress charts

## Project Structure

```
src/
├── app/                    # expo-router screens
│   ├── _layout.tsx         # Root layout: theme → workout context → tabs
│   ├── index.tsx           # Workout screen (start/active workout)
│   ├── history.tsx         # History with PRs and progress charts
│   └── settings.tsx        # Global and per-exercise settings
├── components/             # Reusable UI components
│   ├── progress-chart.tsx  # SVG sparkline chart per exercise
│   ├── themed-text.tsx     # Themed text wrapper
│   ├── themed-view.tsx     # Themed view wrapper
│   ├── app-tabs.tsx        # Native tab bar
│   └── ...
├── context/
│   ├── workout-context.tsx # Central state: active workout, progression, history
│   └── color-scheme-context.tsx
├── constants/
│   └── theme.ts           # Colors, spacing, fonts
├── hooks/
│   └── use-theme.ts       # Returns resolved theme colors
└── types/
    └── workout.ts          # All type definitions
```

## How It Works

**Workouts** alternate between two types:
- **Workout A**: Squat (5×5), Bench Press (5×5), Barbell Row (5×5)
- **Workout B**: Squat (5×5), Overhead Press (5×5), Deadlift (5×5)

**Progression** is automatic — complete all 5 sets and the weight increases by the increment. Fail any set and the exercise deloads. The next workout type auto-alternates (unless failed, in which case it retries the same type).

**Personal Records** are tracked per exercise — the highest weight where all sets were completed, shown on the History tab alongside SVG progress charts.

All data is stored locally via AsyncStorage.

## Getting Started

### Prerequisites

- Node.js 20+
- Xcode 16+ (for iOS)
- CocoaPods (`gem install cocoapods`)

### Install & Run

```sh
npm install
npx pod-install          # Install CocoaPods dependencies
npx expo run:ios         # Build and run on iOS simulator
```

### Versioned Docs

This project targets Expo SDK 56. Always use the [v56 docs](https://docs.expo.dev/versions/v56.0.0/) — newer Expo docs may reference APIs that aren't available in this version.

### Full Clean Rebuild

```sh
rm -rf node_modules ios/Pods ios/build .expo package-lock.json
npm install
npx pod-install
npx expo run:ios
```

### Development Build on Device

```sh
eas build --platform ios --profile development
```

## Building for App Store

```sh
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Then complete metadata (description, screenshots) in [App Store Connect](https://appstoreconnect.apple.com).

## Configuration

| Setting | Default | Description |
|---|---|---|
| Starting Weight | 45 lbs | Initial weight for all exercises |
| Increment | 5 lbs | Weight increase on successful workout |
| Deload Amount | 10 lbs | Weight decrease on failed workout |

Per-exercise overrides are available in Settings.

## License

© 2026 Clay Smith
