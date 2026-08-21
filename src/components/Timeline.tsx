import type { AstronomyData, HourlyWeather } from '../types'
import { WeatherIcon } from './WeatherIcon'
import { formatZoned, hourLabel, shortDateLabel, zonedParts } from '../utils/zonedTime'
import { MoonPhaseIcon } from './MoonPhaseIcon'

const CELL = 74

function Row({ label, hint, children, className = '' }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return <div className={`timeline-row ${className}`}><div className="row-label"><span>{label}</span>{hint && <small>{hint}</small>}</div><div className="row-cells">{children}</div></div>
}
function cells(values: React.ReactNode[], classes?: (index: number) => string) { return values.map((value, index) => <div className={`timeline-cell ${classes?.(index) ?? ''}`} key={index}>{value}</div>) }
function humidityClass(value: number) { return value >= 80 ? 'condition-high' : value >= 60 ? 'condition-good' : 'condition-low' }
function windClass(value: number) { return value > 5 ? 'condition-alert' : value > 2 ? 'condition-caution' : 'condition-good' }

export function Timeline({ hours, astronomy, timezone, latitude }: { hours: HourlyWeather[]; astronomy: AstronomyData; timezone: string; latitude: number }) {
  if (!hours.length) return <div className="state">この夜の予報データはありません。</div>
  const first = hours[0].time.getTime(), last = hours[hours.length - 1].time.getTime() + 3600000
  const laneEnds = [-100, -100, -100]
  const visible = astronomy.events.filter(event=>event.time.getTime()>=first&&event.time.getTime()<last).map(event=>({name:event.name,date:event.time,color:event.color,position:((event.time.getTime()-first)/(last-first))*100})).sort((a, b) => a.position - b.position).map(event => {
    const freeLane = laneEnds.findIndex(end => event.position - end >= 9)
    const lane = freeLane >= 0 ? freeLane : laneEnds.indexOf(Math.min(...laneEnds))
    laneEnds[lane] = event.position
    return { ...event, lane }
  })
  return <div className="timeline-wrap"><div className="timeline" style={{ '--columns': hours.length, '--cell': `${CELL}px` } as React.CSSProperties}>
    <div className="astro-event-row"><div className="row-label"><span>天文イベント</span></div><div className="astro-event-track">{visible.map(event => <div className={`astro-event ${event.position > 92 ? 'align-end' : ''}`} key={event.name} style={{ left: `${event.position}%`, color: event.color, top: `${5 + event.lane * 20}px` }}><span>{event.name}<b>{formatZoned(event.date, timezone)}</b></span><i style={{ top: `${57 - event.lane * 20}px` }} /></div>)}</div></div>
    <Row label="時刻" className="time-row">{cells(hours.map((hour,index) => <><strong>{hourLabel(hour.time, timezone)}</strong>{(index===0||zonedParts(hour.time,timezone).hour===0)&&<small className="date-change">{shortDateLabel(hour.time,timezone)}</small>}</>))}</Row>
    <Row label="天気">{cells(hours.map(hour => <WeatherIcon code={hour.weatherCode} />))}</Row>
    <Row label="気温">{cells(hours.map(hour => <><strong>{Math.round(hour.temperature)}</strong><small>℃</small></>))}</Row>
    <Row label="湿度" className="condition-row">{cells(hours.map(hour => <><strong>{Math.round(hour.humidity)}</strong><small>%</small></>), index => humidityClass(hours[index].humidity))}</Row>
    <Row label="降水量">{cells(hours.map(hour => <><strong>{hour.precipitation.toFixed(1)}</strong><small>mm</small></>))}</Row>
    <Row label="降水確率">{cells(hours.map(hour => <><strong>{Math.round(hour.precipitationProbability)}</strong><small>%</small></>))}</Row>
    <Row label="風速" className="condition-row">{cells(hours.map(hour => <><strong>{hour.windSpeed.toFixed(1)}</strong><small>m/s</small></>), index => windClass(hours[index].windSpeed))}</Row>
    <Row label="雲量">{cells(hours.map(hour => <><strong>{Math.round(hour.cloudCover)}</strong><small>%</small></>))}</Row>
    <Row label="月" hint="地平線" className="moon-band-row">{cells(astronomy.moonHours.map(moon => moon.isAbove ? <><MoonPhaseIcon phase={astronomy.phase} latitude={latitude} size={20}/><strong>地平線上</strong></> : <><span className="moon-dot">○</span><strong>地平線下</strong></>), index => astronomy.moonHours[index].isAbove ? 'moon-above' : 'moon-below')}</Row>
  </div></div>
}
