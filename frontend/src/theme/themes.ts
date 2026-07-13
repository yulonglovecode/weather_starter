export interface Theme {
  id: string;
  label: string;
  /** CSS gradient string applied to document.body background */
  bodyBackground: string;
  /** Sidebar bg utility — a Tailwind-compatible inline style value */
  sidebarBg: string;
}

export const themes: Theme[] = [
  {
    id: 'apple',
    label: 'Apple',
    bodyBackground: `
      radial-gradient(120% 80% at 70% 0%, rgba(255,255,255,0.18) 0%, transparent 55%),
      radial-gradient(90% 70% at 10% 100%, rgba(80,110,150,0.55) 0%, transparent 60%),
      linear-gradient(170deg, #6f8aa8 0%, #5a7591 35%, #4a627c 65%, #3c5066 100%)
    `.trim(),
    sidebarBg: 'rgba(0,0,0,0.20)',
  },
  {
    id: 'midnight',
    label: 'Midnight Terminal',
    bodyBackground: 'linear-gradient(170deg, #0a0a0a 0%, #111111 100%)',
    sidebarBg: 'rgba(10,10,10,0.90)',
  },
  {
    id: 'desert',
    label: 'Desert Sandstorm',
    bodyBackground: `
      radial-gradient(120% 80% at 70% 0%, rgba(255,200,100,0.15) 0%, transparent 55%),
      linear-gradient(170deg, #c97b3a 0%, #a05a28 40%, #7a3c1a 100%)
    `.trim(),
    sidebarBg: 'rgba(80,30,10,0.55)',
  },
  {
    id: 'ocean',
    label: 'Ocean Deep',
    bodyBackground: `
      radial-gradient(120% 80% at 60% 0%, rgba(34,211,238,0.12) 0%, transparent 55%),
      linear-gradient(170deg, #0a1628 0%, #0d3d56 60%, #0a2a3d 100%)
    `.trim(),
    sidebarBg: 'rgba(10,20,40,0.70)',
  },
  {
    id: 'blossom',
    label: 'Cherry Blossom',
    bodyBackground: `
      radial-gradient(120% 80% at 70% 0%, rgba(255,255,255,0.35) 0%, transparent 55%),
      linear-gradient(170deg, #fde8ef 0%, #f9c5d1 50%, #f0aec0 100%)
    `.trim(),
    sidebarBg: 'rgba(240,180,200,0.45)',
  },
  {
    id: 'golden',
    label: 'Golden Hour',
    bodyBackground: `
      radial-gradient(120% 80% at 70% 0%, rgba(251,146,60,0.18) 0%, transparent 55%),
      radial-gradient(90% 70% at 10% 100%, rgba(124,58,8,0.55) 0%, transparent 60%),
      linear-gradient(170deg, #1a0a1e 0%, #3d1a08 55%, #2a1005 100%)
    `.trim(),
    sidebarBg: 'rgba(20,8,0,0.55)',
  },
  {
    id: 'storm',
    label: 'Storm Cell',
    bodyBackground: `
      radial-gradient(120% 80% at 60% 0%, rgba(163,230,53,0.08) 0%, transparent 55%),
      linear-gradient(170deg, #1c2a1c 0%, #1a261a 50%, #141e14 100%)
    `.trim(),
    sidebarBg: 'rgba(15,25,15,0.75)',
  },
  {
    id: 'neon',
    label: 'Neon Monsoon',
    bodyBackground: `
      radial-gradient(120% 80% at 70% 0%, rgba(224,64,251,0.12) 0%, transparent 55%),
      radial-gradient(90% 70% at 10% 100%, rgba(64,200,244,0.15) 0%, transparent 60%),
      linear-gradient(170deg, #0f0520 0%, #1a0835 50%, #0f0520 100%)
    `.trim(),
    sidebarBg: 'rgba(15,5,32,0.80)',
  },
];

export const defaultThemeId = 'apple';
