import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileDown,
  CheckSquare,
  Square,
  Search,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Scissors,
  CheckCircle2,
  AlignCenter,
  AlignLeft,
  Sparkles,
  Check,
  ExternalLink,
} from 'lucide-react';
import { AppState } from '../types';
import {
  exportLabelsToPDF,
  LabelDocumentItem,
  PaperSize,
  LabelExportConfig,
  SecondLineOption,
  LabelAlignment,
  getSecondLineText,
} from '../utils/labelPdfExport';

interface ArchiveLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onNotify: (msg: string) => void;
}

// Convert all documents in AppState into unified LabelDocumentItem list
function extractAllDocumentLabels(state: AppState): LabelDocumentItem[] {
  const items: LabelDocumentItem[] = [];

  const getLoc = (locId: string) =>
    state.masterLocations.find((l) => l.id === locId)?.namaLokasi || 'Arsip Utama';

  // 1. E-SPPT
  state.docsESPPT.forEach((d) => {
    items.push({
      id: `esppt-${d.id}`,
      noArsip: d.noArsip,
      category: 'E-SPPT',
      primaryTitle: `NOP ${d.nop} (${d.tahun})`,
      subTitle: `WP: ${d.namaWajibPajak || d.namaAlamatWajibPajak || '-'}`,
      locationName: getLoc(d.arsipDokumenId),
      extraInfo: `${d.letakObjekPajak}`,
    });
  });

  // 2. Bukti Bayar PBB
  state.docsENOP.forEach((d) => {
    const st = state.masterStatuses.find((s) => s.id === d.statusBayarId)?.namaStatus || '-';
    items.push({
      id: `enop-${d.id}`,
      noArsip: d.noArsip,
      category: 'Bukti Bayar PBB',
      primaryTitle: `NOP ${d.nop} (${d.tahunPajak})`,
      subTitle: `WP: ${d.namaWajibPajak || d.namaNop || '-'}`,
      locationName: getLoc(d.arsipDokumenId),
      extraInfo: `${d.kotaKabupaten} · Status: ${st}`,
    });
  });

  // 3. E-IMB
  state.docsIMB.forEach((d) => {
    items.push({
      id: `imb-${d.id}`,
      noArsip: d.noArsip,
      category: 'E-IMB',
      primaryTitle: `SK IMB No. ${d.noKeputusan} (${d.tahun})`,
      subTitle: `Atas Nama: ${d.atasNama}`,
      locationName: getLoc(d.arsipDokumenId),
      extraInfo: `${d.bangunanInduk} · ${d.kota}`,
    });
  });

  // 4. E-Sertifikat Tanah
  state.docsTanah.forEach((d) => {
    items.push({
      id: `tanah-${d.id}`,
      noArsip: d.noArsip,
      category: 'E-Sertifikat Tanah',
      primaryTitle: `${d.jenisHak} No. ${d.nomorSertifikat} (NIB: ${d.nib})`,
      subTitle: `Pemegang: ${d.namaPemegangHak}`,
      locationName: getLoc(d.arsipDokumenId),
      extraInfo: `${d.desaKelurahan}, ${d.kotaKabupaten}`,
    });
  });

  // 5. Sertifikat Merk
  state.docsMerk.forEach((d) => {
    items.push({
      id: `merk-${d.id}`,
      noArsip: d.noArsip,
      category: 'Sertifikat Merk',
      primaryTitle: `Reg: ${d.noPendaftaran} — ${d.etiketMerk}`,
      subTitle: `Pemilik: ${d.nama}`,
      locationName: getLoc(d.arsipDokumenId),
      extraInfo: `${d.kelasBarangJasa}`,
    });
  });

  // 6. Sertifikat K3
  state.docsK3.forEach((d) => {
    items.push({
      id: `k3-${d.id}`,
      noArsip: d.noArsip,
      category: 'Sertifikat K3',
      primaryTitle: `${d.jenisObjekK3} — ${d.merk} ${d.type}`,
      subTitle: `${d.namaPerusahaan}`,
      locationName: getLoc(d.arsipDokumenId),
      extraInfo: `SN: ${d.noSeri} · Unit: ${d.lokasiUnit}`,
    });
  });

  // 7. Sertifikat Laik Operasi (SLO)
  (state.docsSLO || []).forEach((d) => {
    items.push({
      id: `slo-${d.id}`,
      noArsip: d.noArsip,
      category: 'Sertifikat Laik Operasi',
      primaryTitle: `SLO: ${d.noSlo} (${d.jenisSlo})`,
      subTitle: `${d.namaPerusahaan} · ${d.merekPeralatan}`,
      locationName: getLoc(d.arsipDokumenId),
      extraInfo: `${d.kapasitasKva} kVA · ${d.lokasiInstalasi}`,
    });
  });

  // 8. Sertifikat Uji Timbangan
  (state.docsTimbangan || []).forEach((d) => {
    items.push({
      id: `tmb-${d.id}`,
      noArsip: d.noArsip,
      category: 'Uji Timbangan',
      primaryTitle: `${d.namaAlatUkur} (${d.jenisTimbangan})`,
      subTitle: `Surat: ${d.nomorSuratPengujian} · ${d.merekPabrikBuatan}`,
      locationName: getLoc(d.arsipDokumenId),
      extraInfo: `Maks: ${d.kapasitasMaksimumKg} kg · ${d.pemilikPemakai}`,
    });
  });

  return items;
}

