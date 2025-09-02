import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface PointsEarnModalProps {
  onClose: () => void;
}

export const PointsEarnModal: React.FC<PointsEarnModalProps> = ({ onClose }) => {
  const earnMethods = [
    {
      icon: 'trophy',
      title: '경주 참여',
      description: '경주에 참여하여 포인트를 획득하세요',
      points: '+100P',
    },
    {
      icon: 'star',
      title: '일일 출석',
      description: '매일 로그인하여 포인트를 받으세요',
      points: '+50P',
    },
    {
      icon: 'gift',
      title: '이벤트 참여',
      description: '특별 이벤트에 참여하여 포인트를 획득하세요',
      points: '+200P',
    },
    {
      icon: 'share-social',
      title: '친구 초대',
      description: '친구를 초대하여 포인트를 받으세요',
      points: '+300P',
    },
    {
      icon: 'medal',
      title: '업적 달성',
      description: '업적을 달성하여 포인트를 획득하세요',
      points: '+500P',
    },
  ];

  return (
    <View style={styles.container}>
      <ThemedText type='body' style={styles.description}>
        다양한 방법으로 포인트를 획득할 수 있습니다
      </ThemedText>

      <View style={styles.methodsList}>
        {earnMethods.map((method, index) => (
          <View key={index} style={styles.earnMethodItem}>
            <View style={styles.earnMethodInfo}>
              <Ionicons name={method.icon as any} size={24} color='#E5C99C' />
              <View style={styles.earnMethodText}>
                <ThemedText style={styles.earnMethodTitle}>{method.title}</ThemedText>
                <ThemedText style={styles.earnMethodDescription}>{method.description}</ThemedText>
              </View>
            </View>
            <View style={styles.pointsBadge}>
              <ThemedText style={styles.pointsText}>{method.points}</ThemedText>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <ThemedText style={styles.closeButtonText}>확인</ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  description: {
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    fontSize: 16,
  },
  methodsList: {
    gap: 12,
  },
  earnMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  earnMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  earnMethodText: {
    marginLeft: 12,
    flex: 1,
  },
  earnMethodTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  earnMethodDescription: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
  },
  pointsBadge: {
    backgroundColor: '#B48A3C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#B48A3C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
