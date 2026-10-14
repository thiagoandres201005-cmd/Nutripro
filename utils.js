/* ============================================================================
   SomaAi — Utilidades nativas con Capacitor
   - Haptics (vibración real)
   - Notificaciones locales
   - Botón atrás de Android
   - Detección de red
   ========================================================================== */

const UTILS_STATE = {
  isCapacitor: false,
  lastBackPress: 0,
  networkOnline: true,
};

async function utilsInit() {
  UTILS_STATE.isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  // Detección de red
  if (UTILS_STATE.isCapacitor) {
    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      UTILS_STATE.networkOnline = status.connected;
      Network.addListener('networkStatusChange', (s) => {
        UTILS_STATE.networkOnline = s.connected;
        if (!s.connected) {
          if (window.SomaAi && window.SomaAi.toast) window.SomaAi.toast('📡 Sin conexión');
        } else {
          if (window.SomaAi && window.SomaAi.toast) window.SomaAi.toast('✅ Conectado');
        }
      });
    } catch (e) {}
  }

  // Botón atrás de Android
  if (UTILS_STATE.isCapacitor) {
    try {
      const { App } = await import('@capacitor/app');
      App.addListener('backButton', ({ canGoBack }) => {
        const now = Date.now();
        // Si estamos en una pestaña distinta a "Hoy", volver a "Hoy"
        if (window.SomaAi && window.SomaAi.state.currentTab !== 'hoy') {
          window.SomaAi.state.currentTab = 'hoy';
          window.SomaAi.render();
          return;
        }
        // Si estamos en "Hoy" y pasaron menos de 2 segundos desde el último back, salir
        if (now - UTILS_STATE.lastBackPress < 2000) {
          App.exitApp();
        } else {
          UTILS_STATE.lastBackPress = now;
          if (window.SomaAi && window.SomaAi.toast) {
            window.SomaAi.toast('Tocá atrás otra vez para salir');
          }
        }
      });
    } catch (e) {}
  }
}

/* ------------------------- Haptics ------------------------- */
async function utilsHaptic(style) {
  if (UTILS_STATE.isCapacitor) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      if (style === 'light') await Haptics.impact({ style: ImpactStyle.Light });
      else if (style === 'medium') await Haptics.impact({ style: ImpactStyle.Medium });
      else if (style === 'heavy') await Haptics.impact({ style: ImpactStyle.Heavy });
      else if (style === 'success') await Haptics.notification({ type: 'SUCCESS' });
      else if (style === 'warning') await Haptics.notification({ type: 'WARNING' });
      else if (style === 'error') await Haptics.notification({ type: 'ERROR' });
      else await Haptics.vibrate({ duration: 10 });
    } catch (e) {
      if (navigator.vibrate) navigator.vibrate(10);
    }
  } else {
    if (navigator.vibrate) {
      if (style === 'success') navigator.vibrate([10, 50, 10]);
      else if (style === 'error') navigator.vibrate([50, 30, 50]);
      else navigator.vibrate(10);
    }
  }
}

/* ------------------------- Notificaciones ------------------------- */
async function utilsScheduleWaterReminder() {
  if (!UTILS_STATE.isCapacitor) {
    if (window.SomaAi && window.SomaAi.toast) window.SomaAi.toast('🔔 Notificaciones solo en APK');
    return;
  }
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') {
        if (window.SomaAi && window.SomaAi.toast) window.SomaAi.toast('❌ Permiso denegado');
        return;
      }
    }
    // Cancelar previas
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
    // Programar recordatorios cada 2 horas de 8am a 10pm
    const notifications = [];
    for (let hour = 8; hour <= 22; hour += 2) {
      notifications.push({
        id: 1000 + hour,
        title: '💧 Hora de hidratarte',
        body: 'Tomá un vaso de agua para mantenerte hidratado',
        schedule: { at: new Date(new Date().setHours(hour, 0, 0, 0)) },
        sound: null,
      });
    }
    await LocalNotifications.schedule({ notifications });
    if (window.SomaAi && window.SomaAi.toast) window.SomaAi.toast('✅ Recordatorios activados (cada 2h)');
  } catch (e) {
    console.error('Error scheduleWater:', e);
    if (window.SomaAi && window.SomaAi.toast) window.SomaAi.toast('❌ Error al programar');
  }
}

async function utilsScheduleMealReminders() {
  if (!UTILS_STATE.isCapacitor) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return;
    }
    const notifications = [
      { id: 2001, title: '🌅 Desayuno', body: '¿Ya registraste tu desayuno?', schedule: { at: new Date(new Date().setHours(9, 0, 0, 0)) }, sound: null },
      { id: 2002, title: '☀️ Almuerzo', body: '¿Ya registraste tu almuerzo?', schedule: { at: new Date(new Date().setHours(13, 0, 0, 0)) }, sound: null },
      { id: 2003, title: '🍵 Merienda', body: '¿Ya registraste tu merienda?', schedule: { at: new Date(new Date().setHours(17, 0, 0, 0)) }, sound: null },
      { id: 2004, title: '🌙 Cena', body: '¿Ya registraste tu cena?', schedule: { at: new Date(new Date().setHours(21, 0, 0, 0)) }, sound: null },
    ];
    await LocalNotifications.schedule({ notifications });
    if (window.SomaAi && window.SomaAi.toast) window.SomaAi.toast('✅ Recordatorios de comidas activados');
  } catch (e) {}
}

/* ------------------------- StatusBar ------------------------- */
async function utilsSetStatusBar() {
  if (!UTILS_STATE.isCapacitor) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0a0b' });
  } catch (e) {}
}

window.SomaAiUtils = {
  init: utilsInit,
  haptic: utilsHaptic,
  scheduleWater: utilsScheduleWaterReminder,
  scheduleMeals: utilsScheduleMealReminders,
  setStatusBar: utilsSetStatusBar,
  state: UTILS_STATE,
};

// Auto-init cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  utilsInit();
  utilsSetStatusBar();
});

// Exponer haptic global
window.hapticReal = utilsHaptic;
