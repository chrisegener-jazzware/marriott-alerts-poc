import {
  StaffMember,
  DistributionGroup,
  RoutingRule,
  JazzAlert,
  DeliveryRecord,
  Channel,
} from '../types';

// ── Staff ──────────────────────────────────────────────────────────────────────
export const SEED_STAFF: StaffMember[] = [
  { id: 's1', name: 'Maria Santos',   role: 'Head Housekeeper',    channels: ['push','sms','email'] },
  { id: 's2', name: 'Javier Cruz',    role: 'Housekeeping Lead',   channels: ['push','sms'] },
  { id: 's3', name: 'Lin Wei',        role: 'Room Attendant',      channels: ['push','sms'] },
  { id: 's4', name: 'Tom Okafor',     role: 'Chief Engineer',      channels: ['push','sms','voice','email'] },
  { id: 's5', name: 'Rachel Kim',     role: 'Engineer On-Call',    channels: ['push','sms','voice'] },
  { id: 's6', name: 'Derek Alvarez',  role: 'Maintenance Tech',    channels: ['push','sms'] },
  { id: 's7', name: 'Sophie Laurent', role: 'General Manager',     channels: ['push','sms','whatsapp','voice','email'] },
  { id: 's8', name: 'James Whitfield',role: 'Deputy GM',           channels: ['push','sms','email','voice'] },
  { id: 's9', name: 'Priya Patel',    role: 'Security Chief',      channels: ['push','sms','voice','whatsapp'] },
  { id: 's10',name: 'Carlos Rivera',  role: 'Security Officer',    channels: ['push','sms','voice'] },
  { id: 's11',name: 'Aiko Tanaka',    role: 'Front Desk Manager',  channels: ['push','sms','email'] },
  { id: 's12',name: 'Dylan Moore',    role: 'Front Desk Agent',    channels: ['push','sms'] },
];

// ── Distribution Groups ────────────────────────────────────────────────────────
export const SEED_GROUPS: DistributionGroup[] = [
  {
    id: 'g1',
    name: 'Housekeeping',
    description: 'All housekeeping staff and supervisors',
    memberIds: ['s1', 's2', 's3'],
    color: '#5AC8FA',
  },
  {
    id: 'g2',
    name: 'Engineering On-Call',
    description: 'Engineering team available for maintenance',
    memberIds: ['s4', 's5', 's6'],
    color: '#FF9500',
  },
  {
    id: 'g3',
    name: 'GM / Exec',
    description: 'General Manager and executive leadership',
    memberIds: ['s7', 's8'],
    color: '#B8860B',
  },
  {
    id: 'g4',
    name: 'Security',
    description: 'Security team – on-site and response',
    memberIds: ['s9', 's10'],
    color: '#FF3B30',
  },
  {
    id: 'g5',
    name: 'Front Desk',
    description: 'Front desk and guest services',
    memberIds: ['s11', 's12'],
    color: '#34C759',
  },
];

// ── Routing Rules ─────────────────────────────────────────────────────────────
export const SEED_RULES: RoutingRule[] = [
  {
    id: 'r1',
    alertType: 'Housekeeping',
    severity: 'P3',
    groupIds: ['g1'],
    channelOverride: ['push', 'sms'],
    escalationGroupIds: [],
    escalationAfterMinutes: 60,
  },
  {
    id: 'r2',
    alertType: 'Housekeeping',
    severity: 'P2',
    groupIds: ['g1'],
    channelOverride: ['push', 'sms', 'voice'],
    escalationGroupIds: ['g3'],
    escalationAfterMinutes: 15,
  },
  {
    id: 'r3',
    alertType: 'Maintenance',
    severity: 'P3',
    groupIds: ['g2'],
    channelOverride: ['push', 'sms'],
    escalationGroupIds: [],
    escalationAfterMinutes: 60,
  },
  {
    id: 'r4',
    alertType: 'Maintenance',
    severity: 'P2',
    groupIds: ['g2'],
    channelOverride: ['push', 'sms', 'voice'],
    escalationGroupIds: ['g3'],
    escalationAfterMinutes: 15,
  },
  {
    id: 'r5',
    alertType: 'Emergency',
    severity: 'P1',
    groupIds: ['g3', 'g4'],
    channelOverride: ['push', 'sms', 'whatsapp', 'voice', 'email'],
    escalationGroupIds: [],
    escalationAfterMinutes: 0,
  },
  {
    id: 'r6',
    alertType: 'Security',
    severity: 'P1',
    groupIds: ['g4', 'g3'],
    channelOverride: ['push', 'sms', 'voice', 'whatsapp'],
    escalationGroupIds: [],
    escalationAfterMinutes: 0,
  },
  {
    id: 'r7',
    alertType: 'Front Desk',
    severity: 'P3',
    groupIds: ['g5'],
    channelOverride: ['push', 'email'],
    escalationGroupIds: [],
    escalationAfterMinutes: 60,
  },
  {
    id: 'r8',
    alertType: 'General',
    severity: 'P4',
    groupIds: ['g5'],
    channelOverride: ['email'],
    escalationGroupIds: [],
    escalationAfterMinutes: 0,
  },
];

