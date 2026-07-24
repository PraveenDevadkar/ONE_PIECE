/* ═══════════════════════════════════════
   APP.JS — Straw Hat Agent
   Backend Wired — Real Ollama Responses
═══════════════════════════════════════ */

// ── BACKEND CONFIG ───────────────────────────────────────────────
const API     = 'http://127.0.0.1:8000';
const STORAGE = sessionStorage;

// ── CREW DATA ────────────────────────────────────────────────────
const CREW = {
  luffy:   { name:'Luffy',   fullName:'Monkey D. Luffy',   color:'#e83030', emoji:'☠',  domain:'General Chat',    greet:'Shishishi! Ready to sail, nakama?' },
  zoro:    { name:'Zoro',    fullName:'Roronoa Zoro',      color:'#30b860', emoji:'⚔',  domain:'Skills & DSA',    greet:'Nothing happened. Get back to training.' },
  nami:    { name:'Nami',    fullName:'Nami',               color:'#e8a020', emoji:'🗺',  domain:'Career & Finance', greet:'Let me map out your career route.' },
  usopp:   { name:'Usopp',   fullName:'Usopp',              color:'#c87820', emoji:'🎯',  domain:'Ideas & Projects', greet:'I, the great Usopp, have a plan!' },
  sanji:   { name:'Sanji',   fullName:'Vinsmoke Sanji',    color:'#6060e8', emoji:'🍳',  domain:'Food & Nutrition', greet:'A good meal fuels a great mind.' },
  chopper: { name:'Chopper', fullName:'Tony Tony Chopper', color:'#e83070', emoji:'🩺',  domain:'Health & Wellness',greet:'How are you feeling today?' },
  robin:   { name:'Robin',   fullName:'Nico Robin',        color:'#a060e8', emoji:'📚',  domain:'Research & Notes', greet:'Knowledge is the most powerful weapon.' },
  franky:  { name:'Franky',  fullName:'Franky',             color:'#20a8e8', emoji:'🔧',  domain:'Tech & Automation',greet:'SUPER! What are we building today?' },
  brook:   { name:'Brook',   fullName:'Brook',              color:'#b0b0d8', emoji:'🎵',  domain:'Music & Mood',    greet:'Yohohoho! Music for the soul!' },
  jinbe:   { name:'Jinbe',   fullName:'Jinbe',              color:'#2080c8', emoji:'🌊',  domain:'Schedule & Focus', greet:'A calm helmsman makes the best voyage.' },
};

// ── FALLBACK REPLIES (used when backend offline) ─────────────────
const REPLIES = {
  luffy:   ["Yosh! Let's do it nakama! 🏴‍☠️", "I don't know what that means but WE'LL FIGURE IT OUT!", "We're gonna make it! I promise on my crew!"],
  zoro:    ["Focus. Train harder. Nothing happened.", "A sword only gets sharper with use. Keep going.", "Get it done. No excuses."],
  nami:    ["Here's the financially smart move...", "Let me chart you a route to success.", "Save first. Always save first."],
  usopp:   ["I, the great Usopp, have the PERFECT idea!", "Back in my village I did something even greater...", "Every legend starts with one brave step!"],
  sanji:   ["Leave it to me. Nutrition is everything.", "I'll craft a plan that'll make you cry with joy.", "A great cook plans every meal like a masterpiece."],
  chopper: ["Tell me everything! I'm a great doctor!", "Don't push too hard — your health comes first!", "Rum-bum-bum! I know exactly what you need!"],
  robin:   ["Fascinating. The research suggests...", "History patterns repeat. Let me analyze this.", "I'll find what you need. Knowledge is power."],
  franky:  ["SUPER! On it right now bro!", "I'll build a SUPER solution for that!", "Tech problems are just puzzles. Let's solve it!"],
  brook:   ["Yohohoho! Here's my recommendation!", "Even a skeleton appreciates a good vibe!", "Shall I play you a song?"],
  jinbe:   ["Let's plan this methodically. Calm focus wins.", "Read the current before you sail.", "Your schedule is your chart. Trust it."],
};

