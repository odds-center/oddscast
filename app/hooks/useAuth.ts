import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Failed to load token from AsyncStorage', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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

  return { isAuthenticated, isLoading, signIn, signOut };
}
