import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sessions from './pages/Sessions';
import Characters from './pages/Characters';
import Locations from './pages/Locations';
import Search from './pages/Search';
import Adventures from './pages/Adventures';
import MagicItems from './pages/MagicItems';
import NPCs from './pages/NPCs';
import { Quests } from './pages/Quests';
import DiceRoller from './pages/DiceRoller';
import CombatTracker from './pages/CombatTracker';
import WikiImport from './pages/WikiImport';
import ParkingLot from './pages/ParkingLot';
import { Relationships } from './pages/Relationships';
import Header from './components/Header';
import AdventureSelector from './components/AdventureSelector';
import { AdventureProvider } from './contexts/AdventureContext';

function App(): JSX.Element {
  return (
    <Router>
      <AdventureProvider>
        <div className="min-h-screen bg-base-100">
          <Header />
          <AdventureSelector />
          <main className="container mx-auto p-4">
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
              <Route path="/wiki-import" element={<WikiImport />} />
              <Route path="/parking-lot" element={<ParkingLot />} />
              <Route path="/" element={<Sessions />} />
            </Routes>
          </main>
        </div>
      </AdventureProvider>
    </Router>
  );
}

export default App;
