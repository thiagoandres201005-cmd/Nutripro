/* ============================================================================
   SomaAi — Buscador v4 con FILTROS DINÁMICOS
   - Cada categoría puede tener su propio archivo JSON
   - Los filtros se cargan automáticamente
   - Carga lazy: solo carga el archivo de la categoría seleccionada
   ========================================================================== */

const SEARCH_STATE = {
  query: '',
  results: [],
  category: 'todas',
  loading: false,
  categoryFoods: {}, // Cache de alimentos por categoría
};

/* ------------------------- CONFIGURACIÓN DE CATEGORÍAS ------------------------- */
/* 
   Acá definís las categorías. Cada una tiene:
   - id: identificador único (se usa para el filtro)
   - label: nombre visible
   - emoji: ícono
   - archivo: (opcional) ruta al archivo JSON de esa categoría
              Si no tiene archivo, busca en las bases generales por palabra clave
   - keywords: (opcional) palabras clave para filtrar en las bases generales
*/
const SEARCH_CATEGORIES = [
  { id: 'todas', label: 'Todas', emoji: '🌐' },
  { id: 'frutas', label: 'Frutas', emoji: '🍎', archivo: 'data/categorias/frutas.json', keywords: ['fruta', 'manzana', 'banana', 'naranja', 'pera', 'uva', 'frutilla', 'kiwi', 'palta', 'anana', 'mango', 'sandia', 'melon'] },
  { id: 'verduras', label: 'Verduras', emoji: '🥦', archivo: 'data/categorias/verduras.json', keywords: ['verdura', 'tomate', 'lechuga', 'zanahoria', 'papa', 'cebolla', 'brocoli', 'espinaca', 'zapallo'] },
  { id: 'carnes', label: 'Carnes', emoji: '🥩', archivo: 'data/categorias/carnes.json', keywords: ['carne', 'pollo', 'cerdo', 'vaca', 'asado', 'milanesa', 'huevo', 'pavo', 'bife', 'chorizo'] },
  { id: 'pescados', label: 'Pescados', emoji: '🐟', archivo: 'data/categorias/pescados.json', keywords: ['pescado', 'atun', 'salmon', 'merluza', 'camaron', 'calamar', 'mariscos'] },
  { id: 'cereales', label: 'Cereales', emoji: '🌾', archivo: 'data/categorias/cereales.json', keywords: ['arroz', 'avena', 'pan', 'pasta', 'fideo', 'trigo', 'cereal', 'quinoa'] },
  { id: 'lacteos', label: 'Lácteos', emoji: '🥛', archivo: 'data/categorias/lacteos.json', keywords: ['leche', 'yogur', 'queso', 'crema', 'manteca', 'ricota', 'dulce de leche'] },
  { id: 'bebidas', label: 'Bebidas', emoji: '🥤', archivo: 'data/categorias/bebidas.json', keywords: ['bebida', 'agua', 'jugo', 'gaseosa', 'cerveza', 'vino', 'cafe', 'te', 'coca', 'pepsi'] },
  { id: 'comidas', label: 'Comidas', emoji: '🍽️', archivo: 'data/categorias/comidas.json', keywords: ['empanada', 'pizza', 'tarta', 'guiso', 'milanesa', 'hamburguesa', 'lasaña', 'ravioles'] },
  { id: 'snacks', label: 'Snacks', emoji: '🍫', archivo: 'data/categorias/snacks.json', keywords: ['snack', 'galletita', 'papas', 'mani', 'almendra', 'chocolate', 'alfajor', 'cereal bar'] },
  { id: 'condimentos', label: 'Condimentos', emoji: '🧂', archivo: 'data/categorias/condimentos.json', keywords: ['aceite', 'sal', 'azucar', 'salsa', 'vinagre', 'mayonesa', 'ketchup', 'mostaza', 'oregano'] },
  { id: 'congelados', label: 'Congelados', emoji: '🧊', archivo: 'data/categorias/congelados.json', keywords: ['congelado', 'mccain', 'granja del sol', 'paty', 'congelados'] },
  { id: 'panificados', label: 'Panificados', emoji: '🥖', archivo: 'data/categorias/panificados.json', keywords: ['pan', 'factura', 'medialuna', 'bizcocho', 'torta', 'budin'] },
  { id: 'golosinas', label: 'Golosinas', emoji: '🍬', archivo: 'data/categorias/golosinas.json', keywords: ['golosina', 'caramelo', 'chicle', 'chocolate', 'alfajor', 'bombon'] },
];

