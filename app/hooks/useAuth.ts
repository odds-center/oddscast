import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasStoredToken, setHasStoredToken] = useState<boolean>(false);

  useEffect(() => {
    const checkStoredToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setHasStoredToken(!!token);
      } catch (error) {
        console.error('Failed to load token from AsyncStorage', error);
        setHasStoredToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredToken();
  }, []);

  const autoSignIn = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to auto sign in', error);
      return false;
    }
  };

  const signIn = async (token: string) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save token to AsyncStorage', error);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to remove token from AsyncStorage', error);
    }
  };

  return { isAuthenticated, isLoading, hasStoredToken, signIn, signOut, autoSignIn };
}