// ── KEYWORD ROUTER (mirrors backend router.py) ───────────────────
const KEYWORDS = {
  zoro:    ['learn','skill','code','practice','study','train','improve','course','dsa','algorithm','programming','docker','system','backend','frontend'],
  nami:    ['career','job','travel','trip','money','salary','budget','interview','resume','work','finance','save','invest'],
  usopp:   ['idea','project','creative','story','hobby','art','build','brainstorm','design','invent','side project'],
  sanji:   ['food','eat','recipe','cook','meal','breakfast','lunch','dinner','diet','nutrition','hungry','calories','protein'],
  chopper: ['health','sick','pain','tired','sleep','exercise','workout','symptom','doctor','medicine','headache','stress','mental'],
  robin:   ['research','history','notes','journal','book','read','facts','analyse','find','explain','summarise','topic'],
  franky:  ['install','setup','automate','config','script','hardware','tool','error','fix','debug','software','deploy'],
  brook:   ['music','movie','bored','relax','fun','joke','song','entertain','watch','chill','playlist','anime'],
  jinbe:   ['schedule','today','task','focus','pomodoro','plan','priority','time','productive','routine','habit','deadline'],
};

function autoRoute(message) {
  const lower = message.toLowerCase();
  let best = 'luffy', bestScore = 0;
  for (const [char, words] of Object.entries(KEYWORDS)) {
    const score = words.filter(w => lower.includes(w)).length;
    if (score > bestScore) { bestScore = score; best = char; }
  }
  return best;
}

// ── STATE ────────────────────────────────────────────────────────
let activeCrew = 'luffy';
let activeTab  = 'dashboard';
let isLoading  = false;

// ── AUTH CHECK ON LOAD ───────────────────────────────────────────
(function checkAuth() {
  const token = STORAGE.getItem('jwt');
  if (!token) {
    // No token — send back to login
    window.location.href = 'login.html';
    return;
  }
  // Verify token is still valid against backend
  // (silent check — don't block UI)
  if (token !== 'demo-token') {
    fetch(`${API}/health`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {
      console.warn('Backend offline — running in demo mode');
    });
  }
})();

/* ── Clock ── */
function updateClock() {
  const now  = new Date();
  const time = now.toLocaleTimeString('en-GB');
  const date = now.toLocaleDateString('en-GB', {
    weekday:'short', day:'numeric', month:'short', year:'numeric'
  }).replace(',','');
  const gt = document.getElementById('greeting-time');
  const nd = document.getElementById('nav-date');
  if (gt) gt.textContent = time;
  if (nd) nd.textContent = date;
}
setInterval(updateClock, 1000);
updateClock();

/* ── Build crew grid ── */
function buildCrewGrid(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  Object.entries(CREW).forEach(([key, c]) => {
    const div = document.createElement('div');
    div.className = 'crew-member' + (key === activeCrew ? ' active' : '');
    div.id        = 'cm-' + containerId + '-' + key;
    div.onclick   = () => selectCrew(key);
    div.innerHTML = `
      <div class="cm-avatar" style="${key === activeCrew ? 'border-color:' + c.color + ';box-shadow:0 0 14px ' + c.color + '40' : ''}">
        ${c.emoji}
      </div>
      <div class="cm-name">${c.name}</div>`;
    el.appendChild(div);
  });
}

/* ── Build chat crew strip ── */
function buildChatStrip() {
  const strip = document.getElementById('chat-crew-strip');
  if (!strip) return;
  strip.innerHTML = '';
  Object.entries(CREW).forEach(([key, c]) => {
    const pill = document.createElement('div');
    pill.className = 'cc-pill' + (key === activeCrew ? ' active' : '');
    pill.id        = 'ccp-' + key;
    pill.style.cssText = key === activeCrew
      ? `background:${c.color}22;border-color:${c.color}60;color:${c.color}`
      : '';
    pill.onclick   = () => selectCrew(key);
    pill.innerHTML = `<span class="cc-dot" style="background:${c.color}"></span>${c.name}`;
    strip.appendChild(pill);
  });
}

/* ── Select crew member ── */
function selectCrew(key) {
  if (key === activeCrew) return;
  activeCrew = key;
  const c    = CREW[key];

  // Update greeting bar
  const gav = document.getElementById('greeting-avatar');
  const gt  = document.getElementById('greeting-title');
  const gs  = document.getElementById('greeting-sub');
  if (gav) { gav.textContent = c.emoji; gav.style.borderColor = c.color; gav.style.boxShadow = `0 0 12px ${c.color}50`; }
  if (gt)  gt.textContent = 'Good morning, Nakama!';
  if (gs)  { gs.textContent = c.greet; gs.style.color = c.color; }

  // Update accent colour throughout UI
  document.documentElement.style.setProperty('--accent', c.color);

  // Update send button
  const sb = document.getElementById('ib-send');
  if (sb) sb.style.background = c.color;

  // Rebuild grids and strip
  buildCrewGrid('crew-grid');
  buildCrewGrid('crew-grid-full');
  buildChatStrip();

  // Add crew greeting message and switch to chat
  addCrewMsg(c.name, c.greet, c.emoji, c.color);
  switchTab('chat');

  // Update character panel
  updateCharPanel(key);
}

