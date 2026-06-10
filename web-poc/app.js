/* ═══════════════════════════════════════════════════════
   JAZZ NOTE — Web App Logic
   Pure vanilla JS, zero dependencies
   Jazzware · Marriott International Demo
═══════════════════════════════════════════════════════ */

'use strict';

// ────────────────────────────────────────────────────────
// MOCK DATA (from marriott-alerts-poc/src/data/mockAlerts.ts)
// ────────────────────────────────────────────────────────
const now = new Date();
const minsAgo = (m) => new Date(now.getTime() - m * 60 * 1000);
const hrsAgo  = (h) => new Date(now.getTime() - h * 60 * 60 * 1000);

const INITIAL_ALERTS = [
  {
    id: '1',
    title: 'Fire Alarm — Floor 12',
    severity: 'critical',
    description: 'Fire alarm activated on floor 12, east wing. Smoke detected near room 1218. Local fire department has been notified.',
    action: 'Evacuate guests from floors 11–13 immediately. Direct to lobby assembly point. Do NOT use elevators. Account for all guests on evacuation roster.',
    timestamp: minsAgo(2),
    acknowledged: false,
    createdBy: 'Security Desk',
  },
  {
    id: '2',
    title: 'Medical Emergency — Lobby Bar',
    severity: 'high',
    description: 'Guest reported chest pain and difficulty breathing at the lobby bar. AED retrieved and on-site.',
    action: 'EMS en route (ETA 5 min). Clear a 10-ft radius around the guest. First Aid–certified staff (J. Torres) already on scene. Do not move the guest.',
    timestamp: minsAgo(8),
    acknowledged: false,
    createdBy: 'Front Desk Manager',
  },
  {
    id: '3',
    title: 'VIP Guest Arrival',
    severity: 'medium',
    description: 'CEO of Acme Corp arriving in approximately 30 minutes via private car. Booking confirmation #ACM-9921.',
    action: "Prepare presidential suite 1201. Champagne & fruit basket on table. GM to greet at main entrance. Valet to prioritize vehicle. Do not announce guest's name over radio.",
    timestamp: minsAgo(15),
    acknowledged: false,
    createdBy: 'Concierge',
  },
  {
    id: '4',
    title: 'Elevator 3 Out of Service',
    severity: 'high',
    description: 'Elevator #3 (south tower) has been taken offline due to a mechanical fault. Engineer dispatched.',
    action: 'Place out-of-service signage on floors 1, 6, 12, 18. Redirect guests to elevators 1 & 2. Notify housekeeping to use service elevator only. ETA for repair: 2–3 hours.',
    timestamp: minsAgo(34),
    acknowledged: true,
    createdBy: 'Engineering',
  },
  {
    id: '5',
    title: 'Pool Area Maintenance',
    severity: 'low',
    description: 'Scheduled maintenance on pool filtration system. Water chemistry check in progress.',
    action: 'Close pool area from 2–4 PM. Place "Closed for Maintenance" signage at all entrances. Redirect guests to spa facilities. Complimentary spa access offered as compensation.',
    timestamp: hrsAgo(1),
    acknowledged: true,
    createdBy: 'Facilities',
  },
  {
    id: '6',
    title: 'Room Service Delay Alert',
    severity: 'low',
    description: 'Kitchen staffing shortage causing room service delays of 30–45 min above normal.',
    action: 'Inform guests proactively when they call. Offer complimentary beverage as apology. Update hold-music announcement. Target resolution by 7 PM.',
    timestamp: hrsAgo(2),
    acknowledged: false,
    createdBy: 'F&B Manager',
  },
];

// ────────────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────────────
const state = {
  alerts: INITIAL_ALERTS.map(a => ({ ...a })), // defensive copy
  role: 'admin',   // 'admin' | 'staff'
  currentScreen: 'feed',
  currentAlertId: null,
  createSeverity: 'medium',
};

