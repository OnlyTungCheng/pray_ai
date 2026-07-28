import { Routes, Route } from 'react-router-dom';
import AltarPage from './pages/AltarPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AltarPage />} />
    </Routes>
  );
}
