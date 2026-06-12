import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Channel, CHANNEL_META, DeliveryStatus } from '../types';

const STATUS_COLOR: Record<DeliveryStatus, string> = {
  pending:   '#888',
  sent:      '#FF9500',
  delivered: '#34C759',
  failed:    '#FF3B30',
};

interface Props {
  channel: Channel;
  status?: DeliveryStatus;
}

export default function ChannelPill({ channel, status }: Props) {
  const meta = CHANNEL_META[channel];
  const color = status ? STATUS_COLOR[status] : '#666';
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={styles.icon}>{meta.icon}</Text>
      <Text style={[styles.label, { color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  icon: { fontSize: 10, marginRight: 3 },
  label: { fontSize: 10, fontWeight: '600' },
});
