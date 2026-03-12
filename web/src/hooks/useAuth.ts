import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

type User = {
  id: string;
  email: string;
};

type AuthResponse = {
  data: User;
};

type MagicLinkResponse = {
  data: { url: string };
};

export function useAuth() {
  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const response = await apiClient.get<AuthResponse>('/auth/me');
      return response.data.data;
    },
    retry: false,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    error: query.error,
  };
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.post<MagicLinkResponse>('/auth/magic-link', { email });
      return response.data.data;
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
