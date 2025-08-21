import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';
import { PageHeader } from '@/components/common/PageHeader';
import { useRouter } from 'expo-router';

const mockFavorites = [
  { id: '1', name: '금빛질주', recent: '1위, 2위, 1위' },
  { id: '2', name: '천리마', recent: '3위, 1위, 2위' },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors, spacing, radii, fonts } = useAppTheme();
  const [favorites, setFavorites] = useState(mockFavorites);

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter((f) => f.id !== id));
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { padding: spacing.l },
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      marginBottom: spacing.s,
      borderWidth: 1,
      borderColor: colors.border,
    },
    name: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
    },
    recent: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    empty: {
      textAlign: 'center',
      color: colors.textTertiary,
      marginTop: 40,
      fontFamily: fonts.body,
    },
  });

  return (
    <View style={styles.container}>
      <PageHeader
        title='즐겨찾기'
        subtitle='관심 말 관리'
        showBackButton={true}
        onBackPress={() => router.back()}
      />
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
              <Ionicons name='trash' size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>즐겨찾기한 말이 없습니다.</Text>}
      />
    </View>
  );
}
