/* ═══════════════════════════════════════════════
   LOGIN.JS — Straw Hat Agent
   Storm engine + Backend Auth Wired
═══════════════════════════════════════════════ */

// ── BACKEND CONFIG ───────────────────────────────────────────────
const API     = 'http://127.0.0.1:8000';
const STORAGE = sessionStorage;

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
  for (let i = 0; i < 14; i++) {
    clouds.push({
      x:     Math.random() * W * 1.4 - W * 0.2,
      y:     Math.random() * H * 0.45 - 20,
      r:     Math.random() * 140 + 80,
      speed: Math.random() * 0.18 + 0.06,
      alpha: Math.random() * 0.55 + 0.3,
      dark:  Math.random() > 0.4,
    });
  }
}

function drawClouds() {
  clouds.forEach(c => {
    const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    grad.addColorStop(0,   c.dark ? `rgba(12,16,36,${c.alpha})` : `rgba(24,32,70,${c.alpha * 0.5})`);
    grad.addColorStop(0.5, c.dark ? `rgba(8,12,26,${c.alpha * 0.8})` : `rgba(16,24,52,${c.alpha * 0.3})`);
    grad.addColorStop(1,   'rgba(4,6,14,0)');
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.r * 1.6, c.r * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    for (let j = 0; j < 4; j++) {
      const bx = c.x + (j - 1.5) * c.r * 0.55;
      const by = c.y - c.r * 0.3;
      const br = c.r * (0.35 + Math.random() * 0.2);
      const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      bg.addColorStop(0, c.dark ? `rgba(10,14,32,${c.alpha * 0.9})` : `rgba(20,28,60,${c.alpha * 0.4})`);
      bg.addColorStop(1, 'rgba(4,6,14,0)');
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
    }
    c.x += c.speed;
    if (c.x - c.r * 1.6 > W + 100) c.x = -c.r * 1.6 - 50;
  });
}

/* ════════════════════════════════════════
   RAIN
════════════════════════════════════════ */
const RAIN_COUNT = 420;
const drops = [];

function initRain() {
  for (let i = 0; i < RAIN_COUNT; i++) drops.push(newDrop(true));
}

function newDrop(scatter) {
  return {
    x:     scatter ? Math.random() * (W + 200) - 100 : Math.random() * W,
    y:     scatter ? Math.random() * H : -10,
    len:   Math.random() * 28 + 14,
    speed: Math.random() * 9 + 14,
    alpha: Math.random() * 0.45 + 0.25,
    width: Math.random() * 0.8 + 0.4,
  };
}

