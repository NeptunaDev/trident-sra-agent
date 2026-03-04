import { useQuery } from '@tanstack/react-query';
import { fetchInternalLogs } from '../api/endpoints';

export function useAgentLogs({ level, search, limit = 200 } = {}) {
  return useQuery({
    queryKey: ['agent-logs', level || '', search || '', limit],
    queryFn: async () => {
      const response = await fetchInternalLogs({ level, search, limit });
      const logs = Array.isArray(response?.logs) ? response.logs : [];

      return logs.map((entry, index) => ({
        id: entry?.id || `${entry?.timestamp || 'no-ts'}-${index}`,
        level: String(entry?.level || 'INFO').toUpperCase(),
        timestamp: entry?.timestamp || '',
        message: String(entry?.message || ''),
      }));
    },
    refetchInterval: 3000,
  });
}
