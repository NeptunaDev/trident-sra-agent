# Trident Agent - Endpoints (body y respuesta)

Base URL (API): `http://localhost:3417`

Prefijo: `/api/v1`

> Errores de validación: si falla `express-validator` responde `400`:
> - JSON: `{ "error": "<primer mensaje>" }`

---

## Sesiones (`/api/v1/sessions`)

### GET `/api/v1/sessions?page=&limit=`

Body: no

Query:
- `page` (opcional, int >= 1)
- `limit` (opcional, int 1-50)

Respuesta `200`:
```json
{
  "sessions": [
    {
      "connectionName": "string",
      "sessionId": "string",
      "videoPath": "string",
      "typescriptPath": "string",
      "createdAt": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### GET `/api/v1/sessions/active`

Body: no

Respuesta `200`:
```json
{
  "active": [
    {
      "sessionId": "string",
      "connectionId": "string",
      "connectionType": "string",
      "startedAt": "string",
      "elapsedSeconds": 0
    }
  ],
  "count": 0,
  "limit": 5
}
```

### POST `/api/v1/sessions/clean-recordings`

Body: no

Respuesta `200`:
```json
{
  "ok": true,
  "deletedRecordings": 0,
  "deletedTypescript": 0,
  "message": "Eliminados <deletedRecordings> archivo(s) en recordings, <deletedTypescript> en typescript y vaciado el listado de sesiones."
}
```

### DELETE `/api/v1/sessions`

Alias de `POST /api/v1/sessions/clean-recordings`

Body: no

Respuesta `200`: igual que `POST /api/v1/sessions/clean-recordings`

### DELETE `/api/v1/sessions/active/:sessionId`

Body: no

Params:
- `sessionId` (string, obligatorio)

Respuesta `200`:
```json
{
  "ok": true,
  "sessionId": "string",
  "socketClosed": <boolean>
}
```

Si no existe:
- `404` JSON: `{ "error": "Sesión activa no encontrada" }`

### DELETE `/api/v1/sessions/:sessionId`

Body: no

Params:
- `sessionId` (string, obligatorio)

Respuesta `200`:
```json
{
  "ok": true,
  "deletedVideo": true,
  "deletedTypescript": true,
  "deletedTiming": false,
  "message": "Sesión <sessionId> eliminada."
}
```

Si no existe:
- `404` JSON: `{ "error": "Sesión no encontrada" }`

Error interno (raro):
- `500` JSON: `{ "error": "No se pudo eliminar la sesión del listado" }`

---

## Guacamole / tokens (`/api/v1/guacamole`)

### GET `/api/v1/guacamole/token?connection=<id>`

Body: no

Query:
- `connection` (obligatorio): debe existir en `src/api/config.js` en `connections`
  (ejemplos: `ubuntu-vnc`, `ubuntu-ssh`, `windows-rdp`)

Respuesta `200`:
```json
{ "token": "string" }
```

Si se alcanzó el límite:
- `429` JSON:
```json
{
  "error": "Límite de sesiones activas alcanzado",
  "limit": 5,
  "current": 5
}
```

Errores internos:
- `500` JSON: `{ "error": "No se pudo generar el token" }`

### POST `/api/v1/guacamole/token`

Body: `application/json`
```json
{
  "type": "vnc | ssh | rdp",
  "hostname": "string",
  "port": 1,
  "username": "string (obligatorio para ssh/rdp; opcional para vnc)",
  "password": "string (obligatorio para ssh/rdp)"
}
```

Respuesta `200`:
```json
{ "token": "string" }
```

Si se alcanzó el límite:
- `429` JSON: `{ "error": "Límite de sesiones activas alcanzado", "limit": <number>, "current": <number> }`

Errores internos:
- `500` JSON: `{ "error": "No se pudo generar el token de conexión personalizada" }`

---

## Ver archivos de sesión (`/api/v1/view`)

### GET `/api/v1/view/log?sessionId=<id>`

Body: no

Query:
- `sessionId` (obligatorio)

Respuesta `200`:
- Envía el archivo `.typescript` como `text/plain; charset=utf-8` (contenido del archivo)

Si no existe:
- `404` texto plano: `Archivo no encontrado`

### GET `/api/v1/view/video?sessionId=<id>`

Body: no

Query:
- `sessionId` (obligatorio)

Respuesta `200`:
- Envía el archivo `.guac` como `application/octet-stream`

Si no existe:
- `404` texto plano: `Archivo no encontrado`

---

## Logs internos (`/api/v1/internal`)

### GET `/api/v1/internal/logs?level=&limit=&search=`

Body: no

Query:
- `level` (opcional): puede venir como `INFO` o `INFO,ERROR`
- `limit` (opcional): número (default interno 200, con tope 2000)
- `search` (opcional): filtra por texto en `message`

Respuesta `200`:
```json
{
  "logs": [
    {
      "id": "string",
      "level": "INFO|WARN|ERROR",
      "message": "string",
      "timestamp": "ISO-8601 string",
      "sessionId": "string"
    }
  ]
}
```

### DELETE `/api/v1/internal/logs`

Body: no

Respuesta `200`:
```json
{ "ok": true }
```

### GET `/api/v1/internal/status`

Body: no

Respuesta `200`:
```json
{
  "apiPort": 3417,
  "wsPort": <config.WEBSOCKET_PORT>,
  "apiOk": true,
  "wsOk": true,
  "guacdOk": <boolean>
}
```

---

## Alias health (`/api/v1/health`)

### GET `/api/v1/health`

Body: no

Respuesta: igual a `/api/v1/internal/status`

---

## Cifrado auxiliar (`/api/v1/crypt`)

### POST `/api/v1/crypt`

Body: `application/json`
```json
{
  "username": "string (opcional)",
  "password": "string (obligatorio)"
}
```

Respuesta `200`:
```json
{
  "password": "string (cifrado GCM)",
  "username": "string (cifrado GCM, si se envió)"
}
```

Errores internos:
- `500` JSON: `{ "error": "No se pudieron cifrar las credenciales" }`

