/* ============================================================================
   SomaAi — Módulo Perfil v5 (con foto, config y stats)
   ========================================================================== */

let profileEditMode = false;
let profileDraft = null;

function renderProfile() {
  const S = window.SomaAi;
  if (!S) return document.createElement('div');
  const s = S.state;
  const p = s.profile;

  if (!p.settings) {
    p.settings = {
      theme: 'dark', accent: 'green',
      notifications: { water: true, meals: true, daily: false },
      units: { weight: 'kg', energy: 'kcal' },
    };
  }

  const targets = S.calcTargets(p);
  const imc = Number(p.imc) || (p.weight / ((p.height / 100) ** 2));
  const imcCat = imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
  const imcColor = imc < 18.5 ? 'var(--cyan)' : imc < 25 ? 'var(--green)' : imc < 30 ? 'var(--amber)' : 'var(--red)';

  const wrap = S.el('div', { class: 'stack fade-in' });

  // ============ CARD 1: Cabecera con foto ============
  const card1 = S.el('div', { class: 'card card-pad fade-in-up' });
  const avatarSrc = p.avatar || S.state.profile.avatar || null;
  const avatarHtml = avatarSrc
    ? '<img src="' + avatarSrc + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="this.style.display=\'none\'" />'
    : '<span>👤</span>';
  card1.innerHTML =
    '<div style="display:flex;flex-direction:column;align-items:center;gap:16px">' +
      '<div class="profile-avatar" id="avatar-btn">' +
        '<div class="profile-avatar-inner">' + avatarHtml + '</div>' +
        '<div class="profile-avatar-edit">📷</div>' +
      '</div>' +
      '<div style="text-align:center">' +
        '<div class="h2">' + S.escapeHtml(p.name || 'Usuario') + '</div>' +
        '<div class="muted" style="font-size:12px;margin-top:4px">' + (p.sex === 'm' ? 'Masculino' : 'Femenino') + ' · ' + p.age + ' años</div>' +
        '<div style="display:flex;gap:6px;margin-top:10px;justify-content:center;flex-wrap:wrap">' +
          '<span class="pill green">🔥 ' + (p.streak || 1) + ' días</span>' +
          '<span class="pill">🎯 ' + (p.goal || 'mantener') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  wrap.appendChild(card1);

  // ============ CARD 2: Resumen nutricional ============
  const card2 = S.el('div', { class: 'card card-pad fade-in-up' });
  card2.innerHTML =
    '<div class="eyebrow">Resumen nutricional</div>' +
    '<div class="grid g-3" style="margin-top:12px;gap:8px">' +
      '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border);text-align:center"><div class="eyebrow">TMB</div><div class="mono" style="font-size:15px;font-weight:800;margin-top:4px;color:var(--green)">' + targets.tmb + '</div><div class="muted2" style="font-size:9px">kcal basal</div></div>' +
      '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border);text-align:center"><div class="eyebrow">Objetivo</div><div class="mono" style="font-size:15px;font-weight:800;margin-top:4px;color:var(--cyan)">' + targets.kcal + '</div><div class="muted2" style="font-size:9px">kcal/día</div></div>' +
      '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border);text-align:center"><div class="eyebrow">IMC</div><div class="mono" style="font-size:15px;font-weight:800;margin-top:4px;color:' + imcColor + '">' + imc.toFixed(1) + '</div><div class="muted2" style="font-size:9px">' + imcCat + '</div></div>' +
    '</div>';
  wrap.appendChild(card2);

  // ============ CARD 3: Estadísticas del usuario ============
  const statsCard = S.el('div', { class: 'card card-pad fade-in-up' });
  const totalEntries = s.entries.length;
  const totalWater = s.water;
  const totalDays = (p.weightHistory || []).length;
  const avgKcal = totalEntries > 0 ? Math.round(s.entries.reduce((sum, e) => {
    const food = s.foods.find(f => f.id === e.foodId) || e.food;
    return sum + ((food?.kcal || 0) * (e.grams || 100) / 100);
  }, 0)) : 0;
  statsCard.innerHTML =
    '<div class="eyebrow">📊 Tus estadísticas</div>' +
    '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-card-icon">🍽️</div><div class="stat-card-value" style="color:var(--green)">' + totalEntries + '</div><div class="stat-card-label">Comidas hoy</div></div>' +
      '<div class="stat-card"><div class="stat-card-icon">💧</div><div class="stat-card-value" style="color:var(--cyan)">' + totalWater + '</div><div class="stat-card-label">ml de agua</div></div>' +
      '<div class="stat-card"><div class="stat-card-icon">⚖️</div><div class="stat-card-value" style="color:var(--pink)">' + totalDays + '</div><div class="stat-card-label">Registros peso</div></div>' +
      '<div class="stat-card"><div class="stat-card-icon">🔥</div><div class="stat-card-value" style="color:var(--amber)">' + avgKcal + '</div><div class="stat-card-label">kcal hoy</div></div>' +
    '</div>';
  wrap.appendChild(statsCard);

  // ============ CARD 4: Configuración ============
  const settingsCard = S.el('div', { class: 'card card-pad fade-in-up' });
  settingsCard.innerHTML =
    '<div class="h2">⚙️ Configuración</div>' +
    '<div class="settings-list">' +
      '<button class="settings-item" id="set-personal">' +
        '<div class="settings-item-icon">👤</div>' +
        '<div class="settings-item-content"><div class="settings-item-title">Datos personales</div><div class="settings-item-sub">Nombre, edad, peso, altura</div></div>' +
        '<div class="settings-item-arrow">›</div>' +
      '</button>' +
      '<button class="settings-item" id="set-goals">' +
        '<div class="settings-item-icon">🎯</div>' +
        '<div class="settings-item-content"><div class="settings-item-title">Objetivos y metas</div><div class="settings-item-sub">Objetivo, velocidad, deporte</div></div>' +
        '<div class="settings-item-arrow">›</div>' +
      '</button>' +
      '<button class="settings-item" id="set-appearance">' +
        '<div class="settings-item-icon">🎨</div>' +
        '<div class="settings-item-content"><div class="settings-item-title">Apariencia</div><div class="settings-item-sub">Tema, color de acento, unidades</div></div>' +
        '<div class="settings-item-arrow">›</div>' +
      '</button>' +
      '<button class="settings-item" id="set-notifications">' +
        '<div class="settings-item-icon">🔔</div>' +
        '<div class="settings-item-content"><div class="settings-item-title">Notificaciones</div><div class="settings-item-sub">Recordatorios y alertas</div></div>' +
        '<div class="settings-item-arrow">›</div>' +
      '</button>' +
      '<button class="settings-item" id="set-data">' +
        '<div class="settings-item-icon">💾</div>' +
        '<div class="settings-item-content"><div class="settings-item-title">Datos y respaldo</div><div class="settings-item-sub">Exportar, importar, reset</div></div>' +
        '<div class="settings-item-arrow">›</div>' +
      '</button>' +
      '<button class="settings-item" id="set-about">' +
        '<div class="settings-item-icon">ℹ️</div>' +
        '<div class="settings-item-content"><div class="settings-item-title">Acerca de SomaAi</div><div class="settings-item-sub">Versión, licencias, soporte</div></div>' +
        '<div class="settings-item-arrow">›</div>' +
      '</button>' +
    '</div>';
  wrap.appendChild(settingsCard);

  // ============ CARD 5: Recordatorios rápidos ============
  const notifCard = S.el('div', { class: 'card card-pad fade-in-up' });
  notifCard.innerHTML =
    '<div class="h2">🔔 Recordatorios rápidos</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' +
      '<button class="btn btn-ghost" id="notif-water" style="width:100%;justify-content:flex-start">💧 Activar agua (cada 2h)</button>' +
      '<button class="btn btn-ghost" id="notif-meals" style="width:100%;justify-content:flex-start">🍽️ Activar comidas</button>' +
      '<button class="btn btn-ghost" id="notif-test" style="width:100%;justify-content:flex-start">🧪 Probar notificación</button>' +
    '</div>';
  wrap.appendChild(notifCard);

  // ============ CARD 6: Historial de peso ============
  const history = p.weightHistory || [];
  const card3 = S.el('div', { class: 'card card-pad fade-in-up' });
  card3.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center"><div class="h2">📊 Historial de peso</div><button class="btn btn-primary btn-sm" id="add-weight">+ Peso</button></div>' +
    (history.length === 0 ? '<div class="muted" style="font-size:12px;margin-top:12px;text-align:center;padding:20px 0">Todavía no hay registros.</div>' : '');
  if (history.length > 0) {
    const weights = history.map(h => h.kg);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const avgW = weights.reduce((a, b) => a + b, 0) / weights.length;
    const statsDiv = S.el('div');
    statsDiv.style.cssText = 'margin-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px';
    statsDiv.innerHTML =
      '<div style="padding:10px;background:var(--surface);border-radius:12px;border:1px solid var(--border);text-align:center"><div class="muted2" style="font-size:9px">MÍN</div><div class="mono" style="font-size:14px;font-weight:800;margin-top:2px">' + minW.toFixed(1) + '</div></div>' +
      '<div style="padding:10px;background:var(--surface);border-radius:12px;border:1px solid var(--border);text-align:center"><div class="muted2" style="font-size:9px">PROM</div><div class="mono" style="font-size:14px;font-weight:800;margin-top:2px">' + avgW.toFixed(1) + '</div></div>' +
      '<div style="padding:10px;background:var(--surface);border-radius:12px;border:1px solid var(--border);text-align:center"><div class="muted2" style="font-size:9px">MÁX</div><div class="mono" style="font-size:14px;font-weight:800;margin-top:2px">' + maxW.toFixed(1) + '</div></div>';
    card3.appendChild(statsDiv);
    if (history.length >= 2) {
      const chart = renderWeightChart(history);
      if (chart) card3.appendChild(chart);
    }
    const listContainer = S.el('div');
    listContainer.style.cssText = 'margin-top:16px;display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto';
    history.slice().reverse().forEach(h => {
      const row = S.el('div');
      row.style.cssText = 'display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px';
      row.innerHTML = '<span class="muted">' + h.date + '</span><span class="mono" style="font-weight:700">' + h.kg.toFixed(1) + ' kg</span>';
      listContainer.appendChild(row);
    });
    card3.appendChild(listContainer);
  }
  wrap.appendChild(card3);

  // Handlers
  attachProfileHandlers(S, wrap);
  return wrap;
}

