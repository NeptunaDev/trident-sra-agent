import { useQuery } from '@tanstack/react-query';
import { fetchActiveSessions } from '../api/endpoints';

export const ACTIVE_SESSIONS_QUERY_KEY = ['active-sessions'];


export function useActiveSessions() {
  return useQuery({
    queryKey: ACTIVE_SESSIONS_QUERY_KEY,
    queryFn: fetchActiveSessions,
    refetchInterval: 3000,
  });
}
