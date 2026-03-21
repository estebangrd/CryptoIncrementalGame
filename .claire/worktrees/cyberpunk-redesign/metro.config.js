const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const mainRepoRoot = path.resolve(__dirname, '../../../../');

const config = {
  watchFolders: [mainRepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(mainRepoRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
