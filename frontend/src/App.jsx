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

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent redundant requests when switching tabs
      retry: 1, // Only retry failed requests once
      staleTime: 1000 * 60 * 5, // 5 minutes default stale time
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
          {/* Fallback routing */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
