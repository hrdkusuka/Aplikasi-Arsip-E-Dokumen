/**
 * ==============================================================================
 * SISTEM INFORMASI MANAJEMEN ARSIP DOKUMEN PERUSAHAAN (SIM-ARSIP)
 * Versi Penyimpanan Database Google Sheets via Google Apps Script Deploy
 * Kompatibel dengan: Google AI Studio, GitHub, dan Vercel (REST JSON API)
 *
 * File: Code.gs
 * Cara Pasang:
 *   1. Buka Google Spreadsheet baru -> menu Extensions (Ekstensi) > Apps Script
 *   2. Ganti seluruh isi Code.gs dengan kode ini, lalu simpan (Ctrl+S)
 *   3. Jalankan fungsi `setupSpreadsheetTabs` sekali (klik Run & beri izin akses)
 *   4. Klik Deploy > New deployment > pilih Web app:
 *      - Execute as: Me (email Anda)
 *      - Who has access: Anyone (Siapa saja)
 *   5. Salin Web App URL (.../exec) dan tempelkan di menu Aplikasi:
 *      Setting > Apps Script & Deploy (atau di Vercel Env: VITE_GAS_WEBAPP_URL)
 * ==============================================================================
 */

// Opsional: Isi token rahasia jika ingin membatasi akses tulis dari luar.
// Biarkan kosong ('') untuk koneksi langsung tanpa token tambahan.
var API_TOKEN = '';

// Folder Google Drive untuk penyimpanan lampiran digital (jika dipakai)
var DRIVE_FOLDER_NAME = 'Arsip Dokumen - Berkas Digital';

// Daftar 15 Tab Terstruktur + 1 Tab Sistem Penyimpanan Penuh
var SHEET_NAMES = {
  RINGKASAN: 'Ringkasan & Dashboard',
  ARSIP_DOKUMEN: 'Arsip Dokumen',
  ENOP: 'Bukti Bayar PBB (E-NOP)',
  ESPPT: 'Arsip E-SPPT',
  MERK: 'Sertifikat Merk',
  K3: 'Sertifikat K3',
  TANAH: 'E-Sertifikat Tanah',
  IMB: 'E-IMB & PBG',
  SLO: 'Sertifikat SLO',
  TIMBANGAN: 'Uji Timbangan',
  PROVINSI: 'Master Provinsi & Kota',
  STATUS: 'Master Status Bayar',
  ROLES: 'Master Roles',
  USERS: 'Pengguna & Otorisasi',
  COMPANY: 'Profil Perusahaan',
  SYSTEM_DB: '_AppState_DB'
};

var MAX_CELL_CHUNK = 45000;

/**
 * Helper: Membuat JSON Response yang ramah lintas-domain (AI Studio / Vercel)
 */
function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper: Validasi Token Keamanan (jika API_TOKEN diisi)
 */
function isAuthorized(token) {
  if (!API_TOKEN || API_TOKEN === '') return true;
  return String(token || '') === String(API_TOKEN);
}

