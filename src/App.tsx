import { useState } from 'react'
import type { Location } from './types'
import { loadLocations, saveLocations } from './services/storage'
import { HomePage } from './pages/HomePage'
import { AddLocationPage } from './pages/AddLocationPage'
import { DetailPage } from './pages/DetailPage'
import { cleanupWeatherCache, prefetchBestMatchWeather, removeWeatherCacheForLocation } from './services/weatherCache'

type View = { page: 'home' } | { page: 'add' } | { page: 'detail'; location: Location }

export default function App() {
  useState(() => { cleanupWeatherCache(); return true })
  const [locations, setLocations] = useState(loadLocations)
  const [view, setView] = useState<View>({ page: 'home' })
  const save = (location: Location) => {
    const next = [...locations, location]
    saveLocations(next)
    void prefetchBestMatchWeather(location.latitude, location.longitude).catch(() => { /* registration succeeds even if prefetch fails */ })
    setLocations(next)
    setView({ page: 'home' })
  }
  const remove = (id: string) => {
    const removed = locations.find(location => location.id === id)
    if (removed) removeWeatherCacheForLocation(removed.latitude, removed.longitude)
    const next = locations.filter(location => location.id !== id)
    saveLocations(next)
    setLocations(next)
  }
  const reorder = (next: Location[]) => {
    saveLocations(next)
    setLocations(next)
  }
  if (view.page === 'add') return <AddLocationPage onBack={() => setView({ page: 'home' })} onSave={save}/>
  if (view.page === 'detail') return <DetailPage location={view.location} onBack={() => setView({ page: 'home' })}/>
  return <HomePage locations={locations} onOpen={location => setView({ page: 'detail', location })} onAdd={() => setView({ page: 'add' })} onDelete={remove} onReorder={reorder}/>
}
