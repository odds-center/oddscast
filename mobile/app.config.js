// 환경별 설정
const getEnvironmentConfig = () => {
  const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';

  const configs = {
    development: {
      app: {
        name: 'GoldenRace 개발',
        bundleIdentifier: 'com.goldenrace.app.dev',
        androidPackage: 'com.goldenrace.app.dev',
      },
      google: {
        webClientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
        iosClientId: '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com',
        androidClientId: '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com',
      },
      kra: {
        apiKey:
          'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D',
      },
      googleServiceFiles: {
        android: './google_android_dev.json',
        ios: './google_ios_dev.plist',
      },
    },

    staging: {
      app: {
        name: 'GoldenRace 스테이징',
        bundleIdentifier: 'com.goldenrace.app.staging',
        androidPackage: 'com.goldenrace.app.staging',
      },
      google: {
        webClientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
        iosClientId: '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com',
        androidClientId: '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com',
      },
      kra: {
        apiKey:
          'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D',
      },
      googleServiceFiles: {
        android: './google_android_dev.json',
        ios: './google_ios_dev.plist',
      },
    },

    production: {
      app: {
        name: 'GoldenRace',
        bundleIdentifier: 'com.goldenrace.app',
        androidPackage: 'com.goldenrace.app',
      },
      google: {
        webClientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
        iosClientId: '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com',
        androidClientId: '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com',
      },
      kra: {
        apiKey:
          'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D',
      },
      googleServiceFiles: {
        android: './google_android_prod.json',
        ios: './google_ios_prod.plist',
      },
    },
  };

  return configs[env] || configs.development;
};

const config = getEnvironmentConfig();

module.exports = ({ config: expoConfig }) => {
  return {
    ...expoConfig,
    name: config.app.name,
    android: {
      ...expoConfig.android,
      package: config.app.androidPackage,
      googleServicesFile: config.googleServiceFiles.android,
    },
    ios: {
      ...expoConfig.ios,
      bundleIdentifier: config.app.bundleIdentifier,
      googleServicesFile: config.googleServiceFiles.ios,
      displayName: config.app.name,
    },
    extra: {
      eas: {
        projectId: 'df66e1e3-4e6f-4415-bb26-006a1c34fba0',
      },
      environment: process.env.APP_ENV || process.env.NODE_ENV || 'development',
      // 환경 설정에서 가져온 값들
      webClientId: config.google.webClientId,
      iosClientId: config.google.iosClientId,
      kraApiKey: config.kra.apiKey,
    },
    updates: {
      enabled: true,
      runtimeVersion: {
        policy: 'appVersion',
      },
    },
  };
};
