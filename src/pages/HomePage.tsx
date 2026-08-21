import { useState } from 'react'
import type { Location } from '../types'
import { LocationCard } from '../components/LocationCard'
import { CurrentMoon } from '../components/CurrentMoon'

export function HomePage({locations,onOpen,onAdd,onDelete}:{locations:Location[];onOpen:(location:Location)=>void;onAdd:()=>void;onDelete:(id:string)=>void}){
  const [locating,setLocating]=useState(false)
  const [locationError,setLocationError]=useState('')
  const openCurrentLocation=()=>{
    if(locating)return
    setLocationError('')
    if(!window.isSecureContext){setLocationError('現在地の取得にはHTTPS接続が必要です。LAN内のHTTPアドレスでは利用できません。');return}
    if(!navigator.geolocation){setLocationError('このブラウザは現在地取得に対応していません。');return}
    setLocating(true)
    navigator.geolocation.getCurrentPosition(position=>{
      setLocating(false)
      onOpen({id:'temporary-current-location',name:'現在地',latitude:position.coords.latitude,longitude:position.coords.longitude})
    },error=>{
      setLocating(false)
      const messages:Record<number,string>={1:'位置情報の利用が許可されませんでした。ブラウザのサイト設定をご確認ください。',2:'現在地を取得できませんでした。GPSや通信状態をご確認ください。',3:'現在地の取得がタイムアウトしました。もう一度お試しください。'}
      setLocationError(messages[error.code]??`現在地を取得できませんでした: ${error.message}`)
    },{enableHighAccuracy:true,timeout:12000,maximumAge:60000})
  }
  return <main><header className="hero"><div><h1>LT Weather</h1></div><CurrentMoon/></header>
    <section className="current-location-section"><button type="button" className="current-location-button" onClick={openCurrentLocation} disabled={locating}><span className="current-location-icon">⌖</span><span><strong>{locating?'現在地を取得中…':'現在地'}</strong><small>{locating?'しばらくお待ちください':'今いる場所の天気を見る'}</small></span>{locating?<i className="spinner"/>:<b>›</b>}</button>{locationError&&<div className="current-location-error" role="alert">{locationError}</div>}</section>
    <section className="section-heading"><div><h2>お気に入り地点</h2><span>{locations.length} 地点</span></div><button className="primary" onClick={onAdd}>＋ 地点を追加</button></section>{locations.length===0?<section className="empty"><div>🪲</div><h2>地点を登録しましょう</h2><p>現在地、または緯度・経度から追加できます。</p><button className="primary" onClick={onAdd}>最初の地点を追加</button></section>:<div className="card-list">{locations.map(location=><LocationCard key={location.id} location={location} onOpen={()=>onOpen(location)} onDelete={()=>onDelete(location.id)}/>)}</div>}
  </main>
}
