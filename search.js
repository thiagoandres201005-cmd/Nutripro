/* ============================================================================
   SomaAi — Buscador v3 con UI/UX mejorada
   - Botón "+" para agregar rápido
   - Editar cantidad al tocar
   - Modal agregar manualmente
   - Animaciones
   ========================================================================== */

const SEARCH_STATE = {
  query: '',
  results: [],
  category: 'todas',
  loading: false,
};

function normText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function levenshtein(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function fuzzyScore(query, target) {
  const q = normText(query);
  const t = normText(target);
  if (!q || !t) return 0;
  if (t === q) return 1.0;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.85;
  const qTokens = q.split(' ').filter(Boolean);
  const tTokens = t.split(' ').filter(Boolean);
  let hits = 0;
  qTokens.forEach((qt) => {
    if (tTokens.some((tt) => tt.includes(qt) || qt.includes(tt))) hits++;
  });
  if (hits > 0) return 0.6 + (hits / qTokens.length) * 0.3;
  if (q.length >= 4 && t.length >= 4) {
    const dist = levenshtein(q.slice(0, 20), t.slice(0, 20), 3);
    if (dist === 1) return 0.7;
    if (dist === 2) return 0.5;
  }
  return 0;
}

function searchFoods(query, limit = 50) {
  const S = window.SomaAi;
  if (!S || !S.state.foods || S.state.foods.length === 0) return [];
  const q = String(query || '').trim();
  if (!q) return [];
  const scored = [];
  const foods = S.state.foods;
  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    let best = fuzzyScore(q, f.name || '');
    if (Array.isArray(f.aliases)) {
      for (const a of f.aliases) {
        const s = fuzzyScore(q, a);
        if (s > best) best = s;
      }
    }
    if (f.brand) {
      const sBrand = fuzzyScore(q, f.brand) * 0.8;
      if (sBrand > best) best = sBrand;
    }
    if (best > 0.4) scored.push({ food: f, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.food);
}

const SEARCH_CATEGORIES = [
  { id: 'todas', label: 'Todas', emoji: '🌐' },
  { id: 'frutas', label: 'Frutas', emoji: '🍎' },
  { id: 'verduras', label: 'Verduras', emoji: '🥦' },
  { id: 'carnes', label: 'Carnes', emoji: '🥩' },
  { id: 'pescados', label: 'Pescados', emoji: '🐟' },
  { id: 'cereales', label: 'Cereales', emoji: '🌾' },
  { id: 'lacteos', label: 'Lácteos', emoji: '🥛' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { id: 'comidas', label: 'Comidas', emoji: '🍽️' },
  { id: 'snacks', label: 'Snacks', emoji: '🍫' },
  { id: 'condimentos', label: 'Condimentos', emoji: '🧂' },
];

function filterSearchByCategory(foods, catId) {
  if (catId === 'todas') return foods;
  const keywords = {
    frutas: ['fruta', 'manzana', 'banana', 'naranja', 'pera', 'uva', 'frutilla', 'kiwi', 'palta'],
    verduras: ['verdura', 'tomate', 'lechuga', 'zanahoria', 'papa', 'cebolla', 'brocoli'],
    carnes: ['carne', 'pollo', 'cerdo', 'vaca', 'asado', 'milanesa', 'huevo', 'pavo'],
    pescados: ['pescado', 'atun', 'salmon', 'merluza', 'camaron', 'calamar'],
    cereales: ['arroz', 'avena', 'pan', 'pasta', 'fideo', 'trigo', 'cereal'],
    lacteos: ['leche', 'yogur', 'queso', 'crema', 'manteca', 'ricota'],
    bebidas: ['bebida', 'agua', 'jugo', 'gaseosa', 'cerveza', 'vino', 'cafe'],
    comidas: ['empanada', 'pizza', 'tarta', 'guiso', 'milanesa', 'hamburguesa'],
    snacks: ['snack', 'galletita', 'papas', 'mani', 'almendra', 'chocolate', 'alfajor'],
    condimentos: ['aceite', 'sal', 'azucar', 'salsa', 'vinagre', 'mayonesa'],
  };
  const keys = keywords[catId] || [];
  return foods.filter((f) => {
    const name = normText((f.name || '') + ' ' + (f.brand || '') + ' ' + (f.cat || ''));
    return keys.some((k) => name.includes(k));
  });
}

function escapeHtmlSearch(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function renderSearch() {
  const S = window.SomaAi;
  if (!S) return document.createElement('div');
  const wrap = S.el('div', { class: 'stack', style: { overflowX: 'hidden', maxWidth: '100%' } });

  const totalFoods = S.state.foods.length;

  const searchCard = S.el('div', { class: 'card card-pad', style: {
    position: 'sticky', top: '65px', zIndex: '20',
    overflow: 'hidden', maxWidth: '100%',
  }});
  searchCard.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
      '<div class="eyebrow" style="word-break:break-word">🔍 Buscar alimentos</div>' +
      '<button id="search-manual-btn" class="chip-btn" style="font-size:11px;height:30px;padding:0 10px" title="Agregar manualmente">✏️ Manual</button>' +
    '</div>' +
    '<div style="margin-top:12px;position:relative;max-width:100%">' +
      '<input type="text" id="search-input" class="input" ' +
        'placeholder="Buscar..." ' +
        'style="padding-left:44px;padding-right:44px;width:100%;box-sizing:border-box" ' +
        'autocomplete="off" spellcheck="false" autocorrect="off" />' +
      '<span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px">🔍</span>' +
      '<button id="search-clear" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);' +
        'width:28px;height:28px;border-radius:50%;background:var(--card2);border:1px solid var(--border);' +
        'color:var(--muted);font-size:12px;cursor:pointer;display:none">✕</button>' +
    '</div>' +
    '<div class="muted2" style="font-size:11px;margin-top:10px;word-break:break-word">' +
      '<strong>' + totalFoods + ' alimentos</strong> · Búsqueda con tolerancia a errores' +
    '</div>';
  wrap.appendChild(searchCard);

  const chipsCard = S.el('div', { class: 'chips-row', style: { marginTop: '12px', maxWidth: '100%' } });
  chipsCard.innerHTML = SEARCH_CATEGORIES.map((c) =>
    '<button class="chip-btn' + (SEARCH_STATE.category === c.id ? ' on' : '') + '" data-cat="' + c.id + '">' +
      c.emoji + ' ' + c.label + '</button>'
  ).join('');
  wrap.appendChild(chipsCard);

  const resultsContainer = S.el('div', { id: 'search-results-container', style: {
    marginTop: '12px', maxWidth: '100%', overflowX: 'hidden',
  }});
  wrap.appendChild(resultsContainer);

  setTimeout(() => {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');

    if (input && SEARCH_STATE.query) {
      input.value = SEARCH_STATE.query;
      if (clearBtn) clearBtn.style.display = 'grid';
    }

    renderSearchResultsOnly();

    if (input) {
      let debounce;
      input.oninput = (e) => {
        SEARCH_STATE.query = e.target.value;
        if (clearBtn) clearBtn.style.display = e.target.value ? 'grid' : 'none';
        clearTimeout(debounce);
        debounce = setTimeout(() => renderSearchResultsOnly(), 200);
      };
      if (!SEARCH_STATE.query) input.focus();
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        SEARCH_STATE.query = '';
        const inp = document.getElementById('search-input');
        if (inp) { inp.value = ''; inp.focus(); }
        clearBtn.style.display = 'none';
        renderSearchResultsOnly();
      };
    }

    const manualBtn = document.getElementById('search-manual-btn');
    if (manualBtn) {
      manualBtn.onclick = () => openManualFoodModal();
    }

    document.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.onclick = () => {
        SEARCH_STATE.category = btn.dataset.cat;
        document.querySelectorAll('[data-cat]').forEach((b) => {
          b.classList.toggle('on', b.dataset.cat === SEARCH_STATE.category);
        });
        renderSearchResultsOnly();
      };
    });
  }, 0);

  return wrap;
}

function renderSearchResultsOnly() {
  const S = window.SomaAi;
  if (!S) return;
  const container = document.getElementById('search-results-container');
  if (!container) return;
  container.innerHTML = '';

  if (SEARCH_STATE.query.length < 2) {
    const hintCard = S.el('div', { class: 'card card-pad fade-in-up', style: {
      textAlign: 'center', padding: '48px 24px', maxWidth: '100%', boxSizing: 'border-box',
    }});
    hintCard.innerHTML =
      '<div style="font-size:48px">🔍</div>' +
      '<div class="h2" style="margin-top:16px;word-break:break-word">Escribí para buscar</div>' +
      '<div class="muted" style="font-size:12px;margin-top:8px;word-break:break-word">' +
        'Tenemos <strong>' + S.state.foods.length + ' alimentos</strong> disponibles' +
      '</div>' +
      '<div style="margin-top:20px">' +
        '<div class="eyebrow" style="margin-bottom:10px">Ejemplos</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">' +
          ['manzana', 'pollo', 'arroz', 'yogur', 'coca cola', 'empanada', 'milanesa']
            .map((q) => '<button class="chip-btn" data-quick="' + q + '">' + q + '</button>')
            .join('') +
        '</div>' +
      '</div>';
    container.appendChild(hintCard);

    container.querySelectorAll('[data-quick]').forEach((btn) => {
      btn.onclick = () => {
        SEARCH_STATE.query = btn.dataset.quick;
        const inp = document.getElementById('search-input');
        if (inp) inp.value = btn.dataset.quick;
        const cb = document.getElementById('search-clear');
        if (cb) cb.style.display = 'grid';
        renderSearchResultsOnly();
      };
    });
    return;
  }

  let results = searchFoods(SEARCH_STATE.query, 60);
  results = filterSearchByCategory(results, SEARCH_STATE.category);

  if (results.length === 0) {
    const emptyCard = S.el('div', { class: 'card card-pad fade-in-up', style: {
      textAlign: 'center', padding: '48px 24px', maxWidth: '100%', boxSizing: 'border-box',
    }});
    emptyCard.innerHTML =
      '<div style="font-size:48px">🔍</div>' +
      '<div class="h2" style="margin-top:16px;word-break:break-word">Sin resultados</div>' +
      '<div class="muted" style="font-size:12px;margin-top:8px;word-break:break-word">' +
        'No encontramos "' + escapeHtmlSearch(SEARCH_STATE.query) + '"' +
      '</div>' +
      '<button class="btn btn-primary" style="margin-top:20px" id="empty-manual-btn">+ Agregar manualmente</button>';
    container.appendChild(emptyCard);
    const btn = document.getElementById('empty-manual-btn');
    if (btn) btn.onclick = () => openManualFoodModal(SEARCH_STATE.query);
    return;
  }

  const resultsCard = S.el('div', { class: 'card card-pad stagger', style: {
    maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden',
  }});
  let html =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
      '<div class="eyebrow">Resultados</div>' +
      '<span class="pill" style="font-size:10px">' + results.length + '</span>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;max-width:100%">';
  results.slice(0, 40).forEach((f, i) => {
    const brand = f.brand ? escapeHtmlSearch(f.brand) : '';
    html +=
      '<div class="search-result" data-idx="' + i + '" style="cursor:pointer">' +
        '<div style="width:44px;height:44px;border-radius:12px;background:var(--card2);' +
          'border:1px solid var(--border);display:grid;place-items:center;font-size:20px;flex-shrink:0">' +
          (f.emoji || '🍽️') + '</div>' +
        '<div style="flex:1;min-width:0;text-align:left;overflow:hidden" data-info>' +
          '<div style="font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
            escapeHtmlSearch(f.name) + '</div>' +
          '<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">' +
            '<span class="pill mono" style="font-size:10px">' + (f.kcal || 0) + ' kcal</span>' +
            (brand ? '<span class="pill" style="font-size:10px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + brand + '</span>' : '') +
            '<span class="pill green mono" style="font-size:10px">P ' + (f.p || 0) + 'g</span>' +
          '</div>' +
        '</div>' +
        '<button class="icon-btn" data-add-idx="' + i + '" ' +
          'style="background:var(--green);color:#000;border-color:var(--green);width:32px;height:32px;font-size:16px" ' +
          'title="Agregar rápido">+</button>' +
      '</div>';
  });
  html += '</div>';
  resultsCard.innerHTML = html;
  container.appendChild(resultsCard);

  container.querySelectorAll('.search-result').forEach((row) => {
    const idx = +row.dataset.idx;
    const info = row.querySelector('[data-info]');
    if (info) {
      info.onclick = () => openAddModalSearch(results[idx]);
    }
    const addBtn = row.querySelector('[data-add-idx]');
    if (addBtn) {
      addBtn.onclick = (e) => {
        e.stopPropagation();
        quickAddFood(results[idx]);
      };
    }
  });
}

/* Agregar rápido (100g, almuerzo por defecto) */
function quickAddFood(food) {
  const S = window.SomaAi;
  if (!S) return;

  /* Detectar comida según hora del día */
  const hour = new Date().getHours();
  let meal = 'almuerzo';
  if (hour < 10) meal = 'desayuno';
  else if (hour < 15) meal = 'almuerzo';
  else if (hour < 19) meal = 'merienda';
  else meal = 'cena';

  S.state.entries.push({
    foodId: food.id,
    food: food,
    grams: 100,
    meal: meal,
    _addedAt: Date.now(),
  });
  S.saveState();

  if (window.SomaAiUI) {
    window.SomaAiUI.toast('✓ ' + food.name + ' · ' + (food.kcal || 0) + ' kcal');
    window.SomaAiUI.confetti();
    window.SomaAiUI.haptic();
  }
}

/* Modal para agregar con cantidad y comida */
function openAddModalSearch(food) {
  const S = window.SomaAi;
  if (!S) return;
  const modal = S.el('div', { class: 'modal-bg' });
  let html =
    '<div class="scrim"></div>' +
    '<div class="modal">' +
      '<div class="handle"></div>' +
      '<div class="body">' +
        '<div style="display:flex;gap:12px;align-items:flex-start;max-width:100%">' +
          '<div style="width:64px;height:64px;border-radius:14px;background:var(--surface);' +
            'border:1px solid var(--border);display:grid;place-items:center;font-size:28px;flex-shrink:0">' +
            (food.emoji || '🍽️') + '</div>' +
          '<div style="flex:1;min-width:0;overflow:hidden">' +
            '<div style="font-size:14px;font-weight:800;word-break:break-word">' + escapeHtmlSearch(food.name) + '</div>' +
            (food.brand ? '<div class="muted2" style="font-size:11px;margin-top:4px;word-break:break-word">' + escapeHtmlSearch(food.brand) + '</div>' : '') +
            '<div class="pill mono" style="font-size:10px;margin-top:6px">' + (food.kcal || 0) + ' kcal / 100g</div>' +
          '</div>' +
        '</div>' +
        '<div class="grid g-4" style="gap:8px;margin-top:16px">' +
          '<div class="mini-stat"><div class="muted2" style="font-size:9px">P</div>' +
            '<div class="mono" style="font-size:13px;font-weight:800;margin-top:2px">' + (food.p || 0) + 'g</div></div>' +
          '<div class="mini-stat"><div class="muted2" style="font-size:9px">C</div>' +
            '<div class="mono" style="font-size:13px;font-weight:800;margin-top:2px">' + (food.c || 0) + 'g</div></div>' +
          '<div class="mini-stat"><div class="muted2" style="font-size:9px">G</div>' +
            '<div class="mono" style="font-size:13px;font-weight:800;margin-top:2px">' + (food.f || 0) + 'g</div></div>' +
          '<div class="mini-stat"><div class="muted2" style="font-size:9px">Fib</div>' +
            '<div class="mono" style="font-size:13px;font-weight:800;margin-top:2px">' + (food.fib || 0) + 'g</div></div>' +
        '</div>' +
        '<div style="margin-top:16px">' +
          '<div class="eyebrow">Cantidad (gramos)</div>' +
          '<input type="number" id="modal-grams" value="100" min="1" max="2000" class="input" style="margin-top:6px" />' +
        '</div>' +
        '<div style="margin-top:16px">' +
          '<div class="eyebrow">Comida</div>' +
          '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' +
            ['desayuno','almuerzo','merienda','cena'].map((m) =>
              '<button class="meal-btn chip-btn" data-meal="' + m + '" style="flex:1;min-width:70px">' + m.slice(0,3).toUpperCase() + '</button>'
            ).join('') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:20px">' +
          '<button class="btn btn-ghost" id="modal-cancel" style="flex:1">Cancelar</button>' +
          '<button class="btn btn-primary" id="modal-add" style="flex:2">+ Agregar al día</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  modal.innerHTML = html;
  document.body.appendChild(modal);
  let selectedMeal = 'almuerzo';
  modal.querySelector('.scrim').onclick = () => modal.remove();
  modal.querySelector('#modal-cancel').onclick = () => modal.remove();
  modal.querySelectorAll('[data-meal]').forEach((btn) => {
    btn.onclick = () => {
      selectedMeal = btn.dataset.meal;
      modal.querySelectorAll('[data-meal]').forEach((b) => {
        b.style.background = b === btn ? 'var(--green)' : 'var(--surface)';
        b.style.color = b === btn ? '#000' : 'var(--muted)';
        b.style.borderColor = b === btn ? 'var(--green)' : 'var(--border)';
      });
    };
  });
  modal.querySelector('#modal-add').onclick = () => {
    const grams = parseInt(modal.querySelector('#modal-grams').value) || 100;
    S.state.entries.push({
      foodId: food.id,
      food: food,
      grams: grams,
      meal: selectedMeal,
      _addedAt: Date.now(),
    });
    S.saveState();
    modal.remove();
    if (window.SomaAiUI) {
      window.SomaAiUI.toast('✓ ' + food.name + ' · ' + Math.round((food.kcal || 0) * grams / 100) + ' kcal');
      window.SomaAiUI.confetti();
      window.SomaAiUI.haptic();
    }
    S.setTab('hoy');
  };
}

/* Modal para agregar alimento manual (no está en la base) */
function openManualFoodModal(prefill) {
  const S = window.SomaAi;
  if (!S) return;
  const modal = S.el('div', { class: 'modal-bg' });
  let html =
    '<div class="scrim"></div>' +
    '<div class="modal">' +
      '<div class="handle"></div>' +
      '<div class="body">' +
        '<div class="eyebrow" style="color:var(--green)">✏️ Agregar manualmente</div>' +
        '<div class="h2" style="margin-top:8px">Alimento personalizado</div>' +
        '<div class="muted" style="font-size:12px;margin-top:6px;word-break:break-word">' +
          'Para productos que no están en la base. Los valores son por 100g.' +
        '</div>' +
        '<div style="margin-top:20px">' +
          '<label style="display:flex;flex-direction:column;gap:6px">' +
            '<span class="eyebrow">Nombre</span>' +
            '<input type="text" id="manual-name" class="input" placeholder="Ej: Tortilla casera" value="' + escapeHtmlSearch(prefill || '') + '" />' +
          '</label>' +
        '</div>' +
        '<div class="grid g-2" style="margin-top:12px;gap:12px">' +
          '<label style="display:flex;flex-direction:column;gap:6px">' +
            '<span class="eyebrow">Calorías (kcal)</span>' +
            '<input type="number" id="manual-kcal" class="input" placeholder="0" min="0" max="900" />' +
          '</label>' +
          '<label style="display:flex;flex-direction:column;gap:6px">' +
            '<span class="eyebrow">Proteína (g)</span>' +
            '<input type="number" id="manual-p" class="input" placeholder="0" min="0" max="100" step="0.1" />' +
          '</label>' +
          '<label style="display:flex;flex-direction:column;gap:6px">' +
            '<span class="eyebrow">Carbos (g)</span>' +
            '<input type="number" id="manual-c" class="input" placeholder="0" min="0" max="100" step="0.1" />' +
          '</label>' +
          '<label style="display:flex;flex-direction:column;gap:6px">' +
            '<span class="eyebrow">Grasa (g)</span>' +
            '<input type="number" id="manual-f" class="input" placeholder="0" min="0" max="100" step="0.1" />' +
          '</label>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="eyebrow">Comida</div>' +
          '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' +
            ['desayuno','almuerzo','merienda','cena'].map((m) =>
              '<button class="meal-btn-manual chip-btn" data-meal="' + m + '" style="flex:1;min-width:70px">' + m.slice(0,3).toUpperCase() + '</button>'
            ).join('') +
          '</div>' +
        '</div>' +
        '<div style="margin-top:16px">' +
          '<label style="display:flex;flex-direction:column;gap:6px">' +
            '<span class="eyebrow">Cantidad (gramos)</span>' +
            '<input type="number" id="manual-grams" class="input" value="100" min="1" max="2000" />' +
          '</label>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:20px">' +
          '<button class="btn btn-ghost" id="manual-cancel" style="flex:1">Cancelar</button>' +
          '<button class="btn btn-primary" id="manual-add" style="flex:2">+ Crear y agregar</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  modal.innerHTML = html;
  document.body.appendChild(modal);

  let selectedMeal = 'almuerzo';
  modal.querySelector('.scrim').onclick = () => modal.remove();
  modal.querySelector('#manual-cancel').onclick = () => modal.remove();

  modal.querySelectorAll('[data-meal]').forEach((btn) => {
    btn.onclick = () => {
      selectedMeal = btn.dataset.meal;
      modal.querySelectorAll('[data-meal]').forEach((b) => {
        b.style.background = b === btn ? 'var(--green)' : 'var(--surface)';
        b.style.color = b === btn ? '#000' : 'var(--muted)';
        b.style.borderColor = b === btn ? 'var(--green)' : 'var(--border)';
      });
    };
  });

  modal.querySelector('#manual-add').onclick = () => {
    const name = modal.querySelector('#manual-name').value.trim();
    const kcal = parseFloat(modal.querySelector('#manual-kcal').value) || 0;
    const p = parseFloat(modal.querySelector('#manual-p').value) || 0;
    const c = parseFloat(modal.querySelector('#manual-c').value) || 0;
    const f = parseFloat(modal.querySelector('#manual-f').value) || 0;
    const grams = parseInt(modal.querySelector('#manual-grams').value) || 100;

    if (!name || kcal <= 0) {
      alert('Poné un nombre y calorías válidas');
      return;
    }

    const id = 'custom-' + Date.now();
    const food = {
      id: id,
      name: name,
      brand: 'Personalizado',
      emoji: '🍽️',
      kcal: kcal,
      p: p,
      c: c,
      f: f,
      fib: 0,
      sug: 0,
      na: 0,
      custom: true,
    };

    S.state.foods.push(food);
    S.state.entries.push({
      foodId: id,
      food: food,
      grams: grams,
      meal: selectedMeal,
      _addedAt: Date.now(),
    });
    S.saveState();
    modal.remove();
    if (window.SomaAiUI) {
      window.SomaAiUI.toast('✓ ' + name + ' creado y agregado');
      window.SomaAiUI.confetti();
      window.SomaAiUI.haptic();
    }
    S.setTab('hoy');
  };
}

window.SomaAiSearch = { render: renderSearch };
