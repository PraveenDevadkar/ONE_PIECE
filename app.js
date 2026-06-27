/* ═══════════════════════════════════════
   APP.JS — Straw Hat Agent
═══════════════════════════════════════ */

const CREW = {
  luffy:   { name:'Luffy',   fullName:'Monkey D. Luffy',   color:'#e83030', emoji:'☠',  domain:'General Chat',   greet:'"Shishishi! Ready to sail, nakama?"' },
  zoro:    { name:'Zoro',    fullName:'Roronoa Zoro',      color:'#30b860', emoji:'⚔',  domain:'Skills & DSA',   greet:'"Nothing happened. Get back to training."' },
  nami:    { name:'Nami',    fullName:'Nami',               color:'#e8a020', emoji:'🗺',  domain:'Career & Finance',greet:'"Let me map out your career route."' },
  usopp:   { name:'Usopp',   fullName:'Usopp',              color:'#c87820', emoji:'🎯',  domain:'Ideas & Projects',greet:'"I, the great Usopp, have a plan!"' },
  sanji:   { name:'Sanji',   fullName:'Vinsmoke Sanji',    color:'#6060e8', emoji:'🍳',  domain:'Food & Nutrition',greet:'"A good meal fuels a great mind."' },
  chopper: { name:'Chopper', fullName:'Tony Tony Chopper', color:'#e83070', emoji:'🩺',  domain:'Health & Wellness',greet:'"How are you feeling today?"' },
  robin:   { name:'Robin',   fullName:'Nico Robin',        color:'#a060e8', emoji:'📚',  domain:'Research & Notes',greet:'"Knowledge is the most powerful weapon."' },
  franky:  { name:'Franky',  fullName:'Franky',             color:'#20a8e8', emoji:'🔧',  domain:'Tech & Automation',greet:'"SUPER! What are we building today?"' },
  brook:   { name:'Brook',   fullName:'Brook',              color:'#b0b0d8', emoji:'🎵',  domain:'Music & Mood',   greet:'"Yohohoho! Music for the soul!"' },
  jinbe:   { name:'Jinbe',   fullName:'Jinbe',              color:'#2080c8', emoji:'🌊',  domain:'Schedule & Focus',greet:'"A calm helmsman makes the best voyage."' },
};

const REPLIES = {
  luffy:   ["Yosh! Let's do it nakama! 🏴‍☠️", "I don't know what that means but WE'LL FIGURE IT OUT!", "We're gonna make it! I promise on my crew!"],
  zoro:    ["Focus. Train harder. Nothing happened.", "A sword only gets sharper with use. Keep going.", "Get it done. No excuses."],
  nami:    ["Here's the financially smart move...", "Let me chart you a route to success.", "Save first. Always save first."],
  usopp:   ["I, the great Usopp, have the PERFECT idea!", "Back in my village I did something even greater than this...", "Every legend starts with one brave step!"],
  sanji:   ["Leave it to me. Nutrition is everything.", "I'll craft a plan that'll make you cry with joy.", "A great cook plans every meal like a masterpiece."],
  chopper: ["Tell me everything! I'm a great doctor!", "Don't push too hard — your health comes first!", "Rum-bum-bum! I know exactly what you need!"],
  robin:   ["Fascinating. The research suggests...", "History patterns repeat. Let me analyze this.", "I'll find what you need. Knowledge is power."],
  franky:  ["SUPER! On it right now bro!", "I'll build a SUPER solution for that!", "Tech problems are just puzzles. Let's solve it!"],
  brook:   ["Yohohoho! Here's my recommendation!", "Even a skeleton appreciates a good vibe!", "Shall I play you a song? It's been a while!"],
  jinbe:   ["Let's plan this methodically. Calm focus wins.", "Read the current before you sail.", "Your schedule is your chart. Trust it."],
};

let activeCrew = 'luffy';
let activeView = 'dashboard';
let activeTab  = 'dashboard';

/* ── Clock ── */
function updateClock() {
  const now  = new Date();
  const time = now.toLocaleTimeString('en-GB');
  const date = now.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' }).replace(',','');
  document.getElementById('greeting-time').textContent = time;
  document.getElementById('nav-date').textContent = date;
}
setInterval(updateClock, 1000);
updateClock();

