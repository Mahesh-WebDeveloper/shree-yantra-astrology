/**
 * Config plugin: copies the bundled static web app (./dist) into the native
 * Android assets folder at prebuild time so the WebView can load the EXACT
 * approved web UI offline via file:///android_asset/site/index.html.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

module.exports = function withWebDist(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, 'dist');
      const dest = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets', 'site');
      if (!fs.existsSync(src)) {
        throw new Error('[withWebDist] ./dist not found — build the static site into mobile/dist first.');
      }
      if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
      copyDir(src, dest);
      // eslint-disable-next-line no-console
      console.log('[withWebDist] copied web app → android/app/src/main/assets/site');
      return cfg;
    },
  ]);
};
