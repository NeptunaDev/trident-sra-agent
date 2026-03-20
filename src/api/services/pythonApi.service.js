const config = require('../config');


function getBaseUrl() {
	return String(config.PY_API_BASE_URL || '').replace(/\/$/, '');
}

async function requestJson(url) {
	const timeoutMs = Number(config.PY_API_TIMEOUT_MS || 5000);
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
    console.log(`Consultando API de Python en ${url} con timeout de ${timeoutMs}ms`); // Log de la URL y timeout
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: { Accept: 'application/json' },
			//signal: controller.signal,
		});

		if (!response.ok) {
			let message = `API de Python respondió con ${response.status}`;
			try {
				const body = await response.json();
				const detail = body?.error || body?.message || body?.detail;
				message = typeof detail === 'string' ? detail : (detail ? JSON.stringify(detail) : message);
			} catch { /* ignorar error de parseo */ }

			const err = new Error(message);
			err.status = response.status;
			throw err;
		}

		return await response.json();
	} catch (error) {   
        console.error('Error al conectar con API de Python:', error); // Log del error completo
		if (error?.name === 'AbortError') {
			const err = new Error('Timeout al consultar API de Python');
			err.status = 504;
			throw err;
		}
		if (typeof error?.status === 'number') throw error;

		const err = new Error('No se pudo conectar con API de Python');
		err.status = 502;
		throw err;
	} finally {
		clearTimeout(timer);
	}
}
/**
 * Obtiene una conexión remota por identificador desde la API de Python.
 * Ajusta esta ruta si el contrato final usa otro endpoint.
 * @param {string} connectionId
 * @returns {Promise<object>}
 */
async function fetchConnectionById(connectionId) {
	const id = String(connectionId || '').trim();
	if (!id) {
		throw new Error('connectionId es obligatorio');
	}

	if (!getBaseUrl()) {
		throw new Error('PY_API_BASE_URL no está configurado');
	}

	const agentId = String(config.AGENT_ID || '').trim();
	if (!agentId) {
		throw new Error('AGENT_ID no está configurado');
	}
	const url = `${getBaseUrl()}/api/v1/connections/${encodeURIComponent(id)}/${agentId}`;
	return requestJson(url);
}

module.exports = {
	fetchConnectionById,
};