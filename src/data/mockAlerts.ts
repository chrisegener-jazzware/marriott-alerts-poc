import { Alert } from '../types';

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

export const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    title: 'Fire Alarm — Floor 12',
    severity: 'critical',
    description:
      'Fire alarm activated on floor 12, east wing. Smoke detected near room 1218. Local fire department has been notified.',
    action:
      'Evacuate guests from floors 11–13 immediately. Direct to lobby assembly point. Do NOT use elevators. Account for all guests on evacuation roster.',
    timestamp: minutesAgo(2),
    acknowledged: false,
    createdBy: 'Security Desk',
  },
  {
    id: '2',
    title: 'Medical Emergency — Lobby Bar',
    severity: 'high',
    description:
      'Guest reported chest pain and difficulty breathing at the lobby bar. AED retrieved and on-site.',
    action:
      'EMS en route (ETA 5 min). Clear a 10-ft radius around the guest. First Aid–certified staff (J. Torres) already on scene. Do not move the guest.',
    timestamp: minutesAgo(8),
    acknowledged: false,
    createdBy: 'Front Desk Manager',
  },
  {
    id: '3',
    title: 'VIP Guest Arrival',
    severity: 'medium',
    description:
      'CEO of Acme Corp arriving in approximately 30 minutes via private car. Booking confirmation #ACM-9921.',
    action:
      "Prepare presidential suite 1201. Champagne & fruit basket on table. GM to greet at main entrance. Valet to prioritize vehicle. Do not announce guest's name over radio.",
    timestamp: minutesAgo(15),
    acknowledged: false,
    createdBy: 'Concierge',
  },
  {
    id: '4',
    title: 'Elevator 3 Out of Service',
    severity: 'high',
    description:
      'Elevator #3 (south tower) has been taken offline due to a mechanical fault. Engineer dispatched.',
    action:
      'Place out-of-service signage on floors 1, 6, 12, 18. Redirect guests to elevators 1 & 2. Notify housekeeping to use service elevator only. ETA for repair: 2–3 hours.',
    timestamp: minutesAgo(34),
    acknowledged: true,
    createdBy: 'Engineering',
  },
  {
    id: '5',
    title: 'Pool Area Maintenance',
    severity: 'low',
    description:
      'Scheduled maintenance on pool filtration system. Water chemistry check in progress.',
    action:
      'Close pool area from 2–4 PM. Place "Closed for Maintenance" signage at all entrances. Redirect guests to spa facilities. Complimentary spa access offered as compensation.',
    timestamp: hoursAgo(1),
    acknowledged: true,
    createdBy: 'Facilities',
  },
  {
    id: '6',
    title: 'Room Service Delay Alert',
    severity: 'low',
    description:
      'Kitchen staffing shortage causing room service delays of 30–45 min above normal.',
    action:
      'Inform guests proactively when they call. Offer complimentary beverage as apology. Update hold-music announcement. Target resolution by 7 PM.',
    timestamp: hoursAgo(2),
    acknowledged: false,
    createdBy: 'F&B Manager',
  },
];
