/**
 * Configuración central del agente y de guacamole-lite.
 *
 * Define rutas de grabación/typescript, parámetros de cifrado, puertos de guacd/WebSocket
 * y las conexiones disponibles (VNC, SSH, RDP). Este módulo está en src/api/, por tanto
 * la raíz del proyecto está dos niveles arriba (agent/).
 */

const path = require('path');

/** Raíz del proyecto (carpeta agent/). config.js está en src/api/, por tanto dos niveles arriba. */
const ROOT_PATH = path.join(__dirname, '..', '..');

module.exports = {

  PY_API_BASE_URL: process.env.PY_API_BASE_URL || 'http://localhost:8000',
  PY_API_TIMEOUT_MS: parseInt(process.env.PY_API_TIMEOUT_MS || '10000', 10),
  MAX_CONCURRENT_SESSIONS: parseInt(process.env.MAX_SESSIONS || '5', 10),
  /** Clave usada por guacamole-lite para cifrar el token de conexión (AES-256-CBC). Debe coincidir con la de guacd. */
  CRYPT_KEY: 'MySuperSecretKeyForParams1234567',
  /** Host donde corre guacd (daemon de Guacamole). */
  GUACD_HOST: '127.0.0.1',
  /** Puerto de guacd. */
  GUACD_PORT: 4822,
  /** Puerto del servidor WebSocket que usa el frontend para conectar con Guacamole. */
  WEBSOCKET_PORT: 8080,
  /** Algoritmo de cifrado del token. */
  CIPHER: 'AES-256-CBC',
  /** Ruta donde guacd escribe las grabaciones .guac (dentro del contenedor/servidor donde corre guacd). */
  RECORDINGS_PATH: '/var/lib/guacamole/recordings',
  /** Ruta donde guacd escribe los typescripts (dentro del contenedor/servidor donde corre guacd). */
  TYPESCRIPT_PATH: '/var/lib/guacamole/typescript',

  /** Ruta en el host (esta app) donde se copian o esperan los archivos .guac (data/recordings). */
  RECORDING_PATH_HOST: path.join(ROOT_PATH, 'data', 'recordings'),
  /** Ruta en el host donde se copian o esperan los archivos .typescript (data/typescript). */
  TYPESCRIPT_PATH_HOST: path.join(ROOT_PATH, 'data', 'typescript'),

  /**
   * Conexiones disponibles. Cada clave es el identificador usado en GET /token?connection=...
   * y cada valor define type (vnc|ssh|rdp) y settings para guacamole-lite.
   */
  connections: {
    "ubuntu-vnc": {
      connection: {
        type: "vnc",
        settings: {
          "hostname": "ubuntu-vnc-target",
          "port": 5901,
          "password": "Ubuntu123!",
          "color-depth": 16,
          "cursor": "local"
        }
      }
    },
    "ubuntu-ssh": {
      "connection": {
        "type": "ssh",
        "settings": {
          "hostname": "ubuntu-ssh-target",
          "port": 22,
          "username": "sshuser",
          "password": "Ubuntu123!"
        }
      }
    },
    "windows-rdp": {
      "connection": {
        "type": "rdp",
        "settings": {
          "hostname": "192.168.64.3",
          "port": 3389,
          "username": "juan",
          "password": "juan",
          "ignore-cert": "true",
          "security": "any"
        }
      }
    }
  }
};
