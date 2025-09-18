import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sessions from './pages/Sessions';
import Characters from './pages/Characters';
import Locations from './pages/Locations';
import Timeline from './pages/Timeline';
import Search from './pages/Search';
import Adventures from './pages/Adventures';
import MagicItems from './pages/MagicItems';
import Header from './components/Header';
import { AdventureProvider } from './contexts/AdventureContext';

function App(): JSX.Element {
  return (
    <Router>
      <AdventureProvider>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <main className="container mx-auto p-4">
            <Routes>
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/search" element={<Search />} />
              <Route path="/adventures" element={<Adventures />} />
              <Route path="/magic-items" element={<MagicItems />} />
              <Route path="/" element={<Sessions />} />
            </Routes>
          </main>
        </div>
      </AdventureProvider>
    </Router>
  );
}

export default App;
