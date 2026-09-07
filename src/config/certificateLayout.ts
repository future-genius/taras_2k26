/**
 * TARAS 2K26 — Certificate Visual Overlay Configuration
 *
 * Defines absolute coordinate positions, bounding dimensions, typography,
 * and alignments for dynamically rendered text and QR elements on top of the
 * fixed 1199 x 848 px certificate template.
 *
 * This configuration layer isolates layout rules so positioning adjustments
 * can be made without touching the PDF rendering or Firestore logic.
 */

export interface TextLayoutItem {
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontWeight?: string | number;
  color: string;
  alignment: 'left' | 'center' | 'right';
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: string;
  textTransform?: 'uppercase' | 'capitalize' | 'none';
}

export interface QRCodeLayoutItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CertificateLayoutConfig {
  canvas: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  participantName: TextLayoutItem;
  collegeName: TextLayoutItem;
  eventDescription: TextLayoutItem;
  certificateId: TextLayoutItem;
  issueDate: TextLayoutItem;
  symposiumBadge: TextLayoutItem;
  qrCode: QRCodeLayoutItem;
}

export const certificateLayout: CertificateLayoutConfig = {
  canvas: {
    width: 1199,
    height: 848,
    aspectRatio: 1199 / 848, // ~1.414 standard landscape A4 ratio
  },

  // Recipient Participant Name
  participantName: {
    x: 320,
    y: 345,
    width: 820,
    fontSize: 42,
    fontWeight: 900,
    color: '#ffffff',
    alignment: 'left',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    textTransform: 'uppercase',
  },

  // Participant College / Institution
  collegeName: {
    x: 320,
    y: 415,
    width: 820,
    fontSize: 18,
    fontWeight: 600,
    color: '#cbd5e1', // slate-300
    alignment: 'left',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    textTransform: 'uppercase',
  },

  // Main Recognition Body Text
  eventDescription: {
    x: 320,
    y: 470,
    width: 820,
    fontSize: 17,
    fontWeight: 400,
    color: '#94a3b8', // slate-400
    alignment: 'left',
    lineHeight: 1.5,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },

  // Top-right Symposium Official Badge
  symposiumBadge: {
    x: 850,
    y: 60,
    width: 300,
    fontSize: 12,
    fontWeight: 800,
    color: '#ef4444', // red-500
    alignment: 'right',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
  },

  // Verification QR Code
  qrCode: {
    x: 990,
    y: 685,
    width: 115,
    height: 115,
  },

  // Unique Certificate ID
  certificateId: {
    x: 620,
    y: 740,
    width: 340,
    fontSize: 12,
    fontWeight: 700,
    color: '#e2e8f0', // slate-200
    alignment: 'right',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },

  // Official Issuance Date
  issueDate: {
    x: 620,
    y: 765,
    width: 340,
    fontSize: 11,
    fontWeight: 500,
    color: '#64748b', // slate-500
    alignment: 'right',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
};
