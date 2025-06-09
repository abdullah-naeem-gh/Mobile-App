const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions if needed
config.resolver.assetExts.push(
  // Add other asset extensions if needed
  'db', 'mp3', 'ttf', 'obj', 'png', 'jpg'
);

module.exports = config;
