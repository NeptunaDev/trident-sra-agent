import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchInternalLogs } from '../api/endpoints';

// Función auxiliar para verificar si una marca de tiempo cae dentro del rango de fechas seleccionado.
function matchesDateRange(timestamp, dateRange) {
  if (!timestamp || dateRange === 'ALL') return true;
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return false;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (dateRange === '24H') return now - time <= dayMs;
  if (dateRange === '7D') return now - time <= dayMs * 7;
  if (dateRange === '30D') return now - time <= dayMs * 30;
  return true;
}
// Hook personalizado para gestionar alertas basadas en los logs internos de la aplicación.
export function useAlerts({ level = 'ALL', dateRange = 'ALL', status = 'ALL', limit = 200 } = {}) {
  const [readIds, setReadIds] = useState(() => new Set());

  const query = useQuery({
    queryKey: ['alerts', limit],
    queryFn: async () => { // Obtiene los logs internos con el nivel WARN o ERROR, y los mapea a un formato de alerta.
      const response = await fetchInternalLogs({ level: 'WARN,ERROR', limit });
      const logs = Array.isArray(response?.logs) ? response.logs : [];
      return logs.map((entry, index) => ({
        id: entry?.id || `${entry?.timestamp || 'no-ts'}-${index}`,
        level: String(entry?.level || 'WARN').toUpperCase(),
        timestamp: entry?.timestamp || '',
        message: String(entry?.message || ''),
      }));
    },
    refetchInterval: 3000,
  });

  const allAlerts = (Array.isArray(query.data) ? query.data : []).map((alert) => ({
    ...alert,
    isRead: readIds.has(alert.id),
  }));
  // Aplica los filtros de nivel, estado de lectura y rango de fechas a las alertas obtenidas.
  const alerts = allAlerts.filter((alert) => {
    if (level !== 'ALL' && alert.level !== level) return false;
    if (status === 'READ' && !alert.isRead) return false;
    if (status === 'UNREAD' && alert.isRead) return false;
    if (!matchesDateRange(alert.timestamp, dateRange)) return false;
    return true;
  });
// Cuenta cuántas alertas no leídas hay después de aplicar los filtros.
  const unreadCount = allAlerts.filter((alert) => !alert.isRead).length;
// Función para marcar una alerta como leída, agregando su ID al conjunto de IDs leídos.
  function markAsRead(alertId) {
    if (!alertId) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(alertId);
      return next;
    });
  }
  // Función para marcar todas las alertas como leídas, agregando todos los IDs de las alertas actuales al conjunto de IDs leídos.
  function markAllAsRead() {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const alert of allAlerts) next.add(alert.id);
      return next;
    });
  }

  return {
    ...query,
    allAlerts,
    alerts,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
