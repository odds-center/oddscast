import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { PageLayout } from '@/components/common/PageLayout';
import { useRouter } from 'expo-router';

const faqs = [
  { id: '1', q: '회원정보를 수정하고 싶어요.', a: '마이페이지 > 프로필 관리에서 수정 가능합니다.' },
  { id: '2', q: '비밀번호를 잊어버렸어요.', a: '로그인 화면에서 비밀번호 찾기를 이용해 주세요.' },
  {
    id: '3',
    q: '베팅 내역은 어디서 확인하나요?',
    a: '마이페이지 > 베팅 내역에서 확인할 수 있습니다.',
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <PageLayout>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color='#E5C99C' />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text type='title' style={styles.title}>
            고객센터
          </Text>
          <Text type='caption' style={styles.subtitle}>
            문의 및 도움말
          </Text>
        </View>
      </View>

      {/* FAQ 목록 */}
      <View style={styles.section}>
        {faqs.map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <TouchableOpacity
              onPress={() => setOpenId(openId === item.id ? null : item.id)}
              style={styles.faqQRow}
            >
              <Ionicons
                name={openId === item.id ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color='#E5C99C'
              />
              <Text style={styles.faqQ}>{item.q}</Text>
            </TouchableOpacity>
            {openId === item.id && <Text style={styles.faqA}>{item.a}</Text>}
          </View>
        ))}
      </View>

      {/* 문의하기 버튼 */}
      <TouchableOpacity style={styles.askBtn} onPress={() => console.log('문의하기')}>
        <Ionicons name='chatbubble' size={20} color='#FFFFFF' />
        <Text style={styles.askBtnText}>문의하기</Text>
      </TouchableOpacity>
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
    marginBottom: 24,
  },
  faqItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  faqQRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQ: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  faqA: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
    marginTop: 12,
    marginLeft: 26,
    lineHeight: 20,
  },
  askBtn: {
    backgroundColor: '#B48A3C',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  askBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