/* ------------------------- Normalización ------------------------- */
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

/* ------------------------- Carga de categorías ------------------------- */
async function loadCategoryFoods(categoryId) {
  // Si ya está cacheado, devolver
  if (SEARCH_STATE.categoryFoods[categoryId]) return SEARCH_STATE.categoryFoods[categoryId];

  const cat = SEARCH_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return [];

  // Si la categoría tiene un archivo específico, intentar cargarlo
  if (cat.archivo) {
    try {
      const res = await fetch(cat.archivo);
      if (res.ok) {
        const data = await res.json();
        if (data.foods && Array.isArray(data.foods)) {
          SEARCH_STATE.categoryFoods[categoryId] = data.foods;
          console.log('[Search] Categoría ' + categoryId + ' cargada: ' + data.foods.length + ' alimentos');
          return data.foods;
        }
      }
    } catch (e) {
      console.log('[Search] No hay archivo para ' + categoryId + ', usando keywords');
    }
  }

  // Fallback: filtrar las bases generales por keywords
  const S = window.SomaAi;
  if (!S || !S.state.foods || S.state.foods.length === 0) return [];

  const keywords = cat.keywords || [];
  if (keywords.length === 0) return [];

  const filtered = S.state.foods.filter(f => {
    const name = normText((f.name || '') + ' ' + (f.brand || '') + ' ' + (f.cat || ''));
    return keywords.some(k => name.includes(k));
  });
  SEARCH_STATE.categoryFoods[categoryId] = filtered;
  return filtered;
}

