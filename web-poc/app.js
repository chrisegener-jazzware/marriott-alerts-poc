/* ═══════════════════════════════════════════════════════
   JAZZ NOTE — Web App Logic  v3.0
   Pure vanilla JS · Zero dependencies
   Severity-based escalation + distribution groups
   Jazzware · Hotel Brand Demo
═══════════════════════════════════════════════════════ */

'use strict';

// ────────────────────────────────────────────────────────
// DISTRIBUTION GROUPS
// ────────────────────────────────────────────────────────
const GROUPS = {
  housekeeping: {
    id: 'housekeeping',
    name: 'Housekeeping',
    members: [
      { id: 'm1', name: 'Maria Santos',  channels: ['sms','push'] },
      { id: 'm2', name: 'David Chen',    channels: ['sms','push'] },
      { id: 'm3', name: 'Ana Reyes',     channels: ['push'] },
    ],
  },
  engineering: {
    id: 'engineering',
    name: 'Engineering On-Call',
    members: [
      { id: 'm4', name: 'James Wilson',  channels: ['sms','whatsapp','voice','email','push'] },
      { id: 'm5', name: 'Robert Kim',    channels: ['sms','voice','push'] },
    ],
  },
  frontdesk: {
    id: 'frontdesk',
    name: 'Front Desk',
    members: [
      { id: 'm6', name: 'Sarah Johnson', channels: ['sms','email','push'] },
      { id: 'm7', name: 'Michael Brown', channels: ['sms','push'] },
    ],
  },
  security: {
    id: 'security',
    name: 'Security',
    members: [
      { id: 'm8', name: 'Officer Thompson', channels: ['sms','whatsapp','voice','email','push'] },
      { id: 'm9', name: 'Officer Davis',    channels: ['sms','voice','push'] },
    ],
  },
  gm: {
    id: 'gm',
    name: 'GM/Exec',
    members: [
      { id: 'm10', name: 'Patricia Williams GM', channels: ['sms','whatsapp','voice','email','push'] },
      { id: 'm11', name: 'Thomas Clancy CEO',    channels: ['sms','whatsapp','voice','email','push'] },
    ],
  },
};

const ALL_CHANNELS = ['sms','whatsapp','voice','email','push'];

// ────────────────────────────────────────────────────────
// ROUTING RULES
// ────────────────────────────────────────────────────────
const ROUTING_RULES = [
  {
    id: 'r1',
    alertType: 'Emergency/911 Call',
    severity: 'p1',
    groups: ['gm','security'],
    channels: ALL_CHANNELS,
    escalationGroup: 'frontdesk',
    escalationMinutes: 2,
  },
  {
    id: 'r2',
    alertType: 'Fire Alarm',
    severity: 'p1',
    groups: ['security','gm'],
    channels: ALL_CHANNELS,
    escalationGroup: 'engineering',
    escalationMinutes: 3,
  },
  {
    id: 'r3',
    alertType: 'Medical Emergency',
    severity: 'p1',
    groups: ['security','frontdesk'],
    channels: ['sms','voice','push'],
    escalationGroup: 'gm',
    escalationMinutes: 5,
  },
  {
    id: 'r4',
    alertType: 'Maintenance Issue',
    severity: 'p2',
    groups: ['engineering'],
    channels: ['sms','email','push'],
    escalationGroup: 'gm',
    escalationMinutes: 15,
  },
  {
    id: 'r5',
    alertType: 'Housekeeping Issue',
    severity: 'p3',
    groups: ['housekeeping'],
    channels: ['email','push'],
    escalationGroup: 'frontdesk',
    escalationMinutes: 30,
  },
  {
    id: 'r6',
    alertType: 'Guest Complaint',
    severity: 'p3',
    groups: ['frontdesk'],
    channels: ['email','push'],
    escalationGroup: 'gm',
    escalationMinutes: 30,
  },
  {
    id: 'r7',
    alertType: 'VIP Arrival',
    severity: 'p3',
    groups: ['frontdesk'],
    channels: ['push'],
    escalationGroup: null,
    escalationMinutes: null,
  },
  {
    id: 'r8',
    alertType: 'General Info',
    severity: 'p4',
    groups: ['frontdesk'],
    channels: ['push'],
    escalationGroup: null,
    escalationMinutes: null,
  },
];

