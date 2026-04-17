import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AttendanceService } from '../attendance.service';
import {
  DefinitionDto,
  DayOfWeek,
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_OPTIONS,
} from '../attendance.model';

@Component({
  selector: 'app-attendance-definitions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './attendance-definitions.component.html',
})
export class AttendanceDefinitionsComponent implements OnInit {
  private readonly service      = inject(AttendanceService);
  private readonly router       = inject(Router);
  private readonly confirmSvc   = inject(ConfirmationService);
  private readonly messageSvc   = inject(MessageService);
  private readonly destroyRef   = inject(DestroyRef);

  definitions    = signal<DefinitionDto[]>([]);
  loading        = signal(false);
  showCreate     = signal(false);
  showEditDialog = false;

  readonly dayOptions = DAY_OF_WEEK_OPTIONS;

  // create form state
  createTitle       = '';
  createDayOfWeek: DayOfWeek | null = null;
  createWindowStart = '';
  createWindowEnd   = '';

  // edit form state
  editTarget: DefinitionDto | null = null;
  editTitle       = '';
  editDayOfWeek: DayOfWeek | null = null;
  editWindowStart = '';
  editWindowEnd   = '';
  editIsActive    = true;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getDefinitions(false).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: defs => {
        this.definitions.set(defs);
        this.loading.set(false);
      },
      error: () => {
        this.messageSvc.add({ severity: 'error', summary: '오류', detail: '출석 정의를 불러올 수 없습니다.' });
        this.loading.set(false);
      },
    });
  }

  dayLabel(day: DayOfWeek): string {
    return DAY_OF_WEEK_LABELS[day];
  }

  formatTime(time: string): string {
    return time?.slice(0, 5) ?? '';
  }

  onCreateSubmit(): void {
    if (!this.createTitle.trim() || !this.createDayOfWeek || !this.createWindowStart || !this.createWindowEnd) {
      this.messageSvc.add({ severity: 'warn', summary: '입력 오류', detail: '모든 항목을 입력해주세요.' });
      return;
    }
    this.service.createDefinition({
      title: this.createTitle.trim(),
      dayOfWeek: this.createDayOfWeek,
      windowStart: this.createWindowStart,
      windowEnd: this.createWindowEnd,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageSvc.add({ severity: 'success', summary: '완료', detail: '출석 정의가 생성되었습니다.' });
        this.resetCreateForm();
        this.showCreate.set(false);
        this.load();
      },
      error: err => {
        const detail = err?.message ?? '생성에 실패했습니다.';
        this.messageSvc.add({ severity: 'error', summary: '오류', detail });
      },
    });
  }

  openEdit(def: DefinitionDto): void {
    this.editTarget    = def;
    this.editTitle     = def.title;
    this.editDayOfWeek = def.dayOfWeek;
    this.editWindowStart = def.windowStart.slice(0, 5);
    this.editWindowEnd   = def.windowEnd.slice(0, 5);
    this.editIsActive  = def.isActive;
    this.showEditDialog = true;
  }

  onEditSave(): void {
    if (!this.editTarget) return;
    this.service.updateDefinition(this.editTarget.publicId, {
      title:       this.editTitle.trim() || undefined,
      dayOfWeek:   this.editDayOfWeek ?? undefined,
      windowStart: this.editWindowStart || undefined,
      windowEnd:   this.editWindowEnd || undefined,
      isActive:    this.editIsActive,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageSvc.add({ severity: 'success', summary: '완료', detail: '수정되었습니다.' });
        this.showEditDialog = false;
        this.load();
      },
      error: err => {
        const detail = err?.message ?? '수정에 실패했습니다.';
        this.messageSvc.add({ severity: 'error', summary: '오류', detail });
      },
    });
  }

  confirmDeactivate(def: DefinitionDto, event: Event): void {
    this.confirmSvc.confirm({
      target: event.target as EventTarget,
      message: `"${def.title}" 출석 정의를 비활성화하시겠습니까?`,
      header: '비활성화 확인',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '비활성화',
      rejectLabel: '취소',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deactivate(def),
    });
  }

  private deactivate(def: DefinitionDto): void {
    this.service.deactivateDefinition(def.publicId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageSvc.add({ severity: 'success', summary: '완료', detail: '비활성화되었습니다.' });
        this.load();
      },
      error: () => {
        this.messageSvc.add({ severity: 'error', summary: '오류', detail: '비활성화에 실패했습니다.' });
      },
    });
  }

  viewLogs(def: DefinitionDto): void {
    this.router.navigate(['/attendance', def.publicId, 'logs']);
  }

  private resetCreateForm(): void {
    this.createTitle       = '';
    this.createDayOfWeek   = null;
    this.createWindowStart = '';
    this.createWindowEnd   = '';
  }
}
