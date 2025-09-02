import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { PageLayout } from '@/components/common/PageLayout';
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
        {favorites.length > 0 ? (
          favorites.map((item) => (
            <View key={item.id} style={styles.item}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.recent}>최근 성적: {item.recent}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFavorite(item.id)}>
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
