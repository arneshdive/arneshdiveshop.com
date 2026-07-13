# Dokumen Handover Platform
## Arne's Dive Shop - E-Commerce Platform

---

## 📋 Informasi Penting

**Email Akun (untuk semua platform):** `developer.arneshdive@gmail.com`  
**Cara Login:** Login dengan Google (tanpa password terpisah)

---

## Daftar Platform yang Digunakan

| No | Platform | Kegunaan | Status |
|----|----------|----------|--------|
| 1 | GitHub | Penyimpanan kode sumber | ✅ Aktif |
| 2 | Neon | Database | ✅ Aktif |
| 3 | Vercel | Hosting website | ✅ Aktif |
| 4 | Resend | Pengiriman email | ✅ Aktif |
| 5 | RajaOngkir | Cek ongkos kirim | ✅ Aktif |
| 6 | Midtrans | Pembayaran online | ✅ Aktif (Sandbox) |

---

## 1. GitHub

### 🎯 Untuk Apa?

GitHub adalah tempat penyimpanan kode sumber website Anda. Bayangkan seperti Google Drive, tapi khusus untuk kode program. Setiap perubahan kode dicatat dengan rapi, sehingga jika ada masalah, bisa kembali ke versi sebelumnya.

### 💡 Mengapa Penting?

- **Backup otomatis** - Kode aman tersimpan di cloud
- **Riwayat perubahan** - Bisa melihat siapa mengubah apa dan kapan
- **Kolaborasi** - Jika hire developer lain, bisa bekerja bersama tanpa konflik

### 📊 Batasan Plan Gratis

| Fitur | Gratis | Berbayar (Pro) |
|-------|--------|----------------|
| Repository privat | Unlimited | Unlimited |
| Kolaborator | Unlimited | Unlimited |
| GitHub Actions | 2,000 menit/bulan | 3,000 menit/bulan |
| Storage | 500 MB | 1 GB |

### ⚠️ Kapan Harus Upgrade?

- Jika butuh lebih banyak waktu untuk otomatisasi (CI/CD)
- Jika butuh fitur keamanan tingkat lanjut
- Untuk saat ini, plan gratis **sudah cukup**

### 🔗 Cara Akses

1. Buka: https://github.com
2. Klik "Sign in"
3. Pilih "Continue with Google"
4. Gunakan email: `developer.arneshdive@gmail.com`

---

## 2. Neon (Database)

### 🎯 Untuk Apa?

Neon adalah tempat penyimpanan database PostgreSQL. Database ini menyimpan semua data penting website Anda:
- Data produk
- Data pelanggan
- Data pesanan/orders
- Data kategori, banner, dll

### 💡 Mengapa Penting?

Tanpa database, website tidak bisa menyimpan informasi. Setiap produk yang ditambahkan, setiap pesanan yang masuk, semuanya tersimpan di sini.

### 📊 Batasan Plan Gratis

| Fitur | Gratis (Free Tier) | Pro ($19/bulan) |
|-------|-------------------|-----------------|
| Storage | 0.5 GB | 10 GB |
| Database | 1 project | Unlimited |
| Compute | 191.9 jam/bulan | Unlimited |
| Auto-suspend | 5 menit tidak aktif | Tidak ada |
| Branch | 10 branches | Unlimited |

**Yang perlu dipahami tentang Auto-suspend:**
Jika tidak ada yang mengakses website selama 5 menit, database akan "tidur". Saat ada pengunjung baru, database "bangun" dalam 1-2 detik. Ini normal dan pengunjung tidak akan merasakan perbedaan signifikan.

### ⚠️ Kapan Harus Upgrade?

- Jika storage hampir mencapai 0.5 GB (cek di dashboard Neon)
- Jika butuh database aktif 24/7 tanpa suspend (untuk traffic tinggi)
- **Estimasi:** Plan gratis bisa menangani **ratusan hingga 1000+ pengguna aktif**

### 🔗 Cara Akses

1. Buka: https://neon.tech
2. Klik "Sign in"
3. Pilih "Continue with Google"
4. Gunakan email: `developer.arneshdive@gmail.com`

### 📌 Tips Penting

- **Jangan pernah menghapus database** kecuali sudah yakin 100%
- Neon punya fitur "Branch" seperti GitHub - berguna untuk testing
- Selalu backup sebelum melakukan perubahan besar

---

## 3. Vercel (Hosting)

### 🎯 Untuk Apa?

