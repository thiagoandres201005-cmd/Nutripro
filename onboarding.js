/* ============================================================================
   SomaAi — Onboarding (7 pasos)
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
    // Valores por defecto
    if (OB_SPORTS.length) obDraft.sport = 'ninguno';
    if (OB_ACTIVITIES.length) obDraft.activity = 'moderada';
    if (OB_GOALS.length) obDraft.goal = 'mantener';
  } catch (e) {
    console.warn('[Onboarding] Error cargando sports.json:', e.message);
  }
}

const OB_STEPS = ['welcome', 'account', 'basics', 'sport', 'activity', 'goal', 'summary'];

function obRender() {
  const root = document.getElementById('app-root');
  if (!root) return;
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'app';
  container.style.paddingTop = 'var(--safe-top)';
  container.style.paddingBottom = 'var(--safe-bottom)';

  const inner = document.createElement('div');
  inner.className = 'container';
  inner.style.paddingTop = '24px';
  inner.style.paddingBottom = '24px';
  inner.style.minHeight = '100dvh';
  inner.style.display = 'flex';
  inner.style.flexDirection = 'column';

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
    case 'activity': return obStepActivity();
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
    '<div class="h1" style="margin-top:24px;font-size:32px">Bienvenido a SomaAi</div>' +
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
  return '<div style="display:flex;gap:12px;align-items:center;padding:12px;background:var(--surface);border-radius:12px;border:1px solid var(--border)">' +
    '<div style="font-size:24px">' + emoji + '</div>' +
    '<div>' +
      '<div style="font-size:13px;font-weight:700">' + title + '</div>' +
      '<div class="muted2" style="font-size:11px">' + desc + '</div>' +
    '</div>' +
  '</div>';
}

function obStepAccount() {
  const div = document.createElement('div');
  div.className = 'card card-pad';
  div.innerHTML =
    '<div class="h2">Creá tu cuenta</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px">Sincronizá entre dispositivos. Podés usar la app sin cuenta.</div>' +
    '<div style="margin-top:20px">' +
      '<label style="display:flex;flex-direction:column;gap:6px">' +
        '<span class="eyebrow">Email (opcional)</span>' +
        '<input type="email" id="ob-email" class="input" placeholder="tu@email.com" value="' + obDraft.email + '" />' +
      '</label>' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin-top:12px">' +
        '<span class="eyebrow">Contraseña (opcional)</span>' +
        '<input type="password" id="ob-pass" class="input" placeholder="Mínimo 6 caracteres" />' +
      '</label>' +
    '</div>' +
    '<div class="muted2" style="font-size:11px;margin-top:16px;line-height:1.5">' +
      'Si no completás estos datos, la app funciona 100% local. Podés crear cuenta después desde Perfil.' +
    '</div>';
  return div;
}

function obStepBasics() {
  const imc = (obDraft.weight / Math.pow(obDraft.height / 100, 2)).toFixed(1);
  const div = document.createElement('div');
  div.className = 'card card-pad';
  div.innerHTML =
    '<div class="h2">Contame sobre vos</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px">Estos datos definen tus calorías exactas</div>' +
    '<label style="display:flex;flex-direction:column;gap:6px;margin-top:20px">' +
      '<span class="eyebrow">Nombre</span>' +
      '<input type="text" id="ob-name" class="input" placeholder="Tu nombre" value="' + obDraft.name + '" />' +
    '</label>' +
    '<div style="margin-top:16px">' +
      '<span class="eyebrow">Sexo biológico</span>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
        '<button class="ob-choice ' + (obDraft.sex === 'f' ? 'on' : '') + '" data-sex="f" style="flex:1">♀ Femenino</button>' +
        '<button class="ob-choice ' + (obDraft.sex === 'm' ? 'on' : '') + '" data-sex="m" style="flex:1">♂ Masculino</button>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:16px">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
        '<span class="eyebrow">Edad</span>' +
        '<span class="mono" style="font-weight:800">' + obDraft.age + ' años</span>' +
      '</div>' +
      '<input type="range" id="ob-age" min="14" max="90" value="' + obDraft.age + '" style="margin-top:8px;width:100%" />' +
    '</div>' +
    '<div style="margin-top:16px">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
        '<span class="eyebrow">Altura</span>' +
        '<span class="mono" style="font-weight:800">' + obDraft.height + ' cm</span>' +
      '</div>' +
      '<input type="range" id="ob-height" min="140" max="220" value="' + obDraft.height + '" style="margin-top:8px;width:100%" />' +
    '</div>' +
    '<div style="margin-top:16px">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
        '<span class="eyebrow">Peso actual</span>' +
        '<span class="mono" style="font-weight:800">' + obDraft.weight + ' kg</span>' +
      '</div>' +
      '<input type="range" id="ob-weight" min="35" max="200" step="0.5" value="' + obDraft.weight + '" style="margin-top:8px;width:100%" />' +
    '</div>' +
    '<div style="margin-top:20px;padding:12px;background:var(--surface);border-radius:12px;border:1px solid var(--border)">' +
      '<div class="eyebrow">Tu IMC</div>' +
      '<div class="mono" style="font-size:20px;font-weight:800;margin-top:2px">' + imc + '</div>' +
    '</div>';
  return div;
}

function obStepSport() {
  const div = document.createElement('div');
  div.className = 'card card-pad';
  let html =
    '<div class="h2">¿Qué deporte practicás?</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px">Cada deporte necesita macros distintos</div>' +
    '<div class="grid g-2" style="margin-top:16px;gap:8px">';
  OB_SPORTS.forEach((s) => {
    const on = obDraft.sport === s.id;
    html += '<button class="ob-sport ' + (on ? 'on' : '') + '" data-sport="' + s.id + '">' +
      '<div style="font-size:24px">' + s.emoji + '</div>' +
      '<div style="font-size:12px;font-weight:700;margin-top:6px">' + s.name + '</div>' +
      '<div class="muted2" style="font-size:9px;margin-top:3px;text-align:center;line-height:1.2">' + s.desc + '</div>' +
    '</button>';
  });
  html += '</div>';
  div.innerHTML = html;
  return div;
}

function obStepActivity() {
  const div = document.createElement('div');
  div.className = 'card card-pad';
  let html =
    '<div class="h2">¿Cuántos días entrenás?</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px">Define tu gasto calórico diario</div>' +
    '<div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">';
  OB_ACTIVITIES.forEach((a) => {
    const on = obDraft.activity === a.id;
    html += '<button class="ob-activity ' + (on ? 'on' : '') + '" data-activity="' + a.id + '">' +
      '<div style="flex:1;text-align:left">' +
        '<div style="font-size:13px;font-weight:700">' + a.name + '</div>' +
        '<div class="muted2" style="font-size:11px;margin-top:2px">' + a.desc + '</div>' +
      '</div>' +
      '<div class="mono" style="font-size:12px;font-weight:800;color:' + (on ? 'var(--green)' : 'var(--muted)') + '">×' + a.factor + '</div>' +
    '</button>';
  });
  html += '</div>';
  div.innerHTML = html;
  return div;
}

function obStepGoal() {
  const div = document.createElement('div');
  div.className = 'card card-pad';
  let html =
    '<div class="h2">¿Cuál es tu objetivo?</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px">Sugerido según tu deporte</div>' +
    '<div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">';
  OB_GOALS.forEach((g) => {
    const on = obDraft.goal === g.id;
    html += '<button class="ob-goal ' + (on ? 'on' : '') + '" data-goal="' + g.id + '">' +
      '<div style="font-size:22px">' + g.emoji + '</div>' +
      '<div style="flex:1;text-align:left">' +
        '<div style="font-size:13px;font-weight:700">' + g.name + '</div>' +
        '<div class="muted2" style="font-size:11px;margin-top:2px">' + g.desc + '</div>' +
      '</div>' +
    '</button>';
  });
  html += '</div>';

  if (obDraft.goal !== 'mantener') {
    html += '<div style="margin-top:20px">' +
      '<span class="eyebrow">Velocidad de cambio</span>' +
      '<div style="display:flex;gap:8px;margin-top:8px">';
    OB_SPEEDS.forEach((s) => {
      const on = obDraft.speed === s.value;
      html += '<button class="ob-speed ' + (on ? 'on' : '') + '" data-speed="' + s.value + '" style="flex:1">' +
        '<div style="font-size:18px">' + s.emoji + '</div>' +
        '<div style="font-size:11px;font-weight:700;margin-top:4px">' + s.name + '</div>' +
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
  div.innerHTML =
    '<div class="eyebrow" style="color:var(--green)">✓ Tu plan personalizado</div>' +
    '<div class="h1" style="margin-top:8px;font-size:42px">' + targetKcal +
      '<span class="muted" style="font-size:16px;font-weight:600"> kcal/día</span>' +
    '</div>' +
    '<div class="muted" style="font-size:12px;margin-top:4px">' +
      (goal?.id === 'perder' ? 'Déficit calórico controlado' :
       goal?.id === 'ganar' ? 'Superávit para ganar masa' :
       'Calorías de mantenimiento') +
    '</div>' +
    '<div class="grid g-3" style="margin-top:20px;gap:8px">' +
      obMacroCard('🥩', 'Proteína', p, 'var(--green)') +
      obMacroCard('🍚', 'Carbos', c, 'var(--cyan)') +
      obMacroCard('🥑', 'Grasa', f, 'var(--pink)') +
    '</div>' +
    '<div style="margin-top:20px;padding:16px;background:var(--surface);border-radius:14px;border:1px solid var(--border)">' +
      '<div class="eyebrow">Desglose</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;font-size:12px">' +
        '<div style="display:flex;justify-content:space-between"><span>TMB Mifflin-St Jeor</span><span class="mono" style="font-weight:700">' + tmb + ' kcal</span></div>' +
        '<div style="display:flex;justify-content:space-between"><span>TDEE</span><span class="mono" style="font-weight:700">' + Math.round(tdee) + ' kcal</span></div>' +
        '<div style="display:flex;justify-content:space-between"><span>' + (sport?.name || '—') + '</span><span class="mono" style="font-weight:700">+' + (sport?.kcalExtra || 0) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between"><span>' + (goal?.name || '—') + '</span><span class="mono" style="font-weight:700">' + Math.round((goal?.adj || 0) * 100) + '%</span></div>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:16px;padding:12px;background:rgba(0,255,136,.06);border-radius:12px;border:1px solid rgba(0,255,136,.2)">' +
      '<div style="font-size:11px;line-height:1.5;color:var(--muted)">' +
        '✓ Cálculo Mifflin-St Jeor · ✓ Reparto ISSN · ✓ Editable desde Perfil' +
      '</div>' +
    '</div>';
  return div;
}

function obMacroCard(emoji, label, val, color) {
  return '<div style="padding:12px;background:var(--card);border-radius:12px;border:1px solid var(--border);text-align:center">' +
    '<div style="font-size:20px">' + emoji + '</div>' +
    '<div class="mono" style="font-size:16px;font-weight:800;color:' + color + ';margin-top:4px">' + val + 'g</div>' +
    '<div class="muted2" style="font-size:10px;margin-top:2px">' + label + '</div>' +
  '</div>';
}

function obCalcTMB() {
  const base = 10 * obDraft.weight + 6.25 * obDraft.height - 5 * obDraft.age;
  return Math.round(obDraft.sex === 'm' ? base + 5 : base - 161);
}

function obCalcTDEE(tmb) {
  const act = OB_ACTIVITIES.find((a) => a.id === obDraft.activity);
  return tmb * (act?.factor || 1.55);
}

function obBuildNav() {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.gap = '8px';
  div.style.marginTop = '16px';
  const canBack = obStep > 0;
  const isLast = obStep === OB_STEPS.length - 1;
  div.innerHTML =
    (canBack ? '<button class="btn btn-ghost" id="ob-back" style="flex:1">← Atrás</button>' : '') +
    '<button class="btn btn-primary" id="ob-next" style="flex:' + (canBack ? 2 : 1) + '">' +
      (isLast ? '✓ Empezar a usar SomaAi' : 'Continuar →') +
    '</button>';
  return div;
}

function obAttachHandlers() {
  const next = document.getElementById('ob-next');
  const back = document.getElementById('ob-back');
  if (next) next.onclick = obNext;
  if (back) back.onclick = obBack;

  document.querySelectorAll('[data-sex]').forEach((b) => {
    b.onclick = () => { obDraft.sex = b.dataset.sex; obRender(); };
  });

  const ageEl = document.getElementById('ob-age');
  if (ageEl) ageEl.oninput = (e) => { obDraft.age = +e.target.value; obRender(); };
  const hEl = document.getElementById('ob-height');
  if (hEl) hEl.oninput = (e) => { obDraft.height = +e.target.value; obRender(); };
  const wEl = document.getElementById('ob-weight');
  if (wEl) wEl.oninput = (e) => { obDraft.weight = +e.target.value; obRender(); };

  const nameEl = document.getElementById('ob-name');
  if (nameEl) nameEl.oninput = (e) => { obDraft.name = e.target.value; };
  const emailEl = document.getElementById('ob-email');
  if (emailEl) emailEl.oninput = (e) => { obDraft.email = e.target.value; };
  const passEl = document.getElementById('ob-pass');
  if (passEl) passEl.oninput = (e) => { obDraft.password = e.target.value; };

  document.querySelectorAll('[data-sport]').forEach((b) => {
    b.onclick = () => {
      obDraft.sport = b.dataset.sport;
      const sport = OB_SPORTS.find((s) => s.id === obDraft.sport);
      if (sport) obDraft.goal = sport.goalSugerido || 'mantener';
      obRender();
    };
  });

  document.querySelectorAll('[data-activity]').forEach((b) => {
    b.onclick = () => { obDraft.activity = b.dataset.activity; obRender(); };
  });

  document.querySelectorAll('[data-goal]').forEach((b) => {
    b.onclick = () => { obDraft.goal = b.dataset.goal; obRender(); };
  });

  document.querySelectorAll('[data-speed]').forEach((b) => {
    b.onclick = () => { obDraft.speed = +b.dataset.speed; obRender(); };
  });
}

function obNext() {
  if (obStep < OB_STEPS.length - 1) {
    obStep++;
    obRender();
    return;
  }
  obFinish();
}

function obBack() {
  if (obStep > 0) {
    obStep--;
    obRender();
  }
}

function obFinish() {
  const S = window.SomaAi;
  if (!S) return;
  const tmb = obCalcTMB();
  const tdee = obCalcTDEE(tmb);
  const sport = OB_SPORTS.find((s) => s.id === obDraft.sport) || OB_SPORTS[0];
  const goal = OB_GOALS.find((g) => g.id === obDraft.goal) || OB_GOALS[1];

  S.state.profile = {
    name: obDraft.name || 'Usuario',
    sex: obDraft.sex,
    age: obDraft.age,
    height: obDraft.height,
    weight: obDraft.weight,
    activity: obDraft.activity,
    goal: obDraft.goal,
    sport: obDraft.sport,
    speed: obDraft.speed,
    streak: 1,
    onboarded: true,
    onboardedAt: new Date().toISOString(),
    email: obDraft.email || null,
  };
  S.state.weight = obDraft.weight;
  S.state.entries = [];
  S.state.water = 0;
  S.saveState();
  S.render();
}

window.SomaAiOnboarding = {
  render: obRender,
  loadConfig: obLoadConfig,
  isNeeded: () => !window.SomaAi?.state?.profile?.onboarded,
};
