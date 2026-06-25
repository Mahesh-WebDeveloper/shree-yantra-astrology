# Shree Yantra — React Native (Expo) app

A native port of the board-approved Shree Yantra astrology web prototype.
Same colors, fonts, spacing, SVGs and dark/light theme — built with Expo +
React Navigation + Reanimated + react-native-svg for a smooth, production-grade
experience.

> **This is the foundation + hero screens milestone.** Theme system, fonts,
> navigation (bottom tabs + drawer), the gold design system, and the
> **Splash → Onboarding → Welcome → Library** screens are live. Choghadiya,
> Kundli and Profile render as on-brand placeholders and are the next port.

## What's inside

```
mobile/
├─ App.tsx                     # root: fonts + theme + navigation
├─ app.json / eas.json         # Expo + EAS (APK) config
├─ src/
│  ├─ theme/                   # tokens (exact colors/spacing/fonts), ThemeProvider, fonts
│  ├─ components/              # GradientText, GoldButton, Card, Screen, BrandHeader, icons (SVG)
│  ├─ navigation/              # RootNavigator, Tabs, CustomTabBar (glow-pill), DrawerContent (+ theme toggle)
│  └─ screens/                 # Splash, Onboarding, Welcome, Library, Choghadiya, Kundli, Profile
```

The whole palette and spacing come from `src/theme/tokens.ts`, ported 1:1 from
`assets/app-shell.css` — **don't hand-edit colors elsewhere**, change the token.

## 1) Install

Requires Node 18+ and the Expo tooling.

```bash
cd mobile
npm install
# align all native package versions to the installed Expo SDK:
npx expo install --fix
```

## 2) Run it on your phone (instant, no build)

```bash
npm start
```

Then scan the QR with **Expo Go** (Android/iOS) — the app loads over the network.
This is the fastest dev loop for reviewing UI changes.

## 3) Build an installable APK (loads locally on user phones)

Using **EAS cloud build** (no local Android SDK needed):

```bash
npm install -g eas-cli          # once
eas login                        # your Expo account
eas build:configure              # writes the EAS projectId into app.json
eas build -p android --profile preview
```

`--profile preview` produces an **APK** you can download from the build page and
sideload / distribute. For the Play Store, use `--profile production` (AAB).

> Prefer a fully local build? `npx expo prebuild -p android` then
> `cd android && ./gradlew assembleRelease` (needs Android Studio + JDK 17).

## Theme

- **Dark is the default** (client-approved). The drawer **Theme** toggle switches
  Light/Dark and persists via AsyncStorage — same behavior as the web app.
- All gold gradient headings use `GradientText` (MaskedView + LinearGradient),
  the RN equivalent of the web `background-clip: text`.

## Roadmap (next ports)

1. Choghadiya — live engine (sunrise/sunset, vaar rotation, countdown, lists).
2. Kundli — birth chart (SVG), planetary positions, dashas.
3. Library — audio engine (expo-audio), mantra player, book reader sheet.
4. Profile / Edit Profile — avatar upload (expo-image-picker), stats, info.
5. Auth (Sign in / Register), Subscription + Payment, Notifications, Help.

## Notes

- App icon / splash in `assets/` are **placeholders** — replace `icon.png`,
  `adaptive-icon.png`, `splash.png` (1024×1024 recommended) with final branding.
- Fonts are pulled from `@expo-google-fonts/*` (Cinzel, Playfair Display, Inter,
  Noto Sans Devanagari) — the exact families from the web app.
