/* ============================================================================
   SomaAi v2.1 — Núcleo con dashboard mejorado
   ========================================================================== */

const state = {
  version: '2.1.0',
  platform: 'web',
  date: new Date().toISOString().slice(0, 10),
  water: 0,
  weight: 72.4,
  entries: [],
  profile: {
    name: 'Usuario', sex: 'f', age: 28, height: 168, weight: 72.4,
    imc: 25.6, activity: 'moderada', trainingDays: 3, goal: 'mantener',
    sport: 'ninguno', streak: 1, onboarded: false,
  },
  foods: [],
  foodsLoaded: false,
  foodsCount: 0,
  customFoods: [],
  currentTab: 'hoy',
  loadingDB: false,
  dbError: false,
  appReady: false,
};

function saveState() {
  try {
    localStorage.setItem('somaai_state', JSON.stringify({
      version: state.version, date: state.date, water: state.water,
      weight: state.weight, entries: state.entries, profile: state.profile,
      customFoods: state.customFoods,
    }));
  } catch (e) {}
}

function loadState() {
  try {
    const saved = localStorage.getItem('somaai_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date) state.date = parsed.date;
      if (parsed.water !== undefined) state.water = parsed.water;
      if (parsed.weight !== undefined) state.weight = parsed.weight;
      if (parsed.entries) state.entries = parsed.entries;
      if (parsed.customFoods) state.customFoods = parsed.customFoods;
      if (parsed.profile) {
        state.profile = { ...state.profile, ...parsed.profile };
        state.profile.weight = Number(state.profile.weight) || 72.4;
        state.profile.height = Number(state.profile.height) || 168;
        state.profile.age = Number(state.profile.age) || 28;
        state.profile.trainingDays = Number(state.profile.trainingDays) || 3;
        if (!state.profile.imc || isNaN(state.profile.imc)) {
          state.profile.imc = state.profile.weight / ((state.profile.height / 100) ** 2);
        }
      }
      if (state.profile.weight) state.weight = state.profile.weight;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (state.date !== today) {
      state.entries = []; state.water = 0; state.date = today; saveState();
    }
  } catch (e) {}
}

const DATABASES = [
  'data/database.json', 'data/db-marcas-lacteos.json', 'data/db-marcas-galletitas.json',
  'data/db-marcas-golosinas.json', 'data/db-marcas-snacks.json', 'data/db-marcas-congelados.json',
  'data/db-marcas-bebidas.json', 'data/db-marcas-panificados.json', 'data/db-marcas-comidas-rapidas.json',
];

async function loadAllDatabases() {
  if (state.foodsLoaded || state.loadingDB) return;
  state.loadingDB = true;
  state.dbError = false;
  const allFoods = [];
  for (const db of DATABASES) {
    try {
      const res = await fetch(db);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.foods && Array.isArray(data.foods)) allFoods.push(...data.foods);
    } catch (e) {}
  }
  if (allFoods.length === 0) {
    state.dbError = true;
    state.loadingDB = false;
    if (state.currentTab === 'hoy') render();
    return;
  }
  if (state.customFoods && state.customFoods.length) allFoods.push(...state.customFoods);
  state.foods = allFoods;
  state.foodsCount = allFoods.length;
  state.foodsLoaded = true;
  state.loadingDB = false;
  if (state.currentTab === 'hoy' || state.currentTab === 'buscar') render();
}

function calcTargets(profile) {
  const w = Number(profile.weight) || 72.4;
  const h = Number(profile.height) || 168;
  const a = Number(profile.age) || 28;
  const sex = profile.sex || 'f';
  const activity = profile.activity || 'moderada';
  const goal = profile.goal || 'mantener';
  const base = 10 * w + 6.25 * h - 5 * a;
  const tmb = Math.round(sex === 'm' ? base + 5 : base - 161);
  const act = { sedentaria: 1.2, ligera: 1.375, moderada: 1.55, alta: 1.725, atleta: 1.9 };
  const factor = act[activity] || 1.55;
  const tdee = tmb * factor;
  const adj = { perder: -0.15, mantener: 0, ganar: 0.15 };
  const targetKcal = Math.round(tdee * (1 + (adj[goal] || 0)));
  const ratio = goal === 'ganar' ? { p: 0.30, c: 0.45, f: 0.25 } : goal === 'perder' ? { p: 0.35, c: 0.35, f: 0.30 } : { p: 0.25, c: 0.50, f: 0.25 };
  return { kcal: targetKcal, p: Math.round(targetKcal * ratio.p / 4), c: Math.round(targetKcal * ratio.c / 4), f: Math.round(targetKcal * ratio.f / 9), water: Math.round(w * 35), tmb: tmb, tdee: Math.round(tdee), factor: factor };
}