/**
 * 1. Entry Point HTTP GET (doGet)
 *    - ?action=ping  -> Tes koneksi & info Spreadsheet
 *    - ?action=setup -> Buat seluruh 15 tab struktur Google Sheets
 *    - ?action=load  -> Ambil seluruh data aplikasi (AppState)
 *    - Tanpa action  -> Tampilkan status API atau Index.html (jika ada)
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || '';
  var token = params.token || '';

  if (action) {
    if (!isAuthorized(token)) {
      return createJsonResponse({
        success: false,
        error: 'Token keamanan (API_TOKEN) tidak valid.'
      });
    }

    try {
      if (action === 'ping') {
        var ss = getSpreadsheet();
        var sheets = ss.getSheets().map(function(s) { return s.getName(); });
        return createJsonResponse({
          success: true,
          message: 'Koneksi Google Apps Script API berhasil!',
          spreadsheetId: ss.getId(),
          spreadsheetName: ss.getName(),
          spreadsheetUrl: ss.getUrl(),
          tabCount: sheets.length,
          tabs: sheets,
          serverTime: new Date().toISOString()
        });
      }

      if (action === 'setup') {
        var setupRes = setupSpreadsheetTabs();
        return createJsonResponse(setupRes);
      }

      if (action === 'load') {
        var loadRes = loadFullAppState();
        return createJsonResponse(loadRes);
      }

      return createJsonResponse({
        success: false,
        error: 'Action GET tidak dikenal: ' + action
      });
    } catch (err) {
      return createJsonResponse({
        success: false,
        error: err.message || String(err)
      });
    }
  }

  // Jika dibuka langsung di browser tanpa parameter ?action=...
  var template;
  var candidateNames = ['Index', 'index'];
  for (var i = 0; i < candidateNames.length; i++) {
    try {
      template = HtmlService.createTemplateFromFile(candidateNames[i]);
      if (template) break;
    } catch (err) {}
  }

  if (template) {
    return template.evaluate()
      .setTitle('Sistem Arsip Dokumen - Google Sheets Web App')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var ssInfo = getSpreadsheet();
  return HtmlService.createHtmlOutput(
    '<div style="font-family:system-ui,-apple-system,sans-serif;max-width:620px;margin:48px auto;padding:28px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff;color:#0f172a;">' +
    '<div style="display:inline-block;padding:4px 10px;border-radius:6px;background:#ecfdf5;color:#047857;font-weight:700;font-size:12px;">ONLINE &amp; SIAP TERHUBUNG</div>' +
    '<h2 style="margin:12px 0 6px 0;font-size:20px;">Google Apps Script Database API — Arsip Dokumen</h2>' +
    '<p style="color:#475569;font-size:14px;line-height:1.6;">Endpoint penyimpanan Google Sheets telah aktif. Salin URL halaman ini (berakhiran <code>/exec</code>) lalu tempelkan ke menu <strong>Setting &gt; Apps Script &amp; Deploy</strong> pada aplikasi AI Studio atau ke Environment Variable <code>VITE_GAS_WEBAPP_URL</code> di Vercel.</p>' +
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-top:16px;font-size:13px;">' +
    '<div><strong>Spreadsheet Terhubung:</strong> ' + ssInfo.getName() + '</div>' +
    '<div style="margin-top:6px;"><strong>Total Tab Aktif:</strong> ' + ssInfo.getSheets().length + ' tab</div>' +
    '</div>' +
    '</div>'
  ).setTitle('Apps Script Database API - Aktif');
}

/**
 * 2. Entry Point HTTP POST (doPost)
 *    Menerima JSON via text/plain agar bebas error CORS preflight dari AI Studio / Vercel
 *    - { action: "setup" }
 *    - { action: "syncAll", payload: <AppState> }
 *    - { action: "uploadFile", base64Data, fileName, mimeType }
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    hasLock = lock.tryLock(20000);
    if (!hasLock) {
      return createJsonResponse({
        success: false,
        error: 'Server sibuk memproses penyimpanan lain. Silakan coba beberapa detik lagi.'
      });
    }

    var rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var body = JSON.parse(rawBody);
    var action = body.action || '';
    var token = body.token || (e && e.parameter ? e.parameter.token : '');

    if (!isAuthorized(token)) {
      return createJsonResponse({
        success: false,
        error: 'Token keamanan (API_TOKEN) tidak valid.'
      });
    }

    if (action === 'setup') {
      return createJsonResponse(setupSpreadsheetTabs());
    }

    if (action === 'syncAll') {
      if (!body.payload) {
        return createJsonResponse({
          success: false,
          error: 'Payload data aplikasi kosong.'
        });
      }
      var syncResult = syncFullAppState(body.payload);
      return createJsonResponse(syncResult);
    }

    if (action === 'uploadFile') {
      var uploadRes = uploadFileToDrive(body.base64Data, body.fileName, body.mimeType);
      return createJsonResponse(uploadRes);
    }

    return createJsonResponse({
      success: false,
      error: 'Action POST tidak dikenal: ' + action
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.message || String(err)
    });
  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

/**
 * 3. Helper Mengakses Spreadsheet Aktif (Bound atau Standalone)
 */
function getSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;

  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty('SPREADSHEET_ID');
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (e) {}
  }

  var files = DriveApp.getFilesByName('Database Arsip Dokumen Perusahaan');
  if (files.hasNext()) {
    var existing = SpreadsheetApp.open(files.next());
    props.setProperty('SPREADSHEET_ID', existing.getId());
    return existing;
  }

  var created = SpreadsheetApp.create('Database Arsip Dokumen Perusahaan');
  props.setProperty('SPREADSHEET_ID', created.getId());
  return created;
}

/**
 * 4. Definisi Lengkap Header Struktur 15 Tab Google Sheets
 */
