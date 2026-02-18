const path = require('path');

/** Raíz del proyecto (carpeta agent/). config.js está en src/api/, por tanto dos niveles arriba. */
const ROOT_PATH = path.join(__dirname, '..', '..');

module.exports = {
  CRYPT_KEY: 'MySuperSecretKeyForParams1234567',
  GUACD_HOST: '127.0.0.1',
  GUACD_PORT: 4822,
  WEBSOCKET_PORT: 8080,
  CIPHER: 'AES-256-CBC',
  RECORDINGS_PATH: '/var/lib/guacamole/recordings',
  TYPESCRIPT_PATH: '/var/lib/guacamole/typescript',

  RECORDING_PATH_HOST: path.join(ROOT_PATH, 'data', 'recordings'),
  TYPESCRIPT_PATH_HOST: path.join(ROOT_PATH, 'data', 'typescript'),

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