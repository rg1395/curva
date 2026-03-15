# CURVA — La strada più divertente da A a B

Motorcycle routing app that optimizes for **fun** (curves, asphalt quality, scenic routes) rather than speed.

## Tech Stack

- **React Native + Expo SDK 52** (Android-first)
- **MapLibre GL** for map rendering
- **GraphHopper API** for curvy motorcycle routing
- **Supabase** (PostgreSQL + Auth + Edge Functions)
- **expo-sensors** for accelerometer-based asphalt quality
- **React Navigation v7** + **Zustand** + **React Query**

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure API keys
```bash
cp .env.example .env
# Edit .env with your keys:
# - GraphHopper API key (free 500 req/day): https://graphhopper.com/
# - Mapbox token: https://account.mapbox.com/
# - Supabase URL + anon key: https://supabase.com/
```

### 3. Add fonts
Download and place in `assets/fonts/`:
- **Clash Display**: https://www.fontshare.com/fonts/clash-display
  - `ClashDisplay-Semibold.otf`
  - `ClashDisplay-Medium.otf`
- **Outfit**: https://fonts.google.com/specimen/Outfit
  - `Outfit-Regular.ttf`
  - `Outfit-Medium.ttf`
  - `Outfit-SemiBold.ttf`

### 4. Set up Supabase
Run `supabase/migrations/001_initial.sql` in your Supabase SQL editor.

### 5. Run the app
```bash
npx expo start
# Scan QR with Expo Go (Android/iOS)
# Or press 'a' for Android emulator
```

## App Structure

```
src/
├── screens/          # 7 screens (Home, RouteResult, DriveMode, etc.)
├── components/       # UI primitives + map components + icons
├── api/              # GraphHopper, Supabase, geocoding, surface quality
├── store/            # Zustand stores (route, ride)
├── utils/            # Fun Score calc, sinuosity, geo math, accelerometer
├── types/            # TypeScript types
├── constants/        # Design system (colors, fonts, spacing)
└── navigation/       # React Navigation stack
```

## Key Features

| Feature | Description |
|---|---|
| **Routing curvy A→B** | GraphHopper with custom model prioritizing secondary/tertiary roads |
| **Fun Score (1-10)** | Sinuosity 40% + Surface 25% + Scenic 15% + Traffic 10% + Elevation 10% |
| **Sorprendimi** | One-tap random loop from current location, min Fun Score 6 |
| **Asphalt quality** | Accelerometer at 16Hz, crowdsourced RMS vibration data |
| **Drive Mode** | Minimal navigation UI — big arrow, 72px font distance |
| **Shareable card** | PNG card with Fun Score, stats, via expo-sharing |
| **Top Roads** | Leaderboard of roads by Fun Score per region |

## Build for Android

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview
```

## Database Schema

See `supabase/migrations/001_initial.sql` for the complete schema with:
- `users`, `routes`, `road_segments`
- `surface_readings` (accelerometer data)
- `surface_ratings` (manual ratings)
- `surface_quality` (aggregated per segment)
- `ride_history`

All tables use Supabase Row Level Security.
