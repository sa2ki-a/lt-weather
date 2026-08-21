import { useEffect, useRef, useState } from 'react'
import type { Location } from '../types'
import { LocationCard } from '../components/LocationCard'
import { CurrentMoon } from '../components/CurrentMoon'

export function HomePage({locations,onOpen,onAdd,onDelete,onReorder}:{locations:Location[];onOpen:(location:Location)=>void;onAdd:()=>void;onDelete:(id:string)=>void;onReorder:(locations:Location[])=>void}){
  const [locating,setLocating]=useState(false)
  const [locationError,setLocationError]=useState('')
  const [orderedLocations,setOrderedLocations]=useState(locations)
  const [draggingId,setDraggingId]=useState<string|null>(null)
  const orderedRef=useRef(locations)
  const gestureRef=useRef<{id:string;pointerId:number;startX:number;startY:number;type:string;element:HTMLElement;timer?:ReturnType<typeof setTimeout>;active:boolean}|null>(null)
  const suppressClickRef=useRef(false)
  useEffect(()=>{if(!gestureRef.current){orderedRef.current=locations;setOrderedLocations(locations)}},[locations])
  useEffect(()=>()=>{const gesture=gestureRef.current;if(gesture?.timer)clearTimeout(gesture.timer)},[])
  const activateDrag=(gesture:NonNullable<typeof gestureRef.current>)=>{if(gesture.active)return;gesture.active=true;gesture.element.setPointerCapture?.(gesture.pointerId);setDraggingId(gesture.id);suppressClickRef.current=true;if(gesture.type==='touch'){try{navigator.vibrate?.(30)}catch{/* Optional API. */}}}
  const beginGesture=(id:string,event:React.PointerEvent<HTMLElement>)=>{if(event.button!==0||(event.target as Element).closest('button,a,input,select,textarea,[role="menuitem"]'))return;const gesture={id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,type:event.pointerType,element:event.currentTarget,active:false} as NonNullable<typeof gestureRef.current>;if(event.pointerType==='touch')gesture.timer=setTimeout(()=>activateDrag(gesture),450);gestureRef.current=gesture}
  const moveGesture=(event:React.PointerEvent<HTMLElement>)=>{const gesture=gestureRef.current;if(!gesture||gesture.pointerId!==event.pointerId)return;const distance=Math.hypot(event.clientX-gesture.startX,event.clientY-gesture.startY);if(!gesture.active){if(gesture.type==='mouse'&&distance>=4)activateDrag(gesture);else if(distance>10){if(gesture.timer)clearTimeout(gesture.timer);gestureRef.current=null}return}event.preventDefault();const cards=Array.from(document.querySelectorAll<HTMLElement>('.card-list [data-location-id]'));const target=cards.find(card=>{const rect=card.getBoundingClientRect();return event.clientY>=rect.top&&event.clientY<=rect.bottom});const targetId=target?.dataset.locationId;if(!targetId||targetId===gesture.id)return;const current=orderedRef.current;const from=current.findIndex(location=>location.id===gesture.id);const to=current.findIndex(location=>location.id===targetId);if(from<0||to<0)return;const next=[...current];const [moved]=next.splice(from,1);next.splice(to,0,moved);orderedRef.current=next;setOrderedLocations(next)}
  const endGesture=(event:React.PointerEvent<HTMLElement>)=>{const gesture=gestureRef.current;if(!gesture||gesture.pointerId!==event.pointerId)return;if(gesture.timer)clearTimeout(gesture.timer);if(gesture.active){event.preventDefault();setDraggingId(null);onReorder(orderedRef.current);window.setTimeout(()=>{suppressClickRef.current=false},0)}gestureRef.current=null}
  const openLocation=(location:Location)=>{if(suppressClickRef.current){suppressClickRef.current=false;return}onOpen(location)}
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
    <section className="section-heading"><div><h2>お気に入り地点</h2><span>{locations.length} 地点</span></div><button className="primary" onClick={onAdd}>＋ 地点を追加</button></section>{locations.length===0?<section className="empty"><div>🪲</div><h2>地点を登録しましょう</h2><p>現在地、または緯度・経度から追加できます。</p><button className="primary" onClick={onAdd}>最初の地点を追加</button></section>:<div className={`card-list${draggingId?' card-list-sorting':''}`}>{orderedLocations.map(location=><LocationCard key={location.id} location={location} dragging={draggingId===location.id} onPointerDown={event=>beginGesture(location.id,event)} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} onOpen={()=>openLocation(location)} onDelete={()=>onDelete(location.id)}/>)}</div>}
  </main>
}
