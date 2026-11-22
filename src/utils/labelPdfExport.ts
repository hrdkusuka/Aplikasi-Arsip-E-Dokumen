import jsPDF from 'jspdf';

export interface LabelDocumentItem {
  id: string;
  noArsip: string;
  category: string;
  primaryTitle: string;
  subTitle: string;
  locationName: string;
  extraInfo?: string;
}

export type PaperSize = 'A4' | 'F4' | 'Letter';
export type SecondLineOption =
  | 'kategori_keterangan'
  | 'keterangan_saja'
  | 'kategori_lokasi'
  | 'lokasi_saja';

export type LabelAlignment = 'center' | 'left';

export interface LabelExportConfig {
  paperSize: PaperSize;
  density: 'max' | 'standard'; // max: 9 rows (18/A4), standard: 8 rows (16/A4)
  showCutGuides: boolean;
  secondLineOption: SecondLineOption;
  alignment: LabelAlignment;
  fontScale: 'large' | 'extra-large' | 'standard'; // User font size preference for No Arsip
}

const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number; cssSize: string }> = {
  A4: { width: 210, height: 297, cssSize: '210mm 297mm' },
  F4: { width: 215, height: 330, cssSize: '215mm 330mm' },
  Letter: { width: 216, height: 279, cssSize: '216mm 279mm' },
};

/**
 * Safely converts any value (including numbers/null/undefined from Google Sheets)
 * into clean printable text without throwing.
 */
export function safeLabelString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Normalizes punctuation not supported by standard PDF WinAnsi Helvetica font.
 */
