import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

const earnMethods = [
  {
    id: 'daily',
    icon: 'calendar',
    title: '일일 출석',
    description: '매일 앱에 접속하면 포인트를 획득할 수 있습니다',
    points: '100P',
    color: GOLD_THEME.GOLD.LIGHT,
  },
  {
    id: 'betting',
    icon: 'trophy',
    title: '베팅 참여',
    description: '경마 베팅에 참여하면 포인트를 획득할 수 있습니다',
    points: '베팅 금액의 1%',
    color: GOLD_THEME.GOLD.MEDIUM,
  },
  {
    id: 'win',
    icon: 'star',
    title: '승리 보너스',
    description: '베팅에서 승리하면 추가 포인트를 획득할 수 있습니다',
    points: '승리 금액의 5%',
    color: GOLD_THEME.GOLD.DARK,
  },
  {
    id: 'referral',
    icon: 'people',
    title: '친구 초대',
    description: '친구를 초대하면 포인트를 획득할 수 있습니다',
    points: '1,000P',
    color: GOLD_THEME.GOLD.LIGHT,
  },
  {
    id: 'event',
    icon: 'gift',
    title: '이벤트 참여',
    description: '특별 이벤트에 참여하면 포인트를 획득할 수 있습니다',
    points: '이벤트별 상이',
    color: GOLD_THEME.GOLD.MEDIUM,
  },
];

export default function PointsEarnScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const EarnMethodCard = ({ method }: { method: (typeof earnMethods)[0] }) => (
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
            <Ionicons name='gift' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            <ThemedText type='title' style={styles.title}>
              포인트 획득 방법
            </ThemedText>
          </View>
          <ThemedText type='caption' style={styles.subtitle}>
            다양한 방법으로 포인트를 획득하세요
          </ThemedText>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 획득 방법 목록 */}
        <View style={styles.methodsContainer}>
          {earnMethods.map((method) => (
            <EarnMethodCard key={method.id} method={method} />
          ))}
        </View>

        {/* 추가 정보 */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name='information-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.infoTitle}>포인트 획득 안내</ThemedText>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name='checkmark-circle' size={16} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.infoText}>포인트는 실시간으로 적립됩니다</ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name='checkmark-circle' size={16} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.infoText}>
                획득한 포인트는 마이페이지에서 확인할 수 있습니다
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name='checkmark-circle' size={16} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.infoText}>
                포인트는 베팅에 사용하거나 상품으로 교환할 수 있습니다
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
    marginBottom: 40,
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
});
