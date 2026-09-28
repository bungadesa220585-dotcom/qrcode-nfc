import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import JSZip from 'jszip';
import { CodeItem, QrCustomization } from '../types.ts';

export function getIntermediateUrl(code: CodeItem, originUrl?: string): string {
  const base = originUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const prefix = code.codeType === 'qr' ? 'q' : code.codeType === 'nfc' ? 'n' : 'b';
  // Strip redundant type prefix in uniqueId if already present for cleaner URLs
  const cleanId = code.uniqueId;
  return `${base}/${prefix}/${cleanId}`;
}

export async function generateQrDataUrl(
  text: string,
  customization?: QrCustomization,
  width: number = 320
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width,
      margin: 2,
      color: {
        dark: customization?.colorDark || '#0f172a',
        light: customization?.colorLight || '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR data URL:', err);
    return '';
  }
}

export async function generateQrSvgString(
  text: string,
  customization?: QrCustomization
): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      margin: 2,
      color: {
        dark: customization?.colorDark || '#0f172a',
        light: customization?.colorLight || '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
    return svgString;
  } catch (err) {
    console.error('Failed to generate QR SVG string:', err);
    return '';
  }
}

export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  format: string = 'CODE128',
  options?: { displayValue?: boolean; lineColor?: string; background?: string }
): boolean {
  try {
    JsBarcode(canvas, text, {
      format: format as any,
      displayValue: options?.displayValue ?? true,
      lineColor: options?.lineColor || '#0f172a',
      background: options?.background || '#ffffff',
      margin: 10,
      fontSize: 14,
      textMargin: 4,
      height: 60
    });
    return true;
  } catch (err) {
    console.error('JsBarcode rendering error:', err);
    return false;
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Generate ZIP package for bulk download (PRD 4.13)
export async function createBulkExportZip(
  codes: CodeItem[],
  originUrl: string
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('linktag_codes') || zip;

  let csvContent = 'ID,Name,Type,Unique_ID,Intermediate_URL,Destination_URL,Status,Scan_Count\n';

  for (const code of codes) {
    const intermediateUrl = getIntermediateUrl(code, originUrl);
    csvContent += `"${code.id}","${code.name.replace(/"/g, '""')}","${code.codeType}","${code.uniqueId}","${intermediateUrl}","${code.destinationUrl.replace(/"/g, '""')}","${code.status}",${code.scanCount}\n`;

    if (code.codeType === 'qr' || code.codeType === 'nfc') {
      const payloadUrl = getIntermediateUrl(code, originUrl);
      const dataUrl = await generateQrDataUrl(payloadUrl, code.customization, 400);
      if (dataUrl) {
        const base64Data = dataUrl.split(',')[1];
        folder.file(`${code.uniqueId}_qr.png`, base64Data, { base64: true });
      }
    } else if (code.codeType === 'barcode') {
      // Create offscreen canvas for barcode
      const canvas = document.createElement('canvas');
      const textToEncode = code.isDynamic ? getIntermediateUrl(code, originUrl) : (code.barcodeNumber || code.uniqueId);
      const ok = renderBarcodeToCanvas(canvas, textToEncode, code.barcodeFormat || 'CODE128');
      if (ok) {
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        folder.file(`${code.uniqueId}_barcode.png`, base64Data, { base64: true });
      }
    }
  }

  folder.file('manifest.csv', csvContent);
  return await zip.generateAsync({ type: 'blob' });
}
