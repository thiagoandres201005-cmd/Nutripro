/* ============================================================================
   SomaAi v1.0 — Núcleo (parte 1)
   ========================================================================== */

const state = {
  version: '1.0.0',
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
    activity: 'moderada',
    goal: 'mantener',
    sport: 'ninguno',
    streak: 1,
    onboarded: false,
  },
  foods: [],
  foodsLoaded: false,
  foodsCount: 0,
};

function saveState() {
  try {
    const toSave = {
      date: state.date,
      water: state.water,
      weight: state.weight,
      entries: state.entries,
      profile: state.profile,
    };
    localStorage.setItem('somaai_state', JSON.stringify(toSave));
  } catch (e) {}
}

function loadState() {
  try {
    const saved = localStorage.getItem('somaai_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    }
    const today = new Date().toISOString().slice(0, 10);
    if (state.date !== today) {
      state.entries = [];
      state.water = 0;
      state.date = today;
      saveState();
    }
  } catch (e) {}
}

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
  for (const db of DATABASES) {
    try {
      const res = await fetch(db);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.foods && Array.isArray(data.foods)) {
        allFoods.push(...data.foods);
      }
    } catch (e) {
      console.warn('[SomaAi] No se pudo cargar:', db);
    }
  }
  state.foods = allFoods;
  state.foodsCount = allFoods.length;
  state.foodsLoaded = true;
  console.log('[SomaAi] Bases cargadas:', state.foodsCount, 'alimentos');
}

function calcTargets(profile) {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  const tmb = Math.round(profile.sex === 'm' ? base + 5 : base - 161);
  const act = { sedentaria: 1.2, ligera: 1.375, moderada: 1.55, alta: 1.725, atleta: 1.9 };
  const adj = { perder: -0.15, mantener: 0, ganar: 0.15 };
  const tdee = tmb * (act[profile.activity] || 1.55);
  const kcal = Math.round(tdee * (1 + (adj[profile.goal] || 0)));
  const ratio = profile.goal === 'ganar' ? { p: 0.30, c: 0.45, f: 0.25 }
              : profile.goal === 'perder' ? { p: 0.35, c: 0.35, f: 0.30 }
              : { p: 0.25, c: 0.50, f: 0.25 };
  return {
    kcal,
    p: Math.round(kcal * ratio.p / 4),
    c: Math.round(kcal * ratio.c / 4),
    f: Math.round(kcal * ratio.f / 9),
    water: Math.round(profile.weight * 35),
  };
}

