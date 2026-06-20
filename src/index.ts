import express, { type Request, type Response, type NextFunction } from 'express';
import { requestLogger } from './middlewares/logger.js';
import { requireApiKey } from './middlewares/auth.js';

// importar las rutas v1, v2 para inscripciones

import v1Inscripciones from './routes/v1/inscripciones.js'
import v2Inscripciones from './routes/v2/inscripciones.js'

const app = express();
const port = 3000;

app.use(express.json());
app.use(requestLogger);
app.use(requestLogger);

app.get('/health', (req: Request, res: Response) => {
  res.json(
        {
            status: 'ok',
            ts: new Date().toISOString() 
        }     
    )
})

app.use('/v1/inscripciones', v1Inscripciones);
app.use('/v2/inscripciones', v2Inscripciones);

app.get('/v1', (req: Request, res: Response) => {

});

app.use(requireApiKey);       
app.use((_err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: 'Error interno del servidor' });
});


app.listen(port, () => {
    console.log("Servidor Iniciando")
})