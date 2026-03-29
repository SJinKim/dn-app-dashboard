import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { MemberService } from '../member.service';
import {
  MEMBER_STATUS_OPTIONS,
  GENDER_OPTIONS,
  BAPTISM_OPTIONS,
  Member,
  Gender,
  Baptism,
  MemberStatus,
} from '../../../core/models/member.model';

@Component({
  selector: 'app-member-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './member-edit.component.html',
})
export class MemberEditComponent implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly fb            = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  readonly isEdit     = signal(false);
  readonly loading    = signal(false);
  readonly saving     = signal(false);

  readonly statusOptions  = MEMBER_STATUS_OPTIONS;
  readonly genderOptions  = GENDER_OPTIONS;
  readonly baptismOptions = BAPTISM_OPTIONS;

  readonly form = this.fb.group({
    lastName:        ['', Validators.required],
    firstName:       ['', Validators.required],
    discriminator:   [''],
    gender:          [null as string | null],
    baptism:         [null as string | null],
    birthDate:       [null as Date | null],
    phoneNumber:     [''],
    email:           ['', Validators.email],
    street:          [''],
    zipCode:         [''],
    city:            [''],
    registrationDate:[null as Date | null],
    churchRole:      [''],
    memberStatus:    [null as string | null],
  });

  private publicId?: string;

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? undefined;
    this.isEdit.set(!!this.publicId);

    if (this.publicId) {
      this.loading.set(true);
      this.memberService.getMember(this.publicId).subscribe({
        next: member => {
          this.patchForm(member);
          this.loading.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: '오류', detail: '회원 정보를 불러올 수 없습니다.' });
          this.loading.set(false);
        },
      });
    }
  }

  private patchForm(member: Member): void {
    this.form.patchValue({
      lastName:         member.lastName,
      firstName:        member.firstName,
      discriminator:    member.discriminator ?? '',
      gender:           member.gender,
      baptism:          member.baptism,
      birthDate:        member.birthDate ? new Date(member.birthDate) : null,
      phoneNumber:      member.phoneNumber ?? '',
      email:            member.email ?? '',
      street:           member.street ?? '',
      zipCode:          member.zipCode ?? '',
      city:             member.city ?? '',
      registrationDate: member.registrationDate ? new Date(member.registrationDate) : null,
      churchRole:       member.churchRole ?? '',
      memberStatus:     member.memberStatus,
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();

    const toIso = (d: Date | null | undefined) => d ? d.toISOString().split('T')[0] : undefined;

    if (this.isEdit() && this.publicId) {
      const req = {
        lastName:         raw.lastName ?? undefined,
        firstName:        raw.firstName ?? undefined,
        discriminator:    raw.discriminator || undefined,
        gender:           (raw.gender as Gender) ?? undefined,
        baptism:          (raw.baptism as Baptism) ?? undefined,
        birthDate:        toIso(raw.birthDate),
        phoneNumber:      raw.phoneNumber || undefined,
        email:            raw.email || undefined,
        street:           raw.street || undefined,
        zipCode:          raw.zipCode || undefined,
        city:             raw.city || undefined,
        registrationDate: toIso(raw.registrationDate),
        churchRole:       raw.churchRole || undefined,
        memberStatus:     (raw.memberStatus as MemberStatus) ?? undefined,
      };
      this.memberService.updateMember(this.publicId, req).subscribe({
        next: updated => {
          this.messageService.add({ severity: 'success', summary: '완료', detail: '저장되었습니다.' });
          this.saving.set(false);
          setTimeout(() => this.router.navigate(['/members', updated.publicId]), 800);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: '오류', detail: '저장에 실패했습니다.' });
          this.saving.set(false);
        },
      });
    } else {
      const req = {
        lastName:         raw.lastName!,
        firstName:        raw.firstName!,
        discriminator:    raw.discriminator || undefined,
        gender:           (raw.gender as Gender) ?? undefined,
        baptism:          (raw.baptism as Baptism) ?? undefined,
        birthDate:        toIso(raw.birthDate),
        phoneNumber:      raw.phoneNumber || undefined,
        email:            raw.email || undefined,
        street:           raw.street || undefined,
        zipCode:          raw.zipCode || undefined,
        city:             raw.city || undefined,
        registrationDate: toIso(raw.registrationDate),
        churchRole:       raw.churchRole || undefined,
      };
      this.memberService.createMember(req).subscribe({
        next: created => {
          this.messageService.add({ severity: 'success', summary: '완료', detail: '등록되었습니다.' });
          this.saving.set(false);
          setTimeout(() => this.router.navigate(['/members', created.publicId]), 800);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: '오류', detail: '등록에 실패했습니다.' });
          this.saving.set(false);
        },
      });
    }
  }

  goBack(): void {
    if (this.publicId) {
      this.router.navigate(['/members', this.publicId]);
    } else {
      this.router.navigate(['/members']);
    }
  }
}
