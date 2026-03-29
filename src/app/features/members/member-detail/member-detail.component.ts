import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { MemberService } from '../member.service';
import {
  Member,
  MemberStatus,
  MEMBER_STATUS_LABELS,
  GENDER_LABELS,
  BAPTISM_LABELS,
} from '../../../core/models/member.model';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './member-detail.component.html',
})
export class MemberDetailComponent implements OnInit {
  private readonly memberService  = inject(MemberService);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly confirmService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  member  = signal<Member | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const publicId = this.route.snapshot.paramMap.get('publicId')!;
    this.memberService.getMember(publicId).subscribe({
      next:  m   => { this.member.set(m); this.loading.set(false); },
      error: ()  => {
        this.messageService.add({ severity: 'error', summary: '오류', detail: '회원 정보를 불러올 수 없습니다.' });
        this.loading.set(false);
      },
    });
  }

  goToEdit(): void {
    this.router.navigate(['/members', this.member()!.publicId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/members']);
  }

  confirmDelete(event: Event): void {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: '이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      header: '회원 삭제',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '삭제',
      rejectLabel: '취소',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.memberService.deleteMember(this.member()!.publicId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: '완료', detail: '삭제되었습니다.' });
            setTimeout(() => this.router.navigate(['/members']), 1000);
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: '오류', detail: '삭제에 실패했습니다.' });
          },
        });
      },
    });
  }

  statusLabel(status: MemberStatus): string  { return MEMBER_STATUS_LABELS[status]; }
  genderLabel(g: string | null): string       { return g ? (GENDER_LABELS[g as keyof typeof GENDER_LABELS] ?? g) : '—'; }
  baptismLabel(b: string | null): string      { return b ? (BAPTISM_LABELS[b as keyof typeof BAPTISM_LABELS] ?? b) : '—'; }

  statusSeverity(status: MemberStatus): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'ACTIVE':   return 'success';
      case 'INACTIVE': return 'warn';
      default:         return 'danger';
    }
  }
}
