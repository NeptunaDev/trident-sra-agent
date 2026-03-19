/**
 * Configuración de la aplicación Express.
 *
 * Middleware global y montaje de rutas. No inicia el servidor (eso lo hace index.js).
 */

const express = require("express");
const routes = require("./routes");

const app = express();

// CORS: permitir frontend en puertos 5173 y 3000.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = new Set(["http://localhost:5173", "http://localhost:3000"]);

  // Si viene Origin (navegador), permitimos solo los que estén en la lista.
  // Si no existe Origin (curl/postman), permitimos '*'.
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : "*";

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Vary", "Origin");
  // Si el frontend hace fetch/axios con `credentials: 'include'` / `withCredentials: true`,
  // el navegador requiere esta cabecera.
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(routes);

module.exports = app;