Vercel adalah tempat "menaruh" website agar bisa diakses publik di internet. Ketika seseorang mengetik alamat website Anda, Vercel yang menyajikan halaman website tersebut.

Selain itu, Vercel juga menyimpan:
- Gambar produk yang diupload
- File-file statis

### 💡 Mengapa Penting?

Website yang bagus tidak berguna jika tidak bisa diakses orang lain. Vercel membuat website Anda:
- **Cepat** - Dilengkapi CDN global
- **Aman** - HTTPS otomatis
- **Andal** - Uptime 99.99%

### 📊 Batasan Plan Gratis

| Fitur | Gratis (Hobby) | Pro ($20/bulan) |
|-------|---------------|-----------------|
| Deployments | Unlimited | Unlimited |
| Bandwidth | 100 GB/bulan | 1 TB/bulan |
| Build hours | 6,000 menit/bulan | Unlimited |
| Team members | Solo | Team |
| Blob Storage | 500 MB | Unlimited |
| Analytics | Limited | Full |

**Penjelasan sederhana:**
- **Bandwidth:** Jumlah data yang ditransfer ke pengunjung. 100 GB setara dengan sekitar **50,000 - 100,000 kunjungan halaman per bulan**
- **Build hours:** Waktu yang dibutuhkan saat ada update kode. 6,000 menit sangat banyak untuk website normal

### ⚠️ Kapan Harus Upgrade?

- Jika bandwidth melebihi 100 GB/bulan (cek di dashboard Vercel)
- Jika butuh tim yang bisa manage deployment bersama
- Jika butuh analytics detail (data pengunjung)
- **Estimasi:** Plan gratis cocok untuk traffic **hingga 100,000 pageviews/bulan**

### 🔗 Cara Akses

1. Buka: https://vercel.com
2. Klik "Sign up" atau "Log in"
3. Pilih "Continue with GitHub" atau "Continue with Google"
4. Gunakan email: `developer.arneshdive@gmail.com`

### 📌 Domain Website

Website Anda akan mendapat alamat seperti:
- `https://arneshdiveshop.vercel.app`

Jika ingin menggunakan domain sendiri (misalnya `arnesdive.com`), bisa dikonfigurasikan di dashboard Vercel.

---

## 4. Resend (Email Service)

### 🎯 Untuk Apa?

Resend mengirimkan email dari website Anda ke pelanggan:
- Email konfirmasi pesanan
- Email reset password
- Email notifikasi lainnya

### 💡 Mengapa Penting?

Komunikasi dengan pelanggan sangat penting dalam bisnis online. Tanpa email yang reliable, pelanggan tidak tahu status pesanan mereka.

### 📊 Batasan Plan Gratis

| Fitur | Gratis | Pro ($20/bulan) |
|-------|--------|-----------------|
| Email/bulan | 3,000 | 50,000 |
| Email/hari | 100 | 1,600+ |
| Domain | 1 domain | Unlimited |
| Templates | Basic | Advanced |

### ⚠️ Kapan Harus Upgrade?

- Jika mengirim lebih dari 3,000 email per bulan
- Jika butuh domain kustom (dari `noreply@yourdomain.com`)
- **Estimasi:** 3,000 email/bulan cukup untuk **ratusan transaksi per bulan**

### 🔗 Cara Akses

1. Buka: https://resend.com
2. Klik "Sign in"
3. Pilih "Continue with Google"
4. Gunakan email: `developer.arneshdive@gmail.com`

### 📌 Catatan Penting

- Untuk sementara, email mungkin dikirim dari domain Resend (onboarding)
- Untuk branding profesional, disarankan setup domain sendiri

---

## 5. RajaOngkir (Cek Ongkos Kirim)

### 🎯 Untuk Apa?

RajaOngkir menyediakan data ongkos kirim dari berbagai kurir:
- JNE
- J&T
- SiCepat
- AnterAja
- Dan lainnya

Pelanggan bisa langsung melihat estimasi ongkir saat checkout.

### 💡 Mengana Penting?

Di Indonesia, ongkos kirim adalah faktor penting dalam keputusan belanja online. Dengan RajaOngkir, pelanggan mendapat estimasi biaya pengiriman yang akurat.

### 📊 Batasan Plan Gratis (Komerce)

| Fitur | Gratis | Premium |
|-------|--------|---------|
| Request/hari | 100-500 | Unlimited |
| Kurir | Semua | Semua |
| Support | Community | Priority |

