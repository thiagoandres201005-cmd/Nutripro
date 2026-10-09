/* ============================================================================
   SomaAi — Módulo Perfil
   - Editar datos personales
   - Cambiar deporte, actividad, objetivo
   - Historial de peso con gráfico
   - Exportar datos
   ========================================================================== */

let profileEditMode = false;
let profileDraft = null;

function renderProfile() {
  const S = window.SomaAi;
  if (!S) return document.createElement('div');
  const s = S.state;
  const p = s.profile;
  const targets = S.calcTargets(p);

  const wrap = S.el('div', { class: 'stack' });

  /* Card 1: Datos personales */
  const card1 = S.el('div', { class: 'card card-pad' });
  card1.innerHTML =
    '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
      '<div style="width:64px;height:64px;border-radius:20px;' +
        'background:linear-gradient(135deg,var(--green),var(--cyan));padding:2px">' +
        '<div style="width:100%;height:100%;border-radius:18px;background:var(--card);' +
          'display:grid;place-items:center;font-size:28px">👤</div>' +
      '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div class="h2">' + escapeHtmlProfile(p.name || 'Usuario') + '</div>' +
        '<div class="muted" style="font-size:12px;margin-top:2px">' +
          (p.sex === 'm' ? 'Masculino' : 'Femenino') + ' · ' + p.age + ' años · ' + p.height + ' cm' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
          '<span class="pill green">🔥 ' + (p.streak || 1) + ' días</span>' +
          '<span class="pill">🎯 ' + (p.goal || 'mantener') + '</span>' +
          '<span class="pill cyan">⚡ ' + (p.activity || 'moderada') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="grid g-3" style="margin-top:20px;gap:8px">' +
      '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border)">' +
        '<div class="eyebrow">TMB</div>' +
        '<div class="mono" style="font-size:14px;font-weight:800;margin-top:4px">' + targets.kcal + ' kcal</div>' +
        '<div class="muted2" style="font-size:10px">Objetivo diario</div>' +
      '</div>' +
      '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border)">' +
        '<div class="eyebrow">Peso</div>' +
        '<div class="mono" style="font-size:14px;font-weight:800;margin-top:4px">' + (Number(p.weight) || 72.4).toFixed(1) + ' kg</div>' +
        '<div class="muted2" style="font-size:10px">Actual</div>' +
      '</div>' +
      '<div style="padding:12px;border-radius:14px;background:var(--surface);border:1px solid var(--border)">' +
        '<div class="eyebrow">Deporte</div>' +
        '<div class="mono" style="font-size:14px;font-weight:800;margin-top:4px;text-transform:capitalize">' + (p.sport || 'ninguno') + '</div>' +
        '<div class="muted2" style="font-size:10px">Preferencia</div>' +
      '</div>' +
    '</div>';
  wrap.appendChild(card1);

  /* Card 2: Editar datos */
  const card2 = S.el('div', { class: 'card card-pad' });
  if (!profileEditMode) {
    card2.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div class="h2">Datos personales</div>' +
        '<button class="btn btn-primary btn-sm" id="profile-edit">✎ Editar</button>' +
      '</div>' +
      '<div style="margin-top:16px;display:flex;flex-direction:column;gap:10px">' +
        profileFieldStatic('Nombre', p.name || 'Usuario') +
        profileFieldStatic('Sexo', p.sex === 'm' ? 'Masculino' : 'Femenino') +
        profileFieldStatic('Edad', p.age + ' años') +
        profileFieldStatic('Altura', p.height + ' cm') +
        profileFieldStatic('Peso', (Number(p.weight) || 72.4).toFixed(1) + ' kg') +
        profileFieldStatic('Actividad', p.activity || 'moderada') +
        profileFieldStatic('Objetivo', p.goal || 'mantener') +
        profileFieldStatic('Deporte', p.sport || 'ninguno') +
      '</div>';
  } else {
    if (!profileDraft) profileDraft = { ...p };
    const d = profileDraft;
    card2.innerHTML =
      '<div class="h2">Editar datos</div>' +
      '<div class="grid md-2" style="margin-top:16px;gap:12px">' +
        profileFieldInput('Nombre', 'text', d.name, 'name') +
        profileFieldInput('Edad', 'number', d.age, 'age') +
        profileFieldInput('Altura (cm)', 'number', d.height, 'height') +
        profileFieldInput('Peso (kg)', 'number', d.weight, 'weight') +
        profileFieldSelect('Sexo', [{v:'f',l:'Femenino'},{v:'m',l:'Masculino'}], d.sex, 'sex') +
        profileFieldSelect('Actividad',
          [{v:'sedentaria',l:'Sedentaria'},{v:'ligera',l:'Ligera'},{v:'moderada',l:'Moderada'},{v:'alta',l:'Alta'},{v:'atleta',l:'Atleta'}],
          d.activity, 'activity') +
        profileFieldSelect('Objetivo',
          [{v:'perder',l:'Perder grasa'},{v:'mantener',l:'Mantener'},{v:'ganar',l:'Ganar músculo'}],
          d.goal, 'goal') +
        profileFieldSelect('Deporte',
          [{v:'ninguno',l:'Ninguno'},{v:'calistenia',l:'Calistenia'},{v:'powerlifting',l:'Powerlifting'},{v:'futbol',l:'Fútbol'},{v:'tenis',l:'Tenis'},{v:'voley',l:'Vóley'},{v:'hockey',l:'Hockey'},{v:'crossfit',l:'CrossFit'},{v:'running',l:'Running'},{v:'natacion',l:'Natación'},{v:'ciclismo',l:'Ciclismo'},{v:'gimnasio',l:'Gimnasio'},{v:'basquet',l:'Básquet'},{v:'bjj',l:'BJJ / MMA'},{v:'yoga',l:'Yoga / Pilates'}],
          d.sport, 'sport') +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:20px">' +
        '<button class="btn btn-ghost" id="profile-cancel" style="flex:1">Cancelar</button>' +
        '<button class="btn btn-primary" id="profile-save" style="flex:2">✓ Guardar cambios</button>' +
      '</div>';
  }
  wrap.appendChild(card2);

  /* Card 3: Historial de peso */
  const card3 = S.el('div', { class: 'card card-pad' });
  const hist = p.weightHistory || [];
  let histHtml =
    '<div class="h2">Historial de peso</div>';
  if (hist.length > 0) {
    histHtml +=
      '<div style="margin-top:16px;height:120px;background:var(--surface);border-radius:14px;' +
        'border:1px solid var(--border);padding:12px;position:relative">' +
        profileWeightChart(hist) +
      '</div>' +
      '<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto">' +
        hist.slice().reverse().slice(0, 10).map((w) =>
          '<div style="display:flex;justify-content:space-between;padding:8px 12px;' +
            'background:var(--surface);border-radius:10px;border:1px solid var(--border);font-size:12px">' +
            '<span class="muted">' + formatDateProfile(w.date) + '</span>' +
            '<span class="mono" style="font-weight:700">' + w.kg.toFixed(1) + ' kg</span>' +
          '</div>'
        ).join('') +
      '</div>';
  } else {
    histHtml +=
      '<div class="muted" style="font-size:12px;margin-top:8px;line-height:1.5">' +
        'Todavía no registraste pesos. Podés guardar tu peso actual ahora para empezar a trackear.' +
      '</div>';
  }
  histHtml +=
    '<div style="display:flex;gap:8px;margin-top:16px">' +
      '<input type="number" id="weight-history-input" class="input" step="0.1" min="30" max="300" ' +
        'value="' + (Number(p.weight) || 72.4).toFixed(1) + '" style="flex:1" placeholder="kg" />' +
      '<button class="btn btn-primary btn-sm" id="weight-history-save">Guardar peso</button>' +
    '</div>';
  card3.innerHTML = histHtml;
  wrap.appendChild(card3);

  /* Card 4: Exportar / Reset */
  const card4 = S.el('div', { class: 'card card-pad' });
  card4.innerHTML =
    '<div class="h2">Datos y privacidad</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px;line-height:1.5">' +
      'Todos tus datos se guardan 100% en tu celular. No enviamos nada a servidores.' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">' +
      '<button class="btn btn-ghost btn-sm" id="profile-export">📥 Exportar JSON</button>' +
      '<button class="btn btn-ghost btn-sm" id="profile-reonboard">🔄 Re-hacer onboarding</button>' +
    '</div>' +
    '<div style="margin-top:20px;padding:16px;border-radius:14px;' +
      'background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.25)">' +
      '<div style="font-size:13px;font-weight:700;color:var(--red)">⚠️ Zona peligrosa</div>' +
      '<div class="muted" style="font-size:11px;margin-top:6px;line-height:1.5">' +
        'Estas acciones no se pueden deshacer. Asegurate de exportar tus datos antes.' +
      '</div>' +
      '<button class="btn btn-ghost btn-sm" id="profile-reset" style="margin-top:12px;' +
        'background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);color:var(--red)">' +
        '🗑️ Borrar todos los datos' +
      '</button>' +
    '</div>';
  wrap.appendChild(card4);

  /* Handlers */
  setTimeout(() => {
    const editBtn = document.getElementById('profile-edit');
    if (editBtn) editBtn.onclick = () => { profileEditMode = true; profileDraft = { ...p }; rerenderProfile(); };

    const cancelBtn = document.getElementById('profile-cancel');
    if (cancelBtn) cancelBtn.onclick = () => { profileEditMode = false; profileDraft = null; rerenderProfile(); };

    const saveBtn = document.getElementById('profile-save');
    if (saveBtn) saveBtn.onclick = () => {
      const d = profileDraft;
      if (!d) return;
      S.state.profile = {
        ...S.state.profile,
        name: d.name || 'Usuario',
        sex: d.sex || 'f',
        age: Number(d.age) || 28,
        height: Number(d.height) || 168,
        weight: Number(d.weight) || 72.4,
        activity: d.activity || 'moderada',
        goal: d.goal || 'mantener',
        sport: d.sport || 'ninguno',
      };
      S.state.weight = Number(d.weight) || 72.4;
      S.saveState();
      profileEditMode = false;
      profileDraft = null;
      S.render();
    };

    document.querySelectorAll('[data-pfield]').forEach((el) => {
      el.oninput = (e) => { if (profileDraft) profileDraft[el.dataset.pfield] = e.target.value; };
    });
    document.querySelectorAll('[data-pselect]').forEach((el) => {
      el.onchange = (e) => { if (profileDraft) profileDraft[el.dataset.pselect] = e.target.value; };
    });

    const wSave = document.getElementById('weight-history-save');
    if (wSave) wSave.onclick = () => {
      const input = document.getElementById('weight-history-input');
      const v = parseFloat(input.value);
      if (isNaN(v) || v < 30 || v > 300) return;
      const today = new Date().toISOString().slice(0, 10);
      const hist = [...(S.state.profile.weightHistory || [])];
      const idx = hist.findIndex((h) => h.date === today);
      const entry = { date: today, kg: v };
      if (idx >= 0) hist[idx] = entry;
      else hist.push(entry);
      hist.sort((a, b) => a.date.localeCompare(b.date));
      S.state.profile.weightHistory = hist;
      S.state.weight = v;
      S.state.profile.weight = v;
      S.saveState();
      S.render();
    };

    const exportBtn = document.getElementById('profile-export');
    if (exportBtn) exportBtn.onclick = () => {
      try {
        const data = JSON.stringify(S.state, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'somaai-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
      } catch (e) {
        alert('Error al exportar: ' + e.message);
      }
    };

    const reonboardBtn = document.getElementById('profile-reonboard');
    if (reonboardBtn) reonboardBtn.onclick = () => {
      if (confirm('¿Querés re-hacer el onboarding? Tus datos actuales se mantienen hasta que termines.')) {
        S.state.profile.onboarded = false;
        S.saveState();
        S.render();
      }
    };

    const resetBtn = document.getElementById('profile-reset');
    if (resetBtn) resetBtn.onclick = () => {
      if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
        if (confirm('¿Estás SEGURO? Se va a borrar todo el progreso.')) {
          localStorage.removeItem('somaai_state');
          location.reload();
        }
      }
    };
  }, 0);

  return wrap;
}

