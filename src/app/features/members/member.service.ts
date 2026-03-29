import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { PageResponse } from '../../core/models/api-response.model';
import {
  Member,
  MemberSummary,
  MemberStatus,
  CreateMemberRequest,
  UpdateMemberRequest,
} from '../../core/models/member.model';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly api = inject(ApiService);

  getMembers(params: {
    search?: string;
    status?: MemberStatus | null;
    page?: number;
    size?: number;
  }): Observable<PageResponse<MemberSummary>> {
    const qp: Record<string, string | number | boolean> = {
      page: params.page ?? 0,
      size: params.size ?? 20,
    };
    if (params.search?.trim()) qp['search'] = params.search.trim();
    if (params.status)         qp['status'] = params.status;
    return this.api.get<PageResponse<MemberSummary>>('/v1/members', qp);
  }

  approveMember(publicId: string): Observable<Member> {
    return this.api.patch<Member>(`/v1/members/${publicId}`, { memberStatus: 'ACTIVE' });
  }

  getMember(publicId: string): Observable<Member> {
    return this.api.get<Member>(`/v1/members/${publicId}`);
  }

  createMember(req: CreateMemberRequest): Observable<Member> {
    return this.api.post<Member>('/v1/members', req);
  }

  updateMember(publicId: string, req: UpdateMemberRequest): Observable<Member> {
    return this.api.patch<Member>(`/v1/members/${publicId}`, req);
  }

  deleteMember(publicId: string): Observable<void> {
    return this.api.delete(`/v1/members/${publicId}`);
  }
}
