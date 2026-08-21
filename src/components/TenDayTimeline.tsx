import type { DailyWeather } from '../types'
import { WeatherIcon } from './WeatherIcon'
import { MoonPhaseIcon } from './MoonPhaseIcon'
import { addDays, dateKey, formatZoned, shortDateLabel } from '../utils/zonedTime'
import { getDailyMoonInfo } from '../utils/moon'

function Row({label,children,className=''}:{label:string;children:React.ReactNode;className?:string}){return <div className={`daily-row ${className}`}><div className="daily-label">{label}</div><div className="daily-cells">{children}</div></div>}
const cells=(values:React.ReactNode[])=>values.map((value,index)=><div className="daily-cell" key={index}>{value}</div>)
const whole=(value:number|null)=>value===null?'—':String(Math.round(value))
const decimal=(value:number|null)=>value===null?'—':value.toFixed(1)

export function TenDayTimeline({days,timezone,latitude,longitude}:{days:DailyWeather[];timezone:string;latitude:number;longitude:number}){
  const today=dateKey(new Date(),timezone),tomorrow=addDays(today,1)
  const visible=days.filter(day=>dateKey(day.date,timezone)>=today).slice(0,10)
  const moons=visible.map(day=>getDailyMoonInfo(dateKey(day.date,timezone),timezone,latitude,longitude))
  const weekday=(date:Date)=>new Intl.DateTimeFormat('ja-JP',{timeZone:timezone,weekday:'short'}).format(date)
  if(!visible.length)return <div className="state">10日間予報を表示できません。</div>
  return <div className="daily-wrap"><div className="daily-timeline" style={{'--days':visible.length} as React.CSSProperties}>
    <Row label="日付" className="daily-date-row">{cells(visible.map(day=>{const key=dateKey(day.date,timezone);return <><b className={key===today?'today-badge':''}>{key===today?'今日':key===tomorrow?'明日':shortDateLabel(day.date,timezone)}</b><small>{key===today||key===tomorrow?shortDateLabel(day.date,timezone):''} {weekday(day.date)}</small></>}))}</Row>
    <Row label="天気">{cells(visible.map(day=><WeatherIcon code={day.weatherCode??-1}/>))}</Row>
    <Row label="最高">{cells(visible.map(day=><><strong className="temp-high">{whole(day.temperatureMax)}</strong><small>℃</small></>))}</Row>
    <Row label="最低">{cells(visible.map(day=><><strong className="temp-low">{whole(day.temperatureMin)}</strong><small>℃</small></>))}</Row>
    <Row label="降水">{cells(visible.map(day=><><strong>{whole(day.precipitationProbabilityMax)}{day.precipitationProbabilityMax===null?'':'%'}</strong><small>{decimal(day.precipitationSum)}{day.precipitationSum===null?'':'mm'}</small></>))}</Row>
    <Row label="最大風速">{cells(visible.map(day=><><strong>{decimal(day.windSpeedMax)}</strong><small>{day.windSpeedMax===null?'':'m/s'}</small></>))}</Row>
    <Row label="平均湿度">{cells(visible.map(day=><><strong>{whole(day.humidityAverage)}</strong><small>{day.humidityAverage===null?'':'%'}</small></>))}</Row>
    <Row label="平均雲量">{cells(visible.map(day=><><strong>{whole(day.cloudCoverAverage)}</strong><small>{day.cloudCoverAverage===null?'':'%'}</small></>))}</Row>
    <Row label="月" className="daily-moon-row">{cells(moons.map(moon=><><MoonPhaseIcon phase={moon.phase} latitude={latitude} size={38}/><strong>月齢 {moon.age.toFixed(1)}</strong><span>↗ {moon.moonrise?formatZoned(moon.moonrise,timezone):'月の出なし'}</span><span>↘ {moon.moonset?formatZoned(moon.moonset,timezone):'月の入りなし'}</span><small>照度 {Math.round(moon.illumination)}%</small></>))}</Row>
  </div></div>
}
