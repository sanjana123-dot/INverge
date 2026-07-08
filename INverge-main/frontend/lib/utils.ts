import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export const FUNDING_STAGES = [
  { value: 'IDEA', label: 'Idea' },
  { value: 'PRE_SEED', label: 'Pre-seed' },
  { value: 'SEED', label: 'Seed' },
  { value: 'SERIES_A', label: 'Series A' },
  { value: 'SERIES_B', label: 'Series B' },
] as const;

export const DOMAINS = [
  { value: 'FINTECH', label: 'FinTech' },
  { value: 'HEALTHTECH', label: 'HealthTech' },
  { value: 'AI', label: 'AI' },
  { value: 'EDTECH', label: 'EdTech' },
  { value: 'CLIMATETECH', label: 'ClimateTech' },
  { value: 'SAAS', label: 'SaaS' },
] as const;

export const INVESTOR_DISCOVERY_DOMAINS = [
  { value: 'AI', label: 'AI' },
  { value: 'FINTECH', label: 'FinTech' },
  { value: 'HEALTHTECH', label: 'HealthTech' },
] as const;

export const REQUEST_INTENTS = [
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'MENTORSHIP', label: 'Mentorship' },
] as const;