function calcTotals(entries) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, na: 0 };
  entries.forEach((e) => {
    const food = state.foods.find((f) => f.id === e.foodId) || e.food;
    if (!food) return;
    const k = e.grams / 100;
    t.kcal += (food.kcal || 0) * k;
    t.p += (food.p || 0) * k;
    t.c += (food.c || 0) * k;
    t.f += (food.f || 0) * k;
    t.fib += (food.fib || 0) * k;
    t.sug += (food.sug || 0) * k;
    t.na += (food.na || 0) * k;
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
  const over = value > goal;
  const div = el('div', { class: 'ring' });
  div.innerHTML =
    '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="' + R + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>' +
      '<circle cx="50" cy="50" r="' + R + '" fill="none" stroke="url(#rg-' + label + ')" stroke-width="6" ' +
        'stroke-linecap="round" stroke-dasharray="' + CIRC + '" stroke-dashoffset="' + off + '" ' +
        'style="transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)"/>' +
      '<defs><linearGradient id="rg-' + label + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="' + color1 + '"/>' +
        '<stop offset="100%" stop-color="' + color2 + '"/>' +
      '</linearGradient></defs></svg>' +
    '<div class="ring-center">' +
      '<div class="ring-val" style="color:' + (over ? 'var(--pink)' : 'var(--text)') + '">' + pct + '%</div>' +
      '<div class="ring-lbl">' + label.toUpperCase() + '</div>' +
    '</div>';
  return div;
}

function miniStat(label, value, color) {
  return el('div', { class: 'mini-stat' }, [
    el('div', { class: 'muted2', style: { fontSize: '10px' }, text: label }),
    el('div', { class: 'mono', style: { fontSize: '14px', fontWeight: '800', marginTop: '2px', color }, text: String(value) }),
  ]);
}

function renderComingSoon(title, icon, desc) {
  const wrap = el('div', { class: 'card card-pad', style: { textAlign: 'center', padding: '60px 24px' } });
  wrap.innerHTML =
    '<div style="font-size:64px">' + icon + '</div>' +
    '<div class="h2" style="margin-top:20px">' + title + '</div>' +
    '<div class="muted" style="font-size:13px;margin-top:12px;line-height:1.6;max-width:400px;margin:0 auto">' + desc + '</div>' +
    '<div class="pill cyan" style="margin-top:20px">🚧 Próximamente</div>';
  return wrap;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function renderHoy() {
  const targets = calcTargets(state.profile);
  const totals = calcTotals(state.entries);
  const waterPct = Math.min(100, Math.round((state.water / targets.water) * 100));
  const wrap = el('div', { class: 'stack' });

  const card1 = el('div', { class: 'card card-pad' });
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
        '<span class="pill">🔥 ' + state.profile.streak + ' días</span>' +
        '<span class="pill green">✓ ' + escapeHtml(state.profile.name || 'Usuario') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="bar" style="margin-top:20px;height:10px">' +
      '<i style="width:' + Math.min(100, totals.kcal / targets.kcal * 100) + '%;' +
      'background:linear-gradient(90deg,var(--green),var(--cyan),var(--pink))"></i>' +
    '</div>';
  wrap.appendChild(card1);

  const card2 = el('div', { class: 'card card-pad' });
  const rings = el('div', { class: 'grid g-4', style: { gap: '8px' } });
  rings.appendChild(ring(totals.kcal, targets.kcal, 'kcal', '#00ff88', '#06b6d4'));
  rings.appendChild(ring(totals.p, targets.p, 'prot', '#00ff88', '#00ff88'));
  rings.appendChild(ring(totals.c, targets.c, 'carb', '#06b6d4', '#8b5cf6'));
  rings.appendChild(ring(totals.f, targets.f, 'grasa', '#ec4899', '#f59e0b'));
  card2.appendChild(rings);

  const pPerKg = (totals.p / state.profile.weight).toFixed(2);
  const stats = el('div', { class: 'grid g-3', style: { marginTop: '16px', gap: '8px' } });
  stats.appendChild(miniStat('P / kg', pPerKg, 'var(--green)'));
  stats.appendChild(miniStat('Proteína obj.', targets.p + 'g', 'var(--cyan)'));
  stats.appendChild(miniStat('Adherencia', Math.round(Math.max(0, 100 - Math.abs(totals.kcal - targets.kcal) / targets.kcal * 100)) + '%', 'var(--amber)'));
  card2.appendChild(stats);
  wrap.appendChild(card2);

  const infoCard = el('div', { class: 'card card-pad', style: { background: 'linear-gradient(135deg,rgba(0,255,136,.06),rgba(6,182,212,.04))' } });
  infoCard.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div class="eyebrow" style="color:var(--green)">📚 Base de datos</div>' +
      '<span class="pill green" style="font-size:10px">' +
        (state.foodsLoaded ? state.foodsCount + ' alimentos' : 'Cargando...') +
      '</span>' +
    '</div>' +
    '<div class="muted" style="font-size:11px;margin-top:8px;line-height:1.5">' +
      (state.foodsLoaded
        ? 'Buscador disponible en la pestaña "Buscar"'
        : 'Cargando bases de datos...') +
    '</div>';
  wrap.appendChild(infoCard);

  const row = el('div', { class: 'grid g-2', style: { gap: '16px' } });

  const waterCard = el('div', { class: 'card card-pad' });
  waterCard.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div class="eyebrow">💧 Hidratación</div>' +
      '<span class="pill cyan" style="font-size:10px">' + waterPct + '%</span>' +
    '</div>' +
    '<div style="margin-top:10px;position:relative;height:70px;border-radius:12px;overflow:hidden;' +
      'background:var(--surface);border:1px solid var(--border)">' +
      '<div style="position:absolute;left:0;right:0;bottom:0;height:' + waterPct + '%;' +
        'background:linear-gradient(180deg,var(--cyan)cc,var(--cyan)44);transition:height .6s"></div>' +
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
      '<button class="btn btn-ghost btn-sm" data-weight-edit>Editar</button>' +
    '</div>' +
    '<div style="display:flex;align-items:baseline;gap:6px;margin-top:8px">' +
      '<div class="mono" style="font-size:28px;font-weight:800">' + state.weight.toFixed(1) + '</div>' +
      '<span class="muted" style="font-size:12px">kg</span>' +
    '</div>' +
    '<div class="muted2" style="font-size:11px;margin-top:6px">Objetivo: ' + state.profile.goal + '</div>';
  row.appendChild(weightCard);
  wrap.appendChild(row);

  const mealsCard = el('div', { class: 'card card-pad' });
  const meals = [
    { id: 'desayuno', icon: '🌅', label: 'Desayuno', color: 'var(--amber)' },
    { id: 'almuerzo', icon: '☀️', label: 'Almuerzo', color: 'var(--green)' },
    { id: 'merienda', icon: '🌤️', label: 'Merienda', color: 'var(--cyan)' },
    { id: 'cena', icon: '🌙', label: 'Cena', color: 'var(--violet)' },
  ];
  mealsCard.innerHTML =
    '<div class="eyebrow" style="margin-bottom:12px">Distribución del día</div>' +
    '<div class="grid g-2" style="gap:8px">' +
      meals.map((m) => {
        const items = state.entries.filter((e) => e.meal === m.id);
        const k = items.reduce((sum, e) => {
          const food = state.foods.find((f) => f.id === e.foodId) || e.food;
          return sum + ((food?.kcal || 0) * e.grams / 100);
        }, 0);
        return '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border)">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<div style="width:32px;height:32px;border-radius:50%;display:grid;place-items:center;' +
              'background:' + m.color + '22;border:1px solid ' + m.color + '44;font-size:14px">' + m.icon + '</div>' +
            '<div>' +
              '<div style="font-size:12px;font-weight:700">' + m.label + '</div>' +
              '<div class="muted2" style="font-size:10px">' + Math.round(k) + ' kcal</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  wrap.appendChild(mealsCard);

  if (state.entries.length > 0) {
    const listCard = el('div', { class: 'card card-pad' });
    let html =
      '<div class="eyebrow" style="margin-bottom:12px">Alimentos de hoy · ' + state.entries.length + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">';
    state.entries.forEach((e, i) => {
      const food = state.foods.find((f) => f.id === e.foodId) || e.food;
      if (!food) return;
      const k = e.grams / 100;
      html +=
        '<div style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:12px;' +
          'background:var(--surface);border:1px solid var(--border)">' +
          '<div style="width:36px;height:36px;border-radius:10px;background:var(--card2);' +
            'border:1px solid var(--border);display:grid;place-items:center;font-size:16px">' + (food.emoji || '🍽️') + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
              escapeHtml(food.name) + ' · ' + e.grams + 'g' +
            '</div>' +
            '<div style="display:flex;gap:6px;margin-top:3px;font-size:10px">' +
              '<span class="pill mono" style="font-size:9px">' + Math.round((food.kcal || 0) * k) + ' kcal</span>' +
              '<span class="pill" style="font-size:9px">' + e.meal + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="icon-btn" data-remove="' + i + '" style="width:28px;height:28px;font-size:11px">✕</button>' +
        '</div>';
    });
    html += '</div>';
    listCard.innerHTML = html;
    wrap.appendChild(listCard);

    setTimeout(() => {
      document.querySelectorAll('[data-remove]').forEach((btn) => {
        btn.onclick = () => {
          const i = +btn.dataset.remove;
          state.entries.splice(i, 1);
          saveState();
          render();
        };
      });
    }, 0);
  }

  return wrap;
}

const TABS = [
  { id: 'hoy', icon: '🏠', label: 'Hoy', render: renderHoy },
  { id: 'buscar', icon: '🔍', label: 'Buscar', render: () => {
      if (window.SomaAiSearch) return window.SomaAiSearch.render();
      return renderComingSoon('Buscar', '🔍', 'Cargando buscador...');
    } },
  { id: 'camara', icon: '📷', label: 'Cámara', render: () => renderComingSoon('Cámara', '📷', 'Escaneo de códigos de barras.') },
  { id: 'ia', icon: '🧠', label: 'IA', render: () => renderComingSoon('IA', '🧠', 'Asistente inteligente.') },
  { id: 'perfil', icon: '👤', label: 'Perfil', render: () => renderComingSoon('Perfil', '👤', 'Datos personales y objetivos.') },
];

let currentTab = 'hoy';

function render() {
  if (!state.profile.onboarded && window.SomaAiOnboarding) {
    window.SomaAiOnboarding.render();
    return;
  }

  const root = document.getElementById('app-root');
  if (!root) return;
  root.innerHTML = '';

  const app = el('div', { class: 'app' });

  const header = el('header', { class: 'top' });
  header.innerHTML =
    '<div class="grad-line"></div>' +
    '<div class="container row">' +
      '<div class="logo">' +
        '<div class="mark">S</div>' +
        '<div>' +
          '<div class="name">SomaAi</div>' +
          '<div class="sub">v' + state.version + ' · ' + state.platform.toUpperCase() + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="top-actions">' +
        '<span class="pill" style="font-size:10px">🔥 ' + state.profile.streak + ' días</span>' +
      '</div>' +
    '</div>';
  app.appendChild(header);

  const main = el('main', { class: 'container', style: {
    paddingTop: '16px',
    paddingBottom: 'calc(112px + var(--safe-bottom))',
  }});
  const tab = TABS.find((t) => t.id === currentTab) || TABS[0];
  main.appendChild(tab.render());
  app.appendChild(main);

  const nav = el('nav', { class: 'bottom', 'aria-label': 'Navegación principal' });
  const navWrap = el('div', { class: 'wrap' });
  const navInner = el('div', { class: 'inner' });
  TABS.forEach((t) => {
    const active = currentTab === t.id;
    const btn = el('button', {
      class: 'nav-item' + (active ? ' active' : ''),
      'aria-label': t.label,
      onClick: () => { currentTab = t.id; render(); },
    });
    btn.innerHTML = '<span class="ico">' + t.icon + '</span><span class="lbl">' + t.label + '</span>';
    navInner.appendChild(btn);
  });
  navWrap.appendChild(navInner);
  nav.appendChild(navWrap);
  app.appendChild(nav);
  root.appendChild(app);

  document.querySelectorAll('[data-water]').forEach((btn) => {
    btn.onclick = () => {
      const ml = +btn.dataset.water;
      state.water = Math.min(calcTargets(state.profile).water, state.water + ml);
      saveState();
      render();
    };
  });
  document.querySelectorAll('[data-water-reset]').forEach((btn) => {
    btn.onclick = () => {
      if (confirm('¿Reiniciar agua del día?')) {
        state.water = 0;
        saveState();
        render();
      }
    };
  });
  document.querySelectorAll('[data-weight-edit]').forEach((btn) => {
    btn.onclick = () => {
      const v = prompt('Nuevo peso (kg):', state.weight);
      const num = parseFloat(v);
      if (!isNaN(num) && num > 30 && num < 300) {
        state.weight = num;
        state.profile.weight = num;
        saveState();
        render();
      }
    };
  });
}

window.SomaAi = {
  state,
  saveState,
  render,
  el,
  TABS,
  setTab: (id) => { currentTab = id; render(); },
  reloadFoods: loadAllDatabases,
};

async function init() {
  try {
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      state.platform = window.Capacitor.getPlatform();
    }
  } catch (e) {}

  loadState();

  if (window.SomaAiOnboarding) {
    await window.SomaAiOnboarding.loadConfig();
  }

  render();

  loadAllDatabases().then(() => {
    if (state.profile.onboarded) render();
  }).catch((err) => {
    console.warn('[SomaAi] Error al cargar bases:', err.message);
  });

  console.log('[SomaAi] Init', state.platform);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
