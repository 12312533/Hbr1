/* ==========================================================
   interactions.js
   - Party   : efek confetti (canvas-confetti)
   - Music   : lagu mp3 atau melodi cadangan (Web Audio)
   - Tombol  : Buka Kado, Pesan Rahasia, tiup lilin
   ========================================================== */
(function () {
  'use strict';

  var cfg = window.BIRTHDAY_CONFIG;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!window.gsap;

  /* ========== CONFETTI ========== */
  var COLORS = ['#8f1d33', '#b02a44', '#e2b35e', '#f1d08e', '#eaa9a1', '#f8ebdd', '#650f25'];
  var heartShapes = null;

  function getHearts() {
    if (heartShapes) return heartShapes;
    try { heartShapes = [window.confetti.shapeFromText({ text: '\u2764', scalar: 2 })]; }
    catch (e) { heartShapes = ['circle']; }
    return heartShapes;
  }
  function ok() { return !!window.confetti && !reduce; }

  var Party = {
    burst: function (x, y) {
      if (!ok()) return;
      confetti({ particleCount: 100, spread: 80, startVelocity: 44, origin: { x: x, y: y }, colors: COLORS, ticks: 230, zIndex: 80 });
      confetti({ particleCount: 36, spread: 130, startVelocity: 26, origin: { x: x, y: y }, colors: COLORS, shapes: getHearts(), scalar: 2, ticks: 260, zIndex: 80 });
    },
    hearts: function (x, y) {
      if (!ok()) return;
      confetti({ particleCount: 14, spread: 70, startVelocity: 22, origin: { x: x, y: y }, colors: COLORS, shapes: getHearts(), scalar: 2, ticks: 200, gravity: 0.7, zIndex: 80 });
    },
    cannons: function () {
      if (!ok()) return;
      var end = Date.now() + 1500;
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 62, origin: { x: 0, y: 0.78 }, colors: COLORS, zIndex: 80 });
        confetti({ particleCount: 4, angle: 120, spread: 62, origin: { x: 1, y: 0.78 }, colors: COLORS, zIndex: 80 });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    },
    rain: function (ms) {
      if (!ok()) return;
      var end = Date.now() + (ms || 2600);
      (function frame() {
        confetti({ particleCount: 3, startVelocity: 0, ticks: 320, gravity: 0.55, spread: 160, angle: 90, origin: { x: Math.random(), y: -0.05 }, colors: COLORS, scalar: 1.1, zIndex: 80 });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  };
  window.Party = Party;

  /* ========== MUSIK ========== */
  var toggleBtn = document.getElementById('musicToggle');

  function setUI(playing) {
    if (!toggleBtn) return;
    toggleBtn.classList.toggle('is-playing', playing);
    toggleBtn.setAttribute('aria-pressed', String(playing));
    toggleBtn.setAttribute('aria-label', playing ? 'Jeda musik' : 'Putar musik');
  }

  /* Melodi cadangan (jika file mp3 tidak ada): Happy Birthday via oscillator */
  var NOTE = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
  var TUNE = [
    ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
    ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
    ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
    ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]
  ];
  var Synth = {
    ctx: null, active: false,
    start: function () {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.active = true;
      this.loop();
      return true;
    },
    loop: function () {
      var self = this, ctx = this.ctx, t = ctx.currentTime + 0.08, beat = 0.42, last = null;
      TUNE.forEach(function (n) {
        var dur = n[1] * beat;
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = NOTE[n[0]];
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.16, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.96);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + dur);
        last = o;
        t += dur;
      });
      if (last) last.onended = function () { if (self.active) setTimeout(function () { if (self.active) self.loop(); }, 1400); };
    },
    pause: function () { if (this.ctx) this.ctx.suspend(); },
    resume: function () { if (this.ctx) this.ctx.resume(); }
  };

  var Music = {
    audio: null, mode: null, playing: false,
    fallback: function () {
      if (this.mode === 'synth') return;
      this.mode = 'synth';
      if (this.audio) { this.audio.pause(); }
      if (this.playing && !Synth.start()) { this.playing = false; setUI(false); }
    },
    play: function () {
      var self = this;
      if (this.playing) return;
      this.playing = true;
      setUI(true);

      if (this.mode === 'synth') { Synth.active ? Synth.resume() : Synth.start(); return; }
      if (!cfg.music) { this.fallback(); return; }

      if (!this.audio) {
        this.audio = new Audio(cfg.music);
        this.audio.loop = true;
        this.audio.volume = 0.65;
        this.audio.addEventListener('error', function () { self.fallback(); });
      }
      var p = this.audio.play();
      if (p && p.then) {
        p.then(function () { self.mode = 'file'; }).catch(function (err) {
          if (err && err.name === 'NotAllowedError') { self.playing = false; setUI(false); }
          else self.fallback();
        });
      }
    },
    pause: function () {
      if (!this.playing) return;
      this.playing = false;
      setUI(false);
      if (this.mode === 'synth') Synth.pause();
      else if (this.audio) this.audio.pause();
    },
    toggle: function () { this.playing ? this.pause() : this.play(); }
  };
  window.Music = Music;
  if (toggleBtn) toggleBtn.addEventListener('click', function () { Music.toggle(); });

  /* ========== BUKA KADO ========== */
  var openGiftBtn = document.getElementById('openGift');
  var giftHint = document.getElementById('giftHint');
  var giftOpened = false;

  function centerOf(el) {
    var r = el.getBoundingClientRect();
    return { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
  }

  if (openGiftBtn) {
    openGiftBtn.addEventListener('click', function () {
      var o = centerOf(openGiftBtn);
      if (!giftOpened) {
        giftOpened = true;
        window.dispatchEvent(new Event('gift:open'));
        Party.burst(o.x, o.y);
        setTimeout(Party.cannons, 350);
        Music.play();
        openGiftBtn.querySelector('.btn__label').textContent = 'Kado terbuka!';
        if (giftHint) giftHint.textContent = 'Ketuk lagi untuk percikan berikutnya, lalu gulir ke bawah.';
      } else {
        window.dispatchEvent(new Event('gift:burst'));
        Party.burst(o.x, o.y);
      }
    });
  }

  /* ========== PESAN RAHASIA ========== */
  var modal = document.getElementById('secretModal');
  var letter = document.getElementById('letter');
  var openSecretBtn = document.getElementById('openSecret');
  var lastFocus = null;

  function openSecret() {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var closeBtn = modal.querySelector('.letter__close');
    if (closeBtn) closeBtn.focus();

    if (hasGsap && !reduce) {
      var tl = gsap.timeline();
      tl.fromTo('.modal__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })
        .fromTo(letter, { y: 140, rotationX: -40, opacity: 0, scale: 0.88, transformPerspective: 900 },
          { y: 0, rotationX: 0, opacity: 1, scale: 1, duration: 1, ease: 'power4.out' }, 0.05)
        .fromTo('.letter__seal', { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(2.6)' }, 0.5)
        .fromTo(['.letter__title', '.letter__body p', '.letter__sign'], { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.35, ease: 'power2.out' }, 0.8);
      setTimeout(function () { Party.hearts(0.5, 0.35); Party.hearts(0.3, 0.5); Party.hearts(0.7, 0.5); }, 700);
    }
    Music.play();
  }

  function closeSecret() {
    if (!modal || modal.hidden) return;
    function done() {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    if (hasGsap && !reduce) {
      gsap.to(letter, { y: 60, opacity: 0, scale: 0.94, duration: 0.4, ease: 'power2.in' });
      gsap.to('.modal__backdrop', { opacity: 0, duration: 0.45, onComplete: done });
    } else { done(); }
  }

  if (openSecretBtn) openSecretBtn.addEventListener('click', openSecret);
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeSecret(); });
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') closeSecret();
      if (e.key === 'Tab') { e.preventDefault(); var c = modal.querySelector('.letter__close'); if (c) c.focus(); }
    });
  }

  /* ========== TIUP LILIN ========== */
  var cake = document.getElementById('cake');
  var flame = document.getElementById('flame');
  var smoke = document.getElementById('smoke');
  var wishHint = document.getElementById('wishHint');
  var blown = false;

  function puff() {
    if (!smoke || !hasGsap) return;
    for (var i = 0; i < 5; i++) {
      var s = document.createElement('span');
      s.className = 'smoke-puff';
      smoke.appendChild(s);
      gsap.fromTo(s, { y: 0, x: 0, scale: 0.5, opacity: 0.7 },
        { y: -70 - Math.random() * 40, x: (Math.random() - 0.5) * 40, scale: 2 + Math.random(), opacity: 0,
          duration: 1.6 + Math.random() * 0.6, delay: i * 0.12, ease: 'power1.out', onComplete: function () { this.targets()[0].remove(); } });
    }
  }

  if (cake && flame) {
    cake.addEventListener('click', function () {
      if (!blown) {
        blown = true;
        if (hasGsap) {
          gsap.to(flame, { scaleY: 0, scaleX: 0.3, opacity: 0, duration: 0.35, ease: 'power2.in', onStart: function () { flame.style.animation = 'none'; } });
        } else { flame.style.display = 'none'; }
        puff();
        Party.cannons();
        Party.rain(3000);
        var o = centerOf(cake);
        Party.burst(o.x, o.y - 0.1);
        if (wishHint) wishHint.textContent = cfg.wishDone + ' (Ketuk lagi untuk menyalakan ulang.)';
        Music.play();
      } else {
        blown = false;
        flame.style.animation = '';
        if (hasGsap) gsap.to(flame, { scaleY: 1, scaleX: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)', clearProps: 'transform,opacity' });
        else flame.style.display = '';
        if (wishHint) wishHint.textContent = 'Ketuk kue untuk meniup lilin';
      }
    });
  }
})();
