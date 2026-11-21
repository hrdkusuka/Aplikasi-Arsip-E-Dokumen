import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Download,
  Printer,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Shield,
  Layers,
  FileText,
  Scale,
  Zap,
  HardHat,
  Award,
  Building2,
  MapPin,
  Users,
  Database,
  Cloud,
  ExternalLink,
  Info,
  CalendarClock,
  Sparkles,
  GitBranch,
  ArrowRight,
  ArrowDown,
  FileSpreadsheet,
  Code,
  Rocket,
  Table2,
} from 'lucide-react';
import { AppState } from '../types';
import { generateEBookPDF } from '../utils/generateEBookPdf';
import { APPS_SCRIPT_SHEET_BLUEPRINT } from '../services/appsScriptStorage';
import codeGsRaw from '../../gas/Code.gs?raw';
import vercelJsonRaw from '../../vercel.json?raw';

interface EBookViewProps {
  state: AppState;
  onNotify: (msg: string) => void;
}

export const EBookView: React.FC<EBookViewProps> = ({ state, onNotify }) => {
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSql, setCopiedSql] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const companyName = state.companyProfile.namaPerusahaan || 'PT Kusuka Prima Nusantara';

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      generateEBookPDF(state);
      onNotify('Berhasil mengunduh E-Book resmi format PDF (12 Halaman Lengkap).');
    } catch (err) {
      console.error(err);
      onNotify('Terjadi kendala saat menghasilkan PDF E-Book.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyCode = (codeText: string, id: string, label = 'Kode') => {
    navigator.clipboard.writeText(codeText);
    setCopiedSql(id);
    onNotify(`${label} berhasil disalin ke clipboard.`);
    setTimeout(() => setCopiedSql(null), 2500);
  };

  const handleDownloadCodeGs = () => {
    const blob = new Blob([codeGsRaw], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify('Berkas Code.gs berhasil diunduh.');
  };

  const sqlTimbangan = `-- SKEMA DATABASE POSTGRESQL / SUPABASE
-- Tabel Sertifikat Uji Timbangan (Metrologi Legal & Tera)
CREATE TABLE docs_timbangan (
  id VARCHAR(64) PRIMARY KEY,
  no_arsip VARCHAR(64) NOT NULL UNIQUE,
  id_pengujian VARCHAR(64),
  jenis_timbangan VARCHAR(64) NOT NULL, -- ELEKTRONIK, JEMBATAN ELEKTRONIK
  nomor_surat_pengujian VARCHAR(128) NOT NULL,
  nomor_order VARCHAR(128),
  nama_alat_ukur VARCHAR(255) NOT NULL,
  merek_pabrik_buatan VARCHAR(128) NOT NULL,
  model_tipe VARCHAR(128) NOT NULL,
  nomor_seri_identitas VARCHAR(128) NOT NULL,
  kapasitas_maksimum_kg NUMERIC(12,2) NOT NULL,
  kapasitas_minimum_kg NUMERIC(12,2) NOT NULL,
  daya_baca_kg NUMERIC(10,4),
  interval_skala_terkecil_d_kg NUMERIC(10,4),
  interval_skala_verifikasi_e_kg NUMERIC(10,4),
  kelas_keakurasian VARCHAR(32) NOT NULL,
  pemilik_pemakai VARCHAR(255) NOT NULL,
  alamat_pemilik TEXT NOT NULL,
  instansi_penerbit VARCHAR(255) NOT NULL,
  unit_instansi VARCHAR(255),
  nomor_sk_kkpttu_uutp VARCHAR(128),
  tanggal_sk_kkpttu_uutp DATE,
  tanggal_terbit_surat DATE NOT NULL,
  tempat_penerbitan VARCHAR(128) NOT NULL,
  berlaku_sampai DATE NOT NULL,
  status_dokumen VARCHAR(32) NOT NULL, -- LENGKAP, BELUM LENGKAP
  status_masa_berlaku VARCHAR(32) NOT NULL, -- AKTIF, SEGERA HABIS, KADALUARSA
  arsip_dokumen_id VARCHAR(64) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

  const sqlSlo = `-- SKEMA DATABASE POSTGRESQL / SUPABASE
-- Tabel Sertifikat Laik Operasi (SLO Genset & Listrik)
CREATE TABLE docs_slo (
  id VARCHAR(64) PRIMARY KEY,
  no_arsip VARCHAR(64) NOT NULL UNIQUE,
  id_slo VARCHAR(64),
  jenis_slo VARCHAR(32) NOT NULL, -- GENSET, LISTRIK
  no_slo VARCHAR(128) NOT NULL,
  tanggal_terbit DATE NOT NULL,
  tanggal_berlaku DATE NOT NULL,
  status_slo VARCHAR(32) NOT NULL, -- AKTIF, PROSES, KADALUARSA, DICABUT
  nama_perusahaan VARCHAR(255) NOT NULL,
  lokasi_instalasi VARCHAR(255) NOT NULL,
  alamat_instalasi TEXT NOT NULL,
  jenis_instalasi VARCHAR(32) NOT NULL, -- PEMBANGKIT, PEMANFAATAN
  sumber_energi VARCHAR(32) NOT NULL, -- DIESEL, GAS, BENSIN, PLN, LAINNYA
  merek_peralatan VARCHAR(128) NOT NULL,
  tipe_peralatan VARCHAR(128) NOT NULL,
  nomor_seri VARCHAR(128) NOT NULL,
  kapasitas_kva NUMERIC(10,2) NOT NULL,
  daya_kw NUMERIC(10,2) NOT NULL,
  tegangan_v VARCHAR(64) NOT NULL,
  fasa VARCHAR(16) NOT NULL, -- 1 FASA, 3 FASA
  frekuensi_hz NUMERIC(6,2) NOT NULL,
  nomor_penyedia VARCHAR(128),
  lembaga_inspeksi VARCHAR(255) NOT NULL,
  nomor_registrasi VARCHAR(128) NOT NULL,
  pic VARCHAR(128) NOT NULL,
  arsip_dokumen_id VARCHAR(64) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

  const chapters = [
    {
      id: 0,
      title: 'Cover & Ringkasan Eksekutif',
      subtitle: 'Identitas Dokumen, Visi & Komitmen Kearsipan',
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-lg">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-400/30">
              <Sparkles className="h-3.5 w-3.5" />
              OFFICIAL ENTERPRISE E-BOOK · EDISI TERBARU 2026
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl text-white">
              BUKU PANDUAN LENGKAP &amp; DOKUMENTASI TEKNIS
            </h1>
            <p className="mt-2 text-lg font-bold text-sky-400">
              SISTEM MANAJEMEN ARSIP DOKUMEN TERPADU
            </p>
            <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Panduan terpadu tata kelola 8 kategori arsip penting perusahaan ({companyName}),
              spesifikasi metrologi Uji Timbangan &amp; SLO listrik/genset, matriks hak akses RBAC,
              kebijakan reset password aman, panduan akses online PWA, serta arsitektur integrasi
              cloud database (Supabase &amp; Cloud SQL PostgreSQL).
            </p>

            <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-800 pt-5 text-xs text-slate-400">
              <div>
                <span className="font-semibold text-slate-200">Entitas:</span> {companyName}
              </div>
              <span aria-hidden="true">·</span>
              <div>
                <span className="font-semibold text-slate-200">Klasifikasi:</span> Rahasia Internal
              </div>
              <span aria-hidden="true">·</span>
              <div>
                <span className="font-semibold text-slate-200">Versi:</span> Edisi 2.5 (Enterprise)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Layers className="h-4 w-4 text-blue-600" />
                8 Kategori Dokumen
              </div>
              <p className="mt-1 text-xs text-blue-800/90 leading-relaxed">
                PBB, IMB, Sertifikat Tanah, K3, Merk DJKI, SLO Genset/Listrik, dan Uji Timbangan Tera.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CalendarClock className="h-4 w-4 text-emerald-600" />
                Pemantauan Jatuh Tempo
              </div>
              <p className="mt-1 text-xs text-emerald-800/90 leading-relaxed">
                Kalkulasi otomatis masa berlaku izin &amp; pajak dengan notifikasi batas waktu 30 hari.
              </p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <Cloud className="h-4 w-4 text-purple-600" />
                Siap Online &amp; Database Cloud
              </div>
              <p className="mt-1 text-xs text-purple-800/90 leading-relaxed">
                Akses online Cloud Run, PWA lintas perangkat, dan integrasi PostgreSQL Supabase.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Bab 1: Gambaran Umum & Dashboard Realtime',
      subtitle: 'Konsep Digital Twin Arsip & Fitur Utama Pemantauan',
      icon: Layers,
      content: (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">
            BAB I: GAMBARAN UMUM, VISI &amp; DASHBOARD REALTIME
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-blue-900">
              1.1 Konsep Digital Twin Arsip Dokumen
            </h3>
            <p className="text-xs sm:text-sm">
              Sistem Manajemen Arsip Dokumen Terpadu dibangun dengan prinsip <strong>Digital Twin Kearsipan</strong>. Artinya, setiap berkas fisik berharga (sertifikat tanah asli, akta hak cipta merk dagang, sertifikat uji beban K3, surat kelaikan operasi listrik, dan sertifikat tera timbangan) yang berada di lemari besi kantor pusat maupun cabang memiliki kembaran digital terverifikasi di cloud.
            </p>
            <p className="text-xs sm:text-sm">
              Hal ini memastikan dokumen tidak mudah hilang, mudah diaudit kapan saja, dan masa berlakunya terpantau tanpa harus membuka lemari berkas fisik satu per satu.
            </p>

            <h3 className="text-sm font-bold text-blue-900 pt-2">
              1.2 Struktur Komponen Dashboard
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
              <li>
                <strong>Strip Counter 8 Kategori:</strong> Memberikan pandangan langsung jumlah arsip yang terdata secara instan di setiap divisi.
              </li>
              <li>
                <strong>Mesin Pengingat Jatuh Tempo (Deadline Engine):</strong> Mengklasifikasikan dokumen ke dalam status <em>Aman</em>, <em>Mendekati Jatuh Tempo (&le; 30 hari)</em>, dan <em>Lewat Batas Waktu (Overdue)</em>.
              </li>
              <li>
                <strong>Visualisasi Distribusi Fisik:</strong> Memberikan peta persentase beban dokumen pada Lemari Besi A-01, Brankas HAKI B-02, Kabinet HSE C-01, dan Cabang Surabaya D-04.
              </li>
              <li>
                <strong>Ekspor Cepat Laporan Eksekutif:</strong> Menyediakan ekspor satu klik ke format Microsoft Excel (.xlsx) dan dokumen resmi PDF (.pdf).
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Bab 2: Struktur 8 Kategori Arsip Dokumen',
      subtitle: 'Spesifikasi Field Kolom, SLO 28 Kolom & Uji Timbangan 23 Kolom',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">
            BAB II: SPESIFIKASI &amp; STRUKTUR 8 KATEGORI ARSIP
          </h2>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-blue-900">
              2.1 Ringkasan 8 Kategori Dokumen Arsip
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-xs text-blue-900">1. E-SPPT (Pajak PBB)</span>
                <p className="text-[11px] text-slate-600 mt-0.5">Surat Pemberitahuan Pajak Terhutang &amp; NOP 18 digit.</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-xs text-blue-900">2. Bukti Bayar PBB (E-NOP)</span>
                <p className="text-[11px] text-slate-600 mt-0.5">Bukti setor kas daerah &amp; status pembayaran lunas.</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-xs text-blue-900">3. E-Sertifikat Tanah</span>
                <p className="text-[11px] text-slate-600 mt-0.5">Hak milik / HGB, NIB, luas tanah m² dan pemegang hak BPN.</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-xs text-blue-900">4. E-IMB (Izin Bangunan)</span>
                <p className="text-[11px] text-slate-600 mt-0.5">Nomor SK keputusan, tahun izin, dan bangunan pabrik/kantor.</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-xs text-blue-900">5. Sertifikat K3</span>
                <p className="text-[11px] text-slate-600 mt-0.5">Forklift, Boiler, Bejana Tekan, uji kelayakan dinas tenaga kerja.</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-xs text-blue-900">6. Sertifikat Merk (DJKI)</span>
                <p className="text-[11px] text-slate-600 mt-0.5">Pendaftaran HAKI, kelas barang/jasa, etiket, masa hak 10 tahun.</p>
              </div>
              <div className="rounded-lg border border-amber-300 p-3 bg-amber-50/70">
                <span className="font-bold text-xs text-amber-900">7. Sertifikat SLO (28 Kolom)</span>
                <p className="text-[11px] text-amber-800 mt-0.5">Kelaikan operasi listrik PLN &amp; genset kapasitas kVA/kW.</p>
              </div>
              <div className="rounded-lg border border-teal-300 p-3 bg-teal-50/70">
                <span className="font-bold text-xs text-teal-900">8. Uji Timbangan (23 Kolom)</span>
                <p className="text-[11px] text-teal-800 mt-0.5">Metrologi legal, SKHP, tera jembatan timbang &amp; timbangan lab.</p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-amber-900 pt-4">
              2.2 Struktur Khusus Sertifikat Laik Operasi (SLO - 28 Atribut)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Memuat parameter: <code>ID_SLO, JENIS_SLO (GENSET/LISTRIK), NO_SLO, TANGGAL_TERBIT, TANGGAL_BERLAKU, STATUS_SLO (AKTIF, PROSES, KADALUARSA, DICABUT), NAMA_PERUSAHAAN, LOKASI_INSTALASI, ALAMAT_INSTALASI, JENIS_INSTALASI (PEMBANGKIT, PEMANFAATAN), SUMBER_ENERGI (DIESEL, GAS, BENSIN, PLN, LAINNYA), MEREK_PERALATAN, TIPE_PERALATAN, NOMOR_SERI, KAPASITAS_KVA, DAYA_KW, TEGANGAN_V, FASA (1 FASA, 3 FASA), FREKUENSI_HZ, NOMOR_PENYEDIA, LEMBAGA_INSPEKSI, NOMOR_REGISTRASI, FILE_SLO, FILE_PENDUKUNG, PIC, KETERANGAN, CREATED_AT, UPDATED_AT</code>.
            </p>

            <h3 className="text-sm font-bold text-teal-900 pt-4">
              2.3 Struktur Khusus Sertifikat Uji Timbangan (23 Atribut)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Didesain fleksibel untuk mengakomodasi dua jenis instrumen ukur:
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 mt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2.5 font-semibold">Atribut / Parameter</th>
                    <th className="p-2.5 font-semibold">Timbangan Elektronik</th>
                    <th className="p-2.5 font-semibold">Timbangan Jembatan Elektronik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-mono">NOMOR_ORDER</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Digunakan (SPK Kalibrasi Lab)</td>
                    <td className="p-2.5 text-slate-400">Opsional / Tidak Wajib</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono">DAYA_BACA_KG</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Wajib (Ketelitian Digital Lab/QC)</td>
                    <td className="p-2.5 text-slate-400">Opsional</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono">INTERVAL_SKALA_D &amp; E</td>
                    <td className="p-2.5 text-slate-400">Opsional</td>
                    <td className="p-2.5 text-teal-700 font-semibold">Wajib (Skala Verifikasi Legal Tera)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono">SK_KKPTTU_UUTP &amp; TANGGAL</td>
                    <td className="p-2.5 text-slate-400">Opsional</td>
                    <td className="p-2.5 text-teal-700 font-semibold">Wajib (Izin Tanda Pabrik Timbangan)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono">BERLAKU_SAMPAI &amp; STATUS</td>
                    <td className="p-2.5 text-blue-700 font-semibold">Wajib (Jatuh Tempo Tera)</td>
                    <td className="p-2.5 text-blue-700 font-semibold">Wajib (Jatuh Tempo Tera)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Bab 3: Lokasi Fisik & Cetak Label 3x8 cm',
      subtitle: 'Standarisasi Tata Kelola Lemari & Pembuatan Barcode Fisik',
      icon: MapPin,
      content: (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">
            BAB III: MANAJEMEN LOKASI FISIK &amp; LABEL 3x8 CM
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-blue-900">
              3.1 Pengelolaan Lemari, Brankas &amp; Penanggung Jawab
            </h3>
            <p className="text-xs sm:text-sm">
              Sistem menugaskan penanggung jawab spesifik pada setiap lokasi penyimpanan arsip untuk menjamin akuntabilitas:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li><strong>Lemari Besi A-01:</strong> Ruang Arsip Legal &amp; Pajak (PIC: Budi Santoso, S.E.)</li>
              <li><strong>Brankas HAKI B-02:</strong> Ruang Corporate Secretary (PIC: Siti Rahmawati, S.H.)</li>
              <li><strong>Kabinet HSE C-01:</strong> Gedung Operasional Pabrik Cikarang (PIC: Ir. Hendra Wijaya)</li>
              <li><strong>Lemari Cabang D-04:</strong> Kantor Cabang Rungkut Industri Surabaya (PIC: Dwi Prasetyo, S.T.)</li>
            </ul>

            <h3 className="text-sm font-bold text-blue-900 pt-3">
              3.2 Studio Cetak Label Standar 3x8 cm
            </h3>
            <p className="text-xs sm:text-sm">
              Untuk mengakhiri masalah berkas terselip, sistem menyediakan studio cetak label berpola stiker standar 3x8 cm yang dapat dicetak langsung ke lembar kertas A4 atau kertas stiker.
            </p>
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-900">
              <span className="font-bold">Elemen Wajib Pada Label:</span>
              <p className="mt-1">
                Kop PT Kusuka Prima Nusantara, Kategori Dokumen, Nomor Arsip Sistem, Nomor Registrasi Resmi Dokumen, Lokasi Lemari Fisik, serta Garis Barcode Unik.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Bab 4: Pengguna, Matriks RBAC & Reset Password',
      subtitle: 'Tingkatan Akses Level 1-4 & Prosedur Reset Password Aman',
      icon: Users,
      content: (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">
            BAB IV: MANAJEMEN PENGGUNA, RBAC &amp; RESET PASSWORD
          </h2>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-blue-900">
              4.1 Matriks Hak Akses Berjenjang (RBAC)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2.5 font-semibold">Level Pengguna</th>
                    <th className="p-2.5 font-semibold">Contoh Akun</th>
                    <th className="p-2.5 font-semibold">Kewenangan Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-700">Level 1 - Super Admin</td>
                    <td className="p-2.5 font-mono">admin, admin.pusat</td>
                    <td className="p-2.5">Akses menyeluruh, kelola pengguna &amp; role, reset password, konfigurasi sistem.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-blue-700">Level 2 - Admin Arsip</td>
                    <td className="p-2.5 font-mono">siti.legal</td>
                    <td className="p-2.5">Input &amp; edit arsip, cetak label, ekspor laporan Excel/PDF.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-700">Level 3 - Staff Operasional</td>
                    <td className="p-2.5 font-mono">budi.pajak, hendra.k3</td>
                    <td className="p-2.5">Input dokumen sesuai bidang tugas (PBB/Pajak atau K3/Teknis).</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-600">Level 4 - Viewer</td>
                    <td className="p-2.5 font-mono">auditor.internal</td>
                    <td className="p-2.5">Hanya melihat data (read-only) dan verifikasi audit.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-bold text-blue-900 pt-3">
              4.2 Prosedur &amp; Kebijakan Reset Password Non-Super Admin
            </h3>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <Shield className="h-4 w-4 text-amber-600" />
                Ketentuan Keamanan Kredensial:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-800">
                <li>
                  <strong>Akun Super Admin TIDAK Boleh Terpengaruh:</strong> Akun <code>admin</code> dan <code>admin.pusat</code> tetap mempertahankan password administrator untuk menjamin kendali sistem.
                </li>
                <li>
                  <strong>Reset Serentak Akun Non-Super Admin:</strong> Seluruh akun staf (Level 2, 3, dan 4) dapat direset serempak menjadi kata sandi default: <code>password123</code>.
                </li>
                <li>
                  <strong>Tombol Eksekusi Cepat:</strong> Super Admin dapat menekan tombol <em>&ldquo;Reset Password Non-Super Admin&rdquo;</em> di menu Pengaturan -&gt; Daftar Akun.
                </li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Bab 5: Panduan Online, PWA & Deployment',
      subtitle: 'Akses Cloud Run, Pemasangan di PC/Ponsel, dan Opsi Hosting Mandiri',
      icon: Cloud,
      content: (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">
            BAB V: PANDUAN ONLINE, PWA &amp; DEPLOYMENT
          </h2>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-blue-900">
              5.1 Menggunakan Aplikasi Secara Online
            </h3>
            <p className="text-xs sm:text-sm">
              Aplikasi ini telah aktif online dan dapat diakses kapan saja oleh staf di kantor maupun di luar kantor melalui URL resmi:
            </p>
            <div className="rounded-lg bg-slate-900 p-3 text-sky-300 font-mono text-xs break-all flex items-center justify-between">
              <span>https://ais-pre-hgdpw2wfdbi5fafiwexhrv-836903566282.asia-northeast1.run.app</span>
              <a
                href="https://ais-pre-hgdpw2wfdbi5fafiwexhrv-836903566282.asia-northeast1.run.app"
                target="_blank"
                rel="noreferrer"
                className="ml-2 text-white hover:text-sky-200 inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <h3 className="text-sm font-bold text-blue-900 pt-3">
              5.2 Pemasangan Progressive Web App (PWA)
            </h3>
            <p className="text-xs sm:text-sm">
              Untuk kenyamanan staf, aplikasi dapat dipasang langsung pada perangkat:
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <span className="font-bold text-slate-900">PC / Laptop (Windows/Mac)</span>
                <p className="text-slate-600 mt-1">Buka di Chrome/Edge -&gt; Klik ikon instal di kanan address bar -&gt; Selesai.</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <span className="font-bold text-slate-900">Android (HP/Tablet)</span>
                <p className="text-slate-600 mt-1">Buka di Chrome -&gt; Menu titik tiga -&gt; &ldquo;Tambahkan ke Layar Utama&rdquo;.</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <span className="font-bold text-slate-900">iPhone / iPad (iOS)</span>
                <p className="text-slate-600 mt-1">Buka di Safari -&gt; Tombol Share (kotak panah) -&gt; &ldquo;Add to Home Screen&rdquo;.</p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-blue-900 pt-3">
              5.3 Opsi Deployment Mandiri ke Domain Perusahaan
            </h3>
            <p className="text-xs sm:text-sm">
              Jika perusahaan ingin memasang aplikasi di domain sendiri (misal: <code>arsip.kusukaprima.co.id</code>):
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
              <li>Jalankan perintah build: <code>npm run build</code> untuk menghasilkan bundel web di folder <code>dist/</code>.</li>
              <li>Deploy ke Vercel, Netlify, Cloudflare Pages, atau Cloud Run.</li>
              <li>Arahkan DNS CNAME domain perusahaan ke server tujuan.</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: 'Bab 6: Integrasi Cloud Database (Supabase & Cloud SQL)',
      subtitle: 'Arsitektur PostgreSQL, Skema DDL SQL & Panduan Integrasi',
      icon: Database,
      content: (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">
            BAB VI: INTEGRASI DATABASE CLOUD (SUPABASE &amp; CLOUD SQL)
          </h2>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-blue-900">
              6.1 Apakah Aplikasi Ini Bisa Diintegrasikan dengan Supabase?
            </h3>
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/70 p-4 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Jawaban: YA, SANGAT BISA!
              </div>
              <p className="mt-1.5 leading-relaxed">
                Supabase adalah Backend-as-a-Service open-source berbasis <strong>PostgreSQL</strong>. Seluruh data dokumen arsip (PBB, Tanah, IMB, K3, Merk, SLO, Timbangan, dan Pengguna) dapat disinkronkan ke tabel-tabel Supabase secara real-time melalui package <code>@supabase/supabase-js</code>.
              </p>
            </div>

            <h3 className="text-sm font-bold text-blue-900 pt-2">
              6.2 Skema DDL Tabel SQL (PostgreSQL / Supabase)
            </h3>
            <p className="text-xs text-slate-600">
              Salin dan jalankan skrip SQL berikut pada <strong>Supabase SQL Editor</strong> atau console PostgreSQL Anda:
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-t-lg text-xs text-slate-200">
                  <span className="font-mono font-semibold">1. docs_timbangan (Uji Timbangan Metrologi)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(sqlTimbangan, 'sql-tmb')}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedSql === 'sql-tmb' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedSql === 'sql-tmb' ? 'Tersalin' : 'Salin SQL'}
                  </button>
                </div>
                <pre className="overflow-x-auto bg-slate-950 p-4 rounded-b-lg font-mono text-[11px] text-slate-300 leading-relaxed">
                  {sqlTimbangan}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-t-lg text-xs text-slate-200">
                  <span className="font-mono font-semibold">2. docs_slo (Sertifikat Laik Operasi Listrik/Genset)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(sqlSlo, 'sql-slo')}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedSql === 'sql-slo' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedSql === 'sql-slo' ? 'Tersalin' : 'Salin SQL'}
                  </button>
                </div>
                <pre className="overflow-x-auto bg-slate-950 p-4 rounded-b-lg font-mono text-[11px] text-slate-300 leading-relaxed">
                  {sqlSlo}
                </pre>
              </div>
            </div>

            <h3 className="text-sm font-bold text-blue-900 pt-3">
              6.3 Opsi Tambahan: Cloud SQL PostgreSQL Bawaan Google Cloud
            </h3>
            <p className="text-xs sm:text-sm">
              Proyek cloud Anda (<code>nimble-city-wwpgt</code>) telah diverifikasi <strong>Eligible</strong> untuk mengaktifkan database <strong>Cloud SQL PostgreSQL Developer Edition</strong> langsung di lingkungan Google Cloud tanpa langganan pihak ketiga terpisah.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      title: 'Bab 7: Standar Operasional Prosedur (SOP) Audit',
      subtitle: 'Jadwal Stock Opname Fisik & Rekonsiliasi Tahunan',
      icon: Award,
      content: (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">
            BAB VII: STANDAR OPERASIONAL PROSEDUR (SOP) AUDIT &amp; PENUTUP
          </h2>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-blue-900">
              7.1 Siklus Pemeriksaan Fisik &amp; Digital (Stock Opname)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2.5 font-semibold">Periode Audit</th>
                    <th className="p-2.5 font-semibold">Tanggung Jawab</th>
                    <th className="p-2.5 font-semibold">Parameter Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-semibold">Harian</td>
                    <td className="p-2.5">Staff Operasional</td>
                    <td className="p-2.5">Validasi input data baru dan kejelasan salinan scan digital.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Bulanan</td>
                    <td className="p-2.5">Admin Arsip &amp; Legal</td>
                    <td className="p-2.5">Pemeriksaan panel reminder jatuh tempo pajak, izin K3, SLO &amp; tera timbangan.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Tahunan</td>
                    <td className="p-2.5">Super Admin &amp; Internal Audit</td>
                    <td className="p-2.5">Pencocokan fisik dokumen asli di lemari/brankas dengan label barcode 3x8 cm.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 text-center">
              <h4 className="text-sm font-bold text-blue-950">
                PENGESAHAN DOKUMENTASI SISTEM KEARSIPAN
              </h4>
              <p className="mt-1 text-xs text-blue-800">
                Ditetapkan secara resmi untuk seluruh unit kerja {companyName}.
              </p>
              <div className="mt-6 flex justify-around text-xs text-slate-700 font-semibold">
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-blue-900">
                    Direktur Legal &amp; Kepatuhan
                  </div>
                  <span>{companyName}</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-blue-900">
                    Koordinator Kearsipan Pusat
                  </div>
                  <span>Super Administrator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 8,
      title: 'Bab 8: Diagram Alur Proses & Arsitektur Sistem',
      subtitle: 'Workflow Kearsipan, Autentikasi, Auto-Sync Google Sheets & Arsitektur',
      icon: GitBranch,
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-700" />
              <span>Diagram Alur Komprehensif Sistem Arsip Dokumen Enterprise</span>
            </h3>
            <p className="mt-2 text-slate-600 leading-relaxed text-xs">
              Bab ini menyajikan pemetaan alur kerja (<em>business workflow &amp; system flowcharts</em>) dari hulu ke hilir untuk mempermudah pemahaman teknis, audit kepatuhan, serta operasional harian bagi seluruh staf dan manajemen di <strong>{companyName}</strong>.
            </p>
          </div>

          {/* DIAGRAM 1: ALUR AUTENTIKASI & MULTI-USER RBAC */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[11px]">1</span>
              <h4 className="font-bold text-slate-900 text-sm">
                Diagram Alur 1: Autentikasi Pengguna &amp; Pembagian Hak Akses (RBAC)
              </h4>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Memastikan setiap staf hanya dapat mengakses dan memodifikasi data sesuai tingkatan wewenangnya (Level 1 s/d Level 4).
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2 items-center text-xs">
              <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-center">
                <div className="font-bold text-blue-900 flex items-center justify-center gap-1">
                  <span>Mulai</span>
                </div>
                <div className="text-[11px] text-blue-700 mt-1">Akses URL Sistem (Web / Cloud Run / PWA)</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-400">
                <ArrowRight className="h-4 w-4" />
              </div>

              <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-center">
                <div className="font-bold text-slate-900">Form Login</div>
                <div className="text-[11px] text-slate-600 mt-1">Input Username &amp; Password Terdaftar</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-400">
                <ArrowRight className="h-4 w-4" />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-center">
                <div className="font-bold text-amber-900">Validasi Kredensial</div>
                <div className="text-[11px] text-amber-700 mt-1">Cek Password &amp; Status Aktif Akun</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-700 mb-2">
                Routing Hak Akses Berdasarkan Level Otorisasi:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3">
                  <div className="font-bold text-purple-900 flex items-center justify-between">
                    <span>Level 1: Super Admin</span>
                    <span className="rounded bg-purple-200 px-1.5 py-0.5 text-[9px] font-bold text-purple-900">FULL</span>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[11px] text-purple-800 list-disc list-inside">
                    <li>Semua Data Master &amp; Dokumen</li>
                    <li>Kelola User, Role, Password</li>
                    <li>Pengaturan Profil Perusahaan</li>
                    <li>Akses Penuh Google Sheets Sync</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3">
                  <div className="font-bold text-blue-900 flex items-center justify-between">
                    <span>Level 2: Admin Arsip</span>
                    <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-blue-900">MANAGE</span>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[11px] text-blue-800 list-disc list-inside">
                    <li>Kelola Lokasi Fisik Arsip</li>
                    <li>Input, Edit, Hapus Dokumen</li>
                    <li>Ekspor Excel &amp; PDF Laporan</li>
                    <li>Cetak Label Fisik 3x8 cm</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="font-bold text-emerald-900 flex items-center justify-between">
                    <span>Level 3: Staff Operasional</span>
                    <span className="rounded bg-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-900">INPUT</span>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[11px] text-emerald-800 list-disc list-inside">
                    <li>Input &amp; Update Dokumen Divisi</li>
                    <li>Unggah Berkas Fisik &amp; Surat</li>
                    <li>Melihat Dashboard Realtime</li>
                    <li>Tidak dapat menghapus dokumen</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Level 4: Viewer / Auditor</span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">READ-ONLY</span>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                    <li>Hanya melihat data &amp; arsip</li>
                    <li>Unduh laporan Excel &amp; PDF</li>
                    <li>Verifikasi keaslian dokumen</li>
                    <li>Tidak ada akses ubah data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* DIAGRAM 2: ALUR PENCATATAN & MANAJEMEN DOKUMEN FISIK */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[11px]">2</span>
              <h4 className="font-bold text-slate-900 text-sm">
                Diagram Alur 2: Siklus Hidup Arsip Dokumen (Fisik ke Digital Twin)
              </h4>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Proses standar penerimaan dokumen asli, penetapan tempat penyimpanan, pencatatan sistem, hingga cetak label fisik.
            </p>

            <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-2 text-xs">
              <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 p-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded bg-slate-200 flex items-center justify-center text-[10px]">A</span>
                  Penerimaan Dokumen
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  Fisik sertifikat asli diterima (PBB, SPPT, Tanah, IMB, Merk, K3, SLO, Timbangan).
                </p>
              </div>

              <div className="flex justify-center text-slate-400 py-1 md:py-0">
                <ArrowRight className="h-4 w-4 hidden md:block" />
                <ArrowDown className="h-4 w-4 md:hidden" />
              </div>

              <div className="flex-1 rounded-lg border border-blue-200 bg-blue-50/70 p-3">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded bg-blue-200 flex items-center justify-center text-[10px]">B</span>
                  Tentukan Lokasi Fisik
                </div>
                <p className="mt-1 text-[11px] text-blue-800">
                  Pilih Data Master Lokasi Arsip (Gedung, Lantai, Rak / Lemari Bantex).
                </p>
              </div>

              <div className="flex justify-center text-slate-400 py-1 md:py-0">
                <ArrowRight className="h-4 w-4 hidden md:block" />
                <ArrowDown className="h-4 w-4 md:hidden" />
              </div>

              <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded bg-amber-200 flex items-center justify-center text-[10px]">C</span>
                  Input Form Digital
                </div>
                <p className="mt-1 text-[11px] text-amber-800">
                  Isi spesifikasi lengkap dokumen &amp; tanggal jatuh tempo/kadaluarsa.
                </p>
              </div>

              <div className="flex justify-center text-slate-400 py-1 md:py-0">
                <ArrowRight className="h-4 w-4 hidden md:block" />
                <ArrowDown className="h-4 w-4 md:hidden" />
              </div>

              <div className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded bg-emerald-200 flex items-center justify-center text-[10px]">D</span>
                  Cetak Label 3x8 cm
                </div>
                <p className="mt-1 text-[11px] text-emerald-800">
                  Sistem generate No Arsip &amp; stiker label fisik untuk ditempel di map/box arsip.
                </p>
              </div>
            </div>
          </div>

          {/* DIAGRAM 3: ALUR PEMANTAUAN JATUH TEMPO REALTIME */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-[11px]">3</span>
              <h4 className="font-bold text-slate-900 text-sm">
                Diagram Alur 3: Pemantauan Jatuh Tempo Realtime &amp; Notifikasi Kepatuhan
              </h4>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Mendeteksi masa berlaku surat/izin legal secara otomatis untuk mencegah keterlambatan perpanjangan dan sanksi operasional.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4 text-slate-600" />
                  Evaluasi Tanggal
                </div>
                <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed">
                  Sistem menghitung selisih hari antara tanggal jatuh tempo dokumen dengan tanggal hari ini (<em>Current Date</em>).
                </p>
              </div>

              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                  Status: Aman
                </div>
                <div className="mt-1 font-mono text-[11px] font-semibold text-emerald-800">&gt; 60 Hari</div>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Masa berlaku masih panjang. Ditandai badge hijau di Dashboard.
                </p>
              </div>

              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                  Segera Kadaluarsa
                </div>
                <div className="mt-1 font-mono text-[11px] font-semibold text-amber-800">1 s/d 60 Hari</div>
                <p className="mt-1 text-[11px] text-amber-700">
                  Peringatan kuning/oranye. Masuk daftar prioritas perpanjangan berkas.
                </p>
              </div>

              <div className="rounded-lg border border-rose-300 bg-rose-50 p-3.5">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                  Kadaluarsa / Jatuh Tempo
                </div>
                <div className="mt-1 font-mono text-[11px] font-semibold text-rose-800">&le; 0 Hari (Lewat)</div>
                <p className="mt-1 text-[11px] text-rose-700">
                  Badge merah darurat. Notifikasi aktif ke tim penanggung jawab (PIC).
                </p>
              </div>
            </div>
          </div>

          {/* DIAGRAM 4: ALUR AUTO-SYNC GOOGLE SHEETS */}
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[11px]">4</span>
              <h4 className="font-bold text-emerald-950 text-sm">
                Diagram Alur 4: Integrasi &amp; Pembaruan Otomatis ke Google Sheets (Seluruh Modul &amp; Menu)
              </h4>
            </div>
            <p className="mt-2 text-[11px] text-emerald-900">
              Sistem tersambung secara terpadu ke Google Sheets untuk <strong>seluruh modul dokumen dan data master</strong> (PBB, SPPT, Merk, K3, Tanah, IMB, SLO, Timbangan, Arsip Dokumen, Master Wilayah, dan Status). Seluruh data terupdate otomatis secara real-time setiap kali ada perubahan.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2 items-center text-xs">
              <div className="rounded-lg border border-emerald-300 bg-white p-3 text-center">
                <div className="font-bold text-emerald-900">Perubahan Data</div>
                <div className="text-[11px] text-slate-600 mt-1">Tambah / Ubah / Hapus pada modul apa pun di aplikasi</div>
              </div>

              <div className="hidden md:flex justify-center text-emerald-600">
                <ArrowRight className="h-4 w-4" />
              </div>

              <div className="rounded-lg border border-emerald-300 bg-white p-3 text-center">
                <div className="font-bold text-emerald-900">Debounce 2.0s</div>
                <div className="text-[11px] text-slate-600 mt-1">Mencegah redundansi &amp; mengonsolidasi batch data</div>
              </div>

              <div className="hidden md:flex justify-center text-emerald-600">
                <ArrowRight className="h-4 w-4" />
              </div>

              <div className="rounded-lg border border-emerald-300 bg-white p-3 text-center">
                <div className="font-bold text-emerald-900">Apps Script Web App</div>
                <div className="text-[11px] text-slate-600 mt-1">Sinkronisasi 15 Tab Google Sheets + Snapshot <code>_AppState_DB</code></div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-3.5 text-xs text-slate-700">
              <div className="font-bold text-emerald-900 mb-1">
                Daftar Tab Lembar Kerja di Google Sheets (15 Tab Terstruktur + 1 Tab Sistem):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 font-mono text-[11px] text-slate-700">
                {APPS_SCRIPT_SHEET_BLUEPRINT.map((sheet) => (
                  <div key={sheet.no} className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    {sheet.no}. {sheet.tabName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DIAGRAM 5: ALUR PELAPORAN & EKSPOR */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[11px]">5</span>
              <h4 className="font-bold text-slate-900 text-sm">
                Diagram Alur 5: Pencarian Cepat, Pelaporan Rekapitulasi &amp; Ekspor Multi-Format
              </h4>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-blue-600" />
                  1. Filter &amp; Pencarian
                </div>
                <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed">
                  Pengguna memfilter berdasarkan kategori dokumen (Semua Dokumen atau spesifik per modul) serta lokasi arsip fisik tempat berkas disimpan.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  2. Ekspor Excel (.xlsx)
                </div>
                <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed">
                  Menggunakan engine SheetJS untuk menghasilkan spreadsheet Excel rapi lengkap dengan header kapital dan pemisahan kolom audit.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Printer className="h-4 w-4 text-purple-600" />
                  3. Ekspor PDF &amp; Label
                </div>
                <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed">
                  Menghasilkan berkas PDF resmi kop perusahaan berformat landscape serta mencetak stiker label ukuran 3x8 cm maksimal 18 stiker/kertas A4.
                </p>
              </div>
            </div>
          </div>

          {/* DIAGRAM 6: PETA ARSITEKTUR TEKNOLOGI SISTEM */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-white shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <Layers className="h-5 w-5 text-sky-400" />
              <h4 className="font-bold text-white text-sm">
                Peta Arsitektur Teknologi &amp; Integrasi Cloud
              </h4>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3.5">
                <div className="font-bold text-sky-400">1. Client Layer (Frontend)</div>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
                  <li>• React 19 + TypeScript SPA</li>
                  <li>• Tailwind CSS (Zero-Pill UI)</li>
                  <li>• Lucide Icons + Responsive UI</li>
                  <li>• PWA (Installable on Desktop &amp; Mobile)</li>
                </ul>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3.5">
                <div className="font-bold text-emerald-400">2. Storage &amp; Persistence</div>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
                  <li>• LocalStorage Reactive Mirroring</li>
                  <li>• In-Memory Secure OAuth Token Cache</li>
                  <li>• Session Persistence on Refresh</li>
                  <li>• PostgreSQL / Supabase Ready (DDL SQL)</li>
                </ul>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3.5">
                <div className="font-bold text-amber-400">3. Cloud &amp; Deploy</div>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
                  <li>• Google Apps Script Web App</li>
                  <li>• Google Sheets 15-Tab Auto-Sync</li>
                  <li>• GitHub Repository Integration</li>
                  <li>• Vercel SPA Production Hosting</li>
                </ul>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3.5">
                <div className="font-bold text-purple-400">4. Document Generators</div>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
                  <li>• SheetJS (Excel .xlsx Export)</li>
                  <li>• jsPDF + autoTable (Official PDF)</li>
                  <li>• Barcode 3x8 cm Sticker Print</li>
                  <li>• E-Book PDF Official Manual</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 9,
      title: 'Bab 9: Arsip Code.gs, Apps Script & Deploy Vercel',
      subtitle: 'Panduan Penyimpanan Google Sheets 15 Tab, GitHub & Vercel',
      icon: Code,
      content: (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Bab 9 · Dokumentasi Teknis &amp; Arsip Infrastruktur (Khusus Admin IT / Super Admin)
            </span>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Penyimpanan Google Sheets (Apps Script Code.gs) &amp; Deploy GitHub / Vercel
            </h2>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Bab ini menyimpan arsip lengkap skrip <code>Code.gs</code>, struktur 15 tab database Google Sheets, langkah deploy Web App Google Apps Script, serta panduan publikasi ke GitHub dan Vercel. Pengaturan operasional koneksinya tersedia khusus bagi <strong>Super Admin (Level 1)</strong> di menu <strong>Setting → Apps Script &amp; Deploy</strong>.
            </p>
          </div>

          {/* 1. Panduan 5 Langkah Deploy Google Apps Script */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Layers className="h-4 w-4 text-blue-700" />
              <span>1. Langkah Deploy Database Google Sheets via Apps Script</span>
            </div>
            <ol className="mt-3 space-y-2.5 text-xs text-slate-700 list-decimal pl-5 leading-relaxed">
              <li>
                Buat file <strong>Google Spreadsheet</strong> baru (misalnya: <em>Database Arsip Dokumen {companyName}</em>), lalu buka menu <strong>Ekstensi (Extensions) → Apps Script</strong>.
              </li>
              <li>
                Hapus isi bawaan pada file <code>Code.gs</code>, lalu tempel (<em>paste</em>) seluruh kode <code>Code.gs</code> dari bagian arsip kode di bawah ini dan simpan (<code>Ctrl+S</code>).
              </li>
              <li>
                Pilih fungsi <code>setupSpreadsheetTabs</code> pada toolbar atas editor Apps Script, klik <strong>Run</strong>, dan berikan izin akses akun Google Anda agar <strong>15 tab terstruktur + 1 tab sistem tersembunyi (<code>_AppState_DB</code>)</strong> otomatis terbentuk.
              </li>
              <li>
                Klik <strong>Deploy (Terapkan) → New deployment (Deployment baru)</strong> → pilih tipe <strong>Web app</strong> dengan pengaturan:
                <div className="mt-1.5 rounded-lg border border-blue-200 bg-white p-2.5 font-mono text-[11px] text-slate-800">
                  • Execute as: <strong>Me (email akun Google Anda)</strong>
                  <br />
                  • Who has access: <strong>Anyone (Siapa saja)</strong>
                </div>
              </li>
              <li>
                Salin <strong>Web app URL</strong> yang berakhiran <code>/exec</code>, lalu tempelkan di menu <strong>Setting → Apps Script &amp; Deploy</strong> (khusus Super Admin) atau simpan sebagai Environment Variable <code>VITE_GAS_WEBAPP_URL</code> di Vercel.
              </li>
            </ol>
          </div>

          {/* 2. Blueprint 15 Tab Google Sheets */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Table2 className="h-4 w-4 text-emerald-700" />
              <span>2. Struktur 15 Tab Google Sheets Otomatis</span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                    <th className="px-3 py-2 font-semibold w-10">No</th>
                    <th className="px-3 py-2 font-semibold">Nama Tab Spreadsheet</th>
                    <th className="px-3 py-2 font-semibold">Fungsi Modul</th>
                    <th className="px-3 py-2 font-semibold text-right">Kolom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {APPS_SCRIPT_SHEET_BLUEPRINT.map((sheet) => (
                    <tr key={sheet.no} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2 font-mono text-slate-500">{sheet.no}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{sheet.tabName}</td>
                      <td className="px-3 py-2 text-slate-600">{sheet.moduleTitle}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-500">
                        {sheet.columns.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Panduan Integrasi GitHub & Vercel */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Rocket className="h-4 w-4 text-blue-700" />
              <span>3. Panduan Integrasi GitHub &amp; Deploy ke Vercel</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="font-bold text-slate-900">A. Simpan Proyek ke GitHub</div>
                <p className="text-slate-600 leading-relaxed">
                  Push seluruh kode proyek ke repositori GitHub Anda (Private atau Public). File <code>vercel.json</code> sudah tersedia otomatis untuk SPA routing.
                </p>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-100 leading-relaxed">
{vercelJsonRaw.trim()}
                </pre>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="font-bold text-slate-900">B. Environment Variables di Vercel</div>
                <p className="text-slate-600 leading-relaxed">
                  Import repositori GitHub di <strong>vercel.com</strong> (Framework: <strong>Vite</strong>, Build: <code>npm run build</code>, Output: <code>dist</code>), lalu isi variabel berikut di <strong>Project Settings → Environment Variables</strong>:
                </p>
                <div className="rounded-lg border border-blue-200 bg-white p-3 font-mono text-[11px] text-slate-800 space-y-1.5">
                  <div>
                    <strong className="text-blue-800">VITE_GAS_WEBAPP_URL</strong>
                    <div className="text-slate-500">https://script.google.com/macros/s/.../exec</div>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <strong className="text-blue-800">VITE_GAS_API_TOKEN</strong>{' '}
                    <span className="text-slate-400">(opsional)</span>
                    <div className="text-slate-500">Samakan dengan API_TOKEN di Code.gs jika dipakai</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Arsip Kode Sumber Code.gs Lengkap */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-white">
                  Arsip Kode Sumber: gas/Code.gs ({codeGsRaw.split('\n').length} baris)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeGsRaw, 'gas-code-gs', 'Kode Code.gs')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  {copiedSql === 'gas-code-gs' ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin Code.gs</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCodeGs}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh .gs</span>
                </button>
              </div>
            </div>
            <pre className="max-h-[420px] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-200/95">
              <code>{codeGsRaw}</code>
            </pre>
          </div>
        </div>
      ),
    },
  ];

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase();
    return chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery, chapters]);

  const currentChapterData = chapters[activeChapter] || chapters[0];

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <BookOpen className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Buku Panduan E-Book Sistem Arsip Dokumen
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Dokumentasi komprehensif 8 kategori arsip, metrologi timbangan &amp; SLO, reset password, online PWA, serta integrasi database Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Font Size Toggle */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                fontSize === 'normal' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'
              }`}
              title="Ukuran Font Normal"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2.5 py-1 rounded font-medium text-sm transition-colors ${
                fontSize === 'large' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'
              }`}
              title="Ukuran Font Besar"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xlarge')}
              className={`px-2.5 py-1 rounded font-medium text-base transition-colors ${
                fontSize === 'xlarge' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'
              }`}
              title="Ukuran Font Ekstra Besar"
            >
              A++
            </button>
          </div>

          {/* Cetak E-Book Langsung */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shadow-2xs"
            title="Cetak Bab E-Book Ini"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            Cetak Halaman
          </button>

          {/* Unduh E-Book Format PDF Resmi */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shadow-xs disabled:opacity-60 cursor-pointer"
            title="Unduh E-Book Lengkap 12 Halaman Resmi PDF"
          >
            <Download className="h-3.5 w-3.5" />
            {isGeneratingPdf ? 'Memproses PDF...' : 'Download E-Book PDF Resmi'}
          </button>
        </div>
      </div>

      {/* Main Two-Column Reader Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Table of Contents */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-800">Cari Bab / Topik Panduan</label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik topik (timbangan, SLO, password)..."
                  className="w-full rounded-lg border border-slate-300 py-1.5 pr-3 pl-8 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Daftar Bab E-Book ({chapters.length} Bab)
              </span>
              <nav className="mt-2 space-y-1">
                {filteredChapters.map((chapter) => {
                  const Icon = chapter.icon;
                  const isActive = activeChapter === chapter.id;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => setActiveChapter(chapter.id)}
                      className={`flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-all ${
                        isActive
                          ? 'bg-blue-50 border border-blue-200 text-blue-900 shadow-2xs font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs mt-0.5 ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs leading-snug line-clamp-1">{chapter.title}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {chapter.subtitle}
                        </div>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Quick PDF Card */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-900 to-slate-900 p-5 text-white shadow-xs">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                E-Book Format PDF
              </h3>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Buku panduan ini dapat Anda cetak atau simpan dalam format PDF berstandar A4 dengan layout resmi cover, lembar pengesahan, dan tabel teknis.
            </p>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-sky-400 shadow-xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Unduh Versi PDF (12 Hal)
            </button>
          </div>
        </aside>

        {/* Right Column: Active Chapter Content */}
        <main
          className={`lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xs ${
            fontSize === 'large' ? 'text-base' : fontSize === 'xlarge' ? 'text-lg' : 'text-sm'
          }`}
        >
          {currentChapterData.content}

          {/* Chapter Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setActiveChapter((prev) => Math.max(0, prev - 1))}
              disabled={activeChapter === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Bab Sebelumnya
            </button>
            <span className="text-xs font-mono text-slate-400">
              Bab {activeChapter + 1} dari {chapters.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveChapter((prev) => Math.min(chapters.length - 1, prev + 1))}
              disabled={activeChapter === chapters.length - 1}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-40"
            >
              Bab Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
