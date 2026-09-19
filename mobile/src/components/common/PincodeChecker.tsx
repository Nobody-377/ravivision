import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { COLORS, RADII, SPACING } from '../../theme/tokens';
import { isPincodeServiced, SERVICED_PINCODES } from '../../utils/validation';
import { apiFetch } from '../../api/client';

export const PincodeChecker: React.FC = () => {
  const [pincode, setPincode] = useState('821107');
  const [status, setStatus] = useState<{ checked: boolean; isAvailable: boolean; message: string }>({
    checked: true,
    isAvailable: true,
    message: 'Kargahar Region (821107) - Same Day Store Delivery Available',
  });
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    const clean = pincode.trim();
    if (!clean || clean.length !== 6) {
      setStatus({ checked: true, isAvailable: false, message: 'Please enter a valid 6-digit pincode.' });
      return;
    }

    setLoading(true);
    const res = await apiFetch(`/api/pincode/check?pincode=${clean}`);
    setLoading(false);

    if (res.success && res.serviceable) {
      setStatus({
        checked: true,
        isAvailable: true,
        message: `${res.area || 'Serviced Area'} (${clean}) - Store Delivery Available`,
      });
    } else if (isPincodeServiced(clean)) {
      setStatus({
        checked: true,
        isAvailable: true,
        message: `Kargahar Region (${clean}) - Same Day Store Delivery Available`,
      });
    } else {
      setStatus({
        checked: true,
        isAvailable: false,
        message: `Delivery is currently restricted to Kargahar region (${SERVICED_PINCODES.join(', ')}).`,
      });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.rowHeader}>
        <MapPin size={18} color={COLORS.primary} />
        <Text style={styles.title}>Check Delivery Availability</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit Pincode"
          value={pincode}
          onChangeText={setPincode}
          keyboardType="number-pad"
          maxLength={6}
        />
        <TouchableOpacity style={styles.checkBtn} onPress={handleCheck} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.surfaceWhite} />
          ) : (
            <Text style={styles.checkBtnText}>Check</Text>
          )}
        </TouchableOpacity>
      </View>

      {status.checked && (
        <View style={[styles.statusBox, status.isAvailable ? styles.statusSuccess : styles.statusError]}>
          {status.isAvailable ? (
            <CheckCircle2 size={16} color={COLORS.statusSuccess} />
          ) : (
            <AlertCircle size={16} color={COLORS.statusDanger} />
          )}
          <Text style={[styles.statusText, status.isAvailable ? styles.textSuccess : styles.textError]}>
            {status.message}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.accentLight,
    borderRadius: RADII.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADII.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    color: COLORS.textHeading,
  },
  checkBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnText: {
    color: COLORS.surfaceWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    padding: SPACING.xs,
    borderRadius: RADII.sm,
  },
  statusSuccess: {
    backgroundColor: COLORS.statusSuccessBg,
  },
  statusError: {
    backgroundColor: COLORS.statusDangerBg,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  textSuccess: {
    color: COLORS.statusSuccess,
  },
  textError: {
    color: COLORS.statusDanger,
  },
});
