import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('ko');

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='chevron-back' size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>다크 모드</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            thumbColor={darkMode ? theme.colors.primary : theme.colors.border}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'center',
  },
  section: { padding: theme.spacing.l },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.text,
  },
  languageBtn: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.radii.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  languageText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
    fontSize: 16,
  },
});
