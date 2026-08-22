import { useMemo, useState } from 'react'
import type { Location, WeatherModelId } from '../types'
import { useWeather } from '../hooks/useWeather'
import { Loading, ErrorState } from '../components/Loading'
import { Timeline } from '../components/Timeline'
import { TenDayTimeline } from '../components/TenDayTimeline'
import { MonthlyMoonCalendar } from '../components/MonthlyMoonCalendar'
import { MoonPhaseIcon } from '../components/MoonPhaseIcon'
import { formatZoned, hourLabel } from '../utils/zonedTime'
import { calculateAstronomy, moonPhaseName } from '../services/astronomy'
import { loadWeatherModelPreference, saveWeatherModelPreference } from '../services/storage'
import { isJapanLocation, weatherModel, weatherModels } from '../config/weatherModels'

type ForecastMode='hourly'|'daily'|'monthly'
export function DetailPage({location,onBack}:{location:Location;onBack:()=>void}){
  const [anchor]=useState(()=>new Date()),[mode,setMode]=useState<ForecastMode>('hourly')
  const [modelId,setModelId]=useState<WeatherModelId>(()=>loadWeatherModelPreference()??(isJapanLocation(location)?'jma_msm':'auto'))
  const hourlyForecast=useWeather(location.latitude,location.longitude,modelId)
  const dailyForecast=useWeather(location.latitude,location.longitude,'auto',mode==='daily','daily')
  const model=weatherModel(modelId),data=hourlyForecast.data
  const hours=useMemo(()=>{if(!data)return[];let index=-1;for(let candidate=data.hourly.length-1;candidate>=0;candidate--){if(data.hourly[candidate].time.getTime()<=anchor.getTime()){index=candidate;break}}if(index<0)index=0;return data.hourly.slice(index,index+24)},[data,anchor])
  const astro=hours.length?calculateAstronomy(location.latitude,location.longitude,hours.map(hour=>hour.time),anchor):null
  const changeModel=(next:WeatherModelId)=>{setModelId(next);try{saveWeatherModelPreference(next)}catch(storageError){console.error('予報モデル設定を保存できませんでした',storageError)}}
  const astroCards=data&&astro?<section className="astro-cards"><div className="moon-card"><span>月</span><div className="moon-card-content"><MoonPhaseIcon phase={astro.phase} latitude={location.latitude} size={50}/><div><strong>{moonPhaseName(astro.phase)}</strong><small>照度 {Math.round(astro.illumination)}%</small></div></div></div><div><span>↗ 次の月の出</span><strong>{formatZoned(astro.moonrise,data.timezone)}</strong><small>{astro.moonrise?hourLabel(astro.moonrise,data.timezone):'24時間内になし'}</small></div><div><span>↘ 次の月の入り</span><strong>{formatZoned(astro.moonset,data.timezone)}</strong><small>{astro.moonset?hourLabel(astro.moonset,data.timezone):'24時間内になし'}</small></div><div><span>◒ 次の日没</span><strong>{formatZoned(astro.sunset,data.timezone)}</strong></div></section>:null
  return <main className="detail">
    <header className="detail-header"><button className="back" onClick={onBack}>‹</button><div><span className="eyebrow">地点</span><h1>{location.name}</h1><small>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} {data&&`・${data.timezoneAbbreviation}`}</small></div></header>
    {astroCards}
    <nav className="forecast-switch" aria-label="表示期間"><button type="button" className={mode==='hourly'?'active':''} aria-pressed={mode==='hourly'} onClick={()=>setMode('hourly')}>24時間</button><button type="button" className={mode==='daily'?'active':''} aria-pressed={mode==='daily'} onClick={()=>setMode('daily')}>10日間</button><button type="button" className={mode==='monthly'?'active':''} aria-pressed={mode==='monthly'} onClick={()=>setMode('monthly')}>1ヶ月間</button></nav>
    {mode==='hourly'&&<section className="weather-model-control"><label htmlFor="weather-model">予報モデル<select id="weather-model" value={modelId} onChange={event=>changeModel(event.target.value as WeatherModelId)}>{weatherModels.map(option=><option value={option.id} key={option.id}>{option.label}</option>)}</select></label><div><strong>{model.label}</strong><small>{model.coverage}・24時間予報に適用{modelId==='jma_msm'&&data?.precipitationProbabilitySource==='best_match'?'・降水確率はOpen-Meteoの確率予報を使用':''}</small></div></section>}
    {mode==='hourly'&&(hourlyForecast.loading?<Loading/>:hourlyForecast.error?<ErrorState message={hourlyForecast.error} retry={hourlyForecast.reload}/>:data&&astro?<section><div className="timeline-heading"><div><h2>24時間タイムライン</h2><p>横にスクロールして時間ごとに比較</p></div><span>現在時刻から24時間</span></div><Timeline hours={hours} astronomy={astro} timezone={data.timezone} latitude={location.latitude}/></section>:null)}
    {mode==='daily'&&(dailyForecast.loading?<Loading/>:dailyForecast.error?<ErrorState message={dailyForecast.error} retry={dailyForecast.reload}/>:dailyForecast.data?<section><div className="timeline-heading"><div><h2>10日間タイムライン</h2><p>{dailyForecast.stale?'更新に失敗したため前回取得データを表示しています':'横にスクロールして日ごとに比較'}</p></div><span>今日から10日間</span></div><TenDayTimeline days={dailyForecast.data.daily} timezone={dailyForecast.data.timezone} latitude={location.latitude} longitude={location.longitude}/></section>:null)}
    {mode==='monthly'&&(data?<section><div className="timeline-heading"><div><h2>1ヶ月間 月齢カレンダー</h2><p>月相と月の出入りを日ごとに確認</p></div><span>今日から31日間</span></div><MonthlyMoonCalendar timezone={data.timezone} latitude={location.latitude} longitude={location.longitude}/></section>:hourlyForecast.loading?<Loading/>:<ErrorState message={hourlyForecast.error||'地点のタイムゾーンを取得できませんでした'} retry={hourlyForecast.reload}/>)}
  </main>
}
