import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  showBorder?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  children,
  style,
  titleStyle,
  contentStyle,
  showBorder = false,
  variant = 'default',
}) => {
  const getSectionStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevatedSection;
      case 'outlined':
        return styles.outlinedSection;
      default:
        return styles.defaultSection;
    }
  };

  return (
    <ThemedView variant='card' style={[styles.container, getSectionStyle(), style]}>
      {(title || subtitle) && (
        <View style={[styles.header, titleStyle]}>
          {title && (
            <ThemedText type='title' style={styles.title}>
              {title}
            </ThemedText>
          )}
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
      )}

      <View style={[styles.content, contentStyle]}>{children}</View>

      {showBorder && <View style={styles.border} />}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    marginTop: 0,
  },
  defaultSection: {
    padding: 20,
    borderRadius: 16,
  },
  elevatedSection: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlinedSection: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
    opacity: 0.9,
  },
  subtitle: {
    opacity: 0.8,
  },
  content: {
    // Content styles can be customized
  },
  border: {
    height: 1,
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
    marginTop: 20,
  },
});
