import { RouterProvider } from '@tanstack/react-router';
import { createAppRouter } from './routes/router';

const router = createAppRouter();

function App() {
  return <RouterProvider router={router} />;
}

export default App;