function sanitizeForPdf(text: string): string {
  return safeLabelString(text)
    .replace(/[—–]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2022/g, '·')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(text: string): string {
  return safeLabelString(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getSecondLineText(
  item: LabelDocumentItem,
  option: SecondLineOption = 'kategori_keterangan'
): string {
  const category = safeLabelString(item.category);
  const primaryTitle = safeLabelString(item.primaryTitle);
  const subTitle = safeLabelString(item.subTitle);
  const locationName = safeLabelString(item.locationName) || 'Arsip Utama';

  switch (option) {
    case 'kategori_keterangan': {
      const parts: string[] = [];
      if (category) parts.push(category);
      if (primaryTitle) parts.push(primaryTitle);
      if (subTitle) parts.push(subTitle);
      return parts.join(' · ') || '-';
    }
    case 'keterangan_saja': {
      const parts: string[] = [];
      if (primaryTitle) parts.push(primaryTitle);
      if (subTitle) parts.push(subTitle);
      return parts.join(' · ') || category || '-';
    }
    case 'kategori_lokasi': {
      return `${category ? `${category} · ` : ''}Lokasi: ${locationName}`;
    }
    case 'lokasi_saja': {
      return `Lokasi: ${locationName}`;
    }
    default: {
      return [category, primaryTitle].filter(Boolean).join(' · ') || '-';
    }
  }
}

export function getRowsPerPage(config: Pick<LabelExportConfig, 'paperSize' | 'density'>): number {
  if (config.paperSize === 'F4') return 10;
  if (config.density === 'max' && config.paperSize === 'A4') return 9;
  return 8;
}

export function generateLabelsPDF(
  items: LabelDocumentItem[],
  config: LabelExportConfig
): jsPDF | null {
  if (!items || items.length === 0) return null;

  const paper = PAPER_DIMENSIONS[config.paperSize] || PAPER_DIMENSIONS.A4;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [paper.width, paper.height],
  });

  const labelWidth = 80; // 8 cm (80 mm)
  const labelHeight = 30; // 3 cm (30 mm)
  const cols = 2;
  const rowsPerPage = getRowsPerPage(config);

  const itemsPerPage = cols * rowsPerPage;
  const colGap = 10; // 10 mm gap between columns
  const totalGridWidth = cols * labelWidth + (cols - 1) * colGap; // 170 mm
  const startX = (paper.width - totalGridWidth) / 2; // Center horizontally on paper

  // Vertical spacing
  const availableHeight = paper.height - 20; // 10mm top/bottom buffer minimum
  const totalLabelHeight = rowsPerPage * labelHeight;
  const rowGap =
    rowsPerPage > 1
      ? Math.max(1, Math.min(4, (availableHeight - totalLabelHeight) / (rowsPerPage - 1)))
      : 2;
  const totalGridHeight = rowsPerPage * labelHeight + (rowsPerPage - 1) * rowGap;
  const startY = (paper.height - totalGridHeight) / 2;

  items.forEach((item, index) => {
    const indexOnPage = index % itemsPerPage;

    if (index > 0 && indexOnPage === 0) {
      doc.addPage([paper.width, paper.height], 'portrait');
    }

    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);

    const x = startX + col * (labelWidth + colGap);
    const y = startY + row * (labelHeight + rowGap);

    // 1. Draw Outer Label Border (3x8 cm / 80x30 mm)
    if (config.showCutGuides) {
      doc.setDrawColor(180, 190, 205);
      if (typeof doc.setLineDashPattern === 'function') {
        doc.setLineDashPattern([1.5, 1.5], 0);
      }
      doc.setLineWidth(0.2);
    } else {
      doc.setDrawColor(215, 225, 235);
      if (typeof doc.setLineDashPattern === 'function') {
        doc.setLineDashPattern([], 0);
      }
      doc.setLineWidth(0.25);
    }

    doc.roundedRect(x, y, labelWidth, labelHeight, 1.5, 1.5, 'S');
    if (typeof doc.setLineDashPattern === 'function') {
      doc.setLineDashPattern([], 0);
    }

    // 2. Prepare Texts: Line 1 = No Arsip, Line 2 = Baris 2 (dapat bersambung jika panjang)
    const line1Text = sanitizeForPdf(item.noArsip) || '-';
    const line2Text = sanitizeForPdf(getSecondLineText(item, config.secondLineOption)) || '-';

    const maxAvailableWidth = labelWidth - 8; // 72 mm printable width
    const isCenter = config.alignment === 'center';
    const textX = isCenter ? x + labelWidth / 2 : x + 5;
    const textOptions: { align?: 'center' | 'left' } = isCenter
      ? { align: 'center' }
      : { align: 'left' };

    // Dynamic Font Sizing for Line 1 (No Arsip)
    let baseFontSize =
      config.fontScale === 'extra-large' ? 18 : config.fontScale === 'standard' ? 14 : 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(baseFontSize);

    // Auto-scale down if No Arsip is exceptionally long to prevent overflow
    let currentWidth = doc.getTextWidth(line1Text);
    while (currentWidth > maxAvailableWidth && baseFontSize > 10) {
      baseFontSize -= 0.5;
      doc.setFontSize(baseFontSize);
      currentWidth = doc.getTextWidth(line1Text);
    }

    // Font Sizing & Multi-line Splitting for Line 2
    let line2FontSize = 10.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(line2FontSize);

    let line2Lines = doc.splitTextToSize(line2Text, maxAvailableWidth) as string[];
    if (line2Lines.length > 2) {
      line2FontSize = 9.5;
      doc.setFontSize(line2FontSize);
      line2Lines = doc.splitTextToSize(line2Text, maxAvailableWidth) as string[];
    }

    const displayLines = (Array.isArray(line2Lines) ? line2Lines : [String(line2Lines)]).slice(
      0,
      3
    );

    // Balanced vertical positioning based on number of lines in baris 2
    let line1Y = y + 13;
    let line2StartY = y + 19.5;
    const line2Spacing = line2FontSize === 10.5 ? 4.3 : 3.8;

    if (displayLines.length === 2) {
      line1Y = y + 11.5;
      line2StartY = y + 17.5;
    } else if (displayLines.length >= 3) {
      line1Y = y + 9.5;
      line2StartY = y + 15.2;
    }

    // Draw Line 1: No Arsip (Bold, Prominent)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(baseFontSize);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(line1Text, textX, line1Y, textOptions);

    // Draw Line 2 & Baris Berikutnya
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(line2FontSize);
    doc.setTextColor(51, 65, 85); // slate-700

    displayLines.forEach((textLine: string, lineIdx: number) => {
      doc.text(String(textLine), textX, line2StartY + lineIdx * line2Spacing, textOptions);
    });
  });

  return doc;
}

export interface LabelPdfExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

export function createLabelsPDFBlobUrl(
  items: LabelDocumentItem[],
  config: LabelExportConfig
): { url: string; fileName: string } | null {
  const doc = generateLabelsPDF(items, config);
  if (!doc) return null;

  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `Label_Arsip_3x8cm_${config.paperSize}_${timestamp}.pdf`;
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  return { url, fileName };
}

export function exportLabelsToPDF(
  items: LabelDocumentItem[],
  config: LabelExportConfig
): LabelPdfExportResult {
  try {
    const doc = generateLabelsPDF(items, config);
    if (!doc) {
      return { success: false, error: 'Tidak ada data label untuk diunduh.' };
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const safeName = `Label_Arsip_3x8cm_${config.paperSize}_${timestamp}.pdf`;

    try {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = safeName;
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch {
          // ignore cleanup error
        }
      }, 60_000);
      return { success: true, fileName: safeName };
    } catch {
      // Fallback to jsPDF built-in save
      doc.save(safeName);
      return { success: true, fileName: safeName };
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat file PDF label.';
    return { success: false, error: message };
  }
}

