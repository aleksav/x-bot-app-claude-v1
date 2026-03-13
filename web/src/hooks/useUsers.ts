import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type UsersResponse = {
  data: User[];
  meta: { page: number; pageSize: number; total: number };
};

export function useUsers(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['users', 'list', page, pageSize],
    queryFn: async () => {
      const response = await apiClient.get<UsersResponse>('/users', {
        params: { page, pageSize },
      });
      return response.data;
    },
  });
}

export function useUpdateUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const response = await apiClient.patch(`/users/${id}/password`, { password });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
    },
  });
}
