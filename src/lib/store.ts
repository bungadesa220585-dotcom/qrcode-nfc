import {
  CodeItem,
  ProjectItem,
  NfcWriteRecord,
  ScanEvent,
  UserProfile,
  CodeStatus,
  CodeType,
  BarcodeFormat
} from '../types.ts';
import { db, auth } from './firebase.ts';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY_CODES = 'linktag_codes_v1';
const LOCAL_STORAGE_KEY_PROJECTS = 'linktag_projects_v1';
const LOCAL_STORAGE_KEY_NFC_WRITES = 'linktag_nfc_writes_v1';
const LOCAL_STORAGE_KEY_SCANS = 'linktag_scans_v1';
const LOCAL_STORAGE_KEY_USER = 'linktag_user_v1';

// Seed Initial Projects
const SEED_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-cafe',
    userId: 'default_user',
    name: 'Cafe Menu & Table NFCs',
    description: 'Smart table tags and contactless dining menu redirects',
    color: '#f59e0b',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'proj-retail',
    userId: 'default_user',
    name: 'Retail Store & Shelf Tags',
    description: 'Product barcode mapping, promotional displays, and customer loyalty QR',
    color: '#3b82f6',
    createdAt: '2026-09-05T09:30:00Z',
    updatedAt: '2026-09-05T09:30:00Z'
  },
  {
    id: 'proj-expo',
    userId: 'default_user',
    name: 'Tech Expo 2026 Badges',
    description: 'Interactive attendee badges, booth check-ins, and digital business cards',
    color: '#10b981',
    createdAt: '2026-09-12T10:15:00Z',
    updatedAt: '2026-09-12T10:15:00Z'
  }
];

// Seed Initial Codes
const SEED_CODES: CodeItem[] = [
  {
    id: 'code-1',
    userId: 'default_user',
    projectId: 'proj-cafe',
    uniqueId: 'SUMMER26',
    name: 'Summer Refresh Drinks Menu',
    codeType: 'qr',
    subType: 'dynamic',
    destinationUrl: 'https://example.com/menu/summer-refresh',
    isDynamic: true,
    status: 'active',
    scanCount: 184,
    customization: {
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      dotStyle: 'rounded',
      eyeFrame: 'rounded',
      logoType: 'link'
    },
    schedules: [
      {
        id: 'sch-1',
        name: 'Happy Hour Special (17:00 - 20:00)',
        destinationUrl: 'https://example.com/menu/happy-hour-deals',
        startDate: '2026-09-01T17:00:00Z',
        endDate: '2026-10-31T20:00:00Z',
        priority: 10
      }
    ],
    notes: 'Printed on counter standees and tabletop vinyl stickers',
    createdAt: '2026-09-02T11:00:00Z',
    updatedAt: '2026-09-20T14:22:00Z'
  },
  {
    id: 'code-2',
    userId: 'default_user',
    projectId: 'proj-cafe',
    uniqueId: 'NFC-839271',
    name: 'Table 04 Contactless Order Tag',
    codeType: 'nfc',
    destinationUrl: 'https://example.com/order?table=4&session=live',
    isDynamic: true,
    status: 'active',
    scanCount: 312,
    notes: 'NTAG215 adhesive coin tag affixed underneath wooden table #4',
    createdAt: '2026-09-03T14:30:00Z',
    updatedAt: '2026-09-25T16:40:00Z'
  },
  {
    id: 'code-3',
    userId: 'default_user',
    projectId: 'proj-retail',
    uniqueId: 'BAR-109283',
    name: 'Single Origin Arabica Beans 250g',
    codeType: 'barcode',
    barcodeFormat: 'CODE128',
    barcodeNumber: '8992753123456',
    destinationUrl: 'https://example.com/products/arabica-single-origin',
    isDynamic: true,
    status: 'active',
    scanCount: 96,
    notes: 'Dynamic barcode printed on eco kraft coffee pouch. Resolves directly via /b/BAR-109283 or scanned in app.',
    createdAt: '2026-09-08T09:00:00Z',
    updatedAt: '2026-09-18T10:11:00Z'
  },
  {
    id: 'code-4',
    userId: 'default_user',
    projectId: 'proj-expo',
    uniqueId: 'NFC-VIP09',
    name: 'Keynote Speaker VIP Access Badge',
    codeType: 'nfc',
    destinationUrl: 'https://example.com/events/vip-networking-schedule',
    isDynamic: true,
    status: 'active',
    scanCount: 52,
    notes: 'Embedded in VIP silicone wristband and lanyard laminate',
    createdAt: '2026-09-15T08:20:00Z',
    updatedAt: '2026-09-22T11:45:00Z'
  },
  {
    id: 'code-5',
    userId: 'default_user',
    projectId: 'proj-retail',
    uniqueId: 'FEEDBACK',
    name: 'Customer Satisfaction Survey',
    codeType: 'qr',
    subType: 'dynamic',
    destinationUrl: 'https://example.com/feedback/q3-customer-pulse',
    isDynamic: true,
    status: 'active',
    scanCount: 147,
    customization: {
      colorDark: '#1e3a8a',
      colorLight: '#f8fafc',
      dotStyle: 'dots',
      eyeFrame: 'circle',
      logoType: 'link'
    },
    createdAt: '2026-09-10T12:00:00Z',
    updatedAt: '2026-09-19T13:20:00Z'
  },
  {
    id: 'code-6',
    userId: 'default_user',
    projectId: 'proj-retail',
    uniqueId: 'BAR-ASSET99',
    name: 'Standard Inventory Label (EAN-13)',
    codeType: 'barcode',
    barcodeFormat: 'EAN13',
    barcodeNumber: '5901234123457',
    destinationUrl: 'https://example.com/inventory/item/5901234123457',
    isDynamic: false,
    status: 'active',
    scanCount: 28,
    notes: 'Physical numeric barcode. Used with barcode scanner or LinkTag Scanner to look up inventory URL.',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z'
  },
  {
    id: 'code-7',
    userId: 'default_user',
    projectId: 'proj-cafe',
    uniqueId: 'SPRING26',
    name: 'Past Seasonal Spring Menu (Archived)',
    codeType: 'qr',
    subType: 'dynamic',
    destinationUrl: 'https://example.com/menu/spring-past',
    isDynamic: true,
    status: 'expired',
    expiresAt: '2026-06-01T00:00:00Z',
    scanCount: 420,
    notes: 'Promo expired. Redirect engine shows expired status notice instead of redirecting.',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  }
];