function attachProfileHandlers(S, wrap) {
  setTimeout(() => {
    const avatarBtn = document.getElementById('avatar-btn');
    if (avatarBtn) avatarBtn.onclick = () => showAvatarOptions(S);

    const setPersonal = document.getElementById('set-personal');
    if (setPersonal) setPersonal.onclick = () => { S.haptic(); showEditPersonalModal(S); };
    const setGoals = document.getElementById('set-goals');
    if (setGoals) setGoals.onclick = () => { S.haptic(); showEditGoalsModal(S); };
    const setAppearance = document.getElementById('set-appearance');
    if (setAppearance) setAppearance.onclick = () => { S.haptic(); showAppearanceSettings(S); };
    const setNotif = document.getElementById('set-notifications');
    if (setNotif) setNotif.onclick = () => { S.haptic(); showNotificationsSettings(S); };
    const setData = document.getElementById('set-data');
    if (setData) setData.onclick = () => { S.haptic(); showDataSettings(S); };
    const setAbout = document.getElementById('set-about');
    if (setAbout) setAbout.onclick = () => { S.haptic(); showAboutModal(S); };

    const notifWater = document.getElementById('notif-water');
    if (notifWater) notifWater.onclick = () => { S.haptic('light'); if (window.SomaAiUtils) window.SomaAiUtils.scheduleWater(); };
    const notifMeals = document.getElementById('notif-meals');
    if (notifMeals) notifMeals.onclick = () => { S.haptic('light'); if (window.SomaAiUtils) window.SomaAiUtils.scheduleMeals(); };
    const notifTest = document.getElementById('notif-test');
    if (notifTest) notifTest.onclick = async () => {
      S.haptic('light');
      if (window.SomaAiUtils && window.SomaAiUtils.state.isCapacitor) {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const perm = await LocalNotifications.checkPermissions();
          if (perm.display !== 'granted') {
            const req = await LocalNotifications.requestPermissions();
            if (req.display !== 'granted') { S.toast('❌ Permiso denegado'); return; }
          }
          await LocalNotifications.schedule({ notifications: [{ id: 9999, title: '🧪 Prueba', body: 'SomaAi funciona', schedule: { at: new Date(Date.now() + 2000) }, sound: null }] });
          S.toast('✅ En 2s');
        } catch (e) { S.toast('❌ Error'); }
      } else { S.toast('🔔 Solo en APK'); }
    };

    const addWeight = document.getElementById('add-weight');
    if (addWeight) addWeight.onclick = () => {
      const val = prompt('Nuevo peso (kg):', S.state.weight);
      if (val && !isNaN(val)) {
        const kg = parseFloat(val);
        if (kg < 20 || kg > 300) { S.toast('⚠️ Peso inválido (20-300 kg)'); return; }
        S.state.weight = kg;
        S.state.profile.weight = kg;
        S.state.profile.imc = kg / ((S.state.profile.height / 100) ** 2);
        if (!S.state.profile.weightHistory) S.state.profile.weightHistory = [];
        const today = new Date().toISOString().slice(0, 10);
        const existingIdx = S.state.profile.weightHistory.findIndex(h => h.date === today);
        if (existingIdx >= 0) S.state.profile.weightHistory[existingIdx] = { date: today, kg };
        else S.state.profile.weightHistory.push({ date: today, kg });
        S.saveState();
        render();
        S.toast('✅ Peso registrado');
      }
    };
  }, 50);
}

