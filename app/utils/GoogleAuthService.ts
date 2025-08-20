import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { WEB_GOOGLE_CLIENT_ID, IOS_GOOGLE_CLIENT_ID } from './Constants';

class GoogleAuthService {
  constructor() {
    GoogleSignin.configure({
      webClientId: WEB_GOOGLE_CLIENT_ID,
      iosClientId: IOS_GOOGLE_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }

  async signIn() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      return userInfo;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.warn('Google signOut error:', e);
    }
  }

  async isSignedIn() {
    try {
      const user = await GoogleSignin.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('Check sign-in status error:', error);
      return false;
    }
  }

  async getCurrentUser() {
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async getTokens() {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens;
    } catch (error) {
      console.warn('Failed to get tokens:', error);
      return null;
    }
  }
}

const googleAuth = new GoogleAuthService();
export default googleAuth;
