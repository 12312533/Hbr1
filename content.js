/* ==========================================================
   content.js  -  mengisi teks dari config & memecah teks
   untuk animasi (huruf judul, kata pesan)
   ========================================================== */
(function () {
  'use strict';
  var c = window.BIRTHDAY_CONFIG;

  function $(sel) { return document.querySelector(sel); }
  function setText(sel, txt) { var el = $(sel); if (el) el.textContent = txt; }

  document.title = 'Selamat Ulang Tahun, ' + c.name;
  setText('#recipientName', c.name);
  setText('#ageNumeral', c.age);
  setText('#heroSub', c.tagline);
  setText('#messageSign', c.messageSign);

  /* Pecah judul hero jadi huruf-huruf (untuk animasi 3D per huruf) */
  document.querySelectorAll('#heroTitle .line').forEach(function (line) {
    var words = line.textContent.trim().split(/\s+/);
    line.textContent = '';
    words.forEach(function (w, wi) {
      var wordEl = document.createElement('span');
      wordEl.className = 'word';
      wordEl.setAttribute('aria-hidden', 'true');
      w.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        wordEl.appendChild(s);
      });
      line.appendChild(wordEl);
      if (wi < words.length - 1) line.appendChild(document.createTextNode(' '));
    });
  });

  /* Pecah pesan jadi kata (untuk efek menyala saat scroll) */
  var msg = $('#messageText');
  if (msg) {
    c.message.split(/\s+/).forEach(function (w, i, arr) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      msg.appendChild(s);
      if (i < arr.length - 1) msg.appendChild(document.createTextNode(' '));
    });
  }

  /* Isi surat rahasia */
  setText('#secretTitle', c.secret.title);
  setText('#secretSign', c.secret.sign);
  var body = $('#secretLines');
  if (body) {
    c.secret.lines.forEach(function (l) {
      var p = document.createElement('p');
      p.textContent = l;
      body.appendChild(p);
    });
  }
})();
