import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import SeverityBadge from '../components/SeverityBadge';
import GroupChip from '../components/GroupChip';
import ChannelPill from '../components/ChannelPill';
import { RootStackParamList, CHANNEL_META, DeliveryRecord, Channel, DeliveryStatus } from '../types';
import { formatDateTime, formatRelativeTime } from '../utils/time';

type DetailRouteProp = RouteProp<RootStackParamList, 'AlertDetail'>;

export default function AlertDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<any>();
  const { alerts, groups, staff, acknowledgeAlert, resolveAlert, role } = useApp();

  const alert = alerts.find((a) => a.id === route.params.alertId);

  if (!alert) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Alert not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const groupMap = Object.fromEntries(groups.map((g) => [g.id, g]));
  const staffMap = Object.fromEntries(staff.map((s) => [s.id, s]));
  const ackedIds = new Set(alert.acks.map((a) => a.recipientId));

  // Delivery matrix: recipient × channel
  const recipientIds = Array.from(new Set(alert.deliveries.map((d) => d.recipientId)));
  const deliveryMap: Record<string, Record<Channel, DeliveryRecord | undefined>> = {};
  for (const rid of recipientIds) {
    deliveryMap[rid] = {} as Record<Channel, DeliveryRecord | undefined>;
  }
  for (const d of alert.deliveries) {
    if (!deliveryMap[d.recipientId]) {
      deliveryMap[d.recipientId] = {} as Record<Channel, DeliveryRecord | undefined>;
    }
    deliveryMap[d.recipientId][d.channel] = d;
  }

  const STATUS_ICON: Record<DeliveryStatus, string> = {
    pending: '⏳',
    sent: '📤',
    delivered: '✅',
    failed: '❌',
  };

  const canAck = role === 'staff' || role === 'admin'; // any role can ack in demo
  const MY_STAFF_ID = 's1'; // demo: current user is Maria Santos

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Feed</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Alert Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <SeverityBadge severity={alert.severity} />
            <View style={[
              styles.statusBadge,
              alert.status === 'escalated' ? styles.statusEscalated :
              alert.status === 'resolved' ? styles.statusResolved : styles.statusActive
            ]}>
              <Text style={[
                styles.statusText,
                alert.status === 'escalated' ? styles.statusTextEscalated :
                alert.status === 'resolved' ? styles.statusTextResolved : styles.statusTextActive
              ]}>
                {alert.status === 'escalated' ? '↑ ESCALATED' :
                 alert.status === 'resolved' ? '✓ RESOLVED' : '● ACTIVE'}
              </Text>
            </View>
          </View>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertMeta}>
            {alert.alertType} · {formatDateTime(alert.timestamp)} · by {alert.createdBy}
          </Text>
        </View>

        {/* Description / Action */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.bodyText}>{alert.description}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REQUIRED ACTION</Text>
          <Text style={styles.bodyText}>{alert.action}</Text>
        </View>

        {/* Routing info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ROUTED TO</Text>
          <View style={styles.groupRow}>
            {alert.routedGroupIds.map((gid) => {
              const g = groupMap[gid];
              return g ? <GroupChip key={gid} group={g} memberCount={g.memberIds.length} /> : null;
            })}
            {alert.routedGroupIds.length === 0 && (
              <Text style={styles.dimText}>No groups assigned</Text>
            )}
          </View>
          <Text style={styles.dimText}>Channels: {alert.channels.join(', ')}</Text>
        </View>

        {/* Escalation chain */}
        {alert.escalationAfterMinutes > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ESCALATION CHAIN</Text>
            <View style={styles.escalationChain}>
              <View style={styles.chainStep}>
                <View style={styles.chainDot} />
                <Text style={styles.chainLabel}>Primary groups notified immediately</Text>
              </View>
              <View style={styles.chainLine} />
              <View style={styles.chainStep}>
                <View style={[styles.chainDot, alert.status === 'escalated' ? styles.chainDotActive : styles.chainDotPending]} />
                <View>
                  <Text style={styles.chainLabel}>
                    Escalate after {alert.escalationAfterMinutes}m if unacked
                  </Text>
                  <View style={styles.groupRow}>
                    {alert.escalationGroupIds.map((gid) => {
                      const g = groupMap[gid];
                      return g ? <GroupChip key={gid} group={g} /> : null;
                    })}
                    {alert.escalationGroupIds.length === 0 && (
                      <Text style={styles.dimText}>No escalation groups</Text>
                    )}
                  </View>
                  {alert.escalatedAt && (
                    <Text style={styles.escalatedAtText}>
                      Escalated {formatRelativeTime(alert.escalatedAt)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Delivery matrix */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DELIVERY MATRIX</Text>
          {recipientIds.length === 0 && <Text style={styles.dimText}>No recipients</Text>}
          {recipientIds.map((rid) => {
            const s = staffMap[rid];
            const acked = ackedIds.has(rid);
            const ackRecord = alert.acks.find((a) => a.recipientId === rid);
            return (
              <View key={rid} style={styles.recipientRow}>
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientName}>{s?.name ?? rid}</Text>
                  <Text style={styles.recipientRole}>{s?.role ?? ''}</Text>
                </View>
                <View style={styles.channelStatuses}>
                  {alert.channels.map((ch) => {
                    const delivery = deliveryMap[rid]?.[ch];
                    if (!delivery) return null;
                    return (
                      <View key={ch} style={styles.channelStatus}>
                        <Text style={styles.channelIcon}>{CHANNEL_META[ch].icon}</Text>
                        <Text style={styles.channelStatusIcon}>
                          {STATUS_ICON[delivery.status]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.ackStatus}>
                  {acked ? (
                    <View style={styles.ackedBadge}>
                      <Text style={styles.ackedText}>
                        ✓ {ackRecord ? formatRelativeTime(ackRecord.ackedAt) : 'acked'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.unackedBadge}>
                      <Text style={styles.unackedText}>pending</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Ack button */}
        {alert.status !== 'resolved' && canAck && !ackedIds.has(MY_STAFF_ID) && (
          <TouchableOpacity
            style={styles.ackBtn}
            onPress={() => acknowledgeAlert(alert.id, MY_STAFF_ID)}
          >
            <Text style={styles.ackBtnText}>✓ Acknowledge This Alert</Text>
          </TouchableOpacity>
        )}
        {alert.status !== 'resolved' && canAck && ackedIds.has(MY_STAFF_ID) && (
          <View style={styles.alreadyAcked}>
            <Text style={styles.alreadyAckedText}>You acknowledged this alert</Text>
          </View>
        )}

        {/* Resolve button (admin only) */}
        {role === 'admin' && alert.status !== 'resolved' && (
          <TouchableOpacity
            style={styles.resolveBtn}
            onPress={() => {
              resolveAlert(alert.id);
              navigation.goBack();
            }}
          >
            <Text style={styles.resolveBtnText}>Mark Resolved</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F6' },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1C' },
  notFoundText: { color: '#fff', fontSize: 18, marginBottom: 16 },
  back: { color: '#B8860B', fontSize: 16 },
  navBar: {
    backgroundColor: '#1C1C1C',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 60 },
  backText: { color: '#B8860B', fontSize: 14, fontWeight: '600' },
  navTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  headerCard: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusActive: { backgroundColor: '#34C75920' },
  statusEscalated: { backgroundColor: '#FF950020' },
  statusResolved: { backgroundColor: '#88888820' },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  statusTextActive: { color: '#34C759' },
  statusTextEscalated: { color: '#FF9500' },
  statusTextResolved: { color: '#888' },
  alertTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  alertMeta: { color: '#B8860B', fontSize: 12, fontWeight: '500' },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 10,
    padding: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B8860B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  bodyText: { fontSize: 14, color: '#333', lineHeight: 20 },
  groupRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  dimText: { fontSize: 12, color: '#999' },
  escalationChain: { paddingLeft: 4 },
  chainStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  chainDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#34C759', marginRight: 10, marginTop: 3 },
  chainDotActive: { backgroundColor: '#FF9500' },
  chainDotPending: { backgroundColor: '#ccc' },
  chainLine: { width: 1, height: 16, backgroundColor: '#ddd', marginLeft: 4, marginVertical: 2 },
  chainLabel: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 4 },
  escalatedAtText: { fontSize: 11, color: '#FF9500', fontWeight: '600' },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recipientInfo: { flex: 1.2 },
  recipientName: { fontSize: 13, fontWeight: '700', color: '#1C1C1C' },
  recipientRole: { fontSize: 11, color: '#888', marginTop: 1 },
  channelStatuses: { flex: 1.8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  channelStatus: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  channelIcon: { fontSize: 12 },
  channelStatusIcon: { fontSize: 10 },
  ackStatus: { flex: 0.9, alignItems: 'flex-end' },
  ackedBadge: { backgroundColor: '#34C75918', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  ackedText: { fontSize: 10, color: '#34C759', fontWeight: '700' },
  unackedBadge: { backgroundColor: '#FF3B3012', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  unackedText: { fontSize: 10, color: '#FF3B30', fontWeight: '600' },
  ackBtn: {
    backgroundColor: '#B8860B',
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ackBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  alreadyAcked: {
    backgroundColor: '#34C75918',
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34C75940',
  },
  alreadyAckedText: { color: '#34C759', fontSize: 14, fontWeight: '700' },
  resolveBtn: {
    borderWidth: 1,
    borderColor: '#34C75960',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resolveBtnText: { color: '#34C759', fontSize: 14, fontWeight: '700' },
});
