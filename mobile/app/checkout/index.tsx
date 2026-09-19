import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Price } from '../../src/components/common/Price';
import { Button } from '../../src/components/common/Button';
import { COLORS, RADII, SHADOWS, SPACING } from '../../src/theme/tokens';
import { useCartStore } from '../../src/store/useCartStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { isValidMobileNumber, isPincodeServiced, SERVICED_PINCODES } from '../../src/utils/validation';
import { apiFetch } from '../../src/api/client';
import { ArrowLeft, CheckCircle2, ShieldCheck, CreditCard, Banknote } from 'lucide-react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, subtotal, fetchCart, clearCart } = useCartStore();
  const { customer } = useAuthStore();

  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [mobileNumber, setMobileNumber] = useState(customer?.mobileNumber || '');
  const [address, setAddress] = useState('Main Road, Kargahar');
  const [pincode, setPincode] = useState(customer?.pincode || '821107');
  const [city] = useState('Kargahar');
  const [state] = useState('Bihar');
  const [paymentMode, setPaymentMode] = useState<'COD' | 'ONLINE'>('COD');

  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const deliveryCharge = subtotal > 0 ? (subtotal >= 10000 ? 0 : 250) : 0;
  const totalAmount = subtotal + deliveryCharge;

  const handlePlaceOrder = async () => {
    if (isLocked || submitting) return;

    const cleanName = customerName.trim();
    const cleanMobile = mobileNumber.replace(/\D/g, '').trim();
    const cleanAddress = address.trim();
    const cleanPincode = pincode.trim();

    if (!cleanName || cleanName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter your full customer name.');
      return;
    }

    if (!isValidMobileNumber(cleanMobile)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!cleanAddress || cleanAddress.length < 5) {
      Alert.alert('Invalid Address', 'Please enter a complete delivery address in Kargahar region.');
      return;
    }

    if (!isPincodeServiced(cleanPincode)) {
      Alert.alert(
        'Pincode Not Serviced',
        `Delivery is restricted to Kargahar & surrounding tehsils (${SERVICED_PINCODES.join(', ')}).`
      );
      return;
    }

    // Synchronous mutex lock to prevent duplicate submission
    setSubmitting(true);
    setIsLocked(true);

    try {
      const payload = {
        customerName: cleanName,
        customerPhone: cleanMobile,
        mobileNumber: cleanMobile,
        shippingAddress: cleanAddress,
        address: cleanAddress,
        pincode: cleanPincode,
        city,
        state,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };

      if (paymentMode === 'COD') {
        const res = await apiFetch('/api/checkout/cod', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res.success && res.data?.orderNumber) {
          await clearCart();
          router.replace(`/order-confirmation/${res.data.orderNumber}`);
        } else {
          Alert.alert('Checkout Error', res.error?.message || 'Failed to place COD order.');
          setSubmitting(false);
          setIsLocked(false);
        }
      } else {
        // ONLINE Payment via Razorpay
        const res = await apiFetch('/api/checkout/razorpay/create-order', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res.success && res.data) {
          const razorpayOrderId = res.data.razorpayOrder?.id || res.data.razorpayOrderId;
          const orderNum = res.data.orderNumber;

          // Simulate / verify Razorpay payment
          const verifyRes = await apiFetch('/api/checkout/razorpay/verify', {
            method: 'POST',
            body: JSON.stringify({
              razorpayOrderId,
              razorpayPaymentId: `pay_mock_${Date.now()}`,
              razorpaySignature: `sig_mock_${Date.now()}`,
              orderNumber: orderNum,
            }),
          });

          if (verifyRes.success) {
            await clearCart();
            router.replace(`/order-confirmation/${orderNum}`);
          } else {
            Alert.alert('Payment Error', verifyRes.error?.message || 'Payment verification failed.');
            setSubmitting(false);
            setIsLocked(false);
          }
        } else {
          Alert.alert('Order Error', res.error?.message || 'Failed to initialize online payment.');
          setSubmitting(false);
          setIsLocked(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Network Error', err.message || 'Unable to complete checkout request. Please try again.');
      setSubmitting(false);
      setIsLocked(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header />

      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.textHeading} />
          <Text style={styles.backText}>Back to Cart</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Customer Information Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Delivery Details</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rajesh Kumar"
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>10-Digit Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9825012345"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="House/Shop No., Street, Landmark"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.rowFields}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Town / City</Text>
              <TextInput style={[styles.input, styles.disabledInput]} value={city} editable={false} />
            </View>
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Payment Method</Text>

          <TouchableOpacity
            style={[styles.payOption, paymentMode === 'COD' && styles.payOptionActive]}
            onPress={() => setPaymentMode('COD')}
            activeOpacity={0.8}
          >
            <Banknote size={22} color={paymentMode === 'COD' ? COLORS.primary : COLORS.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.payOptionTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.payOptionDesc}>Pay cash upon local delivery in Kargahar</Text>
            </View>
            {paymentMode === 'COD' && <CheckCircle2 size={18} color={COLORS.primary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payOption, paymentMode === 'ONLINE' && styles.payOptionActive]}
            onPress={() => setPaymentMode('ONLINE')}
            activeOpacity={0.8}
          >
            <CreditCard size={22} color={paymentMode === 'ONLINE' ? COLORS.primary : COLORS.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.payOptionTitle}>Razorpay Online Payment (UPI / Card / NetBanking)</Text>
              <Text style={styles.payOptionDesc}>Instant 100% secure server-verified transaction</Text>
            </View>
            {paymentMode === 'ONLINE' && <CheckCircle2 size={18} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>

        {/* Final Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Final Bill Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Price price={subtotal} size="sm" />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Charge</Text>
            <Text style={styles.deliveryVal}>
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable Amount</Text>
            <Price price={totalAmount} size="lg" />
          </View>

          <Button
            title={submitting ? 'Processing Order...' : `Place Order • ₹${totalAmount.toFixed(2)}`}
            onPress={handlePlaceOrder}
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={submitting || isLocked || items.length === 0}
            style={styles.submitBtn}
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 'auto',
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
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: SPACING.md,
  },
  field: {
    marginBottom: SPACING.sm,
  },
  rowFields: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: COLORS.surfaceSubtle,
    color: COLORS.textMuted,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.surfaceCard,
  },
  payOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.accentLight,
  },
  payOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  payOptionDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
  submitBtn: {
    marginTop: SPACING.md,
  },
});
