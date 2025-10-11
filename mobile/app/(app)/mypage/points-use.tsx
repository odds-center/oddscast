import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

const useMethods = [
  {
    id: 'betting',
    icon: 'trophy',
    title: '예측 게임에 사용',
    description: '경마 예측 게임에서 포인트를 사용할 수 있습니다',
    points: '게임 내 가상 화폐',
    color: GOLD_THEME.GOLD.LIGHT,
  },
  {
    id: 'gift',
    icon: 'gift',
    title: '게임 아이템 구매',
    description: '포인트로 게임 내 다양한 아이템을 구매할 수 있습니다',
    points: '아이템별 상이',
    color: GOLD_THEME.GOLD.DARK,
  },
  {
    id: 'premium',
    icon: 'star',
    title: '프리미엄 기능',
    description: '게임 내 프리미엄 기능을 포인트로 이용할 수 있습니다',
    points: '기능별 상이',
    color: GOLD_THEME.GOLD.LIGHT,
  },
  {
    id: 'ranking',
    icon: 'podium',
    title: '랭킹 참여',
    description: '포인트를 사용하여 랭킹 경쟁에 참여할 수 있습니다',
    points: '시즌별 상이',
    color: GOLD_THEME.GOLD.MEDIUM,
  },
];

export default function PointsUseScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const UseMethodCard = ({ method }: { method: (typeof useMethods)[0] }) => (
    <View style={styles.methodCard}>
      <View style={styles.methodHeader}>
        <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
          <Ionicons name={method.icon as any} size={24} color={GOLD_THEME.TEXT.PRIMARY} />
        </View>
        <View style={styles.methodInfo}>
          <ThemedText style={styles.methodTitle}>{method.title}</ThemedText>
          <ThemedText style={styles.methodPoints}>{method.points}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.methodDescription}>{method.description}</ThemedText>
    </View>
  );

  return (
    <PageLayout>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name='arrow-back' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Ionicons name='card' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            <ThemedText type='title' style={styles.title}>
              포인트 사용 방법
            </ThemedText>
          </View>
          <ThemedText type='caption' style={styles.subtitle}>
            포인트를 다양한 방법으로 활용하세요
          </ThemedText>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 사용 방법 목록 */}
        <View style={styles.methodsContainer}>
          {useMethods.map((method) => (
            <UseMethodCard key={method.id} method={method} />
          ))}
        </View>

        {/* 사용 안내 */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name='information-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.infoTitle}>포인트 사용 안내</ThemedText>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name='checkmark-circle' size={16} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.infoText}>포인트는 실시간으로 차감됩니다</ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name='checkmark-circle' size={16} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.infoText}>사용한 포인트는 복구되지 않습니다</ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name='checkmark-circle' size={16} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.infoText}>
                포인트 잔액은 마이페이지에서 확인할 수 있습니다
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name='checkmark-circle' size={16} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.infoText}>최소 사용 단위는 100P입니다</ThemedText>
            </View>
          </View>
        </View>

        {/* 주의사항 */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name='warning' size={20} color='#FF6B6B' />
            <ThemedText style={styles.warningTitle}>주의사항</ThemedText>
          </View>
          <View style={styles.warningList}>
            <View style={styles.warningItem}>
              <Ionicons name='alert-circle' size={16} color='#FF6B6B' />
              <ThemedText style={styles.warningText}>
                포인트 사용 시 신중하게 결정해주세요
              </ThemedText>
            </View>
            <View style={styles.warningItem}>
              <Ionicons name='alert-circle' size={16} color='#FF6B6B' />
              <ThemedText style={styles.warningText}>
                부정한 방법으로 획득한 포인트는 무효화됩니다
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
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
  container: {
    flex: 1,
  },
  methodsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  methodCard: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodPoints: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 14,
    fontWeight: '500',
  },
  methodDescription: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoTitle: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 16,
    fontWeight: '600',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  warningSection: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    marginBottom: 40,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  warningList: {
    gap: 12,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningText: {
    color: '#FF6B6B',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
