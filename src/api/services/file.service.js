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
 * Borra un archivo si existe.
 * @param {string} filePath - Ruta del archivo.
 * @returns {boolean} True si se eliminó, false si no existía o no se pudo.
 */
function deleteFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  try {
    fs.unlinkSync(path.resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

/**
 * Borra los archivos de una sesión: .guac si hay videoPath; .typescript y .typescript.timing si hay typescriptPath.
 * @param {{ videoPath?: string, typescriptPath?: string }} session - Sesión con rutas opcionales.
 * @returns {{ deletedVideo: boolean, deletedTypescript: boolean, deletedTiming: boolean }}
 */
function deleteSessionFiles(session) {
  let deletedVideo = false;
  let deletedTypescript = false;
  let deletedTiming = false;
  const videoPath = (session.videoPath || '').trim();
  const typescriptPath = (session.typescriptPath || '').trim();
  if (videoPath && fs.existsSync(path.resolve(videoPath))) {
    deletedVideo = deleteFile(videoPath);
  }
  if (typescriptPath) {
    const resolved = path.resolve(typescriptPath);
    if (fs.existsSync(resolved)) deletedTypescript = deleteFile(resolved);
    const timingPath = resolved + '.timing';
    if (fs.existsSync(timingPath)) deletedTiming = deleteFile(timingPath);
  }
  return { deletedVideo, deletedTypescript, deletedTiming };
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
  deleteFile,
  deleteSessionFiles,
};