function showAvatarOptions(S) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1)';
  const hasAvatar = S.state.profile.avatar ? true : false;
  modal.innerHTML =
    '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>' +
    '<div class="h2">Foto de perfil</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px">Elegí una foto para personalizar tu perfil</div>' +
    '<div class="modal-options">' +
      '<button class="modal-option" id="avatar-gallery"><div class="modal-option-icon">🖼️</div>Elegir de galería</button>' +
      '<button class="modal-option" id="avatar-camera"><div class="modal-option-icon">📷</div>Tomar foto</button>' +
      (hasAvatar ? '<button class="modal-option" id="avatar-remove" style="color:var(--red)"><div class="modal-option-icon" style="color:var(--red)">🗑️</div>Eliminar foto</button>' : '') +
      '<button class="modal-option" id="avatar-cancel"><div class="modal-option-icon">✕</div>Cancelar</button>' +
    '</div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);
  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#avatar-cancel').onclick = close;
  modal.querySelector('#avatar-gallery').onclick = () => { pickImage(S, 'gallery'); close(); };
  modal.querySelector('#avatar-camera').onclick = () => { pickImage(S, 'camera'); close(); };
  const removeBtn = modal.querySelector('#avatar-remove');
  if (removeBtn) removeBtn.onclick = () => { S.state.profile.avatar = null; S.saveState(); render(); S.toast('🗑️ Foto eliminada'); close(); };
}

