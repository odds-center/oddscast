import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText as Text } from '@/components/ThemedText';
import { useHorseFavorites, useRemoveFavorite } from '@/lib/hooks/useFavorites';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

export default function FavoritesScreen() {
  const router = useRouter();

  // API 데이터 조회
  const { data: favorites = [], isLoading: favoritesLoading } = useHorseFavorites();
  const removeFavoriteMutation = useRemoveFavorite();

  const handleRemoveFavorite = async (id: string, name: string) => {
    Alert.alert('즐겨찾기 삭제', `${name}을(를) 즐겨찾기에서 삭제하시겠습니까?`, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFavoriteMutation.mutateAsync(id);
          } catch (error) {
            console.error('즐겨찾기 삭제 실패:', error);
            Alert.alert('오류', '즐겨찾기 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Ionicons name='heart' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            <Text type='title' style={styles.title}>
              즐겨찾기
            </Text>
          </View>
          <Text type='caption' style={styles.subtitle}>
            관심 말 관리
          </Text>
        </View>
      </View>

      {/* 즐겨찾기 목록 */}
      <View style={styles.section}>
        {favoritesLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size='large' color={GOLD_THEME.GOLD.MEDIUM} />
            <Text style={styles.emptyText}>즐겨찾기를 불러오는 중...</Text>
          </View>
        ) : favorites && 'favorites' in favorites && favorites.favorites.length > 0 ? (
          favorites.favorites.map((item: any, index: number) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemContent}>
                <View style={styles.itemNumber}>
                  <Text style={styles.numberText}>{index + 1}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.nameRow}>
                    <Ionicons name='sparkles' size={16} color={GOLD_THEME.GOLD.LIGHT} />
                    <Text style={styles.name}>{item.targetName}</Text>
                  </View>
                  <View style={styles.typeRow}>
                    <Ionicons name='pricetag-outline' size={14} color={GOLD_THEME.TEXT.TERTIARY} />
                    <Text style={styles.recent}>{item.type}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveFavorite(item.id, item.targetName)}
                activeOpacity={0.7}
              >
                <Ionicons name='trash-outline' size={20} color='#FF6B6B' />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name='heart-outline' size={64} color={GOLD_THEME.BORDER.GOLD} />
            </View>
            <Text style={styles.emptyTitle}>즐겨찾기가 비어있습니다</Text>
            <Text style={styles.emptyText}>관심있는 말을 즐겨찾기에 추가해보세요</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/races')}
              activeOpacity={0.8}
            >
              <Ionicons name='add-circle' size={20} color={GOLD_THEME.TEXT.PRIMARY} />
              <Text style={styles.addButtonText}>경주 보러가기</Text>
            </TouchableOpacity>
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
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  subtitle: {
    color: GOLD_THEME.TEXT.TERTIARY,
  },
  section: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recent: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 13,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: GOLD_THEME.TEXT.TERTIARY,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: GOLD_THEME.GOLD.MEDIUM,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
});
