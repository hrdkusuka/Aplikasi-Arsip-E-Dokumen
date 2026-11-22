import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  UserCheck,
  Wand2,
  Building2,
  Upload,
  Mail,
  Send,
  Bell,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Inbox,
  CalendarClock,
  KeyRound,
} from 'lucide-react';
import {
  AppState,
  CompanyProfile,
  RoleDefinition,
  UserAccount,
  UserLevel,
} from '../types';
import { DEFAULT_COMPANY_LOGO_SVG } from '../data/seedData';
import { formatIndonesianDate, evaluateDateDeadline } from '../utils/archiveHelpers';

interface SettingViewProps {
  activeSubTab: 'setting' | 'setting-company';
  onSwitchSubTab: (tab: 'setting' | 'setting-company') => void;
  state: AppState;
  canManageUsers: boolean;
  isSuperAdmin: boolean;
  onSaveUser: (user: UserAccount, isEdit: boolean) => void;
  onDeleteUser: (id: string) => void;
  onSaveRole: (role: RoleDefinition, isEdit: boolean) => void;
  onDeleteRole: (id: string) => void;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
  onSwitchCurrentUser: (userId: string) => void;
  onReloadFromGoogleSheets?: () => void;
  isReloadingFromSheets?: boolean;
  isGasConnected?: boolean;
  onClearSampleDataExceptUsers: () => void;
  onResetNonSuperAdminPasswords?: () => void;
  onResetSingleUserPassword?: (userId: string) => void;
  onClearSampleUsers?: () => void;
  onNotify?: (msg: string) => void;
}

const USER_LEVEL_OPTIONS: UserLevel[] = [
  'Level 1 - Super Admin',
  'Level 2 - Admin Arsip',
  'Level 3 - Staff Operasional',
  'Level 4 - Viewer',
];