async function pickImage(S, source) {
  const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  
  if (isCapacitor) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        width: 400,
        height: 400,
      });
      if (image.base64String) {
        const newAvatar = 'data:image/' + image.format + ';base64,' + image.base64String;
        S.state.profile.avatar = newAvatar;
        try { localStorage.setItem('somaai_state', JSON.stringify({
          version: S.state.version, date: S.state.date, water: S.state.water,
          weight: S.state.weight, entries: S.state.entries, profile: S.state.profile,
          customFoods: S.state.customFoods,
        })); } catch (e) {}
        S.state.currentTab = 'perfil';
        S.render();
        setTimeout(() => S.render(), 100);
        S.toast('✅ Foto actualizada');
        S.haptic('success');
      }
    } catch (e) {
      if (e.message && !e.message.includes('cancel')) S.toast('❌ Error: ' + e.message);
    }
  } else {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.capture = 'user';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        S.state.profile.avatar = ev.target.result;
        try { localStorage.setItem('somaai_state', JSON.stringify({
          version: S.state.version, date: S.state.date, water: S.state.water,
          weight: S.state.weight, entries: S.state.entries, profile: S.state.profile,
          customFoods: S.state.customFoods,
        })); } catch (e) {}
        S.state.currentTab = 'perfil';
        S.render();
        setTimeout(() => S.render(), 100);
        S.toast('✅ Foto actualizada');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }
}

