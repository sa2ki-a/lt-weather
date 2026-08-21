import { useRef, useState } from 'react'
import type { GeocodingResult, Location } from '../types'
import { resolvePlace, searchPlaces } from '../services/geocoding'
import { createId } from '../utils/id'

type Method = 'search' | 'current' | 'coordinates'

export function AddLocationPage({ onBack, onSave }: { onBack: () => void; onSave: (location: Location) => void }) {
  const [method, setMethod] = useState<Method>('search')
  const [name, setName] = useState(''), [lat, setLat] = useState(''), [lon, setLon] = useState('')
  const [geoStatus, setGeoStatus] = useState('')
  const [query, setQuery] = useState(''), [results, setResults] = useState<GeocodingResult[]>([])
  const [selected, setSelected] = useState<GeocodingResult>(), [selectedName, setSelectedName] = useState('')
  const [searching, setSearching] = useState(false), [searchMessage, setSearchMessage] = useState('')
  const [resolvingId, setResolvingId] = useState<number>()
  const [saveError, setSaveError] = useState('')
  const searchController = useRef<AbortController>(null)

  const saveLocation = (locationName: string, latitude: number, longitude: number, countryCode?:string) => {
    if (!locationName.trim() || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return
    setSaveError('')
    try { onSave({ id: createId(), name: locationName.trim(), latitude, longitude, countryCode }) }
    catch (error) {
      console.error('お気に入り地点の保存に失敗しました', error)
      setSaveError(error instanceof Error ? `保存できませんでした: ${error.message}` : '保存できませんでした。ブラウザのストレージ設定をご確認ください。')
    }
  }
  const doSearch = async (event: React.FormEvent) => {
    event.preventDefault(); if (!query.trim() || searching) return
    searchController.current?.abort(); const controller = new AbortController(); searchController.current = controller
    setSearching(true); setSearchMessage(''); setResults([]); setSelected(undefined)
    try { const found = await searchPlaces(query, controller.signal); setResults(found); if (!found.length) setSearchMessage('該当する地点が見つかりませんでした。表記を変えてお試しください。') }
    catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; setSearchMessage(error instanceof Error ? error.message : '地名を検索できませんでした。時間をおいてお試しください。') }
    finally { if (!controller.signal.aborted) setSearching(false) }
  }
  const selectResult = async (result: GeocodingResult) => {
    setSearchMessage(''); setResolvingId(result.id)
    try { const resolved=await resolvePlace(result); setSelected(resolved); setSelectedName(resolved.name) }
    catch (error) { setSearchMessage(error instanceof Error ? error.message : '代表座標を取得できませんでした。') }
    finally { setResolvingId(undefined) }
  }
  const useCurrent = () => {
    if (!navigator.geolocation) { setGeoStatus('このブラウザは現在地取得に対応していません'); return }
    setGeoStatus('現在地を取得中…')
    navigator.geolocation.getCurrentPosition(position => { setLat(position.coords.latitude.toFixed(6)); setLon(position.coords.longitude.toFixed(6)); setGeoStatus('現在地を取得しました。地点名を入力して保存してください。') }, error => setGeoStatus(`現在地を取得できませんでした: ${error.message}`), { enableHighAccuracy: true, timeout: 12000 })
  }
  const coordinateValid = name.trim() && Number(lat) >= -90 && Number(lat) <= 90 && Number(lon) >= -180 && Number(lon) <= 180

  return <main><header className="topbar"><button type="button" className="back" onClick={onBack}>‹</button><h1>地点を追加</h1></header>
    <nav className="add-method-tabs" aria-label="地点の追加方法"><button type="button" className={method==='search'?'active':''} onClick={()=>setMethod('search')}>⌕<span>地名検索</span></button><button type="button" className={method==='current'?'active':''} onClick={()=>setMethod('current')}>⌖<span>現在地</span></button><button type="button" className={method==='coordinates'?'active':''} onClick={()=>setMethod('coordinates')}>#<span>緯度・経度</span></button></nav>
    {saveError&&<div className="search-message save-error" role="alert">{saveError}</div>}

    {method==='search'&&<section className="form-panel place-search-panel"><h2>地名から検索</h2><p>市区町村や地域名を日本語・英語で検索できます。</p><form className="search-form" onSubmit={doSearch}><input aria-label="検索する地名" value={query} onChange={event=>setQuery(event.target.value)} placeholder="例：君津市、Kota Kinabalu" autoFocus/><button type="submit" className="primary" disabled={!query.trim()||searching}>{searching?'検索中…':'検索'}</button></form>{searching&&<div className="search-state"><span className="spinner"/>候補を検索しています…</div>}{searchMessage&&<div className="search-message" role="status">{searchMessage}</div>}{!!results.length&&<div className="search-results" aria-label="検索結果">{results.map(result=>{const administrative=[result.admin2,result.admin1,result.country].filter(Boolean).filter((value,index,all)=>all.indexOf(value)===index).join('・');const hasCoordinates=result.latitude!==undefined&&result.longitude!==undefined;return <button type="button" key={`${result.id}-${result.municipalityCode??result.latitude}`} className={selected?.id===result.id?'selected':''} disabled={resolvingId!==undefined} onClick={()=>void selectResult(result)}><strong>{result.name}</strong><span>{administrative||'行政区分情報なし'}</span><small>{resolvingId===result.id?'代表座標を取得中…':hasCoordinates?`${result.latitude!.toFixed(4)}, ${result.longitude!.toFixed(4)}`:'選択すると代表座標を取得します'}</small></button>})}</div>}{selected&&selected.latitude!==undefined&&selected.longitude!==undefined&&<div className="selected-place"><span className="step">選択した地点</span><label>お気に入り地点名<input value={selectedName} onChange={event=>setSelectedName(event.target.value)} placeholder="任意の地点名"/></label><div className="selected-coordinates">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</div><button type="button" className="primary wide" disabled={!selectedName.trim()} onClick={()=>saveLocation(selectedName,selected.latitude!,selected.longitude!,selected.countryCode)}>お気に入りに追加</button></div>}</section>}

    {method==='current'&&<section className="form-panel"><h2>現在地から追加</h2><p>端末の位置情報を使って座標を取得します。</p><button type="button" className="secondary wide" onClick={useCurrent}>⌖ 現在地を取得</button>{geoStatus&&<div className="form-note">{geoStatus}</div>}{lat&&lon&&<form onSubmit={event=>{event.preventDefault();saveLocation(name,Number(lat),Number(lon))}}><label>地点名<input value={name} onChange={event=>setName(event.target.value)} placeholder="例：いつもの地点" required/></label><div className="selected-coordinates">{Number(lat).toFixed(5)}, {Number(lon).toFixed(5)}</div><button className="primary wide save" disabled={!name.trim()}>お気に入りに追加</button></form>}</section>}

    {method==='coordinates'&&<form className="form-panel" onSubmit={event=>{event.preventDefault();saveLocation(name,Number(lat),Number(lon))}}><h2>緯度・経度を入力</h2><p>地点の座標と、表示する名前を入力します。</p><label>地点名<input value={name} onChange={event=>setName(event.target.value)} placeholder="例：〇〇雑木林" required/></label><div className="coordinate-fields"><label>緯度<input inputMode="decimal" value={lat} onChange={event=>setLat(event.target.value)} placeholder="35.681236" type="number" min="-90" max="90" step="any" required/></label><label>経度<input inputMode="decimal" value={lon} onChange={event=>setLon(event.target.value)} placeholder="139.767125" type="number" min="-180" max="180" step="any" required/></label></div><button className="primary wide save" disabled={!coordinateValid}>お気に入りに追加</button></form>}
  </main>
}
