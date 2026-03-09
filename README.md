# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.




# Noxa — Custom Ringtone Integration Guide

## What was added

| File | Status | Purpose |
|---|---|---|
| `src/services/ringtonePlayer.js` | 🆕 New | Low-level Web Audio API engine |
| `src/services/ringtoneManager.js` | 🆕 New | Catalogue, selection, preloading |
| `src/context/NotificationContext.jsx` | ✏️ Updated | Wired ringtoneManager into sound playback |
| `public/sw.js` | ✏️ Updated | BroadcastChannel + silent push + action buttons |
| `src/components/NotificationSoundSettings.jsx` | 🆕 New | Settings UI with picker + preview + volume |

---

## Step 1 — Add audio files

Create this folder in your project:

```
public/
  sounds/
    ringtones/
      default.mp3
      classic-ring.mp3
      soft-chime.mp3
      bell.mp3
      ding.mp3
      alert.mp3
      retro-phone.mp3
```

### Free ringtone sources (no attribution required)
- **Mixkit** → https://mixkit.co/free-sound-effects/phone/
- **Freesound** → https://freesound.org (filter: Creative Commons 0)
- **Zapsplat** → https://zapsplat.com (free with account)

Download MP3 files and rename them to match the filenames above.

### Convert any audio file with ffmpeg
```bash
# WAV / OGG / M4A → MP3
ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3
```

---

## Step 2 — Add the settings UI to your settings page

```jsx
// e.g. src/pages/Settings.jsx
import NotificationSoundSettings from '../components/NotificationSoundSettings';

export default function Settings() {
  return (
    <div>
      <h1>Settings</h1>
      {/* ...other settings... */}
      <NotificationSoundSettings />
    </div>
  );
}
```

---

## Step 3 — Turn on custom ringtones in the UI

In the Noxa settings panel:
1. Enable **"Use custom ringtones"**
2. Pick a ringtone from the list and click **▶ Preview**
3. Click **🔊 Test Current Sound** to confirm it plays

---

## Step 4 — How the sound flow works

### When the app tab is open (WebSocket notification):
```
Socket emits 'notification'
  → addNotification() called
  → playNotificationSound() called
  → notificationSettings.customRingtones === true?
      YES → ringtoneManager.ring()  (Web Audio API)
      NO  → audioRef HTMLAudio beep (original behaviour)
```

### When the app tab is open (push notification arrives):
```
Push arrives at service worker
  → sw.js checks for visible tab
  → Posts { type: 'PLAY_RINGTONE' } on BroadcastChannel
  → NotificationContext listener receives it
  → playNotificationSound() fires
  → OS notification shown with silent: true (no double beep)
```

### When the app tab is closed (push notification):
```
Push arrives at service worker
  → No visible tab found
  → OS notification shown normally (OS plays default sound)
  → User taps notification → app opens → no extra sound
```

---

## Step 5 — Customise the ringtone catalogue

Edit `src/services/ringtoneManager.js` → `RINGTONE_CATALOGUE`:

```js
export const RINGTONE_CATALOGUE = {
  MySound: {
    label: 'My Custom Sound',
    url: '/sounds/ringtones/my-sound.mp3',
    loop: false,   // true = loops until stopRingtone() is called
  },
  // ...
};
```

---

## New settings stored in localStorage

Key: `noxa_notification_settings`

```json
{
  "enableNotifications": true,
  "pushNotifications": false,
  "customRingtones": true,
  "defaultSound": "Classic",
  "soundEnabled": true,
  "ringtoneVolume": 0.8
}
```

---

## New context API

```js
const {
  previewRingtone,    // (name: string) → plays once, good for settings UI
  stopRingtone,       // () → fades out and stops current sound
  ringtoneList,       // [{ name, label, selected }] for building your own UI
  RINGTONE_CATALOGUE, // raw catalogue object
} = useContext(NotificationContext);
```

---

## Browser support

| Browser | Web Audio API | Push | Notes |
|---|---|---|---|
| Chrome 66+ | ✅ | ✅ | Full support |
| Firefox 76+ | ✅ | ✅ | Full support |
| Safari 14.1+ | ✅ | ✅ (macOS) | Requires user gesture |
| Edge 79+ | ✅ | ✅ | Full support |
| iOS Safari | ⚠️ | ❌ | Audio requires gesture; no push |

**iOS note:** On iOS, the Web Audio API requires a user interaction before
any sound plays. The existing gesture listener (`click`, `keydown`, `touchstart`)
in NotificationContext handles this automatically.