const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  server: {
    port: 8181,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