/* ── Switch sidebar view ── */
function switchView(view) {
  document.querySelectorAll('.sb-icon').forEach(b => b.classList.remove('active'));
  document.getElementById('sbi-' + view)?.classList.add('active');
  if (['dashboard','chat','schedule','goals'].includes(view)) {
    switchTab(view);
  } else {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + view)?.classList.add('active');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  }
}

/* ── Switch tab ── */
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + tab)?.classList.add('active');
  document.querySelectorAll('.sb-icon').forEach(b => b.classList.remove('active'));
  document.getElementById('sbi-' + tab)?.classList.add('active');
  if (tab === 'chat') buildChatStrip();
}

/* ── Quick action ── */
function quickAction(tab, crewKey) {
  if (crewKey) selectCrew(crewKey);
  switchTab(tab);
}

/* ── Chat message helpers ── */
function addCrewMsg(name, text, emoji, color) {
  removeEmpty();
  const msgs = document.getElementById('chat-msgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'msg crew-msg';
  div.innerHTML = `
    <div class="msg-av" style="border-color:${color}60">${emoji}</div>
    <div class="msg-body">
      <div class="msg-name" style="color:${color}">${name}</div>
      <div class="bubble">${text}</div>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addUserMsg(text) {
  removeEmpty();
  const msgs = document.getElementById('chat-msgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'msg user-msg';
  div.innerHTML = `
    <div class="msg-av" style="border-color:${CREW[activeCrew].color}40">👤</div>
    <div class="msg-body">
      <div class="msg-name">You</div>
      <div class="bubble">${escHtml(text)}</div>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chat-msgs');
  if (!msgs || document.getElementById('typing')) return;
  const c   = CREW[activeCrew];
  const div = document.createElement('div');
  div.id        = 'typing';
  div.className = 'msg crew-msg typing-bubble';
  div.innerHTML = `
    <div class="msg-av" style="border-color:${c.color}60">${c.emoji}</div>
    <div class="msg-body">
      <div class="msg-name" style="color:${c.color}">${c.name}</div>
      <div class="bubble"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() { document.getElementById('typing')?.remove(); }

function removeEmpty() {
  document.getElementById('chat-empty-state')?.remove();
}

/* ── SEND MESSAGE — Backend Wired ── */
async function ibSend() {
  if (isLoading) return;
  const inp = document.getElementById('ib-input');
  const val = inp.value.trim();
  if (!val) return;

  // Switch to chat view
  switchTab('chat');
  addUserMsg(val);
  inp.value = '';

  // Auto-route to best crew member BEFORE sending
  const routed = autoRoute(val);
  if (routed !== activeCrew) {
    // Silently switch crew without greeting
    activeCrew = routed;
    const c    = CREW[routed];
    document.documentElement.style.setProperty('--accent', c.color);
    const sb   = document.getElementById('ib-send');
    if (sb) sb.style.background = c.color;
    buildCrewGrid('crew-grid');
    buildCrewGrid('crew-grid-full');
    buildChatStrip();
    updateCharPanel(routed);
  }

  showTyping();
  isLoading = true;

  const token = STORAGE.getItem('jwt');
  const c     = CREW[activeCrew];

  try {
    if (!token || token === 'demo-token') {
      // ── DEMO MODE — mock reply ───────────────────────────────
      await sleep(800 + Math.random() * 600);
      hideTyping();
      isLoading = false;
      const pool = REPLIES[activeCrew];
      addCrewMsg(c.name, pool[Math.floor(Math.random() * pool.length)] + ' <em style="font-size:11px;opacity:0.5">(demo)</em>', c.emoji, c.color);
      return;
    }

    // ── REAL BACKEND CALL ────────────────────────────────────────
    const res = await fetch(`${API}/chat`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message:   val,
        character: activeCrew   // backend may override based on its own router
      })
    });

    hideTyping();
    isLoading = false;

    if (res.ok) {
      const data = await res.json();

      // Backend may have rerouted to a different crew member
      if (data.character && data.character !== activeCrew) {
        activeCrew = data.character;
        const newC = CREW[data.character];
        document.documentElement.style.setProperty('--accent', newC.color);
        const sb = document.getElementById('ib-send');
        if (sb) sb.style.background = newC.color;
        buildCrewGrid('crew-grid');
        buildCrewGrid('crew-grid-full');
        buildChatStrip();
        updateCharPanel(data.character);
        addCrewMsg(newC.name, data.reply, newC.emoji, newC.color);
      } else {
        addCrewMsg(c.name, data.reply, c.emoji, c.color);
      }

    } else if (res.status === 401) {
      // Token expired — go back to login
      addCrewMsg('System', '⚠ Session expired — redirecting to login...', '⚠', '#e83030');
      setTimeout(() => {
        STORAGE.clear();
        window.location.href = 'login.html';
      }, 2000);

    } else {
      const err = await res.json().catch(() => ({}));
      addCrewMsg(c.name, `Something went wrong on the ship... ${err.detail || ''}`, c.emoji, c.color);
    }

  } catch (err) {
    console.error('Chat error:', err);
    hideTyping();
    isLoading = false;
    // Fallback to demo reply when backend is down
    const pool = REPLIES[activeCrew];
    addCrewMsg(
      c.name,
      pool[Math.floor(Math.random() * pool.length)] + ' <em style="font-size:11px;opacity:0.5">(offline)</em>',
      c.emoji,
      c.color
    );
  }
}

/* ── Input handlers ── */
function ibKey(e) { if (e.key === 'Enter' && !e.shiftKey) ibSend(); }

/* ── Mic button — voice input ── */
function ibMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert('Voice input not supported in this browser'); return; }

  const mic = document.querySelector('.ib-mic');
  if (mic) mic.textContent = '🔴';

  const recog             = new SR();
  recog.continuous        = false;
  recog.interimResults    = false;
  recog.lang              = 'en-US';

  recog.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const inp  = document.getElementById('ib-input');
    if (inp) { inp.value = text; ibSend(); }
    if (mic) mic.textContent = '🎤';
  };

  recog.onerror = () => { if (mic) mic.textContent = '🎤'; };
  recog.onend   = () => { if (mic) mic.textContent = '🎤'; };
  recog.start();
}

/* ── Update character panel ── */
function updateCharPanel(key) {
  const c       = CREW[key];
  const wrap    = document.getElementById('ccf-img');
  const glow    = document.getElementById('ccf-glow');
  const nameEl  = document.getElementById('ccf-name');
  const emojiEl = document.getElementById('ccf-emoji');
  if (!wrap) return;

  if (nameEl) {
    nameEl.textContent  = c.name.toUpperCase();
    nameEl.style.color  = c.color;
    nameEl.style.textShadow = `0 0 10px ${c.color}`;
  }
  if (glow) {
    glow.style.background = `radial-gradient(ellipse at 50% 100%, ${c.color} -20%, transparent 65%)`;
  }
  document.documentElement.style.setProperty('--accent', c.color);

  // Try loading PNG from assets folder
  const imgPath = `../assets/${key}.png`;
  let img = wrap.querySelector('img');
  if (!img) { img = document.createElement('img'); wrap.appendChild(img); }

  img.style.opacity   = '0';
  img.alt = c.name;

  img.onload = () => {
    if (emojiEl) emojiEl.style.opacity = '0';
    img.style.opacity = '1';
    img.classList.remove('walkin');
    void img.offsetWidth;
    img.classList.add('walkin');
  };

  img.onerror = () => {
    img.style.display = 'none';
    if (emojiEl) { emojiEl.style.opacity = '1'; emojiEl.textContent = c.emoji; }
  };

  img.style.display = 'block';
  img.src = imgPath;
  if (emojiEl) emojiEl.textContent = c.emoji;
}

/* ── Utilities ── */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function escHtml(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ── Init ── */
(function init() {
  buildCrewGrid('crew-grid');
  buildCrewGrid('crew-grid-full');
  buildChatStrip();
  const sb = document.getElementById('ib-send');
  if (sb) sb.style.background = CREW[activeCrew].color;
  updateCharPanel(activeCrew);

  // Show initial greeting from Luffy
  setTimeout(() => {
    addCrewMsg(
      CREW.luffy.name,
      CREW.luffy.greet,
      CREW.luffy.emoji,
      CREW.luffy.color
    );
  }, 300);
})();
