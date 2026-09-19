import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Price } from '../../src/components/common/Price';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingState } from '../../src/components/common/LoadingState';
import { COLORS, RADII, SHADOWS, SPACING } from '../../src/theme/tokens';
import { formatISTDate } from '../../src/utils/date';
import { apiFetch } from '../../src/api/client';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Package, Search, ChevronRight } from 'lucide-react-native';

export default function OrdersScreen() {
  const router = useRouter();
  const { customer } = useAuthStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [mobileInput, setMobileInput] = useState(customer?.mobileNumber || '');
  const [searched, setSearched] = useState(false);

  const fetchCustomerOrders = async () => {
    setLoading(true);
    let url = '/api/orders/track';
    if (orderNumberInput.trim() && mobileInput.trim()) {
      url += `?orderNumber=${encodeURIComponent(orderNumberInput.trim())}&mobileNumber=${encodeURIComponent(mobileInput.trim())}`;
    } else if (orderNumberInput.trim()) {
      url += `?orderNumber=${encodeURIComponent(orderNumberInput.trim())}`;
    } else if (mobileInput.trim()) {
      url += `?mobileNumber=${encodeURIComponent(mobileInput.trim())}`;
    }

    const res = await apiFetch(url);
    if (res.success && res.data) {
      const dataArr = Array.isArray(res.data) ? res.data : [res.data];
      setOrders(dataArr);
    } else {
      setOrders([]);
    }
    setLoading(false);
    setSearched(true);
  };

  useEffect(() => {
    fetchCustomerOrders();
  }, []);

  return (
    <View style={styles.screen}>
      <Header />

      <View style={styles.pageHeader}>
        <Package size={20} color={COLORS.primary} />
        <Text style={styles.pageTitle}>Order Tracking & History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Track Order Search Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Track Your Order</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Order Number (Optional if logged in)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ORD-174000-1234"
              value={orderNumberInput}
              onChangeText={setOrderNumberInput}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              value={mobileInput}
              onChangeText={setMobileInput}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <Button
            title="Search Orders"
            onPress={fetchCustomerOrders}
            variant="primary"
            icon={<Search size={16} color={COLORS.surfaceWhite} />}
            style={styles.searchBtn}
          />
        </View>

        {/* Orders List */}
        {loading ? (
          <LoadingState message="Fetching your orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No Orders Found"
            description={
              searched
                ? 'No matching orders were found with the provided criteria.'
                : 'You have not placed any orders yet.'
            }
            actionLabel="Start Shopping"
            onAction={() => router.push('/products')}
          />
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push(`/order-confirmation/${order.orderNumber}`)}
              activeOpacity={0.9}
            >
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderNumberText}>#{order.orderNumber}</Text>
                <Badge label={order.orderStatus} variant="info" />
              </View>

              <Text style={styles.orderDateText}>{formatISTDate(order.createdAt)}</Text>

              <View style={styles.divider} />

              <Text style={styles.customerName}>{order.customerName}</Text>
              <Text style={styles.addressText} numberOfLines={1}>
                {order.address}, {order.pincode}
              </Text>

              <View style={styles.orderCardFooter}>
                <Price price={Number(order.totalAmount)} size="md" />
                <View style={styles.viewDetailsRow}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <ChevronRight size={16} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))
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
  field: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textBody,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceWhite,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textHeading,
  },
  searchBtn: {
    marginTop: SPACING.xs,
  },
  orderCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  orderDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceSubtle,
    marginVertical: SPACING.sm,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
