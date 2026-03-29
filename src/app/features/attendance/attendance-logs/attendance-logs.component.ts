import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { AttendanceService } from '../attendance.service';
import { AttendanceLogDto } from '../attendance.model';

@Component({
  selector: 'app-attendance-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DatePickerModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './attendance-logs.component.html',
})
export class AttendanceLogsComponent implements OnInit {
  private readonly service    = inject(AttendanceService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly messageSvc = inject(MessageService);

  definitionPublicId = '';
  definitionTitle    = signal('출석 로그');
  logs               = signal<AttendanceLogDto[]>([]);
  loading            = signal(false);

  /** PrimeNG DatePicker range: [from, to] */
  dateRange: Date[] | null = null;

  ngOnInit(): void {
    this.definitionPublicId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);

    const params: { definitionId: string; from?: string; to?: string } = {
      definitionId: this.definitionPublicId,
    };

    if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      params.from = this.toIsoDate(this.dateRange[0]);
      params.to   = this.toIsoDate(this.dateRange[1]);
    }

    this.service.getLogs(params).subscribe({
      next: logs => {
        this.logs.set(logs);
        if (logs.length > 0 && this.definitionTitle() === '출석 로그') {
          this.definitionTitle.set(logs[0].definitionTitle);
        }
        this.loading.set(false);
      },
      error: () => {
        this.messageSvc.add({ severity: 'error', summary: '오류', detail: '로그를 불러올 수 없습니다.' });
        this.loading.set(false);
      },
    });
  }

  onDateRangeSelect(dates: Date[]): void {
    if (dates && dates.length === 2 && dates[0] && dates[1]) {
      this.loadLogs();
    }
  }

  clearDateRange(): void {
    this.dateRange = null;
    this.loadLogs();
  }

  goBack(): void {
    this.router.navigate(['/attendance']);
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
