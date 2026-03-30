# Dashboard Shell + F1 Members — Design Spec

**Date:** 2026-03-30
**Session target:** Rebuild shell/layout to DESIGN.md spec + complete F1 Members dashboard
**Status:** Approved ✅

---

## 1. Scope

This session covers:
1. Apply design tokens (Tailwind + CSS vars)
2. Decompose shell into `HeaderComponent` + `SidebarComponent`
3. Home Dashboard page (`/`)
4. Members List page (`/members`)
5. Member Detail page (`/members/:id`)
6. Member Edit page (`/members/:id/edit`)

---

## 2. Design Tokens

### tailwind.config.js
```js
colors: {
  primary: '#2B3A67',
  'primary-hover': '#233060',
  secondary: '#5C6B89',
  tertiary: '#8E9AAF',
  neutral: '#F8F9FA',
  'surface-dark': '#1C2340',
  'surface-card': '#FFFFFF',
}
```

### src/styles.scss additions
```scss
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

:root {
  --color-primary: #2B3A67;
  --color-secondary: #5C6B89;
  --color-tertiary: #8E9AAF;
  --color-neutral: #F8F9FA;
  --color-surface-dark: #1C2340;
  --sidebar-width-expanded: 256px;
  --sidebar-width-collapsed: 72px;
  --font-family: 'Manrope', sans-serif;
  --letter-spacing-tight: -0.02em;
}

html, body {
  font-family: var(--font-family);
  letter-spacing: var(--letter-spacing-tight);
}
```

---

## 3. Component Architecture

```
AppRoutes
└── ShellComponent          ← layout wrapper only, no logic
    ├── HeaderComponent     ← stateless: search, bell, help, branch dropdown, avatar
    ├── SidebarComponent    ← owns collapse signal + localStorage
    └── <router-outlet>
        ├── /               → HomeComponent
        ├── /members        → MembersListComponent
        ├── /members/:id    → MemberDetailComponent
        └── /members/:id/edit → MemberEditComponent
```

### ShellComponent
- Pure layout: flex row of sidebar + main area, header across top
- No logic; passes `auth.username()` to header as input

### HeaderComponent
- Inputs: `username: string`
- Elements: search input (full width), bell icon, help icon, branch dropdown ("Main Sanctuary"), user avatar (initials)
- Stateless — no services injected

### SidebarComponent
- `collapsed = signal(localStorage.getItem('sidebar-collapsed') === 'true')`
- Toggle writes back to localStorage
- Width: `256px` expanded / `72px` collapsed (CSS var driven)
- Active state: `3px left accent bar` (`#2B3A67`) + `rgba(43,58,103,0.05)` background tint — no bounding box
- Hover: background shift only
- Collapsed: icons only, same active indicator, tooltips on hover
- Nav items: Home · Members · Ministry · Attendance · Analytics · Settings
- Bottom (pinned): Logout (red) · user avatar + name
- Collapse toggle: chevron `◁ / ▷` vertically centered on sidebar right edge

---

## 4. Pages

### 4.1 Home Dashboard (`/`)

**Title:** "Liturgical Dashboard" · **Subtitle:** "System-wide overview for the fiscal quarter."

**Stat cards (4, in a row):**
| Card | Label | API source |
|------|-------|------------|
| 1 | TOTAL MEMBERS | `GET /api/v1/members` → `total` |
| 2 | ACTIVE THIS WEEK | `GET /api/v1/members?status=ACTIVE` → `total` |
| 3 | MINISTRY REQUESTS | `GET /api/v1/ministries` → pending count |
| 4 | AVG. ATTENDANCE | Static for MVP |

Each card: icon (top-left) · badge (top-right, color-coded) · metric label · large number · subtext/progress bar

**Growth Analytics chart:** dual-line (Chart.js via `p-chart`), static data for MVP (Jan–Nov, 2025 vs 2024)

**Demographics panel:** horizontal bar, Women 52% / Men 48%, static for MVP

