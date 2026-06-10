import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useAlerts } from '../context/AlertContext';

export default function SettingsScreen() {
  const { role, setRole, alerts } = useAlerts();

  const totalAlerts = alerts.length;
  const acknowledgedCount = alerts.filter((a) => a.acknowledged).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  const isAdmin = role === 'admin';

  const toggleRole = () => {
    const newRole = isAdmin ? 'staff' : 'admin';
    Alert.alert(
      `Switch to ${newRole === 'admin' ? 'Admin' : 'Staff'} Mode`,
      newRole === 'admin'
        ? 'Admin mode enables creating and broadcasting alerts.'
        : 'Staff mode allows viewing and acknowledging alerts only.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: () => setRole(newRole) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Demo configuration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Role Toggle */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DEMO ROLE</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.roleDisplay}>
            <View style={styles.roleInfo}>
              <Text style={styles.roleIcon}>{isAdmin ? '👑' : '👤'}</Text>
              <View>
                <Text style={styles.roleName}>
                  {isAdmin ? 'Administrator' : 'Staff Member'}
                </Text>
                <Text style={styles.roleDescription}>
                  {isAdmin
                    ? 'Can create, broadcast, and view alerts'
                    : 'Can view and acknowledge alerts'}
                </Text>
              </View>
            </View>
            <Switch
              value={isAdmin}
              onValueChange={toggleRole}
              trackColor={{ false: '#DDD', true: '#B8860B' }}
              thumbColor={isAdmin ? '#FFF' : '#FFF'}
            />
          </View>
          <View style={styles.divider} />
          <Text style={styles.roleHint}>
            💡 Toggle to simulate different user roles. Admin role unlocks the Create Alert screen and FAB button.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SESSION STATS</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalAlerts}</Text>
            <Text style={styles.statLabel}>Total Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#2E7D32' }]}>
              {acknowledgedCount}
            </Text>
            <Text style={styles.statLabel}>Acknowledged</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#C62828' }]}>
              {criticalCount}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>APP INFO</Text>
        </View>
        <View style={styles.card}>
          <InfoRow label="App Name" value="Marriott Staff Alerts" />
          <InfoRow label="Version" value="1.0.0 (POC)" />
          <InfoRow label="Build" value="Demo — No Backend" />
          <InfoRow label="Notifications" value="Local (Expo)" />
          <InfoRow label="State" value="In-Memory Context" />
        </View>

        {/* Branding */}
        <View style={styles.brandSection}>
          <View style={styles.brandBar} />
          <Text style={styles.brandText}>MARRIOTT INTERNATIONAL</Text>
          <Text style={styles.brandSub}>Staff Operations Platform</Text>
          <Text style={styles.brandDisclaimer}>
            This is a proof-of-concept demo. Not an official Marriott product.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, color: '#1A1A2E', fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F6' },
  header: {
    backgroundColor: '#1C1C1C',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#B8860B',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  content: { padding: 20 },
  sectionHeader: { marginTop: 20, marginBottom: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  roleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  roleIcon: { fontSize: 36, marginRight: 14 },
  roleName: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  roleDescription: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 14 },
  roleHint: { fontSize: 12, color: '#999', lineHeight: 18 },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  brandSection: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  brandBar: {
    width: 60,
    height: 3,
    backgroundColor: '#B8860B',
    borderRadius: 2,
    marginBottom: 16,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1C',
    letterSpacing: 2,
  },
  brandSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  brandDisclaimer: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 16,
  },
});
