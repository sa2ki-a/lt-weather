export interface Location { id: string; name: string; latitude: number; longitude: number; countryCode?:string }
export interface GeocodingResult { id: number; name: string; latitude?: number; longitude?: number; country?: string; countryCode?: string; admin1?: string; admin2?: string; featureCode?: string; municipalityCode?:string }
export interface HourlyWeather { time: Date; temperature: number; humidity: number; precipitation: number; precipitationProbability: number; windSpeed: number; windDirection: number; cloudCover: number; weatherCode: number }
export interface DailyWeather { date:Date; weatherCode:number|null; temperatureMax:number|null; temperatureMin:number|null; precipitationSum:number|null; precipitationProbabilityMax:number|null; windSpeedMax:number|null; humidityAverage:number|null; cloudCoverAverage:number|null }
export type WeatherModelId='auto'|'jma_msm'|'ecmwf_ifs'
export interface WeatherData { timezone: string; timezoneAbbreviation: string; utcOffsetSeconds: number; hourly: HourlyWeather[]; daily:DailyWeather[]; modelId:WeatherModelId; availableForecastDays:number }
export interface MoonHour { time: Date; altitude: number; isAbove: boolean }
export interface AstronomyEvent { name:string; time:Date; color:string }
export interface AstronomyData { sunset?: Date; civilTwilightEnd?: Date; nauticalTwilightEnd?: Date; astronomicalTwilightEnd?: Date; moonrise?: Date; moonset?: Date; illumination: number; phase: number; moonHours: MoonHour[]; events:AstronomyEvent[] }