function showEditPersonalModal(S) {
  const p = S.state.profile;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1);max-height:90vh;overflow-y:auto';
  modal.innerHTML =
    '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>' +
    '<div class="h2">👤 Datos personales</div>' +
    '<div style="margin-top:20px">' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"><span class="eyebrow">Nombre</span><input type="text" id="pe-name" value="' + (p.name || '') + '" class="input-field" /></label>' +
      '<div class="grid g-2" style="gap:12px">' +
        '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">Edad</span><input type="number" id="pe-age" value="' + p.age + '" class="input-field" /></label>' +
        '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">Altura (cm)</span><input type="number" id="pe-height" value="' + p.height + '" class="input-field" /></label>' +
        '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">Peso (kg)</span><input type="number" id="pe-weight" value="' + p.weight + '" class="input-field" /></label>' +
        '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">Sexo</span><select id="pe-sex" class="input-field"><option value="f"' + (p.sex === 'f' ? ' selected' : '') + '>Femenino</option><option value="m"' + (p.sex === 'm' ? ' selected' : '') + '>Masculino</option></select></label>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:20px"><button class="btn btn-ghost" id="pe-cancel" style="flex:1">Cancelar</button><button class="btn btn-primary" id="pe-save" style="flex:2">Guardar</button></div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);
  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#pe-cancel').onclick = close;
  modal.querySelector('#pe-save').onclick = () => {
    const name = modal.querySelector('#pe-name').value.trim();
    const age = parseInt(modal.querySelector('#pe-age').value) || 28;
    const height = parseFloat(modal.querySelector('#pe-height').value) || 168;
    const weight = parseFloat(modal.querySelector('#pe-weight').value) || 72.4;
    const sex = modal.querySelector('#pe-sex').value;
    if (weight < 20 || weight > 300) { S.toast('⚠️ Peso inválido'); return; }
    if (height < 100 || height > 250) { S.toast('⚠️ Altura inválida'); return; }
    if (age < 10 || age > 100) { S.toast('⚠️ Edad inválida'); return; }
    S.state.profile.name = name || 'Usuario';
    S.state.profile.age = age;
    S.state.profile.height = height;
    S.state.profile.weight = weight;
    S.state.profile.sex = sex;
    S.state.profile.imc = weight / ((height / 100) ** 2);
    S.state.weight = weight;
    S.saveState(); render(); S.toast('✅ Datos guardados'); close();
  };
}

