import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppState } from '../types';

export function generateEBookPDF(state: AppState) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const companyName = state.companyProfile.namaPerusahaan || 'PT Kusuka Prima Nusantara';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Helper for adding headers and footers to content pages
  const addHeaderFooter = (pageNumber: number, chapterTitle: string) => {
    // Header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(companyName.toUpperCase(), 18, 14);
    doc.text(chapterTitle, pageWidth - 18, 14, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(18, 17, pageWidth - 18, 17);

    // Footer
    doc.line(18, pageHeight - 16, pageWidth - 18, pageHeight - 16);
    doc.text(
      'Buku Panduan & Dokumentasi Teknis Sistem Arsip Dokumen Enterprise · Bersifat Rahasia Internal',
      18,
      pageHeight - 11
    );
    doc.setFont('helvetica', 'bold');
    doc.text(`Hal. ${pageNumber}`, pageWidth - 18, pageHeight - 11, { align: 'right' });
  };

  // Helper for chapter title banners
  const drawChapterBanner = (chapterNo: string, chapterTitle: string, subtitle: string, startY: number): number => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(18, startY, pageWidth - 36, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text(chapterNo.toUpperCase(), 24, startY + 7);

    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(chapterTitle, 24, startY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(subtitle, 24, startY + 19);

    return startY + 28;
  };

  // ==========================================
  // HALAMAN 1: COVER E-BOOK RESMI
  // ==========================================
  // Dark navy elegant cover block
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  doc.setDrawColor(30, 58, 138); // blue-900
  doc.setLineWidth(1.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
  doc.setDrawColor(217, 119, 6); // amber-600 gold inner border
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Top Badge
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(pageWidth / 2 - 45, 30, 90, 9, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('OFFICIAL ENTERPRISE DOCUMENTATION', pageWidth / 2, 36, { align: 'center' });

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(248, 250, 252);
  doc.text(companyName.toUpperCase(), pageWidth / 2, 54, { align: 'center' });

  // Main Book Title
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text('BUKU PANDUAN LENGKAP', pageWidth / 2, 80, { align: 'center' });
  doc.text('& DOKUMENTASI TEKNIS', pageWidth / 2, 92, { align: 'center' });

  // Title separator line
  doc.setDrawColor(217, 119, 6); // gold
  doc.setLineWidth(1.2);
  doc.line(pageWidth / 2 - 35, 100, pageWidth / 2 + 35, 100);

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(56, 189, 248);
  doc.text('SISTEM MANAJEMEN ARSIP DOKUMEN TERPADU', pageWidth / 2, 110, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    'Tata Kelola 8 Kategori Arsip, Metrologi Uji Timbangan & SLO, Standarisasi Fisik,',
    pageWidth / 2,
    119,
    { align: 'center' }
  );
  doc.text(
    'Manajemen Pengguna & Hak Akses, Akses Online PWA, serta Integrasi Cloud Database',
    pageWidth / 2,
    125,
    { align: 'center' }
  );

  // Key Pillars Card
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(25, 142, pageWidth - 50, 68, 4, 4, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.5);
  doc.roundedRect(25, 142, pageWidth - 50, 68, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text('CAKUPAN MATERI UTAMA E-BOOK:', 32, 153);

  const pillars = [
    '• 8 Kategori Arsip: E-SPPT, E-NOP, E-Tanah, E-IMB, K3, Merk DJKI, SLO & Uji Timbangan',
    '• Spesifikasi 28 Atribut Sertifikat SLO & 23 Atribut Sertifikat Uji Timbangan (UTTP)',
    '• Standardisasi Lokasi Penyimpanan Fisik & Pencetakan Label Barcode 3x8 cm',
    '• Matriks Hak Akses Pengguna (Level 1-4) & Kebijakan Reset Password Aman',
    '• Panduan Akses Online, PWA Desktop/Mobile & Deployment Produksi (Vercel/Docker)',
    '• Arsitektur Database Cloud: Integrasi Supabase & Cloud SQL PostgreSQL (Skema DDL)',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  pillars.forEach((p, idx) => {
    doc.text(p, 32, 162 + idx * 7.5);
  });

  // Footer Metadata Box
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.roundedRect(25, 230, pageWidth - 50, 36, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Penerbit / Hak Cipta : ${companyName}`, 32, 240);
  doc.text(`Edisi / Versi        : Edisi Enterprise 2.5 (November 2026)`, 32, 246);
  doc.text(`Tanggal Terbit       : ${currentDate}`, 32, 252);
  doc.text(`Status Klasifikasi   : DOKUMEN RESMI INTERNAL PERUSAHAAN`, 32, 258);

  // ==========================================
  // HALAMAN 2: KATA PENGANTAR & DAFTAR ISI
  // ==========================================
  doc.addPage();
  addHeaderFooter(2, 'KATA PENGANTAR & DAFTAR ISI');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('KATA PENGANTAR DIREKSI', 18, 28);
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(1);
  doc.line(18, 31, 55, 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const foreword = [
    `Puji dan syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa atas tersusunnya Buku Panduan Lengkap dan Dokumentasi Teknis Sistem Manajemen Arsip Dokumen Terpadu ${companyName}.`,
    `Dalam era industri modern dan kepatuhan hukum yang semakin ketat, kepastian legalitas aset tanah, ketaatan perpajakan PBB, izin mendirikan bangunan (IMB), sertifikasi keselamatan kerja (K3), hak kekayaan intelektual (Merk DJKI), kelaikan instalasi listrik/genset (SLO), serta akurasi alat ukur metrologi (Uji Timbangan) merupakan aset strategis yang mutlak harus terkelola secara prima.`,
    `Buku ini disusun sebagai standar acuan operasional resmi bagi seluruh level pengguna (Super Admin, Admin Legal/Arsip, Staff Operasional, hingga Auditor Internal), memandu penggunaan sistem, prosedur reset kata sandi, pemantauan masa berlaku otomatis, akses online lintas perangkat, serta integrasi teknologi database modern.`,
  ];
  let curY = 37;
  foreword.forEach((p) => {
    const lines = doc.splitTextToSize(p, pageWidth - 36);
    doc.text(lines, 18, curY);
    curY += lines.length * 4.5 + 2.5;
  });

  // Lembar Pengesahan Ringkas
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(18, curY, pageWidth - 36, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('LEMBAR PENGESAHAN DOKUMEN', 24, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Disahkan di  : Jakarta, Indonesia`, 24, curY + 12);
  doc.text(`Disusun Oleh : Tim Kearsipan, Legal & TI`, 24, curY + 17);
  doc.text(`Disetujui    : Manajemen Puncak & Super Admin`, 24, curY + 22);

  doc.text(`Berlaku Efektif : Tahun 2026 - Seterusnya`, 110, curY + 12);
  doc.text(`Klasifikasi     : Sangat Rahasia (Confidential)`, 110, curY + 17);
  doc.text(`Distribusi      : Terkendali via Akun Sistem`, 110, curY + 22);

  curY += 34;

  // Daftar Isi Terstruktur
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR ISI BUKU PANDUAN', 18, curY);
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(1);
  doc.line(18, curY + 3, 50, curY + 3);

  const tocItems = [
    { title: 'BAB I: Gambaran Umum, Visi & Arsitektur Dashboard Realtime', page: 'Hal. 3' },
    { title: 'BAB II: Spesifikasi & Struktur 8 Kategori Arsip Dokumen', page: 'Hal. 4 - 6' },
    { title: '  • Sub-bab 2.1: E-SPPT, E-NOP, E-Sertifikat Tanah & E-IMB', page: 'Hal. 4' },
    { title: '  • Sub-bab 2.2: Sertifikat K3 & Sertifikat Hak Merk (DJKI)', page: 'Hal. 5' },
    { title: '  • Sub-bab 2.3: Sertifikat Laik Operasi (SLO - 28 Atribut Data)', page: 'Hal. 5' },
    { title: '  • Sub-bab 2.4: Sertifikat Uji Timbangan (Metrologi Legal - 23 Atribut Data)', page: 'Hal. 6' },
    { title: 'BAB III: Manajemen Lokasi Fisik & Standardisasi Label Arsip 3x8 cm', page: 'Hal. 7' },
    { title: 'BAB IV: Manajemen Pengguna, Matriks Hak Akses (RBAC) & Reset Password', page: 'Hal. 8' },
    { title: 'BAB V: Panduan Penggunaan Online, PWA & Opsi Deployment Hosting', page: 'Hal. 9' },
    { title: 'BAB VI: Panduan Integrasi Database Cloud: Supabase vs Cloud SQL PostgreSQL', page: 'Hal. 10 - 11' },
    { title: 'BAB VII: Standar Operasional Prosedur (SOP) Audit & Jadwal Kalibrasi', page: 'Hal. 12' },
  ];

  curY += 8;
  doc.setFontSize(8.5);
  tocItems.forEach((item) => {
    const isSub = item.title.startsWith('  •');
    doc.setFont('helvetica', isSub ? 'normal' : 'bold');
    doc.setTextColor(isSub ? 71 : 15, isSub ? 85 : 23, isSub ? 105 : 42);
    doc.text(item.title, 18, curY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(item.page, pageWidth - 18, curY, { align: 'right' });

    // Dotted line
    doc.setLineDashPattern([0.8, 1.5], 0);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    const textW = doc.getTextWidth(item.title);
    doc.line(18 + textW + 3, curY - 0.5, pageWidth - 32, curY - 0.5);
    doc.setLineDashPattern([], 0);

    curY += 6.5;
  });

  // ==========================================
  // HALAMAN 3: BAB I - GAMBARAN UMUM SISTEM
  // ==========================================
  doc.addPage();
  addHeaderFooter(3, 'BAB I: GAMBARAN UMUM SISTEM');

  let y = drawChapterBanner(
    'BAB I',
    'GAMBARAN UMUM, VISI & ARSITEKTUR REALTIME',
    'Konsep Digital Twin Arsip, Struktur Dashboard, dan Sistem Pengingat Otomatis',
    22
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('1.1 Filosofi Digital Twin Kearsipan Perusahaan', 18, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const p1 = [
    `Sistem Manajemen Arsip Dokumen Terpadu dirancang dengan pendekatan Digital Twin, yaitu menghubungkan setiap lembar fisik dokumen legal yang tersimpan di brankas atau lemari besi kantor dengan salinan digital terenkripsi di sistem cloud.`,
    `Tujuan utama sistem adalah mencegah risiko kerugian perusahaan akibat kelalaian jatuh tempo pajak, keterlambatan perpanjangan izin operasional K3/SLO, hilangnya hak merk dagang, maupun kadaluarsanya sertifikat kalibrasi timbangan pabrik.`,
  ];
  p1.forEach((p) => {
    const lines = doc.splitTextToSize(p, pageWidth - 36);
    doc.text(lines, 18, y);
    y += lines.length * 4.3 + 2;
  });

  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('1.2 Fitur Unggulan Dashboard Realtime', 18, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Komponen Dashboard', 'Fungsi & Nilai Manajerial', 'Status Pemantauan']],
    body: [
      [
        'Strip Counter 8 Kategori',
        'Menampilkan kuantitas real-time arsip (E-SPPT, E-NOP, Tanah, IMB, K3, Merk, SLO, Timbangan).',
        'Real-time & Live counter',
      ],
      [
        'Mesin Pengingat Jatuh Tempo (Deadline Engine)',
        'Mengkalkulasi selisih hari tanggal jatuh tempo pajak, hak merk, kelaikan SLO & tera timbangan.',
        'Aman, Peringatan (<=30 hr), Overdue',
      ],
      [
        'Distribusi Lokasi Fisik',
        'Menyajikan rekapitulasi persentase penyimpanan dokumen pada setiap lemari/brankas fisik.',
        'Pelacakan Akurat Per Ruangan',
      ],
      [
        'Ekspor Multi-Format Laporan',
        'Mendukung cetak Laporan Eksekutif format Microsoft Excel (.xlsx) dan Adobe PDF (.pdf).',
        'Tersedia Sheet & Tabel Terpisah',
      ],
      [
        'Studio Cetak Label 3x8 cm',
        'Mencetak stiker barcode label standar arsip fisik untuk ditempel pada ordner/map dokumen asli.',
        'Format Siap Cetak (A4 Layout)',
      ],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: 18, right: 18 },
  });

  // ==========================================
  // HALAMAN 4: BAB II - STRUKTUR DOKUMEN (BAGIAN 1)
  // ==========================================
  doc.addPage();
  addHeaderFooter(4, 'BAB II: STRUKTUR DOKUMEN (PBB, TANAH, IMB)');

  y = drawChapterBanner(
    'BAB II',
    'SPESIFIKASI & STRUKTUR 8 KATEGORI ARSIP DOKUMEN',
    'Standar Atribut Kolom, Format Validasi, dan Rekonsiliasi Data Legal',
    22
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(29, 78, 216);
  doc.text('2.1 Dokumen Perpajakan PBB (E-SPPT & E-NOP)', 18, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Kategori', 'Atribut Kunci', 'Keterangan & Logika Validasi']],
    body: [
      [
        'E-SPPT (Pajak PBB)',
        'No Arsip, NOP (18 digit), Tahun Pajak, Letak Objek, Wajib Pajak, PBB Terhutang, Jatuh Tempo, Lokasi Fisik',
        'Kewajiban tagihan pajak tahunan. Memiliki perhitungan deadline denda jika melewati tanggal jatuh tempo.',
      ],
      [
        'Bukti Bayar PBB (E-NOP)',
        'No Arsip, NOP, Tanggal Bayar, Status Bayar (Lunas / Cicilan / Belum), Relasi E-SPPT, Bukti Scan Bank',
        'Bukti pembayaran sah kas daerah / Bapenda. Berfungsi sebagai bukti pelunasan bebas sengketa pajak.',
      ],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(29, 78, 216);
  doc.text('2.2 Dokumen Aset Properti & Bangunan (E-Sertifikat Tanah & E-IMB)', 18, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Kategori Dokumen', 'Atribut Data Wajib', 'Validasi & Penataan Fisik']],
    body: [
      [
        'E-Sertifikat Tanah',
        'No Arsip, Jenis Hak (HGB/SHM/HPL), Nomor Sertifikat, NIB (Nomor Identifikasi Bidang), Nama Pemegang Hak, Luas Tanah (m2), Letak Desa/Kec/Kota, Lokasi Brankas',
        'Dokumen kepemilikan aset tertinggi. Wajib disimpan dalam brankas tahan api kategori A-01.',
      ],
      [
        'E-IMB (Izin Bangunan)',
        'No Arsip, No Keputusan IMB, Tahun Penerbitan, Atas Nama, Bangunan Induk, Kelurahan/Kecamatan, Lokasi Fisik',
        'Legalitas konstruksi gedung pabrik/kantor. Menjadi prasyarat perizinan operasional dinas tata ruang.',
      ],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  // ==========================================
  // HALAMAN 5: BAB II - STRUKTUR DOKUMEN (BAGIAN 2: K3, MERK & SLO)
  // ==========================================
  doc.addPage();
  addHeaderFooter(5, 'BAB II: STRUKTUR DOKUMEN (K3, MERK, SLO)');

  y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(29, 78, 216);
  doc.text('2.3 Sertifikat K3 & Sertifikat Merk Dagang (DJKI)', 18, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Kategori', 'Parameter Utama', 'Ketentuan Hukum & Perpanjangan']],
    body: [
      [
        'Sertifikat K3 (Alat Pabrik)',
        'Jenis Objek (Forklift, Boiler, Bejana Tekan, Crane), Merk/Tipe, No Seri, Pabrik Pembuat, Kapasitas Beban, Tgl Riksa, Berlaku s/d',
        'Kepatuhan UU No. 1 Tahun 1970 tentang Keselamatan Kerja. Wajib uji berkala tahunan.',
      ],
      [
        'Sertifikat Merk (DJKI)',
        'No Pendaftaran (IDM), Tanggal Penerimaan, Etiket Merk (Gambar Scan), Kelas Barang/Jasa (NICE), Nama Pemilik, Jatuh Tempo (10 Thn)',
        `Perlindungan hak eksklusif brand produk ${companyName}. Wajib perpanjangan sebelum jatuh tempo 10 tahun.`,
      ],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [194, 65, 12], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(29, 78, 216);
  doc.text('2.4 Sertifikat Laik Operasi (SLO) — 28 Atribut Kolom', 18, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'SLO adalah sertifikasi resmi kelaikan operasi teknis instalasi listrik dan genset pabrik sesuai standar ESDM/LIT.',
    18,
    y
  );
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['No', 'Kolom / Field', 'Opsi Dropdown Standar', 'Definisi & Fungsi Operasional']],
    body: [
      ['1', 'ID_SLO', 'Auto Generated (SLO-...)', 'Nomor unik identitas data dalam sistem'],
      ['2', 'JENIS_SLO', 'GENSET, LISTRIK', 'Klasifikasi instalasi: pembangkit atau pemanfaatan'],
      ['3', 'NO_SLO', 'Format Resmi LIT', 'Nomor sertifikat sah kelaikan operasi instalasi'],
      ['4-5', 'TANGGAL_TERBIT / BERLAKU', 'Format YYYY-MM-DD', 'Masa berlaku kelaikan (biasanya 5 tahun)'],
      ['6', 'STATUS_SLO', 'AKTIF, PROSES, KADALUARSA, DICABUT', 'Status hukum izin kelaikan operasional instalasi'],
      ['7-9', 'PERUSAHAAN / LOKASI / ALAMAT', 'Teks Lengkap', 'Identitas pemilik dan titik koordinat pabrik/gardu'],
      ['10', 'JENIS_INSTALASI', 'PEMBANGKIT, PEMANFAATAN', 'Tujuan instalasi listrik (daya sendiri / PLN)'],
      ['11', 'SUMBER_ENERGI', 'DIESEL, GAS, BENSIN, PLN, LAINNYA', 'Bahan bakar atau sumber pasokan tenaga penggerak'],
      ['12-14', 'MEREK / TIPE / NO SERI', 'Spesifikasi Pabrik', 'Identitas fisik genset, panel daya, atau transformator'],
      ['15-19', 'KAPASITAS_KVA, KW, V, FASA, HZ', '1 FASA, 3 FASA', 'Parameter teknis daya kVA, kW, voltase, dan frekuensi'],
      ['20-22', 'NO PENYEDIA / LIT / REGISTRASI', 'ID PLN & Lembaga LIT', 'Nomor registrasi resmi lembaga inspeksi teknik'],
      ['23-26', 'FILE_SLO, PENDUKUNG, PIC, KET', 'Lampiran Dokumen & Catatan', 'Dokumen PDF scan SLO, single line diagram & PIC'],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 6.8, cellPadding: 1.8 },
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  // ==========================================
  // HALAMAN 6: BAB II - STRUKTUR DOKUMEN (BAGIAN 3: UJI TIMBANGAN)
  // ==========================================
  doc.addPage();
  addHeaderFooter(6, 'BAB II: STRUKTUR UJI TIMBANGAN (23 ATRIBUT)');

  y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.text('2.5 Spesifikasi Modul Uji Timbangan (Metrologi Legal & Tera)', 18, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const pTmb = [
    `Modul Uji Timbangan mengelola sertifikasi kalibrasi dan tera alat ukur timbangan sesuai UU No. 2 Tahun 1981 tentang Metrologi Legal.`,
    `Terdapat 2 jenis timbangan dengan atribut khusus yang diakomodasi: Timbangan Elektronik (misal: QC & Lab) dan Timbangan Jembatan Elektronik (misal: Weighbridge Truk Pabrik).`,
  ];
  pTmb.forEach((p) => {
    const lines = doc.splitTextToSize(p, pageWidth - 36);
    doc.text(lines, 18, y);
    y += lines.length * 4.2 + 1.5;
  });

  autoTable(doc, {
    startY: y + 2,
    head: [['No', 'Atribut Data', 'Penerapan Dokumen', 'Deskripsi & Nilai Standar']],
    body: [
      ['1', 'ID_PENGUJIAN', 'Keduanya', 'Nomor registrasi identitas uji dalam sistem'],
      ['2', 'JENIS_TIMBANGAN', 'Dropdown Wajib', 'ELEKTRONIK atau JEMBATAN ELEKTRONIK'],
      ['3', 'NOMOR_SURAT_PENGUJIAN', 'Keduanya', 'Nomor surat keterangan hasil pengujian (SKHP)'],
      ['4', 'NOMOR_ORDER', 'Timbangan Elektronik', 'Nomor order / SPK kalibrasi laboratorium'],
      ['5-8', 'NAMA_ALAT, MEREK, TIPE, NO_SERI', 'Keduanya', 'Identitas fisik unit instrumen timbang'],
      ['9-10', 'KAPASITAS_MAKS & MIN (KG)', 'Keduanya', 'Beban uji operasional terendah dan tertinggi'],
      ['11', 'DAYA_BACA_KG', 'Timbangan Elektronik', 'Resolusi daya baca digital timbangan lab/QC (kg)'],
      ['12', 'INTERVAL_SKALA_TERKECIL_D_KG', 'Timbangan Jembatan', 'Nilai interval skala aktual jembatan timbang (d)'],
      ['13', 'INTERVAL_SKALA_VERIFIKASI_E_KG', 'Timbangan Jembatan', 'Nilai interval skala verifikasi legal tera (e)'],
      ['14', 'KELAS_KEAKURASIAN', 'Keduanya', 'Kelas akurasi metrologi: Kelas I, II, III (Sedang), IV'],
      ['15-16', 'PEMILIK_PEMAKAI & ALAMAT', 'Keduanya', 'Entitas pabrik dan alamat lokasi unit terpasang'],
      ['17-18', 'INSTANSI_PENERBIT & UNIT', 'Keduanya', 'Balai Standardisasi Metrologi Legal (BSML/UPTD)'],
      ['19-20', 'NO & TGL SK_KKPTTU_UUTP', 'Timbangan Jembatan', 'Surat Keputusan Izin Tanda Pabrik UUTP'],
      ['21-23', 'TGL TERBIT, TEMPAT, BERLAKU S/D', 'Keduanya', 'Masa berlaku legal tera (wajib ditera ulang)'],
      ['24-25', 'STATUS_DOKUMEN & MASA_BERLAKU', 'Dropdown Otomatis', 'LENGKAP / BELUM; AKTIF / SEGERA HABIS / KADALUARSA'],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 6.8, cellPadding: 1.8 },
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  // ==========================================
  // HALAMAN 7: BAB III - LOKASI FISIK & LABEL 3X8 CM
  // ==========================================
  doc.addPage();
  addHeaderFooter(7, 'BAB III: LOKASI FISIK & CETAK LABEL');

  y = drawChapterBanner(
    'BAB III',
    'MANAJEMEN LOKASI FISIK & STANDARISASI LABEL 3x8 CM',
    'Tata Kelola Penyimpanan Fisik, Penanggung Jawab, dan Cetak Barcode',
    22
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('3.1 Standar Kodifikasi Lokasi Penyimpanan Fisik', 18, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Kode Lokasi', 'Nama Lemari / Rak Fisik', 'Penanggung Jawab', 'Kategori Dokumen Utama']],
    body: [
      ['loc-1', 'Lemari Besi A-01 (Pajak & Tanah)', 'Budi Santoso, S.E.', 'E-NOP, E-SPPT, dan Sertifikat Tanah Asli'],
      ['loc-2', 'Brankas HAKI B-02 (Sertifikat & Merk)', 'Siti Rahmawati, S.H.', 'Sertifikat Merk DJKI, Lisensi & Paten'],
      ['loc-3', 'Kabinet HSE C-01 (K3, SLO & Timbangan)', 'Ir. Hendra Wijaya', 'Sertifikat K3, SLO Genset & Kalibrasi Timbangan'],
      ['loc-4', 'Lemari Arsip Cabang Surabaya D-04', 'Dwi Prasetyo, S.T.', 'Salinan Legalisir Dokumen Operasional Cabang'],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('3.2 Spesifikasi Studio Cetak Label Barcode 3x8 cm', 18, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const pLabel = [
    `Setiap dokumen fisik yang dimasukkan ke dalam map ordner wajib ditempeli stiker label berukuran presisi 3x8 cm yang dicetak langsung melalui menu Pelaporan -> Cetak Label.`,
    `Format label memuat: Nama Perusahaan, Kategori Dokumen, Nomor Arsip Sistem, Nomor Registrasi Resmi, Lokasi Lemari Fisik, serta Barcode Identitas Dokumen untuk mempercepat proses stock opname dan audit fisik tahunan.`,
  ];
  pLabel.forEach((p) => {
    const lines = doc.splitTextToSize(p, pageWidth - 36);
    doc.text(lines, 18, y);
    y += lines.length * 4.3 + 2;
  });

  // ==========================================
  // HALAMAN 8: BAB IV - MANAJEMEN PENGGUNA & RESET PASSWORD
  // ==========================================
  doc.addPage();
  addHeaderFooter(8, 'BAB IV: PENGGUNA & KEBIJAKAN RESET PASSWORD');

  y = drawChapterBanner(
    'BAB IV',
    'MANAJEMEN PENGGUNA, MATRIKS RBAC & RESET PASSWORD',
    'Hak Akses Bertingkat, Perlindungan Super Admin, dan Standar Kredensial',
    22
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('4.1 Matriks Hak Akses Berjenjang (Role-Based Access Control)', 18, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Tingkatan Level', 'Nama Peran (Role)', 'Hak Akses Utama', 'Notifikasi Email']],
    body: [
      [
        'Level 1 - Super Admin',
        'Super Administrator (admin, admin.pusat)',
        'Akses penuh: Tambah/Edit/Hapus arsip, kelola user & role, reset password, konfigurasi sistem',
        'Ya (Jatuh tempo & sistem)',
      ],
      [
        'Level 2 - Admin Arsip',
        'Admin Arsip & Legal (siti.legal)',
        'Input/Edit arsip legal, cetak label, unduh laporan Excel/PDF, kelola kategori master',
        'Ya (K3, Merk, SLO & Timbangan)',
      ],
      [
        'Level 3 - Staff Operasional',
        'Staff Pajak / Staff HSE (budi.pajak, hendra.k3)',
        'Input dan pembaruan dokumen sesuai departemen masing-masing (Pajak PBB atau K3/Teknis)',
        'Ya (Jatuh tempo departemen)',
      ],
      [
        'Level 4 - Viewer',
        'Internal Audit / Manajemen (auditor.internal)',
        'Hanya melihat data (Read-Only) dan mengunduh laporan rekapitulasi audit kearsipan',
        'Tidak menerima email',
      ],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('4.2 Kebijakan & Prosedur Reset Password Non-Super Admin', 18, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const pPass = [
    `Untuk menjaga kepatuhan dan integritas data, sistem menerapkan kebijakan reset kata sandi sebagai berikut:`,
    `1. Akun Super Admin Tidak Boleh Terdampak: Password akun level Super Administrator (admin & admin.pusat) tidak diubah untuk mencegah hilangnya kendali administratif perusahaan.`,
    `2. Reset Password Terpusat: Seluruh akun pengguna level 2, level 3, dan level 4 direset seragam menjadi kata sandi default sementara: password123.`,
    `3. Mekanisme Eksekusi: Super Admin dapat menekan tombol "Reset Password Non-Super Admin" di menu Pengaturan kapan pun diperlukan peremajaan kredensial tim.`,
  ];
  pPass.forEach((p) => {
    const lines = doc.splitTextToSize(p, pageWidth - 36);
    doc.text(lines, 18, y);
    y += lines.length * 4.3 + 2;
  });

  // ==========================================
  // HALAMAN 9: BAB V - PANDUAN ONLINE & DEPLOYMENT
  // ==========================================
  doc.addPage();
  addHeaderFooter(9, 'BAB V: PANDUAN ONLINE, PWA & DEPLOYMENT');

  y = drawChapterBanner(
    'BAB V',
    'PANDUAN AKSES ONLINE, INSTALASI PWA & DEPLOYMENT',
    'Akses Cloud Run, Pemasangan di Komputer/Ponsel, dan Opsi Hosting Mandiri',
    22
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('5.1 Akses Langsung Online di Cloud Run', 18, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const pOnline = [
    `Aplikasi ini telah terdeploy aktif di infrastruktur Google Cloud Run dan dapat langsung diakses oleh seluruh jajaran karyawan melalui tautan resmi:`,
    `Tautan Akses: https://ais-pre-hgdpw2wfdbi5fafiwexhrv-836903566282.asia-northeast1.run.app`,
    `Akses online ini tidak membutuhkan instalasi server lokal, telah mendukung enkripsi SSL/HTTPS otomatis, dan dapat dibuka 24 jam sehari dari jaringan mana pun.`,
  ];
  pOnline.forEach((p) => {
    const lines = doc.splitTextToSize(p, pageWidth - 36);
    doc.text(lines, 18, y);
    y += lines.length * 4.3 + 1.5;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('5.2 Pemasangan Progressive Web App (PWA) di Desktop / Android / iOS', 18, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Perangkat / Platform', 'Langkah-langkah Pemasangan', 'Keuntungan bagi Staf']],
    body: [
      [
        'PC Desktop & Laptop (Chrome / Edge)',
        '1. Buka URL sistem di Chrome/Edge\n2. Klik ikon "Install App" di kanan address bar\n3. Konfirmasi "Install"',
        'Tampil di Start Menu & Desktop tanpa address bar browser, membuka lebih cepat.',
      ],
      [
        'Smartphone Android (Chrome)',
        '1. Buka URL di Google Chrome\n2. Ketuk tombol menu titik tiga (kanan atas)\n3. Pilih "Tambahkan ke Layar Utama"',
        'Ikon aplikasi muncul di layar HP layaknya aplikasi Android native dari Play Store.',
      ],
      [
        'Apple iPhone & iPad (Safari)',
        '1. Buka URL di Safari\n2. Ketuk ikon "Bagikan / Share" (kotak panah atas)\n3. Pilih "Add to Home Screen"',
        'Aplikasi berjalan fullscreen dan nyaman digunakan saat inspeksi lapangan.',
      ],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  // ==========================================
  // HALAMAN 10: BAB VI - INTEGRASI DATABASE CLOUD (BAGIAN 1)
  // ==========================================
  doc.addPage();
  addHeaderFooter(10, 'BAB VI: INTEGRASI SUPABASE & CLOUD SQL');

  y = drawChapterBanner(
    'BAB VI',
    'PANDUAN INTEGRASI DATABASE CLOUD (SUPABASE & CLOUD SQL)',
    'Komparasi Arsitektur, Skema PostgreSQL Relasional, dan Panduan Setup',
    22
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('6.1 Perbandingan: Supabase vs Cloud SQL PostgreSQL', 18, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Karakteristik', 'Opsi A: Supabase (BaaS)', 'Opsi B: Cloud SQL PostgreSQL (GCP Native)']],
    body: [
      ['Mesin Database', 'PostgreSQL v15+', 'PostgreSQL v16 (Developer Edition)'],
      ['Penyedia Layanan', 'Supabase Inc. (Eksternal)', 'Google Cloud Platform (Bawaan Project Ini)'],
      ['Autentikasi & RLS', 'Supabase Auth & Row Level Security', 'Firebase Auth + Cloud SQL Drizzle ORM'],
      ['Kemudahan Setup', 'Sangat mudah via API Key (.env)', 'Instan via UI bawaan AI Studio (Sudah Eligible)'],
      ['Rekomendasi Penggunaan', 'Jika perusahaan telah berlangganan Supabase', 'Jika ingin all-in-one di cloud Google tanpa vendor lain'],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('6.2 Langkah Praktis Menghubungkan ke Supabase', 18, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const stepsSupabase = [
    'Langkah 1: Buat project baru di portal Supabase (https://supabase.com).',
    'Langkah 2: Buka menu Project Settings -> API, lalu salin Project URL dan anon public key.',
    'Langkah 3: Tambahkan konfigurasi env di aplikasi: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
    'Langkah 4: Jalankan skrip DDL SQL (lihat halaman 11) di Supabase SQL Editor untuk membuat tabel.',
    'Langkah 5: Data dokumen arsip tersinkronisasi otomatis secara terpusat dan aman.',
  ];
  stepsSupabase.forEach((s) => {
    doc.text(s, 18, y);
    y += 5.5;
  });

  // ==========================================
  // HALAMAN 11: BAB VI - SKEMA SQL RELASIONAL
  // ==========================================
  doc.addPage();
  addHeaderFooter(11, 'BAB VI: SKEMA SQL LENGKAP (POSTGRESQL / SUPABASE)');

  y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.text('6.3 Skrip DDL Tabel SQL untuk Supabase & PostgreSQL', 18, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Skrip SQL berikut siap dieksekusi langsung pada Supabase SQL Editor atau Cloud SQL psql shell:',
    18,
    y
  );
  y += 5;

  const sqlSnippets = [
    '-- 1. TABEL SERTIFIKAT LAIK OPERASI (SLO)\nCREATE TABLE docs_slo (\n  id VARCHAR(64) PRIMARY KEY,\n  no_arsip VARCHAR(64) NOT NULL UNIQUE,\n  id_slo VARCHAR(64),\n  jenis_slo VARCHAR(32) NOT NULL, -- GENSET / LISTRIK\n  no_slo VARCHAR(128) NOT NULL,\n  tanggal_terbit DATE NOT NULL,\n  tanggal_berlaku DATE NOT NULL,\n  status_slo VARCHAR(32) NOT NULL, -- AKTIF, PROSES, KADALUARSA, DICABUT\n  nama_perusahaan VARCHAR(255) NOT NULL,\n  lokasi_instalasi VARCHAR(255) NOT NULL,\n  kapasitas_kva NUMERIC(10,2) NOT NULL,\n  daya_kw NUMERIC(10,2) NOT NULL,\n  fasa VARCHAR(16) NOT NULL, -- 1 FASA, 3 FASA\n  arsip_dokumen_id VARCHAR(64) NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);',
    '-- 2. TABEL SERTIFIKAT UJI TIMBANGAN (METROLOGI UTTP)\nCREATE TABLE docs_timbangan (\n  id VARCHAR(64) PRIMARY KEY,\n  no_arsip VARCHAR(64) NOT NULL UNIQUE,\n  id_pengujian VARCHAR(64),\n  jenis_timbangan VARCHAR(64) NOT NULL, -- ELEKTRONIK, JEMBATAN ELEKTRONIK\n  nomor_surat_pengujian VARCHAR(128) NOT NULL,\n  nomor_order VARCHAR(128),\n  nama_alat_ukur VARCHAR(255) NOT NULL,\n  merek_pabrik_buatan VARCHAR(128) NOT NULL,\n  model_tipe VARCHAR(128) NOT NULL,\n  nomor_seri_identitas VARCHAR(128) NOT NULL,\n  kapasitas_maksimum_kg NUMERIC(12,2) NOT NULL,\n  kapasitas_minimum_kg NUMERIC(12,2) NOT NULL,\n  daya_baca_kg NUMERIC(10,4),\n  interval_skala_terkecil_d_kg NUMERIC(10,4),\n  interval_skala_verifikasi_e_kg NUMERIC(10,4),\n  kelas_keakurasian VARCHAR(32) NOT NULL,\n  pemilik_pemakai VARCHAR(255) NOT NULL,\n  berlaku_sampai DATE NOT NULL,\n  status_dokumen VARCHAR(32) NOT NULL, -- LENGKAP, BELUM LENGKAP\n  status_masa_berlaku VARCHAR(32) NOT NULL, -- AKTIF, SEGERA HABIS, KADALUARSA\n  arsip_dokumen_id VARCHAR(64) NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);',
  ];

  sqlSnippets.forEach((snippet) => {
    doc.setFillColor(15, 23, 42); // dark slate code block
    const lines = snippet.split('\n');
    const blockH = lines.length * 3.8 + 6;
    doc.roundedRect(18, y, pageWidth - 36, blockH, 2, 2, 'F');

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(56, 189, 248);

    lines.forEach((l, idx) => {
      if (l.startsWith('--')) {
        doc.setTextColor(251, 191, 36); // gold comment
      } else {
        doc.setTextColor(248, 250, 252);
      }
      doc.text(l, 22, y + 4.5 + idx * 3.8);
    });

    y += blockH + 6;
  });

  // ==========================================
  // HALAMAN 12: BAB VII - SOP AUDIT & PENUTUP
  // ==========================================
  doc.addPage();
  addHeaderFooter(12, 'BAB VII: SOP AUDIT & PENUTUP');

  y = drawChapterBanner(
    'BAB VII',
    'STANDAR OPERASIONAL PROSEDUR (SOP) AUDIT & PENUTUP',
    'Checklist Kepatuhan Fisik, Audit Internal Tahunan, dan Penutup',
    22
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('7.1 Standar Operasional Prosedur Audit Fisik Kearsipan', 18, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Frekuensi Audit', 'Petugas Pemeriksa', 'Aktivitas Pemeriksaan Kepatuhan']],
    body: [
      ['Harian (Daily)', 'Staff Operasional', 'Pengecekan input dokumen baru dan upload salinan scan digital.'],
      ['Bulanan (Monthly)', 'Admin Arsip & Legal', 'Review panel pengingat jatuh tempo pajak, izin K3, SLO & tera timbangan.'],
      ['Triwulan (Quarterly)', 'Koordinator Arsip', 'Rekonsiliasi berkas fisik di rak/brankas dengan status kelengkapan label.'],
      ['Tahunan (Annual)', 'Internal Audit & Super Admin', 'Stock opname menyeluruh dan ekspor Laporan Rekapitulasi Eksekutif (Excel/PDF).'],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    margin: { left: 18, right: 18 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Sign-off signature box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(18, y, pageWidth - 36, 48, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('LEMBAR PENGESAHAN BUKU PANDUAN KEARSIPAN RESMI', pageWidth / 2, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Ditetapkan di Jakarta, Indonesia · Berlaku sejak tanggal penerbitan', pageWidth / 2, y + 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Mengetahui & Menyetujui,', 36, y + 23);
  doc.text('Pimpinan Super Administrator,', pageWidth - 36, y + 23, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(29, 78, 216);
  doc.text('( Direktur Operasional & Legal )', 36, y + 42);
  doc.text('( HRD & Kepala Arsip Terpadu )', pageWidth - 36, y + 42, { align: 'right' });

  // Save the PDF E-Book
  const fileName = `Buku_Panduan_E-Arsip_Enterprise_${companyName.replace(/\s+/g, '_')}_2026.pdf`;
  doc.save(fileName);
}
