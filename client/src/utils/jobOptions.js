export const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'FREELANCE', label: 'Freelance' },
];

export const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Entry level (0-2 yrs)' },
  { value: 'MID', label: 'Mid level (3-5 yrs)' },
  { value: 'SENIOR', label: 'Senior (6-10 yrs)' },
  { value: 'EXECUTIVE', label: 'Executive (10+ yrs)' },
  { value: 'DIRECTOR', label: 'Director' },
];

export const WORK_MODES = [
  { value: 'ONSITE', label: 'On-site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

export const POSTED_WITHIN = [
  { value: '', label: 'Any time' },
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
];

export const SORT_OPTIONS = [
  { value: 'latest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'salary_high', label: 'Highest salary' },
  { value: 'salary_low', label: 'Lowest salary' },
];

export const CURRENCIES = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

export const SALARY_PERIODS = [
  { value: 'YEARLY', label: 'per year' },
  { value: 'MONTHLY', label: 'per month' },
  { value: 'WEEKLY', label: 'per week' },
  { value: 'HOURLY', label: 'per hour' },
];

export const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || '';

// status -> Badge variant
export const STATUS_VARIANT = {
  APPLIED: 'default',
  SCREENING: 'primary',
  INTERVIEW: 'warning',
  OFFER: 'success',
  HIRED: 'success',
  REJECTED: 'error',
  WITHDRAWN: 'default',
  PUBLISHED: 'success',
  DRAFT: 'warning',
  PAUSED: 'warning',
  CLOSED: 'error',
  EXPIRED: 'error',
};

export const statusLabel = (s = '') => s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ');
