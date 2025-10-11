import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';
import { useNotificationPermission } from '@/lib/hooks/useNotificationPermission';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const { hasPermission, isLoading, expoPushToken, requestPermission, checkPermission } =
    useNotificationPermission();

  const handleRequestPermission = async () => {
    await requestPermission();
    await checkPermission();
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
            <Ionicons name='notifications' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            <ThemedText type='title' style={styles.title}>
              알림 권한
            </ThemedText>
          </View>
          <ThemedText type='caption' style={styles.subtitle}>
            푸시 알림 권한 설정
          </ThemedText>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 상태 카드 */}
        <LinearGradient
          colors={
            hasPermission ? [GOLD_THEME.GOLD.DARK, GOLD_THEME.GOLD.MEDIUM] : ['#6B7280', '#9CA3AF']
          }
          style={styles.statusCard}
        >
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={hasPermission ? 'checkmark-circle' : 'alert-circle'}
              size={64}
              color='#FFFFFF'
            />
          </View>
          <ThemedText style={styles.statusTitle}>
            {hasPermission ? '알림 권한 허용됨' : '알림 권한 필요'}
          </ThemedText>
          <ThemedText style={styles.statusDescription}>
            {hasPermission
              ? '경주 정보 알림을 받을 수 있습니다'
              : '경주 일정과 결과 정보 알림을 받으려면 권한이 필요합니다'}
          </ThemedText>
        </LinearGradient>

        {/* 권한 정보 */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.infoTitle}>알림 권한이 필요한 이유</ThemedText>

          <View style={styles.reasonItem}>
            <View style={styles.reasonIcon}>
              <Ionicons name='trophy' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            </View>
            <View style={styles.reasonContent}>
              <ThemedText style={styles.reasonTitle}>경주 정보 알림</ThemedText>
              <ThemedText style={styles.reasonDescription}>
                관심있는 경주의 일정과 결과를 실시간으로 받아보세요
              </ThemedText>
            </View>
          </View>

          <View style={styles.reasonItem}>
            <View style={styles.reasonIcon}>
              <Ionicons name='document-text' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            </View>
            <View style={styles.reasonContent}>
              <ThemedText style={styles.reasonTitle}>기록 분석 알림</ThemedText>
              <ThemedText style={styles.reasonDescription}>
                등록한 기록의 분석 결과를 즉시 알려드립니다
              </ThemedText>
            </View>
          </View>

          <View style={styles.reasonItem}>
            <View style={styles.reasonIcon}>
              <Ionicons name='star' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            </View>
            <View style={styles.reasonContent}>
              <ThemedText style={styles.reasonTitle}>즐겨찾기 업데이트</ThemedText>
              <ThemedText style={styles.reasonDescription}>
                즐겨찾는 말의 출전 일정과 경주 결과를 받아보세요
              </ThemedText>
            </View>
          </View>

          <View style={styles.reasonItem}>
            <View style={styles.reasonIcon}>
              <Ionicons name='gift' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            </View>
            <View style={styles.reasonContent}>
              <ThemedText style={styles.reasonTitle}>서비스 안내</ThemedText>
              <ThemedText style={styles.reasonDescription}>
                새로운 기능과 업데이트 소식을 받아보세요
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 디바이스 토큰 정보 (개발용) */}
        {__DEV__ && expoPushToken && (
          <View style={styles.debugSection}>
            <ThemedText style={styles.debugTitle}>개발 정보</ThemedText>
            <View style={styles.debugBox}>
              <ThemedText style={styles.debugLabel}>Push Token:</ThemedText>
              <ThemedText style={styles.debugValue} selectable>
                {expoPushToken}
              </ThemedText>
            </View>
          </View>
        )}

        {/* 권한 요청 버튼 */}
        {!hasPermission && !isLoading && (
          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleRequestPermission}
            activeOpacity={0.8}
          >
            <Ionicons name='notifications' size={22} color={GOLD_THEME.TEXT.PRIMARY} />
            <ThemedText style={styles.requestButtonText}>알림 권한 허용하기</ThemedText>
          </TouchableOpacity>
        )}

        {/* 안내 메시지 */}
        <View style={styles.noteSection}>
          <View style={styles.noteItem}>
            <Ionicons name='information-circle' size={18} color={GOLD_THEME.TEXT.TERTIARY} />
            <ThemedText style={styles.noteText}>알림 설정은 언제든지 변경할 수 있습니다</ThemedText>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name='information-circle' size={18} color={GOLD_THEME.TEXT.TERTIARY} />
            <ThemedText style={styles.noteText}>
              권한을 거부한 경우 기기 설정에서 직접 허용해야 합니다
            </ThemedText>
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
    borderBottomWidth: 1,
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
  statusCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoSection: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    marginBottom: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.PRIMARY,
  },
  reasonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reasonContent: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    marginBottom: 4,
  },
  reasonDescription: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 20,
  },
  debugSection: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 12,
  },
  debugBox: {
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.TERTIARY,
    marginBottom: 6,
  },
  debugValue: {
    fontSize: 11,
    color: GOLD_THEME.TEXT.SECONDARY,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  requestButton: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
    shadowColor: GOLD_THEME.GOLD.MEDIUM,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  requestButtonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 17,
    fontWeight: '700',
  },
  noteSection: {
    gap: 12,
    marginBottom: 32,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: GOLD_THEME.TEXT.TERTIARY,
    lineHeight: 18,
  },
});
