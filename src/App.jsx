import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { NewSession } from './pages/NewSession';
import { History } from './pages/History';
import { ErrorBoundary } from './components/ErrorBoundary';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      errorElement: <ErrorBoundary />,
      children: [
        { path: '', element: <Home /> },
        { path: 'new', element: <NewSession /> },
        { path: 'history', element: <History /> }
      ]
    }
  ],
  {
    basename: '/'
  }
);

export default function App() {
  return <RouterProvider router={router} />;
}