import React from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';
import { Title, Subtitle } from '@/components/ui';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  backIconName?: keyof typeof Ionicons.glyphMap;
  backIconColor?: string;
  rightComponent?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  backIconName = 'chevron-back',
  backIconColor,
  rightComponent,
}) => {
  const { colors, spacing, shadows } = useAppTheme();
  const finalBackIconColor = backIconColor || colors.text;

  const styles = StyleSheet.create({
    header: {
      paddingTop: 60,
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.m,
      backgroundColor: colors.background,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    rightSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.s,
    },
    titleContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      textAlign: 'left',
    },
    subtitle: {
      textAlign: 'left',
    },
  });

  return (
    <View style={styles.header}>
      <StatusBar
        barStyle={colors.background === '#F5F5F5' ? 'dark-content' : 'light-content'}
        backgroundColor='transparent'
        translucent
      />
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Ionicons name={backIconName} size={24} color={finalBackIconColor} />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Title style={styles.title}>{title}</Title>
            <Subtitle style={styles.subtitle}>{subtitle}</Subtitle>
          </View>
        </View>
        <View style={styles.rightSection}>{rightComponent}</View>
      </View>
    </View>
  );
};
