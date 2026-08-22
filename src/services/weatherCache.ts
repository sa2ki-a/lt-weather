import type { WeatherData, WeatherModelId } from '../types'
import { fetchWeather } from './weather'

export type ForecastKind = 'hourly' | 'daily'
export type CachedWeatherResult = { data: WeatherData; fetchedAt: number; stale: boolean }
const STORAGE_KEY = 'lt-weather.forecast-cache.v1'
const COORDINATE_PRECISION = 4
const MAX_ENTRIES = 60
const MAX_ENTRY_AGE = 14 * 24 * 60 * 60 * 1000
export const WEATHER_CACHE_TTL = { hourly: 60 * 60 * 1000, daily: 3 * 60 * 60 * 1000 } as const
type StoredWeatherData = Omit<WeatherData, 'hourly' | 'daily'> & { hourly: Array<Omit<WeatherData['hourly'][number], 'time'> & { time: string }>; daily: Array<Omit<WeatherData['daily'][number], 'date'> & { date: string }> }
type CacheEntry = { key: string; savedAt: number; data: StoredWeatherData }
const inFlight = new Map<string, Promise<{data:WeatherData;fetchedAt:number}>>()
const coordinate = (value:number) => value.toFixed(COORDINATE_PRECISION)
function cacheKey(latitude:number,longitude:number,kind:ForecastKind,model:WeatherModelId){return`${coordinate(latitude)},${coordinate(longitude)}:${kind}:${kind==='daily'?'10day:auto':`24hour:${model}`}`}
const requestKey=(latitude:number,longitude:number,model:WeatherModelId)=>`${coordinate(latitude)},${coordinate(longitude)}:${model}`
const isNumber=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)
function isStoredData(value:unknown):value is StoredWeatherData{if(!value||typeof value!=='object')return false;const data=value as Partial<StoredWeatherData>;return typeof data.timezone==='string'&&typeof data.timezoneAbbreviation==='string'&&isNumber(data.utcOffsetSeconds)&&Array.isArray(data.hourly)&&Array.isArray(data.daily)&&data.hourly.every(hour=>!!hour&&typeof hour==='object'&&typeof hour.time==='string'&&!Number.isNaN(Date.parse(hour.time)))&&data.daily.every(day=>!!day&&typeof day==='object'&&typeof day.date==='string'&&!Number.isNaN(Date.parse(day.date)))}
const serialize=(data:WeatherData):StoredWeatherData=>({...data,hourly:data.hourly.map(hour=>({...hour,time:hour.time.toISOString()})),daily:data.daily.map(day=>({...day,date:day.date.toISOString()}))})
const deserialize=(data:StoredWeatherData):WeatherData=>({...data,precipitationProbabilitySource:data.precipitationProbabilitySource??'unavailable',hourly:data.hourly.map(hour=>({...hour,precipitationProbability:isNumber(hour.precipitationProbability)?hour.precipitationProbability:null,time:new Date(hour.time)})),daily:data.daily.map(day=>({...day,date:new Date(day.date)}))})
function loadEntries():CacheEntry[]{if(typeof localStorage==='undefined')return[];try{const parsed:unknown=JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]');if(!Array.isArray(parsed))throw new Error('invalid cache');const entries=parsed.filter((entry):entry is CacheEntry=>!!entry&&typeof entry==='object'&&typeof entry.key==='string'&&isNumber(entry.savedAt)&&isStoredData(entry.data));if(entries.length!==parsed.length)saveEntries(entries);return entries}catch{try{localStorage.removeItem(STORAGE_KEY)}catch{/* unavailable */}return[]}}
function saveEntries(entries:CacheEntry[]){if(typeof localStorage==='undefined')return;const cutoff=Date.now()-MAX_ENTRY_AGE,cleaned=entries.filter(entry=>entry.savedAt>=cutoff).sort((a,b)=>b.savedAt-a.savedAt).slice(0,MAX_ENTRIES);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cleaned))}catch{/* persistence is optional */}}
const findEntry=(key:string)=>loadEntries().find(entry=>entry.key===key)
const isFresh=(entry:CacheEntry|undefined,kind:ForecastKind)=>!!entry&&Date.now()-entry.savedAt<=WEATHER_CACHE_TTL[kind]
function store(latitude:number,longitude:number,kind:ForecastKind,model:WeatherModelId,data:WeatherData,savedAt:number){const key=cacheKey(latitude,longitude,kind,model),entries=loadEntries().filter(entry=>entry.key!==key);entries.push({key,savedAt,data:serialize(data)});saveEntries(entries)}
async function getModelWeather(latitude:number,longitude:number,kind:ForecastKind,model:WeatherModelId,force:boolean):Promise<CachedWeatherResult>{const key=cacheKey(latitude,longitude,kind,model),cached=findEntry(key);if(!force&&cached&&isFresh(cached,kind))return{data:deserialize(cached.data),fetchedAt:cached.savedAt,stale:false};const pendingKey=requestKey(latitude,longitude,model);let pending=inFlight.get(pendingKey);if(!pending){pending=fetchWeather(latitude,longitude,model).then(data=>{const fetchedAt=Date.now();store(latitude,longitude,'hourly',model,data,fetchedAt);if(model==='auto')store(latitude,longitude,'daily','auto',data,fetchedAt);return{data,fetchedAt}}).finally(()=>inFlight.delete(pendingKey));inFlight.set(pendingKey,pending)}try{const result=await pending;return{...result,stale:false}}catch(error){if(cached)return{data:deserialize(cached.data),fetchedAt:cached.savedAt,stale:true};throw error}}

