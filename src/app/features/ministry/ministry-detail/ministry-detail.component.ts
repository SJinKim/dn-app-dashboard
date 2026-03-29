import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

import { MinistryService } from '../ministry.service';
import { Ministry, RegistrationDto } from '../ministry.model';

@Component({
  selector: 'app-ministry-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './ministry-detail.component.html',
})
export class MinistryDetailComponent implements OnInit {
  private readonly ministryService = inject(MinistryService);
  private readonly route           = inject(ActivatedRoute);
  private readonly router          = inject(Router);
  private readonly confirmService  = inject(ConfirmationService);
  private readonly messageService  = inject(MessageService);

  ministry      = signal<Ministry | null>(null);
  registrations = signal<RegistrationDto[]>([]);
  loading       = signal(true);
  regsLoading   = signal(false);
  periodFilter  = '';

  private publicId = '';

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId')!;
    this.loadMinistry();
    this.loadRegistrations();
  }

  private loadMinistry(): void {
    this.ministryService.getMinistry(this.publicId).subscribe({
      next: m => { this.ministry.set(m); this.loading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: '오류', detail: '부서 정보를 불러올 수 없습니다.' });
        this.loading.set(false);
      },
    });
  }

  loadRegistrations(): void {
    this.regsLoading.set(true);
    const period = this.periodFilter.trim() || undefined;
    this.ministryService.getRegistrations(this.publicId, period).subscribe({
      next: list => { this.registrations.set(list); this.regsLoading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: '오류', detail: '등록 목록을 불러올 수 없습니다.' });
        this.regsLoading.set(false);
      },
    });
  }

  goToEdit(): void { this.router.navigate(['/ministry', this.publicId, 'edit']); }
  goBack(): void   { this.router.navigate(['/ministry']); }

  confirmRemoveRegistration(reg: RegistrationDto, event: Event): void {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: `${reg.memberName} 의 등록을 삭제하시겠습니까?`,
      header: '등록 삭제',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '삭제',
      rejectLabel: '취소',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.removeRegistration(reg),
    });
  }

  private removeRegistration(reg: RegistrationDto): void {
    this.ministryService.removeRegistration(this.publicId, reg.publicId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: '완료', detail: '삭제되었습니다.' });
        this.loadRegistrations();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: '오류', detail: '삭제에 실패했습니다.' });
      },
    });
  }
}
