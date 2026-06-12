import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SeverityLevel, SEVERITY_META } from '../types';

interface Props {
  severity: SeverityLevel;
  size?: 'sm' | 'md';
}

export default function SeverityBadge({ severity, size = 'md' }: Props) {
  const meta = SEVERITY_META[severity];
  const isSmall = size === 'sm';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.bgColor, borderColor: meta.color },
        isSmall && styles.badgeSm,
      ]}
    >
      <Text style={[styles.text, { color: meta.color }, isSmall && styles.textSm]}>
        {meta.icon} {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 10,
  },
});
