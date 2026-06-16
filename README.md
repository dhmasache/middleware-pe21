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