function drawRain() {
  ctx.save();
  const angleRad = (75 * Math.PI) / 180;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);
  drops.forEach(d => {
    const x2 = d.x - d.len * dx;
    const y2 = d.y - d.len * dy;
    const grad = ctx.createLinearGradient(x2, y2, d.x, d.y);
    grad.addColorStop(0, `rgba(160,200,255,0)`);
    grad.addColorStop(1, `rgba(180,215,255,${d.alpha})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = d.width;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
    if (d.y > H * 0.75) {
      ctx.fillStyle = `rgba(160,200,255,${d.alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.width + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
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
   WAVES
════════════════════════════════════════ */
let waveTime = 0;

function drawWaves() {
  const baseY = H * 0.72;
  waveTime += 0.012;
  drawWaveLayer(baseY + 8,  0.018, 0.6,  26, 9,  '#030a14', 0.95, waveTime * 0.6);
  drawWaveLayer(baseY + 2,  0.022, 0.65, 22, 11, '#04101e', 1.0,  waveTime * 0.75);
  drawWaveLayer(baseY - 8,  0.027, 0.7,  18, 13, '#061828', 1.0,  waveTime);
  drawWaveLayer(baseY - 18, 0.032, 0.75, 15, 15, '#0a2038', 1.0,  waveTime * 1.2);
  drawFoam(baseY - 18, 0.032, 0.75, 15, waveTime * 1.2);
  ctx.fillStyle = '#030a14';
  ctx.fillRect(0, baseY + 30, W, H - baseY - 30);
}

function drawWaveLayer(baseY, freq, amp, roughness, speed, color, alpha, t) {
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) {
    const y = baseY
      + Math.sin(x * freq + t * speed)             * amp * H * 0.018
      + Math.sin(x * freq * 2.3 + t * speed * 1.4) * amp * H * 0.008
      + Math.sin(x * roughness * 0.5 + t * 2)      * amp * H * 0.004;
    if (x === 0) ctx.moveTo(x, y);
    else         ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle    = color;
  ctx.globalAlpha  = alpha;
  ctx.fill();
  ctx.globalAlpha  = 1;
}

function drawFoam(baseY, freq, amp, speed, t) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let x = 0; x < W; x += 6) {
    const y = baseY
      + Math.sin(x * freq + t * speed)             * amp * H * 0.018
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
   SHIP
════════════════════════════════════════ */
let shipPhase = 0;

function drawShip() {
  shipPhase += 0.007;
  const waterY = H * 0.74;
  const cx     = W * 0.52;
  const scale  = Math.min(W / 1400, H / 820, 1);
  const bob    = Math.sin(shipPhase) * 5 + Math.sin(shipPhase * 1.6) * 2.5;
  const tilt   = Math.sin(shipPhase * 0.75) * 1.4;
  ctx.save();
  ctx.translate(cx, waterY + bob);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.scale(scale, scale);

  const hullGrad = ctx.createLinearGradient(-480, -80, 480, 180);
  hullGrad.addColorStop(0,   '#1a0e06');
  hullGrad.addColorStop(0.3, '#120a04');
  hullGrad.addColorStop(0.7, '#0e0804');
  hullGrad.addColorStop(1,   '#080502');

  ctx.beginPath();
  ctx.moveTo(-480, -110);
  ctx.lineTo(-460, -150); ctx.lineTo(-420, -160); ctx.lineTo(-380, -148);
  ctx.lineTo(-300, -95);  ctx.lineTo( 180, -95);
  ctx.lineTo( 360, -105); ctx.lineTo( 440, -120); ctx.lineTo( 480, -95);
  ctx.quadraticCurveTo( 520, 20,  440, 120);
  ctx.quadraticCurveTo( 400, 175, 320, 190);
  ctx.lineTo(-320, 190);
  ctx.quadraticCurveTo(-420, 180, -500, 90);
  ctx.quadraticCurveTo(-520, 10, -480, -110);
  ctx.closePath();
  ctx.fillStyle = hullGrad; ctx.fill();
  ctx.strokeStyle = '#2a1508'; ctx.lineWidth = 3; ctx.stroke();

  // Red stripe
  ctx.beginPath(); ctx.moveTo(-505, 55); ctx.bezierCurveTo(-300, 62, 200, 48, 510, 55);
  ctx.strokeStyle = '#8b1010'; ctx.lineWidth = 6; ctx.stroke();

  // Gold trim
  ctx.beginPath(); ctx.moveTo(-482, -95); ctx.lineTo(482, -95);
  ctx.strokeStyle = '#c89010'; ctx.lineWidth = 2; ctx.stroke();

  // Masts
  const MAST = [
    { x: -380, base: -118, top: -620, w: 10 },
    { x:  -60, base: -118, top: -760, w: 13 },
    { x:  260, base: -118, top: -600, w: 10 },
  ];

  MAST.forEach(m => {
    ctx.beginPath();
    ctx.moveTo(m.x - m.w * 0.5, m.base); ctx.lineTo(m.x - m.w * 0.3, m.top);
    ctx.lineTo(m.x + m.w * 0.3, m.top);  ctx.lineTo(m.x + m.w, m.base);
    ctx.closePath();
    ctx.fillStyle = '#0e0804'; ctx.fill();
  });

  // Flags
  function drawFlag(fx, fy, size) {
    const fw = size * 1.8, fh = size * 1.1;
    const wave = Math.sin(shipPhase * 2.5) * size * 0.18;
    ctx.save(); ctx.translate(fx, fy);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(fw * 0.3, wave, fw * 0.7, -wave * 0.5, fw, wave * 0.5);
    ctx.bezierCurveTo(fw * 0.7, fh + wave, fw * 0.3, fh - wave, 0, fh);
    ctx.closePath();
    ctx.fillStyle = '#0a0a0a'; ctx.fill();
    ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 1.5; ctx.stroke();
    // Skull
    const skx = fw * 0.5, sky = fh * 0.35, sr = size * 0.25;
    ctx.beginPath(); ctx.arc(skx, sky, sr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,220,220,0.85)'; ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.ellipse(skx - sr * 0.3, sky, sr * 0.18, sr * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(skx + sr * 0.3, sky, sr * 0.18, sr * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawFlag(MAST[1].x + 4, MAST[1].top - 4, 28);
  drawFlag(MAST[0].x + 3, MAST[0].top - 3, 18);
  drawFlag(MAST[2].x + 3, MAST[2].top - 3, 16);

  ctx.restore();
}

/* ════════════════════════════════════════
   LIGHTNING
════════════════════════════════════════ */
let lightningBolts    = [];
let nextLightningTime = 0;
let now = 0;

function scheduleLightning() {
  nextLightningTime = now + 5000 + Math.random() * 12000;
}

function spawnLightning() {
  const startX = Math.random() * W;
  const startY = Math.random() * H * 0.15;
  const endX   = startX + (Math.random() - 0.5) * 200;
  const endY   = H * (0.4 + Math.random() * 0.2);
  lightningBolts.push({
    segments: buildBolt(startX, startY, endX, endY, 0),
    born: now,
    life: 120 + Math.random() * 100,
  });
  const flashEl = document.getElementById('lightning-flash');
  if (flashEl) {
    flashEl.style.opacity = '0.18';
    setTimeout(() => { flashEl.style.opacity = '0.08'; }, 50);
    setTimeout(() => { flashEl.style.opacity = '0'; }, 120);
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
  if (depth < 3 && Math.random() > 0.55) {
    const bx = mx + (Math.random() - 0.5) * 80;
    const by = my + Math.random() * 60 + 30;
    return [...left, ...right, ...buildBolt(mx, my, bx, by, depth + 2)];
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
      ctx.save();
      ctx.shadowColor = 'rgba(180,210,255,0.8)'; ctx.shadowBlur = 18;
      ctx.strokeStyle = `rgba(200,225,255,${segAlpha * 0.5})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.shadowBlur = 6;
      ctx.strokeStyle = `rgba(230,245,255,${segAlpha})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
    });
    return true;
  });
}

function drawOceanFog() {
  const fogY = H * 0.65;
  const grad = ctx.createLinearGradient(0, fogY - 40, 0, fogY + 60);
  grad.addColorStop(0,   'rgba(4,10,22,0)');
  grad.addColorStop(0.5, 'rgba(4,10,22,0.35)');
  grad.addColorStop(1,   'rgba(3,8,16,0.7)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, fogY - 40, W, 100);
}

/* ════════════════════════════════════════
   MAIN LOOP
════════════════════════════════════════ */
function loop(ts) {
  now = ts;
  ctx.clearRect(0, 0, W, H);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
  skyGrad.addColorStop(0,   '#020508');
  skyGrad.addColorStop(0.3, '#040a14');
  skyGrad.addColorStop(0.65,'#060e1c');
  skyGrad.addColorStop(1,   '#05111e');
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

/* ── Init canvas ── */
resize();
initRain();
scheduleLightning();
setTimeout(spawnLightning, 1500);
requestAnimationFrame(loop);

/* ════════════════════════════════════════
   MIC / VOICE AUTH — BACKEND WIRED
════════════════════════════════════════ */
let micOn      = false;
let micTimer   = null;
let wrongCount = 0;
let recognition = null;

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

/* ── Toggle mic ── */
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
    startRecognition();
  } else {
    stopMic();
    setSpeech('GURARARARA...<br>prove you belong here, <em>son</em>');
  }
}

/* ── Start Web Speech API ── */
function startRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SR) {
    // No speech support — show message
    const sub = document.getElementById('voice-sub');
    if (sub) sub.textContent = 'voice not supported — use button below';
    stopMic();
    return;
  }

  recognition             = new SR();
  recognition.continuous  = false;
  recognition.interimResults = true;
  recognition.lang        = 'en-US';
  recognition.maxAlternatives = 1;

  // Show interim words as user speaks
  recognition.onresult = async (e) => {
    let interim = '';
    let final   = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    const heard = final || interim;
    setSpeech(`"${heard}"<br><em>checking...</em>`);

    if (final) {
      clearTimeout(micTimer);
      stopMic();
      await checkPassword(final.trim());
    }
  };

  recognition.onerror = (e) => {
    console.error('Speech error:', e.error);
    clearTimeout(micTimer);
    stopMic();
    if (e.error === 'not-allowed') {
      setSpeech('Mic blocked...<br>allow microphone in browser, <em>son</em>');
    } else if (e.error === 'no-speech') {
      setSpeech('I heard nothing...<br>speak up, <em>son</em>');
    } else {
      wrongPassword();
    }
  };

  recognition.onend = () => {
    if (micOn) stopMic();
  };

  // Timeout — 6 seconds of silence
  micTimer = setTimeout(() => {
    if (recognition) { try { recognition.stop(); } catch(e) {} }
    stopMic();
    setSpeech('I heard nothing...<br>speak up, <em>son</em>');
  }, 6000);

  try {
    recognition.start();
  } catch(e) {
    console.error('Recognition start error:', e);
    stopMic();
  }
}

/* ── Stop mic ── */
function stopMic() {
  micOn = false;
  clearTimeout(micTimer);
  if (recognition) { try { recognition.stop(); } catch(e) {} recognition = null; }
  const outer = document.getElementById('mic-outer');
  const label = document.getElementById('voice-label');
  const sub   = document.getElementById('voice-sub');
  if (!outer) return;
  outer.classList.remove('active');
  label.textContent = 'SPEAK YOUR PASSWORD';
  sub.textContent   = 'voice authentication';
}

/* ── Check password against backend ── */
async function checkPassword(spoken) {
  const label = document.getElementById('voice-label');
  const sub   = document.getElementById('voice-sub');
  if (label) label.textContent = 'VERIFYING...';
  if (sub)   sub.textContent   = 'Whitebeard is judging...';
  setSpeech(`"${spoken}"<br><em>verifying...</em>`);

  try {
    const res  = await fetch(`${API}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: spoken })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      // ── CORRECT ─────────────────────────────────────────────
      STORAGE.setItem('jwt', data.token);
      STORAGE.setItem('crew', 'ready');
      correctPassword();
    } else {
      // ── WRONG ───────────────────────────────────────────────
      wrongPassword();
    }

  } catch (err) {
    console.error('Backend error:', err);
    // Backend offline — demo fallback
    const clean = spoken.toLowerCase().replace(/[.,!?]/g,'').trim();
    const pass  = clean.includes('nakama') ||
                  clean.includes('one piece') ||
                  clean === 'demo';
    if (pass) {
      STORAGE.setItem('jwt', 'demo-token');
      STORAGE.setItem('crew', 'ready');
      correctPassword();
    } else {
      setSpeech('Ship offline...<br>backend not running, <em>son</em>');
      setTimeout(() => wrongPassword(), 1200);
    }
  }
}

/* ── Wrong password reaction ── */
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

/* ── Correct password reaction ── */
function correctPassword() {
  stopMic();
  setSpeech('That\'s my <em>son!!</em><br>Welcome aboard!! GURARARARA!!!');
  spawnLightning();
  setTimeout(enterApp, 1600);
}

/* ── Board the ship button ── */
function boardShip() {
  const token = STORAGE.getItem('jwt');
  if (token) {
    // Already authenticated via voice
    enterApp();
  } else {
    // Not authenticated — enter demo mode
    STORAGE.setItem('jwt', 'demo-token');
    STORAGE.setItem('crew', 'ready');
    correctPassword();
  }
}

/* ── Enter app ── */
function enterApp() {
  document.body.style.transition = 'opacity 0.6s';
  document.body.style.opacity    = '0';
  setTimeout(() => { window.location.href = 'app.html'; }, 650);
}
