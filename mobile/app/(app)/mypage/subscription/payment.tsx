import React from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedText } from '@/components/ThemedText';
import { Section, Card, Button, InfoBanner } from '@/components/ui';
import { paymentsApi } from '@/lib/api/payments';
import { showSuccessMessage, showErrorMessage } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';

/**
 * 결제 정보 Zod 스키마
 */
const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(15, '카드 번호를 정확히 입력해주세요')
    .regex(/^[\d\s]+$/, '숫자만 입력 가능합니다'),
  expiryMonth: z
    .string()
    .length(2, '월을 2자리로 입력해주세요 (01-12)')
    .regex(/^(0[1-9]|1[0-2])$/, '올바른 월을 입력해주세요'),
  expiryYear: z
    .string()
    .length(2, '년도를 2자리로 입력해주세요')
    .regex(/^\d{2}$/, '숫자 2자리를 입력해주세요'),
  cardPassword: z
    .string()
    .length(2, '카드 비밀번호 앞 2자리를 입력해주세요')
    .regex(/^\d{2}$/, '숫자 2자리를 입력해주세요'),
  customerBirthday: z
    .string()
    .length(6, '생년월일 6자리를 입력해주세요 (YYMMDD)')
    .regex(/^\d{6}$/, '숫자 6자리를 입력해주세요'),
  customerName: z.string().min(2, '이름을 입력해주세요'),
  customerEmail: z.string().email('올바른 이메일을 입력해주세요'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

/**
 * 구독 결제 화면
 *
 * React Hook Form + Zod로 타입 안전성과 유효성 검증 강화
 */
export default function SubscriptionPaymentScreen() {
  const router = useRouter();
  const { planId, planName, price } = useLocalSearchParams<{
    planId: string;
    planName: string;
    price: string;
  }>();

  // React Hook Form 설정
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
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

  /**
   * 결제 진행 (React Hook Form)
   */
  const onSubmit = async (data: PaymentFormData) => {
    try {
      // 서버로 구독 요청 (빌링키 발급 + 첫 결제)
      const result = await paymentsApi.subscribe({
        planId: planId as string,
        cardNumber: data.cardNumber.replace(/\s/g, ''), // 공백 제거
        cardExpirationYear: data.expiryYear,
        cardExpirationMonth: data.expiryMonth,
        cardPassword: data.cardPassword,
        customerBirthday: data.customerBirthday,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
      });

      showSuccessMessage(`예측권 ${result.ticketsIssued}장이 발급되었습니다!`, '구독 완료');

      // 구독 관리 화면으로 이동
      router.replace('/mypage/subscription/manage');
    } catch (error: any) {
      console.error('결제 오류:', error);
      showErrorMessage(
        error.response?.data?.message || error.message || '결제에 실패했습니다.',
        '결제 실패'
      );
    }
  };

  /**
   * 카드 번호 포맷팅 (4자리마다 공백)
   */
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const parts = [];
    for (let i = 0; i < cleaned.length && i < 16; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  return (
    <ScrollView style={styles.container}>
      <Section>
        <ThemedText type='title'>결제 정보 입력</ThemedText>
        <ThemedText type='caption' style={styles.subtitle}>
          {planName} - 월 ₩{parseInt(price as string).toLocaleString()}
        </ThemedText>
      </Section>

      <Section>
        <InfoBanner
          icon='lock-closed'
          message='카드 정보는 암호화되어 안전하게 처리됩니다. Toss Payments를 통해 결제됩니다.'
        />
      </Section>

      <Section>
        <Card>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            💳 카드 정보
          </ThemedText>

          {/* 카드 번호 */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>카드 번호</ThemedText>
            <Controller
              control={control}
              name='cardNumber'
              render={({
                field: { onChange, value },
              }: {
                field: { onChange: (text: string) => void; value: string };
              }) => (
                <TextInput
                  style={[styles.input, errors.cardNumber && styles.inputError]}
                  placeholder='1234 5678 9012 3456'
                  value={value}
                  onChangeText={(text) => onChange(formatCardNumber(text))}
                  keyboardType='number-pad'
                  maxLength={19}
                />
              )}
            />
            {errors.cardNumber && (
              <ThemedText style={styles.errorText}>{errors.cardNumber.message}</ThemedText>
            )}
          </View>

          {/* 유효기간 */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <ThemedText style={styles.label}>월 (MM)</ThemedText>
              <Controller
                control={control}
                name='expiryMonth'
                render={({
                  field: { onChange, value },
                }: {
                  field: { onChange: (text: string) => void; value: string };
                }) => (
                  <TextInput
                    style={[styles.input, errors.expiryMonth && styles.inputError]}
                    placeholder='01'
                    value={value}
                    onChangeText={onChange}
                    keyboardType='number-pad'
                    maxLength={2}
                  />
                )}
              />
              {errors.expiryMonth && (
                <ThemedText style={styles.errorText}>{errors.expiryMonth.message}</ThemedText>
              )}
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <ThemedText style={styles.label}>년 (YY)</ThemedText>
              <Controller
                control={control}
                name='expiryYear'
                render={({
                  field: { onChange, value },
                }: {
                  field: { onChange: (text: string) => void; value: string };
                }) => (
                  <TextInput
                    style={[styles.input, errors.expiryYear && styles.inputError]}
                    placeholder='25'
                    value={value}
                    onChangeText={onChange}
                    keyboardType='number-pad'
                    maxLength={2}
                  />
                )}
              />
              {errors.expiryYear && (
                <ThemedText style={styles.errorText}>{errors.expiryYear.message}</ThemedText>
              )}
            </View>
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>카드 비밀번호 (앞 2자리)</ThemedText>
            <Controller
              control={control}
              name='cardPassword'
              render={({
                field: { onChange, value },
              }: {
                field: { onChange: (text: string) => void; value: string };
              }) => (
                <TextInput
                  style={[styles.input, errors.cardPassword && styles.inputError]}
                  placeholder='••'
                  value={value}
                  onChangeText={onChange}
                  keyboardType='number-pad'
                  maxLength={2}
                  secureTextEntry
                />
              )}
            />
            {errors.cardPassword && (
              <ThemedText style={styles.errorText}>{errors.cardPassword.message}</ThemedText>
            )}
          </View>
        </Card>
      </Section>

      <Section>
        <Card>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            👤 소유자 정보
          </ThemedText>

          {/* 생년월일 */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>생년월일 (YYMMDD)</ThemedText>
            <Controller
              control={control}
              name='customerBirthday'
              render={({
                field: { onChange, value },
              }: {
                field: { onChange: (text: string) => void; value: string };
              }) => (
                <TextInput
                  style={[styles.input, errors.customerBirthday && styles.inputError]}
                  placeholder='900101'
                  value={value}
                  onChangeText={onChange}
                  keyboardType='number-pad'
                  maxLength={6}
                />
              )}
            />
            {errors.customerBirthday && (
              <ThemedText style={styles.errorText}>{errors.customerBirthday.message}</ThemedText>
            )}
          </View>

          {/* 이름 */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>카드 소유자 이름</ThemedText>
            <Controller
              control={control}
              name='customerName'
              render={({
                field: { onChange, value },
              }: {
                field: { onChange: (text: string) => void; value: string };
              }) => (
                <TextInput
                  style={[styles.input, errors.customerName && styles.inputError]}
                  placeholder='홍길동'
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.customerName && (
              <ThemedText style={styles.errorText}>{errors.customerName.message}</ThemedText>
            )}
          </View>

          {/* 이메일 */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>이메일</ThemedText>
            <Controller
              control={control}
              name='customerEmail'
              render={({
                field: { onChange, value },
              }: {
                field: { onChange: (text: string) => void; value: string };
              }) => (
                <TextInput
                  style={[styles.input, errors.customerEmail && styles.inputError]}
                  placeholder='email@example.com'
                  value={value}
                  onChangeText={onChange}
                  keyboardType='email-address'
                  autoCapitalize='none'
                />
              )}
            />
            {errors.customerEmail && (
              <ThemedText style={styles.errorText}>{errors.customerEmail.message}</ThemedText>
            )}
          </View>
        </Card>
      </Section>

      <Section>
        <Card>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            💰 결제 정보
          </ThemedText>

          <View style={styles.summaryRow}>
            <ThemedText>플랜</ThemedText>
            <ThemedText type='defaultSemiBold'>{planName}</ThemedText>
          </View>

          <View style={styles.summaryRow}>
            <ThemedText>월 구독료</ThemedText>
            <ThemedText type='defaultSemiBold'>
              ₩{parseInt(price as string).toLocaleString()}
            </ThemedText>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText type='subtitle'>첫 결제 금액</ThemedText>
            <ThemedText type='title' style={styles.totalPrice}>
              ₩{parseInt(price as string).toLocaleString()}
            </ThemedText>
          </View>

          <View style={styles.notice}>
            <Ionicons name='information-circle' size={16} color='#666' />
            <ThemedText type='caption' style={styles.noticeText}>
              다음 결제일: 다음 달 1일 (자동 결제)
            </ThemedText>
          </View>
        </Card>
      </Section>

      <Section>
        <Button
          title={isSubmitting ? '결제 처리 중...' : '결제하기'}
          onPress={handleSubmit(onSubmit)}
          variant='primary'
          size='large'
          icon='card'
          loading={isSubmitting}
          disabled={isSubmitting}
        />

        <Button
          title='취소'
          onPress={() => router.back()}
          variant='outline'
          size='large'
          style={{ marginTop: 12 }}
        />
      </Section>

      <Section>
        <InfoBanner
          icon='shield-checkmark'
          message='토스페이먼츠의 안전한 결제 시스템을 사용합니다. 카드 정보는 저장되지 않으며, 빌링키만 암호화되어 저장됩니다.'
        />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  subtitle: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#FF4444',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#FFD700',
  },
  totalPrice: {
    color: '#FFD700',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  noticeText: {
    flex: 1,
  },
});
