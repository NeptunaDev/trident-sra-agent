const express = require('express');
const internalController = require('../../controllers/internal.controller');

const router = express.Router();

router.get('/logs', internalController.getLogs);
router.delete('/logs', internalController.deleteLogs);
router.get('/status', internalController.getStatus);

module.exports = router;
