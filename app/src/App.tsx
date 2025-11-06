import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ResultsPage from './pages/ResultsPage'
import TestsPage from './pages/TestsPage'
import StandardPage from './pages/StandardPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ResultsPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/standard" element={<StandardPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
