export type ActiveView =
  | 'dashboard'
  | 'master-arsip'
  | 'master-provinsi'
  | 'master-status'
  | 'doc-enop'
  | 'doc-esppt'
  | 'doc-merk'
  | 'doc-k3'
  | 'doc-tanah'
  | 'doc-imb'
  | 'doc-slo'
  | 'doc-timbangan'
  | 'laporan'
  | 'setting'
  | 'setting-company'
  | 'setting-apps-script'
  | 'ebook-panduan';

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

// 1. Data Master: Arsip Dokumen (Tempat menyimpan dokumen asli)
export interface MasterArchiveLocation {
  id: string;
  namaLokasi: string;
  penanggungJawab: string;
  lokasi: string;
}

// 2. Data Master: Provinsi & Kota/Kabupaten Indonesia
export interface MasterProvince {
  id: string;
  namaProvinsi: string;
  kotaKabupaten: string[];
}

// 3. Data Master: Status Bayar
export type PaymentCategory = 'lunas' | 'cicilan' | 'belum_bayar';

export interface MasterPaymentStatus {
  id: string;
  namaStatus: string;
  kategori: PaymentCategory;
  keterangan: string;
}

// 4. Dokumen: E-NOP
export interface DocENOP {
  id: string;
  noArsip: string;
  tanggalTransaksi: string;
  provinsiId: string;
  kotaKabupaten: string;
  statusBayarId: string;
  espptId?: string;
  nop: string;
  namaWajibPajak: string;
  alamatWajibPajak: string;
  namaNop: string;
  tahunPajak: string;
  lokasiAlamat: string;
  arsipDokumenId: string;
  fileAttachment?: FileAttachment;
  createdAt: string;
}

// 5. Dokumen: E-SPPT
export interface DocESPPT {
  id: string;
  noArsip: string;
  nop: string;
  enopId?: string;
  tahun: string;
  letakObjekPajak: string;
  namaWajibPajak: string;
  alamatWajibPajak: string;
  namaAlamatWajibPajak?: string;
  jatuhTempo: string;
  arsipDokumenId: string;
  fileAttachment?: FileAttachment;
  createdAt: string;
}

// 6. Dokumen: Sertifikat Merk
export interface DocMerk {
  id: string;
  noArsip: string;
  nama: string;
  alamat: string;
  tanggalPenerimaan: string;
  noPendaftaran: string;
  etiketMerk: string;
  etiketImageUrl?: string;
  noPermohonan: string;
  tanggalPengajuan: string;
  tglJatuhTempoKepemilikan?: string;
  kelasBarangJasa: string;
  uraianWarna: string;
  arsipDokumenId: string;
  fileAttachment?: FileAttachment;
  createdAt: string;
}

// 7. Dokumen: Sertifikat K3
export interface DocK3 {
  id: string;
  noArsip: string;
  jenisObjekK3: string;
  namaPerusahaan: string;
  namaPemilik: string;
  alamat: string;
  lokasiUnit: string;
  jenis: string;
  merk: string;
  type: string;
  perusahaanPembuat: string;
  tempatPembuatan: string;
  tahunBuat: string;
  noSeri: string;
  kapasitas: string;
  tanggalPemeriksaan: string;
  berlakuSampaiTanggal: string;
  arsipDokumenId: string;
  fileAttachment?: FileAttachment;
  createdAt: string;
}

// 8. Dokumen: E-Sertifikat Tanah
export type JenisHakTanah =
  | 'SHM'
  | 'HGB'
  | 'Hak Pakai'
  | 'HGU'
  | 'Hak Pengelolaan';

export type AsalHakTanah =
  | 'Konversi'
  | 'Pemberian Hak'
  | 'Pemecahan'
  | 'Penggabungan'
  | 'Jual Beli'
  | 'Waris';

export type StatusDokumenTanah =
  | 'Sertifikat Elektronik (Sertifikat-el)'
  | 'Sertifikat Fisik (Lama)';

export type StatusBebanTanah =
  | 'Bersih (Clear)'
  | 'Dijaminkan (Hak Tanggungan)'
  | 'Sita Jaminan'
  | 'Sengketa';

export interface DocTanah {
  id: string;
  noArsip: string;
  // 1. Data Umum & Jenis Hak
  jenisHak: JenisHakTanah;
  nomorSertifikat: string;
  nib: string; // 14 digit
  asalHak: AsalHakTanah;
  // 2. Data Pemegang Hak (Pemilik)
  namaPemegangHak: string;
  nikPemilik: string; // 16 digit
  tanggalLahirPemilik: string;
  alamatPemilik: string;
  // 3. Letak & Lokasi Tanah (Data Administratif)
  provinsiId: string;
  kotaKabupaten: string;
  kecamatan: string;
  desaKelurahan: string;
  alamatDetail: string;
  // 4. Data Fisik & Geografis (Surat Ukur)
  nomorSuratUkur: string;
  luasTanah: number; // m2
  titikKoordinat: string; // lat, lng
  batasUtara: string;
  batasTimur: string;
  batasSelatan: string;
  batasBarat: string;
  // 5. Legalitas & Catatan Hukum
  kantorPertanahan: string;
  tanggalPenerbitan: string;
  statusDokumen: StatusDokumenTanah;
  statusBeban: StatusBebanTanah;
  arsipDokumenId: string;
  fileAttachment?: FileAttachment;
  createdAt: string;
}

