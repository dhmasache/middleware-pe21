
Practico Experimental
PE-2.3  Lab de seguridad de acceso
Middleware y Seguridad en Base de Datos  |  Semana 8  |  2.25 pts

Instrucciones: esta guia parte del proyecto PE-2.2 que ya tienes en GitHub. Sigue cada seccion en orden. La entrega en Canvas es la URL del mismo repositorio con los nuevos archivos commiteados, mas las capturas de Postman con las tres pruebas y sus respuestas HTTP visibles.

I. Punto de partida: estado del proyecto PE-2.2
El PE-2.3 extiende el mismo repositorio del PE-2.2. Antes de escribir codigo nuevo, verifica que el punto de partida esta correcto: el servidor arranca, las rutas /v1 y /v2 responden y el middleware requireApiKey funciona.

Estructura esperada al inicio de este laboratorio
Arbol de archivos (punto de partida del PE-2.3)
middleware-pe22/
|-- package.json
|-- tsconfig.json
|-- jest.config.ts
|-- .gitignore
|-- openapi.yaml
`-- src/
    |-- index.ts
    |-- middlewares/
    |   |-- logger.ts
    |   |-- auth.ts          <- requireApiKey (sera reemplazado)
    |   `-- auth.test.ts
    `-- routes/
        |-- v1/
        |   `-- inscripciones.ts
        `-- v2/
            `-- inscripciones.ts

Verificar el punto de partida
1.   Arranca el servidor:
Terminal: arrancar el servidor
npm run dev
# Debe aparecer: Servidor en puerto 3000

2.   Abre Postman y verifica que la ruta v2 responde correctamente:
Postman — Verificacion inicial PE-2.2
Metodo:  POST
URL:     http://localhost:3000/v2/inscripciones
Headers: x-api-key: secreto-demo
         Content-Type: application/json
Body (raw JSON):
  {
    "estudianteId": "uuid-123",
    "materias": ["LTI_05A_458"],
    "periodoId": "2026-1",
    "payment_method": "scholarship"
  }

Respuesta esperada: 201 Created

Si Postman muestra 201 Created, el punto de partida es correcto. Detien el servidor (Ctrl+C) y continua con la seccion II.
Durante este laboratorio reemplazaras requireApiKey por requireJwt. Una vez instalado el nuevo middleware, las peticiones con x-api-key dejaran de funcionar: el servidor exigira un Bearer token JWT en su lugar. No borres auth.ts todavia: lo modificaras en el Paso 1.

 
II. Paso 1 - Middleware JWT con HMAC-SHA256
Reemplaza el middleware requireApiKey por requireJwt. El nuevo middleware verifica que el token Bearer es un JWT HS256 valido, rechaza el ataque alg:none y valida los claims exp y sub. Usa solo el modulo crypto de Node.js: no se instala ninguna dependencia nueva.

Por que verificar el campo alg del lado del servidor?
El encabezado de un JWT contiene el campo alg que declara el algoritmo usado para firmar el token. Si el receptor lee ese campo y lo acepta sin restriccion, un atacante puede enviar un token con alg:none y sin firma. Algunas bibliotecas JWT omiten la verificacion de firma cuando alg es none. La contramedida es fijar el algoritmo permitido del lado del servidor: si el alg del encabezado no es exactamente HS256, el token se rechaza antes de intentar verificar la firma.

Crear src/middlewares/auth.ts
Reemplaza el contenido de auth.ts con la implementacion de requireJwt. El secreto se lee de JWT_SECRET en las variables de entorno: nunca se escribe directamente en el codigo.
src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET ?? '';

function base64urlDecode(str: string): string {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

export function requireJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return res.status(401).json({ error: 'Token ausente' });

  const parts = token.split('.');
  if (parts.length !== 3) return res.status(401).json({ error: 'Token malformado' });

  const [headerB64, payloadB64, sigB64] = parts;

  // Verificar que el algoritmo declarado es HS256 (nunca confiar en alg)
  const header = JSON.parse(base64urlDecode(headerB64));
  if (header.alg !== 'HS256') return res.status(401).json({ error: 'Algoritmo no permitido' });

  // Recalcular firma y comparar con tiempo constante
  const expectedSig = createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  if (!timingSafeEqual(Buffer.from(sigB64), Buffer.from(expectedSig))) {
    return res.status(401).json({ error: 'Firma invalida' });
  }

  const claims = JSON.parse(base64urlDecode(payloadB64));

  // Validar claims obligatorios
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < now) return res.status(401).json({ error: 'Token expirado' });
  if (!claims.sub) return res.status(401).json({ error: 'Claim sub ausente' });

  (req as Request & { user?: unknown }).user = { sub: claims.sub, scope: claims.scope ?? '' };
  next();
}


