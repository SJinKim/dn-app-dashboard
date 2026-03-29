export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface DefinitionDto {
  publicId: string;
  title: string;
  dayOfWeek: DayOfWeek;
  windowStart: string; // "HH:mm:ss"
  windowEnd: string;
  isActive: boolean;
}

export interface AttendanceLogDto {
  publicId: string;
  definitionPublicId: string;
  definitionTitle: string;
  memberPublicId: string;
  memberName: string;
  attendanceDate: string; // ISO date "YYYY-MM-DD"
  attended: boolean;
}

export interface CreateDefinitionRequest {
  title: string;
  dayOfWeek: DayOfWeek;
  windowStart: string; // "HH:mm:ss"
  windowEnd: string;
}

export interface UpdateDefinitionRequest {
  title?: string;
  dayOfWeek?: DayOfWeek;
  windowStart?: string;
  windowEnd?: string;
  isActive?: boolean;
}

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  MONDAY:    '월요일',
  TUESDAY:   '화요일',
  WEDNESDAY: '수요일',
  THURSDAY:  '목요일',
  FRIDAY:    '금요일',
  SATURDAY:  '토요일',
  SUNDAY:    '일요일',
};

export const DAY_OF_WEEK_OPTIONS = (Object.entries(DAY_OF_WEEK_LABELS) as [DayOfWeek, string][])
  .map(([value, label]) => ({ value, label }));
