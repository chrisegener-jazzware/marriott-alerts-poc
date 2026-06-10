import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert as RNAlert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAlerts } from '../context/AlertContext';
import { Severity } from '../types';

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string; bg: string }[] = [
  { value: 'critical', label: '🔴  Critical', color: '#C62828', bg: '#FDECEA' },
  { value: 'high', label: '🟠  High', color: '#E65100', bg: '#FFF3E0' },
  { value: 'medium', label: '🟡  Medium', color: '#F57F17', bg: '#FFFDE7' },
  { value: 'low', label: '🔵  Low', color: '#1565C0', bg: '#E3F2FD' },
];

export default function CreateAlertScreen() {
  const navigation = useNavigation<any>();
  const { addAlert, role } = useAlerts();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [action, setAction] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [submitting, setSubmitting] = useState(false);

  if (role !== 'admin') {
    return (
      <View style={styles.restricted}>
        <Text style={styles.restrictedIcon}>🔒</Text>
        <Text style={styles.restrictedTitle}>Admin Access Required</Text>
        <Text style={styles.restrictedSub}>
          Switch to Admin role in Settings to create alerts.
        </Text>
      </View>
    );
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      RNAlert.alert('Missing Title', 'Please enter an alert title.');
      return;
    }
    if (!description.trim()) {
      RNAlert.alert('Missing Description', 'Please enter a description.');
      return;
    }
    if (!action.trim()) {
      RNAlert.alert('Missing Action', 'Please describe the required action for staff.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      addAlert({ title: title.trim(), description: description.trim(), action: action.trim(), severity });
      setSubmitting(false);
      setTitle('');
      setDescription('');
      setAction('');
      setSeverity('medium');
      RNAlert.alert(
        '✅ Alert Created',
        'Alert posted to all staff. Push notification sent.',
        [{ text: 'View Feed', onPress: () => navigation.navigate('Alerts') }]
      );
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Alert</Text>
          <Text style={styles.headerSub}>Broadcast to all hotel staff</Text>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          {/* Severity Picker */}
          <Text style={styles.label}>Severity Level</Text>
          <View style={styles.severityRow}>
            {SEVERITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.severityBtn,
                  { borderColor: opt.color, backgroundColor: severity === opt.value ? opt.bg : '#FFF' },
                ]}
                onPress={() => setSeverity(opt.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.severityBtnText,
                    { color: severity === opt.value ? opt.color : '#999' },
                    severity === opt.value && { fontWeight: '700' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <Text style={styles.label}>Alert Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Fire Alarm — Floor 12"
            placeholderTextColor="#BBB"
            maxLength={80}
          />
          <Text style={styles.charCount}>{title.length}/80</Text>

          {/* Description */}
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="What is happening? Include location and context."
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.charCount}>{description.length}/300</Text>

          {/* Action Required */}
          <Text style={styles.label}>Action Required *</Text>
          <TextInput
            style={[styles.input, styles.multiline, styles.actionInput]}
            value={action}
            onChangeText={setAction}
            placeholder="What do staff need to do? Be specific."
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={400}
          />
          <Text style={styles.charCount}>{action.length}/400</Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? '⏳  Sending...' : '📢  Broadcast Alert'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            🔔 This will send a push notification to all staff devices and appear on the alert feed.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F6' },
  restricted: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F6',
    padding: 40,
  },
  restrictedIcon: { fontSize: 56, marginBottom: 16 },
  restrictedTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  restrictedSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
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
  form: { padding: 20 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  severityBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  severityBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  multiline: {
    minHeight: 80,
  },
  actionInput: {
    minHeight: 100,
    borderColor: '#FFECB3',
    backgroundColor: '#FFFEF5',
  },
  charCount: {
    fontSize: 11,
    color: '#BBB',
    textAlign: 'right',
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: '#B8860B',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
