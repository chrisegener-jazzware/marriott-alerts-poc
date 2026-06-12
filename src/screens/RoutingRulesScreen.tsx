import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { RoutingRule, SeverityLevel, Channel, SEVERITY_META, CHANNEL_META } from '../types';
import GroupChip from '../components/GroupChip';
import SeverityBadge from '../components/SeverityBadge';

const ALL_ALERT_TYPES = [
  'Emergency', 'Security', 'Housekeeping', 'Maintenance', 'Front Desk', 'General',
];
const ALL_SEVERITIES: SeverityLevel[] = ['P1', 'P2', 'P3', 'P4'];
const ALL_CHANNELS: Channel[] = ['push', 'sms', 'whatsapp', 'voice', 'email'];

interface RuleFormState {
  alertType: string;
  severity: SeverityLevel;
  groupIds: string[];
  channelOverride: Channel[];
  escalationGroupIds: string[];
  escalationAfterMinutes: string;
}

const DEFAULT_FORM: RuleFormState = {
  alertType: 'General',
  severity: 'P3',
  groupIds: [],
  channelOverride: ['push', 'sms'],
  escalationGroupIds: [],
  escalationAfterMinutes: '0',
};

export default function RoutingRulesScreen() {
  const { rules, groups, addRule, updateRule, deleteRule, role } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleFormState>(DEFAULT_FORM);

  const groupMap = Object.fromEntries(groups.map((g) => [g.id, g]));
  const isAdmin = role === 'admin';

  function openAdd() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowModal(true);
  }

  function openEdit(rule: RoutingRule) {
    setEditingId(rule.id);
    setForm({
      alertType: rule.alertType,
      severity: rule.severity,
      groupIds: [...rule.groupIds],
      channelOverride: [...(rule.channelOverride ?? [])],
      escalationGroupIds: [...(rule.escalationGroupIds ?? [])],
      escalationAfterMinutes: String(rule.escalationAfterMinutes ?? 0),
    });
    setShowModal(true);
  }

  function save() {
    const payload: Omit<RoutingRule, 'id'> = {
      alertType: form.alertType,
      severity: form.severity,
      groupIds: form.groupIds,
      channelOverride: form.channelOverride,
      escalationGroupIds: form.escalationGroupIds,
      escalationAfterMinutes: parseInt(form.escalationAfterMinutes, 10) || 0,
    };
    if (editingId) {
      updateRule(editingId, payload);
    } else {
      addRule(payload);
    }
    setShowModal(false);
  }

  function toggleItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Routing Rules</Text>
        <Text style={styles.headerSub}>Alert type → group + channels</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {rules.map((rule) => (
          <View key={rule.id} style={styles.ruleCard}>
            <View style={styles.ruleTop}>
              <View style={styles.alertTypeBadge}>
                <Text style={styles.alertTypeText}>{rule.alertType}</Text>
              </View>
              <SeverityBadge severity={rule.severity} size="sm" />
            </View>

            <Text style={styles.ruleSubLabel}>Routes to:</Text>
            <View style={styles.groupRow}>
              {rule.groupIds.map((gid) => {
                const g = groupMap[gid];
                return g ? <GroupChip key={gid} group={g} /> : null;
              })}
              {rule.groupIds.length === 0 && <Text style={styles.dim}>No groups</Text>}
            </View>

            <Text style={styles.ruleSubLabel}>Channels:</Text>
            <View style={styles.channelRow}>
              {(rule.channelOverride ?? []).map((ch) => (
                <View key={ch} style={styles.channelTag}>
                  <Text style={styles.channelTagText}>{CHANNEL_META[ch].icon} {ch}</Text>
                </View>
              ))}
            </View>

            {(rule.escalationGroupIds ?? []).length > 0 && (
              <>
                <Text style={styles.ruleSubLabel}>
                  Escalates after {rule.escalationAfterMinutes}m →
                </Text>
                <View style={styles.groupRow}>
                  {(rule.escalationGroupIds ?? []).map((gid) => {
                    const g = groupMap[gid];
                    return g ? <GroupChip key={gid} group={g} /> : null;
                  })}
                </View>
              </>
            )}

            {isAdmin && (
              <View style={styles.ruleActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEdit(rule)}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteRule(rule.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {rules.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No routing rules defined</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Edit/Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Routing Rule' : 'New Routing Rule'}
            </Text>

            <Text style={styles.fieldLabel}>Alert Type</Text>
            <View style={styles.chipRow}>
              {ALL_ALERT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.optionChip, form.alertType === t && styles.optionChipActive]}
                  onPress={() => setForm((f) => ({ ...f, alertType: t }))}
                >
                  <Text style={[styles.optionChipText, form.alertType === t && styles.optionChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Severity</Text>
            <View style={styles.chipRow}>
              {ALL_SEVERITIES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.optionChip, form.severity === s && styles.optionChipActive]}
                  onPress={() => setForm((f) => ({ ...f, severity: s }))}
                >
                  <Text style={[styles.optionChipText, form.severity === s && styles.optionChipTextActive]}>
                    {SEVERITY_META[s].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Target Groups</Text>
            <View style={styles.chipRow}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.optionChip,
                    form.groupIds.includes(g.id) && styles.optionChipActive,
                    { borderColor: g.color },
                  ]}
                  onPress={() => setForm((f) => ({ ...f, groupIds: toggleItem(f.groupIds, g.id) }))}
                >
                  <Text style={[styles.optionChipText, form.groupIds.includes(g.id) && { color: '#fff' }]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Channels</Text>
            <View style={styles.chipRow}>
              {ALL_CHANNELS.map((ch) => (
                <TouchableOpacity
                  key={ch}
                  style={[styles.optionChip, form.channelOverride.includes(ch) && styles.optionChipActive]}
                  onPress={() => setForm((f) => ({ ...f, channelOverride: toggleItem(f.channelOverride, ch) }))}
                >
                  <Text style={[styles.optionChipText, form.channelOverride.includes(ch) && styles.optionChipTextActive]}>
                    {CHANNEL_META[ch].icon} {ch}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Escalation Groups (after N min)</Text>
            <View style={styles.chipRow}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.optionChip,
                    form.escalationGroupIds.includes(g.id) && styles.optionChipActive,
                    { borderColor: g.color },
                  ]}
                  onPress={() => setForm((f) => ({ ...f, escalationGroupIds: toggleItem(f.escalationGroupIds, g.id) }))}
                >
                  <Text style={[styles.optionChipText, form.escalationGroupIds.includes(g.id) && { color: '#fff' }]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Escalation Window (minutes, 0 = off)</Text>
            <TextInput
              style={styles.input}
              value={form.escalationAfterMinutes}
              onChangeText={(v) => setForm((f) => ({ ...f, escalationAfterMinutes: v }))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  ruleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ruleTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  alertTypeBadge: {
    backgroundColor: '#1C1C1C',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  alertTypeText: { color: '#B8860B', fontSize: 12, fontWeight: '700' },
  ruleSubLabel: { fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 4, marginTop: 6 },
  groupRow: { flexDirection: 'row', flexWrap: 'wrap' },
  channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  channelTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  channelTagText: { fontSize: 11, color: '#555' },
  ruleActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  editBtn: {
    borderWidth: 1,
    borderColor: '#B8860B',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  editBtnText: { color: '#B8860B', fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#FF3B3060',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  deleteBtnText: { color: '#FF3B30', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', fontSize: 15 },
  dim: { fontSize: 12, color: '#bbb' },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#B8860B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1C', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 6, marginTop: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  optionChipActive: { backgroundColor: '#1C1C1C', borderColor: '#1C1C1C' },
  optionChipText: { fontSize: 12, color: '#333', fontWeight: '600' },
  optionChipTextActive: { color: '#B8860B' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#666', fontWeight: '700' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#B8860B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