// Seed NFC Writes
const SEED_NFC_WRITES: NfcWriteRecord[] = [
  {
    id: 'write-1',
    codeId: 'code-2',
    codeName: 'Table 04 Contactless Order Tag',
    uniqueId: 'NFC-839271',
    userId: 'default_user',
    deviceInfo: 'Pixel 8 Pro (Android 14) / LinkTag Companion',
    writeStatus: 'success',
    verificationStatus: 'verified',
    writtenPayload: 'https://ais-dev-bymhnvfrt4c6657jkzmr4g-1070124309509.asia-southeast1.run.app/n/839271',
    verifiedPayload: 'https://ais-dev-bymhnvfrt4c6657jkzmr4g-1070124309509.asia-southeast1.run.app/n/839271',
    writtenAt: '2026-09-03T14:32:10Z'
  },
  {
    id: 'write-2',
    codeId: 'code-4',
    codeName: 'Keynote Speaker VIP Access Badge',
    uniqueId: 'NFC-VIP09',
    userId: 'default_user',
    deviceInfo: 'Samsung Galaxy S24 (Android 14) / LinkTag Companion',
    writeStatus: 'success',
    verificationStatus: 'verified',
    writtenPayload: 'https://ais-dev-bymhnvfrt4c6657jkzmr4g-1070124309509.asia-southeast1.run.app/n/NFC-VIP09',
    verifiedPayload: 'https://ais-dev-bymhnvfrt4c6657jkzmr4g-1070124309509.asia-southeast1.run.app/n/NFC-VIP09',
    writtenAt: '2026-09-15T08:24:45Z'
  }
];

