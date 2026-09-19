import test from 'node:test';
import assert from 'node:assert';
import { formatINR, roundToTwoDecimals } from '../src/utils/currency';
import { isPincodeServiced, isValidMobileNumber } from '../src/utils/validation';
import { formatISTDate } from '../src/utils/date';

// 1. Currency Formatting & Decimal Safety Tests
test('Mobile Currency Formatter - formatINR strictly outputs 2 decimal places in INR', () => {
  assert.strictEqual(formatINR(24999), '₹24,999.00');
  assert.strictEqual(formatINR(1499.5), '₹1,499.50');
  assert.strictEqual(formatINR(0), '₹0.00');
  assert.strictEqual(formatINR(null), '₹0.00');
});

test('Decimal Safety - roundToTwoDecimals handles floating point rounding accurately', () => {
  assert.strictEqual(roundToTwoDecimals(24999.994), 24999.99);
  assert.strictEqual(roundToTwoDecimals(24999.996), 25000);
});

// 2. Input Validation Tests
test('Pincode Validator - correctly validates Kargahar region serviced pincodes', () => {
  assert.strictEqual(isPincodeServiced('821107'), true); // Kargahar
  assert.strictEqual(isPincodeServiced('821115'), true); // Sasaram
  assert.strictEqual(isPincodeServiced('110001'), false); // Delhi
});

test('Mobile Number Validator - verifies 10-digit Indian mobile numbers', () => {
  assert.strictEqual(isValidMobileNumber('9825012345'), true);
  assert.strictEqual(isValidMobileNumber('12345'), false);
  assert.strictEqual(isValidMobileNumber('0000000000'), false);
});

// 3. IST Timestamp Formatting Tests
test('IST Date Formatter - appends IST and formats date consistently', () => {
  const formatted = formatISTDate('2026-09-14T17:00:00.000Z');
  assert.ok(formatted.includes('IST'));
});
