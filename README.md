# Trident Agent

Aplicación de escritorio (Electron) que permite conectarse a sesiones remotas **VNC**, **SSH** y **RDP** mediante [Apache Guacamole](https://guacamole.apache.org/), listar las sesiones realizadas, reproducir grabaciones de escritorio (`.guac`) y consultar logs de texto (typescript) de sesiones SSH.

---

## Tabla de contenidos

- [Descripción](#descripción)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Configuración](#configuración)
- [Scripts NPM](#scripts-npm)
- [Desarrollo](#desarrollo)
- [API REST](#api-rest)
- [Frontend](#frontend)
- [Guacamole y guacd](#guacamole-y-guacd)
- [Docker (destinos de prueba)](#docker-destinos-de-prueba)
- [Diseño y colores](#diseño-y-colores)

---

## Descripción

**Trident Agent** es un cliente que:

1. **Conecta en vivo** a máquinas remotas por VNC, SSH o RDP usando el protocolo Guacamole (WebSocket + `guacd`).
2. **Registra cada sesión** en un listado interno (CSV y/o API) con identificador, fecha, y rutas a grabación (VNC/RDP) o typescript (SSH).
3. **Permite ver** grabaciones de escritorio (archivos `.guac`) y logs de texto de sesiones SSH desde la propia aplicación.

La aplicación consta de:

- **Proceso principal Electron** (`src/main.js`): crea la ventana, arranca la API Express y carga el frontend.
- **API Express** (`src/api/`): sirve tokens de conexión, listado de sesiones, borrado, y las rutas para ver log/video.
- **Frontend React** (`src/frontend/`): interfaz con botones de protocolo, escritorio remoto (Guacamole), tabla de sesiones, modales de reproducción y borrado.
- **guacamole-lite** (Node): servidor WebSocket en el puerto 8080 que recibe el token, descifra la configuración de conexión y habla con **guacd** para establecer el túnel Guacamole.

El frontend se comunica con la API por HTTP y con Guacamole por WebSocket; no accede al sistema de archivos ni a la base de datos directamente.

---

## Requisitos

- **Node.js** 18+ (LTS recomendado)
- **npm** (viene con Node)
- **guacd** (daemon de Guacamole) en ejecución, escuchando en el puerto **4822**, para que VNC/RDP/SSH en vivo funcionen
- Opcional: **Docker** y **Docker Compose** para levantar destinos de prueba (VNC, SSH, RDP) y guacd

---

## Instalación

```bash
# Clonar o entrar en el directorio del proyecto
cd agent

# Instalar dependencias (incluye postinstall: copia guacamole-common.js a src/frontend/vendor/)
npm install

# Build del frontend y arrancar la aplicación
npm start
```

`npm start` hace `npm run build:frontend` y luego ejecuta Electron. La ventana cargará el frontend desde `dist/frontend/` si existe.

Para **desarrollo** con recarga en caliente, ver [Desarrollo](#desarrollo).

---

## Estructura del proyecto

```
agent/
├── package.json
├── package-lock.json
├── vite.config.js          # Vite: root src/frontend, build a dist/frontend, base ./
├── tailwind.config.js      # Tailwind: contenido y colores TRIDENT
├── postcss.config.js
├── docker-compose.yml      # guacd, postgres, guacamole, ubuntu-vnc, ubuntu-ssh (y opcional windows-rdp)
├── scripts/
│   └── copy-guacamole-vendor.js   # postinstall: copia guacamole-common.js a frontend/vendor
├── src/
│   ├── main.js             # Proceso principal Electron: ventana, carga API y frontend
│   ├── preload.js          # contextBridge: expone getApiPort() al renderer
│   ├── api/                # API Express
│   │   ├── index.js        # Arranque: require guacamole, startApi(), PORT 3417
│   │   ├── app.js          # Express: CORS, json(), rutas
│   │   ├── config.js       # CRYPT_KEY, puertos, conexiones (ubuntu-vnc, ubuntu-ssh, windows-rdp)
│   │   ├── guacamole/
│   │   │   └── index.js    # Inicializa guacamole-lite (WebSocket 8080, guacd 4822)
│   │   ├── routes/         # /api/v1/sessions, /api/v1/guacamole, /api/v1/view
│   │   ├── controllers/
│   │   ├── services/       # token (cifrado), csv, file
│   │   ├── schemas/        # express-validator
│   │   └── middleware/
│   └── frontend/           # React (Vite)
│       ├── index.html
│       ├── main.jsx        # createRoot, QueryClientProvider, Toaster, App
│       ├── App.jsx
│       ├── api/            # client (axios), endpoints
│       ├── components/     # Layout, Header, ProtocolButtons, RemoteDisplay, Sessions*, Modals, Tooltip
│       ├── hooks/          # useSessions
│       ├── i18n/           # i18next, locales en.json / es.json
│       ├── styles/         # globals.css (Tailwind + variables TRIDENT)
│       ├── utils/          # format (fechas, sessionId, normalizeSession)
│       ├── vendor/         # guacamole-common.js (generado en postinstall)
│       └── README.md       # Documentación detallada del frontend y flujos
├── data/                   # Creado en runtime: recordings, typescript, csv (según config)
└── dist/                   # Build del frontend (vite build) → dist/frontend/
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  Electron main (src/main.js)                                    │
│  - Crea BrowserWindow                                           │
│  - Inicia API Express (puerto 3417)                             │
│  - Carga frontend: loadURL(localhost:5173) en dev               │
│  -        o loadFile(dist/frontend/index.html) en prod          │
│  - Preload inyecta getApiPort()                                 │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌──────────────────────┐            ┌───────────────────────────────┐
│  API Express         │            │  Renderer (React)             │
│  localhost:3417      │◄── HTTP ───┤  - Pide token, sesiones,      │
│  /api/v1/*           │            │    view/log, view/video       │
│  CORS (5173 en dev)  │            │  - WebSocket ws://localhost:  │
└──────────────────────┘            │    8080/?token=... (Guacamole)│
         │                          └───────────────────────────────┘
         │                                        │
         │ require('./guacamole')                 │
         ▼                                        ▼
┌──────────────────────┐            ┌───────────────────────────────┐
│  guacamole-lite      │            │  guacamole-common.js          │
│  WebSocket :8080     │◄── WS ─────┤  (frontend/vendor)            │
│  Descifra token,     │            │  WebSocketTunnel, Client,     │
│  habla con guacd     │            │  display.scale(), mouse, kbd  │
└──────────────────────┘            └───────────────────────────────┘
         │
         │ TCP 4822
         ▼
┌──────────────────────┐
│  guacd               │
│  (Guacamole daemon)  │──── VNC/SSH/RDP ────► Máquinas destino
│  :4822               │
└──────────────────────┘
```

- El **renderer** no tiene Node ni `require`; solo usa `window.electronAPI.getApiPort()` para construir la base URL de la API.
- El **token** se genera en la API (configuración de conexión cifrada con AES-256-CBC), se envía al frontend y el frontend lo pasa al WebSocket de guacamole-lite; guacamole-lite lo descifra y usa la configuración para conectar con guacd.

---

## Configuración

La configuración central está en **`src/api/config.js`**:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `CRYPT_KEY` | Clave AES-256 para el token (debe coincidir con la que use guacd si aplica) | `'MySuperSecretKeyForParams1234567'` |
| `GUACD_HOST` | Host de guacd | `'127.0.0.1'` |
| `GUACD_PORT` | Puerto de guacd | `4822` |
| `WEBSOCKET_PORT` | Puerto del WebSocket de guacamole-lite | `8080` |
| `CIPHER` | Algoritmo de cifrado del token | `'AES-256-CBC'` |
| `RECORDINGS_PATH` | Ruta de grabaciones en el lado de guacd | `'/var/lib/guacamole/recordings'` |
| `TYPESCRIPT_PATH` | Ruta de typescripts en el lado de guacd | `'/var/lib/guacamole/typescript'` |
| `RECORDING_PATH_HOST` | Ruta en el host de la app para archivos .guac | `ROOT_PATH/data/recordings` |
| `TYPESCRIPT_PATH_HOST` | Ruta en el host para archivos .typescript | `ROOT_PATH/data/typescript` |
| `connections` | Map de conexiones: id → `{ connection: { type, settings } }` | `ubuntu-vnc`, `ubuntu-ssh`, `windows-rdp` |

Cada entrada en **`connections`** tiene una clave usada en la query `connection=` (por ejemplo `ubuntu-vnc`). El valor define `type` (`vnc`, `ssh`, `rdp`) y `settings` (hostname, port, password, etc.). Al pedir un token para esa conexión, la API genera la configuración completa (incluidas rutas de grabación/typescript y sessionId), la cifra y la devuelve; el frontend la envía por WebSocket a guacamole-lite.

---

## Scripts NPM

| Script | Descripción |
|--------|-------------|
| `npm start` | `npm run build:frontend` y luego `electron .`. Carga `dist/frontend/index.html` si existe. |
| `npm run dev` | Modo desarrollo: lanza **Vite** (puerto 5173) y **Electron** con `ELECTRON_DEV=1` (carga `http://localhost:5173`). Nodemon observa `src` (excl. `src/frontend`) y reinicia Electron al cambiar API o main. |
| `npm run dev:vite` | Solo servidor de desarrollo Vite (para trabajar solo en frontend). |
| `npm run dev:electron` | Espera a que responda `http://localhost:5173` y arranca Electron con nodemon (reinicio al cambiar código en `src` salvo frontend). |
| `npm run build:frontend` | Build de producción del frontend con Vite; salida en `dist/frontend/` con `base: './'` para Electron. |
| `postinstall` | Ejecuta `node scripts/copy-guacamole-vendor.js` (copia `guacamole-common.js` a `src/frontend/vendor/`). |

---

## Desarrollo

1. **Requisitos:** guacd en marcha (por ejemplo con Docker: `docker compose up -d guacd`; ver [Docker](#docker-destinos-de-prueba)).
2. **Arrancar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   - Se inicia Vite en `http://localhost:5173` y Electron carga esa URL.
   - Los cambios en **frontend** se recargan con HMR.
   - Los cambios en **API** o **main.js** reinician Electron (nodemon).
3. **CORS:** En `src/api/app.js` se permite el origen `http://localhost:5173` para que el renderer pueda llamar a la API en otro puerto (3417).

Si solo quieres trabajar en el frontend sin Electron, puedes ejecutar `npm run dev:vite` y abrir `http://localhost:5173` en el navegador; las llamadas a la API fallarán si no hay API (y no tendrás `getApiPort()` salvo que simules el preload).

---

## API REST

Base URL: `http://localhost:3417` (puerto fijo en `src/api/index.js`). Prefijo: **`/api/v1`**.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/guacamole/token?connection=<id>` | Devuelve `{ token }` para la conexión (id = clave en `config.connections`). |
| GET | `/api/v1/sessions?page=&limit=` | Listado paginado de sesiones. Respuesta: `{ sessions, pagination }`. |
| DELETE | `/api/v1/sessions/:sessionId` | Borra una sesión (y sus archivos asociados si aplica). Respuesta: `{ ok }`. |
| POST | `/api/v1/sessions/clean-recordings` | Borra todas las sesiones y sus grabaciones/typescripts. Respuesta: `{ ok }`. |
| GET | `/api/v1/view/log?sessionId=` | Sirve el typescript en texto plano (para “Ver texto”). |
| GET | `/api/v1/view/video?sessionId=` | Sirve el archivo .guac (para el reproductor o StaticHTTPTunnel). |

Las sesiones se obtienen desde el backend (p. ej. CSV o BD); cada sesión tiene al menos: `connectionName`, `sessionId`, `createdAt`, y opcionalmente `videoPath`, `typescriptPath`.

---

## Frontend

- **Stack:** React 18, Vite, Tailwind CSS, axios, @tanstack/react-query, i18next (en/es), Sonner (toasts).
- **Entrada:** `src/frontend/main.jsx` → `App.jsx`.
- **API:** La base URL se construye con `window.electronAPI.getApiPort()` (preload); cliente axios y funciones en `api/endpoints.js`.
- **Guacamole en vivo:** `RemoteDisplay` usa `guacamole-common.js` (vendor): `WebSocketTunnel('ws://localhost:8080/')`, `Client(tunnel)`, `client.connect('token=' + encodeURIComponent(token))`, `display.onresize` + `display.scale()` para que la imagen se vea y quede centrada.
- **Componentes principales:** Header (título, idioma, Desconectar si hay sesión), ProtocolButtons (VNC/SSH/RDP), RemoteDisplay, SessionsSection (tabla + paginación), ModalVideo, ModalDeleteAll, ModalDeleteSession, Tooltip.
- **Estilos:** Variables y clases según la guía de colores TRIDENT en `styles/globals.css` y `tailwind.config.js`.

Documentación más detallada de flujos y endpoints usados por el frontend: **`src/frontend/README.md`**.

---

## Guacamole y guacd

- **guacd** (daemon de Guacamole): debe estar en ejecución y accesible en **GUACD_PORT** (por defecto 4822). Sin guacd, el WebSocket se conecta pero la sesión remota no se establece (no hay imagen/sesión útil).
- **guacamole-lite** (Node): se carga en `src/api/index.js` con `require('./guacamole')`. Escucha en **WEBSOCKET_PORT** (8080), recibe el token por query, descifra la configuración y habla con guacd para abrir la conexión VNC/SSH/RDP.
- **guacamole-common.js** (frontend): se copia en postinstall a `src/frontend/vendor/`. Proporciona `WebSocketTunnel`, `Client`, `Mouse`, `Keyboard`, `SessionRecording`, `StaticHTTPTunnel`, etc.

Si VNC/RDP “no dan imagen”, comprueba que guacd esté levantado y que los hostname/puerto de las conexiones en `config.js` sean alcanzables desde el host donde corre la app.

---

## Docker (destinos de prueba)

El `docker-compose.yml` incluye:

- **guacd:** imagen `guacamole/guacd`, puerto 4822, volúmenes para `data/recordings` y `data/typescript`.
- **ubuntu-vnc:** escritorio con VNC (puerto 5901 → 5900 en host). Conexión en config: `ubuntu-vnc`, hostname `ubuntu-vnc-target`, port 5901.
- **ubuntu-ssh:** SSH (puerto 22 → 2222). Usuario `sshuser`, contraseña en el comando. Conexión: `ubuntu-ssh`, hostname `ubuntu-ssh-target`, port 22.
- **windows-rdp** (perfil `windows`): solo útil en Linux con KVM; en Mac/ARM no hay `/dev/kvm`. Arrancar con `docker compose --profile windows up -d`.
- **postgres** y **guacamole** (cliente web completo): opcionales para otros flujos; Trident Agent usa guacamole-**lite** en Node, no ese contenedor.

Para usar solo guacd y los destinos VNC/SSH:

```bash
docker compose up -d guacd ubuntu-vnc ubuntu-ssh
```

Asegúrate de que en `config.js` los `hostname` de las conexiones coincidan con los nombres de servicio de Docker (`ubuntu-vnc-target`, `ubuntu-ssh-target`) y que la red permita que el host (donde corre Electron) llegue a esos contenedores si no usas `host` en la red.

---

## Diseño y colores

El frontend sigue la **guía de colores TRIDENT/NEPTUNA**:

- **Primario / acción:** gradiente cyan `#5bc2e7` → `#4ba8d1`.
- **Fondos:** `#0a0a0f` (app), `#1a1a2e` (elevado), `#11111f` (cards/inputs), `#0f0f1c` (cabecera tabla).
- **Texto:** blanco (principal), `#c0c5ce` (secundario), `#6b7280` (placeholder/deshabilitado).
- **Bordes:** `rgba(91, 194, 231, 0.2)` estándar, `0.08` sutil; focus `#5bc2e7`.
- **Destructivo:** `#ff6b6b`. **Éxito:** `#00ff88`. **Sesión/acento:** `#9b59b6`. **Advertencia:** `#ffc107`.

Variables CSS y clases Tailwind en `src/frontend/styles/globals.css` y `tailwind.config.js`.

---

## Resumen rápido para desarrolladores

1. **Instalar:** `npm install` (postinstall copia guacamole al frontend).
2. **Probar en producción:** `npm start` (build + Electron).
3. **Desarrollar:** `npm run dev` (Vite + Electron + nodemon); tener guacd (y opcionalmente Docker) para VNC/RDP.
4. **Configuración:** `src/api/config.js` (puertos, clave, conexiones).
5. **API:** Express en 3417, prefijo `/api/v1`; ver tabla en [API REST](#api-rest).
6. **Frontend:** React en `src/frontend/`, entrada `main.jsx` → `App.jsx`; detalle en `src/frontend/README.md`.
7. **Guacamole:** guacd en 4822, guacamole-lite en 8080; token cifrado desde la API y enviado por el frontend al WebSocket.

Si algo no carga o no hay imagen en remoto, revisar: guacd en marcha, `config.connections` con hostnames/puertos correctos y CORS en dev (`http://localhost:5173`).
