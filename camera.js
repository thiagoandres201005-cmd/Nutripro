/* ============================================================================
   SomaAi — Módulo Cámara v2 con mejor manejo de permisos
   ========================================================================== */

let cameraState = {
  product: null,
  loading: false,
  error: null,
  meal: null,
};

function renderCamera() {
  const S = window.SomaAi;
  if (!S) return document.createElement('div');
  const wrap = S.el('div', { class: 'stack fade-in' });

  const card = S.el('div', { class: 'card card-pad fade-in-up' });
  
  if (cameraState.product) {
    card.innerHTML = renderProductCard(cameraState.product);
  } else if (cameraState.loading) {
    card.innerHTML = '<div style="text-align:center;padding:40px 0"><div class="skel" style="height:20px;width:60%;margin:0 auto 16px"></div><div class="skel" style="height:14px;width:40%;margin:0 auto"></div><div class="muted" style="font-size:12px;margin-top:16px">Buscando producto...</div></div>';
  } else {
    card.innerHTML =
      '<div style="text-align:center;padding:20px 0">' +
        '<div style="font-size:64px">📷</div>' +
        '<div class="h2" style="margin-top:16px">Escanear producto</div>' +
        '<div class="muted" style="font-size:13px;margin-top:8px;line-height:1.5">Apuntá la cámara al código de barras del producto. Se buscará automáticamente en la base de datos de Open Food Facts.</div>' +
        '<button class="btn btn-primary" id="scan-btn" style="margin-top:24px;width:100%">' +
          '🔍 Abrir cámara' +
        '</button>' +
        '<div class="muted2" style="font-size:11px;margin-top:16px">También podés ingresar el código manualmente:</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px">' +
          '<input type="text" id="barcode-manual" placeholder="Código de barras" style="flex:1;padding:10px;border-radius:10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:13px" />' +
          '<button class="btn btn-ghost btn-sm" id="manual-search">Buscar</button>' +
        '</div>' +
      '</div>';
  }
  wrap.appendChild(card);

  if (cameraState.product) {
    const addCard = S.el('div', { class: 'card card-pad fade-in-up' });
    addCard.innerHTML =
      '<div class="eyebrow">Agregar al día</div>' +
      '<div style="margin-top:12px">' +
        '<label style="display:flex;flex-direction:column;gap:6px">' +
          '<span class="eyebrow">Cantidad (g)</span>' +
          '<input type="number" id="cam-grams" value="100" style="padding:10px;border-radius:10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:14px" />' +
        '</label>' +
      '</div>' +
      '<div style="margin-top:12px">' +
        '<span class="eyebrow">Comida</span>' +
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
          ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'].map(m => 
            '<button class="btn btn-ghost btn-sm" data-cam-meal="' + m + '" style="flex:1;min-width:70px">' + m.charAt(0).toUpperCase() + m.slice(1) + '</button>'
          ).join('') +
        '</div>' +
      '</div>' +
      '<button class="btn btn-primary" id="cam-add" style="width:100%;margin-top:16px">+ Agregar al día</button>' +
      '<button class="btn btn-ghost" id="cam-cancel" style="width:100%;margin-top:8px">Cancelar</button>';
    wrap.appendChild(addCard);
  }

  setTimeout(() => {
    const scanBtn = document.getElementById('scan-btn');
    if (scanBtn) scanBtn.onclick = startScan;
    
    const manualSearch = document.getElementById('manual-search');
    if (manualSearch) manualSearch.onclick = () => {
      const input = document.getElementById('barcode-manual');
      if (input && input.value.trim()) searchBarcode(input.value.trim());
    };

    document.querySelectorAll('[data-cam-meal]').forEach(b => {
      b.onclick = () => {
        cameraState.meal = b.dataset.camMeal;
        document.querySelectorAll('[data-cam-meal]').forEach(x => { x.classList.remove('btn-primary'); x.classList.add('btn-ghost'); });
        b.classList.remove('btn-ghost');
        b.classList.add('btn-primary');
      };
    });

    const addBtn = document.getElementById('cam-add');
    if (addBtn) addBtn.onclick = () => {
      const grams = parseInt(document.getElementById('cam-grams').value) || 100;
      const meal = cameraState.meal || 'snack';
      addScannedProduct(grams, meal);
    };

    const cancelBtn = document.getElementById('cam-cancel');
    if (cancelBtn) cancelBtn.onclick = () => { cameraState.product = null; cameraState.error = null; render(); };
  }, 50);

  return wrap;
}

