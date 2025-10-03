import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Header from './components/Header';
import AdventureSelector from './components/AdventureSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdventureProvider } from './contexts/AdventureContext';
import { initializeTheme } from './config/theme';
import { useEffect } from 'react';

// Lazy load all page components for code splitting
const Sessions = lazy(() => import('./pages/Sessions'));
const Characters = lazy(() => import('./pages/Characters'));
const Locations = lazy(() => import('./pages/Locations'));
const Search = lazy(() => import('./pages/Search'));
const Adventures = lazy(() => import('./pages/Adventures'));
const MagicItems = lazy(() => import('./pages/MagicItems'));
const NPCs = lazy(() => import('./pages/NPCs'));
const Quests = lazy(() => import('./pages/Quests').then(module => ({ default: module.Quests })));
const DiceRoller = lazy(() => import('./pages/DiceRoller'));
const CombatTracker = lazy(() => import('./pages/CombatTracker'));
const WikiImport = lazy(() => import('./pages/WikiImport'));
const ParkingLot = lazy(() => import('./pages/ParkingLot'));
const Relationships = lazy(() => import('./pages/Relationships').then(module => ({ default: module.Relationships })));
const Network = lazy(() => import('./pages/Network').then(module => ({ default: module.Network })));

function App(): JSX.Element {
  // Initialize theme on app startup
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AdventureProvider>
          <div className="min-h-screen bg-base-100">
            <Header />
            <AdventureSelector />
            <main className="container mx-auto p-4">
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="loading loading-spinner loading-lg"></div></div>}>
                <Routes>
                  <Route path="/sessions" element={<Sessions />} />
                  <Route path="/characters" element={<Characters />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/adventures" element={<Adventures />} />
                  <Route path="/magic-items" element={<MagicItems />} />
                  <Route path="/npcs" element={<NPCs />} />
                  <Route path="/quests" element={<Quests />} />
                  <Route path="/dice-roller" element={<DiceRoller />} />
                  <Route path="/combat-tracker" element={<CombatTracker />} />
                  <Route path="/relationships" element={<Relationships />} />
                  <Route path="/network" element={<Network />} />
                  <Route path="/wiki-import" element={<WikiImport />} />
                  <Route path="/parking-lot" element={<ParkingLot />} />
                  <Route path="/" element={<Sessions />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </AdventureProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
