/* ============================================================================
   SomaAi v1.3 — Núcleo Estable
   - Guardado de datos robusto
   - Cálculo de macros exacto
   - Sin bugs de scroll
   ========================================================================== */

const state = {
  version: '1.3.0',
  platform: 'web',
  date: new Date().toISOString().slice(0, 10),
  water: 0,
  weight: 72.4,
  entries: [],
  profile: {
    name: 'Usuario',
    sex: 'f',
    age: 28,
    height: 168,
    weight: 72.4,
    imc: 25.6,
    activity: 'moderada',
    trainingDays: 3,
    goal: 'mantener',
    sport: 'ninguno',
    streak: 1,
    onboarded: false,
  },
  foods: [],
  foodsLoaded: false,
  foodsCount: 0,
  customFoods: [],
};

/* ------------------------- Persistencia Robusta ------------------------- */
function saveState() {
  try {
    const toSave = {
      version: state.version,
      date: state.date,
      water: state.water,
      weight: state.weight,
      entries: state.entries,
      profile: state.profile,
      customFoods: state.customFoods,
    };
    localStorage.setItem('somaai_state', JSON.stringify(toSave));
    console.log('[SomaAi] Estado guardado correctamente');
  } catch (e) {
    console.error('[SomaAi] Error al guardar estado:', e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem('somaai_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Cargar propiedades básicas
      if (parsed.date) state.date = parsed.date;
      if (parsed.water !== undefined) state.water = parsed.water;
      if (parsed.weight !== undefined) state.weight = parsed.weight;
      if (parsed.entries) state.entries = parsed.entries;
      if (parsed.customFoods) state.customFoods = parsed.customFoods;
      
      // Cargar perfil con validación
      if (parsed.profile) {
        state.profile = { ...state.profile, ...parsed.profile };
        // Asegurar que los números sean números
        state.profile.weight = Number(state.profile.weight) || 72.4;
        state.profile.height = Number(state.profile.height) || 168;
        state.profile.age = Number(state.profile.age) || 28;
        state.profile.trainingDays = Number(state.profile.trainingDays) || 3;
        
        // Recalcular IMC si no existe
        if (!state.profile.imc || isNaN(state.profile.imc)) {
          state.profile.imc = state.profile.weight / ((state.profile.height / 100) ** 2);
        }
      }
      
      // Sincronizar peso
      if (state.profile.weight) state.weight = state.profile.weight;
      
      console.log('[SomaAi] Estado cargado:', state.profile.name);
    }
    
    // Reset diario
    const today = new Date().toISOString().slice(0, 10);
    if (state.date !== today) {
      state.entries = [];
      state.water = 0;
      state.date = today;
      saveState();
    }
  } catch (e) {
    console.error('[SomaAi] Error al cargar estado:', e);
  }
}

/* ------------------------- Carga de Bases de Datos ------------------------- */
const DATABASES = [
  './data/database.json',
  './data/db-marcas-lacteos.json',
  './data/db-marcas-galletitas.json',
  './data/db-marcas-golosinas.json',
  './data/db-marcas-snacks.json',
  './data/db-marcas-congelados.json',
  './data/db-marcas-bebidas.json',
  './data/db-marcas-panificados.json',
  './data/db-marcas-comidas-rapidas.json',
];

async function loadAllDatabases() {
  const allFoods = [];
  let loadedCount = 0;
  
  for (const db of DATABASES) {
    try {
      const res = await fetch(db);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.foods && Array.isArray(data.foods)) {
        allFoods.push(...data.foods);
        loadedCount++;
      }
    } catch (e) {
      console.warn('[SomaAi] No se pudo cargar:', db);
    }
  }
  
  // Agregar alimentos personalizados
  if (state.customFoods && state.customFoods.length) {
    allFoods.push(...state.customFoods);
  }
  
  state.foods = allFoods;
  state.foodsCount = allFoods.length;
  state.foodsLoaded = true;
  console.log(`[SomaAi] ${loadedCount} bases cargadas, ${state.foodsCount} alimentos totales`);
}

