window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app-root');
  if (!root) {
    console.error('[SomaAi] No se encontró #app-root');
    return;
  }
  root.innerHTML = '<div style="padding:40px;text-align:center">' +
    '<div style="font-size:48px">⚙️</div>' +
    '<h1 style="margin-top:20px;color:#fff">SomaAi</h1>' +
    '<p style="color:#a1a7b3;margin-top:12px">Estructura lista. Esperando módulos...</p>' +
    '</div>';
  console.log('[SomaAi] App cargada');
});
