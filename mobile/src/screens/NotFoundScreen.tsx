import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Index: undefined;
  Webview: { initialUrl?: string };
  NotFound: undefined;
};

export default function NotFoundScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'NotFound'>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>존재하지 않는 화면입니다.</Text>
      <TouchableOpacity
        onPress={() => navigation.replace('Webview' as never)}
        style={styles.link}
      >
        <Text style={styles.linkText}>홈으로 이동</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c0c0c',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  linkText: {
    color: '#FFD700',
    fontSize: 16,
  },
});
