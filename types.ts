
export enum DeliveryStatus {
  PENDING = 'Pending',
  SENT = 'Sent',
  DELIVERED = 'Delivered',
  FAILED = 'Failed',
  READ = 'Read'
}

export interface Contact {
  id: string;
  phone: string;
  name?: string;
}

export interface SMSLog {
  id: string;
  recipient: string;
  message: string;
  status: DeliveryStatus;
  timestamp: string;
  error?: string;
}

export interface CampaignStats {
  total: number;
  sent: number;
  failed: number;
  remaining: number;
}

export type AppTab = 'home' | 'history' | 'settings';
