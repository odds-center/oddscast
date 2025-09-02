import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface PointsUseModalProps {
  onClose: () => void;
}

export const PointsUseModal: React.FC<PointsUseModalProps> = ({ onClose }) => {
  const useMethods = [
    {
      icon: 'card',
      title: '베팅',
      description: '경주 베팅에 포인트를 사용하세요',
      points: '-100P',
      color: '#FF6B6B',
    },
    {
      icon: 'gift',
      title: '아이템 구매',
      description: '게임 내 아이템을 구매하세요',
      points: '-200P',
      color: '#4ECDC4',
    },
    {
      icon: 'star',
      title: '특별 기능',
      description: '특별한 기능을 사용하세요',
      points: '-500P',
      color: '#45B7D1',
    },
    {
      icon: 'trophy',
      title: '리워드 교환',
      description: '리워드로 교환하세요',
      points: '-1000P',
      color: '#96CEB4',
    },
  ];

  return (
    <View style={styles.container}>
      <ThemedText type='body' style={styles.description}>
        포인트를 다양한 용도로 사용할 수 있습니다
      </ThemedText>

      <View style={styles.methodsList}>
        {useMethods.map((method, index) => (
          <View key={index} style={styles.useMethodItem}>
            <View style={styles.useMethodInfo}>
              <Ionicons name={method.icon as any} size={24} color='#E5C99C' />
              <View style={styles.useMethodText}>
                <ThemedText style={styles.useMethodTitle}>{method.title}</ThemedText>
                <ThemedText style={styles.useMethodDescription}>{method.description}</ThemedText>
              </View>
            </View>
            <View style={[styles.pointsBadge, { backgroundColor: method.color }]}>
              <ThemedText style={styles.pointsText}>{method.points}</ThemedText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name='information-circle' size={20} color='#E5C99C' />
        <ThemedText style={styles.infoText}>
          포인트는 게임 내에서만 사용 가능하며, 현금으로 환불되지 않습니다
        </ThemedText>
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
  useMethodItem: {
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
  useMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  useMethodText: {
    marginLeft: 12,
    flex: 1,
  },
  useMethodTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  useMethodDescription: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
  },
  pointsBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
  },
  infoText: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
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
