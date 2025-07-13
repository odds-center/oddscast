import { PageHeader } from '@/components/common';
import { ThemedText as Text } from '@/components/ThemedText';
import { useAppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, spacing, radii, fonts } = useAppTheme();
  const { colorScheme, setAppColorScheme } = useColorScheme();
  const [language, setLanguage] = useState('ko');

  const isDarkMode = (colorScheme ?? 'dark') === 'dark';

  const handleToggleDarkMode = (newValue: boolean) => {
    // Don't await to make it synchronous for immediate UI feedback
    setAppColorScheme(newValue ? 'dark' : 'light').catch((error) => {
      console.error('Failed to toggle dark mode:', error);
    });
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    section: { padding: spacing.l },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      marginBottom: spacing.s,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 16,
      color: colors.text,
    },
    languageBtn: {
      backgroundColor: colors.primary + '20',
      borderRadius: radii.s,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s,
    },
    languageText: {
      fontFamily: fonts.bold,
      color: colors.primary,
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <PageHeader
        title='설정'
        subtitle='앱 설정을 관리하세요'
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>다크 모드</Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleToggleDarkMode}
            thumbColor={isDarkMode ? colors.primary : colors.border}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>언어</Text>
          <TouchableOpacity
            onPress={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            style={styles.languageBtn}
          >
            <Text style={styles.languageText}>{language === 'ko' ? '한국어' : 'English'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