// 9. Dokumen: E-IMB
export interface DocIMB {
  id: string;
  noArsip: string;
  noKeputusan: string;
  tahun: string;
  atasNama: string;
  lokasiBangunan: string;
  tglPermohonanImb: string;
  nama: string;
  beralamat: string;
  provinsiId: string;
  kota: string;
  kecamatan: string;
  kelurahanDesa: string;
  lokasiBangunanDetail: string;
  bangunanInduk: string;
  bermaksudUntuk: string;
  arsipDokumenId: string;
  fileAttachment?: FileAttachment;
  createdAt: string;
}

// 10. Dokumen: Sertifikat Laik Operasi (SLO)
export type JenisSLO = 'GENSET' | 'LISTRIK';
export type StatusSLO = 'AKTIF' | 'PROSES' | 'KADALUARSA' | 'DICABUT';
export type SumberEnergiSLO = 'DIESEL' | 'GAS' | 'BENSIN' | 'PLN' | 'LAINNYA';
export type FasaSLO = '1 FASA' | '3 FASA';
export type JenisInstalasiSLO = 'PEMBANGKIT' | 'PEMANFAATAN';

export interface DocSLO {
  id: string; // Internal unique ID
  idSlo: string; // 1. ID_SLO Nomor identitas data (misal SLO-2026-0001)
  noArsip: string; // Nomor Registrasi Arsip (misal ARS/SLO/2026/001)
  jenisSlo: JenisSLO; // 2. JENIS_SLO: GENSET / LISTRIK
  noSlo: string; // 3. NO_SLO Nomor sertifikat SLO
  tanggalTerbit: string; // 4. TANGGAL_TERBIT Tanggal penerbitan (YYYY-MM-DD)
  tanggalBerlaku: string; // 5. TANGGAL_BERLAKU Tanggal berlaku / jatuh tempo
  statusSlo: StatusSLO; // 6. STATUS_SLO: AKTIF, PROSES, KADALUARSA, DICABUT
  namaPerusahaan: string; // 7. NAMA_PERUSAHAAN Nama pemilik instalasi
  lokasiInstalasi: string; // 8. LOKASI_INSTALASI Lokasi instalasi (e.g. Ruang Power House)
  alamatInstalasi: string; // 9. ALAMAT_INSTALASI Alamat lengkap instalasi
  jenisInstalasi: JenisInstalasiSLO; // 10. JENIS_INSTALASI: PEMBANGKIT, PEMANFAATAN
  sumberEnergi: SumberEnergiSLO; // 11. SUMBER_ENERGI: DIESEL, GAS, BENSIN, PLN, LAINNYA
  merekPeralatan: string; // 12. MEREK_PERALATAN Merek genset/panel
  tipePeralatan: string; // 13. TIPE_PERALATAN Tipe peralatan
  nomorSeri: string; // 14. NOMOR_SERI Nomor seri peralatan
  kapasitasKva: number | string; // 15. KAPASITAS_KVA Kapasitas instalasi (kVA)
  dayaKw: number | string; // 16. DAYA_KW Daya aktif (kW)
  teganganV: string; // 17. TEGANGAN_V Tegangan operasional (V)
  fasa: FasaSLO; // 18. FASA: 1 FASA, 3 FASA
  frekuensiHz: number | string; // 19. FREKUENSI_HZ Frekuensi (Hz)
  nomorPenyedia?: string; // 20. NOMOR_PENYEDIA ID penyedia tenaga listrik jika relevan
  lembagaInspeksi: string; // 21. LEMBAGA_INSPEKSI Lembaga inspeksi teknik
  nomorRegistrasi: string; // 22. NOMOR_REGISTRASI Nomor registrasi terkait
  fileSlo?: FileAttachment; // 23. FILE_SLO Link / Berkas digital SLO
  filePendukung?: FileAttachment; // 24. FILE_PENDUKUNG Dokumen pendukung / SLD
  fileAttachment?: FileAttachment; // Alias berkas utama untuk kompatibilitas pratinjau
  pic: string; // 25. PIC Penanggung jawab
  keterangan: string; // 26. KETERANGAN Catatan tambahan
  arsipDokumenId: string; // Tempat penyimpanan dokumen fisik (MasterArchiveLocation)
  createdAt: string; // 27. CREATED_AT Tanggal input
  updatedAt: string; // 28. UPDATED_AT Tanggal perubahan
}

