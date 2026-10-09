const root = document.getElementById('app-root');

if (root) {
  root.innerHTML = '<div style="padding:40px;text-align:center;color:#fff">' +
    '<div style="font-size:48px">⚙️</div>' +
    '<h1 style="margin-top:20px">SomaAi</h1>' +
    '<p style="color:#a1a7b3;margin-top:12px">Estructura lista</p>' +
    '</div>';
} else {
  console.error('[SomaAi] No se encontró #app-root');
}
