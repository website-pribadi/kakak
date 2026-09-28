# WebChat — GitHub Pages + Netlify Serverless + WhatsApp

## Arsitektur

GitHub Pages
  -> index.html
  -> Netlify Function
  -> WhatsApp Cloud API
  -> WhatsApp Kakak

Firebase Auth tetap digunakan oleh WebChat. Function memverifikasi Firebase ID Token sebelum meneruskan pesan.

## 1. Upload frontend ke GitHub

Upload `index.html` (dan file frontend lain dari proyekmu) ke repository GitHub.

Aktifkan:
Settings -> Pages -> Deploy from branch

Setelah aktif, catat URL GitHub Pages, misalnya:
https://USERNAME.github.io/REPOSITORY/

## 2. Deploy folder ini ke Netlify

Buat site baru di Netlify dan hubungkan ke repository GitHub yang sama, atau deploy repository yang berisi `netlify/functions/send-whatsapp.js`.

Netlify harus mendeteksi:
netlify/functions/send-whatsapp.js

URL function biasanya:
https://NAMA-SITE.netlify.app/.netlify/functions/send-whatsapp

## 3. Isi environment variables di Netlify

Site configuration -> Environment variables

Tambahkan:

WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_TO
WHATSAPP_GRAPH_VERSION

FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY

ALLOWED_ORIGIN

ALLOWED_ORIGIN harus sama dengan URL GitHub Pages kamu, contoh:
https://USERNAME.github.io

Untuk FIREBASE_PRIVATE_KEY, masukkan private key Firebase service account. Jika nilainya berisi newline, Netlify dapat menyimpan format:
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----

Jangan commit credential ini ke GitHub.

## 4. Ganti URL function di index.html

Cari:

const WHATSAPP_FUNCTION_URL =
  "https://GANTI-DENGAN-NAMA-SITE-KAMU.netlify.app/.netlify/functions/send-whatsapp";

Ganti dengan URL Netlify Function kamu.

Contoh:

const WHATSAPP_FUNCTION_URL =
  "https://webchat-wa.netlify.app/.netlify/functions/send-whatsapp";

Commit/push index.html ke GitHub.

## 5. Hasil

User membuka GitHub Pages.
Tidak perlu `npm start`.
Tidak perlu `server.js` berjalan di laptop.

Saat user mengirim teks:
index.html
 -> Firebase ID Token
 -> Netlify Function
 -> verifikasi Firebase
 -> WhatsApp Cloud API
 -> nomor WhatsApp tujuan

## Catatan

1. Access token WhatsApp tidak pernah ditaruh di index.html.
2. Service-account Firebase juga tidak ditaruh di GitHub.
3. File/voice tetap menggunakan sistem WebChat yang sudah ada. Integrasi ini meneruskan teks saja.
4. WhatsApp memiliki aturan opt-in dan window/template messaging. Jika API menolak pesan, lihat log Function di Netlify dan respons dari WhatsApp API.
