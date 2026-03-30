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
    { label: 'Home',       icon: 'pi pi-home',          route: '/'           },
    { label: 'Members',    icon: 'pi pi-users',         route: '/members'    },
    { label: 'Ministry',   icon: 'pi pi-sitemap',       route: '/ministry'   },
    { label: 'Attendance', icon: 'pi pi-calendar-check',route: '/attendance' },
    { label: 'Analytics',  icon: 'pi pi-chart-bar',     route: '/analytics'  },
    { label: 'Settings',   icon: 'pi pi-cog',           route: '/settings'   },
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
