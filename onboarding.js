/* ============================================================================
   SomaAi — Onboarding v3
   - Sexo y edad guardados correctamente
   - Pregunta días de entrenamiento específicos
   - Cálculo de TMB con todos los datos
   ========================================================================== */

const OB_SPORTS = [];
const OB_ACTIVITIES = [];
const OB_GOALS = [];
const OB_SPEEDS = [];

let obStep = 0;
let obDraft = {
  email: '',
  password: '',
  name: '',
  sex: 'f',
  age: 28,
  height: 168,
  weight: 72.4,
  sport: 'ninguno',
  activity: 'moderada',
  trainingDays: 3,
  goal: 'mantener',
  speed: 0.5,
};

async function obLoadConfig() {
  try {
    const res = await fetch('./data/sports.json');
    const data = await res.json();
    OB_SPORTS.length = 0;
    OB_ACTIVITIES.length = 0;
    OB_GOALS.length = 0;
    OB_SPEEDS.length = 0;
    OB_SPORTS.push(...(data.sports || []));
    OB_ACTIVITIES.push(...(data.activities || []));
    OB_GOALS.push(...(data.goals || []));
    OB_SPEEDS.push(...(data.speeds || []));
  } catch (e) {
    console.warn('[Onboarding] Error cargando sports.json:', e.message);
  }
}

const OB_STEPS = ['welcome', 'account', 'basics', 'sport', 'days', 'goal', 'summary'];

function obRender() {
  const root = document.getElementById('app-root');
  if (!root) return;
  root.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'app';
  container.style.paddingTop = 'var(--safe-top)';
  container.style.paddingBottom = 'var(--safe-bottom)';
  container.style.overflowX = 'hidden';
  const inner = document.createElement('div');
  inner.className = 'container';
  inner.style.paddingTop = '24px';
  inner.style.paddingBottom = '24px';
  inner.style.minHeight = '100dvh';
  inner.style.display = 'flex';
  inner.style.flexDirection = 'column';
  inner.style.maxWidth = '100%';
  inner.style.overflowX = 'hidden';
  inner.appendChild(obBuildProgress());
  inner.appendChild(obBuildStep(OB_STEPS[obStep]));
  inner.appendChild(obBuildNav());
  container.appendChild(inner);
  root.appendChild(container);
  obAttachHandlers();
}

function obBuildProgress() {
  const div = document.createElement('div');
  div.style.marginBottom = '24px';
  const pct = ((obStep + 1) / OB_STEPS.length) * 100;
  div.innerHTML =
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px">' +
      '<span class="eyebrow">Paso ' + (obStep + 1) + ' de ' + OB_STEPS.length + '</span>' +
    '</div>' +
    '<div class="bar thin">' +
      '<i style="width:' + pct + '%;background:linear-gradient(90deg,var(--green),var(--cyan))"></i>' +
    '</div>';
  return div;
}

function obBuildStep(step) {
  switch (step) {
    case 'welcome': return obStepWelcome();
    case 'account': return obStepAccount();
    case 'basics': return obStepBasics();
    case 'sport': return obStepSport();
    case 'days': return obStepDays();
    case 'goal': return obStepGoal();
    case 'summary': return obStepSummary();
    default: return document.createElement('div');
  }
}

function obStepWelcome() {
  const div = document.createElement('div');
  div.className = 'card card-pad';
  div.style.flex = '1';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.justifyContent = 'center';
  div.style.textAlign = 'center';
  div.innerHTML =
    '<div style="font-size:72px">🥗</div>' +
    '<div class="h1" style="margin-top:24px;font-size:32px;word-break:break-word">Bienvenido a SomaAi</div>' +
    '<div class="muted" style="margin-top:16px;font-size:14px;line-height:1.6">' +
      'Tu asistente nutricional inteligente.<br>' +
      'Vamos a crear tu plan personalizado en 2 minutos.' +
    '</div>' +
    '<div style="margin-top:32px;display:flex;flex-direction:column;gap:12px;text-align:left">' +
      obFeatureRow('🔬', 'Cálculo Mifflin-St Jeor', 'Precisión científica') +
      obFeatureRow('🎯', 'Objetivos personalizados', 'Según tu deporte') +
      obFeatureRow('📊', 'Macros exactos', 'Proteína, carbos y grasas') +
    '</div>';
  return div;
}

function obFeatureRow(emoji, title, desc) {
  return '<div style="display:flex;gap:12px;align-items:center;padding:12px;background:var(--surface);border-radius:12px;border:1px solid var(--border);max-width:100%">' +
    '<div style="font-size:24px;flex-shrink:0">' + emoji + '</div>' +
    '<div style="min-width:0">' +
      '<div style="font-size:13px;font-weight:700;word-break:break-word">' + title + '</div>' +
      '<div class="muted2" style="font-size:11px;word-break:break-word">' + desc + '</div>' +
    '</div>' +
  '</div>';
}

