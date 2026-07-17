import { createTheme } from '@mui/material';

/* ── Marca TuGymOnLine ─────────────────────────────────────────────
   Lima eléctrica sobre verde-negro para el socio, tinta + lima para el
   admin. Un solo lugar para tocar la identidad de toda la app.       */
export const ACENTO        = '#C8F13F';
export const ACENTO_HOVER  = '#B9E32C';
export const ACENTO_SUAVE  = 'rgba(200,241,63,0.12)';
export const VIOLETA       = '#8B5CF6';
export const INK           = '#12160D';  // negro con tinte verde
export const NOCHE         = '#0B0D08';  // fondo del portal
export const NOCHE_PAPEL   = '#151A0F';


/* Barlow Condensed: la tipografía atlética por excelencia (recomendación
   ui-ux-pro-max para gimnasios). Condensada para títulos y números grandes,
   Inter para lectura. Nada de tracking negativo: condensed no lo necesita. */
export const FUENTE_TITULOS = "'Barlow Condensed', 'Inter Variable', system-ui, sans-serif";
const FUENTE_CUERPO  = "'Inter Variable', system-ui, sans-serif";
const FUENTE_BOTONES = "'Barlow', 'Inter Variable', system-ui, sans-serif";

const tipografia = {
  fontFamily: FUENTE_CUERPO,
  h1: { fontFamily: FUENTE_TITULOS, fontWeight: 700, letterSpacing: '0.2px' },
  h2: { fontFamily: FUENTE_TITULOS, fontWeight: 700, letterSpacing: '0.2px' },
  h3: { fontFamily: FUENTE_TITULOS, fontWeight: 700, letterSpacing: '0.2px' },
  h4: { fontFamily: FUENTE_TITULOS, fontWeight: 700, letterSpacing: '0.3px' },
  h5: { fontFamily: FUENTE_TITULOS, fontWeight: 700, letterSpacing: '0.3px' },
  h6: { fontFamily: FUENTE_TITULOS, fontWeight: 600, letterSpacing: '0.3px' },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 700 },
  button: { fontFamily: FUENTE_BOTONES, fontWeight: 700, textTransform: 'none', letterSpacing: '0.2px' },
};

/* La skill pide respetar reduced-motion: si el usuario lo activó, todo quieto. */
const reducedMotion = {
  '@media (prefers-reduced-motion: reduce)': {
    '*, *::before, *::after': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
    },
  },
};

/* ── Panel de administración: claro, tinta y lima ── */
export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: INK, contrastText: '#FFFFFF' },
    secondary:  { main: ACENTO, contrastText: INK },
    background: { default: '#F5F7F2', paper: '#FFFFFF' },
    error:      { main: '#DC2626' },
    warning:    { main: '#D97706' },
    success:    { main: '#16A34A' },
    info:       { main: '#2563EB' },
    text:       { primary: '#191E13', secondary: '#5B6152' },
    divider:    'rgba(25,30,19,0.1)',
  },
  typography: tipografia,
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: { styleOverrides: { ...reducedMotion } },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 700 },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 6px 16px rgba(18,22,13,0.25)' },
        },
        containedPrimary: {
          '&:hover': { backgroundColor: '#242B1A' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(18,22,13,0.05), 0 6px 20px rgba(18,22,13,0.04)',
          border: '1px solid rgba(18,22,13,0.07)',
          borderRadius: 14,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 14 },
        elevation1: { boxShadow: '0 1px 3px rgba(18,22,13,0.05), 0 6px 20px rgba(18,22,13,0.04)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: INK,
          color: '#FFFFFF',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#EFF2EA',
            color: '#4B5142',
            fontWeight: 700,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:last-child td': { borderBottom: 0 } },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(18,22,13,0.05), 0 6px 20px rgba(18,22,13,0.04)',
          border: '1px solid rgba(18,22,13,0.07)',
          borderRadius: 14,
        },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 18 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, fontSize: '1.1rem' } } },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
});

/* ── Portal del socio: negro noche + lima eléctrica ── */
export const portalTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: ACENTO, contrastText: '#111503' },
    secondary:  { main: VIOLETA, contrastText: '#FFFFFF' },
    background: { default: NOCHE, paper: NOCHE_PAPEL },
    error:      { main: '#F87171' },
    warning:    { main: '#FBBF24' },
    success:    { main: '#4ADE80' },
    info:       { main: '#60A5FA' },
    text:       { primary: '#F2F5EA', secondary: 'rgba(242,245,234,0.55)' },
    divider:    'rgba(242,245,234,0.09)',
  },
  typography: tipografia,
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ...reducedMotion,
        body: {
          backgroundImage: `radial-gradient(ellipse 80% 45% at 50% -10%, rgba(200,241,63,0.09), transparent),
                            radial-gradient(ellipse 60% 40% at 100% 110%, rgba(139,92,246,0.07), transparent)`,
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 700 },
        containedPrimary: {
          boxShadow: '0 0 24px rgba(200,241,63,0.25)',
          '&:hover': { backgroundColor: ACENTO_HOVER, boxShadow: '0 0 32px rgba(200,241,63,0.4)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(242,245,234,0.07)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(16,19,11,0.92)', backdropFilter: 'blur(14px)' },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: 'rgba(242,245,234,0.4)',
          '&.Mui-selected': { color: ACENTO },
        },
      },
    },
  },
});
