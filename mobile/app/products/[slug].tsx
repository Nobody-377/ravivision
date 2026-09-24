import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Price } from '../../src/components/common/Price';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { LoadingState } from '../../src/components/common/LoadingState';
import { ErrorState } from '../../src/components/common/ErrorState';
import { COLORS, RADII, SHADOWS, SPACING } from '../../src/theme/tokens';
import { apiFetch } from '../../src/api/client';
import { useCartStore } from '../../src/store/useCartStore';
import {
  ArrowLeft,
  ShoppingBag,
  Zap,
  PhoneCall,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  CheckCircle2,
  ImageOff,
} from 'lucide-react-native';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/products/${slug}`);
      if (res.success && res.data) {
        setProduct(res.data);
        setSelectedImage(res.data.image || res.data.images?.[0] || '');
      } else {
        setError(res.error?.message || 'Product not found.');
      }
      setLoading(false);
    }
    if (slug) loadProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    const success = await addToCart(product.id, quantity);
    setAddingToCart(false);
    if (success) {
      Alert.alert('Added to Cart', `${product.name} added to your cart successfully.`, [
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
        { text: 'Continue Shopping', style: 'cancel' },
      ]);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setAddingToCart(true);
    const success = await addToCart(product.id, quantity);
    setAddingToCart(false);
    if (success) {
      router.push('/checkout');
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header />
        <LoadingState message="Fetching product details..." />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.screen}>
        <Header />
        <ErrorState message={error || 'Product details unavailable.'} onRetry={() => router.back()} />
      </View>
    );
  }

  const isAvailable = product.isAvailable;

  return (
    <View style={styles.screen}>
      <Header />

      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.textHeading} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {product.brand}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Product Image Gallery */}
        {(() => {
          const hasPhoto = !!(selectedImage && !selectedImage.includes('unsplash.com'));
          return (
            <View style={styles.imageBox}>
              {hasPhoto ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.mainImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noPhotoBox}>
                  <ImageOff size={40} color={COLORS.textMuted} />
                  <Text style={styles.noPhotoBrand}>{product.brand}</Text>
                  <Text style={styles.noPhotoText}>Photos will be updated soon</Text>
                </View>
              )}
              {product.discount && (
                <View style={styles.discountBadge}>
                  <Badge label={product.discount} variant="discount" />
                </View>
              )}
            </View>
          );
        })()}

        {/* Thumbnail Selector */}
        {product.images && product.images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {product.images.map((imgUrl: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImage(imgUrl)}
                style={[styles.thumbBox, selectedImage === imgUrl && styles.thumbActive]}
              >
                <Image source={{ uri: imgUrl }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Meta Section */}
        <View style={styles.card}>
          <Text style={styles.brandText}>{product.brand}</Text>
          <Text style={styles.titleText}>{product.name}</Text>

          {/* Price Component */}
          <View style={styles.priceRow}>
            <Price price={product.price} mrp={product.mrp} size="lg" />
          </View>

          {/* Stock Status */}
          <View style={styles.stockRow}>
            <CheckCircle2
              size={16}
              color={isAvailable ? COLORS.statusSuccess : COLORS.statusDanger}
            />
            <Text style={isAvailable ? styles.inStockText : styles.outOfStockText}>
              {isAvailable ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          {/* Quantity Selector */}
          {isAvailable && (
            <View style={styles.qtyContainer}>
              <Text style={styles.qtyLabel}>Quantity:</Text>
              <View style={styles.qtyBox}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus size={16} color={COLORS.textHeading} />
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                >
                  <Plus size={16} color={COLORS.textHeading} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Actions Bar */}
        <View style={styles.actionCard}>
          <Button
            title="Add to Cart"
            onPress={handleAddToCart}
            variant="outline"
            size="lg"
            loading={addingToCart}
            disabled={!isAvailable}
            icon={<ShoppingBag size={18} color={COLORS.primary} />}
            style={styles.flexBtn}
          />
          <Button
            title="Buy Now"
            onPress={handleBuyNow}
            variant="primary"
            size="lg"
            disabled={!isAvailable}
            icon={<Zap size={18} color={COLORS.surfaceWhite} />}
            style={styles.flexBtn}
          />
        </View>

        {/* Direct Call to Order Box */}
        <TouchableOpacity
          style={styles.callBox}
          onPress={() => Linking.openURL('tel:9631410611')}
          activeOpacity={0.8}
        >
          <PhoneCall size={20} color={COLORS.surfaceWhite} />
          <View>
            <Text style={styles.callBoxTitle}>Order via Phone / WhatsApp</Text>
            <Text style={styles.callBoxDesc}>Call store helpline 9631410611 for instant booking</Text>
          </View>
        </TouchableOpacity>

        {/* Technical Specifications */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionHeaderTitle}>Technical Specifications</Text>
            {Object.entries(product.specs).map(([key, val], idx) => (
              <View key={idx} style={styles.specRow}>
                <Text style={styles.specKey}>{key}</Text>
                <Text style={styles.specVal}>{String(val)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Product Description */}
        {product.description && (
          <View style={styles.card}>
            <Text style={styles.sectionHeaderTitle}>Product Overview</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceGround,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 'auto',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  imageBox: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADII.md,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  mainImage: {
    width: '90%',
    height: '90%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  thumbRow: {
    flexDirection: 'row',
  },
  thumbBox: {
    width: 60,
    height: 60,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surfaceWhite,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 2,
  },
  thumbActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADII.sm,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginVertical: 4,
    lineHeight: 24,
  },
  skuText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    marginVertical: SPACING.xs,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
  },
  inStockText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.statusSuccess,
  },
  outOfStockText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.statusDanger,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.sm,
  },
  qtyBtn: {
    padding: 10,
  },
  qtyVal: {
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 12,
    color: COLORS.textHeading,
  },
  actionCard: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  flexBtn: {
    flex: 1,
  },
  callBox: {
    backgroundColor: COLORS.statusSuccess,
    borderRadius: RADII.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  callBoxTitle: {
    color: COLORS.surfaceWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  callBoxDesc: {
    color: '#dcfce7',
    fontSize: 11,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: SPACING.sm,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceSubtle,
  },
  specKey: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  specVal: {
    fontSize: 13,
    color: COLORS.textHeading,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  descText: {
    fontSize: 13,
    color: COLORS.textBody,
    lineHeight: 20,
  },
  noPhotoBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  noPhotoBrand: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  noPhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
