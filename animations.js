/* ==========================================================
   animations.js  -  GSAP + ScrollTrigger
   - intro hero, reveal saat scroll, kata menyala, parallax
   - transisi warna latar antar section
   ========================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.add('no-gsap'); return; }

  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var $$ = function (s) { return gsap.utils.toArray(s); };

  /* ----- Bokeh dibuat via JS (parallax tak terbatas) ----- */
  var bokehHost = document.getElementById('bokeh');
  var dots = [];
  if (bokehHost) {
    var N = coarse ? 12 : 22;
    for (var i = 0; i < N; i++) {
      var d = document.createElement('i');
      d.className = 'bokeh';
      var b = document.createElement('b');
      var size = 6 + Math.random() * 26;
      b.style.width = b.style.height = size + 'px';
      b.style.opacity = (0.25 + Math.random() * 0.55).toFixed(2);
      b.style.filter = 'blur(' + (size > 20 ? 2.5 : 0.6) + 'px)';
      d.style.left = (Math.random() * 100).toFixed(1) + '%';
      d.appendChild(b);
      bokehHost.appendChild(d);
      dots.push({
        el: d, inner: b,
        speed: 0.12 + Math.random() * 0.85,           // makin besar = makin "dekat"
        y0: Math.random() * window.innerHeight,
        setY: gsap.quickSetter(d, 'y', 'px'),
        setX: gsap.quickTo(b, 'x', { duration: 0.9, ease: 'power3.out' }),
        setMY: gsap.quickTo(b, 'y', { duration: 0.9, ease: 'power3.out' })
      });
    }
  }

  function updateBokeh(scrollY) {
    var h = window.innerHeight;
    for (var i = 0; i < dots.length; i++) {
      var o = dots[i];
      o.setY(gsap.utils.wrap(-60, h + 60, o.y0 - scrollY * o.speed));
    }
  }
  updateBokeh(window.scrollY || 0);

  if (!reduce) {
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) { updateBokeh(self.scroll()); }
    });
    window.addEventListener('resize', function () { updateBokeh(window.scrollY || 0); });

    /* parallax mouse (latar + bokeh) */
    if (!coarse) {
      var orbSetters = $$('.bg-orb').map(function (el, idx) {
        return { x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }), k: (idx + 1) * 18 };
      });
      window.addEventListener('pointermove', function (e) {
        var nx = e.clientX / window.innerWidth - 0.5;
        var ny = e.clientY / window.innerHeight - 0.5;
        orbSetters.forEach(function (o) { o.x(-nx * o.k * 2); });
        dots.forEach(function (o) { o.setX(-nx * 60 * o.speed); o.setMY(-ny * 60 * o.speed); });
      }, { passive: true });
    }

    /* parallax scroll lapisan latar */
    $$('.bg-layer').forEach(function (el) {
      var s = parseFloat(el.dataset.speed || '0.2');
      gsap.to(el, {
        y: function () { return -s * 900; },
        ease: 'none',
        scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true }
      });
    });
  }

  /* ----- Progress bar ----- */
  gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

  /* ----- Transisi warna latar antar section ----- */
  $$('[data-tint]').forEach(function (sec) {
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: function (self) {
        if (self.isActive) gsap.to('.bg__tint', { backgroundColor: sec.dataset.tint, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
      }
    });
  });

  /* ----- Intro hero (satu momen utama saat halaman dibuka) ----- */
  var chars = $$('.hero__title .char');
  if (!reduce) {
    gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 })
      .from('.hero__for', { y: 22, opacity: 0, duration: 0.8 })
      .from(chars, {
        yPercent: 90, rotationX: -85, opacity: 0, transformPerspective: 700,
        transformOrigin: '50% 100% -20px', stagger: 0.035, duration: 1.25, ease: 'back.out(1.5)'
      }, '-=0.45')
      .from('.hero__sub', { y: 24, opacity: 0, duration: 0.9 }, '-=0.75')
      .from('.hero__actions .btn', { y: 34, opacity: 0, scale: 0.88, stagger: 0.12, duration: 0.85, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, '-=0.65')
      .from(['.hero__scroll', '#musicToggle'], { opacity: 0, duration: 0.8 }, '-=0.3');

    /* hero memudar & naik pelan saat di-scroll */
    gsap.to('.hero__inner', {
      y: -90, opacity: 0.0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '85% top', scrub: true }
    });
  }

  /* ----- Reveal saat scroll ----- */
  if (!reduce) {
    $$('[data-reveal]').forEach(function (el) {
      var type = el.dataset.reveal || 'up';
      var v = { opacity: 0, duration: 1.1, ease: 'power3.out', delay: parseFloat(el.dataset.delay || '0') };
      if (type === 'up') v.y = 70;
      if (type === 'left') v.x = -80;
      if (type === 'right') v.x = 80;
      if (type === 'scale') { v.scale = 0.82; v.y = 40; }
      if (type === 'blur') { v.filter = 'blur(12px)'; v.y = 30; }
      v.scrollTrigger = { trigger: el, start: 'top 88%', toggleActions: 'play none none none' };
      v.clearProps = 'transform,filter';
      gsap.from(el, v);
    });
  }

  /* ----- Pesan: kata menyala mengikuti scroll ----- */
  var words = $$('#messageText .w');
  if (words.length) {
    if (reduce) { gsap.set(words, { opacity: 1 }); }
    else {
      gsap.fromTo(words, { opacity: 0.12, y: 10 }, {
        opacity: 1, y: 0, stagger: 0.12, ease: 'none',
        scrollTrigger: { trigger: '#messageText', start: 'top 82%', end: 'bottom 48%', scrub: true }
      });
    }
  }

  /* ----- Angka umur besar: parallax + putar ----- */
  if (!reduce) {
    gsap.fromTo('.message__numeral span',
      { yPercent: 28, scale: 0.82, rotation: -7 },
      { yPercent: -28, scale: 1.12, rotation: 7, ease: 'none',
        scrollTrigger: { trigger: '.message', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ----- Kue: muncul dengan bounce ----- */
  /* (reveal 'scale' di atas sudah menangani kemunculan; hint kecil di bawah) */

  /* ----- Tombol gulir hero ----- */
  var hint = document.getElementById('scrollHint');
  if (hint) {
    hint.addEventListener('click', function () {
      if (window.ScrollToPlugin) gsap.to(window, { scrollTo: '#message', duration: 1.4, ease: 'power3.inOut' });
      else document.getElementById('message').scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* Hitung ulang setelah font & gambar siap */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