**Catatan:** Akun Anda menggunakan RajaOngkir API dari Komerce. Saat ini terdapat beberapa API key untuk memperbesar batas harian.

### ⚠️ Kapan Harus Upgrade?

- Jika request melebihi batas harian
- Jika butuh traffic tinggi saat flash sale/promo

### 🔗 Cara Akses

RajaOngkir Komerce dikelola melalui dashboard Komerce:
1. Buka: https://rajaongkir.komerce.id
2. Login dengan akun yang terdaftar

---

## 6. Midtrans (Payment Gateway)

### 🎯 Untuk Apa?

Midtrans memproses pembayaran online:
- Transfer bank (VA)
- Kartu kredit/debit
- E-wallet (GoPay, OVO, Dana, ShopeePay)
- QRIS
- Paylater

### 💡 Mengapa Penting?

Memudahkan pelanggan membayar dengan berbagai metode. Tanpa payment gateway, proses pembayaran manual dan tidak praktis.

### 📊 Status Saat Ini

**⚠️ MASIH DALAM MODE SANDBOX (TESTING)**

Saat ini Midtrans masih dalam mode testing/pengembangan. Artinya:
- Pembayaran tidak benar-benar terjadi
- Cocok untuk testing sebelum go-live
- Perlu diaktifkan ke mode Production untuk transaksi nyata

### 📋 Langkah Go-Live Midtrans

1. **Verifikasi akun** - Upload dokumen KTP, NPWP, rekening bank
2. **Sandbox → Production** - Hubungi Midtrans untuk aktivasi
3. **Update konfigurasi** - Developer akan mengganti API key dari sandbox ke production

### 💰 Biaya Midtrans

| Metode Pembayaran | Biaya |
|-------------------|-------|
| Transfer Bank (VA) | Rp 4,000 per transaksi |
| Kartu Kredit | 2.9% + Rp 2,000 |
| E-wallet | 1.5% - 2% |
| QRIS | 0.7% |

*Biaya bisa berubah, cek midtrans.com untuk update terbaru*

### 🔗 Cara Akses

1. Buka: https://dashboard.midtrans.com
2. Login dengan akun yang terdaftar
3. Untuk development, gunakan: https://dashboard.sandbox.midtrans.com

---

## Rekomendasi Timeline Upgrade

### Fase 1: Launch (0-6 bulan)
**Semua paket gratis sudah cukup**

### Fase 2: Growth (6-12 bulan)
Monitor penggunaan:
- Vercel bandwidth mendekati 100 GB
- Resend email mendekati 3,000/bulan
- Neon storage mendekati 0.5 GB

**Upgrade sesuai kebutuhan pertama:**
1. Vercel Pro - untuk bandwidth lebih
2. Resend Pro - jika email tinggi

### Fase 3: Scale (12+ bulan)
Jika traffic dan transaksi tinggi:
- Pertimbangkan semua platform di-upgrade
- Atau pindah ke solusi dedicated

---

## Checklist Pengecekan Bulanan

Setiap bulan, disarankan mengecek:

- [ ] **Neon** - Cek storage usage di dashboard
- [ ] **Vercel** - Cek bandwidth usage
- [ ] **Resend** - Cek email quota usage
- [ ] **Midtrans** - Review transaksi (jika sudah production)
- [ ] **Backup** - Pastikan ada backup data

---

## Kontak Darurat

Jika terjadi masalah dengan platform:

| Platform | Support | Dokumentasi |
|----------|---------|-------------|
| GitHub | support.github.com | docs.github.com |
| Neon | support.neon.tech | neon.tech/docs |
| Vercel | vercel.com/support | vercel.com/docs |
| Resend | resend.com/support | resend.com/docs |
| RajaOngkir | komerce.id/support | docs.rajaongkir.komerce.id |
| Midtrans | midtrans.com/help | docs.midtrans.com |

---

## Kesimpulan

Semua platform yang digunakan saat ini:
- ✅ **Gratis** - Tidak ada biaya bulanan
- ✅ **Andal** - Dipercaya ribuan bisnis
- ✅ **Scalable** - Bisa di-upgrade saat bisnis berkembang
- ✅ **Cukup** - Memadai untuk ratusan pengguna pertama

**Rekomendasi utama:** Fokus pada pengembangan bisnis dan marketing. Biarkan platform ini berjalan. Upgrade hanya ketika benar-benar dibutuhkan.

---

*Dokumen dibuat: Juli 2026*  
*Developer: [Nama Developer]*  
*Client: Arne's Dive Shop*
