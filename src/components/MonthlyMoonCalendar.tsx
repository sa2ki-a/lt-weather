import { useMemo } from 'react'
import { MoonPhaseIcon } from './MoonPhaseIcon'
import { dateKey, formatZoned, zonedDateTime } from '../utils/zonedTime'
import { getMonthlyMoonData } from '../utils/moon'

function phaseBadge(phase:number){if(phase<.03||phase>.97)return'新月';if(phase>.47&&phase<.53)return'満月';if(phase>.22&&phase<.28)return'上弦';if(phase>.72&&phase<.78)return'下弦';return''}

export function MonthlyMoonCalendar({timezone,latitude,longitude}:{timezone:string;latitude:number;longitude:number}){
  const today=dateKey(new Date(),timezone)
  const days=useMemo(()=>getMonthlyMoonData(today,timezone,latitude,longitude,31),[today,timezone,latitude,longitude])
  const weekday=(key:string)=>new Intl.DateTimeFormat('ja-JP',{timeZone:timezone,weekday:'short'}).format(zonedDateTime(key,12,timezone))
  return <div className="monthly-moon-calendar">{days.map(day=>{const[,month,date]=day.dateKey.split('-').map(Number);const badge=phaseBadge(day.phase);return <article className={`monthly-moon-day ${day.dateKey===today?'is-today':''}`} key={day.dateKey}>
    <header><strong>{month}/{date} <span>{weekday(day.dateKey)}</span></strong>{day.dateKey===today&&<b>今日</b>}</header>
    <div className="monthly-moon-visual"><MoonPhaseIcon phase={day.phase} latitude={latitude} size={58}/>{badge&&<span className={`phase-badge phase-${badge}`}>{badge}</span>}</div>
    <div className="monthly-moon-stats"><strong>月齢 {day.age.toFixed(1)}</strong><small>照度 {Math.round(day.illumination)}%</small></div>
    <div className="monthly-moon-times"><span>↗ <i>月の出</i> <b>{day.moonrise?formatZoned(day.moonrise,timezone):'なし'}</b></span><span>↘ <i>月の入り</i> <b>{day.moonset?formatZoned(day.moonset,timezone):'なし'}</b></span></div>
  </article>})}</div>
}
