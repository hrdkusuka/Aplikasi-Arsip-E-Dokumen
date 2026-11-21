import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Database,
  FileText,
  FileSpreadsheet,
  Settings,
  FolderArchive,
  MapPin,
  Building2,
  CreditCard,
  Award,
  HardHat,
  Menu,
  X,
  LogOut,
  LogIn,
  CheckCircle2,
  KeyRound,
  Printer,
  Zap,
  Scale,
  BookOpen,
  Code,
} from 'lucide-react';
import {
  ActiveView,
  AppState,
  CompanyProfile,
  DocENOP,
  DocESPPT,
  DocMerk,
  DocK3,
  DocTanah,
  DocIMB,
  DocSLO,
  DocUjiTimbangan,
  MasterArchiveLocation,
  MasterPaymentStatus,
  MasterProvince,
  RoleDefinition,
  UserAccount,
} from './types';
import { INITIAL_APP_STATE, LEGACY_DEMO_IDS } from './data/seedData';
import { DashboardView } from './components/DashboardView';
import { MasterDataView } from './components/MasterDataView';
import { DocumentViews } from './components/DocumentViews';
import { ReportView } from './components/ReportView';
import { SettingView } from './components/SettingView';
import { LandingLoginPage } from './components/LandingLoginPage';
import { EBookView } from './components/EBookView';
import { AppsScriptStorageView } from './components/AppsScriptStorageView';
import {
  GasConfig,
  getGasConfig,
  isValidAppsScriptUrl,
  loadStateFromGas,
  saveGasConfig,
  syncStateToGas,
} from './services/appsScriptStorage';

