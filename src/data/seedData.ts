import { AppState } from '../types';
import { INITIAL_PROVINCES } from './indonesiaRegions';

function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const DEFAULT_COMPANY_LOGO_SVG = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="32" fill="url(#bgGrad)"/>
  <rect x="10" y="10" width="140" height="140" rx="24" fill="none" stroke="url(#goldGrad)" stroke-width="3"/>
  <path d="M44 114 V46 H60 V76 L88 46 H108 L76 78 L112 114 H92 L60 82 V114 Z" fill="#FFFFFF"/>
  <circle cx="116" cy="48" r="10" fill="url(#goldGrad)"/>
</svg>
`);

/**
 * Daftar ID data contoh lama (legacy) agar dapat dibersihkan otomatis satu kali
 * dari cache browser lama tanpa mengganggu data riil yang sudah diinput pengguna.
 */
export const LEGACY_DEMO_IDS = {
  masterLocations: new Set(['loc-1', 'loc-2', 'loc-3', 'loc-4']),
  docsENOP: new Set(['enop-1', 'enop-2', 'enop-3']),
  docsESPPT: new Set(['esppt-1', 'esppt-2', 'esppt-3']),
  docsMerk: new Set(['merk-1', 'merk-2']),
  docsK3: new Set(['k3-1', 'k3-2', 'k3-3']),
  docsTanah: new Set(['tanah-1', 'tanah-2']),
  docsIMB: new Set(['imb-1', 'imb-2']),
  docsSLO: new Set(['slo-1', 'slo-2', 'slo-3']),
  docsTimbangan: new Set(['tmb-1', 'tmb-2', 'tmb-3']),
  userIds: new Set(['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5']),
  usernames: new Set([
    'admin.pusat',
    'siti.legal',
    'budi.pajak',
    'hendra.k3',
    'auditor.internal',
  ]),
};

/**
 * State awal bersih tanpa data contoh/dummy.
 * Hanya memuat data referensi sistem (Provinsi Indonesia, Status Bayar standar,
 * template Roles, Profil Perusahaan awal, dan akun Super Admin utama) agar aplikasi
 * langsung siap digunakan untuk data riil dari Google Sheets.
 */
export const INITIAL_APP_STATE: AppState = {
  masterLocations: [],
  masterProvinces: INITIAL_PROVINCES,
  masterStatuses: [
    {
      id: 'stat-lunas',
      namaStatus: 'Lunas',
      kategori: 'lunas',
      keterangan: 'Pembayaran pajak atau kewajiban dokumen telah lunas sepenuhnya.',
    },
    {
      id: 'stat-cicilan',
      namaStatus: 'Cicilan',
      kategori: 'cicilan',
      keterangan: 'Pembayaran sedang berjalan secara bertahap / angsuran.',
    },
    {
      id: 'stat-belum',
      namaStatus: 'Belum Bayar',
      kategori: 'belum_bayar',
      keterangan: 'Tagihan telah terbit namun belum dilakukan pembayaran.',
    },
  ],
  docsENOP: [],
  docsESPPT: [],
  docsMerk: [],
  docsK3: [],
  docsTanah: [],
  docsIMB: [],
  docsSLO: [],
  docsTimbangan: [],
  roles: [
    {
      id: 'role-superadmin',
      roleName: 'Super Administrator',
      level: 'Level 1 - Super Admin',
      deskripsi:
        'Akses penuh ke seluruh modul Data Master, Dokumen, Ekspor Laporan, dan Manajemen Role/User.',
      canManageMaster: true,
      canWriteDocs: true,
      canDeleteDocs: true,
      canExportReport: true,
      canManageUsers: true,
      canReceiveExpiryEmails: true,
    },
    {
      id: 'role-adminarsip',
      roleName: 'Admin Arsip & Legal',
      level: 'Level 2 - Admin Arsip',
      deskripsi:
        'Dapat mengelola Data Master, menambah/mengubah/menghapus Dokumen, serta mengunduh Laporan.',
      canManageMaster: true,
      canWriteDocs: true,
      canDeleteDocs: true,
      canExportReport: true,
      canManageUsers: false,
      canReceiveExpiryEmails: true,
    },
    {
      id: 'role-staff-pajak',
      roleName: 'Staff Pajak (E-NOP & E-SPPT)',
      level: 'Level 3 - Staff Operasional',
      deskripsi:
        'Bertugas menginput dan memperbarui dokumen perpajakan E-NOP dan E-SPPT serta mencetak laporan.',
      canManageMaster: false,
      canWriteDocs: true,
      canDeleteDocs: false,
      canExportReport: true,
      canManageUsers: false,
      canReceiveExpiryEmails: true,
    },
    {
      id: 'role-staff-hse',
      roleName: 'Staff HSE / K3 & HAKI',
      level: 'Level 3 - Staff Operasional',
      deskripsi:
        'Dapat menginput dan memperbarui dokumen Sertifikat K3 & Merk serta mengunduh laporan.',
      canManageMaster: false,
      canWriteDocs: true,
      canDeleteDocs: false,
      canExportReport: true,
      canManageUsers: false,
      canReceiveExpiryEmails: true,
    },
    {
      id: 'role-viewer',
      roleName: 'Auditor / Viewer Manajemen',
      level: 'Level 4 - Viewer',
      deskripsi:
        'Akses baca untuk memantau Dashboard, melihat pratinjau dokumen, dan mengekspor Laporan Excel/PDF.',
      canManageMaster: false,
      canWriteDocs: false,
      canDeleteDocs: false,
      canExportReport: true,
      canManageUsers: false,
      canReceiveExpiryEmails: false,
    },
  ],
  users: [
    {
      id: 'usr-admin',
      username: 'admin',
      email: 'hrd.kusuka@gmail.com',
      password: 'admin123',
      namaLengkap: 'HRD & Kepala Arsip (Kusuka)',
      role: 'Super Administrator',
      level: 'Level 1 - Super Admin',
      aktif: true,
      lastLogin: '-',
    },
  ],
  currentUserId: 'usr-admin',
  companyProfile: {
    namaPerusahaan: 'PT Kusuka Prima Nusantara',
    logoDataUrl: DEFAULT_COMPANY_LOGO_SVG,
    logoFileName: 'Logo_PT_Kusuka_Prima_Nusantara.svg',
  },
};
