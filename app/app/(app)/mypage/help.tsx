import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';
import { PageHeader } from '@/components/common';
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
  const { colors, spacing, radii, fonts } = useAppTheme();
  const [openId, setOpenId] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { padding: spacing.l },
    faqItem: {
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      marginBottom: spacing.s,
      borderWidth: 1,
      borderColor: colors.border,
    },
    faqQRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    faqQ: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.text,
      marginLeft: 8,
    },
    faqA: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      marginLeft: 26,
    },
    empty: {
      textAlign: 'center',
      color: colors.textTertiary,
      marginTop: 40,
      fontFamily: fonts.body,
    },
    askBtn: {
      margin: spacing.l,
      backgroundColor: colors.primary,
      borderRadius: radii.l,
      alignItems: 'center',
      paddingVertical: 16,
    },
    askBtnText: {
      fontFamily: fonts.bold,
      color: colors.text,
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <PageHeader
        title="고객센터"
        subtitle="문의 및 도움말"
        showNotificationButton={false}
        onNotificationPress={() => router.back()}
        notificationIconName="chevron-back"
        notificationIconColor={colors.text}
      />
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
                color={colors.primary}
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