function calcTotals(entries) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 };
  entries.forEach((e) => {
    const food = state.foods.find((f) => f.id === e.foodId) || e.food;
    if (!food) return;
    const k = (Number(e.grams) || 100) / 100;
    t.kcal += (Number(food.kcal) || 0) * k;
    t.p += (Number(food.p) || 0) * k;
    t.c += (Number(food.c) || 0) * k;
    t.f += (Number(food.f) || 0) * k;
  });
  return { kcal: Math.round(t.kcal), p: Math.round(t.p), c: Math.round(t.c), f: Math.round(t.f) };
}

function el(tag, props, children) {
  const node = document.createElement(tag);
  if (props) {
    Object.keys(props).forEach((k) => {
      try {
        if (k === 'style' && typeof props[k] === 'object') Object.assign(node.style, props[k]);
        else if (k === 'class') node.className = props[k];
        else if (k.startsWith('on') && typeof props[k] === 'function') node.addEventListener(k.slice(2).toLowerCase(), props[k]);
        else if (k === 'html') node.innerHTML = props[k];
        else if (k === 'text') node.textContent = props[k];
        else node.setAttribute(k, props[k]);
      } catch (e) {}
    });
  }
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach((c) => {
    if (c == null || c === false || c === true) return;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (typeof c === 'number') node.appendChild(document.createTextNode(String(c)));
    else if (c instanceof Node) node.appendChild(c);
    else { try { node.appendChild(document.createTextNode(String(c))); } catch (e) {} }
  });
  return node;
}

function ring(value, goal, label, color1, color2) {
  const pct = Math.min(100, Math.round(((value || 0) / (goal || 1)) * 100));
  const R = 42; const CIRC = 2 * Math.PI * R; const off = CIRC * (1 - pct / 100);
  const div = el('div', { class: 'ring' });
  div.innerHTML = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + R + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/><circle cx="50" cy="50" r="' + R + '" fill="none" stroke="url(#grad' + label + ')" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + CIRC + '" stroke-dashoffset="' + off + '" transform="rotate(-90 50 50)" style="transition:stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)"/><defs><linearGradient id="grad' + label + '"><stop offset="0%" stop-color="' + color1 + '"/><stop offset="100%" stop-color="' + color2 + '"/></linearGradient></defs></svg><div style="position:absolute;inset:0;display:grid;place-items:center"><div style="text-align:center"><div class="mono" style="font-size:16px;font-weight:800">' + (value || 0) + '</div><div class="muted2" style="font-size:9px;text-transform:uppercase">' + label + '</div></div></div>';
  return div;
}

