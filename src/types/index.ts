export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  action: string;
  timestamp: Date;
  acknowledged: boolean;
  createdBy: string;
}

export type UserRole = 'admin' | 'staff';
