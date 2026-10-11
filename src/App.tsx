import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

const HomePage = lazy(() => import('./pages/HomePage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ReaderPage = lazy(() => import('./pages/ReaderPage'));
const SessionSetupPage = lazy(() => import('./pages/SessionSetupPage'));

export default function App() {
  const location = useLocation();
  const isReaderPage = location.pathname.startsWith('/reader/');

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        {isReaderPage ? (
          <Routes location={location} key={location.pathname}>
            <Route path="/reader/:bookId" element={<ReaderPage />} />
          </Routes>
        ) : (
          <Layout>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/session-setup/:bookId" element={<SessionSetupPage />} />
            </Routes>
          </Layout>
        )}
      </Suspense>
    </AnimatePresence>
  );
}
