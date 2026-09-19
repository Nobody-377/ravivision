import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { LoadingState } from '../../src/components/common/LoadingState';
import { COLORS, RADII, SHADOWS, SPACING } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/useAuthStore';
import { isValidMobileNumber, isPincodeServiced, SERVICED_PINCODES } from '../../src/utils/validation';
import { User, Phone, MapPin, LogOut, PhoneCall, ShieldCheck, LogIn, UserPlus } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { customer, isLoading, login, signup, logout, error } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pincode, setPincode] = useState('821107');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const cleanMobile = mobileNumber.replace(/\D/g, '').trim();
    if (!isValidMobileNumber(cleanMobile)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (mode === 'signup') {
      const cleanName = name.trim();
      const cleanPincode = pincode.trim();

      if (!cleanName || cleanName.length < 2) {
        Alert.alert('Invalid Name', 'Please enter your full name.');
        return;
      }

      if (!isPincodeServiced(cleanPincode)) {
        Alert.alert(
          'Pincode Not Serviced',
          `Delivery is restricted to Kargahar region (${SERVICED_PINCODES.join(', ')}).`
        );
        return;
      }

      setSubmitting(true);
      const ok = await signup(cleanName, cleanMobile, cleanPincode);
      setSubmitting(false);
      if (ok) {
        Alert.alert('Success', 'Account created and logged in!');
      }
    } else {
      setSubmitting(true);
      const ok = await login(cleanMobile);
      setSubmitting(false);
      if (ok) {
        Alert.alert('Welcome Back', 'Logged in successfully!');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header />
        <LoadingState message="Checking customer account..." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        {customer ? (
          /* Authenticated Profile View */
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <User size={32} color={COLORS.surfaceWhite} />
              </View>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerMobile}>{customer.mobileNumber}</Text>

              <View style={styles.detailRow}>
                <MapPin size={16} color={COLORS.primary} />
                <Text style={styles.detailText}>
                  Primary Pincode: {customer.pincode} (Kargahar Region)
                </Text>
              </View>

              <Button
                title="Logout"
                onPress={logout}
                variant="outline"
                icon={<LogOut size={16} color={COLORS.primary} />}
                style={styles.logoutBtn}
              />
            </View>

            {/* Account Quick Links */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account Actions</Text>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/(tabs)/orders')}
              >
                <Text style={styles.actionText}>View Order History & Tracking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/products')}
              >
                <Text style={styles.actionText}>Browse Products Catalog</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Login / Signup Form */
          <View style={styles.card}>
            <View style={styles.modeHeader}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
                onPress={() => setMode('login')}
              >
                <LogIn size={16} color={mode === 'login' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
                onPress={() => setMode('signup')}
              >
                <UserPlus size={16} color={mode === 'signup' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {mode === 'signup' && (
              <View style={styles.field}>
                <Text style={styles.label}>Full Customer Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

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

            {mode === 'signup' && (
              <View style={styles.field}>
                <Text style={styles.label}>Kargahar Pincode</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 821107"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            )}

            <Button
              title={mode === 'login' ? 'Login to Account' : 'Create Customer Account'}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              loading={submitting}
              style={styles.submitBtn}
            />
          </View>
        )}

        {/* Store Helpline Box */}
        <TouchableOpacity
          style={styles.callBox}
          onPress={() => Linking.openURL('tel:9631410611')}
          activeOpacity={0.8}
        >
          <PhoneCall size={20} color={COLORS.surfaceWhite} />
          <View>
            <Text style={styles.callBoxTitle}>Ravi Vision Store Support</Text>
            <Text style={styles.callBoxDesc}>Helpline: 9631410611 • 24/7 Assistance</Text>
          </View>
        </TouchableOpacity>
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
  profileCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  customerMobile: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  logoutBtn: {
    marginTop: SPACING.md,
    width: '100%',
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
  modeHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeTabActive: {
    borderBottomColor: COLORS.primary,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modeTabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.statusDanger,
    marginBottom: SPACING.sm,
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
  submitBtn: {
    marginTop: SPACING.md,
  },
  actionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceSubtle,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  callBox: {
    backgroundColor: COLORS.primary,
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
    color: '#e2e8f0',
    fontSize: 11,
  },
});