/* ------------------------- Búsqueda ------------------------- */
async function searchFoods(query, categoryId) {
  const S = window.SomaAi;
  if (!S) return [];

  // Si hay categoría específica, buscar solo ahí
  let pool = [];
  if (categoryId && categoryId !== 'todas') {
    pool = await loadCategoryFoods(categoryId);
  } else {
    // Todas: usar las bases generales + todas las categorías cargadas
    pool = S.state.foods || [];
  }

  if (!query || !query.trim()) return [];

  const scored = [];
  for (let i = 0; i < pool.length; i++) {
    const f = pool[i];
    let best = fuzzyScore(query, f.name || '');
    if (Array.isArray(f.aliases)) {
      for (const a of f.aliases) {
        const s = fuzzyScore(query, a);
        if (s > best) best = s;
      }
    }
    if (f.brand) {
      const sBrand = fuzzyScore(query, f.brand) * 0.8;
      if (sBrand > best) best = sBrand;
    }
    if (best > 0.4) scored.push({ food: f, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 50).map((x) => x.food);
}

function escapeHtmlSearch(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/* ------------------------- Render ------------------------- */
function renderSearch() {
  const S = window.SomaAi;
  if (!S) return document.createElement('div');
  const wrap = S.el('div', { class: 'stack fade-in' });
  wrap.style.cssText = 'overflowX:hidden;max-width:100%';

  const totalFoods = S.state.foods.length;

  // Barra de búsqueda
  const searchCard = S.el('div', { class: 'card card-pad' });
  searchCard.style.cssText = 'position:sticky;top:65px;z-index:20;overflow:hidden;max-width:100%';
  searchCard.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<div class="eyebrow">🔍 Buscar alimentos</div>' +
      '<button class="btn btn-ghost btn-sm" id="manual-add" style="font-size:11px">✏️ Manual</button>' +
    '</div>' +
    '<div style="position:relative">' +
      '<input type="text" id="search-input" placeholder="Buscar..." autocomplete="off" style="width:100%;padding:14px 16px;border-radius:14px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:15px;font-weight:500" />' +
      '<button id="search-clear" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:var(--card2);border:1px solid var(--border);display:none;place-items:center;font-size:14px;color:var(--muted)">×</button>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">' +
      '<span class="muted2" style="font-size:11px">' + (totalFoods > 0 ? totalFoods + ' alimentos · Búsqueda con tolerancia a errores' : 'Cargando...') + '</span>' +
    '</div>';

  // Chips de categorías
  const chipsContainer = S.el('div');
  chipsContainer.style.cssText = 'display:flex;gap:6px;overflow-x:auto;margin-top:12px;padding-bottom:4px;-webkit-overflow-scrolling:touch';
  SEARCH_CATEGORIES.forEach(cat => {
    const isActive = SEARCH_STATE.category === cat.id;
    const chip = S.el('button');
    chip.style.cssText = 'flex-shrink:0;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;transition:all .2s;border:1px solid ' + (isActive ? 'var(--green)' : 'var(--border)') + ';background:' + (isActive ? 'rgba(0,255,136,.15)' : 'var(--surface)') + ';color:' + (isActive ? 'var(--green)' : 'var(--muted)') + ';cursor:pointer';
    chip.textContent = cat.emoji + ' ' + cat.label;
    chip.onclick = () => {
      SEARCH_STATE.category = cat.id;
      SEARCH_STATE.results = [];
      render();
      const input = document.getElementById('search-input');
      if (input) {
        input.value = '';
        input.focus();
      }
    };
    chipsContainer.appendChild(chip);
  });
  searchCard.appendChild(chipsContainer);
  wrap.appendChild(searchCard);

  // Resultados
  const resultsContainer = S.el('div');
  resultsContainer.id = 'search-results';
  resultsContainer.style.cssText = 'margin-top:16px';
  wrap.appendChild(resultsContainer);

  // Renderizar estado inicial o resultados
  setTimeout(() => {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    if (input) {
      input.oninput = (e) => {
        SEARCH_STATE.query = e.target.value;
        if (clearBtn) clearBtn.style.display = e.target.value ? 'grid' : 'none';
        debouncedSearch();
      };
      input.focus();
    }
    if (clearBtn) clearBtn.onclick = () => {
      input.value = '';
      SEARCH_STATE.query = '';
      clearBtn.style.display = 'none';
      renderResults();
    };

    const manualBtn = document.getElementById('manual-add');
    if (manualBtn) manualBtn.onclick = () => showManualAddModal();

    renderResults();
  }, 50);

  return wrap;
}

let searchTimeout = null;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    await renderResults();
  }, 200);
}

