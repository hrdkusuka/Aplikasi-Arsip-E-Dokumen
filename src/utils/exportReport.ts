import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AppState,
  DocENOP,
  DocESPPT,
  DocMerk,
  DocK3,
  DocTanah,
  DocIMB,
  DocSLO,
  DocUjiTimbangan,
} from '../types';
import { formatIndonesianDate, evaluateDateDeadline } from './archiveHelpers';

export type ReportDocType =
  | 'ALL'
  | 'ENOP'
  | 'ESPPT'
  | 'MERK'
  | 'K3'
  | 'TANAH'
  | 'IMB'
  | 'SLO'
  | 'TIMBANGAN';

export interface ReportFilterOptions {
  docType: ReportDocType;
  locationId: string;
  yearFilter: string;
  searchQuery: string;
}

export function getLocationName(state: AppState, id: string): string {
  const found = state.masterLocations.find((l) => l.id === id);
  return found ? `${found.namaLokasi} (${found.penanggungJawab})` : '-';
}

export function getProvinceName(state: AppState, id: string): string {
  const found = state.masterProvinces.find((p) => p.id === id);
  return found ? found.namaProvinsi : '-';
}

export function getStatusName(state: AppState, id: string): string {
  const found = state.masterStatuses.find((s) => s.id === id);
  return found ? found.namaStatus : '-';
}

export function buildENOPRows(state: AppState, docs: DocENOP[]) {
  return docs.map((d, index) => {
    const matchedSppt = state.docsESPPT.find(
      (s) => s.id === d.espptId || s.nop === d.nop
    );
    const namaWP =
      d.namaWajibPajak || matchedSppt?.namaWajibPajak || d.namaNop || '-';
    const alamatWP =
      d.alamatWajibPajak || matchedSppt?.alamatWajibPajak || d.lokasiAlamat || '-';
    return {
      No: index + 1,
      'No Arsip': d.noArsip,
      'Tanggal Transaksi': formatIndonesianDate(d.tanggalTransaksi),
      'NOP (Dari E-SPPT)': d.nop,
      'Nama Wajib Pajak': namaWP,
      'Alamat Wajib Pajak': alamatWP,
      'Nama NOP': d.namaNop,
      'Tahun Pajak': d.tahunPajak,
      Provinsi: getProvinceName(state, d.provinsiId),
      'Kota/Kabupaten': d.kotaKabupaten,
      'Status Bayar': getStatusName(state, d.statusBayarId),
      'Lokasi Alamat': d.lokasiAlamat,
      'Arsip Dokumen': getLocationName(state, d.arsipDokumenId),
      'Nama File': d.fileAttachment?.name || 'Tidak ada berkas',
    };
  });
}

export function buildESPPTRows(state: AppState, docs: DocESPPT[]) {
  return docs.map((d, index) => {
    const deadline = evaluateDateDeadline(d.jatuhTempo);
    return {
      No: index + 1,
      'No Arsip': d.noArsip,
      NOP: d.nop,
      Tahun: d.tahun,
      'Letak Objek Pajak': d.letakObjekPajak,
      'Nama Wajib Pajak': d.namaWajibPajak || d.namaAlamatWajibPajak || '-',
      'Alamat Wajib Pajak': d.alamatWajibPajak || '-',
      'Jatuh Tempo': formatIndonesianDate(d.jatuhTempo),
      'Status Jatuh Tempo': `${deadline.shortLabel} (${deadline.label})`,
      'Arsip Dokumen': getLocationName(state, d.arsipDokumenId),
      'Nama File': d.fileAttachment?.name || 'Tidak ada berkas',
    };
  });
}

export function buildMerkRows(state: AppState, docs: DocMerk[]) {
  return docs.map((d, index) => {
    const deadline = d.tglJatuhTempoKepemilikan
      ? evaluateDateDeadline(d.tglJatuhTempoKepemilikan)
      : null;
    return {
      No: index + 1,
      'No Arsip': d.noArsip,
      Nama: d.nama,
      Alamat: d.alamat,
      'Tanggal Penerimaan': formatIndonesianDate(d.tanggalPenerimaan),
      'No Pendaftaran': d.noPendaftaran,
      'Etiket Merk': d.etiketMerk,
      'No Permohonan': d.noPermohonan,
      'Tanggal Pengajuan': formatIndonesianDate(d.tanggalPengajuan),
      'Tgl Jatuh Tempo Kepemilikan': d.tglJatuhTempoKepemilikan
        ? formatIndonesianDate(d.tglJatuhTempoKepemilikan)
        : '-',
      'Status Perlindungan': deadline
        ? `${deadline.shortLabel} (${deadline.label})`
        : '-',
      'Kelas Barang / Jasa': d.kelasBarangJasa,
      'Uraian Warna': d.uraianWarna,
      'Arsip Dokumen': getLocationName(state, d.arsipDokumenId),
      'Nama File': d.fileAttachment?.name || 'Tidak ada berkas',
    };
  });
}

