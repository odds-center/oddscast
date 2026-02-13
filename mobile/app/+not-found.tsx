import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>존재하지 않는 화면입니다.</Text>
      <Link href='/webview' style={styles.link}>
        <Text style={styles.linkText}>홈으로 이동</Text>
      </Link>
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
