const FEATURES_STATE = { favorites: [], voiceListening: false, recognition: null };

function loadFavorites() {
  try { const saved = localStorage.getItem('somaai_favorites'); if (saved) FEATURES_STATE.favorites = JSON.parse(saved); } catch (e) {}
}
function saveFavorites() {
  try { localStorage.setItem('somaai_favorites', JSON.stringify(FEATURES_STATE.favorites)); } catch (e) {}
}
function toggleFavorite(foodId) {
  const S = window.SomaAi;
  const idx = FEATURES_STATE.favorites.indexOf(foodId);
  if (idx >= 0) { FEATURES_STATE.favorites.splice(idx, 1); if (S) S.toast('💔 Quitado de favoritos'); }
  else { FEATURES_STATE.favorites.push(foodId); if (S) S.toast('⭐ Agregado a favoritos'); }
  saveFavorites();
  if (S && S.haptic) S.haptic('light');
}
function isFavorite(foodId) { return FEATURES_STATE.favorites.includes(foodId); }

const ACHIEVEMENTS = [
  { id: 'first_meal', icon: '🍽️', label: 'Primer paso', check: (S) => S.state.entries.length >= 1 },
  { id: 'first_water', icon: '💧', label: 'Hidratado', check: (S) => S.state.water > 0 },
  { id: 'hydration', icon: '🌊', label: 'Meta agua', check: (S) => S.state.water >= (S.calcTargets(S.state.profile).water || 2000) },
  { id: 'balanced', icon: '⚖️', label: 'Balanceado', check: (S) => S.state.entries.length >= 3 },
  { id: 'streak_3', icon: '🔥', label: '3 días', check: (S) => (S.state.profile.streak || 1) >= 3 },
  { id: 'streak_7', icon: '⭐', label: '1 semana', check: (S) => (S.state.profile.streak || 1) >= 7 },
  { id: 'protein', icon: '🥩', label: 'Proteico', check: (S) => { const t = S.calcTargets(S.state.profile); const tot = S.calcTotals(S.state.entries); return tot.p >= t.p * 0.9 && tot.p > 0; }},
  { id: 'explorer', icon: '🔍', label: 'Explorador', check: (S) => (S.state.customFoods || []).length >= 3 },
  { id: 'perfectionist', icon: '💯', label: 'Perfecto', check: (S) => { const t = S.calcTargets(S.state.profile); const tot = S.calcTotals(S.state.entries); return Math.abs(t.kcal - tot.kcal) <= t.kcal * 0.05 && tot.kcal > 0; }},
];

function renderAchievements() {
  const S = window.SomaAi;
  if (!S) return '';
  const unlocked = ACHIEVEMENTS.filter(a => a.check(S)).length;
  return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><div class="eyebrow">🏆 Logros</div><span class="pill green" style="font-size:10px">' + unlocked + '/' + ACHIEVEMENTS.length + '</span></div><div class="achievements-grid">' + ACHIEVEMENTS.map(a => { const isUnlocked = a.check(S); return '<div class="achievement' + (isUnlocked ? ' unlocked' : '') + '"><div class="achievement-icon">' + a.icon + '</div><div class="achievement-label">' + a.label + '</div></div>'; }).join('') + '</div>';
}

async function startVoiceSearch(onResult) {
  const S = window.SomaAi;
  const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  if (isCapacitor) {
    try {
      const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
      const perm = await SpeechRecognition.requestPermissions();
      if (perm.speechRecognition !== 'granted') { if (S) S.toast('❌ Permiso denegado'); return; }
      SpeechRecognition.removeAllListeners();
      SpeechRecognition.addListener('partialResults', (data) => { if (data.matches && data.matches.length > 0 && onResult) onResult(data.matches[0]); });
      await SpeechRecognition.start({ language: 'es-AR', maxResults: 1, partialResults: true, popup: false });
    } catch (e) { if (S) S.toast('❌ Error: ' + e.message); }
  } else {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { if (S) S.toast('🔇 Voz no soportada'); return; }
    const rec = new SR();
    rec.lang = 'es-AR'; rec.interimResults = true; rec.continuous = false;
    rec.onresult = (event) => { const t = event.results[0][0].transcript; if (onResult) onResult(t); };
    rec.onerror = () => { if (S) S.toast('🔇 Error'); };
    rec.start();
    FEATURES_STATE.recognition = rec;
  }
}

