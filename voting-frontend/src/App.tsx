import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PollsList from './pages/PollsList';
import PollDetails from './pages/PollDetails';
import Leaderboard from './pages/Leaderboard';
import PollActions from './components/PollActions';

export default function App() {
  return (
    <div className="min-h-full bg-gray-50">
      <Navbar />
      <div className="p-4">
        {/* test buttons */}
        <PollActions />
      </div>
      <Routes>
        <Route path="/" element={<PollsList />} />
        <Route path="/polls/:pollId" element={<PollDetails />} />
        <Route path="/polls/:pollId/leaderboard" element={<Leaderboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
