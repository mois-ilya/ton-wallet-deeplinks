import { HashRouter, Routes, Route } from 'react-router-dom'
import ResultsPage from './pages/ResultsPage'
import TestsPage from './pages/TestsPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ResultsPage />} />
        <Route path="/tests" element={<TestsPage />} />
      </Routes>
    </HashRouter>
  )
}
