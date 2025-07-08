import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
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
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='chevron-back' size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>고객센터</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={faqs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.faqItem}>
            <TouchableOpacity
              onPress={() => setOpenId(openId === item.id ? null : item.id)}
              style={styles.faqQRow}
            >
              <Ionicons
                name={openId === item.id ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.faqQ}>{item.q}</Text>
            </TouchableOpacity>
            {openId === item.id && <Text style={styles.faqA}>{item.a}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>FAQ가 없습니다.</Text>}
      />
      <TouchableOpacity style={styles.askBtn}>
        <Text style={styles.askBtnText}>문의하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'center',
  },
  listContent: { padding: theme.spacing.l },
  faqItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  faqQRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQ: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.text,
    marginLeft: 8,
  },
  faqA: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginLeft: 26,
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.textTertiary,
    marginTop: 40,
    fontFamily: theme.fonts.body,
  },
  askBtn: {
    margin: theme.spacing.l,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.l,
    alignItems: 'center',
    paddingVertical: 16,
  },
  askBtnText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.background,
    fontSize: 16,
  },
});
