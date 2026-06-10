# 🏨 Marriott Staff Alerts — POC Demo

A proof-of-concept React Native (Expo) mobile app demonstrating a real-time staff alert system for hotel operations. Built for demo purposes — **no backend required**.

![Marriott Staff Alerts](https://img.shields.io/badge/Expo-SDK%2056-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.85-61DAFB?logo=react&logoColor=white)

---

## 📱 Screenshots Overview

| Alert Feed | Alert Detail | Create Alert | Settings |
|------------|--------------|--------------|----------|
| Live alert list with severity badges | Full details + acknowledge | Admin broadcast form | Role toggle + stats |

---

## ✨ Features

### Alert Feed (Home)
- Live-style feed of hotel staff alerts, newest first
- Color-coded severity badges: **Critical** (red), **High** (orange), **Medium** (yellow), **Low** (blue)
- Unread indicator dot + count in tab badge
- Pull-to-refresh animation
- Tap any card → Alert Detail view
- **FAB** (+) button visible to Admin role only → Create Alert

### Create Alert *(Admin role only)*
- Form with: Title, Description, Action Required, Severity picker
- On submit: adds to alert feed + schedules a **local push notification** via `expo-notifications`
- Staff role sees a locked screen

### Alert Detail
- Full alert: severity badge, timestamp, description, action required section
- **Acknowledge** button — marks alert as read with visual confirmation
- Severity-colored header for instant visual triage

### Settings
- **Role toggle**: Admin ↔ Staff (simulates different user permissions)
- Session statistics: total alerts, acknowledged count, critical count
- App info panel

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/client) app on your iOS or Android device (or a simulator)

### Setup

```bash
git clone https://github.com/chrisegener-jazzware/marriott-alerts-poc.git
cd marriott-alerts-poc
npm install
npx expo start
```

Scan the QR code in your terminal with the **Expo Go** app to launch on your device.

### Running on specific platforms

```bash
# iOS Simulator (macOS only)
npx expo start --ios

# Android Emulator
npx expo start --android

# Web browser
npx expo start --web
```

---

## 🏗️ Architecture

```
src/
├── context/
│   └── AlertContext.tsx     # Global state (alerts, role, add/acknowledge)
├── data/
│   └── mockAlerts.ts        # 6 pre-seeded demo alerts
├── navigation/
│   └── AppNavigator.tsx     # Bottom tabs + stack navigator
├── screens/
│   ├── AlertFeedScreen.tsx  # Home feed with FAB
│   ├── AlertDetailScreen.tsx# Full alert + acknowledge
│   ├── CreateAlertScreen.tsx# Admin broadcast form
│   └── SettingsScreen.tsx   # Role toggle + stats
├── components/
│   ├── AlertCard.tsx        # Feed card with severity border
│   └── SeverityBadge.tsx    # Colored severity chip
├── types/
│   └── index.ts             # TypeScript interfaces
└── utils/
    └── time.ts              # Relative/absolute time formatting
```

### State Management
- **React Context** — no Redux/Zustand needed for this demo
- All state lives in `AlertContext`; pre-seeded with 6 mock alerts on launch
- New alerts prepend to the list; acknowledged state persists in-session

### Notifications
- `expo-notifications` schedules an **immediate local notification** when an admin submits a new alert
- Works in Expo Go on device (requires notification permission grant)
- Silently skips on web/simulator

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `#1C1C1C` | Dark Navy | Headers, tab bar, FAB shadow |
| `#B8860B` | Dark Gold | Accents, active tabs, submit button |
| `#F4F4F6` | Off White | Screen backgrounds |
| `#FFFFFF` | White | Cards |

### Severity Colors

| Level | Background | Text | Border |
|-------|-----------|------|--------|
| Critical | `#FDECEA` | `#C62828` | `#E53935` |
| High | `#FFF3E0` | `#E65100` | `#FB8C00` |
| Medium | `#FFFDE7` | `#F57F17` | `#FDD835` |
| Low | `#E3F2FD` | `#1565C0` | `#1E88E5` |

---

## 📋 Mock Data

6 pre-seeded alerts covering the full severity range:

| Alert | Severity | Status |
|-------|----------|--------|
| Fire Alarm — Floor 12 | 🔴 Critical | Unread |
| Medical Emergency — Lobby Bar | 🟠 High | Unread |
| VIP Guest Arrival | 🟡 Medium | Unread |
| Elevator 3 Out of Service | 🟠 High | Acknowledged |
| Pool Area Maintenance | 🔵 Low | Acknowledged |
| Room Service Delay Alert | 🔵 Low | Unread |

---

## 🛠️ Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| Expo SDK | ~56.x | Managed workflow, build tooling |
| React Native | 0.85 | UI framework |
| TypeScript | ~6.x | Type safety |
| React Navigation | 7.x | Tab + stack navigation |
| expo-notifications | latest | Local push notifications |
| React Context | built-in | State management |

---

## 📝 Notes

- **Pure frontend demo** — no backend, database, or Supabase
- All data is in-memory; resets on app restart
- Designed for Expo Go quick demo scanning
- Role switching simulates what would be auth/RBAC in production

---

*Proof of concept — not an official Marriott International product.*
