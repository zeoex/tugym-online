import { createTheme } from '@mui/material';

/* ── Marca Torino Fitness ──────────────────────────────────────────
   Sale del logo: un toro de cromo sobre negro. Negro profundo, plata
   cepillada y serif romana. Un solo lugar para tocar la identidad.   */
export const NOCHE        = '#070708';  // fondo del portal
export const NOCHE_PAPEL  = '#121214';  // tarjetas del portal
export const INK          = '#0E0E10';  // negro de la marca (botones, barra del admin)
export const HUESO        = '#F4F4F2';  // blanco cálido para texto sobre negro

export const ACENTO       = '#D7DADF';  // plata clara: botones, íconos, realces
export const ACENTO_HOVER = '#EDEFF2';
export const ACENTO_SUAVE = 'rgba(215,218,223,0.12)';
export const ACERO        = '#9AA3B2';  // acero azulado: segundo tono, chips, texto de apoyo
export const VIOLETA      = ACERO;      // alias histórico: lo que era violeta ahora es acero

/* Cromo cepillado: el degradé del logo, para el botón principal y los sellos. */
export const CROMO = 'linear-gradient(180deg, #F4F5F7 0%, #CFD3D9 42%, #9DA3AC 50%, #E3E6EA 100%)';
export const CROMO_TEXTO = 'linear-gradient(180deg, #FFFFFF 0%, #D5D8DD 48%, #9CA2AB 52%, #E9EBEE 100%)';
export const BRILLO = '0 0 28px rgba(255,255,255,0.14)';

/* Cinzel: la romana del logo, para la marca y los titulares. Inter para leer. */
export const FUENTE_MARCA   = "'Cinzel', 'Times New Roman', serif";
export const FUENTE_TITULOS = FUENTE_MARCA;
const FUENTE_CUERPO  = "'Inter Variable', system-ui, sans-serif";

const tipografia = {
  fontFamily: FUENTE_CUERPO,
  h1: { fontFamily: FUENTE_MARCA, fontWeight: 700, letterSpacing: '0.02em' },
  h2: { fontFamily: FUENTE_MARCA, fontWeight: 700, letterSpacing: '0.02em' },
  h3: { fontFamily: FUENTE_MARCA, fontWeight: 700, letterSpacing: '0.02em' },
  h4: { fontFamily: FUENTE_MARCA, fontWeight: 700, letterSpacing: '0.03em' },
  h5: { fontFamily: FUENTE_CUERPO, fontWeight: 700, letterSpacing: '-0.01em' },
  h6: { fontFamily: FUENTE_CUERPO, fontWeight: 700, letterSpacing: '-0.01em' },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 700 },
  button: { fontFamily: FUENTE_CUERPO, fontWeight: 700, textTransform: 'none', letterSpacing: '0.01em' },
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

/* ── Panel de administración: claro, negro y plata ── */
export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: INK, contrastText: '#FFFFFF' },
    secondary:  { main: ACERO, contrastText: '#FFFFFF' },
    background: { default: '#F3F3F4', paper: '#FFFFFF' },
    error:      { main: '#DC2626' },
    warning:    { main: '#D97706' },
    success:    { main: '#16A34A' },
    info:       { main: '#2563EB' },
    text:       { primary: '#141416', secondary: '#5F6370' },
    divider:    'rgba(14,14,16,0.1)',
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
          '&:hover': { boxShadow: '0 6px 16px rgba(14,14,16,0.25)' },
        },
        containedPrimary: {
          '&:hover': { backgroundColor: '#26262A' },
        },
        containedSecondary: {
          background: CROMO, color: INK,
          '&:hover': { background: CROMO, filter: 'brightness(1.04)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(14,14,16,0.05), 0 6px 20px rgba(14,14,16,0.04)',
          border: '1px solid rgba(14,14,16,0.07)',
          borderRadius: 14,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 14 },
        elevation1: { boxShadow: '0 1px 3px rgba(14,14,16,0.05), 0 6px 20px rgba(14,14,16,0.04)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: INK,
          color: '#FFFFFF',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#ECEDEF',
            color: '#4B4F5A',
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
          boxShadow: '0 1px 3px rgba(14,14,16,0.05), 0 6px 20px rgba(14,14,16,0.04)',
          border: '1px solid rgba(14,14,16,0.07)',
          borderRadius: 14,
        },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 18 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, fontSize: '1.1rem' } } },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
});

/* ── Portal del socio: negro profundo + cromo ── */
export const portalTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: ACENTO, contrastText: INK },
    secondary:  { main: ACERO, contrastText: INK },
    background: { default: NOCHE, paper: NOCHE_PAPEL },
    error:      { main: '#F87171' },
    warning:    { main: '#FBBF24' },
    success:    { main: '#4ADE80' },
    info:       { main: '#93C5FD' },
    text:       { primary: HUESO, secondary: 'rgba(244,244,242,0.58)' },
    divider:    'rgba(244,244,242,0.09)',
  },
  typography: tipografia,
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ...reducedMotion,
        body: {
          backgroundImage: `radial-gradient(ellipse 80% 45% at 50% -10%, rgba(255,255,255,0.07), transparent),
                            radial-gradient(ellipse 60% 40% at 100% 110%, rgba(154,163,178,0.08), transparent)`,
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 700 },
        containedPrimary: {
          background: CROMO, color: INK,
          boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 10px 30px rgba(0,0,0,0.45)',
          '&:hover': { background: CROMO, filter: 'brightness(1.05)', boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 34px rgba(0,0,0,0.5)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(244,244,242,0.08)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(10,10,12,0.92)', backdropFilter: 'blur(14px)' },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: 'rgba(244,244,242,0.4)',
          '&.Mui-selected': { color: ACENTO },
        },
      },
    },
  },
});
