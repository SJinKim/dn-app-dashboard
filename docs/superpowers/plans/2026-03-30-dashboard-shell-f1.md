# Dashboard Shell + F1 Members Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Angular dashboard shell to DESIGN.md spec (Manrope, design tokens, decomposed Sidebar+Header, collapsible sidebar) and complete the F1 Members dashboard (Home page, Members list with approve workflow, Member detail, Member edit).

**Architecture:** ShellComponent becomes a thin layout wrapper using standalone SidebarComponent (owns collapse signal + localStorage) and HeaderComponent (stateless). Feature pages (Home, Members) are loaded via router-outlet and styled with DESIGN.md tokens.

**Tech Stack:** Angular 21 (standalone, signals), PrimeNG 19 (Aura), Tailwind CSS 3, Chart.js, Manrope (Google Fonts), Keycloak JS

---

## File Map

| Action | File |
|--------|------|
| Modify | `tailwind.config.js` |
| Modify | `src/styles.scss` |
| Create | `src/app/shell/sidebar/sidebar.component.ts` |
| Create | `src/app/shell/sidebar/sidebar.component.html` |
| Create | `src/app/shell/header/header.component.ts` |
| Create | `src/app/shell/header/header.component.html` |
| Modify | `src/app/shell/shell.component.ts` |
| Modify | `src/app/shell/shell.component.html` |
| Modify | `src/app/app.routes.ts` |
| Create | `src/app/features/home/home.component.ts` |
| Create | `src/app/features/home/home.component.html` |
| Modify | `src/app/core/models/member.model.ts` |
| Modify | `src/app/features/members/members-list/members-list.component.ts` |
| Modify | `src/app/features/members/members-list/members-list.component.html` |
| Modify | `src/app/features/members/member-detail/member-detail.component.ts` |
| Modify | `src/app/features/members/member-detail/member-detail.component.html` |
| Modify | `src/app/features/members/member-edit/member-edit.component.html` |

---

## Task 1: Install chart.js + apply design tokens

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/styles.scss`

- [ ] **Step 1: Install chart.js**

```bash
cd /path/to/dn-app-dashboard
npm install chart.js
```

Expected: `chart.js` appears in `node_modules/chart.js` and `package.json` dependencies.

- [ ] **Step 2: Replace tailwind.config.js**

Full file replacement:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2B3A67',
        'primary-hover': '#233060',
        secondary: '#5C6B89',
        tertiary: '#8E9AAF',
        neutral: '#F8F9FA',
        'surface-dark': '#1C2340',
        'surface-card': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.02em',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Replace src/styles.scss**

Full file replacement:

```scss
// Google Fonts — Manrope
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

// Tailwind
@tailwind base;
@tailwind components;
@tailwind utilities;

// PrimeNG
@import "primeicons/primeicons.css";

// Design tokens
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
  height: 100%;
  margin: 0;
  font-family: var(--font-family);
  letter-spacing: var(--letter-spacing-tight);
  background: #F8F9FA;
}

