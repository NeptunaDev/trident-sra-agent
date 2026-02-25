/**
 * Configuración de la aplicación Express.
 *
 * Middleware global y montaje de rutas. No inicia el servidor (eso lo hace index.js).
 */

const express = require('express');
const routes = require('./routes');

const app = express();
const allowedOrigins = [
  'http://localhost:3000',      // Next.js dev
  'http://localhost:5173',      // Renderer Vite dev
  process.env.NEXTJS_ORIGIN,    // Configurable para producción
].filter(Boolean);

// CORS: en desarrollo el front (Vite) corre en otro origen (ej. localhost:5173)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(routes);

module.exports = app;
