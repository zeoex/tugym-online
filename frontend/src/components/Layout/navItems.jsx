import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StyleIcon from '@mui/icons-material/Style';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CampaignIcon from '@mui/icons-material/Campaign';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';
import SettingsIcon from '@mui/icons-material/Settings';

/* Única fuente de la navegación del admin: la barra superior usa la lista
   plana y el drawer mobile usa los grupos. */
export const NAV_GROUPS = [
  {
    items: [
      { label: 'Dashboard',    icon: <DashboardIcon />,     path: '/dashboard'    },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Socios',       icon: <PeopleIcon />,        path: '/socios'       },
      { label: 'Planes',       icon: <StyleIcon />,         path: '/planes'       },
      { label: 'Pagos',        icon: <PaymentIcon />,       path: '/pagos'        },
      { label: 'Vencimientos', icon: <WarningAmberIcon />,  path: '/vencimientos' },
    ],
  },
  {
    label: 'Operación',
    items: [
      { label: 'Asistencias',  icon: <WhereToVoteIcon />,   path: '/asistencias'  },
      { label: 'Rutinas',      icon: <DirectionsRunIcon />, path: '/rutinas'      },
      { label: 'Ejercicios',   icon: <FitnessCenterIcon />, path: '/ejercicios'   },
      { label: 'Anuncios',     icon: <CampaignIcon />,      path: '/anuncios'     },
      { label: 'Caja',         icon: <PointOfSaleIcon />,   path: '/caja'         },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Configuración', icon: <SettingsIcon />,     path: '/configuracion' },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