async function renderResults() {
  const S = window.SomaAi;
  const container = document.getElementById('search-results');
  if (!container || !S) return;

  const q = SEARCH_STATE.query.trim();
  const cat = SEARCH_STATE.category;

  if (!q) {
    // Mostrar ejemplos si no hay búsqueda
    const catObj = SEARCH_CATEGORIES.find(c => c.id === cat);
    let ejemplos = [];
    if (cat === 'todas') {
      ejemplos = ['manzana', 'pollo', 'arroz', 'yogur', 'coca cola', 'empanada'];
    } else {
      // Cargar algunos ejemplos de la categoría
      const foods = await loadCategoryFoods(cat);
      ejemplos = foods.slice(0, 6).map(f => f.name.split(' ')[0].toLowerCase());
    }

    container.innerHTML =
      '<div class="card card-pad fade-in-up" style="text-align:center;padding:40px 20px">' +
        '<div style="font-size:48px">' + (catObj ? catObj.emoji : '🔍') + '</div>' +
        '<div class="h2" style="margin-top:16px">' + (cat === 'todas' ? 'Escribí para buscar' : 'Buscá en ' + (catObj ? catObj.label : '')) + '</div>' +
        '<div class="muted" style="font-size:13px;margin-top:8px">Tenemos ' + (S.state.foodsCount || 0) + ' alimentos disponibles</div>' +
        (ejemplos.length > 0 ?
          '<div class="eyebrow" style="margin-top:20px;color:var(--muted2)">EJEMPLOS</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:12px">' +
            ejemplos.map(e => '<button class="btn btn-ghost btn-sm" data-example="' + escapeHtmlSearch(e) + '" style="font-size:11px">' + escapeHtmlSearch(e) + '</button>').join('') +
          '</div>'
          : '') +
      '</div>';

    setTimeout(() => {
      document.querySelectorAll('[data-example]').forEach(btn => {
        btn.onclick = () => {
          const input = document.getElementById('search-input');
          if (input) {
            input.value = btn.dataset.example;
            SEARCH_STATE.query = btn.dataset.example;
            renderResults();
          }
        };
      });
    }, 50);
    return;
  }

  // Buscar
  container.innerHTML = '<div class="card card-pad" style="text-align:center;padding:40px 20px"><div class="skel" style="height:20px;width:60%;margin:0 auto 16px"></div><div class="skel" style="height:14px;width:40%;margin:0 auto"></div></div>';
  const results = await searchFoods(q, cat);

  if (results.length === 0) {
    container.innerHTML =
      '<div class="card card-pad" style="text-align:center;padding:40px 20px">' +
        '<div style="font-size:48px">😕</div>' +
        '<div class="h2" style="margin-top:16px">Sin resultados</div>' +
        '<div class="muted" style="font-size:13px;margin-top:8px">No encontramos "' + escapeHtmlSearch(q) + '" en ' + (cat === 'todas' ? 'las bases' : SEARCH_CATEGORIES.find(c => c.id === cat)?.label) + '</div>' +
        '<button class="btn btn-primary" id="manual-add-2" style="margin-top:20px">+ Agregar manualmente</button>' +
      '</div>';
    setTimeout(() => {
      const btn = document.getElementById('manual-add-2');
      if (btn) btn.onclick = () => showManualAddModal(q);
    }, 50);
    return;
  }

  let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div class="eyebrow">RESULTADOS</div><span class="pill" style="font-size:10px">' + results.length + '</span></div>';
  html += '<div class="card" style="overflow:hidden">';
  results.forEach((f, i) => {
    html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:' + (i < results.length - 1 ? '1px solid var(--border)' : 'none') + '">' +
      '<div style="width:44px;height:44px;border-radius:12px;background:var(--surface);display:grid;place-items:center;font-size:20px;flex-shrink:0">' + (f.emoji || '🍽️') + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtmlSearch(f.name) + '</div>' +
        (f.brand ? '<div class="muted2" style="font-size:10px">' + escapeHtmlSearch(f.brand) + '</div>' : '') +
        '<div style="display:flex;gap:6px;margin-top:4px">' +
          '<span class="mono" style="font-size:10px;color:var(--muted)">' + (f.kcal || 0) + ' kcal</span>' +
          '<span class="mono" style="font-size:10px;color:var(--green)">P ' + (f.p || 0) + 'g</span>' +
          '<span class="mono" style="font-size:10px;color:var(--cyan)">C ' + (f.c || 0) + 'g</span>' +
          '<span class="mono" style="font-size:10px;color:var(--pink)">F ' + (f.f || 0) + 'g</span>' +
        '</div>' +
      '</div>' +
      '<button class="icon-btn" data-add-idx="' + i + '" style="background:linear-gradient(135deg,var(--green),#00e07a);color:#000;border:none;font-weight:900;width:36px;height:36px;flex-shrink:0">+</button>' +
    '</div>';
  });
  html += '</div>';
  container.innerHTML = html;

  setTimeout(() => {
    document.querySelectorAll('[data-add-idx]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.addIdx);
        const food = results[idx];
        if (food) showAddFoodModal(food);
      };
    });
  }, 50);
}

