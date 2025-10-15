import { StyleSheet } from 'react-native';
import { GOLD_THEME } from './theme';

/**
 * 공통 스타일 상수
 *
 * 모든 화면에서 재사용되는 스타일을 정의합니다.
 * 스타일 중복을 제거하고 일관성을 유지합니다.
 */

export const COMMON_STYLES = StyleSheet.create({
  // 섹션
  section: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },

  sectionTitle: {
    marginBottom: 12,
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 18,
    fontWeight: '600',
  },

  // 카드
  card: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },

  cardElevated: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // 탭
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    padding: 4,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  tabActive: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
  },

  tabText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '500',
    fontSize: 14,
  },

  tabTextActive: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
  },

  // 버튼
  button: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  buttonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },

  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: GOLD_THEME.GOLD.MEDIUM,
  },

  buttonOutlineText: {
    color: GOLD_THEME.GOLD.LIGHT,
  },

  // 입력 필드
  input: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
  },

  inputMultiline: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    padding: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
  },

  // 빈 상태
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.6,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },

  emptySubtext: {
    color: GOLD_THEME.TEXT.TERTIARY,
    opacity: 0.5,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },

  // 로딩
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: GOLD_THEME.TEXT.SECONDARY,
  },

  // 에러
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },

  errorText: {
    marginTop: 16,
    textAlign: 'center',
    color: GOLD_THEME.STATUS.ERROR,
  },

  // 배지
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },

  badgeText: {
    color: GOLD_THEME.GOLD.DARK,
    fontSize: 12,
    fontWeight: '700',
  },

  // 메뉴 아이템
  menuList: {
    gap: 6,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },

  menuIcon: {
    marginRight: 10,
  },

  menuText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },

  // 통계 그리드
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },

  // 중앙 정렬 컨테이너
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