// Status badge utility classes (fit-content, tight padding)
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 0.6875rem; // 11px
  font-weight: 700;
  white-space: nowrap;
  width: fit-content;
  line-height: 1.3;
  letter-spacing: 0.02em;

  &.badge-active   { background: #dcfce7; color: #15803d; }
  &.badge-inactive { background: #fef3c7; color: #b45309; }
  &.badge-pending  { background: #ede9fe; color: #6d28d9; }
  &.badge-deleted  { background: #fee2e2; color: #b91c1c; }
  &.badge-admin    { background: #1e293b; color: #ffffff; }
  &.badge-member   { background: #e2e8f0; color: #475569; }
}

// PrimeNG table header
.p-datatable .p-datatable-thead > tr > th {
  background: #f8f9fa;
  color: #8E9AAF;
  font-weight: 700;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

- [ ] **Step 4: Verify build compiles**

```bash
cd /path/to/dn-app-dashboard
ng build --configuration development 2>&1 | tail -20
```

Expected: `Build at: ... - Time: ...ms` with no errors.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js src/styles.scss package.json package-lock.json
git commit -m "feat(shell): add design tokens — Manrope, primary palette, status badge classes"
```

---

## Task 2: SidebarComponent

**Files:**
- Create: `src/app/shell/sidebar/sidebar.component.ts`
- Create: `src/app/shell/sidebar/sidebar.component.html`

- [ ] **Step 1: Create sidebar component TS**

```typescript
// src/app/shell/sidebar/sidebar.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TooltipModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly auth = inject(AuthService);

  readonly collapsed = signal(
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  readonly sidebarWidth = computed(() =>
    this.collapsed() ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)'
  );

  readonly navItems: NavItem[] = [
    { label: 'Home',            icon: 'pi pi-home',          route: '/'          },
    { label: 'Members',         icon: 'pi pi-users',         route: '/members'   },
    { label: 'Ministry',        icon: 'pi pi-sitemap',       route: '/ministry'  },
    { label: 'Attendance',      icon: 'pi pi-calendar-check',route: '/attendance'},
    { label: 'Analytics',       icon: 'pi pi-chart-bar',     route: '/analytics' },
    { label: 'Settings',        icon: 'pi pi-cog',           route: '/settings'  },
  ];

  get userInitials(): string {
    const name = this.auth.username();
    return name ? name.slice(0, 2).toUpperCase() : 'AU';
  }

  toggleCollapse(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  }
}
```

- [ ] **Step 2: Create sidebar template**

```html
<!-- src/app/shell/sidebar/sidebar.component.html -->
<aside
  class="relative flex flex-col bg-white border-r border-gray-100 flex-shrink-0 transition-all duration-200"
  [style.width]="sidebarWidth()"
>
  <!-- Brand -->
  <div class="px-5 py-4 border-b border-gray-50 flex-shrink-0 overflow-hidden">
    <div class="text-[15px] font-extrabold text-primary tracking-tight whitespace-nowrap">
      한마음 D+N
    </div>
    @if (!collapsed()) {
      <div class="text-[9px] text-tertiary font-medium uppercase tracking-widest mt-0.5">
        Church Management
      </div>
    }
  </div>

  <!-- Nav -->
  <nav class="flex-1 py-2 overflow-hidden">
    @for (item of navItems; track item.route) {
      <a
        [routerLink]="item.route"
        routerLinkActive="active-nav-item"
        [routerLinkActiveOptions]="{ exact: item.route === '/' }"
        class="nav-item relative flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium text-secondary hover:bg-neutral transition-colors overflow-hidden whitespace-nowrap"
        [pTooltip]="collapsed() ? item.label : ''"
        tooltipPosition="right"
      >
        <!-- 3px left accent bar — only visible when active, via CSS -->
        <i [class]="item.icon + ' text-sm w-4 flex-shrink-0'"></i>
        @if (!collapsed()) {
          <span class="tracking-tight">{{ item.label }}</span>
        }
      </a>
    }
  </nav>

  <!-- Bottom: Logout + User -->
  <div class="border-t border-gray-50 py-2 flex-shrink-0 overflow-hidden">
    <button
      (click)="auth.logout()"
      class="flex items-center gap-2.5 px-5 py-2.5 w-full text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap overflow-hidden"
      [pTooltip]="collapsed() ? 'Logout' : ''"
      tooltipPosition="right"
    >
      <i class="pi pi-sign-out text-sm w-4 flex-shrink-0"></i>
      @if (!collapsed()) {
        <span class="tracking-tight">Logout</span>
      }
    </button>

    <div class="flex items-center gap-2.5 px-4 py-2 overflow-hidden">
      <div class="w-7 h-7 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
        {{ userInitials }}
      </div>
      @if (!collapsed()) {
        <div class="overflow-hidden">
          <div class="text-[12px] font-semibold text-primary tracking-tight truncate">{{ auth.username() }}</div>
          <div class="text-[10px] text-tertiary">Administrator</div>
        </div>
      }
    </div>
  </div>

  <!-- Collapse toggle — vertically centered on right edge -->
  <button
    (click)="toggleCollapse()"
    class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-secondary hover:text-primary transition-colors z-10 text-[10px]"
  >
    <i [class]="collapsed() ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"></i>
  </button>
</aside>
```

- [ ] **Step 3: Add active nav item styles to styles.scss**

Append to `src/styles.scss`:

```scss
// Sidebar active nav item
.nav-item.active-nav-item {
  color: #2B3A67 !important;
  font-weight: 700;
  background: rgba(43, 58, 103, 0.05);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #2B3A67;
    border-radius: 0 2px 2px 0;
  }

  i {
    color: #2B3A67;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/shell/sidebar/ src/styles.scss
git commit -m "feat(shell): add SidebarComponent — collapsible, localStorage persist, 3px accent bar"
```

---

## Task 3: HeaderComponent

**Files:**
- Create: `src/app/shell/header/header.component.ts`
- Create: `src/app/shell/header/header.component.html`

- [ ] **Step 1: Create header component TS**

```typescript
// src/app/shell/header/header.component.ts
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly username = input<string>('');

  get initials(): string {
    const name = this.username();
    return name ? name.slice(0, 2).toUpperCase() : 'AU';
  }
}
```

- [ ] **Step 2: Create header template**

```html
<!-- src/app/shell/header/header.component.html -->
<header class="h-[52px] bg-white border-b border-gray-100 flex items-center gap-3 px-5 flex-shrink-0 z-10">

  <!-- Search -->
  <div class="flex-1 flex items-center gap-2 h-[34px] bg-neutral border border-gray-200 rounded-lg px-3 text-[12px] text-tertiary">
    <i class="pi pi-search text-[12px]"></i>
    <span class="tracking-tight">Search congregation, records, or events...</span>
  </div>

  <!-- Bell -->
  <button class="w-8 h-8 rounded-lg bg-neutral border border-gray-200 flex items-center justify-center text-secondary hover:text-primary transition-colors">
    <i class="pi pi-bell text-[13px]"></i>
  </button>

  <!-- Help -->
  <button class="w-8 h-8 rounded-lg bg-neutral border border-gray-200 flex items-center justify-center text-secondary hover:text-primary transition-colors">
    <i class="pi pi-question-circle text-[13px]"></i>
  </button>

  <!-- Branch dropdown -->
  <div class="flex items-center gap-1.5 h-8 bg-neutral border border-gray-200 rounded-lg px-3 text-[11px] font-semibold text-primary tracking-tight">
    Main Sanctuary
    <i class="pi pi-chevron-down text-[9px]"></i>
  </div>

  <!-- Avatar -->
  <div class="w-8 h-8 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
    {{ initials }}
  </div>

</header>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/shell/header/
git commit -m "feat(shell): add HeaderComponent — search bar, icons, branch dropdown, avatar"
```

---

## Task 4: Update ShellComponent

**Files:**
- Modify: `src/app/shell/shell.component.ts`
- Modify: `src/app/shell/shell.component.html`

- [ ] **Step 1: Replace shell.component.ts**

```typescript
// src/app/shell/shell.component.ts
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
}
```

- [ ] **Step 2: Replace shell.component.html**

```html
<!-- src/app/shell/shell.component.html -->
<div class="h-screen flex flex-col overflow-hidden">

  <app-header [username]="auth.username()" />

  <div class="flex flex-1 overflow-hidden">
    <app-sidebar />

    <main class="flex-1 overflow-auto bg-neutral">
      <router-outlet />
    </main>
  </div>

</div>
```

- [ ] **Step 3: Serve and verify the shell renders**

```bash
ng serve
```

Open http://localhost:4200. Expected: sidebar (256px, Manrope font, 한마음 D+N brand) + header bar. Active nav item should show 3px left accent.

- [ ] **Step 4: Commit**

```bash
git add src/app/shell/shell.component.ts src/app/shell/shell.component.html
git commit -m "feat(shell): decompose ShellComponent — uses SidebarComponent + HeaderComponent"
```

---

## Task 5: Add Home route to AppRoutes

**Files:**
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1: Replace app.routes.ts**

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './shell/shell.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'members',
        loadChildren: () =>
          import('./features/members/members.routes').then(m => m.MEMBERS_ROUTES),
      },
      {
        path: 'ministry',
        loadChildren: () =>
          import('./features/ministry/ministry.routes').then(m => m.MINISTRY_ROUTES),
      },
      {
        path: 'attendance',
        loadChildren: () =>
          import('./features/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/app/app.routes.ts
git commit -m "feat(routing): add home route — / loads HomeComponent"
```

---

## Task 6: HomeComponent

**Files:**
- Create: `src/app/features/home/home.component.ts`
- Create: `src/app/features/home/home.component.html`

- [ ] **Step 1: Create home.component.ts**

```typescript
// src/app/features/home/home.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { MemberService } from '../members/member.service';
import { MemberSummary, MemberStatus } from '../../core/models/member.model';

interface StatCard {
  label: string;
  value: string;
  badge: string;
  badgeClass: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ChartModule, TagModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly router        = inject(Router);

  readonly loading       = signal(true);
  readonly recentMembers = signal<MemberSummary[]>([]);

  totalMembers  = signal(0);
  activeMembers = signal(0);
  pendingCount  = signal(0);

  readonly statCards = signal<StatCard[]>([]);

  // Static chart data for MVP
  readonly chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        label: '2025',
        data: [820, 932, 901, 934, 1290, 1330, 1320, 1400, 1450, 1520, 1600],
        borderColor: '#2B3A67',
        backgroundColor: 'rgba(43,58,103,0.05)',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.4,
        fill: true,
      },
      {
        label: '2024',
        data: [620, 732, 701, 734, 1090, 1130, 1120, 1200, 1250, 1280, 1350],
        borderColor: '#8E9AAF',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 2,
        tension: 0.4,
      },
    ],
  };

  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'Manrope', size: 11 }, color: '#5C6B89' },
      },
    },
    scales: {
      x: { ticks: { font: { family: 'Manrope', size: 10 }, color: '#8E9AAF' }, grid: { display: false } },
      y: { ticks: { font: { family: 'Manrope', size: 10 }, color: '#8E9AAF' }, grid: { color: '#f3f4f6' } },
    },
  };

  ngOnInit(): void {
    // Load total members
    this.memberService.getMembers({ size: 1 }).subscribe({
      next: res => {
        this.totalMembers.set(res.totalElements);
        this.refreshStatCards();
      },
    });

    // Load active members count
    this.memberService.getMembers({ status: 'ACTIVE', size: 1 }).subscribe({
      next: res => {
        this.activeMembers.set(res.totalElements);
        this.refreshStatCards();
      },
    });

    // Load pending count
    this.memberService.getMembers({ status: 'PENDING', size: 1 }).subscribe({
      next: res => {
        this.pendingCount.set(res.totalElements);
        this.refreshStatCards();
      },
    });

    // Load recent members for activity table
    this.memberService.getMembers({ size: 10 }).subscribe({
      next: res => {
        this.recentMembers.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private refreshStatCards(): void {
    this.statCards.set([
      {
        label: 'TOTAL MEMBERS',
        value: this.totalMembers().toLocaleString(),
        badge: '+12%',
        badgeClass: 'badge-active',
        icon: 'pi pi-users',
      },
      {
        label: 'ACTIVE THIS WEEK',
        value: this.activeMembers().toLocaleString(),
        badge: '+3%',
        badgeClass: 'badge-active',
        icon: 'pi pi-check-circle',
      },
      {
        label: 'PENDING APPROVALS',
        value: this.pendingCount().toLocaleString(),
        badge: 'Pending',
        badgeClass: 'badge-pending',
        icon: 'pi pi-clock',
      },
      {
        label: 'AVG. ATTENDANCE',
        value: '—',
        badge: 'N/A',
        badgeClass: 'badge-inactive',
        icon: 'pi pi-calendar-check',
      },
    ]);
  }

  statusBadgeClass(status: MemberStatus): string {
    const map: Record<MemberStatus, string> = {
      ACTIVE:   'badge-active',
      INACTIVE: 'badge-inactive',
      PENDING:  'badge-pending',
      DELETED:  'badge-deleted',
    };
    return map[status] ?? 'badge-member';
  }

  goToMembers(): void { this.router.navigate(['/members']); }
  goToMember(publicId: string): void { this.router.navigate(['/members', publicId]); }
}
```

- [ ] **Step 2: Create home.component.html**

```html
<!-- src/app/features/home/home.component.html -->
<div class="p-6 max-w-[1400px]">

  <!-- Page title -->
  <div class="mb-6">
    <h1 class="text-[26px] font-extrabold text-primary tracking-tight">Liturgical Dashboard</h1>
    <p class="text-[13px] text-tertiary mt-1">System-wide overview for the fiscal quarter.</p>
  </div>

  <!-- Stat cards -->
  <div class="grid grid-cols-4 gap-4 mb-6">
    @for (card of statCards(); track card.label) {
      <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div class="flex items-start justify-between mb-3">
          <div class="w-9 h-9 rounded-lg bg-neutral flex items-center justify-center">
            <i [class]="card.icon + ' text-secondary text-[14px]'"></i>
          </div>
          <span [class]="'status-badge ' + card.badgeClass">{{ card.badge }}</span>
        </div>
        <div class="text-[9px] font-bold text-tertiary uppercase tracking-widest mb-1">{{ card.label }}</div>
        <div class="text-[28px] font-extrabold text-primary tracking-tighter leading-none">{{ card.value }}</div>
      </div>
    }
  </div>

  <!-- Charts row -->
  <div class="grid grid-cols-3 gap-4 mb-6">

    <!-- Growth chart -->
    <div class="col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div class="text-[13px] font-bold text-primary tracking-tight mb-4">Growth Analytics</div>
      <div style="height: 200px">
        <p-chart type="line" [data]="chartData" [options]="chartOptions" height="200" />
      </div>
    </div>

    <!-- Demographics -->
    <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div class="text-[13px] font-bold text-primary tracking-tight mb-4">Demographics</div>

      <div class="mb-3">
        <div class="flex justify-between text-[11px] font-medium mb-1">
          <span class="text-secondary">Women</span>
          <span class="font-bold text-primary">52%</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full" style="width: 52%"></div>
        </div>
      </div>

      <div class="mb-5">
        <div class="flex justify-between text-[11px] font-medium mb-1">
          <span class="text-secondary">Men</span>
          <span class="font-bold text-tertiary">48%</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-tertiary rounded-full" style="width: 48%"></div>
        </div>
      </div>

      <button
        (click)="goToMembers()"
        class="text-[11px] font-bold text-primary hover:text-primary-hover transition-colors tracking-tight"
      >
        Detailed Demographics Report →
      </button>
    </div>

  </div>

  <!-- Recent activity -->
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-50">
      <div class="text-[13px] font-bold text-primary tracking-tight">Recent Activity</div>
      <button
        (click)="goToMembers()"
        class="text-[11px] font-bold text-primary hover:underline tracking-tight"
      >
        View all →
      </button>
    </div>

    <table class="w-full text-[11px]">
      <thead>
        <tr class="border-b border-gray-50">
          <th class="text-left px-5 py-3 text-[9px] font-bold text-tertiary uppercase tracking-widest">Name</th>
          <th class="text-left px-5 py-3 text-[9px] font-bold text-tertiary uppercase tracking-widest">Role</th>
          <th class="text-left px-5 py-3 text-[9px] font-bold text-tertiary uppercase tracking-widest">Status</th>
          <th class="text-left px-5 py-3 text-[9px] font-bold text-tertiary uppercase tracking-widest">Last Updated</th>
        </tr>
      </thead>
      <tbody>
        @if (loading()) {
          <tr>
            <td colspan="4" class="px-5 py-8 text-center text-tertiary">Loading...</td>
          </tr>
        }
        @for (member of recentMembers(); track member.publicId) {
          <tr
            class="border-b border-gray-50 hover:bg-neutral cursor-pointer transition-colors"
            (click)="goToMember(member.publicId)"
          >
            <td class="px-5 py-3 font-semibold text-gray-800">
              {{ member.lastName }}{{ member.firstName }}
            </td>
            <td class="px-5 py-3">
              <span [class]="'status-badge ' + (member.role === 'ADMIN' ? 'badge-admin' : 'badge-member')">
                {{ member.role ?? 'MEMBER' }}
              </span>
            </td>
            <td class="px-5 py-3">
              <span [class]="'status-badge ' + statusBadgeClass(member.memberStatus)">
                {{ member.memberStatus }}
              </span>
            </td>
            <td class="px-5 py-3 text-tertiary">{{ member.updatedAt ? (member.updatedAt | date:'yyyy-MM-dd') : '—' }}</td>
          </tr>
        }
        @empty {
          <tr>
            <td colspan="4" class="px-5 py-8 text-center text-tertiary">No recent activity.</td>
          </tr>
        }
      </tbody>
    </table>
  </div>

</div>
```

- [ ] **Step 3: Verify home page loads at /**

```bash
ng serve
```

Navigate to http://localhost:4200. Expected: Liturgical Dashboard page with 4 stat cards, growth chart, demographics bars, and recent activity table.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/home/
git commit -m "feat(home): add HomeComponent — stat cards, growth chart, demographics, activity table"
```

---

## Task 7: Update MemberSummary model

**Files:**
- Modify: `src/app/core/models/member.model.ts`

The backend `Member` domain includes a `role: Role` (ADMIN | MEMBER) field. `MemberSummary` needs to expose it for the list and home page. `updatedAt` is needed for "Last Active" column.

- [ ] **Step 1: Add `role`, `baptism`, and `updatedAt` to MemberSummary**

In `src/app/core/models/member.model.ts`, replace the `MemberSummary` interface:

```typescript
/** Lightweight DTO — used in list view */
export interface MemberSummary {
  publicId: string;
  lastName: string;
  firstName: string;
  email: string | null;
  memberStatus: MemberStatus;
  role?: 'ADMIN' | 'MEMBER';
  baptism?: Baptism | null;
  groupName: string | null;
  updatedAt?: string; // ISO datetime string from BaseEntity
}
```

- [ ] **Step 2: Verify build**

```bash
ng build --configuration development 2>&1 | grep -E "error|warning" | head -20
```

Expected: no new TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/models/member.model.ts
git commit -m "feat(members): add role + baptism + updatedAt to MemberSummary DTO"
```

---

## Task 8: Restyle MembersListComponent

**Files:**
- Modify: `src/app/features/members/members-list/members-list.component.ts`
- Modify: `src/app/features/members/members-list/members-list.component.html`

The existing logic is correct. This task replaces the template to match DESIGN.md (filter dropdowns, pending banner, separate Approve/Edit columns, fit-content badges, `updatedAt` column).

- [ ] **Step 1: Update members-list.component.ts**

Replace the full file:

```typescript
// src/app/features/members/members-list/members-list.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { MemberService } from '../member.service';
import { MemberSummary, MemberStatus } from '../../../core/models/member.model';

type StatusFilter = MemberStatus | null;
type RoleFilter   = 'ADMIN' | 'MEMBER' | null;

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './members-list.component.html',
})
export class MembersListComponent implements OnInit {
  private readonly memberService  = inject(MemberService);
  private readonly router         = inject(Router);
  private readonly confirmService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  members      = signal<MemberSummary[]>([]);
  totalRecords = signal(0);
  pendingCount = signal(0);
  loading      = signal(false);
  searchTerm   = '';
  activeStatus = signal<StatusFilter>(null);
  activeRole   = signal<RoleFilter>(null);

  page = 0;
  size = 20;

  readonly roleOptions = [
    { label: 'All Roles', value: null },
    { label: 'Admin',     value: 'ADMIN' },
    { label: 'Member',    value: 'MEMBER' },
  ];

  readonly statusOptions = [
    { label: 'All Status', value: null     },
    { label: 'Active',     value: 'ACTIVE'  },
    { label: 'Inactive',   value: 'INACTIVE'},
    { label: 'Pending',    value: 'PENDING' },
    { label: 'Deleted',    value: 'DELETED' },
  ];

  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.loadPage(0);
    this.loadPendingCount();
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(term => { this.searchTerm = term; this.loadPage(0); });
  }

  private loadPendingCount(): void {
    this.memberService.getMembers({ status: 'PENDING', size: 1 }).subscribe({
      next: res => this.pendingCount.set(res.totalElements),
    });
  }

  loadPage(page: number): void {
    this.page = page;
    this.loading.set(true);
    this.memberService
      .getMembers({
        search: this.searchTerm,
        status: this.activeStatus(),
        page:   this.page,
        size:   this.size,
      })
      .subscribe({
        next: res => {
          this.members.set(res.content);
          this.totalRecords.set(res.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load members.' });
          this.loading.set(false);
        },
      });
  }

  onSearch(term: string): void { this.search$.next(term); }

  onStatusChange(value: StatusFilter): void {
    this.activeStatus.set(value);
    this.loadPage(0);
  }

  onRoleChange(value: RoleFilter): void {
    this.activeRole.set(value);
    this.loadPage(0);
  }

  showPendingOnly(): void {
    this.activeStatus.set('PENDING');
    this.loadPage(0);
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows  = event.rows  ?? this.size;
    this.size = rows;
    this.loadPage(first / rows);
  }

  goToDetail(member: MemberSummary): void { this.router.navigate(['/members', member.publicId]); }
  goToEdit(member: MemberSummary, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/members', member.publicId, 'edit']);
  }
  goToCreate(): void { this.router.navigate(['/members', 'new']); }

  confirmApprove(member: MemberSummary, event: Event): void {
    event.stopPropagation();
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: `Approve ${member.lastName}${member.firstName}?`,
      header: 'Approve Member',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Approve',
      rejectLabel: 'Cancel',
      accept: () => this.approveMember(member),
    });
  }

  private approveMember(member: MemberSummary): void {
    this.memberService.approveMember(member.publicId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Member approved.' });
        this.loadPage(this.page);
        this.loadPendingCount();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Approval failed.' });
      },
    });
  }

  statusBadgeClass(status: MemberStatus): string {
    const map: Record<MemberStatus, string> = {
      ACTIVE:   'badge-active',
      INACTIVE: 'badge-inactive',
      PENDING:  'badge-pending',
      DELETED:  'badge-deleted',
    };
    return map[status] ?? '';
  }

  roleBadgeClass(role?: string): string {
    return role === 'ADMIN' ? 'badge-admin' : 'badge-member';
  }

  showingFrom(): number { return this.page * this.size + 1; }
  showingTo(): number   { return Math.min((this.page + 1) * this.size, this.totalRecords()); }
}
```

- [ ] **Step 2: Replace members-list.component.html**

```html
<!-- src/app/features/members/members-list/members-list.component.html -->
<div class="p-6">

  <!-- Page title -->
  <div class="mb-5">
    <h1 class="text-[26px] font-extrabold text-primary tracking-tight">Congregation Core</h1>
    <p class="text-[13px] text-tertiary mt-1">Manage members, roles, and status.</p>
  </div>

  <!-- Pending banner -->
  @if (pendingCount() > 0) {
    <div class="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
      <span class="text-[12px] font-bold text-amber-700">
        ⚠️ {{ pendingCount() }} member{{ pendingCount() === 1 ? '' : 's' }} awaiting approval
      </span>
      <button
        (click)="showPendingOnly()"
        class="text-[11px] font-bold text-primary underline hover:no-underline tracking-tight"
      >
        Show pending only →
      </button>
    </div>
  }

  <!-- Filters row -->
  <div class="flex items-center gap-3 mb-5">
    <p-select
      [options]="roleOptions"
      optionLabel="label"
      optionValue="value"
      [ngModel]="activeRole()"
      (ngModelChange)="onRoleChange($event)"
      styleClass="h-9 text-[12px]"
      placeholder="All Roles"
    />
    <p-select
      [options]="statusOptions"
      optionLabel="label"
      optionValue="value"
      [ngModel]="activeStatus()"
      (ngModelChange)="onStatusChange($event)"
      styleClass="h-9 text-[12px]"
      placeholder="All Status"
    />
    <div class="flex-1 flex items-center gap-2 h-9 bg-white border border-gray-200 rounded-lg px-3">
      <i class="pi pi-search text-tertiary text-[12px]"></i>
      <input
        type="text"
        class="flex-1 outline-none text-[12px] bg-transparent placeholder:text-tertiary"
        placeholder="Search name or email..."
        [ngModel]="searchTerm"
        (ngModelChange)="onSearch($event)"
      />
    </div>
    <button
      (click)="goToCreate()"
      class="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[12px] font-bold hover:bg-primary-hover transition-colors tracking-tight whitespace-nowrap"
    >
      <i class="pi pi-plus text-[11px]"></i>
      Add Member
    </button>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <p-table
      [value]="members()"
      [loading]="loading()"
      [rows]="size"
      [totalRecords]="totalRecords()"
      [paginator]="false"
      [lazy]="true"
      (onLazyLoad)="onPageChange($event)"
      rowHover
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="header">
        <tr>
          <th class="w-64">Name</th>
          <th class="w-24">Role</th>
          <th class="w-24">Status</th>
          <th class="w-28">Baptism</th>
          <th class="w-32">Last Active</th>
          <th class="w-28">Approve</th>
          <th class="w-16">Edit</th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-member>
        <tr
          class="cursor-pointer border-b border-gray-50"
          [class.bg-purple-50]="member.memberStatus === 'PENDING'"
          (click)="goToDetail(member)"
        >
          <!-- Name -->
          <td class="px-4 py-3">
            <div class="text-[13px] font-semibold text-gray-800 tracking-tight">
              {{ member.lastName }}{{ member.firstName }}
            </div>
            <div class="text-[11px] text-tertiary">{{ member.email ?? '—' }}</div>
          </td>

          <!-- Role badge -->
          <td class="px-4 py-3">
            <span [class]="'status-badge ' + roleBadgeClass(member.role)">
              {{ member.role ?? 'MEMBER' }}
            </span>
          </td>

          <!-- Status badge -->
          <td class="px-4 py-3">
            <span [class]="'status-badge ' + statusBadgeClass(member.memberStatus)">
              {{ member.memberStatus }}
            </span>
          </td>

          <!-- Baptism -->
          <td class="px-4 py-3 text-[12px] text-secondary">
            {{ member.baptism ?? '—' }}
          </td>

          <!-- Last Active -->
          <td class="px-4 py-3 text-[12px] text-tertiary">
            {{ member.updatedAt ? (member.updatedAt | date:'yyyy-MM-dd') : '—' }}
          </td>

          <!-- Approve -->
          <td class="px-4 py-3" (click)="$event.stopPropagation()">
            @if (member.memberStatus === 'PENDING') {
              <button
                (click)="confirmApprove(member, $event)"
                class="flex items-center gap-1 h-7 px-3 bg-primary text-white rounded-md text-[11px] font-bold hover:bg-primary-hover transition-colors tracking-tight"
              >
                <i class="pi pi-check text-[9px]"></i>
                Approve
              </button>
            } @else {
              <span class="text-tertiary text-[12px]">—</span>
            }
          </td>

          <!-- Edit -->
          <td class="px-4 py-3" (click)="$event.stopPropagation()">
            <button
              (click)="goToEdit(member, $event)"
              class="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg text-secondary hover:text-primary hover:border-primary transition-colors"
            >
              <i class="pi pi-pencil text-[11px]"></i>
            </button>
          </td>
        </tr>
      </ng-template>

      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="7" class="text-center py-10 text-tertiary text-[13px]">
            No members found.
          </td>
        </tr>
      </ng-template>
    </p-table>

    <!-- Custom pagination footer -->
    <div class="flex items-center justify-between px-5 py-3 border-t border-gray-50 text-[11px] text-tertiary">
      <span>Showing {{ showingFrom() }}–{{ showingTo() }} of {{ totalRecords() }} members</span>
      <div class="flex gap-1">
        <button
          [disabled]="page === 0"
          (click)="loadPage(page - 1)"
          class="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:border-primary text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <i class="pi pi-chevron-left text-[9px]"></i>
        </button>
        <button
          [disabled]="showingTo() >= totalRecords()"
          (click)="loadPage(page + 1)"
          class="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:border-primary text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <i class="pi pi-chevron-right text-[9px]"></i>
        </button>
      </div>
    </div>
  </div>

</div>

<p-confirmDialog />
<p-toast />
```

- [ ] **Step 3: Verify members list renders correctly**

```bash
ng serve
```

Navigate to http://localhost:4200/members. Expected:
- Filter row with Role/Status dropdowns + search + Add Member button
- Table with 7 columns: Name, Role, Status, Baptism, Last Active, Approve, Edit
- Pending rows have subtle purple tint
- Approve button only on PENDING rows

- [ ] **Step 4: Commit**

```bash
git add src/app/features/members/members-list/
git commit -m "feat(members): restyle members-list to DESIGN.md — dropdowns, Approve/Edit columns, fit-content badges"
```

---

## Task 9: Restyle MemberDetailComponent

**Files:**
- Modify: `src/app/features/members/member-detail/member-detail.component.ts`
- Modify: `src/app/features/members/member-detail/member-detail.component.html`

Logic is already correct. This task reskins the template to match DESIGN.md.

- [ ] **Step 1: Update member-detail.component.ts — add statusBadgeClass helper**

Add one method to the existing component class (after `statusSeverity`):

```typescript
statusBadgeClass(status: MemberStatus): string {
  const map: Record<MemberStatus, string> = {
    ACTIVE:   'badge-active',
    INACTIVE: 'badge-inactive',
    PENDING:  'badge-pending',
    DELETED:  'badge-deleted',
  };
  return map[status] ?? '';
}

roleBadgeClass(role?: string | null): string {
  return role === 'ADMIN' ? 'badge-admin' : 'badge-member';
}
```

- [ ] **Step 2: Replace member-detail.component.html**

```html
<!-- src/app/features/members/member-detail/member-detail.component.html -->
<div class="p-6 max-w-3xl">

  <!-- Back + actions -->
  <div class="flex items-center gap-3 mb-6">
    <button
      (click)="goBack()"
      class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-secondary hover:text-primary hover:border-primary transition-colors"
    >
      <i class="pi pi-arrow-left text-[12px]"></i>
    </button>
    <h1 class="text-[22px] font-extrabold text-primary tracking-tight flex-1">
      @if (!loading() && member()) {
        {{ member()!.lastName }}{{ member()!.firstName }}
        @if (member()!.discriminator) {
          <span class="text-[14px] text-tertiary font-medium ml-2">({{ member()!.discriminator }})</span>
        }
      }
    </h1>
    @if (!loading() && member()) {
      <div class="flex gap-2">
        <button
          (click)="goToEdit()"
          class="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[12px] font-bold hover:bg-primary-hover transition-colors tracking-tight"
        >
          <i class="pi pi-pencil text-[11px]"></i>
          Edit
        </button>
        <button
          (click)="confirmDelete($event)"
          class="flex items-center gap-2 h-9 px-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[12px] font-bold hover:bg-red-100 transition-colors tracking-tight"
        >
          <i class="pi pi-trash text-[11px]"></i>
          Delete
        </button>
      </div>
    }
  </div>

  <!-- Loading -->
  @if (loading()) {
    <div class="flex justify-center py-16 text-tertiary text-[13px]">Loading...</div>
  }

  <!-- Detail card -->
  @if (!loading() && member()) {
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

      <!-- Avatar + name + badges -->
      <div class="flex items-center gap-4 mb-6 pb-6 border-b border-gray-50">
        <div class="w-14 h-14 rounded-full bg-primary text-white text-[18px] font-bold flex items-center justify-center flex-shrink-0">
          {{ member()!.lastName.slice(0, 1) }}
        </div>
        <div>
          <div class="text-[18px] font-extrabold text-primary tracking-tight">
            {{ member()!.lastName }}{{ member()!.firstName }}
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="status-badge badge-member">MEMBER</span>
            <span [class]="'status-badge ' + statusBadgeClass(member()!.memberStatus)">
              {{ member()!.memberStatus }}
            </span>
          </div>
        </div>
      </div>

      <!-- Fields grid -->
      <div class="grid grid-cols-2 gap-x-10 gap-y-4 text-[13px]">

        <div class="col-span-2 text-[9px] font-bold text-tertiary uppercase tracking-widest pb-1 border-b border-gray-50">
          Basic Info
        </div>

        <div>
          <div class="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Email</div>
          <div class="font-medium text-gray-800">{{ member()!.email ?? '—' }}</div>
        </div>
        <div>
          <div class="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Phone</div>
          <div class="font-medium text-gray-800">{{ member()!.phoneNumber ?? '—' }}</div>
        </div>
        <div>
          <div class="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Gender</div>
          <div class="font-medium text-gray-800">{{ genderLabel(member()!.gender) }}</div>
        </div>
        <div>
          <div class="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Date of Birth</div>
          <div class="font-medium text-gray-800">{{ member()!.birthDate ?? '—' }}</div>
        </div>

        <div class="col-span-2 text-[9px] font-bold text-tertiary uppercase tracking-widest pb-1 border-b border-gray-50 mt-2">
          Church Info
        </div>

        <div>
          <div class="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Baptism</div>
          <div class="font-medium text-gray-800">{{ baptismLabel(member()!.baptism) }}</div>
        </div>
        <div>
          <div class="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Church Role</div>
          <div class="font-medium text-gray-800">{{ member()!.churchRole ?? '—' }}</div>
        </div>
        <div>
          <div class="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Group</div>
          <div class="font-medium text-gray-800">{{ member()!.groupName ?? '—' }}</div>
        </div>
        <div>
          <div class="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Registration Date</div>
          <div class="font-medium text-gray-800">{{ member()!.registrationDate ?? '—' }}</div>
        </div>

        <div class="col-span-2 text-[9px] font-bold text-tertiary uppercase tracking-widest pb-1 border-b border-gray-50 mt-2">
          Address
        </div>

        <div class="col-span-2">
          <div class="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Address</div>
          <div class="font-medium text-gray-800">
            @if (member()!.street || member()!.city) {
              {{ member()!.street }} {{ member()!.zipCode }} {{ member()!.city }}
            } @else {
              —
            }
          </div>
        </div>

      </div>
    </div>
  }

  <!-- Not found -->
  @if (!loading() && !member()) {
    <div class="text-center py-16 text-tertiary text-[13px]">Member not found.</div>
  }

</div>

<p-confirmDialog />
<p-toast />
```

- [ ] **Step 3: Commit**

```bash
git add src/app/features/members/member-detail/
git commit -m "feat(members): restyle member-detail to DESIGN.md — card layout, status badges, section headings"
```

---

## Task 10: Restyle MemberEditComponent

**Files:**
- Modify: `src/app/features/members/member-edit/member-edit.component.html`

Logic is correct. Only the template header and card container need restyling to match design tokens.

- [ ] **Step 1: Replace only the outer wrapper in member-edit.component.html**

Replace the entire file:

```html
<!-- src/app/features/members/member-edit/member-edit.component.html -->
<div class="p-6 max-w-2xl">

  @if (loading()) {
    <div class="flex justify-center py-16 text-tertiary text-[13px]">Loading...</div>
  }

  @if (!loading()) {

    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button
        (click)="goBack()"
        class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-secondary hover:text-primary hover:border-primary transition-colors"
      >
        <i class="pi pi-arrow-left text-[12px]"></i>
      </button>
      <h1 class="text-[22px] font-extrabold text-primary tracking-tight">
        {{ isEdit() ? 'Edit Member' : 'Add Member' }}
      </h1>
    </div>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <form [formGroup]="form" (ngSubmit)="save()">

        <!-- 기본 정보 -->
        <div class="text-[9px] font-bold text-tertiary uppercase tracking-widest mb-4">Basic Info</div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Last Name <span class="text-red-500">*</span></label>
            <input
              pInputText
              formControlName="lastName"
              placeholder="Last name"
              class="w-full text-[13px]"
              [class.ng-invalid]="form.get('lastName')!.invalid && form.get('lastName')!.touched"
            />
            @if (form.get('lastName')!.invalid && form.get('lastName')!.touched) {
              <small class="text-red-500 text-[11px]">Required.</small>
            }
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">First Name <span class="text-red-500">*</span></label>
            <input
              pInputText
              formControlName="firstName"
              placeholder="First name"
              class="w-full text-[13px]"
              [class.ng-invalid]="form.get('firstName')!.invalid && form.get('firstName')!.touched"
            />
            @if (form.get('firstName')!.invalid && form.get('firstName')!.touched) {
              <small class="text-red-500 text-[11px]">Required.</small>
            }
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Discriminator</label>
            <input pInputText formControlName="discriminator" placeholder="e.g. 1남" class="w-full text-[13px]" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Gender</label>
            <p-select formControlName="gender" [options]="genderOptions" optionLabel="label" optionValue="value" placeholder="Select" class="w-full" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Date of Birth</label>
            <p-datepicker formControlName="birthDate" dateFormat="yy-mm-dd" placeholder="YYYY-MM-DD" [showIcon]="true" class="w-full" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Phone</label>
            <input pInputText formControlName="phoneNumber" placeholder="010-0000-0000" class="w-full text-[13px]" />
          </div>

          <div class="flex flex-col gap-1 col-span-2">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Email</label>
            <input
              pInputText
              formControlName="email"
              type="email"
              placeholder="example@domain.com"
              class="w-full text-[13px]"
              [class.ng-invalid]="form.get('email')!.invalid && form.get('email')!.touched"
            />
            @if (form.get('email')!.invalid && form.get('email')!.touched) {
              <small class="text-red-500 text-[11px]">Invalid email format.</small>
            }
          </div>
        </div>

        <!-- 교회 정보 -->
        <div class="text-[9px] font-bold text-tertiary uppercase tracking-widest mb-4">Church Info</div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Baptism</label>
            <p-select formControlName="baptism" [options]="baptismOptions" optionLabel="label" optionValue="value" placeholder="Select" class="w-full" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Church Role</label>
            <input pInputText formControlName="churchRole" placeholder="e.g. 집사, 권사" class="w-full text-[13px]" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Registration Date</label>
            <p-datepicker formControlName="registrationDate" dateFormat="yy-mm-dd" placeholder="YYYY-MM-DD" [showIcon]="true" class="w-full" />
          </div>

          @if (isEdit()) {
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Status</label>
              <p-select formControlName="memberStatus" [options]="statusOptions" optionLabel="label" optionValue="value" placeholder="Select" class="w-full" />
            </div>
          }
        </div>

        <!-- 주소 -->
        <div class="text-[9px] font-bold text-tertiary uppercase tracking-widest mb-4">Address</div>

        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="flex flex-col gap-1 col-span-2">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Street</label>
            <input pInputText formControlName="street" placeholder="Street address" class="w-full text-[13px]" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">Zip Code</label>
            <input pInputText formControlName="zipCode" placeholder="00000" class="w-full text-[13px]" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-secondary uppercase tracking-widest">City</label>
            <input pInputText formControlName="city" placeholder="City" class="w-full text-[13px]" />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            (click)="goBack()"
            class="h-9 px-5 rounded-lg border border-gray-200 text-secondary text-[12px] font-semibold hover:border-gray-300 transition-colors tracking-tight"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="saving()"
            class="flex items-center gap-2 h-9 px-5 bg-primary text-white rounded-lg text-[12px] font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 tracking-tight"
          >
            <i [class]="saving() ? 'pi pi-spin pi-spinner text-[11px]' : 'pi pi-check text-[11px]'"></i>
            {{ isEdit() ? 'Save Changes' : 'Add Member' }}
          </button>
        </div>

      </form>
    </div>

  }

</div>

<p-toast />
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/members/member-edit/member-edit.component.html
git commit -m "feat(members): restyle member-edit to DESIGN.md — design tokens, section labels, button styles"
```

---

## Task 11: Final verification + update MVP.md

- [ ] **Step 1: Full build verification**

```bash
cd /path/to/dn-app-dashboard
ng build 2>&1 | tail -30
```

Expected: successful build with no errors.

- [ ] **Step 2: Smoke test all routes**

Start the dev server:
```bash
ng serve
```

Check each route:
- `http://localhost:4200/` → Home dashboard: stat cards, chart, activity table
- `http://localhost:4200/members` → Members list: filter row, table, pending banner if any PENDING members
- `http://localhost:4200/members/:publicId` → Detail card with back/edit/delete
- `http://localhost:4200/members/:publicId/edit` → Edit form
- `http://localhost:4200/members/new` → Create form
- Sidebar: collapse/expand toggle, state persists on refresh

- [ ] **Step 3: Update MVP.md build status**

In `MVP.md`, update the build order table:

```markdown
| 1 | Member Management | ✅ | ✅ | 🔲 |
```

- [ ] **Step 4: Update CHANGELOG.md**

Add a new entry at the top of `CHANGELOG.md`:

```markdown
## [Unreleased] — 2026-03-30

### Added
- Shell: decomposed into SidebarComponent + HeaderComponent per DESIGN.md spec
- Shell: Manrope font, design tokens (#2B3A67 primary palette), CSS variables
- Shell: collapsible sidebar (256px ↔ 72px), localStorage persisted, 3px left accent bar on active nav
- Home: Liturgical Dashboard — stat cards, growth chart, demographics panel, recent activity table
- Members: restyled list — filter dropdowns, PENDING banner, separate Approve/Edit columns, fit-content status badges
- Members: restyled detail and edit pages to DESIGN.md card layout
```

- [ ] **Step 5: Final commit**

```bash
cd /path/to/dn-app  # backend repo (where MVP.md and CHANGELOG.md live)
git add MVP.md CHANGELOG.md
git commit -m "docs: mark F1 dashboard ✅ in MVP + update CHANGELOG for session 4"
```

```bash
cd /path/to/dn-app-dashboard
git add -A
git commit -m "chore: final cleanup — F1 dashboard complete"
```
