/* ═══════════════════════════════════════
   ArrowShot — Three.js Hero Scene
   Floating particle system with bow aesthetic
   ═══════════════════════════════════════ */

(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const section = document.querySelector('.hero');
  let W = section.offsetWidth;
  let H = section.offsetHeight;

  // ── Renderer ──────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // ── Scene & Camera ────────────────────────
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.set(0, 0, 6);

  // ── Sprite texture (soft circle) ──────────
  function makeCircleTexture(color) {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const mid = size / 2;
    const grad = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
    grad.addColorStop(0, color);
    grad.addColorStop(0.4, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  const texGreen = makeCircleTexture('rgba(44,74,62,0.9)');
  const texGold  = makeCircleTexture('rgba(201,168,76,0.9)');

  // ── Particle helpers ──────────────────────
  function createParticles(count, texture, size, opacity, spread) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 2); // vx, vy

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * spread.x;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      vel[i * 2]     = (Math.random() - 0.5) * 0.004;
      vel[i * 2 + 1] = Math.random() * 0.003 + 0.001;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      map: texture,
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    points.userData.vel = vel;
    points.userData.spread = spread;
    scene.add(points);
    return points;
  }

  const greenParticles = createParticles(220, texGreen, 0.08, 0.55, { x: 14, y: 10 });
  const goldParticles  = createParticles(60,  texGold,  0.12, 0.75, { x: 12, y: 8 });

  // ── Bow wireframe decoration ──────────────
  function makeBowCurve() {
    const points = [];
    const segments = 60;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = Math.PI * t; // 0 to π
      const x = -Math.cos(angle) * 1.8;
      const y = Math.sin(angle) * 2.8 - 1.4;
      points.push(new THREE.Vector3(x, y, 0));
    }
    return points;
  }

  const bowCurve = new THREE.CatmullRomCurve3(makeBowCurve());
  const bowGeo   = new THREE.TubeGeometry(bowCurve, 80, 0.008, 6, false);
  const bowMat   = new THREE.MeshBasicMaterial({
    color: 0x2C4A3E,
    transparent: true,
    opacity: 0.18,
  });
  const bowMesh = new THREE.Mesh(bowGeo, bowMat);
  bowMesh.position.set(3.5, 0, -1);
  scene.add(bowMesh);

  // Bowstring
  const stringGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.8, -1.4, 0),
    new THREE.Vector3(-1.8,  1.4, 0),
  ]);
  const stringMat = new THREE.LineBasicMaterial({
    color: 0x2C4A3E,
    transparent: true,
    opacity: 0.12,
  });
  const stringLine = new THREE.Line(stringGeo, stringMat);
  stringLine.position.set(3.5, 0, -1);
  scene.add(stringLine);

  // Target rings decoration (far background)
  function makeRingMesh(radius, opacity) {
    const geo = new THREE.RingGeometry(radius - 0.015, radius, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x2C4A3E,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  const rings = [1.2, 0.85, 0.52, 0.25].map((r, i) => {
    const ring = makeRingMesh(r, 0.06 + i * 0.02);
    ring.position.set(-3.2, 0.4, -1.5);
    scene.add(ring);
    return ring;
  });

  // ── Mouse parallax ────────────────────────
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / W - 0.5) * 0.8;
    targetY = -(e.clientY / H - 0.5) * 0.5;
  });

  // ── Flying arrow particles ────────────────
  const arrows = [];
  const ARROW_COUNT = 6;

  function createArrow() {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.4, 0, 0),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xC9A84C,
      transparent: true,
      opacity: 0,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    resetArrow(line);
    scene.add(line);
    return line;
  }

  function resetArrow(arrow) {
    const startX = -8;
    const startY = (Math.random() - 0.5) * 4;
    arrow.position.set(startX, startY, (Math.random() - 0.5) * 0.5);
    const angle = (Math.random() - 0.5) * 0.3;
    arrow.userData.vx = Math.random() * 0.06 + 0.04;
    arrow.userData.vy = Math.sin(angle) * 0.02;
    arrow.userData.delay = Math.random() * 6;
    arrow.userData.active = false;
    arrow.material.opacity = 0;
  }

  for (let i = 0; i < ARROW_COUNT; i++) {
    const a = createArrow();
    a.userData.delay = Math.random() * 8;
    arrows.push(a);
  }

  // ── Animation loop ────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const delta = clock.getDelta ? 0.016 : 0.016;

    // Animate green particles
    animateParticles(greenParticles, t, 0.6);
    animateParticles(goldParticles, t, 0.4);

    // Rotate target rings subtly
    rings.forEach((ring, i) => {
      ring.rotation.z = t * (0.05 + i * 0.02) * (i % 2 === 0 ? 1 : -1);
    });

    // Rotate bow slightly
    bowMesh.rotation.z = Math.sin(t * 0.2) * 0.03;
    stringLine.rotation.z = bowMesh.rotation.z;

    // Animate arrows
    arrows.forEach((arrow) => {
      arrow.userData.delay -= 0.016;
      if (arrow.userData.delay > 0) return;

      arrow.userData.active = true;
      arrow.position.x += arrow.userData.vx;
      arrow.position.y += arrow.userData.vy;

      // Fade in/out
      if (arrow.position.x < -5) {
        arrow.material.opacity = Math.min(arrow.material.opacity + 0.05, 0.6);
      } else if (arrow.position.x > 4) {
        arrow.material.opacity = Math.max(arrow.material.opacity - 0.04, 0);
      }

      if (arrow.position.x > 9) {
        resetArrow(arrow);
        arrow.userData.delay = Math.random() * 5 + 2;
      }
    });

    // Camera parallax
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;
    camera.position.x = currentX;
    camera.position.y = currentY;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function animateParticles(points, t, speed) {
    const pos = points.geometry.attributes.position.array;
    const vel = points.userData.vel;
    const spread = points.userData.spread;

    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3]     += vel[i * 2];
      pos[i * 3 + 1] += vel[i * 2 + 1];
      pos[i * 3 + 1] += Math.sin(t * speed + i * 1.3) * 0.0008;
      pos[i * 3]     += Math.cos(t * speed * 0.7 + i * 0.9) * 0.0005;

      // Wrap vertically
      if (pos[i * 3 + 1] > spread.y / 2) {
        pos[i * 3 + 1] = -spread.y / 2;
        pos[i * 3]     = (Math.random() - 0.5) * spread.x;
      }
      // Wrap horizontally
      if (pos[i * 3] > spread.x / 2)  pos[i * 3] = -spread.x / 2;
      if (pos[i * 3] < -spread.x / 2) pos[i * 3] = spread.x / 2;
    }
    points.geometry.attributes.position.needsUpdate = true;
  }

  animate();

  // ── Resize ────────────────────────────────
  const resizeObserver = new ResizeObserver(() => {
    W = section.offsetWidth;
    H = section.offsetHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
  resizeObserver.observe(section);
})();
