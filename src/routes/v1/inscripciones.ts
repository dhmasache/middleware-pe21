import express, {  Router, type Request, type Response } from 'express';
import { error } from 'node:console';
import { version } from 'node:os';
//public router 
const router = Router();

//post
router.post('/', (req: Request, res: Response, next) => {

    const {estudianteId, materias, periodoId} = req.body;



    if(!estudianteId || !materias?.length || !periodoId){
    console.log('No existe id del estudiante')

    res.status(400).json(
        {
            error: 'Campos requeridos: estudianteId, materias, periodoId'
        }
    )
}
  
res.status(201).json({
    version: 'v1',
    message: {
        estudianteId, materias, periodoId
        }
    })
})

export default router;

