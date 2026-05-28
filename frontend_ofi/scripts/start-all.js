import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const backendDir = path.resolve(__dirname, '../../');
const frontendDir = path.resolve(__dirname, '../');

console.log('================================================================');
console.log('  RADIOGUARD - LANZADOR INTEGRADO DE UN SOLO CLIC');
console.log('================================================================');
console.log(`[LAUNCHER] Directorio Backend: ${backendDir}`);
console.log(`[LAUNCHER] Directorio Frontend: ${frontendDir}`);

// Determine correct commands based on OS (check local venv first)
let pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

const winVenv = path.resolve(backendDir, 'venv/Scripts/python.exe');
const winDotVenv = path.resolve(backendDir, '.venv/Scripts/python.exe');
const nixVenv = path.resolve(backendDir, 'venv/bin/python');
const nixDotVenv = path.resolve(backendDir, '.venv/bin/python');

if (process.platform === 'win32') {
  if (fs.existsSync(winVenv)) {
    pythonCmd = winVenv;
  } else if (fs.existsSync(winDotVenv)) {
    pythonCmd = winDotVenv;
  }
} else {
  if (fs.existsSync(nixVenv)) {
    pythonCmd = nixVenv;
  } else if (fs.existsSync(nixDotVenv)) {
    pythonCmd = nixDotVenv;
  }
}

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

console.log(`\n[LAUNCHER] Iniciando Backend real FastAPI...`);
console.log(`[LAUNCHER] Usando Python: ${pythonCmd}`);

// Spawn Backend securely with shell: true on Windows to prevent spawning issues
const backend = spawn(pythonCmd, ['main.py'], {
  cwd: backendDir,
  stdio: 'pipe',
  shell: process.platform === 'win32',
});

let isBackendCrashing = false;

// Stream Backend output
backend.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`\x1b[36m[BACKEND]\x1b[0m ${output}`);
  }
});

backend.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.error(`\x1b[31m[BACKEND ERROR]\x1b[0m ${output}`);
    
    // Auto-detect missing dependencies
    if (output.includes('ModuleNotFoundError') || output.includes('No module named')) {
      isBackendCrashing = true;
      console.log('\n\x1b[33m┌────────────────────────────────────────────────────────────────────────┐');
      console.log('│ ⚠️  ALERTA DE SISTEMA: FALTAN DEPENDENCIAS EN TU ENTORNO PYTHON        │');
      console.log('├────────────────────────────────────────────────────────────────────────┤');
      console.log('│ Tu backend no pudo arrancar porque faltan librerías clave.              │');
      console.log('│                                                                        │');
      console.log('│ Por favor, ejecuta este comando en tu terminal para solucionarlo:      │');
      console.log('│   \x1b[1m\x1b[32mpip install -r requirements.txt\x1b[0m\x1b[33m                                      │');
      console.log('│                                                                        │');
      console.log('│ O instala las dependencias científicas de forma manual:                │');
      console.log('│   \x1b[36mpip install opencv-python tensorflow pillow fastapi uvicorn requests\x1b[0m\x1b[33m │');
      console.log('└────────────────────────────────────────────────────────────────────────┘\x1b[0m\n');
    }
  }
});

backend.on('error', (err) => {
  console.error(`\x1b[31m[LAUNCHER] Error iniciando backend:\x1b[0m`, err.message);
  console.log('\x1b[33m[LAUNCHER] Sugerencia: Asegúrate de tener Python instalado y en tu variable de entorno PATH.\x1b[0m');
});

// Spawn Frontend securely with shell: true on Windows to prevent spawn EINVAL
console.log(`\n[LAUNCHER] Iniciando Frontend React + Vite...`);
const frontend = spawn(npxCmd, ['vite'], {
  cwd: frontendDir,
  stdio: 'pipe',
  shell: process.platform === 'win32',
});

// Stream Frontend output
frontend.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`\x1b[32m[FRONTEND]\x1b[0m ${output}`);
  }
});

frontend.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.error(`\x1b[33m[FRONTEND WARN]\x1b[0m ${output}`);
  }
});

// Handle termination elegantly (Kill both on exit)
const killProcesses = () => {
  console.log('\n[LAUNCHER] Deteniendo todos los servicios en ejecución...');
  
  try {
    if (backend && !backend.killed) {
      console.log('[LAUNCHER] Deteniendo proceso Backend...');
      backend.kill('SIGINT');
    }
  } catch (e) {}

  try {
    if (frontend && !frontend.killed) {
      console.log('[LAUNCHER] Deteniendo proceso Frontend...');
      frontend.kill('SIGINT');
    }
  } catch (e) {}

  process.exit();
};

process.on('SIGINT', killProcesses);
process.on('SIGTERM', killProcesses);
process.on('exit', killProcesses);
