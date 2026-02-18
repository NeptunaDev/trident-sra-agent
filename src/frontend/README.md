# Frontend — Trident Agent

Documentación del frontend: qué hace, cómo, qué endpoints utiliza.

---

## Qué es el frontend (React)

- **Stack:** **React** (Vite), **Tailwind CSS**, **axios** + **@tanstack/react-query**, **i18next** (inglés/español), **Sonner** (toasts).
- **Entorno:** proceso **renderer** de Electron. La ventana carga el build en `dist/frontend/index.html` (o `src/frontend/index.html` si no hay build). La entrada es `main.jsx`, que monta `<App />`.
- **API:** el puerto lo expone el preload con `window.electronAPI.getApiPort()`. La base de las peticiones es `http://localhost:${puerto}` con prefijo `/api/v1` (ver `api/client.js` y `api/endpoints.js`).
- **Guacamole:** `vendor/guacamole-common.js` (copiado en postinstall) para conexión en vivo (WebSocket) y para reproducir grabaciones `.guac` (StaticHTTPTunnel + SessionRecording). Para que VNC/RDP funcionen, **guacd** debe estar en marcha (puerto 4822) y el servidor WebSocket de guacamole-lite en 8080; si el WebSocket se cierra al conectar, suele ser que guacd no está corriendo o el destino (VNC/RDP) no es alcanzable.

**Estructura de la UI (componentes):**

- **Layout / Header:** título "Trident Agent", selector de idioma (ES/EN) y, cuando hay sesión activa, botón Desconectar (misma barra, sin solaparse).
- **ProtocolButtons:** VNC, SSH, RDP → al clic se pide token y se conecta Guacamole (toast éxito/error).
- **RemoteDisplay:** dibuja el escritorio remoto cuando hay token; teclado/ratón se reenvían (salvo en input/textarea/contenteditable); si falla la conexión WebSocket se muestra toast de error.
- **SessionsSection:** título "Sesiones", botón "Borrar todo", tabla con react-query (`useSessions`), paginación, "No hay sesiones" si vacío.
- **SessionsTable / SessionRow:** columnas Conexión, Session ID (corto + tooltip UUID), Fecha, Video, Typescript, Acciones (Ver video, Ver texto, Borrar).
- **ModalVideo:** reproductor .guac (Play, Pause, Restart, Cerrar).
- **ModalDeleteAll:** frase/código a escribir para confirmar; al confirmar `cleanRecordings()` y toasts.
- **ModalDeleteSession:** escribir UUID para confirmar; al confirmar `deleteSession(id)` y toasts.
- **Tooltip:** contexto global; elementos con `TooltipAnchor` muestran tooltip al hover (estilo guía TRIDENT).

Colores y estilos siguen la **guía de colores TRIDENT** (globals.css y clases Tailwind documentadas en el proyecto).

---

## Carga inicial

**Cuándo:** al cargar la página (final de `app.js`: `loadSessionsTable(1)`).

**Qué hace:** pide la primera página del listado de sesiones para rellenar la tabla.

**Endpoint:**  
`GET /api/v1/sessions?page=1&limit=10`

**Antes:** no hay requisito; la API debe estar disponible.

**Respuesta esperada:**  
`{ sessions: [...], pagination: { total, page, limit, totalPages } }`

**Qué pasa luego:**
- Se vacía `#sessions-tbody` y se rellenan filas con: Conección, Session ID (recortado a dos segmentos), Fecha creación (día mes año), Video (Sí/—), Typescript (Sí/—), Acciones.
- En **Acciones** solo se muestra:
  - **Ver video** si la sesión tiene `videoPath` no vacío.
  - **Ver texto** si tiene `typescriptPath` no vacío.
  - **Borrar** siempre.
- Cada fila tiene `data-session-id` con el UUID completo (para clics en Ver video / Ver texto / Borrar).
- Se actualiza el texto de paginación ("Página X de Y") y el estado de los botones Anterior/Siguiente.
- Si no hay sesiones en la primera página, se muestra "No hay sesiones" y se oculta la barra de paginación.

**Si falla la petición:** se muestra una fila de error en la tabla y se oculta la paginación.

---

## Conectar por protocolo (VNC, SSH, RDP)

**Cuándo:** el usuario hace clic en el botón VNC, SSH o RDP.

**Qué hace:** pide un token de conexión a la API, abre el cliente Guacamole en vivo con ese token y marca la app como "conectada".

**Endpoint:**  
`GET /api/v1/guacamole/token?connection=<name>`

**Parámetros:**  
`connection` = `ubuntu-vnc` | `ubuntu-ssh` | `windows-rdp` (según el botón).

**Antes:** la API debe estar levantada; en el backend debe existir esa conexión y guacamole-lite (WebSocket) en el puerto correspondiente.

**Respuesta esperada:**  
`{ token: "<string cifrado>" }`

