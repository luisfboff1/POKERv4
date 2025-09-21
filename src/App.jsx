import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { NewSession } from './pages/NewSession';
import { History } from './pages/History';
import { Ranking } from './pages/Ranking';
import Login from './pages/Login';
import Register from './pages/Register';
import Invites from './pages/Invites';
import SuperAdmin from './pages/SuperAdmin';
import { ErrorBoundary } from './components/ErrorBoundary';

const router = createBrowserRouter(
  [
    // Rotas públicas (sem autenticação)
    {
      path: '/login',
      element: (
        <ProtectedRoute requireAuth={false}>
          <Login />
        </ProtectedRoute>
      ),
      errorElement: <ErrorBoundary />
    },
    {
      path: '/register',
      element: (
        <ProtectedRoute requireAuth={false}>
          <Register />
        </ProtectedRoute>
      ),
      errorElement: <ErrorBoundary />
    },
    
    // Rotas protegidas (dashboard)
    {
      path: '/',
      element: (
        <ProtectedRoute requireAuth={true}>
          <Layout />
        </ProtectedRoute>
      ),
      errorElement: <ErrorBoundary />,
      children: [
        { 
          path: '', 
          element: <Home /> 
        },
        { 
          path: 'dashboard', 
          element: <Home /> 
        },
        { 
          path: 'new', 
          element: (
            <ProtectedRoute requireRole="admin">
              <NewSession />
            </ProtectedRoute>
          )
        },
        { 
          path: 'history', 
          element: <History /> 
        },
        { 
          path: 'ranking', 
          element: <Ranking /> 
        },
        { 
          path: 'invites', 
          element: (
            <ProtectedRoute requireRole="admin">
              <Invites />
            </ProtectedRoute>
          )
        },
        { 
          path: 'admin', 
          element: (
            <ProtectedRoute requireSuperAdmin={true}>
              <SuperAdmin />
            </ProtectedRoute>
          )
        }
      ]
    }
  ],
  {
    basename: '/'
  }
);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}