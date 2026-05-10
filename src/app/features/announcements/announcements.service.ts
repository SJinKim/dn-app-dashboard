import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import {
  AnnouncementDto,
  CreateAnnouncementRequest,
} from './announcements.model';

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private readonly api = inject(ApiService);

  getAnnouncements(): Observable<AnnouncementDto[]> {
    return this.api.get<AnnouncementDto[]>('/v1/announcements');
  }

  createAnnouncement(req: CreateAnnouncementRequest): Observable<AnnouncementDto> {
    return this.api.post<AnnouncementDto>('/v1/announcements', req);
  }
}
