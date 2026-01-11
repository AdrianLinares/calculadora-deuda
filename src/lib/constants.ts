export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['application/json', 'text/csv'] as const,
} as const;

export const DEBT_LIMITS = {
  MAX_BALANCE: 999999999,
  MIN_BALANCE: 0.01,
  MAX_INTEREST_RATE: 100,
  MIN_INTEREST_RATE: 0,
  MAX_NAME_LENGTH: 100,
  DECIMAL_PLACES: 2,
} as const;

export const CALCULATION_LIMITS = {
  MAX_MONTHS: 600, // 50 años máximo
  MIN_MONTHLY_BUDGET: 0.01,
  DEBOUNCE_MS: 500,
  CHART_HEIGHT: 320,
  CHART_MAX_NAME_LENGTH: 15,
} as const;

export const DATE_FORMAT_OPTIONS = {
  SHORT: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  LONG: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
} as const;