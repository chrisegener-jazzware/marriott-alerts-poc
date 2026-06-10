import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAlerts } from '../context/AlertContext';
import SeverityBadge from '../components/SeverityBadge';
import { formatFullTime } from '../utils/time';

export default function AlertDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { alerts, acknowledgeAlert } = useAlerts();

  const alert = alerts.find((a) => a.id === route.params?.alertId);

  if (!alert) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Alert not found.</Text>
      </View>
    );
  }

  const SEVERITY_HEADER: Record<string, string> = {
    critical: '#C62828',
    high: '#E65100',
    medium: '#F57F17',
    low: '#1565C0',
  };

  const headerColor = SEVERITY_HEADER[alert.severity];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={headerColor} />

      {/* Custom header */}
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alert Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Severity + Title */}
        <View style={styles.titleSection}>
          <SeverityBadge severity={alert.severity} large />
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.meta}>
            {formatFullTime(alert.timestamp)} · Posted by {alert.createdBy}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📋 DESCRIPTION</Text>
          <Text style={styles.sectionBody}>{alert.description}</Text>
        </View>

        {/* Action Required */}
        <View style={[styles.section, styles.actionSection]}>
          <Text style={[styles.sectionLabel, styles.actionLabel]}>
            ⚡ ACTION REQUIRED
          </Text>
          <Text style={styles.actionBody}>{alert.action}</Text>
        </View>

        {/* Acknowledge */}
        {alert.acknowledged ? (
          <View style={styles.ackBanner}>
            <Text style={styles.ackBannerIcon}>✅</Text>
            <Text style={styles.ackBannerText}>You acknowledged this alert</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.ackButton}
            onPress={() => {
              acknowledgeAlert(alert.id);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.ackButtonText}>✓  Acknowledge Alert</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: '#888', fontSize: 16 },
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { padding: 4 },
  backText: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600' },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: { padding: 20 },
  titleSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 12,
    marginBottom: 6,
    lineHeight: 28,
  },
  meta: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  actionSection: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  actionLabel: {
    color: '#E65100',
  },
  actionBody: {
    fontSize: 15,
    color: '#3E2723',
    lineHeight: 23,
    fontWeight: '500',
  },
  ackButton: {
    backgroundColor: '#1C1C1C',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  ackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ackBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    marginTop: 4,
  },
  ackBannerIcon: { fontSize: 22, marginRight: 12 },
  ackBannerText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '600',
  },
});
