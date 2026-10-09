/* ============================================================================
   SomaAi — Buscador de alimentos con fuzzy search
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

const CATEGORIES = [
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

function filterByCategory(foods, catId) {
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

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function renderSearch() {
  const S = window.SomaAi;
  if (!S) return document.createElement('div');
  const wrap = S.el('div', { class: 'stack' });

  const searchCard = S.el('div', { class: 'card card-pad' });
  searchCard.style.position = 'sticky';
  searchCard.style.top = '65px';
  searchCard.style.zIndex = '20';
  const totalFoods = S.state.foods.length;
  searchCard.innerHTML =
    '<div class="eyebrow">🔍 Buscar alimentos</div>' +
    '<div style="margin-top:12px;position:relative">' +
      '<input type="text" id="search-input" class="input" ' +
        'placeholder="Buscar: empanada, coca cola, yogur..." ' +
        'value="' + escapeHtml(SEARCH_STATE.query) + '" ' +
        'style="padding-left:44px;padding-right:44px" autocomplete="off" spellcheck="false" />' +
      '<span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px">🔍</span>' +
      (SEARCH_STATE.query
        ? '<button id="search-clear" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);' +
          'width:28px;height:28px;border-radius:50%;background:var(--card2);border:1px solid var(--border);' +
          'color:var(--muted);font-size:12px;cursor:pointer">✕</button>'
        : '') +
    '</div>' +
    '<div class="muted2" style="font-size:11px;margin-top:10px">' +
      '<strong>' + totalFoods + ' alimentos</strong> en la base · Búsqueda inteligente' +
    '</div>';
  wrap.appendChild(searchCard);

  const chipsCard = S.el('div', { class: 'chips-row' });
  chipsCard.style.marginTop = '12px';
  chipsCard.innerHTML = CATEGORIES.map((c) =>
    '<button class="chip-btn' + (SEARCH_STATE.category === c.id ? ' on' : '') + '" data-cat="' + c.id + '">' +
      c.emoji + ' ' + c.label + '</button>'
  ).join('');
  wrap.appendChild(chipsCard);

  if (SEARCH_STATE.query.length >= 2) {
    let results = searchFoods(SEARCH_STATE.query, 60);
    results = filterByCategory(results, SEARCH_STATE.category);

    if (results.length === 0) {
      const emptyCard = S.el('div', { class: 'card card-pad', style: { textAlign: 'center', padding: '48px 24px' } });
      emptyCard.innerHTML =
        '<div style="font-size:48px">🔍</div>' +
        '<div class="h2" style="margin-top:16px">Sin resultados</div>' +
        '<div class="muted" style="font-size:12px;margin-top:8px">' +
          'No encontramos "' + escapeHtml(SEARCH_STATE.query) + '".<br>Probá con otro término.' +
        '</div>';
      wrap.appendChild(emptyCard);
    } else {
      const resultsCard = S.el('div', { class: 'card card-pad', style: { marginTop: '12px' } });
      let html =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
          '<div class="eyebrow">Resultados</div>' +
          '<span class="pill" style="font-size:10px">' + results.length + '</span>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px">';
      results.slice(0, 40).forEach((f, i) => {
        const brand = f.brand ? escapeHtml(f.brand) : '';
        html +=
          '<button class="search-result" data-idx="' + i + '">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:var(--card2);' +
              'border:1px solid var(--border);display:grid;place-items:center;font-size:20px;flex-shrink:0">' +
              (f.emoji || '🍽️') + '</div>' +
            '<div style="flex:1;min-width:0;text-align:left">' +
              '<div style="font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
                escapeHtml(f.name) + '</div>' +
              '<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">' +
                '<span class="pill mono" style="font-size:10px">' + (f.kcal || 0) + ' kcal</span>' +
                (brand ? '<span class="pill" style="font-size:10px">' + brand + '</span>' : '') +
                '<span class="pill green mono" style="font-size:10px">P ' + (f.p || 0) + 'g</span>' +
              '</div>' +
            '</div>' +
            '<div style="color:var(--muted2);font-size:18px">+</div>' +
          '</button>';
      });
      html += '</div>';
      resultsCard.innerHTML = html;
      wrap.appendChild(resultsCard);

      setTimeout(() => {
        document.querySelectorAll('.search-result').forEach((btn) => {
          btn.onclick = () => {
            const idx = +btn.dataset.idx;
            const food = results[idx];
            if (food) openAddModal(food);
          };
        });
      }, 0);
    }
  } else {
    const hintCard = S.el('div', { class: 'card card-pad', style: { textAlign: 'center', padding: '48px 24px' } });
    hintCard.innerHTML =
      '<div style="font-size:48px">🔍</div>' +
      '<div class="h2" style="margin-top:16px">Escribí para buscar</div>' +
      '<div class="muted" style="font-size:12px;margin-top:8px">' +
        'Tenemos <strong>' + totalFoods + ' alimentos</strong> disponibles' +
      '</div>' +
      '<div style="margin-top:20px">' +
        '<div class="eyebrow" style="margin-bottom:10px">Ejemplos</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">' +
          ['manzana', 'pollo', 'arroz', 'yogur', 'coca cola', 'empanada', 'milanesa']
            .map((q) => '<button class="chip-btn" data-quick="' + q + '">' + q + '</button>')
            .join('') +
        '</div>' +
      '</div>';
    wrap.appendChild(hintCard);

    setTimeout(() => {
      document.querySelectorAll('[data-quick]').forEach((btn) => {
        btn.onclick = () => {
          SEARCH_STATE.query = btn.dataset.quick;
          renderSearch_reRender();
        };
      });
    }, 0);
  }

  setTimeout(() => {
    const input = document.getElementById('search-input');
    if (input) {
      let debounce;
      input.oninput = (e) => {
        SEARCH_STATE.query = e.target.value;
        clearTimeout(debounce);
        debounce = setTimeout(() => renderSearch_reRender(), 250);
      };
      if (!SEARCH_STATE.query) input.focus();
    }
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) {
      clearBtn.onclick = () => {
        SEARCH_STATE.query = '';
        renderSearch_reRender();
      };
    }
    document.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.onclick = () => {
        SEARCH_STATE.category = btn.dataset.cat;
        renderSearch_reRender();
      };
    });
  }, 0);

  return wrap;
}

function renderSearch_reRender() {
  const S = window.SomaAi;
  if (!S) return;
  const main = document.querySelector('main.container');
  if (!main) return;
  main.innerHTML = '';
  main.appendChild(renderSearch());
}

function openAddModal(food) {
  const S = window.SomaAi;
  if (!S) return;
  const modal = S.el('div', { class: 'modal-bg' });
  let html =
    '<div class="scrim"></div>' +
    '<div class="modal">' +
      '<div class="handle"></div>' +
      '<div class="body">' +
        '<div style="display:flex;gap:12px;align-items:flex-start">' +
          '<div style="width:64px;height:64px;border-radius:14px;background:var(--surface);' +
            'border:1px solid var(--border);display:grid;place-items:center;font-size:28px;flex-shrink:0">' +
            (food.emoji || '🍽️') + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:14px;font-weight:800">' + escapeHtml(food.name) + '</div>' +
            (food.brand ? '<div class="muted2" style="font-size:11px;margin-top:4px">' + escapeHtml(food.brand) + '</div>' : '') +
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
          '<div style="display:flex;gap:6px;margin-top:6px">' +
            ['desayuno','almuerzo','merienda','cena'].map((m) =>
              '<button class="meal-btn chip-btn" data-meal="' + m + '" style="flex:1">' + m.slice(0,3).toUpperCase() + '</button>'
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
    S.setTab('hoy');
  };
}

window.SomaAiSearch = { render: renderSearch };
