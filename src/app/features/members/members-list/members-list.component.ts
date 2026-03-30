// src/app/features/members/members-list/members-list.component.ts
import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { MemberService } from '../member.service';
import { MemberSummary, MemberStatus } from '../../../core/models/member.model';

type StatusFilter = MemberStatus | null;
type RoleFilter   = 'ADMIN' | 'MEMBER' | null;

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './members-list.component.html',
})
export class MembersListComponent implements OnInit {
  private readonly memberService  = inject(MemberService);
  private readonly router         = inject(Router);
  private readonly confirmService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef     = inject(DestroyRef);

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
    { label: 'All Status', value: null      },
    { label: 'Active',     value: 'ACTIVE'  },
    { label: 'Inactive',   value: 'INACTIVE'},
    { label: 'Pending',    value: 'PENDING' },
    { label: 'Deleted',    value: 'DELETED' },
  ];

  private readonly search$ = new Subject<string>();
  private readonly loadTrigger$ = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.search$.complete());
    this.destroyRef.onDestroy(() => this.loadTrigger$.complete());

    this.loadTrigger$
      .pipe(
        switchMap(() =>
          this.memberService.getMembers({
            search: this.searchTerm,
            status: this.activeStatus(),
            role: this.activeRole() ?? undefined,
            page: this.page,
            size: this.size,
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
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

    this.loadPendingCount();
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => { this.searchTerm = term; this.loadPage(0); });
  }

  private loadPendingCount(): void {
    this.memberService.getMembers({ status: 'PENDING', size: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: res => this.pendingCount.set(res.totalElements) });
  }

  loadPage(page: number): void {
    this.page = page;
    this.loading.set(true);
    this.loadTrigger$.next();
  }

  onSearch(term: string): void { this.search$.next(term); }

  onStatusChange(value: StatusFilter): void { this.activeStatus.set(value); this.loadPage(0); }
  onRoleChange(value: RoleFilter): void     { this.activeRole.set(value);   this.loadPage(0); }
  showPendingOnly(): void                   { this.activeStatus.set('PENDING'); this.loadPage(0); }

  onPageChange(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows  = event.rows  ?? this.size;
    this.size = rows;
    this.loadPage(first / rows);
  }

  goToDetail(member: MemberSummary): void { this.router.navigate(['/members', member.publicId]); }
  goToEdit(member: MemberSummary, event: Event): void { event.stopPropagation(); this.router.navigate(['/members', member.publicId, 'edit']); }
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
    this.memberService.approveMember(member.publicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Member approved.' }); this.loadPage(this.page); this.loadPendingCount(); },
        error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Approval failed.' }); },
      });
  }

  statusBadgeClass(status: MemberStatus): string {
    const map: Record<MemberStatus, string> = { ACTIVE: 'badge-active', INACTIVE: 'badge-inactive', PENDING: 'badge-pending', DELETED: 'badge-deleted' };
    return map[status] ?? '';
  }

  roleBadgeClass(role?: string): string { return role === 'ADMIN' ? 'badge-admin' : 'badge-member'; }

  showingFrom(): number { return this.page * this.size + 1; }
  showingTo(): number   { return Math.min((this.page + 1) * this.size, this.totalRecords()); }
}
