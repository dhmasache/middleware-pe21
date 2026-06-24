import express, { Router, type Request, type Response } from 'express';
import { error } from 'node:console';
import { version } from 'node:os';

const router = Router();

// LISTA PERMITIDA: Los únicos métodos de pago que el sistema va a aceptar
const METODO_PAGO = ['Efectivo', 'Trasferencia', 'Debito', 'Credito'];

// Definimos el método POST para la versión 2
router.post('/', (req: Request, res: Response, next) => {
    
    // Extraemos los datos que envía el cliente, incluyendo ahora 'metodo_pago'
    const { estudianteId, materias, periodoId, metodo_pago } = req.body;

    // VALIDACIÓN 1: Si falta CUALQUIERA de los 4 datos, el servidor se frena
    if (!estudianteId || !materias?.length || !periodoId || !metodo_pago) {
        console.log('Faltan campos requeridos');

        // Retorna error 400 indicando que todos los campos son obligatorios
        return res.status(400).json({
            error: 'Campos requeridos: estudianteId, materias, periodoId, metodo_pago'
        });
    }

    // VALIDACIÓN 2: Si el método de pago enviado NO está en la lista permitida
    if (!METODO_PAGO.includes(metodo_pago)) {
        console.error('El metodo de pago insertado no es valido');

        // Retorna error 400 avisando cuáles son los únicos métodos válidos
        return res.status(400).json({
            error: 'El metodo de pago insertado debe ser, Efectivo, Trasferencia, Debito, Credito'
        });
    }

    // RESPUESTA EXITOSA: Si pasa los dos filtros de arriba, responde con estado 201
    // Devuelve los datos confirmando que se guardó en la versión 2 ('v2')
    res.status(201).json({
        version: 'v2',
        message: {
            estudianteId, 
            materias, 
            periodoId, 
            metodo_pago
        }
    });
});

export default router;