**Qué pasa luego:**
1. Se construye la URL del WebSocket: `ws://localhost:8080/?token=${token}`.
2. Se crea `Guacamole.WebSocketTunnel` con esa URL y `Guacamole.Client(tunnel)`.
3. El elemento de pantalla del cliente se inserta en `#display` (se vacía antes).
4. Se enlaza el ratón sobre ese elemento para reenviar eventos al remoto.
5. Se llama a `client.connect()`.
6. Se registra un teclado global (`Guacamole.Keyboard(document)`): las teclas se envían al cliente remoto **salvo** cuando el foco está en un `input`, `textarea` o `contenteditable` (para poder escribir en campos locales).
7. Se llama a `setConnected(true)`: se añade la clase `.connected` a `.app`, lo que oculta los botones de protocolo y la sección de sesiones; el botón Desconectar sigue visible.

**Implicación:** mientras hay sesión activa, el usuario solo ve el escritorio remoto y Desconectar; la tabla de sesiones no se muestra hasta que se desconecte.

---

## Desconectar

**Cuándo:** el usuario hace clic en "Desconectar".

**Qué hace:** cierra el cliente Guacamole, limpia `#display`, marca la app como no conectada y vuelve a cargar la tabla de sesiones.

**Endpoint:**  
Ninguno. Solo lógica local: `client.disconnect()`, `client = null`, vaciar `#display`, `setConnected(false)`, `loadSessionsTable(1)`.

**Antes:** haber estado conectado (tener `client` no nulo).

**Qué pasa luego:** se oculta la clase `.connected`, vuelven a verse los botones VNC/SSH/RDP y la sección Sesiones, y la tabla se rellena de nuevo con `GET /api/v1/sessions?page=1&limit=10` (sin pasar número de página, se usa página 1).

---

## Tabla de sesiones: paginación

**Cuándo:** el usuario hace clic en "← Anterior" o "Siguiente →".

**Qué hace:** carga la página anterior o siguiente del listado y rellena la tabla con el mismo formato que en la carga inicial.

**Endpoint:**  
`GET /api/v1/sessions?page=<n>&limit=10`

**Antes:** tener más de una página (para Anterior, `currentSessionsPage > 1`; para Siguiente, `currentSessionsPage < totalSessionsPages`).

**Qué pasa luego:** igual que en la carga inicial: se actualizan filas, texto "Página X de Y" y estado de los botones de paginación.

---

## Ver video (grabación .guac)

**Cuándo:** el usuario hace clic en "Ver video" en una fila de la tabla (solo visible si esa sesión tiene `videoPath`).

**Qué hace:** abre el modal del reproductor, crea un túnel HTTP estático hacia la URL del video, crea un `SessionRecording` de Guacamole, monta su display en `#video-display`, conecta y arranca la reproducción al segundo.

**Endpoint (recursos):**  
La URL del video se usa como origen del túnel:  
`GET /api/v1/view/video?sessionId=<uuid>`

Esa misma URL es la que usa internamente `Guacamole.StaticHTTPTunnel` para descargar el `.guac`. No se hace un `fetch` manual; Guacamole pide el recurso por su cuenta.

**Antes:** la fila debe tener `data-session-id` (UUID) y el botón "Ver video" solo existe si la sesión tiene video; la API debe servir el archivo en `/api/v1/view/video?sessionId=...`.

**Qué pasa luego:**
- Se vacía `#video-display`.
- Se crea `Guacamole.StaticHTTPTunnel(videoUrl)` y `Guacamole.SessionRecording(tunnel)`.
- El display del reproductor se añade a `#video-display`.
- Se define `onresize` en ese display para escalar (proporcional al ancho del contenedor y altura 600).
- Se muestra el modal (`#modal-video`), se llama a `sessionRecordingPlayer.connect()` y tras 1 s a `sessionRecordingPlayer.play()`.
- Los botones Reproducir / Pausar / Reiniciar (seek 0) actúan sobre `sessionRecordingPlayer`; el botón cerrar y el backdrop llaman a `cerrarVideo()` (pause, disconnect, ocultar modal).

---

## Ver texto (log typescript)

**Cuándo:** el usuario hace clic en "Ver texto" en una fila (solo visible si la sesión tiene `typescriptPath`).

**Qué hace:** pide el contenido del log typescript y lo muestra en una ventana nueva con numeración de líneas.

**Endpoint:**  
`GET /api/v1/view/log?sessionId=<uuid>`

**Antes:** la fila debe tener `data-session-id`; el botón "Ver texto" solo se muestra si la sesión tiene typescript; la API debe poder servir ese recurso.

**Respuesta esperada:** cuerpo en texto plano (contenido del typescript).

**Qué pasa luego:**
- Se abre una ventana con `window.open(..., 'width=800,height=560,...')`.
- Se escribe un HTML completo en esa ventana: cabecera con el sessionId, dos columnas (números de línea y contenido), estilos inline, contenido escapado para evitar XSS.
- Si la petición falla, se muestra `alert('No se pudo cargar el log.')`.

---

## Borrar una sesión (una fila)

**Cuándo:** el usuario hace clic en "Borrar" en una fila.

**Qué hace:** abre el modal "Borrar sesión", muestra el UUID de esa sesión y exige que el usuario lo escriba exactamente para habilitar "Confirmar". Al confirmar, llama al endpoint de borrado y recarga la tabla.

