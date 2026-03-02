const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    ...defaultConfig.transformer,
    minifierConfig: {
      keep_fnames: true,
      mangle: { keep_fnames: true },
    },
  },
  resolver: {
    ...defaultConfig.resolver,
    platforms: ['ios', 'android', 'native'],
  },
  watchFolders: [defaultConfig.watchFolders].flat().filter(Boolean),
};

module.exports = mergeConfig(defaultConfig, config);