function getHeadersMap() {
  var map = {};
  map[SHEET_NAMES.RINGKASAN] = [
    'NO', 'MODUL / MENU SISTEM', 'NAMA TAB SPREADSHEET', 'JUMLAH DATA AKTIF',
    'KETERANGAN / DESKRIPSI DATA', 'STATUS SINKRONISASI', 'WAKTU TERAKHIR DIPERBARUI'
  ];
  map[SHEET_NAMES.ARSIP_DOKUMEN] = [
    'NO', 'ID LOKASI', 'NAMA LOKASI ARSIP', 'PENANGGUNG JAWAB (PIC)',
    'LOKASI FISIK (GEDUNG / RAK / LEMARI)', 'TOTAL DOKUMEN TERSIMPAN',
    'RINCIAN DOKUMEN FISIK', 'STATUS', 'TANGGAL PEMBARUAN'
  ];
  map[SHEET_NAMES.ENOP] = [
    'NO ARSIP', 'TANGGAL TRANSAKSI', 'PROVINSI', 'KOTA / KABUPATEN',
    'STATUS BAYAR', 'NOP (18 DIGIT)', 'NAMA WAJIB PAJAK', 'ALAMAT WAJIB PAJAK',
    'TAHUN PAJAK', 'LOKASI OBJEK PAJAK', 'LOKASI ARSIP FISIK', 'NAMA BERKAS'
  ];
  map[SHEET_NAMES.ESPPT] = [
    'NO ARSIP', 'NOP (18 DIGIT)', 'TAHUN PAJAK', 'NAMA WAJIB PAJAK',
    'ALAMAT WAJIB PAJAK', 'LETAK OBJEK PAJAK', 'JATUH TEMPO',
    'LOKASI ARSIP FISIK', 'NAMA BERKAS'
  ];
  map[SHEET_NAMES.MERK] = [
    'NO ARSIP', 'NAMA PEMILIK MERK', 'ALAMAT', 'NO PENDAFTARAN',
    'ETIKET MERK / BRAND', 'NO PERMOHONAN', 'TANGGAL PENERIMAAN',
    'TANGGAL PENGAJUAN', 'JATUH TEMPO KEPEMILIKAN', 'KELAS BARANG/JASA',
    'URAIAN WARNA', 'LOKASI ARSIP FISIK', 'NAMA BERKAS'
  ];
  map[SHEET_NAMES.K3] = [
    'NO ARSIP', 'JENIS OBJEK K3', 'NAMA PERUSAHAAN', 'NAMA PEMILIK',
    'ALAMAT', 'LOKASI UNIT', 'JENIS', 'MERK', 'TYPE', 'NO SERI',
    'KAPASITAS', 'TANGGAL PEMERIKSAAN', 'MASA BERLAKU',
    'LOKASI ARSIP FISIK', 'NAMA BERKAS'
  ];
  map[SHEET_NAMES.TANAH] = [
    'NO ARSIP', 'NOMOR SERTIFIKAT', 'NIB (14 DIGIT)', 'JENIS HAK',
    'ASAL HAK', 'NAMA PEMEGANG HAK', 'LUAS TANAH (M2)', 'DESA / KELURAHAN',
    'KECAMATAN', 'KOTA/KABUPATEN', 'TANGGAL PENERBITAN', 'STATUS DOKUMEN',
    'STATUS BEBAN', 'LOKASI ARSIP FISIK', 'NAMA BERKAS'
  ];
  map[SHEET_NAMES.IMB] = [
    'NO ARSIP', 'NO KEPUTUSAN / IZIN', 'TAHUN', 'NAMA PEMILIK / ATAS NAMA',
    'BANGUNAN INDUK', 'BERMAKSUD UNTUK', 'LOKASI BANGUNAN', 'KOTA / KABUPATEN',
    'TANGGAL PERMOHONAN', 'LOKASI ARSIP FISIK', 'NAMA BERKAS'
  ];
  map[SHEET_NAMES.SLO] = [
    'NO ARSIP', 'NOMOR SLO', 'ID SLO', 'JENIS SLO', 'NAMA PERUSAHAAN',
    'JENIS INSTALASI', 'SUMBER ENERGI', 'KAPASITAS (kVA)', 'DAYA (kW)',
    'TEGANGAN (V)', 'LEMBAGA INSPEKSI', 'TANGGAL TERBIT', 'TANGGAL BERLAKU',
    'STATUS SLO', 'LOKASI ARSIP FISIK', 'NAMA BERKAS'
  ];
  map[SHEET_NAMES.TIMBANGAN] = [
    'NO ARSIP', 'ID PENGUJIAN', 'JENIS TIMBANGAN', 'NOMOR SURAT PENGUJIAN',
    'NOMOR ORDER', 'NAMA ALAT UKUR', 'MEREK PABRIK BUATAN', 'MODEL TIPE',
    'NOMOR SERI IDENTITAS', 'KAPASITAS MAKS (KG)', 'KAPASITAS MIN (KG)',
    'KELAS KEAKURASIAN', 'PEMILIK PEMAKAI', 'INSTANSI PENERBIT',
    'TANGGAL TERBIT SURAT', 'BERLAKU SAMPAI', 'STATUS MASA BERLAKU',
    'STATUS DOKUMEN', 'LOKASI ARSIP FISIK', 'NAMA BERKAS'
  ];
  map[SHEET_NAMES.PROVINSI] = [
    'NO', 'ID PROVINSI', 'NAMA PROVINSI', 'JUMLAH KOTA / KABUPATEN',
    'DAFTAR KOTA / KABUPATEN'
  ];
  map[SHEET_NAMES.STATUS] = [
    'NO', 'ID STATUS', 'NAMA STATUS BAYAR', 'KATEGORI STATUS',
    'KETERANGAN / PENJELASAN'
  ];
  map[SHEET_NAMES.ROLES] = [
    'NO', 'ID ROLE', 'NAMA ROLE', 'LEVEL AKSES', 'DESKRIPSI',
    'KELOLA MASTER', 'INPUT DOKUMEN', 'HAPUS DOKUMEN',
    'EKSPOR LAPORAN', 'KELOLA USER', 'NOTIFIKASI EMAIL'
  ];
  map[SHEET_NAMES.USERS] = [
    'NO', 'ID PENGGUNA', 'NAMA LENGKAP', 'USERNAME', 'EMAIL TERDAFTAR',
    'PERAN (ROLE)', 'LEVEL AKSES', 'STATUS AKUN', 'LOGIN TERAKHIR'
  ];
  map[SHEET_NAMES.COMPANY] = [
    'ID PARAMETER', 'NAMA PARAMETER PENGATURAN', 'NILAI / PENGATURAN SAAT INI',
    'KETERANGAN / FUNGSI SISTEM', 'WAKTU TERAKHIR DIPERBARUI'
  ];
  return map;
}