export const SettingView: React.FC<SettingViewProps> = ({
  activeSubTab,
  onSwitchSubTab,
  state,
  canManageUsers,
  isSuperAdmin,
  onSaveUser,
  onDeleteUser,
  onSaveRole,
  onDeleteRole,
  onSaveCompanyProfile,
  onSwitchCurrentUser,
  onReloadFromGoogleSheets,
  isReloadingFromSheets = false,
  isGasConnected = false,
  onClearSampleDataExceptUsers,
  onResetNonSuperAdminPasswords,
  onResetSingleUserPassword,
  onClearSampleUsers,
  onNotify,
}) => {
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [singleUserResetConfirm, setSingleUserResetConfirm] = useState<UserAccount | null>(null);
  const [isClearSampleUsersModalOpen, setIsClearSampleUsersModalOpen] = useState(false);

  const sampleUsernames = ['admin.pusat', 'siti.legal', 'budi.pajak', 'hendra.k3', 'auditor.internal'];
  const sampleIds = ['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5'];
  const hasSampleUsers = useMemo(() => {
    return state.users.some(
      (u) =>
        (sampleUsernames.includes(u.username) || sampleIds.includes(u.id)) &&
        u.username !== 'admin'
    );
  }, [state.users]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setConfirmClearData(false);
    }
  }, [isSuperAdmin]);

  // User Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [selectedRoleName, setSelectedRoleName] = useState(
    state.roles[0]?.roleName || 'Super Administrator'
  );
  const [selectedLevel, setSelectedLevel] = useState<UserLevel>(
    state.roles[0]?.level || 'Level 1 - Super Admin'
  );
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Role Form State
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLevel, setNewRoleLevel] = useState<UserLevel>(
    'Level 3 - Staff Operasional'
  );
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleReceiveExpiryEmails, setNewRoleReceiveExpiryEmails] = useState(true);

  // Email Notification Simulation Modal State
  const [isEmailSimModalOpen, setIsEmailSimModalOpen] = useState(false);
  const [simulatedSent, setSimulatedSent] = useState(false);

  // Company Form State (Logo & Nama Perusahaan)
  const [companyName, setCompanyName] = useState(
    state.companyProfile?.namaPerusahaan || 'PT Kusuka Prima Nusantara'
  );
  const [companyLogoDataUrl, setCompanyLogoDataUrl] = useState(
    state.companyProfile?.logoDataUrl || DEFAULT_COMPANY_LOGO_SVG
  );
  const [companyLogoFileName, setCompanyLogoFileName] = useState(
    state.companyProfile?.logoFileName || 'Logo_PT_Kusuka_Prima_Nusantara.svg'
  );

  useEffect(() => {
    setCompanyName(
      state.companyProfile?.namaPerusahaan || 'PT Kusuka Prima Nusantara'
    );
    setCompanyLogoDataUrl(
      state.companyProfile?.logoDataUrl || DEFAULT_COMPANY_LOGO_SVG
    );
    setCompanyLogoFileName(
      state.companyProfile?.logoFileName || 'Logo_PT_Kusuka_Prima_Nusantara.svg'
    );
  }, [state.companyProfile]);

  // Active Users who will receive deadline notification emails
  const emailRecipientRoles = useMemo(() => {
    return new Set(
      state.roles.filter((r) => r.canReceiveExpiryEmails).map((r) => r.roleName)
    );
  }, [state.roles]);

  const emailRecipientUsers = useMemo(() => {
    return state.users.filter(
      (u) => emailRecipientRoles.has(u.role) && u.email && u.aktif !== false
    );
  }, [state.users, emailRecipientRoles]);

  // Documents nearing expiry or overdue across E-SPPT, Merk, and K3
  const expiringDocs = useMemo(() => {
    const list: {
      category: string;
      noArsip: string;
      title: string;
      dueDate: string;
      daysDiff: number;
      status: string;
      state: 'overdue' | 'warning' | 'active';
    }[] = [];

    // 1. E-SPPT
    state.docsESPPT.forEach((d) => {
      const evalRes = evaluateDateDeadline(d.jatuhTempo);
      if (evalRes.state === 'overdue' || evalRes.state === 'warning') {
        list.push({
          category: 'E-SPPT',
          noArsip: d.noArsip,
          title: `NOP ${d.nop} — ${d.namaWajibPajak || d.namaAlamatWajibPajak || '-'}`,
          dueDate: d.jatuhTempo,
          daysDiff: evalRes.daysDiff,
          status: evalRes.label,
          state: evalRes.state,
        });
      }
    });

    // 2. Sertifikat Merk
    state.docsMerk.forEach((d) => {
      if (d.tglJatuhTempoKepemilikan) {
        const evalRes = evaluateDateDeadline(d.tglJatuhTempoKepemilikan);
        if (evalRes.state === 'overdue' || evalRes.state === 'warning') {
          list.push({
            category: 'Sertifikat Merk',
            noArsip: d.noArsip,
            title: `Reg: ${d.noPendaftaran} — ${d.etiketMerk} (${d.nama})`,
            dueDate: d.tglJatuhTempoKepemilikan,
            daysDiff: evalRes.daysDiff,
            status: evalRes.label,
            state: evalRes.state,
          });
        }
      }
    });

    // 3. Sertifikat K3
    state.docsK3.forEach((d) => {
      const evalRes = evaluateDateDeadline(d.berlakuSampaiTanggal);
      if (evalRes.state === 'overdue' || evalRes.state === 'warning') {
        list.push({
          category: 'Sertifikat K3',
          noArsip: d.noArsip,
          title: `${d.jenisObjekK3} (${d.merk} ${d.type}) — ${d.namaPerusahaan}`,
          dueDate: d.berlakuSampaiTanggal,
          daysDiff: evalRes.daysDiff,
          status: evalRes.label,
          state: evalRes.state,
        });
      }
    });

    // 4. Sertifikat Laik Operasi (SLO)
    (state.docsSLO || []).forEach((d) => {
      const evalRes = evaluateDateDeadline(d.tanggalBerlaku);
      if (evalRes.state === 'overdue' || evalRes.state === 'warning') {
        list.push({
          category: 'Sertifikat SLO',
          noArsip: d.noArsip,
          title: `${d.jenisSlo} (${d.merekPeralatan} ${d.tipePeralatan} ${d.kapasitasKva} kVA) — ${d.namaPerusahaan}`,
          dueDate: d.tanggalBerlaku,
          daysDiff: evalRes.daysDiff,
          status: evalRes.label,
          state: evalRes.state,
        });
      }
    });

    return list.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [state.docsESPPT, state.docsMerk, state.docsK3, state.docsSLO]);

  const handleUploadCompanyLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Jika file SVG (vektor), baca langsung
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCompanyLogoDataUrl(reader.result);
          setCompanyLogoFileName(file.name);
          if (onNotify) onNotify(`Logo SVG "${file.name}" berhasil dimuat.`);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
      return;
    }

    // Jika file gambar bitmap (PNG/JPG/WebP), optimasi/kompres ke canvas
    // agar ukuran string base64 selalu ringkas (< 38KB) sehingga cepat tersinkron ke HP & Google Sheets
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const renderScaled = (maxW: number, maxH: number, fillWhiteBg = false) => {
          let width = img.width || maxW;
          let height = img.height || maxH;
          const ratio = Math.min(maxW / width, maxH / height, 1);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          if (fillWhiteBg) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0, width, height);
          return canvas;
        };

        const MAX_DATA_URL_LEN = 38_000;
        let optimizedDataUrl = '';

        const primaryCanvas = renderScaled(320, 160, false);
        if (primaryCanvas) {
          optimizedDataUrl = primaryCanvas.toDataURL('image/png');
          if (optimizedDataUrl.length > MAX_DATA_URL_LEN) {
            const webpCandidate = primaryCanvas.toDataURL('image/webp', 0.85);
            if (webpCandidate.startsWith('data:image/webp') && webpCandidate.length < optimizedDataUrl.length) {
              optimizedDataUrl = webpCandidate;
            }
          }
          if (optimizedDataUrl.length > MAX_DATA_URL_LEN) {
            const smallerCanvas = renderScaled(220, 110, false);
            if (smallerCanvas) {
              const smallPng = smallerCanvas.toDataURL('image/png');
              if (smallPng.length < optimizedDataUrl.length) {
                optimizedDataUrl = smallPng;
              }
            }
          }
          if (optimizedDataUrl.length > MAX_DATA_URL_LEN) {
            const jpegCanvas = renderScaled(240, 120, true);
            if (jpegCanvas) {
              optimizedDataUrl = jpegCanvas.toDataURL('image/jpeg', 0.82);
            }
          }
        }

        if (optimizedDataUrl) {
          setCompanyLogoDataUrl(optimizedDataUrl);
          setCompanyLogoFileName(file.name);
          if (onNotify) {
            onNotify(
              `Logo "${file.name}" berhasil dioptimasi (${Math.round(optimizedDataUrl.length / 1024)} KB). Klik "Simpan Profil Company" agar tampil di Laptop & HP.`
            );
          }
        }
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetDefaultLogo = () => {
    setCompanyLogoDataUrl(DEFAULT_COMPANY_LOGO_SVG);
    setCompanyLogoFileName('Logo_PT_Kusuka_Prima_Nusantara.svg');
    if (onNotify) onNotify('Logo direset ke logo bawaan.');
  };

  const handleSaveCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = companyName.trim();
    if (!cleanName) return;

    onSaveCompanyProfile({
      namaPerusahaan: cleanName,
      logoDataUrl: companyLogoDataUrl || DEFAULT_COMPANY_LOGO_SVG,
      logoFileName: companyLogoFileName,
    });
  };

  const handleEditUser = (user: UserAccount) => {
    setEditingUserId(user.id);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(user.password);
    setNamaLengkap(user.namaLengkap);
    setSelectedRoleName(user.role);
    setSelectedLevel(user.level);
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setNamaLengkap('');
    setSelectedRoleName(state.roles[0]?.roleName || 'Super Administrator');
    setSelectedLevel(state.roles[0]?.level || 'Level 1 - Super Admin');
  };

  const handleRoleChange = (roleName: string) => {
    setSelectedRoleName(roleName);
    const matched = state.roles.find((r) => r.roleName === roleName);
    if (matched) {
      setSelectedLevel(matched.level);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    onSaveUser(
      {
        id: editingUserId || `usr-${Date.now()}`,
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        namaLengkap: namaLengkap.trim() || username.trim(),
        role: selectedRoleName,
        level: selectedLevel,
        aktif: true,
        lastLogin: editingUserId
          ? state.users.find((u) => u.id === editingUserId)?.lastLogin || 'Belum pernah login'
          : 'Belum pernah login',
      },
      Boolean(editingUserId)
    );
    resetUserForm();
  };

  const handleEditRole = (role: RoleDefinition) => {
    setEditingRoleId(role.id);
    setNewRoleName(role.roleName);
    setNewRoleLevel(role.level);
    setNewRoleDesc(role.deskripsi);
    setNewRoleReceiveExpiryEmails(Boolean(role.canReceiveExpiryEmails));
  };

  const resetRoleForm = () => {
    setEditingRoleId(null);
    setNewRoleName('');
    setNewRoleLevel('Level 3 - Staff Operasional');
    setNewRoleDesc('');
    setNewRoleReceiveExpiryEmails(true);
  };

  const handleSaveRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const isLevel1 = newRoleLevel.startsWith('Level 1');
    const isLevel2 = newRoleLevel.startsWith('Level 2');
    const isLevel3 = newRoleLevel.startsWith('Level 3');

    const existing = editingRoleId
      ? state.roles.find((r) => r.id === editingRoleId)
      : undefined;

    onSaveRole(
      {
        id: editingRoleId || `role-${Date.now()}`,
        roleName: newRoleName.trim(),
        level: newRoleLevel,
        deskripsi:
          newRoleDesc.trim() || `Konfigurasi otorisasi untuk ${newRoleName.trim()}`,
        canManageMaster: existing ? existing.canManageMaster : isLevel1 || isLevel2,
        canWriteDocs: existing
          ? existing.canWriteDocs
          : isLevel1 || isLevel2 || isLevel3,
        canDeleteDocs: existing ? existing.canDeleteDocs : isLevel1 || isLevel2,
        canExportReport: existing ? existing.canExportReport : true,
        canManageUsers: existing ? existing.canManageUsers : isLevel1,
        canReceiveExpiryEmails: newRoleReceiveExpiryEmails,
      },
      Boolean(editingRoleId)
    );
    resetRoleForm();
  };

  const toggleRolePermission = (
    role: RoleDefinition,
    field:
      | 'canManageMaster'
      | 'canWriteDocs'
      | 'canDeleteDocs'
      | 'canExportReport'
      | 'canManageUsers'
      | 'canReceiveExpiryEmails'
  ) => {
    if (!canManageUsers) return;
    onSaveRole(
      {
        ...role,
        [field]: !role[field],
      },
      true
    );
  };

  // Trigger simulated email send
  const handleSendSimulatedEmail = () => {
    setSimulatedSent(true);
    const emails = emailRecipientUsers.map((u) => u.email).join(', ');
    const msg = `Simulasi email berhasil dikirimkan ke ${emailRecipientUsers.length} alamat email terdaftar: ${emails}`;
    if (onNotify) {
      onNotify(msg);
    }
    setTimeout(() => {
      setSimulatedSent(false);
      setIsEmailSimModalOpen(false);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Menu Switcher */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {activeSubTab === 'setting'
              ? 'Setting — Roles & Users'
              : 'Setting — Company (Logo & Nama Perusahaan)'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {activeSubTab === 'setting'
              ? 'Kelola akun pengguna (Username, Email, Password), Role, Level, dan hak notifikasi jatuh tempo ke email terdaftar.'
              : 'Atur Logo dan Nama Perusahaan yang ditampilkan pada Portal Awal di atas Username dan Password.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Interactive Segmented Control for Setting Sub-Menu */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onSwitchSubTab('setting')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'setting'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-blue-700" />
              Roles &amp; Users
            </button>
            <button
              type="button"
              onClick={() => onSwitchSubTab('setting-company')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'setting-company'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-blue-700" />
              Company
            </button>
          </div>

          {isSuperAdmin ? (
            !confirmClearData ? (
              <button
                type="button"
                onClick={() => setConfirmClearData(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 whitespace-nowrap shrink-0 cursor-pointer"
                title="Khusus Super Admin: Hapus seluruh data dokumen & lokasi arsip tanpa menghapus Roles & Users"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                Kosongkan Data Arsip (Khusus Super Admin)
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1">
                <span className="text-[11px] font-semibold text-rose-800 whitespace-nowrap">
                  Yakin kosongkan dokumen?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClearSampleDataExceptUsers();
                    setConfirmClearData(false);
                  }}
                  className="rounded bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 whitespace-nowrap cursor-pointer"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearData(false)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-400 whitespace-nowrap shrink-0"
              title="Menu Kosongkan Data hanya dapat dilakukan oleh akun dengan otorisasi Super Admin (Level 1)"
            >
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              Kosongkan Data (Khusus Super Admin)
            </button>
          )}

          {isSuperAdmin && onReloadFromGoogleSheets && (
            <button
              type="button"
              disabled={isReloadingFromSheets}
              onClick={onReloadFromGoogleSheets}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              title={
                isGasConnected
                  ? 'Muat ulang data riil terbaru langsung dari Google Sheets Anda'
                  : 'Hubungkan URL Apps Script di menu Setting > Apps Script & Deploy terlebih dahulu'
              }
            >
              <RotateCcw
                className={`h-3.5 w-3.5 text-emerald-700 ${isReloadingFromSheets ? 'animate-spin' : ''}`}
              />
              {isReloadingFromSheets
                ? 'Memuat dari Google Sheets...'
                : 'Muat Data Google Sheets'}
            </button>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* SUB-MENU 2: COMPANY (LOGO & NAMA PERUSAHAAN)                      */}
      {/* ================================================================= */}
      {activeSubTab === 'setting-company' && (
        <div className="max-w-4xl">
          {/* Card Container sesuai desain referensi */}
          <div className="rounded-2xl border border-blue-200/90 bg-[#f8fbff] p-7 md:p-8 shadow-xs">
            {/* Header */}
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-blue-100/90">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Pengaturan Profil &amp; Logo Perusahaan
              </h2>
            </div>

            <form onSubmit={handleSaveCompanySubmit} className="mt-6 space-y-6">
              {/* Field 1: Nama Perusahaan */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Nama Perusahaan (Ditampilkan di Sidebar, Portal Awal, Dashboard, E-Book &amp; Header Laporan)
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="PT Kusuka Prima Nusantara"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
                />
              </div>

              {/* Field 2: Unggah Logo */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Unggah File Logo Perusahaan (SVG, PNG, JPG)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span>Pilih Logo Baru...</span>
                    <input
                      type="file"
                      accept="image/svg+xml,image/png,image/jpeg,image/webp,image/*"
                      onChange={handleUploadCompanyLogo}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetDefaultLogo}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4 text-slate-600" />
                    <span>Reset Logo Bawaan</span>
                  </button>
                </div>
              </div>

              {/* Button Simpan */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Simpan Perubahan Company</span>
                </button>
              </div>
            </form>

            {/* Pratinjau Logo & Identitas Aktif */}
            <div className="mt-8 border-t border-blue-100/90 pt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="text-xs font-semibold text-slate-500">Logo Aktif Saat Ini:</span>
                <div className="flex h-12 w-20 items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xs">
                  <img
                    src={companyLogoDataUrl || DEFAULT_COMPANY_LOGO_SVG}
                    alt="Logo Perusahaan"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">{companyName || 'PT Kusuka Prima Nusantara'}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{companyLogoFileName}</div>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">
                Nama &amp; logo otomatis diterapkan ke Sidebar, Portal Awal, Dashboard, E-Book, Laporan Excel &amp; PDF, serta Google Sheets
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-MENU 1: ROLES & USERS                                         */}
      {/* ================================================================= */}
      {activeSubTab === 'setting' && (
        <>
          {/* Section 1: User Accounts Management Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Form Input User */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/35 p-5 lg:col-span-4">
              <div className="flex items-center gap-2 border-b border-blue-200 pb-3">
                <UserPlus className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingUserId ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna'}
                </h2>
              </div>

              <form onSubmit={handleSaveUserSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Username (Untuk Login)
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: hrd.kusuka atau staff.pajak"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Lengkap Pegawai
                  </label>
                  <input
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Contoh: Rendra Pradana, S.H."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Resmi (Untuk Penerimaan Notifikasi Jatuh Tempo)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: hrd.kusuka@gmail.com"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Email ini akan menerima pengingat otomatis jika Role akun diizinkan menerima notifikasi jatuh tempo.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password Login
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:underline"
                    >
                      <Wand2 className="h-3 w-3" />
                      Acak Sandi
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password akun..."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Pilih Role (Jabatan)
                  </label>
                  <select
                    value={selectedRoleName}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    {state.roles.map((r, idx) => (
                      <option key={`${r.id}-${idx}`} value={r.roleName}>
                        {r.roleName} ({r.level.split(' - ')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Level Otorisasi
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value as UserLevel)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    {USER_LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!canManageUsers}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" />
                    {editingUserId ? 'Simpan Perubahan' : 'Simpan User Baru'}
                  </button>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={resetUserForm}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Tabel Daftar User Accounts */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Daftar Akun Pengguna Terdaftar ({state.users.length} Akun)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tabel lengkap Username, Email, Password, Roles, dan Level. Klik ikon mata untuk melihat password atau klik &ldquo;Gunakan Akun&rdquo; untuk beralih sesi.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {hasSampleUsers && (canManageUsers || isSuperAdmin) && onClearSampleUsers && (
                    <button
                      type="button"
                      onClick={() => setIsClearSampleUsersModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                      title="Hapus seluruh akun pengguna contoh bawaan"
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                      Hapus Akun Contoh
                    </button>
                  )}
                  {(canManageUsers || isSuperAdmin) && onResetNonSuperAdminPasswords && (
                    <button
                      type="button"
                      onClick={() => setIsResetConfirmModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-400 whitespace-nowrap shrink-0 shadow-2xs cursor-pointer"
                      title="Reset semua password akun level 2, 3, dan 4 menjadi password123"
                    >
                      <KeyRound className="h-4 w-4 text-amber-600" />
                      Reset Password Non-Super Admin
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 pr-3 font-semibold">Username</th>
                      <th className="px-3 py-2.5 font-semibold">Email</th>
                      <th className="px-3 py-2.5 font-semibold">Password</th>
                      <th className="px-3 py-2.5 font-semibold">Roles</th>
                      <th className="px-3 py-2.5 font-semibold">Level</th>
                      <th className="px-3 py-2.5 font-semibold">Sesi</th>
                      <th className="py-2.5 pl-3 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.users.map((u) => {
                      const isCurrent = u.id === state.currentUserId;
                      const isPassVisible = Boolean(showPasswords[u.id]);
                      const roleObj = state.roles.find((r) => r.roleName === u.role);
                      const willReceiveEmail = Boolean(roleObj?.canReceiveExpiryEmails && u.email);

                      return (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-3 pr-3">
                            <div className="font-mono font-semibold text-slate-900">
                              {u.username}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {u.namaLengkap}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{u.email || '-'}</span>
                              {willReceiveEmail && (
                                <span
                                  className="inline-flex rounded-full bg-blue-100 p-0.5 text-blue-700"
                                  title="Akun ini terdaftar menerima email jatuh tempo sesuai Role"
                                >
                                  <Mail className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-800 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <span>
                                {isPassVisible ? u.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    [u.id]: !prev[u.id],
                                  }))
                                }
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Tampilkan / Sembunyikan Password"
                              >
                                {isPassVisible ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-900">
                            {u.role}
                          </td>
                          <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                            {u.level}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {isCurrent ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                <UserCheck className="h-3.5 w-3.5" />
                                Aktif
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onSwitchCurrentUser(u.id)}
                                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                Gunakan Akun
                              </button>
                            )}
                          </td>
                          <td className="py-3 pl-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {u.level !== 'Level 1 - Super Admin' && (canManageUsers || isSuperAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => setSingleUserResetConfirm(u)}
                                  className="rounded p-1.5 text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition-colors cursor-pointer"
                                  title={`Reset password @${u.username} menjadi: password123`}
                                >
                                  <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={!canManageUsers && !isSuperAdmin}
                                onClick={() => handleEditUser(u)}
                                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700 disabled:opacity-40 cursor-pointer"
                                title="Edit User"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={(!canManageUsers && !isSuperAdmin) || isCurrent || state.users.length <= 1}
                                onClick={() => onDeleteUser(u.id)}
                                className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 cursor-pointer"
                                title="Hapus User"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Roles & Level Matrix Configuration */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-700" />
                  <h2 className="text-base font-bold text-slate-900">
                    Matriks Konfigurasi Roles &amp; Level Hak Akses ({state.roles.length} Role)
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Kelola daftar Role beserta Level, hak akses modul, serta izin <strong>menerima informasi jatuh tempo ke email yang terdaftar</strong>.
                </p>
              </div>

              {canManageUsers && (
                <form onSubmit={handleSaveRoleSubmit} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Nama Role..."
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
                  />
                  <select
                    value={newRoleLevel}
                    onChange={(e) => setNewRoleLevel(e.target.value as UserLevel)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    {USER_LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="Deskripsi singkat role..."
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
                  />

                  {/* Toggle Checkbox Terima Email di Form */}
                  <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none">
                    <input
                      type="checkbox"
                      checked={newRoleReceiveExpiryEmails}
                      onChange={(e) => setNewRoleReceiveExpiryEmails(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    <span>Terima Email Jatuh Tempo</span>
                  </label>

                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {editingRoleId ? 'Simpan Role' : '+ Tambah Role'}
                  </button>
                  {editingRoleId && (
                    <button
                      type="button"
                      onClick={resetRoleForm}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </form>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">Nama Role</th>
                    <th className="px-4 py-2.5 font-semibold">Level</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Kelola Data Master</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Input / Edit Dokumen</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Hapus Dokumen</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Export Excel/PDF</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Kelola Setting User</th>
                    <th className="px-4 py-2.5 text-center font-bold text-blue-900 bg-blue-50/70 border-x border-blue-200">
                      <div className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-blue-700" />
                        <span>Menerima Email Jatuh Tempo</span>
                      </div>
                    </th>
                    <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.roles.map((r, idx) => (
                    <tr key={`${r.id}-${idx}`} className="hover:bg-slate-50">
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-slate-900">{r.roleName}</div>
                        <div className="text-[11px] text-slate-500">{r.deskripsi}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        {r.level}
                      </td>
                      {(
                        [
                          'canManageMaster',
                          'canWriteDocs',
                          'canDeleteDocs',
                          'canExportReport',
                          'canManageUsers',
                        ] as const
                      ).map((permKey) => (
                        <td key={permKey} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            disabled={!canManageUsers}
                            checked={r[permKey]}
                            onChange={() => toggleRolePermission(r, permKey)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      ))}

                      {/* Kolom Baru: Menerima Email Jatuh Tempo */}
                      <td className="px-4 py-3 text-center bg-blue-50/20 border-x border-blue-100">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <input
                            type="checkbox"
                            disabled={!canManageUsers}
                            checked={Boolean(r.canReceiveExpiryEmails)}
                            onChange={() => toggleRolePermission(r, 'canReceiveExpiryEmails')}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            title={
                              r.canReceiveExpiryEmails
                                ? 'Aktif: User dengan Role ini akan menerima email jatuh tempo ke alamat email terdaftar'
                                : 'Non-aktif: User dengan Role ini tidak menerima email jatuh tempo'
                            }
                          />
                          {r.canReceiveExpiryEmails ? (
                            <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              <Check className="h-2.5 w-2.5" />
                              Menerima Email
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              Tidak
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 pl-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!canManageUsers}
                            onClick={() => handleEditRole(r)}
                            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700 disabled:opacity-40 cursor-pointer"
                            title="Edit Role"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canManageUsers || state.roles.length <= 1}
                            onClick={() => onDeleteRole(r.id)}
                            className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 cursor-pointer"
                            title="Hapus Role"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Panel Penerima Notifikasi Informasi Jatuh Tempo ke Email Terdaftar */}
          <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-blue-700 p-2.5 text-white shadow-xs shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Penerima Informasi Jatuh Tempo ke Email Terdaftar
                    </h2>
                    <span className="rounded bg-blue-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-blue-800">
                      {emailRecipientUsers.length} Akun Terdaftar
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Sistem mendeteksi seluruh akun pengguna yang Role-nya memiliki izin <strong>&ldquo;Menerima Email Jatuh Tempo&rdquo;</strong>. Email pengingat otomatis akan dikirimkan ke alamat email terdaftar berikut untuk dokumen yang mendekati jatuh tempo (&le; 30 hari).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {hasSampleUsers && (canManageUsers || isSuperAdmin) && onClearSampleUsers && (
                  <button
                    type="button"
                    onClick={() => setIsClearSampleUsersModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                    title="Hapus akun contoh dari daftar penerima email"
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                    Hapus Akun Contoh Penerima Email
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEmailSimModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  Simulasi &amp; Uji Kirim Email
                </button>
              </div>
            </div>

            {/* Recipient Cards Grid */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {emailRecipientUsers.length === 0 ? (
                <div className="col-span-full rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                  Belum ada akun dengan Role yang diizinkan menerima email jatuh tempo. Silakan centang &ldquo;Menerima Email Jatuh Tempo&rdquo; pada tabel Role di atas.
                </div>
              ) : (
                emailRecipientUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 hover:bg-white hover:border-blue-300 transition-all"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 font-bold text-xs text-white">
                      {u.namaLengkap.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {u.namaLengkap}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-emerald-800">
                            Siap Terima
                          </span>
                          {(canManageUsers || isSuperAdmin) && u.username !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => onDeleteUser(u.id)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              title={`Hapus akun ${u.namaLengkap} dari daftar pengguna`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="font-mono text-[11px] font-medium text-blue-700 truncate">
                        ✉ {u.email}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="font-medium text-slate-700">{u.role}</span>
                        <span>·</span>
                        <span>{u.level.split(' - ')[0]}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Expiring Documents Summary Alert */}
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5 text-xs text-amber-900">
                <CalendarClock className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  Terdapat <strong>{expiringDocs.length} Dokumen</strong> yang memiliki tanggal jatuh tempo dalam 30 hari ke depan atau telah terlewat (E-SPPT, Sertifikat Merk, &amp; Sertifikat K3).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailSimModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 whitespace-nowrap self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                Lihat Pratinjau Pesan Email
              </button>
            </div>
          </div>

          {/* Email Simulation Modal */}
          {isEmailSimModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-5 backdrop-blur-xs">
              <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-blue-700 p-2 text-white">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Simulasi Kirim Notifikasi Jatuh Tempo ke Email Terdaftar
                      </h3>
                      <p className="text-xs text-slate-500">
                        Pratinjau pesan email resmi yang dikirimkan ke {emailRecipientUsers.length} akun pengguna terdaftar.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEmailSimModalOpen(false)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Simulated Email Envelope */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Email Meta Bar */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2 font-mono">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-500 w-20 shrink-0">Dari:</span>
                      <span className="text-slate-800">
                        Sistem Otomatis Arsip Dokumen — {state.companyProfile.namaPerusahaan || 'Perusahaan'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-500 w-20 shrink-0">Kepada:</span>
                      <div className="flex flex-wrap gap-1 text-blue-700">
                        {emailRecipientUsers.map((u) => (
                          <span
                            key={u.id}
                            className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-900"
                          >
                            {u.namaLengkap} &lt;{u.email}&gt;
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-500 w-20 shrink-0">Subjek:</span>
                      <span className="font-bold text-slate-900">
                        [PENGINGAT RESMI] Dokumen Arsip Jatuh Tempo Dalam 30 Hari — {state.companyProfile.namaPerusahaan || 'Perusahaan'}
                      </span>
                    </div>
                  </div>

                  {/* Email Body Content */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs text-xs space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      {state.companyProfile.logoDataUrl ? (
                        <img
                          src={state.companyProfile.logoDataUrl}
                          alt={state.companyProfile.namaPerusahaan || 'Logo'}
                          className="h-6 w-6 rounded object-contain border border-slate-200 bg-white p-0.5"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                          {(state.companyProfile.namaPerusahaan || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-sm text-slate-900">
                        {state.companyProfile.namaPerusahaan || 'Perusahaan'}
                      </span>
                    </div>

                    <p className="text-slate-700">
                      Yth. Bapak/Ibu Tim Pengelola Arsip &amp; Pimpinan yang terdaftar,
                    </p>
                    <p className="text-slate-600">
                      Sistem Manajemen Arsip Dokumen memberitahukan bahwa terdapat dokumen penting yang memiliki tanggal jatuh tempo dalam 30 hari ke depan atau telah terlewat. Mohon untuk segera ditindaklanjuti:
                    </p>

                    {/* Table of Due Documents */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <th className="py-2 px-3">Kategori</th>
                            <th className="py-2 px-3">No Arsip</th>
                            <th className="py-2 px-3">Keterangan</th>
                            <th className="py-2 px-3">Jatuh Tempo</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {expiringDocs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-slate-400">
                                Tidak ada dokumen yang jatuh tempo dalam 30 hari ke depan.
                              </td>
                            </tr>
                          ) : (
                            expiringDocs.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-semibold text-blue-900">
                                  {item.category}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                  {item.noArsip}
                                </td>
                                <td className="py-2 px-3 text-slate-700">
                                  {item.title}
                                </td>
                                <td className="py-2 px-3 font-mono text-slate-800 whitespace-nowrap">
                                  {formatIndonesianDate(item.dueDate)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span
                                    className={`inline-block rounded px-2 py-0.5 font-semibold text-[10px] whitespace-nowrap ${
                                      item.state === 'overdue'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-slate-500 text-[11px] pt-2">
                      Pemberitahuan ini dikirimkan secara otomatis kepada pengguna dengan Role yang berhak menerima informasi jatuh tempo di Sistem Arsip Dokumen.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
                  <span className="text-xs text-slate-500">
                    Total: <strong>{emailRecipientUsers.length} Email Penerima</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEmailSimModalOpen(false)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={handleSendSimulatedEmail}
                      disabled={simulatedSent || emailRecipientUsers.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                    >
                      {simulatedSent ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          Email Terkirim!
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Kirim Sekarang ke Semua Email Terdaftar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Konfirmasi Reset Password Massal Non-Super Admin */}
          {isResetConfirmModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Konfirmasi Reset Password Massal
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Apakah Anda yakin ingin mereset password <strong>seluruh akun pengguna non-Super Admin</strong> (Level 2, 3, dan 4) menjadi kata sandi default:
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950 space-y-2">
                  <div className="font-mono font-bold text-center text-sm tracking-wider bg-white py-2 rounded-lg border border-amber-300 text-amber-900 shadow-2xs">
                    password123
                  </div>
                  <div className="text-[11px] text-amber-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Akun Super Admin (<strong>admin</strong> &amp; <strong>admin.pusat</strong>) TETAP AMAN dan TIDAK diubah.</span>
                    </div>
                    <div className="text-slate-600 pt-0.5">
                      • Akun yang akan direset: siti.legal, budi.pajak, hendra.k3, auditor.internal, dan akun staf lainnya.
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmModalOpen(false)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onResetNonSuperAdminPasswords) {
                        onResetNonSuperAdminPasswords();
                      }
                      setIsResetConfirmModalOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Ya, Reset Semua Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Konfirmasi Reset Password Akun Tunggal */}
          {singleUserResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Reset Password Akun
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      @{singleUserResetConfirm.username} ({singleUserResetConfirm.role})
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                  Password akun <strong>{singleUserResetConfirm.namaLengkap}</strong> akan diatur ulang menjadi:
                </p>

                <div className="mt-2 font-mono font-bold text-center text-sm tracking-wider bg-slate-100 py-2 rounded-lg border border-slate-300 text-slate-900">
                  password123
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSingleUserResetConfirm(null)}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onResetSingleUserPassword) {
                        onResetSingleUserPassword(singleUserResetConfirm.id);
                      }
                      setSingleUserResetConfirm(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-800 cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Reset ke password123
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Konfirmasi Hapus Semua Akun Contoh */}
          {isClearSampleUsersModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Hapus Seluruh Akun Contoh
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Tindakan ini akan menghapus akun-akun pengguna contoh bawaan (<code>admin.pusat</code>, <code>siti.legal</code>, <code>budi.pajak</code>, <code>hendra.k3</code>, <code>auditor.internal</code>) secara permanen.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-950 space-y-1.5">
                  <div className="font-semibold text-rose-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Akun Super Admin Utama (<strong>admin</strong> / <strong>hrd.kusuka@gmail.com</strong>) TETAP AMAN dan TIDAK dihapus.</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pt-1">
                    Akun contoh yang dihapus juga otomatis hilang dari tabel pengguna dan daftar Penerima Email Informasi Jatuh Tempo.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsClearSampleUsersModalOpen(false)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearSampleUsers) {
                        onClearSampleUsers();
                      }
                      setIsClearSampleUsersModalOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Ya, Hapus Semua Akun Contoh
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