export function buildK3Rows(state: AppState, docs: DocK3[]) {
  return docs.map((d, index) => {
    const deadline = evaluateDateDeadline(d.berlakuSampaiTanggal);
    return {
      No: index + 1,
      'No Arsip': d.noArsip,
      'Jenis Objek K3': d.jenisObjekK3,
      'Nama Perusahaan': d.namaPerusahaan,
      'Nama Pemilik': d.namaPemilik,
      Alamat: d.alamat,
      'Lokasi Unit': d.lokasiUnit,
      Jenis: d.jenis,
      Merk: d.merk,
      Type: d.type,
      'Perusahaan Pembuat': d.perusahaanPembuat,
      'Tempat Pembuatan': d.tempatPembuatan,
      'Tahun Buat': d.tahunBuat,
      'No Seri': d.noSeri,
      Kapasitas: d.kapasitas,
      'Tanggal Pemeriksaan': formatIndonesianDate(d.tanggalPemeriksaan),
      'Berlaku Sampai': formatIndonesianDate(d.berlakuSampaiTanggal),
      'Status Berlaku': `${deadline.shortLabel} (${deadline.label})`,
      'Arsip Dokumen': getLocationName(state, d.arsipDokumenId),
      'Nama File': d.fileAttachment?.name || 'Tidak ada berkas',
    };
  });
}

export function buildTanahRows(state: AppState, docs: DocTanah[]) {
  return docs.map((d, index) => ({
    No: index + 1,
    'No Arsip': d.noArsip,
    'Jenis Hak': d.jenisHak,
    'Nomor Sertifikat': d.nomorSertifikat,
    'NIB (14 Digit)': d.nib,
    'Asal Hak': d.asalHak,
    'Nama Pemegang Hak': d.namaPemegangHak,
    'NIK / No. Identitas': d.nikPemilik,
    'Tgl Lahir Pemilik': formatIndonesianDate(d.tanggalLahirPemilik),
    'Alamat Pemilik': d.alamatPemilik,
    Provinsi: getProvinceName(state, d.provinsiId),
    'Kabupaten / Kota': d.kotaKabupaten,
    Kecamatan: d.kecamatan,
    'Desa / Kelurahan': d.desaKelurahan,
    'Alamat Detail Tanah': d.alamatDetail,
    'No Surat Ukur (SU/GS)': d.nomorSuratUkur,
    'Luas Tanah (m2)': d.luasTanah,
    'Titik Koordinat': d.titikKoordinat,
    'Batas Utara': d.batasUtara,
    'Batas Timur': d.batasTimur,
    'Batas Selatan': d.batasSelatan,
    'Batas Barat': d.batasBarat,
    'Kantor Pertanahan Penerbit': d.kantorPertanahan,
    'Tanggal Penerbitan': formatIndonesianDate(d.tanggalPenerbitan),
    'Status Dokumen': d.statusDokumen,
    'Status Beban / Agunan': d.statusBeban,
    'Arsip Dokumen': getLocationName(state, d.arsipDokumenId),
    'Nama File': d.fileAttachment?.name || 'Tidak ada berkas',
  }));
}

export function buildIMBRows(state: AppState, docs: DocIMB[]) {
  return docs.map((d, index) => ({
    No: index + 1,
    'No Arsip': d.noArsip,
    'No Keputusan': d.noKeputusan,
    Tahun: d.tahun,
    'Atas Nama': d.atasNama,
    'Lokasi Bangunan': d.lokasiBangunan,
    'Tgl Permohonan IMB': formatIndonesianDate(d.tglPermohonanImb),
    Nama: d.nama,
    Beralamat: d.beralamat,
    Provinsi: getProvinceName(state, d.provinsiId),
    Kota: d.kota,
    Kecamatan: d.kecamatan,
    'Kelurahan / Desa': d.kelurahanDesa,
    'Lokasi Bangunan (Detail)': d.lokasiBangunanDetail,
    'Bangunan Induk': d.bangunanInduk,
    'Bermaksud Untuk': d.bermaksudUntuk,
    'Arsip Dokumen': getLocationName(state, d.arsipDokumenId),
    'Nama File': d.fileAttachment?.name || 'Tidak ada berkas',
  }));
}

