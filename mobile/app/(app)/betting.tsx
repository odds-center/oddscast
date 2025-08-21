import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useBets, useBetStatistics, useCreateBet } from '@/lib/hooks/useBets';
import { showBetSuccessMessage } from '@/utils/alert';
import { getBetResultText, getBetStatusColor, getBetTypeLabel } from '@/utils/betUtils';
import { PageLayout, Section, Button } from '@/components/common';
import { ThemedText } from '@/components/ThemedText';

export default function BettingScreen() {
  const { data: betsData, isLoading: betsLoading } = useBets();
  const { data: statistics } = useBetStatistics();
  const createBet = useCreateBet();

  const handleCreateBet = () => {
    showBetSuccessMessage('베팅 기능이 곧 추가될 예정입니다.');
  };

  const totalBets = betsData?.total || 0;
  const activeBets = betsData?.bets?.filter((bet) => bet.betStatus === 'PENDING').length || 0;
  const totalAmount = betsData?.bets?.reduce((sum, bet) => sum + bet.betAmount, 0) || 0;

  return (
    <PageLayout title='베팅' subtitle='경마에 베팅하고 상금을 받아보세요'>
      {/* 베팅 통계 */}
      <Section title='베팅 통계' variant='elevated'>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText type='stat' lightColor='#B48A3C' darkColor='#E5C99C'>
              {totalBets}
            </ThemedText>
            <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
              총 베팅
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' lightColor='#B48A3C' darkColor='#E5C99C'>
              {activeBets}
            </ThemedText>
            <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
              진행중
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' lightColor='#B48A3C' darkColor='#E5C99C'>
              {totalAmount.toLocaleString()}
            </ThemedText>
            <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
              총 베팅금
            </ThemedText>
          </View>
        </View>
      </Section>

      {/* 베팅 생성 버튼 */}
      <Section variant='outlined'>
        <Button
          title='새 베팅 만들기'
          onPress={handleCreateBet}
          variant='primary'
          size='large'
          fullWidth
        />
      </Section>

      {/* 베팅 목록 */}
      <Section title='최근 베팅' variant='elevated'>
        {betsLoading ? (
          <View style={styles.loadingContainer}>
            <ThemedText type='body'>로딩 중...</ThemedText>
          </View>
        ) : betsData?.bets && betsData.bets.length > 0 ? (
          betsData.bets.slice(0, 5).map((bet) => (
            <View key={bet.id} style={styles.betItem}>
              <View style={styles.betHeader}>
                <ThemedText type='defaultSemiBold' style={styles.betType}>
                  {getBetTypeLabel(bet.betType)}
                </ThemedText>
                <ThemedText
                  type='caption'
                  style={[styles.betStatus, { color: getBetStatusColor(bet.betStatus) }]}
                >
                  {getBetResultText(bet.betResult || '')}
                </ThemedText>
              </View>
              <View style={styles.betDetails}>
                <ThemedText type='defaultSemiBold' style={styles.betAmount}>
                  {bet.betAmount.toLocaleString()}P
                </ThemedText>
                <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
                  {new Date(bet.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <ThemedText type='body' style={styles.noBetsText}>
              아직 베팅이 없습니다.
            </ThemedText>
          </View>
        )}
      </Section>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  betItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  betType: {
    opacity: 0.9,
  },
  betStatus: {
    fontWeight: '600',
  },
  betDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betAmount: {
    color: '#B48A3C',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noBetsText: {
    opacity: 0.6,
    textAlign: 'center',
  },
});
