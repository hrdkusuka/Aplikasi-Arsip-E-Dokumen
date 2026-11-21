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

const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  F4: { width: 215, height: 330 },
  Letter: { width: 216, height: 279 },
};

export function getSecondLineText(
  item: LabelDocumentItem,
  option: SecondLineOption = 'kategori_keterangan'
): string {
  switch (option) {
    case 'kategori_keterangan': {
      const parts: string[] = [];
      if (item.category) parts.push(item.category);
      if (item.primaryTitle) parts.push(item.primaryTitle);
      if (item.subTitle) parts.push(item.subTitle);
      return parts.join(' · ');
    }
    case 'keterangan_saja': {
      const parts: string[] = [];
      if (item.primaryTitle) parts.push(item.primaryTitle);
      if (item.subTitle) parts.push(item.subTitle);
      return parts.join(' · ') || item.category;
    }
    case 'kategori_lokasi': {
      return `${item.category} · Lokasi: ${item.locationName}`;
    }
    case 'lokasi_saja': {
      return `Lokasi: ${item.locationName}`;
    }
    default: {
      return `${item.category} · ${item.primaryTitle}`;
    }
  }
}

export function generateLabelsPDF(
  items: LabelDocumentItem[],
  config: LabelExportConfig
): jsPDF | null {
  if (items.length === 0) return null;

  const paper = PAPER_DIMENSIONS[config.paperSize] || PAPER_DIMENSIONS.A4;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [paper.width, paper.height],
  });

  const labelWidth = 80; // 8 cm (80 mm)
  const labelHeight = 30; // 3 cm (30 mm)
  const cols = 2;

  // Compute rows and vertical gap based on paper and density
  let rowsPerPage = 8;
  if (config.paperSize === 'F4') {
    rowsPerPage = 10;
  } else if (config.density === 'max' && config.paperSize === 'A4') {
    rowsPerPage = 9;
  } else {
    rowsPerPage = 8;
  }

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
    const pageIndex = Math.floor(index / itemsPerPage);
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
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.setLineWidth(0.2);
    } else {
      doc.setDrawColor(215, 225, 235);
      doc.setLineDashPattern([], 0);
      doc.setLineWidth(0.25);
    }

    doc.roundedRect(x, y, labelWidth, labelHeight, 1.5, 1.5, 'S');
    doc.setLineDashPattern([], 0);

    // 2. Prepare Texts: Line 1 = No Arsip, Line 2 = Baris 2 (dapat bersambung jika panjang)
    const line1Text = item.noArsip.trim();
    const line2Text = getSecondLineText(item, config.secondLineOption);

    const maxAvailableWidth = labelWidth - 8; // 72 mm printable width
    const isCenter = config.alignment === 'center';
    const textX = isCenter ? x + labelWidth / 2 : x + 5;
    const textOptions: { align?: 'center' | 'left' } = isCenter ? { align: 'center' } : { align: 'left' };

    // Dynamic Font Sizing for Line 1 (No Arsip)
    let baseFontSize = config.fontScale === 'extra-large' ? 18 : config.fontScale === 'standard' ? 14 : 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(baseFontSize);

    // Auto-scale down if No Arsip is exceptionally long to prevent overflow
    let currentWidth = doc.getTextWidth(line1Text);
    while (currentWidth > maxAvailableWidth && baseFontSize > 11) {
      baseFontSize -= 0.5;
      doc.setFontSize(baseFontSize);
      currentWidth = doc.getTextWidth(line1Text);
    }

    // Font Sizing & Multi-line Splitting for Line 2 (Font agak besar, wrap jika panjang)
    let line2FontSize = 10.5; // Font agak besar sesuai permintaan
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(line2FontSize);

    let line2Lines = doc.splitTextToSize(line2Text, maxAvailableWidth);
    if (line2Lines.length > 2) {
      // If 3 or more lines, slightly tune font size to 9.5 so everything fits harmoniously
      line2FontSize = 9.5;
      doc.setFontSize(line2FontSize);
      line2Lines = doc.splitTextToSize(line2Text, maxAvailableWidth);
    }

    // Limit to max 3 lines if extremely long
    const displayLines = line2Lines.slice(0, 3);

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

    // Draw Line 2 & Baris Berikutnya (Font agak besar, bersambung ke bawah)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(line2FontSize);
    doc.setTextColor(51, 65, 85); // slate-700

    displayLines.forEach((textLine: string, lineIdx: number) => {
      doc.text(textLine, textX, line2StartY + lineIdx * line2Spacing, textOptions);
    });
  });

  return doc;
}

export function exportLabelsToPDF(
  items: LabelDocumentItem[],
  config: LabelExportConfig
): void {
  const doc = generateLabelsPDF(items, config);
  if (!doc) return;

  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = `Label_Arsip_3x8cm_${config.paperSize}_${timestamp}.pdf`;
  doc.save(safeName);
}
