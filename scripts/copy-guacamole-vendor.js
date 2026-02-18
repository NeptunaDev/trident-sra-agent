const fs = require('fs');
const path = require('path');

// __dirname = scripts/ (raíz del proyecto = un nivel arriba)
const src = path.join(__dirname, '..', 'node_modules', 'guacamole-common-js', 'dist', 'esm', 'guacamole-common.js');
const destDir = path.join(__dirname, '..', 'src', 'frontend', 'vendor');
const dest = path.join(destDir, 'guacamole-common.js');

if (!fs.existsSync(src)) {
  console.warn('guacamole-common-js not found, skip copying vendor');
  process.exit(0);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied guacamole-common.js to src/frontend/vendor/');
