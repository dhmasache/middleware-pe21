import { Router, type Request, type Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { estudianteId, materias, periodoId, payment_method } = req.body;

  if (!estudianteId || !materias?.length || !periodoId || !payment_method) {
    return res.status(400).json({
      error: 'Campos requeridos: estudianteId, materias, periodoId, payment_method'
    });
  }

  res.status(201).json({
    version: 'v2',
    estudianteId,
    materias,
    periodoId,
    payment_method
  });
});

export default router;
