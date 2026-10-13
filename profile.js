/* ============================================================================
   SomaAi — Módulo Perfil v3 (Gráfico como DOM, no string)
   ========================================================================== */

let profileEditMode = false;
let profileDraft = null;

function renderProfile() {
  const S = window.SomaAi;
  if (!S) return document.createElement('div');
  const s = S.state;
  const p = s.profile;
  const targets = S.calcTargets(p);
  const imc = Number(p.imc) || (p.weight / ((p.height / 100) ** 2));
  const imcCat = imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
  const imcColor = imc < 18.5 ? 'var(--cyan)' : imc < 25 ? 'var(--green)' : imc < 30 ? 'var(--amber)' : 'var(--red)';

  const wrap = S.el('div', { class: 'stack fade-in' });

  // Card 1: Cabecera
  const card1 = S.el('div', { class: 'card card-pad fade-in-up' });
  card1.innerHTML =
    '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
      '<div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,var(--green),var(--cyan));padding:2px;flex-shrink:0">' +
        '<div style="width:100%;height:100%;border-radius:18px;background:var(--card);display:grid;place-items:center;font-size:28px">👤</div>' +
      '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div class="h2">' + S.escapeHtml(p.name || 'Usuario') + '</div>' +
        '<div class="muted" style="font-size:12px;margin-top:2px">' + (p.sex === 'm' ? 'Masculino' : 'Femenino') + ' · ' + p.age + ' años · ' + p.height + ' cm</div>' +
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
          '<span class="pill green">🔥 ' + (p.streak || 1) + ' días</span>' +
          '<span class="pill">🎯 ' + (p.goal || 'mantener') + '</span>' +
          '<span class="pill cyan">⚡ ' + (p.activity || 'moderada') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="grid g-3" style="margin-top:20px;gap:8px">' +
      '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border)"><div class="eyebrow">TMB</div><div class="mono" style="font-size:14px;font-weight:800;margin-top:4px">' + targets.tmb + ' kcal</div><div class="muted2" style="font-size:10px">Metabolismo basal</div></div>' +
      '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border)"><div class="eyebrow">Objetivo</div><div class="mono" style="font-size:14px;font-weight:800;margin-top:4px">' + targets.kcal + ' kcal</div><div class="muted2" style="font-size:10px">Con actividad</div></div>' +
      '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border)"><div class="eyebrow">IMC</div><div class="mono" style="font-size:14px;font-weight:800;margin-top:4px;color:' + imcColor + '">' + imc.toFixed(1) + '</div><div class="muted2" style="font-size:10px">' + imcCat + '</div></div>' +
    '</div>';
  wrap.appendChild(card1);

  // Card 2: Editar
  const card2 = S.el('div', { class: 'card card-pad fade-in-up' });
  if (!profileEditMode) {
    card2.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center"><div class="h2">Datos personales</div><button class="btn btn-primary btn-sm" id="profile-edit">✎ Editar</button></div>' +
      '<div style="margin-top:16px;display:flex;flex-direction:column;gap:10px">' +
        profileFieldStatic('Nombre', p.name || 'Usuario') +
        profileFieldStatic('Sexo', p.sex === 'm' ? 'Masculino' : 'Femenino') +
        profileFieldStatic('Edad', p.age + ' años') +
        profileFieldStatic('Altura', p.height + ' cm') +
        profileFieldStatic('Peso', (Number(p.weight) || 72.4).toFixed(1) + ' kg') +
        profileFieldStatic('Actividad', p.activity || 'moderada') +
        profileFieldStatic('Días/semana', (p.trainingDays || 0) + ' días') +
        profileFieldStatic('Objetivo', p.goal || 'mantener') +
        profileFieldStatic('Deporte', p.sport || 'ninguno') +
      '</div>';
  } else {
    if (!profileDraft) profileDraft = { ...p };
    const d = profileDraft;
    card2.innerHTML =
      '<div class="h2">Editar datos</div>' +
      '<div class="grid g-2" style="margin-top:16px;gap:12px">' +
        profileFieldInput('Nombre', 'text', d.name, 'name') +
        profileFieldInput('Edad', 'number', d.age, 'age') +
        profileFieldInput('Altura (cm)', 'number', d.height, 'height') +
        profileFieldInput('Peso (kg)', 'number', d.weight, 'weight') +
      '</div>' +
      '<div style="margin-top:12px">' + profileFieldSelect('Sexo', [{v:'f',l:'Femenino'},{v:'m',l:'Masculino'}], d.sex, 'sex') + '</div>' +
      '<div style="margin-top:12px">' + profileFieldSelect('Actividad', [{v:'sedentaria',l:'Sedentaria'},{v:'ligera',l:'Ligera'},{v:'moderada',l:'Moderada'},{v:'alta',l:'Alta'},{v:'atleta',l:'Atleta'}], d.activity, 'activity') + '</div>' +
      '<div style="margin-top:12px">' + profileFieldSelect('Objetivo', [{v:'perder',l:'Perder grasa'},{v:'mantener',l:'Mantener'},{v:'ganar',l:'Ganar músculo'}], d.goal, 'goal') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:20px"><button class="btn btn-ghost" id="profile-cancel" style="flex:1">Cancelar</button><button class="btn btn-primary" id="profile-save" style="flex:1">Guardar</button></div>';
  }
  wrap.appendChild(card2);

  // Card 3: Historial de peso
  const history = p.weightHistory || [];
  const card3 = S.el('div', { class: 'card card-pad fade-in-up' });
  card3.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center"><div class="h2">📊 Historial de peso</div><button class="btn btn-primary btn-sm" id="add-weight">+ Peso</button></div>' +
    (history.length === 0
      ? '<div class="muted" style="font-size:12px;margin-top:12px;text-align:center;padding:20px 0">Todavía no hay registros. Agregá tu primer peso.</div>'
      : '');
  if (history.length > 0) {
    // Agregar el gráfico como elemento DOM real
    const chart = renderWeightChart(history);
    if (chart) card3.appendChild(chart);
    // Lista
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

  // Card 4: Datos y privacidad
  const card4 = S.el('div', { class: 'card card-pad fade-in-up' });
  card4.innerHTML =
    '<div class="h2">🔒 Datos y privacidad</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">' +
      '<button class="btn btn-ghost" id="export-data" style="width:100%;justify-content:flex-start">📥 Exportar datos (JSON)</button>' +
      '<button class="btn btn-ghost" id="redo-onboarding" style="width:100%;justify-content:flex-start">🔄 Re-hacer onboarding</button>' +
      '<button class="btn btn-ghost" id="reset-all" style="width:100%;justify-content:flex-start;color:var(--red)">⚠️ Reset total</button>' +
    '</div>' +
    '<div class="muted2" style="font-size:10px;margin-top:12px;text-align:center">SomaAi v' + (s.version || '1.0') + ' · Los datos se guardan solo en tu dispositivo</div>';
  wrap.appendChild(card4);

  // Handlers
  setTimeout(() => {
    const editBtn = document.getElementById('profile-edit');
    if (editBtn) editBtn.onclick = () => { profileEditMode = true; profileDraft = { ...p }; S.haptic(); render(); };
    const cancelBtn = document.getElementById('profile-cancel');
    if (cancelBtn) cancelBtn.onclick = () => { profileEditMode = false; profileDraft = null; render(); };
    const saveBtn = document.getElementById('profile-save');
    if (saveBtn) saveBtn.onclick = () => {
      if (!profileDraft) return;
      S.state.profile = { ...S.state.profile, ...profileDraft };
      S.state.profile.weight = Number(S.state.profile.weight) || 72.4;
      S.state.profile.height = Number(S.state.profile.height) || 168;
      S.state.profile.age = Number(S.state.profile.age) || 28;
      S.state.profile.imc = S.state.profile.weight / ((S.state.profile.height / 100) ** 2);
      S.state.weight = S.state.profile.weight;
      S.saveState();
      profileEditMode = false; profileDraft = null;
      S.render();
      S.toast('✅ Datos guardados');
    };

    const addWeight = document.getElementById('add-weight');
    if (addWeight) addWeight.onclick = () => {
      const val = prompt('Nuevo peso (kg):', S.state.weight);
      if (val && !isNaN(val)) {
        const kg = parseFloat(val);
        S.state.weight = kg;
        S.state.profile.weight = kg;
        S.state.profile.imc = kg / ((S.state.profile.height / 100) ** 2);
        if (!S.state.profile.weightHistory) S.state.profile.weightHistory = [];
        S.state.profile.weightHistory.push({ date: new Date().toISOString().slice(0, 10), kg });
        S.saveState();
        render();
        S.toast('✅ Peso registrado');
      }
    };

    const exportBtn = document.getElementById('export-data');
    if (exportBtn) exportBtn.onclick = () => {
      const data = { exportedAt: new Date().toISOString(), version: S.state.version, profile: S.state.profile, entries: S.state.entries, water: S.state.water, customFoods: S.state.customFoods };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'somaai-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click(); URL.revokeObjectURL(url);
      S.toast('📥 Datos exportados');
    };

    const redoBtn = document.getElementById('redo-onboarding');
    if (redoBtn) redoBtn.onclick = () => {
      S.showConfirm('¿Re-hacer onboarding?', 'Se reiniciará tu perfil pero se mantienen tus alimentos y bases de datos.', () => {
        S.state.profile.onboarded = false; S.saveState(); S.render();
      });
    };

    const resetBtn = document.getElementById('reset-all');
    if (resetBtn) resetBtn.onclick = () => {
      S.showConfirm('⚠️ Reset total', 'Esto borrará TODOS tus datos. No se puede deshacer.', () => {
        localStorage.removeItem('somaai_state'); location.reload();
      });
    };
  }, 50);

  return wrap;
}

/* ------------------------- Gráfico de peso (devuelve DOM element) ------------------------- */
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
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<span class="muted2" style="font-size:10px">Últimos ' + data.length + ' registros</span>' +
      '<span class="mono" style="font-size:12px;font-weight:700;color:' + diffColor + '">' + (diff > 0 ? '+' : '') + diff.toFixed(1) + ' kg</span>' +
    '</div>' +
    '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%;height:auto">' +
      '<defs><linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00ff88" stop-opacity="0.3"/><stop offset="100%" stop-color="#00ff88" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + areaD + '" fill="url(#wgrad)"/>' +
      '<path d="' + pathD + '" fill="none" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>' +
      points.map(p => '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="2" fill="#00ff88"/>').join('') +
    '</svg>' +
    '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px" class="muted2">' +
      '<span>' + data[0].date.slice(5) + '</span>' +
      '<span>' + data[data.length - 1].date.slice(5) + '</span>' +
    '</div>';
  return container;
}

/* ------------------------- Helpers de campos ------------------------- */
function profileFieldStatic(label, value) {
  return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span class="muted" style="font-size:13px">' + label + '</span><span style="font-size:13px;font-weight:700">' + value + '</span></div>';
}

function profileFieldInput(label, type, value, name) {
  return '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">' + label + '</span><input type="' + type + '" data-field="' + name + '" value="' + (value || '') + '" style="width:100%;padding:10px;border-radius:10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:14px" /></label>';
}

function profileFieldSelect(label, options, value, name) {
  return '<label style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">' + label + '</span><select data-field="' + name + '" style="width:100%;padding:10px;border-radius:10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:14px">' + options.map(o => '<option value="' + o.v + '"' + (o.v === value ? ' selected' : '') + '>' + o.l + '</option>').join('') + '</select></label>';
}

/* Escuchar cambios en inputs del perfil */
document.addEventListener('input', (e) => {
  if (e.target.dataset && e.target.dataset.field && profileDraft) {
    const field = e.target.dataset.field;
    if (field === 'age' || field === 'height' || field === 'weight') {
      profileDraft[field] = parseFloat(e.target.value) || 0;
    } else {
      profileDraft[field] = e.target.value;
    }
  }
});
document.addEventListener('change', (e) => {
  if (e.target.dataset && e.target.dataset.field && profileDraft) {
    profileDraft[e.target.dataset.field] = e.target.value;
  }
});

window.SomaAiProfile = {
  render: renderProfile,
};