function supplementMsmProbability(msm:WeatherData,bestMatch:WeatherData):WeatherData{
  const byTime=new Map(bestMatch.hourly.filter(hour=>hour.precipitationProbability!==null).map(hour=>[hour.time.getTime(),hour.precipitationProbability]))
  let supplemented=false
  const hourly=msm.hourly.map(hour=>{const probability=byTime.get(hour.time.getTime());if(probability===undefined)return hour;supplemented=true;return{...hour,precipitationProbability:probability}})
  return{...msm,hourly,precipitationProbabilitySource:supplemented?'best_match':msm.precipitationProbabilitySource}
}

export async function getWeather(latitude:number,longitude:number,kind:ForecastKind,model:WeatherModelId='auto',force=false):Promise<CachedWeatherResult>{
  const effectiveModel=kind==='daily'?'auto':model
  const result=await getModelWeather(latitude,longitude,kind,effectiveModel,force)
  if(effectiveModel!=='jma_msm'||result.data.precipitationProbabilitySource==='best_match')return result
  try{
    const bestMatch=await getModelWeather(latitude,longitude,'hourly','auto',force)
    const data=supplementMsmProbability(result.data,bestMatch.data)
    if(data.precipitationProbabilitySource==='best_match')store(latitude,longitude,'hourly','jma_msm',data,result.fetchedAt)
    return{...result,data,stale:result.stale||bestMatch.stale}
  }catch{return result}
}
export async function prefetchBestMatchWeather(latitude:number,longitude:number):Promise<void>{
  const hourly=findEntry(cacheKey(latitude,longitude,'hourly','auto'))
  const daily=findEntry(cacheKey(latitude,longitude,'daily','auto'))
  if(isFresh(hourly,'hourly')&&isFresh(daily,'daily'))return
  const missingKind:ForecastKind=isFresh(hourly,'hourly')?'daily':'hourly'
  await getWeather(latitude,longitude,missingKind,'auto')
}
export function removeWeatherCacheForLocation(latitude:number,longitude:number){const prefix=`${coordinate(latitude)},${coordinate(longitude)}:`;saveEntries(loadEntries().filter(entry=>!entry.key.startsWith(prefix)))}
export function cleanupWeatherCache(){saveEntries(loadEntries())}
