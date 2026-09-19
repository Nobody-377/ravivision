import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADII, SPACING } from '../../theme/tokens';

interface BadgeProps {
  label: string;
  variant?: 'discount' | 'success' | 'warning' | 'danger' | 'info';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', style }) => {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.sm,
    alignSelf: 'flex-start',
  },
  discount: {
    backgroundColor: COLORS.statusDangerBg,
    borderColor: COLORS.statusDanger,
    borderWidth: 1,
  },
  success: {
    backgroundColor: COLORS.statusSuccessBg,
  },
  warning: {
    backgroundColor: COLORS.statusWarningBg,
  },
  danger: {
    backgroundColor: COLORS.statusDangerBg,
  },
  info: {
    backgroundColor: COLORS.statusInfoBg,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  text_discount: {
    color: COLORS.statusDanger,
  },
  text_success: {
    color: COLORS.statusSuccess,
  },
  text_warning: {
    color: COLORS.statusWarning,
  },
  text_danger: {
    color: COLORS.statusDanger,
  },
  text_info: {
    color: COLORS.statusInfo,
  },
});
