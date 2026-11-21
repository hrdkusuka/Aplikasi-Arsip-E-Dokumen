import React, { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Search,
  Building2,
  CreditCard,
  Check,
  X,
} from 'lucide-react';
import {
  AppState,
  MasterArchiveLocation,
  MasterPaymentStatus,
  MasterProvince,
  PaymentCategory,
} from '../types';

interface MasterDataViewProps {
  activeSubTab: 'master-arsip' | 'master-provinsi' | 'master-status';
  onSwitchSubTab: (tab: 'master-arsip' | 'master-provinsi' | 'master-status') => void;
  state: AppState;
  canManageMaster: boolean;
  onSaveLocation: (loc: MasterArchiveLocation, isEdit: boolean) => void;
  onDeleteLocation: (id: string) => void;
  onSaveProvince: (prov: MasterProvince, isEdit: boolean) => void;
  onDeleteProvince: (id: string) => void;
  onSaveStatus: (st: MasterPaymentStatus, isEdit: boolean) => void;
  onDeleteStatus: (id: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  activeSubTab,
  onSwitchSubTab,
  state,
  canManageMaster,
  onSaveLocation,
  onDeleteLocation,
  onSaveProvince,
  onDeleteProvince,
  onSaveStatus,
  onDeleteStatus,
}) => {
  // --- 1. State for Arsip Dokumen (Lokasi Penyimpanan) ---
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [namaLokasi, setNamaLokasi] = useState('');
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [lokasiFisik, setLokasiFisik] = useState('');
  const [locSearch, setLocSearch] = useState('');

  const handleEditLocation = (loc: MasterArchiveLocation) => {
    setEditingLocId(loc.id);
    setNamaLokasi(loc.namaLokasi);
    setPenanggungJawab(loc.penanggungJawab);
    setLokasiFisik(loc.lokasi);
  };

  const resetLocationForm = () => {
    setEditingLocId(null);
    setNamaLokasi('');
    setPenanggungJawab('');
    setLokasiFisik('');
  };

  const handleSubmitLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLokasi.trim() || !penanggungJawab.trim() || !lokasiFisik.trim()) return;
    onSaveLocation(
      {
        id: editingLocId || `loc-${Date.now()}`,
        namaLokasi: namaLokasi.trim(),
        penanggungJawab: penanggungJawab.trim(),
        lokasi: lokasiFisik.trim(),
      },
      Boolean(editingLocId)
    );
    resetLocationForm();
  };

  // --- 2. State for Provinsi & Kota/Kabupaten ---
  const [selectedProvId, setSelectedProvId] = useState<string>(
    state.masterProvinces[0]?.id || ''
  );
  const [provSearch, setProvSearch] = useState('');
  const [newProvName, setNewProvName] = useState('');
  const [newKotaName, setNewKotaName] = useState('');

  const filteredProvinces = useMemo(() => {
    const q = provSearch.trim().toLowerCase();
    if (!q) return state.masterProvinces;
    return state.masterProvinces.filter(
      (p) =>
        p.namaProvinsi.toLowerCase().includes(q) ||
        p.kotaKabupaten.some((k) => k.toLowerCase().includes(q))
    );
  }, [state.masterProvinces, provSearch]);

  const activeProvince = useMemo(() => {
    return (
      state.masterProvinces.find((p) => p.id === selectedProvId) ||
      filteredProvinces[0] ||
      null
    );
  }, [state.masterProvinces, selectedProvId, filteredProvinces]);

  const handleAddProvince = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName.trim()) return;
    const newId = `prov-${Date.now()}`;
    onSaveProvince(
      {
        id: newId,
        namaProvinsi: newProvName.trim(),
        kotaKabupaten: [],
      },
      false
    );
    setNewProvName('');
    setSelectedProvId(newId);
  };

  const handleAddKotaToProvince = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProvince || !newKotaName.trim()) return;
    const trimmed = newKotaName.trim();
    if (activeProvince.kotaKabupaten.includes(trimmed)) return;
    onSaveProvince(
      {
        ...activeProvince,
        kotaKabupaten: [...activeProvince.kotaKabupaten, trimmed],
      },
      true
    );
    setNewKotaName('');
  };

  const handleRemoveKotaFromProvince = (kotaName: string) => {
    if (!activeProvince) return;
    onSaveProvince(
      {
        ...activeProvince,
        kotaKabupaten: activeProvince.kotaKabupaten.filter((k) => k !== kotaName),
      },
      true
    );
  };

  // --- 3. State for Status Bayar ---
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [namaStatus, setNamaStatus] = useState('');
  const [kategoriStatus, setKategoriStatus] = useState<PaymentCategory>('lunas');
  const [keteranganStatus, setKeteranganStatus] = useState('');

  const handleEditStatus = (st: MasterPaymentStatus) => {
    setEditingStatusId(st.id);
    setNamaStatus(st.namaStatus);
    setKategoriStatus(st.kategori);
    setKeteranganStatus(st.keterangan);
  };

  const resetStatusForm = () => {
    setEditingStatusId(null);
    setNamaStatus('');
    setKategoriStatus('lunas');
    setKeteranganStatus('');
  };

  const handleSubmitStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaStatus.trim()) return;
    onSaveStatus(
      {
        id: editingStatusId || `stat-${Date.now()}`,
        namaStatus: namaStatus.trim(),
        kategori: kategoriStatus,
        keterangan:
          keteranganStatus.trim() ||
          `Status pembayaran kategori ${namaStatus.trim()}`,
      },
      Boolean(editingStatusId)
    );
    resetStatusForm();
  };

  const countDocsByLocation = (locId: string) => {
    return (
      state.docsENOP.filter((d) => d.arsipDokumenId === locId).length +
      state.docsESPPT.filter((d) => d.arsipDokumenId === locId).length +
      state.docsMerk.filter((d) => d.arsipDokumenId === locId).length +
      state.docsK3.filter((d) => d.arsipDokumenId === locId).length +
      state.docsTanah.filter((d) => d.arsipDokumenId === locId).length +
      state.docsIMB.filter((d) => d.arsipDokumenId === locId).length
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Data Master Referensi Arsip
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola tempat penyimpanan dokumen asli, wilayah Provinsi & Kota/Kabupaten Indonesia, serta referensi Status Bayar.
          </p>
        </div>

        {/* Interactive Tab Selector */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-200/80 p-1">
          <button
            type="button"
            onClick={() => onSwitchSubTab('master-arsip')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'master-arsip'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            Arsip Dokumen (Lokasi)
          </button>
          <button
            type="button"
            onClick={() => onSwitchSubTab('master-provinsi')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'master-provinsi'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-emerald-600" />
            Provinsi & Kota/Kabupaten
          </button>
          <button
            type="button"
            onClick={() => onSwitchSubTab('master-status')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'master-status'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5 text-amber-600" />
            Status Bayar
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER ARSIP DOKUMEN (TEMPAT MENYIMPAN DOKUMEN ASLI) */}
      {activeSubTab === 'master-arsip' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Form Input */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/35 p-6 lg:col-span-4">
            <h2 className="text-base font-bold text-slate-900">
              {editingLocId
                ? 'Ubah Lokasi Arsip Dokumen'
                : 'Tambah Lokasi Arsip Dokumen'}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Input tempat menyimpan dokumen fisik asli beserta penanggungjawab.
            </p>

            <form onSubmit={handleSubmitLocation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-blue-950">
                  Nama Lokasi <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManageMaster}
                  value={namaLokasi}
                  onChange={(e) => setNamaLokasi(e.target.value)}
                  placeholder="Contoh: Lemari Besi A-01 (Pajak & Aset)"
                  className="mt-1 w-full rounded-lg border border-blue-300 bg-[#F0F7FF] px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-950">
                  Penanggungjawab <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManageMaster}
                  value={penanggungJawab}
                  onChange={(e) => setPenanggungJawab(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.E."
                  className="mt-1 w-full rounded-lg border border-blue-300 bg-[#F0F7FF] px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-950">
                  Lokasi (Gedung / Ruangan / Alamat) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  disabled={!canManageMaster}
                  value={lokasiFisik}
                  onChange={(e) => setLokasiFisik(e.target.value)}
                  placeholder="Contoh: Gedung Kantor Pusat Lt. 2 - Ruang Arsip Legal, Jakarta Selatan"
                  className="mt-1 w-full rounded-lg border border-blue-300 bg-[#F0F7FF] px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!canManageMaster}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {editingLocId ? 'Simpan Perubahan' : 'Simpan Lokasi Arsip'}
                </button>
                {editingLocId && (
                  <button
                    type="button"
                    onClick={resetLocationForm}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table List */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Daftar Tempat Penyimpanan Dokumen Asli ({state.masterLocations.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Digunakan sebagai referensi pada E-NOP, E-SPPT, Sertifikat Merk, dan Sertifikat K3
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={locSearch}
                    onChange={(e) => setLocSearch(e.target.value)}
                    placeholder="Cari nama lokasi atau PIC..."
                    className="w-full rounded-lg border border-slate-300 py-1.5 pr-3 pl-8 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">Nama Lokasi</th>
                    <th className="px-4 py-2.5 font-semibold">Penanggungjawab</th>
                    <th className="px-4 py-2.5 font-semibold">Lokasi</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Dokumen Tersimpan</th>
                    <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.masterLocations
                    .filter(
                      (l) =>
                        !locSearch.trim() ||
                        l.namaLokasi.toLowerCase().includes(locSearch.toLowerCase()) ||
                        l.penanggungJawab.toLowerCase().includes(locSearch.toLowerCase()) ||
                        l.lokasi.toLowerCase().includes(locSearch.toLowerCase())
                    )
                    .map((loc) => {
                      const docCount = countDocsByLocation(loc.id);
                      return (
                        <tr key={loc.id} className="hover:bg-slate-50">
                          <td className="py-3 pr-4 font-semibold text-slate-900">
                            {loc.namaLokasi}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {loc.penanggungJawab}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{loc.lokasi}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            {docCount} berkas
                          </td>
                          <td className="py-3 pl-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={!canManageMaster}
                                onClick={() => handleEditLocation(loc)}
                                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700 disabled:opacity-40"
                                title="Edit Lokasi"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={!canManageMaster || docCount > 0}
                                onClick={() => onDeleteLocation(loc.id)}
                                className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30"
                                title={
                                  docCount > 0
                                    ? 'Lokasi sedang digunakan oleh dokumen aktif'
                                    : 'Hapus Lokasi'
                                }
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
      )}

      {/* TAB 2: MASTER PROVINSI & KOTA/KABUPATEN INDONESIA */}
      {activeSubTab === 'master-provinsi' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Provinces List */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Daftar Provinsi Indonesia ({state.masterProvinces.length})
              </h2>
              <p className="text-xs text-slate-500">
                Pilih provinsi untuk melihat atau menambah daftar Kota/Kabupaten
              </p>
            </div>

            <div className="mt-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={provSearch}
                  onChange={(e) => setProvSearch(e.target.value)}
                  placeholder="Cari Provinsi atau Kota/Kabupaten..."
                  className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-8 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3 max-h-[380px] flex-1 space-y-1 overflow-y-auto pr-1">
              {filteredProvinces.map((prov) => {
                const isSelected = activeProvince?.id === prov.id;
                return (
                  <div
                    key={prov.id}
                    onClick={() => setSelectedProvId(prov.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-700 font-semibold text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{prov.namaProvinsi}</span>
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        isSelected ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {prov.kotaKabupaten.length} Kota/Kab
                    </span>
                  </div>
                );
              })}
            </div>

            {canManageMaster && (
              <form
                onSubmit={handleAddProvince}
                className="mt-4 flex gap-2 border-t border-slate-200 pt-4"
              >
                <input
                  type="text"
                  value={newProvName}
                  onChange={(e) => setNewProvName(e.target.value)}
                  placeholder="Tambah nama Provinsi baru..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Provinsi
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Kota/Kabupaten inside Selected Province */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
            {activeProvince ? (
              <>
                <div className="flex flex-col justify-between gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-xs text-slate-500">
                      Wilayah Administratif Provinsi
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {activeProvince.namaProvinsi}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                      Total: {activeProvince.kotaKabupaten.length} Kota/Kabupaten
                    </span>
                    {canManageMaster && state.masterProvinces.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteProvince(activeProvince.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus Provinsi
                      </button>
                    )}
                  </div>
                </div>

                {canManageMaster && (
                  <form
                    onSubmit={handleAddKotaToProvince}
                    className="mt-4 flex gap-2"
                  >
                    <input
                      type="text"
                      value={newKotaName}
                      onChange={(e) => setNewKotaName(e.target.value)}
                      placeholder={`Tambah Kota / Kabupaten di ${activeProvince.namaProvinsi} (mis. Kabupaten/Kota ...)`}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Kota/Kabupaten
                    </button>
                  </form>
                )}

                <div className="mt-4 grid max-h-[380px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {activeProvince.kotaKabupaten.map((kota) => (
                    <div
                      key={kota}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                    >
                      <span className="font-medium">{kota}</span>
                      {canManageMaster && (
                        <button
                          type="button"
                          onClick={() => handleRemoveKotaFromProvince(kota)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-700"
                          title="Hapus Kota/Kabupaten"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Pilih salah satu Provinsi di sebelah kiri untuk menampilkan daftar Kota/Kabupaten.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MASTER STATUS BAYAR */}
      {activeSubTab === 'master-status' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Form Status Bayar */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6 lg:col-span-4">
            <h2 className="text-base font-bold text-slate-900">
              {editingStatusId ? 'Ubah Status Bayar' : 'Tambah Status Bayar'}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Standar status pembayaran pajak/dokumen: Lunas, Cicilan, atau Belum Bayar.
            </p>

            <form onSubmit={handleSubmitStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-amber-950">
                  Nama Status Bayar <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManageMaster}
                  value={namaStatus}
                  onChange={(e) => setNamaStatus(e.target.value)}
                  placeholder="Contoh: Lunas / Cicilan / Belum Bayar"
                  className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-950">
                  Kategori Status Semantik
                </label>
                <select
                  disabled={!canManageMaster}
                  value={kategoriStatus}
                  onChange={(e) => setKategoriStatus(e.target.value as PaymentCategory)}
                  className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none disabled:bg-slate-100"
                >
                  <option value="lunas">Lunas (Hijau - Selesai)</option>
                  <option value="cicilan">Cicilan (Amber - Bertahap)</option>
                  <option value="belum_bayar">Belum Bayar (Merah - Tertunda)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-950">
                  Keterangan
                </label>
                <textarea
                  rows={3}
                  disabled={!canManageMaster}
                  value={keteranganStatus}
                  onChange={(e) => setKeteranganStatus(e.target.value)}
                  placeholder="Deskripsi penggunaan status pembayaran..."
                  className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!canManageMaster}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {editingStatusId ? 'Simpan Perubahan' : 'Tambah Status'}
                </button>
                {editingStatusId && (
                  <button
                    type="button"
                    onClick={resetStatusForm}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Status Bayar */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8">
            <h2 className="text-base font-bold text-slate-900">
              Daftar Master Status Bayar ({state.masterStatuses.length})
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Digunakan untuk memilih status pembayaran pada pencatatan dokumen E-NOP.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">Status Bayar</th>
                    <th className="px-4 py-2.5 font-semibold">Kategori</th>
                    <th className="px-4 py-2.5 font-semibold">Keterangan</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Jumlah E-NOP</th>
                    <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.masterStatuses.map((st) => {
                    const usedCount = state.docsENOP.filter(
                      (d) => d.statusBayarId === st.id
                    ).length;
                    const colorText =
                      st.kategori === 'lunas'
                        ? 'text-emerald-700 font-semibold'
                        : st.kategori === 'cicilan'
                        ? 'text-amber-700 font-semibold'
                        : 'text-rose-700 font-semibold';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className={`py-3 pr-4 ${colorText}`}>{st.namaStatus}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {st.kategori === 'lunas'
                            ? 'Lunas'
                            : st.kategori === 'cicilan'
                            ? 'Cicilan'
                            : 'Belum Bayar'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{st.keterangan}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {usedCount} Dokumen
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={!canManageMaster}
                              onClick={() => handleEditStatus(st)}
                              className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700 disabled:opacity-40"
                              title="Edit Status"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={!canManageMaster || usedCount > 0}
                              onClick={() => onDeleteStatus(st.id)}
                              className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30"
                              title={
                                usedCount > 0
                                  ? 'Status sedang digunakan oleh dokumen E-NOP'
                                  : 'Hapus Status'
                              }
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
      )}
    </div>
  );
};
