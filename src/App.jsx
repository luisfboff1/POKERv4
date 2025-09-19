import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { NewSession } from './pages/NewSession';
import { EditSession } from './pages/EditSession';
import { History } from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route index element={<Home />} />
          <Route path="new" element={<NewSession />} />
          <Route path="edit/:id" element={<EditSession />} />
          <Route path="history" element={<History />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;