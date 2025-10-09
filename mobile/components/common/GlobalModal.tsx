import { ThemedText } from '@/components/ThemedText';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeModal } from '@/store/modalSlice';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

const { height: screenHeight } = Dimensions.get('window');

export const GlobalModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, component, title } = useAppSelector((state) => state.modal);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (isOpen) {
      // 모달 열기 애니메이션
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 모달 닫기 애니메이션
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, fadeAnim, slideAnim]);

  const handleClose = () => {
    dispatch(closeModal());
  };

  if (!isOpen) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.modalContent}>
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            {title && (
              <ThemedText type='title' style={styles.modalTitle}>
                {title}
              </ThemedText>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name='close' size={24} color='#E5C99C' />
            </TouchableOpacity>
          </View>

          {/* 컨텐츠 */}
          <View style={styles.modalBody}>{component}</View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 450,
    maxHeight: '85%',
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
    shadowColor: GOLD_THEME.GOLD.MEDIUM,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  modalTitle: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
  },
  modalBody: {
    flex: 1,
    minHeight: 200,
  },
});
