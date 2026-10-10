/* ==========================================================
   three-scene.js  -  kado 3D + balon + debu cahaya (Three.js r128)
   - Canvas fixed di belakang konten
   - Kamera turun mengikuti scroll -> parallax kedalaman alami
   - Objek merespons kursor
   - Event 'gift:open' membuka tutup kado, 'gift:burst' memicu percikan
   ========================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('three-canvas');
  var root = document.documentElement;
  if (!canvas || typeof THREE === 'undefined') { root.classList.add('no-webgl'); return; }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var motion = reduceMotion ? 0 : 1;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: !coarse, powerPreference: 'high-performance' });
  } catch (err) { root.classList.add('no-webgl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.6 : 2));
  renderer.setClearColor(0x000000, 0);

  var FOV = 45, CAM_Z = 14;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);
  camera.position.z = CAM_Z;
  scene.add(camera);

  /* ----- Lampu (menempel di kamera supaya ikut turun saat scroll) ----- */
  var hemi = new THREE.HemisphereLight(0xffd9cf, 0x2a0610, 0.95);
  camera.add(hemi);
  var key = new THREE.DirectionalLight(0xfff0dd, 1.5);
  key.position.set(5, 7, 6);
  camera.add(key);
  camera.add(key.target);
  key.target.position.set(0, 0, -CAM_Z);
  var rim = new THREE.PointLight(0xff4a63, 1.3, 40);
  rim.position.set(-7, 1, 3);
  camera.add(rim);

  /* ----- Tekstur titik cahaya ----- */
  function dotTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,244,214,1)');
    gr.addColorStop(0.25, 'rgba(255,214,140,.85)');
    gr.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  var dotTex = dotTexture();

  /* ----- Pseudo-random stabil (supaya layout tidak berubah tiap resize) ----- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(2025);

  /* ===== Ukuran & metrik ===== */
  var W = 1, H = 1, visibleH = 1, visibleW = 1, upp = 0.01, docH = 2000, narrow = false;

  /* ===== KADO ===== */
  var gift = new THREE.Group();
  var lid = new THREE.Group();
  var OFFSET = -0.35, BW = 2.4, BH = 1.5;

  var boxMat = new THREE.MeshStandardMaterial({ color: 0x9a2038, roughness: 0.36, metalness: 0.14 });
  var lidMat = new THREE.MeshStandardMaterial({ color: 0xa8263f, roughness: 0.34, metalness: 0.14 });
  var goldMat = new THREE.MeshStandardMaterial({ color: 0xe2b35e, roughness: 0.28, metalness: 0.55, emissive: 0x3a2306 });

  var base = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BW), boxMat);
  base.position.y = OFFSET;
  gift.add(base);
  var rv = new THREE.Mesh(new THREE.BoxGeometry(0.5, BH + 0.02, BW + 0.02), goldMat);
  rv.position.y = OFFSET; gift.add(rv);
  var rh = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.02, BH + 0.02, 0.5), goldMat);
  rh.position.y = OFFSET; gift.add(rh);

  var lidY = BH / 2 + 0.25 + OFFSET;
  var lidBox = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.2, 0.5, BW + 0.2), lidMat);
  lidBox.position.y = lidY; lid.add(lidBox);
  var lv = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, BW + 0.22), goldMat);
  lv.position.y = lidY; lid.add(lv);
  var lh = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.22, 0.52, 0.5), goldMat);
  lh.position.y = lidY; lid.add(lh);

  function bowLoops(rotY) {
    var g = new THREE.Group();
    var geo = new THREE.TorusGeometry(0.38, 0.1, 12, 28);
    var a = new THREE.Mesh(geo, goldMat); a.position.x = -0.36; a.rotation.z = 0.6; a.scale.set(1, 1.2, 1);
    var b = new THREE.Mesh(geo, goldMat); b.position.x = 0.36; b.rotation.z = -0.6; b.scale.set(1, 1.2, 1);
    g.add(a); g.add(b);
    g.rotation.y = rotY;
    return g;
  }
  var bow = new THREE.Group();
  bow.position.y = lidY + 0.25 + 0.3;
  bow.add(bowLoops(0));
  bow.add(bowLoops(Math.PI / 2));
  var knot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), goldMat);
  bow.add(knot);
  lid.add(bow);
  gift.add(lid);

  /* cahaya dalam kado + halo di belakang */
  var inner = new THREE.PointLight(0xffc870, 0, 12);
  inner.position.set(0, BH / 2 + OFFSET, 0);
  gift.add(inner);

  var glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xffd98a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  glowSprite.position.set(0, BH / 2 + OFFSET + 0.1, 0);
  glowSprite.scale.set(0.1, 0.1, 1);
  gift.add(glowSprite);

  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xff6a80, transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0, 0, -1.8);
  halo.scale.set(9, 9, 1);
  gift.add(halo);

  scene.add(gift);

  var giftScale = 1;
  var intro = { v: reduceMotion ? 1 : 0 };
  if (window.gsap && !reduceMotion) {
    gsap.to(intro, { v: 1, duration: 1.7, delay: 0.5, ease: 'elastic.out(1, 0.6)' });
  } else { intro.v = 1; }

  /* ===== BALON ===== */
  var COLORS = [0x8f1d33, 0xb02a44, 0x650f25, 0xe2b35e, 0xeaa9a1, 0xf1d9c8, 0x7a1630];
  var balloonGeo = new THREE.SphereGeometry(1, 32, 32);
  var knotGeo = new THREE.ConeGeometry(0.14, 0.24, 14);
  var matCache = {};
  function balloonMat(color) {
    if (!matCache[color]) {
      matCache[color] = new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12 });
    }
    return matCache[color];
  }
  var stringPts = [];
  for (var si = 0; si <= 12; si++) {
    var st = si / 12;
    stringPts.push(new THREE.Vector3(Math.sin(st * 5) * 0.12 * st, -1.3 - st * 3.2, 0));
  }
  var stringGeo = new THREE.BufferGeometry().setFromPoints(stringPts);
  var stringMat = new THREE.LineBasicMaterial({ color: 0xf1d9c8, transparent: true, opacity: 0.55 });

  function makeBalloon(color) {
    var g = new THREE.Group();
    var m = balloonMat(color);
    var body = new THREE.Mesh(balloonGeo, m);
    body.scale.set(0.9, 1.12, 0.9);
    g.add(body);
    var k = new THREE.Mesh(knotGeo, m);
    k.position.y = -1.17;
    g.add(k);
    g.add(new THREE.Line(stringGeo, stringMat));
    return g;
  }

  var balloons = [];
    var BALLOON_N = coarse || window.innerWidth < 1100 ? 10 : 17;
  for (var bi = 0; bi < BALLOON_N; bi++) {
    var side = bi % 2 === 0 ? 0 : 1;
    var far = rnd() < 0.25;
    var nx = far ? rnd() : (side ? 0.8 + rnd() * 0.18 : 0.02 + rnd() * 0.18);
    var bz = far ? -9 + rnd() * 3 : -5 + rnd() * 7;
    var bObj = makeBalloon(COLORS[bi % COLORS.length]);
    scene.add(bObj);
    balloons.push({
      obj: bObj, nx: nx, ny: 0.04 + (bi / BALLOON_N) * 0.94 + rnd() * 0.03, z: bz,
      scale: (0.55 + rnd() * 0.55), phase: rnd() * 6.28, speed: 0.5 + rnd() * 0.6,
      offX: 0, offY: 0
    });
  }

  /* ===== DEBU CAHAYA ===== */
  var DUST_N = coarse ? 130 : 260;
  var dustSeed = new Float32Array(DUST_N * 3);
  for (var di = 0; di < dustSeed.length; di++) dustSeed[di] = rnd();
  var dustPos = new Float32Array(DUST_N * 3);
  var dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.11, map: dotTex, color: 0xf1d08e, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending
  }));
  dust.frustumCulled = false;
  scene.add(dust);

  function layoutDust() {
    for (var i = 0; i < DUST_N; i++) {
      dustPos[i * 3] = (dustSeed[i * 3] - 0.5) * visibleW * 1.7;
      dustPos[i * 3 + 1] = -dustSeed[i * 3 + 1] * docH * upp;
      dustPos[i * 3 + 2] = -8 + dustSeed[i * 3 + 2] * 11;
    }
    dustGeo.attributes.position.needsUpdate = true;
  }

  /* ===== PERCIKAN SAAT KADO DIBUKA ===== */
  var BURST_N = 170;
  var bPos = new Float32Array(BURST_N * 3);
  var bVel = new Float32Array(BURST_N * 3);
  var bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  var bMat = new THREE.PointsMaterial({ size: 0.24, map: dotTex, color: 0xffd98a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  var bursts = new THREE.Points(bGeo, bMat);
  bursts.frustumCulled = false;
  scene.add(bursts);
  var bLife = 0;

  function triggerBurst() {
    var s = giftScale * intro.v;
    for (var i = 0; i < BURST_N; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = 2.5 + Math.random() * 5.5;
      bPos[i * 3] = gift.position.x + (Math.random() - 0.5) * 1.4 * s;
      bPos[i * 3 + 1] = gift.position.y + 0.9 * s;
      bPos[i * 3 + 2] = gift.position.z + (Math.random() - 0.5) * 1.2 * s;
      bVel[i * 3] = Math.cos(ang) * sp * 0.55;
      bVel[i * 3 + 1] = sp;
      bVel[i * 3 + 2] = Math.sin(ang) * sp * 0.4;
    }
    bLife = 1;
    bGeo.attributes.position.needsUpdate = true;
  }

  /* ===== EVENT dari tombol ===== */
  var isOpen = false;
  function openGift() {
    if (isOpen) { triggerBurst(); wobble(); return; }
    isOpen = true;
    if (window.gsap) {
      gsap.to(lid.position, { y: 2.3, duration: 0.95, ease: 'back.out(1.7)' });
      gsap.to(lid.rotation, { z: -0.55, x: 0.18, duration: 0.95, ease: 'power3.out' });
      gsap.to(inner, { intensity: 3.2, duration: 0.6, ease: 'power2.out' });
      gsap.to(glowSprite.material, { opacity: 0.95, duration: 0.7 });
      gsap.to(glowSprite.scale, { x: 4.2, y: 4.2, duration: 0.9, ease: 'power3.out' });
    } else {
      lid.position.y = 2.3; lid.rotation.z = -0.55; inner.intensity = 3.2; glowSprite.material.opacity = 0.9; glowSprite.scale.set(4.2, 4.2, 1);
    }
    triggerBurst();
  }
  var wob = { v: 0 };
  function wobble() {
    if (!window.gsap) return;
    gsap.fromTo(wob, { v: 1 }, { v: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' });
  }
  window.addEventListener('gift:open', openGift);
  window.addEventListener('gift:burst', function () { triggerBurst(); wobble(); });

  /* ===== Mouse ===== */
  var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', function (e) {
    mouse.x = (e.clientX / (W || 1)) * 2 - 1;
    mouse.y = -((e.clientY / (H || 1)) * 2 - 1);
  }, { passive: true });

  /* ===== Resize & layout ===== */
  function measure() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    visibleH = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
    visibleW = visibleH * camera.aspect;
    upp = visibleH / H;
    docH = Math.max(document.documentElement.scrollHeight, H * 2);
        narrow = W < 1100 || W < H;
    giftScale = narrow ? 1.15 : Math.min(1.9, H / 470);
    layoutDust();
  }
  var measureQueued = false;
  function queueMeasure() {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(function () { measureQueued = false; measure(); });
  }
  window.addEventListener('resize', queueMeasure);
  window.addEventListener('load', queueMeasure);
  if (window.ResizeObserver) new ResizeObserver(queueMeasure).observe(document.body);
  measure();

  /* ===== Loop ===== */
  var clock = new THREE.Clock();
  var smoothScroll = window.scrollY || 0;

  function tick() {
    requestAnimationFrame(tick);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 4);
    mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 4);
    smoothScroll += ((window.scrollY || 0) - smoothScroll) * Math.min(1, dt * 7);

    var camY = -(smoothScroll + H / 2) * upp;
    camera.position.set(mouse.sx * 0.55 * motion, camY + mouse.sy * 0.3 * motion, CAM_Z);

    /* kado */
    var gx = narrow ? 0 : visibleW * 0.2;
    var gyPx = narrow ? H * 0.27 : H * 0.5;
    var s = giftScale * Math.max(0.0001, intro.v);
    gift.scale.setScalar(s);
    gift.position.set(gx, -gyPx * upp + Math.sin(t * 1.1) * 0.12 * motion, 1);
    var tgtY = 0.55 + Math.sin(t * 0.5) * 0.35 * motion + mouse.sx * 0.6 * motion + smoothScroll * 0.0012 + wob.v * Math.sin(t * 30) * 0.12;
    var tgtX = 0.2 - mouse.sy * 0.22 * motion;
    gift.rotation.y += (tgtY - gift.rotation.y) * Math.min(1, dt * 5);
    gift.rotation.x += (tgtX - gift.rotation.x) * Math.min(1, dt * 5);
    bow.rotation.y = Math.sin(t * 1.4) * 0.12 * motion;

    key.position.x = 5 + mouse.sx * 4 * motion;
    rim.position.y = 1 + mouse.sy * 3 * motion;

    /* balon */
    var cursorX = camera.position.x, cursorY = camera.position.y;
    for (var i = 0; i < balloons.length; i++) {
      var b = balloons[i];
      var persp = (CAM_Z - b.z) / CAM_Z;
      var bx = (b.nx - 0.5) * visibleW * persp * 0.98;
      var by = -(b.ny * docH) * upp;

      /* dorong menjauhi kursor (hanya pada perangkat dengan hover) */
      var tx = 0, ty = 0;
      if (!coarse && motion) {
        var cx = cursorX + mouse.sx * (visibleW / 2) * persp;
        var cy = cursorY + mouse.sy * (visibleH / 2) * persp;
        var dx = bx - cx, dy = (by + 0.6) - cy;
        var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        var R = 3.0 * b.scale;
        if (d < R) { var push = (1 - d / R); tx = (dx / d) * push * 1.6; ty = (dy / d) * push * 1.1; }
      }
      b.offX += (tx - b.offX) * Math.min(1, dt * 5);
      b.offY += (ty - b.offY) * Math.min(1, dt * 5);

      b.obj.position.set(
        bx + b.offX + Math.sin(t * b.speed * 0.6 + b.phase) * 0.18 * motion,
        by + b.offY + Math.sin(t * b.speed + b.phase) * 0.28 * motion,
        b.z
      );
      b.obj.rotation.z = Math.sin(t * b.speed * 0.8 + b.phase) * 0.08 * motion - b.offX * 0.12;
      b.obj.rotation.y = t * 0.2 * motion + b.phase;
      b.obj.scale.setScalar(b.scale * (narrow ? 0.85 : 1));
    }

    /* debu: berkedip halus lewat opacity global */
    dust.material.opacity = 0.7 + Math.sin(t * 1.6) * 0.15 * motion;

    /* percikan */
    if (bLife > 0) {
      bLife -= dt * 0.5;
      for (var p = 0; p < BURST_N; p++) {
        bVel[p * 3 + 1] -= 4.2 * dt;
        bPos[p * 3] += bVel[p * 3] * dt;
        bPos[p * 3 + 1] += bVel[p * 3 + 1] * dt;
        bPos[p * 3 + 2] += bVel[p * 3 + 2] * dt;
      }
      bGeo.attributes.position.needsUpdate = true;
      bMat.opacity = Math.max(0, bLife);
    }

    renderer.render(scene, camera);
  }
  tick();
})();