**Recent Administrative Activity table:**
- Columns: Name · Role · Status · Last Updated
- Data: `GET /api/v1/members?size=10&sort=updatedAt,desc` — shows most recently updated members
- Status badges use same colour reference as Members List (section 5)

---

### 4.2 Members List (`/members`)

**Title:** "Congregation Core"

**Pending banner:** amber bar shown when `pendingCount > 0` — "⚠️ N members awaiting approval" + "Show pending only →" link that activates status filter

**Filters:**
- All Roles dropdown: ADMIN · MEMBER
- All Status dropdown: ACTIVE · INACTIVE · PENDING · DELETED
- Search input: name or email (debounced 300ms)
- `+ Add Member` button (primary, top-right) — navigates to `/members/new`

**Table columns:**
| Column | Notes |
|--------|-------|
| Name | Name (bold) + email (muted subtext) |
| Role | Badge: `ADMIN` (dark) · `MEMBER` (muted) |
| Status | Badge: `ACTIVE` (green) · `INACTIVE` (amber) · `PENDING` (purple) · `DELETED` (red) |
| Baptism | Plain text: BAPTIZED · CATECHUMEN · NONE |
| Last Active | `updatedAt` from BaseEntity, formatted as date string or `—` |
| Approve | `✓ Approve` button — only on PENDING rows; `PATCH /api/v1/members/:publicId { memberStatus: "ACTIVE" }`; dash for others |
| Edit | Icon button `✏️` — navigates to `/members/:id/edit` |

**Badge style:** `inline-flex`, `width: fit-content`, minimal padding (2px 5px), `border-radius: 4px`

**PENDING row:** subtle purple background tint `rgba(109,40,217,0.03)`

**Pagination:** `p-paginator`, "Showing X–Y of Z members", page=0 size=20

---

### 4.3 Member Detail (`/members/:id`)

Layout: two-column card
- **Left:** avatar (initials) · name · role badge · status badge · read-only fields: email, phone, date of birth, gender, baptism, member since
- **Right header buttons:** `Edit` (primary) · `Delete` (danger, soft-delete → `DELETED`)
- Back link: `← Members`

---

### 4.4 Member Edit (`/members/:id/edit`)

Route: `/members/:id/edit`

**Editable fields:** name · phone · dateOfBirth · gender · baptism · memberStatus · role

**Constraints:**
- Status transitions: `ACTIVE ↔ INACTIVE → DELETED` (DELETED is terminal — hide option if current status is DELETED)
- `PATCH /api/v1/members/:publicId` with only changed fields
- On success: navigate back to `/members/:id`
- Validation: `@Valid` errors surfaced as inline field messages

---

## 5. Badge / Status Colour Reference

| Value | Style |
|-------|-------|
| ACTIVE | green — `#dcfce7 / #15803d` |
| INACTIVE | amber — `#fef3c7 / #b45309` |
| PENDING | purple — `#ede9fe / #6d28d9` |
| DELETED | red — `#fee2e2 / #b91c1c` |
| ADMIN | dark — `#1e293b / #fff` |
| MEMBER | muted — `#e2e8f0 / #475569` |

---

## 6. PrimeNG Component Map

| Element | PrimeNG |
|---------|---------|
| Table | `p-table` + `p-paginator` |
| Dropdowns | `p-dropdown` |
| Search input | `p-inputtext` |
| Status badges | `p-tag` (custom severity classes) |
| Buttons | `p-button` |
| Charts | `p-chart` (Chart.js) |
| Forms | `p-inputtext`, `p-dropdown`, `p-calendar` |

---

## 7. Key Rules

1. Font is **Manrope** — imported from Google Fonts, applied globally
2. **Letter spacing `-0.02em`** on all headings and nav labels
3. Sidebar active = **3px left border accent** + background tint — no bounding box
4. Sidebar collapse state persisted in **localStorage**
5. Badges are **fit-content** — no fixed widths
6. Approve button only visible on **PENDING** rows
7. Soft delete only — DELETED status is terminal, no hard delete
8. All API calls use `publicId` (UUID), never internal `id`