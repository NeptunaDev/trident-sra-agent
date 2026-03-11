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

/**
 * Cifra un objeto como token usando AES-256-GCM para mayor seguridad.
 * Formato: base64(JSON({ iv, value, authTag })), donde value y authTag son en base64.
 * @param {object} value - Objeto a cifrar (configuración de conexión).
 * @return {string} Token en base64.
 */
function encryptTokenGCM(value) {
  const key = Buffer.from(config.CRYPT_KEY);
  if (key.length !== 32) {
    throw new Error('CRYPT_KEY debe tener 32 bytes para AES-256-GCM');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plainText = typeof value === 'string' ? value : JSON.stringify(value);

  let encryptedPayload = cipher.update(plainText, 'utf8', 'base64');
  encryptedPayload += cipher.final('base64');

  const authTag = cipher.getAuthTag().toString('base64');
  const data = {
    iv: iv.toString('base64'),
    value: encryptedPayload,
    authTag
  };

  return Buffer.from(JSON.stringify(data)).toString('base64');
}


module.exports = {
  encryptToken,
  encryptTokenGCM
};
