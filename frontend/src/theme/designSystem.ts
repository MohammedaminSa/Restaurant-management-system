// Modern Design System for Restaurant Ordering System

export const modernSpacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const modernBorderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
};

export const modernShadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

export const modernColors = {
  primary: {
    main: '#2563eb', // Modern blue
    light: '#60a5fa',
    dark: '#1e40af',
    50: '#eff6ff',
    100: '#dbeafe',
  },
  success: {
    main: '#10b981', // Modern green
    light: '#34d399',
    dark: '#059669',
    50: '#ecfdf5',
    100: '#d1fae5',
  },
  warning: {
    main: '#f59e0b', // Modern orange
    light: '#fbbf24',
    dark: '#d97706',
    50: '#fffbeb',
    100: '#fef3c7',
  },
  error: {
    main: '#ef4444', // Modern red
    light: '#f87171',
    dark: '#dc2626',
    50: '#fef2f2',
    100: '#fee2e2',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    50: '#eff6ff',
    100: '#dbeafe',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

export const modernTypography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const modernCardStyles = {
  default: {
    borderRadius: modernBorderRadius.lg,
    boxShadow: modernShadows.sm,
    border: `1px solid ${modernColors.neutral[200]}`,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      boxShadow: modernShadows.md,
      transform: 'translateY(-2px)',
    },
  },
  elevated: {
    borderRadius: modernBorderRadius.lg,
    boxShadow: modernShadows.md,
    border: 'none',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      boxShadow: modernShadows.lg,
      transform: 'translateY(-2px)',
    },
  },
  flat: {
    borderRadius: modernBorderRadius.lg,
    boxShadow: 'none',
    border: `1px solid ${modernColors.neutral[200]}`,
    backgroundColor: modernColors.neutral[50],
  },
};

export const modernButtonStyles = {
  primary: {
    borderRadius: modernBorderRadius.md,
    textTransform: 'none' as const,
    fontWeight: modernTypography.fontWeight.medium,
    padding: `${modernSpacing.sm} ${modernSpacing.lg}`,
    boxShadow: modernShadows.sm,
    '&:hover': {
      boxShadow: modernShadows.md,
    },
  },
};

export const modernChipStyles = {
  default: {
    borderRadius: modernBorderRadius.full,
    fontWeight: modernTypography.fontWeight.medium,
    fontSize: modernTypography.fontSize.sm,
  },
};
