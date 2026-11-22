import { AppState } from '../types';

const GAS_URL_KEY = 'gas_webapp_url_v1';
const GAS_TOKEN_KEY = 'gas_webapp_token_v1';
const GAS_AUTOSYNC_KEY = 'gas_webapp_autosync_v1';
const GAS_LAST_SYNC_KEY = 'gas_webapp_last_sync_v1';
const GAS_SHEET_URL_KEY = 'gas_webapp_sheet_url_v1';
const GAS_SHEET_NAME_KEY = 'gas_webapp_sheet_name_v1';

export interface GasConfig {
  webAppUrl: string;
  apiToken: string;
  autoSync: boolean;
  isFromEnv: boolean;
  lastSyncedAt: string | null;
  spreadsheetUrl: string | null;
  spreadsheetName: string | null;
}

export interface GasPingResponse {
  success: boolean;
  message?: string;
  spreadsheetId?: string;
  spreadsheetName?: string;
  spreadsheetUrl?: string;
  tabCount?: number;
  tabs?: string[];
  serverTime?: string;
  error?: string;
}

export interface GasSetupResponse {
  success: boolean;
  message?: string;
  spreadsheetId?: string;
  spreadsheetName?: string;
  spreadsheetUrl?: string;
  createdTabs?: string[];
  existingTabs?: string[];
  error?: string;
}

export interface GasSyncResponse {
  success: boolean;
  message?: string;
  spreadsheetUrl?: string;
  spreadsheetName?: string;
  updatedAt?: string;
  stats?: {
    totalDocs: number;
    totalLocations: number;
    totalUsers: number;
  };
  error?: string;
}

export interface GasLoadResponse {
  success: boolean;
  hasData?: boolean;
  state?: AppState | null;
  updatedAt?: string;
  spreadsheetUrl?: string;
  spreadsheetName?: string;
  message?: string;
  error?: string;
}

export interface SheetStructureBlueprint {
  no: number;
  tabName: string;
  moduleTitle: string;
  columns: string[];
  getCount: (state: AppState) => number;
}