timingSafeEqual compara dos buffers en tiempo constante: tarda lo mismo sin importar en que byte difieren. Una comparacion normal (===) puede filtrarse mediante ataques de temporizado: el atacante mide cuanto tarda el servidor y deduce cuantos bytes de la firma son correctos. timingSafeEqual elimina esa superficie de ataque.

Actualizar las pruebas de auth (auth.test.ts)
Los tests del PE-2.2 prueban requireApiKey. Debes actualizarlos para probar requireJwt. Si prefieres no modificar los tests existentes, crea un nuevo archivo auth-jwt.test.ts con las pruebas nuevas.
2.   Verifica que TypeScript compila sin errores despues de editar auth.ts:
Verificacion de tipos:
npx tsc --noEmit
# No debe haber errores de tipo

 
III. Paso 2 - Emisor de tokens JWT para el laboratorio
Para probar el middleware sin un Authorization Server completo, crea el script generate-token.mjs en la raiz del proyecto. El script genera un JWT HS256 valido con todos los claims requeridos. Ejecutalo una vez y copia el token para usarlo en las pruebas curl.

Claims que debe incluir el token

Claim	Valor en el laboratorio	Proposito
sub	"20251042"	Identificador del usuario. El middleware lo adjunta a req.user.
iss	"https://auth.uide.edu.ec"	Quien emitio el token (el Authorization Server).
aud	"https://api.uide.edu.ec/inscripciones"	API autorizada a consumir el token. El RS rechaza si su URI no esta aqui.
scope	"inscripciones:write"	Alcance del token: solo permite crear inscripciones.
exp	ahora + 3600 s (1 hora)	Tiempo de expiracion UNIX. El middleware rechaza tokens vencidos.
jti	UUID aleatorio	ID unico del token: permite detectar replay attacks (reutilizacion).

Crear generate-token.mjs en la raiz del proyecto
generate-token.mjs
import { createHmac } from 'crypto';

const secret = process.env.JWT_SECRET ?? 'secreto-demo-pe23';

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const header  = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const payload = base64url(JSON.stringify({
  sub:   '20251042',
  iss:   'https://auth.uide.edu.ec',
  aud:   'https://api.uide.edu.ec/inscripciones',
  scope: 'inscripciones:write',
  exp:   Math.floor(Date.now() / 1000) + 3600,
  jti:   crypto.randomUUID()
}));

const sig = createHmac('sha256', secret)
  .update(`${header}.${payload}`)
  .digest('base64url');

console.log(`${header}.${payload}.${sig}`);

Crear .env.example
Crea el archivo .env.example en la raiz del proyecto. Este archivo documenta que variables de entorno necesita el proyecto sin revelar el valor real del secreto.
.env.example
# Secreto para firmar y verificar JWT (HMAC-SHA256)
# Usa un valor largo y aleatorio en produccion
JWT_SECRET=

.env.example se commitea en el repositorio; el .env real (con el secreto) NO se commitea nunca. Agrega .env a .gitignore si no esta ya. El archivo .env.example sirve para que otros desarrolladores sepan que variables necesitan configurar al clonar el proyecto.

Generar un token y guardarlo para las pruebas
1.   Ejecuta el script para generar el token:
Terminal: generar token
# Con el secreto por defecto (para el laboratorio):
node generate-token.mjs

# Con secreto personalizado:
JWT_SECRET=mi-secreto-largo node generate-token.mjs

# El output es el token JWT (una sola linea larga):
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIy...

2.   Copia el token completo y guardalo en una variable de terminal:
Guardar el token en $TOKEN (bash/zsh):
TOKEN=$(node generate-token.mjs)
echo $TOKEN

 
IV. Paso 3 - Rate limiter y pipeline completo
Crea src/middlewares/rateLimiter.ts con una ventana de 15 minutos y MAX_REQUESTS=10 para facilitar las pruebas en el laboratorio. Luego actualiza src/index.ts para integrar los tres middlewares en el orden correcto: requestLogger -> requireJwt -> rateLimiter -> rutas.

Por que el orden del pipeline importa?
El orden de los middlewares determina que comprobacion falla primero. requestLogger actua siempre: registra incluso las peticiones rechazadas. requireJwt actua segundo: rechaza con 401 antes de gastar el contador de rate. rateLimiter actua tercero: solo cuenta peticiones con token valido. Si el orden fuera invertido, un atacante podria agotar el limite de rate con tokens invalidos y bloquear a usuarios legitimos (denial of service).

Crear src/middlewares/rateLimiter.ts
src/middlewares/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS    = 15 * 60 * 1000;  // 15 minutos
const MAX_REQUESTS = 10;               // reducido para las pruebas del lab

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['authorization'] ?? req.ip ?? 'anon';
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    return res.status(429).json({ error: 'Demasiadas peticiones. Intenta mas tarde.' });
  }

  entry.count++;
  next();
}