function showEditGoalsModal(S) {
  const p = S.state.profile;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1);max-height:90vh;overflow-y:auto';
  modal.innerHTML =
    '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>' +
    '<div class="h2">🎯 Objetivos y metas</div>' +
    '<div style="margin-top:20px">' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"><span class="eyebrow">Objetivo</span><select id="pg-goal" class="input-field"><option value="perder"' + (p.goal === 'perder' ? ' selected' : '') + '>Perder grasa</option><option value="mantener"' + (p.goal === 'mantener' ? ' selected' : '') + '>Mantener</option><option value="ganar"' + (p.goal === 'ganar' ? ' selected' : '') + '>Ganar músculo</option></select></label>' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"><span class="eyebrow">Nivel de actividad</span><select id="pg-activity" class="input-field"><option value="sedentaria"' + (p.activity === 'sedentaria' ? ' selected' : '') + '>Sedentaria</option><option value="ligera"' + (p.activity === 'ligera' ? ' selected' : '') + '>Ligera</option><option value="moderada"' + (p.activity === 'moderada' ? ' selected' : '') + '>Moderada</option><option value="alta"' + (p.activity === 'alta' ? ' selected' : '') + '>Alta</option><option value="atleta"' + (p.activity === 'atleta' ? ' selected' : '') + '>Atleta</option></select></label>' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"><span class="eyebrow">Deporte</span><select id="pg-sport" class="input-field"><option value="ninguno"' + (p.sport === 'ninguno' ? ' selected' : '') + '>Ninguno</option><option value="futbol"' + (p.sport === 'futbol' ? ' selected' : '') + '>Fútbol</option><option value="gym"' + (p.sport === 'gym' ? ' selected' : '') + '>Gym</option><option value="running"' + (p.sport === 'running' ? ' selected' : '') + '>Running</option><option value="ciclismo"' + (p.sport === 'ciclismo' ? ' selected' : '') + '>Ciclismo</option><option value="crossfit"' + (p.sport === 'crossfit' ? ' selected' : '') + '>CrossFit</option></select></label>' +
      '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">Días por semana</span><input type="number" id="pg-days" value="' + (p.trainingDays || 3) + '" min="0" max="7" class="input-field" /></label>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:20px"><button class="btn btn-ghost" id="pg-cancel" style="flex:1">Cancelar</button><button class="btn btn-primary" id="pg-save" style="flex:2">Guardar</button></div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);
  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#pg-cancel').onclick = close;
  modal.querySelector('#pg-save').onclick = () => {
    S.state.profile.goal = modal.querySelector('#pg-goal').value;
    S.state.profile.activity = modal.querySelector('#pg-activity').value;
    S.state.profile.sport = modal.querySelector('#pg-sport').value;
    S.state.profile.trainingDays = parseInt(modal.querySelector('#pg-days').value) || 3;
    S.saveState(); render(); S.toast('✅ Objetivos actualizados'); close();
  };
}

function showAppearanceSettings(S) {
  const set = S.state.profile.settings;
  const currentTheme = localStorage.getItem('somaai_theme') || 'dark';
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1)';
  modal.innerHTML =
    '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>' +
    '<div class="h2">🎨 Apariencia</div>' +
    '<div style="margin-top:20px">' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"><span class="eyebrow">Tema</span><select id="ap-theme" class="input-field"><option value="dark"' + (currentTheme === 'dark' ? ' selected' : '') + '>🌙 Oscuro</option><option value="light"' + (currentTheme === 'light' ? ' selected' : '') + '>☀️ Claro</option><option value="auto"' + (currentTheme === 'auto' ? ' selected' : '') + '>🌗 Automático</option></select></label>' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"><span class="eyebrow">Unidad de energía</span><select id="ap-energy" class="input-field"><option value="kcal"' + (set.units.energy === 'kcal' ? ' selected' : '') + '>Kilocalorías (kcal)</option><option value="kj"' + (set.units.energy === 'kj' ? ' selected' : '') + '>Kilojoules (kJ)</option></select></label>' +
      '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">Unidad de peso</span><select id="ap-weight" class="input-field"><option value="kg"' + (set.units.weight === 'kg' ? ' selected' : '') + '>Kilogramos (kg)</option><option value="lb"' + (set.units.weight === 'lb' ? ' selected' : '') + '>Libras (lb)</option></select></label>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:20px"><button class="btn btn-ghost" id="ap-cancel" style="flex:1">Cancelar</button><button class="btn btn-primary" id="ap-save" style="flex:2">Guardar</button></div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);
  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#ap-cancel').onclick = close;
  modal.querySelector('#ap-save').onclick = () => {
    const theme = modal.querySelector('#ap-theme').value;
    S.state.profile.settings.units.energy = modal.querySelector('#ap-energy').value;
    S.state.profile.settings.units.weight = modal.querySelector('#ap-weight').value;
    if (window.SomaAiFeatures) window.SomaAiFeatures.setTheme(theme);
    S.saveState(); render(); S.toast('✅ Apariencia guardada'); close();
  };
}