function rerenderProfile() {
  const S = window.SomaAi;
  if (!S) return;
  const main = document.querySelector('main.container');
  if (!main) return;
  main.innerHTML = '';
  main.appendChild(renderProfile());
}

function profileFieldStatic(label, value) {
  return '<div style="display:flex;justify-content:space-between;align-items:center;' +
    'padding:10px 12px;background:var(--surface);border-radius:10px;border:1px solid var(--border)">' +
    '<span class="muted2" style="font-size:12px">' + label + '</span>' +
    '<span class="mono" style="font-size:13px;font-weight:700;text-transform:capitalize">' + escapeHtmlProfile(String(value)) + '</span>' +
  '</div>';
}

function profileFieldInput(label, type, value, name) {
  return '<label style="display:flex;flex-direction:column;gap:6px">' +
    '<span class="eyebrow">' + label + '</span>' +
    '<input type="' + type + '" class="input" value="' + escapeHtmlProfile(String(value == null ? '' : value)) + '" ' +
      'data-pfield="' + name + '" />' +
  '</label>';
}

function profileFieldSelect(label, opts, value, name) {
  return '<label style="display:flex;flex-direction:column;gap:6px">' +
    '<span class="eyebrow">' + label + '</span>' +
    '<select class="input" data-pselect="' + name + '">' +
      opts.map((o) => '<option value="' + o.v + '"' + (o.v === value ? ' selected' : '') + '>' + o.l + '</option>').join('') +
    '</select>' +
  '</label>';
}

function profileWeightChart(history) {
  if (!history || history.length === 0) return '';
  const W = 100, H = 40;
  const pts = history.map((h) => h.kg);
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = (max - min) || 1;
  const coords = pts.map((v, i) => {
    const x = pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W;
    const y = H - ((v - min) / span) * (H - 8) - 4;
    return [x, y];
  });
  const d = coords.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ' L ' + W + ' ' + H + ' L 0 ' + H + ' Z';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:100%" preserveAspectRatio="none">' +
    '<defs>' +
      '<linearGradient id="pwline" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#ec4899"/>' +
        '<stop offset="100%" stop-color="#8b5cf6"/>' +
      '</linearGradient>' +
      '<linearGradient id="pwfill" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#ec4899" stop-opacity="0.3"/>' +
        '<stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<path d="' + area + '" fill="url(#pwfill)"/>' +
    '<path d="' + d + '" fill="none" stroke="url(#pwline)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
  '</svg>';
}

function formatDateProfile(dateStr) {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  } catch (e) { return dateStr; }
}

function escapeHtmlProfile(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

window.SomaAiProfile = { render: renderProfile };
