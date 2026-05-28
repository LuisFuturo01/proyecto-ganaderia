const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Servir la interfaz web estática
app.use(express.static(path.join(__dirname)));

// Ejemplo de proxy API con Axios para comunicarse con el Backend de Python
app.post('/api/proxy-predict', async (req, res) => {
    try {
        console.log("[NodeJS] Reenviando solicitud de análisis al backend de Python...");
        // Reenvía la petición al backend de Python en el puerto 8000 usando Axios
        const response = await axios.post("http://localhost:8000/predict-360", req.body, {
            headers: req.headers
        });
        res.json(response.data);
    } catch (error) {
        console.error("[NodeJS ERROR] Falló la comunicación con el backend:", error.message);
        res.status(500).json({ error: "No se pudo conectar con el servidor de IA de Python." });
    }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 SERVIDOR FRONTEND EXPRESS INICIADO CON ÉXITO EN EL PUERTO: ${PORT}`);
    console.log(`👉 Visita: http://localhost:${PORT}`);
    console.log(`================================================================`);
});
