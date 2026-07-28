import { Routes, Route } from 'react-router';
import AltarPage from './pages/AltarPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AltarPage />} />
    </Routes>
  );
}
