# Jazz Note

**Jazz Note** is a hotel staff alert platform centered on automatic severity-based escalation through predefined distribution groups.

## Core Concept

Traditional alert systems broadcast to everyone or require manual recipient selection. Jazz Note routes every alert automatically based on pre-configured rules: *alert type + severity → distribution group(s) + channel set*, with an escalation chain that activates if recipients don't acknowledge within a configurable window.

---

## Features

### Distribution Groups
Named groups of staff members, each with their own reachable channels (SMS, WhatsApp, voice call, email, push). Groups are predefined — no selecting recipients at send time.

| Group | Members | Channels |
|---|---|---|
| Housekeeping | Maria Santos, Javier Cruz, Lin Wei | push, sms, email |
| Engineering On-Call | Tom Okafor, Rachel Kim, Derek Alvarez | push, sms, voice |
| GM / Exec | Sophie Laurent, James Whitfield | all channels |
| Security | Priya Patel, Carlos Rivera | push, sms, voice, whatsapp |
| Front Desk | Aiko Tanaka, Dylan Moore | push, sms, email |

### Severity Levels (P1–P4)

| Level | Label | Ack Window | Default Channels |
|---|---|---|---|
| P1 | 🔴 Critical | 5 min | All channels |
| P2 | 🟠 High | 15 min | Push + SMS + Voice |
| P3 | 🟡 Normal | 60 min | Push + SMS |
| P4 | 🟢 Info | — | Email only |

Severity is determined by the routing rule — not chosen ad hoc at send time.

### Routing Rules

Admin-configurable rules map alert type + severity to one or more distribution groups and a channel set. A single alert can fan out to multiple groups simultaneously.

Examples:
- **Housekeeping (P2)** → Housekeeping group only (via push + sms + voice). GM NOT notified. Escalates to GM after 15 min if unacked.
- **Emergency (P1)** → GM/Exec + Security on **all channels** immediately.
- **Maintenance (P3)** → Engineering On-Call via push + sms.

### Multi-Channel Delivery

Each recipient is contacted on every channel they support that is included in the routing rule. The delivery matrix on the Alert Detail screen shows status per recipient × channel (pending → sent → delivered / failed).

### Acknowledgement & Escalation

Recipients acknowledge alerts individually. The escalation chain fires automatically after the configured window if primary recipients haven't all acked. Escalated alerts add the escalation groups and their deliveries on top of the original routing.

---

## Navigation

| Tab | Screen | Purpose |
|---|---|---|
| 🔔 Alerts | Alert Feed | Live alert list with routing info, delivery status, ack counts |
| | Alert Detail | Full detail + delivery matrix + ack button + resolve |
| 🗺️ Routing | Routing Rules | CRUD for alert type → group + severity + channels |
| 👥 Groups | Distribution Groups | CRUD for groups with member management |
| 🎛️ Demo | Demo Controls | Trigger demo scenarios, toggle role, reset state |

---

## Demo Scenarios

Two canonical scenarios are seeded at launch to show routing contrast:

### Scenario 1 — Housekeeping: Water Leak, Room 412 (P2)
- Routes to **Housekeeping group only**
- GM is NOT notified
- Channels: push + sms + voice
- Escalates to GM/Exec after 15 min if unacked

### Scenario 2 — Emergency: 911 Call, Lobby (P1)
- Routes to **GM/Exec + Security simultaneously**
- Every channel: push + sms + whatsapp + voice + email
- No escalation — all channels fired instantly

---

## Architecture

- **Expo** SDK 56, React Native 0.85, TypeScript 6
- All state in-memory via React Context (POC/demo — no backend)
- `AppContext` — unified context for alerts, groups, rules, staff, escalation timers
- Escalation uses `setTimeout` internally; timers reset on `resetToSeedData()`

### File Structure

```
src/
  types/index.ts          — All types (SeverityLevel, Channel, JazzAlert, RoutingRule, DistributionGroup…)
  data/seedData.ts        — Staff, groups, rules, demo alerts
  context/AppContext.tsx  — Unified state, routing logic, escalation timers
  components/
    AlertCard.tsx         — Feed card with routing info + delivery status
    SeverityBadge.tsx     — Colored P1–P4 badge
    GroupChip.tsx         — Distribution group chip
    ChannelPill.tsx       — Channel status pill
  screens/
    AlertFeedScreen.tsx       — Alert list with filter tabs
    AlertDetailScreen.tsx     — Full detail + delivery matrix + ack/resolve
    RoutingRulesScreen.tsx    — CRUD for routing rules
    DistributionGroupsScreen  — CRUD for groups + members
    DemoControlsScreen.tsx    — Demo triggers, role toggle, reset
  navigation/AppNavigator.tsx — Stack + tab navigator
  utils/
    time.ts               — Relative/formatted time helpers
    channels.ts           — Default channel sets per severity
```

---

## Running

```bash
npx expo start          # development server
npx expo start --web    # web browser
npx tsc --noEmit        # type-check
```

---

## Color Scheme

Dark/gold — inherited and carried forward:
- Background: `#1C1C1C` (dark)
- Accent: `#B8860B` (dark gold)
- P1: `#FF3B30` (red)
- P2: `#FF9500` (orange)
- P3: `#FFCC00` (yellow)
- P4: `#34C759` (green)
