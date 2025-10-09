import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

export default function TermsScreen() {
  const router = useRouter();

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
            <Ionicons name='document-text' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            <ThemedText type='title' style={styles.title}>
              서비스 이용약관
            </ThemedText>
          </View>
          <ThemedText type='caption' style={styles.subtitle}>
            Golden Race 게임 이용 안내
          </ThemedText>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 중요 안내 */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name='warning' size={24} color='#FF6B6B' />
            <ThemedText style={styles.warningTitle}>중요 안내</ThemedText>
          </View>
          <ThemedText style={styles.warningText}>
            본 서비스는 AI/ML 기술을 활용한 경마 예측 게임입니다.{'\n\n'}
            교육 및 엔터테인먼트 목적으로 제공되며, 포인트는 게임 내 가상 화폐로 현금 가치가
            없습니다.
          </ThemedText>
        </View>

        {/* 포인트 안내 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name='information-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.sectionTitle}>포인트 시스템</ThemedText>
          </View>
          <View style={styles.contentBox}>
            <View style={styles.listItem}>
              <Ionicons name='checkmark-circle' size={18} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.listText}>
                포인트는 게임 내에서만 유효한 가상 화폐입니다
              </ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='checkmark-circle' size={18} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.listText}>
                포인트는 게임 플레이 및 랭킹 참여에만 사용됩니다
              </ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='checkmark-circle' size={18} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.listText}>
                포인트는 현금으로 전환하거나 환불받을 수 없습니다
              </ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='checkmark-circle' size={18} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.listText}>
                포인트 충전 및 결제 기능은 제공되지 않습니다
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 게임 성격 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name='game-controller' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.sectionTitle}>서비스 목적</ThemedText>
          </View>
          <View style={styles.contentBox}>
            <ThemedText style={styles.contentText}>
              Golden Race는 AI 기반 경마 예측 게임으로, 다음의 목적으로 제공됩니다:
            </ThemedText>
            <View style={styles.listItem}>
              <Ionicons name='star' size={18} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.listText}>AI/ML 기술을 활용한 예측 시스템 학습</ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='star' size={18} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.listText}>데이터 분석 및 의사결정 능력 향상</ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='star' size={18} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.listText}>사용자 간 예측 능력 경쟁 (랭킹)</ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='star' size={18} color={GOLD_THEME.GOLD.LIGHT} />
              <ThemedText style={styles.listText}>엔터테인먼트 및 여가 활동</ThemedText>
            </View>
          </View>
        </View>

        {/* 금지 사항 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name='ban' size={20} color='#FF6B6B' />
            <ThemedText style={[styles.sectionTitle, { color: '#FF6B6B' }]}>금지 사항</ThemedText>
          </View>
          <View style={styles.contentBox}>
            <View style={styles.listItem}>
              <Ionicons name='close-circle' size={18} color='#FF6B6B' />
              <ThemedText style={styles.listText}>포인트의 현금 전환 시도</ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='close-circle' size={18} color='#FF6B6B' />
              <ThemedText style={styles.listText}>포인트 불법 거래 또는 양도</ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='close-circle' size={18} color='#FF6B6B' />
              <ThemedText style={styles.listText}>실제 도박/베팅 목적의 사용</ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='close-circle' size={18} color='#FF6B6B' />
              <ThemedText style={styles.listText}>서비스 부정 사용 및 악용</ThemedText>
            </View>
          </View>
        </View>

        {/* 법적 고지 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name='shield-checkmark' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.sectionTitle}>법적 고지</ThemedText>
          </View>
          <View style={styles.contentBox}>
            <ThemedText style={styles.contentText}>
              본 서비스는 한국 법률을 준수하며, 다음 법률에 따라 운영됩니다:
            </ThemedText>
            <View style={styles.listItem}>
              <Ionicons name='chevron-forward' size={16} color={GOLD_THEME.TEXT.TERTIARY} />
              <ThemedText style={styles.listText}>게임산업진흥에 관한 법률</ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='chevron-forward' size={16} color={GOLD_THEME.TEXT.TERTIARY} />
              <ThemedText style={styles.listText}>사행행위 등 규제 및 처벌특례법</ThemedText>
            </View>
            <View style={styles.listItem}>
              <Ionicons name='chevron-forward' size={16} color={GOLD_THEME.TEXT.TERTIARY} />
              <ThemedText style={styles.listText}>정보통신망법</ThemedText>
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
  warningSection: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    marginBottom: 24,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '700',
  },
  warningText: {
    color: '#FF6B6B',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 16,
    fontWeight: '700',
  },
  contentBox: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    gap: 12,
  },
  contentText: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listText: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
});
