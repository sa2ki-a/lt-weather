import { useEffect, useState } from 'react'
import { daysUntil, getCurrentMoonInfo } from '../utils/moon'
import { MoonPhaseIcon } from './MoonPhaseIcon'

const UPDATE_INTERVAL_MS = 15 * 60 * 1000
const formatDate = (date:Date) => new Intl.DateTimeFormat('ja-JP',{month:'numeric',day:'numeric'}).format(date)

export function CurrentMoon({latitude=35}:{latitude?:number}) {
  const [moon,setMoon]=useState(()=>getCurrentMoonInfo())
  useEffect(()=>{const update=()=>setMoon(getCurrentMoonInfo());const timer=window.setInterval(update,UPDATE_INTERVAL_MS);document.addEventListener('visibilitychange',update);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',update)}},[])
  return <div className="brand-moon current-moon moon-summary-always" aria-label={`現在の月相は${moon.name}、月齢${moon.age.toFixed(1)}、月照率${Math.round(moon.illumination)}パーセント`}>
    <MoonPhaseIcon phase={moon.phase} latitude={latitude} size={68}/>
    <strong>月齢 {moon.age.toFixed(1)}</strong>
    <span>{moon.name}・照度 {Math.round(moon.illumination)}%</span>
    <div className="next-moon-events">
      <small><b>次の満月 {formatDate(moon.nextFullMoon)}</b><em>あと{daysUntil(moon.nextFullMoon)}日</em></small>
      <small><b>次の新月 {formatDate(moon.nextNewMoon)}</b><em>あと{daysUntil(moon.nextNewMoon)}日</em></small>
    </div>
  </div>
}
