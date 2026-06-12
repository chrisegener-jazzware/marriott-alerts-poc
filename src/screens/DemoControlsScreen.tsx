import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { SEVERITY_META } from '../types';

export default function DemoControlsScreen() {
  const {
    role,
    setRole,
    triggerHousekeepingDemo,
    triggerEmergencyDemo,
    resetToSeedData,
    alerts,
    groups,
    rules,
  } = useApp();
  const navigation = useNavigation<any>();
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  function trigger(fn: () => void, label: string) {
    fn();
    setLastTriggered(label);
  }

  const activeAlerts = alerts.filter((a) => a.status !== 'resolved');
  const p1Alerts = activeAlerts.filter((a) => a.severity === 'P1');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Demo Controls</Text>
        <Text style={styles.headerSub}>Trigger scenarios, toggle role, reset state</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Active Alerts', value: String(activeAlerts.length), color: '#FF9500' },
            { label: 'P1 Critical', value: String(p1Alerts.length), color: '#FF3B30' },
            { label: 'Groups', value: String(groups.length), color: '#5AC8FA' },
            { label: 'Rules', value: String(rules.length), color: '#B8860B' },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { borderTopColor: stat.color }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Role toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Role</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
              onPress={() => setRole('admin')}
            >
              <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActive]}>
                👑 Admin
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'staff' && styles.roleBtnActive]}
              onPress={() => setRole('staff')}
            >
              <Text style={[styles.roleBtnText, role === 'staff' && styles.roleBtnTextActive]}>
                👤 Staff
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.roleNote}>
            Admin: can create alerts, edit rules & groups, mark resolved.
            Staff: read + acknowledge only.
          </Text>
        </View>

        {/* Demo scenarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Scenarios</Text>
          <Text style={styles.sectionSub}>
            These show the routing contrast. Open Alert Feed after triggering.
          </Text>

          {/* Scenario 1 */}
          <View style={styles.scenarioCard}>
            <View style={styles.scenarioHeader}>
              <Text style={styles.scenarioIcon}>🛏️</Text>
              <View>
                <Text style={styles.scenarioTitle}>Scenario 1 — Housekeeping</Text>
                <Text style={styles.scenarioBadge}>Water Leak · Room 412 · {SEVERITY_META.P2.label}</Text>
              </View>
            </View>
            <Text style={styles.scenarioDesc}>
              Routes to <Text style={styles.highlight}>Housekeeping group ONLY</Text>.{'\n'}
              GM is NOT notified.{'\n'}
              Channels: push + sms + voice{'\n'}
              Escalates to GM after 15 min if unacked.
            </Text>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => trigger(triggerHousekeepingDemo, 'Housekeeping Demo')}
            >
              <Text style={styles.demoBtnText}>▶ Trigger Scenario 1</Text>
            </TouchableOpacity>
          </View>

          {/* Scenario 2 */}
          <View style={[styles.scenarioCard, styles.scenarioCardEmergency]}>
            <View style={styles.scenarioHeader}>
              <Text style={styles.scenarioIcon}>🚨</Text>
              <View>
                <Text style={styles.scenarioTitle}>Scenario 2 — Emergency</Text>
                <Text style={[styles.scenarioBadge, styles.scenarioBadgeEmergency]}>
                  911 Call · Lobby · {SEVERITY_META.P1.label}
                </Text>
              </View>
            </View>
            <Text style={styles.scenarioDesc}>
              Routes to <Text style={styles.highlight}>GM + Security on ALL channels</Text>.{'\n'}
              SMS + WhatsApp + Voice + Email + Push{'\n'}
              No escalation needed — all channels immediately.
            </Text>
            <TouchableOpacity
              style={[styles.demoBtn, styles.demoBtnEmergency]}
              onPress={() => trigger(triggerEmergencyDemo, 'Emergency Demo')}
            >
              <Text style={styles.demoBtnText}>▶ Trigger Scenario 2</Text>
            </TouchableOpacity>
          </View>

          {lastTriggered && (
            <View style={styles.triggeredNote}>
              <Text style={styles.triggeredNoteText}>
                ✅ Triggered: {lastTriggered} — check the Alert Feed
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.feedBtn}
            onPress={() => navigation.navigate('Feed')}
          >
            <Text style={styles.feedBtnText}>→ Go to Alert Feed</Text>
          </TouchableOpacity>
        </View>

        {/* Severity reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Reference</Text>
          {(['P1', 'P2', 'P3', 'P4'] as const).map((sev) => {
            const m = SEVERITY_META[sev];
            return (
              <View key={sev} style={[styles.sevRow, { borderLeftColor: m.color }]}>
                <Text style={[styles.sevLabel, { color: m.color }]}>{m.label}</Text>
                <Text style={styles.sevDetail}>
                  Ack window:{' '}
                  {m.ackWindowMinutes > 0 ? `${m.ackWindowMinutes} min` : 'N/A'}{' '}
                  · Channels: {['P1', 'P2', 'P3', 'P4'].indexOf(sev) === 0 ? 'all' :
                    sev === 'P2' ? 'push+sms+voice' :
                    sev === 'P3' ? 'push+sms' : 'email'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reset</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              resetToSeedData();
              setLastTriggered(null);
            }}
          >
            <Text style={styles.resetBtnText}>↺ Reset All Demo Data</Text>
          </TouchableOpacity>
          <Text style={styles.resetNote}>
            Restores original seed scenarios and clears any triggered demos.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F6' },
  header: {
    backgroundColor: '#1C1C1C',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#B8860B', fontSize: 13, marginTop: 2 },
  scroll: { padding: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1C1C1C', marginBottom: 10 },
  sectionSub: { fontSize: 13, color: '#888', marginBottom: 12, lineHeight: 18 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: '#1C1C1C', borderColor: '#1C1C1C' },
  roleBtnText: { fontSize: 15, fontWeight: '700', color: '#666' },
  roleBtnTextActive: { color: '#B8860B' },
  roleNote: { fontSize: 12, color: '#888', marginTop: 10, lineHeight: 16 },
  scenarioCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  scenarioCardEmergency: {
    borderColor: '#FF3B3030',
    backgroundColor: '#FF3B3008',
  },
  scenarioHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  scenarioIcon: { fontSize: 24, marginRight: 10 },
  scenarioTitle: { fontSize: 14, fontWeight: '800', color: '#1C1C1C' },
  scenarioBadge: {
    fontSize: 11,
    color: '#B8860B',
    fontWeight: '600',
    marginTop: 2,
  },
  scenarioBadgeEmergency: { color: '#FF3B30' },
  scenarioDesc: { fontSize: 13, color: '#444', lineHeight: 20, marginBottom: 12 },
  highlight: { fontWeight: '800', color: '#1C1C1C' },
  demoBtn: {
    backgroundColor: '#B8860B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoBtnEmergency: { backgroundColor: '#FF3B30' },
  demoBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  triggeredNote: {
    backgroundColor: '#34C75918',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  triggeredNoteText: { color: '#34C759', fontWeight: '600', fontSize: 13 },
  feedBtn: {
    borderWidth: 1,
    borderColor: '#B8860B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  feedBtnText: { color: '#B8860B', fontWeight: '700', fontSize: 14 },
  sevRow: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 8,
  },
  sevLabel: { fontSize: 13, fontWeight: '700' },
  sevDetail: { fontSize: 11, color: '#888', marginTop: 2 },
  resetBtn: {
    borderWidth: 1,
    borderColor: '#FF3B3060',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  resetBtnText: { color: '#FF3B30', fontWeight: '700', fontSize: 14 },
  resetNote: { fontSize: 12, color: '#888', lineHeight: 16 },
});
