import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText as Text } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

const faqs = [
  {
    id: '1',
    q: '회원정보를 수정하고 싶어요.',
    a: '마이페이지 > 프로필 편집에서 사용자명과 자기소개를 수정할 수 있습니다.',
  },
  {
    id: '2',
    q: '포인트는 어떻게 획득하나요?',
    a: '일일 출석, 베팅 참여, 승리 보너스, 친구 초대, 이벤트 참여 등을 통해 포인트를 획득할 수 있습니다.',
  },
  {
    id: '3',
    q: '베팅 내역은 어디서 확인하나요?',
    a: '마이페이지에서 총 베팅 횟수, 승리 횟수, 승률 등을 확인할 수 있습니다.',
  },
  {
    id: '4',
    q: '즐겨찾기는 어떻게 관리하나요?',
    a: '마이페이지 > 즐겨찾기에서 관심있는 말을 추가하거나 삭제할 수 있습니다.',
  },
  {
    id: '5',
    q: '알림 설정은 어떻게 변경하나요?',
    a: '마이페이지 > 알림 설정에서 푸시 알림, 이메일 알림 등을 개별적으로 설정할 수 있습니다.',
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

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
            <Ionicons name='help-circle' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            <Text type='title' style={styles.title}>
              고객센터
            </Text>
          </View>
          <Text type='caption' style={styles.subtitle}>
            문의 및 도움말
          </Text>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* FAQ 목록 */}
        <View style={styles.section}>
          {faqs.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <TouchableOpacity
                onPress={() => setOpenId(openId === item.id ? null : item.id)}
                style={styles.faqQRow}
                activeOpacity={0.7}
              >
                <View style={styles.faqIcon}>
                  <Ionicons
                    name={openId === item.id ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color={GOLD_THEME.TEXT.SECONDARY}
                  />
                </View>
                <Text style={styles.faqQ}>{item.q}</Text>
              </TouchableOpacity>
              {openId === item.id && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqA}>{item.a}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 문의하기 버튼 */}
        <TouchableOpacity
          style={styles.askBtn}
          onPress={() => console.log('문의하기')}
          activeOpacity={0.8}
        >
          <Ionicons name='chatbubble' size={20} color={GOLD_THEME.TEXT.PRIMARY} />
          <Text style={styles.askBtnText}>문의하기</Text>
        </TouchableOpacity>
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
  section: {
    gap: 16,
    marginBottom: 32,
  },
  faqItem: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  faqQRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  faqQ: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  faqAnswerContainer: {
    marginTop: 16,
    paddingLeft: 44,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GOLD_THEME.BORDER.PRIMARY,
  },
  faqA: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
    lineHeight: 20,
  },
  askBtn: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
    shadowColor: GOLD_THEME.GOLD.MEDIUM,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  askBtnText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
});
