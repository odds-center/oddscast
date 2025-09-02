import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText as Text } from '@/components/ThemedText';
import { useHorseFavorites, useRemoveFavorite } from '@/lib/hooks/useFavorites';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const mockFavorites = [
  { id: '1', name: '금빛질주', recent: '1위, 2위, 1위' },
  { id: '2', name: '천리마', recent: '3위, 1위, 2위' },
];

export default function FavoritesScreen() {
  const router = useRouter();

  // API 데이터 조회
  const { data: favorites = [], isLoading: favoritesLoading } = useHorseFavorites();
  const removeFavoriteMutation = useRemoveFavorite();

  const handleRemoveFavorite = async (id: string) => {
    try {
      await removeFavoriteMutation.mutateAsync(id);
    } catch (error) {
      console.error('즐겨찾기 삭제 실패:', error);
    }
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color='#E5C99C' />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text type='title' style={styles.title}>
            즐겨찾기
          </Text>
          <Text type='caption' style={styles.subtitle}>
            관심 말 관리
          </Text>
        </View>
      </View>

      {/* 즐겨찾기 목록 */}
      <View style={styles.section}>
        {favoritesLoading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='refresh' size={48} color='#666' />
            <Text style={styles.empty}>즐겨찾기를 불러오는 중...</Text>
          </View>
        ) : favorites && 'favorites' in favorites && favorites.favorites.length > 0 ? (
          favorites.favorites.map((item: any) => (
            <View key={item.id} style={styles.item}>
              <View>
                <Text style={styles.name}>{item.targetName}</Text>
                <Text style={styles.recent}>타입: {item.type}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveFavorite(item.id)}>
                <Ionicons name='trash' size={22} color='#FF3B30' />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name='heart-outline' size={48} color='#666' />
            <Text style={styles.empty}>즐겨찾기한 말이 없습니다.</Text>
          </View>
        )}
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: '#E5C99C',
    marginBottom: 4,
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
  section: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recent: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    fontSize: 16,
  },
});
