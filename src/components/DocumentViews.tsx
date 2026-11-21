import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Upload,
  RefreshCw,
  FileText,
  X,
  Check,
  Filter,
  MapPin,
  Clock,
  Zap,
  Scale,
} from 'lucide-react';
import {
  AppState,
  AsalHakTanah,
  DocENOP,
  DocESPPT,
  DocMerk,
  DocK3,
  DocTanah,
  DocIMB,
  DocSLO,
  DocUjiTimbangan,
  FileAttachment,
  FasaSLO,
  JenisHakTanah,
  JenisInstalasiSLO,
  JenisSLO,
  JenisTimbangan,
  StatusBebanTanah,
  StatusDokumenTanah,
  StatusDokumenTimbangan,
  StatusMasaBerlakuTimbangan,
  StatusSLO,
  SumberEnergiSLO,
} from '../types';
import {
  evaluateDateDeadline,
  formatFileSize,
  formatIndonesianDate,
  generateNextArchiveNumber,
  readFileAsAttachment,
} from '../utils/archiveHelpers';
import {
  getDesaKelurahanListForKecamatan,
  getKecamatanListForKota,
} from '../data/indonesiaRegions';
import { FilePreviewModal } from './FilePreviewModal';

export type DocModuleCategory =
  | 'doc-enop'
  | 'doc-esppt'
  | 'doc-merk'
  | 'doc-k3'
  | 'doc-tanah'
  | 'doc-imb'
  | 'doc-slo'
  | 'doc-timbangan';

interface DocumentViewsProps {
  docCategory: DocModuleCategory;
  onSwitchCategory: (cat: DocModuleCategory) => void;
  state: AppState;
  canWriteDocs: boolean;
  canDeleteDocs: boolean;
  autoOpenForm?: boolean;
  onConsumeAutoOpen?: () => void;
  onSaveENOP: (doc: DocENOP, isEdit: boolean) => void;
  onDeleteENOP: (id: string) => void;
  onSaveESPPT: (doc: DocESPPT, isEdit: boolean) => void;
  onDeleteESPPT: (id: string) => void;
  onSaveMerk: (doc: DocMerk, isEdit: boolean) => void;
  onDeleteMerk: (id: string) => void;
  onSaveK3: (doc: DocK3, isEdit: boolean) => void;
  onDeleteK3: (id: string) => void;
  onSaveTanah: (doc: DocTanah, isEdit: boolean) => void;
  onDeleteTanah: (id: string) => void;
  onSaveIMB: (doc: DocIMB, isEdit: boolean) => void;
  onDeleteIMB: (id: string) => void;
  onSaveSLO: (doc: DocSLO, isEdit: boolean) => void;
  onDeleteSLO: (id: string) => void;
  onSaveTimbangan: (doc: DocUjiTimbangan, isEdit: boolean) => void;
  onDeleteTimbangan: (id: string) => void;
}

const JENIS_HAK_OPTIONS: { value: JenisHakTanah; label: string }[] = [
  { value: 'SHM', label: 'SHM (Sertifikat Hak Milik)' },
  { value: 'HGB', label: 'HGB (Hak Guna Bangunan)' },
  { value: 'Hak Pakai', label: 'Hak Pakai' },
  { value: 'HGU', label: 'HGU (Hak Guna Usaha)' },
  { value: 'Hak Pengelolaan', label: 'Hak Pengelolaan' },
];

const ASAL_HAK_OPTIONS: AsalHakTanah[] = [
  'Konversi',
  'Pemberian Hak',
  'Pemecahan',
  'Penggabungan',
  'Jual Beli',
  'Waris',
];

const STATUS_DOKUMEN_TANAH_OPTIONS: StatusDokumenTanah[] = [
  'Sertifikat Elektronik (Sertifikat-el)',
  'Sertifikat Fisik (Lama)',
];

const STATUS_BEBAN_TANAH_OPTIONS: StatusBebanTanah[] = [
  'Bersih (Clear)',
  'Dijaminkan (Hak Tanggungan)',
  'Sita Jaminan',
  'Sengketa',
];

const JENIS_SLO_OPTIONS: JenisSLO[] = ['GENSET', 'LISTRIK'];
const STATUS_SLO_OPTIONS: StatusSLO[] = ['AKTIF', 'PROSES', 'KADALUARSA', 'DICABUT'];
const SUMBER_ENERGI_SLO_OPTIONS: SumberEnergiSLO[] = ['DIESEL', 'GAS', 'BENSIN', 'PLN', 'LAINNYA'];
const FASA_SLO_OPTIONS: FasaSLO[] = ['1 FASA', '3 FASA'];
const JENIS_INSTALASI_SLO_OPTIONS: JenisInstalasiSLO[] = ['PEMBANGKIT', 'PEMANFAATAN'];

// Uji Timbangan consistency dropdown options
const JENIS_TIMBANGAN_OPTIONS: JenisTimbangan[] = ['ELEKTRONIK', 'JEMBATAN ELEKTRONIK'];
const STATUS_DOKUMEN_TIMBANGAN_OPTIONS: StatusDokumenTimbangan[] = ['LENGKAP', 'BELUM LENGKAP'];
const STATUS_MASA_BERLAKU_TIMBANGAN_OPTIONS: StatusMasaBerlakuTimbangan[] = [
  'AKTIF',
  'SEGERA HABIS',
  'KADALUARSA',
  'PERLU VERIFIKASI',
];

