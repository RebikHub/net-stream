import { useCallback, useEffect, useRef, useState } from 'react'

export interface ResponseEventSource {
  speed: number
  progress: number
  ratio: number
  torrentName: string
  torrentProgress: string
  torrentDownLoadSpeed: string
  torrentRatio: string
  torrentUploadSpeed: string
}

let retries = 0;
const MAX_RETRIES = 5;
const baseUrl: string = import.meta.env.VITE_API_URL

export const useEventSource = (hash?: string | null): { eventSourceData: ResponseEventSource | null, clearEventSource: () => void, startEventSource: (infoHash: string) => void } => {
  const source = useRef<EventSource | null>(null)
  const [eventSourceData, setEventSourceData] = useState<ResponseEventSource | null>(null)

  const clearEventSource = useCallback(() => {
    if (source.current) {
      source.current.close()
      source.current = null
    }

    setEventSourceData(null)
  }, [])

  const startEventSource = useCallback((infoHash: string) => {
    if (source.current) {
      source.current.close()
    }

    source.current = new EventSource(baseUrl + `/video/stream/stats/${infoHash}`)

    source.current.onmessage = (event) => {
      try {
        const data: ResponseEventSource = JSON.parse(event.data)
        setEventSourceData(data)
        retries = 0;
      } catch (error) {
        console.error('Error parsing event data:', error)
      }
    }

    source.current.onerror = (error) => {
        console.error('SSE Error:', error);
        retries++;
        if (retries >= MAX_RETRIES) {
          source.current?.close();
          source.current = null;
          setEventSourceData(null);
          console.warn('SSE closed after max retries');
        }
    }
  }, [])

  useEffect(() => {
    if (!source.current && hash) {
      startEventSource(hash)
    }
  }, [hash, startEventSource])

  useEffect(() => {
    return () => {
      clearEventSource()
    }
  }, [clearEventSource])

  return {
    startEventSource,
    eventSourceData,
    clearEventSource
  }
}