function showNotificationsSettings(S) {
  const notif = S.state.profile.settings.notifications;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1)';
  modal.innerHTML =
    '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>' +
    '<div class="h2">🔔 Notificaciones</div>' +
    '<div class="settings-list" style="margin-top:16px">' +
      '<div class="settings-item" style="cursor:default"><div class="settings-item-icon">💧</div><div class="settings-item-content"><div class="settings-item-title">Recordatorio de agua</div><div class="settings-item-sub">Cada 2 horas</div></div><label class="switch"><input type="checkbox" id="ns-water"' + (notif.water ? ' checked' : '') + '><span class="switch-slider"></span></label></div>' +
      '<div class="settings-item" style="cursor:default"><div class="settings-item-icon">🍽️</div><div class="settings-item-content"><div class="settings-item-title">Recordatorio de comidas</div><div class="settings-item-sub">Desayuno, almuerzo, merienda, cena</div></div><label class="switch"><input type="checkbox" id="ns-meals"' + (notif.meals ? ' checked' : '') + '><span class="switch-slider"></span></label></div>' +
      '<div class="settings-item" style="cursor:default"><div class="settings-item-icon">📊</div><div class="settings-item-content"><div class="settings-item-title">Resumen diario</div><div class="settings-item-sub">A las 21:00</div></div><label class="switch"><input type="checkbox" id="ns-daily"' + (notif.daily ? ' checked' : '') + '><span class="switch-slider"></span></label></div>' +
    '</div>' +
    '<button class="btn btn-primary" id="ns-save" style="width:100%;margin-top:20px">Guardar</button>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);
  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#ns-save').onclick = () => {
    S.state.profile.settings.notifications = { water: modal.querySelector('#ns-water').checked, meals: modal.querySelector('#ns-meals').checked, daily: modal.querySelector('#ns-daily').checked };
    S.saveState(); S.toast('✅ Notificaciones guardadas'); close();
  };
}

function showDataSettings(S) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1)';
  modal.innerHTML =
    '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>' +
    '<div class="h2">💾 Datos y respaldo</div>' +
    '<div class="modal-options">' +
      '<button class="modal-option" id="ds-export"><div class="modal-option-icon">📥</div>Exportar datos (JSON)</button>' +
      '<button class="modal-option" id="ds-import"><div class="modal-option-icon">📤</div>Importar datos</button>' +
      '<button class="modal-option" id="ds-redo"><div class="modal-option-icon">🔄</div>Re-hacer onboarding</button>' +
      '<button class="modal-option" id="ds-reset" style="color:var(--red)"><div class="modal-option-icon" style="color:var(--red)">⚠️</div>Reset total</button>' +
      '<button class="modal-option" id="ds-cancel"><div class="modal-option-icon">✕</div>Cancelar</button>' +
    '</div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);
  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#ds-cancel').onclick = close;
  modal.querySelector('#ds-export').onclick = () => {
    const data = { exportedAt: new Date().toISOString(), version: S.state.version, profile: S.state.profile, entries: S.state.entries, water: S.state.water, customFoods: S.state.customFoods };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'somaai-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); URL.revokeObjectURL(url);
    S.toast('📥 Datos exportados'); close();
  };
  modal.querySelector('#ds-import').onclick = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.profile) {
            S.state.profile = { ...S.state.profile, ...data.profile };
            if (data.entries) S.state.entries = data.entries;
            if (data.water !== undefined) S.state.water = data.water;
            if (data.customFoods) S.state.customFoods = data.customFoods;
            S.saveState(); render(); S.toast('✅ Datos importados');
          } else { S.toast('❌ Archivo inválido'); }
        } catch (err) { S.toast('❌ Error al leer el archivo'); }
      };
      reader.readAsText(file);
    };
    input.click(); close();
  };
  modal.querySelector('#ds-redo').onclick = () => {
    S.showConfirm('¿Re-hacer onboarding?', 'Se reiniciará tu perfil pero se mantienen los alimentos.', () => { S.state.profile.onboarded = false; S.saveState(); S.render(); });
    close();
  };
  modal.querySelector('#ds-reset').onclick = () => {
    S.showConfirm('⚠️ Reset total', 'Esto borrará TODOS tus datos. No se puede deshacer.', () => { localStorage.removeItem('somaai_state'); location.reload(); });
    close();
  };
}