function getWeekStats() {
  const S = window.SomaAi;
  if (!S) return [];
  const stats = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today); date.setDate(today.getDate() - i);
    const dayName = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()];
    let kcal = 0;
    if (i === 0) kcal = S.calcTotals(S.state.entries).kcal;
    stats.push({ date: date.toISOString().slice(0, 10), day: dayName, kcal, isToday: i === 0 });
  }
  return stats;
}

function renderWeekChart() {
  const stats = getWeekStats();
  const max = Math.max(...stats.map(s => s.kcal), 2000);
  return '<div class="week-chart">' + stats.map(s => { const height = max > 0 ? (s.kcal / max) * 100 : 0; return '<div class="week-bar' + (s.isToday ? ' today' : '') + '" style="height:' + Math.max(4, height) + '%"><div class="week-bar-label">' + s.day + '</div></div>'; }).join('') + '</div>';
}

function applyTheme(theme) {
  if (theme === 'light') document.body.classList.add('light-theme');
  else if (theme === 'auto') { const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; document.body.classList.toggle('light-theme', !prefersDark); }
  else document.body.classList.remove('light-theme');
}
function loadTheme() { try { const saved = localStorage.getItem('somaai_theme') || 'dark'; applyTheme(saved); } catch (e) {} }
function setTheme(theme) { try { localStorage.setItem('somaai_theme', theme); applyTheme(theme); } catch (e) {} }

function editEntry(index) {
  const S = window.SomaAi;
  if (!S) return;
  const entry = S.state.entries[index];
  if (!entry) return;
  const food = S.state.foods.find(f => f.id === entry.foodId) || entry.food;
  if (!food) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:500px;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1)';
  modal.innerHTML = '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div><div class="h2">✏️ ' + food.name + '</div><label style="display:flex;flex-direction:column;gap:6px;margin-top:20px"><span class="eyebrow">Cantidad (g)</span><input type="number" id="ee-grams" value="' + entry.grams + '" min="1" class="input-field" style="font-size:16px;font-weight:700" /></label><div style="margin-top:16px"><span class="eyebrow">Comida</span><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:8px" id="ee-meals">' + ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'].map(m => '<button class="btn ' + (entry.meal === m ? 'btn-primary' : 'btn-ghost') + ' btn-sm" data-ee-meal="' + m + '" style="font-size:10px;padding:8px 4px">' + m.charAt(0).toUpperCase() + m.slice(1, 3) + '</button>').join('') + '</div></div><div style="display:flex;gap:8px;margin-top:20px"><button class="btn btn-ghost" id="ee-delete" style="color:var(--red)">🗑️</button><button class="btn btn-ghost" id="ee-cancel" style="flex:1">Cancelar</button><button class="btn btn-primary" id="ee-save" style="flex:2">Guardar</button></div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; }, 10);
  let selectedMeal = entry.meal || 'snack';
  const mealBtns = modal.querySelectorAll('[data-ee-meal]');
  mealBtns.forEach(b => { b.onclick = () => { mealBtns.forEach(x => { x.classList.remove('btn-primary'); x.classList.add('btn-ghost'); }); b.classList.remove('btn-ghost'); b.classList.add('btn-primary'); selectedMeal = b.dataset.eeMeal; }; });
  const close = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(100%)'; setTimeout(() => overlay.remove(), 300); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#ee-cancel').onclick = close;
  modal.querySelector('#ee-save').onclick = () => { const grams = parseInt(modal.querySelector('#ee-grams').value) || 100; S.state.entries[index].grams = grams; S.state.entries[index].meal = selectedMeal; S.saveState(); S.render(); S.toast('✅ Actualizado'); close(); };
  modal.querySelector('#ee-delete').onclick = () => { S.state.entries.splice(index, 1); S.saveState(); S.render(); S.toast('🗑️ Eliminado'); close(); };
}

function duplicateEntry(index) {
  const S = window.SomaAi;
  if (!S) return;
  const entry = S.state.entries[index];
  if (!entry) return;
  S.state.entries.push({ ...entry, addedAt: new Date().toISOString() });
  S.saveState(); S.render(); S.toast('📋 Duplicado');
}

function featuresInit() { loadFavorites(); loadTheme(); }

window.SomaAiFeatures = {
  init: featuresInit, favorites: FEATURES_STATE.favorites,
  toggleFavorite, isFavorite, renderAchievements, startVoiceSearch,
  renderWeekChart, applyTheme, setTheme, editEntry, duplicateEntry, getWeekStats,
};