export const ArchiveLabelModal: React.FC<ArchiveLabelModalProps> = ({
  isOpen,
  onClose,
  state,
  onNotify,
}) => {
  if (!isOpen) return null;

  const allLabels = useMemo(() => extractAllDocumentLabels(state), [state]);

  // Filters & Layout Settings
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [density, setDensity] = useState<'max' | 'standard'>('max');
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [secondLineOption, setSecondLineOption] = useState<SecondLineOption>('kategori_keterangan');
  const [alignment, setAlignment] = useState<LabelAlignment>('center');
  const [fontScale, setFontScale] = useState<'large' | 'extra-large' | 'standard'>('extra-large');
  const [viewTab, setViewTab] = useState<'preview' | 'checklist'>('preview');
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Selected item IDs (default to all)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(allLabels.map((item) => item.id));
  });

  const [activeSheetPage, setActiveSheetPage] = useState<number>(0);

  // Filtered labels based on search & category
  const filteredLabels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allLabels.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (selectedLocation !== 'ALL' && item.locationName !== selectedLocation) return false;
      if (!q) return true;
      return (
        item.noArsip.toLowerCase().includes(q) ||
        item.primaryTitle.toLowerCase().includes(q) ||
        item.subTitle.toLowerCase().includes(q) ||
        item.locationName.toLowerCase().includes(q) ||
        (item.extraInfo && item.extraInfo.toLowerCase().includes(q))
      );
    });
  }, [allLabels, selectedCategory, selectedLocation, searchQuery]);

  // Final items selected for print
  const labelsToPrint = useMemo(() => {
    return filteredLabels.filter((item) => selectedIds.has(item.id));
  }, [filteredLabels, selectedIds]);

  // Labels per sheet calculation (2 columns x rows)
  const rowsPerSheet = useMemo(() => {
    if (paperSize === 'F4') return 10;
    if (density === 'max' && paperSize === 'A4') return 9;
    return 8;
  }, [paperSize, density]);

  const labelsPerSheet = rowsPerSheet * 2;
  const totalSheets = Math.max(1, Math.ceil(labelsToPrint.length / labelsPerSheet));

  // Current sheet page slice
  const currentPageLabels = useMemo(() => {
    const start = activeSheetPage * labelsPerSheet;
    return labelsToPrint.slice(start, start + labelsPerSheet);
  }, [labelsToPrint, activeSheetPage, labelsPerSheet]);

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredLabels.map((i) => i.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Main Print Action: Automatically downloads vector PDF AND invokes browser print
  const handlePrintNow = () => {
    let items = labelsToPrint;
    if (items.length === 0) {
      items = filteredLabels;
      setSelectedIds(new Set(filteredLabels.map((i) => i.id)));
    }

    if (items.length === 0) {
      onNotify('Tidak ada dokumen yang dipilih untuk dicetak.');
      return;
    }

    const config: LabelExportConfig = {
      paperSize,
      density,
      showCutGuides,
      secondLineOption,
      alignment,
      fontScale,
    };

    // 1. Immediately generate & download PDF (100% reliable in any browser/iframe)
    exportLabelsToPDF(items, config);

    // 2. Also try window.print() (works when opened directly in a new window/tab)
    try {
      window.focus();
      window.print();
    } catch {
      // Ignored if browser blocks dialog inside iframe
    }

    const successMsg = `File PDF Label (${items.length} label, 3x8 cm) telah berhasil diunduh ke folder unduhan browser Anda. Siap dicetak langsung ke printer!`;
    setDownloadSuccessMessage(successMsg);
    onNotify(successMsg);
  };

  // Pure PDF export
  const handleExportPDF = () => {
    const items = labelsToPrint.length > 0 ? labelsToPrint : filteredLabels;
    if (items.length === 0) {
      onNotify('Silakan pilih minimal 1 dokumen untuk dicetak labelnya.');
      return;
    }

    const config: LabelExportConfig = {
      paperSize,
      density,
      showCutGuides,
      secondLineOption,
      alignment,
      fontScale,
    };

    exportLabelsToPDF(items, config);
    const msg = `Berhasil mengunduh PDF untuk ${items.length} label ukuran 3x8 cm (${totalSheets} lembar ${paperSize}).`;
    setDownloadSuccessMessage(msg);
    onNotify(msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-xs">
      <div className="flex h-[95vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-700 p-2.5 text-white shadow-xs">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">
                  Cetak Label Arsip Dokumen (3 x 8 cm)
                </h1>
                <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-800">
                  No Arsip &amp; Baris 2
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Format ringkas: Cukup No Arsip (font besar &amp; tebal) dan baris 2 keterangan di bawahnya (font lebih besar &amp; bersambung jika panjang), tanpa nama perusahaan &amp; tanpa barcode.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
            title="Tutup Studio Cetak Label"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Banner if user clicked Print */}
        {downloadSuccessMessage && (
          <div className="shrink-0 flex items-center justify-between bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{downloadSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setDownloadSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold ml-4 cursor-pointer"
            >
              ✕ Tutup
            </button>
          </div>
        )}

        {/* Filter & Options Toolbar */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Kategori & Lokasi */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-600">Kategori:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setActiveSheetPage(0);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-blue-600"
                >
                  <option value="ALL">Semua Kategori ({allLabels.length})</option>
                  <option value="E-SPPT">E-SPPT ({state.docsESPPT.length})</option>
                  <option value="Bukti Bayar PBB">Bukti Bayar PBB ({state.docsENOP.length})</option>
                  <option value="E-IMB">E-IMB ({state.docsIMB.length})</option>
                  <option value="E-Sertifikat Tanah">E-Sertifikat Tanah ({state.docsTanah.length})</option>
                  <option value="Sertifikat Merk">Sertifikat Merk ({state.docsMerk.length})</option>
                  <option value="Sertifikat K3">Sertifikat K3 ({state.docsK3.length})</option>
                  <option value="Sertifikat Laik Operasi">Sertifikat Laik Operasi ({state.docsSLO?.length || 0})</option>
                  <option value="Uji Timbangan">Uji Timbangan ({state.docsTimbangan?.length || 0})</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-600">Lokasi Arsip:</span>
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setActiveSheetPage(0);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-blue-600"
                >
                  <option value="ALL">Semua Lokasi Fisik</option>
                  {state.masterLocations.map((loc) => (
                    <option key={loc.id} value={loc.namaLokasi}>
                      {loc.namaLokasi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Search */}
              <div className="relative w-48 sm:w-56">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveSheetPage(0);
                  }}
                  placeholder="Cari No Arsip, NOP..."
                  className="w-full rounded-lg border border-slate-300 py-1 pr-2.5 pl-8 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Layout & Font Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Paper Size */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-600">Kertas:</span>
                <select
                  value={paperSize}
                  onChange={(e) => {
                    setPaperSize(e.target.value as PaperSize);
                    setActiveSheetPage(0);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:border-blue-600"
                >
                  <option value="A4">A4 (210×297 mm)</option>
                  <option value="F4">F4 / Folio (215×330 mm)</option>
                  <option value="Letter">Letter (216×279 mm)</option>
                </select>
              </div>

              {/* Density on A4 */}
              {paperSize === 'A4' && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-600">Kepadatan:</span>
                  <select
                    value={density}
                    onChange={(e) => {
                      setDensity(e.target.value as any);
                      setActiveSheetPage(0);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="max">Maksimal (18 Label / A4)</option>
                    <option value="standard">Standar (16 Label / A4)</option>
                  </select>
                </div>
              )}

              {/* Ukuran Font No Arsip */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-600">Font No Arsip:</span>
                <select
                  value={fontScale}
                  onChange={(e) => setFontScale(e.target.value as any)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800"
                >
                  <option value="extra-large">Sangat Besar (18pt)</option>
                  <option value="large">Besar (16pt)</option>
                  <option value="standard">Standar (14pt)</option>
                </select>
              </div>

              {/* Posisi Teks (Center vs Left) */}
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setAlignment('center')}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    alignment === 'center'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Posisi Rata Tengah"
                >
                  <AlignCenter className="h-3.5 w-3.5" />
                  <span>Tengah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('left')}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    alignment === 'left'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Posisi Rata Kiri"
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                  <span>Kiri</span>
                </button>
              </div>

              {/* Toggle Garis Potong */}
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCutGuides}
                  onChange={(e) => setShowCutGuides(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <Scissors className="h-3.5 w-3.5 text-slate-500" />
                <span>Garis Potong</span>
              </label>
            </div>
          </div>

          {/* Baris 2 Content Selector */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-700">Konten Baris 2 (di bawah No Arsip):</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'kategori_keterangan', label: 'Kategori & Keterangan (NOP/Judul & WP)' },
                { id: 'kategori_lokasi', label: 'Kategori & Lokasi Arsip' },
                { id: 'keterangan_saja', label: 'Keterangan Saja' },
                { id: 'lokasi_saja', label: 'Lokasi Arsip Saja' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSecondLineOption(opt.id as SecondLineOption)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                    secondLineOption === opt.id
                      ? 'bg-blue-100 font-semibold text-blue-800 border border-blue-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Switcher Bar & Page Navigation */}
        <div className="shrink-0 flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-100/70 px-6 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-white p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewTab('preview')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  viewTab === 'preview'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Pratinjau Lembar ({paperSize})
              </button>
              <button
                type="button"
                onClick={() => setViewTab('checklist')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  viewTab === 'checklist'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Pilih Dokumen ({labelsToPrint.length}/{filteredLabels.length})
              </button>
            </div>

            <span className="text-xs text-slate-500">
              {labelsToPrint.length} label dipilih (
              <strong className="text-slate-900">{totalSheets} Lembar</strong> {paperSize})
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {viewTab === 'preview' && totalSheets > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activeSheetPage === 0}
                  onClick={() => setActiveSheetPage((p) => Math.max(0, p - 1))}
                  className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  title="Lembar Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-medium text-slate-700">
                  Lembar {activeSheetPage + 1} dari {totalSheets}
                </span>
                <button
                  type="button"
                  disabled={activeSheetPage >= totalSheets - 1}
                  onClick={() => setActiveSheetPage((p) => Math.min(totalSheets - 1, p + 1))}
                  className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  title="Lembar Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleSelectAll}
              className="font-medium text-blue-700 hover:underline cursor-pointer"
            >
              Pilih Semua ({filteredLabels.length})
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="font-medium text-rose-600 hover:underline cursor-pointer"
            >
              Batal Semua
            </button>
          </div>
        </div>

        {/* Modal Main Content Area (min-h-0 prevents flex children from pushing footer off-screen) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {viewTab === 'preview' ? (
            /* TAB 1: VISUAL SHEET PREVIEW */
            <div className="flex flex-col items-center">
              {labelsToPrint.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center max-w-md my-8">
                  <Printer className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-3 text-sm font-bold text-slate-800">
                    Tidak ada label yang dipilih
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Silakan centang dokumen yang ingin dicetak labelnya melalui filter atau tombol &quot;Pilih Semua&quot;.
                  </p>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
                  >
                    Pilih Semua Dokumen
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-[840px] space-y-3">
                  {/* Quick Action Bar Right Above the Sheet */}
                  <div className="flex flex-wrap items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 gap-2">
                    <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
                      <Sparkles className="h-4 w-4 text-blue-700 shrink-0" />
                      <span>
                        Pratinjau Lembar {activeSheetPage + 1} dari {totalSheets} (Ukuran 3 x 8 cm)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrintNow}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 shadow-2xs cursor-pointer transition-colors"
                        title="Klik untuk langsung mengunduh file cetak PDF dan membuka proses cetak"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Cetak Sekarang (Print)
                      </button>
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50 shadow-2xs cursor-pointer transition-colors"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Unduh PDF
                      </button>
                    </div>
                  </div>

                  {/* Paper Sheet Simulator */}
                  <div
                    className="mx-auto rounded-xl border border-slate-300 bg-white p-5 sm:p-7 shadow-xl"
                    style={{
                      aspectRatio:
                        paperSize === 'F4' ? '215 / 330' : paperSize === 'Letter' ? '216 / 279' : '210 / 297',
                      maxWidth: '800px',
                    }}
                  >
                    {/* Header Sheet Info */}
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2 text-[11px] text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-slate-600">
                        Lembar Label Arsip (3 × 8 cm)
                      </span>
                      <span>
                        Kertas: {paperSize} · {density === 'max' ? 'Maksimal (18/A4)' : 'Standar'} · Lembar {activeSheetPage + 1}/{totalSheets}
                      </span>
                    </div>

                    {/* 2-Column Grid matching 80mm x 30mm proportions */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {currentPageLabels.map((item) => {
                        const line2Text = getSecondLineText(item, secondLineOption);
                        return (
                          <div
                            key={item.id}
                            className={`relative flex flex-col justify-center overflow-hidden rounded-md bg-white px-3 sm:px-4 py-2.5 sm:py-3 transition-all ${
                              showCutGuides
                                ? 'border border-dashed border-slate-300 shadow-2xs hover:border-blue-400'
                                : 'border border-slate-200'
                            } ${alignment === 'center' ? 'items-center text-center' : 'items-start text-left'}`}
                            style={{
                              aspectRatio: '80 / 30', // Exact 8cm x 3cm ratio!
                            }}
                          >
                            {/* Baris 1: No Arsip Saja (Font Disesuaikan, Tebal & Jelas) */}
                            <div
                              className={`font-mono font-bold tracking-tight text-slate-900 w-full leading-tight ${
                                fontScale === 'extra-large'
                                  ? 'text-base sm:text-lg lg:text-xl'
                                  : fontScale === 'large'
                                  ? 'text-sm sm:text-base'
                                  : 'text-xs sm:text-sm'
                              }`}
                            >
                              {item.noArsip}
                            </div>

                            {/* Baris 2 & berikutnya: Font agak besar dan jika panjang dilanjutkan ke baris berikutnya */}
                            <div className="mt-1 text-xs sm:text-[13px] text-slate-700 w-full font-medium leading-snug whitespace-normal break-words line-clamp-3">
                              {line2Text}
                            </div>

                            {/* Subtle Cut Notch in Corner */}
                            {showCutGuides && (
                              <div className="pointer-events-none absolute bottom-1 right-1.5 text-[8px] text-slate-300 font-mono">
                                3×8cm
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: DETAILED CHECKLIST TABLE */
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredLabels.length > 0 &&
                            filteredLabels.every((i) => selectedIds.has(i.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) handleSelectAll();
                            else handleDeselectAll();
                          }}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3">No Arsip (Baris 1)</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Keterangan Dokumen (Baris 2 &amp; Bersambung)</th>
                      <th className="py-2.5 px-3">Lokasi Arsip Fisik</th>
                      <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLabels.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Tidak ditemukan dokumen sesuai filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredLabels.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        const line2Preview = getSecondLineText(item, secondLineOption);
                        return (
                          <tr
                            key={item.id}
                            onClick={() => toggleSelectId(item.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectId(item.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded text-blue-600 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {item.noArsip}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <span className="font-medium text-slate-900">{line2Preview}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{item.locationName}</td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectId(item.id);
                                }}
                                className={`rounded px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-700 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {isSelected ? 'Dipilih' : 'Pilih'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions - Always Sticky, High Z-Index, Guaranteed Clickable & Working */}
        <div className="shrink-0 z-30 sticky bottom-0 flex flex-wrap items-center justify-between border-t border-slate-200 bg-white px-6 py-4 gap-3 shadow-md">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{labelsToPrint.length}</span> label terpilih dari total{' '}
            <span className="font-semibold text-slate-900">{allLabels.length}</span> dokumen.
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="hidden sm:inline">
              Ukuran fisik stiker: <strong>3 x 8 cm</strong> (80 × 30 mm)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-2xs cursor-pointer transition-colors"
              title="Unduh file PDF beresolusi tinggi ukuran 3x8 cm"
            >
              <FileDown className="h-4 w-4 text-blue-700" />
              Unduh PDF Saja
            </button>
            <button
              type="button"
              onClick={handlePrintNow}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-800 active:bg-blue-900 shadow-sm cursor-pointer transition-all"
              title="Cetak langsung: mengunduh file cetak PDF berpresisi tinggi dan memanggil dialog cetak"
            >
              <Printer className="h-4 w-4" />
              Cetak Sekarang (Print)
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Printable Container optimized exclusively for Browser window.print() */}
      <div id="printable-label-sheets" className="hidden print:block">
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-label-sheets, #printable-label-sheets * {
                visibility: visible !important;
              }
              #printable-label-sheets {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
              }
              @page {
                size: ${
                  paperSize === 'F4'
                    ? '215mm 330mm'
                    : paperSize === 'Letter'
                    ? 'letter portrait'
                    : 'A4 portrait'
                };
                margin: 0;
              }
              .print-sheet-page {
                page-break-after: always;
                box-sizing: border-box;
                width: ${paperSize === 'F4' ? '215mm' : paperSize === 'Letter' ? '216mm' : '210mm'};
                height: ${paperSize === 'F4' ? '330mm' : paperSize === 'Letter' ? '279mm' : '297mm'};
                padding: 10mm 15mm;
                display: grid;
                grid-template-columns: 80mm 80mm;
                grid-gap: 2mm 10mm;
                justify-content: center;
                align-content: center;
              }
              .print-label-item {
                width: 80mm;
                height: 30mm;
                box-sizing: border-box;
                border: 0.5pt ${showCutGuides ? 'dashed #94a3b8' : 'solid #cbd5e1'};
                border-radius: 2mm;
                padding: 2.5mm 3.5mm;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: ${alignment === 'center' ? 'center' : 'flex-start'};
                text-align: ${alignment === 'center' ? 'center' : 'left'};
              }
            }
          `,
          }}
        />

        {Array.from({ length: totalSheets }).map((_, sheetIdx) => {
          const sheetItems = (labelsToPrint.length > 0 ? labelsToPrint : filteredLabels).slice(
            sheetIdx * labelsPerSheet,
            (sheetIdx + 1) * labelsPerSheet
          );
          return (
            <div key={sheetIdx} className="print-sheet-page">
              {sheetItems.map((item) => {
                const line2 = getSecondLineText(item, secondLineOption);
                const printFontSize =
                  fontScale === 'extra-large' ? '18pt' : fontScale === 'large' ? '16pt' : '14pt';
                return (
                  <div key={item.id} className="print-label-item">
                    {/* Baris 1: No Arsip Saja */}
                    <div
                      style={{
                        fontFamily: 'monospace, "Courier New", Courier',
                        fontSize: printFontSize,
                        fontWeight: 'bold',
                        color: '#0f172a',
                        lineHeight: 1.15,
                        width: '100%',
                      }}
                    >
                      {item.noArsip}
                    </div>

                    {/* Baris 2: Keterangan di bawahnya (Font agak besar, wrap jika panjang) */}
                    <div
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '10.5pt',
                        fontWeight: '500',
                        color: '#334155',
                        marginTop: '1.5mm',
                        lineHeight: 1.25,
                        width: '100%',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                      }}
                    >
                      {line2}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
