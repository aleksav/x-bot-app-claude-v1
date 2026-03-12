export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  bots: {
    list: ['bots', 'list'] as const,
    detail: (id: string) => ['bots', 'detail', id] as const,
  },
} as const;
