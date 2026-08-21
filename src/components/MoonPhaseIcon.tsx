function illuminatedPath(phase: number, southern: boolean) {
  const normalized = ((phase % 1) + 1) % 1
  const waxing = normalized <= 0.5
  const angle = normalized * Math.PI * 2
  const terminatorFactor = waxing ? Math.cos(angle) : -Math.cos(angle)
  const points: string[] = []
  const steps = 32
  const flip = southern ? -1 : 1

  for (let index = 0; index <= steps; index++) {
    const y = -46 + (92 * index) / steps
    const radiusAtY = Math.sqrt(Math.max(0, 46 * 46 - y * y))
    const x = terminatorFactor * radiusAtY
    points.push(`${50 + x * flip},${50 + y}`)
  }
  for (let index = steps; index >= 0; index--) {
    const y = -46 + (92 * index) / steps
    const radiusAtY = Math.sqrt(Math.max(0, 46 * 46 - y * y))
    const edge = (waxing ? radiusAtY : -radiusAtY) * flip
    points.push(`${50 + edge},${50 + y}`)
  }
  return `M ${points.join(' L ')} Z`
}

export function MoonPhaseIcon({ phase, latitude, size = 48, className = '' }: { phase: number; latitude: number; size?: number; className?: string }) {
  const southern = latitude < 0
  const phaseLabel = `${Math.round(phase * 100)}%の月相`
  return <svg className={`moon-phase-icon ${className}`} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={phaseLabel}>
    <defs><radialGradient id="moonLight" cx="35%" cy="30%"><stop offset="0" stopColor="#fff8cf"/><stop offset="1" stopColor="#e8c865"/></radialGradient></defs>
    <circle cx="50" cy="50" r="46" fill="#1b2636" stroke="#637083" strokeWidth="2"/>
    <path d={illuminatedPath(phase, southern)} fill="url(#moonLight)"/>
    <circle cx="50" cy="50" r="46" fill="none" stroke="#f7d477" strokeOpacity=".4" strokeWidth="1.5"/>
  </svg>
}
