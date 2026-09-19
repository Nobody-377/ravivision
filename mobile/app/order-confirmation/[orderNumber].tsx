import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Price } from '../../src/components/common/Price';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { LoadingState } from '../../src/components/common/LoadingState';
import { COLORS, RADII, SHADOWS, SPACING } from '../../src/theme/tokens';
import { formatISTDate } from '../../src/utils/date';
import { apiFetch } from '../../src/api/client';
import { CheckCircle2, PhoneCall, Home, Package, Truck, ShieldCheck } from 'lucide-react-native';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { orderNumber } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) return;
      const res = await apiFetch(`/api/orders/track?orderNumber=${orderNumber}`);
      if (res.success && res.data) {
        setOrder(res.data);
      }
      setLoading(false);
    }
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header />
        <LoadingState message="Fetching order confirmation..." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Confirmed Banner */}
        <View style={styles.successBanner}>
          <CheckCircle2 size={44} color={COLORS.statusSuccess} />
          <Text style={styles.bannerTitle}>Order Placed Successfully!</Text>
          <Text style={styles.bannerSubtitle}>
            Thank you for shopping with Ravi Vision Kargahar.
          </Text>
          <View style={styles.orderBadgeBox}>
            <Text style={styles.orderBadgeText}>Order #{orderNumber}</Text>
          </View>
        </View>

        {/* Order Details Card */}
        {order && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order & Delivery Summary</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Date:</Text>
              <Text style={styles.infoVal}>{formatISTDate(order.createdAt)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer Name:</Text>
              <Text style={styles.infoVal}>{order.customerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile Number:</Text>
              <Text style={styles.infoVal}>{order.mobileNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivery Address:</Text>
              <Text style={[styles.infoVal, { flex: 1, textAlign: 'right' }]}>
                {order.address}, {order.city}, {order.state} - {order.pincode}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Mode:</Text>
              <Text style={styles.infoVal}>{order.paymentMode}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Status:</Text>
              <Badge label={order.orderStatus} variant="success" />
            </View>

            <View style={styles.divider} />

            {/* Purchased Items */}
            <Text style={styles.itemsTitle}>Items Ordered:</Text>
            {order.items?.map((item: any, idx: number) => (
              <View key={idx} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemMeta}>Qty: {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}</Text>
                </View>
                <Price price={Number(item.totalPrice)} size="sm" />
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid / Payable:</Text>
              <Price price={Number(order.totalAmount)} size="lg" />
            </View>
          </View>
        )}

        {/* Store Delivery Guarantee Card */}
        <View style={styles.guaranteeCard}>
          <Truck size={22} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>Kargahar Express Delivery</Text>
            <Text style={styles.guaranteeDesc}>
              Our local store team will contact you on {order?.mobileNumber || 'your phone'} before dispatching.
            </Text>
          </View>
        </View>

        {/* Phone Call Support Box */}
        <TouchableOpacity
          style={styles.callBox}
          onPress={() => Linking.openURL('tel:9631410611')}
          activeOpacity={0.8}
        >
          <PhoneCall size={20} color={COLORS.surfaceWhite} />
          <View>
            <Text style={styles.callBoxTitle}>Need Immediate Help?</Text>
            <Text style={styles.callBoxDesc}>Call store directly at 9631410611</Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            title="Track Order"
            onPress={() => router.push('/(tabs)/orders')}
            variant="outline"
            icon={<Package size={18} color={COLORS.primary} />}
            style={{ flex: 1 }}
          />
          <Button
            title="Back to Home"
            onPress={() => router.push('/(tabs)')}
            variant="primary"
            icon={<Home size={18} color={COLORS.surfaceWhite} />}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceGround,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  successBanner: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginTop: SPACING.sm,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  orderBadgeBox: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    marginTop: SPACING.md,
  },
  orderBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  itemMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  guaranteeCard: {
    backgroundColor: COLORS.accentLight,
    borderRadius: RADII.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  guaranteeDesc: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 2,
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
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});
