module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      // Restreindre aux variables vraiment nécessaires côté app
      allowlist: ['GOOGLE_WEB_CLIENT_ID', 'GOOGLE_IOS_CLIENT_ID', 'SERVER_URL', 'CLIENT_API_KEY', 'BYPASS_PROXY', 'REVENUECAT_IOS_API_KEY', 'REVENUECAT_ANDROID_API_KEY'],
      safe: false,
      allowUndefined: true
    }],
    ['module-resolver', {
      root: ['./src'],
      extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
      alias: {
        '@': './src',
      }
    }],
    'react-native-worklets/plugin',
  ]
};
