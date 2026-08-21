import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

const RELOAD_GUARD = 'lt-weather-pwa-reload'
const CHECK_INTERVAL_MS = 60 * 60 * 1000

export function PwaUpdatePrompt() {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [applyUpdate, setApplyUpdate] = useState<((reloadPage?: boolean) => Promise<void>)>()

  useEffect(() => {
    let disposed = false
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (!disposed) setNeedsRefresh(true)
        if (import.meta.env.DEV) console.info('[PWA] New service worker is waiting')
      },
      onRegisteredSW(swUrl, currentRegistration) {
        if (!disposed) setRegistration(currentRegistration)
        if (import.meta.env.DEV) console.info('[PWA] Service worker registered', swUrl, currentRegistration)
      },
      onRegisterError(error) {
        console.error('[PWA] Service worker registration failed', error)
      }
    })
    setApplyUpdate(() => updateSW)
    return () => { disposed = true }
  }, [])

  useEffect(() => {
    // A reload caused by the previous accepted update has completed.
    sessionStorage.removeItem(RELOAD_GUARD)
    if (!registration) return

    const checkForUpdate = () => {
      if (document.visibilityState !== 'visible') return
      if (import.meta.env.DEV) console.info('[PWA] Checking for a service worker update')
      void registration.update().catch(error => console.error('[PWA] Update check failed', error))
    }
    const interval = window.setInterval(checkForUpdate, CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', checkForUpdate)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', checkForUpdate)
    }
  }, [registration])

  const update = () => {
    if (!applyUpdate || updating) return
    setUpdating(true)
    let reloading = false
    const reloadOnce = () => {
      if (reloading || sessionStorage.getItem(RELOAD_GUARD) === 'pending') return
      reloading = true
      sessionStorage.setItem(RELOAD_GUARD, 'pending')
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true })
    void applyUpdate(false).catch(error => {
      navigator.serviceWorker.removeEventListener('controllerchange', reloadOnce)
      setUpdating(false)
      console.error('[PWA] Service worker update failed', error)
    })
  }

  if (!needsRefresh) return null

  return <aside className="pwa-update" role="status" aria-live="polite">
    <span>新しいバージョンがあります</span>
    <button type="button" disabled={updating} onClick={update}>{updating ? '更新中…' : '更新'}</button>
  </aside>
}
