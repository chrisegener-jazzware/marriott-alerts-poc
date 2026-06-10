import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Alert } from '../types';
import SeverityBadge from './SeverityBadge';
import { formatRelativeTime } from '../utils/time';

interface Props {
  alert: Alert;
  onPress: () => void;
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: '#E53935',
  high: '#FB8C00',
  medium: '#FDD835',
  low: '#1E88E5',
};

export default function AlertCard({ alert, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        alert.acknowledged && styles.cardAcknowledged,
        { borderLeftColor: SEVERITY_BORDER[alert.severity] },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <SeverityBadge severity={alert.severity} />
        <Text style={styles.time}>{formatRelativeTime(alert.timestamp)}</Text>
      </View>
      <View style={styles.titleRow}>
        <Text style={[styles.title, alert.acknowledged && styles.titleRead]}>
          {alert.title}
        </Text>
        {!alert.acknowledged && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {alert.description}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.createdBy}>Posted by {alert.createdBy}</Text>
        {alert.acknowledged && (
          <View style={styles.ackBadge}>
            <Text style={styles.ackText}>✓ Acknowledged</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardAcknowledged: {
    opacity: 0.7,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  titleRead: {
    color: '#666',
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B8860B',
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdBy: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  ackBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ackText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
});