function miniStat(label, value, color) {
  return '<div style="padding:10px;border-radius:12px;background:var(--surface);border:1px solid var(--border);text-align:center"><div class="muted2" style="font-size:10px;text-transform:uppercase">' + label + '</div><div class="mono" style="font-size:14px;font-weight:800;color:' + color + ';margin-top:4px">' + (value || '0') + '</div></div>';
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function renderSkeleton() {
  return '<div class="card card-pad fade-in-up" style="margin-bottom:16px"><div class="skel" style="height:16px;width:40%;margin-bottom:12px"></div><div class="skel" style="height:40px;width:80%;margin-bottom:12px"></div><div class="skel" style="height:12px;width:60%"></div></div><div class="card card-pad fade-in-up" style="margin-bottom:16px"><div class="skel" style="height:80px;width:100%"></div></div><div class="card card-pad fade-in-up"><div class="skel" style="height:60px;width:100%"></div></div>';
}

/* ------------------------- DASHBOARD HOY MEJORADO ------------------------- */
function renderHoy() {
  const targets = calcTargets(state.profile);
  const totals = calcTotals(state.entries);
  const waterPct = Math.min(100, Math.round((state.water / targets.water) * 100));
  const remaining = targets.kcal - totals.kcal;
  const kcalPct = Math.min(100, Math.round(totals.kcal / targets.kcal * 100));
  const wrap = el('div', { class: 'stack fade-in' });

  // Saludo
  const greeting = el('div', { class: 'fade-in-up' });
  const hour = new Date().getHours();
  const greetingText = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  greeting.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><div><div class="muted2" style="font-size:12px;font-weight:600">' + greetingText + ',</div><div class="h2" style="margin-top:2px">' + escapeHtml(state.profile.name || 'Usuario') + ' 👋</div></div><span class="pill green" style="font-size:10px">🔥 ' + (state.profile.streak || 1) + ' días</span></div>';
  wrap.appendChild(greeting);

  // Card 1: Progreso principal
  const card1 = el('div', { class: 'card card-pad fade-in-up' });
  card1.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
      '<div style="flex:1">' +
        '<div class="eyebrow">Objetivo diario</div>' +
        '<div class="h1" style="margin-top:4px;font-size:36px">' + totals.kcal + '<span class="muted" style="font-size:16px;font-weight:600"> / ' + targets.kcal + '</span></div>' +
        '<div style="font-size:12px;margin-top:6px">' +
          (remaining > 0
            ? '<span class="muted">Te quedan </span><strong style="color:var(--green)">' + remaining + ' kcal</strong>'
            : '<strong style="color:var(--pink)">Superaste ' + Math.abs(remaining) + ' kcal</strong>') +
        '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div class="mono" style="font-size:24px;font-weight:800;color:var(--green)">' + kcalPct + '%</div>' +
        '<div class="muted2" style="font-size:10px">del objetivo</div>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:20px;position:relative;height:12px;border-radius:999px;background:var(--surface);overflow:hidden;border:1px solid var(--border)">' +
      '<div style="position:absolute;top:0;left:0;bottom:0;width:' + kcalPct + '%;background:linear-gradient(90deg,var(--green),var(--cyan),var(--pink));border-radius:999px;transition:width .8s cubic-bezier(0.4,0,0.2,1)"></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px" class="muted2">' +
      '<span>0</span><span>' + targets.kcal + ' kcal</span>' +
    '</div>';
  wrap.appendChild(card1);

  // Card 2: Anillos de macros
  const card2 = el('div', { class: 'card card-pad fade-in-up' });
  card2.innerHTML = '<div class="eyebrow" style="margin-bottom:16px">Macros del día</div>';
  const rings = el('div', { class: 'grid g-4', style: { gap: '8px' } });
  rings.appendChild(ring(totals.p, targets.p, 'Prot', '#00ff88', '#00e07a'));
  rings.appendChild(ring(totals.c, targets.c, 'Carb', '#06b6d4', '#8b5cf6'));
  rings.appendChild(ring(totals.f, targets.f, 'Grasa', '#ec4899', '#f59e0b'));
  rings.appendChild(ring(totals.kcal, targets.kcal, 'Kcal', '#00ff88', '#06b6d4'));
  card2.appendChild(rings);
  wrap.appendChild(card2);

  // Card 3: Stats resumen
  const w = Number(state.profile.weight) || 72.4;
  const statsCard = el('div', { class: 'card card-pad fade-in-up' });
  const statsGrid = el('div', { class: 'grid g-3', style: { gap: '8px' } });
  statsGrid.innerHTML =
    miniStat('P / kg', (totals.p / w).toFixed(2), 'var(--green)') +
    miniStat('Proteína', targets.p + 'g', 'var(--cyan)') +
    miniStat('Adherencia', Math.round(Math.max(0, 100 - Math.abs(remaining) / targets.kcal * 100)) + '%', 'var(--amber)');
  statsCard.appendChild(statsGrid);
  wrap.appendChild(statsCard);

  // Acciones rápidas
  const quickCard = el('div', { class: 'card card-pad fade-in-up' });
  quickCard.innerHTML =
    '<div class="eyebrow">⚡ Acciones rápidas</div>' +
    '<div class="quick-actions">' +
      '<button class="quick-action" id="qa-search"><div class="quick-action-icon">🔍</div><div class="quick-action-label">Buscar</div></button>' +
      '<button class="quick-action" id="qa-camera"><div class="quick-action-icon">📷</div><div class="quick-action-label">Escanear</div></button>' +
      '<button class="quick-action" id="qa-water"><div class="quick-action-icon">💧</div><div class="quick-action-label">+250ml</div></button>' +
      '<button class="quick-action" id="qa-manual"><div class="quick-action-icon">✏️</div><div class="quick-action-label">Manual</div></button>' +
    '</div>';
  wrap.appendChild(quickCard);

  // Estadísticas semanales
  if (window.SomaAiFeatures) {
    const weekCard = el('div', { class: 'card card-pad fade-in-up' });
    weekCard.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><div class="eyebrow">📈 Última semana</div><span class="muted2" style="font-size:10px">kcal/día</span></div>' + window.SomaAiFeatures.renderWeekChart();
    wrap.appendChild(weekCard);

    // Logros
    const achCard = el('div', { class: 'card card-pad fade-in-up' });
    achCard.innerHTML = window.SomaAiFeatures.renderAchievements();
    wrap.appendChild(achCard);
  }

  // Card 4: Distribución del día
  if (state.entries.length > 0) {
    const meals = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'];
    const mealEmojis = { desayuno: '🌅', almuerzo: '☀️', merienda: '🍵', cena: '🌙', snack: '🍿' };
    const byMeal = {}; meals.forEach(m => byMeal[m] = []);
    state.entries.forEach(e => { const meal = e.meal || 'snack'; if (!byMeal[meal]) byMeal[meal] = []; byMeal[meal].push(e); });
    const distCard = el('div', { class: 'card card-pad fade-in-up' });
    let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div class="eyebrow">🍽️ Comidas de hoy</div><button class="btn btn-ghost btn-sm" id="clear-day" style="font-size:10px;height:28px">🗑️ Vaciar</button></div>';
    meals.forEach(meal => {
      const items = byMeal[meal]; if (items.length === 0) return;
      const mealKcal = items.reduce((sum, e) => { const food = state.foods.find(f => f.id === e.foodId) || e.food; return sum + ((food?.kcal || 0) * (e.grams || 100) / 100); }, 0);
      html += '<div style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-size:13px;font-weight:700">' + mealEmojis[meal] + ' ' + meal.charAt(0).toUpperCase() + meal.slice(1) + '</span><span class="mono" style="font-size:12px;font-weight:700;color:var(--green)">' + Math.round(mealKcal) + ' kcal</span></div>';
      items.forEach((e) => {
        const food = state.foods.find(f => f.id === e.foodId) || e.food;
        if (!food) return;
        const entryIdx = state.entries.indexOf(e);
        html += '<div class="entry-row" data-edit-idx="' + entryIdx + '" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=\'rgba(255,255,255,0.03)\'" onmouseout="this.style.background=\'transparent\'"><div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1"><div style="width:36px;height:36px;border-radius:10px;background:var(--surface);display:grid;place-items:center;font-size:16px;flex-shrink:0">' + (food.emoji || '🍽️') + '</div><div style="min-width:0;flex:1"><div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(food.name) + '</div><div class="muted2" style="font-size:10px">' + e.grams + 'g · ' + (food.p || 0) + 'g prot</div></div></div><div style="display:flex;align-items:center;gap:6px"><span class="mono" style="font-size:12px;font-weight:700;color:var(--green)">' + Math.round((food.kcal || 0) * e.grams / 100) + '</span><button class="icon-btn" data-edit-idx="' + entryIdx + '" style="width:28px;height:28px;font-size:12px;color:var(--muted)">✏️</button></div></div>';
      });
      html += '</div>';
    });
    distCard.innerHTML = html;
    wrap.appendChild(distCard);
    setTimeout(() => {
      document.querySelectorAll('[data-edit-idx]').forEach(btn => {
        btn.onclick = (ev) => {
          ev.stopPropagation();
          if (window.SomaAiFeatures) window.SomaAiFeatures.editEntry(parseInt(btn.dataset.editIdx));
        };
      });
      const clearDay = document.getElementById('clear-day');
      if (clearDay) clearDay.onclick = () => { showConfirm('¿Vaciar el día?', 'Se eliminarán todos los alimentos de hoy.', () => { state.entries = []; saveState(); render(); toast('🗑️ Día vaciado'); }); };
    }, 50);
  } else {
    // Estado vacío
    const emptyCard = el('div', { class: 'card card-pad fade-in-up', style: { textAlign: 'center', padding: '32px 20px' } });
    emptyCard.innerHTML = '<div style="font-size:64px">🍽️</div><div class="h2" style="margin-top:16px">Todavía no cargaste nada</div><div class="muted" style="font-size:13px;margin-top:8px;line-height:1.5">Agregá tu primer alimento para empezar el día.</div><div style="display:flex;flex-direction:column;gap:8px;margin-top:20px"><button class="btn btn-primary" id="empty-search" style="width:100%">🔍 Buscar alimento</button><button class="btn btn-ghost" id="empty-camera" style="width:100%">📷 Escanear con cámara</button><button class="btn btn-ghost" id="empty-manual" style="width:100%">✏️ Agregar manualmente</button></div>';
    wrap.appendChild(emptyCard);
    setTimeout(() => {
      const es = document.getElementById('empty-search');
      if (es) es.onclick = () => { haptic(); state.currentTab = 'buscar'; render(); };
      const ec = document.getElementById('empty-camera');
      if (ec) ec.onclick = () => { haptic(); state.currentTab = 'camara'; render(); };
      const em = document.getElementById('empty-manual');
      if (em) em.onclick = () => { haptic(); if (window.SomaAiSearch && window.SomaAiSearch.showManual) window.SomaAiSearch.showManual(); else { state.currentTab = 'buscar'; render(); } };
    }, 50);
  }

  // Card 5: Hidratación y peso
  const row = el('div', { class: 'grid g-2 fade-in-up', style: { gap: '12px' } });
  const waterCard = el('div', { class: 'card card-pad' });
  const cups = Math.round(state.water / 250);
  waterCard.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div class="eyebrow">💧 Hidratación</div>' +
      '<span class="pill cyan" style="font-size:10px">' + cups + ' vasos</span>' +
    '</div>' +
    '<div style="text-align:center;margin-top:12px">' +
      '<div class="mono" style="font-size:36px;font-weight:800;line-height:1">' + state.water + '</div>' +
      '<div class="muted2" style="font-size:11px;margin-top:2px">de ' + targets.water + ' ml</div>' +
    '</div>' +
    '<div style="margin-top:16px;position:relative;height:8px;border-radius:999px;background:var(--surface);overflow:hidden;border:1px solid var(--border)">' +
      '<div style="position:absolute;top:0;left:0;bottom:0;width:' + waterPct + '%;background:linear-gradient(90deg,var(--cyan),var(--violet));transition:width .4s ease;border-radius:999px"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:16px;justify-content:center">' +
      '<button class="water-btn" data-water="250" title="+1 vaso">' +
        '<div style="font-size:20px">💧</div>' +
        '<div style="font-size:9px;font-weight:700;margin-top:2px">+250</div>' +
      '</button>' +
      '<button class="water-btn" data-water="500" title="+2 vasos">' +
        '<div style="font-size:20px">💧</div>' +
        '<div style="font-size:9px;font-weight:700;margin-top:2px">+500</div>' +
      '</button>' +
      '<button class="water-btn water-btn-reset" data-water-reset title="Reset">' +
        '<div style="font-size:20px">↺</div>' +
        '<div style="font-size:9px;font-weight:700;margin-top:2px">0</div>' +
      '</button>' +
    '</div>';
  row.appendChild(waterCard);

  const weightCard = el('div', { class: 'card card-pad' });
  const imcVal = Number(state.profile.imc) || 0;
  const imcCat = imcVal < 18.5 ? 'Bajo peso' : imcVal < 25 ? 'Normal' : imcVal < 30 ? 'Sobrepeso' : 'Obesidad';
  weightCard.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center"><div class="eyebrow">⚖️ Peso</div><span class="pill green" style="font-size:10px">IMC ' + imcVal.toFixed(1) + '</span></div>' +
    '<div style="margin-top:12px;text-align:center;padding:12px 0">' +
      '<div class="mono" style="font-size:36px;font-weight:800;line-height:1">' + (Number(state.weight) || 72.4).toFixed(1) + '</div>' +
      '<div class="muted2" style="font-size:11px;margin-top:4px">kg · ' + imcCat + '</div>' +
    '</div>' +
    '<button class="btn btn-ghost btn-sm" id="weight-edit" style="width:100%;font-size:11px">✎ Actualizar</button>';
  row.appendChild(weightCard);
  wrap.appendChild(row);

  setTimeout(() => {
    document.querySelectorAll('[data-water]').forEach((b) => { b.onclick = () => { haptic(); state.water += parseInt(b.dataset.water); saveState(); render(); }; });
    const resetWater = document.querySelector('[data-water-reset]');
    if (resetWater) resetWater.onclick = () => { haptic(); state.water = 0; saveState(); render(); };
    // Handlers de acciones rápidas
    const qaSearch = document.getElementById('qa-search');
    if (qaSearch) qaSearch.onclick = () => { haptic(); state.currentTab = 'buscar'; render(); };
    const qaCamera = document.getElementById('qa-camera');
    if (qaCamera) qaCamera.onclick = () => { haptic(); state.currentTab = 'camara'; render(); };
    const qaWater = document.getElementById('qa-water');
    if (qaWater) qaWater.onclick = () => { haptic(); state.water += 250; saveState(); render(); toast('💧 +250ml'); };
    const qaManual = document.getElementById('qa-manual');
    if (qaManual) qaManual.onclick = () => { haptic(); if (window.SomaAiSearch && window.SomaAiSearch.showManual) window.SomaAiSearch.showManual(); else { state.currentTab = 'buscar'; render(); } };

    const weightEdit = document.getElementById('weight-edit');
    if (weightEdit) weightEdit.onclick = () => {
      haptic();
      const newWeight = prompt('Nuevo peso (kg):', state.weight);
      if (newWeight && !isNaN(newWeight)) {
        state.weight = parseFloat(newWeight); state.profile.weight = state.weight;
        state.profile.imc = state.weight / ((state.profile.height / 100) ** 2);
        if (!state.profile.weightHistory) state.profile.weightHistory = [];
        state.profile.weightHistory.push({ date: new Date().toISOString().slice(0, 10), kg: state.weight });
        saveState(); render(); toast('✅ Peso actualizado');
      }
    };
  }, 50);

  return wrap;
}

function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:1000;display:grid;place-items:center;padding:24px;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:20px;padding:24px;max-width:340px;width:100%;transform:scale(.9);transition:transform .3s cubic-bezier(.34,1.56,.64,1)';
  modal.innerHTML = '<div class="h2">' + title + '</div><div class="muted" style="font-size:13px;margin-top:8px;line-height:1.5">' + message + '</div><div style="display:flex;gap:8px;margin-top:20px"><button class="btn btn-ghost" id="modal-cancel" style="flex:1">Cancelar</button><button class="btn btn-primary" id="modal-confirm" style="flex:1">Confirmar</button></div>';
  overlay.appendChild(modal); document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'scale(1)'; }, 10);
  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'scale(.9)'; setTimeout(() => overlay.remove(), 200); };
  modal.querySelector('#modal-cancel').onclick = close;
  modal.querySelector('#modal-confirm').onclick = () => { close(); onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
}

