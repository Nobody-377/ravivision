import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { formatINR } from '../../utils/currency';
import { COLORS } from '../../theme/tokens';

interface PriceProps {
  price: number;
  mrp?: number | null;
  size?: 'sm' | 'md' | 'lg';
  style?: TextStyle;
}

export const Price: React.FC<PriceProps> = ({ price, mrp, size = 'md', style }) => {
  const showMrp = mrp && mrp > price;

  return (
    <View style={styles.container}>
      <Text style={[styles.price, styles[`price_${size}`], style]}>
        {formatINR(price)}
      </Text>
      {showMrp && (
        <Text style={[styles.mrp, styles[`mrp_${size}`]]}>
          {formatINR(mrp)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  price: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  mrp: {
    textDecorationLine: 'line-through',
    color: COLORS.textLight,
  },
  price_sm: {
    fontSize: 13,
  },
  mrp_sm: {
    fontSize: 11,
  },
  price_md: {
    fontSize: 16,
  },
  mrp_md: {
    fontSize: 13,
  },
  price_lg: {
    fontSize: 22,
    fontWeight: '800',
  },
  mrp_lg: {
    fontSize: 15,
  },
});
