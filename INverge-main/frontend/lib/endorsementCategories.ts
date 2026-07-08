export const ENDORSEMENT_CATEGORIES = [
  'Professional Communication',
  'Transparency',
  'Strong Product Vision',
  'Technical Expertise',
  'Execution Ability',
  'Responsiveness',
  'Market Knowledge',
  'Leadership',
  'Investor Friendly',
  'Collaboration',
] as const;

export type EndorsementCategoryName = (typeof ENDORSEMENT_CATEGORIES)[number];
