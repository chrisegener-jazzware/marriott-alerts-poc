import React, { useCallback } from 'react';
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
import { useAlerts } from '../context/AlertContext';
import AlertCard from '../components/AlertCard';
import { Alert } from '../types';

export default function AlertFeedScreen() {
  const { alerts, role, unreadCount } = useAlerts();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = React.useState(false);

  const sorted = [...alerts].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderItem = ({ item }: { item: Alert }) => (
    <AlertCard
      alert={item}
      onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Staff Alerts</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`
              : 'All alerts acknowledged'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {role === 'admin' ? '👑 Admin' : '👤 Staff'}
            </Text>
          </View>
        </View>
      </View>

      {/* Alert count strip */}
      {unreadCount > 0 && (
        <View style={styles.urgentStrip}>
          <Text style={styles.urgentText}>
            ⚠️  {unreadCount} alert{unreadCount !== 1 ? 's' : ''} require{unreadCount === 1 ? 's' : ''} attention
          </Text>
        </View>
      )}

      <FlatList
        data={sorted}
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
            <Text style={styles.emptyText}>No alerts at this time</Text>
          </View>
        }
      />

      {/* FAB — admin only */}
      {role === 'admin' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateAlert')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F6',
  },
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
  headerRight: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    backgroundColor: 'rgba(184,134,11,0.2)',
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleText: {
    color: '#B8860B',
    fontSize: 12,
    fontWeight: '600',
  },
  urgentStrip: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEAA7',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  urgentText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingTop: 12,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B8860B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 36,
  },
});
