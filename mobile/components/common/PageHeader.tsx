import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  showSafeArea?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  leftComponent,
  rightComponent,
  showSafeArea = true,
  showBackButton = false,
  onBackPress,
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const headerContent = (
    <ThemedView style={styles.header}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name='arrow-back' size={24} color='#B48A3C' />
          </TouchableOpacity>
        ) : (
          leftComponent
        )}
      </View>

      <View style={styles.centerSection}>
        <ThemedText type='largeTitle' lightColor='#B48A3C' darkColor='#E5C99C' style={styles.title}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText
            type='subtitle'
            lightColor='#687076'
            darkColor='#9BA1A6'
            style={styles.subtitle}
          >
            {subtitle}
          </ThemedText>
        )}
      </View>

      <View style={styles.rightSection}>{rightComponent}</View>
    </ThemedView>
  );

  if (showSafeArea) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {headerContent}
      </SafeAreaView>
    );
  }

  return headerContent;
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 80,
  },
  leftSection: {
    width: 60,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 60,
    alignItems: 'flex-end',
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
});
