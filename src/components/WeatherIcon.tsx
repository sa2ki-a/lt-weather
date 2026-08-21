import { weatherInfo } from '../services/weather'
export function WeatherIcon({code,compact=false}:{code:number;compact?:boolean}){const[label,icon]=weatherInfo(code);return <span className="weather-icon" title={label}><span>{icon}</span>{!compact&&<small>{label}</small>}</span>}
