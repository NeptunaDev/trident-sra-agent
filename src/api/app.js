/**
 * Configuración de la aplicación Express.
 *
 * Middleware global y montaje de rutas. No inicia el servidor (eso lo hace index.js).
 */

const express = require('express');
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(routes);

module.exports = app;
