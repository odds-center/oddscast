import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

// This is a shim for web and Android where the tab bar is generally opaque.
export default undefined;

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
