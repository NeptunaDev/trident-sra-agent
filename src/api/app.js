/**
 * Configuración de la aplicación Express.
 *
 * Middleware global y montaje de rutas. No inicia el servidor (eso lo hace index.js).
 */

const express = require("express");
const routes = require("./routes");

const app = express();

// CORS abierto para cualquier origen.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(routes);

module.exports = app;
