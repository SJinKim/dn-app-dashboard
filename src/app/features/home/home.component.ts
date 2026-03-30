// src/app/features/home/home.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
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
  imports: [CommonModule, ChartModule, DatePipe],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly router        = inject(Router);

  readonly loading       = signal(true);
  readonly recentMembers = signal<MemberSummary[]>([]);

  private totalMembers  = signal(0);
  private activeMembers = signal(0);
  private pendingCount  = signal(0);

  readonly statCards = signal<StatCard[]>([]);

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
    this.memberService.getMembers({ size: 1 }).subscribe({
      next: res => { this.totalMembers.set(res.totalElements); this.refreshStatCards(); },
    });
    this.memberService.getMembers({ status: 'ACTIVE', size: 1 }).subscribe({
      next: res => { this.activeMembers.set(res.totalElements); this.refreshStatCards(); },
    });
    this.memberService.getMembers({ status: 'PENDING', size: 1 }).subscribe({
      next: res => { this.pendingCount.set(res.totalElements); this.refreshStatCards(); },
    });
    this.memberService.getMembers({ size: 10 }).subscribe({
      next: res => { this.recentMembers.set(res.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private refreshStatCards(): void {
    this.statCards.set([
      { label: 'TOTAL MEMBERS',    value: this.totalMembers().toLocaleString(),  badge: '+12%',    badgeClass: 'badge-active',   icon: 'pi pi-users'          },
      { label: 'ACTIVE THIS WEEK', value: this.activeMembers().toLocaleString(), badge: '+3%',     badgeClass: 'badge-active',   icon: 'pi pi-check-circle'   },
      { label: 'PENDING APPROVALS',value: this.pendingCount().toLocaleString(),  badge: 'Pending', badgeClass: 'badge-pending',  icon: 'pi pi-clock'          },
      { label: 'AVG. ATTENDANCE',  value: '—',                                   badge: 'N/A',     badgeClass: 'badge-inactive', icon: 'pi pi-calendar-check' },
    ]);
  }

  statusBadgeClass(status: MemberStatus): string {
    const map: Record<MemberStatus, string> = {
      ACTIVE: 'badge-active', INACTIVE: 'badge-inactive',
      PENDING: 'badge-pending', DELETED: 'badge-deleted',
    };
    return map[status] ?? 'badge-member';
  }

  goToMembers(): void { this.router.navigate(['/members']); }
  goToMember(publicId: string): void { this.router.navigate(['/members', publicId]); }
}
