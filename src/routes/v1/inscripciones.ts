import express, { Router, type Request, type Response } from 'express';
import { error } from 'node:console';
import { version } from 'node:os';

// Creamos el enrutador para manejar las rutas de este archivo
const router = Router();

// Definimos el método POST que recibirá los datos del formulario/Postman
router.post('/', (req: Request, res: Response, next) => {

    // Extraemos los datos que nos envía el cliente en el cuerpo de la petición (body)
    const { estudianteId, materias, periodoId } = req.body;

    // VALIDACIÓN: Si falta el ID, el periodo, o el arreglo de materias viene vacío (.length)
    if (!estudianteId || !materias?.length || !periodoId) {
        console.log('No existe id del estudiante o faltan datos');

        // Retornamos un estado 400 (Bad Request) con el mensaje de error en formato JSON
        return res.status(400).json({
            error: 'Campos requeridos: estudianteId, materias, periodoId'
        });
    }

    // RESPUESTA EXITOSA: Si todo está bien, responde con estado 201 (Creado)
    // Devuelve un objeto indicando que es la 'v1' junto con los datos que se procesaron
    res.status(201).json({
        version: 'v1',
        message: {
            estudianteId, 
            materias, 
            periodoId
        }
    });
});

// Exportamos este enrutador para que el index.ts lo pueda jalar en /v1/inscripciones
export default router;