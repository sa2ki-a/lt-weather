import { useEffect, useRef, useState } from 'react'
import type { Location } from '../types'
import { useWeather } from '../hooks/useWeather'
import { nightKeyFor, dateKey } from '../utils/zonedTime'
import { WeatherIcon } from './WeatherIcon'
import { calculateAstronomy, moonPhaseName } from '../services/astronomy'

type LocationCardProps={location:Location;onOpen:()=>void;onDelete:()=>void;onStartReordering:()=>void;reordering:boolean;moveUpDisabled:boolean;moveDownDisabled:boolean;onMoveUp:()=>void;onMoveDown:()=>void}

export function LocationCard({location,onOpen,onDelete,onStartReordering,reordering,moveUpDisabled,moveDownDisabled,onMoveUp,onMoveDown}:LocationCardProps){
  const {data,loading,error}=useWeather(location.latitude,location.longitude)
  const [menuOpen,setMenuOpen]=useState(false)
  const menuRef=useRef<HTMLDivElement>(null)
  useEffect(()=>{if(!menuOpen)return;const outside=(event:PointerEvent)=>{if(!menuRef.current?.contains(event.target as Node))setMenuOpen(false)};const keyboard=(event:KeyboardEvent)=>{if(event.key==='Escape')setMenuOpen(false)};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',keyboard);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',keyboard)}},[menuOpen])
  let summary:React.ReactNode=loading?<span className="muted">読み込み中…</span>:error?<span className="danger">予報を取得できません</span>:null
  if(data){const key=nightKeyFor(new Date(),data.timezone);const hours=data.hourly.filter(hour=>dateKey(hour.time,data.timezone)===key&&new Intl.DateTimeFormat('en-US',{timeZone:data.timezone,hour:'numeric',hourCycle:'h23'}).format(hour.time)==='20');const hour=hours[0]??data.hourly.find(item=>item.time.getTime()>Date.now());if(hour){const astro=calculateAstronomy(location.latitude,location.longitude,[hour.time],hour.time);summary=<><div className="card-weather"><WeatherIcon code={hour.weatherCode}/><strong>{Math.round(hour.temperature)}℃</strong><span>湿度 {Math.round(hour.humidity)}%</span><span>風 {hour.windSpeed.toFixed(1)}m/s</span></div><div className="moon-summary">☾ {moonPhaseName(astro.phase)}・照度 {Math.round(astro.illumination)}%・{astro.moonHours[0].isAbove?'月は空にあり':'月は地平線下'}</div></>}}
  const confirmDelete=()=>{setMenuOpen(false);if(window.confirm(`${location.name}を削除しますか？`))onDelete()}
  const startReordering=()=>{setMenuOpen(false);onStartReordering()}
  const stopCardClick=(event:React.MouseEvent)=>event.stopPropagation()
  return <article className={`location-card${reordering?' location-card-reordering':''}`} onClick={onOpen}><div className="card-title"><div><h2>{location.name}</h2><small>{location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}</small></div>{reordering?<div className="location-reorder-buttons" onClick={stopCardClick}><button type="button" aria-label={`${location.name}を1つ上へ移動`} disabled={moveUpDisabled} onClick={onMoveUp}>↑</button><button type="button" aria-label={`${location.name}を1つ下へ移動`} disabled={moveDownDisabled} onClick={onMoveDown}>↓</button></div>:<div className="location-actions" ref={menuRef} onClick={stopCardClick}><button type="button" className="location-menu-button" aria-label={`${location.name}のメニュー`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(value=>!value)}>⋮</button>{menuOpen&&<div className="location-menu" role="menu"><button type="button" role="menuitem" className="location-menu-reorder" onClick={startReordering}>並べ替え</button><button type="button" role="menuitem" className="location-menu-delete" onClick={confirmDelete}>削除</button></div>}</div>}</div>{summary}</article>
}