export function buildSLORows(state: AppState, docs: DocSLO[]) {
  return docs.map((d, index) => {
    const deadline = evaluateDateDeadline(d.tanggalBerlaku);
    return {
      No: index + 1,
      'No Arsip': d.noArsip,
      'ID SLO': d.idSlo || '-',
      'No SLO': d.noSlo,
      'Jenis SLO': d.jenisSlo,
      'Tanggal Terbit': formatIndonesianDate(d.tanggalTerbit),
      'Tanggal Berlaku': formatIndonesianDate(d.tanggalBerlaku),
      'Status Jatuh Tempo': `${deadline.shortLabel} (${deadline.label})`,
      'Status SLO': d.statusSlo,
      'Nama Perusahaan': d.namaPerusahaan,
      'Lokasi Instalasi': d.lokasiInstalasi,
      'Alamat Instalasi': d.alamatInstalasi,
      'Jenis Instalasi': d.jenisInstalasi,
      'Sumber Energi': d.sumberEnergi,
      'Merek Peralatan': d.merekPeralatan,
      'Tipe Peralatan': d.tipePeralatan,
      'Nomor Seri': d.nomorSeri,
      'Kapasitas (kVA)': `${d.kapasitasKva} kVA`,
      'Daya (kW)': `${d.dayaKw} kW`,
      'Tegangan (V)': d.teganganV,
      Fasa: d.fasa,
      'Frekuensi (Hz)': `${d.frekuensiHz} Hz`,
      'No Penyedia (PLN/IUPTLS)': d.nomorPenyedia || '-',
      'Lembaga Inspeksi (LIT)': d.lembagaInspeksi,
      'Nomor Registrasi': d.nomorRegistrasi,
      PIC: d.pic,
      'Lokasi Arsip Fisik': getLocationName(state, d.arsipDokumenId),
      'File SLO': d.fileSlo?.name || 'Tidak ada berkas',
      'File Pendukung': d.filePendukung?.name || 'Tidak ada berkas',
      Keterangan: d.keterangan || '-',
    };
  });
}

export function buildTimbanganRows(state: AppState, docs: DocUjiTimbangan[]) {
  return docs.map((d, index) => {
    const deadline = evaluateDateDeadline(d.berlakuSampai);
    return {
      No: index + 1,
      'No Arsip': d.noArsip,
      'ID Pengujian': d.idPengujian || '-',
      'Jenis Timbangan': d.jenisTimbangan,
      'No Surat Pengujian': d.nomorSuratPengujian,
      'No Order': d.nomorOrder || '-',
      'Nama Alat Ukur': d.namaAlatUkur,
      'Merek / Pembuat': d.merekPabrikBuatan,
      'Model / Tipe': d.modelTipe,
      'Nomor Seri': d.nomorSeriIdentitas,
      'Kapasitas Maks (kg)': `${d.kapasitasMaksimumKg.toLocaleString('id-ID')} kg`,
      'Kapasitas Min (kg)': `${d.kapasitasMinimumKg.toLocaleString('id-ID')} kg`,
      'Daya Baca (kg)': d.dayaBacaKg !== undefined ? `${d.dayaBacaKg} kg` : '-',
      'Interval d (kg)': d.intervalSkalaTerkecilDKg !== undefined ? `${d.intervalSkalaTerkecilDKg} kg` : '-',
      'Interval e (kg)': d.intervalSkalaVerifikasiEKg !== undefined ? `${d.intervalSkalaVerifikasiEKg} kg` : '-',
      'Kelas Keakurasian': d.kelasKeakurasian,
      'Pemilik / Pemakai': d.pemilikPemakai,
      'Alamat Pemilik': d.alamatPemilik,
      'Instansi Penerbit': d.instansiPenerbit,
      'Unit Instansi': d.unitInstansi || '-',
      'No SK KKPTTU/UUTP': d.nomorSkKkpttuUutp || '-',
      'Tgl SK KKPTTU/UUTP': d.tanggalSkKkpttuUutp ? formatIndonesianDate(d.tanggalSkKkpttuUutp) : '-',
      'Tanggal Terbit Surat': formatIndonesianDate(d.tanggalTerbitSurat),
      'Tempat Penerbitan': d.tempatPenerbitan,
      'Berlaku Sampai': formatIndonesianDate(d.berlakuSampai),
      'Status Masa Berlaku': `${deadline.shortLabel} (${d.statusMasaBerlaku})`,
      'Status Dokumen': d.statusDokumen,
      'Lokasi Arsip Fisik': getLocationName(state, d.arsipDokumenId),
      'File Lampiran': d.fileAttachment?.name || 'Tidak ada berkas',
      Keterangan: d.keterangan || '-',
    };
  });
}

