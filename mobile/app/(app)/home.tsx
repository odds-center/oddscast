import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { useAuth } from '@/context/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <PageLayout>
      {/* 사용자 환영 메시지 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          환영합니다!
        </ThemedText>
        <View style={styles.welcomeContainer}>
          <View style={styles.userInfo}>
            <ThemedText type='title' style={styles.welcomeText}>
              안녕하세요, {user?.name || '사용자'}님!
            </ThemedText>
            <ThemedText type='body' style={styles.welcomeSubtext}>
              오늘도 행운을 빕니다 🍀
            </ThemedText>
          </View>
          <View style={styles.userAvatar}>
            <Ionicons name='person-circle' size={40} color='#FFD700' />
          </View>
        </View>
      </View>

      {/* 베팅 현황 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          베팅 현황
        </ThemedText>
        <View style={styles.bettingSummary}>
          <View style={styles.bettingStat}>
            <ThemedText type='stat' style={styles.bettingNumber}>
              0
            </ThemedText>
            <ThemedText type='caption' style={styles.bettingLabel}>
              총 베팅
            </ThemedText>
          </View>
          <View style={styles.bettingStat}>
            <ThemedText type='stat' style={styles.bettingNumber}>
              0
            </ThemedText>
            <ThemedText type='caption' style={styles.bettingLabel}>
              당첨
            </ThemedText>
          </View>
          <View style={styles.bettingStat}>
            <ThemedText type='stat' style={styles.bettingNumber}>
              0%
            </ThemedText>
            <ThemedText type='caption' style={styles.bettingLabel}>
              승률
            </ThemedText>
          </View>
        </View>
      </View>

      {/* 오늘의 경주 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          오늘의 경주
        </ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText type='body' style={styles.emptyText}>
            오늘 예정된 경주가 없습니다.
          </ThemedText>
        </View>
      </View>

      {/* 빠른 액션 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          빠른 액션
        </ThemedText>
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/betting')}>
            <View style={styles.featureIcon}>
              <Ionicons name='game-controller' size={28} color='#FFD700' />
            </View>
            <ThemedText style={styles.actionCardText}>베팅하기</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/races')}>
            <View style={styles.featureIcon}>
              <Ionicons name='trophy' size={28} color='#FFD700' />
            </View>
            <ThemedText style={styles.actionCardText}>경주 보기</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/points')}>
            <View style={styles.featureIcon}>
              <Ionicons name='wallet' size={28} color='#FFD700' />
            </View>
            <ThemedText style={styles.actionCardText}>포인트</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/mypage')}>
            <View style={styles.featureIcon}>
              <Ionicons name='person' size={28} color='#FFD700' />
            </View>
            <ThemedText style={styles.actionCardText}>마이페이지</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 더 많은 기능 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          더 많은 기능
        </ThemedText>
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/results')}>
            <View style={styles.featureIcon}>
              <Ionicons name='analytics' size={24} color='#FFD700' />
            </View>
            <ThemedText style={styles.featureCardText}>결과 보기</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/favorites')}>
            <View style={styles.featureIcon}>
              <Ionicons name='heart' size={24} color='#FFD700' />
            </View>
            <ThemedText style={styles.featureCardText}>즐겨찾기</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/mypage/help')}>
            <View style={styles.featureIcon}>
              <Ionicons name='help-circle' size={24} color='#FFD700' />
            </View>
            <ThemedText style={styles.featureCardText}>도움말</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push('/mypage/settings')}
          >
            <View style={styles.featureIcon}>
              <Ionicons name='settings' size={24} color='#FFD700' />
            </View>
            <ThemedText style={styles.featureCardText}>설정</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)', // 진한 골드 테두리로 변경
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#FFD700', // 진한 골드로 변경
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    marginBottom: 4,
    color: '#FFFFFF',
  },
  welcomeSubtext: {
    opacity: 0.8,
    color: '#FFFFFF',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#B8860B', // 다크골든로드로 변경
    justifyContent: 'center',
    alignItems: 'center',
  },
  bettingSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bettingStat: {
    alignItems: 'center',
  },
  bettingNumber: {
    color: '#FFD700', // 진한 골드로 변경
    marginBottom: 4,
  },
  bettingLabel: {
    opacity: 0.8,
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  // 빠른 액션 섹션 스타일 (2x2 그리드)
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // 진한 골드 배경
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)', // 진한 골드 테두리
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    marginBottom: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  // 더 많은 기능 섹션 스타일 (2x2 그리드로 통일)
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.08)', // 더 연한 골드 배경
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)', // 진한 골드 테두리
    minHeight: 100,
    justifyContent: 'center',
  },
  featureIcon: {
    marginBottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCardText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 12,
  },
});
