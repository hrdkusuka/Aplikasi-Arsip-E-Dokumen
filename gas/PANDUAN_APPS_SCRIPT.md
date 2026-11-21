# PANDUAN DEPLOYMENT GOOGLE APPS SCRIPT (WEB APP)
## SISTEM ARSIP DOKUMEN — PT KUSUKA PRIMA NUSANTARA

Aplikasi ini dapat dijalankan langsung di dalam ekosistem **Google Apps Script (GAS)** sebagai **Web App mandiri** atau **Container-bound Script** yang terhubung langsung ke Google Spreadsheet dan Google Drive Anda tanpa memerlukan server eksternal berbayar.

---

### File yang Tersedia:
1. `Code.gs` — Script controller backend (Apps Script):
   - Menangani `doGet(e)` untuk menyajikan antarmuka HTML.
   - Mengelola inisialisasi tab Google Spreadsheet (`setupSpreadsheetTabs()`) tanpa tab pengguna/setting.
   - Membaca data seluruh modul dokumen & master lokasi (`getAllData()`).
   - Menyimpan dan memperbarui baris data (`saveRecord()`).
   - Menghapus data (`deleteRecord()`).
   - Mengunggah berkas scan/PDF langsung ke Google Drive (`uploadFileToDrive()`).
   - Menghitung statistik dan ringkasan eksekutif secara otomatis.

2. `Index.html` — Antarmuka Web Responsive Frontend:
   - Menggunakan Tailwind CSS CDN & Lucide Icons.
   - Dashboard statistik real-time & tabel pemantauan jatuh tempo (*expiry watchlist*).
   - Antarmuka tabel interaktif untuk seluruh modul arsip (PBB, E-SPPT, Merk, K3, Tanah, IMB, SLO, Timbangan, Lokasi Fisik).
   - Dialog modal penambahan berkas baru + upload berkas langsung ke Google Drive.
   - Pencarian instan dan notifikasi status real-time.

*Catatan: Sesuai arahan Anda, modul **Roles & Users** dan **Setting Company** sengaja **tidak dimasukkan** sehingga sistem jauh lebih ringkas, cepat, dan fokus murni pada pengelolaan arsip dokumen fisik dan legalitas perusahaan.*

---

### Langkah-langkah Memasang ke Google Apps Script:

#### Langkah 1: Buka Google Spreadsheet Anda
1. Buka berkas Google Spreadsheet Anda di browser (misalnya: *Arsip Dokumen - PT Kusuka Prima Nusantara*).
2. Pada menu atas, klik **Extensions** (Ekstensi) > **Apps Script**.
3. Tab baru editor Apps Script akan terbuka.

#### Langkah 2: Salin `Code.gs`
1. Di editor Apps Script, buka file `Code.gs` bawaan (atau hapus isi fungsi kosong bawaan).
2. Salin seluruh isi file **`gas/Code.gs`** dan tempelkan (*paste*) ke dalam editor.
3. Klik ikon simpan (Ctrl+S atau Cmd+S).

#### Langkah 3: Buat dan Salin `Index.html`
1. Di panel kiri editor Apps Script, di sebelah tulisan **Files**, klik tanda tambah **(+)** > pilih **HTML**.
2. Beri nama file tepat: **`Index`** (Apps Script akan otomatis menambahkan ekstensi `.html`).
3. Hapus kode default HTML yang ada di dalamnya, lalu salin seluruh isi file **`gas/Index.html`** dan tempelkan (*paste*).
4. Klik ikon simpan (Ctrl+S atau Cmd+S).

#### Langkah 4: Jalankan Inisialisasi Pertama
1. Di toolbar atas editor Apps Script, pilih fungsi **`setupSpreadsheetTabs`** pada dropdown fungsi.
2. Klik tombol **Run** (Jalankan).
3. Google akan meminta izin akses (*Review Permissions*):
   - Pilih akun Google Anda (`hrd.kusuka@gmail.com`).
   - Klik **Advanced** (Lanjutan) > klik **Go to Untitled project (unsafe)** / **Buka project**.
   - Klik **Allow** (Izinkan).
4. Seluruh 12 tab dengan header berwarna rapi akan otomatis terbentuk di Google Spreadsheet Anda!

#### Langkah 5: Publikasikan sebagai Web App (Deploy)
1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > pilih **New deployment** (Penerapan baru).
2. Klik ikon gerigi (Select type) di sebelah kiri > pilih **Web app**.
3. Isi konfigurasi sebagai berikut:
   - **Description**: `Sistem Arsip Dokumen v1.0`
   - **Execute as**: `Me (hrd.kusuka@gmail.com)` *(Aplikasi berjalan atas nama Anda sehingga staf tidak perlu otorisasi rumit)*
   - **Who has access**: 
     - Pilih **Anyone within your organization** (jika memakai Google Workspace domain perusahaan) ATAU
     - Pilih **Anyone with Google Account** / **Anyone** (agar dapat dibuka langsung oleh staf operasional).
4. Klik **Deploy**.
5. Salin link **Web App URL** yang diberikan (berformat `https://script.google.com/macros/s/.../exec`).
6. Buka link tersebut di browser. Aplikasi siap digunakan 100% secara online!
