/* ═══════════════════════════════════════════════
   LOGIN.JS — Straw Hat Agent
   Storm engine: clouds, rain, waves, lightning
═══════════════════════════════════════════════ */

const canvas = document.getElementById('storm-canvas');
const ctx    = canvas.getContext('2d');
let W, H;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  initClouds();
}
window.addEventListener('resize', resize);

/* ════════════════════════════════════════
   CLOUDS
════════════════════════════════════════ */
let clouds = [];

function initClouds() {
  clouds = [];
  // Big dramatic storm cloud layers
  for (let i = 0; i < 14; i++) {
    clouds.push({
      x:     Math.random() * W * 1.4 - W * 0.2,
      y:     Math.random() * H * 0.45 - 20,
      r:     Math.random() * 140 + 80,
      speed: Math.random() * 0.18 + 0.06,
      alpha: Math.random() * 0.55 + 0.3,
      dark:  Math.random() > 0.4,   // dark storm cloud or lighter
    });
  }
}

function drawClouds() {
  clouds.forEach(c => {
    // Each cloud = cluster of overlapping circles
    const baseColor = c.dark
      ? `rgba(8,12,28,${c.alpha})`
      : `rgba(18,24,52,${c.alpha * 0.7})`;
    const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    grad.addColorStop(0,   c.dark ? `rgba(12,16,36,${c.alpha})` : `rgba(24,32,70,${c.alpha * 0.5})`);
    grad.addColorStop(0.5, c.dark ? `rgba(8,12,26,${c.alpha * 0.8})` : `rgba(16,24,52,${c.alpha * 0.3})`);
    grad.addColorStop(1,   'rgba(4,6,14,0)');

    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.r * 1.6, c.r * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Puff bumps on top
    for (let j = 0; j < 4; j++) {
      const bx = c.x + (j - 1.5) * c.r * 0.55;
      const by = c.y - c.r * 0.3;
      const br = c.r * (0.35 + Math.random() * 0.2);
      const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      bg.addColorStop(0,   c.dark ? `rgba(10,14,32,${c.alpha * 0.9})` : `rgba(20,28,60,${c.alpha * 0.4})`);
      bg.addColorStop(1,   'rgba(4,6,14,0)');
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
    }

    // Drift
    c.x += c.speed;
    if (c.x - c.r * 1.6 > W + 100) c.x = -c.r * 1.6 - 50;
  });
}

/* ════════════════════════════════════════
   RAIN  — dense, angled, visible
════════════════════════════════════════ */
const RAIN_COUNT = 420;
const drops = [];

function initRain() {
  for (let i = 0; i < RAIN_COUNT; i++) {
    drops.push(newDrop(true));
  }
}

function newDrop(scatter) {
  return {
    x:     scatter ? Math.random() * (W + 200) - 100 : Math.random() * W,
    y:     scatter ? Math.random() * H             : -10,
    len:   Math.random() * 28 + 14,
    speed: Math.random() * 9  + 14,
    alpha: Math.random() * 0.45 + 0.25,
    width: Math.random() * 0.8 + 0.4,
  };
}

