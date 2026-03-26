import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { MemberService } from '../member.service';
import { MemberSummary, MemberStatus, MEMBER_STATUS_LABELS } from '../../../core/models/member.model';

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
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './members-list.component.html',
})
export class MembersListComponent implements OnInit {
  private readonly memberService   = inject(MemberService);
  private readonly router          = inject(Router);
  private readonly confirmService  = inject(ConfirmationService);
  private readonly messageService  = inject(MessageService);

  members       = signal<MemberSummary[]>([]);
  totalRecords  = signal(0);
  loading       = signal(false);
  searchTerm    = '';

  page = 0;
  size = 20;

  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.loadPage(0);

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(term => {
        this.searchTerm = term;
        this.loadPage(0);
      });
  }

  loadPage(page: number): void {
    this.page = page;
    this.loading.set(true);
    this.memberService
      .getMembers({ search: this.searchTerm, page: this.page, size: this.size })
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

  onSearch(term: string): void {
    this.search$.next(term);
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.size = event.rows;
    this.loadPage(event.first / event.rows);
  }

  goToDetail(member: MemberSummary): void {
    this.router.navigate(['/members', member.publicId]);
  }

  goToCreate(): void {
    this.router.navigate(['/members', 'new']);
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
    return MEMBER_STATUS_LABELS[status];
  }

  statusSeverity(status: MemberStatus): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'ACTIVE':   return 'success';
      case 'INACTIVE': return 'warn';
      case 'DELETED':  return 'danger';
    }
  }
}
