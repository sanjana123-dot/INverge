import type { Experience } from '@/types';

export function monthToIsoDate(month: string) {
  if (!month) return '';
  return new Date(`${month}-01T00:00:00.000Z`).toISOString();
}

export function isoDateToMonth(iso: string) {
  if (!iso) return '';
  return iso.slice(0, 7);
}

export function formatExperienceDateRange(startDate: string, endDate?: string | null) {
  const start = new Date(startDate);
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

  if (!endDate) {
    return `${startLabel} – Present`;
  }

  const end = new Date(endDate);
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

export function experienceToForm(exp?: Experience | null) {
  return {
    title: exp?.title ?? '',
    company: exp?.company ?? '',
    location: exp?.location ?? '',
    startMonth: isoDateToMonth(exp?.startDate ?? ''),
    endMonth: isoDateToMonth(exp?.endDate ?? ''),
    isCurrent: !exp?.endDate,
    description: exp?.description ?? '',
  };
}

export type ExperienceFormState = ReturnType<typeof experienceToForm>;

export const emptyExperienceForm = experienceToForm();
