/* ==========================================================
   cardstack.js  -  tumpukan kartu polaroid yang bisa digeser
   (pointer events: mouse + sentuhan, tombol, keyboard)
   ========================================================== */
(function () {
  'use strict';

  var cfg = window.BIRTHDAY_CONFIG;
  var root = document.getElementById('stack');
  if (!root || !cfg || !window.gsap) return;

  var photos = cfg.photos;
  var total = photos.length;
  var MAX_VISIBLE = 4;
  var cards = [];
  var counter = document.getElementById('stackCounter');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Buat kartu ----- */
  photos.forEach(function (p, i) {
    var el = document.createElement('article');
    el.className = 'stack__card';

    var ph = document.createElement('div');
    ph.className = 'stack__photo';
    var img = new Image();
    img.alt = p.alt || p.caption || ('Foto ' + (i + 1));
    img.draggable = false;
    img.onerror = function () { img.onerror = null; img.src = window.photoFallback(i); };
    img.src = p.src;
    ph.appendChild(img);

    var cap = document.createElement('div');
    cap.className = 'stack__caption';
    cap.textContent = p.caption || '';

    el.appendChild(ph);
    el.appendChild(cap);
    root.appendChild(el);
    cards.push(el);
  });

  var order = cards.slice();   // order[0] = kartu paling atas
  var busy = false;

  function slot(i) {
    return {
      x: 0,
      y: i * 18,
      scale: 1 - i * 0.06,
      rotation: i === 0 ? 0 : (i % 2 ? 1 : -1) * (1.8 + i * 0.8),
      opacity: i < MAX_VISIBLE ? 1 : 0
    };
  }

  function updateMeta() {
    if (counter) counter.textContent = (cards.indexOf(order[0]) + 1) + ' / ' + total;
  }

  function layout(animate) {
    order.forEach(function (el, i) {
      var s = slot(i);
      gsap.set(el, { zIndex: total - i });
      if (animate && !reduce) {
        gsap.to(el, { x: s.x, y: s.y, scale: s.scale, rotation: s.rotation, opacity: s.opacity, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      } else {
        gsap.set(el, s);
      }
      el.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      el.style.pointerEvents = i === 0 ? 'auto' : 'none';
    });
    updateMeta();
  }

  /* ----- Pindah kartu ----- */
  function dismiss(dir) {
    if (busy) return;
    busy = true;
    var el = order.shift();
    var out = Math.max(window.innerWidth, 500) * dir;

    if (dir > 0 && window.Party && el) {
      var r = el.getBoundingClientRect();
      window.Party.hearts((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight);
    }

    gsap.to(el, {
      x: out, y: '+=40', rotation: dir * 28, opacity: 0, duration: reduce ? 0.01 : 0.55, ease: 'power2.in',
      onComplete: function () {
        order.push(el);
        var s = slot(order.length - 1);
        gsap.set(el, { x: 0, y: s.y, scale: s.scale, rotation: s.rotation, opacity: 0 });
        layout(false);
        gsap.to(el, { opacity: s.opacity, duration: 0.4 });
        busy = false;
      }
    });
    layout(true);
  }

  function previous() {
    if (busy) return;
    var el = order.pop();
    order.unshift(el);
    gsap.set(el, { x: -window.innerWidth * 0.6, y: 20, rotation: -22, opacity: 0, scale: 1 });
    layout(true);
  }

  /* ----- Drag (mouse & sentuhan) ----- */
  var drag = null;

  root.addEventListener('pointerdown', function (e) {
    if (busy || !order[0].contains(e.target)) return;
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, dx: 0, active: false, vx: 0, lx: e.clientX, lt: performance.now() };
  });

  root.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;

    if (!drag.active) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) { drag = null; return; }   // gerak vertikal = scroll halaman
      drag.active = true;
      try { root.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
      gsap.killTweensOf(order[0]);
      root.classList.add('is-dragging');
    }

    var now = performance.now();
    var dt = Math.max(1, now - drag.lt);
    drag.vx = (e.clientX - drag.lx) / dt;     // px per ms
    drag.lx = e.clientX; drag.lt = now;
    drag.dx = dx;

    gsap.set(order[0], { x: dx, y: dy * 0.35, rotation: dx * 0.06 });

    /* kartu di bawahnya ikut "naik" sesuai tarikan */
    var pull = Math.min(1, Math.abs(dx) / 160);
    for (var i = 1; i < Math.min(order.length, MAX_VISIBLE); i++) {
      var a = slot(i), b = slot(i - 1);
      gsap.set(order[i], {
        y: a.y + (b.y - a.y) * pull,
        scale: a.scale + (b.scale - a.scale) * pull,
        rotation: a.rotation + (b.rotation - a.rotation) * pull
      });
    }
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    root.classList.remove('is-dragging');
    if (!d.active) return;

    if (Math.abs(d.dx) > 90 || Math.abs(d.vx) > 0.6) {
      dismiss(d.dx > 0 || d.vx > 0.6 ? 1 : -1);
    } else {
      gsap.to(order[0], { x: 0, y: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.55)' });
      layout(true);
    }
  }
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  /* ----- Tombol & keyboard ----- */
  var btnNext = document.getElementById('stackNext');
  var btnPrev = document.getElementById('stackPrev');
  if (btnNext) btnNext.addEventListener('click', function () { dismiss(1); });
  if (btnPrev) btnPrev.addEventListener('click', previous);
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); dismiss(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); previous(); }
  });

  /* ----- Mulai ----- */
  layout(false);

  if (!reduce && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from(cards, {
      y: '+=170', rotation: '+=12', opacity: 0, duration: 1.1, stagger: 0.08, ease: 'back.out(1.3)',
      scrollTrigger: { trigger: root, start: 'top 85%', toggleActions: 'play none none none' }
    });
  }
})();
