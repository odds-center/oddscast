import React from 'react';
import { View, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';

// 디자인 시스템
import { ThemedText } from '@/components/ThemedText';
import { Button, Card, Divider, SectionHeader } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Layout } from '@/constants/designTokens';

import { paymentsApi } from '@/lib/api/payments';
import { showSuccessMessage, showErrorMessage } from '@/utils/alert';

const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(15)
    .regex(/^[\d\s]+$/),
  expiryMonth: z
    .string()
    .length(2)
    .regex(/^(0[1-9]|1[0-2])$/),
  expiryYear: z
    .string()
    .length(2)
    .regex(/^\d{2}$/),
  cardPassword: z
    .string()
    .length(2)
    .regex(/^\d{2}$/),
  customerBirthday: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function SubscriptionPaymentScreen() {
  const router = useRouter();
  const { planId, planName, price } = useLocalSearchParams<{
    planId: string;
    planName: string;
    price: string;
  }>();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cardPassword: '',
      customerBirthday: '',
      customerName: '',
      customerEmail: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const result = await paymentsApi.subscribe({
        planId: planId as string,
        cardNumber: data.cardNumber.replace(/\s/g, ''),
        cardExpirationYear: data.expiryYear,
        cardExpirationMonth: data.expiryMonth,
        cardPassword: data.cardPassword,
        customerBirthday: data.customerBirthday,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
      });

      showSuccessMessage(`예측권 ${result.ticketsIssued}장이 발급되었습니다!`, '구독 완료');
      router.replace('/mypage/subscription/manage');
    } catch (error: any) {
      console.error('결제 오류:', error);
      showErrorMessage(error.response?.data?.message || '결제에 실패했습니다.', '결제 실패');
    }
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const parts = [];
    for (let i = 0; i < cleaned.length && i < 16; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  return (
    <ScrollView style={[Layout.container, { paddingHorizontal: 0 }]}>
      <View style={[Layout.section, { marginBottom: Spacing.xl }]}>
        <ThemedText type='title'>결제 정보 입력</ThemedText>
        <ThemedText
          type='caption'
          style={{ color: Colors.text.tertiary, marginTop: Spacing.xs }}
        >
          {planName} - 월 ₩{parseInt(price as string).toLocaleString()}
        </ThemedText>
      </View>

      <View style={Layout.section}>
        <Card variant='default' style={{ backgroundColor: `${Colors.primary.main}10` }}>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Ionicons name='lock-closed' size={20} color={Colors.primary.main} />
            <ThemedText type='body' style={{ color: Colors.text.secondary, flex: 1 }}>
              카드 정보는 암호화되어 안전하게 처리됩니다.
            </ThemedText>
          </View>
        </Card>
      </View>

      <View style={Layout.section}>
        <SectionHeader title='카드 정보' />
        <Card variant='default'>
          <View style={styles.inputGroup}>
            <ThemedText type='caption' style={styles.label}>
              카드 번호
            </ThemedText>
            <Controller
              control={control}
              name='cardNumber'
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.cardNumber && styles.inputError]}
                  placeholder='1234 5678 9012 3456'
                  placeholderTextColor={Colors.text.disabled}
                  value={value}
                  onChangeText={(text) => onChange(formatCardNumber(text))}
                  keyboardType='number-pad'
                  maxLength={19}
                />
              )}
            />
            {errors.cardNumber && (
              <ThemedText type='caption' style={{ color: Colors.status.error }}>
                {errors.cardNumber.message}
              </ThemedText>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText type='caption' style={styles.label}>월 (MM)</ThemedText>
              <Controller
                control={control}
                name='expiryMonth'
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.expiryMonth && styles.inputError]}
                    placeholder='01'
                    placeholderTextColor={Colors.text.disabled}
                    value={value}
                    onChangeText={onChange}
                    keyboardType='number-pad'
                    maxLength={2}
                  />
                )}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText type='caption' style={styles.label}>년 (YY)</ThemedText>
              <Controller
                control={control}
                name='expiryYear'
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.expiryYear && styles.inputError]}
                    placeholder='25'
                    placeholderTextColor={Colors.text.disabled}
                    value={value}
                    onChangeText={onChange}
                    keyboardType='number-pad'
                    maxLength={2}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type='caption' style={styles.label}>카드 비밀번호 (앞 2자리)</ThemedText>
            <Controller
              control={control}
              name='cardPassword'
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.cardPassword && styles.inputError]}
                  placeholder='••'
                  placeholderTextColor={Colors.text.disabled}
                  value={value}
                  onChangeText={onChange}
                  keyboardType='number-pad'
                  maxLength={2}
                  secureTextEntry
                />
              )}
            />
          </View>
        </Card>
      </View>

      <View style={Layout.section}>
        <SectionHeader title='소유자 정보' />
        <Card variant='default'>
          <View style={styles.inputGroup}>
            <ThemedText type='caption' style={styles.label}>생년월일 (YYMMDD)</ThemedText>
            <Controller
              control={control}
              name='customerBirthday'
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.customerBirthday && styles.inputError]}
                  placeholder='900101'
                  placeholderTextColor={Colors.text.disabled}
                  value={value}
                  onChangeText={onChange}
                  keyboardType='number-pad'
                  maxLength={6}
                />
              )}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type='caption' style={styles.label}>카드 소유자 이름</ThemedText>
            <Controller
              control={control}
              name='customerName'
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.customerName && styles.inputError]}
                  placeholder='홍길동'
                  placeholderTextColor={Colors.text.disabled}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          <View style={[styles.inputGroup, { marginBottom: 0 }]}>
            <ThemedText type='caption' style={styles.label}>이메일</ThemedText>
            <Controller
              control={control}
              name='customerEmail'
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.customerEmail && styles.inputError]}
                  placeholder='email@example.com'
                  placeholderTextColor={Colors.text.disabled}
                  value={value}
                  onChangeText={onChange}
                  keyboardType='email-address'
                  autoCapitalize='none'
                />
              )}
            />
          </View>
        </Card>
      </View>

      <View style={Layout.section}>
        <SectionHeader title='결제 정보' />
        <Card variant='elevated'>
          <View style={styles.summaryRow}>
            <ThemedText type='body'>플랜</ThemedText>
            <ThemedText type='subtitle' style={{ color: Colors.text.secondary }}>
              {planName}
            </ThemedText>
          </View>
          <Divider spacing={Spacing.md} />
          <View style={styles.summaryRow}>
            <ThemedText type='body'>월 구독료</ThemedText>
            <ThemedText type='subtitle' style={{ color: Colors.text.secondary }}>
              ₩{parseInt(price as string).toLocaleString()}
            </ThemedText>
          </View>
          <Divider spacing={Spacing.lg} color={Colors.border.gold} />
          <View style={styles.summaryRow}>
            <ThemedText type='subtitle'>첫 결제 금액</ThemedText>
            <ThemedText type='title' style={{ color: Colors.primary.main }}>
              ₩{parseInt(price as string).toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.notice}>
            <Ionicons name='information-circle' size={16} color={Colors.text.tertiary} />
            <ThemedText type='caption' style={{ flex: 1 }}>
              다음 결제일: 다음 달 1일 (자동 결제)
            </ThemedText>
          </View>
        </Card>
      </View>

      <View style={[Layout.section, { paddingBottom: Spacing.xxxl }]}>
        <Button
          title={isSubmitting ? '결제 처리 중...' : '결제하기'}
          variant='primary'
          icon='card'
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={{ width: '100%' }}
        />
        <Button
          title='취소'
          variant='secondary'
          onPress={() => router.back()}
          style={{ width: '100%', marginTop: Spacing.md }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inputGroup: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.sm, fontSize: 14 },
  input: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.text.primary,
  },
  inputError: {
    borderColor: Colors.status.error,
    borderWidth: 2,
  },
  row: { flexDirection: 'row', gap: Spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: `${Colors.border.primary}50`,
    borderRadius: BorderRadius.sm,
  },
});
