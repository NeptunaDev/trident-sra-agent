import { useQuery } from '@tanstack/react-query';
import { fetchSessions } from '../api/endpoints';

export const SESSION_QUERY_KEY = ['sessions'];

export function useSessions(page = 1, limit = 10) {
  return useQuery({
    queryKey: [...SESSION_QUERY_KEY, page, limit],
    queryFn: () => fetchSessions(page, limit),
  });
}