/**
 * 5. Inisialisasi Otomatis Seluruh 15 Tab Struktur + 1 Tab Sistem (_AppState_DB)
 *    Jalankan fungsi ini sekali di editor Apps Script atau lewat tombol di aplikasi!
 */
function setupSpreadsheetTabs() {
  var ss = getSpreadsheet();
  var headersMap = getHeadersMap();
  var createdTabs = [];
  var existingTabs = [];

  for (var tabKey in headersMap) {
    var sheet = ss.getSheetByName(tabKey);
    if (!sheet) {
      sheet = ss.insertSheet(tabKey);
      createdTabs.push(tabKey);
    } else {
      existingTabs.push(tabKey);
    }

    var headerRow = headersMap[tabKey];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      var headerRange = sheet.getRange(1, 1, 1, headerRow.length);
      headerRange
        .setBackground('#0f172a')
        .setFontColor('#ffffff')
        .setFontWeight('bold')
        .setHorizontalAlignment('left');
      sheet.setFrozenRows(1);
    }
  }

  // Siapkan tab sistem _AppState_DB untuk penyimpanan snapshot JSON utuh (lossless)
  var sysSheet = ss.getSheetByName(SHEET_NAMES.SYSTEM_DB);
  if (!sysSheet) {
    sysSheet = ss.insertSheet(SHEET_NAMES.SYSTEM_DB);
    sysSheet.getRange(1, 1, 1, 3).setValues([['CHUNK_INDEX', 'UPDATED_AT', 'JSON_CHUNK']]);
    sysSheet.setFrozenRows(1);
    try {
      sysSheet.hideSheet();
    } catch (e) {}
  }

  // Hapus sheet bawaan kosong 'Sheet1' jika tab terstruktur sudah berhasil dibuat
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }

  return {
    success: true,
    message: 'Struktur 15 tab Google Sheets berhasil disiapkan!',
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    spreadsheetUrl: ss.getUrl(),
    createdTabs: createdTabs,
    existingTabs: existingTabs
  };
}

/**
 * Helper Menulis Tabel secara Cepat & Atomik
 */
