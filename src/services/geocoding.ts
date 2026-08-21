import type { GeocodingResult } from '../types'

interface ApiResult { id:number;name:string;latitude:number;longitude:number;country?:string;country_code?:string;admin1?:string;admin2?:string;feature_code?:string }
interface GeocodingResponse { results?:ApiResult[] }
interface CacheEntry { expires:number;results:GeocodingResult[] }

const CACHE_DURATION=5*60*1000
const cache=new Map<string,CacheEntry>()
const municipalitySuffixes=['市','町','村','区'] as const
const normalize=(value:string)=>value.trim().toLocaleLowerCase('ja-JP').replace(/[\s　]+/g,'')

async function requestPlaces(name:string,signal?:AbortSignal):Promise<GeocodingResult[]> {
  const params=new URLSearchParams({name,count:'50',language:'ja',format:'json'})
  const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`,{signal})
  if(!response.ok)throw new Error(`地名検索APIエラー（${response.status}）`)
  const data=await response.json() as GeocodingResponse
  return(data.results??[]).map(result=>({id:result.id,name:result.name,latitude:result.latitude,longitude:result.longitude,country:result.country,countryCode:result.country_code,admin1:result.admin1,admin2:result.admin2,featureCode:result.feature_code}))
}

function isMunicipality(result:GeocodingResult){return/[市町村区]$/.test(result.name)||result.featureCode?.startsWith('PPLA')||result.featureCode==='PPL'}
function rank(result:GeocodingResult,query:string){const name=normalize(result.name),base=normalize(query);if(name===base)return 0;if(municipalitySuffixes.some(suffix=>name===`${base}${suffix}`))return 1;if(result.countryCode==='JP'&&isMunicipality(result))return 2;if(name.startsWith(base))return 3;if(result.countryCode==='JP')return 4;return 5}

export async function searchPlaces(query:string,signal?:AbortSignal):Promise<GeocodingResult[]> {
  const original=query.trim(),key=normalize(original),cached=cache.get(key)
  if(cached&&cached.expires>Date.now())return cached.results
  const primary=await requestPlaces(original,signal)
  const japanese=/[\u3040-\u30ff\u3400-\u9fff]/.test(original),hasSuffix=/[市区町村都道府県]$/.test(original)
  const hasStrongMatch=primary.some(result=>{const name=normalize(result.name);return name===key||municipalitySuffixes.some(suffix=>name===`${key}${suffix}`)})
  const supplemental=japanese&&!hasSuffix&&!hasStrongMatch?await Promise.all(municipalitySuffixes.map(suffix=>requestPlaces(`${original}${suffix}`,signal))):[]
  const unique=new Map<string,GeocodingResult>()
  for(const result of [...primary,...supplemental.flat()]){const resultKey=result.id?`id:${result.id}`:`geo:${result.latitude.toFixed(5)},${result.longitude.toFixed(5)}`;if(!unique.has(resultKey))unique.set(resultKey,result)}
  const ranked=[...unique.values()].sort((a,b)=>rank(a,original)-rank(b,original)||a.name.localeCompare(b.name,'ja'))
  cache.set(key,{expires:Date.now()+CACHE_DURATION,results:ranked})
  return ranked
}
