const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const monorepoRoot = path.resolve(__dirname, '..');

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
    // pnpm symlinks: mobile/node_modules has symlinks, fallback to root
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // Ensure shared workspace package is watchable
    unstable_enablePackageExports: false,
  },
  watchFolders: [
    ...[defaultConfig.watchFolders].flat().filter(Boolean),
    monorepoRoot,
  ],
};

module.exports = mergeConfig(defaultConfig, config);
