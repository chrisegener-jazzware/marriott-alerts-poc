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
import { DistributionGroup } from '../types';

const GROUP_COLORS = [
  '#5AC8FA', '#FF9500', '#B8860B', '#FF3B30',
  '#34C759', '#AF52DE', '#FF2D55', '#00C7BE',
];

interface GroupFormState {
  name: string;
  description: string;
  memberIds: string[];
  color: string;
}

const DEFAULT_FORM: GroupFormState = {
  name: '',
  description: '',
  memberIds: [],
  color: '#5AC8FA',
};

export default function DistributionGroupsScreen() {
  const { groups, staff, addGroup, updateGroup, deleteGroup, role } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GroupFormState>(DEFAULT_FORM);

  const staffMap = Object.fromEntries(staff.map((s) => [s.id, s]));
  const isAdmin = role === 'admin';

  function openAdd() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowModal(true);
  }

  function openEdit(group: DistributionGroup) {
    setEditingId(group.id);
    setForm({
      name: group.name,
      description: group.description,
      memberIds: [...group.memberIds],
      color: group.color,
    });
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim()) return;
    const payload: Omit<DistributionGroup, 'id'> = {
      name: form.name.trim(),
      description: form.description.trim(),
      memberIds: form.memberIds,
      color: form.color,
    };
    if (editingId) {
      updateGroup(editingId, payload);
    } else {
      addGroup(payload);
    }
    setShowModal(false);
  }

  function toggleMember(memberId: string) {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(memberId)
        ? f.memberIds.filter((id) => id !== memberId)
        : [...f.memberIds, memberId],
    }));
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Distribution Groups</Text>
        <Text style={styles.headerSub}>Manage recipient groups</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {groups.map((group) => (
          <View key={group.id} style={[styles.groupCard, { borderLeftColor: group.color }]}>
            <View style={styles.groupTop}>
              <View style={[styles.colorDot, { backgroundColor: group.color }]} />
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupDesc}>{group.description}</Text>
              </View>
              <Text style={styles.memberCount}>{group.memberIds.length} members</Text>
            </View>

            {/* Member list */}
            <View style={styles.memberList}>
              {group.memberIds.map((mid) => {
                const s = staffMap[mid];
                return s ? (
                  <View key={mid} style={styles.memberRow}>
                    <View style={[styles.memberAvatar, { backgroundColor: group.color + '30' }]}>
                      <Text style={[styles.memberAvatarText, { color: group.color }]}>
                        {s.name.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>{s.name}</Text>
                      <Text style={styles.memberRole}>{s.role}</Text>
                    </View>
                    <View style={styles.channelIcons}>
                      {s.channels.map((ch) => {
                        const icons: Record<string, string> = {
                          push: '🔔', sms: '💬', whatsapp: '📱', voice: '📞', email: '📧',
                        };
                        return (
                          <Text key={ch} style={styles.channelIcon}>{icons[ch] ?? ch}</Text>
                        );
                      })}
                    </View>
                  </View>
                ) : null;
              })}
            </View>

            {isAdmin && (
              <View style={styles.groupActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(group)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteGroup(group.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {groups.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No distribution groups</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Group' : 'New Group'}
              </Text>

              <Text style={styles.fieldLabel}>Group Name</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="e.g. Housekeeping"
                placeholderTextColor="#999"
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Short description"
                placeholderTextColor="#999"
              />

              <Text style={styles.fieldLabel}>Color</Text>
              <View style={styles.colorRow}>
                {GROUP_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, form.color === c && styles.colorSwatchActive]}
                    onPress={() => setForm((f) => ({ ...f, color: c }))}
                  />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Members</Text>
              {staff.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.memberOption, form.memberIds.includes(s.id) && styles.memberOptionActive]}
                  onPress={() => toggleMember(s.id)}
                >
                  <Text style={styles.memberOptionName}>{s.name}</Text>
                  <Text style={styles.memberOptionRole}>{s.role}</Text>
                  {form.memberIds.includes(s.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={save}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
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
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  groupTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '800', color: '#1C1C1C' },
  groupDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  memberCount: { fontSize: 13, fontWeight: '700', color: '#B8860B' },
  memberList: { gap: 8 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarText: { fontWeight: '700', fontSize: 14 },
  memberName: { fontSize: 13, fontWeight: '600', color: '#1C1C1C' },
  memberRole: { fontSize: 11, color: '#888' },
  channelIcons: { marginLeft: 'auto', flexDirection: 'row', gap: 4 },
  channelIcon: { fontSize: 13 },
  groupActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: { borderColor: '#1C1C1C', transform: [{ scale: 1.2 }] },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 6,
  },
  memberOptionActive: { backgroundColor: '#B8860B15', borderColor: '#B8860B' },
  memberOptionName: { fontWeight: '600', color: '#1C1C1C', fontSize: 14 },
  memberOptionRole: { color: '#888', fontSize: 12, marginLeft: 8, flex: 1 },
  checkmark: { color: '#B8860B', fontWeight: '800', fontSize: 16, marginLeft: 8 },
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
