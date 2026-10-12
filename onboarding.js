/* ============================================================================
   SomaAi — Onboarding v7
   - Permisos REALES con Capacitor
   - IMC en tiempo real
   - Datos guardados en perfil
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
  permissions: {
    camera: false,
    notifications: false,
    storage: false,
    vibration: false,
    microphone: false,
  },
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
  } catch (e) {}
}

const OB_STEPS = ['welcome', 'permissions', 'account', 'basics', 'sport', 'days', 'goal', 'summary'];

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
  const labels = {
    welcome: 'Bienvenida',
    permissions: 'Permisos',
    account: 'Cuenta',
    basics: 'Datos',
    sport: 'Deporte',
    days: 'Actividad',
    goal: 'Objetivo',
    summary: 'Tu plan',
  };
  div.innerHTML =
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px">' +
      '<span class="eyebrow">Paso ' + (obStep + 1) + ' de ' + OB_STEPS.length + '</span>' +
      '<span class="eyebrow">' + labels[OB_STEPS[obStep]] + '</span>' +
    '</div>' +
    '<div class="bar thin">' +
      '<i style="width:' + pct + '%;background:linear-gradient(90deg,var(--green),var(--cyan))"></i>' +
    '</div>';
  return div;
}

function obBuildStep(step) {
  switch (step) {
    case 'welcome': return obStepWelcome();
    case 'permissions': return obStepPermissions();
    case 'account': return obStepAccount();
    case 'basics': return obStepBasics();
    case 'sport': return obStepSport();
    case 'days': return obStepDays();
    case 'goal': return obStepGoal();
    case 'summary': return obStepSummary();
    default: return document.createElement('div');
  }
}

/* PASO 1: Bienvenida */
function obStepWelcome() {
  const div = document.createElement('div');
  div.className = 'card card-pad fade-in-up';
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

/* ------------------------- PASO 2: Permisos REALES ------------------------- */
function obStepPermissions() {
  const div = document.createElement('div');
  div.className = 'card card-pad fade-in-up';
  div.style.maxWidth = '100%';
  div.style.overflowX = 'hidden';

  const perms = [
    { id: 'camera', emoji: '📷', title: 'Cámara', desc: 'Para escanear códigos de barras' },
    { id: 'notifications', emoji: '🔔', title: 'Notificaciones', desc: 'Recordatorios de comidas y agua' },
    { id: 'storage', emoji: '📁', title: 'Almacenamiento', desc: 'Exportar datos y guardar fotos' },
    { id: 'vibration', emoji: '📳', title: 'Vibración', desc: 'Respuesta háptica en la app' },
    { id: 'microphone', emoji: '🎤', title: 'Micrófono', desc: 'Búsqueda por voz (opcional)' },
  ];

  const rows = perms.map(p => {
    const isChecked = obDraft.permissions[p.id];
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface);border-radius:12px;border:1px solid ${isChecked ? 'var(--green)' : 'var(--border)'};margin-bottom:8px;transition:all .2s">
        <div style="font-size:24px">${p.emoji}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700">${p.title}</div>
          <div class="muted2" style="font-size:11px">${p.desc}</div>
        </div>
        <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${isChecked ? 'var(--green)' : 'var(--border)'};display:grid;place-items:center;background:${isChecked ? 'var(--green)' : 'transparent'}">
          ${isChecked ? '<span style="color:#000;font-weight:900;font-size:12px">✓</span>' : ''}
        </div>
      </div>`;
  }).join('');

  div.innerHTML = `
    <div class="eyebrow" style="color:var(--green)">⚙️ Permisos</div>
    <div class="h2" style="margin-top:8px">Configurá tu experiencia</div>
    <div class="muted" style="font-size:12px;margin-top:4px">Tocá "Activar todos" para que el teléfono te pida los permisos reales.</div>
    <div style="margin-top:16px">${rows}</div>
    <button class="btn btn-primary" id="ob-perm-all" style="width:100%;margin-top:16px">Activar todos los permisos</button>
    <button class="btn btn-ghost" id="ob-perm-skip" style="width:100%;margin-top:8px">Omitir por ahora</button>
  `;
  return div;
}

async function obRequestPermissions() {
  const results = {};
  const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

  if (isCapacitor) {
    try {
      // Cámara
      const { Camera } = await import('@capacitor/camera');
      const camStatus = await Camera.requestPermissions({ permissions: ['camera'] });
      results.camera = camStatus.camera === 'granted';

      // Notificaciones
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const notifStatus = await LocalNotifications.requestPermissions();
      results.notifications = notifStatus.display === 'granted';

      // Vibración (no necesita permiso en Android, pero verificamos)
      results.vibration = true;

      // Almacenamiento (en Android moderno se maneja diferente, pero lo marcamos)
      results.storage = true;

      // Micrófono
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        const micStatus = await SpeechRecognition.requestPermissions();
        results.microphone = micStatus.speechRecognition === 'granted';
      } catch (e) {
        results.microphone = false;
      }
    } catch (e) {
      console.warn('Error pidiendo permisos nativos:', e);
    }
  } else {
    // Web fallback
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        results.camera = true;
      } catch (e) {
        results.camera = false;
      }
    }
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      results.notifications = permission === 'granted';
    }
    results.storage = true;
    results.vibration = true;
  }

  obDraft.permissions = { ...obDraft.permissions, ...results };
  obRender();
  if (window.SomaAi && window.SomaAi.toast) {
    const granted = Object.values(results).filter(Boolean).length;
    window.SomaAi.toast(`✅ ${granted} permisos activados`);
  }
}

/* ------------------------- PASO 3: Cuenta ------------------------- */
function obStepAccount() {
  const div = document.createElement('div');
  div.className = 'card card-pad fade-in-up';
  div.innerHTML = `
    <div class="h2">Creá tu cuenta</div>
    <div class="muted" style="font-size:12px;margin-top:4px">Sincronizá entre dispositivos. Podés usar la app sin cuenta.</div>
    <div style="margin-top:20px">
      <button class="btn btn-white" id="ob-google" style="width:100%;margin-bottom:12px">
        <span style="font-size:18px">G</span> Continuar con Google
      </button>
      <div style="display:flex;align-items:center;gap:8px;margin:16px 0;color:var(--muted2);font-size:11px">
        <div style="flex:1;height:1px;background:var(--border)"></div>
        <span>o</span>
        <div style="flex:1;height:1px;background:var(--border)"></div>
      </div>
      <label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
        <span class="eyebrow">Email (opcional)</span>
        <input type="email" id="ob-email" class="input" placeholder="tu@email.com" value="${escapeHtml(obDraft.email || '')}" />
      </label>
      <label style="display:flex;flex-direction:column;gap:6px">
        <span class="eyebrow">Contraseña (opcional)</span>
        <input type="password" id="ob-pass" class="input" placeholder="••••••••" value="${escapeHtml(obDraft.password || '')}" />
      </label>
    </div>
  `;
  return div;
}

/* ------------------------- PASO 4: Datos Básicos (IMC en tiempo real) ------------------------- */
function obStepBasics() {
  const div = document.createElement('div');
  div.className = 'card card-pad fade-in-up';
  const imc = obDraft.weight / ((obDraft.height / 100) ** 2);
  const imcCat = imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
  const imcColor = imc < 18.5 ? 'var(--cyan)' : imc < 25 ? 'var(--green)' : imc < 30 ? 'var(--amber)' : 'var(--red)';

  div.innerHTML = `
    <div class="h2">Tus datos</div>
    <div class="muted" style="font-size:12px;margin-top:4px">Usamos Mifflin-St Jeor para calcular tu plan.</div>
    <div style="margin-top:20px">
      <label style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
        <span class="eyebrow">Nombre</span>
        <input type="text" id="ob-name" class="input" placeholder="Tu nombre" value="${escapeHtml(obDraft.name || '')}" />
      </label>
      
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="btn ${obDraft.sex === 'f' ? 'btn-primary' : 'btn-ghost'}" data-sex="f" style="flex:1">Femenino</button>
        <button class="btn ${obDraft.sex === 'm' ? 'btn-primary' : 'btn-ghost'}" data-sex="m" style="flex:1">Masculino</button>
      </div>

      <div class="grid g-2" style="gap:12px">
        <label style="display:flex;flex-direction:column;gap:6px">
          <span class="eyebrow">Edad</span>
          <input type="number" id="ob-age" class="input" value="${obDraft.age}" />
        </label>
        <label style="display:flex;flex-direction:column;gap:6px">
          <span class="eyebrow">Altura (cm)</span>
          <input type="number" id="ob-height" class="input" value="${obDraft.height}" />
        </label>
      </div>
      <label style="display:flex;flex-direction:column;gap:6px;margin-top:12px">
        <span class="eyebrow">Peso (kg)</span>
        <input type="number" id="ob-weight" class="input" value="${obDraft.weight}" />
      </label>
      
      <div id="ob-imc-box" style="margin-top:16px;padding:12px;background:var(--surface);border-radius:12px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span class="muted" style="font-size:12px">IMC estimado</span>
        <span class="mono" style="font-weight:800;color:${imcColor}">${imc.toFixed(1)} · ${imcCat}</span>
      </div>
    </div>
  `;
  return div;
}

/* ------------------------- PASO 5: Deporte ------------------------- */
function obStepSport() {
  const div = document.createElement('div');
  div.className = 'card card-pad fade-in-up';
  const sports = OB_SPORTS.length ? OB_SPORTS : [
    { id: 'ninguno', name: 'Ninguno', emoji: '🛋️' },
    { id: 'futbol', name: 'Fútbol', emoji: '⚽' },
    { id: 'gym', name: 'Gym', emoji: '🏋️' },
    { id: 'running', name: 'Running', emoji: '🏃' },
    { id: 'ciclismo', name: 'Ciclismo', emoji: '🚴' },
  ];
  const buttons = sports.map(s => `
    <button class="btn ${obDraft.sport === s.id ? 'btn-primary' : 'btn-ghost'}" data-sport="${s.id}" style="flex-direction:column;height:auto;padding:12px 8px;gap:4px">
      <span style="font-size:20px">${s.emoji || '💪'}</span>
      <span style="font-size:11px">${s.name}</span>
    </button>
  `).join('');

  div.innerHTML = `
    <div class="h2">¿Qué deporte practicás?</div>
    <div class="muted" style="font-size:12px;margin-top:4px">Ajustamos tus calorías según tu actividad.</div>
    <div class="grid g-2" style="margin-top:20px;gap:8px">${buttons}</div>
  `;
  return div;
}

/* ------------------------- PASO 6: Días de Actividad ------------------------- */
function obStepDays() {
  const div = document.createElement('div');
  div.className = 'card card-pad fade-in-up';
  const days = obDraft.trainingDays;
  const labels = ['Sedentario', 'Muy ligero', 'Ligero', 'Moderado', 'Activo', 'Muy activo', 'Atleta'];
  const factor = [1.2, 1.2, 1.375, 1.55, 1.55, 1.725, 1.9][days];

  div.innerHTML = `
    <div class="h2">¿Cuántos días entrenás?</div>
    <div class="muted" style="font-size:12px;margin-top:4px">Incluye entrenamiento formal y actividad física intensa.</div>
    <div style="margin-top:24px;text-align:center">
      <div class="h1" style="font-size:48px">${days} <span class="muted" style="font-size:16px;font-weight:600">días/semana</span></div>
      <div class="muted" style="font-size:12px;margin-top:4px">Nivel: <strong>${labels[days]}</strong> (factor ×${factor})</div>
    </div>
    <input type="range" id="ob-days" min="0" max="7" value="${days}" style="width:100%;margin-top:24px;accent-color:var(--green);height:8px" />
    <div style="display:flex;justify-content:space-between;margin-top:8px" class="muted2" style="font-size:10px">
      <span>0</span><span>7</span>
    </div>
  `;
  return div;
}

/* ------------------------- PASO 7: Objetivo ------------------------- */
function obStepGoal() {
  const div = document.createElement('div');
  div.className = 'card card-pad fade-in-up';
  const goals = OB_GOALS.length ? OB_GOALS : [
    { id: 'perder', name: 'Perder grasa', emoji: '📉', adj: -0.15 },
    { id: 'mantener', name: 'Mantener', emoji: '⚖️', adj: 0 },
    { id: 'ganar', name: 'Ganar músculo', emoji: '📈', adj: 0.15 },
  ];
  const buttons = goals.map(g => `
    <button class="btn ${obDraft.goal === g.id ? 'btn-primary' : 'btn-ghost'}" data-goal="${g.id}" style="flex-direction:column;height:auto;padding:16px 8px;gap:6px">
      <span style="font-size:24px">${g.emoji}</span>
      <span style="font-size:12px">${g.name}</span>
    </button>
  `).join('');

  const speeds = [0.25, 0.5, 0.75];
  const speedBtns = speeds.map(s => `
    <button class="btn ${obDraft.speed === s ? 'btn-primary' : 'btn-ghost'}" data-speed="${s}" style="flex:1">
      ${s} kg/sem
    </button>
  `).join('');

  div.innerHTML = `
    <div class="h2">¿Cuál es tu objetivo?</div>
    <div class="muted" style="font-size:12px;margin-top:4px">Ajustamos tus calorías y macros.</div>
    <div class="grid g-3" style="margin-top:20px;gap:8px">${buttons}</div>
    ${obDraft.goal !== 'mantener' ? `
      <div style="margin-top:20px">
        <div class="eyebrow" style="margin-bottom:8px">Velocidad</div>
        <div style="display:flex;gap:8px">${speedBtns}</div>
      </div>
    ` : ''}
  `;
  return div;
}

/* ------------------------- PASO 8: Resumen ------------------------- */
function obStepSummary() {
  const tmb = obCalcTMB();
  const tdee = obCalcTDEE(tmb);
  const sport = OB_SPORTS.find((s) => s.id === obDraft.sport) || { kcalExtra: 0, name: 'Ninguno' };
  const goal = OB_GOALS.find((g) => g.id === obDraft.goal) || { adj: 0, name: 'Mantener' };
  const targetKcal = Math.round((tdee + (sport.kcalExtra || 0)) * (1 + (goal.adj || 0)));
  const macros = { p: 30, c: 45, f: 25 };
  const p = Math.round(targetKcal * macros.p / 100 / 4);
  const c = Math.round(targetKcal * macros.c / 100 / 4);
  const f = Math.round(targetKcal * macros.f / 100 / 9);

  const div = document.createElement('div');
  div.className = 'card card-pad fade-in-up';
  div.style.maxWidth = '100%';
  div.innerHTML = `
    <div class="eyebrow" style="color:var(--green)">✓ Tu plan personalizado</div>
    <div class="h1" style="margin-top:8px;font-size:42px">${targetKcal}<span class="muted" style="font-size:16px;font-weight:600"> kcal/día</span></div>
    <div class="muted" style="font-size:12px;margin-top:4px">${goal.name}</div>
    <div class="grid g-3" style="margin-top:20px;gap:8px">
      <div style="padding:12px;background:var(--card);border-radius:12px;border:1px solid var(--border);text-align:center">
        <div style="font-size:20px">🥩</div>
        <div class="mono" style="font-size:16px;font-weight:800;color:var(--green);margin-top:4px">${p}g</div>
        <div class="muted2" style="font-size:10px">Proteína</div>
      </div>
      <div style="padding:12px;background:var(--card);border-radius:12px;border:1px solid var(--border);text-align:center">
        <div style="font-size:20px">🍚</div>
        <div class="mono" style="font-size:16px;font-weight:800;color:var(--cyan);margin-top:4px">${c}g</div>
        <div class="muted2" style="font-size:10px">Carbos</div>
      </div>
      <div style="padding:12px;background:var(--card);border-radius:12px;border:1px solid var(--border);text-align:center">
        <div style="font-size:20px">🥑</div>
        <div class="mono" style="font-size:16px;font-weight:800;color:var(--pink);margin-top:4px">${f}g</div>
        <div class="muted2" style="font-size:10px">Grasa</div>
      </div>
    </div>
    <div style="margin-top:20px;padding:16px;background:var(--surface);border-radius:14px;border:1px solid var(--border)">
      <div class="eyebrow">Desglose del cálculo</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;font-size:12px">
        <div style="display:flex;justify-content:space-between"><span class="muted2">TMB Mifflin-St Jeor</span><span class="mono" style="font-weight:700">${tmb} kcal</span></div>
        <div style="display:flex;justify-content:space-between"><span class="muted2">Factor actividad</span><span class="mono" style="font-weight:700">×${obGetActivityFactor()}</span></div>
        <div style="display:flex;justify-content:space-between"><span class="muted2">${sport.name}</span><span class="mono" style="font-weight:700">+${sport.kcalExtra || 0}</span></div>
        <div style="display:flex;justify-content:space-between"><span class="muted2">${goal.name}</span><span class="mono" style="font-weight:700">${Math.round((goal.adj || 0) * 100)}%</span></div>
      </div>
    </div>
    <div style="margin-top:16px;padding:12px;background:rgba(0,255,136,.06);border-radius:12px;border:1px solid rgba(0,255,136,.2)">
      <div style="font-size:11px;line-height:1.5;color:var(--muted)">✓ Cálculo Mifflin-St Jeor · ✓ Reparto ISSN · ✓ Editable desde Perfil</div>
    </div>
  `;
  return div;
}

/* ------------------------- Cálculos ------------------------- */
function obCalcTMB() {
  const w = Number(obDraft.weight) || 72.4;
  const h = Number(obDraft.height) || 168;
  const a = Number(obDraft.age) || 28;
  const base = 10 * w + 6.25 * h - 5 * a;
  return Math.round(obDraft.sex === 'm' ? base + 5 : base - 161);
}
function obCalcTDEE(tmb) {
  return tmb * obGetActivityFactor();
}
function obGetActivityFactor() {
  const days = Number(obDraft.trainingDays) || 0;
  if (days <= 1) return 1.2;
  if (days <= 3) return 1.375;
  if (days <= 5) return 1.55;
  if (days <= 6) return 1.725;
  return 1.9;
}

/* ------------------------- NAVEGACIÓN Y HANDLERS ------------------------- */
function obBuildNav() {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.gap = '12px';
  div.style.marginTop = '24px';
  div.style.paddingBottom = '24px';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-ghost';
  backBtn.id = 'ob-back';
  backBtn.textContent = '← Atrás';
  backBtn.style.display = obStep === 0 ? 'none' : 'flex';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-primary';
  nextBtn.id = 'ob-next';
  nextBtn.style.flex = '1';
  
  if (obStep === OB_STEPS.length - 1) {
    nextBtn.textContent = '🚀 Empezar';
  } else {
    nextBtn.textContent = 'Siguiente →';
  }

  div.appendChild(backBtn);
  div.appendChild(nextBtn);
  return div;
}

function obAttachHandlers() {
  const next = document.getElementById('ob-next');
  const back = document.getElementById('ob-back');
  if (next) next.onclick = obNext;
  if (back) back.onclick = obBack;

  // Permisos
  const permAll = document.getElementById('ob-perm-all');
  if (permAll) permAll.onclick = obRequestPermissions;
  const permSkip = document.getElementById('ob-perm-skip');
  if (permSkip) permSkip.onclick = () => {
    obStep++;
    obRender();
  };

  // Cuenta
  const google = document.getElementById('ob-google');
  if (google) google.onclick = () => {
    if (window.SomaAi && window.SomaAi.toast) window.SomaAi.toast('🚧 Google Sign-In próximamente');
  };
  const email = document.getElementById('ob-email');
  if (email) email.oninput = (e) => { obDraft.email = e.target.value; };
  const pass = document.getElementById('ob-pass');
  if (pass) pass.oninput = (e) => { obDraft.password = e.target.value; };

  // Datos básicos con IMC en tiempo real
  document.querySelectorAll('[data-sex]').forEach((b) => {
    b.onclick = () => { obDraft.sex = b.dataset.sex; obRender(); };
  });
  const nameEl = document.getElementById('ob-name');
  if (nameEl) nameEl.oninput = (e) => { obDraft.name = e.target.value; };
  const ageEl = document.getElementById('ob-age');
  if (ageEl) ageEl.oninput = (e) => { 
    obDraft.age = parseFloat(e.target.value) || 28; 
    obUpdateIMC();
  };
  const hEl = document.getElementById('ob-height');
  if (hEl) hEl.oninput = (e) => { 
    obDraft.height = parseFloat(e.target.value) || 168; 
    obUpdateIMC();
  };
  const wEl = document.getElementById('ob-weight');
  if (wEl) wEl.oninput = (e) => { 
    obDraft.weight = parseFloat(e.target.value) || 72.4; 
    obUpdateIMC();
  };

  // Deporte
  document.querySelectorAll('[data-sport]').forEach((b) => {
    b.onclick = () => {
      obDraft.sport = b.dataset.sport;
      const sport = OB_SPORTS.find((s) => s.id === obDraft.sport);
      if (sport && sport.goalSugerido) obDraft.goal = sport.goalSugerido;
      obRender();
    };
  });

  // Días de actividad (slider)
  const daysEl = document.getElementById('ob-days');
  if (daysEl) daysEl.oninput = (e) => {
    obDraft.trainingDays = parseInt(e.target.value);
    const labels = ['Sedentario', 'Muy ligero', 'Ligero', 'Moderado', 'Activo', 'Muy activo', 'Atleta'];
    const factor = [1.2, 1.2, 1.375, 1.55, 1.55, 1.725, 1.9][obDraft.trainingDays];
    const disp = daysEl.closest('.card').querySelector('.h1');
    if (disp) disp.innerHTML = obDraft.trainingDays + ' <span class="muted" style="font-size:16px;font-weight:600">días/semana</span>';
    const lbl = daysEl.closest('.card').querySelector('.muted');
    if (lbl) lbl.innerHTML = 'Nivel: <strong>' + labels[obDraft.trainingDays] + '</strong> (factor ×' + factor + ')';
  };

  // Objetivo
  document.querySelectorAll('[data-goal]').forEach((b) => {
    b.onclick = () => { obDraft.goal = b.dataset.goal; obRender(); };
  });
  document.querySelectorAll('[data-speed]').forEach((b) => {
    b.onclick = () => { obDraft.speed = parseFloat(b.dataset.speed); obRender(); };
  });
}

function obUpdateIMC() {
  const box = document.getElementById('ob-imc-box');
  if (!box) return;
  const imc = obDraft.weight / ((obDraft.height / 100) ** 2);
  const imcCat = imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
  const imcColor = imc < 18.5 ? 'var(--cyan)' : imc < 25 ? 'var(--green)' : imc < 30 ? 'var(--amber)' : 'var(--red)';
  box.innerHTML = `
    <span class="muted" style="font-size:12px">IMC estimado</span>
    <span class="mono" style="font-weight:800;color:${imcColor}">${imc.toFixed(1)} · ${imcCat}</span>
  `;
}

function obNext() {
  if (obStep < OB_STEPS.length - 1) {
    obStep++;
    obRender();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  obFinish();
}

function obBack() {
  if (obStep > 0) {
    obStep--;
    obRender();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function obFinish() {
  const S = window.SomaAi;
  if (!S) return;
  const weight = Number(obDraft.weight) || 72.4;
  const height = Number(obDraft.height) || 168;
  const age = Number(obDraft.age) || 28;
  const sex = obDraft.sex || 'f';
  const days = Number(obDraft.trainingDays) || 0;
  let activity = 'moderada';
  if (days <= 1) activity = 'sedentaria';
  else if (days <= 3) activity = 'ligera';
  else if (days <= 5) activity = 'moderada';
  else if (days <= 6) activity = 'alta';
  else activity = 'atleta';

  const imc = weight / ((height / 100) ** 2);

  S.state.profile = {
    name: obDraft.name || 'Usuario',
    sex: sex,
    age: age,
    height: height,
    weight: weight,
    imc: imc,
    activity: activity,
    trainingDays: days,
    goal: obDraft.goal || 'mantener',
    sport: obDraft.sport || 'ninguno',
    speed: obDraft.speed || 0.5,
    streak: 1,
    onboarded: true,
    onboardedAt: new Date().toISOString(),
    email: obDraft.email || null,
    weightHistory: [{ date: new Date().toISOString().slice(0, 10), kg: weight }],
    permissions: obDraft.permissions,
  };
  S.state.weight = weight;
  S.state.entries = [];
  S.state.water = 0;
  S.saveState();
  S.render();
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

window.SomaAiOnboarding = {
  render: obRender,
  loadConfig: obLoadConfig,
  isNeeded: () => !window.SomaAi?.state?.profile?.onboarded,
};
