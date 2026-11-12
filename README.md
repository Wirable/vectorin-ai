# Vektorin AI v7.1 (patch)

V7.1 memperbaiki target status PWA yang sebelumnya belum tersedia, memperbarui nama aplikasi PWA, dan mengganti cache key agar pengguna tidak memakai cache lama. V7 melanjutkan seluruh tool lokal v6 dan menambahkan AI Metadata Studio melalui Cloudflare Pages Functions.

## Fitur baru
- Tombol **Generate dengan AI** di Metadata Studio.
- Backend endpoint `POST /api/metadata`.
- Gemini dipanggil dari server-side function; API key tidak dikirim ke browser.
- Validasi input, pembatasan panjang deskripsi, sanitasi judul/keyword, dan penanganan error.
- Model default `gemini-2.5-flash`; dapat diubah melalui environment variable `GEMINI_MODEL`.

## Deploy dari HP Android
1. Ekstrak ZIP ini.
2. Buat repository GitHub baru dan upload seluruh isi folder `Vektorin_AI_v7` (termasuk folder `functions/api`).
3. Di Cloudflare Dashboard, buka **Workers & Pages → Create → Pages → Connect to Git** lalu pilih repository tersebut. Build command kosong; output directory `.`.
4. Di pengaturan Pages project, buka **Settings → Variables and Secrets** lalu tambahkan secret bernama `GEMINI_API_KEY` berisi API key dari Google AI Studio. Jangan pernah menaruh key di file HTML, GitHub, atau membagikannya di chat.
5. Deploy ulang. Buka URL Pages, masuk Metadata Studio, isi deskripsi gambar, lalu tekan **Generate dengan AI**.

## Uji lokal
Website statis dapat dibuka langsung, tetapi tombol AI memerlukan Pages Functions yang berjalan di Cloudflare Pages/`wrangler pages dev`. Jika dibuka sebagai file lokal, gunakan generator metadata lokal yang sudah ada.

## Biaya dan batasan
- Kode proyek ini tidak mengenakan biaya hosting sendiri, tetapi kuota/biaya Google AI API dan batas gratis layanan dapat berubah; periksa dashboard penyedia sebelum penggunaan.
- Jangan letakkan API key di frontend.
- AI hanya menyusun metadata berdasarkan deskripsi teks, bukan menganalisis file gambar. Pastikan judul dan keyword benar-benar sesuai visual karya.
- Tidak menjamin aset diterima Adobe Stock.

## Isi folder
- `index.html`: aplikasi web
- `functions/api/metadata.js`: backend Gemini aman
- `wrangler.toml`: konfigurasi Cloudflare
- `manifest.webmanifest`, `sw.js`, `icon.svg`: dukungan PWA
\n\n## Patch v7.1\n- Menambahkan elemen status `appstatus` yang dipakai callback registrasi Service Worker.\n- Memperbarui nama aplikasi di manifest.\n- Mengganti nama cache Service Worker agar cache v7 lama tidak tertinggal.\n