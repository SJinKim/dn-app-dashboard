import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { MemberService } from '../member.service';
import { MemberSummary, MemberStatus, MEMBER_STATUS_LABELS } from '../../../core/models/member.model';

type StatusFilter = MemberStatus | null;

interface StatusTab {
  label: string;
  value: StatusFilter;
}

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
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
  loading      = signal(false);
  searchTerm   = '';
  activeStatus = signal<StatusFilter>(null);

  page = 0;
  size = 20;

  readonly statusTabs: StatusTab[] = [
    { label: '전체',   value: null },
    { label: '대기중', value: 'PENDING' },
    { label: '활성',   value: 'ACTIVE' },
    { label: '비활성', value: 'INACTIVE' },
  ];

  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.loadPage(0);
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(term => { this.searchTerm = term; this.loadPage(0); });
  }

  loadPage(page: number): void {
    this.page = page;
    this.loading.set(true);
    this.memberService
      .getMembers({ search: this.searchTerm, status: this.activeStatus(), page: this.page, size: this.size })
      .subscribe({
        next: res => {
          this.members.set(res.content);
          this.totalRecords.set(res.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: '오류', detail: '회원 목록을 불러올 수 없습니다.' });
          this.loading.set(false);
        },
      });
  }

  onSearch(term: string): void { this.search$.next(term); }

  onStatusTab(status: StatusFilter): void {
    this.activeStatus.set(status);
    this.loadPage(0);
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows  = event.rows  ?? this.size;
    this.size = rows;
    this.loadPage(first / rows);
  }

  goToDetail(member: MemberSummary): void { this.router.navigate(['/members', member.publicId]); }
  goToCreate(): void { this.router.navigate(['/members', 'new']); }

  confirmApprove(member: MemberSummary, event: Event): void {
    const action = member.memberStatus === 'PENDING' ? '승인' : '재활성';
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: `${member.lastName}${member.firstName} 회원을 ${action}하시겠습니까?`,
      header: `회원 ${action}`,
      icon: 'pi pi-check-circle',
      acceptLabel: action,
      rejectLabel: '취소',
      accept: () => this.approveMember(member),
    });
  }

  private approveMember(member: MemberSummary): void {
    this.memberService.approveMember(member.publicId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: '완료', detail: '승인되었습니다.' });
        this.loadPage(this.page);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: '오류', detail: '승인에 실패했습니다.' });
      },
    });
  }

  confirmDelete(member: MemberSummary, event: Event): void {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: `${member.lastName}${member.firstName} 회원을 삭제하시겠습니까?`,
      header: '회원 삭제',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '삭제',
      rejectLabel: '취소',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteMember(member),
    });
  }

  private deleteMember(member: MemberSummary): void {
    this.memberService.deleteMember(member.publicId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: '완료', detail: '삭제되었습니다.' });
        this.loadPage(this.page);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: '오류', detail: '삭제에 실패했습니다.' });
      },
    });
  }

  statusLabel(status: MemberStatus): string {
    return MEMBER_STATUS_LABELS[status] ?? status;
  }

  statusSeverity(status: MemberStatus): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'PENDING':  return 'warn';
      case 'ACTIVE':   return 'success';
      case 'INACTIVE': return 'secondary';
      default:         return 'danger';
    }
  }
}