/* ------------------------- Cálculos Exactos ------------------------- */
function calcTargets(profile) {
  const w = Number(profile.weight) || 72.4;
  const h = Number(profile.height) || 168;
  const a = Number(profile.age) || 28;
  const sex = profile.sex || 'f';
  const activity = profile.activity || 'moderada';
  const goal = profile.goal || 'mantener';
  const sport = profile.sport || 'ninguno';

  // TMB Mifflin-St Jeor
  const base = 10 * w + 6.25 * h - 5 * a;
  const tmb = Math.round(sex === 'm' ? base + 5 : base - 161);

  // Factor de actividad
  const act = { sedentaria: 1.2, ligera: 1.375, moderada: 1.55, alta: 1.725, atleta: 1.9 };
  const factor = act[activity] || 1.55;
  const tdee = tmb * factor;

  // Ajuste por objetivo
  const adj = { perder: -0.15, mantener: 0, ganar: 0.15 };
  const targetKcal = Math.round(tdee * (1 + (adj[goal] || 0)));

  // Distribución de macros (ISSN)
  const ratio = goal === 'ganar' ? { p: 0.30, c: 0.45, f: 0.25 }
              : goal === 'perder' ? { p: 0.35, c: 0.35, f: 0.30 }
              : { p: 0.25, c: 0.50, f: 0.25 };

  return {
    kcal: targetKcal,
    p: Math.round(targetKcal * ratio.p / 4),
    c: Math.round(targetKcal * ratio.c / 4),
    f: Math.round(targetKcal * ratio.f / 9),
    water: Math.round(w * 35),
    tmb: tmb,
    tdee: Math.round(tdee),
    factor: factor,
  };
}

function calcTotals(entries) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, na: 0 };
  entries.forEach((e) => {
    const food = state.foods.find((f) => f.id === e.foodId) || e.food;
    if (!food) return;
    const k = (Number(e.grams) || 100) / 100;
    t.kcal += (Number(food.kcal) || 0) * k;
    t.p += (Number(food.p) || 0) * k;
    t.c += (Number(food.c) || 0) * k;
    t.f += (Number(food.f) || 0) * k;
    t.fib += (Number(food.fib) || 0) * k;
    t.sug += (Number(food.sug) || 0) * k;
    t.na += (Number(food.na) || 0) * k;
  });
  return {
    kcal: Math.round(t.kcal),
    p: Math.round(t.p),
    c: Math.round(t.c),
    f: Math.round(t.f),
    fib: Math.round(t.fib),
    sug: Math.round(t.sug),
    na: Math.round(t.na),
  };
}

/* ------------------------- DOM Helpers ------------------------- */
function el(tag, props, children) {
  const node = document.createElement(tag);
  if (props) {
    Object.keys(props).forEach((k) => {
      if (k === 'style' && typeof props[k] === 'object') Object.assign(node.style, props[k]);
      else if (k === 'class') node.className = props[k];
      else if (k.startsWith('on') && typeof props[k] === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), props[k]);
      } else if (k === 'html') node.innerHTML = props[k];
      else if (k === 'text') node.textContent = props[k];
      else node.setAttribute(k, props[k]);
    });
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function ring(value, goal, label, color1, color2) {
  const pct = Math.min(100, Math.round((value / (goal || 1)) * 100));
  const R = 42;
  const CIRC = 2 * Math.PI * R;
  const off = CIRC * (1 - pct / 100);
  const div = el('div', { class: 'ring' });
  div.innerHTML =
    '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="' + R + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>' +
      '<circle cx="50" cy="50" r="' + R + '" fill="none" stroke="url(#grad' + label + ')" stroke-width="6" ' +
        'stroke-linecap="round" stroke-dasharray="' + CIRC + '" stroke-dashoffset="' + off + '" ' +
        'transform="rotate(-90 50 50)"/>' +
      '<defs><linearGradient id="grad' + label + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="' + color1 + '"/>' +
        '<stop offset="100%" stop-color="' + color2 + '"/>' +
      '</linearGradient></defs>' +
    '</svg>' +
    '<div style="position:absolute;inset:0;display:grid;place-items:center">' +
      '<div style="text-align:center">' +
        '<div class="mono" style="font-size:16px;font-weight:800">' + value + '</div>' +
        '<div class="muted2" style="font-size:9px;text-transform:uppercase">' + label + '</div>' +
      '</div>' +
    '</div>';
  return div;
}

