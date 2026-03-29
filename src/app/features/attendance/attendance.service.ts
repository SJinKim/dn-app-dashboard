import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import {
  AttendanceLogDto,
  CreateDefinitionRequest,
  DefinitionDto,
  UpdateDefinitionRequest,
} from './attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly api = inject(ApiService);

  getDefinitions(activeOnly = false): Observable<DefinitionDto[]> {
    return this.api.get<DefinitionDto[]>('/v1/attendance/definitions', { active: activeOnly });
  }

  createDefinition(req: CreateDefinitionRequest): Observable<DefinitionDto> {
    return this.api.post<DefinitionDto>('/v1/attendance/definitions', req);
  }

  updateDefinition(publicId: string, req: UpdateDefinitionRequest): Observable<DefinitionDto> {
    return this.api.patch<DefinitionDto>(`/v1/attendance/definitions/${publicId}`, req);
  }

  deactivateDefinition(publicId: string): Observable<void> {
    return this.api.delete(`/v1/attendance/definitions/${publicId}`);
  }

  getLogs(params: {
    definitionId?: string;
    from?: string;
    to?: string;
  }): Observable<AttendanceLogDto[]> {
    const qp: Record<string, string | number | boolean> = {};
    if (params.definitionId) qp['definitionId'] = params.definitionId;
    if (params.from) qp['from'] = params.from;
    if (params.to) qp['to'] = params.to;
    return this.api.get<AttendanceLogDto[]>('/v1/attendance/logs', qp);
  }
}
