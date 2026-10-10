/* ============================================================================
   SomaAi v1.2 — Núcleo con UI/UX mejorada (parte 1)
   ========================================================================== */

const state = {
  version: '1.2.0',
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

/* ------------------------- Persistencia ------------------------- */
function saveState() {
  try {
    const toSave = {
      date: state.date,
      water: state.water,
      weight: state.weight,
      entries: state.entries,
      profile: state.profile,
      customFoods: state.foods.filter((f) => f.custom),
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
      if (parsed.weight && typeof parsed.weight === 'number') state.weight = parsed.weight;
      if (parsed.profile && parsed.profile.weight) state.profile.weight = parsed.profile.weight;
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

/* ------------------------- Bases de datos ------------------------- */
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
      if (data.foods && Array.isArray(data.foods)) allFoods.push(...data.foods);
    } catch (e) {}
  }
  /* Restaurar alimentos personalizados */
  try {
    const saved = localStorage.getItem('somaai_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.customFoods && Array.isArray(parsed.customFoods)) {
        allFoods.push(...parsed.customFoods);
      }
    }
  } catch (e) {}
  state.foods = allFoods;
  state.foodsCount = allFoods.length;
  state.foodsLoaded = true;
}

/* ------------------------- Cálculos ------------------------- */
function calcTargets(profile) {
  const w = Number(profile.weight) || 72.4;
  const h = Number(profile.height) || 168;
  const a = Number(profile.age) || 28;
  const base = 10 * w + 6.25 * h - 5 * a;
  const tmb = Math.round(profile.sex === 'm' ? base + 5 : base - 161);
  const act = { sedentaria: 1.2, ligera: 1.375, moderada: 1.55, alta: 1.725, atleta: 1.9 };
  const factor = act[profile.activity] || 1.55;
  const tdee = tmb * factor;
  const adj = { perder: -0.15, mantener: 0, ganar: 0.15 };
  const targetKcal = Math.round(tdee * (1 + (adj[profile.goal] || 0)));
  const ratio = profile.goal === 'ganar' ? { p: 0.30, c: 0.45, f: 0.25 }
              : profile.goal === 'perder' ? { p: 0.35, c: 0.35, f: 0.30 }
              : { p: 0.25, c: 0.50, f: 0.25 };
  return {
    kcal: targetKcal,
    p: Math.round(targetKcal * ratio.p / 4),
    c: Math.round(targetKcal * ratio.c / 4),
    f: Math.round(targetKcal * ratio.f / 9),
    water: Math.round(w * 35),
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

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

/* ------------------------- UI Helpers (Toast, Confetti, Haptic) ------------------------- */
function uiToast(msg) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  root.innerHTML = '';
  const t = el('div', { class: 'toast' }, msg);
  root.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 2200);
}

function uiConfetti() {
  const root = document.getElementById('confetti-root');
  if (!root) return;
  root.innerHTML = '';
  const colors = ['#00ff88', '#ec4899', '#06b6d4', '#f59e0b', '#8b5cf6'];
  for (let i = 0; i < 20; i++) {
    const p = el('div', { class: 'confetti-piece', style: {
      left: (20 + Math.random() * 60) + '%',
      top: (40 + Math.random() * 20) + '%',
      background: colors[i % colors.length],
      animationDelay: (i * 0.03) + 's',
    }});
    root.appendChild(p);
  }
  setTimeout(() => { root.innerHTML = ''; }, 1500);
}

function uiHaptic() {
  try { navigator.vibrate && navigator.vibrate(30); } catch (e) {}
}

function uiConfirm(message) {
  return new Promise((resolve) => {
    const modal = el('div', { class: 'modal-bg' });
    modal.innerHTML =
      '<div class="scrim"></div>' +
      '<div class="modal" style="max-width:400px">' +
        '<div class="handle"></div>' +
        '<div class="body" style="text-align:center">' +
          '<div style="font-size:40px">⚠️</div>' +
          '<div class="h2" style="margin-top:12px">' + escapeHtml(message) + '</div>' +
          '<div style="display:flex;gap:8px;margin-top:24px">' +
            '<button class="btn btn-ghost" id="confirm-no" style="flex:1">Cancelar</button>' +
            '<button class="btn btn-primary" id="confirm-yes" style="flex:1">Confirmar</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelector('.scrim').onclick = () => { modal.remove(); resolve(false); };
    modal.querySelector('#confirm-no').onclick = () => { modal.remove(); resolve(false); };
    modal.querySelector('#confirm-yes').onclick = () => { modal.remove(); resolve(true); };
  });
}

