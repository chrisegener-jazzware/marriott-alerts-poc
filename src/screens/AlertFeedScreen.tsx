import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import AlertCard from '../components/AlertCard';
import { JazzAlert } from '../types';

type FilterTab = 'all' | 'active' | 'resolved';

export default function AlertFeedScreen() {
  const { alerts, role, unreadCount } = useApp();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');

  const sorted = [...alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const filtered = sorted.filter((a) => {
    if (filter === 'active') return a.status !== 'resolved';
    if (filter === 'resolved') return a.status === 'resolved';
    return true;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const renderItem = ({ item }: { item: JazzAlert }) => (
    <AlertCard
      alert={item}
      onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
    />
  );

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🎵 Jazz Note</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0
              ? `${unreadCount} alert${unreadCount !== 1 ? 's' : ''} need attention`
              : 'All clear'}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role === 'admin' ? '👑 Admin' : '👤 Staff'}</Text>
        </View>
      </View>

      {/* Unacked P1 strip */}
      {alerts.some((a) => a.severity === 'P1' && a.status !== 'resolved' && a.acks.length === 0) && (
        <View style={styles.criticalStrip}>
          <Text style={styles.criticalText}>🔴  CRITICAL alerts require immediate response</Text>
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#B8860B"
            colors={['#B8860B']}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No alerts to show</Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
  roleBadge: {
    backgroundColor: 'rgba(184,134,11,0.2)',
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleText: { color: '#B8860B', fontSize: 12, fontWeight: '600' },
  criticalStrip: {
    backgroundColor: '#FF3B3018',
    borderBottomWidth: 1,
    borderBottomColor: '#FF3B3040',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  criticalText: { color: '#FF3B30', fontSize: 13, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterTabActive: { backgroundColor: '#B8860B' },
  filterTabText: { fontSize: 13, color: '#666', fontWeight: '600' },
  filterTabTextActive: { color: '#fff' },
  list: { paddingTop: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 16 },
});
