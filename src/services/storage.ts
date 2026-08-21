import type { Location } from '../types'
import type { WeatherModelId } from '../types'
const KEY = 'insect-weather.locations.v1'
export function loadLocations(): Location[] { try { const value = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(value) ? value : [] } catch { return [] } }
export function saveLocations(locations: Location[]) { localStorage.setItem(KEY, JSON.stringify(locations)) }
const MODEL_KEY='insect-weather.weather-model.v1'
export function loadWeatherModelPreference():WeatherModelId|null{try{const value=localStorage.getItem(MODEL_KEY);return value==='auto'||value==='jma_msm'||value==='ecmwf_ifs'?value:null}catch{return null}}
export function saveWeatherModelPreference(model:WeatherModelId){localStorage.setItem(MODEL_KEY,model)}
