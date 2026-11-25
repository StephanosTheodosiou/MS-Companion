import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { todayKey } from '@/utils/date';

// E7: makes a PDF of the visit summary on the phone (works offline, no backend needed)
// and opens the phone's share sheet, so the patient can email it, save it or send it.

export type ExportResult = 'shared' | 'print-dialog';

/** Every PDF file starts with "%PDF-", which is "JVBERi0" in base64. */
export function looksLikePdf(base64: string): boolean {
  return base64.startsWith('JVBERi0');
}

/**
 * Creates the PDF and writes it into the app's own cache folder.
 * Writing the bytes ourselves (instead of sharing expo-print's temporary file) avoids
 * problems seen in Expo Go on Android: the share sheet not being allowed to read the
 * temporary file, and receiving apps getting a broken file. Uses the long-standing
 * expo-file-system "legacy" functions, which work reliably in Expo Go.
 */
async function writeSummaryPdf(html: string): Promise<string> {
  const { base64 } = await Print.printToFileAsync({ html, base64: true });
  if (!base64 || !looksLikePdf(base64)) {
    throw new Error('The PDF could not be created.');
  }
  if (!FileSystem.cacheDirectory) {
    throw new Error('The phone has no folder the app can save files in.');
  }
  const uri = `${FileSystem.cacheDirectory}MS-Companion-visit-summary-${todayKey()}.pdf`;
  await FileSystem.deleteAsync(uri, { idempotent: true });
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || info.size === 0) {
    throw new Error('The PDF could not be saved on the phone.');
  }
  return uri;
}

export async function shareSummaryPdf(html: string): Promise<ExportResult> {
  const uri = await writeSummaryPdf(html);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Share visit summary',
    });
    return 'shared';
  }
  // No share sheet on this device: open the print screen instead, which offers "Save as PDF".
  await Print.printAsync({ uri });
  return 'print-dialog';
}

/** Opens the phone's print dialog with the same page. */
export async function printSummary(html: string): Promise<void> {
  await Print.printAsync({ html });
}
