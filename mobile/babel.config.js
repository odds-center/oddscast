module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 빠른 새로고침을 위한 플러그인
      'react-native-reanimated/plugin',
      // 개발 모드에서만 사용
      ...(process.env.NODE_ENV === 'development'
        ? [
            [
              'module-resolver',
              {
                root: ['./'],
                alias: {
                  '@': './',
                },
              },
            ],
          ]
        : []),
    ],
    env: {
      development: {
        plugins: [
          // 개발 모드에서 추가 최적화
          [
            '@babel/plugin-transform-react-jsx',
            {
              runtime: 'automatic',
            },
          ],
        ],
      },
    },
  };
};
