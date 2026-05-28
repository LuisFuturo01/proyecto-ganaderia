/**
 * RADIOGUARD - Design Tokens
 * Extraídos del Figma, DESING.md e imágenes de referencia.
 * 
 * Estos tokens se usan en código JS/TS (Three.js, Recharts, estilos dinámicos).
 * El tema de Tailwind en index.css espeja estos valores para clases utilitarias.
 */

// ─────────────────────────────────────────────────────
// Superficies y Fondos
// ─────────────────────────────────────────────────────
export const COLORS = {
  // Fondos (jerarquía de profundidad)
  surface: {
    void: '#05070F',       // Level 0: fondo absoluto
    base: '#0A1128',       // Level 1: paneles principales
    dim: '#10131c',        // Fondo general
    container: '#191b24',  // Contenedores
    elevated: '#1d1f28',   // Elementos elevados
    high: '#272a33',       // Superficie alta
    highest: '#32343e',    // Superficie más alta
  },

  // Acento primario: Verde Nuclear
  nuclear: {
    bright: '#00FF9F',     // Acciones principales, estados seguros
    DEFAULT: '#00e38d',    // Verde primario
    dim: '#55ffa9',        // Verde suave
    dark: '#006d41',       // Verde oscuro
    container: '#005230',  // Fondo de contenedor verde
    glow: 'rgba(0, 255, 159, 0.3)', // Resplandor
  },

  // Acento secundario: Cian Radiación
  cyan: {
    bright: '#00d2fd',     // Escaneo activo, datos
    light: '#a2e7ff',      // Texto secundario iluminado
    DEFAULT: '#3cd7ff',    // Cian por defecto
    dark: '#004e5f',       // Cian oscuro
    glow: 'rgba(0, 210, 253, 0.3)', // Resplandor
  },

  // Acento terciario: Rosa Neón (alertas críticas)
  rose: {
    bright: '#ffd6d7',     // Rosa brillante
    DEFAULT: '#ffb3b6',    // Rosa por defecto
    dark: '#920028',       // Rosa oscuro
    container: '#c60039',  // Contenedor rosa
    glow: 'rgba(255, 179, 182, 0.3)',
  },

  // Naranja/Rojo para radiación
  radiation: {
    orange: '#ff8c00',     // Indicadores de radiación
    red: '#ff4444',        // Alerta de radiación
    amber: '#ffaa00',      // Advertencia
  },

  // Mapa de calor (perfil de atenuación)
  heatmap: {
    max: '#ff0000',        // Dosis máxima (superficie)
    high: '#ff6600',       // Dosis alta
    mid: '#ffcc00',        // Dosis media
    low: '#00cc44',        // Dosis baja
    min: '#0066ff',        // Dosis mínima (núcleo)
  },

  // Bordes
  border: {
    DEFAULT: '#1E2937',
    dim: 'rgba(30, 41, 55, 0.5)',
    glow: 'rgba(0, 255, 159, 0.15)',
  },

  // Texto
  text: {
    primary: '#e1e2ee',
    secondary: '#9ca3af',
    muted: '#6b7280',
    inverse: '#2e303a',
  },

  // Error
  error: {
    DEFAULT: '#ffb4ab',
    dark: '#690005',
    container: '#93000a',
  },
} as const;

// ─────────────────────────────────────────────────────
// Tipografía
// ─────────────────────────────────────────────────────
export const FONTS = {
  heading: "'Space Grotesk', system-ui, sans-serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

// ─────────────────────────────────────────────────────
// Espaciado (base 4px)
// ─────────────────────────────────────────────────────
export const SPACING = {
  unit: 4,
  gutter: 16,
  marginDesktop: 40,
  marginMobile: 16,
  containerMax: 1440,
} as const;

// ─────────────────────────────────────────────────────
// Elevación / Glassmorphism
// ─────────────────────────────────────────────────────
export const ELEVATION = {
  level0: { bg: '#05070F', blur: 0, opacity: 1 },
  level1: { bg: '#0A1128', blur: 20, opacity: 0.6, border: 'rgba(30, 41, 55, 0.5)' },
  level2: { bg: '#1E2937', blur: 40, opacity: 0.8 },
  neonGlow: (color: string, intensity = 0.3) =>
    `0 0 15px ${color.replace(')', `, ${intensity})`).replace('rgb', 'rgba')}`,
} as const;

// ─────────────────────────────────────────────────────
// Bordes Redondeados
// ─────────────────────────────────────────────────────
export const ROUNDED = {
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
} as const;

// ─────────────────────────────────────────────────────
// Colores para Recharts / Gráficos
// ─────────────────────────────────────────────────────
export const CHART_COLORS = {
  attenuationLine: '#00d2fd',
  attenuationGradient: ['#ff4444', '#ffcc00', '#00cc44', '#0066ff'],
  gridColor: 'rgba(30, 41, 55, 0.5)',
  axisColor: '#6b7280',
  tooltipBg: '#1d1f28',
} as const;
