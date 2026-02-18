/**
 * Script de postinstall: copia el bundle ESM de guacamole-common-js desde node_modules
 * a src/frontend/vendor/guacamole-common.js para que el renderer pueda importarlo como
 * módulo ES (import Guacamole from './vendor/guacamole-common.js').
 *
 * Se ejecuta desde la raíz del proyecto; __dirname aquí = scripts/.
 */

const fs = require('fs');
const path = require('path');

/** Ruta al archivo ESM de guacamole-common-js en node_modules. */
const sourcePath = path.join(__dirname, '..', 'node_modules', 'guacamole-common-js', 'dist', 'esm', 'guacamole-common.js');

/** Directorio de destino: src/frontend/vendor/. */
const destinationDir = path.join(__dirname, '..', 'src', 'frontend', 'vendor');

/** Ruta completa del archivo de destino. */
const destinationPath = path.join(destinationDir, 'guacamole-common.js');

if (!fs.existsSync(sourcePath)) {
  console.warn('guacamole-common-js not found, skip copying vendor');
  process.exit(0);
}

fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(sourcePath, destinationPath);
console.log('Copied guacamole-common.js to src/frontend/vendor/');
