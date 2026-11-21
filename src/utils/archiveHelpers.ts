import { FileAttachment } from '../types';

export type DocCategoryPrefix = 'ENOP' | 'SPPT' | 'MRK' | 'K3' | 'TNH' | 'IMB' | 'SLO' | 'TMB';

export function generateNextArchiveNumber(
  prefix: DocCategoryPrefix,
  existingNumbers: string[],
  year: string = new Date().getFullYear().toString()
): string {
  const pattern = new RegExp(`^ARS\\/${prefix}\\/(\\d{4})\\/(\\d+)$`, 'i');
  let maxSeq = 0;

  for (const num of existingNumbers) {
    const match = num.trim().match(pattern);
    if (match) {
      const seq = parseInt(match[2], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
  return `ARS/${prefix}/${year}/${nextSeq}`;
}

export type ExpiryState = 'overdue' | 'warning' | 'active';

export interface ExpiryEvaluation {
  state: ExpiryState;
  daysDiff: number;
  label: string;
  shortLabel: string;
}

export function evaluateDateDeadline(targetDateStr: string): ExpiryEvaluation {
  if (!targetDateStr) {
    return {
      state: 'active',
      daysDiff: 999,
      label: 'Tanggal belum diatur',
      shortLabel: 'Aktif',
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    return {
      state: 'overdue',
      daysDiff,
      label: `Terlewat ${Math.abs(daysDiff)} hari`,
      shortLabel: 'Lewat Jatuh Tempo',
    };
  }

  if (daysDiff <= 45) {
    return {
      state: 'warning',
      daysDiff,
      label: daysDiff === 0 ? 'Jatuh tempo hari ini' : `${daysDiff} hari lagi`,
      shortLabel: 'Segera Berakhir',
    };
  }

  return {
    state: 'active',
    daysDiff,
    label: `${daysDiff} hari tersisa`,
    shortLabel: 'Aktif',
  };
}

export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function readFileAsAttachment(file: File): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: typeof reader.result === 'string' ? reader.result : '',
        uploadedAt: new Date().toISOString().split('T')[0],
      });
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas'));
    reader.readAsDataURL(file);
  });
}
