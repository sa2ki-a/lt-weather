import type { DailyWeather, HourlyWeather, WeatherData, WeatherModelId } from '../types'
import { weatherModel } from '../config/weatherModels'
type HourlyApi={time:number[];temperature_2m:number[];relative_humidity_2m:number[];precipitation:number[];precipitation_probability?:NullableValues;wind_speed_10m:number[];wind_direction_10m:number[];cloud_cover:number[];weather_code:number[]}
type NullableValues=Array<number|null>
type DailyApi={time?:number[];weather_code?:NullableValues;temperature_2m_max?:NullableValues;temperature_2m_min?:NullableValues;precipitation_sum?:NullableValues;precipitation_probability_max?:NullableValues;wind_speed_10m_max?:NullableValues}
type ApiResponse={timezone:string;timezone_abbreviation:string;utc_offset_seconds:number;hourly:HourlyApi;daily?:DailyApi}

function localKey(date:Date,timeZone:string){const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const get=(type:string)=>parts.find(part=>part.type===type)?.value;return`${get('year')}-${get('month')}-${get('day')}`}
const average=(values:number[])=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null
const valueAt=(values:NullableValues|undefined,index:number)=>{const value=values?.[index];return typeof value==='number'&&Number.isFinite(value)?value:null}

export async function fetchWeather(latitude:number,longitude:number,modelId:WeatherModelId='auto',signal?:AbortSignal):Promise<WeatherData>{
  const hourlyFields='temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code'
  const dailyFields='weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max'
  const model=weatherModel(modelId)
  const params=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),hourly:hourlyFields,daily:dailyFields,wind_speed_unit:'ms',timeformat:'unixtime',timezone:'auto',forecast_days:String(model.forecastDays),past_days:'1'})
  if(model.apiModel)params.set('models',model.apiModel)
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal});if(!response.ok){let reason='';try{const body=await response.json() as{reason?:string};reason=body.reason??''}catch{reason=''}throw new Error(reason?`このモデルでは予報を取得できません: ${reason}`:`このモデルではこの地点の予報を取得できません（${response.status}）`)}
  const data=await response.json() as ApiResponse
  const hourly:HourlyWeather[]=data.hourly.time.map((time,index)=>({time:new Date(time*1000),temperature:data.hourly.temperature_2m[index],humidity:data.hourly.relative_humidity_2m[index],precipitation:data.hourly.precipitation[index],precipitationProbability:modelId==='jma_msm'?null:valueAt(data.hourly.precipitation_probability,index),windSpeed:data.hourly.wind_speed_10m[index],windDirection:data.hourly.wind_direction_10m[index],cloudCover:data.hourly.cloud_cover[index],weatherCode:data.hourly.weather_code[index]}))
  const daily:DailyWeather[]=(data.daily?.time??[]).filter(time=>Number.isFinite(time)).map((time,index)=>{const date=new Date(time*1000),key=localKey(date,data.timezone),dayHours=hourly.filter(hour=>localKey(hour.time,data.timezone)===key);return{date,weatherCode:valueAt(data.daily?.weather_code,index),temperatureMax:valueAt(data.daily?.temperature_2m_max,index),temperatureMin:valueAt(data.daily?.temperature_2m_min,index),precipitationSum:valueAt(data.daily?.precipitation_sum,index),precipitationProbabilityMax:valueAt(data.daily?.precipitation_probability_max,index),windSpeedMax:valueAt(data.daily?.wind_speed_10m_max,index),humidityAverage:average(dayHours.map(hour=>hour.humidity).filter(Number.isFinite)),cloudCoverAverage:average(dayHours.map(hour=>hour.cloudCover).filter(Number.isFinite))}})
  const todayKey=localKey(new Date(),data.timezone),availableForecastDays=Math.min(10,daily.filter(day=>localKey(day.date,data.timezone)>=todayKey).length)
  const precipitationProbabilitySource=hourly.some(hour=>hour.precipitationProbability!==null)?'model':'unavailable'
  return{timezone:data.timezone,timezoneAbbreviation:data.timezone_abbreviation,utcOffsetSeconds:data.utc_offset_seconds,hourly,daily,modelId,availableForecastDays,precipitationProbabilitySource}
}
export function weatherInfo(code:number){if(code===0)return['快晴','☀️'];if(code<=2)return['晴れ','🌤️'];if(code===3)return['曇り','☁️'];if(code<=48)return['霧','🌫️'];if(code<=57)return['霧雨','🌧️'];if(code<=67)return['雨','🌧️'];if(code<=77)return['雪','🌨️'];if(code<=82)return['にわか雨','🌦️'];if(code<=86)return['にわか雪','🌨️'];if(code<=99)return['雷雨','⛈️'];return['不明','–']}
