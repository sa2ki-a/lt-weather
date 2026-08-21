import { useEffect, useState } from 'react'
import { getWeather, type ForecastKind } from '../services/weatherCache'
import type { WeatherData, WeatherModelId } from '../types'

export function useWeather(latitude:number,longitude:number,model:WeatherModelId='auto',enabled=true,kind:ForecastKind='hourly'){
  const[data,setData]=useState<WeatherData>(),[error,setError]=useState(''),[loading,setLoading]=useState(enabled)
  const[stale,setStale]=useState(false),[fetchedAt,setFetchedAt]=useState<number>(),[retry,setRetry]=useState(0)
  useEffect(()=>{if(!enabled){setLoading(false);return}let active=true;setLoading(true);setError('')
    getWeather(latitude,longitude,kind,model,retry>0).then(result=>{if(active){setData(result.data);setStale(result.stale);setFetchedAt(result.fetchedAt)}}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'予報を取得できませんでした')}).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[latitude,longitude,model,enabled,kind,retry])
  return{data,error,loading,stale,fetchedAt,reload:()=>setRetry(value=>value+1)}
}
