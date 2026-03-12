import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import LoginPage from '../pages/LoginPage';
import VerifyPage from '../pages/VerifyPage';
import DashboardPage from '../pages/DashboardPage';
import PostsPage from '../pages/PostsPage';

async function checkAuth(): Promise<boolean> {
  try {
    await apiClient.get('/auth/me');
    return true;
  } catch {
    return false;
  }
}

const rootRoute = createRootRoute({
  component: Outlet,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const verifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/verify',
  component: VerifyPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: async () => {
    const authenticated = await checkAuth();
    if (!authenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: DashboardPage,
});

const postsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/posts',
  beforeLoad: async () => {
    const authenticated = await checkAuth();
    if (!authenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: PostsPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    const authenticated = await checkAuth();
    if (authenticated) {
      throw redirect({ to: '/dashboard' });
    } else {
      throw redirect({ to: '/login' });
    }
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  verifyRoute,
  dashboardRoute,
  postsRoute,
]);

export function createAppRouter(_queryClient?: QueryClient) {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
