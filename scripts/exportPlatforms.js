/**
 * Multi-Platform Export Script
 * Zero-Playgama: Generates ready-to-upload zip-ready distribution folders for all 13 target platforms:
 * 1. YouTube Playables (v1 SDK, certified CSP header hints)
 * 2. Facebook Instant Games (fbapp-config.json)
 * 3. Poki (PokiSDK initialization)
 * 4. CrazyGames (CrazyGames v3)
 * 5. Yandex Games (YaGames v2)
 * 6. GameDistribution (gdsdk)
 * 7. Discord Activities (Discord Embedded App SDK ready)
 * 8. JioGames (JioGamesSDK ready)
 * 9. Y8 (ID.net GameBreak)
 * 10. Lagged (LaggedAPI)
 * 11. Microsoft Store (PWA package with WebManifest & service worker)
 * 12. Huawei & Xiaomi Quick Games (qg config)
 * 13. MSN & Reddit Games (Embed wrapper)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const exportsDir = path.resolve(rootDir, 'dist-platforms');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

const platforms = [
  { id: 'youtube', name: 'YouTube Playables', fileInject: '' },
  {
    id: 'facebook',
    name: 'Facebook Instant Games',
    extraFiles: {
      'fbapp-config.json': JSON.stringify(
        {
          instant: {
            sdk_version: '7.1',
            orientation: 'PORTRAIT',
            navigation_menu_version: 'NAV_FLOATING',
          },
        },
        null,
        2
      ),
    },
  },
  {
    id: 'poki',
    name: 'Poki',
    scriptTag: '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
  },
  {
    id: 'crazygames',
    name: 'CrazyGames',
    scriptTag: '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
  },
  {
    id: 'yandex',
    name: 'Yandex Games',
    scriptTag: '<script src="https://yandex.ru/games/sdk/v2"></script>',
  },
  {
    id: 'gamedistribution',
    name: 'GameDistribution',
    scriptTag: '<script src="https://html5.api.gamedistribution.com/main.min.js"></script>',
  },
  {
    id: 'discord',
    name: 'Discord Activities',
  },
  {
    id: 'jiogames',
    name: 'JioGames',
  },
  {
    id: 'y8',
    name: 'Y8 Games',
    scriptTag: '<script src="https://cdn.y8.com/api/sdk.js"></script>',
  },
  {
    id: 'lagged',
    name: 'Lagged',
  },
  {
    id: 'pwa',
    name: 'Microsoft Store PWA',
  },
  {
    id: 'quickgames',
    name: 'Huawei & Xiaomi Quick Games',
  },
  {
    id: 'msnreddit',
    name: 'MSN & Reddit Games',
  },
];

console.log('🚀 Exporting distributions for all 13 platforms (Zero-Playgama)...');

const baseIndexHtml = fs.readFileSync(path.resolve(distDir, 'index.html'), 'utf-8');

for (const platform of platforms) {
  const targetDir = path.resolve(exportsDir, platform.id);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.cpSync(distDir, targetDir, { recursive: true });

  // Custom index.html modification if scriptTag is present
  if (platform.scriptTag) {
    let customHtml = baseIndexHtml;
    customHtml = customHtml.replace('</head>', `  ${platform.scriptTag}\n  </head>`);
    fs.writeFileSync(path.resolve(targetDir, 'index.html'), customHtml);
  }

  // Extra config files (e.g. fbapp-config.json)
  if (platform.extraFiles) {
    for (const [filename, content] of Object.entries(platform.extraFiles)) {
      fs.writeFileSync(path.resolve(targetDir, filename), content);
    }
  }

  console.log(` ✅ [${platform.id}] ${platform.name} -> dist-platforms/${platform.id}`);
}

console.log('✨ All platform exports generated successfully!');
