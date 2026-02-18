/**
 * Servicio de cifrado de tokens para guacamole-lite.
 *
 * Formato compatible con guacamole-lite: payload cifrado en AES-256-CBC,
 * salida en base64 (iv y valor cifrado en base64 dentro de un JSON).
 */

const crypto = require('crypto');
const config = require('../config');

/**
 * Cifra un objeto como token para guacamole-lite.
 * Formato: base64(JSON({ iv, value })), donde value es el cipher en base64.
 * @param {object} value - Objeto a cifrar (configuración de conexión).
 * @returns {string} Token en base64.
 */
function encryptToken(value) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(config.CRYPT_KEY), iv);

  let encryptedPayload = cipher.update(JSON.stringify(value), 'utf8', 'base64');
  encryptedPayload += cipher.final('base64');

  const data = {
    iv: iv.toString('base64'),
    value: encryptedPayload
  };

  return Buffer.from(JSON.stringify(data)).toString('base64');
}

module.exports = {
  encryptToken,
};
