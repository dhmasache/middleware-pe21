import express, { Router, type Request, type Response } from 'express';
import { error } from 'node:console';
import { version } from 'node:os';

const router = Router();

const METODO_PAGO = ['Efectivo', 'Trasferencia', 'Debito', 'Credito'];

// POST
router.post('/', (req: Request, res: Response, next) => {
    const { estudianteId, materias, periodoId, metodo_pago } = req.body;

    // 1. Validar campos obligatorios
    if (!estudianteId || !materias?.length || !periodoId || !metodo_pago) {
        console.log('Faltan campos requeridos');
        return res.status(400).json({
            error: 'Campos requeridos: estudianteId, materias, periodoId, metodo_pago'
        });
    }

    // 2. Validar método de pago (Con llaves para agrupar el bloque)
    if (!METODO_PAGO.includes(metodo_pago)) {
        console.error('El metodo de pago insertado no es valido');
        return res.status(400).json({
            error: 'El metodo de pago insertado debe ser, Efectivo, Trasferencia, Debito, Credito'
        });
    }

    // 3. Respuesta exitosa si todo está correcto
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