import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import Collections from './pages/Collections';
import Collection from './pages/Collection';
import HadithDetail from './pages/HadithDetail';
import NarratorsList from './pages/NarratorsList';
import Narrator from './pages/Narrator';
import HadithScience from './pages/HadithScience';
import HadithScienceArticle from './pages/HadithScienceArticle';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHadiths from './pages/admin/AdminHadiths';
import AdminHadithEdit from './pages/admin/AdminHadithEdit';
import AdminProfile from './pages/admin/AdminProfile';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Ensure users see fresh data on return
      retry: 1, // Only retry failed requests once
      staleTime: 1000 * 60, // 1 minute default stale time for fresher content
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collection/:slug" element={<Collection />} />
          <Route path="/hadith/:collection/:number" element={<HadithDetail />} />
          <Route path="/narrators" element={<NarratorsList />} />
          <Route path="/narrator/:name" element={<Narrator />} />
          <Route path="/hadith-science" element={<HadithScience />} />
          <Route path="/hadith-science/:slug" element={<HadithScienceArticle />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/hadiths"
            element={
              <AdminProtectedRoute>
                <AdminHadiths />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/hadiths/:id/edit"
            element={
              <AdminProtectedRoute>
                <AdminHadithEdit />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminProtectedRoute>
                <AdminProfile />
              </AdminProtectedRoute>
            }
          />
          {/* Fallback routing */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
