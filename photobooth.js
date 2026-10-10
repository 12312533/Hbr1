/* ==========================================================
   photobooth.js
   Strip roll film berisi 6 foto "dicetak" keluar dari celah printer
   mengikuti scroll (scrub). Tiap foto "menyala" seperti hasil cetak
   yang baru jadi (kecerahan tinggi -> normal).
   ========================================================== */
(function () {
  'use strict';

  var cfg = window.BIRTHDAY_CONFIG;
  var strip = document.getElementById('strip');
  var win = document.getElementById('stripWindow');
  var machine = document.getElementById('boothMachine');
  var tilt = document.getElementById('tilt');
  var printer = document.getElementById('printer');
  var status = document.getElementById('printerStatus');
  if (!strip || !win || !cfg) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var photos = cfg.photos.slice(0, 6);
  var n = photos.length;

  /* ----- Bangun strip film ----- */
  var film = document.createElement('div');
  film.className = 'film';
  var photoBoxes = [];

  photos.forEach(function (p, i) {
    var fig = document.createElement('figure');
    fig.className = 'frame';

    var box = document.createElement('div');
    box.className = 'frame__photo';
    var img = new Image();
    img.alt = p.alt || p.caption || ('Foto ' + (i + 1));
    img.draggable = false;
    img.decoding = 'async';
    img.onerror = function () { img.onerror = null; img.src = window.photoFallback(i); };
    img.src = p.src;
    box.appendChild(img);
    fig.appendChild(box);

    var cap = document.createElement('figcaption');
    var t = document.createElement('span');
    t.className = 'frame__text';
    t.textContent = p.caption || '';
    var no = document.createElement('span');
    no.className = 'frame__no';
    no.setAttribute('aria-hidden', 'true');
    no.textContent = (i + 1) + 'A';
    cap.appendChild(t);
    cap.appendChild(no);
    fig.appendChild(cap);

    film.appendChild(fig);
    photoBoxes.push(box);
  });
  strip.appendChild(film);

  /* ----- Tanpa GSAP / reduced motion: tampilkan langsung ----- */
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    strip.style.transform = 'none';
    if (status) status.textContent = 'Selesai';
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ----- Strip keluar dari celah ----- */
  gsap.set(strip, { yPercent: -100, transformPerspective: 900, transformOrigin: '50% 0%' });

  var hum;
  function onProgress(self) {
    var p = self.progress;
    if (status) {
      if (p >= 0.995) status.textContent = 'Selesai';
      else if (p <= 0.002) status.textContent = 'Siap';
      else status.textContent = 'Mencetak ' + Math.min(n, Math.ceil(p * n - 1e-6)) + '/' + n;
    }
    if (p > 0.002 && p < 0.995) {
      printer.classList.add('is-printing');
      clearTimeout(hum);
      hum = setTimeout(function () { printer.classList.remove('is-printing'); }, 200);
    } else {
      printer.classList.remove('is-printing');
    }
  }

  var tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: win, start: 'top 58%', end: 'bottom 86%',
      scrub: 0.5, onUpdate: onProgress, invalidateOnRefresh: true
    }
  });

  /* gerak utama: strip meluncur turun dari celah */
  tl.to(strip, { yPercent: 0, duration: 1 }, 0);

  /* strip sedikit miring lalu lurus, seperti kertas yang baru keluar */
  tl.fromTo(strip, { rotationX: 12, rotationZ: -3 }, { rotationX: 0, rotationZ: 0, duration: 0.4, ease: 'power2.out' }, 0);

  /* getaran kecil saat mencetak */
  var wob = [[0.18, 5], [0.3, -4], [0.45, 3], [0.62, -3], [0.76, 2], [0.88, 0]];
  wob.forEach(function (w) {
    tl.to(strip, { x: w[1], duration: 0.12, ease: 'sine.inOut' }, w[0]);
  });

  /* efek "mencuci" foto: terang & pudar -> normal, sesuai urutan keluar (bawah dulu) */
  photoBoxes.forEach(function (box, k) {
    var start = 1 - (k + 1) / n;
    var dur = Math.min(0.24, 1 - start);
    tl.fromTo(box,
      { filter: 'brightness(2.4) saturate(0) sepia(0.8) blur(5px)' },
      { filter: 'brightness(1) saturate(1.05) sepia(0.12) blur(0px)', duration: dur, ease: 'power1.out' },
      start
    );
  });

  /* ----- Printer muncul dari atas dengan rotasi 3D ----- */
  gsap.from(printer, {
    y: -70, rotationX: -22, opacity: 0, duration: 1.2, ease: 'power4.out',
    transformPerspective: 1000, transformOrigin: '50% 100%',
    scrollTrigger: { trigger: machine, start: 'top 88%', toggleActions: 'play none none none' }
  });

  /* ----- Tilt 3D mengikuti kursor (hanya perangkat dengan mouse) ----- */
  if (!coarse && tilt) {
    gsap.set(tilt, { transformPerspective: 1200 });
    var rY = gsap.quickTo(tilt, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    var rX = gsap.quickTo(tilt, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    var section = document.getElementById('booth');
    section.addEventListener('pointermove', function (e) {
      var r = machine.getBoundingClientRect();
      var cx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      var cy = (e.clientY - (r.top + 160)) / window.innerHeight;
      rY(gsap.utils.clamp(-8, 8, cx * 18));
      rX(gsap.utils.clamp(-5, 5, -cy * 8));
    });
    section.addEventListener('pointerleave', function () { rY(0); rX(0); });
  }
})();