/* ------------------------- Modal: Agregar alimento ------------------------- */
function showAddFoodModal(food) {
  const S = window.SomaAi;
  if (!S) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1);max-height:85vh;overflow-y:auto';
  modal.innerHTML =
    '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>' +
    '<div style="display:flex;align-items:center;gap:12px">' +
      '<div style="width:56px;height:56px;border-radius:16px;background:var(--surface);display:grid;place-items:center;font-size:28px">' + (food.emoji || '🍽️') + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div class="h2" style="font-size:16px">' + escapeHtmlSearch(food.name) + '</div>' +
        (food.brand ? '<div class="muted2" style="font-size:11px">' + escapeHtmlSearch(food.brand) + '</div>' : '') +
      '</div>' +
    '</div>' +
    '<div class="grid g-4" style="margin-top:16px;gap:6px">' +
      '<div style="padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border);text-align:center"><div class="mono" style="font-size:14px;font-weight:800;color:var(--green)">' + (food.kcal || 0) + '</div><div class="muted2" style="font-size:9px">kcal</div></div>' +
      '<div style="padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border);text-align:center"><div class="mono" style="font-size:14px;font-weight:800;color:var(--green)">' + (food.p || 0) + 'g</div><div class="muted2" style="font-size:9px">prot</div></div>' +
      '<div style="padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border);text-align:center"><div class="mono" style="font-size:14px;font-weight:800;color:var(--cyan)">' + (food.c || 0) + 'g</div><div class="muted2" style="font-size:9px">carb</div></div>' +
      '<div style="padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border);text-align:center"><div class="mono" style="font-size:14px;font-weight:800;color:var(--pink)">' + (food.f || 0) + 'g</div><div class="muted2" style="font-size:9px">grasa</div></div>' +
    '</div>' +
    '<div class="muted2" style="font-size:10px;text-align:center;margin-top:6px">Valores por 100g</div>' +
    '<label style="display:flex;flex-direction:column;gap:6px;margin-top:20px"><span class="eyebrow">Cantidad (g)</span><input type="number" id="add-grams" value="100" style="padding:12px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:16px;font-weight:700" /></label>' +
    '<div style="margin-top:16px"><span class="eyebrow">Comida</span><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:8px" id="meal-buttons">' +
      ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'].map(m => '<button class="btn btn-ghost btn-sm" data-meal="' + m + '" style="font-size:10px;padding:8px 4px">' + m.charAt(0).toUpperCase() + m.slice(1, 3) + '</button>').join('') +
    '</div></div>' +
    '<div style="display:flex;gap:8px;margin-top:20px">' +
      '<button class="btn btn-ghost" id="modal-cancel" style="flex:1">Cancelar</button>' +
      '<button class="btn btn-primary" id="modal-add" style="flex:2">+ Agregar al día</button>' +
    '</div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);

  let selectedMeal = 'almuerzo';
  const mealBtns = modal.querySelectorAll('[data-meal]');
  mealBtns.forEach(b => {
    b.onclick = () => {
      mealBtns.forEach(x => x.classList.remove('btn-primary'));
      b.classList.add('btn-primary');
      selectedMeal = b.dataset.meal;
    };
  });
  mealBtns[1].classList.add('btn-primary');

  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  modal.querySelector('#modal-cancel').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#modal-add').onclick = () => {
    const grams = parseInt(modal.querySelector('#add-grams').value) || 100;
    addFoodToDay(food, grams, selectedMeal);
    close();
  };
}