/* ------------------------- Renders ------------------------- */
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
        'style="transition:stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)"/>' +
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
  const wrap = el('div', { class: 'card card-pad fade-in-up', style: { textAlign: 'center', padding: '60px 24px' } });
  wrap.innerHTML =
    '<div style="font-size:64px">' + icon + '</div>' +
    '<div class="h2" style="margin-top:20px;word-break:break-word">' + title + '</div>' +
    '<div class="muted" style="font-size:13px;margin-top:12px;line-height:1.6;max-width:400px;margin:0 auto;word-break:break-word">' + desc + '</div>' +
    '<div class="pill cyan" style="margin-top:20px">🚧 Próximamente</div>';
  return wrap;
}

/* ------------------------- Vista HOY ------------------------- */
function renderHoy() {
  const targets = calcTargets(state.profile);
  const totals = calcTotals(state.entries);
  const waterPct = Math.min(100, Math.round((state.water / targets.water) * 100));
  const weightDisplay = (Number(state.weight) || 72.4).toFixed(1);
  const wrap = el('div', { class: 'stack' });

  /* Card 1: Objetivo diario */
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
        '<span class="pill">🔥 ' + state.profile.streak + ' días</span>' +
        '<span class="pill green">✓ ' + escapeHtml(state.profile.name || 'Usuario') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="bar" style="margin-top:20px;height:10px">' +
      '<i style="width:' + Math.min(100, totals.kcal / targets.kcal * 100) + '%;' +
      'background:linear-gradient(90deg,var(--green),var(--cyan),var(--pink))"></i>' +
    '</div>';
  wrap.appendChild(card1);

  /* Card 2: Anillos */
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

  /* Card 3: Info base de datos */
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

  /* Card 4: Hidratación + Peso */
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
      '<button class="btn btn-ghost btn-sm" data-water-reset style="width:44px">↺</button>' +
    '</div>';
  row.appendChild(waterCard);

  const weightCard = el('div', { class: 'card card-pad' });
  weightCard.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div class="eyebrow">⚖️ Peso</div>' +
      '<button class="btn btn-ghost btn-sm" data-weight-edit>Editar</button>' +
    '</div>' +
    '<div style="display:flex;align-items:baseline;gap:6px;margin-top:8px">' +
      '<div class="mono" style="font-size:28px;font-weight:800">' + weightDisplay + '</div>' +
      '<span class="muted" style="font-size:12px">kg</span>' +
    '</div>' +
    '<div class="muted2" style="font-size:11px;margin-top:6px">Objetivo: ' + state.profile.goal + '</div>';
  row.appendChild(weightCard);
  wrap.appendChild(row);

  /* Card 5: Distribución con kcal por comida */
  const mealsCard = el('div', { class: 'card card-pad fade-in-up' });
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
        const mealTarget = Math.round(targets.kcal / 4);
        const pct = Math.min(100, (k / mealTarget) * 100);
        return '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border)">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<div style="width:32px;height:32px;border-radius:50%;display:grid;place-items:center;' +
              'background:' + m.color + '22;border:1px solid ' + m.color + '44;font-size:14px">' + m.icon + '</div>' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:12px;font-weight:700">' + m.label + '</div>' +
              '<div class="muted2" style="font-size:10px">' + Math.round(k) + ' / ' + mealTarget + ' kcal</div>' +
            '</div>' +
          '</div>' +
          '<div class="bar thin" style="margin-top:8px">' +
            '<i style="width:' + pct + '%;background:' + m.color + '"></i>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  wrap.appendChild(mealsCard);

  /* Card 6: Alimentos de hoy */
  if (state.entries.length > 0) {
    const listCard = el('div', { class: 'card card-pad fade-in-up' });
    let html =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
        '<div class="eyebrow">Alimentos de hoy · ' + state.entries.length + '</div>' +
        '<div style="display:flex;gap:6px">' +
          '<button class="chip-btn" id="btn-repeat-yesterday" style="font-size:10px;height:28px;padding:0 10px">🔁 Ayer</button>' +
          '<button class="chip-btn" id="btn-clear-day" style="font-size:10px;height:28px;padding:0 10px;color:var(--red);border-color:rgba(239,68,68,.3)">🗑️ Vaciar</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">';
    state.entries.forEach((e, i) => {
      const food = state.foods.find((f) => f.id === e.foodId) || e.food;
      if (!food) return;
      const k = e.grams / 100;
      html +=
        '<div class="food-row" data-entry-idx="' + i + '">' +
          '<div style="width:36px;height:36px;border-radius:10px;background:var(--card2);' +
            'border:1px solid var(--border);display:grid;place-items:center;font-size:16px;flex-shrink:0">' +
            (food.emoji || '🍽️') + '</div>' +
          '<div style="flex:1;min-width:0;cursor:pointer" data-edit-idx="' + i + '">' +
            '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
              escapeHtml(food.name) + ' · ' + e.grams + 'g' +
            '</div>' +
            '<div style="display:flex;gap:6px;margin-top:3px;font-size:10px;flex-wrap:wrap">' +
              '<span class="pill mono" style="font-size:9px">' + Math.round((food.kcal || 0) * k) + ' kcal</span>' +
              '<span class="pill" style="font-size:9px">' + e.meal + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="icon-btn" data-remove="' + i + '" style="width:28px;height:28px;font-size:11px;flex-shrink:0">✕</button>' +
        '</div>';
    });
    html += '</div>';
    listCard.innerHTML = html;
    wrap.appendChild(listCard);

    setTimeout(() => {
      /* Eliminar */
      listCard.querySelectorAll('[data-remove]').forEach((btn) => {
        btn.onclick = async (ev) => {
          ev.stopPropagation();
          const i = +btn.dataset.remove;
          const row = btn.closest('.food-row');
          if (row) row.classList.add('removing');
          uiHaptic();
          await new Promise((r) => setTimeout(r, 250));
          state.entries.splice(i, 1);
          saveState();
          render();
        };
      });

      /* Editar cantidad */
      listCard.querySelectorAll('[data-edit-idx]').forEach((div) => {
        div.onclick = () => {
          const i = +div.dataset.editIdx;
          openEditEntryModal(i);
        };
      });

      /* Repetir ayer */
      const repeatBtn = listCard.querySelector('#btn-repeat-yesterday');
      if (repeatBtn) repeatBtn.onclick = repeatYesterday;

      /* Vaciar día */
      const clearBtn = listCard.querySelector('#btn-clear-day');
      if (clearBtn) clearBtn.onclick = async () => {
        const ok = await uiConfirm('¿Vaciar todos los alimentos de hoy?');
        if (!ok) return;
        state.entries = [];
        saveState();
        uiToast('🗑️ Día vaciado');
        render();
      };
    }, 0);
  }

  /* Handlers de agua y peso */
  setTimeout(() => {
    document.querySelectorAll('[data-water]').forEach((btn) => {
      btn.onclick = () => {
        const ml = +btn.dataset.water;
        state.water = Math.min(calcTargets(state.profile).water, state.water + ml);
        saveState();
        uiHaptic();
        render();
      };
    });
    document.querySelectorAll('[data-water-reset]').forEach((btn) => {
      btn.onclick = async () => {
        const ok = await uiConfirm('¿Reiniciar agua del día?');
        if (ok) { state.water = 0; saveState(); render(); }
      };
    });
    document.querySelectorAll('[data-weight-edit]').forEach((btn) => {
      btn.onclick = () => {
        const v = prompt('Nuevo peso (kg):', state.weight);
        const num = parseFloat(v);
        if (!isNaN(num) && num > 30 && num < 300) {
          state.weight = num;
          state.profile.weight = num;
          const today = new Date().toISOString().slice(0, 10);
          const hist = [...(state.profile.weightHistory || [])];
          const idx = hist.findIndex((h) => h.date === today);
          const entry = { date: today, kg: num };
          if (idx >= 0) hist[idx] = entry; else hist.push(entry);
          hist.sort((a, b) => a.date.localeCompare(b.date));
          state.profile.weightHistory = hist;
          saveState();
          uiToast('⚖️ Peso actualizado');
          render();
        }
      };
    });
  }, 0);

  return wrap;
}

