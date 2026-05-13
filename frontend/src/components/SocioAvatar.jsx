import { Avatar } from '@mui/material';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';

export default function SocioAvatar({ socio, size = 40, sx = {} }) {
  const base = { width: size, height: size, ...sx };

  if (socio?.foto) {
    return <Avatar src={socio.foto} sx={base}>{socio.nombre?.charAt(0)}</Avatar>;
  }

  if (socio?.sexo === 'MASCULINO') {
    return (
      <Avatar sx={{ ...base, bgcolor: '#0ea5e9' }}>
        <ManIcon sx={{ fontSize: size * 0.6 }} />
      </Avatar>
    );
  }

  if (socio?.sexo === 'FEMENINO') {
    return (
      <Avatar sx={{ ...base, bgcolor: '#ec4899' }}>
        <WomanIcon sx={{ fontSize: size * 0.6 }} />
      </Avatar>
    );
  }

  return <Avatar sx={base}>{socio?.nombre?.charAt(0)}</Avatar>;
}