function addFoodToDay(food, grams, meal) {
  const S = window.SomaAi;
  if (!S) return;
  // Verificar si el alimento existe en state.foods
  let foodId = food.id;
  if (!S.state.foods.find(f => f.id === foodId)) {
    foodId = 'custom_' + Date.now();
    food.id = foodId;
    S.state.foods.push(food);
    if (!S.state.customFoods) S.state.customFoods = [];
    S.state.customFoods.push(food);
  }
  S.state.entries.push({
    foodId: foodId,
    food: food,
    grams: grams,
    meal: meal,
    date: new Date().toISOString().slice(0, 10),
    addedAt: new Date().toISOString(),
  });
  S.saveState();
  S.toast('✅ ' + food.name + ' (' + grams + 'g) agregado a ' + meal);
  S.haptic();
}

/* ------------------------- Modal: Agregar manualmente ------------------------- */
function showManualAddModal(prefillName) {
  const S = window.SomaAi;
  if (!S) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1);max-height:90vh;overflow-y:auto';
  modal.innerHTML =
    '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>' +
    '<div class="eyebrow" style="color:var(--green)">✏️ AGREGAR MANUALMENTE</div>' +
    '<div class="h2" style="margin-top:8px">Alimento personalizado</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px">Para productos que no están en la base. Valores por 100g.</div>' +
    '<div style="margin-top:20px">' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"><span class="eyebrow">NOMBRE</span><input type="text" id="ma-name" value="' + escapeHtmlSearch(prefillName || '') + '" placeholder="Ej: Tortilla casera" style="padding:12px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:14px" /></label>' +
      '<div class="grid g-2" style="gap:12px">' +
        '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">CALORÍAS (KCAL)</span><input type="number" id="ma-kcal" value="0" style="padding:12px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:14px" /></label>' +
        '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">PROTEÍNA (G)</span><input type="number" id="ma-p" value="0" style="padding:12px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:14px" /></label>' +
        '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">CARBOS (G)</span><input type="number" id="ma-c" value="0" style="padding:12px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:14px" /></label>' +
        '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">GRASA (G)</span><input type="number" id="ma-f" value="0" style="padding:12px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:14px" /></label>' +
      '</div>' +
      '<div style="margin-top:16px"><span class="eyebrow">COMIDA</span><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:8px" id="ma-meals">' +
        ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'].map(m => '<button class="btn btn-ghost btn-sm" data-ma-meal="' + m + '" style="font-size:10px;padding:8px 4px">' + m.charAt(0).toUpperCase() + m.slice(1, 3) + '</button>').join('') +
      '</div></div>' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-top:16px"><span class="eyebrow">CANTIDAD (GRAMOS)</span><input type="number" id="ma-grams" value="100" style="padding:12px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:14px" /></label>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:20px">' +
      '<button class="btn btn-ghost" id="ma-cancel" style="flex:1">Cancelar</button>' +
      '<button class="btn btn-primary" id="ma-add" style="flex:2">+ Crear y agregar</button>' +
    '</div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);

  let selectedMeal = 'almuerzo';
  const mealBtns = modal.querySelectorAll('[data-ma-meal]');
  mealBtns.forEach(b => {
    b.onclick = () => {
      mealBtns.forEach(x => x.classList.remove('btn-primary'));
      b.classList.add('btn-primary');
      selectedMeal = b.dataset.maMeal;
    };
  });
  mealBtns[1].classList.add('btn-primary');

  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  modal.querySelector('#ma-cancel').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#ma-add').onclick = () => {
    const name = modal.querySelector('#ma-name').value.trim();
    if (!name) { S.toast('⚠️ Poné un nombre'); return; }
    const newFood = {
      id: 'manual_' + Date.now(),
      name: name,
      brand: '',
      emoji: '✏️',
      kcal: parseFloat(modal.querySelector('#ma-kcal').value) || 0,
      p: parseFloat(modal.querySelector('#ma-p').value) || 0,
      c: parseFloat(modal.querySelector('#ma-c').value) || 0,
      f: parseFloat(modal.querySelector('#ma-f').value) || 0,
      custom: true,
    };
    const grams = parseInt(modal.querySelector('#ma-grams').value) || 100;
    addFoodToDay(newFood, grams, selectedMeal);
    close();
  };
}

window.SomaAiSearch = {
  render: renderSearch,
};
