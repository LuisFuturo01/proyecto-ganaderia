/**
 * RADIOGUARD - Fase 4: Vista Comparativa Completa "Antes vs Después"
 * 
 * Replica fielmente ventana2.png con:
 * - Panel "ANTES" con modelo 3D opaco + defectos detectados
 * - Panel "DESPUÉS" con mapa de calor volumétrico + dosimetría nuclear
 * - Gráfico de Perfil de Atenuación (Recharts)
 * - Distribución de Dosis (Donut chart)
 * - Botones "Volver al Dashboard" y "Exportar Reporte"
 */

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSimulationStore } from '../../store/useSimulationStore';
import { VegetableModel } from '../simulation/VegetableModel';
import { useTranslation } from '../../hooks/useTranslation';
import { Card } from '../ui/Card';
import { generateAttenuationChartData, generateDoseDistribution } from '../../lib/mockData';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  FileDown,
  ShieldAlert,
  AlertCircle,
  CircleDot,
  Zap,
  Target,
  Activity,
  TrendingDown,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Mini 3D Viewport for Before/After ──────────────────────────
interface MiniViewportProps {
  mode: 'before' | 'after';
}

const MiniViewport: React.FC<MiniViewportProps> = ({ mode }) => {
  const { simulationData } = useSimulationStore();
  if (!simulationData) return null;

  return (
    <div className="h-56 w-full rounded-lg overflow-hidden border border-border-dim bg-surface-void/60 relative">
      <Canvas shadows camera={{ position: [0, 1.5, 3], fov: 35 }}>
        <color attach="background" args={['#05070F']} />
        <ambientLight intensity={0.3} />
        <pointLight position={[2, 3, 2]} intensity={2.5} castShadow />
        <pointLight position={[-2, -1, -1]} intensity={0.4} />

        <Suspense fallback={null}>
          <group rotation={[0, 0.3, 0]}>
            <VegetableModel
              meshData={simulationData.datos_renderizado_malla_grafica}
              phase={mode === 'after' ? 'output' : 'idle'}
              attenuationProfile={
                simulationData.simulacion_dosimetria_radiacion
                  .perfil_atenuacion_profundidad_lineal_kGy
              }
            />
          </group>
        </Suspense>

        <OrbitControls
          enableZoom={true}
          maxDistance={6}
          minDistance={2}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* Label overlay */}
      <div className="absolute top-2 left-3 z-10 select-none">
        <span
          className={`text-xs font-heading font-bold uppercase tracking-widest ${
            mode === 'before' ? 'text-rose-default' : 'text-nuclear-bright text-glow-green'
          }`}
        >
          {mode === 'before' ? 'ANTES' : 'DESPUÉS'}
        </span>
      </div>

      {/* Heatmap legend for "after" */}
      {mode === 'after' && (
        <div className="absolute right-2 top-8 z-10 select-none flex flex-col items-end gap-0.5">
          <span className="text-[8px] font-mono font-bold text-text-muted">kGy</span>
          <div className="w-3 h-24 rounded-sm overflow-hidden border border-border-dim">
            <div className="h-full w-full bg-linear-to-b from-heat-max via-heat-mid to-heat-min" />
          </div>
          {['0.15', '0.11', '0.07', '0.04'].map((val) => (
            <span key={val} className="text-[7px] font-mono text-text-muted">
              {val}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Comparative View ──────────────────────────────────────
export const ComparativeView: React.FC = () => {
  const { simulationData, setActiveView } = useSimulationStore();
  const { t, tPurpose } = useTranslation();

  const profile = useMemo(() => {
    return simulationData?.simulacion_dosimetria_radiacion?.perfil_atenuacion_profundidad_lineal_kGy || [];
  }, [simulationData]);

  const chartData = useMemo(() => generateAttenuationChartData(profile), [profile]);
  const donutData = useMemo(() => generateDoseDistribution(profile), [profile]);

  // Translate donutData dynamically
  const translatedDonutData = useMemo(() => {
    return donutData.map((item, idx) => {
      const label = idx === 0
        ? t('surf_severity_critical').split(' / ')[0]
        : idx === 1
          ? t('surf_severity_warning')
          : t('surf_severity_safe').split(' / ')[0];

      // Keep range in parenthesis
      const range = item.name.includes('(') ? item.name.substring(item.name.indexOf('(')) : '';
      return {
        ...item,
        name: `${label} ${range}`
      };
    });
  }, [donutData, t]);

  if (!simulationData) return null;

  const { simulacion_dosimetria_radiacion, analisis_color_superficie, geometria_espacial_3d } =
    simulationData;
  const ind = simulacion_dosimetria_radiacion.indicadores_dosimetria_fisico_biologica;

  const doseInSurface = profile[0]?.toFixed(2) ?? '—';
  const doseInCenter = profile[profile.length - 1]?.toFixed(2) ?? '—';

  const handleExportReport = () => {
    const report = {
      sistema: 'RADIOGUARD - Sistema de Dosimetría Fitosanitaria',
      fecha: new Date().toISOString(),
      clasificacion: simulationData.clasificacion_alimento,
      dosimetria: simulacion_dosimetria_radiacion,
      superficie: analisis_color_superficie,
      geometria: geometria_espacial_3d,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RADIOGUARD_Reporte_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2 px-4 py-2 glass border border-border-dim hover:border-cyan-rad/50 rounded text-xs font-mono font-bold text-text-primary transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-cyan-rad" />
          {t('comp_btn_back')}
        </button>

        <div className="text-center flex-1">
          <h2 className="text-base font-heading font-bold text-white uppercase tracking-widest">
            {t('comp_title')}
          </h2>
          <p className="text-[10px] font-mono text-text-muted tracking-wider">
            {t('comp_subtitle')}
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 px-4 py-2 glass border border-border-dim hover:border-nuclear/50 rounded text-xs font-mono font-bold text-text-primary transition-all cursor-pointer active:scale-95"
        >
          <FileDown className="h-4 w-4 text-nuclear-bright" />
          {t('comp_btn_export')}
        </button>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─ LEFT: ANTES ─ */}
        <div className="lg:col-span-4 space-y-4">
          <MiniViewport mode="before" />
        </div>

        {/* ─ CENTER: DESPUÉS + HEATMAP ─ */}
        <div className="lg:col-span-4 space-y-4">
          <MiniViewport mode="after" />
        </div>

        {/* ─ RIGHT: DOSIMETRÍA NUCLEAR ─ */}
        <div className="lg:col-span-4">
          <Card className="p-4 h-full">
            <div className="flex items-center gap-2 border-b border-border-dim/50 pb-2 mb-3">
              <Zap className="h-4 w-4 text-nuclear-bright" />
              <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                {t('comp_dosimetry_title')}
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center bg-surface-elevated/30 p-2 rounded border border-border-dim/40">
                <span className="text-text-secondary">{t('comp_dose_surf')}</span>
                <span className="text-white font-bold">{doseInSurface} kGy</span>
              </div>
              <div className="flex justify-between items-center bg-surface-elevated/30 p-2 rounded border border-border-dim/40">
                <span className="text-text-secondary">{t('comp_dose_center')}</span>
                <span className="text-white font-bold">{doseInCenter} kGy</span>
              </div>
              <div className="flex justify-between items-center bg-surface-elevated/30 p-2 rounded border border-border-dim/40">
                <span className="text-text-secondary">{t('comp_dose_uniformity')}</span>
                <span className="text-white font-bold">
                  {ind.uniformidad_dosis_ratio_Dmax_Dmin.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-surface-elevated/30 p-2 rounded border border-border-dim/40">
                <span className="text-text-secondary">{t('comp_dose_reduction')}</span>
                <span className="text-nuclear-bright font-bold text-glow-green">
                  {ind.reduccion_logaritmica_carga_bacteriana.toFixed(1)} log
                </span>
              </div>
              <div className="flex justify-between items-center bg-surface-elevated/30 p-2 rounded border border-border-dim/40">
                <span className="text-text-secondary">{t('comp_dose_purpose')}</span>
                <span className="text-cyan-light font-bold text-right text-[10px] max-w-[140px]">
                  {tPurpose(simulacion_dosimetria_radiacion.proposito_fitosanitario_asignado)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Bottom Row: Defects + Attenuation + Distribution ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* DEFECTOS DETECTADOS */}
        <Card className="p-4">
          <div className="flex items-center gap-2 border-b border-rose-dark/30 pb-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-rose-default" />
            <h3 className="font-heading font-bold text-sm text-rose-default uppercase tracking-wider">
              {t('comp_defects_title')}
            </h3>
          </div>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-rose-default" />
                {t('comp_defects_surf')}
              </span>
              <span className="text-white font-bold">
                {analisis_color_superficie.porcentaje_superficie_piel_danada.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary flex items-center gap-1.5">
                <CircleDot className="h-3.5 w-3.5 text-radiation-amber" />
                {t('comp_defects_spots')}
              </span>
              <span className="text-white font-bold">
                {analisis_color_superficie.conteo_manchas_aisladas}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-cyan-rad" />
                {t('comp_defects_cav')}
              </span>
              <span className="text-white font-bold">
                {geometria_espacial_3d.conteo_cavidades_concavidades_profundas}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border-dim/30 pt-2 mt-2">
              <span className="text-text-secondary">{t('comp_defects_diag')}</span>
              <span className="text-rose-default font-bold uppercase">{t('comp_defects_diag_val')}</span>
            </div>
          </div>
        </Card>

        {/* PERFIL DE ATENUACIÓN */}
        <Card className="p-4">
          <div className="flex items-center gap-2 border-b border-border-dim/50 pb-2 mb-3">
            <TrendingDown className="h-4 w-4 text-cyan-rad" />
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              {t('comp_attenuation_title')}
            </h3>
          </div>
          <div className="h-40 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="compGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2fd" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00d2fd" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,55,0.4)" />
                <XAxis
                  dataKey="profundidad"
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 9 }}
                  label={{ value: t('comp_axis_depth'), position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 9 }}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 9 }}
                  label={{ value: t('comp_axis_dose'), angle: -90, position: 'insideLeft', offset: 15, fill: '#6b7280', fontSize: 9 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10131c',
                    border: '1px solid rgba(0,210,253,0.3)',
                    borderRadius: '4px',
                    color: '#e1e2ee',
                    fontSize: '10px',
                  }}
                  labelFormatter={(v) => `${v} cm`}
                  formatter={(v) => [`${Number(v).toFixed(3)} kGy`, t('chart_tooltip_dose')]}
                />
                <Area
                  type="monotone"
                  dataKey="dosis"
                  stroke="#00d2fd"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#compGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* DISTRIBUCIÓN DE DOSIS (Donut) */}
        <Card className="p-4">
          <div className="flex items-center gap-2 border-b border-border-dim/50 pb-2 mb-3">
            <Activity className="h-4 w-4 text-cyan-rad" />
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              {t('comp_distribution_title')}
            </h3>
          </div>
          <div className="h-40 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={translatedDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {translatedDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={6}
                  formatter={(value) => (
                    <span className="text-[9px] text-text-secondary">{value}</span>
                  )}
                  wrapperStyle={{ fontSize: '9px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10131c',
                    border: '1px solid rgba(30,41,55,0.5)',
                    borderRadius: '4px',
                    color: '#e1e2ee',
                    fontSize: '10px',
                  }}
                  formatter={(v) => [`${v}%`, 'Porcentaje']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
