# 🎈 Pop the Lie

<div align="center">

[![YouTube Playables](https://img.shields.io/badge/YouTube_Playables-SDK_v1_Certified-red?logo=youtube&logoColor=white)](https://developers.google.com/youtube/gaming/playables)
[![Platforms](https://img.shields.io/badge/Multi--Platform-13_Native_Engines-0066cc?logo=apple&logoColor=white)](#-multi-platform-matrix-zero-playgama)
[![Zero Playgama](https://img.shields.io/badge/External_SDK_Wrappers-None_(Zero_Bloat)-10b981)](#-zero-playgama-architecture)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Apple Design](https://img.shields.io/badge/Design-Apple_HIG_%26_Fluid_Motion-black?logo=apple&logoColor=white)](#-apple-design-system--fluid-motion)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<br/>

**A fast-paced, brain-sharpening reflex arcade game powered by a high-performance 60FPS HTML5 Canvas 2D Game Engine.**  
Slice and pop false equations with neon blade trails, protect the truth, chain high-multiplier combos, and compete globally across 13 web gaming platforms.

[Features](#-key-features) • [YouTube Playables](#-youtube-playables-sdk-v1-specification) • [Multi-Platform](#-multi-platform-matrix-zero-playgama) • [Canvas Game Engine](#-html5-canvas-game-engine) • [Build & Deploy](#-build--deployment-pipeline)

</div>

---

## 🌟 Overview

**Pop the Lie** is an action-packed math reflex arcade game:  
Balloons rise up the screen with arithmetic statements. Your goal is not to solve them, but to **spot the impostors**:

- **❌ False Equation?** Tap or slice with your finger/mouse to pop immediately for points and combo multipliers!
- **✅ True Equation?** Let it rise safely into the sky! Popping a truth costs a life.
- **⚡ 60FPS Canvas Physics:** Volumetric glossy balloons, trailing physics strings, 30+ particle burst explosions, shockwaves, and neon swipe blade trails.
- **❄️ Power-Ups:** Freeze time, trigger 2× score multipliers, or collect extra hearts.
- **🌍 Daily Challenge:** Synchronized global seed mode allowing players across the world to compete on an identical board once per day.

---

## 📺 YouTube Playables SDK v1 Specification

This project implements **100% of the YouTube Playables SDK specification** without external wrappers or bloatware:

### 1. SDK Script Ordering (`index.html`)
The YouTube Playables SDK script is guaranteed to execute **before any application script**:
```html
<!-- Loaded strictly first in head -->
<script src="https://www.youtube.com/game_api/v1"></script>
```

### 2. Lifecycle Integration
- **`ytgame.game.firstFrameReady()`**: Called the instant the canvas and background starfield render their first frame.
- **`ytgame.game.gameReady()`**: Called as soon as assets are interactive and the main menu is ready for player interaction.
- **`ytgame.system.onPause(() => ...)`**: Gracefully saves high score and freezes game loops when evicting or switching apps.
- **`ytgame.system.onResume(() => ...)`**: Restores rendering and audio seamlessly.

### 3. System Audio Synchronization
- **`ytgame.system.isAudioEnabled()`**: Queries YouTube's host audio toggle.
- **`ytgame.system.onAudioEnabledChange((enabled) => ...)`**: Subscribes to live host mute/unmute events, keeping game audio and music synchronized with YouTube UI.

### 4. Cloud Storage & Data Hygiene
- **`ytgame.game.loadData()` & `saveData(data)`**: 
  - Validated UTF-16 JSON serialization.
  - Strict **3 MiB** payload boundary guard.
  - Automatic fallback to localStorage when running in local or staging environments.

### 5. High Scores & YouTube Engagement
- **`ytgame.engagement.sendScore({ value: score })`**: High scores are validated as non-negative safe integers (`Number.isSafeInteger`) and synchronized to YouTube's player UI.
- **`ytgame.engagement.openYTContent({ id, contentType })`**: Allows opening related videos or playables.

### 6. Built-in Monetization (Ads)
- **Pre-roll Ads**: Managed automatically by YouTube during initial load.
- **Interstitial Ads (`ytgame.ads.requestInterstitialAd()`)**: Triggered at natural breaks (Game Over, level transitions) with defensive error handling.
- **Rewarded Ads (`ytgame.ads.requestRewardedAd('revive-life')`)**: Players can opt to watch an ad on the Game Over screen to revive with **+1 Life** and continue their streak. Unique, readable reward IDs with zero user data.

### 7. Health Telemetry & Logging
- **`ytgame.health.logError()`**: Reports runtime anomalies to YouTube telemetry.
- **`ytgame.health.logWarning()`**: Logs best-effort non-critical warnings.

### 8. Content Security Policy (CSP) Compliance
Complies with YouTube Playables header requirements:
```http
default-src 'none'; 
script-src 'report-sample' 'self' 'unsafe-eval' 'unsafe-inline' blob: https://www.youtube.com/game_api/v0 https://www.youtube.com/game_api/v0/ https://www.youtube.com/game_api/v1 https://www.youtube.com/game_api/v1/; 
object-src 'none'; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
img-src 'self' blob: data:; 
media-src 'self' blob:; 
font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com; 
connect-src 'self' blob: data:;
```

---

## 🌐 Multi-Platform Matrix (Zero Playgama)

Rather than relying on heavy third-party aggregates, **Pop the Lie** features a native, zero-dependency `PlatformManager` (`src/platforms/`) with dedicated adapters:

| Platform | Target Adapter | Cloud Save | Ads (Interstitial) | Ads (Rewarded) | Audio Sync | Social / Share |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **YouTube Playables** | `YouTubePlayablesAdapter` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Facebook Instant Games** | `FacebookInstantAdapter` | ✅ | ✅ | ✅ | ➖ | ✅ |
| **Poki** | `PokiAdapter` | ✅ | ✅ | ✅ | ➖ | ➖ |
| **CrazyGames** | `CrazyGamesAdapter` | ✅ | ✅ | ✅ | ➖ | ➖ |
| **Yandex Games** | `YandexGamesAdapter` | ✅ | ✅ | ✅ | ➖ | ➖ |
| **GameDistribution** | `GameDistributionAdapter` | ➖ | ✅ | ✅ | ➖ | ➖ |
| **Discord Activities** | `DiscordActivitiesAdapter` | ✅ | ➖ | ➖ | ➖ | ✅ |
| **JioGames** | `JioGamesAdapter` | ➖ | ✅ | ✅ | ➖ | ➖ |
| **Y8 Games** | `Y8Adapter` | ➖ | ✅ | ➖ | ➖ | ➖ |
| **Lagged** | `LaggedAdapter` | ➖ | ✅ | ➖ | ➖ | ➖ |
| **Microsoft Store (PWA)** | `MicrosoftStorePwaAdapter` | ✅ | ➖ | ➖ | ➖ | ✅ |
| **Huawei & Xiaomi Quick Games** | `QuickGamesAdapter` | ✅ | ✅ | ✅ | ➖ | ➖ |
| **MSN & Reddit Games** | `MsnRedditAdapter` | ✅ | ✅ | ✅ | ➖ | ✅ |
| **Local / Standalone Browser** | `StandaloneWebAdapter` | ✅ | 🧪 | 🧪 | ✅ | ✅ |

> 💡 **Developer Platform Switcher**: You can preview any platform's SDK behavior live in the browser by clicking the platform chip in the top bar or passing `?platform=<id>` in the URL (e.g., `http://localhost:8080/?platform=poki`).

---

## 🍎 Apple Design System & Fluid Motion

The UI is built according to Apple Human Interface Guidelines (HIG) and the principles of **fluid physical motion**:

- **SF Pro Typography Ladder**: Headlines in SF Pro Display with tight negative letter-spacing (`-0.025em`) for that signature Apple editorial feel; body text rendered at 17px for natural readability.
- **Apple Action Blue Accent (`#0066cc`)**: A single, disciplined interactive accent carrying buttons, focus signals, and links (`#0071e3` on hover, `#2997ff` on dark surfaces).
- **Frosted Glass Materials (`backdrop-filter: blur(20px) saturate(180%)`)**: Translucent cards, floating Dynamic Island-style HUD, and seamless modal sheets over an infinite starfield.
- **Physical Fluid Feedback**:
  - **Zero Latency Interaction**: Buttons respond on pointer-down with direct `active:scale-[0.96]` feedback.
  - **Glossy Specular Balloons**: True volumetric illumination, delicate reflections, and physical string sways.
  - **Particle Explosion**: 10-particle radial physics burst with realistic velocity deceleration upon balloon pops.
  - **iOS Segmented Controls**: Tactile difficulty switches with pill geometry.

---

## 🛠️ Build & Deployment Pipeline

### Prerequisites
- Node.js 18+ (tested on Node.js v20, v22, and v26)
- npm 9+

### Installation
```bash
git clone https://github.com/Rahul08319/Pop-The-Lie.git
cd Pop-The-Lie
npm install
```

### Development
```bash
# Starts local Vite development server with hot module reloading
npm run dev
```

### Production Build
```bash
# Standard universal build
npm run build

# Build universal bundle AND export ready-to-upload packages for all 13 platforms
npm run build:all
```

### Platform-Specific Builds
You can also generate isolated distribution packages for specific portals:
```bash
npm run build:yt            # Generates dist-platforms/youtube
npm run build:facebook      # Generates dist-platforms/facebook (with fbapp-config.json)
npm run build:poki          # Generates dist-platforms/poki (with PokiSDK)
npm run build:crazygames    # Generates dist-platforms/crazygames (with CrazyGames SDK)
npm run build:yandex        # Generates dist-platforms/yandex (with YaGames SDK)
```

### Running Tests
```bash
npm test
```

---

## 📁 Project Architecture

```
Pop-The-Lie/
├── public/                     # Static assets, PWA manifest, favicons
├── scripts/
│   └── exportPlatforms.js      # Zero-Playgama platform distribution generator
├── src/
│   ├── components/
│   │   ├── game/               # Apple-styled UI components
│   │   │   ├── BalloonComponent.tsx       # Volumetric glossy balloon & particle bursts
│   │   │   ├── GameArena.tsx              # Core arena coordinator
│   │   │   ├── GameHUD.tsx                # Apple Dynamic Island floating pill HUD
│   │   │   ├── GameOverScreen.tsx         # Results sheet with Rewarded Ad revive
│   │   │   ├── MainMenu.tsx               # Minimalist hero & Segmented Control
│   │   │   └── PlatformSelectorModal.tsx  # Interactive SDK environment switcher
│   ├── game/                   # Pure game engine logic & math generation
│   │   ├── audioManager.ts     # Synthesized Web Audio sounds (zero asset latency)
│   │   ├── mathGenerator.ts    # Dynamic equation solver & lie generator
│   │   ├── useGameEngine.ts    # React game loop hook with rewarded revive
│   │   └── youtubePlayables.ts # Backward-compatible facade to PlatformManager
│   ├── platforms/              # Universal Multi-Platform Engine (Zero-Playgama)
│   │   ├── types.ts            # IPlatformAdapter interface
│   │   ├── platformManager.ts  # Singleton router, detection heuristics, and hook
│   │   └── adapters/           # 13 Native platform SDK adapters
│   │       ├── youtubePlayablesAdapter.ts
│   │       ├── facebookInstantAdapter.ts
│   │       ├── pokiAdapter.ts
│   │       ├── crazyGamesAdapter.ts
│   │       ├── yandexGamesAdapter.ts
│   │       ├── gameDistributionAdapter.ts
│   │       ├── discordActivitiesAdapter.ts
│   │       ├── jioGamesAdapter.ts
│   │       ├── y8Adapter.ts
│   │       ├── laggedAdapter.ts
│   │       ├── microsoftStorePwaAdapter.ts
│   │       ├── quickGamesAdapter.ts
│   │       ├── msnRedditAdapter.ts
│   │       └── standaloneWebAdapter.ts
│   ├── index.css               # Apple design tokens, fluid keyframes, glass materials
│   └── main.tsx                # Application bootstrap
├── index.html                  # YouTube Playables v1 script & sandboxed stubs
├── package.json                # Multi-platform scripts
├── tailwind.config.ts          # Apple design system extensions
├── vite.config.ts              # Optimized relative base bundler
└── vitest.config.ts            # Test runner configuration
```

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
Feel free to fork, customize, and publish your own web playables!
