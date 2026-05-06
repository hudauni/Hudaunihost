import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaium.hudauni',
  appName: 'Huda Uni',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      androidClientId: '650683096129-o8mq8rssv9od12trcsvu6dgq4gcf9co9.apps.googleusercontent.com',
      serverClientId: '650683096129-o8mq8rssv9od12trcsvu6dgq4gcf9co9.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#001a1a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      spinnerColor: "#10b981",
    },
  },
};

export default config;
