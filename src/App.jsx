import { useEffect } from 'react'
import { Routes,Route,useLocation } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import HomePage from './pages/HomePage'
import CompsPage from './pages/CompsPage'
import UnitsPage from './pages/UnitsPage'
import ItemsPage from './pages/ItemsPage'
import TraitsPage from './pages/TraitsPage'
import AugmentsPage from './pages/AugmentsPage'
import DetailPage from './pages/DetailPage'
import CompDetailPage from './pages/CompDetailPage'
import InfoPage from './pages/InfoPage'
import InfoTopicPage from './pages/InfoTopicPage'

// Mỗi lần đổi trang cuộn về đầu trang thay vì giữ vị trí cũ.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function EntityRouteKind({ kind }) { return <DetailPage forcedKind={kind} /> }

export default function App(){return <><ScrollToTop /><AppShell><Routes>
  <Route path="/" element={<HomePage/>}/>
  <Route path="/comps" element={<CompsPage/>}/>
  <Route path="/comps/:id" element={<CompDetailPage/>}/>
  <Route path="/units" element={<UnitsPage/>}/><Route path="/units/:id" element={<EntityRouteKind kind="units"/>}/>
  <Route path="/items" element={<ItemsPage/>}/><Route path="/items/:id" element={<EntityRouteKind kind="items"/>}/>
  <Route path="/traits" element={<TraitsPage/>}/><Route path="/traits/:id" element={<EntityRouteKind kind="traits"/>}/>
  <Route path="/augments" element={<AugmentsPage/>}/><Route path="/augments/:id" element={<EntityRouteKind kind="augments"/>}/>
  <Route path="/info" element={<InfoPage/>}/><Route path="/info/:slug" element={<InfoTopicPage/>}/>
</Routes></AppShell></>}
