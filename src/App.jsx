import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { NewSession } from './pages/NewSession';
import { EditSession } from './pages/EditSession';
import { History } from './pages/History';
import { ErrorBoundary, ErrorPage } from './components/ErrorBoundary';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      errorElement: <ErrorBoundary />,
      children: [
        { path: '', element: <Home />, errorElement: <ErrorPage /> },
        { path: 'new', element: <NewSession />, errorElement: <ErrorPage /> },
        { path: 'edit/:id', element: <EditSession />, errorElement: <ErrorPage /> },
        { path: 'history', element: <History />, errorElement: <ErrorPage /> }
      ]
    }
  ],
  {
    basename: '/poker'
  }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;