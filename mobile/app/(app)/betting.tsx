import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useBets, useBetStatistics, useCreateBet } from '@/lib/hooks/useBets';
import { showBetSuccessMessage } from '@/utils/alert';
import { getBetResultText, getBetStatusColor, getBetTypeLabel } from '@/utils/betUtils';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>베팅</ThemedText>
          <ThemedText style={styles.subtitle}>경마에 베팅하고 상금을 받아보세요</ThemedText>
        </View>

        {/* 베팅 통계 */}
        <ThemedView style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{totalBets}</ThemedText>
            <ThemedText style={styles.statLabel}>총 베팅</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{activeBets}</ThemedText>
            <ThemedText style={styles.statLabel}>진행중</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{totalAmount.toLocaleString()}</ThemedText>
            <ThemedText style={styles.statLabel}>총 베팅금</ThemedText>
          </View>
        </ThemedView>

        {/* 베팅 생성 버튼 */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateBet}>
          <ThemedText style={styles.createButtonText}>새 베팅 만들기</ThemedText>
        </TouchableOpacity>

        {/* 베팅 목록 */}
        <ThemedView style={styles.betsContainer}>
          <ThemedText style={styles.sectionTitle}>최근 베팅</ThemedText>
          {betsLoading ? (
            <ThemedText>로딩 중...</ThemedText>
          ) : betsData?.bets && betsData.bets.length > 0 ? (
            betsData.bets.slice(0, 5).map((bet) => (
              <View key={bet.id} style={styles.betItem}>
                <View style={styles.betHeader}>
                  <ThemedText style={styles.betType}>{getBetTypeLabel(bet.betType)}</ThemedText>
                  <ThemedText
                    style={[styles.betStatus, { color: getBetStatusColor(bet.betStatus) }]}
                  >
                    {getBetResultText(bet.betResult || '')}
                  </ThemedText>
                </View>
                <View style={styles.betDetails}>
                  <ThemedText style={styles.betAmount}>
                    {bet.betAmount.toLocaleString()}P
                  </ThemedText>
                  <ThemedText style={styles.betDate}>
                    {new Date(bet.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>
            ))
          ) : (
            <ThemedText style={styles.noBetsText}>아직 베팅이 없습니다.</ThemedText>
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  createButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  betsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  betItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  betType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  betStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  betDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  betDate: {
    fontSize: 12,
    color: '#666',
  },
  noBetsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