function showAboutModal(S) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1)';
  modal.innerHTML =
    '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>' +
    '<div style="text-align:center;padding:20px 0">' +
      '<div style="width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,var(--green),var(--cyan));display:grid;place-items:center;font-size:40px;font-weight:900;color:#000;margin:0 auto">S</div>' +
      '<div class="h2" style="margin-top:16px">SomaAi</div>' +
      '<div class="muted" style="font-size:12px;margin-top:4px">Versión ' + (S.state.version || '1.0.0') + '</div>' +
      '<div class="muted" style="font-size:13px;margin-top:16px;line-height:1.6">Tu asistente nutricional inteligente.<br>Cálculo Mifflin-St Jeor · Reparto ISSN</div>' +
    '</div>' +
    '<button class="btn btn-primary" id="ab-close" style="width:100%;margin-top:20px">Cerrar</button>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);
  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#ab-close').onclick = close;
}

function renderWeightChart(history) {
  if (history.length < 2) return null;
  const data = history.slice(-30);
  const minKg = Math.min(...data.map(d => d.kg)) - 1;
  const maxKg = Math.max(...data.map(d => d.kg)) + 1;
  const range = maxKg - minKg || 1;
  const width = 300; const height = 100; const padding = 10;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * usableW;
    const y = padding + usableH - ((d.kg - minKg) / range) * usableH;
    return { x, y, kg: d.kg };
  });
  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
  const areaD = pathD + ' L' + points[points.length - 1].x.toFixed(1) + ' ' + (height - padding) + ' L' + points[0].x.toFixed(1) + ' ' + (height - padding) + ' Z';
  const diff = data[data.length - 1].kg - data[0].kg;
  const diffColor = diff < 0 ? 'var(--green)' : diff > 0 ? 'var(--amber)' : 'var(--muted)';
  const container = document.createElement('div');
  container.style.cssText = 'background:var(--surface);border-radius:12px;padding:12px;border:1px solid var(--border);margin-top:12px';
  container.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="muted2" style="font-size:10px">Últimos ' + data.length + ' registros</span><span class="mono" style="font-size:12px;font-weight:700;color:' + diffColor + '">' + (diff > 0 ? '+' : '') + diff.toFixed(1) + ' kg</span></div>' +
    '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%;height:auto"><defs><linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00ff88" stop-opacity="0.3"/><stop offset="100%" stop-color="#00ff88" stop-opacity="0"/></linearGradient></defs><path d="' + areaD + '" fill="url(#wgrad)"/><path d="' + pathD + '" fill="none" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>' + points.map(p => '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="2" fill="#00ff88"/>').join('') + '</svg>' +
    '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px" class="muted2"><span>' + data[0].date.slice(5) + '</span><span>' + data[data.length - 1].date.slice(5) + '</span></div>';
  return container;
}

window.SomaAiProfile = {
  render: renderProfile,
};
