import { useSimulationStore } from '../store/useSimulationStore';

export type TranslationKey = keyof typeof DICTIONARY.es;

const DICTIONARY = {
  es: {
    // ── Header ──
    'sys_status_ready': 'SISTEMA LISTO',
    'sys_status_processing': 'PROCESANDO LOTE',
    'sys_status_completed': 'ANÁLISIS COMPLETADO',
    'sys_sub': 'Sistema de Dosimetría Predictiva • Hackathon Nuclear Boliviano',
    'sys_processor': 'PROCESADOR IA:',
    'btn_new_batch': 'NUEVO LOTE',
    'btn_simulate': 'DEMO SIMULAR',
    'tooltip_new_batch': 'Sube una imagen de lote agrícola para iniciar análisis',
    'tooltip_simulate': 'Carga una simulación de demostración con datos predeterminados',

    // ── Sidebar ──
    'menu_title': 'Monitoreo en Tiempo Real',
    'menu_dashboard': 'Dashboard',
    'menu_analysis3d': 'Análisis 3D',
    'menu_dosimetry': 'Dosimetría',
    'menu_comparative': 'Comparativa',
    'menu_reports': 'Reportes',
    'menu_history': 'Historial',
    'sidebar_desc_dashboard': 'Vista principal del sistema',
    'sidebar_desc_analysis3d': 'Reconstrucción y geometría',
    'sidebar_desc_dosimetry': 'Atenuación e indicadores físicos',
    'sidebar_desc_comparative': 'Control de calidad Antes/Después',
    'sidebar_desc_reports': 'Generación de informes fitosanitarios',
    'sidebar_desc_history': 'Histórico de lotes analizados',
    'sidebar_disabled_tooltip': 'Requiere cargar datos de simulación primero',
    'telemetry_title': 'TELEMETRÍA NUCLEAR',
    'telemetry_status': 'ESTADO:',
    'telemetry_status_val': 'ONLINE',
    'telemetry_hz': 'FLUJO HZ:',

    // ── Footer ──
    'footer_core_status': 'ESTADO CORE:',
    'footer_core_nominal': 'NOMINAL',
    'footer_engine': 'MOTOR DE RENDIMIENTO:',
    'footer_phase': 'FASE ACTIVA:',
    'footer_fps': 'FPS RENDIMIENTO:',

    // ── PhaseNavigation ──
    'nav_title': 'MONITOR DE PROCESO',
    'phase_1': '1. Recepción',
    'phase_2': '2. Escaneo 3D',
    'phase_3': '3. Irradiación',
    'phase_4': '4. Salida',
    'phase_5': '5. Comparativa',
    'phase_1_desc': 'Llegada de tubérculo',
    'phase_2_desc': 'Reconstrucción láser e IA',
    'phase_3_desc': 'Dosimetría activa',
    'phase_4_desc': 'Verificación final',
    'phase_5_desc': 'Antes vs Después',

    // ── Classification Panel ──
    'class_title': 'Segmentación YOLOv8',
    'class_status': 'CLASIFICADO',
    'class_detected': 'PRODUCTO DETECTADO',
    'class_confidence': 'CONFIANZA DEL MODELO',
    'class_footer_net': 'RED: Segmentación de Instancias',

    // ── Geometry Panel ──
    'geom_title': 'Análisis Geométrico 3D',
    'geom_laser_active': 'LÁSER ACTIVO',
    'geom_volume': 'Volumen',
    'geom_area': 'Área Superficie',
    'geom_sphericity': 'Esfericidad',
    'geom_sphericity_spherical': 'Excelente (Esférico)',
    'geom_sphericity_irregular': 'Irregular',
    'geom_concavities': 'Concavidades',
    'geom_concavities_sub': 'Depresiones en malla',
    'geom_footer_mesh': 'Malla: BufferGeometry',
    'geom_footer_hw': 'Hardware: Escáner LiDAR v3',

    // ── Surface Panel ──
    'surf_title': 'Cromatismo e Imperfecciones',
    'surf_avg_color': 'COLOR PROMEDIO HSV',
    'surf_spots': 'MANCHAS AISLADAS',
    'surf_spots_unit': 'focos',
    'surf_damaged_area': 'ÁREA SUPERFICIAL DAÑADA',
    'surf_fitosanitario': 'ESTADO FITOSANITARIO:',
    'surf_severity_safe': 'BAJO / ACEPTABLE',
    'surf_severity_warning': 'MODERADO',
    'surf_severity_critical': 'ALTO / RIESGO',
    'surf_footer_cam': 'Cámara: Sensor Multiespectral v2',

    // ── Dosimetry Indicators Panel ──
    'ind_title': 'Indicadores Físico-Biológicos',
    'ind_badge': 'DOSIS OK',
    'ind_energy': 'Energía Depositada',
    'ind_coef': 'Coef. Atenuación (μ)',
    'ind_uniformity': 'Uniformidad (Dmax/Dmin)',
    'ind_density': 'Densidad Estimada',
    'ind_ebr': 'Efecto Biol. Relativo',
    'ind_reduction': 'Reducción Carga Microb.',
    'ind_rec_summary': 'DOSIS CALCULADA PARA:',
    'ind_footer_source': 'Fuente: Cobalto-60 / Haz de Electrones',
    'ind_footer_std': 'Normativa: BOL-OSN-2026',

    // ── Attenuation Chart Panel ──
    'chart_title': 'Atenuación vs Profundidad',
    'chart_badge': 'SIMULACIÓN MONTE CARLO',
    'chart_tooltip_depth': 'Profundidad:',
    'chart_tooltip_dose': 'Dosis',
    'chart_footer_res': 'Resolución: 8 capas / radial',
    'chart_footer_alg': 'Algoritmo: Decaimiento Exponencial (Beer-Lambert)',

    // ── Before / After Panels ──
    'panel_before_title': 'LOTE SIN IRRADIAR (ANÁLISIS PREVIO)',
    'panel_before_badge': 'CARGA DETECTADA',
    'panel_before_bact': 'Carga Bacteriana Estimada:',
    'panel_before_germ': 'Estado de Germinación:',
    'panel_before_germ_val': 'PROPENSO / ACTIVO',
    'panel_before_anom': 'Piel con anomalías:',
    'panel_before_lifetime': 'Tiempo de vida útil estimado:',
    'panel_before_lifetime_val': '~ 5 a 8 días',
    'panel_before_footer_tech': 'Evaluado: YOLOv8-seg + RGB',
    'panel_before_footer_alert': 'Alerta: Tratamiento Requerido',

    'panel_after_title': 'LOTE IRRADIADO (DOSIS SIMULADA)',
    'panel_after_badge': 'TRATAMIENTO APLICADO',
    'panel_after_bact': 'Carga Bacteriana Residual:',
    'panel_after_germ': 'Estado de Germinación:',
    'panel_after_germ_val': 'COMPLETAMENTE INHIBIDO',
    'panel_after_disinfest': 'Efecto de Desinfestación (plagas):',
    'panel_after_disinfest_val': '100.00% EFECTIVIDAD',
    'panel_after_lifetime': 'Tiempo de vida útil extendido:',
    'panel_after_lifetime_val': '+ 15 a 20 días adicionales',
    'panel_after_footer_status': 'Estado Fitosanitario: APROBADO',
    'panel_after_footer_desc': 'Apto para Consumo Humano y Exportación',

    // ── Processing Modal ──
    'modal_title': 'EJECUTANDO ANALÍTICA E IRRADIACIÓN PREDICTIVA',
    'modal_subtitle': 'Procesamiento de Lote Fitosanitario en Progreso',
    'modal_step_label': 'Paso Actual:',
    'modal_footer_status': 'Estado: Conectado a Core Python',
    'modal_footer_remaining': 'Restante aprox:',
    'btn_cancel_sim': 'CANCELAR SIMULACIÓN',

    // ── Simulation Placeholder ──
    'place_title': 'Telemetría y Control de Cinta Transportadora 3D',
    'place_badge': 'MOTOR THREE.JS PREPARADO',
    'place_dosing': 'DOSIFICANDO',
    'place_scanning': 'ESCANEANDO',
    'place_batch_label': 'LOTE #04',
    'place_tunnel_reception': 'RECEPCIÓN',
    'place_tunnel_scan': 'ESCÁNER',
    'place_tunnel_irrad': 'IRRADIACIÓN',
    'place_tunnel_output': 'SALIDA',
    'place_footer_cam': 'Cámara Virtual: Perspectiva Activa',
    'place_footer_mode': 'Modo: Pre-render 3D Canvas',

    // ── Comparative View ──
    'comp_title': 'ANÁLISIS COMPARATIVO',
    'comp_subtitle': 'Antes vs Después de la Irradiación',
    'comp_btn_back': 'VOLVER AL DASHBOARD',
    'comp_btn_export': 'EXPORTAR REPORTE',
    'comp_dosimetry_title': 'Dosimetría Nuclear',
    'comp_dose_surf': 'Dosis en superficie',
    'comp_dose_center': 'Dosis en centro',
    'comp_dose_uniformity': 'Uniformidad Dmáx/Dmin',
    'comp_dose_reduction': 'Reducción bacteriana',
    'comp_dose_purpose': 'Propósito',
    'comp_defects_title': 'Defectos Detectados',
    'comp_defects_surf': 'Superficie dañada',
    'comp_defects_spots': 'Manchas aisladas',
    'comp_defects_cav': 'Cavidades profundas',
    'comp_defects_diag': 'Diagnóstico',
    'comp_defects_diag_val': 'Vulnerable',
    'comp_attenuation_title': 'Perfil de Atenuación (kGy)',
    'comp_distribution_title': 'Distribución de Dosis',
    'comp_axis_depth': 'Profundidad (cm)',
    'comp_axis_dose': 'Dosis (kGy)',

    // ── App Start & Core Views ──
    'start_title': 'INICIAR SISTEMA RADIOGUARD',
    'start_desc': 'Bienvenido al Centro de Control de Dosimetría Predictiva. Inicie la demostración interactiva o suba una imagen de lote agrícola para comenzar con la segmentación y simulación dosimétrica.',
    'start_yolo': 'Detección por YOLOv8',
    'start_atten': 'Cálculo de Atenuación 3D',
    'rep_title': 'Reporte Fitosanitario Automatizado',
    'rep_generating': 'Generando informe de lote #04...',
    'rep_class': '• Clasificación: Papa (Confianza 98.7%)',
    'rep_dose': '• Dosis Aplicada: 0.12 kGy',
    'rep_microb': '• Reducción Microbiana: 4.2 log10',
    'rep_approved': '• Estado final: Aprobado sin observaciones de fitotoxicidad.',
    'rep_btn_download': 'DESCARGAR PDF FIRMADO',
    'hist_title': 'Historial de Lotes',
    'hist_th_id': 'ID LOTE',
    'hist_th_date': 'FECHA',
    'hist_th_var': 'VARIEDAD',
    'hist_th_dose': 'DOSIS (kGy)',
    'hist_th_status': 'ESTADO',
    'hist_completed': 'COMPLETADO',
    // ── Image Uploader ──
    'uploader_title_drag': 'Arrastra tus imágenes aquí o haz clic para explorar',
    'uploader_subtitle': 'Soporta de 1 a 4 imágenes en 360° (vistas diferentes)',
    'uploader_btn_analyze': 'INICIAR ANÁLISIS 360°',
    'uploader_btn_clear': 'LIMPIAR LOTE',
    'uploader_limit': 'Máximo 4 imágenes en formato JPG, PNG',
    'uploader_previews': 'Imágenes de Entrada en 360°',
    'uploader_drop_active': '¡Suelta las imágenes aquí!',
    'uploader_tab_manual': 'Subir Fotos Manuales',
    'uploader_tab_camera': 'Escáner Cámara 360',
    'camera_waiting_title': 'Esperando Escaneo 360 en Cámara Local...',
    'camera_waiting_desc': 'Por favor, presiona la tecla C en la ventana de cámara abierta localmente para capturar los cuadrantes. Al completarse, el backend inyectará de forma automática el modelo 3D y las simulaciones en este panel en tiempo real.',
    'camera_status_connected': 'Cámara Local Conectada Real-Time',
    'camera_status_disconnected': 'Cámara Local Desconectada',
    // ── Financial Operational B2B ──
    'fin_title': 'Impacto Operativo & Financiero B2B',
    'fin_shelf_life': 'Vida Útil Post-Irradiación',
    'fin_days_remaining': 'Vida útil restante',
    'fin_days_gained': 'Días ganados por irradiación',
    'fin_projection_status': 'Estado de proyección',
    'fin_industry_dose': 'Dosis Estándar Industria',
    'fin_time_saved': 'Tiempo ahorrado por lote',
    'fin_direct_savings': 'Ahorro directo por unidad',
    'fin_projected_savings': 'Ahorro por Tonelada',
    'fin_throughput': 'Optimización de Rendimiento',
  },
  en: {
    // ── Header ──
    'sys_status_ready': 'SYSTEM READY',
    'sys_status_processing': 'PROCESSING BATCH',
    'sys_status_completed': 'ANALYSIS COMPLETED',
    'sys_sub': 'Predictive Dosimetry System • Bolivian Nuclear Hackathon',
    'sys_processor': 'AI PROCESSOR:',
    'btn_new_batch': 'NEW BATCH',
    'btn_simulate': 'DEMO SIMULATE',
    'tooltip_new_batch': 'Upload a crop batch image to start analysis',
    'tooltip_simulate': 'Load a demo simulation with default data',

    // ── Sidebar ──
    'menu_title': 'Real-Time Monitoring',
    'menu_dashboard': 'Dashboard',
    'menu_analysis3d': '3D Analysis',
    'menu_dosimetry': 'Dosimetry',
    'menu_comparative': 'Comparative',
    'menu_reports': 'Reports',
    'menu_history': 'History',
    'sidebar_desc_dashboard': 'System main view',
    'sidebar_desc_analysis3d': 'Reconstruction and geometry',
    'sidebar_desc_dosimetry': 'Attenuation and physical indicators',
    'sidebar_desc_comparative': 'Before/After quality control',
    'sidebar_desc_reports': 'Phytosanitary reports generation',
    'sidebar_desc_history': 'History of analyzed batches',
    'sidebar_disabled_tooltip': 'Requires loading simulation data first',
    'telemetry_title': 'NUCLEAR TELEMETRY',
    'telemetry_status': 'STATUS:',
    'telemetry_status_val': 'ONLINE',
    'telemetry_hz': 'HZ FLOW:',

    // ── Footer ──
    'footer_core_status': 'CORE STATUS:',
    'footer_core_nominal': 'NOMINAL',
    'footer_engine': 'PERFORMANCE ENGINE:',
    'footer_phase': 'ACTIVE PHASE:',
    'footer_fps': 'PERFORMANCE FPS:',

    // ── PhaseNavigation ──
    'nav_title': 'PROCESS MONITOR',
    'phase_1': '1. Reception',
    'phase_2': '2. 3D Scan',
    'phase_3': '3. Irradiation',
    'phase_4': '4. Output',
    'phase_5': '5. Comparative',
    'phase_1_desc': 'Tuber arrival',
    'phase_2_desc': 'Laser & AI reconstruction',
    'phase_3_desc': 'Active dosimetry',
    'phase_4_desc': 'Final verification',
    'phase_5_desc': 'Before vs After',

    // ── Classification Panel ──
    'class_title': 'YOLOv8 Segmentation',
    'class_status': 'CLASSIFIED',
    'class_detected': 'DETECTED PRODUCT',
    'class_confidence': 'MODEL CONFIDENCE',
    'class_footer_net': 'NETWORK: Instance Segmentation',

    // ── Geometry Panel ──
    'geom_title': '3D Geometric Analysis',
    'geom_laser_active': 'LASER ACTIVE',
    'geom_volume': 'Volume',
    'geom_area': 'Surface Area',
    'geom_sphericity': 'Sphericity',
    'geom_sphericity_spherical': 'Excellent (Spherical)',
    'geom_sphericity_irregular': 'Irregular',
    'geom_concavities': 'Concavities',
    'geom_concavities_sub': 'Mesh depressions',
    'geom_footer_mesh': 'Mesh: BufferGeometry',
    'geom_footer_hw': 'Hardware: LiDAR Scanner v3',

    // ── Surface Panel ──
    'surf_title': 'Colorimetry & Imperfections',
    'surf_avg_color': 'AVERAGE HSV COLOR',
    'surf_spots': 'ISOLATED SPOTS',
    'surf_spots_unit': 'spots',
    'surf_damaged_area': 'DAMAGED SURFACE AREA',
    'surf_fitosanitario': 'PHYTOSANITARY STATUS:',
    'surf_severity_safe': 'LOW / ACCEPTABLE',
    'surf_severity_warning': 'MODERATE',
    'surf_severity_critical': 'HIGH / RISK',
    'surf_footer_cam': 'Camera: Multispectral Sensor v2',

    // ── Dosimetry Indicators Panel ──
    'ind_title': 'Physical-Biological Indicators',
    'ind_badge': 'DOSE OK',
    'ind_energy': 'Deposited Energy',
    'ind_coef': 'Atten. Coef. (μ)',
    'ind_uniformity': 'Uniformity (Dmax/Dmin)',
    'ind_density': 'Estimated Density',
    'ind_ebr': 'Relative Biol. Effect',
    'ind_reduction': 'Microb. Load Reduction',
    'ind_rec_summary': 'CALCULATED DOSE FOR:',
    'ind_footer_source': 'Source: Cobalt-60 / Electron Beam',
    'ind_footer_std': 'Standard: BOL-OSN-2026',

    // ── Attenuation Chart Panel ──
    'chart_title': 'Attenuation vs Depth',
    'chart_badge': 'MONTE CARLO SIMULATION',
    'chart_tooltip_depth': 'Depth:',
    'chart_tooltip_dose': 'Dose',
    'chart_footer_res': 'Resolution: 8 layers / radial',
    'chart_footer_alg': 'Algorithm: Exponential Decay (Beer-Lambert)',

    // ── Before / After Panels ──
    'panel_before_title': 'UNIRRADIATED BATCH (PREVIOUS ANALYSIS)',
    'panel_before_badge': 'LOAD DETECTED',
    'panel_before_bact': 'Estimated Bacterial Load:',
    'panel_before_germ': 'Germination Status:',
    'panel_before_germ_val': 'PRONE / ACTIVE',
    'panel_before_anom': 'Skin with anomalies:',
    'panel_before_lifetime': 'Estimated shelf life:',
    'panel_before_lifetime_val': '~ 5 to 8 days',
    'panel_before_footer_tech': 'Evaluated: YOLOv8-seg + RGB',
    'panel_before_footer_alert': 'Alert: Treatment Required',

    'panel_after_title': 'IRRADIATED BATCH (SIMULATED DOSE)',
    'panel_after_badge': 'TREATMENT APPLIED',
    'panel_after_bact': 'Residual Bacterial Load:',
    'panel_after_germ': 'Germination Status:',
    'panel_after_germ_val': 'COMPLETELY INHIBITED',
    'panel_after_disinfest': 'Pest disinfestation effect:',
    'panel_after_disinfest_val': '100.00% EFFECTIVENESS',
    'panel_after_lifetime': 'Extended shelf life:',
    'panel_after_lifetime_val': '+ 15 to 20 additional days',
    'panel_after_footer_status': 'Phytosanitary Status: APPROVED',
    'panel_after_footer_desc': 'Fit for Human Consumption and Export',

    // ── Processing Modal ──
    'modal_title': 'EXECUTING PREDICTIVE IRRADIATION & ANALYTICS',
    'modal_subtitle': 'Phytosanitary Batch Processing in Progress',
    'modal_step_label': 'Current Step:',
    'modal_footer_status': 'Status: Connected to Python Core',
    'modal_footer_remaining': 'Approx. remaining:',
    'btn_cancel_sim': 'CANCEL SIMULATION',

    // ── Simulation Placeholder ──
    'place_title': '3D Conveyor Belt Control & Telemetry',
    'place_badge': 'THREE.JS ENGINE READY',
    'place_dosing': 'DOSING',
    'place_scanning': 'SCANNING',
    'place_batch_label': 'BATCH #04',
    'place_tunnel_reception': 'RECEPTION',
    'place_tunnel_scan': 'SCANNER',
    'place_tunnel_irrad': 'IRRADIATION',
    'place_tunnel_output': 'OUTPUT',
    'place_footer_cam': 'Virtual Camera: Active Perspective',
    'place_footer_mode': 'Mode: Pre-render 3D Canvas',

    // ── Comparative View ──
    'comp_title': 'COMPARATIVE ANALYSIS',
    'comp_subtitle': 'Before vs After Irradiation',
    'comp_btn_back': 'BACK TO DASHBOARD',
    'comp_btn_export': 'EXPORT REPORT',
    'comp_dosimetry_title': 'Nuclear Dosimetry',
    'comp_dose_surf': 'Surface dose',
    'comp_dose_center': 'Core dose',
    'comp_dose_uniformity': 'Uniformity Dmax/Dmin',
    'comp_dose_reduction': 'Bacterial reduction',
    'comp_dose_purpose': 'Purpose',
    'comp_defects_title': 'Detected Defects',
    'comp_defects_surf': 'Damaged surface',
    'comp_defects_spots': 'Isolated spots',
    'comp_defects_cav': 'Deep concavities',
    'comp_defects_diag': 'Diagnosis',
    'comp_defects_diag_val': 'Vulnerable',
    'comp_attenuation_title': 'Attenuation Profile (kGy)',
    'comp_distribution_title': 'Dose Distribution',
    'comp_axis_depth': 'Depth (cm)',
    'comp_axis_dose': 'Dose (kGy)',

    // ── App Start & Core Views ──
    'start_title': 'START RADIOGUARD SYSTEM',
    'start_desc': 'Welcome to the Predictive Dosimetry Control Center. Start the interactive demo or upload a crop batch image to begin with the segmentation and dosimetry simulation.',
    'start_yolo': 'YOLOv8 Detection',
    'start_atten': '3D Attenuation Calculation',
    'rep_title': 'Automated Phytosanitary Report',
    'rep_generating': 'Generating report for batch #04...',
    'rep_class': '• Classification: Potato (Confidence 98.7%)',
    'rep_dose': '• Applied Dose: 0.12 kGy',
    'rep_microb': '• Microbial Reduction: 4.2 log10',
    'rep_approved': '• Final state: Approved without phytotoxicity observations.',
    'rep_btn_download': 'DOWNLOAD SIGNED PDF',
    'hist_title': 'Batch History',
    'hist_th_id': 'BATCH ID',
    'hist_th_date': 'DATE',
    'hist_th_var': 'VARIETY',
    'hist_th_dose': 'DOSE (kGy)',
    'hist_th_status': 'STATUS',
    'hist_completed': 'COMPLETED',
    // ── Image Uploader ──
    'uploader_title_drag': 'Drag your images here or click to browse',
    'uploader_subtitle': 'Supports 1 to 4 images in 360° (different viewpoints)',
    'uploader_btn_analyze': 'START 360° ANALYSIS',
    'uploader_btn_clear': 'CLEAR BATCH',
    'uploader_limit': 'Maximum 4 images in JPG, PNG formats',
    'uploader_previews': '360° Input Viewpoints',
    'uploader_drop_active': 'Drop the images here!',
    'uploader_tab_manual': 'Upload Photos',
    'uploader_tab_camera': '360° Camera Scanner',
    'camera_waiting_title': 'Waiting for 360° Scan from Local Camera...',
    'camera_waiting_desc': 'Please press the C key in the locally opened camera window to capture the viewpoints. Upon completion, the backend will automatically inject the 3D model and simulations into this panel in real-time.',
    'camera_status_connected': 'Local Camera Connected Real-Time',
    'camera_status_disconnected': 'Local Camera Disconnected',
    // ── Financial Operational B2B ──
    'fin_title': 'B2B Financial & Operational Impact',
    'fin_shelf_life': 'Post-Irradiation Shelf Life',
    'fin_days_remaining': 'Remaining shelf life',
    'fin_days_gained': 'Days gained by irradiation',
    'fin_projection_status': 'Projection status',
    'fin_industry_dose': 'Industry Standard Dose',
    'fin_time_saved': 'Saved time per batch',
    'fin_direct_savings': 'Direct savings per unit',
    'fin_projected_savings': 'Savings per Ton',
    'fin_throughput': 'Throughput Optimization',
  },
};

