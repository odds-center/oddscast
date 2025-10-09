import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onDismiss?: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
}

const { width: screenWidth } = Dimensions.get('window');

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onDismiss,
  type = 'info',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 알림창 표시 애니메이션
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 알림창 숨김 애니메이션
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconForType = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: GOLD_THEME.STATUS.SUCCESS };
      case 'error':
        return { name: 'close-circle', color: '#FF6B6B' };
      case 'warning':
        return { name: 'warning', color: GOLD_THEME.STATUS.WARNING };
      default:
        return { name: 'information-circle', color: GOLD_THEME.STATUS.INFO };
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'success':
        return GOLD_THEME.STATUS.SUCCESS;
      case 'error':
        return '#FF6B6B';
      case 'warning':
        return GOLD_THEME.STATUS.WARNING;
      default:
        return GOLD_THEME.STATUS.INFO;
    }
  };

  const getBackgroundGradient = () => {
    switch (type) {
      case 'success':
        return 'rgba(255, 215, 0, 0.05)';
      case 'error':
        return 'rgba(255, 107, 107, 0.05)';
      case 'warning':
        return 'rgba(218, 165, 32, 0.05)';
      default:
        return 'rgba(205, 133, 63, 0.05)';
    }
  };

  const handleBackdropPress = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'cancel':
        return styles.cancelButton;
      case 'destructive':
        return styles.destructiveButton;
      default:
        return [styles.defaultButton, { backgroundColor: getAccentColor() }];
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'cancel':
        return styles.cancelButtonText;
      case 'destructive':
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={styles.blurView} />
        ) : (
          <View style={styles.androidOverlay} />
        )}

        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <View style={styles.centeredView}>
            <TouchableOpacity activeOpacity={1}>
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim,
                }}
              >
                <ThemedView
                  style={[
                    styles.alertContainer,
                    {
                      backgroundColor: GOLD_THEME.BACKGROUND.CARD,
                    },
                  ]}
                >
                  {/* 닫기 버튼 */}
                  {onDismiss && (
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={onDismiss}
                      activeOpacity={0.7}
                    >
                      <Ionicons name='close' size={24} color={GOLD_THEME.TEXT.TERTIARY} />
                    </TouchableOpacity>
                  )}

                  {/* 아이콘 */}
                  <View style={[styles.iconContainer, { backgroundColor: getAccentColor() }]}>
                    <Ionicons
                      name={getIconForType().name as any}
                      size={56}
                      color={GOLD_THEME.TEXT.PRIMARY}
                    />
                  </View>

                  {/* 헤더 */}
                  <View style={styles.header}>
                    <ThemedText type='title' style={styles.title}>
                      {title}
                    </ThemedText>
                  </View>

                  {/* 메시지 */}
                  <ThemedText type='body' style={styles.message}>
                    {message}
                  </ThemedText>

                  {/* 버튼들 */}
                  <View style={styles.buttonContainer}>
                    {buttons.map((button, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.button,
                          getButtonStyle(button.style),
                          buttons.length === 1 && styles.singleButton,
                        ]}
                        onPress={() => handleButtonPress(button)}
                        activeOpacity={0.8}
                      >
                        <ThemedText type='defaultSemiBold' style={getButtonTextStyle(button.style)}>
                          {button.text}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ThemedView>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  androidOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdropTouchable: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 0,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 32,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.9,
    color: GOLD_THEME.TEXT.PRIMARY,
    paddingHorizontal: 24,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  singleButton: {
    marginHorizontal: 0,
  },
  defaultButton: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    shadowOpacity: 0,
    elevation: 0,
  },
  destructiveButton: {
    backgroundColor: '#FF6B6B',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  defaultButtonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButtonText: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveButtonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
});
