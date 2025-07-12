import React from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';
import { Title, Subtitle } from '@/components/ui';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  showNotificationButton?: boolean;
  onNotificationPress?: () => void;
  notificationIconName?: keyof typeof Ionicons.glyphMap;
  notificationIconColor?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showNotificationButton = false,
  onNotificationPress,
  notificationIconName = 'notifications-outline',
  notificationIconColor,
}) => {
  const { colors, spacing, shadows } = useAppTheme();
  const finalNotificationIconColor = notificationIconColor || colors.primary;

  const styles = StyleSheet.create({
    header: {
      paddingTop: 60,
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.m,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      // Styles for Title component, can be overridden by props
    },
    subtitle: {
      // Styles for Subtitle component, can be overridden by props
    },
    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.small,
    },
  });

  return (
    <View style={styles.header}>
      <StatusBar barStyle='light-content' backgroundColor='transparent' translucent />
      <View style={styles.headerContent}>
        <View>
          <Title style={styles.title}>{title}</Title>
          <Subtitle style={styles.subtitle}>{subtitle}</Subtitle>
        </View>
        {showNotificationButton && (
          <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
            <Ionicons name={notificationIconName} size={24} color={finalNotificationIconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