function obStepAccount() {
  const div = document.createElement('div');
  div.className = 'card card-pad';
  div.style.maxWidth = '100%';
  div.style.overflowX = 'hidden';
  div.innerHTML =
    '<div class="h2">Creá tu cuenta</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px;word-break:break-word">Sincronizá entre dispositivos. Podés usar la app sin cuenta.</div>' +
    '<div style="margin-top:20px;max-width:100%">' +
      '<label style="display:flex;flex-direction:column;gap:6px">' +
        '<span class="eyebrow">Email (opcional)</span>' +
        '<input type="email" id="ob-email" class="input" placeholder="tu@email.com" value="' + obDraft.email + '" style="width:100%;box-sizing:border-box" />' +
      '</label>' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-top:12px">' +
        '<span class="eyebrow">Contraseña (opcional)</span>' +
        '<input type="password" id="ob-pass" class="input" placeholder="Mínimo 6 caracteres" style="width:100%;box-sizing:border-box" />' +
      '</label>' +
    '</div>' +
    '<div class="muted2" style="font-size:11px;margin-top:16px;line-height:1.5;word-break:break-word">' +
      'Si no completás estos datos, la app funciona 100% local.' +
    '</div>';
  return div;
}

function obStepBasics() {
  const imc = (obDraft.weight / Math.pow(obDraft.height / 100, 2)).toFixed(1);
  const div = document.createElement('div');
  div.className = 'card card-pad';
  div.style.maxWidth = '100%';
  div.style.overflowX = 'hidden';
  div.innerHTML =
    '<div class="h2">Contame sobre vos</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px;word-break:break-word">Estos datos definen tus calorías exactas</div>' +
    '<label style="display:flex;flex-direction:column;gap:6px;margin-top:20px;max-width:100%">' +
      '<span class="eyebrow">Nombre</span>' +
      '<input type="text" id="ob-name" class="input" placeholder="Tu nombre" value="' + obDraft.name + '" style="width:100%;box-sizing:border-box" />' +
    '</label>' +
    '<div style="margin-top:16px;max-width:100%">' +
      '<span class="eyebrow">Sexo biológico</span>' +
      '<div style="display:flex;gap:8px;margin-top:8px;max-width:100%">' +
        '<button class="ob-choice chip-btn ' + (obDraft.sex === 'f' ? 'on' : '') + '" data-sex="f" style="flex:1;height:44px;min-width:0">♀ Femenino</button>' +
        '<button class="ob-choice chip-btn ' + (obDraft.sex === 'm' ? 'on' : '') + '" data-sex="m" style="flex:1;height:44px;min-width:0">♂ Masculino</button>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:16px;max-width:100%">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
        '<span class="eyebrow">Edad</span>' +
        '<span class="mono" style="font-weight:800">' + obDraft.age + ' años</span>' +
      '</div>' +
      '<input type="range" id="ob-age" min="14" max="90" value="' + obDraft.age + '" style="margin-top:8px;width:100%" />' +
    '</div>' +
    '<div style="margin-top:16px;max-width:100%">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
        '<span class="eyebrow">Altura</span>' +
        '<span class="mono" style="font-weight:800">' + obDraft.height + ' cm</span>' +
      '</div>' +
      '<input type="range" id="ob-height" min="140" max="220" value="' + obDraft.height + '" style="margin-top:8px;width:100%" />' +
    '</div>' +
    '<div style="margin-top:16px;max-width:100%">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
        '<span class="eyebrow">Peso actual</span>' +
        '<span class="mono" style="font-weight:800">' + obDraft.weight + ' kg</span>' +
      '</div>' +
      '<input type="range" id="ob-weight" min="35" max="200" step="0.1" value="' + obDraft.weight + '" style="margin-top:8px;width:100%" />' +
    '</div>' +
    '<div style="margin-top:20px;padding:12px;background:var(--surface);border-radius:12px;border:1px solid var(--border);max-width:100%">' +
      '<div class="eyebrow">Tu IMC</div>' +
      '<div class="mono" style="font-size:20px;font-weight:800;margin-top:2px">' + imc + '</div>' +
    '</div>';
  return div;
}

