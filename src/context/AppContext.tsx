import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  JazzAlert,
  DistributionGroup,
  RoutingRule,
  StaffMember,
  UserRole,
  Channel,
  DeliveryRecord,
  AckRecord,
  SeverityLevel,
} from '../types';
import {
  SEED_STAFF,
  SEED_GROUPS,
  SEED_RULES,
  SEED_ALERTS,
  DEMO_ALERT_HOUSEKEEPING,
  DEMO_ALERT_EMERGENCY,
} from '../data/seedData';
import { DEFAULT_CHANNELS } from '../utils/channels';

// ── Context value ─────────────────────────────────────────────────────────────
interface AppContextValue {
  // Auth / role
  role: UserRole;
  setRole: (r: UserRole) => void;

  // Staff
  staff: StaffMember[];

  // Groups
  groups: DistributionGroup[];
  addGroup: (g: Omit<DistributionGroup, 'id'>) => void;
  updateGroup: (id: string, patch: Partial<Omit<DistributionGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;

  // Rules
  rules: RoutingRule[];
  addRule: (r: Omit<RoutingRule, 'id'>) => void;
  updateRule: (id: string, patch: Partial<Omit<RoutingRule, 'id'>>) => void;
  deleteRule: (id: string) => void;

  // Alerts
  alerts: JazzAlert[];
  createAlert: (data: CreateAlertInput) => JazzAlert;
  acknowledgeAlert: (alertId: string, recipientId: string) => void;
  resolveAlert: (alertId: string) => void;
  unreadCount: number;

  // Demo controls
  resetToSeedData: () => void;
  triggerHousekeepingDemo: () => void;
  triggerEmergencyDemo: () => void;
}

export interface CreateAlertInput {
  title: string;
  alertType: string;
  severity: SeverityLevel;
  description: string;
  action: string;
}

const AppContext = createContext<AppContextValue | null>(null);

let _idCounter = 1000;
function genId(prefix: string): string {
  return `${prefix}-${++_idCounter}-${Date.now()}`;
}

function buildDeliveries(
  memberIds: string[],
  channels: Channel[],
  staffMap: Record<string, StaffMember>
): DeliveryRecord[] {
  const records: DeliveryRecord[] = [];
  for (const mid of memberIds) {
    const s = staffMap[mid];
    if (!s) continue;
    for (const ch of channels) {
      if (!s.channels.includes(ch)) continue;
      records.push({
        recipientId: mid,
        channel: ch,
        status: 'sent',
        sentAt: new Date(),
      });
    }
  }
  return records;
}

// Resolve all member IDs from group IDs
function resolveMemberIds(
  groupIds: string[],
  groupMap: Record<string, DistributionGroup>
): string[] {
  const ids = new Set<string>();
  for (const gid of groupIds) {
    const g = groupMap[gid];
    if (g) g.memberIds.forEach((m) => ids.add(m));
  }
  return Array.from(ids);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('admin');
  const [staff] = useState<StaffMember[]>(SEED_STAFF);
  const [groups, setGroups] = useState<DistributionGroup[]>(SEED_GROUPS);
  const [rules, setRules] = useState<RoutingRule[]>(SEED_RULES);
  const [alerts, setAlerts] = useState<JazzAlert[]>(SEED_ALERTS);

  // Escalation timer refs: alertId → timeout handle
  const escalationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Staff map ────────────────────────────────────────────────────────────────
  const staffMap: Record<string, StaffMember> = Object.fromEntries(
    staff.map((s) => [s.id, s])
  );

  // ── Group helpers ────────────────────────────────────────────────────────────
  const groupMap = (): Record<string, DistributionGroup> =>
    Object.fromEntries(groups.map((g) => [g.id, g]));

  const addGroup = useCallback((g: Omit<DistributionGroup, 'id'>) => {
    setGroups((prev) => [...prev, { ...g, id: genId('g') }]);
  }, []);

  const updateGroup = useCallback(
    (id: string, patch: Partial<Omit<DistributionGroup, 'id'>>) => {
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    },
    []
  );

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }, []);

  // ── Rule helpers ─────────────────────────────────────────────────────────────
  const addRule = useCallback((r: Omit<RoutingRule, 'id'>) => {
    setRules((prev) => [...prev, { ...r, id: genId('r') }]);
  }, []);

  const updateRule = useCallback(
    (id: string, patch: Partial<Omit<RoutingRule, 'id'>>) => {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    []
  );

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ── Escalation logic ─────────────────────────────────────────────────────────
  const scheduleEscalation = useCallback(
    (alert: JazzAlert, currentGroups: DistributionGroup[]) => {
      if (!alert.escalationAfterMinutes || alert.escalationAfterMinutes <= 0) return;
      if (!alert.escalationGroupIds.length) return;

      const delayMs = alert.escalationAfterMinutes * 60 * 1000;

      // Clear any existing timer
      if (escalationTimers.current[alert.id]) {
        clearTimeout(escalationTimers.current[alert.id]);
      }

      escalationTimers.current[alert.id] = setTimeout(() => {
        setAlerts((prev) => {
          const a = prev.find((x) => x.id === alert.id);
          if (!a || a.status !== 'active') return prev;

          // Check if already acked by all primary group members
          const primaryIds = resolveMemberIds(a.routedGroupIds, Object.fromEntries(
            currentGroups.map((g) => [g.id, g])
          ));
          const ackedIds = new Set(a.acks.map((ac) => ac.recipientId));
          const allAcked = primaryIds.every((id) => ackedIds.has(id));
          if (allAcked) return prev; // already acked – no escalation

          // Build deliveries for escalation groups
          const escGM = Object.fromEntries(currentGroups.map((g) => [g.id, g]));
          const escMemberIds = resolveMemberIds(a.escalationGroupIds, escGM);
          const escChannels = a.channels;
          const newDeliveries = buildDeliveries(escMemberIds, escChannels, staffMap);

          return prev.map((x) =>
            x.id === alert.id
              ? {
                  ...x,
                  status: 'escalated',
                  escalatedAt: new Date(),
                  routedGroupIds: [...x.routedGroupIds, ...x.escalationGroupIds],
                  deliveries: [...x.deliveries, ...newDeliveries],
                }
              : x
          );
        });
      }, delayMs);
    },
    [staffMap]
  );

  // ── Create alert ─────────────────────────────────────────────────────────────
  const createAlert = useCallback(
    (data: CreateAlertInput): JazzAlert => {
      const gm = groupMap();
      // Find matching routing rule
      const rule = rules.find(
        (r) => r.alertType === data.alertType && r.severity === data.severity
      );
      const channels: Channel[] =
        rule?.channelOverride ?? DEFAULT_CHANNELS[data.severity];
      const routedGroupIds = rule?.groupIds ?? [];
      const escalationGroupIds = rule?.escalationGroupIds ?? [];
      const escalationAfterMinutes = rule?.escalationAfterMinutes ?? 0;

      const memberIds = resolveMemberIds(routedGroupIds, gm);
      const deliveries = buildDeliveries(memberIds, channels, staffMap);

      const newAlert: JazzAlert = {
        id: genId('alert'),
        ...data,
        timestamp: new Date(),
        createdBy: role === 'admin' ? 'Admin' : 'Staff',
        routedGroupIds,
        channels,
        escalationGroupIds,
        escalationAfterMinutes,
        status: 'active',
        deliveries,
        acks: [],
      };

      setAlerts((prev) => [newAlert, ...prev]);
      scheduleEscalation(newAlert, groups);
      return newAlert;
    },
    [rules, groups, role, staffMap, scheduleEscalation]
  );

  // ── Acknowledge ───────────────────────────────────────────────────────────────
  const acknowledgeAlert = useCallback((alertId: string, recipientId: string) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== alertId) return a;
        if (a.acks.some((ac) => ac.recipientId === recipientId)) return a;
        const ack: AckRecord = { recipientId, ackedAt: new Date() };
        return { ...a, acks: [...a.acks, ack] };
      })
    );
  }, []);

  // ── Resolve ───────────────────────────────────────────────────────────────────
  const resolveAlert = useCallback((alertId: string) => {
    if (escalationTimers.current[alertId]) {
      clearTimeout(escalationTimers.current[alertId]);
      delete escalationTimers.current[alertId];
    }
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: 'resolved', resolvedAt: new Date() } : a
      )
    );
  }, []);

  // ── Demo helpers ──────────────────────────────────────────────────────────────
  const resetToSeedData = useCallback(() => {
    // Clear all escalation timers
    Object.values(escalationTimers.current).forEach(clearTimeout);
    escalationTimers.current = {};
    setGroups(SEED_GROUPS);
    setRules(SEED_RULES);
    setAlerts(SEED_ALERTS);
  }, []);

  const triggerHousekeepingDemo = useCallback(() => {
    const alert: JazzAlert = {
      ...DEMO_ALERT_HOUSEKEEPING,
      id: genId('demo-hk'),
      timestamp: new Date(),
      acks: [],
      status: 'active',
      deliveries: DEMO_ALERT_HOUSEKEEPING.deliveries.map((d) => ({
        ...d,
        sentAt: new Date(),
        deliveredAt: new Date(),
      })),
    };
    setAlerts((prev) => [alert, ...prev]);
    scheduleEscalation(alert, groups);
  }, [groups, scheduleEscalation]);

  const triggerEmergencyDemo = useCallback(() => {
    const alert: JazzAlert = {
      ...DEMO_ALERT_EMERGENCY,
      id: genId('demo-em'),
      timestamp: new Date(),
      acks: [],
      status: 'active',
      deliveries: DEMO_ALERT_EMERGENCY.deliveries.map((d) => ({
        ...d,
        sentAt: new Date(),
      })),
    };
    setAlerts((prev) => [alert, ...prev]);
  }, [groups]);

  // ── Unread count ─────────────────────────────────────────────────────────────
  const unreadCount = alerts.filter((a) => a.status !== 'resolved' && a.acks.length === 0).length;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(escalationTimers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        staff,
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        rules,
        addRule,
        updateRule,
        deleteRule,
        alerts,
        createAlert,
        acknowledgeAlert,
        resolveAlert,
        unreadCount,
        resetToSeedData,
        triggerHousekeepingDemo,
        triggerEmergencyDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
