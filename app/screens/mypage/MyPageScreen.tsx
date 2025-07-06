
import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function MyPageScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">마이페이지</ThemedText>
      <ThemedText>관심 경주 목록, 환경 설정 등을 관리할 수 있습니다.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
