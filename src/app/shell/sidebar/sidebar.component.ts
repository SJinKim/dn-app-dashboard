import { Component, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  imports: [RouterModule, TooltipModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly collapsed = signal(
    isPlatformBrowser(this.platformId) &&
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  readonly sidebarWidth = computed(() =>
    this.collapsed() ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)'
  );

  readonly userInitials = computed(() => {
    const name = this.auth.username();
    return name ? name.slice(0, 2).toUpperCase() : 'AU';
  });

  readonly navItems: NavItem[] = [
    { label: 'Home',       icon: 'pi pi-home',          route: '/'           },
    { label: 'Members',    icon: 'pi pi-users',         route: '/members'    },
    { label: 'Ministry',   icon: 'pi pi-sitemap',       route: '/ministry'   },
    { label: 'Attendance', icon: 'pi pi-calendar-check',route: '/attendance' },
    { label: 'Analytics',  icon: 'pi pi-chart-bar',     route: '/analytics'  },
    { label: 'Settings',   icon: 'pi pi-cog',           route: '/settings'   },
  ];

  toggleCollapse(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sidebar-collapsed', String(next));
    }
  }
}
