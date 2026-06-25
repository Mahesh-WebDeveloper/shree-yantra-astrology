// Keep the bundled static web app (./dist) out of Metro's module graph —
// it's copied into native assets by plugins/withWebDist.js, not imported by JS.
// Anchored to THIS project's dist so it never blocks node_modules/*/dist.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const distDir = path.resolve(__dirname, 'dist').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [new RegExp(`^${distDir}[\\\\/].*`)];

module.exports = config;