const STORAGE_KEY = 'arsip_dokumen_enterprise_v1';
const LEGACY_DEMO_CLEANED_KEY = 'arsip_legacy_demo_cleaned_v1';
const SESSION_AUTH_KEY = 'arsip_auth_session_active_v1';
const SESSION_VIEW_KEY = 'arsip_active_view_v1';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.masterLocations)) {
          if (Array.isArray(parsed.users)) {
            const existingUsers: UserAccount[] = parsed.users.map(
              (u: UserAccount, idx: number) => ({
                ...u,
                email:
                  u.email ||
                  INITIAL_APP_STATE.users.find((seedU) => seedU.id === u.id)?.email ||
                  `${u.username || `user${idx + 1}`}@kusukaprima.co.id`,
              })
            );
            // If all users were deleted, keep at least the primary Super Admin so system is not locked out
            if (existingUsers.length === 0) {
              existingUsers.push(INITIAL_APP_STATE.users[0]);
            }
            parsed.users = existingUsers;
            if (!existingUsers.some((u) => u.id === parsed.currentUserId)) {
              parsed.currentUserId = existingUsers[0]?.id || 'usr-admin';
            }
          }
          if (Array.isArray(parsed.roles)) {
            const seenIds = new Set<string>();
            const seenRoleNames = new Set<string>();
            const uniqueRoles: RoleDefinition[] = [];

            for (let i = 0; i < parsed.roles.length; i++) {
              const r = parsed.roles[i];
              if (!r || !r.roleName) continue;
              const nameLower = r.roleName.toLowerCase().trim();
              if (seenRoleNames.has(nameLower)) continue;
              seenRoleNames.add(nameLower);

              let roleId = r.id || `role-${i}`;
              if (seenIds.has(roleId)) {
                roleId = `${roleId}-${i + 1}`;
              }
              seenIds.add(roleId);

              uniqueRoles.push({
                ...r,
                id: roleId,
                canReceiveExpiryEmails:
                  typeof r.canReceiveExpiryEmails === 'boolean'
                    ? r.canReceiveExpiryEmails
                    : r.level !== 'Level 4 - Viewer',
              });
            }

            for (const seedRole of INITIAL_APP_STATE.roles) {
              const nameLower = seedRole.roleName.toLowerCase().trim();
              if (!seenRoleNames.has(nameLower)) {
                let roleId = seedRole.id;
                if (seenIds.has(roleId)) {
                  roleId = `${roleId}-seed`;
                }
                seenIds.add(roleId);
                seenRoleNames.add(nameLower);
                uniqueRoles.push({
                  ...seedRole,
                  id: roleId,
                });
              }
            }
            parsed.roles = uniqueRoles;
          }
          if (Array.isArray(parsed.docsESPPT)) {
            parsed.docsESPPT = parsed.docsESPPT.map((sppt: DocESPPT) => {
              if (!sppt.namaWajibPajak || !sppt.alamatWajibPajak) {
                const raw = sppt.namaAlamatWajibPajak || '';
                const parts = raw.split('—').map((s: string) => s.trim());
                return {
                  ...sppt,
                  namaWajibPajak: sppt.namaWajibPajak || parts[0] || '-',
                  alamatWajibPajak:
                    sppt.alamatWajibPajak || parts[1] || sppt.letakObjekPajak || '-',
                };
              }
              return sppt;
            });
          }
          if (Array.isArray(parsed.docsENOP)) {
            const espptList: DocESPPT[] = Array.isArray(parsed.docsESPPT)
              ? parsed.docsESPPT
              : INITIAL_APP_STATE.docsESPPT;
            parsed.docsENOP = parsed.docsENOP.map((enop: DocENOP) => {
              const matchedSppt = espptList.find(
                (s) => s.id === enop.espptId || s.nop === enop.nop
              );
              return {
                ...enop,
                espptId: enop.espptId || matchedSppt?.id || '',
                namaWajibPajak:
                  enop.namaWajibPajak ||
                  matchedSppt?.namaWajibPajak ||
                  enop.namaNop ||
                  '-',
                alamatWajibPajak:
                  enop.alamatWajibPajak ||
                  matchedSppt?.alamatWajibPajak ||
                  enop.lokasiAlamat ||
                  '-',
              };
            });
          }
          if (!Array.isArray(parsed.docsTanah)) {
            parsed.docsTanah = INITIAL_APP_STATE.docsTanah;
          }
          if (!Array.isArray(parsed.docsIMB)) {
            parsed.docsIMB = INITIAL_APP_STATE.docsIMB;
          }
          if (!Array.isArray(parsed.docsSLO)) {
            parsed.docsSLO = INITIAL_APP_STATE.docsSLO;
          }
          if (!Array.isArray(parsed.docsTimbangan)) {
            parsed.docsTimbangan = INITIAL_APP_STATE.docsTimbangan;
          }
          if (!parsed.companyProfile || !parsed.companyProfile.namaPerusahaan) {
            parsed.companyProfile = INITIAL_APP_STATE.companyProfile;
          }
          // Prioritaskan cadangan tersendiri jika ada pembaruan profil sebelumnya
          try {
            const savedCompany = localStorage.getItem('company_profile_backup_v1');
            if (savedCompany) {
              const comp = JSON.parse(savedCompany);
              if (comp && comp.namaPerusahaan) {
                parsed.companyProfile = comp;
              }
            }
          } catch {
            // ignore
          }
          // Pembersihan otomatis satu kali untuk data contoh lama (legacy) agar hanya data riil yang tersisa
          try {
            if (!localStorage.getItem(LEGACY_DEMO_CLEANED_KEY)) {
              parsed.masterLocations = (parsed.masterLocations || []).filter(
                (item: MasterArchiveLocation) => !LEGACY_DEMO_IDS.masterLocations.has(item.id)
              );
              parsed.docsENOP = (parsed.docsENOP || []).filter(
                (item: DocENOP) => !LEGACY_DEMO_IDS.docsENOP.has(item.id)
              );
              parsed.docsESPPT = (parsed.docsESPPT || []).filter(
                (item: DocESPPT) => !LEGACY_DEMO_IDS.docsESPPT.has(item.id)
              );
              parsed.docsMerk = (parsed.docsMerk || []).filter(
                (item: DocMerk) => !LEGACY_DEMO_IDS.docsMerk.has(item.id)
              );
              parsed.docsK3 = (parsed.docsK3 || []).filter(
                (item: DocK3) => !LEGACY_DEMO_IDS.docsK3.has(item.id)
              );
              parsed.docsTanah = (parsed.docsTanah || []).filter(
                (item: DocTanah) => !LEGACY_DEMO_IDS.docsTanah.has(item.id)
              );
              parsed.docsIMB = (parsed.docsIMB || []).filter(
                (item: DocIMB) => !LEGACY_DEMO_IDS.docsIMB.has(item.id)
              );
              parsed.docsSLO = (parsed.docsSLO || []).filter(
                (item: DocSLO) => !LEGACY_DEMO_IDS.docsSLO.has(item.id)
              );
              parsed.docsTimbangan = (parsed.docsTimbangan || []).filter(
                (item: DocUjiTimbangan) => !LEGACY_DEMO_IDS.docsTimbangan.has(item.id)
              );
              if (Array.isArray(parsed.users)) {
                const realUsers = parsed.users.filter(
                  (u: UserAccount) =>
                    u.username === 'admin' ||
                    u.id === 'usr-admin' ||
                    u.email === 'hrd.kusuka@gmail.com' ||
                    (!LEGACY_DEMO_IDS.userIds.has(u.id) &&
                      !LEGACY_DEMO_IDS.usernames.has(u.username))
                );
                parsed.users = realUsers.length > 0 ? realUsers : INITIAL_APP_STATE.users;
                if (!parsed.users.some((u: UserAccount) => u.id === parsed.currentUserId)) {
                  parsed.currentUserId = parsed.users[0]?.id || 'usr-admin';
                }
              }
              localStorage.setItem(LEGACY_DEMO_CLEANED_KEY, 'true');
            }
          } catch {
            // ignore
          }
          return parsed;
        }
      }
    } catch {
      // Fallback to clean initial state
    }
    return INITIAL_APP_STATE;
  });

  // Persistent authentication & view across page refresh
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem(SESSION_AUTH_KEY);
      return savedAuth === 'true';
    } catch {
      return false;
    }
  });

  const [activeView, setActiveView] = useState<ActiveView>(() => {
    try {
      const savedView = localStorage.getItem(SESSION_VIEW_KEY);
      const validViews: ActiveView[] = [
        'dashboard',
        'master-arsip',
        'master-provinsi',
        'master-status',
        'doc-enop',
        'doc-esppt',
        'doc-merk',
        'doc-k3',
        'doc-tanah',
        'doc-imb',
        'doc-slo',
        'doc-timbangan',
        'laporan',
        'setting',
        'setting-company',
        'setting-apps-script',
        'ebook-panduan',
      ];
      if (savedView && validViews.includes(savedView as ActiveView)) {
        return savedView as ActiveView;
      }
    } catch {
      // fallback
    }
    return 'dashboard';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [autoOpenDocForm, setAutoOpenDocForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openLabelModalDirectly, setOpenLabelModalDirectly] = useState(false);

  // In-App Switch User / Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Google Apps Script (Spreadsheet Web App) Storage State
  const [gasConfig, setGasConfig] = useState<GasConfig>(() => getGasConfig());
  const [gasSyncStatus, setGasSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>(
    'idle'
  );
  const [isReloadingFromSheets, setIsReloadingFromSheets] = useState(false);
  const gasInitialMountRef = useRef(true);
  const skipNextGasSyncRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  // Auto-load data riil terbaru dari Google Sheets setiap kali aplikasi dibuka jika Apps Script sudah terhubung
  useEffect(() => {
    if (!isValidAppsScriptUrl(gasConfig.webAppUrl)) {
      return;
    }

    let cancelled = false;
    loadStateFromGas(gasConfig.webAppUrl, gasConfig.apiToken)
      .then((res) => {
        if (cancelled || !res.success || !res.hasData || !res.state) return;
        skipNextGasSyncRef.current = true;
        setState(res.state);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.state));
          if (res.state.companyProfile?.namaPerusahaan) {
            localStorage.setItem(
              'company_profile_backup_v1',
              JSON.stringify(res.state.companyProfile)
            );
          }
        } catch {
          // ignore
        }
        const updated = saveGasConfig({
          lastSyncedAt: res.updatedAt || new Date().toISOString(),
          ...(res.spreadsheetUrl ? { spreadsheetUrl: res.spreadsheetUrl } : {}),
          ...(res.spreadsheetName ? { spreadsheetName: res.spreadsheetName } : {}),
        });
        setGasConfig(updated);
        setGasSyncStatus('synced');
      })
      .catch(() => {
        // Tetap gunakan state lokal jika koneksi sedang offline
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced Auto-Sync ke Google Sheets (Apps Script Web App) saat data berubah
  useEffect(() => {
    if (gasInitialMountRef.current) {
      gasInitialMountRef.current = false;
      return;
    }
    if (skipNextGasSyncRef.current) {
      skipNextGasSyncRef.current = false;
      return;
    }
    if (!gasConfig.autoSync || !isValidAppsScriptUrl(gasConfig.webAppUrl)) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setGasSyncStatus('syncing');
      const res = await syncStateToGas(gasConfig.webAppUrl, state, gasConfig.apiToken);
      if (res.success) {
        setGasSyncStatus('synced');
        const updated = saveGasConfig({
          lastSyncedAt: res.updatedAt || new Date().toISOString(),
          ...(res.spreadsheetUrl ? { spreadsheetUrl: res.spreadsheetUrl } : {}),
          ...(res.spreadsheetName ? { spreadsheetName: res.spreadsheetName } : {}),
        });
        setGasConfig(updated);
      } else {
        setGasSyncStatus('error');
      }
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [state, gasConfig.autoSync, gasConfig.webAppUrl, gasConfig.apiToken]);

  // Sync auth session state across browser refreshes
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_AUTH_KEY, String(isAuthenticated));
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // Sync active view so refresh stays on the same page
  useEffect(() => {
    try {
      if (isAuthenticated) {
        localStorage.setItem(SESSION_VIEW_KEY, activeView);
      }
    } catch {
      // ignore
    }
  }, [activeView, isAuthenticated]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  };

  // Current User & Role Permissions
  const currentUser = useMemo(() => {
    return (
      state.users.find((u) => u.id === state.currentUserId) || state.users[0]
    );
  }, [state.users, state.currentUserId]);

  const currentRolePermissions = useMemo(() => {
    const matched = state.roles.find((r) => r.roleName === currentUser?.role);
    if (matched) return matched;
    return {
      canManageMaster: true,
      canWriteDocs: true,
      canDeleteDocs: true,
      canExportReport: true,
      canManageUsers: true,
      canReceiveExpiryEmails: true,
    };
  }, [state.roles, currentUser]);

  const isSuperAdmin = useMemo(() => {
    return (
      currentUser?.level === 'Level 1 - Super Admin' ||
      currentUser?.role === 'Super Administrator'
    );
  }, [currentUser]);

  // --- Master Data Handlers ---
  const handleSaveLocation = (loc: MasterArchiveLocation, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      masterLocations: isEdit
        ? prev.masterLocations.map((l) => (l.id === loc.id ? loc : l))
        : [...prev.masterLocations, loc],
    }));
    showToast(
      isEdit
        ? `Lokasi Arsip "${loc.namaLokasi}" berhasil diperbarui.`
        : `Lokasi Arsip "${loc.namaLokasi}" berhasil ditambahkan.`
    );
  };

  const handleDeleteLocation = (id: string) => {
    setState((prev) => ({
      ...prev,
      masterLocations: prev.masterLocations.filter((l) => l.id !== id),
    }));
    showToast('Lokasi Arsip Dokumen berhasil dihapus.');
  };

  const handleSaveProvince = (prov: MasterProvince, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      masterProvinces: isEdit
        ? prev.masterProvinces.map((p) => (p.id === prov.id ? prov : p))
        : [...prev.masterProvinces, prov],
    }));
    showToast(
      isEdit
        ? `Data wilayah Provinsi ${prov.namaProvinsi} diperbarui.`
        : `Provinsi ${prov.namaProvinsi} berhasil ditambahkan.`
    );
  };

  const handleDeleteProvince = (id: string) => {
    setState((prev) => ({
      ...prev,
      masterProvinces: prev.masterProvinces.filter((p) => p.id !== id),
    }));
    showToast('Provinsi berhasil dihapus dari Data Master.');
  };

  const handleSaveStatus = (st: MasterPaymentStatus, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      masterStatuses: isEdit
        ? prev.masterStatuses.map((s) => (s.id === st.id ? st : s))
        : [...prev.masterStatuses, st],
    }));
    showToast(
      isEdit
        ? `Status Bayar "${st.namaStatus}" diperbarui.`
        : `Status Bayar "${st.namaStatus}" ditambahkan.`
    );
  };

  const handleDeleteStatus = (id: string) => {
    setState((prev) => ({
      ...prev,
      masterStatuses: prev.masterStatuses.filter((s) => s.id !== id),
    }));
    showToast('Status Bayar berhasil dihapus.');
  };

  // --- Document Handlers ---
  const handleSaveENOP = (doc: DocENOP, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      docsENOP: isEdit
        ? prev.docsENOP.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...prev.docsENOP],
    }));
    showToast(
      isEdit
        ? `Dokumen Bukti Bayar PBB (${doc.noArsip}) berhasil diperbarui.`
        : `Dokumen Bukti Bayar PBB baru (${doc.noArsip}) tersimpan ke arsip.`
    );
  };

  const handleDeleteENOP = (id: string) => {
    setState((prev) => ({
      ...prev,
      docsENOP: prev.docsENOP.filter((d) => d.id !== id),
    }));
    showToast('Dokumen Bukti Bayar PBB telah dihapus.');
  };

  const handleSaveESPPT = (doc: DocESPPT, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      docsESPPT: isEdit
        ? prev.docsESPPT.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...prev.docsESPPT],
      docsENOP: isEdit
        ? prev.docsENOP.map((enop) =>
            enop.espptId === doc.id || enop.nop === doc.nop
              ? {
                  ...enop,
                  espptId: doc.id,
                  nop: doc.nop,
                  namaWajibPajak: doc.namaWajibPajak,
                  alamatWajibPajak: doc.alamatWajibPajak,
                }
              : enop
          )
        : prev.docsENOP,
    }));
    showToast(
      isEdit
        ? `Dokumen E-SPPT (${doc.noArsip}) berhasil diperbarui.`
        : `Dokumen E-SPPT baru (${doc.noArsip}) tersimpan ke arsip.`
    );
  };

  const handleDeleteESPPT = (id: string) => {
    setState((prev) => ({
      ...prev,
      docsESPPT: prev.docsESPPT.filter((d) => d.id !== id),
    }));
    showToast('Dokumen E-SPPT telah dihapus.');
  };

  const handleSaveMerk = (doc: DocMerk, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      docsMerk: isEdit
        ? prev.docsMerk.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...prev.docsMerk],
    }));
    showToast(
      isEdit
        ? `Sertifikat Merk (${doc.noArsip}) berhasil diperbarui.`
        : `Sertifikat Merk baru (${doc.noArsip}) tersimpan ke arsip.`
    );
  };

  const handleDeleteMerk = (id: string) => {
    setState((prev) => ({
      ...prev,
      docsMerk: prev.docsMerk.filter((d) => d.id !== id),
    }));
    showToast('Sertifikat Merk telah dihapus.');
  };

  const handleSaveK3 = (doc: DocK3, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      docsK3: isEdit
        ? prev.docsK3.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...prev.docsK3],
    }));
    showToast(
      isEdit
        ? `Sertifikat K3 (${doc.noArsip}) berhasil diperbarui.`
        : `Sertifikat K3 baru (${doc.noArsip}) tersimpan ke arsip.`
    );
  };

  const handleDeleteK3 = (id: string) => {
    setState((prev) => ({
      ...prev,
      docsK3: prev.docsK3.filter((d) => d.id !== id),
    }));
    showToast('Sertifikat K3 telah dihapus.');
  };

  const handleSaveTanah = (doc: DocTanah, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      docsTanah: isEdit
        ? prev.docsTanah.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...prev.docsTanah],
    }));
    showToast(
      isEdit
        ? `E-Sertifikat Tanah (${doc.noArsip}) berhasil diperbarui.`
        : `E-Sertifikat Tanah baru (${doc.noArsip}) tersimpan ke arsip.`
    );
  };

  const handleDeleteTanah = (id: string) => {
    setState((prev) => ({
      ...prev,
      docsTanah: prev.docsTanah.filter((d) => d.id !== id),
    }));
    showToast('E-Sertifikat Tanah telah dihapus.');
  };

  const handleSaveIMB = (doc: DocIMB, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      docsIMB: isEdit
        ? prev.docsIMB.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...prev.docsIMB],
    }));
    showToast(
      isEdit
        ? `Dokumen E-IMB (${doc.noArsip}) berhasil diperbarui.`
        : `Dokumen E-IMB baru (${doc.noArsip}) tersimpan ke arsip.`
    );
  };

  const handleDeleteIMB = (id: string) => {
    setState((prev) => ({
      ...prev,
      docsIMB: prev.docsIMB.filter((d) => d.id !== id),
    }));
    showToast('Dokumen E-IMB telah dihapus.');
  };

  const handleSaveSLO = (doc: DocSLO, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      docsSLO: isEdit
        ? prev.docsSLO.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...(prev.docsSLO || [])],
    }));
    showToast(
      isEdit
        ? `Sertifikat Laik Operasi (${doc.noArsip} / ${doc.noSlo}) berhasil diperbarui.`
        : `Sertifikat Laik Operasi baru (${doc.noArsip}) tersimpan ke arsip.`
    );
  };

  const handleDeleteSLO = (id: string) => {
    setState((prev) => ({
      ...prev,
      docsSLO: (prev.docsSLO || []).filter((d) => d.id !== id),
    }));
    showToast('Sertifikat Laik Operasi (SLO) telah dihapus.');
  };

  const handleSaveTimbangan = (doc: DocUjiTimbangan, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      docsTimbangan: isEdit
        ? (prev.docsTimbangan || []).map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...(prev.docsTimbangan || [])],
    }));
    showToast(
      isEdit
        ? `Dokumen Uji Timbangan (${doc.noArsip} / ${doc.nomorSuratPengujian}) berhasil diperbarui.`
        : `Dokumen Uji Timbangan baru (${doc.noArsip}) tersimpan ke arsip.`
    );
  };

  const handleDeleteTimbangan = (id: string) => {
    setState((prev) => ({
      ...prev,
      docsTimbangan: (prev.docsTimbangan || []).filter((d) => d.id !== id),
    }));
    showToast('Dokumen Uji Timbangan telah dihapus.');
  };

  // --- Setting / User & Role Handlers ---
  const handleSaveUser = (user: UserAccount, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      users: isEdit
        ? prev.users.map((u) => (u.id === user.id ? user : u))
        : [...prev.users, user],
    }));
    showToast(
      isEdit
        ? `Akun pengguna "${user.username}" berhasil diperbarui.`
        : `Akun pengguna "${user.username}" berhasil ditambahkan.`
    );
  };

  const handleDeleteUser = (id: string) => {
    setState((prev) => {
      const remainingUsers = prev.users.filter((u) => u.id !== id);
      return {
        ...prev,
        users: remainingUsers,
        currentUserId:
          prev.currentUserId === id
            ? remainingUsers[0]?.id || 'usr-admin'
            : prev.currentUserId,
      };
    });
    showToast('Akun pengguna berhasil dihapus secara permanen.');
  };

  const handleClearSampleUsers = () => {
    setState((prev) => {
      const sampleUsernames = [
        'admin.pusat',
        'siti.legal',
        'budi.pajak',
        'hendra.k3',
        'auditor.internal',
      ];
      const sampleIds = ['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5'];
      const filtered = prev.users.filter(
        (u) =>
          u.username === 'admin' ||
          u.id === 'usr-admin' ||
          u.email === 'hrd.kusuka@gmail.com' ||
          (!sampleUsernames.includes(u.username) && !sampleIds.includes(u.id))
      );
      return {
        ...prev,
        users: filtered,
        currentUserId: filtered[0]?.id || 'usr-admin',
      };
    });
    showToast(
      'Seluruh akun pengguna contoh telah berhasil dihapus. Hanya akun Super Admin utama dan akun riil Anda yang tersimpan.'
    );
  };

  const handleResetNonSuperAdminPasswords = () => {
    let resetCount = 0;
    setState((prev) => {
      const updatedUsers = prev.users.map((u) => {
        if (u.level !== 'Level 1 - Super Admin') {
          resetCount++;
          return { ...u, password: 'password123' };
        }
        return u;
      });
      return {
        ...prev,
        users: updatedUsers,
      };
    });
    showToast(`Password ${resetCount} akun Non-Super Admin telah direset menjadi "password123". Akun Super Admin tetap aman.`);
  };

  const handleResetSingleUserPassword = (userId: string) => {
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;
    if (target.level === 'Level 1 - Super Admin') {
      showToast('Akun Super Admin tidak dapat direset dengan tombol ini demi keamanan.');
      return;
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId ? { ...u, password: 'password123' } : u
      ),
    }));
    showToast(`Password untuk @${target.username} berhasil direset menjadi "password123".`);
  };

  const handleSaveRole = (role: RoleDefinition, isEdit: boolean) => {
    setState((prev) => ({
      ...prev,
      roles: isEdit
        ? prev.roles.map((r) => (r.id === role.id ? role : r))
        : [...prev.roles, role],
    }));
    showToast(`Konfigurasi Role "${role.roleName}" diperbarui.`);
  };

  const handleDeleteRole = (id: string) => {
    setState((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.id !== id),
    }));
    showToast('Role berhasil dihapus dari daftar Setting.');
  };

  const handleSaveCompanyProfile = (profile: CompanyProfile) => {
    setState((prev) => ({
      ...prev,
      companyProfile: profile,
    }));
    try {
      localStorage.setItem('company_profile_backup_v1', JSON.stringify(profile));
    } catch {
      // ignore
    }
    showToast(
      `Profil Company "${profile.namaPerusahaan}" berhasil disimpan dan diperbarui pada Portal Awal & Header Laporan.`
    );
  };

  const handleSwitchUser = (userId: string) => {
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;
    setState((prev) => ({
      ...prev,
      currentUserId: userId,
    }));
    showToast(
      `Sesi beralih ke ${target.namaLengkap} (${target.role} · ${target.level}).`
    );
  };

  const handleResetUserPassword = (userId: string, newPassword: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId ? { ...u, password: newPassword } : u
      ),
    }));
    showToast('Password akun berhasil diatur ulang.');
  };

  const handleLandingLoginSuccess = (matchedUser: UserAccount) => {
    setState((prev) => ({
      ...prev,
      currentUserId: matchedUser.id,
      users: prev.users.map((u) =>
        u.id === matchedUser.id ? { ...u, lastLogin: 'Baru saja' } : u
      ),
    }));
    setIsAuthenticated(true);
    try {
      localStorage.setItem(SESSION_AUTH_KEY, 'true');
      const savedView = localStorage.getItem(SESSION_VIEW_KEY);
      const validViews: ActiveView[] = [
        'dashboard',
        'master-arsip',
        'master-provinsi',
        'master-status',
        'doc-enop',
        'doc-esppt',
        'doc-merk',
        'doc-k3',
        'doc-tanah',
        'doc-imb',
        'doc-slo',
        'doc-timbangan',
        'laporan',
        'setting',
        'setting-company',
        'ebook-panduan',
      ];
      if (savedView && validViews.includes(savedView as ActiveView)) {
        setActiveView(savedView as ActiveView);
      } else {
        setActiveView('dashboard');
      }
    } catch {
      setActiveView('dashboard');
    }
    showToast(`Selamat datang, ${matchedUser.namaLengkap} (${matchedUser.level}).`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem(SESSION_AUTH_KEY, 'false');
      localStorage.removeItem(SESSION_VIEW_KEY);
    } catch {
      // ignore
    }
    showToast('Anda telah keluar ke Halaman Depan.');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputId = loginUsername.trim().toLowerCase().replace(/^@/, '');
    const cleanPass = loginPassword.trim();
    const matched = state.users.find((u) => {
      const matchIdentifier =
        u.username.toLowerCase() === inputId ||
        (u.email && u.email.toLowerCase() === inputId) ||
        (inputId === 'admin' && u.level === 'Level 1 - Super Admin') ||
        (inputId.length >= 3 && u.namaLengkap.toLowerCase().includes(inputId));

      if (!matchIdentifier) return false;

      // Exact match
      if (u.password === loginPassword || u.password === cleanPass) return true;
      // Case insensitive match
      if (u.password.toLowerCase() === cleanPass.toLowerCase()) return true;
      // Super Admin convenience
      if (
        (u.username === 'admin' || u.level === 'Level 1 - Super Admin') &&
        ['admin123', 'password123', 'admin', 'kusuka123', 'arsip#2026'].includes(
          cleanPass.toLowerCase()
        )
      ) {
        return true;
      }
      if (
        u.username === 'admin.pusat' &&
        ['arsip#2026', 'password123', 'admin123', 'admin'].includes(
          cleanPass.toLowerCase()
        )
      ) {
        return true;
      }
      // Non-superadmin default password
      if (
        u.level !== 'Level 1 - Super Admin' &&
        cleanPass.toLowerCase() === 'password123'
      ) {
        return true;
      }
      return false;
    });

    if (!matched) {
      setLoginError(
        'Username/Email atau Password tidak sesuai. Akun Super Admin bawaan: username "admin", password "admin123".'
      );
      return;
    }
    setState((prev) => ({
      ...prev,
      currentUserId: matched.id,
    }));
    setIsLoginModalOpen(false);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError(null);
    showToast(`Selamat datang, ${matched.namaLengkap} (${matched.level}).`);
  };

  const handleReloadFromGoogleSheets = async () => {
    if (!isValidAppsScriptUrl(gasConfig.webAppUrl)) {
      showToast(
        'URL Google Apps Script belum terhubung. Silakan atur di menu Setting → Apps Script & Deploy terlebih dahulu.'
      );
      setActiveView('setting-apps-script');
      return;
    }
    setIsReloadingFromSheets(true);
    try {
      const res = await loadStateFromGas(gasConfig.webAppUrl, gasConfig.apiToken);
      if (res.success && res.hasData && res.state) {
        handleHydrateStateFromSheet(res.state);
        const updated = saveGasConfig({
          lastSyncedAt: res.updatedAt || new Date().toISOString(),
          ...(res.spreadsheetUrl ? { spreadsheetUrl: res.spreadsheetUrl } : {}),
          ...(res.spreadsheetName ? { spreadsheetName: res.spreadsheetName } : {}),
        });
        setGasConfig(updated);
        showToast('Data riil terbaru berhasil dimuat ulang dari Google Sheets.');
      } else if (res.success && !res.hasData) {
        showToast(
          'Google Sheets masih kosong (belum ada data riil tersimpan). Silakan input data atau Push ke Sheet terlebih dahulu.'
        );
      } else {
        showToast(res.error || 'Gagal memuat data dari Google Sheets.');
      }
    } finally {
      setIsReloadingFromSheets(false);
    }
  };

  const handleClearSampleDataExceptUsers = () => {
    if (!isSuperAdmin) {
      showToast(
        'Akses ditolak: Menu Kosongkan Data hanya dapat dilakukan oleh Super Admin (Level 1).'
      );
      return;
    }
    const sampleUsernames = [
      'admin.pusat',
      'siti.legal',
      'budi.pajak',
      'hendra.k3',
      'auditor.internal',
    ];
    const sampleIds = ['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5'];
    setState((prev) => {
      const cleanedUsers = prev.users.filter(
        (u) =>
          u.username === 'admin' ||
          u.id === 'usr-admin' ||
          u.email === 'hrd.kusuka@gmail.com' ||
          (!sampleUsernames.includes(u.username) && !sampleIds.includes(u.id))
      );
      return {
        ...prev,
        masterLocations: [],
        docsENOP: [],
        docsESPPT: [],
        docsMerk: [],
        docsK3: [],
        docsTanah: [],
        docsIMB: [],
        docsSLO: [],
        docsTimbangan: [],
        users: cleanedUsers,
        currentUserId: cleanedUsers[0]?.id || 'usr-admin',
      };
    });
    showToast(
      'Seluruh data arsip contoh & akun pengguna contoh telah dikosongkan. Akun Super Admin tetap tersimpan.'
    );
  };

  const handleImportFullState = (newState: AppState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      if (newState.companyProfile?.namaPerusahaan) {
        localStorage.setItem(
          'company_profile_backup_v1',
          JSON.stringify(newState.companyProfile)
        );
      }
    } catch {
      // ignore
    }
    showToast('Seluruh data arsip dan pengguna berhasil diimpor & disinkronkan ke komputer ini.');
  };

  const handleHydrateStateFromSheet = (nextState: AppState) => {
    skipNextGasSyncRef.current = true;
    setState(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      if (nextState.companyProfile?.namaPerusahaan) {
        localStorage.setItem(
          'company_profile_backup_v1',
          JSON.stringify(nextState.companyProfile)
        );
      }
    } catch {
      // ignore
    }
    setGasSyncStatus('synced');
  };

  const handleQuickAdd = (targetView: ActiveView) => {
    setActiveView(targetView);
    setAutoOpenDocForm(true);
  };

  const breadcrumbText = useMemo(() => {
    switch (activeView) {
      case 'dashboard':
        return 'Arsip Dokumen / Dashboard Pemantauan Realtime';
      case 'master-arsip':
        return 'Data Master / Arsip Dokumen (Lokasi Penyimpanan)';
      case 'master-provinsi':
        return 'Data Master / Provinsi & Kota/Kabupaten Indonesia';
      case 'master-status':
        return 'Data Master / Status Bayar';
      case 'doc-enop':
        return 'Dokumen / Bukti Bayar PBB';
      case 'doc-esppt':
        return 'Dokumen / Arsip E-SPPT';
      case 'doc-merk':
        return 'Dokumen / Sertifikat Merk';
      case 'doc-k3':
        return 'Dokumen / Sertifikat K3';
      case 'doc-tanah':
        return 'Dokumen / E-Sertifikat Tanah';
      case 'doc-imb':
        return 'Dokumen / Arsip E-IMB';
      case 'doc-slo':
        return 'Dokumen / Sertifikat Laik Operasi (SLO)';
      case 'doc-timbangan':
        return 'Dokumen / Uji Timbangan (Metrologi Legal & Tera)';
      case 'laporan':
        return 'Laporan / Pilih Dokumen & Ekspor Excel/PDF';
      case 'setting':
        return 'Setting / Roles & Users';
      case 'setting-company':
        return 'Setting / Company (Logo & Nama Perusahaan)';
      case 'setting-apps-script':
        return 'Setting / Google Sheets (Apps Script) & Deploy Vercel';
      case 'ebook-panduan':
        return 'Panduan & Dokumentasi / Buku Panduan E-Book Resmi';
    }
  }, [activeView]);

  const totalDocsCount =
    state.docsENOP.length +
    state.docsESPPT.length +
    state.docsMerk.length +
    state.docsK3.length +
    state.docsTanah.length +
    state.docsIMB.length +
    (state.docsSLO?.length || 0) +
    (state.docsTimbangan?.length || 0);

  // Render Front Landing & Login Page when not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {toastMessage && (
          <div className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <LandingLoginPage
          state={state}
          onLoginSuccess={handleLandingLoginSuccess}
          onResetPassword={handleResetUserPassword}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Desktop & Mobile Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <button
            type="button"
            onClick={() => {
              setActiveView('dashboard');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <FolderArchive className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap">
              Arsip Dokumen
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 text-xs">
          {/* 1. Dashboard */}
          <div>
            <div className="mb-2 px-3 text-[11px] font-semibold text-slate-400">
              Utama
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveView('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 font-medium transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard Realtime
              </span>
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                {totalDocsCount}
              </span>
            </button>
          </div>

          {/* 2. Data Master */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 px-3 text-[11px] font-semibold text-slate-400">
              <Database className="h-3 w-3" />
              <span>Data Master</span>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveView('master-arsip');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'master-arsip'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Arsip Dokumen
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-75">
                  {state.masterLocations.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('master-provinsi');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'master-provinsi'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Provinsi & Kota/Kab
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-75">
                  {state.masterProvinces.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('master-status');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'master-status'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  Status Bayar
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-75">
                  {state.masterStatuses.length}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Modul Dokumen */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 px-3 text-[11px] font-semibold text-slate-400">
              <FileText className="h-3 w-3" />
              <span>Dokumen Arsip</span>
            </div>
            <div className="space-y-1">
              {/* 1. E-SPPT */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('doc-esppt');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'doc-esppt'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="h-3.5 w-3.5" />
                  E-SPPT
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {state.docsESPPT.length}
                </span>
              </button>

              {/* 2. Bukti Bayar PBB (E-NOP) */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('doc-enop');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'doc-enop'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="h-3.5 w-3.5" />
                  Bukti Bayar PBB
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {state.docsENOP.length}
                </span>
              </button>

              {/* 3. E-IMB */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('doc-imb');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'doc-imb'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Building2 className="h-3.5 w-3.5" />
                  E-IMB
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {state.docsIMB.length}
                </span>
              </button>

              {/* 4. E-Sertifikat Tanah */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('doc-tanah');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'doc-tanah'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="h-3.5 w-3.5" />
                  E-Sertifikat Tanah
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {state.docsTanah.length}
                </span>
              </button>

              {/* 5. Sertifikat Merk */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('doc-merk');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'doc-merk'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Award className="h-3.5 w-3.5" />
                  Sertifikat Merk
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {state.docsMerk.length}
                </span>
              </button>

              {/* 6. Sertifikat K3 */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('doc-k3');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'doc-k3'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <HardHat className="h-3.5 w-3.5" />
                  Sertifikat K3
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {state.docsK3.length}
                </span>
              </button>

              {/* 7. Sertifikat Laik Operasi (SLO) */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('doc-slo');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'doc-slo'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Sertifikat Laik Operasi (SLO)
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {state.docsSLO?.length || 0}
                </span>
              </button>

              {/* 8. Uji Timbangan (Metrologi Legal & Tera) */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('doc-timbangan');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'doc-timbangan'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Scale className="h-3.5 w-3.5 text-cyan-400" />
                  Uji Timbangan
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {state.docsTimbangan?.length || 0}
                </span>
              </button>
            </div>
          </div>

          {/* 4. Laporan */}
          <div>
            <div className="mb-2 px-3 text-[11px] font-semibold text-slate-400">
              Pelaporan
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveView('laporan');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'laporan' && !openLabelModalDirectly
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Laporan (Excel & PDF)
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('laporan');
                  setOpenLabelModalDirectly(true);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'laporan' && openLabelModalDirectly
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Printer className="h-3.5 w-3.5 text-blue-400" />
                  Cetak Label
                </span>
                <span className="rounded bg-blue-900/60 px-1.5 py-0.5 text-[10px] font-mono text-blue-200">
                  3x8 cm
                </span>
              </button>
            </div>
          </div>

          {/* 5. Setting: Roles & Users dan Setting Company */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 px-3 text-[11px] font-semibold text-slate-400">
              <Settings className="h-3 w-3" />
              <span>Setting</span>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveView('setting');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'setting'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <KeyRound className="h-3.5 w-3.5" />
                  Roles &amp; User
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-75">
                  {state.users.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('setting-company');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'setting-company'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                Setting Company
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('setting-apps-script');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'setting-apps-script'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Code className="h-3.5 w-3.5 text-emerald-400" />
                  Apps Script &amp; Deploy
                </span>
                <span className="font-mono text-[10px] opacity-80">
                  {isValidAppsScriptUrl(gasConfig.webAppUrl) ? 'ON' : 'GAS'}
                </span>
              </button>
            </div>
          </div>

          {/* 6. Panduan & Dokumentasi E-Book */}
          <div>
            <div className="mb-2 px-3 text-[11px] font-semibold text-slate-400">
              Dokumentasi &amp; Panduan
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveView('ebook-panduan');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeView === 'ebook-panduan'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                  Buku Panduan E-Book
                </span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                  PDF
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Active User Footer Card - Dikembalikan seperti semula dengan tombol Ganti Akun & Keluar */}
        <div className="border-t border-slate-800 p-4 text-xs">
          <div className="font-semibold text-white truncate">
            {currentUser?.namaLengkap}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-slate-400 truncate">
            {currentUser?.email}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            <span>@{currentUser?.username}</span>
            <span aria-hidden="true"> · </span>
            <span className="text-sky-400">{currentUser?.level}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition-colors hover:bg-slate-700 whitespace-nowrap"
            >
              <KeyRound className="h-3 w-3" />
              Ganti Akun
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1 rounded-lg border border-rose-900/60 bg-rose-950/50 px-2.5 py-1.5 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-900/60 whitespace-nowrap"
            >
              <LogOut className="h-3 w-3" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar: Zone 1 Breadcrumb — Zone 2 Quick Links — Zone 3 User Level & Colored Logout Action */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          {/* Zone 1: Contextual Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Buka navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display text-sm font-semibold text-slate-800 truncate">
              {breadcrumbText}
            </span>
          </div>

          {/* Zone 2: Concise Single-Line Navigation Links */}
          <nav className="hidden 2xl:flex items-center gap-6 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveView('master-arsip')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Data Master
            </button>
            <button
              type="button"
              onClick={() => setActiveView('doc-esppt')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Dokumen
            </button>
            <button
              type="button"
              onClick={() => setActiveView('laporan')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Laporan
            </button>
            <button
              type="button"
              onClick={() => setActiveView('setting')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Setting
            </button>
            <button
              type="button"
              onClick={() => setActiveView('ebook-panduan')}
              className={`hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 font-semibold ${
                activeView === 'ebook-panduan' ? 'text-blue-700' : 'text-slate-700'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              Buku Panduan
            </button>
          </nav>

          {/* Zone 3: User Display, Colored User Level Badge, and Colored Logout Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* E-Book Quick Access Button */}
            <button
              type="button"
              onClick={() => setActiveView('ebook-panduan')}
              title="Buka Buku Panduan E-Book Resmi"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shadow-2xs ${
                activeView === 'ebook-panduan'
                  ? 'border-blue-600 bg-blue-700 text-white'
                  : 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">Buku Panduan E-Book</span>
              <span className="sm:hidden">E-Book</span>
            </button>

            {/* User Account Button */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              title="Ganti Sesi Akun Pengguna"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap"
            >
              <KeyRound className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-900">{currentUser?.username}</span>
              <span className="hidden lg:inline text-slate-400">({currentUser?.role})</span>
            </button>

            {/* Colored User Level Badge */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
                currentUser?.level === 'Level 1 - Super Admin'
                  ? 'border-purple-300 bg-purple-50 text-purple-700'
                  : currentUser?.level === 'Level 2 - Admin Arsip'
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : currentUser?.level === 'Level 3 - Staff Operasional'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-amber-300 bg-amber-50 text-amber-700'
              }`}
              title={`Level Hak Akses: ${currentUser?.level}`}
            >
              <span className="h-2 w-2 rounded-full bg-current shrink-0" />
              <span className="hidden sm:inline">{currentUser?.level}</span>
              <span className="sm:hidden">
                {currentUser?.level ? currentUser.level.split(' - ')[1] || currentUser.level : 'Level'}
              </span>
            </div>

            {/* Colored Keluar (Logout) Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari Aplikasi ke Halaman Depan"
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-2xs whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Workspace Viewport */}
        <main className="mx-auto w-full max-w-[1380px] flex-1 p-6">
          {activeView === 'dashboard' && (
            <DashboardView
              state={state}
              onNavigate={(v) => setActiveView(v)}
              onQuickAdd={handleQuickAdd}
            />
          )}

          {(activeView === 'master-arsip' ||
            activeView === 'master-provinsi' ||
            activeView === 'master-status') && (
            <MasterDataView
              activeSubTab={activeView}
              onSwitchSubTab={(tab) => setActiveView(tab)}
              state={state}
              canManageMaster={currentRolePermissions.canManageMaster}
              onSaveLocation={handleSaveLocation}
              onDeleteLocation={handleDeleteLocation}
              onSaveProvince={handleSaveProvince}
              onDeleteProvince={handleDeleteProvince}
              onSaveStatus={handleSaveStatus}
              onDeleteStatus={handleDeleteStatus}
            />
          )}

          {(activeView === 'doc-enop' ||
            activeView === 'doc-esppt' ||
            activeView === 'doc-merk' ||
            activeView === 'doc-k3' ||
            activeView === 'doc-tanah' ||
            activeView === 'doc-imb' ||
            activeView === 'doc-slo' ||
            activeView === 'doc-timbangan') && (
            <DocumentViews
              docCategory={activeView}
              onSwitchCategory={(cat) => setActiveView(cat)}
              state={state}
              canWriteDocs={currentRolePermissions.canWriteDocs}
              canDeleteDocs={currentRolePermissions.canDeleteDocs}
              autoOpenForm={autoOpenDocForm}
              onConsumeAutoOpen={() => setAutoOpenDocForm(false)}
              onSaveENOP={handleSaveENOP}
              onDeleteENOP={handleDeleteENOP}
              onSaveESPPT={handleSaveESPPT}
              onDeleteESPPT={handleDeleteESPPT}
              onSaveMerk={handleSaveMerk}
              onDeleteMerk={handleDeleteMerk}
              onSaveK3={handleSaveK3}
              onDeleteK3={handleDeleteK3}
              onSaveTanah={handleSaveTanah}
              onDeleteTanah={handleDeleteTanah}
              onSaveIMB={handleSaveIMB}
              onDeleteIMB={handleDeleteIMB}
              onSaveSLO={handleSaveSLO}
              onDeleteSLO={handleDeleteSLO}
              onSaveTimbangan={handleSaveTimbangan}
              onDeleteTimbangan={handleDeleteTimbangan}
            />
          )}

          {activeView === 'laporan' && (
            <ReportView
              state={state}
              canExportReport={currentRolePermissions.canExportReport}
              onNotify={showToast}
              openLabelModalDirectly={openLabelModalDirectly}
              onResetLabelModalDirectly={() => setOpenLabelModalDirectly(false)}
            />
          )}

          {(activeView === 'setting' || activeView === 'setting-company') && (
            <SettingView
              activeSubTab={activeView}
              onSwitchSubTab={(tab) => setActiveView(tab)}
              state={state}
              canManageUsers={currentRolePermissions.canManageUsers}
              isSuperAdmin={isSuperAdmin}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onSaveRole={handleSaveRole}
              onDeleteRole={handleDeleteRole}
              onSaveCompanyProfile={handleSaveCompanyProfile}
              onSwitchCurrentUser={handleSwitchUser}
              onReloadFromGoogleSheets={handleReloadFromGoogleSheets}
              isReloadingFromSheets={isReloadingFromSheets}
              isGasConnected={isValidAppsScriptUrl(gasConfig.webAppUrl)}
              onClearSampleDataExceptUsers={handleClearSampleDataExceptUsers}
              onResetNonSuperAdminPasswords={handleResetNonSuperAdminPasswords}
              onResetSingleUserPassword={handleResetSingleUserPassword}
              onClearSampleUsers={handleClearSampleUsers}
              onImportFullState={handleImportFullState}
              onNotify={showToast}
            />
          )}

          {activeView === 'setting-apps-script' && (
            <AppsScriptStorageView
              state={state}
              gasConfig={gasConfig}
              gasSyncStatus={gasSyncStatus}
              onUpdateGasConfig={setGasConfig}
              onHydrateStateFromSheet={handleHydrateStateFromSheet}
              onNotify={showToast}
            />
          )}

          {activeView === 'ebook-panduan' && (
            <EBookView state={state} onNotify={showToast} />
          )}
        </main>
      </div>

      {/* Login / Switch User Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Autentikasi & Pergantian Akun Pengguna
                </h3>
                <p className="text-xs text-slate-500">
                  Masuk dengan Username & Password atau pilih akun untuk menguji Level akses
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setLoginError(null);
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3">
              {loginError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Username atau Email
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Contoh: admin.pusat atau hrd.kusuka@gmail.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
              >
                <LogIn className="h-3.5 w-3.5" />
                Login dengan Username & Password
              </button>
            </form>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="mb-2 text-xs font-semibold text-slate-600">
                Pindah Cepat Akun Terdaftar (Simulasi Role & Level):
              </div>
              <div className="space-y-1.5">
                {state.users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      handleSwitchUser(u.id);
                      setIsLoginModalOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      u.id === state.currentUserId
                        ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-semibold text-slate-900">
                        {u.username}{' '}
                        <span className="font-sans font-normal text-slate-500">
                          ({u.namaLengkap})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {u.role} · {u.level}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-blue-700">
                      {u.id === state.currentUserId ? 'Aktif' : 'Pilih →'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