export const APPS_SCRIPT_SHEET_BLUEPRINT: SheetStructureBlueprint[] = [
  {
    no: 1,
    tabName: 'Ringkasan & Dashboard',
    moduleTitle: 'Ringkasan Eksekutif & Statistik',
    columns: [
      'NO',
      'MODUL / MENU SISTEM',
      'NAMA TAB SPREADSHEET',
      'JUMLAH DATA AKTIF',
      'KETERANGAN',
      'STATUS',
      'TERAKHIR DIPERBARUI',
    ],
    getCount: () => 14,
  },
  {
    no: 2,
    tabName: 'Arsip Dokumen',
    moduleTitle: 'Master Lokasi Penyimpanan Fisik',
    columns: [
      'NO',
      'ID LOKASI',
      'NAMA LOKASI ARSIP',
      'PENANGGUNG JAWAB (PIC)',
      'LOKASI FISIK',
      'TOTAL DOKUMEN',
      'RINCIAN DOKUMEN',
      'STATUS',
      'TANGGAL PEMBARUAN',
    ],
    getCount: (s) => s.masterLocations.length,
  },
  {
    no: 3,
    tabName: 'Bukti Bayar PBB (E-NOP)',
    moduleTitle: 'Dokumen Bukti Bayar PBB (E-NOP)',
    columns: [
      'NO ARSIP',
      'TANGGAL TRANSAKSI',
      'PROVINSI',
      'KOTA / KABUPATEN',
      'STATUS BAYAR',
      'NOP (18 DIGIT)',
      'NAMA WAJIB PAJAK',
      'ALAMAT WAJIB PAJAK',
      'TAHUN PAJAK',
      'LOKASI OBJEK PAJAK',
      'LOKASI ARSIP FISIK',
      'NAMA BERKAS',
    ],
    getCount: (s) => s.docsENOP.length,
  },
  {
    no: 4,
    tabName: 'Arsip E-SPPT',
    moduleTitle: 'Dokumen Arsip E-SPPT',
    columns: [
      'NO ARSIP',
      'NOP (18 DIGIT)',
      'TAHUN PAJAK',
      'NAMA WAJIB PAJAK',
      'ALAMAT WAJIB PAJAK',
      'LETAK OBJEK PAJAK',
      'JATUH TEMPO',
      'LOKASI ARSIP FISIK',
      'NAMA BERKAS',
    ],
    getCount: (s) => s.docsESPPT.length,
  },
  {
    no: 5,
    tabName: 'Sertifikat Merk',
    moduleTitle: 'Dokumen Sertifikat Merk (HAKI)',
    columns: [
      'NO ARSIP',
      'NAMA PEMILIK MERK',
      'ALAMAT',
      'NO PENDAFTARAN',
      'ETIKET MERK',
      'NO PERMOHONAN',
      'TGL PENERIMAAN',
      'TGL PENGAJUAN',
      'JATUH TEMPO',
      'KELAS',
      'URAIAN WARNA',
      'LOKASI ARSIP',
      'NAMA BERKAS',
    ],
    getCount: (s) => s.docsMerk.length,
  },
  {
    no: 6,
    tabName: 'Sertifikat K3',
    moduleTitle: 'Dokumen Sertifikat K3 / SMK3',
    columns: [
      'NO ARSIP',
      'JENIS OBJEK K3',
      'NAMA PERUSAHAAN',
      'NAMA PEMILIK',
      'ALAMAT',
      'LOKASI UNIT',
      'JENIS',
      'MERK',
      'TYPE',
      'NO SERI',
      'KAPASITAS',
      'TGL PEMERIKSAAN',
      'MASA BERLAKU',
      'LOKASI ARSIP',
      'NAMA BERKAS',
    ],
    getCount: (s) => s.docsK3.length,
  },
  {
    no: 7,
    tabName: 'E-Sertifikat Tanah',
    moduleTitle: 'Dokumen E-Sertifikat Tanah',
    columns: [
      'NO ARSIP',
      'NOMOR SERTIFIKAT',
      'NIB (14 DIGIT)',
      'JENIS HAK',
      'ASAL HAK',
      'NAMA PEMEGANG HAK',
      'LUAS TANAH (M2)',
      'DESA / KELURAHAN',
      'KECAMATAN',
      'KOTA/KABUPATEN',
      'TGL PENERBITAN',
      'STATUS DOKUMEN',
      'STATUS BEBAN',
      'LOKASI ARSIP',
      'NAMA BERKAS',
    ],
    getCount: (s) => s.docsTanah.length,
  },
  {
    no: 8,
    tabName: 'E-IMB & PBG',
    moduleTitle: 'Dokumen E-IMB & PBG',
    columns: [
      'NO ARSIP',
      'NO KEPUTUSAN',
      'TAHUN',
      'ATAS NAMA',
      'BANGUNAN INDUK',
      'BERMAKSUD UNTUK',
      'LOKASI BANGUNAN',
      'KOTA',
      'TGL PERMOHONAN',
      'LOKASI ARSIP',
      'NAMA BERKAS',
    ],
    getCount: (s) => s.docsIMB.length,
  },
  {
    no: 9,
    tabName: 'Sertifikat SLO',
    moduleTitle: 'Dokumen Sertifikat Laik Operasi (SLO)',
    columns: [
      'NO ARSIP',
      'NOMOR SLO',
      'ID SLO',
      'JENIS SLO',
      'NAMA PERUSAHAAN',
      'JENIS INSTALASI',
      'SUMBER ENERGI',
      'KAPASITAS (kVA)',
      'DAYA (kW)',
      'TEGANGAN (V)',
      'LEMBAGA INSPEKSI',
      'TGL TERBIT',
      'TGL BERLAKU',
      'STATUS SLO',
      'LOKASI ARSIP',
      'NAMA BERKAS',
    ],
    getCount: (s) => s.docsSLO?.length || 0,
  },
  {
    no: 10,
    tabName: 'Uji Timbangan',
    moduleTitle: 'Dokumen Uji Timbangan (Metrologi & Tera)',
    columns: [
      'NO ARSIP',
      'ID PENGUJIAN',
      'JENIS TIMBANGAN',
      'NO SURAT PENGUJIAN',
      'NO ORDER',
      'NAMA ALAT UKUR',
      'MEREK',
      'MODEL TIPE',
      'NO SERI',
      'KAPASITAS MAKS',
      'KAPASITAS MIN',
      'KELAS',
      'PEMILIK',
      'INSTANSI PENERBIT',
      'TGL TERBIT',
      'BERLAKU SAMPAI',
      'STATUS BERLAKU',
      'STATUS DOKUMEN',
      'LOKASI ARSIP',
      'NAMA BERKAS',
    ],
    getCount: (s) => s.docsTimbangan?.length || 0,
  },
  {
    no: 11,
    tabName: 'Master Provinsi & Kota',
    moduleTitle: 'Master Wilayah Indonesia',
    columns: ['NO', 'ID PROVINSI', 'NAMA PROVINSI', 'JUMLAH KOTA', 'DAFTAR KOTA / KABUPATEN'],
    getCount: (s) => s.masterProvinces.length,
  },
  {
    no: 12,
    tabName: 'Master Status Bayar',
    moduleTitle: 'Master Status Pembayaran',
    columns: ['NO', 'ID STATUS', 'NAMA STATUS BAYAR', 'KATEGORI STATUS', 'KETERANGAN'],
    getCount: (s) => s.masterStatuses.length,
  },
  {
    no: 13,
    tabName: 'Master Roles',
    moduleTitle: 'Master Peran & Matriks Hak Akses',
    columns: [
      'NO',
      'ID ROLE',
      'NAMA ROLE',
      'LEVEL AKSES',
      'DESKRIPSI',
      'KELOLA MASTER',
      'INPUT DOKUMEN',
      'HAPUS DOKUMEN',
      'EKSPOR LAPORAN',
      'KELOLA USER',
      'NOTIF EMAIL',
    ],
    getCount: (s) => s.roles.length,
  },
  {
    no: 14,
    tabName: 'Pengguna & Otorisasi',
    moduleTitle: 'Daftar Pengguna Aplikasi (Roles & User)',
    columns: [
      'NO',
      'ID PENGGUNA',
      'NAMA LENGKAP',
      'USERNAME',
      'EMAIL TERDAFTAR',
      'PERAN (ROLE)',
      'LEVEL AKSES',
      'STATUS AKUN',
      'LOGIN TERAKHIR',
    ],
    getCount: (s) => s.users.length,
  },
  {
    no: 15,
    tabName: 'Profil Perusahaan',
    moduleTitle: 'Profil Perusahaan & Logo (Setting Company)',
    columns: [
      'ID PARAMETER',
      'NAMA PARAMETER PENGATURAN',
      'NILAI SAAT INI',
      'KETERANGAN',
      'TERAKHIR DIPERBARUI',
    ],
    getCount: () => 1,
  },
];

