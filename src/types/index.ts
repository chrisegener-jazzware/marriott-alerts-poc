// ── Severity ─────────────────────────────────────────────────────────────────
export type SeverityLevel = 'P1' | 'P2' | 'P3' | 'P4';

export const SEVERITY_META: Record<
  SeverityLevel,
  { label: string; color: string; bgColor: string; icon: string; ackWindowMinutes: number }
> = {
  P1: { label: 'P1 Critical', color: '#FF3B30', bgColor: '#FF3B3020', icon: '🔴', ackWindowMinutes: 5 },
  P2: { label: 'P2 High',     color: '#FF9500', bgColor: '#FF950020', icon: '🟠', ackWindowMinutes: 15 },
  P3: { label: 'P3 Normal',   color: '#FFCC00', bgColor: '#FFCC0020', icon: '🟡', ackWindowMinutes: 60 },
  P4: { label: 'P4 Info',     color: '#34C759', bgColor: '#34C75920', icon: '🟢', ackWindowMinutes: 0 },
};

// ── Channels ──────────────────────────────────────────────────────────────────
export type Channel = 'sms' | 'whatsapp' | 'voice' | 'email' | 'push';

export const CHANNEL_META: Record<Channel, { label: string; icon: string }> = {
  sms:      { label: 'SMS',      icon: '💬' },
  whatsapp: { label: 'WhatsApp', icon: '📱' },
  voice:    { label: 'Voice',    icon: '📞' },
  email:    { label: 'Email',    icon: '📧' },
  push:     { label: 'Push',     icon: '🔔' },
};

// ── Delivery status ───────────────────────────────────────────────────────────
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface DeliveryRecord {
  recipientId: string;
  channel: Channel;
  status: DeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
}

// ── Acknowledgement ───────────────────────────────────────────────────────────
export interface AckRecord {
  recipientId: string;
  ackedAt: Date;
}

// ── Staff member ──────────────────────────────────────────────────────────────
export interface StaffMember {
  id: string;
  name: string;
  role: string;
  channels: Channel[];
  avatar?: string;
}

// ── Distribution group ────────────────────────────────────────────────────────
export interface DistributionGroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  color: string;
}

// ── Routing rule ──────────────────────────────────────────────────────────────
export interface RoutingRule {
  id: string;
  alertType: string;          // e.g. "Housekeeping", "Emergency", "Maintenance"
  severity: SeverityLevel;
  groupIds: string[];         // target distribution groups
  channelOverride?: Channel[]; // if absent, use channels from severity default
  escalationGroupIds?: string[]; // groups added on escalation
  escalationAfterMinutes?: number;
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export type AlertStatus = 'active' | 'escalated' | 'resolved';

export interface JazzAlert {
  id: string;
  title: string;
  alertType: string;
  severity: SeverityLevel;
  description: string;
  action: string;
  timestamp: Date;
  createdBy: string;

  // Routing snapshot (set at creation from matching rule)
  routedGroupIds: string[];
  channels: Channel[];
  escalationGroupIds: string[];
  escalationAfterMinutes: number;

  // Live state
  status: AlertStatus;
  escalatedAt?: Date;
  resolvedAt?: Date;

  // Delivery tracking (one per recipient × channel)
  deliveries: DeliveryRecord[];

  // Acknowledgements
  acks: AckRecord[];
}

// ── User role ─────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'staff';

// ── Navigation param types ────────────────────────────────────────────────────
export type RootStackParamList = {
  MainTabs: undefined;
  AlertDetail: { alertId: string };
};

export type MainTabParamList = {
  Feed: undefined;
  RoutingRules: undefined;
  Groups: undefined;
  Demo: undefined;
};