function obStepSport() {
  const div = document.createElement('div');
  div.className = 'card card-pad';
  div.style.maxWidth = '100%';
  div.style.overflowX = 'hidden';
  let html =
    '<div class="h2">¿Qué deporte practicás?</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px;word-break:break-word">Cada deporte necesita macros distintos</div>' +
    '<div class="grid g-2" style="margin-top:16px;gap:8px;max-width:100%">';
  OB_SPORTS.forEach((s) => {
    const on = obDraft.sport === s.id;
    html += '<button class="ob-sport chip-btn ' + (on ? 'on' : '') + '" data-sport="' + s.id + '" style="height:auto;padding:12px 8px;display:flex;flex-direction:column;align-items:center;min-width:0">' +
      '<div style="font-size:24px">' + s.emoji + '</div>' +
      '<div style="font-size:12px;font-weight:700;margin-top:6px;word-break:break-word;text-align:center">' + s.name + '</div>' +
      '<div class="muted2" style="font-size:9px;margin-top:3px;text-align:center;line-height:1.2;word-break:break-word">' + s.desc + '</div>' +
    '</button>';
  });
  html += '</div>';
  div.innerHTML = html;
  return div;
}

function obStepDays() {
  const div = document.createElement('div');
  div.className = 'card card-pad';
  div.style.maxWidth = '100%';
  div.style.overflowX = 'hidden';
  const days = obDraft.trainingDays;
  const freqLabel =
    days <= 1 ? 'Sedentaria · ×1.2' :
    days <= 3 ? 'Ligera · ×1.375' :
    days <= 5 ? 'Moderada · ×1.55' :
    days <= 6 ? 'Alta · ×1.725' :
    'Atleta · ×1.9';
  div.innerHTML =
    '<div class="h2">¿Cuántos días entrenás?</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px;word-break:break-word">' +
      'Contá tanto entrenamiento como trabajo físico' +
    '</div>' +
    '<div style="margin-top:24px;max-width:100%">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
        '<span class="eyebrow">Días por semana</span>' +
        '<span class="mono" style="font-weight:800;font-size:20px">' + days + '</span>' +
      '</div>' +
      '<input type="range" id="ob-days" min="0" max="7" value="' + days + '" style="margin-top:12px;width:100%" />' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px;color:var(--muted2)">' +
        '<span>0 días</span><span>3-4 días</span><span>7 días</span>' +
      '</div>' +
      '<div style="margin-top:20px;padding:16px;background:var(--surface);border-radius:14px;' +
        'border:1px solid var(--border);max-width:100%">' +
        '<div class="eyebrow">Factor de actividad</div>' +
        '<div class="mono" style="font-size:16px;font-weight:800;margin-top:6px;color:var(--green)">' + freqLabel + '</div>' +
        '<div class="muted2" style="font-size:11px;margin-top:6px;word-break:break-word">' +
          'Este factor multiplica tu metabolismo basal para calcular cuántas calorías quemás por día' +
        '</div>' +
      '</div>' +
    '</div>';
  return div;
}

function obStepGoal() {
  const div = document.createElement('div');
  div.className = 'card card-pad';
  div.style.maxWidth = '100%';
  div.style.overflowX = 'hidden';
  let html =
    '<div class="h2">¿Cuál es tu objetivo?</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px;word-break:break-word">Sugerido según tu deporte</div>' +
    '<div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;max-width:100%">';
  OB_GOALS.forEach((g) => {
    const on = obDraft.goal === g.id;
    html += '<button class="ob-goal chip-btn ' + (on ? 'on' : '') + '" data-goal="' + g.id + '" style="height:auto;padding:12px;display:flex;align-items:center;gap:12px;min-width:0">' +
      '<div style="font-size:22px;flex-shrink:0">' + g.emoji + '</div>' +
      '<div style="flex:1;text-align:left;min-width:0">' +
        '<div style="font-size:13px;font-weight:700;word-break:break-word">' + g.name + '</div>' +
        '<div class="muted2" style="font-size:11px;margin-top:2px;word-break:break-word">' + g.desc + '</div>' +
      '</div>' +
    '</button>';
  });
  html += '</div>';

  if (obDraft.goal !== 'mantener') {
    html += '<div style="margin-top:20px;max-width:100%">' +
      '<span class="eyebrow">Velocidad de cambio</span>' +
      '<div style="display:flex;gap:8px;margin-top:8px;max-width:100%">';
    OB_SPEEDS.forEach((s) => {
      const on = obDraft.speed === s.value;
      html += '<button class="ob-speed chip-btn ' + (on ? 'on' : '') + '" data-speed="' + s.value + '" style="flex:1;height:auto;padding:12px 8px;display:flex;flex-direction:column;align-items:center;min-width:0">' +
        '<div style="font-size:18px">' + s.emoji + '</div>' +
        '<div style="font-size:11px;font-weight:700;margin-top:4px;word-break:break-word">' + s.name + '</div>' +
      '</button>';
    });
    html += '</div></div>';
  }
  div.innerHTML = html;
  return div;
}