// Helper to build elegant formatted Excel worksheets matching PDF styling
function createFormattedWorksheet(
  companyTitle: string,
  sectionName: string,
  timestampStr: string,
  userName: string,
  rows: Record<string, any>[]
): XLSX.WorkSheet {
  const aoa: (string | number)[][] = [];

  // Header 1: Company / System Title Banner
  aoa.push([companyTitle.toUpperCase()]);

  // Header 2: Subtitle
  aoa.push([`LAPORAN REKAPITULASI — ${sectionName.toUpperCase()}`]);

  // Header 3: Metadata
  aoa.push([
    `Tanggal Ekspor: ${timestampStr}   |   Dicetak oleh: ${userName}   |   Total Data: ${rows.length} Dokumen`,
  ]);

  // Header 4: Blank Spacer Row
  aoa.push([]);

  if (rows.length === 0) {
    aoa.push(['No', 'Keterangan']);
    aoa.push(['-', 'Tidak ada data dokumen pada kategori ini']);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    ];
    ws['!cols'] = [{ wch: 8 }, { wch: 45 }];
    return ws;
  }

  // Row 5: Column Headers
  const headers = Object.keys(rows[0]);
  aoa.push(headers);

  // Rows 6+: Data Rows
  rows.forEach((rowObj) => {
    aoa.push(
      headers.map((h) => {
        const val = rowObj[h];
        return val !== undefined && val !== null ? val : '-';
      })
    );
  });

  // Bottom Summary Row
  aoa.push([]);
  const summaryRow: (string | number)[] = ['TOTAL'];
  summaryRow.push(`${rows.length} Dokumen Terdaftar`);
  for (let i = 2; i < headers.length; i++) summaryRow.push('');
  aoa.push(summaryRow);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge Header rows across all columns
  const maxCol = Math.max(headers.length - 1, 5);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: maxCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: maxCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: maxCol } },
  ];

  // Auto-fit column widths based on maximum length of cell values + header padding
  const colWidths = headers.map((header) => {
    let maxLen = header.length;
    rows.forEach((rowObj) => {
      const val = rowObj[header];
      if (val !== undefined && val !== null) {
        const strVal = String(val);
        if (strVal.length > maxLen) {
          maxLen = strVal.length;
        }
      }
    });
    // Add comfortable padding of 3-4 characters, min 10, max 55
    return { wch: Math.min(Math.max(maxLen + 4, 10), 55) };
  });

  ws['!cols'] = colWidths;

  return ws;
}

