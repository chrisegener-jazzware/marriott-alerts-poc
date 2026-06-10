import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import * as Notifications from 'expo-notifications';
import { Alert as RNAlert, Platform } from 'react-native';
import { Alert, Severity, UserRole } from '../types';
import { MOCK_ALERTS } from '../data/mockAlerts';

interface AlertContextValue {
  alerts: Alert[];
  role: UserRole;
  setRole: (r: UserRole) => void;
  addAlert: (data: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'createdBy'>) => void;
  acknowledgeAlert: (id: string) => void;
  unreadCount: number;
}

const AlertContext = createContext<AlertContextValue | null>(null);

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestPermissions() {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  return false;
}

async function scheduleLocalNotification(title: string, body: string, severity: Severity) {
  try {
    const granted = await requestPermissions();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 ${title}`,
        body,
        data: { severity },
        sound: true,
      },
      trigger: null, // fire immediately
    });
  } catch (e) {
    // Silently fail on web / simulator
    console.log('Notification skipped:', e);
  }
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [role, setRole] = useState<UserRole>('admin');

  const addAlert = useCallback(
    (data: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'createdBy'>) => {
      const newAlert: Alert = {
        ...data,
        id: Date.now().toString(),
        timestamp: new Date(),
        acknowledged: false,
        createdBy: role === 'admin' ? 'You (Admin)' : 'Staff',
      };
      setAlerts((prev) => [newAlert, ...prev]);
      scheduleLocalNotification(newAlert.title, newAlert.description, newAlert.severity);
    },
    [role]
  );

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  }, []);

  const unreadCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <AlertContext.Provider
      value={{ alerts, role, setRole, addAlert, acknowledgeAlert, unreadCount }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
}
