import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/tokens';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Unable to load content. Please try again.',
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <AlertTriangle size={36} color={COLORS.statusDanger} />
      <Text style={styles.text}>{message}</Text>
      {onRetry && <Button title="Try Again" onPress={onRetry} variant="outline" size="sm" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    margin: SPACING.md,
  },
  text: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
  },
});
