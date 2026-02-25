import { useQuery } from '@tanstack/react-query';
import { fetchInternalStatus } from '../api/endpoints';

export function useAgentStatus() {
  return useQuery({
    queryKey: ['agent-status'],
    queryFn: fetchInternalStatus,
    refetchInterval: 3000,
  });
}
