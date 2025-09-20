import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Body from './components/Body'
import AuthPage from './components/AuthPage'
import ResearchList from './components/ResearchList'
import ResearchDisplay from './components/ResearchDisplay'

function App() {

  return (
    <>
      <BrowserRouter basename='/' >
        <Routes>
          <Route path='/' element={<Body />}>
            <Route index element={<Navigate to="/auth" replace />} />
            <Route path='/auth' element={<AuthPage />} />
            <Route path='/research/:researchId' element={<ResearchDisplay />} />
            <Route path='/research' element={<ResearchList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App