function obStepSummary() {
  const tmb = obCalcTMB();
  const tdee = obCalcTDEE(tmb);
  const sport = OB_SPORTS.find((s) => s.id === obDraft.sport) || OB_SPORTS[0];
  const goal = OB_GOALS.find((g) => g.id === obDraft.goal) || OB_GOALS[1];
  const targetKcal = Math.round((tdee + (sport?.kcalExtra || 0)) * (1 + (goal?.adj || 0)));
  const macros = sport?.macros || { p: 25, c: 50, f: 25 };
  const p = Math.round(targetKcal * macros.p / 100 / 4);
  const c = Math.round(targetKcal * macros.c / 100 / 4);
  const f = Math.round(targetKcal * macros.f / 100 / 9);

  const div = document.createElement('div');
  div.className = 'card card-pad';
  div.style.maxWidth = '100%';
  div.style.overflowX = 'hidden';
  div.innerHTML =
    '<div class="eyebrow" style="color:var(--green)">✓ Tu plan personalizado</div>' +
    '<div class="h1" style="margin-top:8px;font-size:42px;word-break:break-word">' + targetKcal +
      '<span class="muted" style="font-size:16px;font-weight:600"> kcal/día</span>' +
    '</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px;word-break:break-word">' +
      (goal?.id === 'perder' ? 'Déficit calórico controlado' :
       goal?.id === 'ganar' ? 'Superávit para ganar masa' :
       'Calorías de mantenimiento') +
    '</div>' +
    '<div class="grid g-3" style="margin-top:20px;gap:8px;max-width:100%">' +
      obMacroCard('🥩', 'Proteína', p, 'var(--green)') +
      obMacroCard('🍚', 'Carbos', c, 'var(--cyan)') +
      obMacroCard('🥑', 'Grasa', f, 'var(--pink)') +
    '</div>' +
    '<div style="margin-top:20px;padding:16px;background:var(--surface);border-radius:14px;border:1px solid var(--border);max-width:100%;overflow-x:hidden">' +
      '<div class="eyebrow">Desglose del cálculo</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;font-size:12px">' +
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px"><span>TMB Mifflin-St Jeor</span><span class="mono" style="font-weight:700">' + tmb + ' kcal</span></div>' +
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px"><span>Factor actividad (×' + ((OB_ACTIVITIES.find(a=>a.id===obDraft.activity)||{}).factor || 1.55) + ')</span><span class="mono" style="font-weight:700">' + Math.round(tdee) + ' kcal</span></div>' +
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px"><span>' + (sport?.name || '—') + '</span><span class="mono" style="font-weight:700">+' + (sport?.kcalExtra || 0) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px"><span>' + (goal?.name || '—') + '</span><span class="mono" style="font-weight:700">' + Math.round((goal?.adj || 0) * 100) + '%</span></div>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:16px;padding:12px;background:rgba(0,255,136,.06);border-radius:12px;border:1px solid rgba(0,255,136,.2);max-width:100%">' +
      '<div style="font-size:11px;line-height:1.5;color:var(--muted);word-break:break-word">' +
        '✓ Cálculo Mifflin-St Jeor · ✓ Reparto ISSN · ✓ Editable desde Perfil' +
      '</div>' +
    '</div>';
  return div;
}

function obMacroCard(emoji, label, val, color) {
  return '<div style="padding:12px;background:var(--card);border-radius:12px;border:1px solid var(--border);text-align:center;min-width:0">' +
    '<div style="font-size:20px">' + emoji + '</div>' +
    '<div class="mono" style="font-size:16px;font-weight:800;color:' + color + ';margin-top:4px">' + val + 'g</div>' +
    '<div class="muted2" style="font-size:10px;margin-top:2px;word-break:break-word">' + label + '</div>' +
  '</div>';
}

function obCalcTMB() {
  const w = Number(obDraft.weight) || 72.4;
  const h = Number(obDraft.height) || 168;
  const a = Number(obDraft.age) || 28;
  const base = 10 * w + 6.25 * h - 5 * a;
  const sex = obDraft.sex || 'f';
  return Math.round(sex === 'm' ? base + 5 : base - 161);
}

function obCalcTDEE(tmb) {
  const days = Number(obDraft.trainingDays) || 0;
  let factor;
  if (days <= 1) factor = 1.2;
  else if (days <= 3) factor = 1.375;
  else if (days <= 5) factor = 1.55;
  else if (days <= 6) factor = 1.725;
  else factor = 1.9;
  return tmb * factor;
}

function obBuildNav() {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.gap = '8px';
  div.style.marginTop = '16px';
  div.style.maxWidth = '100%';
  const canBack = obStep > 0;
  const isLast = obStep === OB_STEPS.length - 1;
  div.innerHTML =
    (canBack ? '<button class="btn btn-ghost" id="ob-back" style="flex:1;min-width:0">← Atrás</button>' : '') +
    '<button class="btn btn-primary" id="ob-next" style="flex:' + (canBack ? 2 : 1) + ';min-width:0">' +
      (isLast ? '✓ Empezar a usar SomaAi' : 'Continuar →') +
    '</button>';
  return div;
}
