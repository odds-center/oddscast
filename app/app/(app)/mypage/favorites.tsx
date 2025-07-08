import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';

const mockFavorites = [
  { id: '1', name: '금빛질주', recent: '1위, 2위, 1위' },
  { id: '2', name: '천리마', recent: '3위, 1위, 2위' },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState(mockFavorites);

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter((f) => f.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='chevron-back' size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>즐겨찾기</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.recent}>최근 성적: {item.recent}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFavorite(item.id)}>
              <Ionicons name='trash' size={22} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>즐겨찾기한 말이 없습니다.</Text>}
      />
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
  listContent: { padding: theme.spacing.l },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  name: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
  },
  recent: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.textTertiary,
    marginTop: 40,
    fontFamily: theme.fonts.body,
  },
});