export function isValidAppsScriptUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'script.google.com' ||
        parsed.hostname === 'script.googleusercontent.com')
    );
  } catch {
    return false;
  }
}

export function buildDeviceSyncShareUrl(webAppUrl: string, apiToken?: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin + window.location.pathname);
  if (isValidAppsScriptUrl(webAppUrl)) {
    url.searchParams.set('gas', webAppUrl.trim());
    if (apiToken && apiToken.trim()) {
      url.searchParams.set('gasToken', apiToken.trim());
    }
  }
  return url.toString();
}

export function getGasConfig(): GasConfig {
  const envUrl = (import.meta.env.VITE_GAS_WEBAPP_URL || '').trim();
  const envToken = (import.meta.env.VITE_GAS_API_TOKEN || '').trim();

  // Auto-pair Apps Script URL from shareable mobile link (?gas=...&gasToken=...)
  try {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const queryGas = (params.get('gas') || '').trim();
      const queryToken = (params.get('gasToken') || '').trim();
      if (isValidAppsScriptUrl(queryGas)) {
        localStorage.setItem(GAS_URL_KEY, queryGas);
        if (queryToken) {
          localStorage.setItem(GAS_TOKEN_KEY, queryToken);
        }
        params.delete('gas');
        params.delete('gasToken');
        const nextQuery = params.toString();
        const cleanUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  } catch {
    // ignore URL/storage access errors
  }

  try {
    const storedUrl = (localStorage.getItem(GAS_URL_KEY) || '').trim();
    const storedToken = (localStorage.getItem(GAS_TOKEN_KEY) || '').trim();
    const storedAutoSync = localStorage.getItem(GAS_AUTOSYNC_KEY);
    const lastSyncedAt = localStorage.getItem(GAS_LAST_SYNC_KEY);
    const spreadsheetUrl = localStorage.getItem(GAS_SHEET_URL_KEY);
    const spreadsheetName = localStorage.getItem(GAS_SHEET_NAME_KEY);

    const webAppUrl = storedUrl || envUrl;
    const apiToken = storedToken || envToken;

    return {
      webAppUrl,
      apiToken,
      autoSync: storedAutoSync !== 'false',
      isFromEnv: !storedUrl && Boolean(envUrl),
      lastSyncedAt,
      spreadsheetUrl,
      spreadsheetName,
    };
  } catch {
    return {
      webAppUrl: envUrl,
      apiToken: envToken,
      autoSync: true,
      isFromEnv: Boolean(envUrl),
      lastSyncedAt: null,
      spreadsheetUrl: null,
      spreadsheetName: null,
    };
  }
}

export function saveGasConfig(partial: {
  webAppUrl?: string;
  apiToken?: string;
  autoSync?: boolean;
  lastSyncedAt?: string | null;
  spreadsheetUrl?: string | null;
  spreadsheetName?: string | null;
}): GasConfig {
  try {
    if (partial.webAppUrl !== undefined) {
      const clean = partial.webAppUrl.trim();
      if (clean) localStorage.setItem(GAS_URL_KEY, clean);
      else localStorage.removeItem(GAS_URL_KEY);
    }
    if (partial.apiToken !== undefined) {
      const clean = partial.apiToken.trim();
      if (clean) localStorage.setItem(GAS_TOKEN_KEY, clean);
      else localStorage.removeItem(GAS_TOKEN_KEY);
    }
    if (partial.autoSync !== undefined) {
      localStorage.setItem(GAS_AUTOSYNC_KEY, String(partial.autoSync));
    }
    if (partial.lastSyncedAt !== undefined) {
      if (partial.lastSyncedAt) localStorage.setItem(GAS_LAST_SYNC_KEY, partial.lastSyncedAt);
      else localStorage.removeItem(GAS_LAST_SYNC_KEY);
    }
    if (partial.spreadsheetUrl !== undefined) {
      if (partial.spreadsheetUrl) localStorage.setItem(GAS_SHEET_URL_KEY, partial.spreadsheetUrl);
      else localStorage.removeItem(GAS_SHEET_URL_KEY);
    }
    if (partial.spreadsheetName !== undefined) {
      if (partial.spreadsheetName) localStorage.setItem(GAS_SHEET_NAME_KEY, partial.spreadsheetName);
      else localStorage.removeItem(GAS_SHEET_NAME_KEY);
    }
  } catch {
    // ignore storage errors
  }
  return getGasConfig();
}

function buildGetUrl(baseUrl: string, action: string, token?: string): string {
  const url = new URL(baseUrl.trim());
  url.searchParams.set('action', action);
  if (token && token.trim()) {
    url.searchParams.set('token', token.trim());
  }
  url.searchParams.set('_t', String(Date.now()));
  return url.toString();
}

/**
 * Tes koneksi ke URL Web App Google Apps Script
 */
export async function testGasConnection(
  webAppUrl: string,
  apiToken?: string
): Promise<GasPingResponse> {
  if (!isValidAppsScriptUrl(webAppUrl)) {
    return {
      success: false,
      error:
        'URL tidak valid. Pastikan URL diawali https://script.google.com/macros/s/... dan berakhiran /exec',
    };
  }

  try {
    const res = await fetch(buildGetUrl(webAppUrl, 'ping', apiToken), {
      method: 'GET',
      redirect: 'follow',
    });
    const text = await res.text();
    let data: GasPingResponse;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error:
          'Respon Apps Script bukan JSON. Pastikan Deploy Web App diatur: "Execute as: Me" dan "Who has access: Anyone".',
      };
    }

    if (data.success && data.spreadsheetUrl) {
      saveGasConfig({
        spreadsheetUrl: data.spreadsheetUrl,
        spreadsheetName: data.spreadsheetName || null,
      });
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal menghubungi Apps Script: ${err?.message || 'Periksa koneksi internet & izin Deploy Web App (Anyone).'}`,
    };
  }
}

/**
 * Memicu pembuatan struktur 15 tab Google Sheets lewat Apps Script
 */
export async function setupGasSpreadsheet(
  webAppUrl: string,
  apiToken?: string
): Promise<GasSetupResponse> {
  if (!isValidAppsScriptUrl(webAppUrl)) {
    return { success: false, error: 'URL Web App Google Apps Script belum valid.' };
  }

  try {
    const res = await fetch(webAppUrl.trim(), {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'setup',
        token: apiToken || '',
      }),
    });
    const text = await res.text();
    const data: GasSetupResponse = JSON.parse(text);
    if (data.success && data.spreadsheetUrl) {
      saveGasConfig({
        spreadsheetUrl: data.spreadsheetUrl,
        spreadsheetName: data.spreadsheetName || null,
      });
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal membuat struktur tab: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Mengirim & menyimpan seluruh data AppState ke 15 tab Google Sheets
 */
export async function syncStateToGas(
  webAppUrl: string,
  state: AppState,
  apiToken?: string
): Promise<GasSyncResponse> {
  if (!isValidAppsScriptUrl(webAppUrl)) {
    return { success: false, error: 'URL Web App Google Apps Script belum valid.' };
  }

  try {
    const res = await fetch(webAppUrl.trim(), {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'syncAll',
        token: apiToken || '',
        payload: state,
      }),
    });
    const text = await res.text();
    let data: GasSyncResponse;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error:
          'Respon Apps Script tidak valid. Pastikan versi terbaru Code.gs sudah di-deploy sebagai Web App (Who has access: Anyone).',
      };
    }

    if (data.success) {
      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      saveGasConfig({
        lastSyncedAt: timeStr,
        spreadsheetUrl: data.spreadsheetUrl || undefined,
        spreadsheetName: data.spreadsheetName || undefined,
      });
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal menyimpan ke Google Sheets: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Memuat seluruh data AppState dari Google Sheets lewat Apps Script
 */
export async function loadStateFromGas(
  webAppUrl: string,
  apiToken?: string
): Promise<GasLoadResponse> {
  if (!isValidAppsScriptUrl(webAppUrl)) {
    return { success: false, error: 'URL Web App Google Apps Script belum valid.' };
  }

  try {
    const res = await fetch(buildGetUrl(webAppUrl, 'load', apiToken), {
      method: 'GET',
      redirect: 'follow',
    });
    const text = await res.text();
    let data: GasLoadResponse;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error:
          'Respon Apps Script tidak dapat dibaca. Pastikan Deploy Web App diatur: "Who has access: Anyone".',
      };
    }

    if (data.success && data.spreadsheetUrl) {
      saveGasConfig({
        spreadsheetUrl: data.spreadsheetUrl,
        spreadsheetName: data.spreadsheetName || null,
      });
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal memuat data dari Google Sheets: ${err?.message || String(err)}`,
    };
  }
}
