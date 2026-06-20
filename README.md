## Resultados de las pruebas de funcionamiento
# (a) Sin API key -> esperado: 401
curl http://localhost:3000/health

PS C:\Users\Deyvii\Documents\api-Deyvi> curl.exe -i http://localhost:3000/health
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 39
ETag: W/"27-2CykVI0kdPiyYhzLKnAdCW0WYOY"
Date: Thu, 11 Jun 2026 20:56:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"API key inválida o ausente"}
- **Resultado:** Acceso denegado correctamente por el middleware de autenticación (401).


# (b) Con clave válida -> esperado: 200
curl -H "x-api-key: secreto-demo" http://localhost:3000/health
PS C:\Users\Deyvii\Documents\api-Deyvi> curl.exe -i -H "x-api-key: secreto-demo" http://localhost:3000/health
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 47
ETag: W/"2f-EIm53y0fH67jEfJ0pIU3ywvjNTk"
Date: Thu, 11 Jun 2026 20:58:49 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":"ok","ts":"2026-06-11T20:58:49.743Z"}
- **Resultado:** Acceso permitido y respuesta exitosa (200).

# (c) Ruta inexistente -> esperado: 404
curl -H "x-api-key: secreto-demo" http://localhost:3000/noexiste
PS C:\Users\Deyvii\Documents\api-Deyvi> curl.exe -i -H "x-api-key: secreto-demo" http://localhost:3000/noexiste
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Security-Policy: default-src 'none'
X-Content-Type-Options: nosniff
Content-Type: text/html; charset=utf-8
Content-Length: 147
Date: Thu, 11 Jun 2026 20:59:11 GMT
Connection: keep-alive
Keep-Alive: timeout=5

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /noexiste</pre>
</body>
</html>
- **Resultado:** La API responde correctamente ante rutas no definidas (404).

## Pruebas Unitarias (Testing)
PS C:\Users\Deyvii\Documents\api-Deyvi> npm test       

> api-deyvi@1.0.0 test
> jest

 PASS  src/middlewares/auth.test.ts
 PASS  src/middlewares/logger.test.ts

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.65 s, estimated 1 s
Ran all test suites.
PS C:\Users\Deyvii\Documents\api-Deyvi> 

## Documentación del Endpoint

**Endpoint Seleccionado:** Creación de Inscripciones (v2)

* **Método HTTP:** `POST`
* **Ruta:** `/v2/inscripciones`
* **Datos de Entrada (Body JSON):**
    * `estudianteId` (Obligatorio): String. Identificador del estudiante.
    * `materias` (Obligatorio): Array de Strings. Arreglo con las materias a inscribir (mínimo 1 elemento).
    * `periodoId` (Obligatorio): String. Identificador del periodo académico.
    * `metodo_pago` (Obligatorio): String. Debe ser exactamente uno de los siguientes: 'Efectivo', 'Trasferencia', 'Debito', 'Credito'.
* **Respuesta Exitosa:**
    * **Código:** `201 Created`
    * **Contenido:** Retorna un objeto JSON indicando la versión ('v2') y un objeto `message` con los datos validados de la petición.
* **Errores Posibles:**
    * **Código:** `400 Bad Request` - Si faltan campos requeridos o el arreglo de materias está vacío.
    * **Código:** `400 Bad Request` - Si el `metodo_pago` enviado no coincide con los valores permitidos.

---

## Análisis de Versionado

A continuación, se presentan dos escenarios de evolución para la API de inscripciones analizando su impacto en la compatibilidad:

### 1. Cambio compatible (Backwards-compatible)
* **Descripción:** Agregar un nuevo campo opcional llamado `fecha_registro` en la respuesta exitosa (201) de la ruta `POST /v2/inscripciones`.
* **Justificación Técnica:** Este es un cambio seguro. Los clientes que consumen la versión `v2` actualmente esperan la estructura base (`estudianteId`, `materias`, `periodoId`, `metodo_pago`). Si reciben un campo adicional que no conocen, simplemente lo ignorarán y su código no se romperá.

### 2. Cambio que rompe la compatibilidad (Breaking change)
* **Descripción:** Modificar el campo `materias` en el body del `POST /v2/inscripciones`. Actualmente es un arreglo de strings, pero se propone cambiarlo a un arreglo de objetos (ej. `[{"id": "MAT-1", "nombre": "Materia1"}]`).
* **Justificación Técnica:** Este es un *breaking change* severo. Cualquier cliente actual que envíe su petición con el formato anterior (arreglo de strings) recibirá automáticamente un error 400 de validación de nuestra API. Para implementar este cambio estructural sin romper los sistemas en producción, sería obligatorio crear una nueva versión de la API (ej. `/v3/inscripciones`).