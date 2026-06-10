/* ═══════════════════════════════════════════════════════
   JAZZ NOTE — Web App Logic  v2.0
   Pure vanilla JS · Zero dependencies
   Jazzware · Marriott International Demo
═══════════════════════════════════════════════════════ */

'use strict';

// ────────────────────────────────────────────────────────
// MOCK DATA
// ────────────────────────────────────────────────────────
const now = new Date();
const minsAgo = (m) => new Date(now.getTime() - m * 60 * 1000);
const hrsAgo  = (h) => new Date(now.getTime() - h * 60 * 60 * 1000);

const INITIAL_ALERTS = [
  {
    id: '1',
    title: 'Fire Alarm — Floor 12',
    severity: 'critical',
    description: 'Fire alarm activated on floor 12, east wing. Smoke detected near room 1218. Local fire department has been notified and is en route.',
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
  alerts: INITIAL_ALERTS.map(a => ({ ...a })),
  role: 'admin',
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
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
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

function severityIcon(s) {
  return { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' }[s] || '⚪';
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

  const isPush = (screen === 'detail');
  const isPop  = (prev === 'detail' && screen === 'feed');

  if (isPush) {
    prevEl.classList.add('slide-left');
    nextEl.classList.remove('hidden', 'slide-left');
    nextEl.style.animation = 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
  } else if (isPop) {
    prevEl.classList.add('hidden');
    prevEl.classList.remove('slide-left');
    nextEl.classList.remove('slide-left', 'hidden');
    nextEl.style.animation = '';
  } else {
    if (prevEl) { prevEl.classList.add('hidden'); prevEl.classList.remove('slide-left'); }
    nextEl.classList.remove('hidden', 'slide-left');
    nextEl.style.animation = 'fadeInUp 0.25s ease forwards';
  }

  state.currentScreen = screen;
  if (alertId) state.currentAlertId = alertId;

  document.querySelectorAll('.tab-item').forEach(tab => {
    const t = tab.dataset.tab;
    const isActive = (screen === 'detail') ? t === 'feed' : t === screen;
    tab.classList.toggle('active', isActive);
  });

  if (screen === 'feed')     renderFeed();
  if (screen === 'detail')   renderDetail(alertId);
  if (screen === 'create')   renderCreate();
  if (screen === 'settings') renderSettings();
}

// ────────────────────────────────────────────────────────
// RENDER: ALERT FEED
// ────────────────────────────────────────────────────────
function renderFeed() {
  const sorted = [...state.alerts].sort((a, b) => {
    // Sort: unacknowledged first, then by severity weight, then by recency
    const sevWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    if (!a.acknowledged && b.acknowledged) return -1;
    if (a.acknowledged && !b.acknowledged) return 1;
    if (!a.acknowledged && !b.acknowledged) {
      const sw = (sevWeight[b.severity] || 0) - (sevWeight[a.severity] || 0);
      if (sw !== 0) return sw;
    }
    return b.timestamp - a.timestamp;
  });

  const uc = unreadCount();
  const subtitle = uc > 0 ? `${uc} unread alert${uc !== 1 ? 's' : ''}` : 'All alerts acknowledged';
  document.getElementById('feedSubtitle').textContent = subtitle;
  document.getElementById('feedRoleBadge').textContent = state.role === 'admin' ? '👑 Admin' : '👤 Staff';

  const strip = document.getElementById('urgentStrip');
  const critCount = state.alerts.filter(a => !a.acknowledged && a.severity === 'critical').length;
  if (uc > 0) {
    strip.classList.remove('hidden');
    if (critCount > 0) {
      strip.className = 'urgent-strip urgent-critical';
      document.getElementById('urgentText').textContent = `${critCount} critical alert${critCount !== 1 ? 's' : ''} require immediate attention`;
    } else {
      strip.className = 'urgent-strip';
      document.getElementById('urgentText').textContent = `${uc} alert${uc !== 1 ? 's' : ''} require${uc === 1 ? 's' : ''} attention`;
    }
  } else {
    strip.className = 'urgent-strip hidden';
  }

  const fab = document.getElementById('fab');
  if (state.role === 'admin') fab.classList.remove('hidden');
  else fab.classList.add('hidden');

  const badge = document.getElementById('tabBadge');
  if (uc > 0) {
    badge.textContent = uc > 9 ? '9+' : uc;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  const list = document.getElementById('alertList');
  if (sorted.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="#4ade80" stroke-width="2" fill="#f0fdf4"/>
            <path d="M14 24l7 7 13-13" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="empty-title">All Clear</div>
        <div class="empty-sub">No active alerts at this property.</div>
      </div>`;
    return;
  }

  list.innerHTML = sorted.map((a, i) => `
    <div class="alert-card sev-${a.severity} ${a.acknowledged ? 'is-acked' : ''}"
         onclick="app.navigate('detail', '${escHtml(a.id)}')"
         role="button" tabindex="0"
         style="animation-delay:${i * 40}ms">
      <div class="card-left-stripe sev-stripe-${a.severity}"></div>
      <div class="card-body">
        <div class="card-top">
          <div class="card-title-row">
            ${!a.acknowledged ? '<div class="card-unread-dot"></div>' : ''}
            <div class="card-title">${escHtml(a.title)}</div>
          </div>
          <div class="card-time">${formatRelTime(a.timestamp)}</div>
        </div>
        <div class="card-desc">${escHtml(a.description)}</div>
        <div class="card-footer">
          <div class="card-creator">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
            </svg>
            ${escHtml(a.createdBy)}
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            ${a.acknowledged ? '<div class="card-ack-check"></div>' : ''}
            <span class="sev-badge sev-${a.severity}">${severityLabel(a.severity)}</span>
          </div>
        </div>
      </div>
      <div class="card-chevron">
        <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
          <path d="M1 1l4 4.5-4 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  `).join('');

  // Animate in
  list.querySelectorAll('.alert-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(8px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 40);
  });

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
    critical: { bg: '#83002E', light: '#FEF2F5', border: '#FECDD9', text: '#83002E', badge: '#83002E' },
    high:     { bg: '#C2440A', light: '#FFF4EF', border: '#FED7BC', text: '#C2440A', badge: '#C2440A' },
    medium:   { bg: '#A16207', light: '#FFFBEB', border: '#FDE68A', text: '#A16207', badge: '#A16207' },
    low:      { bg: '#1D4ED8', light: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', badge: '#1D4ED8' },
  };
  const sc = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.low;

  const header = document.getElementById('detailHeader');
  header.style.background = sc.bg;

  const content = document.getElementById('detailContent');
  content.innerHTML = `
    <div class="detail-title-section">
      <div class="detail-title-card-header" style="background:${sc.light};border-color:${sc.border}">
        <span class="sev-badge large sev-${alert.severity}">${severityIcon(alert.severity)} ${severityLabel(alert.severity)}</span>
        <span class="detail-timestamp">${formatFullTime(alert.timestamp)}</span>
      </div>
      <div class="detail-title">${escHtml(alert.title)}</div>
      <div class="detail-meta">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
        </svg>
        Posted by ${escHtml(alert.createdBy)}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Description
      </div>
      <div class="detail-section-body">${escHtml(alert.description)}</div>
    </div>

    <div class="detail-section detail-action-section" style="border-color:${sc.border};background:${sc.light}">
      <div class="detail-section-label" style="color:${sc.text}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Action Required
      </div>
      <div class="detail-action-body" style="color:${sc.text}">${escHtml(alert.action)}</div>
    </div>

    ${alert.acknowledged
      ? `<div class="ack-banner">
           <div class="ack-banner-icon">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
               <circle cx="12" cy="12" r="10" fill="#22c55e"/>
               <path d="M8 12l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>
           </div>
           <div>
             <div class="ack-banner-text">Alert Acknowledged</div>
             <div class="ack-banner-sub">You've confirmed receipt of this alert</div>
           </div>
         </div>`
      : `<button class="ack-button" id="ackBtn" onclick="app.acknowledgeAlert('${escHtml(alert.id)}')">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
             <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
           Acknowledge Alert
         </button>`
    }

    <div class="detail-marriott-stamp">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path d="M2 16L10 4l8 12H2z" fill="#83002E" opacity="0.3"/>
        <path d="M6 16l4-7 4 7" stroke="#83002E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Marriott Downtown Convention Center
    </div>

    <div style="height:32px"></div>
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
  if (!el || !ct) return;
  const len = el.value.length;
  ct.textContent = len;
  const wrap = ct.closest('.char-count');
  if (wrap) {
    wrap.classList.toggle('char-warn', len > max * 0.85);
    wrap.classList.toggle('char-danger', len >= max);
  }
}

function submitAlert() {
  const title  = document.getElementById('alertTitle')?.value?.trim();
  const desc   = document.getElementById('alertDesc')?.value?.trim();
  const action = document.getElementById('alertAction')?.value?.trim();

  if (!title)  { showToast('⚠️ Please enter an alert title');        return; }
  if (!desc)   { showToast('⚠️ Please enter a description');         return; }
  if (!action) { showToast('⚠️ Please describe the required action'); return; }

  const btn = document.getElementById('submitBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('btn-loading');
  document.getElementById('submitBtnText').textContent = 'Broadcasting…';

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

    ['alertTitle', 'alertDesc', 'alertAction'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    ['titleCount', 'descCount', 'actionCount'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '0';
    });
    state.createSeverity = 'medium';
    applySeverityUI('medium');

    btn.disabled = false;
    btn.classList.remove('btn-loading');
    document.getElementById('submitBtnText').textContent = '📢 Broadcast Alert';

    // success feedback
    btn.classList.add('btn-success');
    document.getElementById('submitBtnText').textContent = '✓ Alert Broadcast!';
    setTimeout(() => {
      btn.classList.remove('btn-success');
      document.getElementById('submitBtnText').textContent = '📢 Broadcast Alert';
    }, 2000);

    showToast('✅ Alert broadcast to all staff!');
    setTimeout(() => navigate('feed'), 900);
  }, 800);
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
    : 'Can view and acknowledge alerts only';

  const toggle = document.getElementById('roleToggle');
  if (toggle) toggle.checked = isAdmin;

  document.getElementById('statTotal').textContent    = state.alerts.length;
  document.getElementById('statAcked').textContent    = state.alerts.filter(a => a.acknowledged).length;
  document.getElementById('statCritical').textContent = state.alerts.filter(a => a.severity === 'critical').length;
}

function resetDemoData() {
  const btn = document.getElementById('resetBtn');
  if (btn) {
    btn.textContent = 'Resetting…';
    btn.disabled = true;
  }
  setTimeout(() => {
    state.alerts = INITIAL_ALERTS.map(a => ({ ...a }));
    state.role = 'admin';
    state.currentAlertId = null;
    state.createSeverity = 'medium';

    renderSettings();
    updateTabBadge();
    if (btn) {
      btn.textContent = '✓ Reset Complete';
      setTimeout(() => {
        btn.textContent = '↺ Reset Demo Data';
        btn.disabled = false;
      }, 1500);
    }
    showToast('🔄 Demo data reset to initial state');
  }, 500);
}

// ────────────────────────────────────────────────────────
// ACTIONS
// ────────────────────────────────────────────────────────
function acknowledgeAlert(id) {
  const alert = state.alerts.find(a => a.id === id);
  if (!alert) return;

  const btn = document.getElementById('ackBtn');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.querySelector('span') && (btn.querySelector('span').textContent = '');
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;animation:spin 0.6s linear infinite">
        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <path d="M12 3a9 9 0 0 1 9 9" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Acknowledging…`;
  }

  setTimeout(() => {
    alert.acknowledged = true;
    renderDetail(id);
    updateTabBadge();
    showToast('✅ Alert acknowledged');
  }, 600);
}

function toggleRole() {
  const isAdmin = document.getElementById('roleToggle')?.checked;
  state.role = isAdmin ? 'admin' : 'staff';
  renderSettings();
  updateTabBadge();
  if (state.currentScreen === 'feed')   renderFeed();
  if (state.currentScreen === 'create') renderCreate();
  showToast(`Switched to ${isAdmin ? '👑 Admin' : '👤 Staff'} mode`);
}

function updateTabBadge() {
  const uc = unreadCount();
  const badge = document.getElementById('tabBadge');
  if (badge) {
    if (uc > 0) { badge.textContent = uc > 9 ? '9+' : uc; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  }
  const fab = document.getElementById('fab');
  if (fab) {
    if (state.role === 'admin') fab.classList.remove('hidden');
    else fab.classList.add('hidden');
  }
  // update create tab visibility
  const createTab = document.getElementById('createTab');
  if (createTab) {
    createTab.style.opacity = state.role === 'admin' ? '1' : '0.45';
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
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
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
// PUBLIC APP API
// ────────────────────────────────────────────────────────
window.app = {
  navigate,
  setSeverity,
  updateCharCount,
  submitAlert,
  acknowledgeAlert,
  toggleRole,
  resetDemoData,
};

// ────────────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 10000);
  renderFeed();
});
