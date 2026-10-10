/* ==========================================================
   config.js  -  UBAH ISI FILE INI UNTUK MENGGANTI KONTEN
   ========================================================== */
window.BIRTHDAY_CONFIG = {
  // Nama penerima & umur
  name: 'Lovee',
  age: 25,

  // Kalimat pendek di bawah judul hero
  tagline: 'Today, every single light, balloon, and melody shines and plays especially for you.',

  // Lagu favorit. Taruh file mp3 di assets/music/ lalu sesuaikan namanya.
  // Kosongkan ('') atau biarkan file tidak ada -> otomatis memutar melodi
  // "Happy Birthday" sederhana buatan browser.
  music: 'Happy Birthday (Piano Version).mp3',

  // Pesan utama (teks muncul kata demi kata saat di-scroll)
  message:
    'Thank you for being here and making my days brighter. ' +
    'May this year bring you more laughter, more peace, ' +
    'and all the good things you have been wishing for.',
  messageSign: 'With love, from me',

  // Pesan rahasia (tombol "Secret Message")
  secret: {
    title: 'For you, the one reading this',
    lines: [
      'If you found this message, it means you are indeed a curious person, and that is one of the things I love about you.',
      'I\'m not always good at saying things directly. So I put this here: you mean much more to me than you realize.',
      'Happy birthday. May you always find your way back to places that make you feel whole.'
    ],
    sign: 'With love, from me'
  },

  // 6 foto untuk photo booth dan tumpukan kartu.
  // Ganti "src" dengan foto kamu (taruh di assets/photos/).
  // Foto 1 ada di bagian ATAS strip, foto 6 di bagian BAWAH (yang keluar paling awal dari mesin).
  photos: [
    { src: 'couple 1.jpg', caption: 'The day we went on our first date together.' },
    { src: 'couple 2.jpg', caption: 'The laugh that made me forget about time.' },
    { src: 'couple 3.jpg', caption: 'Our favorite sunset.' },
    { src: 'couple 4.jpg', caption: 'An unplanned vacation.' },
    { src: 'couple 5.jpg', caption: 'A simple dinner.' },
    { src: 'couple 6.jpg', caption: 'Today, and the days after.' }
  ],

  // Teks setelah lilin ditiup
  wishDone: 'May every single wish in your heart come true..'
};

/* Gambar pengganti jika file foto belum ada (supaya layout tetap rapi) */
window.photoFallback = function (i) {
  var pairs = [
    ['#8f1d33', '#e2b35e'], ['#650f25', '#eaa9a1'], ['#b02a44', '#f1d08e'],
    ['#430a19', '#e2b35e'], ['#7a1630', '#f8ebdd'], ['#5a0d20', '#eaa9a1']
  ];
  var c = pairs[i % pairs.length];
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/>' +
    '</linearGradient></defs>' +
    '<rect width="400" height="400" fill="url(#g)"/>' +
    '<path d="M200 300 C 90 220 100 130 160 125 C 185 123 198 140 200 150 C 202 140 215 123 240 125 C 300 130 310 220 200 300Z" fill="rgba(255,240,225,.88)"/>' +
    '<text x="200" y="352" text-anchor="middle" font-family="Georgia,serif" font-size="21" fill="rgba(255,240,225,.92)">Foto ' + (i + 1) + ' - ganti di assets/photos</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};