/* ------------------------- Modal editar entrada ------------------------- */
function openEditEntryModal(idx) {
  const entry = state.entries[idx];
  if (!entry) return;
  const food = state.foods.find((f) => f.id === entry.foodId) || entry.food;
  if (!food) return;

  const modal = el('div', { class: 'modal-bg' });
  modal.innerHTML =
    '<div class="scrim"></div>' +
    '<div class="modal">' +
      '<div class="handle"></div>' +
      '<div class="body">' +
        '<div class="eyebrow" style="color:var(--green)">✏️ Editar alimento</div>' +
        '<div class="h2" style="margin-top:8px;word-break:break-word">' + escapeHtml(food.name) + '</div>' +
        '<div style="margin-top:20px">' +
          '<div class="eyebrow">Cantidad (gramos)</div>' +
          '<input type="number" id="edit-grams" value="' + entry.grams + '" min="1" max="2000" class="input" style="margin-top:6px" />' +
        '</div>' +
        '<div style="margin-top:16px">' +
          '<div class="eyebrow">Comida</div>' +
          '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' +
            ['desayuno','almuerzo','merienda','cena'].map((m) =>
              '<button class="meal-btn chip-btn' + (entry.meal === m ? ' on' : '') + '" data-meal="' + m + '" style="flex:1;min-width:70px">' + m.slice(0,3).toUpperCase() + '</button>'
            ).join('') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:20px">' +
          '<button class="btn btn-ghost" id="edit-cancel" style="flex:1">Cancelar</button>' +
          '<button class="btn btn-primary" id="edit-save" style="flex:2">✓ Guardar</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  let selectedMeal = entry.meal;
  modal.querySelector('.scrim').onclick = () => modal.remove();
  modal.querySelector('#edit-cancel').onclick = () => modal.remove();

  modal.querySelectorAll('[data-meal]').forEach((btn) => {
    btn.onclick = () => {
      selectedMeal = btn.dataset.meal;
      modal.querySelectorAll('[data-meal]').forEach((b) => {
        b.classList.toggle('on', b.dataset.meal === selectedMeal);
      });
    };
  });

  modal.querySelector('#edit-save').onclick = () => {
    const grams = parseInt(modal.querySelector('#edit-grams').value) || 100;
    state.entries[idx].grams = grams;
    state.entries[idx].meal = selectedMeal;
    saveState();
    modal.remove();
    uiToast('✓ Actualizado');
    uiHaptic();
    render();
  };
}

