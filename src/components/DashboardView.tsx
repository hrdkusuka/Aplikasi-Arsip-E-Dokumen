import React, { useState, useMemo } from 'react';
import {
  FileText,
  FolderArchive,
  ShieldAlert,
  Award,
  HardHat,
  ArrowUpRight,
  Eye,
  Plus,
  FileSpreadsheet,
  Search,
  MapPin,
  Building2,
  Zap,
  Scale,
  BookOpen,
} from 'lucide-react';
import { ActiveView, AppState } from '../types';
import {
  evaluateDateDeadline,
  ExpiryState,
  formatIndonesianDate,
} from '../utils/archiveHelpers';

interface DashboardViewProps {
  state: AppState;
  onNavigate: (view: ActiveView) => void;
  onQuickAdd: (view: ActiveView) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  onQuickAdd,
}) => {
  const [reminderFilter, setReminderFilter] = useState<'all' | ExpiryState>('all');
  const [recentSearch, setRecentSearch] = useState('');

  const totalENOP = state.docsENOP.length;
  const totalESPPT = state.docsESPPT.length;
  const totalMerk = state.docsMerk.length;
  const totalK3 = state.docsK3.length;
  const totalTanah = state.docsTanah.length;
  const totalIMB = state.docsIMB.length;
  const totalSLO = (state.docsSLO || []).length;
  const totalTimbangan = (state.docsTimbangan || []).length;
  const totalAllDocs =
    totalENOP +
    totalESPPT +
    totalMerk +
    totalK3 +
    totalTanah +
    totalIMB +
    totalSLO +
    totalTimbangan;

  // Build reminders from E-SPPT, Sertifikat K3, Sertifikat Merk, SLO, and Uji Timbangan
  const allReminders = useMemo(() => {
    const items: {
      id: string;
      noArsip: string;
      kategori:
        | 'E-SPPT'
        | 'Sertifikat K3'
        | 'Sertifikat Merk'
        | 'Sertifikat Laik Operasi (SLO)'
        | 'Uji Timbangan';
      targetView: ActiveView;
      judul: string;
      subJudul: string;
      tanggalBatas: string;
      jenisBatas: string;
      lokasiArsip: string;
      evaluation: ReturnType<typeof evaluateDateDeadline>;
    }[] = [];

    for (const sppt of state.docsESPPT) {
      const loc = state.masterLocations.find((l) => l.id === sppt.arsipDokumenId);
      items.push({
        id: `sppt-${sppt.id}`,
        noArsip: sppt.noArsip,
        kategori: 'E-SPPT',
        targetView: 'doc-esppt',
        judul: `NOP ${sppt.nop} (Tahun ${sppt.tahun})`,
        subJudul: `${sppt.namaWajibPajak || sppt.namaAlamatWajibPajak || '-'} · ${sppt.alamatWajibPajak || sppt.letakObjekPajak}`,
        tanggalBatas: sppt.jatuhTempo,
        jenisBatas: 'Jatuh Tempo Pajak',
        lokasiArsip: loc ? loc.namaLokasi : '-',
        evaluation: evaluateDateDeadline(sppt.jatuhTempo),
      });
    }

    for (const k3 of state.docsK3) {
      const loc = state.masterLocations.find((l) => l.id === k3.arsipDokumenId);
      items.push({
        id: `k3-${k3.id}`,
        noArsip: k3.noArsip,
        kategori: 'Sertifikat K3',
        targetView: 'doc-k3',
        judul: `${k3.jenisObjekK3} — ${k3.merk} ${k3.type}`,
        subJudul: `${k3.namaPerusahaan} · Lokasi Unit: ${k3.lokasiUnit}`,
        tanggalBatas: k3.berlakuSampaiTanggal,
        jenisBatas: 'Masa Berlaku K3',
        lokasiArsip: loc ? loc.namaLokasi : '-',
        evaluation: evaluateDateDeadline(k3.berlakuSampaiTanggal),
      });
    }

    for (const merk of state.docsMerk) {
      if (!merk.tglJatuhTempoKepemilikan) continue;
      const loc = state.masterLocations.find((l) => l.id === merk.arsipDokumenId);
      items.push({
        id: `merk-${merk.id}`,
        noArsip: merk.noArsip,
        kategori: 'Sertifikat Merk',
        targetView: 'doc-merk',
        judul: `${merk.etiketMerk} (${merk.noPendaftaran})`,
        subJudul: `${merk.nama} · Kelas: ${merk.kelasBarangJasa}`,
        tanggalBatas: merk.tglJatuhTempoKepemilikan,
        jenisBatas: 'Jatuh Tempo Hak Merk',
        lokasiArsip: loc ? loc.namaLokasi : '-',
        evaluation: evaluateDateDeadline(merk.tglJatuhTempoKepemilikan),
      });
    }

    for (const slo of state.docsSLO || []) {
      if (!slo.tanggalBerlaku) continue;
      const loc = state.masterLocations.find((l) => l.id === slo.arsipDokumenId);
      items.push({
        id: `slo-${slo.id}`,
        noArsip: slo.noArsip,
        kategori: 'Sertifikat Laik Operasi (SLO)',
        targetView: 'doc-slo',
        judul: `${slo.noSlo} (${slo.jenisSlo} · ${slo.merekPeralatan})`,
        subJudul: `${slo.namaPerusahaan} · ${slo.kapasitasKva} kVA / ${slo.dayaKw} kW · ${slo.lokasiInstalasi}`,
        tanggalBatas: slo.tanggalBerlaku,
        jenisBatas: 'Masa Berlaku SLO',
        lokasiArsip: loc ? loc.namaLokasi : '-',
        evaluation: evaluateDateDeadline(slo.tanggalBerlaku),
      });
    }

    for (const tmb of state.docsTimbangan || []) {
      if (!tmb.berlakuSampai) continue;
      const loc = state.masterLocations.find((l) => l.id === tmb.arsipDokumenId);
      items.push({
        id: `tmb-${tmb.id}`,
        noArsip: tmb.noArsip,
        kategori: 'Uji Timbangan',
        targetView: 'doc-timbangan',
        judul: `${tmb.namaAlatUkur} (${tmb.jenisTimbangan} · ${tmb.merekPabrikBuatan})`,
        subJudul: `${tmb.pemilikPemakai} · Kapasitas: ${tmb.kapasitasMaksimumKg} kg · Surat: ${tmb.nomorSuratPengujian}`,
        tanggalBatas: tmb.berlakuSampai,
        jenisBatas: 'Masa Berlaku Kalibrasi/Tera',
        lokasiArsip: loc ? loc.namaLokasi : '-',
        evaluation: evaluateDateDeadline(tmb.berlakuSampai),
      });
    }

    return items.sort((a, b) => a.evaluation.daysDiff - b.evaluation.daysDiff);
  }, [
    state.docsESPPT,
    state.docsK3,
    state.docsMerk,
    state.docsSLO,
    state.docsTimbangan,
    state.masterLocations,
  ]);

  const filteredReminders = useMemo(() => {
    if (reminderFilter === 'all') return allReminders;
    return allReminders.filter((r) => r.evaluation.state === reminderFilter);
  }, [allReminders, reminderFilter]);

  const overdueCount = allReminders.filter((r) => r.evaluation.state === 'overdue').length;
  const warningCount = allReminders.filter((r) => r.evaluation.state === 'warning').length;

  // Archive location distribution
  const locationDistribution = useMemo(() => {
    return state.masterLocations.map((loc) => {
      const cEnop = state.docsENOP.filter((d) => d.arsipDokumenId === loc.id).length;
      const cEsppt = state.docsESPPT.filter((d) => d.arsipDokumenId === loc.id).length;
      const cMerk = state.docsMerk.filter((d) => d.arsipDokumenId === loc.id).length;
      const cK3 = state.docsK3.filter((d) => d.arsipDokumenId === loc.id).length;
      const cTanah = state.docsTanah.filter((d) => d.arsipDokumenId === loc.id).length;
      const cImb = state.docsIMB.filter((d) => d.arsipDokumenId === loc.id).length;
      const cSlo = (state.docsSLO || []).filter((d) => d.arsipDokumenId === loc.id).length;
      const cTmb = (state.docsTimbangan || []).filter((d) => d.arsipDokumenId === loc.id).length;
      const count = cEnop + cEsppt + cMerk + cK3 + cTanah + cImb + cSlo + cTmb;
      const pct = totalAllDocs > 0 ? Math.round((count / totalAllDocs) * 100) : 0;
      return {
        ...loc,
        count,
        pct,
        breakdown: `E-SPPT: ${cEsppt} · Bukti Bayar: ${cEnop} · IMB: ${cImb} · Tanah: ${cTanah} · Merk: ${cMerk} · K3: ${cK3} · SLO: ${cSlo} · Timbangan: ${cTmb}`,
      };
    });
  }, [
    state.masterLocations,
    state.docsENOP,
    state.docsESPPT,
    state.docsMerk,
    state.docsK3,
    state.docsTanah,
    state.docsIMB,
    state.docsSLO,
    state.docsTimbangan,
    totalAllDocs,
  ]);

  // Payment status breakdown for Bukti Bayar PBB
  const paymentDistribution = useMemo(() => {
    return state.masterStatuses.map((st) => {
      const count = state.docsENOP.filter((d) => d.statusBayarId === st.id).length;
      const pct = totalENOP > 0 ? Math.round((count / totalENOP) * 100) : 0;
      return {
        ...st,
        count,
        pct,
      };
    });
  }, [state.masterStatuses, state.docsENOP, totalENOP]);

  // Combined unified archive list for quick lookup
  const unifiedRecentDocs = useMemo(() => {
    const list: {
      id: string;
      noArsip: string;
      kategori: string;
      judulUtama: string;
      subDetail: string;
      lokasiArsip: string;
      tanggal: string;
      hasFile: boolean;
      targetView: ActiveView;
    }[] = [];

    const getLoc = (id: string) =>
      state.masterLocations.find((l) => l.id === id)?.namaLokasi || '-';

    state.docsENOP.forEach((d) => {
      const st = state.masterStatuses.find((s) => s.id === d.statusBayarId)?.namaStatus || '-';
      const namaWP = d.namaWajibPajak || d.namaNop;
      const alamatWP = d.alamatWajibPajak || d.lokasiAlamat;
      list.push({
        id: d.id,
        noArsip: d.noArsip,
        kategori: 'Bukti Bayar PBB',
        judulUtama: `${namaWP} (${d.nop})`,
        subDetail: `${alamatWP} · ${d.kotaKabupaten} · Tahun ${d.tahunPajak} · Status: ${st}`,
        lokasiArsip: getLoc(d.arsipDokumenId),
        tanggal: d.tanggalTransaksi,
        hasFile: Boolean(d.fileAttachment),
        targetView: 'doc-enop',
      });
    });

    state.docsESPPT.forEach((d) => {
      list.push({
        id: d.id,
        noArsip: d.noArsip,
        kategori: 'E-SPPT',
        judulUtama: `SPPT NOP ${d.nop} (Tahun ${d.tahun})`,
        subDetail: `${d.namaWajibPajak || d.namaAlamatWajibPajak} · ${d.alamatWajibPajak || d.letakObjekPajak} · Jatuh Tempo: ${formatIndonesianDate(d.jatuhTempo)}`,
        lokasiArsip: getLoc(d.arsipDokumenId),
        tanggal: d.createdAt,
        hasFile: Boolean(d.fileAttachment),
        targetView: 'doc-esppt',
      });
    });

    state.docsMerk.forEach((d) => {
      list.push({
        id: d.id,
        noArsip: d.noArsip,
        kategori: 'Sertifikat Merk',
        judulUtama: `${d.etiketMerk} (${d.noPendaftaran})`,
        subDetail: `${d.nama} · ${d.kelasBarangJasa}${
          d.tglJatuhTempoKepemilikan
            ? ` · Jatuh Tempo: ${formatIndonesianDate(d.tglJatuhTempoKepemilikan)}`
            : ''
        }`,
        lokasiArsip: getLoc(d.arsipDokumenId),
        tanggal: d.tanggalPenerimaan,
        hasFile: Boolean(d.fileAttachment),
        targetView: 'doc-merk',
      });
    });

    state.docsK3.forEach((d) => {
      list.push({
        id: d.id,
        noArsip: d.noArsip,
        kategori: 'Sertifikat K3',
        judulUtama: `${d.jenisObjekK3} — ${d.merk} ${d.type}`,
        subDetail: `${d.namaPerusahaan} · No Seri: ${d.noSeri} · Berlaku s/d ${formatIndonesianDate(
          d.berlakuSampaiTanggal
        )}`,
        lokasiArsip: getLoc(d.arsipDokumenId),
        tanggal: d.tanggalPemeriksaan,
        hasFile: Boolean(d.fileAttachment),
        targetView: 'doc-k3',
      });
    });

    state.docsTanah.forEach((d) => {
      list.push({
        id: d.id,
        noArsip: d.noArsip,
        kategori: 'E-Sertifikat Tanah',
        judulUtama: `${d.jenisHak} No. ${d.nomorSertifikat} (NIB: ${d.nib})`,
        subDetail: `${d.namaPemegangHak} · ${d.desaKelurahan}, ${d.kecamatan}, ${d.kotaKabupaten} · Luas: ${d.luasTanah.toLocaleString('id-ID')} m²`,
        lokasiArsip: getLoc(d.arsipDokumenId),
        tanggal: d.tanggalPenerbitan,
        hasFile: Boolean(d.fileAttachment),
        targetView: 'doc-tanah',
      });
    });

    state.docsIMB.forEach((d) => {
      list.push({
        id: d.id,
        noArsip: d.noArsip,
        kategori: 'E-IMB',
        judulUtama: `SK IMB ${d.noKeputusan} (${d.tahun}) — ${d.atasNama}`,
        subDetail: `${d.bangunanInduk} · ${d.kelurahanDesa}, ${d.kecamatan}, ${d.kota}`,
        lokasiArsip: getLoc(d.arsipDokumenId),
        tanggal: d.tglPermohonanImb,
        hasFile: Boolean(d.fileAttachment),
        targetView: 'doc-imb',
      });
    });

    (state.docsSLO || []).forEach((d) => {
      list.push({
        id: d.id,
        noArsip: d.noArsip,
        kategori: 'Sertifikat SLO',
        judulUtama: `SLO ${d.noSlo} (${d.jenisSlo} · ${d.merekPeralatan})`,
        subDetail: `${d.namaPerusahaan} · ${d.kapasitasKva} kVA · Berlaku s/d ${formatIndonesianDate(d.tanggalBerlaku)}`,
        lokasiArsip: getLoc(d.arsipDokumenId),
        tanggal: d.tanggalTerbit,
        hasFile: Boolean(d.fileSlo || d.filePendukung),
        targetView: 'doc-slo',
      });
    });

    (state.docsTimbangan || []).forEach((d) => {
      list.push({
        id: d.id,
        noArsip: d.noArsip,
        kategori: 'Uji Timbangan',
        judulUtama: `${d.namaAlatUkur} (${d.jenisTimbangan} · ${d.merekPabrikBuatan})`,
        subDetail: `${d.pemilikPemakai} · Kapasitas: ${d.kapasitasMaksimumKg} kg · Surat: ${d.nomorSuratPengujian}`,
        lokasiArsip: getLoc(d.arsipDokumenId),
        tanggal: d.tanggalTerbitSurat,
        hasFile: Boolean(d.fileAttachment),
        targetView: 'doc-timbangan',
      });
    });

    const q = recentSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.noArsip.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.judulUtama.toLowerCase().includes(q) ||
        item.subDetail.toLowerCase().includes(q) ||
        item.lokasiArsip.toLowerCase().includes(q)
    );
  }, [
    state.docsENOP,
    state.docsESPPT,
    state.docsMerk,
    state.docsK3,
    state.docsTanah,
    state.docsIMB,
    state.docsSLO,
    state.docsTimbangan,
    state.masterLocations,
    state.masterStatuses,
    recentSearch,
  ]);

  return (
    <div className="space-y-8">
      {/* Top Realtime Summary Strip */}
      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pemantauan Arsip Dokumen Realtime
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Ringkasan langsung kuantitas dokumen, lokasi penyimpanan fisik asli, status pembayaran pajak, dan jadwal jatuh tempo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('ebook-panduan')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap shrink-0 shadow-2xs"
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              Buku Panduan E-Book
            </button>
            <button
              type="button"
              onClick={() => onNavigate('laporan')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-600" />
              Ekspor Laporan
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd('doc-tanah')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Input Dokumen Baru
            </button>
          </div>
        </div>

        {/* 7-Column Realtime Counter Grid — Distinct Color per Document Category */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          {/* Total All Docs — Deep Navy */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-4 text-white shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-sky-200">
                Total Seluruh Arsip
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
                <FolderArchive className="h-4 w-4" />
              </span>
            </div>
            <div className="my-2.5 font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
              {totalAllDocs}
            </div>
            <div className="text-xs font-medium text-sky-200/90">
              <span>{state.masterLocations.length} Lokasi Fisik</span>
            </div>
          </div>

          {/* 1. E-SPPT — Emerald Green */}
          <div
            onClick={() => onNavigate('doc-esppt')}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-emerald-100/75 to-green-50 p-4 shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-950">
                Dokumen E-SPPT
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                <FileText className="h-4 w-4" />
              </span>
            </div>
            <div className="my-2.5 font-mono text-3xl font-bold tracking-tight text-emerald-900 tabular-nums">
              {totalESPPT}
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span className="font-medium">Pajak PBB & SPPT</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('doc-esppt');
                }}
                className="inline-flex items-center gap-0.5 font-semibold text-emerald-900 group-hover:underline whitespace-nowrap shrink-0"
              >
                Buka <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Bukti Bayar PBB — Royal Blue */}
          <div
            onClick={() => onNavigate('doc-enop')}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-blue-300 bg-gradient-to-br from-blue-50 via-blue-100/75 to-sky-50 p-4 shadow-xs transition-all hover:border-blue-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-blue-950">
                Bukti Bayar PBB
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                <FileText className="h-4 w-4" />
              </span>
            </div>
            <div className="my-2.5 font-mono text-3xl font-bold tracking-tight text-blue-900 tabular-nums">
              {totalENOP}
            </div>
            <div className="flex items-center justify-between text-xs text-blue-800">
              <span className="font-medium">Bukti Lunas PBB</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('doc-enop');
                }}
                className="inline-flex items-center gap-0.5 font-semibold text-blue-900 group-hover:underline whitespace-nowrap shrink-0"
              >
                Buka <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 3. E-IMB — Teal Cyan */}
          <div
            onClick={() => onNavigate('doc-imb')}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-teal-300 bg-gradient-to-br from-teal-50 via-teal-100/75 to-cyan-50 p-4 shadow-xs transition-all hover:border-teal-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-teal-950">
                Dokumen E-IMB
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-2xs">
                <Building2 className="h-4 w-4" />
              </span>
            </div>
            <div className="my-2.5 font-mono text-3xl font-bold tracking-tight text-teal-900 tabular-nums">
              {totalIMB}
            </div>
            <div className="flex items-center justify-between text-xs text-teal-800">
              <span className="font-medium">Izin Bangunan</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('doc-imb');
                }}
                className="inline-flex items-center gap-0.5 font-semibold text-teal-900 group-hover:underline whitespace-nowrap shrink-0"
              >
                Buka <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 4. E-Sertifikat Tanah — Indigo Violet */}
          <div
            onClick={() => onNavigate('doc-tanah')}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-indigo-300 bg-gradient-to-br from-indigo-50 via-indigo-100/75 to-violet-50 p-4 shadow-xs transition-all hover:border-indigo-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-950">
                E-Sertifikat Tanah
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                <MapPin className="h-4 w-4" />
              </span>
            </div>
            <div className="my-2.5 font-mono text-3xl font-bold tracking-tight text-indigo-900 tabular-nums">
              {totalTanah}
            </div>
            <div className="flex items-center justify-between text-xs text-indigo-800">
              <span className="font-medium">SHM, HGB & NIB</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('doc-tanah');
                }}
                className="inline-flex items-center gap-0.5 font-semibold text-indigo-900 group-hover:underline whitespace-nowrap shrink-0"
              >
                Buka <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 5. Sertifikat Merk — Amber Gold */}
          <div
            onClick={() => onNavigate('doc-merk')}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 via-amber-100/80 to-yellow-50 p-4 shadow-xs transition-all hover:border-amber-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-950">
                Sertifikat Merk
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-2xs">
                <Award className="h-4 w-4" />
              </span>
            </div>
            <div className="my-2.5 font-mono text-3xl font-bold tracking-tight text-amber-900 tabular-nums">
              {totalMerk}
            </div>
            <div className="flex items-center justify-between text-xs text-amber-900">
              <span className="font-medium">HAKI & Etiket</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('doc-merk');
                }}
                className="inline-flex items-center gap-0.5 font-semibold text-amber-950 group-hover:underline whitespace-nowrap shrink-0"
              >
                Buka <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 6. Sertifikat K3 — Rose Crimson */}
          <div
            onClick={() => onNavigate('doc-k3')}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-rose-300 bg-gradient-to-br from-rose-50 via-rose-100/75 to-pink-50 p-4 shadow-xs transition-all hover:border-rose-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-rose-950">
                Sertifikat K3
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-2xs">
                <HardHat className="h-4 w-4" />
              </span>
            </div>
            <div className="my-2.5 font-mono text-3xl font-bold tracking-tight text-rose-900 tabular-nums">
              {totalK3}
            </div>
            <div className="flex items-center justify-between text-xs text-rose-800">
              <span className="font-medium">Kelayakan Alat</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('doc-k3');
                }}
                className="inline-flex items-center gap-0.5 font-semibold text-rose-900 group-hover:underline whitespace-nowrap shrink-0"
              >
                Buka <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 7. Sertifikat Laik Operasi (SLO) — Vibrant Amber Gold */}
          <div
            onClick={() => onNavigate('doc-slo')}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 via-amber-100/75 to-yellow-50 p-4 shadow-xs transition-all hover:border-amber-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-950">
                Sertifikat SLO
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-2xs">
                <Zap className="h-4 w-4" />
              </span>
            </div>
            <div className="my-2.5 font-mono text-3xl font-bold tracking-tight text-amber-900 tabular-nums">
              {totalSLO}
            </div>
            <div className="flex items-center justify-between text-xs text-amber-800">
              <span className="font-medium">Genset & Listrik</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('doc-slo');
                }}
                className="inline-flex items-center gap-0.5 font-semibold text-amber-900 group-hover:underline whitespace-nowrap shrink-0"
              >
                Buka <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 8. Uji Timbangan — Fresh Teal / Cyan */}
          <div
            onClick={() => onNavigate('doc-timbangan')}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-teal-300 bg-gradient-to-br from-teal-50 via-teal-100/75 to-cyan-50 p-4 shadow-xs transition-all hover:border-teal-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-teal-950">
                Uji Timbangan
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-2xs">
                <Scale className="h-4 w-4" />
              </span>
            </div>
            <div className="my-2.5 font-mono text-3xl font-bold tracking-tight text-teal-900 tabular-nums">
              {totalTimbangan}
            </div>
            <div className="flex items-center justify-between text-xs text-teal-800">
              <span className="font-medium">Tera &amp; Kalibrasi</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('doc-timbangan');
                }}
                className="inline-flex items-center gap-0.5 font-semibold text-teal-900 group-hover:underline whitespace-nowrap shrink-0"
              >
                Buka <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Automatic Deadline & Expiry Reminder Panel (E-SPPT, K3, Merk, SLO & Timbangan) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Pengingat Jatuh Tempo Dokumen (E-SPPT, K3, Merk, SLO &amp; Timbangan)
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Pemantauan otomatis tanggal jatuh tempo pajak, masa berlaku K3, hak kepemilikan merk, SLO kelaikan listrik/genset, dan sertifikat uji tera timbangan.{' '}
              <span className="font-medium text-rose-700">
                {overdueCount} dokumen lewat batas waktu
              </span>
              {' · '}
              <span className="font-medium text-amber-700">
                {warningCount} dokumen mendekati batas waktu
              </span>
            </p>
          </div>

          {/* Functional Segmented Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setReminderFilter('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                reminderFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({allReminders.length})
            </button>
            <button
              type="button"
              onClick={() => setReminderFilter('overdue')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                reminderFilter === 'overdue'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lewat Batas ({overdueCount})
            </button>
            <button
              type="button"
              onClick={() => setReminderFilter('warning')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                reminderFilter === 'warning'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Segera Berakhir ({warningCount})
            </button>
            <button
              type="button"
              onClick={() => setReminderFilter('active')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                reminderFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif Aman ({allReminders.length - overdueCount - warningCount})
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">No Arsip</th>
                <th className="px-4 py-2.5 font-semibold">Jenis Dokumen</th>
                <th className="px-4 py-2.5 font-semibold">Objek Pajak / Unit K3</th>
                <th className="px-4 py-2.5 font-semibold">Lokasi Arsip Asli</th>
                <th className="px-4 py-2.5 font-semibold">Tanggal Batas</th>
                <th className="px-4 py-2.5 font-semibold">Status Pengingat</th>
                <th className="py-2.5 pl-4 text-right font-semibold">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada dokumen pada filter status pengingat ini.
                  </td>
                </tr>
              ) : (
                filteredReminders.map((item) => {
                  const statusColorClass =
                    item.evaluation.state === 'overdue'
                      ? 'text-rose-700 font-semibold'
                      : item.evaluation.state === 'warning'
                      ? 'text-amber-700 font-semibold'
                      : 'text-emerald-700 font-medium';

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {item.noArsip}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        <span>{item.kategori}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="text-slate-500">{item.jenisBatas}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.judul}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {item.subJudul}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.lokasiArsip}</td>
                      <td className="px-4 py-3 font-mono text-slate-900 tabular-nums whitespace-nowrap">
                        {formatIndonesianDate(item.tanggalBatas)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={statusColorClass}>
                          {item.evaluation.shortLabel}
                        </span>
                        <span aria-hidden="true" className="text-slate-400">
                          {' · '}
                        </span>
                        <span className="font-mono text-slate-600 tabular-nums">
                          {item.evaluation.label}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onNavigate(item.targetView)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                          Kelola
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Two-Column Distribution: Lokasi Arsip Dokumen & Status Bayar E-NOP */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Left: Lokasi Penyimpanan Arsip Fisik */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Sebaran Lokasi Penyimpanan Dokumen Asli
                </h2>
                <p className="text-xs text-slate-500">
                  Data Master Arsip Dokumen beserta Penanggungjawab (PIC) dan beban dokumen
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('master-arsip')}
                className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
              >
                Kelola Lokasi
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {locationDistribution.map((loc) => (
                <div key={loc.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">
                        {loc.namaLokasi}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        {' · '}
                      </span>
                      <span className="text-slate-600">
                        PIC: {loc.penanggungJawab}
                      </span>
                    </div>
                    <div className="font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {loc.count} Dokumen ({loc.pct}%)
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${Math.max(loc.pct, loc.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-md">{loc.lokasi}</span>
                    <span className="font-mono tabular-nums">{loc.breakdown}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Status Bayar Bukti Bayar PBB & Ringkasan Master */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Komposisi Status Bayar Bukti Bayar PBB
                </h2>
                <p className="text-xs text-slate-500">
                  Rekapitulasi Lunas, Cicilan, dan Belum Bayar sesuai Data Master
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('master-status')}
                className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
              >
                Data Master Status
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {paymentDistribution.map((st) => {
                const barColor =
                  st.kategori === 'lunas'
                    ? 'bg-emerald-600'
                    : st.kategori === 'cicilan'
                    ? 'bg-amber-500'
                    : 'bg-rose-600';

                const textColor =
                  st.kategori === 'lunas'
                    ? 'text-emerald-700'
                    : st.kategori === 'cicilan'
                    ? 'text-amber-700'
                    : 'text-rose-700';

                return (
                  <div
                    key={st.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${textColor}`}>
                        {st.namaStatus}
                      </span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {st.count} Dokumen ({st.pct}%)
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.max(st.pct, st.count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {st.keterangan}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-600">
            <span>
              Cakupan Wilayah Master:{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                {state.masterProvinces.length} Provinsi
              </strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('master-provinsi')}
              className="font-medium text-blue-700 hover:underline"
            >
              Lihat Kota/Kabupaten →
            </button>
          </div>
        </div>
      </section>

      {/* Unified Quick Search & All Indexed Documents Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Daftar Indeks Cepat Seluruh Dokumen Arsip
            </h2>
            <p className="text-xs text-slate-500">
              Pencarian lintas kategori (No Arsip, NOP, Nama Merk, atau No Seri K3) secara langsung
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={recentSearch}
              onChange={(e) => setRecentSearch(e.target.value)}
              placeholder="Cari No Arsip, NOP, Merk, K3..."
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">No Arsip</th>
                <th className="px-4 py-2.5 font-semibold">Kategori</th>
                <th className="px-4 py-2.5 font-semibold">Identitas & Ringkasan Dokumen</th>
                <th className="px-4 py-2.5 font-semibold">Tempat Penyimpanan Asli</th>
                <th className="px-4 py-2.5 font-semibold">Lampiran File</th>
                <th className="py-2.5 pl-4 text-right font-semibold">Modul</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unifiedRecentDocs.map((item) => {
                const catColorClass =
                  item.kategori === 'Bukti Bayar PBB' || item.kategori === 'E-NOP'
                    ? 'text-blue-700 font-bold'
                    : item.kategori === 'E-SPPT'
                    ? 'text-emerald-700 font-bold'
                    : item.kategori === 'Sertifikat Merk'
                    ? 'text-amber-700 font-bold'
                    : item.kategori === 'Sertifikat K3'
                    ? 'text-rose-700 font-bold'
                    : item.kategori === 'E-Sertifikat Tanah'
                    ? 'text-indigo-700 font-bold'
                    : 'text-teal-700 font-bold';

                return (
                  <tr key={`${item.kategori}-${item.id}`} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {item.noArsip}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${catColorClass}`}>
                      {item.kategori}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{item.judulUtama}</div>
                      <div className="text-[11px] text-slate-500">{item.subDetail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.lokasiArsip}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.hasFile ? (
                        <span className="font-medium text-emerald-700">Tersedia Berkas</span>
                      ) : (
                        <span className="text-slate-400">Belum Diunggah</span>
                      )}
                    </td>
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigate(item.targetView)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                      >
                        Buka Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
