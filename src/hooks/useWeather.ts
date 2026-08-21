import { useEffect, useState } from 'react'
import { fetchWeather } from '../services/weather'
import type { WeatherData } from '../types'
import type { WeatherModelId } from '../types'
export function useWeather(latitude:number,longitude:number,model:WeatherModelId='auto',enabled=true){const[data,setData]=useState<WeatherData>();const[error,setError]=useState('');const[loading,setLoading]=useState(enabled);const[retry,setRetry]=useState(0);useEffect(()=>{if(!enabled){setLoading(false);return}const c=new AbortController();setLoading(true);setError('');fetchWeather(latitude,longitude,model,c.signal).then(setData).catch(e=>{if(e.name!=='AbortError')setError(e instanceof Error?e.message:'予報を取得できませんでした')}).finally(()=>{if(!c.signal.aborted)setLoading(false)});return()=>c.abort()},[latitude,longitude,model,enabled,retry]);return{data,error,loading,reload:()=>setRetry(v=>v+1)}}