function drawRain() {
  ctx.save();
  // Angle: ~75° from vertical (strong wind from left)
  const angleRad = (75 * Math.PI) / 180;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  drops.forEach(d => {
    const x2 = d.x - d.len * dx;
    const y2 = d.y - d.len * dy;

    // Main streak
    const grad = ctx.createLinearGradient(x2, y2, d.x, d.y);
    grad.addColorStop(0, `rgba(160,200,255,0)`);
    grad.addColorStop(1, `rgba(180,215,255,${d.alpha})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = d.width;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();

    // Small splash dot at tip
    if (d.y > H * 0.75) {
      ctx.fillStyle = `rgba(160,200,255,${d.alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.width + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Advance
    d.x += d.speed * dx;
    d.y += d.speed * dy;
    if (d.y > H + 30 || d.x > W + 80) {
      Object.assign(d, newDrop(false));
      d.x = Math.random() * W - 100;
      d.y = -20;
    }
  });
  ctx.restore();
}

/* ════════════════════════════════════════
   WAVES — layered, animated, with foam
════════════════════════════════════════ */
let waveTime = 0;

function drawWaves() {
  const baseY = H * 0.72;
  waveTime += 0.012;

  // Layer 4 — deepest, darkest
  drawWaveLayer(baseY + 8,  0.018, 0.6,  26, 9,  '#030a14', 0.95, waveTime * 0.6);
  // Layer 3
  drawWaveLayer(baseY + 2,  0.022, 0.65, 22, 11, '#04101e', 1.0,  waveTime * 0.75);
  // Layer 2 — mid
  drawWaveLayer(baseY - 8,  0.027, 0.7,  18, 13, '#061828', 1.0,  waveTime);
  // Layer 1 — front, lightest
  drawWaveLayer(baseY - 18, 0.032, 0.75, 15, 15, '#0a2038', 1.0,  waveTime * 1.2);
  // Foam on frontmost wave
  drawFoam(baseY - 18, 0.032, 0.75, 15, waveTime * 1.2);
  // Ocean fill below front wave
  ctx.fillStyle = '#030a14';
  ctx.fillRect(0, baseY + 30, W, H - baseY - 30);
}

function drawWaveLayer(baseY, freq, amp, roughness, speed, color, alpha, t) {
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) {
    const y = baseY
      + Math.sin(x * freq + t * speed)        * amp * H * 0.018
      + Math.sin(x * freq * 2.3 + t * speed * 1.4) * amp * H * 0.008
      + Math.sin(x * roughness * 0.5 + t * 2)     * amp * H * 0.004;
    if (x === 0) ctx.moveTo(x, y);
    else         ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawFoam(baseY, freq, amp, speed, t) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  // Draw white foam crests along the wave top
  for (let x = 0; x < W; x += 6) {
    const y = baseY
      + Math.sin(x * freq + t * speed) * amp * H * 0.018
      + Math.sin(x * freq * 2.3 + t * speed * 1.4) * amp * H * 0.008;
    const crestBoost = Math.sin(x * freq + t * speed);
    if (crestBoost > 0.5) {
      const foamAlpha = (crestBoost - 0.5) * 0.5;
      ctx.fillStyle = `rgba(200,230,255,${foamAlpha})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 3 + crestBoost * 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ════════════════════════════════════════
   SHIP — Moby Dick, Whitebeard's Galleon
════════════════════════════════════════ */
let shipPhase = 0;

function drawShip() {
  shipPhase += 0.007;

  // Ship sits at waterline
  const waterY = H * 0.74;
  const cx     = W * 0.52;          // slightly right of center
  const scale  = Math.min(W / 1400, H / 820, 1);
  const bob    = Math.sin(shipPhase) * 5 + Math.sin(shipPhase * 1.6) * 2.5;
  const tilt   = Math.sin(shipPhase * 0.75) * 1.4;

  ctx.save();
  ctx.translate(cx, waterY + bob);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.scale(scale, scale);

  // All coordinates in a canonical 1400-wide space
  // Ship: roughly -500 to +500 wide, hull bottom ~+180
  const S = 1; // local scale already applied

  /* ─────────────────────────────────────────
     HULL SHAPE
     Wide, deep-bellied galleon with high stern
  ───────────────────────────────────────── */

  // --- Hull fill with wood gradient ---
  const hullGrad = ctx.createLinearGradient(-480, -80, 480, 180);
  hullGrad.addColorStop(0,   '#1a0e06');
  hullGrad.addColorStop(0.3, '#120a04');
  hullGrad.addColorStop(0.7, '#0e0804');
  hullGrad.addColorStop(1,   '#080502');

  ctx.beginPath();
  // Stern (left / rear) — high castle
  ctx.moveTo(-480, -110);
  ctx.lineTo(-460, -150);
  ctx.lineTo(-420, -160);
  ctx.lineTo(-380, -148);
  // Main deck line going toward bow
  ctx.lineTo(-300, -95);
  ctx.lineTo( 180, -95);
  // Bow rise (right side)
  ctx.lineTo( 360, -105);
  ctx.lineTo( 440, -120);
  ctx.lineTo( 480, -95);
  // Bow curved underside
  ctx.quadraticCurveTo( 520,  20,  440, 120);
  ctx.quadraticCurveTo( 400, 175,  320, 190);
  // Keel bottom
  ctx.lineTo(-320, 190);
  // Stern underside
  ctx.quadraticCurveTo(-420, 180, -500,  90);
  ctx.quadraticCurveTo(-520,  10, -480, -110);
  ctx.closePath();
  ctx.fillStyle = hullGrad;
  ctx.fill();

  // Hull outline
  ctx.strokeStyle = '#2a1508';
  ctx.lineWidth = 3;
  ctx.stroke();

  // --- Wood plank lines on hull ---
  ctx.save();
  ctx.clip(); // clip planks inside hull shape
  ctx.strokeStyle = 'rgba(40,20,8,0.55)';
  ctx.lineWidth = 1.5;
  const plankYs = [-60, -20, 20, 60, 100, 140];
  plankYs.forEach(py => {
    ctx.beginPath();
    ctx.moveTo(-510, py);
    ctx.bezierCurveTo(-300, py + 8, 200, py - 6, 510, py);
    ctx.stroke();
  });
  ctx.restore();

  // --- Red stripe along hull waterline (classic pirate galleon) ---
  ctx.beginPath();
  ctx.moveTo(-505,  55);
  ctx.bezierCurveTo(-300, 62, 200, 48, 510, 55);
  ctx.strokeStyle = '#8b1010';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-505,  63);
  ctx.bezierCurveTo(-300, 70, 200, 56, 510, 63);
  ctx.strokeStyle = '#6a0c0c';
  ctx.lineWidth = 3;
  ctx.stroke();

  // --- Gold trim stripe near deck ---
  ctx.beginPath();
  ctx.moveTo(-482, -95);
  ctx.lineTo( 482, -95);
  ctx.strokeStyle = '#7a5808';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-482, -89);
  ctx.lineTo( 482, -89);
  ctx.strokeStyle = '#c89010';
  ctx.lineWidth = 2;
  ctx.stroke();

  /* ─────────────────────────────────────────
     CANNON PORTS  (two rows)
  ───────────────────────────────────────── */
  const cannonXs = [-380, -260, -140, -20, 100, 220, 340];
  // Upper row
  cannonXs.forEach(px => {
    // Square port opening
    ctx.fillStyle = '#06030a';
    ctx.strokeStyle = '#3a1a06';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(px - 13, -68, 26, 20);
    ctx.fill();
    ctx.stroke();
    // Gold rim
    ctx.strokeStyle = '#7a5808';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Cannon barrel tip
    ctx.fillStyle = '#1a0e06';
    ctx.beginPath();
    ctx.rect(px - 5, -66, 10, 16);
    ctx.fill();
  });
  // Lower row
  const cannonXs2 = [-340, -220, -100, 20, 140, 260, 380];
  cannonXs2.forEach(px => {
    ctx.fillStyle = '#06030a';
    ctx.strokeStyle = '#3a1a06';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(px - 11, -28, 22, 18);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#7a5808';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  /* ─────────────────────────────────────────
     STERN CASTLE  (elaborate rear structure)
  ───────────────────────────────────────── */

  // Main stern tower body
  const sternGrad = ctx.createLinearGradient(-510, -200, -350, -80);
  sternGrad.addColorStop(0, '#1c0f07');
  sternGrad.addColorStop(1, '#100805');
  ctx.beginPath();
  ctx.moveTo(-480, -110);
  ctx.lineTo(-460, -150);
  ctx.lineTo(-420, -160);
  ctx.lineTo(-380, -148);
  ctx.lineTo(-360, -110);
  ctx.lineTo(-360,  -95);
  ctx.lineTo(-480,  -95);
  ctx.closePath();
  ctx.fillStyle = sternGrad;
  ctx.fill();
  ctx.strokeStyle = '#2a1508';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Stern windows (3 arched)
  [[-450, -130], [-420, -135], [-390, -130]].forEach(([wx, wy]) => {
    // Arch window
    ctx.beginPath();
    ctx.arc(wx, wy + 10, 12, Math.PI, 0);
    ctx.lineTo(wx + 12, wy + 22);
    ctx.lineTo(wx - 12, wy + 22);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,120,10,0.22)';
    ctx.fill();
    ctx.strokeStyle = '#7a5808';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Cross divider
    ctx.beginPath();
    ctx.moveTo(wx, wy - 2); ctx.lineTo(wx, wy + 22);
    ctx.moveTo(wx - 12, wy + 10); ctx.lineTo(wx + 12, wy + 10);
    ctx.strokeStyle = '#6a4806';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Inner glow
    const wg = ctx.createRadialGradient(wx, wy + 12, 0, wx, wy + 12, 12);
    wg.addColorStop(0, 'rgba(220,140,20,0.3)');
    wg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(wx, wy + 12, 12, 0, Math.PI * 2);
    ctx.fillStyle = wg;
    ctx.fill();
  });

  // Stern decorative carving (horizontal bands)
  ctx.strokeStyle = '#6a4806';
  ctx.lineWidth = 1.5;
  [-148, -130, -112].forEach(bandY => {
    ctx.beginPath();
    ctx.moveTo(-480, bandY); ctx.lineTo(-360, bandY);
    ctx.stroke();
  });

  // Stern top railing with finials
  ctx.strokeStyle = '#8a6008';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-480, -155); ctx.lineTo(-360, -155);
  ctx.stroke();
  for (let fx = -475; fx <= -365; fx += 18) {
    ctx.beginPath();
    ctx.moveTo(fx, -155); ctx.lineTo(fx, -168);
    ctx.strokeStyle = '#8a6008';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(fx, -170, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#c89010';
    ctx.fill();
  }

  /* ─────────────────────────────────────────
     BOW FIGUREHEAD  — Whitebeard's crescent
  ───────────────────────────────────────── */

  // Bowsprit (diagonal spar jutting forward)
  ctx.strokeStyle = '#2a1208';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(440, -115);
  ctx.lineTo(640, -260);
  ctx.stroke();
  ctx.strokeStyle = '#3a1a08';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Bowsprit bracing lines
  ctx.strokeStyle = 'rgba(30,15,5,0.8)';
  ctx.lineWidth = 1.5;
  [[490,-135,540,-220],[520,-150,580,-235]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });

  // Figurehead — stylized crescent / mustache shape (Whitebeard reference)
  ctx.save();
  ctx.translate(480, -108);
  // Main scroll
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(30, -35, 60, -20, 50, 10);
  ctx.bezierCurveTo(42, 35, 10, 25, 0, 0);
  ctx.fillStyle = '#7a5010';
  ctx.fill();
  ctx.strokeStyle = '#c89010';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Crescent accent
  ctx.beginPath();
  ctx.arc(25, -10, 18, 0.5, 2.5);
  ctx.strokeStyle = '#e8b020';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  /* ─────────────────────────────────────────
     MAIN DECK
  ───────────────────────────────────────── */

  const deckGrad = ctx.createLinearGradient(0, -95, 0, -60);
  deckGrad.addColorStop(0, '#1e1006');
  deckGrad.addColorStop(1, '#160c05');
  ctx.beginPath();
  ctx.moveTo(-480, -95);
  ctx.lineTo( 480, -95);
  ctx.lineTo( 440, -60);
  ctx.lineTo(-440, -60);
  ctx.closePath();
  ctx.fillStyle = deckGrad;
  ctx.fill();

  // Deck planks
  ctx.strokeStyle = 'rgba(50,28,8,0.5)';
  ctx.lineWidth = 1;
  for (let dk = -460; dk < 460; dk += 22) {
    ctx.beginPath();
    ctx.moveTo(dk, -95); ctx.lineTo(dk, -60);
    ctx.stroke();
  }

  // Deck railing (balustrade)
  ctx.strokeStyle = '#3a1e08';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-480, -98); ctx.lineTo(480, -98);
  ctx.stroke();
  ctx.strokeStyle = '#6a3e10';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-480, -107); ctx.lineTo(480, -107);
  ctx.stroke();

  // Railing spindles
  ctx.strokeStyle = '#4a2810';
  ctx.lineWidth = 2;
  for (let rx = -470; rx < 480; rx += 20) {
    ctx.beginPath();
    ctx.moveTo(rx, -98); ctx.lineTo(rx, -118);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-480, -118); ctx.lineTo(480, -118);
  ctx.strokeStyle = '#5a3010';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Deck structures: captain's cabin hatch, barrels, etc.
  // Barrels cluster (left/stern area)
  [[-420, -75], [-390, -78], [-405, -68]].forEach(([bx, by]) => {
    ctx.beginPath();
    ctx.ellipse(bx, by, 12, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2a1508';
    ctx.fill();
    ctx.strokeStyle = '#5a3010';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - 12, by); ctx.lineTo(bx + 12, by);
    ctx.strokeStyle = '#7a4a18';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Helm wheel (center-right of deck)
  ctx.save();
  ctx.translate(200, -82);
  // Wheel rim
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.strokeStyle = '#6a4010';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = '#c89010';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Spokes
  for (let sp = 0; sp < 8; sp++) {
    const ang = sp * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ang) * 18, Math.sin(ang) * 18);
    ctx.strokeStyle = '#8a5a18';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // Hub
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#c89010';
  ctx.fill();
  ctx.restore();

  /* ─────────────────────────────────────────
     MASTS  (3 full masts + bowsprit)
  ───────────────────────────────────────── */

  // Mast positions (x from ship center)
  const MAST = [
    { x: -380, base: -118, top: -620, w: 10 }, // Mizzen (rear)
    { x:  -60, base: -118, top: -760, w: 13 }, // Main   (center)
    { x:  260, base: -118, top: -600, w: 10 }, // Fore   (front)
  ];

  // Draw masts with wood texture (two-tone cylinder illusion)
  MAST.forEach(m => {
    const mastH = m.base - m.top;
    // Shadow side
    ctx.beginPath();
    ctx.moveTo(m.x - m.w * 0.5, m.base);
    ctx.lineTo(m.x - m.w * 0.3, m.top);
    ctx.lineTo(m.x + m.w * 0.3, m.top);
    ctx.lineTo(m.x + m.w, m.base);
    ctx.closePath();
    ctx.fillStyle = '#0e0804';
    ctx.fill();
    // Light side
    ctx.beginPath();
    ctx.moveTo(m.x - m.w * 0.5, m.base);
    ctx.lineTo(m.x - m.w * 0.3, m.top);
    ctx.lineTo(m.x,              m.top);
    ctx.lineTo(m.x + m.w * 0.1, m.base);
    ctx.closePath();
    ctx.fillStyle = '#2a1808';
    ctx.fill();
    // Mast rings (hoops)
    ctx.strokeStyle = '#5a3a10';
    ctx.lineWidth = 2;
    for (let rp = 0.15; rp < 0.95; rp += 0.2) {
      const ry = m.top + (m.base - m.top) * rp;
      const rw = m.w * (0.5 + rp * 0.5);
      ctx.beginPath();
      ctx.moveTo(m.x - rw, ry);
      ctx.lineTo(m.x + rw, ry);
      ctx.stroke();
    }
  });

  /* ─────────────────────────────────────────
     SPARS (cross beams) with detailed ends
  ───────────────────────────────────────── */

  const SPARS = [
    // [mastIdx, yOffset from mastTop, halfWidth]
    // Mizzen mast
    [0,  80, 160], [0, 220, 130], [0, 340, 100],
    // Main mast
    [1,  80, 240], [1, 210, 200], [1, 360, 160], [1, 500, 120],
    // Fore mast
    [2,  80, 180], [2, 220, 145], [2, 350, 110],
  ];

  SPARS.forEach(([mi, yOff, hw2]) => {
    const m = MAST[mi];
    const sy = m.top + yOff;
    const sx = m.x;
    // Spar beam
    ctx.beginPath();
    ctx.moveTo(sx - hw2, sy);
    ctx.lineTo(sx + hw2, sy);
    ctx.strokeStyle = '#1e1006';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = '#2e1a08';
    ctx.lineWidth = 4;
    ctx.stroke();
    // End knobs
    [-hw2, hw2].forEach(ex => {
      ctx.beginPath();
      ctx.arc(sx + ex, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#4a2808';
      ctx.fill();
    });
  });

  /* ─────────────────────────────────────────
     SAILS  — large, dark, wind-blown
  ───────────────────────────────────────── */

  function drawGalleonSail(mx, topY, botY, halfW, windStr, torn) {
    const midY = (topY + botY) / 2;
    const bulge = windStr * halfW * 0.35; // wind pushes sail right

    // Sail body (billowed toward wind direction)
    ctx.beginPath();
    ctx.moveTo(mx - halfW, topY);
    ctx.quadraticCurveTo(mx + bulge * 0.3, midY - (botY - topY) * 0.1, mx - halfW * 0.9, botY);
    ctx.lineTo(mx + halfW * 0.9, botY);
    ctx.quadraticCurveTo(mx + halfW + bulge, midY, mx + halfW, topY);
    ctx.closePath();

    // Dark sail with subtle color variation
    const sailGrad = ctx.createLinearGradient(mx - halfW, topY, mx + halfW, botY);
    sailGrad.addColorStop(0,   'rgba(12,8,20, 0.88)');
    sailGrad.addColorStop(0.4, 'rgba(16,10,28, 0.82)');
    sailGrad.addColorStop(1,   'rgba(8,5,14,  0.90)');
    ctx.fillStyle = sailGrad;
    ctx.fill();

    // Sail edge rope
    ctx.strokeStyle = 'rgba(50,30,10,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Horizontal seam lines (panels)
    ctx.strokeStyle = 'rgba(30,18,8,0.6)';
    ctx.lineWidth = 1;
    const panels = 4;
    for (let p = 1; p < panels; p++) {
      const py = topY + (botY - topY) * (p / panels);
      const leftX  = mx - halfW * (0.9 + 0.05 * (p / panels));
      const rightX = mx + halfW * (0.9 + 0.05 * (p / panels));
      ctx.beginPath();
      ctx.moveTo(leftX, py);
      ctx.quadraticCurveTo(mx + bulge * 0.5, py, rightX, py);
      ctx.stroke();
    }

    // Torn/ragged bottom edge (storm-beaten)
    if (torn) {
      ctx.strokeStyle = 'rgba(20,12,6,0.7)';
      ctx.lineWidth = 1.5;
      for (let tx = mx - halfW * 0.85; tx < mx + halfW * 0.85; tx += 30) {
        const tearLen = 8 + Math.sin(tx * 0.3 + shipPhase * 2) * 6;
        ctx.beginPath();
        ctx.moveTo(tx, botY - 2);
        ctx.lineTo(tx + 8, botY + tearLen);
        ctx.stroke();
      }
    }

    // Vertical rope lines
    ctx.strokeStyle = 'rgba(40,24,8,0.5)';
    ctx.lineWidth = 0.8;
    const vRopes = 3;
    for (let v = 1; v < vRopes; v++) {
      const vx = mx - halfW + (halfW * 2) * (v / vRopes);
      ctx.beginPath();
      ctx.moveTo(vx, topY + 4); ctx.lineTo(vx + bulge * 0.3, botY - 4);
      ctx.stroke();
    }
  }

  const windStr = Math.sin(shipPhase * 0.4) * 0.2 + 0.6; // breathing wind

  // Mizzen sails
  drawGalleonSail(MAST[0].x, MAST[0].top + 82,  MAST[0].top + 215, 155, windStr, false);
  drawGalleonSail(MAST[0].x, MAST[0].top + 225, MAST[0].top + 338, 125, windStr, true);
  drawGalleonSail(MAST[0].x, MAST[0].top + 348, MAST[0].top + 440, 95,  windStr * 0.8, true);

  // Main sails (largest)
  drawGalleonSail(MAST[1].x, MAST[1].top + 82,  MAST[1].top + 204, 235, windStr, false);
  drawGalleonSail(MAST[1].x, MAST[1].top + 215, MAST[1].top + 355, 195, windStr, false);
  drawGalleonSail(MAST[1].x, MAST[1].top + 365, MAST[1].top + 496, 155, windStr, true);
  drawGalleonSail(MAST[1].x, MAST[1].top + 506, MAST[1].top + 590, 115, windStr * 0.7, true);

  // Fore sails
  drawGalleonSail(MAST[2].x, MAST[2].top + 82,  MAST[2].top + 215, 175, windStr, false);
  drawGalleonSail(MAST[2].x, MAST[2].top + 225, MAST[2].top + 345, 140, windStr, true);
  drawGalleonSail(MAST[2].x, MAST[2].top + 355, MAST[2].top + 448, 105, windStr * 0.7, true);

  // Bowsprit sail (triangular staysail)
  ctx.beginPath();
  ctx.moveTo(440, -118);
  ctx.lineTo(635, -258);
  ctx.lineTo(440, -60);
  ctx.closePath();
  const bsGrad = ctx.createLinearGradient(440, -180, 630, -250);
  bsGrad.addColorStop(0, 'rgba(14,9,22,0.75)');
  bsGrad.addColorStop(1, 'rgba(8,5,14,0.6)');
  ctx.fillStyle = bsGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,24,8,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  /* ─────────────────────────────────────────
     RIGGING WEB — dense network of ropes
  ───────────────────────────────────────── */

  ctx.strokeStyle = 'rgba(20,12,4,0.75)';
  ctx.lineWidth = 1.2;

  const rigLines = [
    // Stays (mast to deck, fore-aft)
    [MAST[1].x, MAST[1].top,      480, -118],   // main to bow
    [MAST[1].x, MAST[1].top,     -480, -118],   // main to stern
    [MAST[0].x, MAST[0].top,     -480, -118],   // mizzen to stern
    [MAST[2].x, MAST[2].top,      480, -118],   // fore to bow
    [MAST[2].x, MAST[2].top,      640, -258],   // fore to bowsprit tip
    // Shrouds (mast to hull sides — angled out)
    [MAST[1].x, MAST[1].top + 80,  -480, -118],
    [MAST[1].x, MAST[1].top + 80,   480, -118],
    [MAST[1].x, MAST[1].top + 200, -480, -118],
    [MAST[1].x, MAST[1].top + 200,  480, -118],
    // Cross connections between masts
    [MAST[0].x, MAST[0].top + 80, MAST[1].x, MAST[1].top + 80],
    [MAST[1].x, MAST[1].top + 80, MAST[2].x, MAST[2].top + 80],
    [MAST[0].x, MAST[0].top + 220, MAST[1].x, MAST[1].top + 210],
    [MAST[1].x, MAST[1].top + 210, MAST[2].x, MAST[2].top + 220],
    // Backstays
    [MAST[0].x, MAST[0].top,  MAST[1].x, MAST[1].top + 100],
    [MAST[2].x, MAST[2].top,  MAST[1].x, MAST[1].top + 100],
  ];

  rigLines.forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  });

  // Ratlines (horizontal rungs on shrouds — like a rope ladder)
  ctx.strokeStyle = 'rgba(18,10,4,0.6)';
  ctx.lineWidth = 0.8;
  for (let rl = 0; rl < 10; rl++) {
    const ry = MAST[1].top + 80 + rl * 18;
    const lx = MAST[1].x + ((-480 - MAST[1].x) * rl / 10);
    const rx = MAST[1].x + ((480  - MAST[1].x) * rl / 10);
    ctx.beginPath();
    ctx.moveTo(lx - 20, ry); ctx.lineTo(rx + 20, ry);
    ctx.stroke();
  }

  /* ─────────────────────────────────────────
     FLAGS  — Whitebeard's Jolly Roger
     Cross-bones + skull, large
  ───────────────────────────────────────── */

  function drawWhitebeardFlag(fx, fy, size) {
    const fw = size * 1.8, fh = size * 1.1;
    const wave1 = Math.sin(shipPhase * 2.5) * size * 0.18;
    const wave2 = Math.sin(shipPhase * 2.5 + 1.2) * size * 0.12;

    ctx.save();
    ctx.translate(fx, fy);

    // Flag cloth — 4-point bezier wave
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(fw * 0.3, wave1,      fw * 0.7, -wave2,     fw, wave1 * 0.5);
    ctx.bezierCurveTo(fw * 0.7, fh + wave2, fw * 0.3, fh - wave1, 0,  fh);
    ctx.closePath();
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Skull (white, simplified but recognizable)
    const skx = fw * 0.5, sky = fh * 0.4;
    const sr = size * 0.28;
    // Skull cranium
    ctx.beginPath();
    ctx.arc(skx, sky, sr, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.quadraticCurveTo(skx, sky + sr * 1.3, skx - sr * 0.55, sky + sr * 0.5);
    ctx.arc(skx, sky, sr, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.quadraticCurveTo(skx, sky + sr * 1.3, skx + sr * 0.55, sky + sr * 0.5);
    ctx.fillStyle = 'rgba(220,220,220,0.9)';
    ctx.fill();
    // Eye sockets
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(skx - sr * 0.32, sky - sr * 0.05, sr * 0.2, sr * 0.22, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(skx + sr * 0.32, sky - sr * 0.05, sr * 0.2, sr * 0.22,  0.2, 0, Math.PI * 2);
    ctx.fill();
    // Nose hole
    ctx.beginPath();
    ctx.ellipse(skx, sky + sr * 0.2, sr * 0.08, sr * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    // Teeth row
    ctx.fillStyle = '#0a0a0a';
    for (let t = -2; t <= 2; t++) {
      ctx.fillRect(skx + t * sr * 0.2 - sr * 0.06, sky + sr * 0.5, sr * 0.11, sr * 0.2);
    }

    // Crossbones
    ctx.strokeStyle = 'rgba(210,210,210,0.85)';
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = 'round';
    // Bone 1 (/ diagonal)
    ctx.beginPath();
    ctx.moveTo(skx - sr * 0.9, sky + sr * 1.4);
    ctx.lineTo(skx + sr * 0.9, sky + sr * 2.4);
    ctx.stroke();
    // Bone 2 (\ diagonal)
    ctx.beginPath();
    ctx.moveTo(skx + sr * 0.9, sky + sr * 1.4);
    ctx.lineTo(skx - sr * 0.9, sky + sr * 2.4);
    ctx.stroke();
    // Bone end balls
    ctx.lineCap = 'butt';
    const boneEnds = [
      [skx - sr * 0.9, sky + sr * 1.4],
      [skx + sr * 0.9, sky + sr * 2.4],
      [skx + sr * 0.9, sky + sr * 1.4],
      [skx - sr * 0.9, sky + sr * 2.4],
    ];
    boneEnds.forEach(([bex, bey]) => {
      ctx.beginPath();
      ctx.arc(bex, bey, size * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,210,210,0.85)';
      ctx.fill();
    });

    ctx.restore();
  }

  // Main flag on tallest mast (main mast top)
  drawWhitebeardFlag(MAST[1].x + 4, MAST[1].top - 4, 28);
  // Smaller flags on other masts
  drawWhitebeardFlag(MAST[0].x + 3, MAST[0].top - 3, 18);
  drawWhitebeardFlag(MAST[2].x + 3, MAST[2].top - 3, 16);

  /* ─────────────────────────────────────────
     LANTERNS  — warm amber glow points
  ───────────────────────────────────────── */

  function drawLantern(lx, ly) {
    const flicker = 0.7 + Math.sin(shipPhase * 7 + lx) * 0.15 + Math.sin(shipPhase * 11 + ly) * 0.1;
    // Outer glow
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 40);
    lg.addColorStop(0,   `rgba(220,140,20,${0.35 * flicker})`);
    lg.addColorStop(0.4, `rgba(180,100,10,${0.15 * flicker})`);
    lg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(lx, ly, 40, 0, Math.PI * 2);
    ctx.fillStyle = lg;
    ctx.fill();
    // Lantern body
    ctx.beginPath();
    ctx.rect(lx - 5, ly - 8, 10, 14);
    ctx.fillStyle = `rgba(200,130,15,${0.5 * flicker})`;
    ctx.fill();
    ctx.strokeStyle = '#7a5010';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Top hook
    ctx.beginPath();
    ctx.moveTo(lx, ly - 8); ctx.lineTo(lx, ly - 16);
    ctx.strokeStyle = '#5a3a08';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Lanterns at masthead crow's nests and stern
  drawLantern(MAST[1].x, MAST[1].top + 60);
  drawLantern(MAST[0].x, MAST[0].top + 50);
  drawLantern(MAST[2].x, MAST[2].top + 50);
  drawLantern(-455, -148);   // stern lantern
  drawLantern(-420, -152);   // stern lantern 2
  drawLantern( 460, -110);   // bow lantern

  /* ─────────────────────────────────────────
     PORTHOLES  — two rows, glowing amber
  ───────────────────────────────────────── */

  const row1 = [-350, -230, -110, 10, 130, 250, 370];
  const row2 = [-310, -190,  -70, 50, 170, 290];

  function drawPorthole(px, py) {
    const fl = 0.6 + Math.sin(shipPhase * 5 + px * 0.01) * 0.2;
    const pg = ctx.createRadialGradient(px, py, 0, px, py, 18);
    pg.addColorStop(0,   `rgba(220,140,20,${0.4 * fl})`);
    pg.addColorStop(0.5, `rgba(180,100,10,${0.15 * fl})`);
    pg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(px, py, 18, 0, Math.PI * 2);
    ctx.fillStyle = pg;
    ctx.fill();
    // Port ring (outer)
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(190,120,15,${0.3 * fl})`;
    ctx.fill();
    ctx.strokeStyle = '#4a2e08';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Port ring (inner detail)
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#3a2006';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  row1.forEach(px => drawPorthole(px, -42));
  row2.forEach(px => drawPorthole(px,  -2));

  /* ─────────────────────────────────────────
     WATER SPRAY  — hull wake
  ───────────────────────────────────────── */

  // Bow wake spray
  const sprayParticles = 24;
  for (let i = 0; i < sprayParticles; i++) {
    const t2 = shipPhase * 3 + i * 0.45;
    const side = i < sprayParticles / 2 ? -1 : 1;
    const baseX = side > 0 ? 440 : -480;
    const angle = side > 0
      ? (-0.3 + Math.sin(t2) * 0.5)
      : (Math.PI + 0.3 - Math.sin(t2) * 0.5);
    const dist  = (Math.sin(t2 * 1.3) * 0.5 + 0.5) * 50 + 10;
    const spx   = baseX + Math.cos(angle) * dist;
    const spy   = 100  + Math.sin(angle) * dist * 0.4;
    const alpha = Math.max(0, Math.sin(t2) * 0.22);
    ctx.beginPath();
    ctx.arc(spx, spy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,220,255,${alpha})`;
    ctx.fill();
  }

  ctx.restore(); // end ship transform
}

// Stub kept for compatibility (spray is now inside drawShip)
function drawHullSpray() {}

/* ════════════════════════════════════════
   LIGHTNING — branching bolts on canvas
════════════════════════════════════════ */
let lightningBolts   = [];
let nextLightningTime = 0;
let now = 0;

function scheduleLightning() {
  nextLightningTime = now + 5000 + Math.random() * 12000;
}

function spawnLightning() {
  // Random start X in upper sky, random end offset
  const startX = Math.random() * W;
  const startY = Math.random() * H * 0.15;
  const endX   = startX + (Math.random() - 0.5) * 200;
  const endY   = H * (0.4 + Math.random() * 0.2);
  lightningBolts.push({
    segments: buildBolt(startX, startY, endX, endY, 0),
    born:     now,
    life:     120 + Math.random() * 100, // ms
    // secondary flash
    flash:    true,
    flashDone: false,
  });
  // Flash overlay
  const flashEl = document.getElementById('lightning-flash');
  if (flashEl) {
    flashEl.style.opacity = '0.18';
    setTimeout(() => { flashEl.style.opacity = '0.08'; }, 50);
    setTimeout(() => { flashEl.style.opacity = '0'; }, 120);
    // Double flash
    setTimeout(() => {
      flashEl.style.opacity = '0.12';
      setTimeout(() => { flashEl.style.opacity = '0'; }, 60);
    }, 160);
  }
  scheduleLightning();
}

function buildBolt(x1, y1, x2, y2, depth) {
  const segments = [[x1, y1, x2, y2]];
  if (depth > 4) return segments;
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * (Math.abs(y2 - y1) * 0.5);
  const my = (y1 + y2) / 2;
  const left  = buildBolt(x1, y1, mx, my, depth + 1);
  const right = buildBolt(mx, my, x2, y2, depth + 1);
  // Branch
  if (depth < 3 && Math.random() > 0.55) {
    const bx = mx + (Math.random() - 0.5) * 80;
    const by = my + (Math.random() * 60 + 30);
    const branch = buildBolt(mx, my, bx, by, depth + 2);
    return [...left, ...right, ...branch];
  }
  return [...left, ...right];
}

function drawLightning(ts) {
  lightningBolts = lightningBolts.filter(bolt => {
    const age = ts - bolt.born;
    if (age > bolt.life) return false;
    const fade = 1 - age / bolt.life;
    bolt.segments.forEach(([x1, y1, x2, y2], i) => {
      const segAlpha = fade * (i === 0 ? 1 : 0.55);
      // Glow
      ctx.save();
      ctx.shadowColor = 'rgba(180,210,255,0.8)';
      ctx.shadowBlur  = 18;
      ctx.strokeStyle = `rgba(200,225,255,${segAlpha * 0.5})`;
      ctx.lineWidth   = 3;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      // Core
      ctx.shadowBlur  = 6;
      ctx.strokeStyle = `rgba(230,245,255,${segAlpha})`;
      ctx.lineWidth   = 1.2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
    });
    return true;
  });
}

/* ════════════════════════════════════════
   OCEAN AMBIENT FOG
════════════════════════════════════════ */
function drawOceanFog() {
  const fogY = H * 0.65;
  const grad = ctx.createLinearGradient(0, fogY - 40, 0, fogY + 60);
  grad.addColorStop(0, 'rgba(4,10,22,0)');
  grad.addColorStop(0.5, 'rgba(4,10,22,0.35)');
  grad.addColorStop(1, 'rgba(3,8,16,0.7)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, fogY - 40, W, 100);
}

/* ════════════════════════════════════════
   MAIN LOOP
════════════════════════════════════════ */
function loop(ts) {
  now = ts;
  ctx.clearRect(0, 0, W, H);

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
  skyGrad.addColorStop(0,    '#020508');
  skyGrad.addColorStop(0.3,  '#040a14');
  skyGrad.addColorStop(0.65, '#060e1c');
  skyGrad.addColorStop(1,    '#05111e');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  drawClouds();
  drawRain();
  drawLightning(ts);
  drawWaves();
  drawShip();
  drawOceanFog();

  if (now >= nextLightningTime) spawnLightning();

  requestAnimationFrame(loop);
}

/* ── Init ── */
resize();
initRain();
scheduleLightning();
// First lightning sooner for drama
setTimeout(spawnLightning, 1500);
requestAnimationFrame(loop);

/* ════════════════════════════════════════
   MIC / VOICE AUTH
════════════════════════════════════════ */
// lightning-flash div is declared in login.html + login.css

let micOn     = false;
let micTimer  = null;
let wrongCount = 0;

const wrongLines = [
  'GURARARARA...<br>that\'s not it. Try again, <em>son</em>',
  'Hmm...<br>I expected more from you. <em>One more chance.</em>',
  'That\'s wrong.<br>Don\'t make Whitebeard <em>disappointed</em>.',
  'Son...<br>are you sure you belong on <em>this ship?</em>',
];

const speechText = document.getElementById('speech-text');
if (speechText) speechText.style.transition = 'opacity 0.2s';

function setSpeech(html) {
  if (!speechText) return;
  speechText.style.opacity = '0';
  setTimeout(() => { speechText.innerHTML = html; speechText.style.opacity = '1'; }, 200);
}

function toggleMic() {
  micOn = !micOn;
  const outer = document.getElementById('mic-outer');
  const label = document.getElementById('voice-label');
  const sub   = document.getElementById('voice-sub');
  if (!outer) return;

  if (micOn) {
    outer.classList.add('active');
    label.textContent = 'LISTENING...';
    sub.textContent   = 'speak clearly';
    setSpeech('Speak up...<br>I\'m listening, <em>son</em>');
    micTimer = setTimeout(wrongPassword, 4000);
    /* Web Speech API:
    const recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recog.onresult = e => {
      clearTimeout(micTimer);
      const said = e.results[0][0].transcript.toLowerCase().trim();
      if (said === 'YOUR_PASSWORD') correctPassword(); else wrongPassword();
    };
    recog.onerror = wrongPassword;
    recog.start();
    */
  } else {
    stopMic();
    setSpeech('GURARARARA...<br>prove you belong here, <em>son</em>');
  }
}

function stopMic() {
  micOn = false;
  clearTimeout(micTimer);
  const outer = document.getElementById('mic-outer');
  const label = document.getElementById('voice-label');
  const sub   = document.getElementById('voice-sub');
  if (!outer) return;
  outer.classList.remove('active');
  label.textContent = 'SPEAK YOUR PASSWORD';
  sub.textContent   = 'voice authentication';
}

function wrongPassword() {
  stopMic();
  setSpeech(wrongLines[wrongCount % wrongLines.length]);
  wrongCount++;
  const ui = document.querySelector('.login-ui');
  if (ui) {
    ui.classList.remove('shake');
    void ui.offsetWidth;
    ui.classList.add('shake');
    setTimeout(() => ui.classList.remove('shake'), 500);
  }
  spawnLightning();
}

function correctPassword() {
  stopMic();
  setSpeech('That\'s my <em>son!!</em><br>Welcome aboard!! GURARARARA!!!');
  setTimeout(enterApp, 1400);
}

function enterApp() {
  document.body.style.transition = 'opacity 0.6s';
  document.body.style.opacity    = '0';
  setTimeout(() => { window.location.href = 'app.html'; }, 650);
}