function renderProductCard(product) {
  const nutriments = product.nutriments || {};
  const kcal = Math.round(nutriments['energy-kcal_100g'] || 0);
  const p = Math.round((nutriments.proteins_100g || 0) * 10) / 10;
  const c = Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10;
  const f = Math.round((nutriments.fat_100g || 0) * 10) / 10;

  return '<div style="display:flex;gap:12px;align-items:flex-start">' +
    (product.image_url 
      ? '<img src="' + product.image_url + '" style="width:80px;height:80px;object-fit:contain;border-radius:12px;background:var(--surface);flex-shrink:0" />'
      : '<div style="width:80px;height:80px;border-radius:12px;background:var(--surface);display:grid;place-items:center;font-size:32px;flex-shrink:0">📦</div>') +
    '<div style="flex:1;min-width:0">' +
      '<div style="font-size:14px;font-weight:800;line-height:1.2">' + (product.product_name || 'Producto sin nombre') + '</div>' +
      '<div class="muted2" style="font-size:11px;margin-top:4px">' + (product.brands || 'Marca desconocida') + '</div>' +
      '<div class="mono" style="font-size:11px;color:var(--muted);margin-top:4px">' + (product.code || '') + '</div>' +
    '</div>' +
  '</div>' +
  '<div class="grid g-4" style="margin-top:16px;gap:6px">' +
    '<div style="padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border);text-align:center"><div class="mono" style="font-size:14px;font-weight:800;color:var(--green)">' + kcal + '</div><div class="muted2" style="font-size:9px">kcal</div></div>' +
    '<div style="padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border);text-align:center"><div class="mono" style="font-size:14px;font-weight:800;color:var(--green)">' + p + 'g</div><div class="muted2" style="font-size:9px">prot</div></div>' +
    '<div style="padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border);text-align:center"><div class="mono" style="font-size:14px;font-weight:800;color:var(--cyan)">' + c + 'g</div><div class="muted2" style="font-size:9px">carb</div></div>' +
    '<div style="padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border);text-align:center"><div class="mono" style="font-size:14px;font-weight:800;color:var(--pink)">' + f + 'g</div><div class="muted2" style="font-size:9px">grasa</div></div>' +
  '</div>' +
  '<div class="muted2" style="font-size:10px;text-align:center;margin-top:8px">Valores por 100g</div>';
}

async function startScan() {
  const S = window.SomaAi;
  if (!S) return;
  const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

  if (!isCapacitor) { S.toast('📱 En web, usá el campo manual'); return; }

  // PASO 1: Pedir permiso de cámara con @capacitor/camera (diálogo nativo como notificación)
  try {
    const { Camera } = await import('@capacitor/camera');
    const camPerm = await Camera.checkPermissions();
    if (camPerm.camera !== 'granted') {
      const reqPerm = await Camera.requestPermissions({ permissions: ['camera'] });
      if (reqPerm.camera !== 'granted') {
        if (S.showConfirm) {
          S.showConfirm('Permiso de cámara necesario', 'Necesitamos acceso a la cámara para escanear códigos. ¿Querés abrir los ajustes?', () => {
            try { window.open('app-settings:'); } catch (e) {}
          });
        }
        return;
      }
    }
  } catch (e) { console.warn('Camera permission error:', e); }

  // PASO 2: Escanear con MLKit
  try {
    const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
    const supported = await BarcodeScanner.isSupported();
    if (!supported.supported) { S.toast('❌ Escáner no soportado'); return; }
    const result = await BarcodeScanner.scan();
    if (result.barcodes && result.barcodes.length > 0) {
      searchBarcode(result.barcodes[0].rawValue);
    } else {
      S.toast('🔍 No se detectó código');
    }
  } catch (e) {
    S.toast('❌ Error: ' + (e.message || 'Desconocido'));
  }
}

async function searchBarcode(code) {
  const S = window.SomaAi;
  if (!S) return;
  
  cameraState.loading = true;
  cameraState.error = null;
  cameraState.product = null;
  render();

  try {
    const res = await fetch('https://world.openfoodfacts.org/api/v0/product/' + code + '.json');
    const data = await res.json();
    
    if (data.status === 1 && data.product) {
      cameraState.product = data.product;
      cameraState.loading = false;
      render();
      S.toast('✅ Producto encontrado');
      S.haptic('success');
    } else {
      cameraState.error = 'Producto no encontrado';
      cameraState.loading = false;
      render();
      S.toast('❌ Producto no encontrado');
    }
  } catch (e) {
    cameraState.error = 'Error al buscar';
    cameraState.loading = false;
    render();
    S.toast('❌ Error de conexión');
  }
}

function addScannedProduct(grams, meal) {
  const S = window.SomaAi;
  if (!S || !cameraState.product) return;
  
  const p = cameraState.product;
  const nutriments = p.nutriments || {};
  
  const food = {
    id: 'scan_' + p.code + '_' + Date.now(),
    name: p.product_name || 'Producto escaneado',
    brand: p.brands || '',
    emoji: '📦',
    kcal: Math.round(nutriments['energy-kcal_100g'] || 0),
    p: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
    c: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
    f: Math.round((nutriments.fat_100g || 0) * 10) / 10,
    custom: true,
    scanned: true,
  };
  
  S.state.customFoods.push(food);
  S.state.foods.push(food);
  
  S.state.entries.push({
    foodId: food.id,
    food: food,
    grams: grams,
    meal: meal,
    date: new Date().toISOString().slice(0, 10),
    addedAt: new Date().toISOString(),
  });
  
  S.saveState();
  
  cameraState.product = null;
  cameraState.meal = null;
  S.state.currentTab = 'hoy';
  S.render();
  S.toast('✅ ' + food.name + ' agregado');
  S.haptic('success');
}

window.SomaAiCamera = {
  render: renderCamera,
};
