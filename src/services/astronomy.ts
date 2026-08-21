import SunCalc from 'suncalc'
import type { AstronomyData, AstronomyEvent } from '../types'

const eventDefinitions = [
  ['天文薄明開始','nightEnd','#60a5fa'],['航海薄明開始','nauticalDawn','#818cf8'],['市民薄明開始','dawn','#c084fc'],['日の出','sunrise','#f6ad55'],
  ['日没','sunset','#f6ad55'],['市民薄明終了','dusk','#c084fc'],['航海薄明終了','nauticalDusk','#818cf8'],['天文薄明終了','night','#60a5fa'],
] as const

function moonCrossings(latitude:number,longitude:number,start:number,end:number):AstronomyEvent[]{
  const events:AstronomyEvent[]=[];const step=15*60000
  let previousTime=start,previousAltitude=SunCalc.getMoonPosition(new Date(start),latitude,longitude).altitude
  for(let time=start+step;time<=end;time+=step){const altitude=SunCalc.getMoonPosition(new Date(time),latitude,longitude).altitude;if((previousAltitude<=0&&altitude>0)||(previousAltitude>0&&altitude<=0)){const ratio=Math.abs(previousAltitude)/(Math.abs(previousAltitude)+Math.abs(altitude));events.push({name:altitude>0?'月の出':'月の入り',time:new Date(previousTime+(time-previousTime)*ratio),color:altitude>0?'#f7d477':'#cbd5e1'})}previousTime=time;previousAltitude=altitude}
  return events
}

export function calculateAstronomy(latitude:number,longitude:number,hours:Date[],reference:Date):AstronomyData{
  const start=hours[0]?.getTime()??reference.getTime(),end=(hours.at(-1)?.getTime()??start)+3600000
  const events:AstronomyEvent[]=[]
  for(let probe=start-12*3600000;probe<=end+12*3600000;probe+=12*3600000){const times=SunCalc.getTimes(new Date(probe),latitude,longitude) as unknown as Record<string,Date>;for(const[name,key,color]of eventDefinitions){const time=times[key];if(time&&!Number.isNaN(time.getTime())&&time.getTime()>=start&&time.getTime()<end&&!events.some(event=>event.name===name&&Math.abs(event.time.getTime()-time.getTime())<60000))events.push({name,time,color})}}
  events.push(...moonCrossings(latitude,longitude,start,end));events.sort((a,b)=>a.time.getTime()-b.time.getTime())
  const find=(name:string)=>events.find(event=>event.name===name)?.time
  const illumination=SunCalc.getMoonIllumination(reference)
  return {sunset:find('日没'),civilTwilightEnd:find('市民薄明終了'),nauticalTwilightEnd:find('航海薄明終了'),astronomicalTwilightEnd:find('天文薄明終了'),moonrise:find('月の出'),moonset:find('月の入り'),illumination:illumination.fraction*100,phase:illumination.phase,events,moonHours:hours.map(time=>{const altitude=SunCalc.getMoonPosition(time,latitude,longitude).altitude*180/Math.PI;return{time,altitude,isAbove:altitude>0}})}
}
export function moonPhaseName(phase:number){if(phase<.03||phase>.97)return'新月';if(phase<.22)return'三日月';if(phase<.28)return'上弦';if(phase<.47)return'十三夜';if(phase<.53)return'満月';if(phase<.72)return'寝待月';if(phase<.78)return'下弦';return'有明月'}
