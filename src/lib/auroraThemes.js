// aurora themes para el backdrop web del Monthly Digest.
// cada theme define el gradiente animado de fondo y el color del titulo.
// NO afecta los colores individuales de los bloques (esos son del admin).

export const AURORA_THEMES = {
  default: {
    label: 'VIBE (default)',
    gradient: 'linear-gradient(270deg, #140d24, #2d1350, #1e1538, #0f2460, #140d24)',
    titleColor: '#efe9f7',
  },
  halloween: {
    label: 'Halloween',
    gradient: 'linear-gradient(270deg, #1a0800, #2d0a00, #0a0020, #1a0a00, #0d001a)',
    titleColor: '#fbbf24',
  },
  christmas: {
    label: 'Navidad',
    gradient: 'linear-gradient(270deg, #0a0f05, #1a0505, #051a0a, #1a0808, #0a0f05)',
    titleColor: '#fef2f2',
  },
  pride: {
    label: 'Pride',
    gradient: 'linear-gradient(270deg, #1a0005, #0a001a, #001a1a, #1a1a00, #1a0500, #00001a)',
    titleColor: '#ffffff',
  },
  womensday: {
    label: 'Dia de la Mujer',
    gradient: 'linear-gradient(270deg, #1a0a14, #2a0520, #1a0020, #20051a, #1a0a14)',
    titleColor: '#f9a8d4',
  },
  earth: {
    label: 'Dia de la Tierra',
    gradient: 'linear-gradient(270deg, #001a10, #0a1a00, #001a1a, #0a1a05, #001a10)',
    titleColor: '#86efac',
  },
  party: {
    label: 'Fiesta',
    gradient: 'linear-gradient(270deg, #1a1000, #1a0800, #0a1000, #1a1200, #0a0800)',
    titleColor: '#fde68a',
  },
  neon: {
    label: 'Neon / Retro',
    gradient: 'linear-gradient(270deg, #0a0a1a, #1a0a1a, #0a1a2a, #1a001a, #0a0a1a)',
    titleColor: '#e879f9',
  },
  worldcup: {
    label: 'Copa del Mundo',
    gradient: 'linear-gradient(270deg, #0f1520, #0a1a2a, #101a10, #0a2020, #0f1520)',
    titleColor: '#86efac',
  },
  valentines: {
    label: 'San Valentin',
    gradient: 'linear-gradient(270deg, #1a0505, #200a0a, #1a0000, #250808, #1a0505)',
    titleColor: '#fda4af',
  },
}
