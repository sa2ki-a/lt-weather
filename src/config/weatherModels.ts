import type { Location, WeatherModelId } from '../types'

export interface WeatherModelConfig { id:WeatherModelId;label:string;shortLabel:string;apiModel?:string;coverage:string;forecastDays:number }
export const weatherModels:WeatherModelConfig[]=[
  {id:'auto',label:'自動（Best Match）',shortLabel:'自動',coverage:'世界',forecastDays:10},
  {id:'jma_msm',label:'JMA MSM',shortLabel:'JMA MSM',apiModel:'jma_msm',coverage:'日本・周辺地域',forecastDays:4},
  {id:'ecmwf_ifs',label:'ECMWF IFS',shortLabel:'ECMWF IFS',apiModel:'ecmwf_ifs',coverage:'世界',forecastDays:10},
]
export const weatherModel=(id:WeatherModelId)=>weatherModels.find(model=>model.id===id)??weatherModels[0]
export function isJapanLocation(location:Location){if(location.countryCode)return location.countryCode==='JP';return location.latitude>=20.4&&location.latitude<=45.7&&location.longitude>=122.9&&location.longitude<=154}