function buildLabelsPrintHTML(
  items: LabelDocumentItem[],
  config: LabelExportConfig
): string {
  const paper = PAPER_DIMENSIONS[config.paperSize] || PAPER_DIMENSIONS.A4;
  const rowsPerPage = getRowsPerPage(config);
  const itemsPerPage = rowsPerPage * 2;
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  const availableHeight = paper.height - 20;
  const totalLabelHeight = rowsPerPage * 30;
  const rowGap =
    rowsPerPage > 1
      ? Math.max(1, Math.min(4, (availableHeight - totalLabelHeight) / (rowsPerPage - 1)))
      : 2;

  const printFontSize =
    config.fontScale === 'extra-large'
      ? '17pt'
      : config.fontScale === 'large'
      ? '15pt'
      : '13.5pt';

  const alignItems = config.alignment === 'center' ? 'center' : 'flex-start';
  const textAlign = config.alignment === 'center' ? 'center' : 'left';
  const borderStyle = config.showCutGuides ? '0.6pt dashed #94a3b8' : '0.6pt solid #cbd5e1';

  const pagesHtml: string[] = [];
  for (let p = 0; p < totalPages; p++) {
    const pageItems = items.slice(p * itemsPerPage, (p + 1) * itemsPerPage);
    const cardsHtml = pageItems
      .map((item) => {
        const noArsip = escapeHtml(safeLabelString(item.noArsip) || '-');
        const line2 = escapeHtml(getSecondLineText(item, config.secondLineOption));
        return `
          <div class="label-card">
            <div class="label-no-arsip">${noArsip}</div>
            <div class="label-line2">${line2}</div>
          </div>
        `;
      })
      .join('');

    pagesHtml.push(`<section class="print-sheet-page">${cardsHtml}</section>`);
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Cetak Label Arsip 3x8 cm (${escapeHtml(config.paperSize)})</title>
  <style>
    @page {
      size: ${paper.cssSize};
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    .print-sheet-page {
      width: ${paper.width}mm;
      height: ${paper.height}mm;
      display: grid;
      grid-template-columns: 80mm 80mm;
      grid-auto-rows: 30mm;
      column-gap: 10mm;
      row-gap: ${rowGap.toFixed(2)}mm;
      justify-content: center;
      align-content: center;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .print-sheet-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .label-card {
      width: 80mm;
      height: 30mm;
      border: ${borderStyle};
      border-radius: 1.5mm;
      padding: 2mm 3.5mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: ${alignItems};
      text-align: ${textAlign};
      overflow: hidden;
      background: #ffffff;
    }
    .label-no-arsip {
      font-family: "Courier New", Courier, monospace;
      font-size: ${printFontSize};
      font-weight: 700;
      color: #0f172a;
      line-height: 1.15;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .label-line2 {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.8pt;
      font-weight: 500;
      color: #334155;
      margin-top: 1.4mm;
      line-height: 1.25;
      width: 100%;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${pagesHtml.join('\n')}
</body>
</html>`;
}

export interface LabelDirectPrintResult {
  triggered: boolean;
  dialogDetected: boolean;
  error?: string;
}

/**
 * Opens the browser's native printer dialog directly via a dedicated hidden iframe
 * so React modal overlays (fixed inset-0) never clip or hide printed sheets.
 */
export function printLabelsDirectly(
  items: LabelDocumentItem[],
  config: LabelExportConfig,
  onDialogStatus?: (opened: boolean) => void
): LabelDirectPrintResult {
  if (!items || items.length === 0) {
    return { triggered: false, dialogDetected: false, error: 'Tidak ada label untuk dicetak.' };
  }

  try {
    // Remove any leftover print iframe from previous print session
    const existing = document.getElementById('arsip-label-print-iframe');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'arsip-label-print-iframe';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const printWin = iframe.contentWindow;
    const printDoc = iframe.contentDocument || printWin?.document;
    if (!printWin || !printDoc) {
      document.body.removeChild(iframe);
      return {
        triggered: false,
        dialogDetected: false,
        error: 'Browser tidak mengizinkan pembuatan frame cetak.',
      };
    }

    const html = buildLabelsPrintHTML(items, config);
    printDoc.open();
    printDoc.write(html);
    printDoc.close();

    let dialogDetected = false;
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      window.setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 500);
    };

    printWin.addEventListener('beforeprint', () => {
      dialogDetected = true;
      onDialogStatus?.(true);
    });

    printWin.addEventListener('afterprint', () => {
      dialogDetected = true;
      onDialogStatus?.(true);
      cleanup();
    });

    // Synchronous print call while still inside the user-click gesture
    const startTs = performance.now();
    printWin.focus();
    printWin.print();
    const elapsedMs = performance.now() - startTs;

    // In desktop browsers, window.print() blocks the JS thread while the modal dialog is open
    if (elapsedMs > 120) {
      dialogDetected = true;
      onDialogStatus?.(true);
    } else if (onDialogStatus) {
      window.setTimeout(() => {
        if (!dialogDetected) {
          onDialogStatus(false);
        }
      }, 450);
    }

    // Safety fallback cleanup after 2 minutes if afterprint never fires
    window.setTimeout(cleanup, 120_000);

    return { triggered: true, dialogDetected };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Gagal membuka dialog printer browser.';
    return { triggered: false, dialogDetected: false, error: message };
  }
}
