import { Channel, SeverityLevel } from '../types';

/** Default channel sets per severity (used when routing rule has no override) */
export const DEFAULT_CHANNELS: Record<SeverityLevel, Channel[]> = {
  P1: ['push', 'sms', 'whatsapp', 'voice', 'email'],
  P2: ['push', 'sms', 'voice'],
  P3: ['push', 'sms'],
  P4: ['email'],
};
