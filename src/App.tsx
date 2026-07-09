import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { MemoryUpload } from './pages/MemoryUpload';
import { Timeline } from './pages/Timeline';
import { AIDocumentary } from './pages/AIDocumentary';
import { Interview } from './pages/Interview';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { useMemoryStorage } from './hooks/useMemoryStorage';

// Secure Router Guard to enforce login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useMemoryStorage();

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-gray-50 flex items-center justify-center select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-apple-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] font-bold text-apple-gray-300">보관소 정보를 가져오는 중...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Page - Standalone Full Screen */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected App Screens wrapped inside Layout Shell */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/upload" element={<MemoryUpload />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/documentary" element={<AIDocumentary />} />
                  <Route path="/interview" element={<Interview />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