function miniStat(label, value, color) {
  return '<div style="padding:10px;border-radius:12px;background:var(--surface);border:1px solid var(--border);text-align:center">' +
    '<div class="muted2" style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em">' + label + '</div>' +
    '<div class="mono" style="font-size:14px;font-weight:800;color:' + color + ';margin-top:4px">' + value + '</div>' +
  '</div>';
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

/* ------------------------- Vista HOY (Mejorada) ------------------------- */
function renderHoy() {
  const targets = calcTargets(state.profile);
  const totals = calcTotals(state.entries);
  const waterPct = Math.min(100, Math.round((state.water / targets.water) * 100));
  const weightDisplay = (Number(state.weight) || 72.4).toFixed(1);
  const wrap = el('div', { class: 'stack' });

  // Card 1: Objetivo diario
  const card1 = el('div', { class: 'card card-pad fade-in-up' });
  card1.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">' +
      '<div>' +
        '<div class="eyebrow">Objetivo diario</div>' +
        '<div class="h1" style="margin-top:4px">' +
          totals.kcal + ' <span class="muted" style="font-size:16px;font-weight:600">/ ' + targets.kcal + ' kcal</span>' +
        '</div>' +
        '<div class="muted" style="font-size:12px;margin-top:6px">' +
          (targets.kcal - totals.kcal > 0
            ? 'Te quedan <strong style="color:var(--green)">' + (targets.kcal - totals.kcal) + '</strong> kcal'
            : '<strong style="color:var(--pink)">Superaste ' + Math.abs(targets.kcal - totals.kcal) + ' kcal</strong>') +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">' +
        '<span class="pill">🔥 ' + (state.profile.streak || 1) + ' días</span>' +
        '<span class="pill green">✓ ' + escapeHtml(state.profile.name || 'Usuario') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="bar" style="margin-top:20px;height:10px">' +
      '<i style="width:' + Math.min(100, totals.kcal / targets.kcal * 100) + '%;' +
      'background:linear-gradient(90deg,var(--green),var(--cyan),var(--pink))"></i>' +
    '</div>';
  wrap.appendChild(card1);

  // Card 2: Anillos de macros
  const card2 = el('div', { class: 'card card-pad fade-in-up' });
  const rings = el('div', { class: 'grid g-4', style: { gap: '8px' } });
  rings.appendChild(ring(totals.kcal, targets.kcal, 'kcal', '#00ff88', '#06b6d4'));
  rings.appendChild(ring(totals.p, targets.p, 'prot', '#00ff88', '#00ff88'));
  rings.appendChild(ring(totals.c, targets.c, 'carb', '#06b6d4', '#8b5cf6'));
  rings.appendChild(ring(totals.f, targets.f, 'grasa', '#ec4899', '#f59e0b'));
  card2.appendChild(rings);

  const w = Number(state.profile.weight) || 72.4;
  const pPerKg = (totals.p / w).toFixed(2);
  const stats = el('div', { class: 'grid g-3', style: { marginTop: '16px', gap: '8px' } });
  stats.appendChild(miniStat('P / kg', pPerKg, 'var(--green)'));
  stats.appendChild(miniStat('Proteína obj.', targets.p + 'g', 'var(--cyan)'));
  stats.appendChild(miniStat('Adherencia', Math.round(Math.max(0, 100 - Math.abs(totals.kcal - targets.kcal) / targets.kcal * 100)) + '%', 'var(--amber)'));
  card2.appendChild(stats);
  wrap.appendChild(card2);

  // Card 3: Distribución del día
  if (state.entries.length > 0) {
    const distCard = el('div', { class: 'card card-pad fade-in-up' });
    const meals = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'];
    const mealEmojis = { desayuno: '🌅', almuerzo: '☀️', merienda: '🍵', cena: '🌙', snack: '🍿' };
    const byMeal = {};
    meals.forEach(m => byMeal[m] = []);
    state.entries.forEach(e => {
      const meal = e.meal || 'snack';
      if (!byMeal[meal]) byMeal[meal] = [];
      byMeal[meal].push(e);
    });

    let distHtml = '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div class="eyebrow">🍽️ Distribución del día</div>' +
      '<span class="pill cyan" style="font-size:10px">' + state.entries.length + ' items</span>' +
    '</div>';

    meals.forEach(meal => {
      const items = byMeal[meal];
      if (items.length === 0) return;
      const mealKcal = items.reduce((sum, e) => {
        const food = state.foods.find(f => f.id === e.foodId) || e.food;
        return sum + ((food?.kcal || 0) * (e.grams || 100) / 100);
      }, 0);
      distHtml += '<div style="margin-top:14px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<span style="font-size:13px;font-weight:700">' + mealEmojis[meal] + ' ' + meal.charAt(0).toUpperCase() + meal.slice(1) + '</span>' +
          '<span class="mono" style="font-size:12px;font-weight:700;color:var(--green)">' + Math.round(mealKcal) + ' kcal</span>' +
        '</div>';
      items.forEach(e => {
        const food = state.foods.find(f => f.id === e.foodId) || e.food;
        if (!food) return;
        distHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">' +
          '<span style="font-size:12px">' + escapeHtml(food.name) + ' <span class="muted2">' + e.grams + 'g</span></span>' +
          '<span class="mono" style="font-size:11px;color:var(--muted)">' + Math.round((food.kcal || 0) * e.grams / 100) + ' kcal</span>' +
        '</div>';
      });
      distHtml += '</div>';
    });

    distCard.innerHTML = distHtml;
    wrap.appendChild(distCard);
  }

  // Card 4: Hidratación y Peso
  const row = el('div', { class: 'grid g-2 fade-in-up', style: { gap: '16px' } });

  const waterCard = el('div', { class: 'card card-pad' });
  waterCard.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div class="eyebrow">💧 Hidratación</div>' +
      '<span class="pill cyan" style="font-size:10px">' + waterPct + '%</span>' +
    '</div>' +
    '<div style="margin-top:10px;position:relative;height:70px;border-radius:12px;overflow:hidden;' +
      'background:var(--surface);border:1px solid var(--border)">' +
      '<div style="position:absolute;left:0;right:0;bottom:0;height:' + waterPct + '%;' +
        'background:linear-gradient(180deg,var(--cyan)cc,var(--cyan)44);transition:height .6s var(--ease)"></div>' +
      '<div style="position:absolute;inset:0;display:grid;place-items:center">' +
        '<div style="text-align:center">' +
          '<div class="mono" style="font-size:18px;font-weight:800">' + state.water + ' ml</div>' +
          '<div class="muted2" style="font-size:10px">Meta: ' + targets.water + ' ml</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-top:10px">' +
      [250, 500, 750].map((ml) => '<button class="btn btn-ghost btn-sm" data-water="' + ml + '" style="flex:1">+' + ml + '</button>').join('') +
      '<button class="btn btn-ghost btn-sm" data-water-reset>↺</button>' +
    '</div>';
  row.appendChild(waterCard);

  const weightCard = el('div', { class: 'card card-pad' });
  weightCard.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div class="eyebrow">⚖️ Peso</div>' +
      '<span class="pill green" style="font-size:10px">IMC ' + (state.profile.imc || 0).toFixed(1) + '</span>' +
    '</div>' +
    '<div style="margin-top:10px;text-align:center;padding:16px 0">' +
      '<div class="mono" style="font-size:32px;font-weight:800">' + weightDisplay + '<span class="muted" style="font-size:14px;font-weight:600"> kg</span></div>' +
      '<div class="muted2" style="font-size:11px;margin-top:4px">' +
        ((state.profile.imc || 0) < 18.5 ? 'Bajo peso' : (state.profile.imc || 0) < 25 ? 'Normal' : (state.profile.imc || 0) < 30 ? 'Sobrepeso' : 'Obesidad') +
      '</div>' +
    '</div>' +
    '<button class="btn btn-ghost btn-sm" id="weight-edit" style="width:100%">✎ Actualizar peso</button>';
  row.appendChild(weightCard);

  wrap.appendChild(row);

  // Card 5: Info base de datos
  const infoCard = el('div', { class: 'card card-pad fade-in-up', style: { background: 'linear-gradient(135deg,rgba(0,255,136,.06),rgba(6,182,212,.04))' } });
  if (!state.foodsLoaded) {
    infoCard.innerHTML =
      '<div class="skel" style="height:16px;width:60%;margin-bottom:8px"></div>' +
      '<div class="skel" style="height:12px;width:80%"></div>';
  } else {
    infoCard.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div class="eyebrow" style="color:var(--green)">📚 Base de datos</div>' +
        '<span class="pill green" style="font-size:10px">' + state.foodsCount + ' alimentos</span>' +
      '</div>' +
      '<div class="muted" style="font-size:11px;margin-top:8px;line-height:1.5">' +
        'Buscador disponible en la pestaña "Buscar"' +
      '</div>';
  }
  wrap.appendChild(infoCard);

  // Handlers
  setTimeout(() => {
    document.querySelectorAll('[data-water]').forEach((b) => {
      b.onclick = () => {
        state.water += parseInt(b.dataset.water);
        saveState();
        render();
      };
    });
    const resetWater = document.querySelector('[data-water-reset]');
    if (resetWater) resetWater.onclick = () => {
      state.water = 0;
      saveState();
      render();
    };
    const weightEdit = document.getElementById('weight-edit');
    if (weightEdit) weightEdit.onclick = () => {
      const newWeight = prompt('Nuevo peso (kg):', state.weight);
      if (newWeight && !isNaN(newWeight)) {
        state.weight = parseFloat(newWeight);
        state.profile.weight = state.weight;
        state.profile.imc = state.weight / ((state.profile.height / 100) ** 2);
        // Guardar en historial
        if (!state.profile.weightHistory) state.profile.weightHistory = [];
        state.profile.weightHistory.push({ date: new Date().toISOString().slice(0, 10), kg: state.weight });
        saveState();
        render();
        if (window.SomaAi && window.SomaAi.toast) window.SomaAi.toast('✅ Peso actualizado');
      }
    };
  }, 100);

  return wrap;
}

/* ------------------------- Render General ------------------------- */
function render() {
  const root = document.getElementById('app-root');
  if (!root) return;

  // Verificar si necesita onboarding
  if (!state.profile.onboarded && window.SomaAiOnboarding) {
    window.SomaAiOnboarding.render();
    return;
  }

  root.innerHTML = '';
  const app = el('div', { class: 'app' });

  // Header
  const header = el('header', { class: 'top' });
  header.innerHTML =
    '<div class="grad-line"></div>' +
    '<div class="container">' +
      '<div class="row">' +
        '<div class="logo">' +
          '<div class="mark">S</div>' +
          '<div>' +
            '<div class="name">SomaAi</div>' +
            '<div class="sub">NUTRICIÓN INTELIGENTE</div>' +
          '</div>' +
        '</div>' +
        '<div class="top-actions">' +
          '<button class="icon-btn" id="header-perfil">👤</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  app.appendChild(header);

  // Contenido principal
  const main = el('main');
  main.style.paddingTop = '16px';
  main.style.paddingBottom = '100px';
  main.style.overflowY = 'auto';
  main.style.height = 'calc(100dvh - 65px)';

  const container = el('div', { class: 'container' });
  container.appendChild(renderHoy());
  main.appendChild(container);
  app.appendChild(main);

  // Menú inferior
  const nav = el('nav');
  nav.style.position = 'fixed';
  nav.style.bottom = '0';
  nav.style.left = '0';
  nav.style.right = '0';
  nav.style.background = 'rgba(10,10,11,.95)';
  nav.style.backdropFilter = 'blur(20px)';
  nav.style.borderTop = '1px solid var(--border)';
  nav.style.paddingBottom = 'var(--safe-bottom)';
  nav.style.zIndex = '50';

  const tabs = [
    { id: 'hoy', icon: '🏠', label: 'Hoy' },
    { id: 'buscar', icon: '🔍', label: 'Buscar' },
    { id: 'perfil', icon: '👤', label: 'Perfil' },
  ];

  const navRow = el('div', { class: 'container' });
  navRow.style.display = 'flex';
  navRow.style.justifyContent = 'space-around';
  navRow.style.padding = '8px 0';

  tabs.forEach(tab => {
    const btn = el('button', { class: 'nav-btn' });
    btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 16px;border-radius:12px;min-width:70px;transition:all .2s';
    if (tab.id === 'hoy') {
      btn.style.background = 'rgba(0,255,136,.1)';
    }
    btn.innerHTML =
      '<span style="font-size:20px">' + tab.icon + '</span>' +
      '<span style="font-size:10px;font-weight:700;color:' + (tab.id === 'hoy' ? 'var(--green)' : 'var(--muted)') + '">' + tab.label + '</span>';
    btn.onclick = () => {
      if (tab.id === 'hoy') render();
      if (tab.id === 'buscar' && window.SomaAiSearch) {
        root.innerHTML = '';
        root.appendChild(header);
        const mainSearch = el('main');
        mainSearch.style.paddingTop = '16px';
        mainSearch.style.paddingBottom = '100px';
        mainSearch.style.overflowY = 'auto';
        mainSearch.style.height = 'calc(100dvh - 65px)';
        const c = el('div', { class: 'container' });
        c.appendChild(window.SomaAiSearch.render());
        mainSearch.appendChild(c);
        app.appendChild(mainSearch);
        app.appendChild(nav);
        root.appendChild(app);
      }
      if (tab.id === 'perfil' && window.SomaAiProfile) {
        root.innerHTML = '';
        root.appendChild(header);
        const mainProfile = el('main');
        mainProfile.style.paddingTop = '16px';
        mainProfile.style.paddingBottom = '100px';
        mainProfile.style.overflowY = 'auto';
        mainProfile.style.height = 'calc(100dvh - 65px)';
        const c = el('div', { class: 'container' });
        c.appendChild(window.SomaAiProfile.render());
        mainProfile.appendChild(c);
        app.appendChild(mainProfile);
        app.appendChild(nav);
        root.appendChild(app);
      }
    };
    navRow.appendChild(btn);
  });
  nav.appendChild(navRow);
  app.appendChild(nav);

  root.appendChild(app);

  // Handler del perfil en header
  const headerPerfil = document.getElementById('header-perfil');
  if (headerPerfil) headerPerfil.onclick = () => {
    if (window.SomaAiProfile) {
      root.innerHTML = '';
      root.appendChild(header);
      const mainProfile = el('main');
      mainProfile.style.paddingTop = '16px';
      mainProfile.style.paddingBottom = '100px';
      mainProfile.style.overflowY = 'auto';
      mainProfile.style.height = 'calc(100dvh - 65px)';
      const c = el('div', { class: 'container' });
      c.appendChild(window.SomaAiProfile.render());
      mainProfile.appendChild(c);
      app.appendChild(mainProfile);
      app.appendChild(nav);
      root.appendChild(app);
    }
  };
}

/* ------------------------- Toast / Confetti / Haptic ------------------------- */
function toast(message) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(20px);' +
    'background:rgba(20,20,25,.95);color:#fff;padding:12px 20px;border-radius:999px;' +
    'font-size:13px;font-weight:600;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);' +
    'z-index:1000;opacity:0;transition:all .3s';
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

/* ------------------------- Init ------------------------- */
window.SomaAi = {
  state,
  saveState,
  loadState,
  loadAllDatabases,
  calcTargets,
  calcTotals,
  el,
  render,
  renderHoy,
  toast,
  haptic,
  escapeHtml,
};

async function init() {
  loadState();
  if (!state.profile.onboarded && window.SomaAiOnboarding) {
    await window.SomaAiOnboarding.loadConfig();
    window.SomaAiOnboarding.render();
    loadAllDatabases(); // Cargar en background
    return;
  }
  render();
  await loadAllDatabases();
  render();
}

init();
