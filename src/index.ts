import express, { type Request, type Response, type NextFunction } from 'express';
import { requestLogger } from './middlewares/logger.js';
import { requireApiKey } from './middlewares/auth.js';

// Importar las rutas v1, v2 para inscripciones
import v1Inscripciones from './routes/v1/inscripciones.js'
import v2Inscripciones from './routes/v2/inscripciones.js'

const app = express();
const port = 3000;

// MIDDLEWARES INICIALES
app.use(express.json()); // Permite leer datos JSON en las peticiones
app.use(requestLogger);   // Registra las peticiones en consola
app.use(requestLogger);   // Segunda llamada al registro en consola

// ENDPOINT /health
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    ts: new Date().toISOString() // Devuelve la hora actual del servidor
  })
})

// CARGA DE RUTAS DE INSCRIPCIONES (V1 y V2)
app.use('/v1/inscripciones', v1Inscripciones); // Conecta las rutas de la v1
app.use('/v2/inscripciones', v2Inscripciones); // Conecta las rutas de la v2

// ENDPOINT /v1 VACÍO
app.get('/v1', (req: Request, res: Response) => {

});

// SEGURIDAD Y ERRORES
app.use(requireApiKey); // Activa la verificación de la API Key para las rutas que sigan abajo
app.use((_err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Manejador global para responder 500 si algo falla internamente
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ESCUCHA DEL SERVIDOR
app.listen(port, () => {
    console.log("Servidor Iniciando")
})