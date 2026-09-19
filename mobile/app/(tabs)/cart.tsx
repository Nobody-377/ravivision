import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Price } from '../../src/components/common/Price';
import { Button } from '../../src/components/common/Button';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingState } from '../../src/components/common/LoadingState';
import { COLORS, RADII, SHADOWS, SPACING } from '../../src/theme/tokens';
import { useCartStore } from '../../src/store/useCartStore';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react-native';

export default function CartScreen() {
  const router = useRouter();
  const { items, subtotal, totalItems, isLoading, fetchCart, updateQuantity, removeItem } =
    useCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  const deliveryCharge = subtotal > 0 ? (subtotal >= 10000 ? 0 : 250) : 0;
  const totalAmount = subtotal + deliveryCharge;

  return (
    <View style={styles.screen}>
      <Header />

      <View style={styles.pageHeader}>
        <ShoppingBag size={20} color={COLORS.primary} />
        <Text style={styles.pageTitle}>Shopping Cart ({totalItems} items)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && items.length === 0 ? (
          <LoadingState message="Fetching your cart..." />
        ) : items.length === 0 ? (
          <EmptyState
            title="Your Cart is Empty"
            description="Explore our range of refrigerators, ACs, coolers, and washing machines."
            actionLabel="Start Shopping"
            onAction={() => router.push('/products')}
          />
        ) : (
          <>
            {/* Cart Items List */}
            <View style={styles.itemsCard}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Image
                    source={{
                      uri:
                        item.imageUrl ||
                        'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&q=80',
                    }}
                    style={styles.itemImg}
                    resizeMode="cover"
                  />

                  <View style={styles.itemMeta}>
                    <Text style={styles.itemBrand}>{item.brand}</Text>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Price price={item.price} mrp={item.mrp} size="sm" />

                    <View style={styles.qtyRow}>
                      <View style={styles.qtyBox}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} color={COLORS.textHeading} />
                        </TouchableOpacity>
                        <Text style={styles.qtyVal}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} color={COLORS.textHeading} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeItem(item.id)}
                      >
                        <Trash2 size={16} color={COLORS.statusDanger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Price Summary Breakdown */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Price price={subtotal} size="sm" />
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Kargahar Region Delivery</Text>
                <Text style={styles.deliveryVal}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Price price={totalAmount} size="lg" />
              </View>

              <Button
                title="Proceed to Checkout"
                onPress={() => router.push('/checkout')}
                variant="primary"
                size="lg"
                icon={<ArrowRight size={18} color={COLORS.surfaceWhite} />}
                style={styles.checkoutBtn}
              />
            </View>
          </>
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
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  itemsCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.card,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceSubtle,
    gap: SPACING.md,
  },
  itemImg: {
    width: 70,
    height: 70,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surfaceSubtle,
  },
  itemMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemBrand: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.sm,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyVal: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 8,
    color: COLORS.textHeading,
  },
  removeBtn: {
    padding: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  deliveryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.statusSuccess,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  checkoutBtn: {
    marginTop: SPACING.md,
  },
});
