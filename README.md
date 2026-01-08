# ChainVote 🛡️⛓️

> **Sistem E-Voting Berbasis Blockchain yang Transparan, Aman, dan Anti-Manipulasi.**

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Supabase%20%7C%20TypeScript-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 👋 Tentang Penulis

Halo! Saya **Akhmat Qavidhufahmi**, mahasiswa **Program Studi Informatika, Universitas Bengkulu**.

Project ini saya kembangkan sebagai wujud eksplorasi mendalam saya terhadap teknologi Web3 dan Kriptografi dalam menyelesaikan masalah integritas data pada sistem pemilihan umum digital. Saya memiliki ketertarikan kuat dalam bidang *Software Engineering*, *Web Development*, dan *Cyber Security*.

---

## 📖 Deskripsi Project

**ChainVote** adalah aplikasi pemungutan suara elektronik (E-Voting) yang mengimplementasikan struktur data **Blockchain** sederhana di atas database relasional (PostgreSQL).

Tujuannya adalah menciptakan sistem voting yang **Immutable** (tidak bisa diubah) dan **Auditable** (dapat diverifikasi). Setiap suara yang masuk tidak hanya disimpan sebagai baris database biasa, tetapi juga dienkripsi menjadi blok yang saling terhubung (Chaining) menggunakan algoritma **SHA-256**.

Jika ada satu suara saja yang dimanipulasi (baik lewat database langsung atau serangan siber), seluruh rantai blok setelahnya akan rusak dan sistem audit otomatis akan mendeteksi kecurangan tersebut secara real-time.

---

## 🚀 Fitur Unggulan

### 🔒 Core Security (Blockchain)
- **Immutable Ledger:** Suara yang sudah masuk tidak dapat diedit atau dihapus tanpa merusak rantai hash.
- **SHA-256 Hashing:** Menggunakan standar kriptografi industri untuk mengamankan data blok.
- **Automated Integrity Audit:** Sistem pendeteksi otomatis yang membandingkan Hash Blockchain vs Data Database (Anti-Tampering).
- **Consensus Check:** Validasi `previous_hash` untuk memastikan urutan blok valid (Avalanche Effect).

### 🛡️ Application Security
- **Anti-IDOR (Insecure Direct Object Reference):** Validasi ketat sesi server (Supabase Auth) untuk mencegah pemalsuan identitas pemilih.
- **Anti-Double Voting:** Mekanisme pencegahan satu akun melakukan voting lebih dari sekali.
- **SQL Injection Protection:** Menggunakan Supabase Client SDK dengan parameterized queries.
- **Role-Based Access Control (RBAC):** Pemisahan hak akses antara User (Voter) dan Admin.

### 💻 Modern Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion, Lucide React.
- **Backend:** Next.js API Routes (Serverless Functions).
- **Database:** Supabase (PostgreSQL) + Row Level Security (RLS).
- **Type Safety:** Full TypeScript implementation.

---

## 🛠️ Teknologi yang Digunakan

| Kategori | Teknologi |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Database & Auth** | [Supabase](https://supabase.com/) |
| **Cryptography** | SHA-256 (via Node.js Crypto) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📸 Screenshots

| Halaman Voting | Halaman Audit (Deteksi Error) |
| :---: | :---: |
| ![Vote Page](https://via.placeholder.com/400x200?text=Screenshot+Voting) | ![Audit Page](https://via.placeholder.com/400x200?text=Screenshot+Audit) |

---

## ⚙️ Cara Menjalankan (Local Development)

Ikuti langkah-langkah berikut untuk menjalankan project ini di komputer lokal Anda:

### 1. Clone Repository
```bash
git clone [https://github.com/USERNAME_ANDA/e-voting-blockchain.git](https://github.com/USERNAME_ANDA/e-voting-blockchain.git)
cd e-voting-blockchain
```

### 2. Install Dependencies
```bash
npm install
# atau
yarn install
```

### 3. Jalankan Server Development
Buat file **.env.local** di root folder dan isi dengan kredensial Supabase Anda:
```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 4. Setup Database ⚠️
Untuk menjaga keamanan dan integritas penggunaan source code ini, kode SQL (Skema Database) tidak saya sertakan di sini secara publik. 
Jika Anda berminat untuk mempelajari struktur database, berkolaborasi, atau menjalankan project ini secara penuh, silakan hubungi saya melalui:

- **Sosial Media yang tertera di Profile GitHub saya.**

Saya dengan senang hati akan berbagi detail teknisnya untuk tujuan edukasi.

### 5. Konfigurasi Environment Variables
```bash
npm run dev
```
Buka browser dan akses http://localhost:3000.

## 🔐 Logika Blockchain
Struktur data blok yang digunakan dalam sistem ini adalah sebagai berikut :
```TypeScript
type Block = {
  index: number;        // Urutan blok (Genesis = 0)
  timestamp: number;    // Waktu pembuatan
  data: object;         // Data suara (Voter ID + Candidate ID)
  previousHash: string; // Hash dari blok sebelumnya (Kunci Rantai)
  hash: string;         // Hash unik blok ini
  nonce: number;        // Angka unik (Proof of Work simulation)
}
```

Setiap kali voting terjadi, sistem akan:
1. Mengambil Hash dari blok terakhir.
2. Membuat blok baru yang berisi data suara saat ini + Hash blok terakhir.
3. Melakukan hashing SHA-256 pada blok baru tersebut.
4. Menyimpan hasilnya ke tabel blocks.

<p align="center"> Dibuat oleh <b>Akhmat Qavidhufahmi</b>.

Universitas Bengkulu - Informatika </p>