export type CodeType = 'qr' | 'nfc' | 'barcode';

export type CodeStatus = 'active' | 'disabled' | 'expired';

export type QrSubType =
  | 'url'
  | 'dynamic'
  | 'text'
  | 'whatsapp'
  | 'email'
  | 'phone'
  | 'wifi'
  | 'vcard';

export type BarcodeFormat =
  | 'CODE128'
  | 'CODE39'
  | 'EAN13'
  | 'EAN8'
  | 'UPC'
  | 'ITF';

export interface ScheduledLink {
  id: string;
  name: string;
  destinationUrl: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  priority: number;
}

export interface QrCustomization {
  colorDark: string;
  colorLight: string;
  dotStyle: 'square' | 'dots' | 'rounded';
  eyeFrame: 'square' | 'circle' | 'rounded';
  logoType?: 'none' | 'link' | 'wifi' | 'card' | 'whatsapp' | 'tag';
  centerLabel?: string;
}

export interface CodeItem {
  id: string;
  userId: string;
  projectId?: string;
  uniqueId: string; // e.g. "839271" or "NFC-839271" or "BAR-109283"
  name: string;
  codeType: CodeType;
  subType?: QrSubType;
  destinationUrl: string;
  rawContent?: string; // For static Wi-Fi, vCard, or custom text
  barcodeFormat?: BarcodeFormat;
  barcodeNumber?: string; // Physical numeric barcode for matching
  isDynamic: boolean;
  status: CodeStatus;
  scanCount: number;
  expiresAt?: string; // ISO string
  customization?: QrCustomization;
  schedules?: ScheduledLink[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface NfcWriteRecord {
  id: string;
  codeId: string;
  codeName: string;
  uniqueId: string;
  userId: string;
  deviceInfo: string;
  writeStatus: 'success' | 'failed';
  verificationStatus: 'verified' | 'unverified' | 'mismatch';
  writtenPayload: string;
  verifiedPayload?: string;
  notes?: string;
  writtenAt: string;
}

export interface ScanEvent {
  id: string;
  codeId: string;
  uniqueId: string;
  codeType: CodeType;
  codeName: string;
  eventTime: string;
  userAgent?: string;
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  browser: string;
  os: string;
  country: string;
  city: string;
  ipHash: string;
  referrer: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  createdAt: string;
}
