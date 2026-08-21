export function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(p => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}
export function nightKeyFor(date: Date, timeZone: string) { const p = zonedParts(date, timeZone); const shifted = new Date(Date.UTC(p.year, p.month - 1, p.day - (p.hour < 6 ? 1 : 0))); return shifted.toISOString().slice(0, 10) }
export function addDays(key: string, amount: number) { const d = new Date(`${key}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + amount); return d.toISOString().slice(0, 10) }
export function keyLabel(key: string) { const [, m, d] = key.split('-').map(Number); return `${m}/${d} 夜` }
export function formatZoned(date: Date | undefined, timeZone: string) { if (!date) return '—'; return new Intl.DateTimeFormat('ja-JP', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date) }
export function hourLabel(date: Date, timeZone: string) { const hour=zonedParts(date,timeZone).hour; return `${hour}時` }
export function shortDateLabel(date:Date,timeZone:string){const p=zonedParts(date,timeZone);return `${p.month}/${p.day}`}
export function dateKey(date: Date, timeZone: string) { const p = zonedParts(date, timeZone); return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}` }
export function zonedDateTime(key:string,hour:number,timeZone:string){const[year,month,day]=key.split('-').map(Number);const target=Date.UTC(year,month-1,day,hour);let result=target;for(let iteration=0;iteration<3;iteration++){const parts=zonedParts(new Date(result),timeZone);const represented=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute);result+=target-represented}return new Date(result)}
