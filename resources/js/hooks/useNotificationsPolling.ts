import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { createAbort, getJson } from '@/lib/api'
import { useNotificationsStore, type NotificationItem } from '@/stores/notifications'

type Params = {
  userId?: number | string | null
  intervalMs?: number // default: 60000
  immediate?: boolean // default: true
  enabled?: boolean // default: true
}

type Summary = {
  unread: number
  latest: Array<{
    id: string
    data: {
      title?: unknown
      message?: unknown
      action_url?: string | null
      meta?: unknown
      created_at?: string | null
    }
    read_at?: string | null
    created_at?: string | null
  }>
}

export function useNotificationsPolling({ userId, intervalMs = 60_000, immediate = true, enabled = true }: Params) {
  const { syncFromServer } = useNotificationsStore()
  const seenIdsRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !userId) return
    let timer: number | undefined
    let disposed = false
    let inFlight = false
    let controller: AbortController | null = null

    const fetchOnce = async () => {
      if (inFlight) return
      // Abort any stale request before starting a new one
      try { controller?.abort() } catch { void 0 }
      controller = createAbort()
      inFlight = true
      try {
        const url = route('notifications.summary')
        const json = await getJson<Summary>(url, { signal: controller.signal })
        if (disposed) return
        const mapped: NotificationItem[] = (json.latest || []).map((n) => {
          const d = n.data as Record<string, unknown>
          return {
            id: n.id,
            title: (typeof d.title === 'string' && d.title) || 'Notification',
            message: (typeof d.message === 'string' && d.message) || '',
            action_url:
              (typeof d.action_url === 'string' && d.action_url) ||
              (typeof (d as { url?: unknown }).url === 'string' && (d as { url?: string }).url) ||
              undefined,
            meta: (d.meta as Record<string, unknown>) || undefined,
            created_at: (typeof d.created_at === 'string' && d.created_at) || n.created_at || undefined,
            read_at: n.read_at || null,
          }
        })
        // Toast for newly seen notifications after initialization
        const seen = seenIdsRef.current
        const isInit = initializedRef.current
        const newcomers = mapped.filter((it) => typeof it.id === 'string' && it.id && !seen.has(it.id))
        const LIMIT = 3
        const head = newcomers.slice(0, LIMIT)
        const restCount = newcomers.length - head.length

        // Mark all newcomers as seen to avoid duplicate toasts next poll
        newcomers.forEach((it) => { if (typeof it.id === 'string') seen.add(it.id) })

        if (isInit) {
          // Individual toasts up to LIMIT
          head.forEach((it) => {
            try {
              toast(String(it.title || 'Notification'), {
                description: String(it.message || ''),
                action: it.action_url
                  ? {
                      label: 'Open',
                      onClick: () => window.location.assign(String(it.action_url)),
                    }
                  : undefined,
              })
            } catch { void 0 }
          })
          // Summary toast for the rest
          if (restCount > 0) {
            try {
              toast(`${restCount} new notifications`, {
                action: {
                  label: 'Open',
                  onClick: () => {
                    try { window.location.assign(String(route('notifications.index'))) } catch { void 0 }
                  },
                },
              })
            } catch { void 0 }
          }
        }
        syncFromServer(mapped, Number(json.unread || 0))
      } catch { void 0 } finally {
        inFlight = false
        initializedRef.current = true
      }
    }

    const start = () => {
      // @ts-expect-error browser setInterval returns number
      timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
        void fetchOnce()
      }, intervalMs)
    }

    if (immediate) void fetchOnce()
    start()

    const onVis = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') void fetchOnce()
    }
    try { document.addEventListener('visibilitychange', onVis) } catch { void 0 }

    return () => {
      disposed = true
      try { if (timer) clearInterval(timer) } catch { void 0 }
      try { controller?.abort() } catch { void 0 }
      try { document.removeEventListener('visibilitychange', onVis) } catch { void 0 }
    }
  }, [enabled, userId, intervalMs, immediate, syncFromServer])
}
