
import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function ResultsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">경주 결과</ThemedText>
      <ThemedText>지난 경주들의 결과를 확인할 수 있습니다.</ThemedText>
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
