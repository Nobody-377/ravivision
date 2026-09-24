import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADII, SHADOWS, SPACING } from '../../theme/tokens';
import { Price } from '../common/Price';
import { Badge } from '../common/Badge';
import { ShoppingBag, ImageOff } from 'lucide-react-native';
import { getApiBaseUrl } from '../../api/client';

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  mrp?: number | null;
  discount?: string | null;
  image?: string;
  stock: number;
  isAvailable: boolean;
}

interface ProductCardProps {
  product: ProductCardData;
  onPress: () => void;
  onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onAddToCart }) => {
  const hasValidPhoto = !!(
    product.image &&
    typeof product.image === 'string' &&
    product.image.trim() !== '' &&
    !product.image.includes('unsplash.com')
  );

  const getImageUri = (img?: string) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        {hasValidPhoto ? (
          <Image
            source={{ uri: getImageUri(product.image) }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noPhotoContainer}>
            <ImageOff size={22} color={COLORS.textMuted} />
            <Text style={styles.noPhotoText}>Photos will be updated soon</Text>
          </View>
        )}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Badge label={product.discount} variant="discount" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Price price={product.price} mrp={product.mrp} size="sm" />
        </View>

        <View style={styles.footerRow}>
          <Text style={product.isAvailable ? styles.inStock : styles.outOfStock}>
            {product.isAvailable ? 'In Stock' : 'Out of Stock'}
          </Text>

          {onAddToCart && product.isAvailable && (
            <TouchableOpacity style={styles.cartBtn} onPress={onAddToCart} activeOpacity={0.8}>
              <ShoppingBag size={14} color={COLORS.surfaceWhite} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    width: '48%',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.surfaceSubtle,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noPhotoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xs,
  },
  noPhotoText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 13,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  content: {
    padding: SPACING.sm,
    justify: 'space-between',
    flex: 1,
  },
  brand: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textHeading,
    marginVertical: 2,
    lineHeight: 17,
  },
  priceRow: {
    marginTop: 4,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  inStock: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.statusSuccess,
  },
  outOfStock: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.statusDanger,
  },
  cartBtn: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