/* ------------------------- Repetir comidas de ayer ------------------------- */
async function repeatYesterday() {
  /* Guardamos el día actual */
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  /* Buscar en localStorage un backup de ayer */
  try {
    const saved = localStorage.getItem('somaai_state');
    if (!saved) { uiToast('No hay datos de ayer'); return; }
    const parsed = JSON.parse(saved);
    /* Como solo guardamos el día actual, no tenemos ayer. Avisamos al usuario */
    uiToast('Función disponible a partir de mañana');
  } catch (e) {
    uiToast('Error al cargar ayer');
  }
}

/* ------------------------- TABS ------------------------- */
const TABS = [
  { id: 'hoy', icon: '🏠', label: 'Hoy', render: renderHoy },
  { id: 'buscar', icon: '🔍', label: 'Buscar', render: () => {
      if (window.SomaAiSearch) return window.SomaAiSearch.render();
      return renderComingSoon('Buscar', '🔍', 'Cargando buscador...');
    } },
  { id: 'camara', icon: '📷', label: 'Cámara', render: () => renderComingSoon('Cámara', '📷', 'Escaneo de códigos de barras.') },
  { id: 'ia', icon: '🧠', label: 'IA', render: () => renderComingSoon('IA', '🧠', 'Asistente inteligente.') },
  { id: 'perfil', icon: '👤', label: 'Perfil', render: () => {
      if (window.SomaAiProfile) return window.SomaAiProfile.render();
      return renderComingSoon('Perfil', '👤', 'Cargando perfil...');
    } },
];

let currentTab = 'hoy';

/* ------------------------- Render principal ------------------------- */
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
      onClick: () => {
        if (currentTab === t.id) return;
        currentTab = t.id;
        render();
        /* Scroll al top al cambiar de pestaña */
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
    btn.innerHTML = '<span class="ico">' + t.icon + '</span><span class="lbl">' + t.label + '</span>';
    navInner.appendChild(btn);
  });
  navWrap.appendChild(navInner);
  nav.appendChild(navWrap);
  app.appendChild(nav);
  root.appendChild(app);
}

/* ------------------------- API pública ------------------------- */
window.SomaAi = {
  state,
  saveState,
  render,
  el,
  TABS,
  calcTargets,
  setTab: (id) => { currentTab = id; render(); },
  reloadFoods: loadAllDatabases,
};

window.SomaAiUI = {
  toast: uiToast,
  confetti: uiConfetti,
  haptic: uiHaptic,
  confirm: uiConfirm,
};

/* ------------------------- Splash Screen ------------------------- */
function showSplash() {
  const splash = el('div', { class: 'splash', id: 'splash-screen' });
  splash.innerHTML =
    '<div class="splash-logo">S</div>' +
    '<div class="splash-name">SomaAi</div>' +
    '<div class="splash-sub">ASISTENTE NUTRICIONAL</div>' +
    '<div class="spinner"></div>';
  document.body.appendChild(splash);
}

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 500);
  }
}

/* ------------------------- Init ------------------------- */
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

  /* Cargar bases + render */
  loadAllDatabases().then(() => {
    render();
  }).catch(() => {
    render();
  });

  render();
  setTimeout(hideSplash, 1500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    showSplash();
    init();
  });
} else {
  showSplash();
  init();
}
