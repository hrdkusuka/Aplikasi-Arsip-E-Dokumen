import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Filter,
  Search,
  CheckCircle2,
  Printer,
  Tag,
  CalendarClock,
} from 'lucide-react';
import { AppState } from '../types';
import {
  exportToExcel,
  exportToPDF,
  getLocationName,
  getProvinceName,
  getStatusName,
  ReportDocType,
} from '../utils/exportReport';
import { evaluateDateDeadline, formatIndonesianDate } from '../utils/archiveHelpers';
import { ArchiveLabelModal } from './ArchiveLabelModal';

interface ReportViewProps {
  state: AppState;
  canExportReport: boolean;
  onNotify: (msg: string) => void;
  openLabelModalDirectly?: boolean;
  onResetLabelModalDirectly?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  state,
  canExportReport,
  onNotify,
  openLabelModalDirectly = false,
  onResetLabelModalDirectly,
}) => {
  const [selectedDocType, setSelectedDocType] = useState<ReportDocType>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  useEffect(() => {
    if (openLabelModalDirectly) {
      setIsLabelModalOpen(true);
    }
  }, [openLabelModalDirectly]);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const enop = state.docsENOP.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.nop.toLowerCase().includes(q) ||
        (d.namaWajibPajak && d.namaWajibPajak.toLowerCase().includes(q)) ||
        (d.alamatWajibPajak && d.alamatWajibPajak.toLowerCase().includes(q)) ||
        d.namaNop.toLowerCase().includes(q) ||
        d.kotaKabupaten.toLowerCase().includes(q)
      );
    });

    const esppt = state.docsESPPT.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.nop.toLowerCase().includes(q) ||
        (d.namaWajibPajak && d.namaWajibPajak.toLowerCase().includes(q)) ||
        (d.alamatWajibPajak && d.alamatWajibPajak.toLowerCase().includes(q)) ||
        (d.namaAlamatWajibPajak && d.namaAlamatWajibPajak.toLowerCase().includes(q)) ||
        d.letakObjekPajak.toLowerCase().includes(q)
      );
    });

    const merk = state.docsMerk.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.nama.toLowerCase().includes(q) ||
        d.etiketMerk.toLowerCase().includes(q) ||
        d.noPendaftaran.toLowerCase().includes(q)
      );
    });

    const k3 = state.docsK3.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.jenisObjekK3.toLowerCase().includes(q) ||
        d.namaPerusahaan.toLowerCase().includes(q) ||
        d.merk.toLowerCase().includes(q) ||
        d.noSeri.toLowerCase().includes(q)
      );
    });

    const tanah = state.docsTanah.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.nomorSertifikat.toLowerCase().includes(q) ||
        d.nib.toLowerCase().includes(q) ||
        d.namaPemegangHak.toLowerCase().includes(q) ||
        d.nikPemilik.toLowerCase().includes(q) ||
        d.kotaKabupaten.toLowerCase().includes(q) ||
        d.kecamatan.toLowerCase().includes(q) ||
        d.desaKelurahan.toLowerCase().includes(q)
      );
    });

    const imb = state.docsIMB.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.noKeputusan.toLowerCase().includes(q) ||
        d.atasNama.toLowerCase().includes(q) ||
        d.nama.toLowerCase().includes(q) ||
        d.lokasiBangunan.toLowerCase().includes(q) ||
        d.kota.toLowerCase().includes(q) ||
        d.kecamatan.toLowerCase().includes(q) ||
        d.kelurahanDesa.toLowerCase().includes(q) ||
        d.bangunanInduk.toLowerCase().includes(q)
      );
    });

    const slo = (state.docsSLO || []).filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.noSlo.toLowerCase().includes(q) ||
        d.namaPerusahaan.toLowerCase().includes(q) ||
        d.lokasiInstalasi.toLowerCase().includes(q) ||
        d.alamatInstalasi.toLowerCase().includes(q) ||
        d.merekPeralatan.toLowerCase().includes(q) ||
        d.tipePeralatan.toLowerCase().includes(q) ||
        d.nomorSeri.toLowerCase().includes(q) ||
        d.lembagaInspeksi.toLowerCase().includes(q) ||
        d.nomorRegistrasi.toLowerCase().includes(q) ||
        d.pic.toLowerCase().includes(q) ||
        (d.idSlo && d.idSlo.toLowerCase().includes(q))
      );
    });

    const timbangan = (state.docsTimbangan || []).filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.nomorSuratPengujian.toLowerCase().includes(q) ||
        d.namaAlatUkur.toLowerCase().includes(q) ||
        d.merekPabrikBuatan.toLowerCase().includes(q) ||
        d.modelTipe.toLowerCase().includes(q) ||
        d.nomorSeriIdentitas.toLowerCase().includes(q) ||
        d.pemilikPemakai.toLowerCase().includes(q) ||
        d.alamatPemilik.toLowerCase().includes(q) ||
        d.instansiPenerbit.toLowerCase().includes(q) ||
        (d.nomorOrder && d.nomorOrder.toLowerCase().includes(q)) ||
        (d.idPengujian && d.idPengujian.toLowerCase().includes(q))
      );
    });

    return { enop, esppt, merk, k3, tanah, imb, slo, timbangan };
  }, [state, locationFilter, searchQuery]);

  const handleExportExcel = () => {
    if (!canExportReport) return;
    exportToExcel(state, selectedDocType, filteredData);
    onNotify(
      `Berhasil mengekspor Laporan Excel (.xlsx) untuk kategori ${
        selectedDocType === 'ALL' ? 'Semua Dokumen' : selectedDocType
      }.`
    );
  };

  const handleExportPDF = () => {
    if (!canExportReport) return;
    exportToPDF(state, selectedDocType, filteredData);
    onNotify(
      `Berhasil mengekspor Laporan PDF (.pdf) untuk kategori ${
        selectedDocType === 'ALL' ? 'Semua Dokumen' : selectedDocType
      }.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laporan & Ekspor Arsip Dokumen
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pilih kategori dokumen, saring lokasi arsip fisik, tinjau pratinjau rekapitulasi, dan unduh dalam format Excel (.xlsx) atau PDF (.pdf).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLabelModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 shadow-xs whitespace-nowrap shrink-0"
            title="Cetak Label Arsip Ukuran 3x8 cm yang dimaksimalkan untuk kertas A4"
          >
            <Printer className="h-4 w-4" />
            Cetak Label
          </button>
          <button
            type="button"
            disabled={!canExportReport}
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel (.xlsx)
          </button>
          <button
            type="button"
            disabled={!canExportReport}
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <FileDown className="h-4 w-4" />
            Export PDF (.pdf)
          </button>
        </div>
      </div>

      {/* Quick Label Print Banner */}
      <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-600 p-2 text-white shrink-0">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-blue-950">
              Cetak Label Fisik Arsip Dokumen (Ukuran 3 x 8 cm)
            </h2>
            <p className="mt-0.5 text-xs text-blue-850">
              Cetak stiker/label fisik berukuran 3x8 cm dengan tata letak otomatis dimaksimalkan pada kertas A4 (hingga 18 label per lembar), fokus pada No Arsip (font besar &amp; jelas) dan baris 2 keterangan di bawahnya.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsLabelModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 shadow-xs whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Printer className="h-4 w-4" />
          Buka Cetak Label
        </button>
      </div>

      {/* Filter & Pilih Dokumen Control Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          {/* Pilih Dokumen */}
          <div className="lg:col-span-6">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Pilih Dokumen Laporan
            </label>
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(
                [
                  { id: 'ALL', label: 'Semua Dokumen' },
                  { id: 'ESPPT', label: 'E-SPPT' },
                  { id: 'ENOP', label: 'Bukti Bayar PBB' },
                  { id: 'IMB', label: 'E-IMB' },
                  { id: 'TANAH', label: 'E-Sertifikat Tanah' },
                  { id: 'MERK', label: 'Sertifikat Merk' },
                  { id: 'K3', label: 'Sertifikat K3' },
                  { id: 'SLO', label: 'Sertifikat SLO' },
                  { id: 'TIMBANGAN', label: 'Uji Timbangan' },
                ] as { id: ReportDocType; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedDocType(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedDocType === tab.id
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Lokasi Arsip */}
          <div className="lg:col-span-3">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Filter Lokasi Arsip Dokumen
            </label>
            <div className="relative">
              <Filter className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-8 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="ALL">Seluruh Lokasi Penyimpanan</option>
                {state.masterLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.namaLokasi}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pencarian Kata Kunci */}
          <div className="lg:col-span-3">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Kata Kunci Laporan
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="No Arsip, NOP, NIB, No Sertifikat..."
                className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-8 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Summary Metadata Line */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
            <span>E-SPPT: {filteredData.esppt.length}</span>
            <span aria-hidden="true">·</span>
            <span>Bukti Bayar PBB: {filteredData.enop.length}</span>
            <span aria-hidden="true">·</span>
            <span>E-IMB: {filteredData.imb.length}</span>
            <span aria-hidden="true">·</span>
            <span>E-Sertifikat Tanah: {filteredData.tanah.length}</span>
            <span aria-hidden="true">·</span>
            <span>Sertifikat Merk: {filteredData.merk.length}</span>
            <span aria-hidden="true">·</span>
            <span>Sertifikat K3: {filteredData.k3.length}</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-800 font-semibold">SLO: {filteredData.slo.length}</span>
            <span aria-hidden="true">·</span>
            <span className="text-teal-800 font-semibold">Timbangan: {filteredData.timbangan.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Siap diekspor ke format Microsoft Excel (.xlsx) & Adobe PDF (.pdf)</span>
          </div>
        </div>
      </div>

      {/* REPORT PREVIEW SECTIONS */}
      <div className="space-y-6">
        {/* 1. Preview E-SPPT */}
        {(selectedDocType === 'ALL' || selectedDocType === 'ESPPT') && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Tabel Laporan 1: Dokumen E-SPPT ({filteredData.esppt.length} Data)
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Sheet: Dokumen E-SPPT
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">No Arsip</th>
                    <th className="px-3 py-2 font-semibold">NOP</th>
                    <th className="px-3 py-2 font-semibold">Tahun</th>
                    <th className="px-3 py-2 font-semibold">Letak Objek Pajak</th>
                    <th className="px-3 py-2 font-semibold">Nama Wajib Pajak</th>
                    <th className="px-3 py-2 font-semibold">Alamat Wajib Pajak</th>
                    <th className="px-3 py-2 font-semibold">Jatuh Tempo</th>
                    <th className="py-2 pl-3 font-semibold">Arsip Dokumen (Lokasi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.esppt.map((d) => {
                    const dl = evaluateDateDeadline(d.jatuhTempo);
                    return (
                      <tr key={d.id}>
                        <td className="py-2.5 pr-3 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                          {d.noArsip}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-emerald-700 tabular-nums whitespace-nowrap">
                          {d.nop}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-800 tabular-nums">
                          {d.tahun}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">{d.letakObjekPajak}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          {d.namaWajibPajak || d.namaAlamatWajibPajak}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {d.alamatWajibPajak || '-'}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-900 tabular-nums whitespace-nowrap">
                          {formatIndonesianDate(d.jatuhTempo)} ({dl.shortLabel})
                        </td>
                        <td className="py-2.5 pl-3 text-slate-600">
                          {getLocationName(state, d.arsipDokumenId)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Preview Bukti Bayar PBB */}
        {(selectedDocType === 'ALL' || selectedDocType === 'ENOP') && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Tabel Laporan 2: Dokumen Bukti Bayar PBB ({filteredData.enop.length} Data)
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Sheet: Bukti Bayar PBB
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">No Arsip</th>
                    <th className="px-3 py-2 font-semibold">Tgl Transaksi</th>
                    <th className="px-3 py-2 font-semibold">NOP (Dari E-SPPT)</th>
                    <th className="px-3 py-2 font-semibold">Nama Wajib Pajak</th>
                    <th className="px-3 py-2 font-semibold">Alamat Wajib Pajak</th>
                    <th className="px-3 py-2 font-semibold">Nama NOP</th>
                    <th className="px-3 py-2 font-semibold">Tahun</th>
                    <th className="px-3 py-2 font-semibold">Provinsi / Kota/Kab</th>
                    <th className="px-3 py-2 font-semibold">Status Bayar</th>
                    <th className="py-2 pl-3 font-semibold">Arsip Dokumen (Lokasi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.enop.map((d) => {
                    const matchedSppt = state.docsESPPT.find(
                      (s) => s.id === d.espptId || s.nop === d.nop
                    );
                    const namaWP =
                      d.namaWajibPajak || matchedSppt?.namaWajibPajak || d.namaNop || '-';
                    const alamatWP =
                      d.alamatWajibPajak ||
                      matchedSppt?.alamatWajibPajak ||
                      d.lokasiAlamat ||
                      '-';
                    return (
                      <tr key={d.id}>
                        <td className="py-2.5 pr-3 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                          {d.noArsip}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                          {formatIndonesianDate(d.tanggalTransaksi)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-blue-700 tabular-nums whitespace-nowrap">
                          {d.nop}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          {namaWP}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {alamatWP}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          {d.namaNop}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700 tabular-nums">
                          {d.tahunPajak}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {getProvinceName(state, d.provinsiId)} · {d.kotaKabupaten}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">
                          {getStatusName(state, d.statusBayarId)}
                        </td>
                        <td className="py-2.5 pl-3 text-slate-600">
                          {getLocationName(state, d.arsipDokumenId)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Preview E-IMB */}
        {(selectedDocType === 'ALL' || selectedDocType === 'IMB') && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Tabel Laporan 3: Dokumen E-IMB ({filteredData.imb.length} Data)
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Sheet: Dokumen E-IMB
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">No Arsip</th>
                    <th className="px-3 py-2 font-semibold">No Keputusan & Tahun</th>
                    <th className="px-3 py-2 font-semibold">Atas Nama & Pemohon</th>
                    <th className="px-3 py-2 font-semibold">Tgl Permohonan IMB</th>
                    <th className="px-3 py-2 font-semibold">Lokasi & Wilayah Bangunan</th>
                    <th className="px-3 py-2 font-semibold">Bangunan Induk & Maksud</th>
                    <th className="py-2 pl-3 font-semibold">Arsip Dokumen (Lokasi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.imb.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2.5 pr-3 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {d.noArsip}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-900 tabular-nums whitespace-nowrap">
                        {d.noKeputusan} ({d.tahun})
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900">{d.atasNama}</div>
                        <div className="text-[11px] text-slate-500">
                          Pemohon: {d.nama}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                        {formatIndonesianDate(d.tglPermohonanImb)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        <div className="font-medium text-slate-900">{d.lokasiBangunan}</div>
                        <div className="text-[11px] text-slate-500">
                          {d.kelurahanDesa}, {d.kecamatan}, {d.kota}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        <div className="font-medium text-slate-900">{d.bangunanInduk}</div>
                        <div className="text-[11px] text-slate-500">{d.bermaksudUntuk}</div>
                      </td>
                      <td className="py-2.5 pl-3 text-slate-600">
                        {getLocationName(state, d.arsipDokumenId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Preview E-Sertifikat Tanah */}
        {(selectedDocType === 'ALL' || selectedDocType === 'TANAH') && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Tabel Laporan 4: Dokumen E-Sertifikat Tanah ({filteredData.tanah.length} Data)
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Sheet: E-Sertifikat Tanah
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">No Arsip</th>
                    <th className="px-3 py-2 font-semibold">Jenis Hak & No Sertifikat</th>
                    <th className="px-3 py-2 font-semibold">NIB (14 Digit)</th>
                    <th className="px-3 py-2 font-semibold">Pemegang Hak & NIK</th>
                    <th className="px-3 py-2 font-semibold">Letak Tanah (Kel/Kec/Kota)</th>
                    <th className="px-3 py-2 font-semibold">Surat Ukur & Luas</th>
                    <th className="px-3 py-2 font-semibold">Status & Beban</th>
                    <th className="py-2 pl-3 font-semibold">Arsip Dokumen (Lokasi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.tanah.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2.5 pr-3 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {d.noArsip}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{d.jenisHak}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono text-slate-800">{d.nomorSertifikat}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-blue-700 tabular-nums whitespace-nowrap">
                        {d.nib}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-900">{d.namaPemegangHak}</div>
                        <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                          NIK: {d.nikPemilik}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {d.desaKelurahan}, {d.kecamatan}, {d.kotaKabupaten}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                        {d.nomorSuratUkur} ({d.luasTanah.toLocaleString('id-ID')} m²)
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        <div>{d.statusDokumen}</div>
                        <div className="text-[11px] font-medium text-slate-600">
                          {d.statusBeban}
                        </div>
                      </td>
                      <td className="py-2.5 pl-3 text-slate-600">
                        {getLocationName(state, d.arsipDokumenId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Preview Sertifikat Merk */}
        {(selectedDocType === 'ALL' || selectedDocType === 'MERK') && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Tabel Laporan 5: Dokumen Sertifikat Merk ({filteredData.merk.length} Data)
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Sheet: Sertifikat Merk
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">No Arsip</th>
                    <th className="px-3 py-2 font-semibold">Etiket Merk</th>
                    <th className="px-3 py-2 font-semibold">Nama & Alamat</th>
                    <th className="px-3 py-2 font-semibold">No Pendaftaran & Terima</th>
                    <th className="px-3 py-2 font-semibold">No Permohonan & Ajuan</th>
                    <th className="px-3 py-2 font-semibold">Jatuh Tempo Kepemilikan</th>
                    <th className="px-3 py-2 font-semibold">Kelas & Uraian Warna</th>
                    <th className="py-2 pl-3 font-semibold">Arsip Dokumen (Lokasi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.merk.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2.5 pr-3 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {d.noArsip}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        {d.etiketMerk}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {d.nama} · {d.alamat}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                        {d.noPendaftaran} ({formatIndonesianDate(d.tanggalPenerimaan)})
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                        {d.noPermohonan} ({formatIndonesianDate(d.tanggalPengajuan)})
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                        {d.tglJatuhTempoKepemilikan
                          ? formatIndonesianDate(d.tglJatuhTempoKepemilikan)
                          : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {d.kelasBarangJasa} · Warna: {d.uraianWarna}
                      </td>
                      <td className="py-2.5 pl-3 text-slate-600">
                        {getLocationName(state, d.arsipDokumenId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Preview Sertifikat K3 */}
        {(selectedDocType === 'ALL' || selectedDocType === 'K3') && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Tabel Laporan 6: Dokumen Sertifikat K3 ({filteredData.k3.length} Data)
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Sheet: Sertifikat K3
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">No Arsip</th>
                    <th className="px-3 py-2 font-semibold">Jenis Objek K3</th>
                    <th className="px-3 py-2 font-semibold">Perusahaan & Lokasi Unit</th>
                    <th className="px-3 py-2 font-semibold">Merk / Type / No Seri</th>
                    <th className="px-3 py-2 font-semibold">Pembuat & Kapasitas</th>
                    <th className="px-3 py-2 font-semibold">Tgl Periksa & Berlaku</th>
                    <th className="py-2 pl-3 font-semibold">Arsip Dokumen (Lokasi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.k3.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2.5 pr-3 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {d.noArsip}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {d.jenisObjekK3} ({d.jenis})
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {d.namaPerusahaan} · {d.lokasiUnit}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                        {d.merk} / {d.type} / {d.noSeri}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {d.perusahaanPembuat} ({d.tempatPembuatan}, {d.tahunBuat}) ·{' '}
                        {d.kapasitas}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                        {formatIndonesianDate(d.tanggalPemeriksaan)} s/d{' '}
                        {formatIndonesianDate(d.berlakuSampaiTanggal)}
                      </td>
                      <td className="py-2.5 pl-3 text-slate-600">
                        {getLocationName(state, d.arsipDokumenId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. Preview Sertifikat Laik Operasi (SLO) */}
        {(selectedDocType === 'ALL' || selectedDocType === 'SLO') && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Tabel Laporan 7: Dokumen Sertifikat Laik Operasi / SLO ({filteredData.slo.length} Data)
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Sheet: Sertifikat SLO
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">No Arsip</th>
                    <th className="px-3 py-2 font-semibold">Jenis &amp; No SLO</th>
                    <th className="px-3 py-2 font-semibold">Nama Perusahaan</th>
                    <th className="px-3 py-2 font-semibold">Lokasi &amp; Instalasi</th>
                    <th className="px-3 py-2 font-semibold">Peralatan &amp; Kapasitas</th>
                    <th className="px-3 py-2 font-semibold">Masa Berlaku</th>
                    <th className="px-3 py-2 font-semibold">Status SLO</th>
                    <th className="py-2 pl-3 font-semibold">Lokasi Arsip Fisik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.slo.map((d) => {
                    const dl = evaluateDateDeadline(d.tanggalBerlaku);
                    return (
                      <tr key={d.id}>
                        <td className="py-2.5 pr-3 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                          {d.noArsip}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          <span className="font-semibold text-blue-700">{d.jenisSlo}</span>
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="font-mono">{d.noSlo}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {d.namaPerusahaan}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {d.lokasiInstalasi} ({d.jenisInstalasi})
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                          {d.merekPeralatan} {d.tipePeralatan} ({d.kapasitasKva} kVA / {d.dayaKw} kW)
                        </td>
                        <td className="px-3 py-2.5 font-mono tabular-nums whitespace-nowrap">
                          <span className="text-slate-700">{formatIndonesianDate(d.tanggalBerlaku)}</span>
                          <span
                            className={`ml-1.5 inline-block text-[11px] font-medium ${
                              dl.state === 'overdue'
                                ? 'text-red-600'
                                : dl.state === 'warning'
                                ? 'text-amber-600 font-semibold'
                                : 'text-slate-500'
                            }`}
                          >
                            ({dl.shortLabel})
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              d.statusSlo === 'AKTIF'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : d.statusSlo === 'PROSES'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {d.statusSlo}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 text-slate-600">
                          {getLocationName(state, d.arsipDokumenId)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. Preview Uji Timbangan */}
        {(selectedDocType === 'ALL' || selectedDocType === 'TIMBANGAN') && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Tabel Laporan 8: Dokumen Sertifikat Uji Timbangan ({filteredData.timbangan.length} Data)
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Sheet: Uji Timbangan
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">No Arsip</th>
                    <th className="px-3 py-2 font-semibold">Jenis &amp; Nama Alat</th>
                    <th className="px-3 py-2 font-semibold">No Surat Pengujian</th>
                    <th className="px-3 py-2 font-semibold">Merek &amp; Model</th>
                    <th className="px-3 py-2 font-semibold">Kapasitas Maks / Min</th>
                    <th className="px-3 py-2 font-semibold">Masa Berlaku</th>
                    <th className="px-3 py-2 font-semibold">Status Dokumen</th>
                    <th className="py-2 pl-3 font-semibold">Lokasi Arsip Fisik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.timbangan.map((d) => {
                    const dl = evaluateDateDeadline(d.berlakuSampai);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-3 font-mono font-semibold text-teal-800">
                          {d.noArsip}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-slate-900">{d.namaAlatUkur}</div>
                          <div className="text-[11px] text-slate-500">{d.jenisTimbangan}</div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          {d.nomorSuratPengujian}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-slate-800">{d.merekPabrikBuatan} · {d.modelTipe}</div>
                          <div className="font-mono text-[11px] text-slate-500">SN: {d.nomorSeriIdentitas}</div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          <div>Maks: <span className="font-semibold text-slate-900">{d.kapasitasMaksimumKg.toLocaleString('id-ID')} kg</span></div>
                          <div className="text-[11px] text-slate-500">Min: {d.kapasitasMinimumKg.toLocaleString('id-ID')} kg</div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="font-medium text-slate-900">
                            {formatIndonesianDate(d.berlakuSampai)}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              dl.state === 'overdue'
                                ? 'text-red-700'
                                : dl.state === 'warning'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            <CalendarClock className="h-3 w-3" />
                            {dl.shortLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              d.statusDokumen === 'LENGKAP'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {d.statusDokumen}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 text-slate-600">
                          {getLocationName(state, d.arsipDokumenId)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Studio Cetak Label Arsip Dokumen 3x8 cm */}
      <ArchiveLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => {
          setIsLabelModalOpen(false);
          if (onResetLabelModalDirectly) {
            onResetLabelModalDirectly();
          }
        }}
        state={state}
        onNotify={onNotify}
      />
    </div>
  );
};