// ────────────────────────────────────────────────────────
// SEVERITY CONFIG
// ────────────────────────────────────────────────────────
const SEV_CONFIG = {
  p1: { label: 'P1 Critical', color: '#83002E', bg: '#FEF2F5', border: '#FECDD9', cssClass: 'sev-p1', icon: '🔴' },
  p2: { label: 'P2 High',     color: '#C2440A', bg: '#FFF4EF', border: '#FED7BC', cssClass: 'sev-p2', icon: '🟠' },
  p3: { label: 'P3 Normal',   color: '#A16207', bg: '#FFFBEB', border: '#FDE68A', cssClass: 'sev-p3', icon: '🟡' },
  p4: { label: 'P4 Info',     color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', cssClass: 'sev-p4', icon: '🔵' },
};

// ────────────────────────────────────────────────────────
// CHANNEL CONFIG
// ────────────────────────────────────────────────────────
const CH_CONFIG = {
  sms:      { label: 'SMS',      icon: '📱' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
  voice:    { label: 'Voice',    icon: '📞' },
  email:    { label: 'Email',    icon: '✉️' },
  push:     { label: 'Push',     icon: '🔔' },
};

// ────────────────────────────────────────────────────────
// DELIVERY STATUS HELPERS
// ────────────────────────────────────────────────────────
// status: 'sending' | 'delivered' | 'failed' | 'escalated'
function makeDelivery(memberId, memberName, groupId, channel, isEscalated) {
  return {
    memberId, memberName, groupId, channel,
    status: isEscalated ? 'escalated' : 'sending',
    isEscalated: !!isEscalated,
    timestamp: null,
  };
}

function buildDeliveries(rule, escalated) {
  const deliveries = [];
  const targetGroups = escalated
    ? [...rule.groups, rule.escalationGroup].filter(Boolean)
    : rule.groups;

  for (const gid of targetGroups) {
    const group = GROUPS[gid];
    if (!group) continue;
    for (const member of group.members) {
      const memberChannels = member.channels.filter(c => rule.channels.includes(c));
      for (const ch of memberChannels) {
        const isEsc = escalated && !rule.groups.includes(gid);
        deliveries.push(makeDelivery(member.id, member.name, gid, ch, isEsc));
      }
    }
  }
  return deliveries;
}

// ────────────────────────────────────────────────────────
// SEED DEMO ALERTS
// ────────────────────────────────────────────────────────
const now = new Date();
const minsAgo = (m) => new Date(now.getTime() - m * 60 * 1000);

function createSeedAlerts() {
  // Alert 1: Water Leak — P3 Housekeeping Issue
  const rule5 = ROUTING_RULES.find(r => r.id === 'r5');
  const wlDeliveries = buildDeliveries(rule5, false);
  // Simulate delivery: all delivered (no failures for housekeeping demo)
  wlDeliveries.forEach(d => {
    d.status = 'delivered';
    d.timestamp = minsAgo(Math.floor(Math.random() * 3 + 1));
  });

  const waterLeak = {
    id: 'seed-1',
    title: 'Water Leak — Room 412',
    description: 'Guest reported water dripping from ceiling in room 412. Possible pipe leak from floor above.',
    action: 'Dispatch maintenance to room 412. Move guest to alternate room. Place water absorber mats. Contact engineering if structural issue suspected.',
    ruleId: 'r5',
    severity: 'p3',
    timestamp: minsAgo(22),
    createdBy: 'Front Desk',
    deliveries: wlDeliveries,
    acknowledgements: [],
    escalated: false,
    escalationFired: false,
  };

  // Alert 2: 911 Emergency — P1, already escalated (simulating 2-min timer fired)
  const rule1 = ROUTING_RULES.find(r => r.id === 'r1');
  const emDeliveries = buildDeliveries(rule1, true); // pass true = include escalation group
  // Simulate: most delivered, one failed
  emDeliveries.forEach((d, i) => {
    if (d.isEscalated) {
      d.status = 'escalated'; // blue escalated icon
    } else if (i === 3) {
      d.status = 'failed'; // one failure for drama
    } else {
      d.status = 'delivered';
      d.timestamp = minsAgo(Math.floor(Math.random() * 2 + 0.5));
    }
  });
  // One of the sending ones still in flight
  const sendingIdx = emDeliveries.findIndex(d => d.status === 'delivered' && !d.isEscalated);
  if (sendingIdx !== -1) emDeliveries[sendingIdx].status = 'sending';

  const emergency911 = {
    id: 'seed-2',
    title: '911 Emergency Call — Lobby',
    description: 'Lobby security triggered 911 after guest collapsed near main entrance. EMS dispatched.',
    action: 'Clear 20-ft radius around guest. Do NOT move guest. GM to lobby immediately. Hold elevator 1 for EMS. Direct EMS to main entrance on arrival.',
    ruleId: 'r1',
    severity: 'p1',
    timestamp: minsAgo(4),
    createdBy: 'Security Desk',
    deliveries: emDeliveries,
    acknowledgements: [
      { name: 'Officer Thompson', timestamp: minsAgo(3) },
    ],
    escalated: true,
    escalationFired: true,
  };

  return [emergency911, waterLeak];
}

// ────────────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────
// BRAND PRESETS
// ────────────────────────────────────────────────────────
const BRANDS = {
  marriott: {
    name: 'Marriott International',
    short: 'Marriott',
    property: 'Marriott Downtown Convention Center',
    code: 'MDCC-001',
    accent: '#83002E',
    accentDark: '#5C001F',
    accentLight: '#FEF2F5',
    accentBorder: '#FECDD9',
    logo: 'M',
  },
  hilton: {
    name: 'Hilton Hotels',
    short: 'Hilton',
    property: 'Hilton Garden Inn Midtown',
    code: 'HGIM-042',
    accent: '#104C97',
    accentDark: '#0A3567',
    accentLight: '#EBF3FF',
    accentBorder: '#B3D1F5',
    logo: 'H',
  },
  ihg: {
    name: 'IHG Hotels & Resorts',
    short: 'IHG',
    property: 'Holiday Inn Express Airport',
    code: 'HIEA-118',
    accent: '#1B6B3E',
    accentDark: '#0F4527',
    accentLight: '#EEFAF2',
    accentBorder: '#B3E5C8',
    logo: 'I',
  },
  hyatt: {
    name: 'Hyatt Hotels',
    short: 'Hyatt',
    property: 'Hyatt Regency Waterfront',
    code: 'HRWF-007',
    accent: '#94450B',
    accentDark: '#6B3108',
    accentLight: '#FFF6ED',
    accentBorder: '#F5D5B5',
    logo: 'Hy',
  },
  wyndham: {
    name: 'Wyndham Hotels',
    short: 'Wyndham',
    property: 'Wyndham Grand Resort & Spa',
    code: 'WGRS-055',
    accent: '#00529B',
    accentDark: '#003B70',
    accentLight: '#EDF5FF',
    accentBorder: '#A8D0F5',
    logo: 'W',
  },
  accor: {
    name: 'Accor',
    short: 'Accor',
    property: 'Novotel City Centre',
    code: 'NVCC-203',
    accent: '#1C1C50',
    accentDark: '#0E0E30',
    accentLight: '#F0F0F8',
    accentBorder: '#BCBCE0',
    logo: 'A',
  },
};

const state = {
  alerts: createSeedAlerts(),
  role: 'admin',
  currentScreen: 'feed',
  currentAlertId: null,
  selectedRuleId: null,
  expandedGroups: new Set(),
  brand: 'marriott',
};

// ────────────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────────────
function formatRelTime(date) {
  const diffMs = Date.now() - date.getTime();
  const mins   = Math.floor(diffMs / 60000);
  const hrs    = Math.floor(diffMs / 3600000);
  const days   = Math.floor(diffMs / 86400000);
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

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function unreadCount() {
  return state.alerts.filter(a => a.acknowledgements.length === 0).length;
}

function sevCfg(sev) {
  return SEV_CONFIG[sev] || SEV_CONFIG.p4;
}

function sevBadge(sev, large) {
  const cfg = sevCfg(sev);
  return `<span class="sev-badge ${large ? 'large ' : ''}${cfg.cssClass}">${cfg.icon} ${cfg.label}</span>`;
}

function getRule(ruleId) {
  return ROUTING_RULES.find(r => r.id === ruleId);
}

function deliverySummary(alert) {
  const total     = alert.deliveries.length;
  const delivered = alert.deliveries.filter(d => d.status === 'delivered' || d.status === 'escalated').length;
  const failed    = alert.deliveries.filter(d => d.status === 'failed').length;
  return { total, delivered, failed };
}

// Group deliveries by group for matrix rendering
function deliveryMatrix(alert) {
  const rule = getRule(alert.ruleId);
  if (!rule) return [];

  // Collect all groups present in deliveries
  const groupIds = [...new Set(alert.deliveries.map(d => d.groupId))];

  return groupIds.map(gid => {
    const group = GROUPS[gid];
    const members = group ? group.members : [];
    const usedChannels = ALL_CHANNELS.filter(ch => rule.channels.includes(ch));

    return {
      groupId: gid,
      groupName: group ? group.name : gid,
      isEscalated: !rule.groups.includes(gid),
      members: members.map(member => {
        const cells = usedChannels.map(ch => {
          // does this member have this channel?
          if (!member.channels.includes(ch)) {
            return { ch, status: 'na' };
          }
          const d = alert.deliveries.find(
            x => x.memberId === member.id && x.channel === ch
          );
          return { ch, status: d ? d.status : 'na' };
        });
        return { member, cells, channels: usedChannels };
      }),
      channels: usedChannels,
    };
  });
}

// ────────────────────────────────────────────────────────
// NAVIGATION
// ────────────────────────────────────────────────────────
function navigate(screen, alertId) {
  const prev   = state.currentScreen;
  const prevEl = document.getElementById(`screen-${prev}`);
  const nextEl = document.getElementById(`screen-${screen}`);

  if (!nextEl || screen === prev) return;

  const isPush = (screen === 'detail');
  const isPop  = (prev === 'detail');

  // Always hide ALL screens first to prevent stacking
  document.querySelectorAll('.screen').forEach(s => {
    if (s !== nextEl) {
      s.classList.add('hidden');
      s.classList.remove('slide-left');
      s.style.animation = '';
    }
  });

  if (isPush) {
    nextEl.classList.remove('hidden', 'slide-left');
    nextEl.style.animation = 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
  } else if (isPop) {
    nextEl.classList.remove('slide-left', 'hidden');
    nextEl.style.animation = '';
  } else {
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

  if (screen === 'feed')    renderFeed();
  if (screen === 'detail')  renderDetail(alertId);
  if (screen === 'create')  renderCreate();
  if (screen === 'routing') renderRouting();
  if (screen === 'groups')  renderGroups();
  if (screen === 'demo')    renderDemo();
}

// ────────────────────────────────────────────────────────
// RENDER: ALERT FEED
// ────────────────────────────────────────────────────────
function renderFeed() {
  const sorted = [...state.alerts].sort((a, b) => {
    const sevWeight = { p1: 4, p2: 3, p3: 2, p4: 1 };
    const aUnacked = a.acknowledgements.length === 0;
    const bUnacked = b.acknowledgements.length === 0;
    if (aUnacked && !bUnacked) return -1;
    if (!aUnacked && bUnacked) return 1;
    const sw = (sevWeight[b.severity] || 0) - (sevWeight[a.severity] || 0);
    if (sw !== 0) return sw;
    return b.timestamp - a.timestamp;
  });

  const uc = unreadCount();
  const subtitle = uc > 0 ? `${uc} active alert${uc !== 1 ? 's' : ''}` : 'All alerts acknowledged';
  document.getElementById('feedSubtitle').textContent = subtitle;
  document.getElementById('feedRoleBadge').textContent = state.role === 'admin' ? '👑 Admin' : '👤 Staff';

  const strip = document.getElementById('urgentStrip');
  const p1Count = state.alerts.filter(a => a.acknowledgements.length === 0 && a.severity === 'p1').length;
  if (uc > 0) {
    strip.classList.remove('hidden');
    if (p1Count > 0) {
      strip.className = 'urgent-strip urgent-critical';
      document.getElementById('urgentText').textContent =
        `${p1Count} P1 critical alert${p1Count !== 1 ? 's' : ''} require immediate attention`;
    } else {
      strip.className = 'urgent-strip';
      document.getElementById('urgentText').textContent =
        `${uc} alert${uc !== 1 ? 's' : ''} require${uc === 1 ? 's' : ''} attention`;
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

  list.innerHTML = sorted.map((alert, i) => {
    const rule  = getRule(alert.ruleId);
    const cfg   = sevCfg(alert.severity);
    const acked = alert.acknowledgements.length > 0;
    const { total, delivered, failed } = deliverySummary(alert);
    const groupNames = rule ? rule.groups.map(gid => GROUPS[gid]?.name || gid) : [];

    let dpClass = 'delivery-pill';
    if (failed > 0) dpClass += ' dp-fail';
    else if (delivered < total) dpClass += ' dp-partial';

    const escBadge = alert.escalated
      ? `<span style="font-size:9.5px;font-weight:700;color:var(--jazz-blue);background:var(--jazz-blue-lt);border:1px solid rgba(0,102,204,.2);border-radius:6px;padding:1px 6px;margin-left:4px;">ESCALATED</span>`
      : '';

    return `
      <div class="alert-card ${acked ? 'is-acked' : ''}"
           onclick="app.navigate('detail', '${escHtml(alert.id)}')"
           role="button" tabindex="0">
        <div class="card-left-stripe sev-stripe-${alert.severity}"></div>
        <div class="card-body">
          <div class="card-top">
            <div class="card-title-row">
              ${!acked ? '<div class="card-unread-dot"></div>' : ''}
              <div class="card-title">${escHtml(alert.title)}</div>
            </div>
            <div class="card-time">${formatRelTime(alert.timestamp)}</div>
          </div>
          <div class="group-chips">
            ${groupNames.map(n => `<span class="group-chip">${escHtml(n)}</span>`).join('')}
            ${alert.escalated ? `<span class="group-chip" style="color:var(--jazz-blue);border-color:rgba(0,102,204,.2);background:var(--jazz-blue-lt);">+ ${GROUPS[rule?.escalationGroup]?.name || 'Escalation'}</span>` : ''}
          </div>
          <div class="card-footer">
            <div style="display:flex;align-items:center;gap:5px;">
              ${sevBadge(alert.severity)}
              ${escBadge}
            </div>
            <div style="display:flex;align-items:center;gap:5px;">
              <span class="${dpClass}">📬 ${delivered}/${total}</span>
              ${acked ? '<div class="card-ack-check"></div>' : ''}
            </div>
          </div>
        </div>
        <div class="card-chevron">
          <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
            <path d="M1 1l4 4.5-4 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>`;
  }).join('');

  // Staggered animation
  list.querySelectorAll('.alert-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(8px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      card.style.opacity = card.classList.contains('is-acked') ? '0.7' : '1';
      card.style.transform = 'translateY(0)';
    }, i * 50);
  });

  list.querySelectorAll('.alert-card').forEach(card => {
    card.addEventListener('keydown', e => {
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

  const rule = getRule(alert.ruleId);
  const cfg  = sevCfg(alert.severity);
  const acked = alert.acknowledgements.length > 0;

  const header = document.getElementById('detailHeader');
  header.style.background = cfg.color;

  // Build delivery matrix sections
  const matrix = deliveryMatrix(alert);
  const usedChannels = rule ? ALL_CHANNELS.filter(c => rule.channels.includes(c)) : [];

  const channelHeaderCells = usedChannels.map(ch =>
    `<div class="dm-ch-head"><span class="ch-icon">${CH_CONFIG[ch].icon}</span>${CH_CONFIG[ch].label}</div>`
  ).join('');

  const matrixRows = matrix.map(group => {
    const groupHeader = `<div class="dm-group-header">${escHtml(group.groupName)}${group.isEscalated ? ' <span style="color:var(--jazz-blue);font-size:8.5px;">ESCALATED</span>' : ''}</div>`;
    const memberRows = group.members.map(({ member, cells }) => {
      const cellsHtml = cells.map(({ ch, status }) => {
        let icon, title;
        switch (status) {
          case 'delivered':  icon = '✓';  title = 'Delivered'; break;
          case 'sending':    icon = '⏳'; title = 'Sending';   break;
          case 'failed':     icon = '✕';  title = 'Failed';    break;
          case 'escalated':  icon = '↑';  title = 'Escalated'; break;
          default:           icon = '—';  title = 'N/A';       break;
        }
        return `<div class="dm-cell"><span class="dm-cell-icon status-${status}" title="${title}">${icon}</span></div>`;
      }).join('');
      return `<div class="dm-row"><div class="dm-name">${escHtml(member.name)}</div><div class="dm-cells">${cellsHtml}</div></div>`;
    }).join('');
    return groupHeader + memberRows;
  }).join('');

  // Escalation chain
  let escalationHtml = '';
  if (rule) {
    const chainGroups = rule.groups.map(gid => GROUPS[gid]?.name || gid);
    const escGroup = rule.escalationGroup ? (GROUPS[rule.escalationGroup]?.name || rule.escalationGroup) : null;

    let chainHtml = chainGroups.map(name =>
      `<div class="esc-node">
        <div class="esc-node-pill esc-active">${escHtml(name)}</div>
        <div class="esc-timer">Initial</div>
      </div>`
    ).join(`<div class="esc-arrow">→</div>`);

    if (escGroup) {
      const timerLabel = alert.escalated ? 'Escalated!' : `+${rule.escalationMinutes}min`;
      const pillClass = alert.escalated ? 'esc-escalated' : 'esc-pending';
      chainHtml += `
        <div class="esc-arrow">→</div>
        <div class="esc-node">
          <div class="esc-node-pill ${pillClass}">${escHtml(escGroup)}</div>
          <div class="esc-timer">${timerLabel}</div>
        </div>`;
    }

    escalationHtml = `
      <div class="detail-section">
        <div class="detail-section-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Escalation Chain
        </div>
        <div class="escalation-chain">${chainHtml}</div>
        ${alert.escalated ? `<div style="font-size:11px;color:var(--jazz-blue);font-weight:600;margin-top:4px;">⚡ Escalation already triggered — ${GROUPS[rule.escalationGroup]?.name || rule.escalationGroup} notified</div>` : ''}
      </div>`;
  }

  // Acknowledgement section
  const ackListHtml = alert.acknowledgements.length > 0
    ? alert.acknowledgements.map(ack => `
        <div class="ack-item">
          <div class="ack-item-icon">✅</div>
          <div>
            <div class="ack-item-name">${escHtml(ack.name)}</div>
            <div class="ack-item-time">${formatFullTime(ack.timestamp)}</div>
          </div>
        </div>`).join('')
    : `<div class="no-acks">No acknowledgements yet</div>`;

  const ackOrButton = acked
    ? `<div class="ack-banner">
         <div style="font-size:22px;">✅</div>
         <div>
           <div class="ack-banner-text">Alert Acknowledged</div>
           <div class="ack-banner-sub">Acknowledged by ${alert.acknowledgements.map(a => a.name).join(', ')}</div>
         </div>
       </div>`
    : `<button class="ack-button" id="ackBtn" onclick="app.acknowledgeAlert('${escHtml(alert.id)}')">
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
           <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
         Acknowledge Alert
       </button>`;

  const content = document.getElementById('detailContent');
  content.innerHTML = `
    <!-- Title card -->
    <div class="detail-title-section">
      <div class="detail-title-card-header" style="background:${cfg.bg};border-color:${cfg.border}">
        ${sevBadge(alert.severity, true)}
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

    <!-- Routing info -->
    ${rule ? `<div class="detail-section" style="border-color:${cfg.border};background:${cfg.bg}">
      <div class="detail-section-label" style="color:${cfg.color}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M3 12h12M3 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M19 15l2 2-2 2M17 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Routing Info
      </div>
      <div style="font-size:12.5px;color:${cfg.color};font-weight:600;line-height:1.6">
        Rule: <strong>${escHtml(rule.alertType)}</strong><br>
        Channels: ${rule.channels.map(c => CH_CONFIG[c].icon + ' ' + CH_CONFIG[c].label).join(' · ')}
      </div>
    </div>` : ''}

    <!-- Description -->
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

    <!-- Action required -->
    <div class="detail-section detail-action-section" style="border-color:${cfg.border};background:${cfg.bg}">
      <div class="detail-section-label" style="color:${cfg.color}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Action Required
      </div>
      <div class="detail-action-body" style="color:${cfg.color}">${escHtml(alert.action)}</div>
    </div>

    <!-- Delivery Matrix -->
    <div class="delivery-matrix">
      <div class="dm-header">
        <div class="dm-header-label">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.28 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16z" stroke="currentColor" stroke-width="2"/>
          </svg>
          Delivery Matrix
        </div>
        <div class="dm-channel-row">
          <div style="flex:1;font-size:9px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.3px;">Recipient</div>
          ${usedChannels.map(ch => `<div class="dm-ch-head"><span class="ch-icon">${CH_CONFIG[ch].icon}</span>${CH_CONFIG[ch].label.substring(0,3)}</div>`).join('')}
        </div>
      </div>
      ${matrixRows}
    </div>

    <!-- Acknowledgements -->
    <div class="detail-section">
      <div class="detail-section-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Acknowledgements (${alert.acknowledgements.length})
      </div>
      <div class="ack-list">${ackListHtml}</div>
    </div>

    <!-- Escalation chain -->
    ${escalationHtml}

    <!-- Ack button / banner -->
    ${ackOrButton}

    <div class="detail-marriott-stamp">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path d="M2 16L10 4l8 12H2z" fill="#83002E" opacity="0.3"/>
        <path d="M6 16l4-7 4 7" stroke="#83002E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span id="detailPropertyStamp">${escHtml(BRANDS[state.brand].property)}</span>
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
    return;
  }
  restricted.classList.add('hidden');
  form.classList.remove('hidden');

  // Populate alert type dropdown
  const sel = document.getElementById('alertTypeSelect');
  if (sel && sel.options.length === 1) {
    ROUTING_RULES.forEach(rule => {
      const opt = document.createElement('option');
      opt.value = rule.id;
      opt.textContent = rule.alertType;
      sel.appendChild(opt);
    });
  }

  // If a rule is already selected, restore preview
  if (state.selectedRuleId) {
    if (sel) sel.value = state.selectedRuleId;
    updateRoutingPreview(state.selectedRuleId);
  } else {
    document.getElementById('routingPreview')?.classList.add('hidden');
  }
}

function onAlertTypeChange() {
  const sel = document.getElementById('alertTypeSelect');
  if (!sel) return;
  state.selectedRuleId = sel.value || null;
  updateRoutingPreview(state.selectedRuleId);
}

function updateRoutingPreview(ruleId) {
  const preview = document.getElementById('routingPreview');
  if (!preview) return;
  if (!ruleId) { preview.classList.add('hidden'); return; }

  const rule = getRule(ruleId);
  if (!rule) { preview.classList.add('hidden'); return; }

  preview.classList.remove('hidden');

  const cfg = sevCfg(rule.severity);
  document.getElementById('rpSeverity').className = `sev-badge ${cfg.cssClass}`;
  document.getElementById('rpSeverity').textContent = cfg.icon + ' ' + cfg.label;

  const groupNames = rule.groups.map(gid => GROUPS[gid]?.name || gid);
  document.getElementById('rpGroups').innerHTML = groupNames
    .map(n => `<span style="font-size:11px;color:rgba(255,255,255,.75);background:rgba(255,255,255,.1);border-radius:6px;padding:2px 7px;font-weight:600;">${escHtml(n)}</span>`)
    .join(' ');

  document.getElementById('rpChannels').innerHTML = rule.channels
    .map(ch => `<span style="font-size:12px;">${CH_CONFIG[ch].icon}</span>`)
    .join(' ');

  const escRow = document.getElementById('rpEscalationRow');
  const escEl  = document.getElementById('rpEscalation');
  if (rule.escalationGroup) {
    escRow.style.display = '';
    const escName = GROUPS[rule.escalationGroup]?.name || rule.escalationGroup;
    escEl.innerHTML = `<span style="font-size:11px;color:rgba(100,180,255,.9);font-weight:600;">→ ${escHtml(escName)} after ${rule.escalationMinutes}min</span>`;
  } else {
    escRow.style.display = 'none';
  }
}

function submitAlert() {
  if (!state.selectedRuleId) { showToast('⚠️ Please select an alert type'); return; }
  const title  = document.getElementById('alertTitle')?.value?.trim();
  const desc   = document.getElementById('alertDesc')?.value?.trim();
  const action = document.getElementById('alertAction')?.value?.trim();

  if (!title)  { showToast('⚠️ Please enter an alert title');         return; }
  if (!desc)   { showToast('⚠️ Please enter a description');          return; }
  if (!action) { showToast('⚠️ Please describe the required action'); return; }

  const btn = document.getElementById('submitBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('btn-loading');
  document.getElementById('submitBtnText').textContent = 'Routing…';

  setTimeout(() => {
    const rule = getRule(state.selectedRuleId);
    const deliveries = buildDeliveries(rule, false);

    const newAlert = {
      id: Date.now().toString(),
      title, description: desc, action,
      ruleId: state.selectedRuleId,
      severity: rule.severity,
      timestamp: new Date(),
      createdBy: 'You (Admin)',
      deliveries,
      acknowledgements: [],
      escalated: false,
      escalationFired: false,
    };
    state.alerts.unshift(newAlert);

    // Simulate delivery
    simulateDelivery(newAlert);

    // Clear form
    ['alertTitle','alertDesc','alertAction'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    ['titleCount','descCount','actionCount'].forEach(id => {
      const el = document.getElementById(id); if (el) el.textContent = '0';
    });
    state.selectedRuleId = null;
    document.getElementById('alertTypeSelect').value = '';
    document.getElementById('routingPreview')?.classList.add('hidden');

    btn.disabled = false;
    btn.classList.remove('btn-loading');
    btn.classList.add('btn-success');
    document.getElementById('submitBtnText').textContent = '✓ Alert Routed!';
    setTimeout(() => {
      btn.classList.remove('btn-success');
      document.getElementById('submitBtnText').textContent = 'Route Alert';
    }, 2000);

    const cfg = sevCfg(rule.severity);
    showToast(`${cfg.icon} Alert routed via ${rule.alertType}`);
    setTimeout(() => navigate('feed'), 900);
  }, 700);
}

// Simulate delivery status changes
function simulateDelivery(alert) {
  alert.deliveries.forEach((d, i) => {
    const delay = 1000 + Math.random() * 2000;
    setTimeout(() => {
      d.status = Math.random() < 0.10 ? 'failed' : 'delivered';
      d.timestamp = new Date();
      // If currently viewing this alert, re-render
      if (state.currentScreen === 'detail' && state.currentAlertId === alert.id) {
        renderDetail(alert.id);
      }
      if (state.currentScreen === 'feed') renderFeed();
    }, delay + i * 200);
  });
}

// ────────────────────────────────────────────────────────
// RENDER: ROUTING RULES
// ────────────────────────────────────────────────────────
function renderRouting() {
  const list = document.getElementById('routingRulesList');
  if (!list) return;

  list.innerHTML = ROUTING_RULES.map(rule => {
    const cfg = sevCfg(rule.severity);
    const groupNames = rule.groups.map(gid => GROUPS[gid]?.name || gid);
    const escName = rule.escalationGroup ? GROUPS[rule.escalationGroup]?.name : null;

    return `<div class="routing-rule-card" style="animation:fadeInUp .25s ease">
      <div class="rr-type">${escHtml(rule.alertType)}</div>
      <div class="rr-row">
        <span class="rr-key">Severity</span>
        <span class="rr-val">${sevBadge(rule.severity)}</span>
      </div>
      <div class="rr-row">
        <span class="rr-key">Groups</span>
        <span class="rr-val">${groupNames.map(n => `<span class="group-chip">${escHtml(n)}</span>`).join('')}</span>
      </div>
      <div class="rr-row">
        <span class="rr-key">Channels</span>
        <span class="rr-val">${rule.channels.map(ch => `<span class="ch-pill">${CH_CONFIG[ch].icon} ${CH_CONFIG[ch].label}</span>`).join('')}</span>
      </div>
      ${escName ? `<div class="rr-row">
        <span class="rr-key">Escalation</span>
        <span class="rr-val"><span class="esc-info">→ ${escHtml(escName)} after ${rule.escalationMinutes}min</span></span>
      </div>` : ''}
    </div>`;
  }).join('');
}

// ────────────────────────────────────────────────────────
// RENDER: GROUPS
// ────────────────────────────────────────────────────────
function renderGroups() {
  const list = document.getElementById('groupsList');
  if (!list) return;

  list.innerHTML = Object.values(GROUPS).map(group => {
    const isOpen = state.expandedGroups.has(group.id);

    const memberRows = group.members.map(member => {
      const cells = ALL_CHANNELS.map(ch => {
        const has = member.channels.includes(ch);
        return `<div class="member-ch-cell">${has ? CH_CONFIG[ch].icon : '<span style="color:var(--text-4);font-size:12px;">—</span>'}</div>`;
      }).join('');
      return `<div class="member-row"><div class="member-name">${escHtml(member.name)}</div>${cells}</div>`;
    }).join('');

    const chHeaders = ALL_CHANNELS.map(ch =>
      `<div class="group-ch-head" title="${CH_CONFIG[ch].label}">${CH_CONFIG[ch].icon}</div>`
    ).join('');

    return `<div class="group-card" id="group-card-${group.id}">
      <div class="group-card-header" onclick="app.toggleGroup('${group.id}')">
        <div>
          <div class="group-name">${escHtml(group.name)}</div>
          <div class="group-count">${group.members.length} member${group.members.length !== 1 ? 's' : ''}</div>
        </div>
        <span class="group-expand-icon${isOpen ? ' expanded' : ''}">▼</span>
      </div>
      <div class="group-members${isOpen ? ' open' : ''}">
        <div class="group-ch-header">
          <div class="group-ch-head" style="flex:1;text-align:left;">Member</div>
          ${chHeaders}
        </div>
        ${memberRows}
      </div>
    </div>`;
  }).join('');
}

function toggleGroup(groupId) {
  if (state.expandedGroups.has(groupId)) {
    state.expandedGroups.delete(groupId);
  } else {
    state.expandedGroups.add(groupId);
  }
  renderGroups();
}

// ────────────────────────────────────────────────────────
// RENDER: DEMO
// ────────────────────────────────────────────────────────
function renderDemo() {
  const isAdmin = state.role === 'admin';
  document.getElementById('settingsRoleIcon').textContent = isAdmin ? '👑' : '👤';
  document.getElementById('settingsRoleName').textContent = isAdmin ? 'Administrator' : 'Staff Member';
  document.getElementById('settingsRoleDesc').textContent = isAdmin
    ? 'Can create, route, and view alerts'
    : 'Can view and acknowledge alerts only';

  const toggle = document.getElementById('roleToggle');
  if (toggle) toggle.checked = isAdmin;

  const totalDelivered = state.alerts.reduce((sum, a) =>
    sum + a.deliveries.filter(d => d.status === 'delivered' || d.status === 'escalated').length, 0);
  const totalAcked = state.alerts.filter(a => a.acknowledgements.length > 0).length;

  document.getElementById('statTotal').textContent     = state.alerts.length;
  document.getElementById('statDelivered').textContent = totalDelivered;
  document.getElementById('statAcked').textContent     = totalAcked;
}

// ────────────────────────────────────────────────────────
// SCENARIO TRIGGERS
// ────────────────────────────────────────────────────────
function triggerScenario(scenarioId) {
  if (scenarioId === 'waterLeak') {
    const rule = ROUTING_RULES.find(r => r.id === 'r5');
    const deliveries = buildDeliveries(rule, false);
    const alert = {
      id: 'wl-' + Date.now(),
      title: 'Water Leak — Room 412',
      description: 'Guest reported water dripping from ceiling in room 412. Possible pipe leak from floor above.',
      action: 'Dispatch maintenance to room 412. Move guest to alternate room. Place water absorber mats.',
      ruleId: 'r5',
      severity: 'p3',
      timestamp: new Date(),
      createdBy: 'You (Admin)',
      deliveries,
      acknowledgements: [],
      escalated: false,
      escalationFired: false,
    };
    state.alerts.unshift(alert);
    simulateDelivery(alert);
    showToast('🚰 Water Leak alert routed → Housekeeping only');
    setTimeout(() => navigate('detail', alert.id), 600);

  } else if (scenarioId === 'emergency911') {
    const rule = ROUTING_RULES.find(r => r.id === 'r1');
    const deliveries = buildDeliveries(rule, true); // escalated = true from the start for demo
    const alert = {
      id: 'em-' + Date.now(),
      title: '911 Emergency Call — Lobby',
      description: 'Lobby security triggered 911 after guest collapsed near main entrance. EMS dispatched.',
      action: 'Clear 20-ft radius around guest. GM to lobby immediately. Direct EMS to main entrance.',
      ruleId: 'r1',
      severity: 'p1',
      timestamp: new Date(),
      createdBy: 'You (Admin)',
      deliveries,
      acknowledgements: [],
      escalated: true,
      escalationFired: true,
    };
    state.alerts.unshift(alert);
    // Simulate delivery with some failures
    alert.deliveries.forEach((d, i) => {
      if (d.isEscalated) return; // escalated stay as-is initially
      const delay = 800 + Math.random() * 1500;
      setTimeout(() => {
        d.status = (i % 7 === 3) ? 'failed' : 'delivered';
        d.timestamp = new Date();
        if (state.currentScreen === 'detail' && state.currentAlertId === alert.id) renderDetail(alert.id);
        if (state.currentScreen === 'feed') renderFeed();
      }, delay);
    });
    showToast('🚨 911 Emergency routed → GM/Exec + Security (ALL channels)');
    setTimeout(() => navigate('detail', alert.id), 600);
  }

  renderDemo();
}

// ────────────────────────────────────────────────────────
// ACKNOWLEDGE
// ────────────────────────────────────────────────────────
function acknowledgeAlert(id) {
  const alert = state.alerts.find(a => a.id === id);
  if (!alert) return;

  const btn = document.getElementById('ackBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;animation:spin 0.6s linear infinite">
        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <path d="M12 3a9 9 0 0 1 9 9" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Acknowledging…`;
  }

  setTimeout(() => {
    const name = state.role === 'admin' ? 'You (Admin)' : 'You (Staff)';
    alert.acknowledgements.push({ name, timestamp: new Date() });
    renderDetail(id);
    updateTabBadge();
    showToast('✅ Alert acknowledged');
  }, 600);
}

// ────────────────────────────────────────────────────────
// ROLE TOGGLE
// ────────────────────────────────────────────────────────
function toggleRole() {
  const isAdmin = document.getElementById('roleToggle')?.checked;
  state.role = isAdmin ? 'admin' : 'staff';
  renderDemo();
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
  const createTab = document.getElementById('createTab');
  if (createTab) {
    createTab.style.opacity = state.role === 'admin' ? '1' : '0.45';
  }
}

// ────────────────────────────────────────────────────────
// RESET DEMO
// ────────────────────────────────────────────────────────
function resetDemoData() {
  const btn = document.getElementById('resetBtn');
  if (btn) { btn.textContent = 'Resetting…'; btn.disabled = true; }

  setTimeout(() => {
    state.alerts = createSeedAlerts();
    state.role = 'admin';
    state.currentAlertId = null;
    state.selectedRuleId = null;
    state.expandedGroups.clear();

    renderDemo();
    updateTabBadge();
    if (btn) {
      btn.innerHTML = '✓ Reset Complete';
      setTimeout(() => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Reset Demo Data`;
        btn.disabled = false;
      }, 1800);
    }
    showToast('🔄 Demo reset — 2 seed scenarios restored');
  }, 500);
}

// ────────────────────────────────────────────────────────
// BRAND SWITCHING
// ────────────────────────────────────────────────────────
function changeBrand(brandKey) {
  if (!BRANDS[brandKey]) return;
  state.brand = brandKey;
  applyBrand();
  showToast(`Switched to ${BRANDS[brandKey].name}`);
}

function applyBrand() {
  const b = BRANDS[state.brand];
  if (!b) return;

  // Update CSS custom properties for accent color
  const root = document.documentElement;
  root.style.setProperty('--brand-accent', b.accent);
  root.style.setProperty('--brand-accent-dk', b.accentDark);
  root.style.setProperty('--brand-accent-lt', b.accentLight);
  root.style.setProperty('--brand-accent-border', b.accentBorder);

  // Update property names throughout the UI
  const propEls = ['feedPropertyName', 'createPropertyName'];
  propEls.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = b.property;
  });

  // Demo tab brand references
  const demoCode = document.getElementById('demoPropertyCode');
  if (demoCode) demoCode.textContent = b.code;
  const demoBrand = document.getElementById('demoBrandName');
  if (demoBrand) demoBrand.textContent = b.name;
  const demoDisclaimer = document.getElementById('demoDisclaimerBrand');
  if (demoDisclaimer) demoDisclaimer.textContent = b.short;

  // Footer
  const footerBrand = document.getElementById('footerBrand');
  if (footerBrand) footerBrand.textContent = `${b.name} POC`;

  // Dark header accent stripe
  const stripeColor = b.accent;
  const rule = `.dark-header::after { background: linear-gradient(90deg, ${stripeColor} 0%, ${b.accentDark} 60%, transparent 100%) !important; }`;
  let styleTag = document.getElementById('brand-dynamic-css');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'brand-dynamic-css';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `
    ${rule}
    .fab { background: linear-gradient(135deg, ${b.accent}, ${b.accentDark}) !important; box-shadow: 0 4px 16px ${b.accent}66 !important; }
    .submit-btn { background: linear-gradient(135deg, ${b.accent}, ${b.accentDark}) !important; box-shadow: 0 4px 16px ${b.accent}55 !important; }
    .ack-button { background: linear-gradient(135deg, ${b.accent}, ${b.accentDark}) !important; box-shadow: 0 4px 16px ${b.accent}55 !important; }
    .tab-item.active .tab-icon { color: ${b.accent} !important; }
    .tab-item.active .tab-label { color: ${b.accent} !important; }
    .toggle-switch input:checked + .toggle-slider { background: ${b.accent} !important; }
  `;

  // Re-render current screen to pick up stamp changes
  if (state.currentScreen === 'detail' && state.currentAlertId) renderDetail(state.currentAlertId);
  if (state.currentScreen === 'demo') renderDemo();
}

// ────────────────────────────────────────────────────────
// CHAR COUNT HELPER
// ────────────────────────────────────────────────────────
function updateCharCount(inputId, countId, max) {
  const el = document.getElementById(inputId);
  const ct = document.getElementById(countId);
  if (!el || !ct) return;
  const len = el.value.length;
  ct.textContent = len;
  const wrap = ct.closest('.char-count');
  if (wrap) {
    wrap.classList.toggle('char-warn',   len > max * 0.85);
    wrap.classList.toggle('char-danger', len >= max);
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
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ────────────────────────────────────────────────────────
// STATUS BAR CLOCK
// ────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('statusTime');
  if (!el) return;
  const d = new Date();
  el.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ────────────────────────────────────────────────────────
// PUBLIC APP API
// ────────────────────────────────────────────────────────
window.app = {
  navigate,
  onAlertTypeChange,
  submitAlert,
  acknowledgeAlert,
  toggleRole,
  toggleGroup,
  triggerScenario,
  resetDemoData,
  updateCharCount,
  changeBrand,
};

// ────────────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 15000);
  applyBrand();
  renderFeed();
  updateTabBadge();
});