// Generate Seed Scans
function generateSeedScans(): ScanEvent[] {
  const scans: ScanEvent[] = [];
  const devices: Array<'Mobile' | 'Desktop' | 'Tablet'> = ['Mobile', 'Mobile', 'Mobile', 'Desktop', 'Tablet'];
  const browsers = ['Chrome Mobile', 'Mobile Safari', 'Chrome Desktop', 'Samsung Internet', 'Firefox Mobile'];
  const oss = ['Android', 'iOS', 'Android', 'macOS', 'Windows'];
  const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Singapore', 'Kuala Lumpur', 'Tokyo'];

  const now = new Date();
  
  SEED_CODES.forEach((code) => {
    // Generate 10-25 realistic scans for each active code over the past 7 days
    const count = code.status === 'expired' ? 5 : Math.min(25, Math.max(8, Math.floor(code.scanCount / 10)));
    for (let i = 0; i < count; i++) {
      const hoursAgo = Math.floor(Math.random() * 168); // within 7 days
      const date = new Date(now.getTime() - hoursAgo * 3600 * 1000);
      const devIdx = Math.floor(Math.random() * devices.length);
      const city = cities[Math.floor(Math.random() * cities.length)];

      scans.push({
        id: `scan-${code.uniqueId}-${i}-${date.getTime()}`,
        codeId: code.id,
        uniqueId: code.uniqueId,
        codeType: code.codeType,
        codeName: code.name,
        eventTime: date.toISOString(),
        deviceType: devices[devIdx],
        browser: browsers[devIdx],
        os: oss[devIdx],
        country: city === 'Singapore' ? 'Singapore' : city === 'Tokyo' ? 'Japan' : city === 'Kuala Lumpur' ? 'Malaysia' : 'Indonesia',
        city: city,
        ipHash: 'ip_' + Math.random().toString(36).substring(2, 8),
        referrer: devIdx % 2 === 0 ? 'Direct Scan (Camera)' : 'LinkTag Redirect'
      });
    }
  });

  return scans.sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());
}

