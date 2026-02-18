/**
 * Servicio de operaciones con el sistema de archivos.
 *
 * Resolución de rutas de archivos de sesión (grabaciones, typescripts) y limpieza de directorios.
 */

const fs = require('fs');
const path = require('path');

/**
 * Resuelve la ruta real del primer archivo que exista en la lista de candidatas.
 * @param {string[]} filePathCandidates - Lista de rutas a probar (pueden ser relativas o absolutas).
 * @returns {string|null} Ruta absoluta del archivo existente o null si ninguna existe.
 */
function resolveFilePath(filePathCandidates) {
  for (const candidatePath of filePathCandidates) {
    const resolvedPath = candidatePath ? path.resolve(candidatePath) : '';
    if (resolvedPath && fs.existsSync(resolvedPath)) return resolvedPath;
  }
  return null;
}

/**
 * Borra todos los archivos dentro de una carpeta (solo primer nivel; no borra subdirectorios).
 * @param {string} dirPath - Ruta del directorio.
 * @returns {number} Número de archivos eliminados.
 */
function clearDirectory(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return 0;
  const resolvedDirPath = path.resolve(dirPath);
  let count = 0;
  const entries = fs.readdirSync(resolvedDirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      fs.unlinkSync(path.join(resolvedDirPath, entry.name));
      count++;
    }
  }
  return count;
}

module.exports = {
  resolveFilePath,
  clearDirectory,
};
