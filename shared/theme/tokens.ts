// Design tokens shared across web (and future mobile)
export const tokens = {
  colors: {
    primary: '#1A73E8',
    primaryDark: '#1557B0',
    primaryLight: '#4A90D9',
    secondary: '#5F6368',
    secondaryDark: '#3C4043',
    error: '#D93025',
    errorLight: '#F28B82',
    warning: '#F9AB00',
    success: '#1E8E3E',
    background: '#FFFFFF',
    backgroundAlt: '#F8F9FA',
    surface: '#FFFFFF',
    textPrimary: '#202124',
    textSecondary: '#5F6368',
    border: '#DADCE0',
    borderLight: '#E8EAED',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    fontFamily: {
      heading: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      body: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      mono: '"Roboto Mono", "Consolas", monospace',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
      xxxl: 40,
    },
  },
} as const;

export type Tokens = typeof tokens;