// ────────────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────────────
function formatRelTime(date) {
  const diffMs = Date.now() - date.getTime();
  const mins  = Math.floor(diffMs / 60000);
  const hrs   = Math.floor(diffMs / 3600000);
  const days  = Math.floor(diffMs / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hrs < 24)   return `${hrs}h ago`;
  return `${days}d ago`;
}

function formatFullTime(date) {
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function severityLabel(s) {
  return { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[s] || s;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function unreadCount() {
  return state.alerts.filter(a => !a.acknowledged).length;
}

// ────────────────────────────────────────────────────────
// NAVIGATION
// ────────────────────────────────────────────────────────
function navigate(screen, alertId) {
  const prev = state.currentScreen;
  const prevEl = document.getElementById(`screen-${prev}`);
  const nextEl = document.getElementById(`screen-${screen}`);

  if (!nextEl || screen === prev) return;

  // Determine direction: detail is a push (right), everything else is a tab swap
  const isPush = (screen === 'detail');
  const isPop  = (prev === 'detail' && screen === 'feed');

  if (isPush) {
    prevEl.classList.add('slide-left');
    nextEl.classList.remove('hidden', 'slide-left');
  } else if (isPop) {
    prevEl.classList.add('hidden');
    prevEl.classList.remove('slide-left');
    nextEl.classList.remove('slide-left');
    nextEl.classList.remove('hidden');
  } else {
    if (prevEl) { prevEl.classList.add('hidden'); prevEl.classList.remove('slide-left'); }
    nextEl.classList.remove('hidden', 'slide-left');
  }

  state.currentScreen = screen;
  if (alertId) state.currentAlertId = alertId;

  // Update tab bar
  document.querySelectorAll('.tab-item').forEach(tab => {
    const t = tab.dataset.tab;
    const isActive = (screen === 'detail') ? t === 'feed' : t === screen;
    tab.classList.toggle('active', isActive);
  });

  // Render new screen
  if (screen === 'feed')     renderFeed();
  if (screen === 'detail')   renderDetail(alertId);
  if (screen === 'create')   renderCreate();
  if (screen === 'settings') renderSettings();
}

// ────────────────────────────────────────────────────────
// RENDER: ALERT FEED
// ────────────────────────────────────────────────────────
function renderFeed() {
  const sorted = [...state.alerts].sort((a, b) => b.timestamp - a.timestamp);

  // Header
  const uc = unreadCount();
  const subtitle = uc > 0 ? `${uc} unread alert${uc !== 1 ? 's' : ''}` : 'All alerts acknowledged';
  document.getElementById('feedSubtitle').textContent = subtitle;
  document.getElementById('feedRoleBadge').textContent = state.role === 'admin' ? '👑 Admin' : '👤 Staff';

  // Urgent strip
  const strip = document.getElementById('urgentStrip');
  if (uc > 0) {
    strip.classList.remove('hidden');
    document.getElementById('urgentText').textContent =
      `${uc} alert${uc !== 1 ? 's' : ''} require${uc === 1 ? 's' : ''} attention`;
  } else {
    strip.classList.add('hidden');
  }

  // FAB
  const fab = document.getElementById('fab');
  if (state.role === 'admin') fab.classList.remove('hidden');
  else fab.classList.add('hidden');

  // Badge
  const badge = document.getElementById('tabBadge');
  if (uc > 0) {
    badge.textContent = uc > 9 ? '9+' : uc;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  // Alert cards
  const list = document.getElementById('alertList');
  if (sorted.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:80px 20px;">
        <div style="font-size:48px;margin-bottom:12px">✅</div>
        <div style="color:#888;font-size:15px">No alerts at this time</div>
      </div>`;
    return;
  }

  list.innerHTML = sorted.map(a => `
    <div class="alert-card sev-${a.severity}" onclick="app.navigate('detail', '${escHtml(a.id)}')" role="button" tabindex="0">
      <div class="card-unread-dot ${a.acknowledged ? 'invisible' : ''}"></div>
      <div class="card-body">
        <div class="card-top">
          <div class="card-title">${escHtml(a.title)}</div>
          <div class="card-time">${formatRelTime(a.timestamp)}</div>
        </div>
        <div class="card-desc">${escHtml(a.description)}</div>
        <div class="card-footer">
          <div class="card-creator">By ${escHtml(a.createdBy)}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${a.acknowledged ? '<div class="card-ack-check"></div>' : ''}
            <span class="sev-badge sev-${a.severity}">${severityLabel(a.severity)}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Keyboard support
  list.querySelectorAll('.alert-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') card.click();
    });
  });
}

// ────────────────────────────────────────────────────────
// RENDER: ALERT DETAIL
// ────────────────────────────────────────────────────────
function renderDetail(alertId) {
  const alert = state.alerts.find(a => a.id === alertId);
  if (!alert) { navigate('feed'); return; }

  const SEVERITY_COLORS = {
    critical: '#C62828',
    high:     '#E65100',
    medium:   '#F57F17',
    low:      '#1565C0',
  };

  // Header color
  const header = document.getElementById('detailHeader');
  header.style.background = SEVERITY_COLORS[alert.severity];

  const content = document.getElementById('detailContent');
  content.innerHTML = `
    <div class="detail-title-section">
      <span class="sev-badge large sev-${alert.severity}">${severityLabel(alert.severity)}</span>
      <div class="detail-title">${escHtml(alert.title)}</div>
      <div class="detail-meta">${formatFullTime(alert.timestamp)} · Posted by ${escHtml(alert.createdBy)}</div>
    </div>

    <div class="detail-section">
      <div class="detail-section-label">📋 DESCRIPTION</div>
      <div class="detail-section-body">${escHtml(alert.description)}</div>
    </div>

    <div class="detail-section detail-action-section">
      <div class="detail-section-label detail-action-label">⚡ ACTION REQUIRED</div>
      <div class="detail-action-body">${escHtml(alert.action)}</div>
    </div>

    ${alert.acknowledged
      ? `<div class="ack-banner">
           <div class="ack-banner-icon">✅</div>
           <div class="ack-banner-text">You acknowledged this alert</div>
         </div>`
      : `<button class="ack-button" onclick="app.acknowledgeAlert('${escHtml(alert.id)}')">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
             <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
           Acknowledge Alert
         </button>`
    }

    <div style="height:40px"></div>
  `;
}

// ────────────────────────────────────────────────────────
// RENDER: CREATE ALERT
// ────────────────────────────────────────────────────────
function renderCreate() {
  const restricted = document.getElementById('createRestricted');
  const form       = document.getElementById('createForm');

  if (state.role !== 'admin') {
    restricted.classList.remove('hidden');
    form.classList.add('hidden');
  } else {
    restricted.classList.add('hidden');
    form.classList.remove('hidden');
    // Reset severity display
    applySeverityUI(state.createSeverity);
  }
}

function setSeverity(val) {
  state.createSeverity = val;
  applySeverityUI(val);
}

function applySeverityUI(val) {
  document.querySelectorAll('.sev-btn').forEach(btn => {
    btn.classList.toggle('sev-active', btn.dataset.value === val);
  });
}

function updateCharCount(inputId, countId, max) {
  const el = document.getElementById(inputId);
  const ct = document.getElementById(countId);
  if (el && ct) ct.textContent = el.value.length;
}

function submitAlert() {
  const title = document.getElementById('alertTitle')?.value?.trim();
  const desc  = document.getElementById('alertDesc')?.value?.trim();
  const action = document.getElementById('alertAction')?.value?.trim();

  if (!title)  { showToast('⚠️ Please enter an alert title');       return; }
  if (!desc)   { showToast('⚠️ Please enter a description');        return; }
  if (!action) { showToast('⚠️ Please describe the required action'); return; }

  const btn = document.getElementById('submitBtn');
  const btnText = document.getElementById('submitBtnText');
  btnText.textContent = '⏳ Sending...';
  btn.parentElement.disabled = true;

  setTimeout(() => {
    const newAlert = {
      id: Date.now().toString(),
      title,
      description: desc,
      action,
      severity: state.createSeverity,
      timestamp: new Date(),
      acknowledged: false,
      createdBy: 'You (Admin)',
    };
    state.alerts.unshift(newAlert);

    // Reset form
    document.getElementById('alertTitle').value  = '';
    document.getElementById('alertDesc').value   = '';
    document.getElementById('alertAction').value = '';
    document.getElementById('titleCount').textContent  = '0';
    document.getElementById('descCount').textContent   = '0';
    document.getElementById('actionCount').textContent = '0';
    state.createSeverity = 'medium';
    applySeverityUI('medium');

    btnText.textContent = '📢 Broadcast Alert';
    btn.parentElement.disabled = false;

    showToast('✅ Alert broadcast to all staff!');
    setTimeout(() => navigate('feed'), 600);
  }, 700);
}

// ────────────────────────────────────────────────────────
// RENDER: SETTINGS
// ────────────────────────────────────────────────────────
function renderSettings() {
  const isAdmin = state.role === 'admin';

  document.getElementById('settingsRoleIcon').textContent = isAdmin ? '👑' : '👤';
  document.getElementById('settingsRoleName').textContent = isAdmin ? 'Administrator' : 'Staff Member';
  document.getElementById('settingsRoleDesc').textContent = isAdmin
    ? 'Can create, broadcast, and view alerts'
    : 'Can view and acknowledge alerts';

  const toggle = document.getElementById('roleToggle');
  if (toggle) toggle.checked = isAdmin;

  // Stats
  document.getElementById('statTotal').textContent    = state.alerts.length;
  document.getElementById('statAcked').textContent    = state.alerts.filter(a => a.acknowledged).length;
  document.getElementById('statCritical').textContent = state.alerts.filter(a => a.severity === 'critical').length;
}

// ────────────────────────────────────────────────────────
// ACTIONS
// ────────────────────────────────────────────────────────
function acknowledgeAlert(id) {
  const alert = state.alerts.find(a => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    renderDetail(id); // re-render to show banner
    showToast('✅ Alert acknowledged');
    // update badge
    updateTabBadge();
  }
}

function toggleRole() {
  const isAdmin = document.getElementById('roleToggle')?.checked;
  state.role = isAdmin ? 'admin' : 'staff';
  renderSettings();

  // Update feed badge and FAB if we came back to it
  updateTabBadge();
  if (state.currentScreen === 'feed') renderFeed();
  if (state.currentScreen === 'create') renderCreate();

  showToast(`Switched to ${isAdmin ? '👑 Admin' : '👤 Staff'} mode`);
}

function updateTabBadge() {
  const uc = unreadCount();
  const badge = document.getElementById('tabBadge');
  if (badge) {
    if (uc > 0) {
      badge.textContent = uc > 9 ? '9+' : uc;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  // FAB visibility
  const fab = document.getElementById('fab');
  if (fab) {
    if (state.role === 'admin') fab.classList.remove('hidden');
    else fab.classList.add('hidden');
  }
}

// ────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ────────────────────────────────────────────────────────
// STATUS BAR CLOCK
// ────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('statusTime');
  if (!el) return;
  const d = new Date();
  el.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '\u202F');
}

// ────────────────────────────────────────────────────────
// PUBLIC APP API (called from HTML onclick)
// ────────────────────────────────────────────────────────
window.app = {
  navigate,
  setSeverity,
  updateCharCount,
  submitAlert,
  acknowledgeAlert,
  toggleRole,
};

// ────────────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 10000);
  renderFeed();
});
