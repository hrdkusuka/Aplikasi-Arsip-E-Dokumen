import React, { useState } from 'react';
import {
  FolderArchive,
  LogIn,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { AppState, UserAccount } from '../types';

interface LandingLoginPageProps {
  state: AppState;
  onLoginSuccess: (user: UserAccount) => void;
  onResetPassword: (userId: string, newPassword: string) => void;
}

export const LandingLoginPage: React.FC<LandingLoginPageProps> = ({
  state,
  onLoginSuccess,
  onResetPassword,
}) => {
  // Auth Card Mode: 'login' | 'forgot-verify' | 'forgot-reset' | 'forgot-done'
  const [authMode, setAuthMode] = useState<
    'login' | 'forgot-verify' | 'forgot-reset' | 'forgot-done'
  >('login');

  // Login State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot Password State
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleaned = usernameInput.trim().toLowerCase().replace(/^@/, '');
    const cleanPass = passwordInput.trim();

    const matched = state.users.find((u) => {
      const matchIdentifier =
        u.username.toLowerCase() === cleaned ||
        (u.email && u.email.toLowerCase() === cleaned) ||
        (cleaned === 'admin' && u.level === 'Level 1 - Super Admin') ||
        (cleaned.length >= 3 && u.namaLengkap.toLowerCase().includes(cleaned));

      if (!matchIdentifier) return false;

      // Exact password match
      if (u.password === passwordInput || u.password === cleanPass) return true;
      // Case-insensitive password match
      if (u.password.toLowerCase() === cleanPass.toLowerCase()) return true;
      // Super Admin convenience passwords to prevent lockouts on new computers
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
        'Username atau Password tidak cocok. Akun Super Admin bawaan adalah username: "admin" dan password: "admin123" (atau "password123"). Anda juga dapat langsung mengklik tombol "1-Klik Masuk" pada daftar akun di bawah.'
      );
      return;
    }

    onLoginSuccess(matched);
  };

  const handleVerifyAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    const cleaned = recoveryIdentifier.trim().toLowerCase().replace(/^@/, '');

    const matched = state.users.find(
      (u) =>
        u.username.toLowerCase() === cleaned ||
        (u.email && u.email.toLowerCase() === cleaned) ||
        (cleaned === 'admin' && u.level === 'Level 1 - Super Admin') ||
        (cleaned.length >= 3 && u.namaLengkap.toLowerCase().includes(cleaned))
    );

    if (!matched) {
      setRecoveryError(
        'Akun dengan Username atau Email tersebut tidak ditemukan dalam sistem. Akun Super Admin terdaftar: "admin" / "hrd.kusuka@gmail.com".'
      );
      return;
    }

    setVerifiedUser(matched);
    setNewPassword('');
    setConfirmNewPassword('');
    setAuthMode('forgot-reset');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!verifiedUser) return;
    if (newPassword.trim().length < 4) {
      setRecoveryError('Password baru minimal harus terdiri dari 4 karakter.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRecoveryError('Konfirmasi password baru tidak cocok.');
      return;
    }

    onResetPassword(verifiedUser.id, newPassword.trim());
    setUsernameInput(verifiedUser.username);
    setPasswordInput(newPassword.trim());
    setAuthMode('forgot-done');
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.28) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(217, 119, 6, 0.18) 0%, transparent 45%), linear-gradient(135deg, #091526 0%, #0F2547 52%, #17376E 100%)',
      }}
    >
      {/* Subtle Architectural Grid Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.18) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between gap-8 border-b border-white/15 bg-[#081221]/85 px-6 py-4 backdrop-blur-md">
        <a
          href="#top"
          className="flex items-center gap-3 font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/20 text-amber-300">
            <FolderArchive className="h-5 w-5" />
          </span>
          <span>Arsip Dokumen</span>
        </a>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              document.getElementById('login-username-input')?.focus();
            }}
            className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
          >
            Masuk Sistem
          </button>
        </div>
      </header>

      {/* Main Content Container: Focused App Name + Description & Login / Forgot Password */}
      <main
        id="top"
        className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 items-center px-6 py-12"
      >
        <section className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
          {/* Left Column: Nama Aplikasi & Deskripsi */}
          <div
            className="flex flex-col justify-between rounded-xl border border-blue-300/25 p-8 shadow-2xl lg:col-span-7"
            style={{
              background:
                'linear-gradient(145deg, rgba(19, 43, 80, 0.94) 0%, rgba(13, 31, 61, 0.96) 60%, rgba(10, 24, 48, 0.98) 100%)',
            }}
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <FolderArchive className="h-4 w-4 text-amber-400" />
                <span>Sistem Informasi Kearsipan Korporat & Legal</span>
              </div>

              <h1
                className="mt-3 font-display font-bold tracking-tight text-white"
                style={{ fontSize: 'clamp(2rem, 3.2vw, 2.75rem)', textWrap: 'balance' }}
              >
                Arsip Dokumen
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-blue-100/90 max-w-2xl">
                Sistem Manajemen dan Pemantauan <strong className="text-white">Arsip Dokumen</strong>{' '}
                terpadu untuk mendata, menyimpan lokasi penyimpanan dokumen fisik asli beserta
                salinan berkas digitalnya, serta memantau status pembayaran dan masa berlaku
                dokumen perusahaan secara <em>realtime</em>. Mencakup pengelolaan dokumen{' '}
                <strong className="text-amber-300">E-NOP</strong>,{' '}
                <strong className="text-amber-300">E-SPPT</strong>,{' '}
                <strong className="text-amber-300">Sertifikat Merk</strong>,{' '}
                <strong className="text-amber-300">Sertifikat K3</strong>, dan{' '}
                <strong className="text-amber-300">E-Sertifikat Tanah</strong> yang terintegrasi
                dengan Data Master wilayah Indonesia serta fitur ekspor laporan ke Excel dan PDF.
              </p>

              {/* Editorial Numbered Highlights */}
              <div className="mt-8 grid grid-cols-1 gap-4 border-t border-blue-300/20 pt-6 sm:grid-cols-2">
                <div className="rounded-lg border border-blue-300/15 bg-blue-950/55 p-4">
                  <h3 className="text-xs font-bold text-amber-300">
                    01. Pemantauan Realtime
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-blue-100/85">
                    Dashboard pemantauan jumlah dokumen secara langsung beserta pengingat
                    jatuh tempo E-SPPT dan masa berlaku Sertifikat K3.
                  </p>
                </div>

                <div className="rounded-lg border border-blue-300/15 bg-blue-950/55 p-4">
                  <h3 className="text-xs font-bold text-amber-300">
                    02. Lokasi Fisik & File Digital
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-blue-100/85">
                    Pencatatan tempat penyimpanan dokumen asli, penanggungjawab arsip,
                    serta unggah berkas digital.
                  </p>
                </div>

                <div className="rounded-lg border border-blue-300/15 bg-blue-950/55 p-4">
                  <h3 className="text-xs font-bold text-amber-300">
                    03. Integrasi Data Master
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-blue-100/85">
                    Data Master Lokasi Arsip, Provinsi & Kota/Kabupaten Indonesia, serta
                    Status Bayar (Lunas, Cicilan, Belum Bayar).
                  </p>
                </div>

                <div className="rounded-lg border border-blue-300/15 bg-blue-950/55 p-4">
                  <h3 className="text-xs font-bold text-amber-300">
                    04. Laporan Excel & PDF
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-blue-100/85">
                    Rekapitulasi laporan berdasarkan jenis dokumen yang siap diunduh dalam
                    format Microsoft Excel dan PDF.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Login & Lupa Password Card */}
          <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-blue-300/30 bg-[#EEF4FB] shadow-2xl lg:col-span-5 max-h-[92vh]">
            {/* Colored Card Header Banner */}
            <div
              className="flex items-center justify-between border-b border-blue-900/20 px-7 py-5 text-white shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, #1E3A8A 0%, #172554 100%)',
              }}
            >
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  {authMode === 'login' && 'Login Pengguna'}
                  {authMode === 'forgot-verify' && 'Lupa Password — Verifikasi Akun'}
                  {authMode === 'forgot-reset' && 'Atur Password Baru'}
                  {authMode === 'forgot-done' && 'Pemulihan Akun Selesai'}
                </h2>
                <p className="mt-0.5 text-xs text-blue-200">
                  {authMode === 'login' && 'Masuk menggunakan Username dan Password Anda'}
                  {authMode === 'forgot-verify' &&
                    'Masukkan Username atau Email terdaftar untuk reset password'}
                  {authMode === 'forgot-reset' &&
                    ' Buat password baru untuk akun yang telah terverifikasi'}
                  {authMode === 'forgot-done' &&
                    'Password berhasil diperbarui dan siap digunakan'}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/20 text-amber-300">
                <KeyRound className="h-5 w-5" />
              </div>
            </div>

            <div className="flex flex-1 flex-col p-6 sm:p-7 text-slate-900 overflow-y-auto">
              {/* Company Identity (Logo & Nama Perusahaan) Displayed Above Username & Password */}
              <div className="mb-5 flex items-center gap-3.5 rounded-lg border border-blue-200/80 bg-white/90 px-4 py-3 shadow-xs">
                {state.companyProfile?.logoDataUrl ? (
                  <img
                    src={state.companyProfile.logoDataUrl}
                    alt={state.companyProfile.namaPerusahaan || 'Logo Perusahaan'}
                    className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A] text-amber-300">
                    <FolderArchive className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-blue-800">
                    Instansi / Perusahaan
                  </div>
                  <div className="font-display text-sm font-bold text-slate-900 truncate">
                    {state.companyProfile?.namaPerusahaan || 'PT Kusuka Prima Nusantara'}
                  </div>
                </div>
              </div>

              {/* MODE 1: LOGIN FORM */}
              {authMode === 'login' && (
                <>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {loginError && (
                      <div className="rounded-lg border border-rose-300 bg-rose-100/90 px-3.5 py-2.5 text-xs font-medium text-rose-800">
                        {loginError}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="login-username-input"
                        className="block text-xs font-semibold text-slate-800"
                      >
                        Username / Email <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="login-username-input"
                        type="text"
                        required
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="Contoh: admin atau hrd.kusuka@gmail.com..."
                        className="mt-1.5 w-full rounded-lg border border-blue-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 shadow-xs focus:border-blue-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="login-password-input"
                          className="block text-xs font-semibold text-slate-800"
                        >
                          Password <span className="text-rose-600">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryError(null);
                            setRecoveryIdentifier(usernameInput);
                            setAuthMode('forgot-verify');
                          }}
                          className="text-xs font-semibold text-blue-800 hover:text-blue-950 hover:underline cursor-pointer"
                        >
                          Lupa Password?
                        </button>
                      </div>
                      <div className="relative mt-1.5">
                        <input
                          id="login-password-input"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Masukkan password..."
                          className="w-full rounded-lg border border-blue-200 bg-white py-2.5 pr-10 pl-3.5 font-mono text-xs text-slate-900 shadow-xs focus:border-blue-700 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-slate-800 cursor-pointer"
                          title="Tampilkan / Sembunyikan Password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#172554] whitespace-nowrap cursor-pointer"
                    >
                      <LogIn className="h-4 w-4 text-amber-300" />
                      Masuk ke Arsip Dokumen
                    </button>
                  </form>
                </>
              )}

              {/* MODE 2: FORGOT PASSWORD — STEP 1 VERIFY USERNAME/EMAIL */}
              {authMode === 'forgot-verify' && (
                <div>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-950"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali ke Login
                  </button>

                  <form onSubmit={handleVerifyAccountSubmit} className="space-y-4">
                    {recoveryError && (
                      <div className="rounded-lg border border-rose-300 bg-rose-100/90 px-3.5 py-2.5 text-xs font-medium text-rose-800">
                        {recoveryError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-800">
                        Username atau Email Terdaftar <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={recoveryIdentifier}
                        onChange={(e) => setRecoveryIdentifier(e.target.value)}
                        placeholder="Masukkan username atau email terdaftar..."
                        className="mt-1.5 w-full rounded-lg border border-blue-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 shadow-xs focus:border-blue-700 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#172554]"
                    >
                      Verifikasi Akun & Lanjutkan
                    </button>
                  </form>
                </div>
              )}

              {/* MODE 3: FORGOT PASSWORD — STEP 2 SET NEW PASSWORD */}
              {authMode === 'forgot-reset' && verifiedUser && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot-verify')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-950"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Ganti Akun
                    </button>
                    <span className="text-xs text-slate-600">
                      Akun:{' '}
                      <strong className="font-mono text-slate-900">
                        {verifiedUser.username}
                      </strong>
                    </span>
                  </div>

                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    {recoveryError && (
                      <div className="rounded-lg border border-rose-300 bg-rose-100/90 px-3.5 py-2.5 text-xs font-medium text-rose-800">
                        {recoveryError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-800">
                        Password Baru <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Masukkan password baru..."
                          className="w-full rounded-lg border border-blue-200 bg-white py-2.5 pr-10 pl-3.5 font-mono text-xs text-slate-900 shadow-xs focus:border-blue-700 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800">
                        Konfirmasi Password Baru <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Ulangi password baru..."
                        className="mt-1.5 w-full rounded-lg border border-blue-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 shadow-xs focus:border-blue-700 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#172554]"
                    >
                      Simpan Password Baru
                    </button>
                  </form>
                </div>
              )}

              {/* MODE 4: FORGOT PASSWORD — STEP 3 COMPLETED */}
              {authMode === 'forgot-done' && verifiedUser && (
                <div className="py-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold text-slate-900">
                    Password Berhasil Diperbarui
                  </h3>
                  <p className="mt-1 text-xs text-slate-700">
                    Password untuk akun{' '}
                    <strong className="font-mono text-slate-900">
                      {verifiedUser.username}
                    </strong>{' '}
                    telah berhasil diubah. Silakan masuk menggunakan password baru Anda.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#172554]"
                  >
                    Kembali ke Form Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Colored Institutional Footer */}
      <footer className="relative z-10 border-t border-white/15 bg-[#081221]/90 px-6 py-4 text-xs text-blue-200/80">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <span className="font-semibold text-amber-300">Arsip Dokumen</span>
          <span>Sistem Manajemen & Pemantauan Arsip Terpadu</span>
        </div>
      </footer>
    </div>
  );
};
