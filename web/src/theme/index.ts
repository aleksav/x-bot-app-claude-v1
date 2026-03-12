import { createTheme } from '@mui/material/styles';
import { tokens } from '../../../shared/theme/tokens';

export const theme = createTheme({
  palette: {
    primary: {
      main: tokens.colors.primary,
      dark: tokens.colors.primaryDark,
      light: tokens.colors.primaryLight,
    },
    secondary: {
      main: tokens.colors.secondary,
      dark: tokens.colors.secondaryDark,
    },
    error: {
      main: tokens.colors.error,
      light: tokens.colors.errorLight,
    },
    warning: {
      main: tokens.colors.warning,
    },
    success: {
      main: tokens.colors.success,
    },
    background: {
      default: tokens.colors.background,
      paper: tokens.colors.surface,
    },
    text: {
      primary: tokens.colors.textPrimary,
      secondary: tokens.colors.textSecondary,
    },
    divider: tokens.colors.border,
  },
  typography: {
    fontFamily: tokens.typography.fontFamily.body,
    h1: {
      fontFamily: tokens.typography.fontFamily.heading,
      fontWeight: 700,
      fontSize: tokens.typography.fontSize.xxxl,
    },
    h2: {
      fontFamily: tokens.typography.fontFamily.heading,
      fontWeight: 600,
      fontSize: tokens.typography.fontSize.xxl,
    },
    h3: {
      fontFamily: tokens.typography.fontFamily.heading,
      fontWeight: 600,
      fontSize: tokens.typography.fontSize.xl,
    },
    h4: {
      fontFamily: tokens.typography.fontFamily.heading,
      fontWeight: 600,
      fontSize: tokens.typography.fontSize.lg,
    },
    body1: {
      fontSize: tokens.typography.fontSize.md,
    },
    body2: {
      fontSize: tokens.typography.fontSize.sm,
    },
    caption: {
      fontSize: tokens.typography.fontSize.xs,
    },
  },
  shape: {
    borderRadius: tokens.borderRadius.md,
  },
  spacing: tokens.spacing.sm,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: tokens.borderRadius.md,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.lg,
          border: `1px solid ${tokens.colors.borderLight}`,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.md,
        },
      },
    },
  },
});