export class LinkTagStore {
  private codes: CodeItem[] = [];
  private projects: ProjectItem[] = [];
  private nfcWrites: NfcWriteRecord[] = [];
  private scans: ScanEvent[] = [];
  private user: UserProfile = {
    id: 'user_enterprise_1',
    email: 'bungadesa220585@gmail.com',
    name: 'Bunga Desa',
    company: 'LinkTag Global Systems',
    role: 'Administrator',
    createdAt: '2026-09-01T00:00:00Z'
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedCodes = localStorage.getItem(LOCAL_STORAGE_KEY_CODES);
      const storedProjects = localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS);
      const storedWrites = localStorage.getItem(LOCAL_STORAGE_KEY_NFC_WRITES);
      const storedScans = localStorage.getItem(LOCAL_STORAGE_KEY_SCANS);
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);

      if (storedCodes) {
        this.codes = JSON.parse(storedCodes);
      } else {
        this.codes = SEED_CODES;
        this.saveCodes();
      }

      if (storedProjects) {
        this.projects = JSON.parse(storedProjects);
      } else {
        this.projects = SEED_PROJECTS;
        this.saveProjects();
      }

      if (storedWrites) {
        this.nfcWrites = JSON.parse(storedWrites);
      } else {
        this.nfcWrites = SEED_NFC_WRITES;
        this.saveNfcWrites();
      }

      if (storedScans) {
        this.scans = JSON.parse(storedScans);
      } else {
        this.scans = generateSeedScans();
        this.saveScans();
      }

      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    } catch (e) {
      console.error('Error loading LinkTag local state:', e);
      this.codes = SEED_CODES;
      this.projects = SEED_PROJECTS;
      this.nfcWrites = SEED_NFC_WRITES;
      this.scans = generateSeedScans();
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private saveCodes() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CODES, JSON.stringify(this.codes));
    } catch {}
    this.notify();
  }

  private saveProjects() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
    } catch {}
    this.notify();
  }

  private saveNfcWrites() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_NFC_WRITES, JSON.stringify(this.nfcWrites));
    } catch {}
    this.notify();
  }

  private saveScans() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SCANS, JSON.stringify(this.scans));
    } catch {}
    this.notify();
  }

  // Getters
  public getCodes(): CodeItem[] {
    return [...this.codes];
  }

  public getProjects(): ProjectItem[] {
    return [...this.projects];
  }

  public getNfcWrites(): NfcWriteRecord[] {
    return [...this.nfcWrites];
  }

  public getScans(): ScanEvent[] {
    return [...this.scans];
  }

  public getUser(): UserProfile {
    return { ...this.user };
  }

  public setUser(user: UserProfile) {
    this.user = user;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
    } catch {}
    this.notify();
  }

  // Lookup helper for redirect engine
  public findCodeByUniqueId(id: string, type?: string): CodeItem | undefined {
    const cleanId = id.trim().toLowerCase();
    return this.codes.find((c) => {
      const matchId = c.uniqueId.toLowerCase() === cleanId || 
                      c.uniqueId.toLowerCase() === `nfc-${cleanId}` ||
                      c.uniqueId.toLowerCase().replace(/^(qr-|nfc-|bar-)/, '') === cleanId;
      if (!matchId) return false;
      if (type && type !== 'all') {
        const typeMatch = (type === 'q' && c.codeType === 'qr') ||
                          (type === 'n' && c.codeType === 'nfc') ||
                          (type === 'b' && c.codeType === 'barcode') ||
                          c.codeType === type;
        return typeMatch;
      }
      return true;
    });
  }

  // Lookup standard physical barcode number (e.g. EAN13 numeric string)
  public findCodeByBarcodeNumber(num: string): CodeItem | undefined {
    const clean = num.trim();
    return this.codes.find((c) => c.barcodeNumber === clean || c.uniqueId === clean);
  }

  // Computes active destination URL accounting for scheduled link overrides
  public getActiveDestination(code: CodeItem): {
    url: string;
    isScheduled: boolean;
    scheduleName?: string;
  } {
    if (!code.schedules || code.schedules.length === 0) {
      return { url: code.destinationUrl, isScheduled: false };
    }

    const now = new Date().getTime();
    // Sort schedules by priority descending
    const validSchedules = code.schedules
      .filter((s) => {
        const start = new Date(s.startDate).getTime();
        const end = new Date(s.endDate).getTime();
        return now >= start && now <= end;
      })
      .sort((a, b) => b.priority - a.priority);

    if (validSchedules.length > 0) {
      return {
        url: validSchedules[0].destinationUrl,
        isScheduled: true,
        scheduleName: validSchedules[0].name
      };
    }

    return { url: code.destinationUrl, isScheduled: false };
  }

  // Code actions
  public addCode(codeData: Omit<CodeItem, 'id' | 'createdAt' | 'updatedAt' | 'scanCount'>): CodeItem {
    const newCode: CodeItem = {
      ...codeData,
      id: `code_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      scanCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.codes.unshift(newCode);
    this.saveCodes();

    // Async sync to Firestore
    this.syncDocToFirestore('codes', newCode.id, newCode).catch(() => {});
    return newCode;
  }

  public updateCode(id: string, updates: Partial<CodeItem>): boolean {
    const idx = this.codes.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    this.codes[idx] = {
      ...this.codes[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveCodes();

    this.syncDocToFirestore('codes', id, this.codes[idx]).catch(() => {});
    return true;
  }

  public deleteCode(id: string): boolean {
    const idx = this.codes.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    this.codes.splice(idx, 1);
    this.saveCodes();

    // Delete in Firestore
    deleteDoc(doc(db, 'codes', id)).catch(() => {});
    return true;
  }

  public toggleCodeStatus(id: string): CodeStatus {
    const code = this.codes.find((c) => c.id === id);
    if (!code) return 'disabled';

    const nextStatus: CodeStatus = code.status === 'active' ? 'disabled' : 'active';
    this.updateCode(id, { status: nextStatus });
    return nextStatus;
  }

  // Project actions
  public addProject(project: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'>): ProjectItem {
    const newProj: ProjectItem = {
      ...project,
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.projects.push(newProj);
    this.saveProjects();

    this.syncDocToFirestore('projects', newProj.id, newProj).catch(() => {});
    return newProj;
  }

  public updateProject(id: string, updates: Partial<ProjectItem>): boolean {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    this.projects[idx] = {
      ...this.projects[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveProjects();

    this.syncDocToFirestore('projects', id, this.projects[idx]).catch(() => {});
    return true;
  }

  public deleteProject(id: string): boolean {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    this.projects.splice(idx, 1);
    // Unassign codes in this project
    this.codes.forEach((c) => {
      if (c.projectId === id) {
        c.projectId = undefined;
      }
    });
    this.saveCodes();
    this.saveProjects();

    deleteDoc(doc(db, 'projects', id)).catch(() => {});
    return true;
  }

  // NFC Write Record
  public addNfcWrite(record: Omit<NfcWriteRecord, 'id' | 'writtenAt'>): NfcWriteRecord {
    const newRecord: NfcWriteRecord = {
      ...record,
      id: `write_${Date.now()}`,
      writtenAt: new Date().toISOString()
    };
    this.nfcWrites.unshift(newRecord);
    this.saveNfcWrites();

    this.syncDocToFirestore('nfc_writes', newRecord.id, newRecord).catch(() => {});
    return newRecord;
  }

  // Record Scan Analytics
  public recordScan(
    uniqueId: string,
    codeType: CodeType,
    clientMeta?: Partial<ScanEvent>
  ): ScanEvent | null {
    const code = this.findCodeByUniqueId(uniqueId, codeType);
    if (!code) return null;

    // Increment code scan counter
    code.scanCount = (code.scanCount || 0) + 1;
    code.updatedAt = new Date().toISOString();
    this.saveCodes();

    // Create scan event
    const scanEvent: ScanEvent = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      codeId: code.id,
      uniqueId: code.uniqueId,
      codeType: code.codeType,
      codeName: code.name,
      eventTime: new Date().toISOString(),
      deviceType: clientMeta?.deviceType || (window.innerWidth < 768 ? 'Mobile' : 'Desktop'),
      browser: clientMeta?.browser || 'Web Browser',
      os: clientMeta?.os || (navigator.userAgent.includes('Android') ? 'Android' : navigator.userAgent.includes('iPhone') ? 'iOS' : 'Desktop OS'),
      country: clientMeta?.country || 'Indonesia',
      city: clientMeta?.city || 'Jakarta',
      ipHash: clientMeta?.ipHash || 'ip_' + Math.random().toString(36).substring(2, 8),
      referrer: clientMeta?.referrer || (document.referrer ? new URL(document.referrer).hostname : 'Direct Camera / NFC')
    };

    this.scans.unshift(scanEvent);
    this.saveScans();

    this.syncDocToFirestore('scans', scanEvent.id, scanEvent).catch(() => {});
    return scanEvent;
  }

  // Bulk import
  public importBulk(
    items: Array<{
      name: string;
      uniqueId?: string;
      destinationUrl: string;
      codeType: CodeType;
      barcodeFormat?: BarcodeFormat;
      projectName?: string;
    }>
  ): { created: number; errors: Array<{ row: number; reason: string }> } {
    const errors: Array<{ row: number; reason: string }> = [];
    let created = 0;

    items.forEach((item, index) => {
      const rowNum = index + 1;
      if (!item.name || !item.name.trim()) {
        errors.push({ row: rowNum, reason: 'Missing code name' });
        return;
      }
      if (!item.destinationUrl || !item.destinationUrl.trim()) {
        errors.push({ row: rowNum, reason: 'Missing destination URL' });
        return;
      }

      // Check duplicate ID
      let finalId = item.uniqueId ? item.uniqueId.trim() : '';
      if (!finalId) {
        finalId = `${item.codeType.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      }

      const existing = this.findCodeByUniqueId(finalId);
      if (existing) {
        errors.push({ row: rowNum, reason: `ID '${finalId}' is already in use` });
        return;
      }

      // Find or create project if specified
      let projectId: string | undefined = undefined;
      if (item.projectName && item.projectName.trim()) {
        const found = this.projects.find((p) => p.name.toLowerCase() === item.projectName!.trim().toLowerCase());
        if (found) {
          projectId = found.id;
        } else {
          const newP = this.addProject({
            userId: this.user.id,
            name: item.projectName.trim(),
            description: 'Imported via Bulk Generator',
            color: '#6366f1'
          });
          projectId = newP.id;
        }
      }

      this.addCode({
        userId: this.user.id,
        projectId,
        uniqueId: finalId,
        name: item.name.trim(),
        codeType: item.codeType || 'qr',
        subType: 'dynamic',
        destinationUrl: item.destinationUrl.trim(),
        barcodeFormat: item.barcodeFormat || (item.codeType === 'barcode' ? 'CODE128' : undefined),
        isDynamic: true,
        status: 'active'
      });
      created++;
    });

    return { created, errors };
  }

  // Firestore sync helper
  private async syncDocToFirestore(collName: string, docId: string, data: any) {
    try {
      await setDoc(doc(db, collName, docId), data, { merge: true });
    } catch (e) {
      // Offline or network error - local state is already saved!
    }
  }
}

// Export singleton instance
export const store = new LinkTagStore();