function writeTableSheet(ss, sheetName, header, rows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.clearContents();
  var allRows = [header].concat(rows || []);
  sheet.getRange(1, 1, allRows.length, header.length).setValues(allRows);

  var headerRange = sheet.getRange(1, 1, 1, header.length);
  headerRange
    .setBackground('#0f172a')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * 6. Menyimpan Seluruh Data Aplikasi ke 15 Tab Terstruktur + _AppState_DB
 */
function syncFullAppState(state) {
  setupSpreadsheetTabs();
  var ss = getSpreadsheet();
  var headersMap = getHeadersMap();
  var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  var locations = state.masterLocations || [];
  var provinces = state.masterProvinces || [];
  var statuses = state.masterStatuses || [];
  var docsENOP = state.docsENOP || [];
  var docsESPPT = state.docsESPPT || [];
  var docsMerk = state.docsMerk || [];
  var docsK3 = state.docsK3 || [];
  var docsTanah = state.docsTanah || [];
  var docsIMB = state.docsIMB || [];
  var docsSLO = state.docsSLO || [];
  var docsTimbangan = state.docsTimbangan || [];
  var roles = state.roles || [];
  var users = state.users || [];
  var company = state.companyProfile || {
    namaPerusahaan: 'PT Kusuka Prima Nusantara',
    logoDataUrl: '',
    logoFileName: 'Logo_Default.svg'
  };

  function locName(id) {
    for (var i = 0; i < locations.length; i++) {
      if (locations[i].id === id) return locations[i].namaLokasi;
    }
    return id || '-';
  }

  function provName(id) {
    for (var i = 0; i < provinces.length; i++) {
      if (provinces[i].id === id) return provinces[i].namaProvinsi;
    }
    return id || '-';
  }

  function statusName(id) {
    for (var i = 0; i < statuses.length; i++) {
      if (statuses[i].id === id) return statuses[i].namaStatus;
    }
    return id || '-';
  }

  function countDocsInLoc(arr, locId) {
    var c = 0;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].arsipDokumenId === locId) c++;
    }
    return c;
  }

  // 1. Tab Arsip Dokumen (Master Lokasi)
  var locRows = locations.map(function(l, idx) {
    var cEnop = countDocsInLoc(docsENOP, l.id);
    var cEsppt = countDocsInLoc(docsESPPT, l.id);
    var cMerk = countDocsInLoc(docsMerk, l.id);
    var cK3 = countDocsInLoc(docsK3, l.id);
    var cTanah = countDocsInLoc(docsTanah, l.id);
    var cImb = countDocsInLoc(docsIMB, l.id);
    var cSlo = countDocsInLoc(docsSLO, l.id);
    var cTmb = countDocsInLoc(docsTimbangan, l.id);
    var total = cEnop + cEsppt + cMerk + cK3 + cTanah + cImb + cSlo + cTmb;
    var parts = [];
    if (cEnop) parts.push(cEnop + ' E-NOP');
    if (cEsppt) parts.push(cEsppt + ' E-SPPT');
    if (cMerk) parts.push(cMerk + ' Merk');
    if (cK3) parts.push(cK3 + ' K3');
    if (cTanah) parts.push(cTanah + ' Tanah');
    if (cImb) parts.push(cImb + ' IMB');
    if (cSlo) parts.push(cSlo + ' SLO');
    if (cTmb) parts.push(cTmb + ' Timbangan');
    return [
      idx + 1, l.id || '', l.namaLokasi || '', l.penanggungJawab || '',
      l.lokasi || '', total, parts.join(', ') || 'Belum ada dokumen',
      'Aktif', nowStr
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.ARSIP_DOKUMEN, headersMap[SHEET_NAMES.ARSIP_DOKUMEN], locRows);

  // 2. Tab E-NOP
  var enopRows = docsENOP.map(function(d) {
    return [
      d.noArsip || '', d.tanggalTransaksi || '', provName(d.provinsiId),
      d.kotaKabupaten || '', statusName(d.statusBayarId), "'" + (d.nop || ''),
      d.namaWajibPajak || d.namaNop || '-', d.alamatWajibPajak || '-',
      d.tahunPajak || '', d.lokasiAlamat || '', locName(d.arsipDokumenId),
      (d.fileAttachment && d.fileAttachment.name) ? d.fileAttachment.name : '-'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.ENOP, headersMap[SHEET_NAMES.ENOP], enopRows);

  // 3. Tab E-SPPT
  var espptRows = docsESPPT.map(function(d) {
    return [
      d.noArsip || '', "'" + (d.nop || ''), d.tahun || '',
      d.namaWajibPajak || '-', d.alamatWajibPajak || '-',
      d.letakObjekPajak || '', d.jatuhTempo || '', locName(d.arsipDokumenId),
      (d.fileAttachment && d.fileAttachment.name) ? d.fileAttachment.name : '-'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.ESPPT, headersMap[SHEET_NAMES.ESPPT], espptRows);

  // 4. Tab Sertifikat Merk
  var merkRows = docsMerk.map(function(d) {
    return [
      d.noArsip || '', d.nama || '', d.alamat || '', d.noPendaftaran || '',
      d.etiketMerk || '', d.noPermohonan || '', d.tanggalPenerimaan || '',
      d.tanggalPengajuan || '', d.tglJatuhTempoKepemilikan || '-',
      d.kelasBarangJasa || '', d.uraianWarna || '', locName(d.arsipDokumenId),
      (d.fileAttachment && d.fileAttachment.name) ? d.fileAttachment.name : '-'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.MERK, headersMap[SHEET_NAMES.MERK], merkRows);

  // 5. Tab Sertifikat K3
  var k3Rows = docsK3.map(function(d) {
    return [
      d.noArsip || '', d.jenisObjekK3 || '', d.namaPerusahaan || '',
      d.namaPemilik || '', d.alamat || '', d.lokasiUnit || '',
      d.jenis || '', d.merk || '', d.type || '', d.noSeri || '',
      d.kapasitas || '', d.tanggalPemeriksaan || '', d.berlakuSampaiTanggal || '',
      locName(d.arsipDokumenId),
      (d.fileAttachment && d.fileAttachment.name) ? d.fileAttachment.name : '-'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.K3, headersMap[SHEET_NAMES.K3], k3Rows);

  // 6. Tab E-Sertifikat Tanah
  var tanahRows = docsTanah.map(function(d) {
    return [
      d.noArsip || '', d.nomorSertifikat || '', "'" + (d.nib || ''),
      d.jenisHak || '', d.asalHak || '', d.namaPemegangHak || '',
      d.luasTanah || 0, d.desaKelurahan || '', d.kecamatan || '',
      d.kotaKabupaten || '', d.tanggalPenerbitan || '', d.statusDokumen || '',
      d.statusBeban || '', locName(d.arsipDokumenId),
      (d.fileAttachment && d.fileAttachment.name) ? d.fileAttachment.name : '-'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.TANAH, headersMap[SHEET_NAMES.TANAH], tanahRows);

  // 7. Tab E-IMB & PBG
  var imbRows = docsIMB.map(function(d) {
    return [
      d.noArsip || '', d.noKeputusan || '', d.tahun || '',
      d.atasNama || d.nama || '', d.bangunanInduk || '',
      d.bermaksudUntuk || '', d.lokasiBangunan || '', d.kota || '',
      d.tglPermohonanImb || '', locName(d.arsipDokumenId),
      (d.fileAttachment && d.fileAttachment.name) ? d.fileAttachment.name : '-'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.IMB, headersMap[SHEET_NAMES.IMB], imbRows);

  // 8. Tab Sertifikat SLO
  var sloRows = docsSLO.map(function(d) {
    return [
      d.noArsip || '', d.noSlo || '', d.idSlo || '', d.jenisSlo || '',
      d.namaPerusahaan || '', d.jenisInstalasi || '', d.sumberEnergi || '',
      d.kapasitasKva || '', d.dayaKw || '', d.teganganV || '',
      d.lembagaInspeksi || '', d.tanggalTerbit || '', d.tanggalBerlaku || '',
      d.statusSlo || '', locName(d.arsipDokumenId),
      (d.fileAttachment && d.fileAttachment.name) ? d.fileAttachment.name : '-'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.SLO, headersMap[SHEET_NAMES.SLO], sloRows);

  // 9. Tab Uji Timbangan
  var tmbRows = docsTimbangan.map(function(d) {
    return [
      d.noArsip || '', d.idPengujian || '', d.jenisTimbangan || '',
      d.nomorSuratPengujian || '', d.nomorOrder || '-', d.namaAlatUkur || '',
      d.merekPabrikBuatan || '', d.modelTipe || '', d.nomorSeriIdentitas || '',
      d.kapasitasMaksimumKg || '', d.kapasitasMinimumKg || '',
      d.kelasKeakurasian || '', d.pemilikPemakai || '', d.instansiPenerbit || '',
      d.tanggalTerbitSurat || '', d.berlakuSampai || '', d.statusMasaBerlaku || '',
      d.statusDokumen || '', locName(d.arsipDokumenId),
      (d.fileAttachment && d.fileAttachment.name) ? d.fileAttachment.name : '-'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.TIMBANGAN, headersMap[SHEET_NAMES.TIMBANGAN], tmbRows);

  // 10. Tab Master Provinsi & Kota
  var provRows = provinces.map(function(p, idx) {
    var cities = p.kotaKabupaten || [];
    return [idx + 1, p.id || '', p.namaProvinsi || '', cities.length, cities.join(', ')];
  });
  writeTableSheet(ss, SHEET_NAMES.PROVINSI, headersMap[SHEET_NAMES.PROVINSI], provRows);

  // 11. Tab Master Status Bayar
  var statusRows = statuses.map(function(s, idx) {
    return [idx + 1, s.id || '', s.namaStatus || '', String(s.kategori || '').toUpperCase(), s.keterangan || '-'];
  });
  writeTableSheet(ss, SHEET_NAMES.STATUS, headersMap[SHEET_NAMES.STATUS], statusRows);

  // 12. Tab Master Roles
  var roleRows = roles.map(function(r, idx) {
    return [
      idx + 1, r.id || '', r.roleName || '', r.level || '', r.deskripsi || '-',
      r.canManageMaster ? 'YA' : 'TIDAK',
      r.canWriteDocs ? 'YA' : 'TIDAK',
      r.canDeleteDocs ? 'YA' : 'TIDAK',
      r.canExportReport ? 'YA' : 'TIDAK',
      r.canManageUsers ? 'YA' : 'TIDAK',
      r.canReceiveExpiryEmails ? 'YA' : 'TIDAK'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.ROLES, headersMap[SHEET_NAMES.ROLES], roleRows);

  // 13. Tab Pengguna & Otorisasi
  var userRows = users.map(function(u, idx) {
    return [
      idx + 1, u.id || '', u.namaLengkap || '', '@' + (u.username || ''),
      u.email || '-', u.role || '', u.level || '',
      u.aktif ? 'Aktif' : 'Nonaktif', u.lastLogin || 'Belum pernah'
    ];
  });
  writeTableSheet(ss, SHEET_NAMES.USERS, headersMap[SHEET_NAMES.USERS], userRows);

  // 14. Tab Profil Perusahaan
  var logoStr = company.logoDataUrl || '';
  var companyRows = [
    ['COMP-01', 'Nama Perusahaan Resmi', company.namaPerusahaan || 'PT Kusuka Prima Nusantara', 'Ditampilkan di Portal Login & Kop Laporan', nowStr],
    ['COMP-02', 'Nama File Logo', company.logoFileName || 'Logo_Default.svg', 'Berkas logo resmi perusahaan', nowStr],
    ['COMP-03', 'Status Logo', logoStr ? 'Aktif & Tersimpan' : 'Logo Standar', 'Status ketersediaan logo visual', nowStr],
    ['COMP-04', 'Data URL Logo', logoStr ? logoStr.slice(0, MAX_CELL_CHUNK) : '-', 'Data gambar logo terkompresi', nowStr]
  ];
  writeTableSheet(ss, SHEET_NAMES.COMPANY, headersMap[SHEET_NAMES.COMPANY], companyRows);

  // 15. Tab Ringkasan & Dashboard
  var summaryRows = [
    [1, 'Arsip Dokumen (Lokasi Penyimpanan)', SHEET_NAMES.ARSIP_DOKUMEN, locRows.length, 'Master lokasi penyimpanan berkas fisik asli', 'Tersinkron', nowStr],
    [2, 'Bukti Bayar PBB (E-NOP)', SHEET_NAMES.ENOP, enopRows.length, 'Data bukti pelunasan PBB & NOP 18 digit', 'Tersinkron', nowStr],
    [3, 'Arsip E-SPPT', SHEET_NAMES.ESPPT, espptRows.length, 'SPPT tahunan & tanggal jatuh tempo pajak', 'Tersinkron', nowStr],
    [4, 'Sertifikat Merk', SHEET_NAMES.MERK, merkRows.length, 'Sertifikat HAKI merk dagang & etiket', 'Tersinkron', nowStr],
    [5, 'Sertifikat K3 / SMK3', SHEET_NAMES.K3, k3Rows.length, 'Pemeriksaan alat K3 & masa berlaku', 'Tersinkron', nowStr],
    [6, 'E-Sertifikat Tanah', SHEET_NAMES.TANAH, tanahRows.length, 'Sertifikat tanah SHM/HGB, NIB & luas m2', 'Tersinkron', nowStr],
    [7, 'E-IMB & PBG', SHEET_NAMES.IMB, imbRows.length, 'Izin Mendirikan Bangunan & PBG', 'Tersinkron', nowStr],
    [8, 'Sertifikat SLO', SHEET_NAMES.SLO, sloRows.length, 'Sertifikat Laik Operasi genset & listrik', 'Tersinkron', nowStr],
    [9, 'Uji Timbangan & Tera', SHEET_NAMES.TIMBANGAN, tmbRows.length, 'Pengujian tera ulang UTTP timbangan', 'Tersinkron', nowStr],
    [10, 'Master Provinsi & Kota', SHEET_NAMES.PROVINSI, provRows.length, 'Referensi wilayah administratif Indonesia', 'Tersinkron', nowStr],
    [11, 'Master Status Bayar', SHEET_NAMES.STATUS, statusRows.length, 'Klasifikasi status pembayaran', 'Tersinkron', nowStr],
    [12, 'Master Roles & Hak Akses', SHEET_NAMES.ROLES, roleRows.length, 'Konfigurasi peran & otorisasi sistem', 'Tersinkron', nowStr],
    [13, 'Pengguna & Otorisasi', SHEET_NAMES.USERS, userRows.length, 'Akun pengguna aplikasi', 'Tersinkron', nowStr],
    [14, 'Profil Perusahaan & Logo', SHEET_NAMES.COMPANY, 1, 'Identitas perusahaan & logo resmi', 'Tersinkron', nowStr]
  ];
  writeTableSheet(ss, SHEET_NAMES.RINGKASAN, headersMap[SHEET_NAMES.RINGKASAN], summaryRows);

  // 16. Simpan Snapshot JSON Penuh ke _AppState_DB (terpecah per 45.000 karakter)
  saveSnapshotChunks(ss, state, nowStr);

  return {
    success: true,
    message: 'Seluruh 15 tab Google Sheets & database sistem berhasil diperbarui!',
    spreadsheetUrl: ss.getUrl(),
    spreadsheetName: ss.getName(),
    updatedAt: nowStr,
    stats: {
      totalDocs: enopRows.length + espptRows.length + merkRows.length + k3Rows.length + tanahRows.length + imbRows.length + sloRows.length + tmbRows.length,
      totalLocations: locRows.length,
      totalUsers: userRows.length
    }
  };
}

/**
 * Helper: Simpan JSON AppState terpecah ke _AppState_DB (anti batas 50.000 karakter sel)
 */
function saveSnapshotChunks(ss, state, nowStr) {
  var sysSheet = ss.getSheetByName(SHEET_NAMES.SYSTEM_DB);
  if (!sysSheet) {
    sysSheet = ss.insertSheet(SHEET_NAMES.SYSTEM_DB);
    try { sysSheet.hideSheet(); } catch (e) {}
  }

  var jsonStr = JSON.stringify(state);
  var chunks = [];
  for (var i = 0; i < jsonStr.length; i += MAX_CELL_CHUNK) {
    chunks.push([chunks.length + 1, nowStr, jsonStr.substring(i, i + MAX_CELL_CHUNK)]);
  }

  sysSheet.clearContents();
  var rows = [['CHUNK_INDEX', 'UPDATED_AT', 'JSON_CHUNK']].concat(chunks);
  sysSheet.getRange(1, 1, rows.length, 3).setValues(rows);
}

/**
 * 7. Memuat Seluruh State Aplikasi dari Google Sheets (_AppState_DB)
 */
function loadFullAppState() {
  var ss = getSpreadsheet();
  var sysSheet = ss.getSheetByName(SHEET_NAMES.SYSTEM_DB);

  if (!sysSheet || sysSheet.getLastRow() <= 1) {
    return {
      success: true,
      hasData: false,
      state: null,
      spreadsheetUrl: ss.getUrl(),
      spreadsheetName: ss.getName(),
      message: 'Belum ada data tersimpan di Google Sheets. Silakan lakukan Simpan (Push) terlebih dahulu.'
    };
  }

  var values = sysSheet.getRange(2, 1, sysSheet.getLastRow() - 1, 3).getValues();
  var combined = '';
  var updatedAt = '';
  for (var i = 0; i < values.length; i++) {
    if (!updatedAt && values[i][1]) updatedAt = String(values[i][1]);
    combined += String(values[i][2] || '');
  }

  if (!combined) {
    return {
      success: true,
      hasData: false,
      state: null,
      spreadsheetUrl: ss.getUrl(),
      spreadsheetName: ss.getName()
    };
  }

  var parsedState = JSON.parse(combined);
  return {
    success: true,
    hasData: true,
    state: parsedState,
    updatedAt: updatedAt,
    spreadsheetUrl: ss.getUrl(),
    spreadsheetName: ss.getName()
  };
}

/**
 * 8. Mengunggah Berkas Lampiran ke Google Drive (Opsional)
 */
function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
    var cleanBase64 = String(base64Data || '').replace(/^data:.*?;base64,/, '');
    var decoded = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decoded, mimeType || 'application/pdf', fileName || 'lampiran.pdf');
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return {
      success: true,
      url: file.getUrl(),
      viewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view',
      id: file.getId(),
      fileName: fileName
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || String(err)
    };
  }
}