/* ── Build crew grid ── */
function buildCrewGrid(containerId, large) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  Object.entries(CREW).forEach(([key, c]) => {
    const div = document.createElement('div');
    div.className = 'crew-member' + (key === activeCrew ? ' active' : '');
    div.id = 'cm-' + containerId + '-' + key;
    div.onclick = () => selectCrew(key);
    div.innerHTML = `
      <div class="cm-avatar" style="${key===activeCrew?'border-color:'+c.color+';box-shadow:0 0 14px '+c.color+'40':''}" id="cma-${containerId}-${key}">
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
    pill.id = 'ccp-' + key;
    pill.style.cssText = key === activeCrew
      ? `background:${c.color}22;border-color:${c.color}60;color:${c.color}`
      : '';
    pill.onclick = () => selectCrew(key);
    pill.innerHTML = `<span class="cc-dot" style="background:${c.color}"></span>${c.name}`;
    strip.appendChild(pill);
  });
}

/* ── Select crew member ── */
function selectCrew(key) {
  const prev = activeCrew;
  activeCrew = key;
  const c = CREW[key];

  // Update greeting
  document.getElementById('greeting-avatar').textContent = c.emoji;
  document.getElementById('greeting-avatar').style.borderColor = c.color;
  document.getElementById('greeting-avatar').style.boxShadow = `0 0 12px ${c.color}50`;
  document.getElementById('greeting-title').textContent = `Good morning, Nakama!`;
  document.getElementById('greeting-sub').textContent = c.greet.replace(/^"|"$/g,'');
  document.getElementById('greeting-sub').style.color = c.color;

  // Refresh grids
  buildCrewGrid('crew-grid', false);
  buildCrewGrid('crew-grid-full', true);
  buildChatStrip();

  // Chat: add crew message + switch to chat
  addCrewMsg(c.name, c.greet.replace(/^"|"$/g,''), c.emoji, c.color);
  switchTab('chat');

  // Update input bar accent
  document.getElementById('ib-send').style.background = c.color;

  // Update CSS accent variable
  document.documentElement.style.setProperty('--accent', c.color);

  // ── Update character panel (right side of chat) ──
  updateCharPanel(key);
}

/* ── Switch sidebar view ── */
function switchView(view) {
  document.querySelectorAll('.sb-icon').forEach(b => b.classList.remove('active'));
  document.getElementById('sbi-' + view)?.classList.add('active');
  activeView = view;

  // Map sidebar views to tabs where applicable
  if (view === 'dashboard') switchTab('dashboard');
  else if (view === 'chat') switchTab('chat');
  else if (view === 'schedule') switchTab('schedule');
  else if (view === 'goals') switchTab('goals');
  else {
    // knowledge / crew — use own view panels
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + view)?.classList.add('active');
    // deactivate all tabs
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

  // Sync sidebar icon
  document.querySelectorAll('.sb-icon').forEach(b => b.classList.remove('active'));
  document.getElementById('sbi-' + tab)?.classList.add('active');

  // Build chat strip when switching to chat
  if (tab === 'chat') buildChatStrip();
}

/* ── Quick action ── */
function quickAction(tab, crewKey) {
  if (crewKey) selectCrew(crewKey);
  else switchTab(tab);
}

/* ── Chat messages ── */
function addCrewMsg(name, text, emoji, color) {
  const msgs = document.getElementById('chat-msgs');
  const div  = document.createElement('div');
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
  const msgs = document.getElementById('chat-msgs');
  const div  = document.createElement('div');
  div.className = 'msg user-msg';
  div.innerHTML = `
    <div class="msg-av" style="border-color:${CREW[activeCrew].color}40">👤</div>
    <div class="msg-body">
      <div class="msg-name">You</div>
      <div class="bubble">${text}</div>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chat-msgs');
  const div  = document.createElement('div');
  div.id = 'typing'; div.className = 'msg crew-msg typing-bubble';
  const c = CREW[activeCrew];
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

/* ── Input bar ── */
function ibSend() {
  const inp = document.getElementById('ib-input');
  const val = inp.value.trim();
  if (!val) return;
  switchTab('chat');
  addUserMsg(val);
  inp.value = '';
  showTyping();
  const delay = 800 + Math.random() * 600;
  setTimeout(() => {
    hideTyping();
    const c = CREW[activeCrew];
    const pool = REPLIES[activeCrew];
    addCrewMsg(c.name, pool[Math.floor(Math.random() * pool.length)], c.emoji, c.color);

    /* ── BACKEND INTEGRATION POINT ──
    fetch('http://localhost:8000/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+sessionStorage.getItem('jwt')},
      body: JSON.stringify({ message: val, character: activeCrew })
    })
    .then(r=>r.json())
    .then(data => {
      hideTyping();
      addCrewMsg(c.name, data.reply, c.emoji, c.color);
    });
    */
  }, delay);
}

function ibKey(e) { if (e.key === 'Enter') ibSend(); }
function ibMic()  { /* wire up Web Speech API */ }

/* ── Update right-side floating character image ── */
function updateCharPanel(key) {
  const c    = CREW[key];
  const wrap = document.getElementById('ccf-img');
  const glow = document.getElementById('ccf-glow');
  const nameEl  = document.getElementById('ccf-name');
  const emojiEl = document.getElementById('ccf-emoji');
  if (!wrap) return;

  // Name + glow color
  if (nameEl)  { nameEl.textContent = c.name.toUpperCase(); nameEl.style.color = c.color; nameEl.style.textShadow = `0 0 10px ${c.color}`; }
  if (glow)    { glow.style.background = `radial-gradient(ellipse at 50% 100%, ${c.color} -20%, transparent 65%)`; }

  // Update --accent so ::before/::after gradients stay in sync
  document.documentElement.style.setProperty('--accent', c.color);

  // Try loading assets/<key>.png
  const imgPath = `../assets/${key}.png`;
  let img = wrap.querySelector('img');

  if (!img) {
    img = document.createElement('img');
    wrap.appendChild(img);
  }

  img.style.opacity = '0';
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

  // Reset display before trying new src
  img.style.display = 'block';
  img.src = imgPath;

  // Always update emoji text as fallback
  if (emojiEl) emojiEl.textContent = c.emoji;
}

/* ── Init ── */
(function init() {
  buildCrewGrid('crew-grid', false);
  buildCrewGrid('crew-grid-full', true);
  buildChatStrip();
  document.getElementById('ib-send').style.background = CREW[activeCrew].color;
  updateCharPanel(activeCrew); // init character panel with Luffy
})();
