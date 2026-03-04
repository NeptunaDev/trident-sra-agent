/**
 * Configuración de la aplicación Express.
 *
 * Middleware global y montaje de rutas. No inicia el servidor (eso lo hace index.js).
 */

const express = require('express');
const routes = require('./routes');

const app = express();

// CORS abierto para cualquier origen.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Si el cliente usa credentials: 'include', no se puede responder con '*'.
  // Reflejamos el origen recibido para permitir cualquier origen con credenciales.
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(routes);

module.exports = app;
