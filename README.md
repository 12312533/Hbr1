# Birthday Website

Website ulang tahun interaktif: GSAP ScrollTrigger, Three.js, canvas-confetti, photo booth roll film, dan kartu swipe.

## Struktur

```
birthday-website/
├── index.html
├── css/
│   ├── base.css         token warna, latar berlapis, tombol
│   ├── sections.css     hero, pesan, kue lilin, modal surat, tombol musik
│   ├── photobooth.css   printer + strip roll film 6 foto
│   └── stack.css        tumpukan kartu polaroid
├── js/
│   ├── config.js        <- UBAH KONTEN DI SINI (nama, umur, pesan, foto, lagu)
│   ├── content.js       mengisi teks ke halaman
│   ├── three-scene.js   kado 3D, balon, debu cahaya (Three.js)
│   ├── animations.js    GSAP: intro, reveal, parallax, transisi warna
│   ├── photobooth.js    foto keluar dari printer saat scroll
│   ├── cardstack.js     kartu swipe (mouse, sentuh, keyboard)
│   └── interactions.js  confetti, musik, Pesan Rahasia, tiup lilin
└── assets/
    ├── photos/          foto1.jpg ... foto6.jpg
    └── music/           lagu.mp3
```

## Cara mengganti konten

1. Buka `js/config.js`, ubah `name`, `age`, `message`, `secret`, dan caption foto.
2. Taruh 6 foto di `assets/photos/` dengan nama `foto1.jpg` sampai `foto6.jpg` (atau ubah nama di config). Rasio persegi atau potret paling aman; foto di-crop otomatis.
3. Taruh lagu favorit di `assets/music/lagu.mp3`. Jika file tidak ada, website memutar melodi Happy Birthday sederhana.

Selama foto belum diganti, website menampilkan gambar pengganti bergradasi maroon sehingga layout tetap bisa dicek.

## Menjalankan

Cukup klik dua kali `index.html` (perlu internet untuk memuat library & font dari CDN). Untuk hasil terbaik di HP, jalankan server lokal:

```
python3 -m http.server 8000
```

lalu buka `http://localhost:8000`.

## Catatan

- Musik baru bisa diputar setelah ada interaksi pengguna (klik Buka Kado / Pesan Rahasia / tombol musik) karena aturan browser.
- Mendukung `prefers-reduced-motion`: animasi berat dimatikan otomatis.
- Foto 1 ada di bagian atas strip film, foto 6 di bagian bawah (yang paling awal keluar dari printer).