La clave del Map es el token Bearer completo (req.headers.authorization). Usar el token como clave limita el contador por credencial, no por IP: un atacante con multiples IPs y el mismo token sigue siendo bloqueado. En produccion se usaria Redis para que el contador persista entre reinicios y se comparta entre instancias del servidor.

Actualizar src/index.ts con el pipeline completo
Reemplaza la importacion de requireApiKey por requireJwt y agrega rateLimiter. El pipeline final tiene cuatro capas en este orden exacto.
src/index.ts — pipeline actualizado
import express, { Request, Response, NextFunction } from 'express';
import { requestLogger } from './middlewares/logger.js';
import { requireJwt }   from './middlewares/auth.js';       // reemplaza requireApiKey
import { rateLimiter }  from './middlewares/rateLimiter.js'; // nuevo
import v1Inscripciones  from './routes/v1/inscripciones.js';
import v2Inscripciones  from './routes/v2/inscripciones.js';

const app = express();

app.use(express.json());   // 1. Parseo del cuerpo
app.use(requestLogger);    // 2. Logger
app.use(requireJwt);       // 3. Autenticacion JWT
app.use(rateLimiter);      // 4. Rate limiting

app.use('/v1/inscripciones', v1Inscripciones);
app.use('/v2/inscripciones', v2Inscripciones);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(3000, () => console.log('Servidor en puerto 3000'));

1.   Verifica que TypeScript compila despues de los cambios:
Verificacion de tipos:
npx tsc --noEmit
# Sin errores de tipo

 
V. Paso 4 - Pruebas en Postman y captura de evidencia
Con el servidor corriendo y el token generado, ejecuta las tres pruebas que el laboratorio exige usando Postman. La captura de cada prueba debe mostrar la URL, el header Authorization, el body enviado y el codigo de respuesta HTTP visible al mismo tiempo. Esas tres capturas son el entregable principal del PE-2.3.

Preparacion: configurar la coleccion en Postman
1.   Arranca el servidor en la terminal con el secreto del laboratorio:
Terminal: arrancar el servidor
JWT_SECRET=secreto-demo-pe23 npm run dev

2.   Genera el token JWT y copialo al portapapeles:
Terminal: generar el token
JWT_SECRET=secreto-demo-pe23 node generate-token.mjs
# Copia toda la linea de output (el token completo)

3.   En Postman, crea una nueva coleccion llamada "PE-2.3 Seguridad JWT". La coleccion tendra tres requests, uno por cada prueba.

Prueba 1 — Token valido: esperado 201 Created
Esta prueba verifica que el middleware acepta un JWT firmado correctamente y que el pipeline completo (JWT + rate limiter + ruta) funciona.
Postman — Request 1: PE-2.3 Prueba 1 (token valido)
Metodo:  POST
URL:     http://localhost:3000/v2/inscripciones

Pestana Headers:
  Authorization: Bearer <pega aqui el token generado en el Paso 2>
  Content-Type:  application/json

Pestana Body > raw > JSON:
  {
    "estudianteId": "uuid-123",
    "materias": ["LTI_05A_458"],
    "periodoId": "2026-1",
    "payment_method": "scholarship"
  }

Respuesta esperada:  201 Created
Body de respuesta:   {"version":"v2","estudianteId":"uuid-123",...}

Como tomar la captura en Postman: antes de hacer clic en Send, abre el panel de respuesta y asegurate de que es visible. Despues de enviar, toma la captura con Windows + Shift + S seleccionando el area que muestre: la URL en la barra superior, el header Authorization en la pestana Headers, el body enviado y el codigo 201 Created en la esquina del panel de respuesta. Guarda la imagen como PE23_prueba1_201.png.

Prueba 2 — Firma invalida: esperado 401 Unauthorized
Esta prueba envia un JWT cuya firma fue adulterada. El middleware recalcula la firma esperada, la compara con la recibida y detecta que no coinciden. El servidor responde 401 sin procesar la peticion.
Postman — Request 2: PE-2.3 Prueba 2 (firma invalida)
Metodo:  POST
URL:     http://localhost:3000/v2/inscripciones

Pestana Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.FIRMA_INVALIDA
  Content-Type:  application/json

Pestana Body > raw > JSON:
  {}

Respuesta esperada:  401 Unauthorized
Body de respuesta:   {"error":"Firma invalida"}

Nota: el token de esta prueba tiene un header y payload Base64url reales (se pueden decodificar y leer), pero la firma "FIRMA_INVALIDA" no es el resultado correcto de HMAC-SHA256 sobre esos datos con el secreto del servidor. El middleware lo detecta al recalcular la firma esperada y comparar. Guarda la captura como PE23_prueba2_401.png.