export const DocumentViews: React.FC<DocumentViewsProps> = ({
  docCategory,
  onSwitchCategory,
  state,
  canWriteDocs,
  canDeleteDocs,
  autoOpenForm,
  onConsumeAutoOpen,
  onSaveENOP,
  onDeleteENOP,
  onSaveESPPT,
  onDeleteESPPT,
  onSaveMerk,
  onDeleteMerk,
  onSaveK3,
  onDeleteK3,
  onSaveTanah,
  onDeleteTanah,
  onSaveIMB,
  onDeleteIMB,
  onSaveSLO,
  onDeleteSLO,
  onSaveTimbangan,
  onDeleteTimbangan,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [deadlineFilter, setDeadlineFilter] = useState<'ALL' | 'DUE_30' | 'OVERDUE'>('ALL');

  // Preview Modal State
  const [previewConfig, setPreviewConfig] = useState<{
    isOpen: boolean;
    title: string;
    noArsip: string;
    categoryLabel: string;
    attachment?: FileAttachment;
    arsipDokumenId: string;
    metadataPairs: { label: string; value: string }[];
  } | null>(null);

  // Shared Archive Number & Attachment state for active form
  const [noArsip, setNoArsip] = useState('');
  const [arsipDokumenId, setArsipDokumenId] = useState(
    state.masterLocations[0]?.id || ''
  );
  const [fileAttachment, setFileAttachment] = useState<FileAttachment | undefined>(
    undefined
  );

  // --- 1. E-NOP Form Fields ---
  const [enopTanggalTransaksi, setEnopTanggalTransaksi] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [enopProvinsiId, setEnopProvinsiId] = useState(
    state.masterProvinces[0]?.id || ''
  );
  const [enopKotaKabupaten, setEnopKotaKabupaten] = useState(
    state.masterProvinces[0]?.kotaKabupaten[0] || ''
  );
  const [enopStatusBayarId, setEnopStatusBayarId] = useState(
    state.masterStatuses[0]?.id || ''
  );
  const [enopEspptId, setEnopEspptId] = useState('');
  const [enopNop, setEnopNop] = useState('');
  const [enopNamaWajibPajak, setEnopNamaWajibPajak] = useState('');
  const [enopAlamatWajibPajak, setEnopAlamatWajibPajak] = useState('');
  const [enopNamaNop, setEnopNamaNop] = useState('');
  const [enopTahunPajak, setEnopTahunPajak] = useState(
    new Date().getFullYear().toString()
  );
  const [enopLokasiAlamat, setEnopLokasiAlamat] = useState('');

  // --- 2. E-SPPT Form Fields ---
  const [espptNop, setEspptNop] = useState('');
  const [espptEnopId, setEspptEnopId] = useState('');
  const [espptTahun, setEspptTahun] = useState(
    new Date().getFullYear().toString()
  );
  const [espptLetakObjekPajak, setEspptLetakObjekPajak] = useState('');
  const [espptNamaWajibPajak, setEspptNamaWajibPajak] = useState('');
  const [espptAlamatWajibPajak, setEspptAlamatWajibPajak] = useState('');
  const [espptJatuhTempo, setEspptJatuhTempo] = useState('');

  // --- 3. Sertifikat Merk Form Fields ---
  const [merkNama, setMerkNama] = useState('');
  const [merkAlamat, setMerkAlamat] = useState('');
  const [merkTanggalPenerimaan, setMerkTanggalPenerimaan] = useState('');
  const [merkNoPendaftaran, setMerkNoPendaftaran] = useState('');
  const [merkEtiketMerk, setMerkEtiketMerk] = useState('');
  const [merkEtiketImageUrl, setMerkEtiketImageUrl] = useState<string | undefined>(
    undefined
  );
  const [merkNoPermohonan, setMerkNoPermohonan] = useState('');
  const [merkTanggalPengajuan, setMerkTanggalPengajuan] = useState('');
  const [merkTglJatuhTempo, setMerkTglJatuhTempo] = useState('');
  const [merkKelasBarangJasa, setMerkKelasBarangJasa] = useState('');
  const [merkUraianWarna, setMerkUraianWarna] = useState('');

  // --- 4. Sertifikat K3 Form Fields ---
  const [k3JenisObjek, setK3JenisObjek] = useState('');
  const [k3NamaPerusahaan, setK3NamaPerusahaan] = useState('');
  const [k3NamaPemilik, setK3NamaPemilik] = useState('');
  const [k3Alamat, setK3Alamat] = useState('');
  const [k3LokasiUnit, setK3LokasiUnit] = useState('');
  const [k3Jenis, setK3Jenis] = useState('');
  const [k3Merk, setK3Merk] = useState('');
  const [k3Type, setK3Type] = useState('');
  const [k3PerusahaanPembuat, setK3PerusahaanPembuat] = useState('');
  const [k3TempatPembuatan, setK3TempatPembuatan] = useState('');
  const [k3TahunBuat, setK3TahunBuat] = useState(
    new Date().getFullYear().toString()
  );
  const [k3NoSeri, setK3NoSeri] = useState('');
  const [k3Kapasitas, setK3Kapasitas] = useState('');
  const [k3TanggalPemeriksaan, setK3TanggalPemeriksaan] = useState('');
  const [k3BerlakuSampai, setK3BerlakuSampai] = useState('');

  // --- 5. E-Sertifikat Tanah Form Fields ---
  // 5.1 Data Umum & Jenis Hak
  const [tanahJenisHak, setTanahJenisHak] = useState<JenisHakTanah>('SHM');
  const [tanahNomorSertifikat, setTanahNomorSertifikat] = useState('');
  const [tanahNib, setTanahNib] = useState(''); // 14 digit
  const [tanahAsalHak, setTanahAsalHak] = useState<AsalHakTanah>('Pemberian Hak');
  // 5.2 Data Pemegang Hak (Pemilik)
  const [tanahNamaPemegangHak, setTanahNamaPemegangHak] = useState('');
  const [tanahNikPemilik, setTanahNikPemilik] = useState(''); // 16 digit
  const [tanahTanggalLahirPemilik, setTanahTanggalLahirPemilik] = useState('');
  const [tanahAlamatPemilik, setTanahAlamatPemilik] = useState('');
  // 5.3 Letak & Lokasi Tanah (Cascading Provinsi -> Kota/Kab -> Kecamatan -> Desa/Kelurahan)
  const [tanahProvinsiId, setTanahProvinsiId] = useState(
    state.masterProvinces[0]?.id || ''
  );
  const [tanahKotaKabupaten, setTanahKotaKabupaten] = useState(
    state.masterProvinces[0]?.kotaKabupaten[0] || ''
  );
  const [tanahKecamatan, setTanahKecamatan] = useState('');
  const [tanahDesaKelurahan, setTanahDesaKelurahan] = useState('');
  const [tanahAlamatDetail, setTanahAlamatDetail] = useState('');
  // 5.4 Data Fisik & Geografis (Surat Ukur)
  const [tanahNomorSuratUkur, setTanahNomorSuratUkur] = useState('');
  const [tanahLuasTanah, setTanahLuasTanah] = useState<string>('');
  const [tanahTitikKoordinat, setTanahTitikKoordinat] = useState('');
  const [tanahBatasUtara, setTanahBatasUtara] = useState('');
  const [tanahBatasTimur, setTanahBatasTimur] = useState('');
  const [tanahBatasSelatan, setTanahBatasSelatan] = useState('');
  const [tanahBatasBarat, setTanahBatasBarat] = useState('');
  // 5.5 Legalitas & Catatan Hukum
  const [tanahKantorPertanahan, setTanahKantorPertanahan] = useState('');
  const [tanahTanggalPenerbitan, setTanahTanggalPenerbitan] = useState('');
  const [tanahStatusDokumen, setTanahStatusDokumen] = useState<StatusDokumenTanah>(
    'Sertifikat Elektronik (Sertifikat-el)'
  );
  const [tanahStatusBeban, setTanahStatusBeban] = useState<StatusBebanTanah>(
    'Bersih (Clear)'
  );

  // --- 6. E-IMB Form State ---
  const [imbNoKeputusan, setImbNoKeputusan] = useState('');
  const [imbTahun, setImbTahun] = useState(new Date().getFullYear().toString());
  const [imbAtasNama, setImbAtasNama] = useState('');
  const [imbLokasiBangunan, setImbLokasiBangunan] = useState('');
  const [imbTglPermohonan, setImbTglPermohonan] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [imbNama, setImbNama] = useState('');
  const [imbBeralamat, setImbBeralamat] = useState('');
  const [imbProvinsiId, setImbProvinsiId] = useState(
    state.masterProvinces[0]?.id || ''
  );
  const [imbKota, setImbKota] = useState(
    state.masterProvinces[0]?.kotaKabupaten[0] || ''
  );
  const [imbKecamatan, setImbKecamatan] = useState('');
  const [imbKelurahanDesa, setImbKelurahanDesa] = useState('');
  const [imbLokasiBangunanDetail, setImbLokasiBangunanDetail] = useState('');
  const [imbBangunanInduk, setImbBangunanInduk] = useState('');
  const [imbBermaksudUntuk, setImbBermaksudUntuk] = useState('');

  // --- 7. Sertifikat Laik Operasi (SLO) Form State (28 Fields) ---
  const [sloIdSlo, setSloIdSlo] = useState('');
  const [sloJenis, setSloJenis] = useState<JenisSLO>('GENSET');
  const [sloNo, setSloNo] = useState('');
  const [sloTanggalTerbit, setSloTanggalTerbit] = useState('');
  const [sloTanggalBerlaku, setSloTanggalBerlaku] = useState('');
  const [sloStatus, setSloStatus] = useState<StatusSLO>('AKTIF');
  const [sloNamaPerusahaan, setSloNamaPerusahaan] = useState('');
  const [sloLokasiInstalasi, setSloLokasiInstalasi] = useState('');
  const [sloAlamatInstalasi, setSloAlamatInstalasi] = useState('');
  const [sloJenisInstalasi, setSloJenisInstalasi] = useState<JenisInstalasiSLO>('PEMBANGKIT');
  const [sloSumberEnergi, setSloSumberEnergi] = useState<SumberEnergiSLO>('DIESEL');
  const [sloMerekPeralatan, setSloMerekPeralatan] = useState('');
  const [sloTipePeralatan, setSloTipePeralatan] = useState('');
  const [sloNomorSeri, setSloNomorSeri] = useState('');
  const [sloKapasitasKva, setSloKapasitasKva] = useState('');
  const [sloDayaKw, setSloDayaKw] = useState('');
  const [sloTeganganV, setSloTeganganV] = useState('380 / 400 V');
  const [sloFasa, setSloFasa] = useState<FasaSLO>('3 FASA');
  const [sloFrekuensiHz, setSloFrekuensiHz] = useState('50');
  const [sloNomorPenyedia, setSloNomorPenyedia] = useState('');
  const [sloLembagaInspeksi, setSloLembagaInspeksi] = useState('');
  const [sloNomorRegistrasi, setSloNomorRegistrasi] = useState('');
  const [sloFileSlo, setSloFileSlo] = useState<FileAttachment | undefined>(undefined);
  const [sloFilePendukung, setSloFilePendukung] = useState<FileAttachment | undefined>(undefined);
  const [sloPic, setSloPic] = useState('');
  const [sloKeterangan, setSloKeterangan] = useState('');

  const handleFilePendukungUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const attachment = await readFileAsAttachment(file);
    setSloFilePendukung(attachment);
  };

  // --- 8. Uji Timbangan Form Fields (23 Fields + Dropdown Consistency) ---
  const [tmbIdPengujian, setTmbIdPengujian] = useState('');
  const [tmbJenisTimbangan, setTmbJenisTimbangan] = useState<JenisTimbangan>('ELEKTRONIK');
  const [tmbNomorSuratPengujian, setTmbNomorSuratPengujian] = useState('');
  const [tmbNomorOrder, setTmbNomorOrder] = useState('');
  const [tmbNamaAlatUkur, setTmbNamaAlatUkur] = useState('');
  const [tmbMerekPabrikBuatan, setTmbMerekPabrikBuatan] = useState('');
  const [tmbModelTipe, setTmbModelTipe] = useState('');
  const [tmbNomorSeriIdentitas, setTmbNomorSeriIdentitas] = useState('');
  const [tmbKapasitasMaksimumKg, setTmbKapasitasMaksimumKg] = useState('');
  const [tmbKapasitasMinimumKg, setTmbKapasitasMinimumKg] = useState('');
  const [tmbDayaBacaKg, setTmbDayaBacaKg] = useState('');
  const [tmbIntervalSkalaTerkecilDKg, setTmbIntervalSkalaTerkecilDKg] = useState('');
  const [tmbIntervalSkalaVerifikasiEKg, setTmbIntervalSkalaVerifikasiEKg] = useState('');
  const [tmbKelasKeakurasian, setTmbKelasKeakurasian] = useState('Kelas III (Sedang)');
  const [tmbPemilikPemakai, setTmbPemilikPemakai] = useState('');
  const [tmbAlamatPemilik, setTmbAlamatPemilik] = useState('');
  const [tmbInstansiPenerbit, setTmbInstansiPenerbit] = useState('');
  const [tmbUnitInstansi, setTmbUnitInstansi] = useState('');
  const [tmbNomorSkKkpttuUutp, setTmbNomorSkKkpttuUutp] = useState('');
  const [tmbTanggalSkKkpttuUutp, setTmbTanggalSkKkpttuUutp] = useState('');
  const [tmbTanggalTerbitSurat, setTmbTanggalTerbitSurat] = useState('');
  const [tmbTempatPenerbitan, setTmbTempatPenerbitan] = useState('');
  const [tmbBerlakuSampai, setTmbBerlakuSampai] = useState('');
  const [tmbStatusDokumen, setTmbStatusDokumen] = useState<StatusDokumenTimbangan>('LENGKAP');
  const [tmbStatusMasaBerlaku, setTmbStatusMasaBerlaku] = useState<StatusMasaBerlakuTimbangan>('AKTIF');
  const [tmbFilePendukung, setTmbFilePendukung] = useState<FileAttachment | undefined>(undefined);
  const [tmbKeterangan, setTmbKeterangan] = useState('');

  const handleTmbFilePendukungUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const attachment = await readFileAsAttachment(file);
    setTmbFilePendukung(attachment);
  };

  const generateAutoNoArsipForCurrentCategory = () => {
    if (docCategory === 'doc-enop') {
      return generateNextArchiveNumber(
        'ENOP',
        state.docsENOP.map((d) => d.noArsip)
      );
    }
    if (docCategory === 'doc-esppt') {
      return generateNextArchiveNumber(
        'SPPT',
        state.docsESPPT.map((d) => d.noArsip)
      );
    }
    if (docCategory === 'doc-merk') {
      return generateNextArchiveNumber(
        'MRK',
        state.docsMerk.map((d) => d.noArsip)
      );
    }
    if (docCategory === 'doc-k3') {
      return generateNextArchiveNumber(
        'K3',
        state.docsK3.map((d) => d.noArsip)
      );
    }
    if (docCategory === 'doc-imb') {
      return generateNextArchiveNumber(
        'IMB',
        state.docsIMB.map((d) => d.noArsip)
      );
    }
    if (docCategory === 'doc-slo') {
      return generateNextArchiveNumber(
        'SLO',
        (state.docsSLO || []).map((d) => d.noArsip)
      );
    }
    if (docCategory === 'doc-timbangan') {
      return generateNextArchiveNumber(
        'TMB',
        (state.docsTimbangan || []).map((d) => d.noArsip)
      );
    }
    return generateNextArchiveNumber(
      'TNH',
      state.docsTanah.map((d) => d.noArsip)
    );
  };

  const openNewForm = () => {
    setEditingId(null);
    setNoArsip(generateAutoNoArsipForCurrentCategory());
    setArsipDokumenId(state.masterLocations[0]?.id || '');
    setFileAttachment(undefined);

    const defaultProv = state.masterProvinces[0];
    const defaultKota = defaultProv?.kotaKabupaten[0] || '';
    const defaultKecList = getKecamatanListForKota(defaultKota);
    const defaultKec = defaultKecList[0] || '';
    const defaultDesaList = getDesaKelurahanListForKecamatan(defaultKota, defaultKec);
    const defaultDesa = defaultDesaList[0] || '';

    const defaultEsppt = state.docsESPPT[0];
    setEnopTanggalTransaksi(new Date().toISOString().split('T')[0]);
    setEnopProvinsiId(defaultProv?.id || '');
    setEnopKotaKabupaten(defaultKota);
    setEnopStatusBayarId(state.masterStatuses[0]?.id || '');
    setEnopEspptId(defaultEsppt?.id || '');
    setEnopNop(defaultEsppt?.nop || '');
    setEnopNamaWajibPajak(
      defaultEsppt?.namaWajibPajak || defaultEsppt?.namaAlamatWajibPajak || ''
    );
    setEnopAlamatWajibPajak(
      defaultEsppt?.alamatWajibPajak || defaultEsppt?.letakObjekPajak || ''
    );
    setEnopNamaNop(defaultEsppt?.namaWajibPajak || '');
    setEnopTahunPajak(defaultEsppt?.tahun || new Date().getFullYear().toString());
    setEnopLokasiAlamat(
      defaultEsppt?.letakObjekPajak || defaultEsppt?.alamatWajibPajak || ''
    );

    setEspptNop('');
    setEspptEnopId('');
    setEspptTahun(new Date().getFullYear().toString());
    setEspptLetakObjekPajak('');
    setEspptNamaWajibPajak('');
    setEspptAlamatWajibPajak('');
    setEspptJatuhTempo('');

    setMerkNama('');
    setMerkAlamat('');
    setMerkTanggalPenerimaan(new Date().toISOString().split('T')[0]);
    setMerkNoPendaftaran('');
    setMerkEtiketMerk('');
    setMerkEtiketImageUrl(undefined);
    setMerkNoPermohonan('');
    setMerkTanggalPengajuan(new Date().toISOString().split('T')[0]);
    const defaultMerkJatuhTempo = new Date();
    defaultMerkJatuhTempo.setFullYear(defaultMerkJatuhTempo.getFullYear() + 10);
    setMerkTglJatuhTempo(defaultMerkJatuhTempo.toISOString().split('T')[0]);
    setMerkKelasBarangJasa('');
    setMerkUraianWarna('');

    setK3JenisObjek('Pesawat Angkat & Angkut');
    setK3NamaPerusahaan('');
    setK3NamaPemilik('');
    setK3Alamat('');
    setK3LokasiUnit('');
    setK3Jenis('');
    setK3Merk('');
    setK3Type('');
    setK3PerusahaanPembuat('');
    setK3TempatPembuatan('');
    setK3TahunBuat(new Date().getFullYear().toString());
    setK3NoSeri('');
    setK3Kapasitas('');
    setK3TanggalPemeriksaan(new Date().toISOString().split('T')[0]);
    setK3BerlakuSampai('');

    // Initialize E-Sertifikat Tanah fields
    setTanahJenisHak('SHM');
    setTanahNomorSertifikat('');
    setTanahNib('');
    setTanahAsalHak('Pemberian Hak');
    setTanahNamaPemegangHak('');
    setTanahNikPemilik('');
    setTanahTanggalLahirPemilik('1985-01-01');
    setTanahAlamatPemilik('');
    setTanahProvinsiId(defaultProv?.id || '');
    setTanahKotaKabupaten(defaultKota);
    setTanahKecamatan(defaultKec);
    setTanahDesaKelurahan(defaultDesa);
    setTanahAlamatDetail('');
    setTanahNomorSuratUkur('');
    setTanahLuasTanah('');
    setTanahTitikKoordinat('-6.299840, 106.829610');
    setTanahBatasUtara('');
    setTanahBatasTimur('');
    setTanahBatasSelatan('');
    setTanahBatasBarat('');
    setTanahKantorPertanahan(
      defaultKota ? `Kantor Pertanahan ${defaultKota}` : 'Kantor Pertanahan BPN'
    );
    setTanahTanggalPenerbitan(new Date().toISOString().split('T')[0]);
    setTanahStatusDokumen('Sertifikat Elektronik (Sertifikat-el)');
    setTanahStatusBeban('Bersih (Clear)');

    // Initialize E-IMB fields
    setImbNoKeputusan('');
    setImbTahun(new Date().getFullYear().toString());
    setImbAtasNama('');
    setImbLokasiBangunan('');
    setImbTglPermohonan(new Date().toISOString().split('T')[0]);
    setImbNama('');
    setImbBeralamat('');
    setImbProvinsiId(defaultProv?.id || '');
    setImbKota(defaultKota);
    setImbKecamatan(defaultKec);
    setImbKelurahanDesa(defaultDesa);
    setImbLokasiBangunanDetail('');
    setImbBangunanInduk('');
    setImbBermaksudUntuk('');

    // Initialize Sertifikat Laik Operasi (SLO) fields
    const nextSloSeq = ((state.docsSLO?.length || 0) + 1).toString().padStart(4, '0');
    setSloIdSlo(`SLO-${new Date().getFullYear()}-${nextSloSeq}`);
    setSloJenis('GENSET');
    setSloNo('');
    setSloTanggalTerbit(new Date().toISOString().split('T')[0]);
    const defaultSloExpiry = new Date();
    defaultSloExpiry.setFullYear(defaultSloExpiry.getFullYear() + 3);
    setSloTanggalBerlaku(defaultSloExpiry.toISOString().split('T')[0]);
    setSloStatus('AKTIF');
    setSloNamaPerusahaan(state.companyProfile?.namaPerusahaan || 'PT Kusuka Prima Nusantara');
    setSloLokasiInstalasi('Ruang Power House Pabrik');
    setSloAlamatInstalasi('');
    setSloJenisInstalasi('PEMBANGKIT');
    setSloSumberEnergi('DIESEL');
    setSloMerekPeralatan('');
    setSloTipePeralatan('');
    setSloNomorSeri('');
    setSloKapasitasKva('');
    setSloDayaKw('');
    setSloTeganganV('380 / 400 V');
    setSloFasa('3 FASA');
    setSloFrekuensiHz('50');
    setSloNomorPenyedia('');
    setSloLembagaInspeksi('');
    setSloNomorRegistrasi('');
    setSloFileSlo(undefined);
    setSloFilePendukung(undefined);
    setSloPic('');
    setSloKeterangan('');

    // Initialize Uji Timbangan fields
    const nextTmbSeq = ((state.docsTimbangan?.length || 0) + 1).toString().padStart(4, '0');
    setTmbIdPengujian(`UTTP-TMB-${new Date().getFullYear()}-${nextTmbSeq}`);
    setTmbJenisTimbangan('ELEKTRONIK');
    setTmbNomorSuratPengujian('');
    setTmbNomorOrder('');
    setTmbNamaAlatUkur('');
    setTmbMerekPabrikBuatan('');
    setTmbModelTipe('');
    setTmbNomorSeriIdentitas('');
    setTmbKapasitasMaksimumKg('');
    setTmbKapasitasMinimumKg('');
    setTmbDayaBacaKg('');
    setTmbIntervalSkalaTerkecilDKg('');
    setTmbIntervalSkalaVerifikasiEKg('');
    setTmbKelasKeakurasian('Kelas III (Sedang)');
    setTmbPemilikPemakai(state.companyProfile?.namaPerusahaan || 'PT Kusuka Prima Nusantara');
    setTmbAlamatPemilik('');
    setTmbInstansiPenerbit('Dinas Perdagangan dan Perindustrian');
    setTmbUnitInstansi('UPTD Metrologi Legal');
    setTmbNomorSkKkpttuUutp('');
    setTmbTanggalSkKkpttuUutp('');
    setTmbTanggalTerbitSurat(new Date().toISOString().split('T')[0]);
    setTmbTempatPenerbitan('Bekasi');
    const defaultTmbExpiry = new Date();
    defaultTmbExpiry.setFullYear(defaultTmbExpiry.getFullYear() + 1);
    setTmbBerlakuSampai(defaultTmbExpiry.toISOString().split('T')[0]);
    setTmbStatusDokumen('LENGKAP');
    setTmbStatusMasaBerlaku('AKTIF');
    setTmbFilePendukung(undefined);
    setTmbKeterangan('');

    setIsFormOpen(true);
  };

  useEffect(() => {
    if (autoOpenForm) {
      openNewForm();
      onConsumeAutoOpen?.();
    }
  }, [autoOpenForm]);

  useEffect(() => {
    setIsFormOpen(false);
    setEditingId(null);
    setSearchQuery('');
  }, [docCategory]);

  // Available Kota/Kabupaten for selected Provinsi in E-NOP
  const availableKotaForSelectedProvinsi = useMemo(() => {
    const prov = state.masterProvinces.find((p) => p.id === enopProvinsiId);
    return prov ? prov.kotaKabupaten : [];
  }, [state.masterProvinces, enopProvinsiId]);

  const handleProvinceChangeInENOP = (newProvId: string) => {
    setEnopProvinsiId(newProvId);
    const prov = state.masterProvinces.find((p) => p.id === newProvId);
    setEnopKotaKabupaten(prov?.kotaKabupaten[0] || '');
  };

  // Cascading lists for E-Sertifikat Tanah (Provinsi -> Kota/Kab -> Kecamatan -> Desa/Kelurahan)
  const tanahKotaOptions = useMemo(() => {
    const prov = state.masterProvinces.find((p) => p.id === tanahProvinsiId);
    return prov ? prov.kotaKabupaten : [];
  }, [state.masterProvinces, tanahProvinsiId]);

  const tanahKecamatanOptions = useMemo(() => {
    const base = getKecamatanListForKota(tanahKotaKabupaten);
    if (tanahKecamatan && !base.includes(tanahKecamatan)) {
      return [tanahKecamatan, ...base];
    }
    return base;
  }, [tanahKotaKabupaten, tanahKecamatan]);

  const tanahDesaOptions = useMemo(() => {
    const base = getDesaKelurahanListForKecamatan(
      tanahKotaKabupaten,
      tanahKecamatan
    );
    if (tanahDesaKelurahan && !base.includes(tanahDesaKelurahan)) {
      return [tanahDesaKelurahan, ...base];
    }
    return base;
  }, [tanahKotaKabupaten, tanahKecamatan, tanahDesaKelurahan]);

  const handleTanahProvinceChange = (newProvId: string) => {
    setTanahProvinsiId(newProvId);
    const prov = state.masterProvinces.find((p) => p.id === newProvId);
    const nextKota = prov?.kotaKabupaten[0] || '';
    setTanahKotaKabupaten(nextKota);
    const nextKecList = getKecamatanListForKota(nextKota);
    const nextKec = nextKecList[0] || '';
    setTanahKecamatan(nextKec);
    const nextDesaList = getDesaKelurahanListForKecamatan(nextKota, nextKec);
    setTanahDesaKelurahan(nextDesaList[0] || '');
    if (nextKota) {
      setTanahKantorPertanahan(`Kantor Pertanahan ${nextKota}`);
    }
  };

  const handleTanahKotaChange = (nextKota: string) => {
    setTanahKotaKabupaten(nextKota);
    const nextKecList = getKecamatanListForKota(nextKota);
    const nextKec = nextKecList[0] || '';
    setTanahKecamatan(nextKec);
    const nextDesaList = getDesaKelurahanListForKecamatan(nextKota, nextKec);
    setTanahDesaKelurahan(nextDesaList[0] || '');
    if (nextKota) {
      setTanahKantorPertanahan(`Kantor Pertanahan ${nextKota}`);
    }
  };

  const handleTanahKecamatanChange = (nextKec: string) => {
    setTanahKecamatan(nextKec);
    const nextDesaList = getDesaKelurahanListForKecamatan(
      tanahKotaKabupaten,
      nextKec
    );
    setTanahDesaKelurahan(nextDesaList[0] || '');
  };

  // Cascading lists for E-IMB (Provinsi -> Kota -> Kecamatan -> Kelurahan/Desa)
  const imbKotaOptions = useMemo(() => {
    const prov = state.masterProvinces.find((p) => p.id === imbProvinsiId);
    return prov ? prov.kotaKabupaten : [];
  }, [state.masterProvinces, imbProvinsiId]);

  const imbKecamatanOptions = useMemo(() => {
    const base = getKecamatanListForKota(imbKota);
    if (imbKecamatan && !base.includes(imbKecamatan)) {
      return [imbKecamatan, ...base];
    }
    return base;
  }, [imbKota, imbKecamatan]);

  const imbKelurahanOptions = useMemo(() => {
    const base = getDesaKelurahanListForKecamatan(imbKota, imbKecamatan);
    if (imbKelurahanDesa && !base.includes(imbKelurahanDesa)) {
      return [imbKelurahanDesa, ...base];
    }
    return base;
  }, [imbKota, imbKecamatan, imbKelurahanDesa]);

  const handleImbProvinceChange = (newProvId: string) => {
    setImbProvinsiId(newProvId);
    const prov = state.masterProvinces.find((p) => p.id === newProvId);
    const nextKota = prov?.kotaKabupaten[0] || '';
    setImbKota(nextKota);
    const nextKecList = getKecamatanListForKota(nextKota);
    const nextKec = nextKecList[0] || '';
    setImbKecamatan(nextKec);
    const nextDesaList = getDesaKelurahanListForKecamatan(nextKota, nextKec);
    setImbKelurahanDesa(nextDesaList[0] || '');
  };

  const handleImbKotaChange = (nextKota: string) => {
    setImbKota(nextKota);
    const nextKecList = getKecamatanListForKota(nextKota);
    const nextKec = nextKecList[0] || '';
    setImbKecamatan(nextKec);
    const nextDesaList = getDesaKelurahanListForKecamatan(nextKota, nextKec);
    setImbKelurahanDesa(nextDesaList[0] || '');
  };

  const handleImbKecamatanChange = (nextKec: string) => {
    setImbKecamatan(nextKec);
    const nextDesaList = getDesaKelurahanListForKecamatan(imbKota, nextKec);
    setImbKelurahanDesa(nextDesaList[0] || '');
  };

  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const attachment = await readFileAsAttachment(file);
    setFileAttachment(attachment);
  };

  const handleEtiketImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const attachment = await readFileAsAttachment(file);
    setMerkEtiketImageUrl(attachment.dataUrl);
  };

  // Auto-fill E-NOP fields when user selects an E-SPPT NOP
  const handleSelectESPPTForENOP = (selectedEspptId: string) => {
    setEnopEspptId(selectedEspptId);
    const found = state.docsESPPT.find((s) => s.id === selectedEspptId);
    if (found) {
      setEnopNop(found.nop);
      setEnopNamaWajibPajak(
        found.namaWajibPajak || found.namaAlamatWajibPajak || ''
      );
      setEnopAlamatWajibPajak(
        found.alamatWajibPajak || found.letakObjekPajak || ''
      );
      setEnopTahunPajak(found.tahun || enopTahunPajak);
      setEnopLokasiAlamat(found.letakObjekPajak || found.alamatWajibPajak || '');
      if (!enopNamaNop) {
        setEnopNamaNop(found.namaWajibPajak || '');
      }
    }
  };

  // --- Edit Handlers ---
  const handleEditENOP = (doc: DocENOP) => {
    const matchedSppt = state.docsESPPT.find(
      (s) => s.id === doc.espptId || s.nop === doc.nop
    );
    setEditingId(doc.id);
    setNoArsip(doc.noArsip);
    setArsipDokumenId(doc.arsipDokumenId);
    setFileAttachment(doc.fileAttachment);
    setEnopTanggalTransaksi(doc.tanggalTransaksi);
    setEnopProvinsiId(doc.provinsiId);
    setEnopKotaKabupaten(doc.kotaKabupaten);
    setEnopStatusBayarId(doc.statusBayarId);
    setEnopEspptId(doc.espptId || matchedSppt?.id || '');
    setEnopNop(doc.nop);
    setEnopNamaWajibPajak(
      doc.namaWajibPajak || matchedSppt?.namaWajibPajak || doc.namaNop || ''
    );
    setEnopAlamatWajibPajak(
      doc.alamatWajibPajak || matchedSppt?.alamatWajibPajak || doc.lokasiAlamat || ''
    );
    setEnopNamaNop(doc.namaNop);
    setEnopTahunPajak(doc.tahunPajak);
    setEnopLokasiAlamat(doc.lokasiAlamat);
    setIsFormOpen(true);
  };

  const handleEditESPPT = (doc: DocESPPT) => {
    setEditingId(doc.id);
    setNoArsip(doc.noArsip);
    setArsipDokumenId(doc.arsipDokumenId);
    setFileAttachment(doc.fileAttachment);
    setEspptNop(doc.nop);
    setEspptEnopId(doc.enopId || '');
    setEspptTahun(doc.tahun);
    setEspptLetakObjekPajak(doc.letakObjekPajak);
    setEspptNamaWajibPajak(doc.namaWajibPajak || doc.namaAlamatWajibPajak || '');
    setEspptAlamatWajibPajak(doc.alamatWajibPajak || doc.letakObjekPajak || '');
    setEspptJatuhTempo(doc.jatuhTempo);
    setIsFormOpen(true);
  };

  const handleEditMerk = (doc: DocMerk) => {
    setEditingId(doc.id);
    setNoArsip(doc.noArsip);
    setArsipDokumenId(doc.arsipDokumenId);
    setFileAttachment(doc.fileAttachment);
    setMerkNama(doc.nama);
    setMerkAlamat(doc.alamat);
    setMerkTanggalPenerimaan(doc.tanggalPenerimaan);
    setMerkNoPendaftaran(doc.noPendaftaran);
    setMerkEtiketMerk(doc.etiketMerk);
    setMerkEtiketImageUrl(doc.etiketImageUrl);
    setMerkNoPermohonan(doc.noPermohonan);
    setMerkTanggalPengajuan(doc.tanggalPengajuan);
    setMerkTglJatuhTempo(doc.tglJatuhTempoKepemilikan || '');
    setMerkKelasBarangJasa(doc.kelasBarangJasa);
    setMerkUraianWarna(doc.uraianWarna);
    setIsFormOpen(true);
  };

  const handleEditK3 = (doc: DocK3) => {
    setEditingId(doc.id);
    setNoArsip(doc.noArsip);
    setArsipDokumenId(doc.arsipDokumenId);
    setFileAttachment(doc.fileAttachment);
    setK3JenisObjek(doc.jenisObjekK3);
    setK3NamaPerusahaan(doc.namaPerusahaan);
    setK3NamaPemilik(doc.namaPemilik);
    setK3Alamat(doc.alamat);
    setK3LokasiUnit(doc.lokasiUnit);
    setK3Jenis(doc.jenis);
    setK3Merk(doc.merk);
    setK3Type(doc.type);
    setK3PerusahaanPembuat(doc.perusahaanPembuat);
    setK3TempatPembuatan(doc.tempatPembuatan);
    setK3TahunBuat(doc.tahunBuat);
    setK3NoSeri(doc.noSeri);
    setK3Kapasitas(doc.kapasitas);
    setK3TanggalPemeriksaan(doc.tanggalPemeriksaan);
    setK3BerlakuSampai(doc.berlakuSampaiTanggal);
    setIsFormOpen(true);
  };

  const handleEditTanah = (doc: DocTanah) => {
    setEditingId(doc.id);
    setNoArsip(doc.noArsip);
    setArsipDokumenId(doc.arsipDokumenId);
    setFileAttachment(doc.fileAttachment);
    setTanahJenisHak(doc.jenisHak);
    setTanahNomorSertifikat(doc.nomorSertifikat);
    setTanahNib(doc.nib);
    setTanahAsalHak(doc.asalHak);
    setTanahNamaPemegangHak(doc.namaPemegangHak);
    setTanahNikPemilik(doc.nikPemilik);
    setTanahTanggalLahirPemilik(doc.tanggalLahirPemilik);
    setTanahAlamatPemilik(doc.alamatPemilik);
    setTanahProvinsiId(doc.provinsiId);
    setTanahKotaKabupaten(doc.kotaKabupaten);
    setTanahKecamatan(doc.kecamatan);
    setTanahDesaKelurahan(doc.desaKelurahan);
    setTanahAlamatDetail(doc.alamatDetail);
    setTanahNomorSuratUkur(doc.nomorSuratUkur);
    setTanahLuasTanah(doc.luasTanah.toString());
    setTanahTitikKoordinat(doc.titikKoordinat);
    setTanahBatasUtara(doc.batasUtara);
    setTanahBatasTimur(doc.batasTimur);
    setTanahBatasSelatan(doc.batasSelatan);
    setTanahBatasBarat(doc.batasBarat);
    setTanahKantorPertanahan(doc.kantorPertanahan);
    setTanahTanggalPenerbitan(doc.tanggalPenerbitan);
    setTanahStatusDokumen(doc.statusDokumen);
    setTanahStatusBeban(doc.statusBeban);
    setIsFormOpen(true);
  };

  const handleEditIMB = (doc: DocIMB) => {
    setEditingId(doc.id);
    setNoArsip(doc.noArsip);
    setArsipDokumenId(doc.arsipDokumenId);
    setFileAttachment(doc.fileAttachment);
    setImbNoKeputusan(doc.noKeputusan);
    setImbTahun(doc.tahun);
    setImbAtasNama(doc.atasNama);
    setImbLokasiBangunan(doc.lokasiBangunan);
    setImbTglPermohonan(doc.tglPermohonanImb);
    setImbNama(doc.nama);
    setImbBeralamat(doc.beralamat);
    setImbProvinsiId(doc.provinsiId);
    setImbKota(doc.kota);
    setImbKecamatan(doc.kecamatan);
    setImbKelurahanDesa(doc.kelurahanDesa);
    setImbLokasiBangunanDetail(doc.lokasiBangunanDetail);
    setImbBangunanInduk(doc.bangunanInduk);
    setImbBermaksudUntuk(doc.bermaksudUntuk);
    setIsFormOpen(true);
  };

  const handleEditSLO = (doc: DocSLO) => {
    setEditingId(doc.id);
    setNoArsip(doc.noArsip);
    setArsipDokumenId(doc.arsipDokumenId);
    const primaryFile = doc.fileSlo || doc.fileAttachment;
    setFileAttachment(primaryFile);
    setSloIdSlo(doc.idSlo || '');
    setSloJenis(doc.jenisSlo);
    setSloNo(doc.noSlo);
    setSloTanggalTerbit(doc.tanggalTerbit);
    setSloTanggalBerlaku(doc.tanggalBerlaku);
    setSloStatus(doc.statusSlo);
    setSloNamaPerusahaan(doc.namaPerusahaan);
    setSloLokasiInstalasi(doc.lokasiInstalasi);
    setSloAlamatInstalasi(doc.alamatInstalasi);
    setSloJenisInstalasi(doc.jenisInstalasi);
    setSloSumberEnergi(doc.sumberEnergi);
    setSloMerekPeralatan(doc.merekPeralatan);
    setSloTipePeralatan(doc.tipePeralatan);
    setSloNomorSeri(doc.nomorSeri);
    setSloKapasitasKva(doc.kapasitasKva?.toString() || '');
    setSloDayaKw(doc.dayaKw?.toString() || '');
    setSloTeganganV(doc.teganganV || '380 V');
    setSloFasa(doc.fasa);
    setSloFrekuensiHz(doc.frekuensiHz?.toString() || '50');
    setSloNomorPenyedia(doc.nomorPenyedia || '');
    setSloLembagaInspeksi(doc.lembagaInspeksi);
    setSloNomorRegistrasi(doc.nomorRegistrasi);
    setSloFileSlo(primaryFile);
    setSloFilePendukung(doc.filePendukung);
    setSloPic(doc.pic);
    setSloKeterangan(doc.keterangan);
    setIsFormOpen(true);
  };

  const handleEditTimbangan = (doc: DocUjiTimbangan) => {
    setEditingId(doc.id);
    setNoArsip(doc.noArsip);
    setArsipDokumenId(doc.arsipDokumenId);
    setFileAttachment(doc.fileAttachment);
    setTmbIdPengujian(doc.idPengujian || '');
    setTmbJenisTimbangan(doc.jenisTimbangan);
    setTmbNomorSuratPengujian(doc.nomorSuratPengujian);
    setTmbNomorOrder(doc.nomorOrder || '');
    setTmbNamaAlatUkur(doc.namaAlatUkur);
    setTmbMerekPabrikBuatan(doc.merekPabrikBuatan);
    setTmbModelTipe(doc.modelTipe);
    setTmbNomorSeriIdentitas(doc.nomorSeriIdentitas);
    setTmbKapasitasMaksimumKg(doc.kapasitasMaksimumKg?.toString() || '');
    setTmbKapasitasMinimumKg(doc.kapasitasMinimumKg?.toString() || '');
    setTmbDayaBacaKg(doc.dayaBacaKg || '');
    setTmbIntervalSkalaTerkecilDKg(doc.intervalSkalaTerkecilDKg || '');
    setTmbIntervalSkalaVerifikasiEKg(doc.intervalSkalaVerifikasiEKg || '');
    setTmbKelasKeakurasian(doc.kelasKeakurasian || 'Kelas III (Sedang)');
    setTmbPemilikPemakai(doc.pemilikPemakai);
    setTmbAlamatPemilik(doc.alamatPemilik);
    setTmbInstansiPenerbit(doc.instansiPenerbit);
    setTmbUnitInstansi(doc.unitInstansi || '');
    setTmbNomorSkKkpttuUutp(doc.nomorSkKkpttuUutp || '');
    setTmbTanggalSkKkpttuUutp(doc.tanggalSkKkpttuUutp || '');
    setTmbTanggalTerbitSurat(doc.tanggalTerbitSurat);
    setTmbTempatPenerbitan(doc.tempatPenerbitan);
    setTmbBerlakuSampai(doc.berlakuSampai);
    setTmbStatusDokumen(doc.statusDokumen || 'LENGKAP');
    setTmbStatusMasaBerlaku(doc.statusMasaBerlaku || 'AKTIF');
    setTmbFilePendukung(doc.filePendukung);
    setTmbKeterangan(doc.keterangan || '');
    setIsFormOpen(true);
  };

  // --- Submit Handler ---
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];

    if (docCategory === 'doc-enop') {
      onSaveENOP(
        {
          id: editingId || `enop-${Date.now()}`,
          noArsip: noArsip.trim(),
          tanggalTransaksi: enopTanggalTransaksi,
          provinsiId: enopProvinsiId,
          kotaKabupaten: enopKotaKabupaten,
          statusBayarId: enopStatusBayarId,
          espptId: enopEspptId,
          nop: enopNop.trim(),
          namaWajibPajak: enopNamaWajibPajak.trim(),
          alamatWajibPajak: enopAlamatWajibPajak.trim(),
          namaNop: enopNamaNop.trim() || enopNamaWajibPajak.trim(),
          tahunPajak: enopTahunPajak.trim(),
          lokasiAlamat: enopLokasiAlamat.trim() || enopAlamatWajibPajak.trim(),
          arsipDokumenId,
          fileAttachment,
          createdAt: today,
        },
        Boolean(editingId)
      );
    } else if (docCategory === 'doc-esppt') {
      onSaveESPPT(
        {
          id: editingId || `esppt-${Date.now()}`,
          noArsip: noArsip.trim(),
          nop: espptNop.trim(),
          enopId: espptEnopId,
          tahun: espptTahun.trim(),
          letakObjekPajak: espptLetakObjekPajak.trim(),
          namaWajibPajak: espptNamaWajibPajak.trim(),
          alamatWajibPajak: espptAlamatWajibPajak.trim(),
          namaAlamatWajibPajak: `${espptNamaWajibPajak.trim()} — ${espptAlamatWajibPajak.trim()}`,
          jatuhTempo: espptJatuhTempo,
          arsipDokumenId,
          fileAttachment,
          createdAt: today,
        },
        Boolean(editingId)
      );
    } else if (docCategory === 'doc-merk') {
      onSaveMerk(
        {
          id: editingId || `merk-${Date.now()}`,
          noArsip: noArsip.trim(),
          nama: merkNama.trim(),
          alamat: merkAlamat.trim(),
          tanggalPenerimaan: merkTanggalPenerimaan,
          noPendaftaran: merkNoPendaftaran.trim(),
          etiketMerk: merkEtiketMerk.trim(),
          etiketImageUrl: merkEtiketImageUrl,
          noPermohonan: merkNoPermohonan.trim(),
          tanggalPengajuan: merkTanggalPengajuan,
          tglJatuhTempoKepemilikan: merkTglJatuhTempo,
          kelasBarangJasa: merkKelasBarangJasa.trim(),
          uraianWarna: merkUraianWarna.trim(),
          arsipDokumenId,
          fileAttachment,
          createdAt: today,
        },
        Boolean(editingId)
      );
    } else if (docCategory === 'doc-k3') {
      onSaveK3(
        {
          id: editingId || `k3-${Date.now()}`,
          noArsip: noArsip.trim(),
          jenisObjekK3: k3JenisObjek.trim(),
          namaPerusahaan: k3NamaPerusahaan.trim(),
          namaPemilik: k3NamaPemilik.trim(),
          alamat: k3Alamat.trim(),
          lokasiUnit: k3LokasiUnit.trim(),
          jenis: k3Jenis.trim(),
          merk: k3Merk.trim(),
          type: k3Type.trim(),
          perusahaanPembuat: k3PerusahaanPembuat.trim(),
          tempatPembuatan: k3TempatPembuatan.trim(),
          tahunBuat: k3TahunBuat.trim(),
          noSeri: k3NoSeri.trim(),
          kapasitas: k3Kapasitas.trim(),
          tanggalPemeriksaan: k3TanggalPemeriksaan,
          berlakuSampaiTanggal: k3BerlakuSampai,
          arsipDokumenId,
          fileAttachment,
          createdAt: today,
        },
        Boolean(editingId)
      );
    } else if (docCategory === 'doc-tanah') {
      onSaveTanah(
        {
          id: editingId || `tanah-${Date.now()}`,
          noArsip: noArsip.trim(),
          jenisHak: tanahJenisHak,
          nomorSertifikat: tanahNomorSertifikat.trim(),
          nib: tanahNib.trim(),
          asalHak: tanahAsalHak,
          namaPemegangHak: tanahNamaPemegangHak.trim(),
          nikPemilik: tanahNikPemilik.trim(),
          tanggalLahirPemilik: tanahTanggalLahirPemilik,
          alamatPemilik: tanahAlamatPemilik.trim(),
          provinsiId: tanahProvinsiId,
          kotaKabupaten: tanahKotaKabupaten,
          kecamatan: tanahKecamatan.trim(),
          desaKelurahan: tanahDesaKelurahan.trim(),
          alamatDetail: tanahAlamatDetail.trim(),
          nomorSuratUkur: tanahNomorSuratUkur.trim(),
          luasTanah: parseFloat(tanahLuasTanah) || 0,
          titikKoordinat: tanahTitikKoordinat.trim(),
          batasUtara: tanahBatasUtara.trim(),
          batasTimur: tanahBatasTimur.trim(),
          batasSelatan: tanahBatasSelatan.trim(),
          batasBarat: tanahBatasBarat.trim(),
          kantorPertanahan: tanahKantorPertanahan.trim(),
          tanggalPenerbitan: tanahTanggalPenerbitan,
          statusDokumen: tanahStatusDokumen,
          statusBeban: tanahStatusBeban,
          arsipDokumenId,
          fileAttachment,
          createdAt: today,
        },
        Boolean(editingId)
      );
    } else if (docCategory === 'doc-imb') {
      onSaveIMB(
        {
          id: editingId || `imb-${Date.now()}`,
          noArsip: noArsip.trim(),
          noKeputusan: imbNoKeputusan.trim(),
          tahun: imbTahun.trim(),
          atasNama: imbAtasNama.trim(),
          lokasiBangunan: imbLokasiBangunan.trim(),
          tglPermohonanImb: imbTglPermohonan,
          nama: imbNama.trim(),
          beralamat: imbBeralamat.trim(),
          provinsiId: imbProvinsiId,
          kota: imbKota,
          kecamatan: imbKecamatan.trim(),
          kelurahanDesa: imbKelurahanDesa.trim(),
          lokasiBangunanDetail:
            imbLokasiBangunanDetail.trim() || imbLokasiBangunan.trim(),
          bangunanInduk: imbBangunanInduk.trim(),
          bermaksudUntuk: imbBermaksudUntuk.trim(),
          arsipDokumenId,
          fileAttachment,
          createdAt: today,
        },
        Boolean(editingId)
      );
    } else if (docCategory === 'doc-slo') {
      const existing = (state.docsSLO || []).find((d) => d.id === editingId);
      const primaryFile = sloFileSlo || fileAttachment;
      onSaveSLO(
        {
          id: editingId || `slo-${Date.now()}`,
          idSlo: sloIdSlo.trim() || `SLO-${Date.now()}`,
          noArsip: noArsip.trim(),
          jenisSlo: sloJenis,
          noSlo: sloNo.trim(),
          tanggalTerbit: sloTanggalTerbit,
          tanggalBerlaku: sloTanggalBerlaku,
          statusSlo: sloStatus,
          namaPerusahaan: sloNamaPerusahaan.trim(),
          lokasiInstalasi: sloLokasiInstalasi.trim(),
          alamatInstalasi: sloAlamatInstalasi.trim(),
          jenisInstalasi: sloJenisInstalasi,
          sumberEnergi: sloSumberEnergi,
          merekPeralatan: sloMerekPeralatan.trim(),
          tipePeralatan: sloTipePeralatan.trim(),
          nomorSeri: sloNomorSeri.trim(),
          kapasitasKva: parseFloat(sloKapasitasKva) || sloKapasitasKva.trim() || 0,
          dayaKw: parseFloat(sloDayaKw) || sloDayaKw.trim() || 0,
          teganganV: sloTeganganV.trim(),
          fasa: sloFasa,
          frekuensiHz: parseFloat(sloFrekuensiHz) || 50,
          nomorPenyedia: sloNomorPenyedia.trim() || undefined,
          lembagaInspeksi: sloLembagaInspeksi.trim(),
          nomorRegistrasi: sloNomorRegistrasi.trim(),
          fileSlo: primaryFile,
          filePendukung: sloFilePendukung,
          fileAttachment: primaryFile,
          pic: sloPic.trim(),
          keterangan: sloKeterangan.trim(),
          arsipDokumenId,
          createdAt: existing ? existing.createdAt : today,
          updatedAt: today,
        },
        Boolean(editingId)
      );
    } else if (docCategory === 'doc-timbangan') {
      const existing = (state.docsTimbangan || []).find((d) => d.id === editingId);
      onSaveTimbangan(
        {
          id: editingId || `tmb-${Date.now()}`,
          noArsip: noArsip.trim(),
          idPengujian: tmbIdPengujian.trim() || `UTTP-TMB-${Date.now()}`,
          jenisTimbangan: tmbJenisTimbangan,
          nomorSuratPengujian: tmbNomorSuratPengujian.trim(),
          nomorOrder: tmbNomorOrder.trim() || undefined,
          namaAlatUkur: tmbNamaAlatUkur.trim(),
          merekPabrikBuatan: tmbMerekPabrikBuatan.trim(),
          modelTipe: tmbModelTipe.trim(),
          nomorSeriIdentitas: tmbNomorSeriIdentitas.trim(),
          kapasitasMaksimumKg: parseFloat(tmbKapasitasMaksimumKg) || tmbKapasitasMaksimumKg.trim() || 0,
          kapasitasMinimumKg: parseFloat(tmbKapasitasMinimumKg) || tmbKapasitasMinimumKg.trim() || 0,
          dayaBacaKg: tmbDayaBacaKg.trim() || undefined,
          intervalSkalaTerkecilDKg: tmbIntervalSkalaTerkecilDKg.trim() || undefined,
          intervalSkalaVerifikasiEKg: tmbIntervalSkalaVerifikasiEKg.trim() || undefined,
          kelasKeakurasian: tmbKelasKeakurasian.trim(),
          pemilikPemakai: tmbPemilikPemakai.trim(),
          alamatPemilik: tmbAlamatPemilik.trim(),
          instansiPenerbit: tmbInstansiPenerbit.trim(),
          unitInstansi: tmbUnitInstansi.trim() || undefined,
          nomorSkKkpttuUutp: tmbNomorSkKkpttuUutp.trim() || undefined,
          tanggalSkKkpttuUutp: tmbTanggalSkKkpttuUutp.trim() || undefined,
          tanggalTerbitSurat: tmbTanggalTerbitSurat,
          tempatPenerbitan: tmbTempatPenerbitan.trim(),
          berlakuSampai: tmbBerlakuSampai,
          statusDokumen: tmbStatusDokumen,
          statusMasaBerlaku: tmbStatusMasaBerlaku,
          arsipDokumenId,
          fileAttachment,
          filePendukung: tmbFilePendukung,
          keterangan: tmbKeterangan.trim() || undefined,
          createdAt: existing ? existing.createdAt : today,
          updatedAt: today,
        },
        Boolean(editingId)
      );
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  // Helpers to resolve master names
  const getLocName = (id: string) =>
    state.masterLocations.find((l) => l.id === id)?.namaLokasi || '-';
  const getProvName = (id: string) =>
    state.masterProvinces.find((p) => p.id === id)?.namaProvinsi || '-';
  const getStatusObj = (id: string) =>
    state.masterStatuses.find((s) => s.id === id);

  // Helper to determine due within 30 days count for current active tab
  const currentCategoryDueCount = useMemo(() => {
    if (docCategory === 'doc-esppt') {
      return state.docsESPPT.filter((d) => {
        const e = evaluateDateDeadline(d.jatuhTempo);
        return e.daysDiff >= 0 && e.daysDiff <= 30;
      }).length;
    }
    if (docCategory === 'doc-k3') {
      return state.docsK3.filter((d) => {
        const e = evaluateDateDeadline(d.berlakuSampaiTanggal);
        return e.daysDiff >= 0 && e.daysDiff <= 30;
      }).length;
    }
    if (docCategory === 'doc-merk') {
      return state.docsMerk.filter((d) => {
        if (!d.tglJatuhTempoKepemilikan) return false;
        const e = evaluateDateDeadline(d.tglJatuhTempoKepemilikan);
        return e.daysDiff >= 0 && e.daysDiff <= 30;
      }).length;
    }
    if (docCategory === 'doc-slo') {
      return (state.docsSLO || []).filter((d) => {
        if (!d.tanggalBerlaku) return false;
        const e = evaluateDateDeadline(d.tanggalBerlaku);
        return e.daysDiff >= 0 && e.daysDiff <= 30;
      }).length;
    }
    if (docCategory === 'doc-timbangan') {
      return (state.docsTimbangan || []).filter((d) => {
        if (!d.berlakuSampai) return false;
        const e = evaluateDateDeadline(d.berlakuSampai);
        return e.daysDiff >= 0 && e.daysDiff <= 30;
      }).length;
    }
    if (docCategory === 'doc-enop') {
      return state.docsENOP.filter((d) => {
        const matched = state.docsESPPT.find(
          (s) => s.id === d.espptId || (d.nop && s.nop === d.nop)
        );
        if (!matched || !matched.jatuhTempo) return false;
        const e = evaluateDateDeadline(matched.jatuhTempo);
        return e.daysDiff >= 0 && e.daysDiff <= 30;
      }).length;
    }
    return 0;
  }, [docCategory, state.docsESPPT, state.docsK3, state.docsMerk, state.docsENOP, state.docsSLO, state.docsTimbangan]);

  // Filtered lists
  const filteredENOP = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.docsENOP.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (deadlineFilter === 'DUE_30' || deadlineFilter === 'OVERDUE') {
        const matched = state.docsESPPT.find(
          (s) => s.id === d.espptId || (d.nop && s.nop === d.nop)
        );
        if (!matched || !matched.jatuhTempo) return false;
        const evalRes = evaluateDateDeadline(matched.jatuhTempo);
        if (deadlineFilter === 'DUE_30' && (evalRes.daysDiff < 0 || evalRes.daysDiff > 30)) return false;
        if (deadlineFilter === 'OVERDUE' && evalRes.daysDiff >= 0) return false;
      }
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.nop.toLowerCase().includes(q) ||
        (d.namaWajibPajak && d.namaWajibPajak.toLowerCase().includes(q)) ||
        (d.alamatWajibPajak && d.alamatWajibPajak.toLowerCase().includes(q)) ||
        d.namaNop.toLowerCase().includes(q) ||
        d.kotaKabupaten.toLowerCase().includes(q) ||
        d.lokasiAlamat.toLowerCase().includes(q)
      );
    });
  }, [state.docsENOP, state.docsESPPT, searchQuery, locationFilter, deadlineFilter]);

  const filteredESPPT = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.docsESPPT.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (deadlineFilter === 'DUE_30') {
        const evalRes = evaluateDateDeadline(d.jatuhTempo);
        if (evalRes.daysDiff < 0 || evalRes.daysDiff > 30) return false;
      } else if (deadlineFilter === 'OVERDUE') {
        const evalRes = evaluateDateDeadline(d.jatuhTempo);
        if (evalRes.daysDiff >= 0) return false;
      }
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.nop.toLowerCase().includes(q) ||
        d.letakObjekPajak.toLowerCase().includes(q) ||
        (d.namaWajibPajak && d.namaWajibPajak.toLowerCase().includes(q)) ||
        (d.alamatWajibPajak && d.alamatWajibPajak.toLowerCase().includes(q)) ||
        (d.namaAlamatWajibPajak && d.namaAlamatWajibPajak.toLowerCase().includes(q))
      );
    });
  }, [state.docsESPPT, searchQuery, locationFilter, deadlineFilter]);

  const filteredMerk = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.docsMerk.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (deadlineFilter === 'DUE_30') {
        if (!d.tglJatuhTempoKepemilikan) return false;
        const evalRes = evaluateDateDeadline(d.tglJatuhTempoKepemilikan);
        if (evalRes.daysDiff < 0 || evalRes.daysDiff > 30) return false;
      } else if (deadlineFilter === 'OVERDUE') {
        if (!d.tglJatuhTempoKepemilikan) return false;
        const evalRes = evaluateDateDeadline(d.tglJatuhTempoKepemilikan);
        if (evalRes.daysDiff >= 0) return false;
      }
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.nama.toLowerCase().includes(q) ||
        d.noPendaftaran.toLowerCase().includes(q) ||
        d.etiketMerk.toLowerCase().includes(q) ||
        d.noPermohonan.toLowerCase().includes(q) ||
        d.kelasBarangJasa.toLowerCase().includes(q)
      );
    });
  }, [state.docsMerk, searchQuery, locationFilter, deadlineFilter]);

  const filteredK3 = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.docsK3.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (deadlineFilter === 'DUE_30') {
        if (!d.berlakuSampaiTanggal) return false;
        const evalRes = evaluateDateDeadline(d.berlakuSampaiTanggal);
        if (evalRes.daysDiff < 0 || evalRes.daysDiff > 30) return false;
      } else if (deadlineFilter === 'OVERDUE') {
        if (!d.berlakuSampaiTanggal) return false;
        const evalRes = evaluateDateDeadline(d.berlakuSampaiTanggal);
        if (evalRes.daysDiff >= 0) return false;
      }
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.jenisObjekK3.toLowerCase().includes(q) ||
        d.namaPerusahaan.toLowerCase().includes(q) ||
        d.merk.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.noSeri.toLowerCase().includes(q) ||
        d.lokasiUnit.toLowerCase().includes(q)
      );
    });
  }, [state.docsK3, searchQuery, locationFilter, deadlineFilter]);

  const filteredTanah = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.docsTanah.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (deadlineFilter === 'DUE_30' || deadlineFilter === 'OVERDUE') {
        if (!['HGB', 'Hak Pakai', 'HGU'].includes(d.jenisHak) || !d.tanggalPenerbitan) return false;
        try {
          const issueDate = new Date(d.tanggalPenerbitan);
          issueDate.setFullYear(issueDate.getFullYear() + 30);
          const evalRes = evaluateDateDeadline(issueDate.toISOString().split('T')[0]);
          if (deadlineFilter === 'DUE_30' && (evalRes.daysDiff < 0 || evalRes.daysDiff > 30)) return false;
          if (deadlineFilter === 'OVERDUE' && evalRes.daysDiff >= 0) return false;
        } catch {
          return false;
        }
      }
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.jenisHak.toLowerCase().includes(q) ||
        d.nomorSertifikat.toLowerCase().includes(q) ||
        d.nib.toLowerCase().includes(q) ||
        d.namaPemegangHak.toLowerCase().includes(q) ||
        d.nikPemilik.toLowerCase().includes(q) ||
        d.kotaKabupaten.toLowerCase().includes(q) ||
        d.kecamatan.toLowerCase().includes(q) ||
        d.desaKelurahan.toLowerCase().includes(q) ||
        d.nomorSuratUkur.toLowerCase().includes(q)
      );
    });
  }, [state.docsTanah, searchQuery, locationFilter, deadlineFilter]);

  const filteredIMB = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.docsIMB.filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (deadlineFilter === 'DUE_30' || deadlineFilter === 'OVERDUE') {
        return false;
      }
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.noKeputusan.toLowerCase().includes(q) ||
        d.tahun.toLowerCase().includes(q) ||
        d.atasNama.toLowerCase().includes(q) ||
        d.lokasiBangunan.toLowerCase().includes(q) ||
        d.nama.toLowerCase().includes(q) ||
        d.beralamat.toLowerCase().includes(q) ||
        d.kota.toLowerCase().includes(q) ||
        d.kecamatan.toLowerCase().includes(q) ||
        d.kelurahanDesa.toLowerCase().includes(q) ||
        d.bangunanInduk.toLowerCase().includes(q) ||
        d.bermaksudUntuk.toLowerCase().includes(q)
      );
    });
  }, [state.docsIMB, searchQuery, locationFilter, deadlineFilter]);

  const filteredSLO = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (state.docsSLO || []).filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (deadlineFilter === 'DUE_30') {
        const evalRes = evaluateDateDeadline(d.tanggalBerlaku);
        if (evalRes.daysDiff < 0 || evalRes.daysDiff > 30) return false;
      } else if (deadlineFilter === 'OVERDUE') {
        const evalRes = evaluateDateDeadline(d.tanggalBerlaku);
        if (evalRes.daysDiff >= 0) return false;
      }
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.idSlo.toLowerCase().includes(q) ||
        d.noSlo.toLowerCase().includes(q) ||
        d.namaPerusahaan.toLowerCase().includes(q) ||
        d.lokasiInstalasi.toLowerCase().includes(q) ||
        d.alamatInstalasi.toLowerCase().includes(q) ||
        d.merekPeralatan.toLowerCase().includes(q) ||
        d.tipePeralatan.toLowerCase().includes(q) ||
        d.nomorSeri.toLowerCase().includes(q) ||
        d.lembagaInspeksi.toLowerCase().includes(q) ||
        d.nomorRegistrasi.toLowerCase().includes(q) ||
        d.pic.toLowerCase().includes(q)
      );
    });
  }, [state.docsSLO, searchQuery, locationFilter, deadlineFilter]);

  const filteredTimbangan = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (state.docsTimbangan || []).filter((d) => {
      if (locationFilter !== 'ALL' && d.arsipDokumenId !== locationFilter) return false;
      if (deadlineFilter === 'DUE_30') {
        const evalRes = evaluateDateDeadline(d.berlakuSampai);
        if (evalRes.daysDiff < 0 || evalRes.daysDiff > 30) return false;
      } else if (deadlineFilter === 'OVERDUE') {
        const evalRes = evaluateDateDeadline(d.berlakuSampai);
        if (evalRes.daysDiff >= 0) return false;
      }
      if (!q) return true;
      return (
        d.noArsip.toLowerCase().includes(q) ||
        d.idPengujian.toLowerCase().includes(q) ||
        d.nomorSuratPengujian.toLowerCase().includes(q) ||
        (d.nomorOrder && d.nomorOrder.toLowerCase().includes(q)) ||
        d.namaAlatUkur.toLowerCase().includes(q) ||
        d.merekPabrikBuatan.toLowerCase().includes(q) ||
        d.modelTipe.toLowerCase().includes(q) ||
        d.nomorSeriIdentitas.toLowerCase().includes(q) ||
        d.pemilikPemakai.toLowerCase().includes(q) ||
        d.alamatPemilik.toLowerCase().includes(q) ||
        d.instansiPenerbit.toLowerCase().includes(q) ||
        (d.unitInstansi && d.unitInstansi.toLowerCase().includes(q)) ||
        (d.nomorSkKkpttuUutp && d.nomorSkKkpttuUutp.toLowerCase().includes(q)) ||
        d.tempatPenerbitan.toLowerCase().includes(q) ||
        d.statusDokumen.toLowerCase().includes(q) ||
        d.statusMasaBerlaku.toLowerCase().includes(q)
      );
    });
  }, [state.docsTimbangan, searchQuery, locationFilter, deadlineFilter]);

  const categoryTitles: Record<DocModuleCategory, { title: string; subtitle: string }> = {
    'doc-enop': {
      title: 'Arsip Dokumen Bukti Bayar PBB',
      subtitle:
        'Pencatatan Bukti Bayar PBB dengan mengambil Nomor Objek Pajak (NOP), Nama Wajib Pajak, dan Alamat Wajib Pajak dari E-SPPT serta Provinsi/Kota dan Status Bayar.',
    },
    'doc-esppt': {
      title: 'Arsip Dokumen E-SPPT',
      subtitle:
        'Pencatatan Surat Pemberitahuan Pajak Terhutang dengan pengisian manual Nomor Objek Pajak (NOP / E-NOP), Nama & Alamat Wajib Pajak terpisah, Tanggal Jatuh Tempo, dan Lokasi Arsip.',
    },
    'doc-merk': {
      title: 'Arsip Dokumen Sertifikat Merk',
      subtitle:
        'Pencatatan Sertifikat Merk Terdaftar (No Pendaftaran, Etiket Merk, No Permohonan, Kelas Barang/Jasa, Uraian Warna, dan Lokasi Arsip).',
    },
    'doc-k3': {
      title: 'Arsip Dokumen Sertifikat K3',
      subtitle:
        'Pencatatan Kelayakan Keselamatan & Kesehatan Kerja (Objek K3, Spesifikasi Unit, Pabrik Pembuat, No Seri, Kapasitas, Tanggal Pemeriksaan & Masa Berlaku).',
    },
    'doc-tanah': {
      title: 'Arsip Dokumen E-Sertifikat Tanah',
      subtitle:
        'Pencatatan Sertifikat Tanah BPN (Jenis Hak SHM/HGB/HGU, NIB 14 Digit, Data Pemegang Hak & NIK 16 Digit, Lokasi Bertingkat Provinsi s/d Kelurahan, Surat Ukur, Koordinat, & Legalitas).',
    },
    'doc-imb': {
      title: 'Arsip Dokumen E-IMB',
      subtitle:
        'Pencatatan Surat Keputusan Izin Mendirikan Bangunan (No Keputusan, Tahun, Atas Nama, Tgl Permohonan IMB, Pemohon, Provinsi/Kota/Kecamatan/Kelurahan, Lokasi Bangunan, Bangunan Induk, & Maksud Pembangunan).',
    },
    'doc-slo': {
      title: 'Arsip Sertifikat Laik Operasi (SLO)',
      subtitle:
        'Pencatatan legalitas kelaikan instalasi ketenagalistrikan & genset (28 parameter: No. SLO, Tanggal Berlaku, Status, Spesifikasi Daya/Kapasitas, Lembaga Inspeksi Teknik LIT, Registrasi, dan Berkas Digital).',
    },
    'doc-timbangan': {
      title: 'Arsip Dokumen Uji Timbangan (Metrologi Legal & Tera UTTP)',
      subtitle:
        'Pencatatan Surat Keterangan Hasil Pengujian (SKHP) dan tera ulang timbangan elektronik & timbangan jembatan (kapasitas, daya baca, interval skala terkecil & verifikasi, kelas keakurasian, SK KKPTTU UTTP, dan masa berlaku pengujian).',
    },
  };

  return (
    <div className="space-y-6">
      {/* Category Header & Module Switcher */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {categoryTitles[docCategory].title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {categoryTitles[docCategory].subtitle}
          </p>
        </div>

        {/* Category Tabs (Urutan Menu Dokumen Arsip) */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/80 p-1">
          {/* 1. E-SPPT */}
          <button
            type="button"
            onClick={() => onSwitchCategory('doc-esppt')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              docCategory === 'doc-esppt'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            E-SPPT ({state.docsESPPT.length})
          </button>

          {/* 2. Bukti Bayar PBB */}
          <button
            type="button"
            onClick={() => onSwitchCategory('doc-enop')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              docCategory === 'doc-enop'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bukti Bayar PBB ({state.docsENOP.length})
          </button>

          {/* 3. E-IMB */}
          <button
            type="button"
            onClick={() => onSwitchCategory('doc-imb')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              docCategory === 'doc-imb'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            E-IMB ({state.docsIMB.length})
          </button>

          {/* 4. E-Sertifikat Tanah */}
          <button
            type="button"
            onClick={() => onSwitchCategory('doc-tanah')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              docCategory === 'doc-tanah'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            E-Sertifikat Tanah ({state.docsTanah.length})
          </button>

          {/* 5. Sertifikat Merk */}
          <button
            type="button"
            onClick={() => onSwitchCategory('doc-merk')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              docCategory === 'doc-merk'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sertifikat Merk ({state.docsMerk.length})
          </button>

          {/* 6. Sertifikat K3 */}
          <button
            type="button"
            onClick={() => onSwitchCategory('doc-k3')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              docCategory === 'doc-k3'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sertifikat K3 ({state.docsK3.length})
          </button>

          {/* 7. Sertifikat Laik Operasi (SLO) */}
          <button
            type="button"
            onClick={() => onSwitchCategory('doc-slo')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              docCategory === 'doc-slo'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-3 w-3 text-amber-500 shrink-0" />
            SLO ({state.docsSLO?.length || 0})
          </button>

          {/* 8. Uji Timbangan (Metrologi Legal & Tera) */}
          <button
            type="button"
            onClick={() => onSwitchCategory('doc-timbangan')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              docCategory === 'doc-timbangan'
                ? 'bg-white text-cyan-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="h-3 w-3 text-cyan-500 shrink-0" />
            Uji Timbangan ({state.docsTimbangan?.length || 0})
          </button>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 xl:flex-row xl:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No Arsip, NOP, NIB, Nama..."
              className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">Semua Lokasi Arsip</option>
              {state.masterLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.namaLokasi}
                </option>
              ))}
            </select>
          </div>

          {/* 30-Day Deadline Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value as any)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium focus:outline-none transition-colors ${
                deadlineFilter === 'DUE_30'
                  ? 'border-amber-400 bg-amber-50 text-amber-900 font-semibold'
                  : deadlineFilter === 'OVERDUE'
                  ? 'border-rose-400 bg-rose-50 text-rose-900 font-semibold'
                  : 'border-slate-300 bg-white text-slate-700 focus:border-blue-600'
              }`}
            >
              <option value="ALL">Semua Batas Waktu</option>
              <option value="DUE_30">
                ⏱️ Jatuh Tempo ≤ 30 Hari ({currentCategoryDueCount})
              </option>
              <option value="OVERDUE">⚠️ Lewat Jatuh Tempo (Overdue)</option>
            </select>
          </div>

          {/* Quick 1-Click Toggle for 30-Day Deadline */}
          <button
            type="button"
            onClick={() =>
              setDeadlineFilter((prev) => (prev === 'DUE_30' ? 'ALL' : 'DUE_30'))
            }
            title="Filter hanya dokumen yang memiliki tanggal jatuh tempo dalam 30 hari ke depan"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              deadlineFilter === 'DUE_30'
                ? 'border-amber-500 bg-amber-100 text-amber-950 shadow-xs ring-2 ring-amber-400/50'
                : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900'
            }`}
          >
            <Clock
              className={`h-3.5 w-3.5 ${
                deadlineFilter === 'DUE_30' ? 'text-amber-700' : 'text-slate-500'
              }`}
            />
            <span>≤ 30 Hari</span>
            {currentCategoryDueCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  deadlineFilter === 'DUE_30'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {currentCategoryDueCount}
              </span>
            )}
          </button>

          {/* Reset button if any filter is active */}
          {(deadlineFilter !== 'ALL' || locationFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setDeadlineFilter('ALL');
                setLocationFilter('ALL');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              title="Reset semua filter pencarian dan batas waktu"
            >
              <X className="h-3 w-3" />
              Reset Filter
            </button>
          )}
        </div>

        {canWriteDocs && (
          <button
            type="button"
            onClick={() => (isFormOpen ? setIsFormOpen(false) : openNewForm())}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            {isFormOpen ? (
              <>
                <X className="h-3.5 w-3.5" />
                Tutup Formulir
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Tambah Dokumen Baru
              </>
            )}
          </button>
        )}
      </div>

      {/* COLLAPSIBLE FORM PANEL */}
      {isFormOpen && (
        <div className="overflow-hidden rounded-xl border border-blue-300 bg-white shadow-md">
          <div
            className="flex items-center justify-between px-6 py-4 text-white"
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #172554 100%)',
            }}
          >
            <div>
              <h2 className="text-base font-bold text-white">
                {editingId ? 'Ubah Data Arsip Dokumen' : 'Formulir Input Dokumen Baru'} —{' '}
                {categoryTitles[docCategory].title}
              </h2>
              <p className="mt-0.5 text-xs text-blue-200">
                Setiap kelompok bidang input (Field) diberi warna berbeda untuk mempermudah pengisian data.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5 p-6">
            {/* Common Top Row: No Arsip & Arsip Dokumen (Lokasi Master) */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-amber-300 bg-amber-50/75 p-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-amber-950">
                  No Arsip (Otomatis & Dapat Diedit) <span className="text-rose-600">*</span>
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    required
                    value={noArsip}
                    onChange={(e) => setNoArsip(e.target.value)}
                    placeholder="Contoh: ARS/TNH/2026/001"
                    className="flex-1 rounded-lg border border-amber-400 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNoArsip(generateAutoNoArsipForCurrentCategory())}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-400 bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-200 whitespace-nowrap shrink-0"
                    title="Buat ulang nomor urut otomatis"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset Otomatis
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-950">
                  Arsip Dokumen (Tempat Menyimpan Dokumen Asli - Data Master){' '}
                  <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={arsipDokumenId}
                  onChange={(e) => setArsipDokumenId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                >
                  {state.masterLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.namaLokasi} — PIC: {loc.penanggungJawab} ({loc.lokasi})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CATEGORY 1 FIELDS: E-NOP (Mengambil NOP, Nama Wajib Pajak, dan Alamat dari E-SPPT) */}
            {docCategory === 'doc-enop' && (
              <div className="space-y-4">
                {/* Bagian 1: Referensi NOP, Nama Wajib Pajak & Alamat dari E-SPPT */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <h3 className="text-xs font-bold text-emerald-950">
                    01. Referensi NOP, Nama Wajib Pajak & Alamat (Diambil dari Dokumen E-SPPT)
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-emerald-950">
                        Pilih NOP (Mengambil dari Dokumen E-SPPT){' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      {state.docsESPPT.length > 0 ? (
                        <select
                          required
                          value={enopEspptId}
                          onChange={(e) => handleSelectESPPTForENOP(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                        >
                          <option value="">-- Pilih NOP dari Data E-SPPT --</option>
                          {state.docsESPPT.map((sppt) => (
                            <option key={sppt.id} value={sppt.id}>
                              {sppt.nop} — {sppt.namaWajibPajak || sppt.namaAlamatWajibPajak} (Tahun {sppt.tahun})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          Belum ada data E-SPPT. Silakan tambahkan dokumen di menu E-SPPT terlebih dahulu atau ketik NOP di kolom sebelah kanan.
                        </div>
                      )}
                      <p className="mt-1 text-[11px] text-emerald-800/80">
                        Saat memilih NOP dari E-SPPT, kolom NOP, Nama Wajib Pajak, Alamat Wajib Pajak, Tahun, dan Lokasi Objek otomatis terisi.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-950">
                        NOP (Nomor Objek Pajak) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enopNop}
                        onChange={(e) => setEnopNop(e.target.value)}
                        placeholder="Otomatis dari E-SPPT..."
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-950">
                        Nama Wajib Pajak (Dari E-SPPT) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enopNamaWajibPajak}
                        onChange={(e) => setEnopNamaWajibPajak(e.target.value)}
                        placeholder="Nama Wajib Pajak sesuai E-SPPT..."
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-emerald-950">
                        Alamat Wajib Pajak (Dari E-SPPT) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enopAlamatWajibPajak}
                        onChange={(e) => setEnopAlamatWajibPajak(e.target.value)}
                        placeholder="Alamat Wajib Pajak sesuai E-SPPT..."
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Detail Transaksi, Wilayah & Status Bayar E-NOP */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/45 p-4">
                  <h3 className="text-xs font-bold text-blue-950">
                    02. Rincian Transaksi, Wilayah Administratif & Status Pembayaran E-NOP
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Nama NOP / Objek Pajak <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enopNamaNop}
                        onChange={(e) => setEnopNamaNop(e.target.value)}
                        placeholder="Contoh: Gedung Kantor Pusat PT Kusuka"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Tahun Pajak <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enopTahunPajak}
                        onChange={(e) => setEnopTahunPajak(e.target.value)}
                        placeholder="2026"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Tanggal Transaksi <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={enopTanggalTransaksi}
                        onChange={(e) => setEnopTanggalTransaksi(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Provinsi (Data Master) <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={enopProvinsiId}
                        onChange={(e) => handleProvinceChangeInENOP(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {state.masterProvinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.namaProvinsi}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Kota/Kabupaten (Sesuai Data Master Provinsi){' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={enopKotaKabupaten}
                        onChange={(e) => setEnopKotaKabupaten(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {availableKotaForSelectedProvinsi.map((kota) => (
                          <option key={kota} value={kota}>
                            {kota}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Status Bayar (Data Master) <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={enopStatusBayarId}
                        onChange={(e) => setEnopStatusBayarId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {state.masterStatuses.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.namaStatus}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700">
                        Lokasi Alamat Objek Pajak <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enopLokasiAlamat}
                        onChange={(e) => setEnopLokasiAlamat(e.target.value)}
                        placeholder="Alamat lengkap objek pajak sesuai E-SPPT / NOP..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 2 FIELDS: E-SPPT */}
            {docCategory === 'doc-esppt' && (
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-emerald-50/45 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-emerald-950">
                    NOP / E-NOP (Diisi Manual) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={espptNop}
                    onChange={(e) => setEspptNop(e.target.value)}
                    placeholder="Masukkan Nomor Objek Pajak (NOP) secara manual, contoh: 31.74.040.003.012-0145.0"
                    className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-emerald-800/80">
                    Nomor Objek Pajak (NOP / E-NOP) diisi secara manual sesuai dokumen SPPT PBB.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-950">
                    Tahun SPPT <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={espptTahun}
                    onChange={(e) => setEspptTahun(e.target.value)}
                    placeholder="2026"
                    className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-emerald-950">
                    Letak Objek Pajak <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={espptLetakObjekPajak}
                    onChange={(e) => setEspptLetakObjekPajak(e.target.value)}
                    placeholder="Alamat letak objek pajak..."
                    className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-950">
                    Jatuh Tempo Pembayaran <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={espptJatuhTempo}
                    onChange={(e) => setEspptJatuhTempo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-950">
                    Nama Wajib Pajak <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={espptNamaWajibPajak}
                    onChange={(e) => setEspptNamaWajibPajak(e.target.value)}
                    placeholder="Contoh: PT Kusuka Prima Indonesia"
                    className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-emerald-950">
                    Alamat Wajib Pajak <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={espptAlamatWajibPajak}
                    onChange={(e) => setEspptAlamatWajibPajak(e.target.value)}
                    placeholder="Contoh: Jl. TB Simatupang Kav. 88, Pasar Minggu, Jakarta Selatan"
                    className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* CATEGORY 3 FIELDS: SERTIFIKAT MERK */}
            {docCategory === 'doc-merk' && (
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-indigo-200 bg-indigo-50/45 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Pemilik Merk <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={merkNama}
                    onChange={(e) => setMerkNama(e.target.value)}
                    placeholder="Contoh: PT Kusuka Prima Indonesia"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Alamat Pemilik Merk <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={merkAlamat}
                    onChange={(e) => setMerkAlamat(e.target.value)}
                    placeholder="Alamat lengkap pemilik merk..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    No Pendaftaran <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={merkNoPendaftaran}
                    onChange={(e) => setMerkNoPendaftaran(e.target.value)}
                    placeholder="Contoh: IDM001148921"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanggal Penerimaan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={merkTanggalPenerimaan}
                    onChange={(e) => setMerkTanggalPenerimaan(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    No Permohonan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={merkNoPermohonan}
                    onChange={(e) => setMerkNoPermohonan(e.target.value)}
                    placeholder="Contoh: DID2024089124"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanggal Pengajuan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={merkTanggalPengajuan}
                    onChange={(e) => setMerkTanggalPengajuan(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Tgl Jatuh Tempo Kepemilikan Merk <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={merkTglJatuhTempo}
                    onChange={(e) => setMerkTglJatuhTempo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Batas akhir perlindungan 10 tahun / jadwal perpanjangan merk DJKI.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Etiket Merk (Nama / Label Merk) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={merkEtiketMerk}
                    onChange={(e) => setMerkEtiketMerk(e.target.value)}
                    placeholder="Contoh: KUSUKA PRIMA + Lukisan Logo"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Gambar Visual Etiket Merk (Opsional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEtiketImageUpload}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-slate-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kelas Barang / Jasa <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={merkKelasBarangJasa}
                    onChange={(e) => setMerkKelasBarangJasa(e.target.value)}
                    placeholder="Contoh: Kelas 29 & Kelas 30 (Makanan Olahan & Camilan)"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Uraian Warna <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={merkUraianWarna}
                    onChange={(e) => setMerkUraianWarna(e.target.value)}
                    placeholder="Contoh: Biru Tua, Biru Muda, Putih"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* CATEGORY 4 FIELDS: SERTIFIKAT K3 */}
            {docCategory === 'doc-k3' && (
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-amber-200 bg-amber-50/45 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Jenis Objek K3 <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3JenisObjek}
                    onChange={(e) => setK3JenisObjek(e.target.value)}
                    placeholder="Contoh: Pesawat Angkat & Angkut / Pesawat Uap & Bejana Tekan"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Perusahaan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3NamaPerusahaan}
                    onChange={(e) => setK3NamaPerusahaan(e.target.value)}
                    placeholder="PT Kusuka Prima Indonesia"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Pemilik <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3NamaPemilik}
                    onChange={(e) => setK3NamaPemilik(e.target.value)}
                    placeholder="PT Kusuka Prima Indonesia"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Alamat Perusahaan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3Alamat}
                    onChange={(e) => setK3Alamat(e.target.value)}
                    placeholder="Alamat lengkap perusahaan..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Lokasi Unit <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3LokasiUnit}
                    onChange={(e) => setK3LokasiUnit(e.target.value)}
                    placeholder="Contoh: Gudang Bahan Baku Utama - Loading Dock B"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Jenis Alat / Pesawat <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3Jenis}
                    onChange={(e) => setK3Jenis(e.target.value)}
                    placeholder="Contoh: Forklift Counterbalance"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Merk <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3Merk}
                    onChange={(e) => setK3Merk(e.target.value)}
                    placeholder="Contoh: Toyota Industrial"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Type <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3Type}
                    onChange={(e) => setK3Type(e.target.value)}
                    placeholder="Contoh: 8FD30"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    No Seri <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3NoSeri}
                    onChange={(e) => setK3NoSeri(e.target.value)}
                    placeholder="Contoh: TYT-8FD30-99412"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Perusahaan Pembuat <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3PerusahaanPembuat}
                    onChange={(e) => setK3PerusahaanPembuat(e.target.value)}
                    placeholder="Contoh: Toyota Industries Corp."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Tempat Pembuatan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3TempatPembuatan}
                    onChange={(e) => setK3TempatPembuatan(e.target.value)}
                    placeholder="Contoh: Nagoya, Jepang"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Tahun Buat <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3TahunBuat}
                    onChange={(e) => setK3TahunBuat(e.target.value)}
                    placeholder="2024"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Kapasitas <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={k3Kapasitas}
                    onChange={(e) => setK3Kapasitas(e.target.value)}
                    placeholder="Contoh: 3.000 Kg (3 Ton)"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanggal Pemeriksaan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={k3TanggalPemeriksaan}
                    onChange={(e) => setK3TanggalPemeriksaan(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Berlaku Sampai Tanggal <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={k3BerlakuSampai}
                    onChange={(e) => setK3BerlakuSampai(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* CATEGORY 5 FIELDS: E-SERTIFIKAT TANAH (5 STRUCTURED SECTIONS) */}
            {docCategory === 'doc-tanah' && (
              <div className="space-y-5">
                {/* 1. Data Umum & Jenis Hak */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <h3 className="text-xs font-bold text-blue-950">
                    01. Data Umum & Jenis Hak Sertifikat Tanah
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        Jenis Hak <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tanahJenisHak}
                        onChange={(e) =>
                          setTanahJenisHak(e.target.value as JenisHakTanah)
                        }
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      >
                        {JENIS_HAK_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        Nomor Sertifikat <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahNomorSertifikat}
                        onChange={(e) => setTanahNomorSertifikat(e.target.value)}
                        placeholder="Contoh: 01.02.03.04.1.01234"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-blue-950">
                          Nomor Identifikasi Bidang (NIB){' '}
                          <span className="text-rose-600">*</span>
                        </label>
                        <span className="font-mono text-[10px] text-blue-700 tabular-nums">
                          {tanahNib.length}/14 digit
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={14}
                        value={tanahNib}
                        onChange={(e) =>
                          setTanahNib(e.target.value.replace(/\D/g, '').slice(0, 14))
                        }
                        placeholder="14 digit angka NIB BPN"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        Asal Hak <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tanahAsalHak}
                        onChange={(e) =>
                          setTanahAsalHak(e.target.value as AsalHakTanah)
                        }
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      >
                        {ASAL_HAK_OPTIONS.map((asal) => (
                          <option key={asal} value={asal}>
                            {asal}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Data Pemegang Hak (Pemilik) */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <h3 className="text-xs font-bold text-emerald-950">
                    02. Data Pemegang Hak (Pemilik Sesuai KTP / Akta)
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Nama Pemegang Hak <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahNamaPemegangHak}
                        onChange={(e) => setTanahNamaPemegangHak(e.target.value)}
                        placeholder="Nama lengkap sesuai KTP / Sertifikat"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          NIK / No. Identitas <span className="text-rose-600">*</span>
                        </label>
                        <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                          {tanahNikPemilik.length}/16 digit
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        value={tanahNikPemilik}
                        onChange={(e) =>
                          setTanahNikPemilik(
                            e.target.value.replace(/\D/g, '').slice(0, 16)
                          )
                        }
                        placeholder="16 digit NIK KTP"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Tanggal Lahir Pemilik <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tanahTanggalLahirPemilik}
                        onChange={(e) => setTanahTanggalLahirPemilik(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700">
                        Alamat Pemilik (Domisili) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahAlamatPemilik}
                        onChange={(e) => setTanahAlamatPemilik(e.target.value)}
                        placeholder="Alamat lengkap domisili pemegang hak..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Letak & Lokasi Tanah (Cascading Provinsi -> Kota/Kab -> Kecamatan -> Kelurahan) */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <h3 className="text-xs font-bold text-indigo-950">
                    03. Letak & Lokasi Tanah (Data Administratif Bertingkat)
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Provinsi <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tanahProvinsiId}
                        onChange={(e) => handleTanahProvinceChange(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {state.masterProvinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.namaProvinsi}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Kabupaten / Kota <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tanahKotaKabupaten}
                        onChange={(e) => handleTanahKotaChange(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {tanahKotaOptions.map((kota) => (
                          <option key={kota} value={kota}>
                            {kota}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Kecamatan <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tanahKecamatan}
                        onChange={(e) => handleTanahKecamatanChange(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {tanahKecamatanOptions.map((kec) => (
                          <option key={kec} value={kec}>
                            {kec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Desa / Kelurahan <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tanahDesaKelurahan}
                        onChange={(e) => setTanahDesaKelurahan(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {tanahDesaOptions.map((desa) => (
                          <option key={desa} value={desa}>
                            {desa}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-700">
                        Alamat Detail / Blok / RT / RW <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahAlamatDetail}
                        onChange={(e) => setTanahAlamatDetail(e.target.value)}
                        placeholder="Contoh: Jl. TB Simatupang Kav. 88 Blok A No. 1, RT 004 / RW 002"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Data Fisik & Geografis (Surat Ukur) */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <h3 className="text-xs font-bold text-amber-950">
                    04. Data Fisik & Geografis (Surat Ukur & Batas Bidang Tanah)
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Nomor Surat Ukur (SU) / GS <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahNomorSuratUkur}
                        onChange={(e) => setTanahNomorSuratUkur(e.target.value)}
                        placeholder="Contoh: 00123/Bogor/2026"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Luas Tanah (m²) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={tanahLuasTanah}
                        onChange={(e) => setTanahLuasTanah(e.target.value)}
                        placeholder="Contoh: 4250"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Titik Koordinat Geografis (Latitude, Longitude){' '}
                          <span className="text-rose-600">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const sampleCoords = [
                              '-6.299840, 106.829610',
                              '-6.318450, 107.149220',
                              '-6.597147, 106.806039',
                              '-7.257472, 112.752088',
                            ];
                            const next =
                              sampleCoords[
                                Math.floor(Math.random() * sampleCoords.length)
                              ];
                            setTanahTitikKoordinat(next);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          Ambil Titik Peta
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={tanahTitikKoordinat}
                        onChange={(e) => setTanahTitikKoordinat(e.target.value)}
                        placeholder="Contoh: -6.299840, 106.829610"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Batas Utara <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahBatasUtara}
                        onChange={(e) => setTanahBatasUtara(e.target.value)}
                        placeholder="Batas sebelah Utara..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Batas Timur <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahBatasTimur}
                        onChange={(e) => setTanahBatasTimur(e.target.value)}
                        placeholder="Batas sebelah Timur..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Batas Selatan <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahBatasSelatan}
                        onChange={(e) => setTanahBatasSelatan(e.target.value)}
                        placeholder="Batas sebelah Selatan..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Batas Barat <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahBatasBarat}
                        onChange={(e) => setTanahBatasBarat(e.target.value)}
                        placeholder="Batas sebelah Barat..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Legalitas & Catatan Hukum */}
                <div className="rounded-xl border border-sky-200 bg-sky-50/55 p-4">
                  <h3 className="text-xs font-bold text-sky-950">
                    05. Legalitas & Catatan Hukum (BPN & Status Agunan)
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Kantor Pertanahan Penerbit (BPN){' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tanahKantorPertanahan}
                        onChange={(e) => setTanahKantorPertanahan(e.target.value)}
                        placeholder="Contoh: Kantor Pertanahan Kota Bogor"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Tanggal Penerbitan <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tanahTanggalPenerbitan}
                        onChange={(e) => setTanahTanggalPenerbitan(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Status Beban / Agunan <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tanahStatusBeban}
                        onChange={(e) =>
                          setTanahStatusBeban(e.target.value as StatusBebanTanah)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {STATUS_BEBAN_TANAH_OPTIONS.map((sb) => (
                          <option key={sb} value={sb}>
                            {sb}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-700">
                        Status Dokumen Sertifikat <span className="text-rose-600">*</span>
                      </label>
                      <div className="mt-1.5 flex flex-wrap gap-4">
                        {STATUS_DOKUMEN_TANAH_OPTIONS.map((sd) => (
                          <label
                            key={sd}
                            className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-800"
                          >
                            <input
                              type="radio"
                              name="statusDokumenTanah"
                              checked={tanahStatusDokumen === sd}
                              onChange={() => setTanahStatusDokumen(sd)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{sd}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================== */}
            {/* CATEGORY 6: E-IMB                                     */}
            {/* ===================================================== */}
            {docCategory === 'doc-imb' && (
              <div className="space-y-5">
                {/* 1. Data Keputusan & Permohonan IMB */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <h3 className="text-xs font-bold text-blue-950">
                    01. Data Keputusan & Permohonan IMB
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-blue-950">
                        No Keputusan <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imbNoKeputusan}
                        onChange={(e) => setImbNoKeputusan(e.target.value)}
                        placeholder="Contoh: 503/0148/IMB-DPMPTSP/2025"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        Tahun <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imbTahun}
                        onChange={(e) => setImbTahun(e.target.value)}
                        placeholder="Contoh: 2025"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        Tgl Permohonan IMB <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={imbTglPermohonan}
                        onChange={(e) => setImbTglPermohonan(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-blue-950">
                        Atas Nama <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imbAtasNama}
                        onChange={(e) => setImbAtasNama(e.target.value)}
                        placeholder="Contoh: PT Kusuka Prima Nusantara"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-blue-950">
                        Lokasi Bangunan <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imbLokasiBangunan}
                        onChange={(e) => setImbLokasiBangunan(e.target.value)}
                        placeholder="Contoh: Jl. TB Simatupang Kav. 88, Cilandak Timur, Jakarta Selatan"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Identitas Pemohon & Wilayah Administratif Bangunan */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <h3 className="text-xs font-bold text-emerald-950">
                    02. Data Pemohon, Wilayah Administratif & Rincian Bangunan
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Nama <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imbNama}
                        onChange={(e) => setImbNama(e.target.value)}
                        placeholder="Contoh: Rendra Pratama (Direktur Operasional)"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Beralamat <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imbBeralamat}
                        onChange={(e) => setImbBeralamat(e.target.value)}
                        placeholder="Contoh: Jl. Kemang Raya No. 45, Mampang Prapatan, Jakarta Selatan"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Provinsi <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={imbProvinsiId}
                        onChange={(e) => handleImbProvinceChange(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {state.masterProvinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.namaProvinsi}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Kota / Kabupaten <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={imbKota}
                        onChange={(e) => handleImbKotaChange(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {imbKotaOptions.map((kota) => (
                          <option key={kota} value={kota}>
                            {kota}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Kecamatan <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={imbKecamatan}
                        onChange={(e) => handleImbKecamatanChange(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {imbKecamatanOptions.map((kec) => (
                          <option key={kec} value={kec}>
                            {kec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Kelurahan / Desa <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={imbKelurahanDesa}
                        onChange={(e) => setImbKelurahanDesa(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {imbKelurahanOptions.map((desa) => (
                          <option key={desa} value={desa}>
                            {desa}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Lokasi Bangunan (Detail / Persil / Blok){' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imbLokasiBangunanDetail}
                        onChange={(e) => setImbLokasiBangunanDetail(e.target.value)}
                        placeholder="Contoh: Kawasan Perkantoran Simatupang Kav. 88 Blok A-1, RT 004 / RW 002"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Bangunan Induk <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imbBangunanInduk}
                        onChange={(e) => setImbBangunanInduk(e.target.value)}
                        placeholder="Contoh: Gedung Kantor Pusat & Gudang Distribusi (8 Lantai)"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-700">
                        Bermaksud Untuk <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imbBermaksudUntuk}
                        onChange={(e) => setImbBermaksudUntuk(e.target.value)}
                        placeholder="Contoh: Mendirikan Bangunan Baru Gedung Kantor Pusat & Fasilitas Penunjang"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLO FORM FIELDS (28 STRUCTURED FIELDS) */}
            {docCategory === 'doc-slo' && (
              <div className="space-y-4">
                {/* 1. Identitas & Status Sertifikat SLO */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-blue-700" />
                      01. Identitas & Status Sertifikat Laik Operasi (SLO)
                    </h3>
                    <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded">
                      Standardisasi Ditjen Ketenagalistrikan ESDM
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        1. ID SLO (Nomor Identitas Data) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloIdSlo}
                        onChange={(e) => setSloIdSlo(e.target.value)}
                        placeholder="Contoh: SLO-2026-0001"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        2. Jenis SLO <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={sloJenis}
                        onChange={(e) => setSloJenis(e.target.value as JenisSLO)}
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      >
                        {JENIS_SLO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-blue-950">
                        3. No SLO (Nomor Sertifikat SLO) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloNo}
                        onChange={(e) => setSloNo(e.target.value)}
                        placeholder="Contoh: 540.2/0145/SLO-GENSET/DJK-ESDM/2026"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        4. Tanggal Terbit <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={sloTanggalTerbit}
                        onChange={(e) => setSloTanggalTerbit(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        5. Tanggal Berlaku (Jatuh Tempo) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={sloTanggalBerlaku}
                        onChange={(e) => setSloTanggalBerlaku(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                      {sloTanggalBerlaku && (
                        <div className="mt-1 text-[11px] font-medium text-blue-700">
                          {evaluateDateDeadline(sloTanggalBerlaku).label}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-blue-950">
                        6. Status SLO <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={sloStatus}
                        onChange={(e) => setSloStatus(e.target.value as StatusSLO)}
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      >
                        {STATUS_SLO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Kepemilikan & Lokasi Instalasi */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <h3 className="text-xs font-bold text-emerald-950">
                    02. Data Pemilik & Lokasi Instalasi
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-emerald-950">
                        7. Nama Perusahaan (Pemilik Instalasi) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloNamaPerusahaan}
                        onChange={(e) => setSloNamaPerusahaan(e.target.value)}
                        placeholder="Contoh: PT Kusuka Prima Nusantara"
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-950">
                        10. Jenis Instalasi <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={sloJenisInstalasi}
                        onChange={(e) => setSloJenisInstalasi(e.target.value as JenisInstalasiSLO)}
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      >
                        {JENIS_INSTALASI_SLO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-950">
                        8. Lokasi Instalasi <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloLokasiInstalasi}
                        onChange={(e) => setSloLokasiInstalasi(e.target.value)}
                        placeholder="Contoh: Ruang Power House Pabrik Utama Lt. 1"
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-950">
                        11. Sumber Energi <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={sloSumberEnergi}
                        onChange={(e) => setSloSumberEnergi(e.target.value as SumberEnergiSLO)}
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      >
                        {SUMBER_ENERGI_SLO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-950">
                        20. Nomor Penyedia (ID Pelanggan / IUPTLS)
                      </label>
                      <input
                        type="text"
                        value={sloNomorPenyedia}
                        onChange={(e) => setSloNomorPenyedia(e.target.value)}
                        placeholder="Contoh: IDPEL-PLN-54710088921"
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-emerald-950">
                        9. Alamat Instalasi (Alamat Lengkap) <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={sloAlamatInstalasi}
                        onChange={(e) => setSloAlamatInstalasi(e.target.value)}
                        placeholder="Contoh: Kawasan Industri Jababeka II Blok EE-4, Cikarang Selatan, Kabupaten Bekasi, Jawa Barat"
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Spesifikasi Teknis Peralatan */}
                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                  <h3 className="text-xs font-bold text-purple-950">
                    03. Spesifikasi Teknis Peralatan (Genset / Panel / Trafo)
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-purple-950">
                        12. Merek Peralatan <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloMerekPeralatan}
                        onChange={(e) => setSloMerekPeralatan(e.target.value)}
                        placeholder="Contoh: Cummins / Caterpillar / Schneider"
                        className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-950">
                        13. Tipe Peralatan <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloTipePeralatan}
                        onChange={(e) => setSloTipePeralatan(e.target.value)}
                        placeholder="Contoh: QSK60-G4 / SM6-24kV"
                        className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-purple-950">
                        14. Nomor Seri Peralatan <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloNomorSeri}
                        onChange={(e) => setSloNomorSeri(e.target.value)}
                        placeholder="Contoh: CUM-2024-88741"
                        className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-950">
                        15. Kapasitas Instalasi (kVA) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloKapasitasKva}
                        onChange={(e) => setSloKapasitasKva(e.target.value)}
                        placeholder="Contoh: 1250"
                        className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-950">
                        16. Daya Aktif (kW) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloDayaKw}
                        onChange={(e) => setSloDayaKw(e.target.value)}
                        placeholder="Contoh: 1000"
                        className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-950">
                        17. Tegangan Operasional (V) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloTeganganV}
                        onChange={(e) => setSloTeganganV(e.target.value)}
                        placeholder="Contoh: 380 / 400 V"
                        className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-950">
                        18. Fasa <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={sloFasa}
                        onChange={(e) => setSloFasa(e.target.value as FasaSLO)}
                        className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      >
                        {FASA_SLO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-950">
                        19. Frekuensi (Hz) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloFrekuensiHz}
                        onChange={(e) => setSloFrekuensiHz(e.target.value)}
                        placeholder="50"
                        className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Legalitas Inspeksi, PIC & Keterangan */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <h3 className="text-xs font-bold text-amber-950">
                    04. Legalitas Pemeriksaan & Penanggung Jawab
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-amber-950">
                        21. Lembaga Inspeksi Teknik (LIT) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloLembagaInspeksi}
                        onChange={(e) => setSloLembagaInspeksi(e.target.value)}
                        placeholder="Contoh: PT Konsuil Mandiri Pratama (LIT-TR) / PT Jasa Sertifikasi"
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-amber-950">
                        22. Nomor Registrasi Terkait <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloNomorRegistrasi}
                        onChange={(e) => setSloNomorRegistrasi(e.target.value)}
                        placeholder="Contoh: REG-DJK-ESDM-2025-09881"
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-amber-950">
                        25. PIC (Penanggung Jawab Instalasi) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sloPic}
                        onChange={(e) => setSloPic(e.target.value)}
                        placeholder="Contoh: Ir. Hendra Wijaya (Mgr. Utility & HSE)"
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-amber-950">
                        26. Keterangan (Catatan Tambahan)
                      </label>
                      <input
                        type="text"
                        value={sloKeterangan}
                        onChange={(e) => setSloKeterangan(e.target.value)}
                        placeholder="Contoh: Pengujian beban 100% lulus laik operasi dengan sistem ATS sinkron."
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Lampiran Berkas Pendukung Khusus SLO (Single Line Diagram / LHPP) */}
                <div className="rounded-xl border border-slate-300 bg-slate-50/80 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <label className="block text-xs font-bold text-slate-900">
                        24. File Pendukung (Dokumen Pendukung / LHPP / Single Line Diagram)
                      </label>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Unggah berkas teknis pendukung seperti Single Line Diagram (SLD) atau Laporan Pengujian LIT.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 whitespace-nowrap shrink-0">
                      <Upload className="h-3.5 w-3.5 text-emerald-600" />
                      Pilih Berkas Pendukung
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFilePendukungUploadChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {sloFilePendukung && (
                    <div className="mt-2.5 flex items-center justify-between rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold text-slate-900">{sloFilePendukung.name}</span>
                        <span className="font-mono text-slate-500">({formatFileSize(sloFilePendukung.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSloFilePendukung(undefined)}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Hapus Berkas Pendukung
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Fields: 8. Uji Timbangan (Metrologi Legal & Tera) */}
            {docCategory === 'doc-timbangan' && (
              <div className="space-y-5">
                {/* 1. Identitas & Status Pengujian */}
                <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-cyan-700" />
                      01. Identitas &amp; Status Pengujian Timbangan
                    </h3>
                    <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-100/80 px-2.5 py-0.5 rounded-full border border-cyan-200">
                      Metrologi Legal &amp; Tera UTTP
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-cyan-950">
                        1. ID Pengujian <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbIdPengujian}
                        onChange={(e) => setTmbIdPengujian(e.target.value)}
                        placeholder="Contoh: UTTP-TMB-2026-0001"
                        className="mt-1 w-full rounded-lg border border-cyan-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-cyan-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cyan-950">
                        2. Jenis Timbangan <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tmbJenisTimbangan}
                        onChange={(e) => setTmbJenisTimbangan(e.target.value as JenisTimbangan)}
                        className="mt-1 w-full rounded-lg border border-cyan-300 bg-white px-3 py-2 text-xs font-bold text-cyan-900 focus:border-cyan-700 focus:bg-[#FEFCE8] focus:outline-none"
                      >
                        {JENIS_TIMBANGAN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cyan-950">
                        3. Nomor Surat Pengujian (SKHP) <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbNomorSuratPengujian}
                        onChange={(e) => setTmbNomorSuratPengujian(e.target.value)}
                        placeholder="Contoh: 510.3/0842/SKHP-TJ/METROLOGI/2026"
                        className="mt-1 w-full rounded-lg border border-cyan-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-cyan-950">
                          4. Nomor Order
                        </label>
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          Timbangan Elektronik
                        </span>
                      </div>
                      <input
                        type="text"
                        value={tmbNomorOrder}
                        onChange={(e) => setTmbNomorOrder(e.target.value)}
                        placeholder="Contoh: ORD-MET-2026-0081"
                        className="mt-1 w-full rounded-lg border border-cyan-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-cyan-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cyan-950">
                        Status Dokumen <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tmbStatusDokumen}
                        onChange={(e) => setTmbStatusDokumen(e.target.value as StatusDokumenTimbangan)}
                        className="mt-1 w-full rounded-lg border border-cyan-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-cyan-700 focus:bg-[#FEFCE8] focus:outline-none"
                      >
                        {STATUS_DOKUMEN_TIMBANGAN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cyan-950">
                        Status Masa Berlaku <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={tmbStatusMasaBerlaku}
                        onChange={(e) => setTmbStatusMasaBerlaku(e.target.value as StatusMasaBerlakuTimbangan)}
                        className={`mt-1 w-full rounded-lg border border-cyan-300 px-3 py-2 text-xs font-bold focus:outline-none ${
                          tmbStatusMasaBerlaku === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-800'
                            : tmbStatusMasaBerlaku === 'SEGERA HABIS'
                            ? 'bg-amber-50 text-amber-800'
                            : tmbStatusMasaBerlaku === 'KADALUARSA'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-purple-50 text-purple-800'
                        }`}
                      >
                        {STATUS_MASA_BERLAKU_TIMBANGAN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Identitas Peralatan Alat Ukur */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <h3 className="text-xs font-bold text-blue-950">
                    02. Identitas Peralatan / Alat Ukur
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-blue-950">
                        5. Nama Alat Ukur <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbNamaAlatUkur}
                        onChange={(e) => setTmbNamaAlatUkur(e.target.value)}
                        placeholder="Contoh: Timbangan Jembatan Elektronik (Weighbridge) / Timbangan Meja Digital"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        6. Merek Pabrik Buatan <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbMerekPabrikBuatan}
                        onChange={(e) => setTmbMerekPabrikBuatan(e.target.value)}
                        placeholder="Contoh: Avery Weigh-Tronix / Mettler Toledo / CAS"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        7. Model / Tipe <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbModelTipe}
                        onChange={(e) => setTmbModelTipe(e.target.value)}
                        placeholder="Contoh: BridgeMont BMS-HD-1830 / BBA231"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-950">
                        8. Nomor Seri Identitas <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbNomorSeriIdentitas}
                        onChange={(e) => setTmbNomorSeriIdentitas(e.target.value)}
                        placeholder="Contoh: AWT-JKT-88419"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-blue-950">
                        14. Kelas Keakurasian <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbKelasKeakurasian}
                        onChange={(e) => setTmbKelasKeakurasian(e.target.value)}
                        placeholder="Contoh: Kelas III (Sedang) / Kelas II (Tinggi) / Kelas I (Khusus)"
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Parameter Teknis Kapasitas & Skala */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <h3 className="text-xs font-bold text-indigo-950">
                    03. Parameter Teknis Kapasitas, Daya Baca &amp; Skala
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-indigo-950">
                        9. Kapasitas Maksimum (Max - kg){' '}
                        <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbKapasitasMaksimumKg}
                        onChange={(e) => setTmbKapasitasMaksimumKg(e.target.value)}
                        placeholder="Contoh: 80000 (untuk 80 ton) atau 35"
                        className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-indigo-950">
                        10. Kapasitas Minimum (Min - kg){' '}
                        <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbKapasitasMinimumKg}
                        onChange={(e) => setTmbKapasitasMinimumKg(e.target.value)}
                        placeholder="Contoh: 400 atau 0.1"
                        className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className={tmbJenisTimbangan === 'ELEKTRONIK' ? 'ring-2 ring-indigo-400/60 rounded-lg p-1 bg-white' : ''}>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-indigo-950">
                          11. Daya Baca (kg)
                        </label>
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          Timbangan Elektronik
                        </span>
                      </div>
                      <input
                        type="text"
                        value={tmbDayaBacaKg}
                        onChange={(e) => setTmbDayaBacaKg(e.target.value)}
                        placeholder="Contoh: 0.001 kg (1 g) / 0.1 g"
                        className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className={tmbJenisTimbangan === 'JEMBATAN ELEKTRONIK' ? 'ring-2 ring-indigo-400/60 rounded-lg p-1 bg-white' : ''}>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-indigo-950">
                          12. Interval Skala Terkecil (d - kg)
                        </label>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Timbangan Jembatan
                        </span>
                      </div>
                      <input
                        type="text"
                        value={tmbIntervalSkalaTerkecilDKg}
                        onChange={(e) => setTmbIntervalSkalaTerkecilDKg(e.target.value)}
                        placeholder="Contoh: 20 kg atau 10 kg"
                        className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className={tmbJenisTimbangan === 'JEMBATAN ELEKTRONIK' ? 'ring-2 ring-indigo-400/60 rounded-lg p-1 bg-white' : ''}>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-indigo-950">
                          13. Interval Skala Verifikasi (e - kg)
                        </label>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Timbangan Jembatan
                        </span>
                      </div>
                      <input
                        type="text"
                        value={tmbIntervalSkalaVerifikasiEKg}
                        onChange={(e) => setTmbIntervalSkalaVerifikasiEKg(e.target.value)}
                        placeholder="Contoh: 20 kg atau 10 kg"
                        className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Pemilik & Instansi Penerbit */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <h3 className="text-xs font-bold text-emerald-950">
                    04. Data Pemilik &amp; Instansi Penerbit SKHP
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-emerald-950">
                        15. Pemilik / Pemakai <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbPemilikPemakai}
                        onChange={(e) => setTmbPemilikPemakai(e.target.value)}
                        placeholder="Contoh: PT Kusuka Prima Nusantara"
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-emerald-950">
                        17. Instansi Penerbit <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbInstansiPenerbit}
                        onChange={(e) => setTmbInstansiPenerbit(e.target.value)}
                        placeholder="Contoh: Dinas Perdagangan dan Perindustrian / Balai Standardisasi Metrologi Legal"
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-emerald-950">
                        16. Alamat Pemilik <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={tmbAlamatPemilik}
                        onChange={(e) => setTmbAlamatPemilik(e.target.value)}
                        placeholder="Contoh: Kawasan Industri Jababeka Tahap II Blok EE-4, Cikarang Selatan, Bekasi"
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-emerald-950">
                        18. Unit Instansi <span className="text-slate-400 font-normal">(Jika ada)</span>
                      </label>
                      <input
                        type="text"
                        value={tmbUnitInstansi}
                        onChange={(e) => setTmbUnitInstansi(e.target.value)}
                        placeholder="Contoh: UPTD Metrologi Legal Kabupaten Bekasi / UPT Metrologi DKI Jakarta"
                        className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Legalitas SK KKPTTU & Masa Berlaku */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <h3 className="text-xs font-bold text-amber-950">
                    05. Legalitas SK KKPTTU UTTP &amp; Masa Berlaku Pengujian
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className={tmbJenisTimbangan === 'JEMBATAN ELEKTRONIK' ? 'ring-2 ring-amber-400/60 rounded-lg p-1 bg-white' : ''}>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-amber-950">
                          19. Nomor SK KKPTTU UTTP
                        </label>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Timbangan Jembatan
                        </span>
                      </div>
                      <input
                        type="text"
                        value={tmbNomorSkKkpttuUutp}
                        onChange={(e) => setTmbNomorSkKkpttuUutp(e.target.value)}
                        placeholder="Contoh: SK.DIRJEN-PKTN/KKPTTU/148/2021"
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className={tmbJenisTimbangan === 'JEMBATAN ELEKTRONIK' ? 'ring-2 ring-amber-400/60 rounded-lg p-1 bg-white' : ''}>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-amber-950">
                          20. Tanggal SK KKPTTU UTTP
                        </label>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Timbangan Jembatan
                        </span>
                      </div>
                      <input
                        type="date"
                        value={tmbTanggalSkKkpttuUutp}
                        onChange={(e) => setTmbTanggalSkKkpttuUutp(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-950">
                        21. Tanggal Terbit Surat <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tmbTanggalTerbitSurat}
                        onChange={(e) => setTmbTanggalTerbitSurat(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-950">
                        22. Tempat Penerbitan <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tmbTempatPenerbitan}
                        onChange={(e) => setTmbTempatPenerbitan(e.target.value)}
                        placeholder="Contoh: Bekasi / Jakarta / Bandung"
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-amber-950">
                        23. Berlaku Sampai (Tanggal Jatuh Tempo Tera Ulang){' '}
                        <span className="text-slate-400 font-normal">(Keduanya)</span>{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tmbBerlakuSampai}
                        onChange={(e) => setTmbBerlakuSampai(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs font-bold text-amber-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-amber-800">
                        Terintegrasi ke filter jatuh tempo 30 hari &amp; email reminder metrologi tera ulang.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Berkas Pendukung & Keterangan */}
                <div className="rounded-xl border border-slate-300 bg-slate-50/80 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <label className="block text-xs font-bold text-slate-900">
                        Berkas Pendukung (Cerapan Pengujian / Dokumen SK KKPTTU)
                      </label>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Unggah salinan cerapan hasil uji toleransi timbangan atau dokumen SK penetapan tipe.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 whitespace-nowrap shrink-0">
                      <Upload className="h-3.5 w-3.5 text-cyan-600" />
                      Pilih Berkas Pendukung
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleTmbFilePendukungUploadChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {tmbFilePendukung && (
                    <div className="mt-2.5 flex items-center justify-between rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-cyan-600" />
                        <span className="font-semibold text-slate-900">{tmbFilePendukung.name}</span>
                        <span className="font-mono text-slate-500">({formatFileSize(tmbFilePendukung.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTmbFilePendukung(undefined)}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Hapus Berkas Pendukung
                      </button>
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-800">
                      Keterangan Tambahan / Hasil Pengujian
                    </label>
                    <textarea
                      rows={2}
                      value={tmbKeterangan}
                      onChange={(e) => setTmbKeterangan(e.target.value)}
                      placeholder="Catatan hasil tera ulang, kondisi segel metrologi, penempatan timbangan, atau jadwal kalibrasi internal..."
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-[#FEFCE8] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* File Attachment Upload Section */}
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-800">
                    Upload File Dokumen Digital (PDF / Gambar Scan Sertifikat Asli)
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Unggah salinan berkas untuk pratinjau langsung di aplikasi.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 whitespace-nowrap shrink-0">
                  <Upload className="h-3.5 w-3.5 text-blue-600" />
                  Pilih File dari Perangkat
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileUploadChange}
                    className="hidden"
                  />
                </label>
              </div>

              {fileAttachment && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-slate-900">
                      {fileAttachment.name}
                    </span>
                    <span className="font-mono text-slate-500">
                      ({formatFileSize(fileAttachment.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFileAttachment(undefined)}
                    className="text-rose-600 hover:underline"
                  >
                    Hapus Lampiran
                  </button>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2 text-xs font-medium text-white hover:bg-blue-800"
              >
                <Check className="h-3.5 w-3.5" />
                {editingId ? 'Simpan Perubahan Dokumen' : 'Simpan ke Arsip Dokumen'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deadline Filter Alert Banner */}
      {deadlineFilter === 'DUE_30' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/80 text-amber-800 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-amber-950">
                Filter Aktif: Dokumen Jatuh Tempo dalam 30 Hari ke Depan
              </div>
              <div className="text-[11px] text-amber-800">
                Menampilkan hanya dokumen yang mendekati batas waktu jatuh tempo untuk memudahkan pemantauan dan tindak lanjut.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeadlineFilter('ALL')}
            className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 transition-colors hover:bg-amber-100 whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" />
            Tampilkan Semua Dokumen
          </button>
        </div>
      )}

      {deadlineFilter === 'OVERDUE' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50/90 p-4 text-xs text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-200/80 text-rose-800 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-rose-950">
                Filter Aktif: Dokumen Lewat Tanggal Jatuh Tempo (Overdue)
              </div>
              <div className="text-[11px] text-rose-800">
                Menampilkan dokumen yang telah melampaui tanggal jatuh tempo/masa berlaku.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeadlineFilter('ALL')}
            className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-semibold text-rose-900 transition-colors hover:bg-rose-100 whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" />
            Tampilkan Semua Dokumen
          </button>
        </div>
      )}

      {/* DATA TABLES BY ACTIVE CATEGORY */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {/* TABLE 1: E-NOP */}
        {docCategory === 'doc-enop' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">No Arsip</th>
                  <th className="px-4 py-2.5 font-semibold">Tgl Transaksi</th>
                  <th className="px-4 py-2.5 font-semibold">NOP (Dari E-SPPT)</th>
                  <th className="px-4 py-2.5 font-semibold">Nama Wajib Pajak</th>
                  <th className="px-4 py-2.5 font-semibold">Alamat Wajib Pajak</th>
                  <th className="px-4 py-2.5 font-semibold">Tahun</th>
                  <th className="px-4 py-2.5 font-semibold">Provinsi & Kota/Kab</th>
                  <th className="px-4 py-2.5 font-semibold">Status Bayar</th>
                  <th className="px-4 py-2.5 font-semibold">Arsip Dokumen (Lokasi)</th>
                  <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredENOP.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-500">
                      Tidak ada dokumen Bukti Bayar PBB yang cocok dengan pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredENOP.map((doc) => {
                    const st = getStatusObj(doc.statusBayarId);
                    const matchedSppt = state.docsESPPT.find(
                      (s) => s.id === doc.espptId || s.nop === doc.nop
                    );
                    const namaWP =
                      doc.namaWajibPajak ||
                      matchedSppt?.namaWajibPajak ||
                      doc.namaNop ||
                      '-';
                    const alamatWP =
                      doc.alamatWajibPajak ||
                      matchedSppt?.alamatWajibPajak ||
                      doc.lokasiAlamat ||
                      '-';
                    const statusStyle =
                      st?.kategori === 'lunas'
                        ? 'text-emerald-700 font-semibold'
                        : st?.kategori === 'cicilan'
                        ? 'text-amber-700 font-semibold'
                        : 'text-rose-700 font-semibold';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="py-3 pr-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {doc.noArsip}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                          {formatIndonesianDate(doc.tanggalTransaksi)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-blue-700 tabular-nums whitespace-nowrap">
                            {doc.nop}
                          </div>
                          <div className="text-[11px] font-medium text-slate-600">
                            {doc.namaNop}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs">
                          {namaWP}
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs">
                          <div>{alamatWP}</div>
                          {doc.lokasiAlamat && doc.lokasiAlamat !== alamatWP && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              Objek: {doc.lokasiAlamat}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-800 tabular-nums">
                          {doc.tahunPajak}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {doc.kotaKabupaten}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {getProvName(doc.provinsiId)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={statusStyle}>{st?.namaStatus || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getLocName(doc.arsipDokumenId)}
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewConfig({
                                  isOpen: true,
                                  title: `${namaWP} (${doc.nop})`,
                                  noArsip: doc.noArsip,
                                  categoryLabel: 'Dokumen Bukti Bayar PBB',
                                  attachment: doc.fileAttachment,
                                  arsipDokumenId: doc.arsipDokumenId,
                                  metadataPairs: [
                                    { label: 'No Arsip', value: doc.noArsip },
                                    {
                                      label: 'Tanggal Transaksi',
                                      value: formatIndonesianDate(doc.tanggalTransaksi),
                                    },
                                    { label: 'NOP (Dari E-SPPT)', value: doc.nop },
                                    { label: 'Nama Wajib Pajak', value: namaWP },
                                    { label: 'Alamat Wajib Pajak', value: alamatWP },
                                    { label: 'Nama NOP / Objek', value: doc.namaNop },
                                    { label: 'Tahun Pajak', value: doc.tahunPajak },
                                    {
                                      label: 'Provinsi',
                                      value: getProvName(doc.provinsiId),
                                    },
                                    {
                                      label: 'Kota/Kabupaten',
                                      value: doc.kotaKabupaten,
                                    },
                                    {
                                      label: 'Status Bayar',
                                      value: st?.namaStatus || '-',
                                    },
                                    { label: 'Lokasi Alamat Objek', value: doc.lokasiAlamat },
                                  ],
                                })
                              }
                              className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                              title="Lihat Berkas & Detail"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              File
                            </button>
                            {canWriteDocs && (
                              <button
                                type="button"
                                onClick={() => handleEditENOP(doc)}
                                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                                title="Edit Bukti Bayar PBB"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDeleteDocs && (
                              <button
                                type="button"
                                onClick={() => onDeleteENOP(doc.id)}
                                className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Hapus Bukti Bayar PBB"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 2: E-SPPT */}
        {docCategory === 'doc-esppt' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">No Arsip</th>
                  <th className="px-4 py-2.5 font-semibold">NOP</th>
                  <th className="px-4 py-2.5 font-semibold">Tahun</th>
                  <th className="px-4 py-2.5 font-semibold">Letak Objek Pajak</th>
                  <th className="px-4 py-2.5 font-semibold">Nama Wajib Pajak</th>
                  <th className="px-4 py-2.5 font-semibold">Alamat Wajib Pajak</th>
                  <th className="px-4 py-2.5 font-semibold">Jatuh Tempo</th>
                  <th className="px-4 py-2.5 font-semibold">Arsip Dokumen (Lokasi)</th>
                  <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredESPPT.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-500">
                      Tidak ada dokumen E-SPPT yang cocok dengan pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredESPPT.map((doc) => {
                    const deadline = evaluateDateDeadline(doc.jatuhTempo);
                    const deadlineColor =
                      deadline.state === 'overdue'
                        ? 'text-rose-700 font-semibold'
                        : deadline.state === 'warning'
                        ? 'text-amber-700 font-semibold'
                        : 'text-emerald-700 font-medium';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="py-3 pr-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {doc.noArsip}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                          {doc.nop}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-800 tabular-nums">
                          {doc.tahun}
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs">
                          {doc.letakObjekPajak}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs">
                          {doc.namaWajibPajak || doc.namaAlamatWajibPajak}
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs">
                          {doc.alamatWajibPajak || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono font-medium text-slate-900 tabular-nums">
                            {formatIndonesianDate(doc.jatuhTempo)}
                          </div>
                          <div className={`text-[11px] ${deadlineColor}`}>
                            {deadline.shortLabel} · {deadline.label}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getLocName(doc.arsipDokumenId)}
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewConfig({
                                  isOpen: true,
                                  title: `E-SPPT NOP ${doc.nop} (Tahun ${doc.tahun})`,
                                  noArsip: doc.noArsip,
                                  categoryLabel: 'Dokumen E-SPPT',
                                  attachment: doc.fileAttachment,
                                  arsipDokumenId: doc.arsipDokumenId,
                                  metadataPairs: [
                                    { label: 'No Arsip', value: doc.noArsip },
                                    { label: 'NOP', value: doc.nop },
                                    { label: 'Tahun Pajak', value: doc.tahun },
                                    {
                                      label: 'Letak Objek Pajak',
                                      value: doc.letakObjekPajak,
                                    },
                                    {
                                      label: 'Nama Wajib Pajak',
                                      value: doc.namaWajibPajak || doc.namaAlamatWajibPajak || '-',
                                    },
                                    {
                                      label: 'Alamat Wajib Pajak',
                                      value: doc.alamatWajibPajak || '-',
                                    },
                                    {
                                      label: 'Jatuh Tempo',
                                      value: `${formatIndonesianDate(doc.jatuhTempo)} (${
                                        deadline.shortLabel
                                      })`,
                                    },
                                  ],
                                })
                              }
                              className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              File
                            </button>
                            {canWriteDocs && (
                              <button
                                type="button"
                                onClick={() => handleEditESPPT(doc)}
                                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDeleteDocs && (
                              <button
                                type="button"
                                onClick={() => onDeleteESPPT(doc.id)}
                                className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 3: SERTIFIKAT MERK */}
        {docCategory === 'doc-merk' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">No Arsip</th>
                  <th className="px-4 py-2.5 font-semibold">Etiket Merk</th>
                  <th className="px-4 py-2.5 font-semibold">Nama & Alamat</th>
                  <th className="px-4 py-2.5 font-semibold">No Pendaftaran & Tgl Terima</th>
                  <th className="px-4 py-2.5 font-semibold">No Permohonan & Tgl Ajuan</th>
                  <th className="px-4 py-2.5 font-semibold">Jatuh Tempo Kepemilikan</th>
                  <th className="px-4 py-2.5 font-semibold">Kelas & Uraian Warna</th>
                  <th className="px-4 py-2.5 font-semibold">Arsip Dokumen (Lokasi)</th>
                  <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMerk.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-500">
                      Tidak ada dokumen Sertifikat Merk yang cocok dengan pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredMerk.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {doc.noArsip}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {doc.etiketImageUrl && (
                            <img
                              src={doc.etiketImageUrl}
                              alt={doc.etiketMerk}
                              referrerPolicy="no-referrer"
                              className="h-10 w-16 shrink-0 rounded border border-slate-200 object-cover"
                            />
                          )}
                          <span className="font-semibold text-slate-900">
                            {doc.etiketMerk}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{doc.nama}</div>
                        <div className="text-[11px] text-slate-500 max-w-xs truncate">
                          {doc.alamat}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900 tabular-nums">
                          {doc.noPendaftaran}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                          Terima: {formatIndonesianDate(doc.tanggalPenerimaan)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono text-slate-800 tabular-nums">
                          {doc.noPermohonan}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                          Ajuan: {formatIndonesianDate(doc.tanggalPengajuan)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {doc.tglJatuhTempoKepemilikan ? (
                          (() => {
                            const evalDeadline = evaluateDateDeadline(doc.tglJatuhTempoKepemilikan);
                            return (
                              <div>
                                <div className="font-mono font-semibold text-slate-900 tabular-nums">
                                  {formatIndonesianDate(doc.tglJatuhTempoKepemilikan)}
                                </div>
                                <span
                                  className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                                    evalDeadline.state === 'overdue'
                                      ? 'bg-rose-100 text-rose-700'
                                      : evalDeadline.state === 'warning'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {evalDeadline.label}
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-slate-800">
                          {doc.kelasBarangJasa}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Warna: {doc.uraianWarna}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {getLocName(doc.arsipDokumenId)}
                      </td>
                      <td className="py-3 pl-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewConfig({
                                isOpen: true,
                                title: `${doc.etiketMerk} (${doc.noPendaftaran})`,
                                noArsip: doc.noArsip,
                                categoryLabel: 'Sertifikat Merk',
                                attachment: doc.fileAttachment,
                                arsipDokumenId: doc.arsipDokumenId,
                                metadataPairs: [
                                  { label: 'No Arsip', value: doc.noArsip },
                                  { label: 'Nama Pemilik', value: doc.nama },
                                  { label: 'Alamat', value: doc.alamat },
                                  {
                                    label: 'Tanggal Penerimaan',
                                    value: formatIndonesianDate(doc.tanggalPenerimaan),
                                  },
                                  { label: 'No Pendaftaran', value: doc.noPendaftaran },
                                  { label: 'Etiket Merk', value: doc.etiketMerk },
                                  { label: 'No Permohonan', value: doc.noPermohonan },
                                  {
                                    label: 'Tanggal Pengajuan',
                                    value: formatIndonesianDate(doc.tanggalPengajuan),
                                  },
                                  {
                                    label: 'Tgl Jatuh Tempo Kepemilikan Merk',
                                    value: doc.tglJatuhTempoKepemilikan
                                      ? formatIndonesianDate(doc.tglJatuhTempoKepemilikan)
                                      : '-',
                                  },
                                  {
                                    label: 'Kelas Barang / Jasa',
                                    value: doc.kelasBarangJasa,
                                  },
                                  { label: 'Uraian Warna', value: doc.uraianWarna },
                                ],
                              })
                            }
                            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            File
                          </button>
                          {canWriteDocs && (
                            <button
                              type="button"
                              onClick={() => handleEditMerk(doc)}
                              className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDeleteDocs && (
                            <button
                              type="button"
                              onClick={() => onDeleteMerk(doc.id)}
                              className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 4: SERTIFIKAT K3 */}
        {docCategory === 'doc-k3' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">No Arsip</th>
                  <th className="px-4 py-2.5 font-semibold">Jenis Objek K3 & Unit</th>
                  <th className="px-4 py-2.5 font-semibold">Perusahaan & Lokasi Unit</th>
                  <th className="px-4 py-2.5 font-semibold">Merk / Type / No Seri</th>
                  <th className="px-4 py-2.5 font-semibold">Pembuat & Kapasitas</th>
                  <th className="px-4 py-2.5 font-semibold">Tgl Periksa & Masa Berlaku</th>
                  <th className="px-4 py-2.5 font-semibold">Arsip Dokumen (Lokasi)</th>
                  <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredK3.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      Tidak ada dokumen Sertifikat K3 yang cocok dengan pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredK3.map((doc) => {
                    const expiry = evaluateDateDeadline(doc.berlakuSampaiTanggal);
                    const expiryClass =
                      expiry.state === 'overdue'
                        ? 'text-rose-700 font-semibold'
                        : expiry.state === 'warning'
                        ? 'text-amber-700 font-semibold'
                        : 'text-emerald-700 font-medium';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="py-3 pr-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {doc.noArsip}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {doc.jenisObjekK3}
                          </div>
                          <div className="text-[11px] text-slate-500">{doc.jenis}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {doc.namaPerusahaan}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Unit: {doc.lokasiUnit}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-900">
                            {doc.merk} · <span className="font-mono">{doc.type}</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                            SN: {doc.noSeri}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono font-medium text-slate-900">
                            {doc.kapasitas}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {doc.perusahaanPembuat} ({doc.tempatPembuatan}, {doc.tahunBuat})
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono text-slate-900 tabular-nums">
                            s/d {formatIndonesianDate(doc.berlakuSampaiTanggal)}
                          </div>
                          <div className={`text-[11px] ${expiryClass}`}>
                            {expiry.shortLabel} · {expiry.label}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getLocName(doc.arsipDokumenId)}
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewConfig({
                                  isOpen: true,
                                  title: `${doc.jenisObjekK3} — ${doc.merk} ${doc.type}`,
                                  noArsip: doc.noArsip,
                                  categoryLabel: 'Sertifikat K3',
                                  attachment: doc.fileAttachment,
                                  arsipDokumenId: doc.arsipDokumenId,
                                  metadataPairs: [
                                    { label: 'No Arsip', value: doc.noArsip },
                                    { label: 'Jenis Objek K3', value: doc.jenisObjekK3 },
                                    {
                                      label: 'Nama Perusahaan',
                                      value: doc.namaPerusahaan,
                                    },
                                    { label: 'Nama Pemilik', value: doc.namaPemilik },
                                    { label: 'Alamat', value: doc.alamat },
                                    { label: 'Lokasi Unit', value: doc.lokasiUnit },
                                    { label: 'Jenis', value: doc.jenis },
                                    {
                                      label: 'Merk / Type',
                                      value: `${doc.merk} / ${doc.type}`,
                                    },
                                    {
                                      label: 'Perusahaan Pembuat',
                                      value: doc.perusahaanPembuat,
                                    },
                                    {
                                      label: 'Tempat & Tahun Pembuatan',
                                      value: `${doc.tempatPembuatan} (${doc.tahunBuat})`,
                                    },
                                    { label: 'No Seri', value: doc.noSeri },
                                    { label: 'Kapasitas', value: doc.kapasitas },
                                    {
                                      label: 'Tanggal Pemeriksaan',
                                      value: formatIndonesianDate(doc.tanggalPemeriksaan),
                                    },
                                    {
                                      label: 'Berlaku Sampai Tanggal',
                                      value: `${formatIndonesianDate(
                                        doc.berlakuSampaiTanggal
                                      )} (${expiry.shortLabel})`,
                                    },
                                  ],
                                })
                              }
                              className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              File
                            </button>
                            {canWriteDocs && (
                              <button
                                type="button"
                                onClick={() => handleEditK3(doc)}
                                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDeleteDocs && (
                              <button
                                type="button"
                                onClick={() => onDeleteK3(doc.id)}
                                className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 5: E-SERTIFIKAT TANAH */}
        {docCategory === 'doc-tanah' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">No Arsip</th>
                  <th className="px-4 py-2.5 font-semibold">Jenis Hak & No Sertifikat</th>
                  <th className="px-4 py-2.5 font-semibold">NIB (14 Digit) & Asal Hak</th>
                  <th className="px-4 py-2.5 font-semibold">Pemegang Hak & NIK</th>
                  <th className="px-4 py-2.5 font-semibold">Letak Tanah (Kel/Kec/Kota)</th>
                  <th className="px-4 py-2.5 font-semibold">Surat Ukur & Luas</th>
                  <th className="px-4 py-2.5 font-semibold">Legalitas & Status Beban</th>
                  <th className="px-4 py-2.5 font-semibold">Arsip Dokumen</th>
                  <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTanah.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-500">
                      Tidak ada dokumen E-Sertifikat Tanah yang cocok dengan pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredTanah.map((doc) => {
                    const bebanStyle =
                      doc.statusBeban === 'Bersih (Clear)'
                        ? 'text-emerald-700 font-semibold'
                        : doc.statusBeban === 'Dijaminkan (Hak Tanggungan)'
                        ? 'text-amber-700 font-semibold'
                        : 'text-rose-700 font-semibold';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="py-3 pr-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {doc.noArsip}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">
                            {doc.jenisHak}
                          </div>
                          <div className="font-mono text-[11px] text-slate-600 tabular-nums">
                            {doc.nomorSertifikat}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono font-semibold text-blue-700 tabular-nums">
                            {doc.nib}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Asal: {doc.asalHak}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {doc.namaPemegangHak}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                            NIK: {doc.nikPemilik}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {doc.desaKelurahan}, {doc.kecamatan}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {doc.kotaKabupaten} · {getProvName(doc.provinsiId)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono font-semibold text-slate-900 tabular-nums">
                            {doc.luasTanah.toLocaleString('id-ID')} m²
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                            SU: {doc.nomorSuratUkur}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800">{doc.statusDokumen}</div>
                          <div className={`text-[11px] ${bebanStyle}`}>
                            {doc.statusBeban}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getLocName(doc.arsipDokumenId)}
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewConfig({
                                  isOpen: true,
                                  title: `${doc.jenisHak} No. ${doc.nomorSertifikat} — ${doc.namaPemegangHak}`,
                                  noArsip: doc.noArsip,
                                  categoryLabel: 'E-Sertifikat Tanah',
                                  attachment: doc.fileAttachment,
                                  arsipDokumenId: doc.arsipDokumenId,
                                  metadataPairs: [
                                    { label: 'No Arsip', value: doc.noArsip },
                                    {
                                      label: 'Jenis Hak & Asal Hak',
                                      value: `${doc.jenisHak} · ${doc.asalHak}`,
                                    },
                                    {
                                      label: 'Nomor Sertifikat',
                                      value: doc.nomorSertifikat,
                                    },
                                    {
                                      label: 'Nomor Identifikasi Bidang (NIB)',
                                      value: doc.nib,
                                    },
                                    {
                                      label: 'Nama Pemegang Hak',
                                      value: doc.namaPemegangHak,
                                    },
                                    {
                                      label: 'NIK / Tgl Lahir Pemilik',
                                      value: `${doc.nikPemilik} · ${formatIndonesianDate(
                                        doc.tanggalLahirPemilik
                                      )}`,
                                    },
                                    { label: 'Alamat Pemilik', value: doc.alamatPemilik },
                                    {
                                      label: 'Wilayah Administratif',
                                      value: `${doc.desaKelurahan}, Kec. ${doc.kecamatan}, ${
                                        doc.kotaKabupaten
                                      }, ${getProvName(doc.provinsiId)}`,
                                    },
                                    {
                                      label: 'Alamat Detail Tanah',
                                      value: doc.alamatDetail,
                                    },
                                    {
                                      label: 'Surat Ukur & Luas Tanah',
                                      value: `${
                                        doc.nomorSuratUkur
                                      } · Luas: ${doc.luasTanah.toLocaleString('id-ID')} m²`,
                                    },
                                    {
                                      label: 'Titik Koordinat Geografis',
                                      value: doc.titikKoordinat,
                                    },
                                    {
                                      label: 'Batas Utara / Timur',
                                      value: `Utara: ${doc.batasUtara} | Timur: ${doc.batasTimur}`,
                                    },
                                    {
                                      label: 'Batas Selatan / Barat',
                                      value: `Selatan: ${doc.batasSelatan} | Barat: ${doc.batasBarat}`,
                                    },
                                    {
                                      label: 'Kantor Pertanahan & Tgl Terbit',
                                      value: `${doc.kantorPertanahan} (${formatIndonesianDate(
                                        doc.tanggalPenerbitan
                                      )})`,
                                    },
                                    {
                                      label: 'Status Dokumen & Beban Hukum',
                                      value: `${doc.statusDokumen} · ${doc.statusBeban}`,
                                    },
                                  ],
                                })
                              }
                              className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              File
                            </button>
                            {canWriteDocs && (
                              <button
                                type="button"
                                onClick={() => handleEditTanah(doc)}
                                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDeleteDocs && (
                              <button
                                type="button"
                                onClick={() => onDeleteTanah(doc.id)}
                                className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 6: E-IMB */}
        {docCategory === 'doc-imb' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">No Arsip</th>
                  <th className="px-4 py-2.5 font-semibold">No Keputusan & Tahun</th>
                  <th className="px-4 py-2.5 font-semibold">Atas Nama & Tgl Permohonan</th>
                  <th className="px-4 py-2.5 font-semibold">Nama Pemohon & Alamat</th>
                  <th className="px-4 py-2.5 font-semibold">Wilayah & Lokasi Bangunan</th>
                  <th className="px-4 py-2.5 font-semibold">Bangunan Induk & Maksud</th>
                  <th className="px-4 py-2.5 font-semibold">Arsip Dokumen</th>
                  <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIMB.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      Tidak ada dokumen E-IMB yang cocok dengan pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredIMB.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {doc.noArsip}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-semibold text-blue-700 tabular-nums">
                          {doc.noKeputusan}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                          Tahun: {doc.tahun}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{doc.atasNama}</div>
                        <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                          Permohonan: {formatIndonesianDate(doc.tglPermohonanImb)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{doc.nama}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {doc.beralamat}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {doc.lokasiBangunan}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {doc.kelurahanDesa}, Kec. {doc.kecamatan}, {doc.kota} (
                          {getProvName(doc.provinsiId)})
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {doc.bangunanInduk}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {doc.bermaksudUntuk}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {getLocName(doc.arsipDokumenId)}
                      </td>
                      <td className="py-3 pl-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewConfig({
                                isOpen: true,
                                title: `E-IMB No. ${doc.noKeputusan} — ${doc.atasNama}`,
                                noArsip: doc.noArsip,
                                categoryLabel: 'Dokumen E-IMB',
                                attachment: doc.fileAttachment,
                                arsipDokumenId: doc.arsipDokumenId,
                                metadataPairs: [
                                  { label: 'No Arsip', value: doc.noArsip },
                                  { label: 'No Keputusan', value: doc.noKeputusan },
                                  { label: 'Tahun', value: doc.tahun },
                                  { label: 'Atas Nama', value: doc.atasNama },
                                  {
                                    label: 'Lokasi Bangunan',
                                    value: doc.lokasiBangunan,
                                  },
                                  {
                                    label: 'Tgl Permohonan IMB',
                                    value: formatIndonesianDate(doc.tglPermohonanImb),
                                  },
                                  { label: 'Nama', value: doc.nama },
                                  { label: 'Beralamat', value: doc.beralamat },
                                  {
                                    label: 'Provinsi & Kota',
                                    value: `${getProvName(doc.provinsiId)} · ${doc.kota}`,
                                  },
                                  {
                                    label: 'Kecamatan & Kelurahan/Desa',
                                    value: `Kec. ${doc.kecamatan} · Kel/Desa ${doc.kelurahanDesa}`,
                                  },
                                  {
                                    label: 'Lokasi Bangunan (Detail)',
                                    value: doc.lokasiBangunanDetail,
                                  },
                                  {
                                    label: 'Bangunan Induk',
                                    value: doc.bangunanInduk,
                                  },
                                  {
                                    label: 'Bermaksud Untuk',
                                    value: doc.bermaksudUntuk,
                                  },
                                ],
                              })
                            }
                            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            File
                          </button>
                          {canWriteDocs && (
                            <button
                              type="button"
                              onClick={() => handleEditIMB(doc)}
                              className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDeleteDocs && (
                            <button
                              type="button"
                              onClick={() => onDeleteIMB(doc.id)}
                              className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 7: SERTIKAT LAIK OPERASI (SLO) */}
        {docCategory === 'doc-slo' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">No Arsip & ID SLO</th>
                  <th className="px-4 py-2.5 font-semibold">No SLO & Jenis</th>
                  <th className="px-4 py-2.5 font-semibold">Pemilik & Lokasi Instalasi</th>
                  <th className="px-4 py-2.5 font-semibold">Peralatan & Kapasitas</th>
                  <th className="px-4 py-2.5 font-semibold">Lembaga Inspeksi (LIT)</th>
                  <th className="px-4 py-2.5 font-semibold">Tanggal Berlaku</th>
                  <th className="px-4 py-2.5 font-semibold">Status SLO</th>
                  <th className="px-4 py-2.5 font-semibold">Berkas</th>
                  <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSLO.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada arsip Sertifikat Laik Operasi (SLO) yang cocok dengan pencarian / filter.
                    </td>
                  </tr>
                ) : (
                  filteredSLO.map((doc) => {
                    const deadline = evaluateDateDeadline(doc.tanggalBerlaku);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pr-4 font-mono font-semibold text-slate-900">
                          <div>{doc.noArsip}</div>
                          <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                            ID: {doc.idSlo || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="font-semibold">{doc.noSlo}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                doc.jenisSlo === 'GENSET'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-300'
                              }`}
                            >
                              <Zap className="h-2.5 w-2.5" />
                              {doc.jenisSlo}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {doc.jenisInstalasi} · {doc.sumberEnergi}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="font-semibold text-slate-900">{doc.namaPerusahaan}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">{doc.lokasiInstalasi}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{doc.alamatInstalasi}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="font-medium text-slate-900">
                            {doc.merekPeralatan} {doc.tipePeralatan}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            <span className="font-semibold text-blue-700">{doc.kapasitasKva} kVA</span> / {doc.dayaKw} kW
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {doc.teganganV} · {doc.fasa} · {doc.frekuensiHz} Hz
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="font-medium text-slate-900">{doc.lembagaInspeksi}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            Reg: {doc.nomorRegistrasi}
                          </div>
                          <div className="text-[10px] text-slate-500">PIC: {doc.pic}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          <div className="font-medium">{formatIndonesianDate(doc.tanggalBerlaku)}</div>
                          <div className="mt-1">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                deadline.state === 'overdue'
                                  ? 'bg-rose-100 text-rose-800'
                                  : deadline.state === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {deadline.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block rounded-md px-2 py-1 text-[11px] font-bold ${
                              doc.statusSlo === 'AKTIF'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : doc.statusSlo === 'PROSES'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : doc.statusSlo === 'KADALUARSA'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {doc.statusSlo}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {doc.fileSlo ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewConfig({
                                    isOpen: true,
                                    title: `Sertifikat Laik Operasi — ${doc.noSlo}`,
                                    noArsip: doc.noArsip,
                                    categoryLabel: 'Sertifikat Laik Operasi (SLO)',
                                    attachment: doc.fileSlo,
                                    arsipDokumenId: doc.arsipDokumenId,
                                    metadataPairs: [
                                      { label: '1. ID SLO', value: doc.idSlo || '-' },
                                      { label: '2. Jenis SLO', value: doc.jenisSlo },
                                      { label: '3. Nomor Sertifikat SLO', value: doc.noSlo },
                                      { label: '4. Tanggal Penerbitan', value: formatIndonesianDate(doc.tanggalTerbit) },
                                      { label: '5. Tanggal Berlaku (Jatuh Tempo)', value: formatIndonesianDate(doc.tanggalBerlaku) },
                                      { label: '6. Status Sertifikat SLO', value: doc.statusSlo },
                                      { label: '7. Nama Pemilik Instalasi', value: doc.namaPerusahaan },
                                      { label: '8. Lokasi Instalasi', value: doc.lokasiInstalasi },
                                      { label: '9. Alamat Lengkap Instalasi', value: doc.alamatInstalasi },
                                      { label: '10. Jenis Instalasi', value: doc.jenisInstalasi },
                                      { label: '11. Sumber Energi', value: doc.sumberEnergi },
                                      { label: '12. Merek Peralatan', value: doc.merekPeralatan },
                                      { label: '13. Tipe Peralatan', value: doc.tipePeralatan },
                                      { label: '14. Nomor Seri Peralatan', value: doc.nomorSeri },
                                      { label: '15. Kapasitas Instalasi (kVA)', value: `${doc.kapasitasKva} kVA` },
                                      { label: '16. Daya Aktif (kW)', value: `${doc.dayaKw} kW` },
                                      { label: '17. Tegangan Operasional (V)', value: doc.teganganV },
                                      { label: '18. Fasa', value: doc.fasa },
                                      { label: '19. Frekuensi (Hz)', value: `${doc.frekuensiHz} Hz` },
                                      { label: '20. Nomor Penyedia (IDPEL / IUPTLS)', value: doc.nomorPenyedia || '-' },
                                      { label: '21. Lembaga Inspeksi Teknik (LIT)', value: doc.lembagaInspeksi },
                                      { label: '22. Nomor Registrasi Terkait', value: doc.nomorRegistrasi },
                                      { label: '25. Penanggung Jawab (PIC)', value: doc.pic },
                                      { label: '26. Keterangan Tambahan', value: doc.keterangan || '-' },
                                      { label: '27. Tanggal Input Data (Created)', value: doc.createdAt },
                                      { label: '28. Tanggal Update Data (Updated)', value: doc.updatedAt },
                                    ],
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200"
                              >
                                <Eye className="h-3 w-3" />
                                File SLO
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">-</span>
                            )}
                            {doc.filePendukung && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewConfig({
                                    isOpen: true,
                                    title: `Dokumen Pendukung / SLD — ${doc.noSlo}`,
                                    noArsip: `${doc.noArsip} (Pendukung)`,
                                    categoryLabel: 'Dokumen Pendukung SLO',
                                    attachment: doc.filePendukung,
                                    arsipDokumenId: doc.arsipDokumenId,
                                    metadataPairs: [
                                      { label: 'No Arsip Induk', value: doc.noArsip },
                                      { label: 'Nomor SLO', value: doc.noSlo },
                                      { label: 'Peralatan & Merek', value: `${doc.merekPeralatan} ${doc.tipePeralatan}` },
                                      { label: 'Nama Berkas Pendukung', value: doc.filePendukung?.name || '-' },
                                      { label: 'Lembaga Inspeksi', value: doc.lembagaInspeksi },
                                    ],
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              >
                                <Eye className="h-3 w-3" />
                                File LHPP/SLD
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewConfig({
                                  isOpen: true,
                                  title: `Sertifikat Laik Operasi (SLO) — ${doc.noSlo}`,
                                  noArsip: doc.noArsip,
                                  categoryLabel: 'Sertifikat Laik Operasi (SLO)',
                                  attachment: doc.fileSlo || doc.fileAttachment,
                                  arsipDokumenId: doc.arsipDokumenId,
                                  metadataPairs: [
                                    { label: '1. ID SLO', value: doc.idSlo || '-' },
                                    { label: '2. Jenis SLO', value: doc.jenisSlo },
                                    { label: '3. Nomor Sertifikat SLO', value: doc.noSlo },
                                    { label: '4. Tanggal Penerbitan', value: formatIndonesianDate(doc.tanggalTerbit) },
                                    { label: '5. Tanggal Berlaku (Jatuh Tempo)', value: formatIndonesianDate(doc.tanggalBerlaku) },
                                    { label: '6. Status Sertifikat SLO', value: doc.statusSlo },
                                    { label: '7. Nama Pemilik Instalasi', value: doc.namaPerusahaan },
                                    { label: '8. Lokasi Instalasi', value: doc.lokasiInstalasi },
                                    { label: '9. Alamat Lengkap Instalasi', value: doc.alamatInstalasi },
                                    { label: '10. Jenis Instalasi', value: doc.jenisInstalasi },
                                    { label: '11. Sumber Energi', value: doc.sumberEnergi },
                                    { label: '12. Merek Peralatan', value: doc.merekPeralatan },
                                    { label: '13. Tipe Peralatan', value: doc.tipePeralatan },
                                    { label: '14. Nomor Seri Peralatan', value: doc.nomorSeri },
                                    { label: '15. Kapasitas Instalasi (kVA)', value: `${doc.kapasitasKva} kVA` },
                                    { label: '16. Daya Aktif (kW)', value: `${doc.dayaKw} kW` },
                                    { label: '17. Tegangan Operasional (V)', value: doc.teganganV },
                                    { label: '18. Fasa', value: doc.fasa },
                                    { label: '19. Frekuensi (Hz)', value: `${doc.frekuensiHz} Hz` },
                                    { label: '20. Nomor Penyedia (IDPEL / IUPTLS)', value: doc.nomorPenyedia || '-' },
                                    { label: '21. Lembaga Inspeksi Teknik (LIT)', value: doc.lembagaInspeksi },
                                    { label: '22. Nomor Registrasi Terkait', value: doc.nomorRegistrasi },
                                    { label: '23. File SLO', value: doc.fileSlo?.name || 'Tidak ada berkas' },
                                    { label: '24. File Pendukung', value: doc.filePendukung?.name || 'Tidak ada berkas' },
                                    { label: '25. Penanggung Jawab (PIC)', value: doc.pic },
                                    { label: '26. Keterangan Tambahan', value: doc.keterangan || '-' },
                                    { label: '27. Tanggal Input Data (Created)', value: doc.createdAt },
                                    { label: '28. Tanggal Update Data (Updated)', value: doc.updatedAt },
                                  ],
                                })
                              }
                              className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Detail 28 Field
                            </button>
                            {canWriteDocs && (
                              <button
                                type="button"
                                onClick={() => handleEditSLO(doc)}
                                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                                title="Ubah data SLO"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDeleteDocs && (
                              <button
                                type="button"
                                onClick={() => onDeleteSLO(doc.id)}
                                className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Hapus data SLO"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 8: UJI TIMBANGAN (METROLOGI LEGAL & TERA) */}
        {docCategory === 'doc-timbangan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">No Arsip &amp; ID Pengujian</th>
                  <th className="px-4 py-2.5 font-semibold">Jenis &amp; No Surat Pengujian</th>
                  <th className="px-4 py-2.5 font-semibold">Nama Alat Ukur &amp; Merek/Tipe</th>
                  <th className="px-4 py-2.5 font-semibold">Kapasitas &amp; Parameter Skala</th>
                  <th className="px-4 py-2.5 font-semibold">Pemilik &amp; Instansi Penerbit</th>
                  <th className="px-4 py-2.5 font-semibold">Masa Berlaku (Jatuh Tempo)</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Berkas</th>
                  <th className="py-2.5 pl-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTimbangan.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada arsip dokumen Uji Timbangan yang cocok dengan pencarian / filter.
                    </td>
                  </tr>
                ) : (
                  filteredTimbangan.map((doc) => {
                    const deadline = evaluateDateDeadline(doc.berlakuSampai);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pr-4 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                          <div>{doc.noArsip}</div>
                          <div className="text-[11px] font-normal text-slate-500">{doc.idPengujian}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${
                                doc.jenisTimbangan === 'JEMBATAN ELEKTRONIK'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                              }`}
                            >
                              {doc.jenisTimbangan}
                            </span>
                          </div>
                          <div className="mt-1 font-mono font-medium text-slate-800">{doc.nomorSuratPengujian}</div>
                          {doc.nomorOrder && (
                            <div className="text-[11px] font-mono text-slate-500">Order: {doc.nomorOrder}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{doc.namaAlatUkur}</div>
                          <div className="text-[11px] text-slate-600">
                            {doc.merekPabrikBuatan} {doc.modelTipe}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">S/N: {doc.nomorSeriIdentitas}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] tabular-nums whitespace-nowrap">
                          <div className="text-slate-900 font-semibold">
                            Max: {doc.kapasitasMaksimumKg} kg / Min: {doc.kapasitasMinimumKg} kg
                          </div>
                          {doc.dayaBacaKg && (
                            <div className="text-indigo-700 font-medium">d = {doc.dayaBacaKg}</div>
                          )}
                          {(doc.intervalSkalaTerkecilDKg || doc.intervalSkalaVerifikasiEKg) && (
                            <div className="text-amber-800 font-medium">
                              d = {doc.intervalSkalaTerkecilDKg || '-'} | e = {doc.intervalSkalaVerifikasiEKg || '-'}
                            </div>
                          )}
                          <div className="text-slate-500 font-sans">{doc.kelasKeakurasian}</div>
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          <div className="font-semibold text-slate-900">{doc.pemilikPemakai}</div>
                          <div className="text-slate-600">{doc.instansiPenerbit}</div>
                          {doc.unitInstansi && (
                            <div className="text-slate-500 italic">{doc.unitInstansi}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums whitespace-nowrap">
                          <div className="text-slate-900 font-semibold">{formatIndonesianDate(doc.berlakuSampai)}</div>
                          <div className="mt-0.5">
                            <span
                              className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                                deadline.state === 'overdue'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : deadline.state === 'warning'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {deadline.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  doc.statusMasaBerlaku === 'AKTIF'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : doc.statusMasaBerlaku === 'SEGERA HABIS'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
                                    : doc.statusMasaBerlaku === 'KADALUARSA'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                }`}
                              >
                                {doc.statusMasaBerlaku}
                              </span>
                            </div>
                            <div>
                              <span
                                className={`inline-flex rounded px-1.5 py-0.2 text-[10px] font-medium ${
                                  doc.statusDokumen === 'LENGKAP'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {doc.statusDokumen}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {doc.fileAttachment ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewConfig({
                                    isOpen: true,
                                    title: `SKHP Timbangan — ${doc.nomorSuratPengujian}`,
                                    noArsip: doc.noArsip,
                                    categoryLabel: 'Uji Timbangan (Metrologi Legal)',
                                    attachment: doc.fileAttachment,
                                    arsipDokumenId: doc.arsipDokumenId,
                                    metadataPairs: [
                                      { label: '1. ID Pengujian', value: doc.idPengujian },
                                      { label: '2. Jenis Timbangan', value: doc.jenisTimbangan },
                                      { label: '3. Nomor Surat Pengujian', value: doc.nomorSuratPengujian },
                                      { label: '4. Nomor Order', value: doc.nomorOrder || '-' },
                                      { label: '5. Nama Alat Ukur', value: doc.namaAlatUkur },
                                      { label: '6. Merek Pabrik', value: doc.merekPabrikBuatan },
                                      { label: '7. Model / Tipe', value: doc.modelTipe },
                                      { label: '8. Nomor Seri Identitas', value: doc.nomorSeriIdentitas },
                                      { label: '9. Kapasitas Maksimum (Max)', value: `${doc.kapasitasMaksimumKg} kg` },
                                      { label: '10. Kapasitas Minimum (Min)', value: `${doc.kapasitasMinimumKg} kg` },
                                      { label: '11. Daya Baca (d)', value: doc.dayaBacaKg || '-' },
                                      { label: '12. Interval Skala Terkecil (d)', value: doc.intervalSkalaTerkecilDKg || '-' },
                                      { label: '13. Interval Skala Verifikasi (e)', value: doc.intervalSkalaVerifikasiEKg || '-' },
                                      { label: '14. Kelas Keakurasian', value: doc.kelasKeakurasian },
                                      { label: '15. Pemilik / Pemakai', value: doc.pemilikPemakai },
                                      { label: '16. Alamat Pemilik', value: doc.alamatPemilik },
                                      { label: '17. Instansi Penerbit', value: doc.instansiPenerbit },
                                      { label: '18. Unit Instansi', value: doc.unitInstansi || '-' },
                                      { label: '19. Nomor SK KKPTTU UTTP', value: doc.nomorSkKkpttuUutp || '-' },
                                      { label: '20. Tanggal SK KKPTTU UTTP', value: doc.tanggalSkKkpttuUutp ? formatIndonesianDate(doc.tanggalSkKkpttuUutp) : '-' },
                                      { label: '21. Tanggal Terbit Surat', value: formatIndonesianDate(doc.tanggalTerbitSurat) },
                                      { label: '22. Tempat Penerbitan', value: doc.tempatPenerbitan },
                                      { label: '23. Berlaku Sampai', value: formatIndonesianDate(doc.berlakuSampai) },
                                      { label: 'Status Dokumen', value: doc.statusDokumen },
                                      { label: 'Status Masa Berlaku', value: doc.statusMasaBerlaku },
                                      { label: 'Keterangan', value: doc.keterangan || '-' },
                                    ],
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-800 hover:bg-cyan-100 border border-cyan-200"
                              >
                                <Eye className="h-3 w-3" />
                                File SKHP
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">-</span>
                            )}
                            {doc.filePendukung && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewConfig({
                                    isOpen: true,
                                    title: `Berkas Pendukung Cerapan / SK — ${doc.nomorSuratPengujian}`,
                                    noArsip: `${doc.noArsip} (Pendukung)`,
                                    categoryLabel: 'Dokumen Pendukung Uji Timbangan',
                                    attachment: doc.filePendukung,
                                    arsipDokumenId: doc.arsipDokumenId,
                                    metadataPairs: [
                                      { label: 'No Arsip Induk', value: doc.noArsip },
                                      { label: 'Nomor Surat SKHP', value: doc.nomorSuratPengujian },
                                      { label: 'Nama Alat Ukur', value: doc.namaAlatUkur },
                                      { label: 'Nama Berkas Pendukung', value: doc.filePendukung?.name || '-' },
                                      { label: 'Instansi Penerbit', value: doc.instansiPenerbit },
                                    ],
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              >
                                <Eye className="h-3 w-3" />
                                Cerapan / SK
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewConfig({
                                  isOpen: true,
                                  title: `Dokumen Uji Timbangan — ${doc.nomorSuratPengujian}`,
                                  noArsip: doc.noArsip,
                                  categoryLabel: 'Uji Timbangan (Metrologi Legal)',
                                  attachment: doc.fileAttachment,
                                  arsipDokumenId: doc.arsipDokumenId,
                                  metadataPairs: [
                                    { label: '1. ID Pengujian', value: doc.idPengujian },
                                    { label: '2. Jenis Timbangan', value: doc.jenisTimbangan },
                                    { label: '3. Nomor Surat Pengujian (SKHP)', value: doc.nomorSuratPengujian },
                                    { label: '4. Nomor Order', value: doc.nomorOrder || '-' },
                                    { label: '5. Nama Alat Ukur', value: doc.namaAlatUkur },
                                    { label: '6. Merek Pabrik Buatan', value: doc.merekPabrikBuatan },
                                    { label: '7. Model / Tipe', value: doc.modelTipe },
                                    { label: '8. Nomor Seri Identitas', value: doc.nomorSeriIdentitas },
                                    { label: '9. Kapasitas Maksimum (Max)', value: `${doc.kapasitasMaksimumKg} kg` },
                                    { label: '10. Kapasitas Minimum (Min)', value: `${doc.kapasitasMinimumKg} kg` },
                                    { label: '11. Daya Baca (kg)', value: doc.dayaBacaKg || '-' },
                                    { label: '12. Interval Skala Terkecil (d - kg)', value: doc.intervalSkalaTerkecilDKg || '-' },
                                    { label: '13. Interval Skala Verifikasi (e - kg)', value: doc.intervalSkalaVerifikasiEKg || '-' },
                                    { label: '14. Kelas Keakurasian', value: doc.kelasKeakurasian },
                                    { label: '15. Pemilik / Pemakai', value: doc.pemilikPemakai },
                                    { label: '16. Alamat Pemilik', value: doc.alamatPemilik },
                                    { label: '17. Instansi Penerbit', value: doc.instansiPenerbit },
                                    { label: '18. Unit Instansi', value: doc.unitInstansi || '-' },
                                    { label: '19. Nomor SK KKPTTU UTTP', value: doc.nomorSkKkpttuUutp || '-' },
                                    { label: '20. Tanggal SK KKPTTU UTTP', value: doc.tanggalSkKkpttuUutp ? formatIndonesianDate(doc.tanggalSkKkpttuUutp) : '-' },
                                    { label: '21. Tanggal Terbit Surat', value: formatIndonesianDate(doc.tanggalTerbitSurat) },
                                    { label: '22. Tempat Penerbitan', value: doc.tempatPenerbitan },
                                    { label: '23. Berlaku Sampai', value: formatIndonesianDate(doc.berlakuSampai) },
                                    { label: 'Status Dokumen', value: doc.statusDokumen },
                                    { label: 'Status Masa Berlaku', value: doc.statusMasaBerlaku },
                                    { label: 'Lokasi Arsip Fisik', value: getLocName(doc.arsipDokumenId) },
                                    { label: 'File Surat Pengujian', value: doc.fileAttachment?.name || 'Tidak ada berkas' },
                                    { label: 'File Cerapan / Pendukung', value: doc.filePendukung?.name || 'Tidak ada berkas' },
                                    { label: 'Keterangan Tambahan', value: doc.keterangan || '-' },
                                    { label: 'Tanggal Input (Created)', value: doc.createdAt },
                                    { label: 'Tanggal Pembaruan (Updated)', value: doc.updatedAt },
                                  ],
                                })
                              }
                              className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-cyan-800 hover:bg-cyan-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Detail 23 Field
                            </button>
                            {canWriteDocs && (
                              <button
                                type="button"
                                onClick={() => handleEditTimbangan(doc)}
                                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-cyan-800"
                                title="Ubah data Uji Timbangan"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDeleteDocs && (
                              <button
                                type="button"
                                onClick={() => onDeleteTimbangan(doc.id)}
                                className="rounded p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Hapus data Uji Timbangan"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* File & Metadata Preview Modal */}
      {previewConfig && (
        <FilePreviewModal
          isOpen={previewConfig.isOpen}
          onClose={() => setPreviewConfig(null)}
          title={previewConfig.title}
          noArsip={previewConfig.noArsip}
          categoryLabel={previewConfig.categoryLabel}
          attachment={previewConfig.attachment}
          archiveLocation={state.masterLocations.find(
            (l) => l.id === previewConfig.arsipDokumenId
          )}
          metadataPairs={previewConfig.metadataPairs}
        />
      )}
    </div>
  );
};