// 11. Dokumen: Uji Timbangan (Metrologi Legal / Tera UTTP)
export type JenisTimbangan = 'ELEKTRONIK' | 'JEMBATAN ELEKTRONIK';
export type StatusDokumenTimbangan = 'LENGKAP' | 'BELUM LENGKAP';
export type StatusMasaBerlakuTimbangan =
  | 'AKTIF'
  | 'SEGERA HABIS'
  | 'KADALUARSA'
  | 'PERLU VERIFIKASI';

export interface DocUjiTimbangan {
  id: string;
  noArsip: string;
  idPengujian: string; // 1. ID_PENGUJIAN
  jenisTimbangan: JenisTimbangan; // 2. JENIS_TIMBANGAN: ELEKTRONIK, JEMBATAN ELEKTRONIK
  nomorSuratPengujian: string; // 3. NOMOR_SURAT_PENGUJIAN
  nomorOrder?: string; // 4. NOMOR_ORDER (Timbangan elektronik)
  namaAlatUkur: string; // 5. NAMA_ALAT_UKUR
  merekPabrikBuatan: string; // 6. MEREK_PABRIK_BUATAN
  modelTipe: string; // 7. MODEL_TIPE
  nomorSeriIdentitas: string; // 8. NOMOR_SERI_IDENTITAS
  kapasitasMaksimumKg: number | string; // 9. KAPASITAS_MAKSIMUM_KG
  kapasitasMinimumKg: number | string; // 10. KAPASITAS_MINIMUM_KG
  dayaBacaKg?: string; // 11. DAYA_BACA_KG (Timbangan elektronik)
  intervalSkalaTerkecilDKg?: string; // 12. INTERVAL_SKALA_TERKECIL_D_KG (Timbangan jembatan)
  intervalSkalaVerifikasiEKg?: string; // 13. INTERVAL_SKALA_VERIFIKASI_E_KG (Timbangan jembatan)
  kelasKeakurasian: string; // 14. KELAS_KEAKURASIAN
  pemilikPemakai: string; // 15. PEMILIK_PEMAKAI
  alamatPemilik: string; // 16. ALAMAT_PEMILIK
  instansiPenerbit: string; // 17. INSTANSI_PENERBIT
  unitInstansi?: string; // 18. UNIT_INSTANSI (Jika ada)
  nomorSkKkpttuUutp?: string; // 19. NOMOR_SK_KKPTTU_UUTP (Timbangan jembatan)
  tanggalSkKkpttuUutp?: string; // 20. TANGGAL_SK_KKPTTU_UUTP (Timbangan jembatan)
  tanggalTerbitSurat: string; // 21. TANGGAL_TERBIT_SURAT
  tempatPenerbitan: string; // 22. TEMPAT_PENERBITAN
  berlakuSampai: string; // 23. BERLAKU_SAMPAI
  statusDokumen: StatusDokumenTimbangan; // Dropdown: LENGKAP, BELUM LENGKAP
  statusMasaBerlaku: StatusMasaBerlakuTimbangan; // Dropdown: AKTIF, SEGERA HABIS, KADALUARSA, PERLU VERIFIKASI
  arsipDokumenId: string;
  fileAttachment?: FileAttachment; // File scan Surat Keterangan Hasil Pengujian
  filePendukung?: FileAttachment; // Berkas cerapan pengujian / SK
  keterangan?: string;
  createdAt: string;
  updatedAt: string;
}

// 12. Setting: Roles, Username, Email, Password, Level
export type UserLevel = 'Level 1 - Super Admin' | 'Level 2 - Admin Arsip' | 'Level 3 - Staff Operasional' | 'Level 4 - Viewer';

export interface RoleDefinition {
  id: string;
  roleName: string;
  level: UserLevel;
  deskripsi: string;
  canManageMaster: boolean;
  canWriteDocs: boolean;
  canDeleteDocs: boolean;
  canExportReport: boolean;
  canManageUsers: boolean;
  canReceiveExpiryEmails: boolean; // Menerima informasi jatuh tempo ke email yang terdaftar
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  password: string;
  namaLengkap: string;
  role: string;
  level: UserLevel;
  aktif: boolean;
  lastLogin: string;
}

export interface CompanyProfile {
  namaPerusahaan: string;
  logoDataUrl: string;
  logoFileName?: string;
}

export interface AppState {
  masterLocations: MasterArchiveLocation[];
  masterProvinces: MasterProvince[];
  masterStatuses: MasterPaymentStatus[];
  docsENOP: DocENOP[];
  docsESPPT: DocESPPT[];
  docsMerk: DocMerk[];
  docsK3: DocK3[];
  docsTanah: DocTanah[];
  docsIMB: DocIMB[];
  docsSLO: DocSLO[];
  docsTimbangan: DocUjiTimbangan[];
  roles: RoleDefinition[];
  users: UserAccount[];
  currentUserId: string;
  companyProfile: CompanyProfile;
}
