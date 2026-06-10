import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Severity } from '../types';

interface Props {
  severity: Severity;
  large?: boolean;
}

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; bg: string; text: string; dot: string }
> = {
  critical: { label: 'CRITICAL', bg: '#FDECEA', text: '#C62828', dot: '#E53935' },
  high: { label: 'HIGH', bg: '#FFF3E0', text: '#E65100', dot: '#FB8C00' },
  medium: { label: 'MEDIUM', bg: '#FFFDE7', text: '#F57F17', dot: '#FDD835' },
  low: { label: 'LOW', bg: '#E3F2FD', text: '#1565C0', dot: '#1E88E5' },
};

export default function SeverityBadge({ severity, large = false }: Props) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        large && styles.badgeLarge,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text
        style={[styles.text, { color: config.text }, large && styles.textLarge]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textLarge: {
    fontSize: 13,
    letterSpacing: 0.8,
  },
});
