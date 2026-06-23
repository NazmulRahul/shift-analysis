import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { BreakdownStreaks } from './pages/BreakdownStreaks';
import { DataQuality } from './pages/DataQuality';
import { Upload } from './pages/Upload';

// Create TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Right Main Container */}
            <div className="pl-64 min-h-screen flex flex-col">
              {/* Top Navbar */}
              <Navbar />

              {/* Page Content Panel */}
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/streaks" element={<BreakdownStreaks />} />
                  <Route path="/quality" element={<DataQuality />} />
                  <Route path="/upload" element={<Upload />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
