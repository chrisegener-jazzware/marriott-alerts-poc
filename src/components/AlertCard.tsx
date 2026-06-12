import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { JazzAlert, SEVERITY_META } from '../types';
import { formatRelativeTime } from '../utils/time';
import { useApp } from '../context/AppContext';
import SeverityBadge from './SeverityBadge';
import GroupChip from './GroupChip';

interface Props {
  alert: JazzAlert;
  onPress: () => void;
}

export default function AlertCard({ alert, onPress }: Props) {
  const { groups } = useApp();
  const meta = SEVERITY_META[alert.severity];
  const groupMap = Object.fromEntries(groups.map((g) => [g.id, g]));

  const ackCount = alert.acks.length;
  const totalRecipients = new Set(alert.deliveries.map((d) => d.recipientId)).size;
  const isEscalated = alert.status === 'escalated';
  const isResolved = alert.status === 'resolved';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isResolved && styles.cardResolved,
        isEscalated && styles.cardEscalated,
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Severity stripe */}
      <View style={[styles.stripe, { backgroundColor: meta.color }]} />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          <SeverityBadge severity={alert.severity} size="sm" />
          <Text style={styles.time}>{formatRelativeTime(alert.timestamp)}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, isResolved && styles.titleResolved]} numberOfLines={2}>
          {alert.title}
        </Text>

        {/* Alert type */}
        <Text style={styles.type}>{alert.alertType}</Text>

        {/* Groups routed to */}
        {alert.routedGroupIds.length > 0 && (
          <View style={styles.groupRow}>
            {alert.routedGroupIds.map((gid) => {
              const g = groupMap[gid];
              return g ? <GroupChip key={gid} group={g} /> : null;
            })}
          </View>
        )}

        {/* Delivery + ack row */}
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>📨</Text>
            <Text style={styles.statusText}>
              {alert.deliveries.filter((d) => d.status === 'delivered').length}/
              {alert.deliveries.length} delivered
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>✅</Text>
            <Text style={styles.statusText}>
              {ackCount}/{totalRecipients} acked
            </Text>
          </View>
          {isEscalated && (
            <View style={[styles.statusItem, styles.escalatedBadge]}>
              <Text style={styles.escalatedText}>↑ ESCALATED</Text>
            </View>
          )}
          {isResolved && (
            <View style={[styles.statusItem, styles.resolvedBadge]}>
              <Text style={styles.resolvedText}>✓ RESOLVED</Text>
            </View>
          )}
        </View>

        {/* Channels row */}
        <View style={styles.channelRow}>
          {alert.channels.slice(0, 4).map((ch) => (
            <View key={ch} style={styles.channelTag}>
              <Text style={styles.channelText}>{ch}</Text>
            </View>
          ))}
          {alert.channels.length > 4 && (
            <Text style={styles.moreChannels}>+{alert.channels.length - 4}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  cardResolved: {
    opacity: 0.65,
  },
  cardEscalated: {
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  stripe: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  time: {
    fontSize: 11,
    color: '#999',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: 2,
  },
  titleResolved: {
    color: '#888',
  },
  type: {
    fontSize: 11,
    color: '#B8860B',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  statusText: {
    fontSize: 11,
    color: '#666',
  },
  escalatedBadge: {
    backgroundColor: '#FF950018',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  escalatedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9500',
  },
  resolvedBadge: {
    backgroundColor: '#34C75918',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  resolvedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34C759',
  },
  channelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  channelTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  channelText: {
    fontSize: 10,
    color: '#555',
    fontWeight: '500',
  },
  moreChannels: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'center',
  },
});