function toast(message) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(20,20,25,.95);color:#fff;padding:12px 20px;border-radius:999px;font-size:13px;font-weight:600;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);z-index:1000;opacity:0;transition:all .3s;max-width:90%;text-align:center';
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; setTimeout(() => t.remove(), 300); }, 2500);
}

function haptic() { if (navigator.vibrate) navigator.vibrate(10); }

function render() {
  const root = document.getElementById('app-root');
  if (!root) return;
  if (!state.profile.onboarded) {
    if (window.SomaAiOnboarding && window.SomaAiOnboarding.render) {
      window.SomaAiOnboarding.render();
    }
    return;
  }
  root.innerHTML = '';
  const app = el('div', { class: 'app' });
  const header = el('header', { class: 'top' });
  header.innerHTML = '<div class="grad-line"></div><div class="container"><div class="row"><div class="logo"><div class="mark">S</div><div><div class="name">SomaAi</div><div class="sub">NUTRICIÓN INTELIGENTE</div></div></div><div class="top-actions"><button class="icon-btn" id="header-theme" title="Cambiar tema">🌙</button><button class="icon-btn" id="header-perfil">👤</button></div></div></div>';
  app.appendChild(header);

  const main = el('main');
  main.style.cssText = 'padding-top:16px;padding-bottom:100px;overflow-y:auto;height:calc(100dvh - 65px)';
  const container = el('div', { class: 'container' });

  if (state.currentTab === 'hoy') {
    if (state.loadingDB) container.innerHTML = renderSkeleton();
    else if (state.dbError) {
      container.innerHTML = '<div class="card card-pad" style="text-align:center;padding:40px 20px"><div style="font-size:48px">⚠️</div><div class="h2" style="margin-top:16px">Error al cargar</div><div class="muted" style="font-size:13px;margin-top:8px">No se pudieron cargar las bases de datos.</div><button class="btn btn-primary" id="retry-db" style="margin-top:20px">Reintentar</button></div>';
      setTimeout(() => { const r = document.getElementById('retry-db'); if (r) r.onclick = () => { state.foodsLoaded = false; state.dbError = false; state.loadingDB = false; loadAllDatabases(); }; }, 50);
    } else {
      container.appendChild(renderHoy());
    }
  } else if (state.currentTab === 'buscar' && window.SomaAiSearch) {
    container.appendChild(window.SomaAiSearch.render());
  } else if (state.currentTab === 'camara' && window.SomaAiCamera) {
    container.appendChild(window.SomaAiCamera.render());
  } else if (state.currentTab === 'perfil' && window.SomaAiProfile) {
    container.appendChild(window.SomaAiProfile.render());
  }
  main.appendChild(container); app.appendChild(main);

  const nav = el('nav');
  nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(10,10,11,.95);backdrop-filter:blur(20px);border-top:1px solid var(--border);padding-bottom:var(--safe-bottom);z-index:50';
  const tabs = [
    { id: 'hoy', icon: '🏠', label: 'Hoy' }, { id: 'buscar', icon: '🔍', label: 'Buscar' },
    { id: 'camara', icon: '📷', label: 'Cámara' }, { id: 'perfil', icon: '👤', label: 'Perfil' },
  ];
  const navRow = el('div', { class: 'container' });
  navRow.style.cssText = 'display:flex;justify-content:space-around;padding:8px 0';
  tabs.forEach(tab => {
    const isActive = state.currentTab === tab.id;
    const btn = el('button');
    btn.className = 'nav-btn' + (isActive ? ' active' : '');
    btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px;border-radius:12px;min-width:60px';
    btn.innerHTML = '<span style="font-size:20px' + (isActive ? ';transform:scale(1.1)' : '') + '">' + tab.icon + '</span><span style="font-size:10px;font-weight:700;color:' + (isActive ? 'var(--green)' : 'var(--muted)') + '">' + tab.label + '</span>';
    btn.onclick = () => { haptic(); state.currentTab = tab.id; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    navRow.appendChild(btn);
  });
  nav.appendChild(navRow); app.appendChild(nav); root.appendChild(app);

  const headerPerfil = document.getElementById('header-perfil');
  if (headerPerfil) headerPerfil.onclick = () => { haptic(); state.currentTab = 'perfil'; render(); };
  const headerTheme = document.getElementById('header-theme');
  if (headerTheme) {
    // Actualizar icono según el tema actual
    const currentTheme = localStorage.getItem('somaai_theme') || 'dark';
    headerTheme.textContent = currentTheme === 'light' ? '☀️' : '🌙';
    headerTheme.onclick = () => {
      haptic();
      const theme = localStorage.getItem('somaai_theme') || 'dark';
      const newTheme = theme === 'light' ? 'dark' : 'light';
      if (window.SomaAiFeatures) window.SomaAiFeatures.setTheme(newTheme);
      render();
      toast(newTheme === 'light' ? '☀️ Modo claro' : '🌙 Modo oscuro');
    };
  }
}

window.SomaAi = {
  state, saveState, loadState, loadAllDatabases,
  calcTargets, calcTotals, el, render, renderHoy,
  toast, haptic, escapeHtml, showConfirm,
};

async function init() {
  try {
    loadState();
    if (window.SomaAiFeatures) window.SomaAiFeatures.init();
    loadAllDatabases();
    if (state.profile.onboarded) {
      render();
    } else {
      let tries = 0;
      const waitOnboarding = setInterval(() => {
        tries++;
        if (window.SomaAiOnboarding && window.SomaAiOnboarding.render) {
          clearInterval(waitOnboarding);
          try {
            window.SomaAiOnboarding.loadConfig().then(() => {
              window.SomaAiOnboarding.render();
            });
          } catch (e) { console.error('Error onboarding:', e); }
        } else if (tries > 100) { clearInterval(waitOnboarding); }
      }, 50);
    }
  } catch (e) { console.error('Error init:', e); }
}

init();
