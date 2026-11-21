import React, { useState, useMemo } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Table2,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Database,
  Shield,
  GitBranch,
  Layers,
  Terminal,
} from 'lucide-react';
import { AppState } from '../types';
import codeGsRaw from '../../gas/Code.gs?raw';
import vercelJsonRaw from '../../vercel.json?raw';
import {
  APPS_SCRIPT_SHEET_BLUEPRINT,
  GasConfig,
  isValidAppsScriptUrl,
  loadStateFromGas,
  saveGasConfig,
  setupGasSpreadsheet,
  syncStateToGas,
  testGasConnection,
} from '../services/appsScriptStorage';

interface AppsScriptStorageViewProps {
  state: AppState;
  gasConfig: GasConfig;
  gasSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  onUpdateGasConfig: (next: GasConfig) => void;
  onHydrateStateFromSheet: (nextState: AppState) => void;
  onNotify: (msg: string) => void;
}

type SubTab = 'koneksi' | 'code-gs' | 'panduan-gas' | 'github-vercel';

export const AppsScriptStorageView: React.FC<AppsScriptStorageViewProps> = ({
  state,
  gasConfig,
  gasSyncStatus,
  onUpdateGasConfig,
  onHydrateStateFromSheet,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('koneksi');
  const [urlInput, setUrlInput] = useState(gasConfig.webAppUrl);
  const [tokenInput, setTokenInput] = useState(gasConfig.apiToken);
  const [isTesting, setIsTesting] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [confirmPull, setConfirmPull] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const codeLineCount = useMemo(() => codeGsRaw.split('\n').length, []);

  const totalDocs = useMemo(
    () =>
      state.docsENOP.length +
      state.docsESPPT.length +
      state.docsMerk.length +
      state.docsK3.length +
      state.docsTanah.length +
      state.docsIMB.length +
      (state.docsSLO?.length || 0) +
      (state.docsTimbangan?.length || 0),
    [state]
  );

  const copyText = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotify(`${label} berhasil disalin ke clipboard.`);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const downloadFile = (content: string, filename: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify(`Berkas ${filename} berhasil diunduh.`);
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    const cleanToken = tokenInput.trim();

    if (!cleanUrl) {
      const updated = saveGasConfig({
        webAppUrl: '',
        apiToken: cleanToken,
        spreadsheetUrl: null,
        spreadsheetName: null,
      });
      onUpdateGasConfig(updated);
      setStatusFeedback({
        type: 'info',
        message: 'URL Web App dikosongkan. Aplikasi kembali memakai penyimpanan lokal peramban.',
      });
      return;
    }

    if (!isValidAppsScriptUrl(cleanUrl)) {
      setStatusFeedback({
        type: 'error',
        message:
          'Format URL tidak valid. Pastikan memakai URL hasil Deploy Web App dari script.google.com (berakhiran /exec).',
      });
      return;
    }

    const updated = saveGasConfig({ webAppUrl: cleanUrl, apiToken: cleanToken });
    onUpdateGasConfig(updated);

    setIsTesting(true);
    setStatusFeedback(null);
    const res = await testGasConnection(cleanUrl, cleanToken);
    setIsTesting(false);

    if (res.success) {
      const refreshed = saveGasConfig({
        spreadsheetUrl: res.spreadsheetUrl || null,
        spreadsheetName: res.spreadsheetName || null,
      });
      onUpdateGasConfig(refreshed);
      setStatusFeedback({
        type: 'success',
        message: `Terhubung ke Google Sheets "${res.spreadsheetName || 'Spreadsheet Aktif'}" (${res.tabCount || 0} tab terdeteksi).`,
      });
      onNotify('Koneksi ke Google Apps Script berhasil diverifikasi.');
    } else {
      setStatusFeedback({
        type: 'error',
        message: res.error || 'Gagal terhubung ke Google Apps Script.',
      });
    }
  };

  const handleSetupTabs = async () => {
    const activeUrl = urlInput.trim() || gasConfig.webAppUrl;
    if (!isValidAppsScriptUrl(activeUrl)) {
      setStatusFeedback({
        type: 'error',
        message: 'Masukkan dan simpan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }
    setIsSettingUp(true);
    setStatusFeedback(null);
    const res = await setupGasSpreadsheet(activeUrl, tokenInput.trim() || gasConfig.apiToken);
    setIsSettingUp(false);

    if (res.success) {
      const refreshed = saveGasConfig({
        webAppUrl: activeUrl,
        apiToken: tokenInput.trim(),
        spreadsheetUrl: res.spreadsheetUrl || null,
        spreadsheetName: res.spreadsheetName || null,
      });
      onUpdateGasConfig(refreshed);
      setStatusFeedback({
        type: 'success',
        message: `Struktur 15 tab berhasil disiapkan pada "${res.spreadsheetName}". Tab baru dibuat: ${res.createdTabs?.length || 0}, tab sudah ada: ${res.existingTabs?.length || 0}.`,
      });
      onNotify('Struktur 15 tab Google Sheets berhasil dibuat melalui Apps Script.');
    } else {
      setStatusFeedback({
        type: 'error',
        message: res.error || 'Gagal menyiapkan struktur tab Google Sheets.',
      });
    }
  };

  const handlePushAll = async () => {
    const activeUrl = urlInput.trim() || gasConfig.webAppUrl;
    if (!isValidAppsScriptUrl(activeUrl)) {
      setStatusFeedback({
        type: 'error',
        message: 'Masukkan URL Web App Google Apps Script yang valid terlebih dahulu.',
      });
      return;
    }
    setIsPushing(true);
    setStatusFeedback(null);
    const res = await syncStateToGas(activeUrl, state, tokenInput.trim() || gasConfig.apiToken);
    setIsPushing(false);

    if (res.success) {
      const refreshed = saveGasConfig({
        webAppUrl: activeUrl,
        apiToken: tokenInput.trim(),
        spreadsheetUrl: res.spreadsheetUrl || undefined,
        spreadsheetName: res.spreadsheetName || undefined,
      });
      onUpdateGasConfig(refreshed);
      setStatusFeedback({
        type: 'success',
        message: `Seluruh data (${totalDocs} dokumen, ${state.masterLocations.length} lokasi arsip, ${state.users.length} pengguna, dan profil perusahaan) berhasil disimpan ke 15 tab Google Sheets.`,
      });
      onNotify('Seluruh data berhasil disimpan ke Google Sheets.');
    } else {
      setStatusFeedback({
        type: 'error',
        message: res.error || 'Gagal menyimpan data ke Google Sheets.',
      });
    }
  };

  const handlePullFromSheet = async () => {
    const activeUrl = urlInput.trim() || gasConfig.webAppUrl;
    if (!isValidAppsScriptUrl(activeUrl)) {
      setStatusFeedback({
        type: 'error',
        message: 'Masukkan URL Web App Google Apps Script yang valid terlebih dahulu.',
      });
      return;
    }
    setIsPulling(true);
    setConfirmPull(false);
    setStatusFeedback(null);
    const res = await loadStateFromGas(activeUrl, tokenInput.trim() || gasConfig.apiToken);
    setIsPulling(false);

    if (res.success && res.hasData && res.state) {
      onHydrateStateFromSheet(res.state);
      const refreshed = saveGasConfig({
        spreadsheetUrl: res.spreadsheetUrl || undefined,
        spreadsheetName: res.spreadsheetName || undefined,
      });
      onUpdateGasConfig(refreshed);
      setStatusFeedback({
        type: 'success',
        message: `Data berhasil dimuat dari Google Sheets (pembaruan terakhir: ${res.updatedAt || 'baru saja'}).`,
      });
      onNotify('Data aplikasi berhasil dimuat ulang dari Google Sheets.');
    } else if (res.success && !res.hasData) {
      setStatusFeedback({
        type: 'info',
        message:
          res.message ||
          'Google Sheets masih kosong. Klik "Simpan Semua Data ke Sheet (Push)" untuk mengisi data awal.',
      });
    } else {
      setStatusFeedback({
        type: 'error',
        message: res.error || 'Gagal memuat data dari Google Sheets.',
      });
    }
  };

  const handleToggleAutoSync = () => {
    const updated = saveGasConfig({ autoSync: !gasConfig.autoSync });
    onUpdateGasConfig(updated);
    onNotify(
      updated.autoSync
        ? 'Auto-Sync ke Google Sheets diaktifkan.'
        : 'Auto-Sync ke Google Sheets dinonaktifkan (mode simpan manual).'
    );
  };

  const envSnippet = `VITE_GAS_WEBAPP_URL="${urlInput.trim() || 'https://script.google.com/macros/s/MASUKKAN_ID_DEPLOY_ANDA/exec'}"\nVITE_GAS_API_TOKEN="${tokenInput.trim()}"`;

  const gitCommandsSnippet = `git init
git add .
git commit -m "Deploy Arsip Dokumen dengan penyimpanan Google Sheets Apps Script"
git branch -M main
git remote add origin https://github.com/USERNAME_GITHUB/arsip-dokumen.git
git push -u origin main`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Database className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Penyimpanan Google Sheets (Apps Script) &amp; Deploy GitHub / Vercel
              </h1>
              <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                Database 15 tab Google Sheets terstruktur lewat deploy <code className="font-mono font-semibold text-slate-800">Code.gs</code> tanpa konfigurasi OAuth rumit — siap dipakai di AI Studio maupun di-deploy ke GitHub &amp; Vercel.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {gasConfig.spreadsheetUrl && (
              <a
                href={gasConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Buka Spreadsheet</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => downloadFile(codeGsRaw, 'Code.gs', 'text/javascript;charset=utf-8')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Code.gs</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('koneksi')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'koneksi'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            <span>Koneksi &amp; Struktur 15 Tab</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code-gs')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'code-gs'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Kode Code.gs ({codeLineCount} baris)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('panduan-gas')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'panduan-gas'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Panduan Deploy Apps Script</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github-vercel')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'github-vercel'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Rocket className="h-3.5 w-3.5" />
            <span>Integrasi GitHub &amp; Vercel</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: KONEKSI APPS SCRIPT & STRUKTUR 15 TAB                      */}
      {/* ================================================================= */}
      {activeTab === 'koneksi' && (
        <div className="space-y-6">
          {/* Connection Form Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Konfigurasi URL Deploy Google Apps Script Web App
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tempelkan URL hasil Deploy Web App (<code className="font-mono">https://script.google.com/macros/s/.../exec</code>) agar data otomatis tersimpan di Google Sheets.
                </p>
              </div>
              <div className="font-mono text-[11px] text-slate-600">
                {gasConfig.webAppUrl ? (
                  <span className="font-semibold text-emerald-700">
                    {gasSyncStatus === 'syncing'
                      ? 'Menyinkronkan...'
                      : gasConfig.lastSyncedAt
                      ? `Terakhir tersimpan: ${gasConfig.lastSyncedAt}`
                      : 'URL Tersimpan'}
                  </span>
                ) : (
                  <span className="text-slate-400">Belum terhubung</span>
                )}
              </div>
            </div>

            {gasConfig.isFromEnv && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
                URL Apps Script sedang terbaca otomatis dari Environment Variable{' '}
                <code className="font-mono font-semibold">VITE_GAS_WEBAPP_URL</code> (mode Vercel / GitHub).
              </div>
            )}

            <form onSubmit={handleSaveAndTest} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <label className="block text-xs font-semibold text-slate-700">
                    Web App URL (Google Apps Script Deploy)
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700">
                    API Token Keamanan (Opsional)
                  </label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Kosongkan jika API_TOKEN di Code.gs kosong"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={isTesting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji Koneksi...' : 'Simpan & Tes Koneksi'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSettingUp || !urlInput.trim()}
                  onClick={handleSetupTabs}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Table2 className="h-3.5 w-3.5 text-blue-700" />
                  <span>{isSettingUp ? 'Membuat 15 Tab...' : 'Buat Struktur 15 Tab Sheet'}</span>
                </button>

                <button
                  type="button"
                  disabled={isPushing || !urlInput.trim()}
                  onClick={handlePushAll}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>{isPushing ? 'Menyimpan...' : 'Simpan Semua Data ke Sheet (Push)'}</span>
                </button>

                {!confirmPull ? (
                  <button
                    type="button"
                    disabled={isPulling || !urlInput.trim()}
                    onClick={() => setConfirmPull(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <DownloadCloud className="h-3.5 w-3.5 text-slate-600" />
                    <span>{isPulling ? 'Memuat...' : 'Muat Data dari Sheet (Pull)'}</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs">
                    <span className="font-semibold text-amber-900">
                      Timpa data lokal dengan data Google Sheets?
                    </span>
                    <button
                      type="button"
                      onClick={handlePullFromSheet}
                      className="rounded bg-amber-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-800 cursor-pointer"
                    >
                      Ya, Muat
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmPull(false)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {/* Auto-Sync Toggle Bar */}
              <div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Auto-Sync Otomatis ke Google Sheets
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600">
                    Saat aktif dan URL Web App tersambung, setiap penambahan/perubahan dokumen, master data, user, maupun logo perusahaan otomatis disimpan ke Google Sheets dalam 2 detik.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoSync}
                  className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    gasConfig.autoSync
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {gasConfig.autoSync ? 'Auto-Sync: AKTIF' : 'Auto-Sync: NONAKTIF'}
                </button>
              </div>
            </form>

            {statusFeedback && (
              <div
                className={`mt-4 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs ${
                  statusFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : statusFeedback.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-900'
                    : 'border-blue-200 bg-blue-50 text-blue-900'
                }`}
              >
                {statusFeedback.type === 'success' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span className="leading-relaxed">{statusFeedback.message}</span>
              </div>
            )}
          </div>

          {/* 15-Tab Structure Blueprint Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Struktur 15 Tab Google Sheets Otomatis (Dibuat oleh Code.gs)
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Selain 15 tab tabel yang rapi untuk dibaca &amp; diaudit, <code className="font-mono">Code.gs</code> juga menyimpan cadangan penuh di tab tersembunyi <code className="font-mono">_AppState_DB</code> agar pemuatan lintas perangkat 100% akurat.
                </p>
              </div>
              <div className="font-mono text-xs font-semibold text-slate-700">
                Total: 15 Tab + 1 System DB
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <th className="px-3 py-2.5 w-10">No</th>
                    <th className="px-3 py-2.5">Nama Tab Sheet</th>
                    <th className="px-3 py-2.5">Modul Aplikasi</th>
                    <th className="px-3 py-2.5 text-right">Data Aktif</th>
                    <th className="px-3 py-2.5">Struktur Kolom Header</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {APPS_SCRIPT_SHEET_BLUEPRINT.map((item) => (
                    <tr key={item.tabName} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2.5 font-mono text-slate-500 tabular-nums">
                        {item.no}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                        {item.tabName}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                        {item.moduleTitle}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-700 tabular-nums">
                        {item.getCount(state)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                        {item.columns.join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: KODE CODE.GS LENGKAP DI DALAM APLIKASI AI STUDIO           */}
      {/* ================================================================= */}
      {activeTab === 'code-gs' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kode Lengkap <code className="font-mono text-blue-700">Code.gs</code> (Google Apps Script)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Salin seluruh kode di bawah ini ke editor Apps Script Google Spreadsheet Anda (<code className="font-mono">Extensions &gt; Apps Script</code>).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyText(codeGsRaw, 'code-gs', 'Seluruh kode Code.gs')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer"
              >
                {copiedKey === 'code-gs' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedKey === 'code-gs' ? 'Tersalin!' : 'Salin Code.gs'}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadFile(codeGsRaw, 'Code.gs', 'text/javascript;charset=utf-8')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh .gs</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-5 overflow-x-auto max-h-[580px] overflow-y-auto">
            <pre className="font-mono text-[11px] leading-relaxed text-emerald-300 whitespace-pre">
              {codeGsRaw}
            </pre>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span>
              Endpoint otomatis aktif setelah deploy: <code className="font-mono font-semibold">GET ?action=ping</code> · <code className="font-mono font-semibold">GET ?action=load</code> · <code className="font-mono font-semibold">POST action=setup</code> · <code className="font-mono font-semibold">POST action=syncAll</code>
            </span>
            <span className="font-mono text-slate-500">{codeLineCount} baris · UTF-8</span>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: PANDUAN DEPLOY APPS SCRIPT                                 */}
      {/* ================================================================= */}
      {activeTab === 'panduan-gas' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              5 Langkah Deploy Penyimpanan Google Sheets via Apps Script
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Ikuti urutan ini sekali saja untuk mengaktifkan Google Spreadsheet sebagai database permanen aplikasi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-mono text-xs font-bold text-blue-700">LANGKAH 01</div>
              <div className="mt-1 text-xs font-bold text-slate-900">Buat Spreadsheet Baru</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                Buka Google Sheets, buat file baru (misal: <em>Database Arsip Dokumen</em>), lalu klik menu <strong>Extensions &gt; Apps Script</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-mono text-xs font-bold text-blue-700">LANGKAH 02</div>
              <div className="mt-1 text-xs font-bold text-slate-900">Tempel Kode Code.gs</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                Buka tab <strong>Kode Code.gs</strong> di atas, klik <strong>Salin Code.gs</strong>, hapus isi lama di editor Apps Script, lalu tempel &amp; simpan (<code className="font-mono">Ctrl+S</code>).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-mono text-xs font-bold text-blue-700">LANGKAH 03</div>
              <div className="mt-1 text-xs font-bold text-slate-900">Jalankan Setup Tab</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                Pilih fungsi <code className="font-mono font-semibold">setupSpreadsheetTabs</code> di toolbar atas Apps Script, klik <strong>Run</strong>, lalu izinkan akses Google Sheets &amp; Drive.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-mono text-xs font-bold text-blue-700">LANGKAH 04</div>
              <div className="mt-1 text-xs font-bold text-slate-900">Deploy sebagai Web App</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                Klik <strong>Deploy &gt; New deployment &gt; Web app</strong>. Pilih <strong>Execute as: Me</strong> dan <strong>Who has access: Anyone</strong>, lalu klik <strong>Deploy</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-mono text-xs font-bold text-blue-700">LANGKAH 05</div>
              <div className="mt-1 text-xs font-bold text-slate-900">Hubungkan ke Aplikasi</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                Salin <strong>Web app URL</strong> (berakhiran <code className="font-mono">/exec</code>), tempel ke tab <strong>Koneksi</strong>, lalu klik <strong>Simpan &amp; Tes Koneksi</strong>.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
            <div className="font-bold flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-amber-700" />
              <span>Catatan Penting Keamanan &amp; CORS:</span>
            </div>
            <ul className="mt-2 list-disc list-inside space-y-1 text-[11px] leading-relaxed text-amber-900">
              <li>
                Aplikasi mengirim data menggunakan <code className="font-mono">Content-Type: text/plain</code> agar bebas hambatan CORS saat diakses dari AI Studio, Localhost, maupun Vercel.
              </li>
              <li>
                Jika ingin mengunci endpoint agar hanya aplikasi Anda yang bisa menulis ke Google Sheets, isi nilai <code className="font-mono">var API_TOKEN = 'rahasia-anda';</code> di baris atas <code className="font-mono">Code.gs</code>, lalu masukkan token yang sama di kolom API Token atau Vercel Env <code className="font-mono">VITE_GAS_API_TOKEN</code>.
              </li>
              <li>
                Setiap kali Anda mengubah <code className="font-mono">Code.gs</code>, wajib lakukan <strong>Deploy &gt; Manage deployments &gt; Edit &gt; Version: New version &gt; Deploy</strong>.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: INTEGRASI GITHUB & VERCEL                                  */}
      {/* ================================================================= */}
      {activeTab === 'github-vercel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Step A: Push ke GitHub */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <GitBranch className="h-5 w-5 text-slate-900" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    1. Push Kode Proyek ke GitHub
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Proyek Vite + React ini sudah dilengkapi <code className="font-mono">.gitignore</code>, <code className="font-mono">.env.example</code>, dan <code className="font-mono">vercel.json</code>.
                  </p>
                </div>
              </div>

              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
                <li>Unduh atau sinkronkan kode proyek ini dari AI Studio ke komputer lokal atau langsung ke repository GitHub baru.</li>
                <li>Buat repository kosong di GitHub (misal: <code className="font-mono font-semibold">arsip-dokumen</code>).</li>
                <li>Jalankan perintah Git berikut pada folder proyek:</li>
              </ol>

              <div className="relative rounded-lg bg-slate-950 p-4">
                <button
                  type="button"
                  onClick={() => copyText(gitCommandsSnippet, 'git-cmd', 'Perintah Git')}
                  className="absolute top-3 right-3 inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
                >
                  {copiedKey === 'git-cmd' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'git-cmd' ? 'Tersalin' : 'Salin'}</span>
                </button>
                <pre className="font-mono text-[11px] leading-relaxed text-sky-300 overflow-x-auto">
                  {gitCommandsSnippet}
                </pre>
              </div>
            </div>

            {/* Step B: Deploy ke Vercel */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <Rocket className="h-5 w-5 text-blue-700" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    2. Import &amp; Deploy Otomatis di Vercel
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Setiap kali Anda push perubahan ke GitHub, Vercel akan otomatis build dan deploy versi terbaru.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Framework Preset:</span>
                  <span className="font-mono font-semibold text-slate-900">Vite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Build Command:</span>
                  <span className="font-mono font-semibold text-slate-900">npm run build</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Output Directory:</span>
                  <span className="font-mono font-semibold text-slate-900">dist</span>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Environment Variables di Vercel (Project Settings &gt; Environment Variables):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(envSnippet, 'vercel-env', 'Environment Variables Vercel')}
                    className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedKey === 'vercel-env' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey === 'vercel-env' ? 'Tersalin' : 'Salin Env'}</span>
                  </button>
                </div>
                <div className="rounded-lg bg-slate-950 p-3.5">
                  <pre className="font-mono text-[11px] leading-relaxed text-emerald-300 overflow-x-auto">
                    {envSnippet}
                  </pre>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Dengan mengisi <code className="font-mono font-semibold">VITE_GAS_WEBAPP_URL</code> di Vercel, seluruh staf yang membuka URL Vercel Anda langsung terhubung ke Google Sheets yang sama secara otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* vercel.json Preview */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900">
                  Konfigurasi <code className="font-mono">vercel.json</code> (Sudah Tersedia di Root Proyek)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => copyText(vercelJsonRaw, 'vercel-json', 'Konfigurasi vercel.json')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {copiedKey === 'vercel-json' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedKey === 'vercel-json' ? 'Tersalin' : 'Salin vercel.json'}</span>
              </button>
            </div>
            <div className="mt-3 rounded-lg bg-slate-950 p-4">
              <pre className="font-mono text-[11px] leading-relaxed text-slate-200 overflow-x-auto">
                {vercelJsonRaw}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