export const useTranslation = () => {
  const { language } = useSimulationStore();

  const t = (key: TranslationKey): string => {
    return DICTIONARY[language][key] || DICTIONARY['es'][key] || key;
  };

  /** Dynamic translation helpers */
  const tVegetable = (tipo: string): string => {
    if (language === 'en') {
      switch (tipo?.toLowerCase()) {
        case 'papa': return 'Potato (Solanum tuberosum)';
        case 'manzana': return 'Apple (Malus domestica)';
        case 'tomate': return 'Tomato (Solanum lycopersicum)';
        case 'cebolla': return 'Onion (Allium cepa)';
        case 'planta': return 'Plant';
        default: return 'Undefined Agricultural Variety';
      }
    } else {
      switch (tipo?.toLowerCase()) {
        case 'papa': return 'Papa (Solanum tuberosum)';
        case 'manzana': return 'Manzana (Malus domestica)';
        case 'tomate': return 'Tomate (Solanum lycopersicum)';
        case 'cebolla': return 'Cebolla (Allium cepa)';
        case 'planta': return 'Cultivo';
        default: return 'Variedad Agrícola Indefinida';
      }
    }
  };

  const tVegetableSimple = (tipo: string): string => {
    if (language === 'en') {
      switch (tipo?.toLowerCase()) {
        case 'papa': return 'POTATO';
        case 'manzana': return 'APPLE';
        case 'tomate': return 'TOMATO';
        case 'cebolla': return 'ONION';
        case 'planta': return 'PLANT';
        default: return tipo?.toUpperCase();
      }
    } else {
      return tipo?.toUpperCase();
    }
  };

  const tPurpose = (proposito: string): string => {
    if (language === 'en') {
      switch (proposito) {
        case 'Inhibicion de germinacion':
        case 'Inhibición de germinación': return 'Sprout inhibition';
        case 'Retraso de maduracion':
        case 'Retraso de maduración': return 'Ripening delay';
        case 'Desinfestacion de plagas':
        case 'Desinfestación de plagas': return 'Pest disinfestation';
        case 'Control microbiano': return 'Microbial control';
        default: return proposito;
      }
    } else {
      switch (proposito) {
        case 'Inhibicion de germinacion':
        case 'Inhibición de germinación': return 'Inhibición de germinación';
        case 'Retraso de maduracion':
        case 'Retraso de maduración': return 'Retraso de maduración';
        case 'Desinfestacion de plagas':
        case 'Desinfestación de plagas': return 'Desinfestación de plagas';
        case 'Control microbiano': return 'Control microbiano';
        default: return proposito;
      }
    }
  };

  const tPhase = (phase: string): string => {
    if (language === 'en') {
      switch (phase) {
        case 'idle': return 'System Idle';
        case 'reception': return 'Reception';
        case 'scanning': return '3D Scanning';
        case 'irradiation': return 'Active Irradiation';
        case 'output': return 'Treated Output';
        case 'comparative': return 'Comparative';
        default: return phase;
      }
    } else {
      switch (phase) {
        case 'idle': return 'Sistema Inactivo';
        case 'reception': return 'Recepción';
        case 'scanning': return 'Escaneo 3D';
        case 'irradiation': return 'Irradiación Activa';
        case 'output': return 'Salida Tratada';
        case 'comparative': return 'Comparativa';
        default: return phase;
      }
    }
  };

  const tStep = (step: string): string => {
    if (language === 'en') {
      switch (step) {
        case 'Recepción': return 'Reception';
        case 'Escaneo': return 'Scanning';
        case 'Procesando': return 'Processing';
        case 'Irradiación': return 'Irradiation';
        case 'Resultados': return 'Results';
        default: return step;
      }
    } else {
      return step;
    }
  };

  return { t, tVegetable, tVegetableSimple, tPurpose, tPhase, tStep, language };
};
