import municipalitiesJson from '../data/japaneseMunicipalities.json'
import type { GeocodingResult } from '../types'

interface ApiResult { id:number;name:string;latitude:number;longitude:number;country?:string;country_code?:string;admin1?:string;admin2?:string;feature_code?:string }
interface GeocodingResponse { results?:ApiResult[] }
interface Municipality { prefecture:string;municipality:string;code:string;parentMunicipality?:string;ward?:string;latitude:number;longitude:number }
interface CacheEntry { expires:number;results:GeocodingResult[] }

const municipalities=municipalitiesJson as Municipality[]
const CACHE_DURATION=5*60*1000
const cache=new Map<string,CacheEntry>()
const municipalitySuffixPattern=/[市区町村]$/u
const normalize=(value:string)=>value.trim().toLocaleLowerCase('ja-JP').replace(/[\s　]+/gu,'')
const withoutMunicipalitySuffix=(value:string)=>value.replace(municipalitySuffixPattern,'')

async function requestPlaces(name:string,count=50,signal?:AbortSignal):Promise<GeocodingResult[]> {
  const params=new URLSearchParams({name,count:String(count),language:'ja',format:'json'})
  const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`,{signal})
  if(!response.ok)throw new Error(`地名検索APIエラー（${response.status}）`)
  const data=await response.json() as GeocodingResponse
  return(data.results??[]).map(result=>({id:result.id,name:result.name,latitude:result.latitude,longitude:result.longitude,country:result.country,countryCode:result.country_code,admin1:result.admin1,admin2:result.admin2,featureCode:result.feature_code}))
}

function municipalityNames(item:Municipality){
  const names=[item.municipality,withoutMunicipalitySuffix(item.municipality)]
  if(item.ward)names.push(item.ward,withoutMunicipalitySuffix(item.ward))
  return names.map(normalize)
}

function municipalityRank(item:Municipality,query:string){
  const names=municipalityNames(item)
  if(names[0]===query)return 0
  if(names.some(name=>name===query))return 1
  if(names.some(name=>name.startsWith(query)))return 2
  return 3
}

export function searchJapaneseMunicipalities(query:string):GeocodingResult[] {
  const normalizedQuery=normalize(query)
  if(!normalizedQuery)return[]
  return municipalities
    .filter(item=>municipalityNames(item).some(name=>name.includes(normalizedQuery)))
    .sort((a,b)=>municipalityRank(a,normalizedQuery)-municipalityRank(b,normalizedQuery)||a.municipality.localeCompare(b.municipality,'ja'))
    .slice(0,30)
    .map(item=>({id:-Number(item.code),name:item.municipality,latitude:item.latitude,longitude:item.longitude,country:'日本',countryCode:'JP',admin1:item.prefecture,admin2:item.parentMunicipality,featureCode:'JP_MUNICIPALITY',municipalityCode:item.code}))
}

export async function resolvePlace(result:GeocodingResult,_signal?:AbortSignal):Promise<GeocodingResult> {
  if(result.latitude!==undefined&&result.longitude!==undefined)return result
  if(!result.municipalityCode)throw new Error('この地点の座標を取得できませんでした。')
  const municipality=municipalities.find(item=>item.code===result.municipalityCode)
  if(!municipality)throw new Error(`${result.name}の代表座標を取得できませんでした。`)
  return{...result,latitude:municipality.latitude,longitude:municipality.longitude}
}

export async function searchPlaces(query:string,signal?:AbortSignal):Promise<GeocodingResult[]> {
  const original=query.trim(),key=normalize(original),cached=cache.get(key)
  if(cached&&cached.expires>Date.now())return cached.results
  const local=searchJapaneseMunicipalities(original)
  let remote:GeocodingResult[]=[]
  try{remote=await requestPlaces(original,50,signal)}
  catch(error){
    if(error instanceof DOMException&&error.name==='AbortError')throw error
    if(!local.length)throw error
  }
  const seen=new Set<string>()
  const results=[...local,...remote].filter(result=>{
    if(result.countryCode==='JP'&&result.id>0&&local.some(localResult=>normalize(localResult.name)===normalize(result.name)&&localResult.admin1===result.admin1))return false
    const resultKey=result.municipalityCode?`municipality:${result.municipalityCode}`:result.id?`id:${result.id}`:`geo:${result.latitude},${result.longitude}`
    if(seen.has(resultKey))return false
    seen.add(resultKey);return true
  })
  cache.set(key,{expires:Date.now()+CACHE_DURATION,results})
  return results
}