// ── Helper: build delivery records ────────────────────────────────────────────
function buildDeliveries(
  memberIds: string[],
  channels: Channel[],
  staffMap: Record<string, StaffMember>,
  statusOverride?: 'sent' | 'delivered',
): DeliveryRecord[] {
  const records: DeliveryRecord[] = [];
  const now = new Date();
  for (const mid of memberIds) {
    const staff = staffMap[mid];
    if (!staff) continue;
    for (const ch of channels) {
      if (!staff.channels.includes(ch)) continue;
      records.push({
        recipientId: mid,
        channel: ch,
        status: statusOverride ?? 'delivered',
        sentAt: new Date(now.getTime() - 60_000),
        deliveredAt: statusOverride === 'sent' ? undefined : new Date(now.getTime() - 30_000),
      });
    }
  }
  return records;
}

// ── Seed Alerts (two canonical demo scenarios) ────────────────────────────────
const staffMap: Record<string, StaffMember> = Object.fromEntries(
  SEED_STAFF.map((s) => [s.id, s])
);
const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

// Scenario 1: Housekeeping leak – routes to Housekeeping ONLY
const s1Channels: Channel[] = ['push', 'sms'];
const s1Members = ['s1', 's2', 's3'];
export const DEMO_ALERT_HOUSEKEEPING: JazzAlert = {
  id: 'demo-1',
  title: 'Water Leak — Room 412',
  alertType: 'Housekeeping',
  severity: 'P2',
  description:
    'Guest reports water coming from under the bathroom sink in Room 412. Wet floor visible. No structural damage observed yet.',
  action:
    'Send housekeeping team to Room 412 immediately. Shut off under-sink valve. Place wet floor signs. Assess need for maintenance follow-up.',
  timestamp: minutesAgo(7),
  createdBy: 'Front Desk',
  routedGroupIds: ['g1'],
  channels: s1Channels,
  escalationGroupIds: ['g3'],
  escalationAfterMinutes: 15,
  status: 'active',
  deliveries: buildDeliveries(s1Members, s1Channels, staffMap, 'delivered'),
  acks: [{ recipientId: 's1', ackedAt: minutesAgo(5) }],
};

// Scenario 2: Emergency 911 call – routes to GM + Security on ALL channels
const s2Channels: Channel[] = ['push', 'sms', 'whatsapp', 'voice', 'email'];
const s2Members = ['s7', 's8', 's9', 's10'];
export const DEMO_ALERT_EMERGENCY: JazzAlert = {
  id: 'demo-2',
  title: '911 Call — Lobby Altercation',
  alertType: 'Emergency',
  severity: 'P1',
  description:
    'Guest placed 911 call reporting a physical altercation in the main lobby near the concierge desk. Police ETA 4 minutes.',
  action:
    'Security to lobby immediately. GM to be present to coordinate. Clear bystanders. Do NOT intervene physically. Meet police at main entrance.',
  timestamp: minutesAgo(2),
  createdBy: 'Security Desk',
  routedGroupIds: ['g3', 'g4'],
  channels: s2Channels,
  escalationGroupIds: [],
  escalationAfterMinutes: 0,
  status: 'active',
  deliveries: buildDeliveries(s2Members, s2Channels, staffMap, 'sent'),
  acks: [],
};

export const SEED_ALERTS: JazzAlert[] = [
  DEMO_ALERT_EMERGENCY,
  DEMO_ALERT_HOUSEKEEPING,
  // Additional background alerts
  {
    id: 'a3',
    title: 'HVAC Unit 3 — Fault Code',
    alertType: 'Maintenance',
    severity: 'P3',
    description: 'HVAC unit 3 (floors 8–12) reporting fault code E-14. Temperature deviation detected.',
    action: 'Engineering to inspect unit 3 in mechanical room B. Check filter and thermostat calibration.',
    timestamp: minutesAgo(45),
    createdBy: 'BMS System',
    routedGroupIds: ['g2'],
    channels: ['push', 'sms'],
    escalationGroupIds: [],
    escalationAfterMinutes: 60,
    status: 'active',
    deliveries: buildDeliveries(['s4', 's5', 's6'], ['push', 'sms'], staffMap, 'delivered'),
    acks: [{ recipientId: 's4', ackedAt: minutesAgo(40) }],
  },
  {
    id: 'a4',
    title: 'VIP Check-In — Suite 1201',
    alertType: 'Front Desk',
    severity: 'P3',
    description: 'VIP guest arriving in 20 min. Suite 1201 reserved. Special amenities requested.',
    action: 'Confirm suite is ready. Place welcome amenities. GM greeting optional.',
    timestamp: minutesAgo(25),
    createdBy: 'Reservations',
    routedGroupIds: ['g5'],
    channels: ['push', 'email'],
    escalationGroupIds: [],
    escalationAfterMinutes: 60,
    status: 'active',
    deliveries: buildDeliveries(['s11', 's12'], ['push', 'email'], staffMap, 'delivered'),
    acks: [{ recipientId: 's11', ackedAt: minutesAgo(20) }],
  },
  {
    id: 'a5',
    title: 'Pool Filter Maintenance',
    alertType: 'Housekeeping',
    severity: 'P4',
    description: 'Scheduled pool filter maintenance window: 06:00–07:00. Pool closed to guests during this window.',
    action: 'Place closed signage. Inform concierge team. Maintenance to complete by 07:00.',
    timestamp: minutesAgo(120),
    createdBy: 'Facilities',
    routedGroupIds: ['g1'],
    channels: ['email'],
    escalationGroupIds: [],
    escalationAfterMinutes: 0,
    status: 'resolved',
    resolvedAt: minutesAgo(60),
    deliveries: buildDeliveries(['s1', 's2'], ['email'], staffMap, 'delivered'),
    acks: [
      { recipientId: 's1', ackedAt: minutesAgo(115) },
      { recipientId: 's2', ackedAt: minutesAgo(110) },
    ],
  },
];
