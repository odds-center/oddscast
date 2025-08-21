const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 빠른 새로고침을 위한 설정
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// 캐시 설정 최적화
config.cacheStores = [];

// 파일 감시 설정
config.watchFolders = [__dirname];

// 번들링 최적화
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
