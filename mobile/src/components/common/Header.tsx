import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneCall, Store } from 'lucide-react-native';
import { COLORS, RADII, SHADOWS, SPACING } from '../../theme/tokens';

export const Header: React.FC = () => {
  const insets = useSafeAreaInsets();

  const handleCallStore = () => {
    Linking.openURL('tel:9631410611');
  };

  const topPadding = Math.max(insets.top, 16) + 6;

  return (
    <View style={[styles.header, { paddingTop: topPadding }]}>
      <View style={styles.brandContainer}>
        <View style={styles.iconBadge}>
          <Store size={20} color={COLORS.surfaceWhite} />
        </View>
        <View>
          <Text style={styles.brandTitle}>RAVI VISION</Text>
          <Text style={styles.brandSubtitle}>Kargahar • Electronics & Appliances</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.callButton} onPress={handleCallStore} activeOpacity={0.8}>
        <PhoneCall size={16} color={COLORS.surfaceWhite} />
        <Text style={styles.callText}>Call Store</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.surfaceWhite,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.statusSuccess,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.pill,
  },
  callText: {
    color: COLORS.surfaceWhite,
    fontSize: 12,
    fontWeight: '700',
  },
});
