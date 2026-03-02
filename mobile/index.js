/**
 * App entry — React Native CLI (no Expo).
 */
import { AppRegistry } from 'react-native';
import App from './App';
// Component name must match MainActivity.getMainComponentName() ("main")
AppRegistry.registerComponent('main', () => App);
