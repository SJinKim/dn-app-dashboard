import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { AnnouncementsService } from '../announcements.service';
import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  ANNOUNCEMENT_CATEGORY_OPTIONS,
  AnnouncementCategory,
  AnnouncementDto,
} from '../announcements.model';

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CheckboxModule,
    DatePickerModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './announcements-list.component.html',
})
export class AnnouncementsListComponent implements OnInit {
  private readonly service    = inject(AnnouncementsService);
  private readonly messageSvc = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  announcements = signal<AnnouncementDto[]>([]);
  loading       = signal(false);
  showCreate    = signal(false);

  readonly categoryOptions = ANNOUNCEMENT_CATEGORY_OPTIONS;

  // create form state
  createTitle    = '';
  createBody     = '';
  createCategory: AnnouncementCategory | null = null;
  createStartAt: Date | null = null;
  createEndAt:   Date | null = null;
  createIsPinned = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAnnouncements().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: items => {
        this.announcements.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.messageSvc.add({ severity: 'error', summary: '오류', detail: '공지를 불러올 수 없습니다.' });
        this.loading.set(false);
      },
    });
  }

  categoryLabel(category: AnnouncementCategory): string {
    return ANNOUNCEMENT_CATEGORY_LABELS[category];
  }

  formatDateTime(value: string | null): string {
    if (!value) return '-';
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString();
  }

  onCreateSubmit(): void {
    if (!this.createTitle.trim() || !this.createBody.trim() || !this.createCategory || !this.createStartAt) {
      this.messageSvc.add({ severity: 'warn', summary: '입력 오류', detail: '제목, 내용, 분류, 시작일은 필수입니다.' });
      return;
    }
    this.service.createAnnouncement({
      title:    this.createTitle.trim(),
      body:     this.createBody.trim(),
      category: this.createCategory,
      startAt:  this.createStartAt.toISOString(),
      endAt:    this.createEndAt ? this.createEndAt.toISOString() : null,
      isPinned: this.createIsPinned,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageSvc.add({ severity: 'success', summary: '완료', detail: '공지가 생성되었습니다.' });
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

  private resetCreateForm(): void {
    this.createTitle    = '';
    this.createBody     = '';
    this.createCategory = null;
    this.createStartAt  = null;
    this.createEndAt    = null;
    this.createIsPinned = false;
  }
}
