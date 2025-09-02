import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { useAuth } from '@/context/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { POINTS_CONSTANTS, POINTS_UTILS } from '@/constants/points';

const MyPageScreen = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // 포인트 관련 상태
  const [userPoints] = useState(125000);

  // 모달 상태들
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPointsEarnModal, setShowPointsEarnModal] = useState(false);
  const [showPointsUseModal, setShowPointsUseModal] = useState(false);

  // 현재 레벨과 다음 레벨 계산
  const currentLevel = POINTS_UTILS.getUserLevel(userPoints);
  const nextLevel = POINTS_UTILS.getNextLevel(userPoints);
  const progressPercentage = nextLevel ? (userPoints / nextLevel.MIN_POINTS) * 100 : 100;

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('로그아웃 성공');
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  };

  const handleDeleteAccount = () => {
    console.log('계정 삭제 기능이 곧 추가될 예정입니다.');
  };

  const handleMenuPress = (menuName: string) => {
    switch (menuName) {
      case '프로필 편집':
        setShowProfileModal(true);
        break;
      case '즐겨찾기':
        router.push('/mypage/favorites');
        break;
      case '알림 설정':
        setShowNotificationModal(true);
        break;
      case '도움말':
        router.push('/mypage/help');
        break;
      case '포인트 획득':
        setShowPointsEarnModal(true);
        break;
      case '포인트 사용':
        setShowPointsUseModal(true);
        break;
      default:
        console.log(`${menuName} 기능이 곧 추가될 예정입니다.`);
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <View style={styles.centerContainer}>
          <ThemedText type='title' style={styles.errorText}>
            로그인이 필요합니다.
          </ThemedText>
        </View>
      </PageLayout>
    );
  }

  const username = user.name || user.email?.split('@')[0] || '사용자';
  const email = user.email || '';

  return (
    <PageLayout>
      {/* 프로필 섹션 */}
      <View style={styles.section}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name='person' size={32} color='#FFFFFF' />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type='title' style={styles.username}>
              {username}
            </ThemedText>
            <ThemedText type='body' style={styles.email}>
              {email}
            </ThemedText>
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <ThemedText type='stat' style={styles.statNumber}>
                  15
                </ThemedText>
                <ThemedText type='caption' style={styles.statLabel}>
                  총 베팅
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type='stat' style={styles.statNumber}>
                  8
                </ThemedText>
                <ThemedText type='caption' style={styles.statLabel}>
                  당첨
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type='stat' style={styles.statNumber}>
                  53%
                </ThemedText>
                <ThemedText type='caption' style={styles.statLabel}>
                  승률
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 포인트 섹션 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          포인트
        </ThemedText>
        <View style={styles.balanceContainer}>
          <View style={styles.balanceInfo}>
            <ThemedText type='caption' style={styles.balanceLabel}>
              현재 포인트
            </ThemedText>
            <ThemedText type='title' style={styles.balanceAmount}>
              {userPoints.toLocaleString()}P
            </ThemedText>
          </View>
          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMenuPress('포인트 획득')}
            >
              <Ionicons name='gift' size={16} color='#FFFFFF' />
              <ThemedText style={styles.actionButtonText}>획득</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMenuPress('포인트 사용')}
            >
              <Ionicons name='card' size={16} color='#FFFFFF' />
              <ThemedText style={styles.actionButtonText}>사용</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 레벨 정보 */}
        <View style={styles.levelContainer}>
          <View style={styles.currentLevel}>
            <View style={styles.levelBadge}>
              <Ionicons name='star' size={16} color='#E5C99C' />
              <ThemedText style={styles.levelText}>{currentLevel.NAME}</ThemedText>
            </View>
            <ThemedText type='caption' style={styles.levelDescription}>
              {currentLevel.LABEL} 레벨
            </ThemedText>
          </View>

          {nextLevel && (
            <View style={styles.levelProgress}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              </View>
              <ThemedText type='caption' style={styles.progressText}>
                다음 레벨까지 {nextLevel ? (nextLevel.MIN_POINTS - userPoints).toLocaleString() : 0}
                P 남음
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* 메뉴 섹션 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          설정
        </ThemedText>
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('프로필 편집')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name='person-circle' size={20} color='#E5C99C' />
              <ThemedText type='body' style={styles.menuText}>
                프로필 편집
              </ThemedText>
            </View>
            <Ionicons name='chevron-forward' size={16} color='#E5C99C' />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/mypage/favorites')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name='heart' size={20} color='#E5C99C' />
              <ThemedText type='body' style={styles.menuText}>
                즐겨찾기
              </ThemedText>
            </View>
            <Ionicons name='chevron-forward' size={16} color='#E5C99C' />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('알림 설정')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name='notifications' size={20} color='#E5C99C' />
              <ThemedText type='body' style={styles.menuText}>
                알림 설정
              </ThemedText>
            </View>
            <Ionicons name='chevron-forward' size={16} color='#E5C99C' />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/mypage/help')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name='help-circle' size={20} color='#E5C99C' />
              <ThemedText type='body' style={styles.menuText}>
                도움말
              </ThemedText>
            </View>
            <Ionicons name='chevron-forward' size={16} color='#E5C99C' />
          </TouchableOpacity>
        </View>
      </View>

      {/* 계정 관리 섹션 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          계정 관리
        </ThemedText>
        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress('개인정보 처리방침')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name='shield-checkmark' size={20} color='#E5C99C' />
              <ThemedText type='body' style={styles.menuText}>
                개인정보 처리방침
              </ThemedText>
            </View>
            <Ionicons name='chevron-forward' size={16} color='#E5C99C' />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('이용약관')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name='document-text' size={20} color='#E5C99C' />
              <ThemedText type='body' style={styles.menuText}>
                이용약관
              </ThemedText>
            </View>
            <Ionicons name='chevron-forward' size={16} color='#E5C99C' />
          </TouchableOpacity>
        </View>
      </View>

      {/* 액션 버튼 */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name='log-out' size={20} color='#FFFFFF' />
          <ThemedText style={styles.signOutButtonText}>로그아웃</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Ionicons name='trash' size={20} color='#FF3B30' />
          <ThemedText style={styles.deleteAccountButtonText}>계정 삭제</ThemedText>
        </TouchableOpacity>
      </View>

      {/* 앱 정보 */}
      <View style={styles.section}>
        <View style={styles.appInfo}>
          <ThemedText type='caption' style={styles.appInfoText}>
            골든레이스 v1.0.0
          </ThemedText>
          <ThemedText type='caption' style={styles.appInfoText}>
            © 2024 GoldenRace. All rights reserved.
          </ThemedText>
        </View>
      </View>

      {/* 프로필 편집 모달 */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='title' style={styles.modalTitle}>
                프로필 편집
              </ThemedText>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name='close' size={24} color='#FFFFFF' />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <ThemedText type='body' style={styles.inputLabel}>
                  닉네임
                </ThemedText>
                <TextInput
                  style={styles.modalInput}
                  placeholder={username}
                  placeholderTextColor='#999'
                  defaultValue={username}
                />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText type='body' style={styles.inputLabel}>
                  자기소개
                </ThemedText>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder='자기소개를 입력하세요'
                  placeholderTextColor='#999'
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  console.log('프로필 저장');
                  setShowProfileModal(false);
                }}
              >
                <ThemedText style={styles.modalButtonText}>저장</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 알림 설정 모달 */}
      <Modal
        visible={showNotificationModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='title' style={styles.modalTitle}>
                알림 설정
              </ThemedText>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Ionicons name='close' size={24} color='#FFFFFF' />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <ThemedText type='body' style={styles.settingLabel}>
                    경주 알림
                  </ThemedText>
                  <ThemedText type='caption' style={styles.settingDescription}>
                    새로운 경주 정보 알림
                  </ThemedText>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: '#767577', true: '#B48A3C' }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <ThemedText type='body' style={styles.settingLabel}>
                    베팅 결과 알림
                  </ThemedText>
                  <ThemedText type='caption' style={styles.settingDescription}>
                    베팅 결과 알림
                  </ThemedText>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: '#767577', true: '#B48A3C' }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <ThemedText type='body' style={styles.settingLabel}>
                    이벤트 알림
                  </ThemedText>
                  <ThemedText type='caption' style={styles.settingDescription}>
                    이벤트 및 보상 알림
                  </ThemedText>
                </View>
                <Switch
                  value={false}
                  onValueChange={() => {}}
                  trackColor={{ false: '#767577', true: '#B48A3C' }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  console.log('알림 설정 저장');
                  setShowNotificationModal(false);
                }}
              >
                <ThemedText style={styles.modalButtonText}>저장</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 포인트 획득 모달 */}
      <Modal
        visible={showPointsEarnModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowPointsEarnModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='title' style={styles.modalTitle}>
                포인트 획득 방법
              </ThemedText>
              <TouchableOpacity onPress={() => setShowPointsEarnModal(false)}>
                <Ionicons name='close' size={24} color='#FFFFFF' />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.earnMethodItem}>
                <Ionicons name='trophy' size={24} color='#FFD700' />
                <View style={styles.earnMethodInfo}>
                  <ThemedText type='body' style={styles.earnMethodTitle}>
                    베팅 승리
                  </ThemedText>
                  <ThemedText type='caption' style={styles.earnMethodDescription}>
                    베팅에서 승리하면 포인트를 획득합니다
                  </ThemedText>
                </View>
              </View>
              <View style={styles.earnMethodItem}>
                <Ionicons name='calendar' size={24} color='#FFD700' />
                <View style={styles.earnMethodInfo}>
                  <ThemedText type='body' style={styles.earnMethodTitle}>
                    일일 보상
                  </ThemedText>
                  <ThemedText type='caption' style={styles.earnMethodDescription}>
                    매일 로그인하면 포인트를 받습니다
                  </ThemedText>
                </View>
              </View>
              <View style={styles.earnMethodItem}>
                <Ionicons name='gift' size={24} color='#FFD700' />
                <View style={styles.earnMethodInfo}>
                  <ThemedText type='body' style={styles.earnMethodTitle}>
                    이벤트 참여
                  </ThemedText>
                  <ThemedText type='caption' style={styles.earnMethodDescription}>
                    특별 이벤트에 참여하여 포인트를 획득합니다
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowPointsEarnModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>확인</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 포인트 사용 모달 */}
      <Modal
        visible={showPointsUseModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowPointsUseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='title' style={styles.modalTitle}>
                포인트 사용 방법
              </ThemedText>
              <TouchableOpacity onPress={() => setShowPointsUseModal(false)}>
                <Ionicons name='close' size={24} color='#FFFFFF' />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.useMethodItem}>
                <Ionicons name='game-controller' size={24} color='#FFD700' />
                <View style={styles.useMethodInfo}>
                  <ThemedText type='body' style={styles.useMethodTitle}>
                    베팅에 사용
                  </ThemedText>
                  <ThemedText type='caption' style={styles.useMethodDescription}>
                    포인트로 베팅에 참여할 수 있습니다
                  </ThemedText>
                </View>
              </View>
              <View style={styles.useMethodItem}>
                <Ionicons name='color-palette' size={24} color='#FFD700' />
                <View style={styles.useMethodInfo}>
                  <ThemedText type='body' style={styles.useMethodTitle}>
                    프로필 커스터마이징
                  </ThemedText>
                  <ThemedText type='caption' style={styles.useMethodDescription}>
                    프로필 테마나 아이템을 구매할 수 있습니다
                  </ThemedText>
                </View>
              </View>
              <View style={styles.useMethodItem}>
                <Ionicons name='star' size={24} color='#FFD700' />
                <View style={styles.useMethodInfo}>
                  <ThemedText type='body' style={styles.useMethodTitle}>
                    특별 기능 해금
                  </ThemedText>
                  <ThemedText type='caption' style={styles.useMethodDescription}>
                    VIP 기능이나 특별 혜택을 해금할 수 있습니다
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowPointsUseModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>확인</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    color: '#B48A3C',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#E5C99C',
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B48A3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B48A3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  username: {
    marginBottom: 8,
    color: '#FFFFFF',
  },
  email: {
    marginBottom: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#E5C99C',
    marginBottom: 4,
  },
  statLabel: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.1)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    color: '#FFFFFF',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B48A3C',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    gap: 8,
  },
  deleteAccountButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
  },
  appInfoText: {
    color: '#FFFFFF',
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 4,
  },
  // 포인트 관련 스타일
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    marginBottom: 8,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    color: '#E5C99C',
    fontWeight: 'bold',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#B48A3C',
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  levelContainer: {
    gap: 16,
  },
  currentLevel: {
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(180, 138, 60, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
    gap: 8,
  },
  levelText: {
    color: '#E5C99C',
  },
  levelDescription: {
    marginTop: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  levelProgress: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E5C99C',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.6,
  },
  // 모달 관련 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    flex: 1,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalFooter: {
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: '#B48A3C',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // 입력 필드 스타일
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // 설정 아이템 스타일
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
  // 포인트 획득/사용 방법 스타일
  earnMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  earnMethodInfo: {
    flex: 1,
    marginLeft: 16,
  },
  earnMethodTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  earnMethodDescription: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
  useMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  useMethodInfo: {
    flex: 1,
    marginLeft: 16,
  },
  useMethodTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  useMethodDescription: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
});

export default MyPageScreen;
