import SunCalc from 'suncalc'
import { moonPhaseName } from '../services/astronomy'
import { addDays, zonedDateTime } from './zonedTime'

export const SYNODIC_MONTH_DAYS = 29.530588
const DAY_MS = 86400000

export interface CurrentMoonInfo { phase:number; age:number; illumination:number; name:string; nextNewMoon:Date; nextFullMoon:Date }

function phaseDistance(value:number,target:number){const difference=Math.abs(value-target);return Math.min(difference,1-difference)}

export function findNextMoonPhase(from:Date,target:0|0.5):Date {
  const current=SunCalc.getMoonIllumination(from).phase
  let cycleDistance=(target-current+1)%1
  if(cycleDistance<0.000001)cycleDistance=1
  const estimate=from.getTime()+cycleDistance*SYNODIC_MONTH_DAYS*DAY_MS
  let best=estimate,bestDistance=Infinity
  for(let offset=-48;offset<=48;offset++){const time=estimate+offset*3600000;const distance=phaseDistance(SunCalc.getMoonIllumination(new Date(time)).phase,target);if(distance<bestDistance){bestDistance=distance;best=time}}
  let left=best-3600000,right=best+3600000
  for(let iteration=0;iteration<28;iteration++){const first=left+(right-left)/3,second=right-(right-left)/3;const firstDistance=phaseDistance(SunCalc.getMoonIllumination(new Date(first)).phase,target),secondDistance=phaseDistance(SunCalc.getMoonIllumination(new Date(second)).phase,target);if(firstDistance<secondDistance)right=second;else left=first}
  return new Date((left+right)/2)
}

export function getCurrentMoonInfo(date=new Date()):CurrentMoonInfo {
  const moon=SunCalc.getMoonIllumination(date)
  return {phase:moon.phase,age:moon.phase*SYNODIC_MONTH_DAYS,illumination:moon.fraction*100,name:moonPhaseName(moon.phase),nextNewMoon:findNextMoonPhase(date,0),nextFullMoon:findNextMoonPhase(date,0.5)}
}

export function daysUntil(date:Date,from=new Date()){return Math.max(0,Math.ceil((date.getTime()-from.getTime())/DAY_MS))}

export interface DailyMoonInfo { phase:number;age:number;illumination:number;name:string;moonrise?:Date;moonset?:Date }
export function getDailyMoonInfo(key:string,timeZone:string,latitude:number,longitude:number):DailyMoonInfo {
  const representative=zonedDateTime(key,21,timeZone),start=zonedDateTime(key,0,timeZone),end=zonedDateTime(addDays(key,1),0,timeZone)
  const illumination=SunCalc.getMoonIllumination(representative);let moonrise:Date|undefined,moonset:Date|undefined
  const step=10*60000;let previousTime=start.getTime(),previousAltitude=SunCalc.getMoonPosition(start,latitude,longitude).altitude
  for(let time=previousTime+step;time<=end.getTime();time+=step){const altitude=SunCalc.getMoonPosition(new Date(time),latitude,longitude).altitude;if((previousAltitude<=0&&altitude>0)||(previousAltitude>0&&altitude<=0)){const ratio=Math.abs(previousAltitude)/(Math.abs(previousAltitude)+Math.abs(altitude));const crossing=new Date(previousTime+(time-previousTime)*ratio);if(altitude>0)moonrise??=crossing;else moonset??=crossing}previousTime=time;previousAltitude=altitude}
  return{phase:illumination.phase,age:illumination.phase*SYNODIC_MONTH_DAYS,illumination:illumination.fraction*100,name:moonPhaseName(illumination.phase),moonrise,moonset}
}

export interface MonthlyMoonDay extends DailyMoonInfo { dateKey:string;representative:Date }
export function getMonthlyMoonData(startKey:string,timeZone:string,latitude:number,longitude:number,days=31):MonthlyMoonDay[]{
  return Array.from({length:days},(_,index)=>{const dayKey=addDays(startKey,index);return{dateKey:dayKey,representative:zonedDateTime(dayKey,21,timeZone),...getDailyMoonInfo(dayKey,timeZone,latitude,longitude)}})
}
