/**
 * Code 39 Barcode Generator for Archive Labels
 * Standard Code 39 encoding for alphanumeric archive numbers (e.g., ARS/SPPT/2026/001)
 */

const CODE39_PATTERNS: Record<string, string> = {
  '0': '000110100',
  '1': '100100001',
  '2': '001100001',
  '3': '101100000',
  '4': '000110001',
  '5': '100110000',
  '6': '001110000',
  '7': '000100101',
  '8': '100100100',
  '9': '001100100',
  'A': '100001001',
  'B': '001001001',
  'C': '101001000',
  'D': '000011001',
  'E': '100011000',
  'F': '001011000',
  'G': '000001101',
  'H': '100001100',
  'I': '001001100',
  'J': '000011100',
  'K': '100000011',
  'L': '001000011',
  'M': '101000010',
  'N': '000010011',
  'O': '100010010',
  'P': '001010010',
  'Q': '000000111',
  'R': '100000110',
  'S': '001000110',
  'T': '000010110',
  'U': '110000001',
  'V': '011000001',
  'W': '111000000',
  'X': '010010001',
  'Y': '110010000',
  'Z': '011010000',
  '-': '010000101',
  '.': '110000100',
  ' ': '011000100',
  '$': '010101000',
  '/': '010100010',
  '+': '010001010',
  '%': '000101010',
  '*': '010010100', // Start / Stop character
};

export interface BarcodeBar {
  x: number;
  width: number;
  isBlack: boolean;
}

/**
 * Calculates bar segments for Code 39 barcode
 */
export function getCode39Bars(
  rawText: string,
  totalWidth: number = 100
): { bars: BarcodeBar[]; totalUnits: number } {
  const sanitized = rawText
    .toUpperCase()
    .replace(/[^0-9A-Z\-.$/+% ]/g, '-')
    .slice(0, 24);

  const fullSequence = `*${sanitized}*`;
  const narrowWidth = 1;
  const wideWidth = 2.4;
  const interCharacterGap = narrowWidth;

  // Calculate total units
  let totalUnits = 0;
  for (let i = 0; i < fullSequence.length; i++) {
    const char = fullSequence[i];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];
    for (let j = 0; j < 9; j++) {
      totalUnits += pattern[j] === '1' ? wideWidth : narrowWidth;
    }
    if (i < fullSequence.length - 1) {
      totalUnits += interCharacterGap;
    }
  }

  const scale = totalWidth / totalUnits;
  const bars: BarcodeBar[] = [];
  let currentX = 0;

  for (let i = 0; i < fullSequence.length; i++) {
    const char = fullSequence[i];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];

    for (let j = 0; j < 9; j++) {
      const isBlack = j % 2 === 0; // Even index = bar, odd index = space
      const isWide = pattern[j] === '1';
      const unit = isWide ? wideWidth : narrowWidth;
      const width = unit * scale;

      if (isBlack) {
        bars.push({
          x: currentX,
          width,
          isBlack: true,
        });
      }
      currentX += width;
    }

    if (i < fullSequence.length - 1) {
      currentX += interCharacterGap * scale;
    }
  }

  return { bars, totalUnits };
}

/**
 * Returns an SVG string representation of Code 39 barcode
 */
export function renderCode39Svg(
  text: string,
  width: number = 160,
  height: number = 36,
  showText: boolean = true
): string {
  const { bars } = getCode39Bars(text, width);
  const barHeight = showText ? height - 10 : height;

  const rects = bars
    .map(
      (b) =>
        `<rect x="${b.x.toFixed(2)}" y="0" width="${b.width.toFixed(
          2
        )}" height="${barHeight}" fill="#0f172a" />`
    )
    .join('');

  const textElement = showText
    ? `<text x="${width / 2}" y="${height - 1}" font-family="monospace" font-size="8" font-weight="600" text-anchor="middle" fill="#334155">${text}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${rects}${textElement}</svg>`;
}