**Flujo:**
1. **Abrir modal:** `openDeleteSessionModal(sessionId)` — se guarda el UUID en `currentDeleteSessionId`, se muestra en `#delete-session-uuid-display`, se vacía el input y se deshabilita Confirmar.
2. **Al escribir en el input:** se compara el valor (trim) con `currentDeleteSessionId`; si coinciden, se habilita Confirmar.
3. **Confirmar (clic o Enter):** se comprueba de nuevo que el input coincida con `currentDeleteSessionId`; si no, no se hace nada.

**Endpoint al confirmar:**  
`DELETE /api/v1/sessions/<sessionId>`

**Antes:** haber escrito exactamente el UUID mostrado en el modal.

**Qué pasa luego si la respuesta es correcta:** se cierra el modal, se borra `currentDeleteSessionId`, y se llama a `loadSessionsTable(currentSessionsPage)` para refrescar la tabla en la página actual. Si la API devuelve error, se muestra un `alert` con el mensaje.

---

## Borrar todo

**Cuándo:** el usuario hace clic en "Borrar todo" en la cabecera de la sección Sesiones.

**Qué hace:** abre el modal "Borrar todo", muestra una frase o código aleatorio (o a veces el UUID de la primera sesión) y exige escribirlo exactamente para habilitar "Confirmar". Al confirmar, llama al endpoint de limpieza total y recarga la tabla en la página 1.

**Flujo:**
1. **Abrir modal:** se genera la frase/código con `getRandomConfirmPhrase()` (lista de frases en español o, con probabilidad 0.4, el `data-session-id` de la primera fila de la tabla). Se muestra en `#confirm-phrase-display`, se vacía el input y se deshabilita Confirmar.
2. **Al escribir:** se habilita Confirmar solo si el valor (trim) es igual a `currentConfirmPhrase`.
3. **Confirmar (clic o Enter):** se comprueba de nuevo; si coincide, se envía la petición.

**Endpoint al confirmar:**  
`POST /api/v1/sessions/clean-recordings`  
(sin cuerpo; opcionalmente con headers por defecto del `fetch`)

**Antes:** haber escrito exactamente la frase o código mostrado.

**Qué pasa luego si `data.ok === true`:** se cierra el modal, se limpia `currentConfirmPhrase`, y se llama a `loadSessionsTable(1)`. La tabla se vacía o muestra la lista actualizada según lo que haya dejado el backend (normalmente lista vacía y mensaje "No hay sesiones").

---

## Tooltips

**Qué:** un único tooltip global (`#tooltip-root`), controlado por JS. No se usa el atributo `title` nativo para Session ID, Fecha creación, Video ni Typescript.

**Cuándo:** al pasar el ratón sobre cualquier elemento con clase `.has-tooltip` y atributo `data-tooltip` (texto a mostrar).

**Cómo:** delegación en `document.body`: en `mouseover` se busca el ancestro `.has-tooltip`; si existe, se toma `data-tooltip`, se escribe en `#tooltip-root`, se posiciona (encima o debajo del elemento, centrado, sin salir del viewport) y se muestra. En `mouseout` se oculta con un pequeño retraso para evitar parpadeos.

**Dónde se usa:**
- Session ID: texto corto (dos segmentos) en celda; tooltip con el UUID completo.
- Fecha creación: día mes año en celda; tooltip con fecha y hora completa (incl. ms).
- Video / Typescript: "Sí" o "—" en celda; tooltip con la ruta completa (si existe).

Todos comparten el mismo estilo (fondo oscuro, borde, sombra) y la misma pista visual (subrayado punteado en `.has-tooltip`).

---

## Resumen de endpoints que usa el frontend

| Acción / dato              | Método | Ruta                                              |
|----------------------------|--------|---------------------------------------------------|
| Listado de sesiones       | GET    | `/api/v1/sessions?page=1&limit=10`               |
| Token para conectar        | GET    | `/api/v1/guacamole/token?connection=...`          |
| Archivo de video (.guac)   | GET    | `/api/v1/view/video?sessionId=...`               |
| Log typescript             | GET    | `/api/v1/view/log?sessionId=...`                 |
| Borrar una sesión          | DELETE | `/api/v1/sessions/<sessionId>`                   |
| Borrar todo (clean)        | POST   | `/api/v1/sessions/clean-recordings`              |

La base de la URL (`http://localhost:PORT`) se obtiene de `electronAPI.getApiPort()` en tiempo de ejecución.

---

## Archivos del frontend

- **`index.html`:** estructura de la página, modales y contenedor del tooltip; sin lógica inline.
- **`app.js`:** toda la lógica (eventos, llamadas a la API, Guacamole, tooltips, modales, tabla y paginación). Carga como módulo ES; importa `./vendor/guacamole-common.js`.
- **`style.css`:** estilos globales, layout (max-width, padding responsive), tabla, botones, modales, tooltip, media queries.
- **`vendor/guacamole-common.js`:** generado en postinstall desde `node_modules/guacamole-common-js`; no se versiona.

El frontend no conoce la existencia del CSV ni del sistema de archivos del backend; solo consume la API bajo `/api/v1` y el WebSocket de guacamole-lite para la sesión en vivo.