Prueba 3 — Token con alg:none: esperado 401 Unauthorized
Esta prueba envia un token que declara alg:none en su encabezado, lo que significa que no tiene firma. Es el ataque de confusion de algoritmo. El middleware verifica el campo alg antes de intentar verificar la firma y rechaza el token inmediatamente.
Postman — Request 3: PE-2.3 Prueba 3 (alg:none)
Metodo:  POST
URL:     http://localhost:3000/v2/inscripciones

Pestana Headers:
  Authorization: Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.
  Content-Type:  application/json

Nota: el token termina con un punto (.) porque no tiene firma.

Pestana Body > raw > JSON:
  {}

Respuesta esperada:  401 Unauthorized
Body de respuesta:   {"error":"Algoritmo no permitido"}

El header de este token decodificado es {"alg":"none"}. Si el servidor aceptara este valor, cualquier persona podria forjarse un token con cualquier sub (identidad) sin conocer el secreto, simplemente omitiendo la firma. La contramedida es que el servidor fija el algoritmo esperado (HS256) y rechaza cualquier token cuyo alg sea diferente. Guarda la captura como PE23_prueba3_401.png.

Resumen de las tres pruebas

Prueba	Authorization enviado	Codigo esperado	Archivo de captura
Prueba 1	Bearer <token valido generado con generate-token.mjs>	201 Created	PE23_prueba1_201.png
Prueba 2	Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.FIRMA_INVALIDA	401 Unauthorized	PE23_prueba2_401.png
Prueba 3	Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.  (termina en punto)	401 Unauthorized	PE23_prueba3_401.png

 
VI. Commit final, README y entrega
Antes de entregar, asegurate de que todos los archivos nuevos estan commiteados con mensajes descriptivos y el README explica como generar un token y probar el servicio.

Secuencia de commits recomendada
git log --oneline (referencia)
a1b2c3d docs: README con instrucciones de token y pruebas curl
b2c3d4e feat: pipeline JWT + rate limiting en index.ts
c3d4e5f feat: rateLimiter con ventana 15 min y MAX_REQUESTS 10
d4e5f6g feat: script generate-token.mjs y .env.example
e5f6g7h feat: requireJwt con verificacion HS256 y timingSafeEqual
f6g7h8i ...(commits del PE-2.2)

Seccion a agregar en el README.md
README.md — seccion Seguridad JWT (Markdown)
## Seguridad JWT (PE-2.3)

### Generar un token de prueba

```bash
# Con el secreto por defecto del laboratorio:
TOKEN=$(node generate-token.mjs)

# Con secreto personalizado:
JWT_SECRET=mi-secreto-largo TOKEN=$(node generate-token.mjs)
```

### Probar el servicio

```bash
# Peticion valida (esperado: 201)
curl -X POST http://localhost:3000/v2/inscripciones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estudianteId":"uuid-123","materias":["LTI_05A_458"],"periodoId":"2026-1","payment_method":"scholarship"}'

# Token invalido (esperado: 401)
curl -X POST http://localhost:3000/v2/inscripciones \
  -H "Authorization: Bearer token.invalido.xxx"
```

### Variables de entorno

Copia `.env.example` a `.env` y configura `JWT_SECRET` con un valor secreto largo.

1.   Haz commit de todos los archivos nuevos:
Commit final:
git add src/middlewares/auth.ts
git add src/middlewares/rateLimiter.ts
git add src/index.ts
git add generate-token.mjs
git add .env.example
git add README.md
git commit -m "feat(pe-2.3): JWT HS256 + rate limiting, reemplaza requireApiKey"
git push origin main

Lista de verificacion
Marca cada punto antes de entregar la URL y el log en Canvas.

	Verificacion	Como comprobarlo
[]	auth.ts con requireJwt	Exporta requireJwt con verificacion de alg, timingSafeEqual y claims exp y sub
[]	Rechazo de alg:none	Prueba 3 devuelve HTTP 401 con {"error":"Algoritmo no permitido"}
[]	Verificacion en tiempo constante	Se usa createHmac + timingSafeEqual: no === para comparar firmas
[]	generate-token.mjs	El script existe en la raiz y genera un JWT con sub, iss, aud, scope, exp, jti
[]	.env.example	El archivo tiene la clave JWT_SECRET= sin valor real
[]	rateLimiter.ts	WINDOW_MS=15 min, MAX_REQUESTS=10, responde 429 con Retry-After
[]	Pipeline en orden	index.ts: express.json -> requestLogger -> requireJwt -> rateLimiter -> rutas
[]	Prueba 1 documentada	Log o captura muestra peticion valida con HTTP 201
[]	Prueba 2 documentada	Log o captura muestra firma invalida con HTTP 401
[]	Prueba 3 documentada	Log o captura muestra alg:none con HTTP 401
[]	README actualizado	Tiene instrucciones para generar el token y probar el servicio
[]	Repositorio publico	La URL se abre en ventana de incognito sin iniciar sesion en GitHub