// Summary Executive Sheet when exporting ALL documents
function createSummaryWorksheet(
  companyName: string,
  timestampStr: string,
  userName: string,
  counts: {
    esppt: number;
    enop: number;
    imb: number;
    tanah: number;
    merk: number;
    k3: number;
    slo: number;
    timbangan: number;
  }
): XLSX.WorkSheet {
  const total =
    counts.esppt +
    counts.enop +
    counts.imb +
    counts.tanah +
    counts.merk +
    counts.k3 +
    counts.slo +
    counts.timbangan;
  const aoa: (string | number)[][] = [
    [companyName.toUpperCase()],
    ['LAPORAN REKAPITULASI KESELURUHAN DOKUMEN ARSIP'],
    [`Tanggal Ekspor: ${timestampStr}   |   Dicetak oleh: ${userName}   |   Total Terarsip: ${total} Dokumen`],
    [],
    ['No', 'Kategori Dokumen Arsip', 'Jumlah Dokumen', 'Status Kelengkapan', 'Keterangan'],
    [1, 'Dokumen E-SPPT', counts.esppt, 'Tersimpan & Terindeks', 'Surat Pemberitahuan Pajak Terhutang'],
    [2, 'Bukti Bayar PBB (E-NOP)', counts.enop, 'Tersimpan & Terindeks', 'Bukti Pelunasan Pajak Bumi & Bangunan'],
    [3, 'Dokumen E-IMB', counts.imb, 'Tersimpan & Terindeks', 'Izin Mendirikan Bangunan'],
    [4, 'E-Sertifikat Tanah', counts.tanah, 'Tersimpan & Terindeks', 'Sertifikat Hak Atas Tanah & NIB'],
    [5, 'Sertifikat Merk', counts.merk, 'Tersimpan & Terindeks', 'Pendaftaran Hak Kekayaan Intelektual'],
    [6, 'Sertifikat K3', counts.k3, 'Tersimpan & Terindeks', 'Sertifikasi Keselamatan & Kesehatan Kerja'],
    [7, 'Sertifikat Laik Operasi (SLO)', counts.slo, 'Tersimpan & Terindeks', 'Sertifikasi Kelaikan Operasi Genset & Listrik'],
    [8, 'Sertifikat Uji Timbangan', counts.timbangan, 'Tersimpan & Terindeks', 'Pengujian Alat Ukur, Takar, Timbang & Perlengkapannya (UTTP)'],
    [],
    ['TOTAL', 'TOTAL KESELURUHAN DOKUMEN', total, '100% Terverifikasi', 'Data Tersinkronisasi Lengkap'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
  ];
  ws['!cols'] = [
    { wch: 8 },
    { wch: 34 },
    { wch: 18 },
    { wch: 25 },
    { wch: 45 },
  ];
  return ws;
}

export function exportToExcel(
  state: AppState,
  docType: ReportDocType,
  filteredData: {
    enop: DocENOP[];
    esppt: DocESPPT[];
    merk: DocMerk[];
    k3: DocK3[];
    tanah: DocTanah[];
    imb: DocIMB[];
    slo: DocSLO[];
    timbangan: DocUjiTimbangan[];
  }
) {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toISOString().split('T')[0];
  const timestampStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const currentUser = state.users.find((u) => u.id === state.currentUserId);
  const userName = `${currentUser?.namaLengkap || 'Administrator'} (${currentUser?.role || '-'})`;
  const companyTitle =
    state.companyProfile.namaPerusahaan || 'SISTEM MANAJEMEN ARSIP DOKUMEN TERPADU';

  // 1. If exporting ALL, add Executive Summary Sheet first
  if (docType === 'ALL') {
    const summaryWs = createSummaryWorksheet(companyTitle, timestampStr, userName, {
      esppt: filteredData.esppt.length,
      enop: filteredData.enop.length,
      imb: filteredData.imb.length,
      tanah: filteredData.tanah.length,
      merk: filteredData.merk.length,
      k3: filteredData.k3.length,
      slo: filteredData.slo.length,
      timbangan: filteredData.timbangan.length,
    });
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan Laporan');
  }

  // 2. Sheet E-SPPT
  if (docType === 'ALL' || docType === 'ESPPT') {
    const rows = buildESPPTRows(state, filteredData.esppt);
    const ws = createFormattedWorksheet(
      companyTitle,
      'Dokumen E-SPPT',
      timestampStr,
      userName,
      rows
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Dokumen E-SPPT');
  }

  // 3. Sheet Bukti Bayar PBB
  if (docType === 'ALL' || docType === 'ENOP') {
    const rows = buildENOPRows(state, filteredData.enop);
    const ws = createFormattedWorksheet(
      companyTitle,
      'Dokumen Bukti Bayar PBB',
      timestampStr,
      userName,
      rows
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Bukti Bayar PBB');
  }

  // 4. Sheet E-IMB
  if (docType === 'ALL' || docType === 'IMB') {
    const rows = buildIMBRows(state, filteredData.imb);
    const ws = createFormattedWorksheet(
      companyTitle,
      'Dokumen E-IMB',
      timestampStr,
      userName,
      rows
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Dokumen E-IMB');
  }

  // 5. Sheet E-Sertifikat Tanah
  if (docType === 'ALL' || docType === 'TANAH') {
    const rows = buildTanahRows(state, filteredData.tanah);
    const ws = createFormattedWorksheet(
      companyTitle,
      'Dokumen E-Sertifikat Tanah',
      timestampStr,
      userName,
      rows
    );
    XLSX.utils.book_append_sheet(wb, ws, 'E-Sertifikat Tanah');
  }

  // 6. Sheet Sertifikat Merk
  if (docType === 'ALL' || docType === 'MERK') {
    const rows = buildMerkRows(state, filteredData.merk);
    const ws = createFormattedWorksheet(
      companyTitle,
      'Dokumen Sertifikat Merk',
      timestampStr,
      userName,
      rows
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Sertifikat Merk');
  }

  // 7. Sheet Sertifikat K3
  if (docType === 'ALL' || docType === 'K3') {
    const rows = buildK3Rows(state, filteredData.k3);
    const ws = createFormattedWorksheet(
      companyTitle,
      'Dokumen Sertifikat K3',
      timestampStr,
      userName,
      rows
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Sertifikat K3');
  }

  // 8. Sheet Sertifikat SLO
  if (docType === 'ALL' || docType === 'SLO') {
    const rows = buildSLORows(state, filteredData.slo);
    const ws = createFormattedWorksheet(
      companyTitle,
      'Sertifikat Laik Operasi (SLO)',
      timestampStr,
      userName,
      rows
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Sertifikat SLO');
  }

  // 9. Sheet Uji Timbangan
  if (docType === 'ALL' || docType === 'TIMBANGAN') {
    const rows = buildTimbanganRows(state, filteredData.timbangan);
    const ws = createFormattedWorksheet(
      companyTitle,
      'Uji Timbangan',
      timestampStr,
      userName,
      rows
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Uji Timbangan');
  }

  const fileLabel = docType === 'ALL' ? 'Semua_Dokumen' : docType;
  XLSX.writeFile(wb, `Laporan_Arsip_Dokumen_${fileLabel}_${timestamp}.xlsx`);
}

export function exportToPDF(
  state: AppState,
  docType: ReportDocType,
  filteredData: {
    enop: DocENOP[];
    esppt: DocESPPT[];
    merk: DocMerk[];
    k3: DocK3[];
    tanah: DocTanah[];
    imb: DocIMB[];
    slo: DocSLO[];
    timbangan: DocUjiTimbangan[];
  }
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const timestampStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const currentUser = state.users.find((u) => u.id === state.currentUserId);

  const addReportHeader = (title: string, startY: number): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('SISTEM MANAJEMEN ARSIP DOKUMEN TERPADU', 14, startY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(title, 14, startY + 6);
    doc.text(
      `Tanggal Cetak: ${timestampStr}  |  Dicetak oleh: ${currentUser?.namaLengkap || 'Administrator'} (${currentUser?.role || '-'})`,
      14,
      startY + 11
    );

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(14, startY + 14, 283, startY + 14);
    return startY + 19;
  };

  let currentY = addReportHeader(
    `Rekapitulasi Laporan Arsip Dokumen — Kategori: ${
      docType === 'ALL' ? 'Seluruh Dokumen' : docType
    }`,
    15
  );

  const renderSectionTable = (
    sectionTitle: string,
    headers: string[],
    bodyRows: (string | number)[][]
  ) => {
    if (currentY > 165) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(29, 78, 216);
    doc.text(sectionTitle, 14, currentY);

    autoTable(doc, {
      startY: currentY + 3,
      head: [headers],
      body:
        bodyRows.length > 0
          ? bodyRows
          : [['-', 'Tidak ada data dokumen pada kategori ini', '', '', '', '', '', '']],
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });

    const lastTable = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
    currentY = (lastTable?.finalY || currentY + 25) + 10;
  };

  if (docType === 'ALL' || docType === 'ESPPT') {
    const rows = filteredData.esppt.map((d, idx) => [
      idx + 1,
      d.noArsip,
      d.nop,
      d.tahun,
      d.letakObjekPajak,
      d.namaWajibPajak || d.namaAlamatWajibPajak || '-',
      d.alamatWajibPajak || '-',
      formatIndonesianDate(d.jatuhTempo),
      getLocationName(state, d.arsipDokumenId),
    ]);
    renderSectionTable(
      `1. Dokumen E-SPPT (${filteredData.esppt.length} Dokumen)`,
      [
        'No',
        'No Arsip',
        'NOP',
        'Tahun',
        'Letak Objek Pajak',
        'Nama Wajib Pajak',
        'Alamat Wajib Pajak',
        'Jatuh Tempo',
        'Lokasi Arsip Asli',
      ],
      rows
    );
  }

  if (docType === 'ALL' || docType === 'ENOP') {
    const rows = filteredData.enop.map((d, idx) => {
      const matchedSppt = state.docsESPPT.find(
        (s) => s.id === d.espptId || s.nop === d.nop
      );
      const namaWP =
        d.namaWajibPajak || matchedSppt?.namaWajibPajak || d.namaNop || '-';
      const alamatWP =
        d.alamatWajibPajak || matchedSppt?.alamatWajibPajak || d.lokasiAlamat || '-';
      return [
        idx + 1,
        d.noArsip,
        formatIndonesianDate(d.tanggalTransaksi),
        d.nop,
        namaWP,
        alamatWP,
        d.namaNop,
        d.tahunPajak,
        `${getProvinceName(state, d.provinsiId)} / ${d.kotaKabupaten}`,
        getStatusName(state, d.statusBayarId),
        getLocationName(state, d.arsipDokumenId),
      ];
    });
    renderSectionTable(
      `2. Dokumen Bukti Bayar PBB (${filteredData.enop.length} Dokumen)`,
      [
        'No',
        'No Arsip',
        'Tgl Transaksi',
        'NOP (E-SPPT)',
        'Nama Wajib Pajak',
        'Alamat Wajib Pajak',
        'Nama NOP',
        'Tahun',
        'Provinsi / Kota',
        'Status Bayar',
        'Lokasi Arsip Asli',
      ],
      rows
    );
  }

  if (docType === 'ALL' || docType === 'IMB') {
    const rows = filteredData.imb.map((d, idx) => [
      idx + 1,
      d.noArsip,
      `${d.noKeputusan} (${d.tahun})`,
      `${d.atasNama} / ${d.nama}`,
      formatIndonesianDate(d.tglPermohonanImb),
      `${d.kelurahanDesa}, ${d.kecamatan}, ${d.kota}`,
      d.lokasiBangunan,
      d.bangunanInduk,
      d.bermaksudUntuk,
      getLocationName(state, d.arsipDokumenId),
    ]);
    renderSectionTable(
      `3. Dokumen E-IMB (${filteredData.imb.length} Dokumen)`,
      [
        'No',
        'No Arsip',
        'No Keputusan & Tahun',
        'Atas Nama / Pemohon',
        'Tgl Permohonan',
        'Kelurahan, Kecamatan, Kota',
        'Lokasi Bangunan',
        'Bangunan Induk',
        'Bermaksud Untuk',
        'Lokasi Arsip Asli',
      ],
      rows
    );
  }

  if (docType === 'ALL' || docType === 'TANAH') {
    const rows = filteredData.tanah.map((d, idx) => [
      idx + 1,
      d.noArsip,
      `${d.jenisHak} — ${d.nomorSertifikat}`,
      d.nib,
      `${d.namaPemegangHak} (NIK: ${d.nikPemilik})`,
      `${d.desaKelurahan}, ${d.kecamatan}, ${d.kotaKabupaten}`,
      `${d.nomorSuratUkur} (${d.luasTanah.toLocaleString('id-ID')} m²)`,
      `${d.kantorPertanahan} (${formatIndonesianDate(d.tanggalPenerbitan)})`,
      `${d.statusDokumen} · ${d.statusBeban}`,
      getLocationName(state, d.arsipDokumenId),
    ]);
    renderSectionTable(
      `4. Dokumen E-Sertifikat Tanah (${filteredData.tanah.length} Dokumen)`,
      [
        'No',
        'No Arsip',
        'Jenis Hak & No Sertifikat',
        'NIB (14 Digit)',
        'Pemegang Hak & NIK',
        'Kelurahan, Kecamatan, Kota/Kab',
        'Surat Ukur & Luas',
        'Kantah Penerbit & Tgl Terbit',
        'Status Dokumen & Beban',
        'Lokasi Arsip Asli',
      ],
      rows
    );
  }

  if (docType === 'ALL' || docType === 'MERK') {
    const rows = filteredData.merk.map((d, idx) => [
      idx + 1,
      d.noArsip,
      d.nama,
      d.noPendaftaran,
      d.etiketMerk,
      d.noPermohonan,
      `${formatIndonesianDate(d.tanggalPengajuan)} / ${formatIndonesianDate(d.tanggalPenerimaan)}`,
      d.tglJatuhTempoKepemilikan
        ? formatIndonesianDate(d.tglJatuhTempoKepemilikan)
        : '-',
      d.kelasBarangJasa,
      d.uraianWarna,
      getLocationName(state, d.arsipDokumenId),
    ]);
    renderSectionTable(
      `5. Dokumen Sertifikat Merk (${filteredData.merk.length} Dokumen)`,
      [
        'No',
        'No Arsip',
        'Nama Pemilik',
        'No Pendaftaran',
        'Etiket Merk',
        'No Permohonan',
        'Tgl Ajuan / Terima',
        'Jatuh Tempo Merk',
        'Kelas Barang/Jasa',
        'Uraian Warna',
        'Lokasi Arsip Asli',
      ],
      rows
    );
  }

  if (docType === 'ALL' || docType === 'K3') {
    const rows = filteredData.k3.map((d, idx) => [
      idx + 1,
      d.noArsip,
      d.jenisObjekK3,
      `${d.namaPerusahaan} (${d.lokasiUnit})`,
      `${d.merk} / ${d.type}`,
      `${d.noSeri} (${d.kapasitas})`,
      `${d.perusahaanPembuat} - ${d.tempatPembuatan} (${d.tahunBuat})`,
      formatIndonesianDate(d.tanggalPemeriksaan),
      formatIndonesianDate(d.berlakuSampaiTanggal),
      getLocationName(state, d.arsipDokumenId),
    ]);
    renderSectionTable(
      `6. Dokumen Sertifikat K3 (${filteredData.k3.length} Dokumen)`,
      [
        'No',
        'No Arsip',
        'Jenis Objek K3',
        'Perusahaan & Lokasi Unit',
        'Merk / Type',
        'No Seri & Kapasitas',
        'Pembuat & Tahun',
        'Tgl Periksa',
        'Berlaku Sampai',
        'Lokasi Arsip Asli',
      ],
      rows
    );
  }

  if (docType === 'ALL' || docType === 'SLO') {
    const rows = filteredData.slo.map((d, idx) => {
      const deadline = evaluateDateDeadline(d.tanggalBerlaku);
      return [
        idx + 1,
        d.noArsip,
        `${d.jenisSlo} — ${d.noSlo}`,
        d.namaPerusahaan,
        `${d.lokasiInstalasi} (${d.jenisInstalasi})`,
        `${d.merekPeralatan} ${d.tipePeralatan} (${d.kapasitasKva} kVA / ${d.dayaKw} kW)`,
        formatIndonesianDate(d.tanggalTerbit),
        `${formatIndonesianDate(d.tanggalBerlaku)} (${deadline.shortLabel})`,
        d.statusSlo,
        getLocationName(state, d.arsipDokumenId),
      ];
    });
    renderSectionTable(
      `7. Dokumen Sertifikat Laik Operasi / SLO (${filteredData.slo.length} Dokumen)`,
      [
        'No',
        'No Arsip',
        'Jenis & No SLO',
        'Nama Perusahaan',
        'Lokasi & Jenis Instalasi',
        'Peralatan & Kapasitas',
        'Tgl Terbit',
        'Berlaku s/d',
        'Status SLO',
        'Lokasi Arsip Asli',
      ],
      rows
    );
  }

  if (docType === 'ALL' || docType === 'TIMBANGAN') {
    const rows = filteredData.timbangan.map((d, idx) => {
      const deadline = evaluateDateDeadline(d.berlakuSampai);
      return [
        idx + 1,
        d.noArsip,
        `${d.jenisTimbangan} — ${d.namaAlatUkur}`,
        d.nomorSuratPengujian,
        `${d.merekPabrikBuatan} ${d.modelTipe} (SN: ${d.nomorSeriIdentitas})`,
        `Maks: ${d.kapasitasMaksimumKg} kg / Min: ${d.kapasitasMinimumKg} kg`,
        d.pemilikPemakai,
        formatIndonesianDate(d.tanggalTerbitSurat),
        `${formatIndonesianDate(d.berlakuSampai)} (${deadline.shortLabel})`,
        d.statusMasaBerlaku,
        getLocationName(state, d.arsipDokumenId),
      ];
    });
    renderSectionTable(
      `8. Dokumen Sertifikat Uji Timbangan (${filteredData.timbangan.length} Dokumen)`,
      [
        'No',
        'No Arsip',
        'Jenis & Nama Alat',
        'No Surat Pengujian',
        'Merek & No Seri',
        'Kapasitas Maks/Min',
        'Pemilik / Pemakai',
        'Tgl Terbit',
        'Berlaku s/d',
        'Status Masa Berlaku',
        'Lokasi Arsip Asli',
      ],
      rows
    );
  }

  const fileLabel = docType === 'ALL' ? 'Semua_Dokumen' : docType;
  const isoDate = new Date().toISOString().split('T')[0];
  doc.save(`Laporan_Arsip_Dokumen_${fileLabel}_${isoDate}.pdf`);
}
